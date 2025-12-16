import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RagService } from '../../ai/rag.service';
import { CreateCharacterDto } from '../dtos/create-character.dto';
import { CHARACTER_STATS, EXP_TABLE } from '../constants/character-stats';
import { SaveService } from './save.service';

@Injectable()
export class CharacterService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ragService?: RagService,
    private readonly saveService?: SaveService,
  ) {}

  async createCharacter(userId: string, createCharacterDto: CreateCharacterDto) {
    const { name, class: characterClass } = createCharacterDto;

    if (!CHARACTER_STATS[characterClass]) {
      throw new BadRequestException('Invalid character class');
    }

    const stats = CHARACTER_STATS[characterClass];

    const character = await this.db.character.create({
      data: {
        userId,
        name,
        class: characterClass,
        hp: stats.hp,
        maxHp: stats.hp,
        atk: stats.atk,
        def: stats.def,
        level: 1,
        exp: 0,
      },
    });

    return this.formatCharacter(character);
  }

  async getCharacter(characterId: string) {
    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return this.formatCharacter(character);
  }

  async getCharacterStats(characterId: string) {
    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    const battleLogs = await this.db.battleLog.findMany({
      where: { characterId },
    });

    const totalMonstersDefeated = battleLogs.filter(
      (log) => log.result === 'victory',
    ).length;
    const totalGoldEarned = battleLogs.reduce(
      (sum, log) => sum + log.goldGained,
      0,
    );

    const expToNextLevel =
      EXP_TABLE(character.level + 1) - character.exp;

    return {
      character: this.formatCharacter(character),
      expToNextLevel: Math.max(0, expToNextLevel),
      totalMonstersDefeated,
      totalGoldEarned,
      achievements: [],
    };
  }

  async updateCharacterStats(
    characterId: string,
    updates: {
      hp?: number;
      maxHp?: number;
      atk?: number;
      def?: number;
      level?: number;
      exp?: number;
      gold?: number;
      currentFloor?: number;
    },
  ) {
    const character = await this.db.character.update({
      where: { id: characterId },
      data: updates,
    });

    return this.formatCharacter(character);
  }

  async gainExp(characterId: string, expAmount: number) {
    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    let newLevel = character.level;
    let newExp = character.exp + expAmount;
    let leveledUp = false;

    while (newExp >= EXP_TABLE(newLevel + 1)) {
      newExp -= EXP_TABLE(newLevel + 1);
      newLevel++;
      leveledUp = true;
    }

    const stats = CHARACTER_STATS[character.class];
    let newHp = character.hp;
    let newMaxHp = character.maxHp;
    let newAtk = character.atk;
    let newDef = character.def;

    if (leveledUp) {
      const levelIncrease = newLevel - character.level;
      newMaxHp = character.maxHp + stats.levelUpIncrease.hp * levelIncrease;
      newHp = newMaxHp; // Full HP restore on level up
      newAtk = character.atk + stats.levelUpIncrease.atk * levelIncrease;
      newDef = character.def + stats.levelUpIncrease.def * levelIncrease;
    }

    const updated = await this.db.character.update({
      where: { id: characterId },
      data: {
        exp: newExp,
        level: newLevel,
        hp: newHp,
        maxHp: newMaxHp,
        atk: newAtk,
        def: newDef,
      },
    });

    // Embed level-up event in RAG
    if (leveledUp && this.ragService) {
      const levelUpSummary = `레벨 ${character.level}에서 레벨 ${newLevel}로 올랐습니다. HP +${newMaxHp - character.maxHp}, ATK +${Math.round(newAtk - character.atk)}, DEF +${Math.round(newDef - character.def)}`;
      this.ragService.embedGameEvent(
        characterId,
        'level_up',
        levelUpSummary,
        {
          oldLevel: character.level,
          newLevel,
          hpIncrease: newMaxHp - character.maxHp,
          atkIncrease: Math.round(newAtk - character.atk),
          defIncrease: Math.round(newDef - character.def),
        },
      ).catch(() => {
        // Silently fail
      });
    }

    // Auto-save on level up
    if (leveledUp && this.saveService) {
      this.saveService.autoSave(characterId, `레벨 업 (Lv.${newLevel})`).catch(() => {
        // Silently fail
      });
    }

    return {
      character: this.formatCharacter(updated),
      leveledUp,
      levelIncrease: newLevel - character.level,
      hpIncrease: newMaxHp - character.maxHp,
      atkIncrease: newAtk - character.atk,
      defIncrease: newDef - character.def,
    };
  }

  private formatCharacter(character: any) {
    return {
      id: character.id,
      name: character.name,
      class: character.class,
      level: character.level,
      exp: character.exp,
      hp: character.hp,
      maxHp: character.maxHp,
      atk: Math.round(character.atk),
      def: Math.round(character.def),
      currentFloor: character.currentFloor,
      gold: character.gold,
    };
  }
}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AiService } from '../../ai/ai.service';
import { RagService } from '../../ai/rag.service';
import { CharacterService } from './character.service';
import { SaveService } from './save.service';
import {
  calculatePlayerAttack,
  calculateMonsterAttack,
  calculateDefenseReduction,
  calculateEscapeChance,
} from '../utils/combat.util';
import {
  getMonsterForFloor,
  calculateMonsterStats,
} from '../constants/monsters';
import { EXP_TABLE } from '../constants/character-stats';
import {
  formatBattleUI,
  STATUS_ASCII,
  BATTLE_ASCII,
} from '../constants/ascii-art';

interface BattleState {
  battleId: string;
  character: any;
  monster: any;
  turn: number;
  isOver: boolean;
  result?: string;
}

const battles = new Map<string, BattleState>();

@Injectable()
export class BattleService {
  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
    private readonly ragService: RagService,
    private readonly characterService: CharacterService,
    private readonly saveService: SaveService,
  ) {}

  async startBattle(characterId: string) {
    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    const monsterTemplate = getMonsterForFloor(
      character.currentFloor,
      character.level,
    );
    const monster = calculateMonsterStats(monsterTemplate);

    const battleId = `${characterId}-${Date.now()}`;

    battles.set(battleId, {
      battleId,
      character: {
        id: character.id,
        hp: character.hp,
        maxHp: character.maxHp,
        atk: character.atk,
        def: character.def,
        class: character.class,
      },
      monster,
      turn: 1,
      isOver: false,
    });

    const narration = await this.aiService.generateMonsterDescription(
      monster.name,
      monster.level,
    );

    return {
      battleId,
      monster,
      aiNarration: narration,
    };
  }

  async attack(battleId: string) {
    const battle = battles.get(battleId);

    if (!battle || battle.isOver) {
      throw new BadRequestException('Invalid battle');
    }

    // Player attack
    const playerAttackResult = calculatePlayerAttack(
      battle.character.atk,
      battle.monster.def,
      battle.character.class,
    );

    battle.monster.hp -= playerAttackResult.damage;

    let aiNarration = '';
    let monsterAttackResult = { damage: 0, isCritical: false, isDodged: false };

    // Check if battle is over
    if (battle.monster.hp <= 0) {
      battle.isOver = true;
      battle.result = 'victory';

      aiNarration = `${battle.monster.name}을 처치했습니다!\n승리를 축하합니다!`;
    } else {
      // Monster counter-attack
      monsterAttackResult = calculateMonsterAttack(
        battle.monster.atk,
        battle.character.def,
      );

      battle.character.hp -= monsterAttackResult.damage;

      // Check if character is dead
      if (battle.character.hp <= 0) {
        battle.isOver = true;
        battle.result = 'defeat';
        battle.character.hp = 0;

        aiNarration = `${battle.monster.name}의 공격에 쓰러졌습니다...\n게임 오버!`;
      } else {
        // Generate narration
        aiNarration = await this.aiService.generateBattleNarration(
          battle.monster.name,
          'attack',
          playerAttackResult.damage,
          playerAttackResult.isCritical,
          monsterAttackResult.damage,
          battle.character.hp,
          battle.character.maxHp,
          battle.monster.hp,
          battle.monster.maxHp,
        );
      }
    }

    battle.turn++;

    // Format battle UI with HP bars
    const battleUI = formatBattleUI(
      'YOU',
      battle.character.hp,
      battle.character.maxHp,
      battle.monster.name,
      battle.monster.hp,
      battle.monster.maxHp,
    );

    const statusIndicator = battle.result === 'victory'
      ? BATTLE_ASCII.victory
      : battle.isOver && battle.result === 'defeat'
      ? BATTLE_ASCII.defeat
      : '';

    const formattedNarration = `${battleUI}\n${aiNarration}${statusIndicator ? '\n' + statusIndicator : ''}`;

    return {
      playerTurn: {
        damage: playerAttackResult.damage,
        critical: playerAttackResult.isCritical,
        hit: !playerAttackResult.isDodged,
      },
      monsterTurn: {
        damage: monsterAttackResult.damage,
        critical: monsterAttackResult.isCritical,
        hit: !monsterAttackResult.isDodged,
      },
      battleState: {
        playerHp: battle.character.hp,
        monsterHp: battle.monster.hp,
        turn: battle.turn,
        isOver: battle.isOver,
        result: battle.result,
      },
      aiNarration: formattedNarration,
    };
  }

  async defend(battleId: string) {
    const battle = battles.get(battleId);

    if (!battle || battle.isOver) {
      throw new BadRequestException('Invalid battle');
    }

    // Monster attacks with defense reduction
    const monsterAttackResult = calculateMonsterAttack(
      battle.monster.atk,
      battle.character.def,
    );

    const reducedDamage = calculateDefenseReduction(
      monsterAttackResult.damage,
      0.5,
    );

    battle.character.hp -= reducedDamage;

    let aiNarration = await this.aiService.generateBattleNarration(
      battle.monster.name,
      'defend',
      0,
      false,
      reducedDamage,
      battle.character.hp,
      battle.character.maxHp,
      battle.monster.hp,
      battle.monster.maxHp,
    );

    let statusIndicator = '';
    if (battle.character.hp <= 0) {
      battle.isOver = true;
      battle.result = 'defeat';
      battle.character.hp = 0;
      aiNarration = `${battle.monster.name}의 공격에 쓰러졌습니다...\n게임 오버!`;
      statusIndicator = BATTLE_ASCII.defeat;
    }

    battle.turn++;

    // Format battle UI with HP bars
    const battleUI = formatBattleUI(
      'YOU',
      battle.character.hp,
      battle.character.maxHp,
      battle.monster.name,
      battle.monster.hp,
      battle.monster.maxHp,
    );

    const formattedNarration = `${battleUI}\n${aiNarration}${statusIndicator ? '\n' + statusIndicator : ''}`;

    return {
      playerTurn: {
        defending: true,
        damageReduction: 50,
      },
      monsterTurn: {
        damage: reducedDamage,
        originalDamage: monsterAttackResult.damage,
        hit: !monsterAttackResult.isDodged,
      },
      battleState: {
        playerHp: battle.character.hp,
        monsterHp: battle.monster.hp,
        turn: battle.turn,
        isOver: battle.isOver,
      },
      aiNarration: formattedNarration,
    };
  }

  async escape(battleId: string) {
    const battle = battles.get(battleId);

    if (!battle || battle.isOver) {
      throw new BadRequestException('Invalid battle');
    }

    // Boss monsters cannot be escaped from
    if ((battle.monster as any).isBoss) {
      const monsterAttackResult = calculateMonsterAttack(
        battle.monster.atk,
        battle.character.def,
      );

      battle.character.hp -= monsterAttackResult.damage;

      let statusIndicator = '';
      if (battle.character.hp <= 0) {
        battle.isOver = true;
        battle.result = 'defeat';
        battle.character.hp = 0;
        statusIndicator = BATTLE_ASCII.defeat;
      }

      const damage = monsterAttackResult.damage;
      const battleUI = formatBattleUI(
        'YOU',
        battle.character.hp,
        battle.character.maxHp,
        battle.monster.name,
        battle.monster.hp,
        battle.monster.maxHp,
      );

      const narration = `${battle.monster.name}에게서 도망칠 수 없습니다!\n${battle.monster.name}의 공격을 맞았습니다! (데미지: ${damage})`;
      const formattedNarration = `${battleUI}\n${narration}${statusIndicator ? '\n' + statusIndicator : ''}`;

      return {
        escaped: false,
        damage,
        battleState: {
          playerHp: battle.character.hp,
          monsterHp: battle.monster.hp,
          turn: battle.turn,
          isOver: battle.isOver,
          result: battle.result,
        },
        aiNarration: formattedNarration,
      };
    }

    const canEscape = calculateEscapeChance(
      battle.character.class,
      false,
    );

    if (!canEscape) {
      // Failed escape - take damage
      const monsterAttackResult = calculateMonsterAttack(
        battle.monster.atk,
        battle.character.def,
      );

      battle.character.hp -= monsterAttackResult.damage;

      let statusIndicator = '';
      if (battle.character.hp <= 0) {
        battle.isOver = true;
        battle.result = 'defeat';
        battle.character.hp = 0;
        statusIndicator = BATTLE_ASCII.defeat;
      }

      const damage = monsterAttackResult.damage;

      const battleUI = formatBattleUI(
        'YOU',
        battle.character.hp,
        battle.character.maxHp,
        battle.monster.name,
        battle.monster.hp,
        battle.monster.maxHp,
      );

      const narration = `도망 시도에 실패했습니다!\n${battle.monster.name}의 공격을 맞았습니다. (데미지: ${damage})`;
      const formattedNarration = `${battleUI}\n${narration}${statusIndicator ? '\n' + statusIndicator : ''}`;

      return {
        escaped: false,
        damage,
        battleState: {
          playerHp: battle.character.hp,
          monsterHp: battle.monster.hp,
          turn: battle.turn,
          isOver: battle.isOver,
          result: battle.result,
        },
        aiNarration: formattedNarration,
      };
    }

    // Successful escape
    battle.isOver = true;
    battle.result = 'escape';

    // Take some damage while escaping
    const escapeDamage = Math.floor(battle.monster.atk / 5);
    battle.character.hp -= escapeDamage;

    if (battle.character.hp < 0) {
      battle.character.hp = 0;
    }

    battles.delete(battleId);

    const narration = `황급히 도망쳤습니다!\n${escapeDamage > 0 ? `${battle.monster.name}의 공격을 약간 맞았습니다.` : '무사히 탈출했습니다!'}`;
    const formattedNarration = `${narration}\n${BATTLE_ASCII.escape}`;

    return {
      escaped: true,
      damage: escapeDamage,
      battleState: {
        playerHp: battle.character.hp,
        isOver: true,
        result: 'escape',
      },
      aiNarration: formattedNarration,
    };
  }

  async finishBattle(battleId: string) {
    const battle = battles.get(battleId);

    if (!battle || !battle.isOver) {
      throw new BadRequestException('Battle is not over');
    }

    const character = await this.db.character.findUnique({
      where: { id: battle.character.id },
    });

    // Calculate rewards
    let expGained = 0;
    let goldGained = 0;
    let itemsGained: string[] = [];

    if (battle.result === 'victory') {
      expGained = battle.monster.level * 10;
      goldGained = battle.monster.level * 5;

      // 30% chance for item drop
      if (Math.random() < 0.3) {
        itemsGained = ['체력 포션'];
      }

      // Update character
      const result = await this.characterService.gainExp(
        battle.character.id,
        expGained,
      );

      await this.characterService.updateCharacterStats(
        battle.character.id,
        {
          hp: result.character.hp,
          gold: character.gold + goldGained,
        },
      );
    } else {
      // Defeat
      await this.characterService.updateCharacterStats(
        battle.character.id,
        {
          hp: battle.character.hp,
        },
      );
    }

    // Save battle log
    await this.db.battleLog.create({
      data: {
        characterId: battle.character.id,
        monsterName: battle.monster.name,
        monsterLevel: battle.monster.level,
        result: battle.result,
        damageDealt: 0, // Simplified
        damageTaken: 0, // Simplified
        expGained,
        goldGained,
        itemsGained,
        battleDuration: battle.turn,
      },
    });

    battles.delete(battleId);

    // Embed battle event in RAG
    const battleSummary = `${battle.monster.name} Lv.${battle.monster.level}을(를) ${battle.result === 'victory' ? '처치' : '패배'}했습니다. ${battle.result === 'victory' ? `${expGained} EXP와 ${goldGained} 골드를 얻었습니다.` : ''}`;
    await this.ragService.embedGameEvent(
      battle.character.id,
      `battle_${battle.result}`,
      battleSummary,
      {
        monsterName: battle.monster.name,
        monsterLevel: battle.monster.level,
        floor: character.currentFloor,
        expGained,
        goldGained,
      },
    );

    // Auto-save after battle (victory or defeat)
    if (battle.result === 'victory') {
      // Trigger auto-save in background (don't await to not delay response)
      this.saveService.autoSave(battle.character.id, '전투 승리').catch(() => {
        // Silently fail
      });
    } else if (battle.result === 'defeat') {
      this.saveService.autoSave(battle.character.id, '패배').catch(() => {
        // Silently fail
      });
    }

    return {
      result: battle.result,
      expGained,
      goldGained,
      itemsGained,
    };
  }
}

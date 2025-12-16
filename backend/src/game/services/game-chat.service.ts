import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AiService } from '../../ai/ai.service';
import { BattleService } from './battle.service';
import { CharacterService } from './character.service';
import {
  formatMonsterDisplay,
  formatBattleUI,
  formatDungeonFloor,
  formatActionMenu,
  UI_ASCII,
} from '../constants/ascii-art';

interface GameContext {
  currentFloor: number;
  characterLevel: number;
  isInBattle: boolean;
  lastAction?: string;
}

@Injectable()
export class GameChatService {
  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
    private readonly battleService: BattleService,
    private readonly characterService: CharacterService,
  ) {}

  async processMessage(
    characterId: string,
    message: string,
    context?: Partial<GameContext>,
  ) {
    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    // Save user message
    await this.db.conversation.create({
      data: {
        characterId,
        role: 'user',
        content: message,
      },
    });

    // Determine action based on message
    const action = this.parseAction(message.toLowerCase());

    let response = '';
    let gameState: any = null;

    switch (action) {
      case 'explore':
        response = await this.handleExplore(character);
        gameState = { type: 'exploration' };
        break;

      case 'battle':
        const battleStart = await this.battleService.startBattle(characterId);
        const monsterDisplay = formatMonsterDisplay(
          battleStart.monster.name,
          battleStart.monster.level,
          battleStart.monster.ascii || '',
        );
        const actionMenu = formatActionMenu();
        response = `${monsterDisplay}\n${battleStart.aiNarration}\n${actionMenu}`;
        gameState = {
          type: 'battle',
          battleId: battleStart.battleId,
          monster: battleStart.monster,
        };
        break;

      case 'status':
        response = this.formatCharacterStatus(character);
        gameState = { type: 'status' };
        break;

      case 'help':
        response = this.getHelpMessage();
        gameState = { type: 'help' };
        break;

      default:
        response = await this.aiService.generateDungeonDescription(
          character.currentFloor,
          '던전',
        );
        gameState = { type: 'exploration' };
    }

    // Save AI response
    await this.db.conversation.create({
      data: {
        characterId,
        role: 'assistant',
        content: response,
      },
    });

    return {
      response,
      gameState,
      characterState: {
        level: character.level,
        hp: character.hp,
        maxHp: character.maxHp,
        currentFloor: character.currentFloor,
      },
    };
  }

  private parseAction(message: string): string {
    if (message.includes('싸우') || message.includes('전투') || message.includes('몬스터')) {
      return 'battle';
    }
    if (
      message.includes('상태') ||
      message.includes('스탯') ||
      message.includes('정보')
    ) {
      return 'status';
    }
    if (message.includes('도움') || message.includes('명령')) {
      return 'help';
    }
    return 'explore';
  }

  private async handleExplore(character: any): Promise<string> {
    const environments = [
      '어두운 복도',
      '석조 방',
      '보물 창고',
      '마법 사원',
      '비밀 통로',
    ];

    const randomEnv = environments[Math.floor(Math.random() * environments.length)];

    const dungeonFloor = formatDungeonFloor(character.currentFloor);
    const description = await this.aiService.generateDungeonDescription(
      character.currentFloor,
      randomEnv,
    );

    return `${dungeonFloor}\n${UI_ASCII.divider}\n${description}`;
  }

  private formatCharacterStatus(character: any): string {
    return `
╔════════════════════════════════╗
║     캐릭터 상태 정보             ║
╠════════════════════════════════╣
║ 이름: ${character.name.padEnd(20)}║
║ 직업: ${this.getClassName(character.class).padEnd(20)}║
║ 레벨: ${String(character.level).padEnd(20)}║
║ 경험치: ${String(character.exp).padEnd(17)}║
╠════════════════════════════════╣
║ HP: ${String(character.hp + '/' + character.maxHp).padEnd(22)}║
║ ATK: ${String(Math.round(character.atk)).padEnd(21)}║
║ DEF: ${String(Math.round(character.def)).padEnd(21)}║
║ 골드: ${String(character.gold).padEnd(21)}║
║ 현재층: ${String(character.currentFloor).padEnd(19)}║
╚════════════════════════════════╝
    `;
  }

  private getClassName(classType: string): string {
    switch (classType) {
      case 'warrior':
        return '용사';
      case 'mage':
        return '마법사';
      case 'thief':
        return '도둑';
      default:
        return classType;
    }
  }

  private getHelpMessage(): string {
    return `
╔════════════════════════════════╗
║        도움말                   ║
╠════════════════════════════════╣
║ 명령어:                        ║
║ - 앞으로 / 탐험: 던전 탐험     ║
║ - 싸우기 / 전투: 몬스터 전투   ║
║ - 상태 / 정보: 캐릭터 정보     ║
║ - 마이페이지: 상세 정보 보기   ║
║ - 도움: 이 메시지 표시         ║
╚════════════════════════════════╝
    `;
  }

  async getConversationHistory(
    characterId: string,
    limit: number = 20,
  ) {
    const conversations = await this.db.conversation.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return conversations.reverse();
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { AiService } from './ai.service';
import { RagService } from './rag.service';
import { StorageService } from './storage.service';
import { GameStateAnalyzerService } from './game-state-analyzer.service';
import { GameDocumentationRagService } from './game-documentation-rag.service';
import { InventoryService } from './inventory.service';
import { ChoiceParserService, GameChoice } from './choice-parser.service';

@Injectable()
export class GameChatService implements OnModuleInit {
  private gameState = new Map<string, any>();

  constructor(
    private aiService: AiService,
    private ragService: RagService,
    private storageService: StorageService,
    private analyzer: GameStateAnalyzerService,
    private gameDocRagService: GameDocumentationRagService,
    private inventoryService: InventoryService,
    private choiceParser: ChoiceParserService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.gameDocRagService.initialize();
      console.log('✓ Game Documentation RAG initialized');
    } catch (error) {
      console.warn('⚠️  Game Documentation RAG initialization failed:', error);
    }
  }

  async processMessage(
    characterId: string,
    message: string,
  ): Promise<{
    response: string;
    characterId: string;
    gameState: any;
    stateUpdate?: any;
    choices?: GameChoice;
  }> {
    let state = this.gameState.get(characterId);
    if (!state) {
      const saved = await this.storageService.loadGameState(characterId);
      state = saved || this.createDefaultGameState(characterId);
      this.gameState.set(characterId, state);
    }

    // 이전 대화 컨텍스트를 더 많이 가져와서 반복 응답 방지
    const previousContext = this.ragService.getContext(characterId, 15);

    // Get relevant game documentation context
    let gameDocContext = '';
    try {
      // Search for relevant sections based on player message and game state
      // characterId를 전달하여 반복되는 섹션 방지
      gameDocContext = await this.gameDocRagService.getContextForPlayerAction(message, characterId);

      // Add floor-specific context
      const floorContext = await this.gameDocRagService.getFloorContext(state.floor, characterId);
      if (floorContext) {
        gameDocContext = floorContext + '\n\n---\n\n' + gameDocContext;
      }
    } catch (error) {
      console.warn('Failed to get game documentation context:', error);
    }

    // 게임 진행 상황 분석 - 반복 감지
    const recentActions = this.ragService.getContext(characterId, 6).split('---').slice(-3).join('---');
    const isRepeatedAction = recentActions.includes(message);

    // 최근 응답 내용 추출 - 반복되지 않도록 피해야 할 내용
    const lastResponses = this.ragService.getContext(characterId, 2);
    const recentResponsesWarning = lastResponses ? `\n[최근 응답 피하기]\n이전 응답: "${lastResponses.substring(0, 100)}..."\n위 응답과 같거나 매우 유사한 내용으로 응답하면 안 됩니다. 다른 관점과 상황으로 응답하세요.` : '';

    // 플레이어 행동에 따른 체력 변화 예상 판단
    const isAttackAction = /공격|싸우|맞|칠|마법|마력|기술|검|활/.test(message.toLowerCase());
    const isDefenseAction = /방어|피하|도망|숨|물러|후퇴|회피/.test(message.toLowerCase());
    const isHealingAction = /회복|힐|치료|먹|약|포션/.test(message.toLowerCase());
    const isExploreAction = /살펴|보|찾|탐색|조사|주변/.test(message.toLowerCase());

    let healthExpectation = '';
    if (isAttackAction) {
      healthExpectation = '전투 상황이므로 데미지가 발생할 수 있다. 플레이어가 공격을 하면 반격을 받을 수 있다.';
    } else if (isDefenseAction) {
      healthExpectation = '방어 또는 회피 행동이므로 체력 변화가 없거나 적을 수 있다.';
    } else if (isHealingAction) {
      healthExpectation = '회복 행동이므로 체력이 증가해야 한다.';
    } else if (isExploreAction) {
      healthExpectation = '탐색 행동이므로 보통 체력 변화가 없거나 사건이 발생할 수 있다.';
    }

    const prompt =
      '당신은 한국 던전 게임의 게임마스터입니다. 순수한 한국어로만 응답하세요.\n\n' +
      '게임 상태:\n' +
      `레벨: ${state.level}\n` +
      `층: ${state.floor}\n` +
      `현재 체력: ${state.health}/${state.maxHealth}\n\n` +
      '이전 이야기:\n' +
      (previousContext || '게임을 시작한다.') +
      '\n\n' +
      '플레이어 행동:\n' +
      message +
      '\n\n' +
      '상황 분석:\n' +
      healthExpectation +
      '\n\n' +
      '응답 형식 (필수 준수):\n' +
      '1. ">"로 시작하여 상황을 1-2문장으로 설명\n' +
      '2. 반드시 체력 변화를 명시 (다음 중 하나 정확히 포함):\n' +
      '   - 데미지: "체력이 숫자 감소한다" (예: "체력이 15 감소한다")\n' +
      '   - 회복: "체력이 숫자 회복된다"\n' +
      '   - 변화 없음: "체력이 변하지 않는다"\n' +
      '3. 반드시 두 가지 선택지 추가:\n' +
      '[선택지]\n' +
      '선택1: 행동\n' +
      '선택2: 행동\n\n' +
      '규칙:\n' +
      '- 순수 한국어만 사용 (영어, 중국어, 숫자 금지)\n' +
      '- 반드시 체력 변화 포함\n' +
      '- 반드시 두 가지 선택지 포함\n' +
      '- 짧고 창의적인 이야기\n\n' +
      '응답 예시:\n' +
      '> 거대한 오크가 나타나 도끼를 휘두른다! 체력이 12 감소한다.\n' +
      '[선택지]\n' +
      '선택1: 칼로 맞받아 친다\n' +
      '선택2: 마법으로 반격한다';

    const response = await this.aiService.generateResponse(prompt);

    // AI 응답 내용을 분석하여 게임 상태 업데이트
    const stateUpdate = this.analyzer.analyzeResponse(response, state);

    // 1. 기본 상태 업데이트
    if (stateUpdate.health !== undefined) {
      state.health = stateUpdate.health;
    }
    if (stateUpdate.maxHealth !== undefined) {
      state.maxHealth = stateUpdate.maxHealth;
    }
    if (stateUpdate.experience !== undefined) {
      state.experience = stateUpdate.experience;
    }
    if (stateUpdate.level !== undefined) {
      state.level = stateUpdate.level;
    }
    if (stateUpdate.floor !== undefined) {
      state.floor = stateUpdate.floor;
    }

    // 2. 인벤토리 업데이트
    if (!state.inventory) {
      state.inventory = this.inventoryService.createEmptyInventory();
    }

    if (stateUpdate.itemsObtained && stateUpdate.itemsObtained.length > 0) {
      const { inventory, results } = this.inventoryService.addItemsFromResponse(
        state.inventory,
        stateUpdate.itemsObtained,
      );
      state.inventory = inventory;

      // 아이템 획득 로그
      for (const result of results) {
        if (result.success) {
          console.log(`🎁 ${result.message}`);
        }
      }
    }

    // 3. 상태 이상 업데이트
    if (stateUpdate.statusEffects && stateUpdate.statusEffects.length > 0) {
      if (!state.statusEffects) {
        state.statusEffects = [];
      }
      state.statusEffects.push(...stateUpdate.statusEffects);
      console.log(`💀 상태 이상 적용: ${stateUpdate.statusEffects.map(s => s.type).join(', ')}`);
    }

    // 4. 통계 업데이트
    if (!state.stats) {
      state.stats = {
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        monstersDefeated: 0,
        itemsCollected: 0,
      };
    }

    if (stateUpdate.damageDetails && stateUpdate.damageDetails.length > 0) {
      const totalDamage = stateUpdate.damageDetails.reduce((sum, d) => sum + d.amount, 0);
      state.stats.totalDamageTaken += totalDamage;
    }

    if (stateUpdate.itemsObtained && stateUpdate.itemsObtained.length > 0) {
      state.stats.itemsCollected += stateUpdate.itemsObtained.length;
    }

    // 레벨업 로그 출력 (프론트엔드에도 전달)
    let levelUpMessage = '';
    if (stateUpdate.leveledUp) {
      levelUpMessage = `\n🎉 [레벨업!] 레벨 ${state.level - 1} → 레벨 ${state.level}`;
      console.log(
        `✨ 캐릭터 ${characterId} 레벨업: ${state.level - 1} → ${state.level}`,
      );
    }

    // 상태 변화 로그
    if (stateUpdate.healthChanged) {
      console.log(
        `❤️  캐릭터 ${characterId} 체력 변화: ${state.health}/${state.maxHealth}`,
      );
    }

    if (stateUpdate.criticalHit) {
      console.log(`⚔️  크리티컬 히트!`);
    }

    // 선택지 파싱
    const { cleanedResponse, choices } = this.choiceParser.parseResponseWithChoices(
      response,
      state,
    );

    // 컨텍스트 저장 (선택지 제거된 응답 저장)
    await this.ragService.storeContext(
      characterId,
      'Player: ' + message + '\nGM: ' + cleanedResponse,
    );

    // 상태 저장
    state.lastUpdated = new Date().toISOString();
    await this.storageService.saveGameState(characterId, state);

    return {
      response: cleanedResponse + levelUpMessage,
      characterId,
      gameState: state,
      stateUpdate,
      choices,
    };
  }

  private createDefaultGameState(characterId: string): any {
    return {
      characterId,
      floor: 1,
      health: 100,
      maxHealth: 100,
      experience: 0,
      level: 1,
      lastUpdated: new Date().toISOString(),
      inventory: this.inventoryService.createEmptyInventory(),
      statusEffects: [],
      stats: {
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        monstersDefeated: 0,
        itemsCollected: 0,
      },
    };
  }

  getGameState(characterId: string): any {
    return this.gameState.get(characterId) || null;
  }

  async clearCharacterData(characterId: string): Promise<void> {
    this.gameState.delete(characterId);
    this.ragService.clearContext(characterId);
    await this.storageService.deleteGameState(characterId);
  }
}

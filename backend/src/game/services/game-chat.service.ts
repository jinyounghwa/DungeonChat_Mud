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

    const prompt =
      '[한국어 전용 지시문]\n' +
      '오직 한국어(가-힣)로만 응답하세요. 중국어나 다른 언어는 절대 포함하지 마세요.\n\n' +
      '당신은 던전의 게임마스터입니다.\n' +
      (gameDocContext ? '[게임 가이드]\n' + gameDocContext + '\n\n' : '') +
      '[이전 상황]\n' +
      (previousContext || '게임이 시작됩니다.') +
      '\n' +
      '[현재 상태]\n' +
      '- 레벨: ' +
      state.level +
      '\n' +
      '- 현재 층: ' +
      state.floor +
      '\n' +
      '- 체력: ' +
      state.health +
      '/' +
      state.maxHealth +
      '\n' +
      '[플레이어 행동]\n' +
      message +
      '\n' +
      '[응답 규칙]\n' +
      '1. 정확히 한국어 1-3문장으로만 응답\n' +
      '2. ">" 로 시작하기\n' +
      '3. 중국어 절대 금지\n' +
      '4. ★매 응답에 필수★ 체력 변화를 명시하세요:\n' +
      '   - 데미지를 받으면: "체력이 XX 감소한다" 또는 "XX의 피해를 입는다"\n' +
      '   - 회복되면: "체력이 XX 회복된다"\n' +
      '   - 변화 없으면: "체력이 변하지 않는다" 또는 "체력: ' +
      state.health +
      '"\n' +
      '5. 경험치나 층 변화가 있으면 명시 (경험치 XX 획득, 다음 층으로 이동 등)\n' +
      '6. 게임 가이드를 참고하여 일관된 스토리 진행\n' +
      (isRepeatedAction ? '7. 플레이어가 같은 행동을 반복 중입니다. 이전과 완전히 다른 상황 전개를 만들어 새로운 이야기를 진행하세요. 이전 응답과 절대 같은 내용이면 안됩니다.\n' : '7. 각 상황마다 새롭고 창의적인 이야기 전개를 만드세요. 단조로운 반복 응답을 피하세요.\n') +
      '8. ★★★ 반드시 응답 마지막에 다음 형식으로 선택지를 포함해야 합니다 ★★★\n' +
      '[선택지]\n' +
      '선택1: (첫번째 선택 명령어 - 구체적이고 게임 상황에 맞는 행동)\n' +
      '선택2: (두번째 선택 명령어 - 첫번째와 다른 행동)\n' +
      '예시:\n' +
      '[선택지]\n' +
      '선택1: 몬스터를 공격한다\n' +
      '선택2: 뒤로 물러나며 도망친다\n' +
      '★★★ [선택지] 태그가 반드시 포함되어야 합니다 ★★★' +
      recentResponsesWarning;

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

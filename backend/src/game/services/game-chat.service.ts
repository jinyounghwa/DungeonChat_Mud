import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';
import { RagService } from './rag.service';
import { StorageService } from './storage.service';
import { GameStateAnalyzerService } from './game-state-analyzer.service';

@Injectable()
export class GameChatService {
  private gameState = new Map<string, any>();

  constructor(
    private aiService: AiService,
    private ragService: RagService,
    private storageService: StorageService,
    private analyzer: GameStateAnalyzerService,
  ) {}

  async processMessage(
    characterId: string,
    message: string,
  ): Promise<{
    response: string;
    characterId: string;
    gameState: any;
    stateUpdate?: any;
  }> {
    let state = this.gameState.get(characterId);
    if (!state) {
      const saved = await this.storageService.loadGameState(characterId);
      state = saved || this.createDefaultGameState(characterId);
      this.gameState.set(characterId, state);
    }

    const previousContext = this.ragService.getContext(characterId, 5);
    const prompt =
      '[한국어 전용 지시문]\n' +
      '오직 한국어(가-힣)로만 응답하세요. 중국어나 다른 언어는 절대 포함하지 마세요.\n\n' +
      '당신은 던전의 게임마스터입니다.\n' +
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
      '[응답]\n' +
      '정확히 한국어 1-3문장으로만 응답. ">" 로 시작하기. 중국어 절대 금지.';

    const response = await this.aiService.generateResponse(prompt);

    // AI 응답 내용을 분석하여 게임 상태 업데이트
    const stateUpdate = this.analyzer.analyzeResponse(response, state);

    // 변경된 상태 적용
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
        `❤️  캐릭터 ${characterId} 체력 변화: ${stateUpdate.health}/${state.maxHealth}`,
      );
    }

    await this.ragService.storeContext(
      characterId,
      'Player: ' + message + '\nGM: ' + response,
    );

    state.lastUpdated = new Date().toISOString();
    await this.storageService.saveGameState(characterId, state);

    return {
      response: response + levelUpMessage,
      characterId,
      gameState: state,
      stateUpdate,
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

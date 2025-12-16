import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface GenerationConfig {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repetition_penalty?: number;
  stop?: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('QWEN_API_URL') || 'http://localhost:8001';
    this.modelName = this.configService.get('QWEN_MODEL_NAME') || 'Qwen/Qwen2.5-7B-Instruct';
  }

  async generateText(
    messages: Array<{ role: string; content: string }>,
    generationConfig?: GenerationConfig,
  ): Promise<string> {
    try {
      const config: GenerationConfig = {
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50,
        repetition_penalty: 1.1,
        ...generationConfig,
      };

      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: this.modelName,
          messages,
          ...config,
        },
        {
          timeout: 30000,
        },
      );

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('No response from AI model');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error('AI generation failed:', error);
      throw error;
    }
  }

  async generateDungeonDescription(floor: number, environment: string): Promise<string> {
    const systemPrompt = `당신은 판타지 텍스트 MUD 게임의 던전 마스터입니다.
역할:
- 플레이어의 던전 탐험을 생생하게 묘사합니다
- 항상 2-3줄 이내로 간결하게 답변하세요
- 몰입감을 주는 구체적인 표현을 사용하세요
- 한국어로 답변하세요`;

    const userPrompt = `
상황: 던전 ${floor}층 탐험
현재 위치: ${environment}

위 상황을 2-3줄로 생생하게 묘사해주세요.`;

    return this.generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { max_tokens: 150 },
    );
  }

  async generateBattleNarration(
    monsterName: string,
    playerAction: string,
    playerDamage: number,
    isCritical: boolean,
    monsterDamage: number,
    playerHp: number,
    playerMaxHp: number,
    monsterHp: number,
    monsterMaxHp: number,
  ): Promise<string> {
    const systemPrompt = `당신은 판타지 텍스트 MUD 게임의 전투 해설자입니다.
전투 장면을 2줄로 생생하게 묘사하세요.
- 첫 줄: 플레이어의 행동 묘사
- 둘째 줄: 몬스터의 반응
간결하고 생동감 있게 표현하세요. 한국어로 답변하세요.`;

    const actionDescription = isCritical
      ? `크리티컬 공격! (데미지: ${playerDamage})`
      : playerAction === 'defend'
        ? `방어 (데미지 감소: 50%)`
        : `${playerAction} (데미지: ${playerDamage})`;

    const userPrompt = `
전투 상황:
- 플레이어 행동: ${actionDescription}
- 몬스터: ${monsterName}
- 몬스터 반격 데미지: ${monsterDamage}
- 플레이어 HP: ${playerHp}/${playerMaxHp}
- 몬스터 HP: ${monsterHp}/${monsterMaxHp}

위 전투를 생생하게 묘사해주세요.`;

    return this.generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { max_tokens: 150 },
    );
  }

  async generateMonsterDescription(
    monsterName: string,
    level: number,
  ): Promise<string> {
    const systemPrompt = `당신은 판타지 텍스트 MUD 게임의 던전 마스터입니다.
몬스터 등장 장면을 긴장감 있게 2줄로 묘사하세요.
한국어로 답변하세요.`;

    const userPrompt = `${monsterName} Lv.${level}가 등장했습니다.
몬스터 등장 장면을 긴장감 있게 2줄로 묘사해주세요.`;

    return this.generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { max_tokens: 150 },
    );
  }

  async generateLevelUpMessage(
    characterLevel: number,
    hpIncrease: number,
    atkIncrease: number,
    defIncrease: number,
  ): Promise<string> {
    const systemPrompt = `당신은 게임 시스템의 알림 메시지를 작성합니다.
레벨업 축하 메시지를 2줄로 작성하세요.
한국어로 답변하세요.`;

    const userPrompt = `
레벨업 정보:
- 새 레벨: ${characterLevel}
- HP 증가: +${hpIncrease}
- ATK 증가: +${atkIncrease}
- DEF 증가: +${defIncrease}

위 정보를 포함하여 축하 메시지를 작성해주세요.`;

    return this.generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { max_tokens: 150 },
    );
  }
}

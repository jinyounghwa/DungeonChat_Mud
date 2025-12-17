import { Injectable } from '@nestjs/common';

export interface GameChoice {
  choice1: string;
  choice2: string;
}

@Injectable()
export class ChoiceParserService {
  /**
   * AI 응답에서 선택지를 파싱
   * 형식: [선택지]
   *        선택1: 명령어1
   *        선택2: 명령어2
   */
  parseChoices(response: string): GameChoice | null {
    // [선택지] 섹션 찾기 - 더 유연한 패턴
    const choicesMatch = response.match(/\[선택지\]([\s\S]*?)(?:\n\n|$)/);

    if (!choicesMatch) {
      console.warn('⚠️  [선택지] 태그를 찾을 수 없습니다');
      return null;
    }

    const choicesSection = choicesMatch[1];
    console.log(`🔍 선택지 섹션: "${choicesSection.substring(0, 100)}..."`);

    // 선택1: 명령어 패턴 - 여러 형식 지원
    const choice1Match = choicesSection.match(/선택\s*1\s*[:：]\s*(.+?)(?:\n|$)/);
    // 선택2: 명령어 패턴 - 여러 형식 지원
    const choice2Match = choicesSection.match(/선택\s*2\s*[:：]\s*(.+?)(?:\n|$)/);

    if (choice1Match && choice2Match) {
      const choice1 = choice1Match[1].trim().replace(/[\[\]]/g, '').trim();
      const choice2 = choice2Match[1].trim().replace(/[\[\]]/g, '').trim();

      console.log(`✓ 선택지 파싱 성공: [${choice1}] / [${choice2}]`);
      return {
        choice1,
        choice2,
      };
    }

    console.warn('⚠️  선택지 형식을 파싱할 수 없습니다');
    return null;
  }

  /**
   * 응답에서 선택지를 제거한 정제된 응답 반환
   */
  removeChoicesFromResponse(response: string): string {
    return response.replace(/\n?\[선택지\]([\s\S]*?)(?=\n|$)/g, '').trim();
  }

  /**
   * 선택지가 유효한지 확인
   */
  isValidChoice(choices: GameChoice | null): boolean {
    return !!(
      choices &&
      choices.choice1 &&
      choices.choice2 &&
      choices.choice1.length > 0 &&
      choices.choice2.length > 0
    );
  }

  /**
   * 기본 선택지 제공 (파싱 실패 시)
   */
  getDefaultChoices(currentState: any): GameChoice {
    // 현재 상황에 따라 적절한 기본 선택지 제공
    if (currentState.health <= 30) {
      return {
        choice1: '공격을 계속한다',
        choice2: '도망친다',
      };
    }

    if (currentState.floor >= 3) {
      return {
        choice1: '조심스럽게 앞으로 나아간다',
        choice2: '뒤로 물러난다',
      };
    }

    return {
      choice1: '앞으로 나아간다',
      choice2: '주변을 살펴본다',
    };
  }

  /**
   * 응답과 선택지를 함께 반환하는 완전한 결과
   */
  parseResponseWithChoices(
    response: string,
    currentState?: any,
  ): {
    cleanedResponse: string;
    choices: GameChoice;
  } {
    const choices = this.parseChoices(response);
    const cleanedResponse = this.removeChoicesFromResponse(response);

    // 파싱 실패시 기본 선택지 제공
    const finalChoices = this.isValidChoice(choices)
      ? choices!
      : this.getDefaultChoices(currentState);

    return {
      cleanedResponse,
      choices: finalChoices,
    };
  }
}

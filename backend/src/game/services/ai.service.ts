import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  private ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  private model = process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct-q4_K_M';
  private maxRetries = 3;
  private koreanThreshold = 0.7; // 70% Korean minimum (reasonable for Qwen model)

  async generateResponse(prompt: string): Promise<string> {
    const enhancedPrompt = this.enhancePromptForKorean(prompt);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callOllama(enhancedPrompt);
        const koreanRatio = this.calculateKoreanRatio(response);
        const koreanText = this.extractKoreanText(response);

        console.log(
          `[Attempt ${attempt}/${this.maxRetries}] Korean ratio: ${(koreanRatio * 100).toFixed(1)}% | Extracted: ${koreanText.substring(0, 50)}`,
        );

        // If we got clean Korean text, return it regardless of ratio
        if (koreanText && koreanText !== '> 응답을 처리할 수 없습니다.') {
          return koreanText;
        }

        // If Korean ratio is good enough, return extraction result
        if (koreanRatio >= this.koreanThreshold) {
          return koreanText;
        }

        if (attempt < this.maxRetries) {
          console.warn(
            `한국어 비율이 낮음 (${(koreanRatio * 100).toFixed(1)}%). 재시도 중... (${attempt}/${this.maxRetries})`,
          );
          // Small delay before retry
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
      } catch (error) {
        console.error(`[Attempt ${attempt}] API 오류:`, error);
        if (attempt === this.maxRetries) {
          return '> [ERROR] AI 응답을 생성할 수 없습니다.';
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Last resort: extract any Korean text that might be present from last attempt
    return '> [RETRY LIMIT] 응답 생성에 실패했습니다.';
  }

  private async callOllama(prompt: string): Promise<string> {
    const url = this.ollamaUrl + '/api/generate';
    const response = await axios.post(url, {
      model: this.model,
      prompt: prompt,
      stream: false,
      temperature: 0.8,
      top_p: 0.9,
      top_k: 40,
    });
    return response.data.response || '';
  }

  /**
   * Calculate the ratio of Korean characters in the text
   * Includes: 가-힣 (AC00-D7A3), 한글 자모 (1100-11FF, 3130-318F, A960-A97F)
   */
  private calculateKoreanRatio(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }

    let koreanCount = 0;
    let totalCount = 0;

    for (const char of text) {
      const code = char.charCodeAt(0);
      totalCount++;

      // Check if character is Korean
      if (
        (code >= 0xac00 && code <= 0xd7a3) || // 가-힣
        (code >= 0x1100 && code <= 0x11ff) || // 한글 자모 (초성/중성/종성)
        (code >= 0x3130 && code <= 0x318f) || // 한글 호환 자모
        (code >= 0xa960 && code <= 0xa97f) // 한글 호환 자모 확장
      ) {
        koreanCount++;
      }
    }

    return totalCount > 0 ? koreanCount / totalCount : 0;
  }

  /**
   * Remove Chinese characters and extract clean Korean sentences
   */
  private extractKoreanText(text: string): string {
    if (!text || text.length === 0) {
      return '> 응답을 처리할 수 없습니다.';
    }

    // Remove Chinese characters (CJK Unified Ideographs)
    let cleaned = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, '');

    // Remove special character + English patterns like _BRANCH_, _TAG_, WORD_WORD, etc
    // Pattern 1: _SOMETHING_ (underscore wrapped)
    cleaned = cleaned.replace(/_[A-Za-z0-9]+_/g, ' ');

    // Pattern 2: WORD_WORD or word_word (underscored English words)
    cleaned = cleaned.replace(/[A-Za-z0-9]+_[A-Za-z0-9_]+/g, ' ');

    // Pattern 3: Multiple special characters like @@@, ###, etc
    cleaned = cleaned.replace(/[#@$%^&*]{2,}/g, ' ');

    // Pattern 4: English words surrounded by special characters
    cleaned = cleaned.replace(/[<>{}[\]()~`].*?[<>{}[\]()~`]/g, ' ');

    // Remove excessive whitespace and newlines but keep structure
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (cleaned.length === 0) {
      return '> 응답을 처리할 수 없습니다.';
    }

    // Split into sentences - be less aggressive with punctuation
    const sentences = cleaned
      .split(/[.!?\n]/)
      .map((s) => s.trim())
      .filter((sentence) => {
        // Keep sentences that have Korean characters and are reasonable length
        return (
          sentence.length > 0 &&
          sentence.length < 200 &&
          this.hasKoreanCharacters(sentence)
        );
      });

    if (sentences.length === 0) {
      return '> 응답을 처리할 수 없습니다.';
    }

    // Return first 2-3 sentences, prefixed with >
    const result = sentences.slice(0, 3).join(' ');
    return result.startsWith('>') ? result : '> ' + result;
  }

  /**
   * Check if text contains at least some Korean characters
   */
  private hasKoreanCharacters(text: string): boolean {
    for (const char of text) {
      const code = char.charCodeAt(0);
      if (
        (code >= 0xac00 && code <= 0xd7a3) || // 가-힣
        (code >= 0x1100 && code <= 0x11ff) || // 한글 자모
        (code >= 0x3130 && code <= 0x318f) // 한글 호환 자모
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Enhance the prompt to force Korean-only responses
   */
  private enhancePromptForKorean(originalPrompt: string): string {
    const systemInstructions =
      '【중요한 지시】\n' +
      '당신은 한국어 ONLY 게임 마스터입니다.\n' +
      '절대로 중국어를 쓰지 마세요. 중국어가 감지되면 응답이 거부됩니다.\n' +
      '응답은 오직 한글(ㄱ-ㅎ, ㅏ-ㅣ, 가-힣)로만 작성해야 합니다.\n' +
      '영어, 중국어, 일본어, 로마자는 절대 금지입니다.\n' +
      '응답 형식: "> " 로 시작하고, 정확히 1-3개의 한글 문장만 작성하세요.\n' +
      '예시: "> 검은색 드래곤이 당신을 향해 날개짓한다!"\n' +
      '【응답 규칙】\n' +
      '1. 100% 순한국어 사용 필수\n' +
      '2. 중국어 절대 금지 (중국어 포함 시 응답 불가)\n' +
      '3. 숫자(0-9)와 기본 구두점(,-.:!?) 외 다른 문자 금지\n' +
      '4. "> "로 시작하는 1-3문장만 작성\n\n';

    return systemInstructions + originalPrompt;
  }
}

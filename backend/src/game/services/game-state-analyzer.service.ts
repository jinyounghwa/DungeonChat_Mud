import { Injectable } from '@nestjs/common';

interface StateUpdate {
  health?: number;
  maxHealth?: number;
  experience?: number;
  level?: number;
  floor?: number;
  leveledUp?: boolean;
  healthChanged?: boolean;
  experienceGained?: number;
}

@Injectable()
export class GameStateAnalyzerService {
  /**
   * AI 응답 내용을 분석하여 게임 상태 변화를 감지
   */
  analyzeResponse(response: string, currentState: any): StateUpdate {
    const update: StateUpdate = {};
    const lowerResponse = response.toLowerCase();

    console.log(`\n📊 [분석 시작] 응답: "${response.substring(0, 50)}..."`);

    // 1. 체력 변화 감지
    const healthUpdate = this.parseHealth(response, currentState);
    if (healthUpdate) {
      update.health = Math.max(0, Math.min(currentState.maxHealth, healthUpdate.health));
      update.healthChanged = update.health !== currentState.health;
      console.log(`   ❤️  체력 변화: ${currentState.health} → ${update.health}`);
    }

    // 2. 경험치 변화 감지
    const expUpdate = this.parseExperience(response, currentState);
    if (expUpdate) {
      update.experience = Math.max(0, expUpdate.experience);
      console.log(`   ⭐ 경험치 변화: ${currentState.experience} → ${update.experience}`);
    }

    // 3. 층(floor) 변화 감지
    const floorUpdate = this.parseFloor(response, currentState);
    if (floorUpdate) {
      update.floor = floorUpdate.floor;
      console.log(`   📍 층 변화: ${currentState.floor} → ${update.floor}`);
    }

    // 4. 레벨업 여부 확인
    const currentExp = update.experience !== undefined ? update.experience : currentState.experience;
    const levelUpdate = this.checkLevelUp(currentExp, currentState.level);
    if (levelUpdate.leveledUp) {
      update.level = levelUpdate.newLevel;
      update.experience = levelUpdate.remainingExp;
      update.leveledUp = true;
      console.log(
        `   🎉 레벨업! ${currentState.level} → ${levelUpdate.newLevel} (경험치: ${levelUpdate.remainingExp})`,
      );
    }

    if (Object.keys(update).length === 0) {
      console.log(`   ℹ️  상태 변화 없음`);
    }

    return update;
  }

  /**
   * 응답에서 체력 변화 파싱
   */
  private parseHealth(
    response: string,
    currentState: any,
  ): { health: number } | null {
    // "체력이 20 감소" → -20
    const damageMatch = response.match(/(체력이|체력)\s*(\d+)\s*(감소|피해|데미지)/);
    if (damageMatch) {
      const damage = parseInt(damageMatch[2]);
      return { health: currentState.health - damage };
    }

    // "20의 피해를 입었다" 또는 "+20 체력" → +20 또는 -20
    const numberMatch = response.match(/([+-])(\d+)\s*(체력|피해|데미지|손상)?/);
    if (numberMatch) {
      const sign = numberMatch[1];
      const amount = parseInt(numberMatch[2]);
      if (sign === '+') {
        return { health: currentState.health + amount };
      } else if (sign === '-') {
        return { health: currentState.health - amount };
      }
    }

    // "피해를 입었다" + 숫자
    const damageMatch2 = response.match(/(\d+)\s*(의|점)?\s*(피해|데미지|손상)/);
    if (damageMatch2 && response.match(/(피해|데미지|손상).*(입|맞)/)) {
      const damage = parseInt(damageMatch2[1]);
      return { health: currentState.health - damage };
    }

    // "회복되었다", "치유되었다" → 일정량 회복
    if (response.match(/(회복|치유|치료|회복되|회복하)/)) {
      const healMatch = response.match(/(\d+)\s*(회복|치유|치료)?/);
      const healAmount = healMatch ? parseInt(healMatch[1]) : 15;
      return { health: currentState.health + healAmount };
    }

    // "죽었다" → 체력 0
    if (response.match(/(죽었다|죽음|사망)/)) {
      return { health: 0 };
    }

    return null;
  }

  /**
   * 응답에서 경험치 변화 파싱
   */
  private parseExperience(
    response: string,
    currentState: any,
  ): { experience: number } | null {
    // "50의 경험치를 획득" 또는 "경험치 50 획득" → +50
    const expMatch = response.match(/(\d+)\s*(의|점)?\s*(경험치|경험|exp)/);
    if (expMatch) {
      const exp = parseInt(expMatch[1]);
      // 감소인지 증가인지 판단
      const isGain =
        response.includes('획득') ||
        response.includes('얻') ||
        response.includes('받') ||
        response.includes('증가') ||
        response.includes('상승') ||
        !response.match(/(감소|소모|잃|빼)/);
      const newExp = isGain ? currentState.experience + exp : currentState.experience - exp;
      console.log(`   ✔️  경험치 매칭 감지: +${exp} (정규식 1)`);
      return { experience: Math.max(0, newExp) };
    }

    // "경험치를 얻었다" - 기본값으로 30 추가
    if (response.match(/(경험치|경험).*(얻|획득|증가|받)/)) {
      console.log(`   ✔️  경험치 획득 감지: +30 (정규식 2)`);
      return { experience: currentState.experience + 30 };
    }

    // "승리했다", "몬스터를 처치", "적을 격파" → 기본 경험치
    if (
      response.match(
        /(승리|처치|격파|제거|퇴치|파괴|무찌|격|제거).*?(경험|경험치|경)/,
      ) ||
      response.match(/(적|몬스터|괴물|고블린|골렘|드래곤).*(처치|격파|제거|격파)/)
    ) {
      console.log(`   ✔️  몬스터 처치 감지: +30 (정규식 3)`);
      return { experience: currentState.experience + 30 };
    }

    return null;
  }

  /**
   * 응답에서 층(floor) 변화 파싱
   */
  private parseFloor(
    response: string,
    currentState: any,
  ): { floor: number } | null {
    // "다음 층으로" → floor + 1
    if (response.match(/(다음|새로운)\s*(층|레벨|스테이지)/)) {
      return { floor: currentState.floor + 1 };
    }

    // "X층으로 이동" → 특정 층으로
    const floorMatch = response.match(/(\d+)\s*층/);
    if (floorMatch) {
      const floor = parseInt(floorMatch[1]);
      if (floor > 0 && floor !== currentState.floor) {
        return { floor };
      }
    }

    // "내려간다", "올라간다"
    if (response.match(/내려가/)) {
      return { floor: currentState.floor + 1 };
    }

    return null;
  }

  /**
   * 레벨업 여부 확인 (경험치 기준: 100당 1레벨)
   */
  private checkLevelUp(
    currentExp: number,
    currentLevel: number,
  ): {
    leveledUp: boolean;
    newLevel: number;
    remainingExp: number;
  } {
    const expPerLevel = 100;
    const newLevel = Math.floor(currentExp / expPerLevel) + 1;

    if (newLevel > currentLevel) {
      const remainingExp = currentExp % expPerLevel;
      return {
        leveledUp: true,
        newLevel,
        remainingExp,
      };
    }

    return {
      leveledUp: false,
      newLevel: currentLevel,
      remainingExp: currentExp,
    };
  }
}

import { Injectable } from '@nestjs/common';

export interface StateUpdate {
  health?: number;
  maxHealth?: number;
  experience?: number;
  level?: number;
  floor?: number;
  leveledUp?: boolean;
  healthChanged?: boolean;
  experienceGained?: number;
  statusEffects?: StatusEffect[];
  itemsObtained?: string[];
  criticalHit?: boolean;
  damageDetails?: DamageDetail[];
}

export interface StatusEffect {
  type: 'poison' | 'curse' | 'burn' | 'freeze' | 'stun' | 'bleed';
  duration: number;
  damage?: number;
}

export interface DamageDetail {
  type: 'physical' | 'magic' | 'trap' | 'poison' | 'status';
  amount: number;
  source: string;
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

    // 1. 체력 변화 감지 (향상된 버전)
    const healthUpdate = this.parseHealthAdvanced(response, currentState);
    if (healthUpdate) {
      update.health = Math.max(0, Math.min(currentState.maxHealth, healthUpdate.health));
      update.healthChanged = update.health !== currentState.health;
      update.damageDetails = healthUpdate.details;
      console.log(`   ❤️  체력 변화: ${currentState.health} → ${update.health}`);
      if (healthUpdate.details.length > 0) {
        healthUpdate.details.forEach(d => {
          console.log(`      └─ [${d.type}] ${d.source}: -${d.amount}`);
        });
      }
    }

    // 2. 경험치 변화 감지
    const expUpdate = this.parseExperience(response, currentState);
    if (expUpdate) {
      update.experience = Math.max(0, expUpdate.experience);
      update.experienceGained = expUpdate.experienceGained;
      console.log(`   ⭐ 경험치 변화: ${currentState.experience} → ${update.experience} (+${expUpdate.experienceGained})`);
    }

    // 3. 층(floor) 변화 감지
    const floorUpdate = this.parseFloor(response, currentState);
    if (floorUpdate) {
      update.floor = floorUpdate.floor;
      console.log(`   📍 층 변화: ${currentState.floor} → ${update.floor}`);
    }

    // 4. 상태 이상 감지
    const statusEffects = this.parseStatusEffects(response);
    if (statusEffects.length > 0) {
      update.statusEffects = statusEffects;
      console.log(`   💀 상태 이상: ${statusEffects.map(s => s.type).join(', ')}`);
    }

    // 5. 크리티컬 히트 감지
    if (this.isCriticalHit(response)) {
      update.criticalHit = true;
      console.log(`   ⚔️  크리티컬 히트!`);
    }

    // 6. 아이템 획득 감지
    const items = this.parseItems(response);
    if (items.length > 0) {
      update.itemsObtained = items;
      console.log(`   🎁 획득 아이템: ${items.join(', ')}`);
    }

    // 7. 레벨업 여부 확인
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
   * 향상된 체력 변화 파싱 - 데미지 상세 정보 포함
   */
  private parseHealthAdvanced(
    response: string,
    currentState: any,
  ): { health: number; details: DamageDetail[] } | null {
    const details: DamageDetail[] = [];
    let totalDamage = 0;
    let totalHealing = 0;

    // 1. 구체적인 데미지 타입 감지
    // - 물리 피해: "검", "도끼", "공격", "칼", "맞", "때리다"
    const physicalDamageMatch = response.match(
      /(\d+)\s*(의)?\s*(피해|데미지|손상|데메지).*?(검|도끼|공격|칼|맞|격|때리|치다|찰|베|휘둘)/i,
    );
    if (physicalDamageMatch) {
      const damage = parseInt(physicalDamageMatch[1]);
      totalDamage += damage;
      details.push({
        type: 'physical',
        amount: damage,
        source: '물리 공격',
      });
    }

    // 2. 마법 피해: "마법", "불", "화살", "번개", "얼음"
    const magicDamageMatch = response.match(
      /(\d+)\s*(의)?\s*(피해|데미지|손상).*?(마법|불|화살|번개|얼음|빔|방출|폭발)/i,
    );
    if (magicDamageMatch) {
      const damage = parseInt(magicDamageMatch[1]);
      totalDamage += damage;
      details.push({
        type: 'magic',
        amount: damage,
        source: '마법 공격',
      });
    }

    // 3. 함정 피해
    const trapDamageMatch = response.match(/(\d+)\s*(의)?\s*(피해|데미지).*?(함정|가시|화살|칼날|톱|바늘)/i);
    if (trapDamageMatch) {
      const damage = parseInt(trapDamageMatch[1]);
      totalDamage += damage;
      details.push({
        type: 'trap',
        amount: damage,
        source: '함정',
      });
    }

    // 4. 일반 데미지: "체력이 20 감소"
    const generalDamageMatch = response.match(/(체력|hp)\s*(이)?\s*(\d+)\s*(감소|피해|데미지|손상|깎)/i);
    if (generalDamageMatch && details.length === 0) {
      const damage = parseInt(generalDamageMatch[3]);
      totalDamage += damage;
      details.push({
        type: 'physical',
        amount: damage,
        source: '데미지',
      });
    }

    // 5. 복수 데미지 패턴: "+10 또는 -20"
    const multipleDamageMatch = response.match(/[-+](\d+)(?!\d)/g);
    if (multipleDamageMatch && details.length === 0) {
      multipleDamageMatch.forEach(match => {
        const value = parseInt(match);
        if (value < 0) {
          totalDamage += Math.abs(value);
          details.push({
            type: 'physical',
            amount: Math.abs(value),
            source: '공격',
          });
        }
      });
    }

    // 6. 회복: "체력이 20 회복", "20 회복", "+30"
    const healMatch = response.match(/(회복|치유|치료|회복되|회복하|회복됨).*?(\d+)|(\d+).*?(회복|치유|치료)/i);
    if (healMatch) {
      const healAmount = parseInt(healMatch[2] || healMatch[3]) || 15;
      totalHealing += healAmount;
    }

    // 특수: "+30 체력"
    const plusHealMatch = response.match(/\+(\d+)\s*(체력|hp)/i);
    if (plusHealMatch) {
      totalHealing += parseInt(plusHealMatch[1]);
    }

    // 7. 죽음
    if (response.match(/(죽었다|죽음|사망|게임오버)/i)) {
      return {
        health: 0,
        details: [
          {
            type: 'physical',
            amount: currentState.health,
            source: '사망',
          },
        ],
      };
    }

    // 최종 계산
    let finalHealth = currentState.health - totalDamage + totalHealing;
    finalHealth = Math.max(0, Math.min(currentState.maxHealth, finalHealth));

    if (totalDamage > 0 || totalHealing > 0) {
      return { health: finalHealth, details };
    }

    return null;
  }

  /**
   * 응답에서 경험치 변화 파싱
   */
  private parseExperience(
    response: string,
    currentState: any,
  ): { experience: number; experienceGained: number } | null {
    let experienceGained = 0;

    // 1. 명시적 경험치 수치: "50의 경험치를 획득", "경험치 50 획득"
    const expMatch = response.match(/(\d+)\s*(의|점)?\s*(경험치|경험|exp|EXP)/i);
    if (expMatch) {
      const exp = parseInt(expMatch[1]);
      // 감소인지 증가인지 판단
      const isGain =
        response.includes('획득') ||
        response.includes('얻') ||
        response.includes('받') ||
        response.includes('증가') ||
        response.includes('상승') ||
        response.includes('보상') ||
        !response.match(/(감소|소모|잃|빼)/);
      experienceGained = isGain ? exp : -exp;
      console.log(`   ✔️  경험치 정확 감지: +${experienceGained}`);
      return {
        experience: Math.max(0, currentState.experience + experienceGained),
        experienceGained,
      };
    }

    // 2. 몬스터 처치별 경험치 정하기
    const monsterExpMap: { [key: string]: number } = {
      '고블린': 20,
      '박쥐': 15,
      '스켈레톤': 30,
      '오크': 40,
      '거미': 25,
      '골렘': 50,
      '우르드': 60,
      '정령': 55,
      '드래곤': 100,
      '마신': 500,
      '마법사': 70,
      '기사': 65,
    };

    for (const [monster, exp] of Object.entries(monsterExpMap)) {
      if (
        response.includes(monster) &&
        (response.match(/(처치|격파|제거|무찌|퇴치|격)/) ||
          response.match(/(승리|이겼|쓰러뜨)/))
      ) {
        experienceGained = exp;
        console.log(`   ✔️  ${monster} 처치: +${experienceGained} (정규식 2)`);
        return {
          experience: currentState.experience + experienceGained,
          experienceGained,
        };
      }
    }

    // 3. "경험치를 얻었다" - 기본값으로 30 추가
    if (response.match(/(경험치|경험).*(얻|획득|증가|받)/i)) {
      experienceGained = 30;
      console.log(`   ✔️  경험치 획득 감지: +${experienceGained}`);
      return {
        experience: currentState.experience + experienceGained,
        experienceGained,
      };
    }

    // 4. "승리했다" 등 일반 표현 - 기본 30
    if (
      response.match(/(승리|이겼|격파|처치)/) &&
      !response.match(/(실패|졌|패배|도망)/)
    ) {
      experienceGained = 30;
      console.log(`   ✔️  일반 경험치 감지: +${experienceGained}`);
      return {
        experience: currentState.experience + experienceGained,
        experienceGained,
      };
    }

    return null;
  }

  /**
   * 응답에서 상태 이상 감지
   */
  private parseStatusEffects(response: string): StatusEffect[] {
    const effects: StatusEffect[] = [];

    // 1. 중독
    if (response.match(/(중독|독|중독됨|독에|중독된)/i)) {
      const durationMatch = response.match(/(\d+)\s*(턴|초|라운드|동안)?.*?(중독|독)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 3;
      effects.push({
        type: 'poison',
        duration,
        damage: 5,
      });
    }

    // 2. 저주
    if (response.match(/(저주|저주됨|저주의|저주에)/i)) {
      effects.push({
        type: 'curse',
        duration: 5,
      });
    }

    // 3. 화상
    if (response.match(/(화상|타|불에|불태|타오|태워)/i)) {
      effects.push({
        type: 'burn',
        duration: 3,
        damage: 8,
      });
    }

    // 4. 얼음
    if (response.match(/(얼음|얼려|냉동|얼어|동상)/i)) {
      effects.push({
        type: 'freeze',
        duration: 2,
      });
    }

    // 5. 기절
    if (response.match(/(기절|스턴|넘어|쓰러져)/i)) {
      effects.push({
        type: 'stun',
        duration: 1,
      });
    }

    // 6. 출혈
    if (response.match(/(출혈|피가|피흘|피를|출혈되)/i)) {
      effects.push({
        type: 'bleed',
        duration: 4,
        damage: 3,
      });
    }

    return effects;
  }

  /**
   * 크리티컬 히트 감지
   */
  private isCriticalHit(response: string): boolean {
    return !!(
      response.match(/(크리티컬|치명타|급소|극대화|파괴적)/i) ||
      response.match(/(엄청난|끔찍한|극심한).*?(피해|데미지)/i) ||
      response.match(/(한 번의 큰|강력한).*?(공격|일격)/i)
    );
  }

  /**
   * 아이템 획득 감지
   */
  private parseItems(response: string): string[] {
    const items: string[] = [];

    // 아이템 관련 키워드
    const itemPatterns = [
      { pattern: /물약|생명약|회복약/i, name: '생명 물약' },
      { pattern: /마나약|마나/i, name: '마나 물약' },
      { pattern: /검|칼/i, name: '검' },
      { pattern: /갑옷|방어구|체갑/i, name: '갑옷' },
      { pattern: /방패/i, name: '방패' },
      { pattern: /목걸이|목조|아뮬렛/i, name: '목걸이' },
      { pattern: /반지|링/i, name: '반지' },
      { pattern: /보물|금화|보석|다이아/i, name: '보물' },
      { pattern: /고대.*?책|마법책|마법 기록|룬스톤/i, name: '마법책' },
      { pattern: /열쇠|키|잠금 도구/i, name: '열쇠' },
      { pattern: /지도|지형도/i, name: '지도' },
    ];

    for (const { pattern, name } of itemPatterns) {
      if (response.match(pattern) && response.match(/(획득|얻|집은|발견|주운|발견했|손에 들었)/i)) {
        items.push(name);
      }
    }

    return items;
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

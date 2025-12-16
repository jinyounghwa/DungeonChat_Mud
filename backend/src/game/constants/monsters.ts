export interface MonsterTemplate {
  name: string;
  level: number;
  hpMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
}

const EARLY_MONSTERS: MonsterTemplate[] = [
  { name: '슬라임', level: 1, hpMultiplier: 0.8, atkMultiplier: 0.8, defMultiplier: 0.8 },
  { name: '고블린', level: 3, hpMultiplier: 0.9, atkMultiplier: 0.9, defMultiplier: 0.9 },
  { name: '늑대', level: 6, hpMultiplier: 1.0, atkMultiplier: 1.0, defMultiplier: 1.0 },
];

const MIDDLE_MONSTERS: MonsterTemplate[] = [
  { name: '스켈레톤', level: 11, hpMultiplier: 1.0, atkMultiplier: 1.0, defMultiplier: 1.0 },
  { name: '좀비', level: 14, hpMultiplier: 1.1, atkMultiplier: 1.1, defMultiplier: 1.1 },
  { name: '뱀파이어', level: 17, hpMultiplier: 1.2, atkMultiplier: 1.2, defMultiplier: 1.2 },
];

const ADVANCED_MONSTERS: MonsterTemplate[] = [
  { name: '드레이크', level: 21, hpMultiplier: 1.2, atkMultiplier: 1.2, defMultiplier: 1.2 },
  { name: '데몬', level: 24, hpMultiplier: 1.3, atkMultiplier: 1.3, defMultiplier: 1.3 },
  { name: '드래곤', level: 27, hpMultiplier: 1.4, atkMultiplier: 1.4, defMultiplier: 1.4 },
];

export function getMonsterForFloor(floor: number, playerLevel: number): MonsterTemplate {
  let monsters: MonsterTemplate[];

  if (floor <= 10) {
    monsters = EARLY_MONSTERS;
  } else if (floor <= 20) {
    monsters = MIDDLE_MONSTERS;
  } else {
    monsters = ADVANCED_MONSTERS;
  }

  // Random monster from the pool
  const monster = monsters[Math.floor(Math.random() * monsters.length)];

  // Adjust level based on player level (±2)
  const levelVariation = Math.floor(Math.random() * 5) - 2;

  return {
    ...monster,
    level: Math.max(1, monster.level + levelVariation),
  };
}

export function calculateMonsterStats(template: MonsterTemplate, baseHp: number = 15) {
  const hp = Math.floor(template.level * baseHp * template.hpMultiplier);
  const atk = Math.floor(template.level * 2 * template.atkMultiplier);
  const def = Math.floor(template.level * 1 * template.defMultiplier);

  return {
    name: template.name,
    level: template.level,
    hp,
    maxHp: hp,
    atk,
    def,
  };
}

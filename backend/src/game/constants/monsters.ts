import { MONSTER_ASCII } from './ascii-art';

export interface MonsterTemplate {
  name: string;
  level: number;
  hpMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
  asciiKey?: keyof typeof MONSTER_ASCII;
  isBoss?: boolean;
}

const EARLY_MONSTERS: MonsterTemplate[] = [
  { name: '슬라임', level: 1, hpMultiplier: 0.8, atkMultiplier: 0.8, defMultiplier: 0.8, asciiKey: 'slime' },
  { name: '고블린', level: 3, hpMultiplier: 0.9, atkMultiplier: 0.9, defMultiplier: 0.9, asciiKey: 'goblin' },
  { name: '늑대', level: 6, hpMultiplier: 1.0, atkMultiplier: 1.0, defMultiplier: 1.0, asciiKey: 'wolf' },
];

const MIDDLE_MONSTERS: MonsterTemplate[] = [
  { name: '스켈레톤', level: 11, hpMultiplier: 1.0, atkMultiplier: 1.0, defMultiplier: 1.0, asciiKey: 'skeleton' },
  { name: '좀비', level: 14, hpMultiplier: 1.1, atkMultiplier: 1.1, defMultiplier: 1.1, asciiKey: 'zombie' },
  { name: '뱀파이어', level: 17, hpMultiplier: 1.2, atkMultiplier: 1.2, defMultiplier: 1.2, asciiKey: 'vampire' },
];

const ADVANCED_MONSTERS: MonsterTemplate[] = [
  { name: '드래곤', level: 21, hpMultiplier: 1.2, atkMultiplier: 1.2, defMultiplier: 1.2, asciiKey: 'dragon' },
  { name: '데몬', level: 24, hpMultiplier: 1.3, atkMultiplier: 1.3, defMultiplier: 1.3, asciiKey: 'demon' },
  { name: '마법사', level: 27, hpMultiplier: 1.4, atkMultiplier: 1.4, defMultiplier: 1.4, asciiKey: 'mage' },
];

// Boss monsters for each stage (no level variation for bosses)
const EARLY_BOSS: MonsterTemplate = {
  name: '오크 족장',
  level: 10,
  hpMultiplier: 2.5,
  atkMultiplier: 2.2,
  defMultiplier: 2.0,
  asciiKey: 'demon', // Using demon ASCII for boss
  isBoss: true,
};

const MIDDLE_BOSS: MonsterTemplate = {
  name: '리치',
  level: 20,
  hpMultiplier: 2.8,
  atkMultiplier: 2.4,
  defMultiplier: 2.2,
  asciiKey: 'dragon',
  isBoss: true,
};

const ADVANCED_BOSS: MonsterTemplate = {
  name: '마왕',
  level: 30,
  hpMultiplier: 3.5,
  atkMultiplier: 3.0,
  defMultiplier: 2.8,
  asciiKey: 'dragon',
  isBoss: true,
};

export function getMonsterForFloor(floor: number, playerLevel: number): MonsterTemplate {
  // Boss encounters at specific floor milestones
  if (floor === 10) {
    return EARLY_BOSS;
  } else if (floor === 20) {
    return MIDDLE_BOSS;
  } else if (floor === 30) {
    return ADVANCED_BOSS;
  }

  // Regular monsters for non-boss floors
  let monsters: MonsterTemplate[];

  if (floor < 10) {
    monsters = EARLY_MONSTERS;
  } else if (floor < 20) {
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

  const ascii = template.asciiKey ? MONSTER_ASCII[template.asciiKey] : '';

  return {
    name: template.name,
    level: template.level,
    hp,
    maxHp: hp,
    atk,
    def,
    ascii,
    isBoss: template.isBoss || false,
  };
}

export function getMonsterASCII(template: MonsterTemplate): string {
  if (template.asciiKey && MONSTER_ASCII[template.asciiKey]) {
    return MONSTER_ASCII[template.asciiKey];
  }
  return '';
}

// Sample characters for testing
export const SAMPLE_WARRIOR = {
  id: 'warrior-1',
  userId: 'user-1',
  name: '테스트용사',
  class: 'warrior',
  level: 1,
  exp: 0,
  hp: 120,
  maxHp: 120,
  atk: 15,
  def: 12,
  currentFloor: 1,
  gold: 0,
};

export const SAMPLE_MAGE = {
  id: 'mage-1',
  userId: 'user-1',
  name: '테스트마법사',
  class: 'mage',
  level: 1,
  exp: 0,
  hp: 80,
  maxHp: 80,
  atk: 20,
  def: 8,
  currentFloor: 1,
  gold: 0,
};

export const SAMPLE_THIEF = {
  id: 'thief-1',
  userId: 'user-1',
  name: '테스트도둑',
  class: 'thief',
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100,
  atk: 18,
  def: 10,
  currentFloor: 1,
  gold: 0,
};

// Sample monsters for testing
export const SAMPLE_SLIME = {
  name: '슬라임',
  level: 1,
  hp: 12,
  maxHp: 12,
  atk: 4,
  def: 1,
  isBoss: false,
};

export const SAMPLE_GOBLIN = {
  name: '고블린',
  level: 3,
  hp: 27,
  maxHp: 27,
  atk: 9,
  def: 3,
  isBoss: false,
};

export const SAMPLE_BOSS_ORC = {
  name: '오크 족장',
  level: 10,
  hp: 300,
  maxHp: 300,
  atk: 33,
  def: 20,
  isBoss: true,
};

// Sample inventory items for testing
export const SAMPLE_HEALTH_POTION = {
  id: 'item-health-1',
  characterId: 'warrior-1',
  itemName: '체력 포션',
  itemType: 'potion',
  quantity: 3,
  isEquipped: false,
};

export const SAMPLE_IRON_SWORD = {
  id: 'item-sword-1',
  characterId: 'warrior-1',
  itemName: '강철 검',
  itemType: 'weapon',
  quantity: 1,
  isEquipped: true,
};

export const SAMPLE_IRON_ARMOR = {
  id: 'item-armor-1',
  characterId: 'warrior-1',
  itemName: '철갑옷',
  itemType: 'armor',
  quantity: 1,
  isEquipped: true,
};

// Sample battle logs for testing
export const SAMPLE_VICTORY_LOG = {
  id: 'battle-log-1',
  characterId: 'warrior-1',
  monsterName: '고블린',
  monsterLevel: 3,
  result: 'victory',
  damageDealt: 45,
  damageTaken: 12,
  expGained: 30,
  goldGained: 15,
  itemsGained: ['체력 포션'],
  battleDuration: 3,
};

export const SAMPLE_DEFEAT_LOG = {
  id: 'battle-log-2',
  characterId: 'warrior-1',
  monsterName: '뱀파이어',
  monsterLevel: 17,
  result: 'defeat',
  damageDealt: 25,
  damageTaken: 120,
  expGained: 0,
  goldGained: 0,
  itemsGained: [],
  battleDuration: 5,
};

// Sample save states for testing
export const SAMPLE_SAVE_STATE = {
  id: 'save-1',
  characterId: 'warrior-1',
  slotNumber: 1,
  saveName: 'Floor 3 Progress',
  gameState: {
    character: {
      id: 'warrior-1',
      name: '테스트용사',
      class: 'warrior',
      level: 5,
      exp: 450,
      hp: 150,
      maxHp: 150,
      atk: 25,
      def: 18,
      currentFloor: 3,
      gold: 250,
    },
    inventory: [
      SAMPLE_HEALTH_POTION,
      SAMPLE_IRON_SWORD,
      SAMPLE_IRON_ARMOR,
    ],
    conversations: [],
  },
};

// Level progression test data
export const LEVEL_PROGRESSION_DATA = [
  { level: 1, requiredExp: 100, hpIncrease: 10, atkIncrease: 2, defIncrease: 2 },
  { level: 2, requiredExp: 200, hpIncrease: 10, atkIncrease: 2, defIncrease: 2 },
  { level: 5, requiredExp: 500, hpIncrease: 50, atkIncrease: 10, defIncrease: 10 },
  { level: 10, requiredExp: 1000, hpIncrease: 100, atkIncrease: 20, defIncrease: 20 },
];

// Damage calculation test cases
export const DAMAGE_CALCULATION_TEST_CASES = [
  // { playerAtk, monsterDef, expectedDamage }
  { playerAtk: 20, monsterDef: 10, expectedDamage: 15 },
  { playerAtk: 15, monsterDef: 12, expectedDamage: 9 },
  { playerAtk: 5, monsterDef: 20, expectedDamage: 1 }, // Min damage is 1
  { playerAtk: 30, monsterDef: 0, expectedDamage: 30 },
  { playerAtk: 25, monsterDef: 25, expectedDamage: 12 },
];

// Critical hit test cases
export const CRITICAL_HIT_TEST_CASES = [
  // Warrior: 10% crit chance
  { class: 'warrior', baseDamage: 15, critMultiplier: 1.5, expectedCritDamage: 22 },
  // Mage: 10% crit chance
  { class: 'mage', baseDamage: 20, critMultiplier: 1.5, expectedCritDamage: 30 },
  // Thief: 20% crit chance
  { class: 'thief', baseDamage: 18, critMultiplier: 1.5, expectedCritDamage: 27 },
];

// Escape chance test cases
export const ESCAPE_CHANCE_TEST_CASES = [
  { class: 'warrior', expectedEscapeChance: 0.5 },
  { class: 'mage', expectedEscapeChance: 0.5 },
  { class: 'thief', expectedEscapeChance: 0.7 },
  { class: 'warrior', isBoss: true, expectedEscapeChance: 0 }, // Cannot escape boss
];

// Character stat growth test data
export const CHARACTER_STAT_GROWTH = {
  warrior: { hp: 10, atk: 2, def: 2 },
  mage: { hp: 6, atk: 3, def: 1 },
  thief: { hp: 8, atk: 2.5, def: 1.5 },
};

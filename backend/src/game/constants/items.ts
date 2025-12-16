export interface ItemTemplate {
  id: string;
  name: string;
  type: 'potion' | 'weapon' | 'armor' | 'accessory';
  level: number;
  statsBonus: Record<string, number>;
  price: number;
  dropRate?: number;
}

export const ITEM_POOL: ItemTemplate[] = [
  // Potions
  {
    id: 'potion-health',
    name: '체력 포션',
    type: 'potion',
    level: 1,
    statsBonus: { hpRestore: 50 },
    price: 50,
    dropRate: 0.3,
  },
  {
    id: 'potion-mana',
    name: '마나 포션',
    type: 'potion',
    level: 5,
    statsBonus: { damageMultiplier: 2 },
    price: 100,
    dropRate: 0.15,
  },
  {
    id: 'feather-revival',
    name: '부활의 깃털',
    type: 'potion',
    level: 10,
    statsBonus: { autoRevive: 1 },
    price: 500,
    dropRate: 0.05,
  },

  // Weapons
  {
    id: 'weapon-rusty-sword',
    name: '낡은 검',
    type: 'weapon',
    level: 1,
    statsBonus: { atk: 3 },
    price: 0,
  },
  {
    id: 'weapon-iron-sword',
    name: '강철 검',
    type: 'weapon',
    level: 5,
    statsBonus: { atk: 8 },
    price: 200,
    dropRate: 0.08,
  },
  {
    id: 'weapon-legendary-sword',
    name: '명검',
    type: 'weapon',
    level: 10,
    statsBonus: { atk: 15 },
    price: 500,
    dropRate: 0.05,
  },
  {
    id: 'weapon-dragon-sword',
    name: '전설의 검',
    type: 'weapon',
    level: 20,
    statsBonus: { atk: 30 },
    price: 2000,
    dropRate: 0.01,
  },

  // Armor
  {
    id: 'armor-leather',
    name: '가죽 갑옷',
    type: 'armor',
    level: 1,
    statsBonus: { def: 2 },
    price: 0,
  },
  {
    id: 'armor-iron',
    name: '철갑옷',
    type: 'armor',
    level: 5,
    statsBonus: { def: 6 },
    price: 250,
    dropRate: 0.08,
  },
  {
    id: 'armor-plate',
    name: '플레이트 아머',
    type: 'armor',
    level: 10,
    statsBonus: { def: 12 },
    price: 600,
    dropRate: 0.05,
  },
  {
    id: 'armor-dragon',
    name: '용비늘 갑옷',
    type: 'armor',
    level: 20,
    statsBonus: { def: 25 },
    price: 2000,
    dropRate: 0.01,
  },
];

export function getItemByDropRate(level: number): ItemTemplate | null {
  const potions = ITEM_POOL.filter(
    (item) => item.type === 'potion' && item.level <= level && item.dropRate,
  );

  if (potions.length === 0) return null;

  const random = Math.random();
  let accumulated = 0;

  for (const potion of potions) {
    accumulated += potion.dropRate || 0;
    if (random < accumulated) {
      return potion;
    }
  }

  return null;
}

export function getItemById(itemId: string): ItemTemplate | null {
  return ITEM_POOL.find((item) => item.id === itemId) || null;
}

export function getItemsByType(
  type: string,
  level?: number,
): ItemTemplate[] {
  return ITEM_POOL.filter(
    (item) => item.type === type && (!level || item.level <= level),
  );
}

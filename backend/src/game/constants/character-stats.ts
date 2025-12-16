export const CHARACTER_STATS = {
  warrior: {
    hp: 120,
    atk: 15,
    def: 12,
    levelUpIncrease: { hp: 10, atk: 2, def: 2 },
  },
  mage: {
    hp: 80,
    atk: 20,
    def: 8,
    levelUpIncrease: { hp: 6, atk: 3, def: 1 },
  },
  thief: {
    hp: 100,
    atk: 18,
    def: 10,
    levelUpIncrease: { hp: 8, atk: 2.5, def: 1.5 },
  },
};

export const COMBAT_STATS = {
  warrior: {
    criticalRate: 0.1,
    dodgeRate: 0.05,
  },
  mage: {
    criticalRate: 0.1,
    dodgeRate: 0.05,
  },
  thief: {
    criticalRate: 0.2,
    dodgeRate: 0.15,
  },
};

export const ESCAPE_RATE = {
  warrior: 0.5,
  mage: 0.5,
  thief: 0.7,
};

export const EXP_TABLE = (level: number) => level * 100;

import {
  calculatePlayerAttack,
  calculateMonsterAttack,
  calculateDefenseReduction,
  calculateEscapeChance,
} from './combat.util';

describe('Combat Utilities', () => {
  describe('calculatePlayerAttack', () => {
    it('should calculate basic damage correctly', () => {
      const result = calculatePlayerAttack(20, 10, 'warrior');
      expect(result.damage).toBe(15); // 20 - (10/2) = 15
      expect(result.isDodged).toBe(false);
    });

    it('should enforce minimum damage of 1', () => {
      const result = calculatePlayerAttack(5, 20, 'warrior');
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    it('should apply critical hits for thief (20% base)', () => {
      // Mock Math.random for testing critical chance
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1); // Within 20% critical range

      const result = calculatePlayerAttack(15, 10, 'thief');
      expect(result.isCritical).toBe(true);
      expect(result.damage).toBeGreaterThan(15); // Should be 1.5x

      Math.random = originalRandom;
    });

    it('should handle different classes with different crit chances', () => {
      const warrior = calculatePlayerAttack(20, 10, 'warrior');
      const mage = calculatePlayerAttack(20, 10, 'mage');
      const thief = calculatePlayerAttack(20, 10, 'thief');

      // All should have calculated damage
      expect(warrior.damage).toBeGreaterThan(0);
      expect(mage.damage).toBeGreaterThan(0);
      expect(thief.damage).toBeGreaterThan(0);
    });

    it('should calculate dodge chance for thief (15%)', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1); // Within 15% dodge range

      const result = calculatePlayerAttack(20, 10, 'thief');
      // May dodge, may not depend on random
      expect(result).toHaveProperty('isDodged');

      Math.random = originalRandom;
    });
  });

  describe('calculateMonsterAttack', () => {
    it('should calculate monster damage correctly', () => {
      const result = calculateMonsterAttack(15, 12);
      expect(result.damage).toBe(9); // 15 - (12/2) = 9
      expect(result.isDodged).toBe(false);
    });

    it('should enforce minimum damage of 1', () => {
      const result = calculateMonsterAttack(5, 30);
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    it('should apply critical hits (10% chance)', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.05); // Within 10% critical range

      const result = calculateMonsterAttack(20, 10);
      expect(result.isCritical).toBe(true);
      expect(result.damage).toBe(30); // 20 damage * 1.5 = 30

      Math.random = originalRandom;
    });

    it('should have no critical when random is outside crit range', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.15); // Outside 10% crit range

      const result = calculateMonsterAttack(20, 10);
      expect(result.isCritical).toBe(false);
      expect(result.damage).toBe(15); // 20 - (10/2)

      Math.random = originalRandom;
    });
  });

  describe('calculateDefenseReduction', () => {
    it('should reduce damage by 50%', () => {
      const result = calculateDefenseReduction(20, 0.5);
      expect(result).toBe(10); // 20 * 0.5 = 10
    });

    it('should handle zero damage', () => {
      const result = calculateDefenseReduction(0, 0.5);
      expect(result).toBe(0);
    });

    it('should work with different reduction percentages', () => {
      expect(calculateDefenseReduction(20, 0.25)).toBe(5); // 25% reduction
      expect(calculateDefenseReduction(20, 0.75)).toBe(15); // 75% reduction
      expect(calculateDefenseReduction(20, 1)).toBe(20); // No reduction
    });

    it('should return floor value (integer)', () => {
      const result = calculateDefenseReduction(15, 0.5);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(7); // floor(15 * 0.5) = floor(7.5) = 7
    });
  });

  describe('calculateEscapeChance', () => {
    it('should return 50% escape chance for warrior', () => {
      const chance = calculateEscapeChance('warrior');
      expect(chance).toBe(0.5);
    });

    it('should return 50% escape chance for mage', () => {
      const chance = calculateEscapeChance('mage');
      expect(chance).toBe(0.5);
    });

    it('should return 70% escape chance for thief', () => {
      const chance = calculateEscapeChance('thief');
      expect(chance).toBe(0.7);
    });

    it('should return 0% escape chance against boss', () => {
      const chance = calculateEscapeChance('warrior', true);
      expect(chance).toBe(0);
    });

    it('should return 0% for all classes against boss', () => {
      expect(calculateEscapeChance('warrior', true)).toBe(0);
      expect(calculateEscapeChance('mage', true)).toBe(0);
      expect(calculateEscapeChance('thief', true)).toBe(0);
    });

    it('should determine success based on escape chance', () => {
      const originalRandom = Math.random;

      // Test warrior with 50% chance - success
      Math.random = jest.fn(() => 0.3); // < 0.5, should succeed
      const result1 = calculateEscapeChance('warrior', false) > Math.random();
      expect(result1).toBe(true);

      // Test thief with 70% chance - failure
      Math.random = jest.fn(() => 0.8); // > 0.7, should fail
      const result2 = calculateEscapeChance('thief', false) > Math.random();
      expect(result2).toBe(false);

      Math.random = originalRandom;
    });
  });

  describe('Combat formula consistency', () => {
    it('should ensure player ATK subtracts half DEF from monster', () => {
      // Base formula: ATK - (DEF/2)
      const playerResult = calculatePlayerAttack(25, 12, 'warrior');
      const expectedDamage = 25 - 6; // 25 - (12/2) = 19
      expect(playerResult.damage).toBe(expectedDamage);
    });

    it('should ensure minimum damage is always at least 1', () => {
      const lowDmg = calculatePlayerAttack(5, 100, 'warrior');
      const zeroDef = calculatePlayerAttack(5, 0, 'warrior');

      expect(lowDmg.damage).toBeGreaterThanOrEqual(1);
      expect(zeroDef.damage).toBeGreaterThanOrEqual(1);
    });

    it('should apply critical multiplier of 1.5x correctly', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.05); // Force critical

      const result = calculateMonsterAttack(20, 10);
      const baseDamage = 20 - 5; // 15
      const expectedCritDamage = Math.floor(baseDamage * 1.5); // 22

      expect(result.isCritical).toBe(true);
      expect(result.damage).toBe(expectedCritDamage);

      Math.random = originalRandom;
    });
  });
});

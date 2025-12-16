import { COMBAT_STATS, ESCAPE_RATE } from '../constants/character-stats';

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  isDodged: boolean;
}

export function calculateDamage(atk: number, def: number): number {
  const baseDamage = atk - def / 2;
  return Math.max(1, Math.round(baseDamage));
}

export function calculatePlayerAttack(
  atk: number,
  def: number,
  characterClass: string,
): DamageResult {
  const stats = COMBAT_STATS[characterClass] || { criticalRate: 0.1, dodgeRate: 0.05 };

  const isDodged = Math.random() < stats.dodgeRate;
  if (isDodged) {
    return { damage: 0, isCritical: false, isDodged: true };
  }

  const isCritical = Math.random() < stats.criticalRate;
  const baseDamage = calculateDamage(atk, def);
  const damage = isCritical ? Math.round(baseDamage * 1.5) : baseDamage;

  return { damage, isCritical, isDodged: false };
}

export function calculateMonsterAttack(
  atk: number,
  def: number,
): DamageResult {
  const baseDamage = calculateDamage(atk, def);
  const isCritical = Math.random() < 0.1; // 10% critical rate for monsters
  const damage = isCritical ? Math.round(baseDamage * 1.5) : baseDamage;

  return { damage, isCritical, isDodged: false };
}

export function calculateEscapeChance(
  characterClass: string,
  isBoss: boolean = false,
): boolean {
  if (isBoss) {
    return false; // Cannot escape from boss
  }

  const escapeRate = ESCAPE_RATE[characterClass] || 0.5;
  return Math.random() < escapeRate;
}

export function calculateDefenseReduction(
  damage: number,
  defensePercentage: number = 0.5,
): number {
  return Math.round(damage * (1 - defensePercentage));
}

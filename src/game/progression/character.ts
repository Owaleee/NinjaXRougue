import { BALANCE as B } from '../Balance';
import { addAttributes, emptyAttributes, sumAttributes } from '../attributes';
import { RuleError } from '../errors';
import { maxChakra, maxHp, xpToNext } from '../formulas';
import { ATTR_KEYS, type Attributes, type ClanId, type Element } from '../types';
import { CLANS } from '../../data/clans';
import { ITEMS } from '../../data/items';

/**
 * O personagem do jogador DENTRO de uma run (tudo aqui morre com a run).
 * baseAttrs = pontos + bônus de clã + Pergaminhos Raros (é o que desbloqueia jutsu).
 */
export interface PlayerCharacter {
  name: string;
  clan: ClanId;
  affinity: Element;
  level: number;
  /** XP acumulado dentro do nível atual. */
  xp: number;
  baseAttrs: Attributes;
  unspentPoints: number;
  learned: string[];
  learnedAt: Record<string, { level: number; nodeIndex: number }>;
  equipped: string[];
  masteryUses: Record<string, number>;
  equipment: { weapon: string | null; armor: string | null };
  ownedEquipment: string[];
  inventory: Record<string, number>;
  ryo: number;
  reputation: number;
  titleId: string | null;
  transformTurns: number;
  rareScrollsUsed: number;
  hp: number;
  chakra: number;
}

export interface CreateParams {
  name: string;
  clan: ClanId;
  affinity: Element;
  allocation: Partial<Attributes>;
  titleId: string | null;
}

function normalizeAllocation(a: Partial<Attributes>): Attributes {
  const out = emptyAttributes(0);
  for (const k of ATTR_KEYS) {
    const v = a[k] ?? 0;
    if (!Number.isInteger(v) || v < 0) throw new RuleError('invalidAllocation', `Valor inválido em ${k}: ${v}`);
    out[k] = v;
  }
  return out;
}

export function createCharacter(p: CreateParams): PlayerCharacter {
  const name = p.name.trim();
  if (name.length < 1 || name.length > 20) throw new RuleError('invalidName', 'O nome precisa ter de 1 a 20 caracteres.');
  const clan = CLANS[p.clan];
  if (!clan?.playable) throw new RuleError('invalidClan', `Clã não jogável: ${p.clan}`);
  const alloc = normalizeAllocation(p.allocation);
  if (sumAttributes(alloc) !== B.attributes.creationPoints) {
    throw new RuleError('invalidAllocation', `Distribua exatamente ${B.attributes.creationPoints} pontos.`);
  }
  const c: PlayerCharacter = {
    name,
    clan: p.clan,
    affinity: clan.fixedAffinity ?? p.affinity,
    level: 1,
    xp: 0,
    baseAttrs: addAttributes(emptyAttributes(B.attributes.start), alloc),
    unspentPoints: 0,
    learned: [],
    learnedAt: {},
    equipped: [],
    masteryUses: {},
    equipment: { weapon: null, armor: null },
    ownedEquipment: [],
    inventory: {},
    ryo: 0,
    reputation: 0,
    titleId: p.titleId,
    transformTurns: 0,
    rareScrollsUsed: 0,
    hp: 0,
    chakra: 0,
  };
  c.hp = characterMaxHp(c);
  c.chakra = characterMaxChakra(c);
  return c;
}

export function equipmentBonus(c: PlayerCharacter): Attributes {
  let bonus = emptyAttributes(0);
  for (const id of [c.equipment.weapon, c.equipment.armor]) {
    if (id) bonus = addAttributes(bonus, ITEMS[id]?.attrBonus ?? {});
  }
  return bonus;
}

/** Base + equipamento (sem efeitos de batalha). */
export function effectiveAttrs(c: PlayerCharacter): Attributes {
  return addAttributes(c.baseAttrs, equipmentBonus(c));
}

export function characterMaxHp(c: PlayerCharacter): number {
  return maxHp(effectiveAttrs(c).hp, c.level, CLANS[c.clan].hpMult);
}

export function characterMaxChakra(c: PlayerCharacter): number {
  return maxChakra(effectiveAttrs(c).int, c.level);
}

/**
 * Helper interno: MUTA `c`, limitando HP/chakra ao máximo.
 * Só deve ser chamado sobre uma cópia já clonada (nunca sobre o argumento de uma função pública).
 */
export function clampVitals(c: PlayerCharacter): void {
  c.hp = Math.max(0, Math.min(characterMaxHp(c), c.hp));
  c.chakra = Math.max(0, Math.min(characterMaxChakra(c), c.chakra));
}

/** Gasta pontos livres. Ao subir o máximo de HP/chakra, o valor atual sobe junto. */
export function allocatePoints(c: PlayerCharacter, alloc: Partial<Attributes>): PlayerCharacter {
  const a = normalizeAllocation(alloc);
  const total = sumAttributes(a);
  if (total > c.unspentPoints) throw new RuleError('notEnoughPoints', `Você só tem ${c.unspentPoints} ponto(s).`);
  const hpBefore = characterMaxHp(c);
  const chBefore = characterMaxChakra(c);
  const next = structuredClone(c);
  next.baseAttrs = addAttributes(next.baseAttrs, a);
  next.unspentPoints -= total;
  next.hp += characterMaxHp(next) - hpBefore;
  next.chakra += characterMaxChakra(next) - chBefore;
  clampVitals(next);
  return next;
}

/**
 * Ganha XP e sobe quantos níveis couberem. Por nível: pontos livres do clã,
 * +1 em cada atributo de destaque e cura de 25% do HP máximo (DD v2 §9).
 */
export function gainXp(c: PlayerCharacter, amount: number): { character: PlayerCharacter; levelsGained: number } {
  if (amount < 0) throw new RuleError('invalidXp', 'XP negativo.');
  const next = structuredClone(c);
  const clan = CLANS[next.clan];
  next.xp += amount;
  let levelsGained = 0;
  while (next.xp >= xpToNext(next.level)) {
    const hpBefore = characterMaxHp(next);
    const chBefore = characterMaxChakra(next);
    next.xp -= xpToNext(next.level);
    next.level++;
    levelsGained++;
    next.unspentPoints += clan.freePointsPerLevel;
    for (const k of clan.highlights) next.baseAttrs[k] += 1;
    const hpMax = characterMaxHp(next);
    next.hp += hpMax - hpBefore + Math.round(hpMax * B.recovery.levelUpHpPct);
    next.chakra += characterMaxChakra(next) - chBefore;
    clampVitals(next);
  }
  return { character: next, levelsGained };
}

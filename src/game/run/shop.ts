import { BALANCE as B } from '../Balance';
import { RuleError } from '../errors';
import type { Rng } from '../Rng';
import { ATTR_KEYS, type AttrKey } from '../types';
import { CONSUMABLE_IDS, EQUIPMENT_POOL, ITEMS } from '../../data/items';
import { TITLES } from '../../data/titles';
import { characterMaxChakra, characterMaxHp, clampVitals, type PlayerCharacter } from '../progression/character';

/**
 * Loja (DD v2 §11). Consumíveis sempre à venda; 2 equipamentos sorteados;
 * 1 Pergaminho Raro por estoque. O estoque renova no início e após cada chefe.
 */
export interface ShopStock {
  consumables: string[];
  equipment: string[];
  rareScrolls: number;
}

export function generateStock(rng: Rng): ShopStock {
  return {
    consumables: [...CONSUMABLE_IDS],
    equipment: rng.shuffle(EQUIPMENT_POOL).slice(0, B.shop.equipmentOffers),
    rareScrolls: B.shop.rareScrollsPerStock,
  };
}

export function priceOf(itemId: string, c: PlayerCharacter): number {
  const item = ITEMS[itemId];
  if (!item) throw new RuleError('unknownItem', `Item desconhecido: ${itemId}`);
  const pct = c.titleId ? (TITLES[c.titleId]?.mods.shopPricePct ?? 0) : 0;
  return Math.round(item.price * (1 + pct));
}

export function buyItem(c: PlayerCharacter, stock: ShopStock, itemId: string): { character: PlayerCharacter; stock: ShopStock } {
  const item = ITEMS[itemId];
  if (!item) throw new RuleError('unknownItem', `Item desconhecido: ${itemId}`);
  if (item.kind === 'consumable' && !stock.consumables.includes(itemId)) throw new RuleError('notInStock', 'Item fora do estoque.');
  if (item.kind === 'rareScroll' && stock.rareScrolls <= 0) throw new RuleError('notInStock', 'Sem Pergaminho Raro neste estoque.');
  if (item.kind === 'weapon' || item.kind === 'armor') {
    if (!stock.equipment.includes(itemId)) throw new RuleError('notInStock', 'Item fora do estoque.');
    if (c.ownedEquipment.includes(itemId)) throw new RuleError('alreadyOwned', 'Você já possui este equipamento.');
  }
  const price = priceOf(itemId, c);
  if (c.ryo < price) throw new RuleError('notEnoughRyo', `Faltam ${price - c.ryo} ryo.`);

  const character = structuredClone(c);
  const next = structuredClone(stock);
  character.ryo -= price;
  if (item.kind === 'consumable' || item.kind === 'rareScroll') {
    character.inventory[itemId] = (character.inventory[itemId] ?? 0) + 1;
  }
  if (item.kind === 'rareScroll') next.rareScrolls--;
  if (item.kind === 'weapon' || item.kind === 'armor') {
    character.ownedEquipment.push(itemId);
    next.equipment = next.equipment.filter((id) => id !== itemId);
  }
  return { character, stock: next };
}

/** Troca de equipamento (fora de batalha). HP/chakra atuais acompanham a mudança do máximo. */
export function equipItem(c: PlayerCharacter, itemId: string): PlayerCharacter {
  const item = ITEMS[itemId];
  if (!item || (item.kind !== 'weapon' && item.kind !== 'armor')) throw new RuleError('notEquipment', 'Isto não é um equipamento.');
  if (!c.ownedEquipment.includes(itemId)) throw new RuleError('notOwned', 'Você não possui este equipamento.');
  const hpBefore = characterMaxHp(c);
  const chBefore = characterMaxChakra(c);
  const next = structuredClone(c);
  if (item.kind === 'weapon') next.equipment.weapon = itemId;
  else next.equipment.armor = itemId;
  next.hp += characterMaxHp(next) - hpBefore;
  next.chakra += characterMaxChakra(next) - chBefore;
  clampVitals(next);
  return next;
}

/** +1 permanente (na run) no atributo BASE — por isso pode desbloquear jutsu. Limite 5 por run. */
export function useRareScroll(c: PlayerCharacter, attr: AttrKey): PlayerCharacter {
  if (!ATTR_KEYS.includes(attr)) throw new RuleError('invalidAttr', `Atributo inválido: ${attr}`);
  if ((c.inventory['pergaminho_raro'] ?? 0) <= 0) throw new RuleError('noItem', 'Você não tem Pergaminho Raro.');
  if (c.rareScrollsUsed >= B.shop.rareScrollMaxPerRun) {
    throw new RuleError('rareScrollLimit', `Limite de ${B.shop.rareScrollMaxPerRun} Pergaminhos Raros por run.`);
  }
  const hpBefore = characterMaxHp(c);
  const chBefore = characterMaxChakra(c);
  const next = structuredClone(c);
  next.inventory['pergaminho_raro'] = (next.inventory['pergaminho_raro'] ?? 0) - 1;
  next.rareScrollsUsed++;
  next.baseAttrs[attr]++;
  next.hp += characterMaxHp(next) - hpBefore;
  next.chakra += characterMaxChakra(next) - chBefore;
  clampVitals(next);
  return next;
}

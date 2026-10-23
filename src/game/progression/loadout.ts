import { BALANCE as B } from '../Balance';
import { RuleError } from '../errors';
import type { PlayerCharacter } from './character';

/** Slots por rank ninja (DD v2 §8). No MVP todo personagem é Genin. */
export function slotCount(_c: PlayerCharacter): number {
  return B.loadout.geninSlots;
}

export function equipJutsu(c: PlayerCharacter, jutsuId: string, replaceId: string | null = null): PlayerCharacter {
  if (!c.learned.includes(jutsuId)) throw new RuleError('notLearned', 'Jutsu ainda não aprendido.');
  if (c.equipped.includes(jutsuId)) throw new RuleError('alreadyEquipped', 'Jutsu já equipado.');
  const next = structuredClone(c);
  if (next.equipped.length < slotCount(next)) {
    next.equipped.push(jutsuId);
    return next;
  }
  const idx = replaceId ? next.equipped.indexOf(replaceId) : -1;
  if (idx < 0) throw new RuleError('slotsFull', 'Todos os slots estão ocupados: escolha qual jutsu substituir.');
  next.equipped[idx] = jutsuId;
  return next;
}

export function unequipJutsu(c: PlayerCharacter, jutsuId: string): PlayerCharacter {
  const next = structuredClone(c);
  next.equipped = next.equipped.filter((id) => id !== jutsuId);
  return next;
}

/** Define o conjunto inteiro de uma vez (tela de slots e robô do simulador). */
export function setLoadout(c: PlayerCharacter, ids: string[]): PlayerCharacter {
  if (ids.length > slotCount(c)) throw new RuleError('slotsFull', `No máximo ${slotCount(c)} jutsus equipados.`);
  if (new Set(ids).size !== ids.length) throw new RuleError('duplicate', 'Jutsu repetido.');
  for (const id of ids) if (!c.learned.includes(id)) throw new RuleError('notLearned', `Jutsu não aprendido: ${id}`);
  const next = structuredClone(c);
  next.equipped = [...ids];
  return next;
}

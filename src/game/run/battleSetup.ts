import { CLANS } from '../../data/clans';
import { TITLES } from '../../data/titles';
import type { Combatant } from '../combat/types';
import {
  characterMaxChakra,
  characterMaxHp,
  clampVitals,
  effectiveAttrs,
  type PlayerCharacter,
} from '../progression/character';

/** Converte o personagem da run num combatente (atributos base + equipamento; passivas de clã e título). */
export function playerToCombatant(c: PlayerCharacter): Combatant {
  const clan = CLANS[c.clan];
  const title = c.titleId ? TITLES[c.titleId] : undefined;
  return {
    id: 'player',
    name: c.name,
    side: 'player',
    level: c.level,
    grade: null,
    isBoss: false,
    clan: c.clan,
    element: c.affinity,
    attrs: effectiveAttrs(c),
    maxHp: characterMaxHp(c),
    hp: c.hp,
    maxChakra: characterMaxChakra(c),
    chakra: c.chakra,
    damageMult: 1,
    jutsus: [...c.equipped],
    masteryUses: { ...c.masteryUses },
    inventory: { ...c.inventory },
    passiveMods: title ? [clan.passiveMods, title.mods] : [clan.passiveMods],
    transformationId: clan.transformationId,
    transformTurns: c.transformTurns,
    effects: [],
    tenacity: 0,
    defending: false,
    ai: 'player',
    templateId: null,
    aiOpened: false,
  };
}

/** Traz de volta para o personagem o que a batalha mudou: HP, chakra, maestria, itens, turnos de transformação. */
export function applyBattleResult(c: PlayerCharacter, p: Combatant): PlayerCharacter {
  const next = structuredClone(c);
  next.hp = p.hp;
  next.chakra = p.chakra;
  next.masteryUses = { ...p.masteryUses };
  next.inventory = { ...p.inventory };
  next.transformTurns = p.transformTurns;
  clampVitals(next);
  return next;
}

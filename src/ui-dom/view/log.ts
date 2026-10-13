import type { GameEvent } from '../../game/events';
import { EFFECTS } from '../../data/effects';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { t } from '../../i18n/pt-BR';

/**
 * Converte um evento do motor numa linha do log de batalha (DD v2 §13).
 * A cor vem do `kind`, mas o texto sozinho já diz o que aconteceu
 * (spec §10: nenhuma informação só por cor).
 */
export type LogKind = 'player' | 'enemy' | 'damage' | 'heal' | 'effect' | 'system';

export interface LogLine {
  kind: LogKind;
  text: string;
}

const jutsuName = (id: string) => JUTSUS[id]?.name ?? id;
const effectName = (id: string) => EFFECTS[id]?.name ?? id;
const itemName = (id: string) => ITEMS[id]?.name ?? id;

export function formatEvent(e: GameEvent, names: Record<string, string>): LogLine | null {
  const n = (id: string) => names[id] ?? id;
  const side = (id: string): LogKind => (id === 'player' ? 'player' : 'enemy');
  switch (e.type) {
    case 'battleStart':
      return { kind: 'system', text: t('log.battleStart', { enemy: n(e.enemyId) }) };
    case 'roundStart':
      return { kind: 'system', text: t('log.round', { n: e.round }) };
    case 'actionChosen':
      return e.action.type === 'attack' ? { kind: side(e.actorId), text: t('log.attack', { who: n(e.actorId) }) } : null;
    case 'jutsuUsed':
      return { kind: side(e.actorId), text: t('log.jutsu', { who: n(e.actorId), jutsu: jutsuName(e.jutsuId), cost: e.cost }) };
    case 'damage': {
      const base = t(e.crit ? 'log.damageCrit' : 'log.damage', { target: n(e.targetId), amount: e.amount });
      const elem = e.elementMult > 1 ? t('log.superEffective') : e.elementMult < 1 ? t('log.notEffective') : '';
      return { kind: 'damage', text: base + elem };
    }
    case 'dodge':
      return { kind: side(e.targetId), text: t('log.dodge', { target: n(e.targetId) }) };
    case 'miss':
      return { kind: side(e.targetId), text: t('log.missHenge', { who: n(e.sourceId) }) };
    case 'negated':
      return {
        kind: side(e.targetId),
        text: t(e.reason === 'kawarimi' ? 'log.negatedKawarimi' : 'log.negatedClone', { target: n(e.targetId) }),
      };
    case 'dot':
      return { kind: 'damage', text: t('log.dot', { target: n(e.targetId), amount: e.amount, effect: effectName(e.effectId) }) };
    case 'heal':
      return { kind: 'heal', text: t('log.heal', { target: n(e.targetId), hp: e.hp, chakra: e.chakra }) };
    case 'defend':
      return { kind: side(e.actorId), text: t('log.defend', { who: n(e.actorId), chakra: e.chakra }) };
    case 'meditate':
      return { kind: side(e.actorId), text: t('log.meditate', { who: n(e.actorId), chakra: e.chakra }) };
    case 'itemUsed':
      return { kind: side(e.actorId), text: t('log.item', { who: n(e.actorId), item: itemName(e.itemId) }) };
    case 'effectApplied':
      return {
        kind: 'effect',
        text:
          e.remaining === null
            ? t('log.effectOnSustained', { target: n(e.targetId), effect: effectName(e.effectId) })
            : t(e.remaining === 1 ? 'log.effectOnOne' : 'log.effectOn', {
                target: n(e.targetId),
                effect: effectName(e.effectId),
                turns: e.remaining,
              }),
      };
    case 'effectResisted':
      return {
        kind: 'effect',
        text: t(e.reason === 'tenacity' ? 'log.resistedTenacity' : 'log.resisted', {
          target: n(e.targetId),
          effect: effectName(e.effectId),
        }),
      };
    case 'effectExpired':
      return { kind: 'effect', text: t('log.effectOff', { target: n(e.targetId), effect: effectName(e.effectId) }) };
    case 'controlledSkip':
      return { kind: 'effect', text: t('log.skip', { who: n(e.actorId), effect: effectName(e.effectId) }) };
    case 'transformOn':
      return { kind: 'effect', text: t('log.transformOn', { who: n(e.actorId), form: effectName(e.transformationId) }) };
    case 'transformOff':
      return {
        kind: 'effect',
        text: t(e.reason === 'noChakra' ? 'log.transformOffNoChakra' : 'log.transformOff', {
          who: n(e.actorId),
          form: effectName(e.transformationId),
        }),
      };
    case 'masteryUp':
      return { kind: 'player', text: t('log.mastery', { jutsu: jutsuName(e.jutsuId), level: e.level }) };
    case 'defeated':
      return { kind: 'system', text: t('log.defeated', { target: n(e.targetId) }) };
    case 'battleEnd':
      if (e.winner === 'player') return { kind: 'system', text: t('log.victory') };
      return { kind: 'system', text: t(e.reason === 'timeout' ? 'log.timeout' : 'log.defeat') };
    case 'reward':
      return { kind: 'system', text: t('log.reward', { xp: e.xp, ryo: e.ryo, rep: e.rep }) };
    case 'levelUp':
      return { kind: 'system', text: t('log.levelUp', { level: e.level }) };
    case 'jutsuLearned':
      return { kind: 'system', text: t('log.learned', { jutsu: jutsuName(e.jutsuId) }) };
    default:
      return null;
  }
}

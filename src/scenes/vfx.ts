import { ELEMENT_HIT_FX, JUTSU_FX, JUTSU_FX_ON_OPPONENT, STATUS_FX, type VfxName } from '../data/art';
import { JUTSUS } from '../data/jutsus';
import type { GameEvent } from '../game/events';

export interface VfxPlay {
  name: VfxName;
  /** Id do lutador sobre quem o efeito aparece. */
  on: string;
}

/**
 * Quais efeitos visuais um evento do motor dispara (sem Phaser, testável).
 * `opponentOf` devolve o id do outro lutador (para jutsus que afetam o oponente).
 */
export function vfxForEvent(e: GameEvent, opponentOf: (id: string) => string | undefined): VfxPlay[] {
  switch (e.type) {
    case 'damage': {
      const j = e.jutsuId ? JUTSUS[e.jutsuId] : undefined;
      const base: VfxName = !e.jutsuId ? 'fx_hit' : ((e.jutsuId && JUTSU_FX[e.jutsuId]) || (j?.element ? ELEMENT_HIT_FX[j.element] : 'fx_hit_neutro'));
      return e.crit ? [{ name: base, on: e.targetId }, { name: 'fx_crit', on: e.targetId }] : [{ name: base, on: e.targetId }];
    }
    case 'jutsuUsed': {
      const j = JUTSUS[e.jutsuId];
      const fx = JUTSU_FX[e.jutsuId];
      // Jutsu de dano mostra o golpe no evento `damage`; o de suporte, aqui.
      if (!fx || !j || j.power !== null) return [];
      const on = JUTSU_FX_ON_OPPONENT.has(e.jutsuId) ? opponentOf(e.actorId) : e.actorId;
      return on ? [{ name: fx, on }] : [];
    }
    case 'dodge':
      return [{ name: 'fx_dodge', on: e.targetId }];
    case 'heal':
      return [{ name: 'fx_heal', on: e.targetId }];
    case 'defend':
      return [{ name: 'fx_defend', on: e.actorId }];
    case 'meditate':
      return [{ name: 'fx_chakra', on: e.actorId }];
    case 'effectApplied': {
      const fx = STATUS_FX[e.effectId];
      return fx ? [{ name: fx, on: e.targetId }] : [];
    }
    case 'effectResisted':
    case 'negated':
      return [{ name: 'fx_resisted', on: e.targetId }];
    case 'transformOn':
      return [{ name: 'fx_transform_on', on: e.actorId }];
    case 'defeated':
      return [{ name: 'fx_defeated', on: e.targetId }];
    default:
      return [];
  }
}

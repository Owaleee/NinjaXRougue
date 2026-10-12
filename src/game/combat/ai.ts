import type { Action, BattleState, Combatant } from './types';

/** Versão mínima: sempre ataca. A Task 8 implementa as regras do DD v2 §9. */
export function chooseAiAction(_s: BattleState, _self: Combatant): Action {
  return { type: 'attack' };
}

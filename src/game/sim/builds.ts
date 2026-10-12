import type { AttrKey, ClanId, Element } from '../types';

/**
 * As 8 builds do Apêndice A.5. "focused" = entra nas metas de calibração.
 * ASSUMIDO: Uzumaki e Sem clã usam afinidade Vento (Daitoppa é o único jutsu
 * elemental de dano da afinidade deles na Onda); "Semi-equilibrado" não tinha
 * pesos no DD v2 e recebeu os abaixo.
 */
export interface BuildDef {
  id: string;
  label: string;
  clan: ClanId;
  affinity: Element;
  weights: Partial<Record<AttrKey, number>>;
  focused: boolean;
}

const NIN = { nin: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 };
const TAI = { tai: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 };
const SEMI = { nin: 0.25, tai: 0.2, hp: 0.15, def: 0.15, vel: 0.15, int: 0.1 };
const ALL = { hp: 0.125, tai: 0.125, nin: 0.125, gen: 0.125, vel: 0.125, int: 0.125, crit: 0.125, def: 0.125 };

export const SIM_BUILDS: BuildDef[] = [
  { id: 'nin-uchiha', label: 'Ninjutsu / Uchiha', clan: 'uchiha', affinity: 'fogo', weights: NIN, focused: true },
  { id: 'nin-uzumaki', label: 'Ninjutsu / Uzumaki', clan: 'uzumaki', affinity: 'vento', weights: NIN, focused: true },
  { id: 'nin-semcla', label: 'Ninjutsu / Sem clã', clan: 'semcla', affinity: 'vento', weights: NIN, focused: true },
  { id: 'tai-uchiha', label: 'Taijutsu / Uchiha', clan: 'uchiha', affinity: 'fogo', weights: TAI, focused: true },
  { id: 'tai-uzumaki', label: 'Taijutsu / Uzumaki', clan: 'uzumaki', affinity: 'vento', weights: TAI, focused: true },
  { id: 'tai-semcla', label: 'Taijutsu / Sem clã', clan: 'semcla', affinity: 'vento', weights: TAI, focused: true },
  { id: 'semi-uzumaki', label: 'Semi-equilibrado / Uzumaki', clan: 'uzumaki', affinity: 'vento', weights: SEMI, focused: false },
  { id: 'eq-semcla', label: 'Equilibrado / Sem clã', clan: 'semcla', affinity: 'vento', weights: ALL, focused: false },
];

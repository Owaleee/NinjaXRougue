import type { Attributes, Element, Grade } from '../game/types';

export type ArchetypeId = 'bruto' | 'ninja' | 'espadachim' | 'agil';
export type AiId = 'basic' | 'zabuza' | 'haku';

/** Pesos (somam 1) para distribuir os pontos do inimigo — Apêndice A.4. */
export const ARCHETYPES: Record<ArchetypeId, Attributes> = {
  bruto: { hp: 0.22, tai: 0.25, nin: 0.04, gen: 0.02, vel: 0.12, int: 0.05, crit: 0.1, def: 0.2 },
  ninja: { hp: 0.18, tai: 0.18, nin: 0.2, gen: 0.03, vel: 0.14, int: 0.07, crit: 0.08, def: 0.12 },
  espadachim: { hp: 0.2, tai: 0.22, nin: 0.18, gen: 0.04, vel: 0.12, int: 0.06, crit: 0.08, def: 0.1 },
  agil: { hp: 0.12, tai: 0.1, nin: 0.24, gen: 0.04, vel: 0.28, int: 0.06, crit: 0.1, def: 0.06 },
};

export interface EnemyTemplate {
  id: string;
  name: string;
  archetype: ArchetypeId;
  grade: Grade;
  element: Element | null;
  jutsus: string[];
  ai: AiId;
  isBoss: boolean;
}

export const ENEMY_LIST: EnemyTemplate[] = [
  { id: 'bandido', name: 'Bandido', archetype: 'bruto', grade: 'D', element: null, jutsus: ['golpe_pesado'], ai: 'basic', isBoss: false },
  { id: 'ninja_renegado', name: 'Ninja Renegado', archetype: 'ninja', grade: 'D', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'mercenario_nevoa', name: 'Mercenário da Névoa', archetype: 'ninja', grade: 'D', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'bandido_veterano', name: 'Bandido Veterano', archetype: 'bruto', grade: 'D+', element: null, jutsus: ['golpe_pesado'], ai: 'basic', isBoss: false },
  { id: 'renegado_veterano', name: 'Renegado Veterano', archetype: 'ninja', grade: 'D+', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'mercenario_veterano', name: 'Mercenário Veterano', archetype: 'ninja', grade: 'D+', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'zabuza', name: 'Zabuza Momochi', archetype: 'espadachim', grade: 'C', element: 'agua', jutsus: ['kubikiribouchou', 'kirigakure', 'suiryuudan', 'muon_satsujin'], ai: 'zabuza', isBoss: true },
  { id: 'haku', name: 'Haku', archetype: 'agil', grade: 'B', element: 'agua', jutsus: ['senbon', 'makyou_hyoushou', 'sensatsu_suishou'], ai: 'haku', isBoss: true },
];

export const ENEMIES: Record<string, EnemyTemplate> = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e]));

/** Qual elite (D+) substitui cada comum na bifurcação do mapa. */
export const ELITE_OF: Record<string, string> = {
  bandido: 'bandido_veterano',
  ninja_renegado: 'renegado_veterano',
  mercenario_nevoa: 'mercenario_veterano',
};

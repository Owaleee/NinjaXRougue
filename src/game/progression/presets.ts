import { allocationByWeights } from '../sim/bot';
import type { AttrKey, Attributes } from '../types';

/**
 * Presets de distribuição de pontos (spec C9 e §6). Existem porque builds
 * espalhadas travam em Zabuza (DD v2 A.5): o jogador recebe um caminho
 * seguro, mas continua livre para distribuir à mão.
 * Reaproveita o algoritmo do robô do simulador. Os presets ninjutsu e taijutsu
 * são iguais aos builds que o simulador mediu (SIM_BUILDS); o equilibrado não é
 * medido pelo simulador.
 */
export const PRESET_IDS = ['ninjutsu', 'taijutsu', 'equilibrado'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const PRESET_WEIGHTS: Record<PresetId, Partial<Record<AttrKey, number>>> = {
  ninjutsu: { nin: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 },
  taijutsu: { tai: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 },
  equilibrado: { nin: 0.3, tai: 0.1, hp: 0.2, def: 0.15, vel: 0.15, int: 0.1 },
};

/** Pontos a SOMAR (não o total final) para aproximar a build do preset. */
export function presetAllocation(current: Attributes, points: number, preset: PresetId): Attributes {
  return allocationByWeights(current, points, PRESET_WEIGHTS[preset]);
}

import type { AttrKey, ClanId, Element, Modifiers } from '../game/types';

export interface ClanDef {
  id: ClanId;
  name: string;
  playable: boolean;
  /** Recebem +1 automático por nível (DD v2 §3). */
  highlights: AttrKey[];
  freePointsPerLevel: number;
  hpMult: number;
  /** Bônus relativo do Meditar (Uzumaki 0,20 → 25% vira 30%). */
  meditateBonus: number;
  fixedAffinity: Element | null;
  passiveMods: Modifiers;
  transformationId: string | null;
  ignoresAffinityPenalty: boolean;
  generalJutsuCostMult: number;
  /** Multiplica os usos exigidos por nível de maestria (Sem clã 0,75). */
  masteryUseMult: number;
  jutsuCostMult: Record<string, number>;
  description: string;
}

const base = {
  playable: false,
  highlights: [] as AttrKey[],
  freePointsPerLevel: 5,
  hpMult: 1,
  meditateBonus: 0,
  fixedAffinity: null,
  passiveMods: {},
  transformationId: null,
  ignoresAffinityPenalty: false,
  generalJutsuCostMult: 1,
  masteryUseMult: 1,
  jutsuCostMult: {},
};

export const CLANS: Record<ClanId, ClanDef> = {
  uchiha: {
    ...base,
    id: 'uchiha',
    name: 'Uchiha',
    playable: true,
    highlights: ['gen', 'crit'],
    fixedAffinity: 'fogo',
    passiveMods: { elementDamagePct: { fogo: 0.15 } },
    transformationId: 'sharingan',
    description: 'Afinidade Fogo fixa (+15% de dano de Fogo) e a transformação Sharingan.',
  },
  uzumaki: {
    ...base,
    id: 'uzumaki',
    name: 'Uzumaki',
    playable: true,
    highlights: ['hp', 'int'],
    hpMult: 1.1,
    meditateBonus: 0.2,
    jutsuCostMult: { kage_bunshin: 0.8 },
    description: '+10% de HP máximo, Meditar +20% e Kage Bunshin −20% de custo.',
  },
  semcla: {
    ...base,
    id: 'semcla',
    name: 'Sem clã',
    playable: true,
    freePointsPerLevel: 6,
    ignoresAffinityPenalty: true,
    generalJutsuCostMult: 0.9,
    masteryUseMult: 0.75,
    description: '+1 ponto livre por nível, sem penalidade de afinidade, jutsus gerais −10% de custo e maestria 25% mais rápida.',
  },
  hyuuga: { ...base, id: 'hyuuga', name: 'Hyuuga', highlights: ['tai', 'crit'], description: 'Fase 2.' },
  nara: { ...base, id: 'nara', name: 'Nara', highlights: ['int', 'vel'], description: 'Fase 2.' },
  akimichi: { ...base, id: 'akimichi', name: 'Akimichi', highlights: ['hp', 'def'], hpMult: 1.15, description: 'Fase 2.' },
  aburame: { ...base, id: 'aburame', name: 'Aburame', highlights: ['nin', 'int'], description: 'Fase 2.' },
};

export const PLAYABLE_CLANS: ClanId[] = ['uchiha', 'uzumaki', 'semcla'];

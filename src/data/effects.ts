import { ATTR_NAMES } from '../game/attributes';
import type { AttrKey, ControlKind, EffectType, Modifiers } from '../game/types';

/**
 * Definição de um efeito (DD v2 §10). Um único formato cobre buff, debuff,
 * controle, dano contínuo e transformação — por isso Modo Sábio/Bijuu no
 * futuro são só dados novos, não código novo.
 */
export interface EffectDef {
  id: string;
  name: string;
  type: EffectType;
  icon: string;
  controlKind?: ControlKind;
  mods?: Modifiers;
  /** Dano contínuo: fração do HP máximo do alvo por turno. */
  dotPctMaxHp?: number;
  /** Carga consumida pelo próximo golpe recebido. */
  charge?: 'negateHit' | 'absorbHit' | 'missChance';
  /** Para 'missChance': probabilidade de o golpe errar. */
  chargeChance?: number;
  /** Turnos do PRÓPRIO portador; 'sustained' = enquanto pagar o custo. */
  duration: number | 'battle' | 'sustained';
  removableByKai?: boolean;
  activationCost?: number;
  activationCostsTurn?: boolean;
  upkeepPerTurn?: number;
  description: string;
}

export const REFORCO_ATTRS = ['tai', 'nin', 'gen', 'vel', 'def'] as const;
export type ReforcoAttr = (typeof REFORCO_ATTRS)[number];

const reforcos: EffectDef[] = REFORCO_ATTRS.map((a) => ({
  id: `reforco_${a}`,
  name: `Reforço de ${ATTR_NAMES[a]}`,
  type: 'buff' as const,
  icon: 'scroll',
  mods: { attrPct: { [a]: 0.1 } as Partial<Record<AttrKey, number>> },
  duration: 5,
  description: `+10% de ${ATTR_NAMES[a]} por 5 turnos.`,
}));

export const EFFECT_LIST: EffectDef[] = [
  { id: 'queimadura', name: 'Queimadura', type: 'dot', icon: 'burn', dotPctMaxHp: 0.04, duration: 3, description: 'Perde 4% do HP máximo por turno.' },
  { id: 'defesa_reduzida', name: 'Defesa Reduzida', type: 'debuff', icon: 'def-down', mods: { attrPct: { def: -0.05 } }, duration: 2, description: '−5% de Defesa.' },
  { id: 'lentidao', name: 'Lentidão', type: 'debuff', icon: 'slow', mods: { attrPct: { vel: -0.2 } }, duration: 2, description: '−20% de Velocidade.' },
  { id: 'imobilizado', name: 'Imobilizado', type: 'control', icon: 'chains', controlKind: 'immobilized', duration: 2, description: 'Não pode agir.' },
  { id: 'atordoado', name: 'Atordoado', type: 'control', icon: 'stun', controlKind: 'stunned', duration: 1, description: 'Não pode agir.' },
  { id: 'ilusao', name: 'Ilusão', type: 'control', icon: 'eye', controlKind: 'illusion', duration: 1, removableByKai: true, description: 'Preso num genjutsu: só pode usar Kai.' },
  { id: 'henge', name: 'Henge', type: 'buff', icon: 'mask', charge: 'missChance', chargeChance: 0.3, duration: 1, description: '30% de chance de o próximo golpe inimigo errar.' },
  { id: 'bunshin', name: 'Clones Ilusórios', type: 'buff', icon: 'clones', mods: { dodge: 0.12 }, duration: 2, description: '+12% de esquiva.' },
  { id: 'kawarimi', name: 'Substituição', type: 'buff', icon: 'log', charge: 'negateHit', duration: 2, description: 'Anula o próximo golpe recebido.' },
  { id: 'doryuuheki', name: 'Muralha de Lama', type: 'buff', icon: 'wall', mods: { reduction: 0.25 }, duration: 3, description: '+25% de redução de dano.' },
  { id: 'kage_bunshin', name: 'Clones das Sombras', type: 'buff', icon: 'shadow-clones', mods: { jutsuDamagePct: 0.25 }, charge: 'absorbHit', duration: 3, description: '+25% de dano em jutsus; um clone absorve 1 golpe.' },
  { id: 'nevoa', name: 'Névoa', type: 'buff', icon: 'mist', mods: { dodge: 0.15 }, duration: 3, description: '+15% de esquiva.' },
  { id: 'makyou', name: 'Espelhos de Gelo', type: 'buff', icon: 'mirrors', mods: { dodge: 0.25 }, duration: 3, description: '+25% de esquiva.' },
  {
    id: 'sharingan',
    name: 'Sharingan',
    type: 'transformation',
    icon: 'sharingan',
    mods: { crit: 0.14, dodge: 0.1, jutsuDamagePct: 0.15 },
    duration: 'sustained',
    activationCost: 0,
    activationCostsTurn: false,
    upkeepPerTurn: 2,
    description: 'Transformação (tomoe 1): +14% de crítico, +10% de esquiva e +15% de dano de jutsus. Custa 2 de chakra por turno.',
  },
  ...reforcos,
];

export const EFFECTS: Record<string, EffectDef> = Object.fromEntries(EFFECT_LIST.map((e) => [e.id, e]));

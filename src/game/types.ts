/**
 * Tipos de domínio do jogo. As listas "as const" existem para que o mesmo
 * conjunto de valores sirva tanto para o TypeScript (tipos) quanto para o
 * Zod (validação dos dados em tempo de execução).
 */
export const ATTR_KEYS = ['hp', 'tai', 'nin', 'gen', 'vel', 'int', 'crit', 'def'] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];
export type Attributes = Record<AttrKey, number>;

/** Ordem da roda: cada elemento vence o seguinte (o último vence o primeiro). */
export const ELEMENTS = ['fogo', 'vento', 'raio', 'terra', 'agua'] as const;
export type Element = (typeof ELEMENTS)[number];

/** "Grau" = escala D..S de jutsus, inimigos e itens (nunca chamar de "rank"). */
export const GRADES = ['D', 'D+', 'C', 'B', 'A', 'S'] as const;
export type Grade = (typeof GRADES)[number];

export const CLAN_IDS = ['uchiha', 'uzumaki', 'semcla', 'hyuuga', 'nara', 'akimichi', 'aburame'] as const;
export type ClanId = (typeof CLAN_IDS)[number];

export const JUTSU_CATEGORIES = ['ninjutsu', 'taijutsu', 'genjutsu', 'fuinjutsu'] as const;
export type JutsuCategory = (typeof JUTSU_CATEGORIES)[number];

export const PHASES = ['F0', 'F1A', 'F1B', 'F2', 'F3', 'Futuro'] as const;
export type Phase = (typeof PHASES)[number];

/**
 * Pontos da história em ordem cronológica. "saga mínima" de um jutsu
 * compara posições nesta lista.
 */
export const STORY_POINTS = [
  'inicio',
  'onda',
  'onda_pos_zabuza',
  'exame_chunin_inicio',
  'exame_chunin_floresta',
  'exame_chunin_preliminares',
  'exame_chunin',
  'exame_chunin_finais',
  'busca_tsunade',
  'recuperacao_sasuke',
  'shippuden',
  'perseguicao_itachi',
] as const;
export type StoryPointId = (typeof STORY_POINTS)[number];

export type ControlKind = 'immobilized' | 'stunned' | 'illusion';
export type EffectType = 'buff' | 'debuff' | 'control' | 'dot' | 'transformation';

/**
 * Modificadores de combate/economia. Todos em FRAÇÃO (0.10 = 10%).
 * Somam-se de forma aditiva (spec C2: um único "balde" de bônus).
 */
export interface Modifiers {
  attrPct?: Partial<Record<AttrKey, number>>;
  dodge?: number;
  crit?: number;
  damagePct?: number;
  jutsuDamagePct?: number;
  elementDamagePct?: Partial<Record<Element, number>>;
  reduction?: number;
  chakraCostPct?: number;
  ryoPct?: number;
  repPct?: number;
  shopPricePct?: number;
}

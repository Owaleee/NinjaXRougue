import { ATTR_KEYS, type AttrKey, type Attributes, type JutsuCategory } from './types';

export const ATTR_NAMES: Record<AttrKey, string> = {
  hp: 'HP',
  tai: 'Taijutsu',
  nin: 'Ninjutsu',
  gen: 'Genjutsu',
  vel: 'Velocidade',
  int: 'Inteligência',
  crit: 'Chance de Crítico',
  def: 'Defesa',
};

/** Qual atributo escala o dano de cada categoria de jutsu (DD v2 §8). */
export const CATEGORY_ATTR: Record<JutsuCategory, AttrKey> = {
  ninjutsu: 'nin',
  taijutsu: 'tai',
  genjutsu: 'gen',
  fuinjutsu: 'int',
};

export function emptyAttributes(value = 0): Attributes {
  return { hp: value, tai: value, nin: value, gen: value, vel: value, int: value, crit: value, def: value };
}

/** Soma b em a e devolve um objeto novo (não muta a). */
export function addAttributes(a: Attributes, b: Partial<Attributes>): Attributes {
  const out = { ...a };
  for (const k of ATTR_KEYS) out[k] += b[k] ?? 0;
  return out;
}

export function sumAttributes(a: Partial<Attributes>): number {
  return ATTR_KEYS.reduce((s, k) => s + (a[k] ?? 0), 0);
}

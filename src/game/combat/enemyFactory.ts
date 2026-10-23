import { BALANCE as B } from '../Balance';
import { emptyAttributes, sumAttributes } from '../attributes';
import { RuleError } from '../errors';
import { expectedPoints, maxChakra, maxHp } from '../formulas';
import { ATTR_KEYS, type Attributes } from '../types';
import { ARCHETYPES, ENEMIES } from '../../data/enemies';
import type { Combatant } from './types';

/**
 * Distribui `total` pontos pelos pesos (soma 1) com o método do maior resto,
 * garantindo no mínimo 1 em cada atributo. O resultado soma exatamente `total`.
 */
export function distributePoints(total: number, weights: Attributes): Attributes {
  const raw = ATTR_KEYS.map((k) => ({ k, v: total * weights[k] }));
  const out = emptyAttributes(0);
  for (const r of raw) out[r.k] = Math.max(1, Math.floor(r.v));
  let diff = total - sumAttributes(out);
  const byFraction = [...raw].sort((a, b) => b.v - Math.floor(b.v) - (a.v - Math.floor(a.v)));
  for (let i = 0; diff > 0; i++, diff--) out[byFraction[i % byFraction.length]!.k]++;
  while (diff < 0) {
    const largest = ATTR_KEYS.reduce((m, k) => (out[k] > out[m] ? k : m));
    out[largest]--;
    diff++;
  }
  return out;
}

/**
 * Cria um inimigo a partir do NÍVEL DE HISTÓRIA do encontro (não do nível do jogador):
 * pontos = round(P(N) × razão do grau), distribuídos pelo arquétipo (DD v2 §9, spec C5).
 */
export function createEnemy(templateId: string, storyLevel: number): Combatant {
  const t = ENEMIES[templateId];
  if (!t) throw new RuleError('unknownEnemy', `Inimigo desconhecido: ${templateId}`);
  const g = B.enemyGrades[t.grade];
  const attrs = distributePoints(Math.round(expectedPoints(storyLevel) * g.pointsRatio), ARCHETYPES[t.archetype]);
  const hp = Math.round(maxHp(attrs.hp, storyLevel) * g.hpMult);
  const chakra = maxChakra(attrs.int, storyLevel);
  return {
    id: `enemy:${t.id}`,
    name: t.name,
    side: 'enemy',
    level: storyLevel,
    grade: t.grade,
    isBoss: t.isBoss,
    clan: null,
    element: t.element,
    attrs,
    maxHp: hp,
    hp,
    maxChakra: chakra,
    chakra,
    damageMult: g.damageMult,
    jutsus: [...t.jutsus],
    masteryUses: {},
    inventory: {},
    passiveMods: [],
    transformationId: null,
    transformTurns: 0,
    effects: [],
    tenacity: 0,
    defending: false,
    ai: t.ai,
    templateId: t.id,
    aiOpened: false,
  };
}

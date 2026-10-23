import { describe, it, expect } from 'vitest';
import { resolveHit, type HitSpec } from '../src/game/combat/damage';
import { applyEffect, hasEffect } from '../src/game/effects/EffectSystem';
import { makeCombatant, SeqRng } from './helpers';

const attacker = () => makeCombatant({ id: 'a', attrs: { tai: 8, crit: 5, vel: 10 } });
const target = () => makeCombatant({ id: 'd', side: 'enemy', attrs: { def: 10, vel: 10 } });
const atk: HitSpec = { power: 18, attrKey: 'tai', element: null, masteryLevel: 0, jutsuId: null };
const NO_DODGE_NO_CRIT = [0.99, 0.99, 0.5]; // esquiva, crítico, variação (0,5 → ×1,0)

describe('resolveHit', () => {
  it('dano base: 18 × (1 + 8/40) × (1 − 16,7%) = 18', () => {
    const d = target();
    const r = resolveHit(attacker(), d, atk, new SeqRng(NO_DODGE_NO_CRIT));
    expect(r.landed).toBe(true);
    expect(d.hp).toBe(82);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'damage', amount: 18, crit: false, hpAfter: 82 }));
  });

  it('crítico multiplica por 1,5', () => {
    const d = target();
    resolveHit(attacker(), d, atk, new SeqRng([0.99, 0.0, 0.5]));
    expect(d.hp).toBe(73);
  });

  it('esquiva: nenhum dano e landed = false', () => {
    const d = target();
    const r = resolveHit(attacker(), d, atk, new SeqRng([0.0]));
    expect(r.landed).toBe(false);
    expect(d.hp).toBe(100);
    expect(r.events).toEqual([{ type: 'dodge', sourceId: 'a', targetId: 'd' }]);
  });

  it('vantagem elemental e bônus percentuais somam num único balde', () => {
    const a = makeCombatant({ id: 'a', attrs: { nin: 10, crit: 0 }, passiveMods: [{ elementDamagePct: { fogo: 0.15 } }] });
    const d = makeCombatant({ id: 'd', side: 'enemy', element: 'vento', attrs: { def: 0 } });
    resolveHit(a, d, { power: 26, attrKey: 'nin', element: 'fogo', masteryLevel: 0, jutsuId: 'bola_de_fogo' }, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(100 - 49); // 26 × 1,25 × 1,3 × 1,15 = 48,6
  });

  it('maestria +5 soma 15% de dano', () => {
    const d = target();
    resolveHit(attacker(), d, { ...atk, masteryLevel: 5 }, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(100 - 21);
  });

  it('multiplicador de grau do inimigo e Defender reduzem o dano', () => {
    const a = makeCombatant({ id: 'a', attrs: { tai: 8, crit: 5 }, damageMult: 0.6 });
    const d = makeCombatant({ id: 'd', side: 'enemy', attrs: { def: 10 }, defending: true });
    resolveHit(a, d, atk, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(100 - 5); // 18 × 0,6 × 0,5 = 5,4
  });

  it('Kawarimi anula o golpe sem sortear nada', () => {
    const d = target();
    applyEffect(d, 'kawarimi', { sourceId: 'd' });
    const r = resolveHit(attacker(), d, atk, new SeqRng([]));
    expect(r.events).toEqual([{ type: 'negated', sourceId: 'a', targetId: 'd', reason: 'kawarimi' }]);
    expect(hasEffect(d, 'kawarimi')).toBe(false);
    expect(d.hp).toBe(100);
  });

  it('clone do Kage Bunshin absorve um golpe depois da esquiva e mantém o bônus', () => {
    const d = target();
    applyEffect(d, 'kage_bunshin', { sourceId: 'd' });
    const r = resolveHit(attacker(), d, atk, new SeqRng([0.99]));
    expect(r.events).toEqual([{ type: 'negated', sourceId: 'a', targetId: 'd', reason: 'clone' }]);
    expect(hasEffect(d, 'kage_bunshin')).toBe(true);
  });

  it('Henge: 30% de errar, consumido acertando ou não', () => {
    const d1 = target();
    applyEffect(d1, 'henge', { sourceId: 'd' });
    expect(resolveHit(attacker(), d1, atk, new SeqRng([0.1])).events[0]).toMatchObject({ type: 'miss', reason: 'henge' });
    const d2 = target();
    applyEffect(d2, 'henge', { sourceId: 'd' });
    resolveHit(attacker(), d2, atk, new SeqRng([0.5, ...NO_DODGE_NO_CRIT]));
    expect(d2.hp).toBe(82);
    expect(hasEffect(d2, 'henge')).toBe(false);
  });

  it('nunca causa menos de 1 de dano e emite defeated ao zerar', () => {
    const d = makeCombatant({ id: 'd', side: 'enemy', attrs: { def: 500 }, hp: 1 });
    const r = resolveHit(makeCombatant({ id: 'a', attrs: { crit: 0 } }), d, { ...atk, power: 1 }, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(0);
    expect(r.events).toContainEqual({ type: 'defeated', targetId: 'd' });
  });
});

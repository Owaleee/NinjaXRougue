import { describe, it, expect } from 'vitest';
import { Rng } from '../src/game/Rng';

describe('Rng (mulberry32 com semente)', () => {
  it('é determinístico para a mesma semente', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const sa = Array.from({ length: 10 }, () => a.next());
    const sb = Array.from({ length: 10 }, () => b.next());
    expect(sa).toEqual(sb);
  });

  it('sementes diferentes geram sequências diferentes', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it('gera valores em [0, 1)', () => {
    const r = new Rng(7);
    for (let i = 0; i < 5000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('restaura a sequência a partir do estado salvo', () => {
    const a = new Rng(99);
    a.next();
    a.next();
    const b = Rng.fromState(a.state);
    expect(b.next()).toBe(a.next());
  });

  it('int respeita os limites inclusivos', () => {
    const r = new Rng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(r.int(1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('pick lança erro em lista vazia e shuffle não muta a original', () => {
    const r = new Rng(5);
    expect(() => r.pick([])).toThrow();
    const orig = [1, 2, 3, 4, 5];
    const copy = [...orig];
    const shuffled = r.shuffle(orig);
    expect(orig).toEqual(copy);
    expect([...shuffled].sort()).toEqual(copy);
  });
});

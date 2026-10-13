import { describe, it, expect } from 'vitest';
import { SIM_BUILDS } from '../src/game/sim/builds';
import { BUILD_BANDS, TARGETS, bandFor, checkTargets, designGaps, type SimSummary } from '../src/game/sim/report';

const build = (id: string) => SIM_BUILDS.find((b) => b.id === id)!;

/** Linha "boa" (dentro de todas as metas de design) para a build `id`. */
const okRow = (id: string, over: Partial<SimSummary> = {}): SimSummary => ({
  build: build(id),
  runs: 1000,
  reachZabuza: 0.99,
  beatZabuza: 0.6,
  completed: 0.5,
  hakuGivenZabuza: 0.8,
  roundsZabuza: 10,
  roundsHaku: 9,
  roundsCommon: 3,
  hpEndCommon: 0.8,
  mainJutsuMastery: 3,
  ...over,
});

describe('faixas por build', () => {
  it('build sem override usa a meta de design; build com override usa a sua faixa', () => {
    expect(bandFor('nin-semcla', 'beatZabuza')).toEqual(TARGETS.beatZabuza);
    expect(bandFor('nin-uchiha', 'beatZabuza')).toEqual([0.4, 0.75]);
    expect(bandFor('id-que-nao-existe', 'completed')).toEqual(TARGETS.completed);
  });

  it('nenhuma faixa é mais estreita que a meta de design, e toda chave é uma build do simulador', () => {
    for (const [id, bands] of Object.entries(BUILD_BANDS)) {
      expect(SIM_BUILDS.some((b) => b.id === id)).toBe(true);
      for (const [metric, [lo, hi]] of Object.entries(bands) as [keyof typeof TARGETS, [number, number]][]) {
        expect(lo).toBeLessThanOrEqual(TARGETS[metric][0]);
        expect(hi).toBeGreaterThanOrEqual(TARGETS[metric][1]);
      }
    }
  });

  it('valor dentro da faixa da build passa no check, mas aparece como distância da meta de design', () => {
    const row = okRow('nin-uchiha', { beatZabuza: 0.42 });
    expect(checkTargets([row])).toEqual([]);
    expect(designGaps([row])).toEqual(['Ninjutsu / Uchiha: beatZabuza = 0.420 (meta de design 0.45–0.75)']);
  });

  it('valor fora da faixa da build falha com a faixa citada', () => {
    const row = okRow('nin-uchiha', { beatZabuza: 0.38 });
    expect(checkTargets([row])).toEqual(['Ninjutsu / Uchiha: beatZabuza = 0.380 (faixa da build 0.4–0.75)']);
  });

  it('um ponto acima do teto de uma faixa ampliada também falha', () => {
    const row = okRow('nin-uzumaki', { hakuGivenZabuza: 0.98 });
    expect(checkTargets([row])).toEqual(['Ninjutsu / Uzumaki: hakuGivenZabuza = 0.980 (faixa da build 0.7–0.97)']);
  });

  it('build sem override continua com a meta de design', () => {
    const row = okRow('tai-uchiha', { hpEndCommon: 0.7 });
    expect(checkTargets([row])).toEqual(['Taijutsu / Uchiha: hpEndCommon = 0.700 (meta 0.75–0.85)']);
  });

  it('builds não focadas ficam fora do check e das distâncias', () => {
    const row = okRow('eq-semcla', { hpEndCommon: 0.1 });
    expect(checkTargets([row])).toEqual([]);
    expect(designGaps([row])).toEqual([]);
  });
});

import { simulateRun, type RunOutcome } from './bot';
import type { BuildDef } from './builds';

export interface SimSummary {
  build: BuildDef;
  runs: number;
  reachZabuza: number;
  beatZabuza: number;
  completed: number;
  /** De quem venceu Zabuza, quantos venceram Haku (spec C6). Sem vitórias sobre Zabuza fica 0 (exibido como "—"; ver `beatZabuza`). */
  hakuGivenZabuza: number;
  roundsZabuza: number;
  roundsHaku: number;
  roundsCommon: number;
  hpEndCommon: number;
  /** Maestria média do jutsu principal (o mais usado da run). */
  mainJutsuMastery: number;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function simulateMany(build: BuildDef, runs: number, seedBase: number): SimSummary {
  const outs: RunOutcome[] = [];
  for (let i = 0; i < runs; i++) outs.push(simulateRun(build, seedBase + i));
  const rate = (f: (o: RunOutcome) => boolean) => outs.filter(f).length / runs;
  const beat = outs.filter((o) => o.beatZabuza).length;
  return {
    build,
    runs,
    reachZabuza: rate((o) => o.reachedZabuza),
    beatZabuza: rate((o) => o.beatZabuza),
    completed: rate((o) => o.completed),
    hakuGivenZabuza: beat ? outs.filter((o) => o.completed).length / beat : 0,
    roundsZabuza: avg(outs.flatMap((o) => (o.zabuzaRounds === null ? [] : [o.zabuzaRounds]))),
    roundsHaku: avg(outs.flatMap((o) => (o.hakuRounds === null ? [] : [o.hakuRounds]))),
    roundsCommon: avg(outs.flatMap((o) => o.commonRounds)),
    hpEndCommon: avg(outs.flatMap((o) => o.commonHpEnd)),
    mainJutsuMastery: avg(outs.map((o) => o.mainJutsuMastery)),
  };
}

/** Metas de DESIGN da spec §12 (faixas inclusivas), aplicadas às builds focadas. */
export const TARGETS = {
  hpEndCommon: [0.75, 0.85],
  roundsCommon: [2, 4],
  reachZabuza: [0.95, 1],
  beatZabuza: [0.45, 0.75],
  completed: [0.35, 0.7],
  hakuGivenZabuza: [0.7, 0.85],
  mainJutsuMastery: [2, 4],
} as const satisfies Record<string, readonly [number, number]>;

export type Metric = keyof typeof TARGETS;
export type Band = [number, number];

/**
 * Faixas de REGRESSÃO por build (decisão do usuário, 2026-10-12; ver docs/balance-log.md).
 * A diferença entre as builds (Uchiha mais fraca contra chefes, Uzumaki mais resistente) é maior
 * que a largura das metas de design; então cada build que mede fora da meta ganha uma faixa
 * própria, nunca mais estreita que a meta. `sim:check` falha se uma build sair da SUA faixa;
 * a distância para a meta de design continua impressa por `designGaps`.
 */
export const BUILD_BANDS: Record<string, Partial<Record<Metric, Band>>> = {
  'nin-uchiha': { beatZabuza: [0.4, 0.75], completed: [0.3, 0.7] },
  'nin-uzumaki': { hakuGivenZabuza: [0.7, 0.97] },
  'nin-semcla': { hakuGivenZabuza: [0.7, 0.95] },
  'tai-uzumaki': { hakuGivenZabuza: [0.7, 0.97], mainJutsuMastery: [2, 4.6] },
  'tai-semcla': { hpEndCommon: [0.72, 0.85], mainJutsuMastery: [2, 4.2] },
};

export function bandFor(buildId: string, metric: Metric): Band {
  const own = BUILD_BANDS[buildId]?.[metric];
  const [lo, hi] = own ?? TARGETS[metric];
  return [lo, hi];
}

const METRICS = Object.keys(TARGETS) as Metric[];

function outside(row: SimSummary, metric: Metric, band: Band): string | null {
  const [min, max] = band;
  if (metric === 'hakuGivenZabuza' && row.beatZabuza === 0) return 'indefinido (nenhuma run venceu Zabuza)';
  const v = row[metric];
  return v < min || v > max ? v.toFixed(3) : null;
}

/** Falhas de regressão: cada build focada contra a sua faixa. */
export function checkTargets(rows: SimSummary[]): string[] {
  const failures: string[] = [];
  for (const row of rows.filter((r) => r.build.focused)) {
    for (const metric of METRICS) {
      const band = bandFor(row.build.id, metric);
      const bad = outside(row, metric, band);
      if (bad === null) continue;
      const own = BUILD_BANDS[row.build.id]?.[metric] !== undefined;
      const rule = own ? `faixa da build ${band[0]}–${band[1]}` : `meta ${band[0]}–${band[1]}`;
      failures.push(
        bad.startsWith('indefinido')
          ? `${row.build.label}: ${metric} ${bad}; ${rule}`
          : `${row.build.label}: ${metric} = ${bad} (${rule})`,
      );
    }
  }
  return failures;
}

/** Distância para as metas de DESIGN (informativo: não derruba o check). */
export function designGaps(rows: SimSummary[]): string[] {
  const gaps: string[] = [];
  for (const row of rows.filter((r) => r.build.focused)) {
    for (const metric of METRICS) {
      const [min, max] = TARGETS[metric];
      const bad = outside(row, metric, [min, max]);
      if (bad === null) continue;
      gaps.push(
        bad.startsWith('indefinido')
          ? `${row.build.label}: ${metric} ${bad}; meta de design ${min}–${max}`
          : `${row.build.label}: ${metric} = ${bad} (meta de design ${min}–${max})`,
      );
    }
  }
  return gaps;
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

export function formatTable(rows: SimSummary[]): string {
  const head =
    '| Build | Runs | Chega a Zabuza | Vence Zabuza | Completa | Haku dado Zabuza | Rodadas Z/H/comum | HP fim comum | Maestria do jutsu principal |\n' +
    '|---|---|---|---|---|---|---|---|---|';
  const lines = rows.map(
    (r) =>
      `| ${r.build.label} | ${r.runs} | ${pct(r.reachZabuza)} | ${pct(r.beatZabuza)} | ${pct(r.completed)} | ${r.beatZabuza === 0 ? '—' : pct(r.hakuGivenZabuza)} | ` +
      `${r.roundsZabuza.toFixed(1)} / ${r.roundsHaku.toFixed(1)} / ${r.roundsCommon.toFixed(1)} | ${pct(r.hpEndCommon)} | +${r.mainJutsuMastery.toFixed(1)} |`,
  );
  return [head, ...lines].join('\n');
}

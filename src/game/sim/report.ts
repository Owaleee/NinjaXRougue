import { simulateRun, type RunOutcome } from './bot';
import type { BuildDef } from './builds';

export interface SimSummary {
  build: BuildDef;
  runs: number;
  reachZabuza: number;
  beatZabuza: number;
  completed: number;
  /** De quem venceu Zabuza, quantos venceram Haku (spec C6). */
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

/** Metas da spec §12 (faixas inclusivas), aplicadas às builds focadas. */
export const TARGETS: Record<'hpEndCommon' | 'roundsCommon' | 'reachZabuza' | 'beatZabuza' | 'completed' | 'hakuGivenZabuza' | 'mainJutsuMastery', [number, number]> = {
  hpEndCommon: [0.75, 0.85],
  roundsCommon: [2, 4],
  reachZabuza: [0.95, 1],
  beatZabuza: [0.45, 0.75],
  completed: [0.35, 0.7],
  hakuGivenZabuza: [0.7, 0.85],
  mainJutsuMastery: [2, 4],
};

export function checkTargets(rows: SimSummary[]): string[] {
  const failures: string[] = [];
  for (const row of rows.filter((r) => r.build.focused)) {
    for (const [metric, [min, max]] of Object.entries(TARGETS) as [keyof typeof TARGETS, [number, number]][]) {
      const v = row[metric];
      if (v < min || v > max) failures.push(`${row.build.label}: ${metric} = ${v.toFixed(3)} (meta ${min}–${max})`);
    }
  }
  return failures;
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

export function formatTable(rows: SimSummary[]): string {
  const head =
    '| Build | Runs | Chega a Zabuza | Vence Zabuza | Completa | Haku dado Zabuza | Rodadas Z/H/comum | HP fim comum | Maestria do jutsu principal |\n' +
    '|---|---|---|---|---|---|---|---|---|';
  const lines = rows.map(
    (r) =>
      `| ${r.build.label} | ${r.runs} | ${pct(r.reachZabuza)} | ${pct(r.beatZabuza)} | ${pct(r.completed)} | ${pct(r.hakuGivenZabuza)} | ` +
      `${r.roundsZabuza.toFixed(1)} / ${r.roundsHaku.toFixed(1)} / ${r.roundsCommon.toFixed(1)} | ${pct(r.hpEndCommon)} | +${r.mainJutsuMastery.toFixed(1)} |`,
  );
  return [head, ...lines].join('\n');
}

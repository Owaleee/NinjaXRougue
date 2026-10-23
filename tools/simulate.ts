/**
 * Simulador headless (DD v2 §18).
 *   npm run sim                 → 3000 runs por build, imprime a tabela e a distância das metas de design
 *   npm run sim:check           → 1000 runs por build e falha (exit 1) se uma build sair da SUA faixa de regressão
 *   npm run sim -- --runs 200   → quantidade customizada
 */
import { SIM_BUILDS } from '../src/game/sim/builds';
import { checkTargets, designGaps, formatTable, simulateMany } from '../src/game/sim/report';

const args = process.argv.slice(2);
const check = args.includes('--check');
const runsFlag = args.indexOf('--runs');
const runs = runsFlag >= 0 ? Number(args[runsFlag + 1]) : check ? 1000 : 3000;
if (!Number.isInteger(runs) || runs <= 0) {
  console.error('Uso: --runs <inteiro positivo>');
  process.exit(2);
}

const t0 = performance.now();
const rows = SIM_BUILDS.map((b, i) => simulateMany(b, runs, 100_000 * (i + 1)));
console.log(formatTable(rows));
console.log(`\nTempo: ${((performance.now() - t0) / 1000).toFixed(1)} s (${runs} runs × ${SIM_BUILDS.length} builds)`);

const gaps = designGaps(rows);
if (gaps.length) console.log(`\nDistância das metas de design (informativo, não derruba o check):\n- ${gaps.join('\n- ')}`);

if (check) {
  const failures = checkTargets(rows);
  if (failures.length) {
    console.error(`\n${failures.length} meta(s) fora da faixa:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }
  console.log('\nNenhuma build saiu da sua faixa de regressão.');
}

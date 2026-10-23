/**
 * Confere os documentos do projeto (Plano 3).
 *   npm run docs:check   → falha (exit 1) se algum documento violar a sua especificação
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { BALANCE } from '../src/game/Balance';
import { checkDoc } from './docs-lib';
import { DOC_SPECS } from './docs-specs';

const root = fileURLToPath(new URL('..', import.meta.url));

/** `BALANCE.a.b.c` → valor em BALANCE; qualquer outro prefixo é inexistente. */
function fact(path: string): unknown {
  const [head, ...rest] = path.split('.');
  if (head !== 'BALANCE') return undefined;
  return rest.reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], BALANCE);
}

const io = { exists: (p: string) => existsSync(resolve(root, p)), fact };

const failures: string[] = [];
for (const spec of DOC_SPECS) {
  const file = resolve(root, spec.path);
  if (!existsSync(file)) {
    failures.push(`${spec.path}: arquivo ausente`);
    continue;
  }
  failures.push(...checkDoc(readFileSync(file, 'utf8'), spec, io));
}

if (failures.length) {
  console.error(`${failures.length} problema(s) nos documentos:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Documentos conferidos: ${DOC_SPECS.length}.`);

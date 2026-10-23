# Plano 3 de 3 — Documentos, fechamento do balanceamento e entrega (NarutoTxGame MVP)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o MVP: deixar `npm run sim:check` verde com faixas por build, limpar as pendências de código e de dependências dos Planos 1 e 2, e escrever os três entregáveis de documentação da spec §13 (`docs/ANALISE.md`, `docs/curso/` e `docs/DESIGN.md` v3) a partir do código real, com um verificador automático que impede documento inventado.

**Architecture:** Código primeiro (Tasks 1–4), documentos depois (Tasks 5–12), conferência final (Task 13). Cada documento tem uma "especificação" em `tools/docs-specs.ts` (títulos obrigatórios, quantidade mínima de fatos numéricos) e é validado por `npm run docs:check`: títulos presentes, todo caminho de arquivo citado em crase existe no repositório, nenhum marcador de pendência, e todo número marcado com `<!-- fact: BALANCE.x.y=valor -->` bate com o `BALANCE` real. O curso tem um verificador extra de estrutura (passos com "O quê / Por quê / Alternativas / Riscos e armadilhas" e patch log completo).

**Tech Stack:** Node 22, TypeScript 5 (strict), Vitest 3 (a Task 4 sobe versões), tsx 4. Nenhuma dependência de runtime nova.

**Spec:** `docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md` (§3 correções C1–C15, §12 metas, §13 entregáveis) + DD v2 em `docs/referencia/NarutoTxGame_Documento_de_Design_v2.md`. **Pré-requisito:** Planos 1 e 2 executados no branch `feat/mvp` (HEAD `bec6a2e` ou posterior), `npm test` verde e `npx tsc --noEmit` limpo.

## Global Constraints

- Idioma: texto de documentos, comentários e mensagens em **pt-BR**; identificadores de código em inglês.
- Documentos são escritos **a partir do código real** (spec §13.3): antes de afirmar um número, uma regra ou o nome de um arquivo, leia o arquivo. Nunca copie um valor do DD v2 sem conferir no código; onde o código e o DD v2 divergem, vale o código e a divergência vai para `docs/ANALISE.md`.
- Curso (`docs/curso/`): versões **Alfa 0.1–0.8, Beta 0.9.0–0.9.2, 1.0**. Cada versão tem objetivo, escopo (entra / fica de fora), passo a passo **com o porquê (alternativas, riscos, armadilhas)**, critérios de conclusão, testes e patch log (**Adicionado / Alterado / Corrigido / Removido / Problemas conhecidos**). Linguagem para dev JavaScript sem experiência em jogos: explique "turno", "RNG com semente", "máquina de estados" quando aparecerem.
- `docs/DESIGN.md` é o Documento de Design v3: reescrito, incorporando as correções C1–C15 e **os números finais do simulador** (spec §13.4).
- Marcador de suposição: `ASSUMIDO` (spec §1) continua sendo o termo.
- Nome oficial do jogo: **NarutoTxGame** (o package se chama `ninja-x-rogue`).
- O motor (`src/game/**`) continua sem `phaser`, `window`, `document`, `Math.random` e `Date.now`. Nenhuma task deste plano muda regra de jogo nem valor de `src/game/Balance.ts`.
- Arte oficial não entra no repositório; só placeholders (spec §10).
- Commits pequenos, mensagem em pt-BR no formato `tipo: descrição`, terminando com a linha `Co-Authored-By:` do modelo que está executando a task.

## Review Focus

1. **Documento afirma algo que o código não tem** (arquivo inexistente, número desatualizado, função renomeada) → `docs:check` falha (caminho em crase inexistente; `<!-- fact: ... -->` divergente). Teste na Task 1; usado em toda task de documento.
2. **Faixa por build escondendo uma regressão real** → uma build que sai da sua faixa derruba `sim:check`; o teste prova que a faixa nunca é mais estreita que a meta de design e que um valor 1 ponto fora da faixa falha (Task 2). As metas de design continuam impressas como "distância" (informativo).
3. **Upgrade de `happy-dom`/`vitest` quebra os testes de DOM sem aviso** → a suíte inteira (`npm test`) e o `npm run build` precisam passar depois de cada upgrade, e `npm audit` não pode listar crítico (Task 4).
4. **Curso que "explica" sem o porquê** (passo sem alternativas ou riscos) → `docs:check` exige, em cada `### Passo`, os quatro rótulos em negrito, e no mínimo 3 passos por versão (Task 1; usado nas Tasks 6–9).
5. **Documento fica desatualizado no mesmo dia** (números do simulador mudam depois de escrever o DESIGN v3) → a Task 13 roda `npm run docs:check`, `npm run sim:check` e `npm test` juntos, e o DESIGN v3 cita a tabela final de 3000 runs com fatos verificados contra o `BALANCE`.

---

## Estrutura de arquivos

```
tools/
  docs-lib.ts            funções puras do verificador (títulos, caminhos, fatos, curso)   [Task 1]
  docs-specs.ts          lista de documentos e suas exigências                            [Task 1; cada doc acrescenta a sua]
  docs-check.ts          CLI: npm run docs:check                                          [Task 1]
tests/
  docs-check.test.ts     testes do verificador                                            [Task 1]
  sim-bands.test.ts      testes das faixas por build                                      [Task 2]
src/game/sim/report.ts   (modificado) BUILD_BANDS, bandFor, designGaps                    [Task 2]
tools/simulate.ts        (modificado) imprime a distância das metas de design             [Task 2]
src/store/GameStore.ts   (modificado) ordem do aviso de erro                              [Task 3]
src/ui-dom/view/log.ts, src/i18n/pt-BR.ts  (modificados) "1 turno" no singular             [Task 3]
package.json             (modificado) script docs:check; versões de happy-dom e vitest     [Tasks 1, 4]
docs/
  balance-log.md         (modificado) decisão "faixas por build" e resultado final         [Task 2, 13]
  ANALISE.md             [Task 5]
  curso/README.md        índice do curso                                                   [Task 6]
  curso/alfa-0.1.md ... alfa-0.8.md, beta-0.9.0.md, beta-0.9.1.md, beta-0.9.2.md, 1.0.md  [Tasks 6–9]
  DESIGN.md              [Tasks 10–12]
  CONFERENCIA-VISUAL.md  roteiro para o usuário olhar o jogo no navegador                  [Task 13]
README.md                (modificado) links, comandos, problemas conhecidos                [Task 13]
```

---

### Task 1: Verificador de documentos (`npm run docs:check`)

**Files:**
- Create: `tools/docs-lib.ts`, `tools/docs-specs.ts`, `tools/docs-check.ts`, `tests/docs-check.test.ts`
- Modify: `package.json` (script `docs:check`)

**Interfaces:**
- Produces (`tools/docs-lib.ts`):
  - `interface DocSpec { path: string; headings: string[]; minFacts?: number; minStateLines?: number; course?: boolean }`
  - `const PATCH_LOG_SECTIONS: readonly ['Adicionado','Alterado','Corrigido','Removido','Problemas conhecidos']`
  - `const COURSE_HEADINGS: string[]`
  - `headingsOf(md: string): string[]`, `missingHeadings(md: string, required: string[]): string[]`
  - `pathRefs(md: string): string[]`, `forbiddenMarkers(md: string): string[]`
  - `factsOf(md: string): { path: string; expected: string }[]`, `checkFacts(md: string, lookup: (path: string) => unknown): string[]`
  - `stateLines(md: string): number`
  - `checkCourse(md: string): string[]`
  - `checkDoc(md: string, spec: DocSpec, io: { exists(path: string): boolean; fact(path: string): unknown }): string[]`
- Produces (`tools/docs-specs.ts`): `const DOC_SPECS: DocSpec[]` (começa vazio; cada task de documento acrescenta a sua entrada).
- Consumes: `BALANCE` de `src/game/Balance.ts` (só no CLI).

- [ ] **Step 1: Escrever o teste que falha — `tests/docs-check.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  COURSE_HEADINGS,
  checkCourse,
  checkDoc,
  checkFacts,
  factsOf,
  forbiddenMarkers,
  headingsOf,
  missingHeadings,
  pathRefs,
  stateLines,
} from '../tools/docs-lib';

const io = (paths: string[], facts: Record<string, unknown> = {}) => ({
  exists: (p: string) => paths.includes(p),
  fact: (p: string) => facts[p],
});

const passo = (n: number, labels = ['**O quê**', '**Por quê**', '**Alternativas**', '**Riscos e armadilhas**']) =>
  `### Passo ${n} — algo\n${labels.map((l) => `${l}: texto.`).join('\n')}\n`;

const cursoOk = [
  '# Alfa 0.1',
  ...COURSE_HEADINGS.filter((h) => h !== 'Passo a passo').map((h) => `## ${h}`),
  '## Passo a passo',
  passo(1),
  passo(2),
  passo(3),
].join('\n');

describe('verificador de documentos', () => {
  it('lê títulos fora de blocos de código', () => {
    const md = '# A\n```\n# não é título\n```\n## B ';
    expect(headingsOf(md)).toEqual(['A', 'B']);
    expect(missingHeadings(md, ['A', 'B', 'C'])).toEqual(['C']);
  });

  it('extrai caminhos citados em crase e ignora blocos de código e diretórios', () => {
    const md = 'Veja `src/game/Rng.ts` e `tests/rng.test.ts:12` e `src/game/` e `npm test`.\n```\n`src/falso/arquivo.ts`\n```';
    expect(pathRefs(md)).toEqual(['src/game/Rng.ts', 'tests/rng.test.ts']);
  });

  it('acha marcadores de pendência, mas não dentro de código', () => {
    expect(forbiddenMarkers('texto\nTODO: depois\nok')).toEqual(['TODO: depois']);
    expect(forbiddenMarkers('```\nTODO\n```')).toEqual([]);
  });

  it('confere fatos numéricos contra o código', () => {
    const md = 'HP do Haku <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 --> e o teto <!-- fact: BALANCE.dodge.capPct=40 -->.';
    expect(factsOf(md)).toEqual([
      { path: 'BALANCE.enemyGrades.B.hpMult', expected: '1.7' },
      { path: 'BALANCE.dodge.capPct', expected: '40' },
    ]);
    const lookup = (p: string) => ({ 'BALANCE.enemyGrades.B.hpMult': 1.7, 'BALANCE.dodge.capPct': 45 })[p];
    expect(checkFacts(md, lookup)).toEqual(['fato BALANCE.dodge.capPct: o documento diz 40, o código tem 45']);
    expect(checkFacts('<!-- fact: BALANCE.nao.existe=1 -->', () => undefined)).toEqual(['fato BALANCE.nao.existe: caminho inexistente']);
  });

  it('conta linhas de estado', () => {
    expect(stateLines('**Estado:** Implementado (MVP)\ntexto\n**Estado:** Futuro (F2)')).toBe(2);
  });

  it('curso: exige 3 passos, cada um com os 4 rótulos', () => {
    expect(checkCourse(cursoOk)).toEqual([]);
    const poucos = cursoOk.replace(passo(3), '');
    expect(checkCourse(poucos)).toEqual(['curso: menos de 3 passos (achei 2)']);
    const semRisco = cursoOk.replace(passo(2), passo(2, ['**O quê**', '**Por quê**', '**Alternativas**']));
    expect(checkCourse(semRisco)).toEqual(['curso: "Passo 2 — algo" sem **Riscos e armadilhas**']);
  });

  it('checkDoc junta tudo e prefixa o caminho do documento', () => {
    const spec = { path: 'docs/X.md', headings: ['A', 'B'], minFacts: 1, minStateLines: 1 };
    const md = '# A\nVeja `src/nao/existe.ts`.\nTODO\n';
    const f = checkDoc(md, spec, io([]));
    expect(f).toContain('docs/X.md: título ausente: B');
    expect(f).toContain('docs/X.md: caminho inexistente: src/nao/existe.ts');
    expect(f).toContain('docs/X.md: marcador proibido: TODO');
    expect(f).toContain('docs/X.md: fatos verificados: 0 (mínimo 1)');
    expect(f).toContain('docs/X.md: linhas "**Estado:**": 0 (mínimo 1)');
  });

  it('checkDoc devolve vazio para um documento correto', () => {
    const spec = { path: 'docs/X.md', headings: ['A'], minFacts: 1, minStateLines: 1 };
    const md = '# A\n**Estado:** Implementado\nVeja `src/game/Rng.ts` <!-- fact: BALANCE.dodge.capPct=40 -->';
    expect(checkDoc(md, spec, io(['src/game/Rng.ts'], { 'BALANCE.dodge.capPct': 40 }))).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/docs-check.test.ts`
Expected: FAIL com "Failed to load url ../tools/docs-lib".

- [ ] **Step 3: Implementar `tools/docs-lib.ts`**

```ts
/**
 * Verificador de documentos (Plano 3). Funções puras: quem lê arquivos e
 * resolve o BALANCE é o CLI (`tools/docs-check.ts`).
 */
export interface DocSpec {
  path: string;
  /** Títulos (sem os '#') que precisam existir. */
  headings: string[];
  /** Mínimo de marcações `<!-- fact: BALANCE.x.y=valor -->` verificadas contra o código. */
  minFacts?: number;
  /** Mínimo de linhas que começam com `**Estado:**`. */
  minStateLines?: number;
  /** Documento do curso: exige passos completos. */
  course?: boolean;
}

export const PATCH_LOG_SECTIONS = ['Adicionado', 'Alterado', 'Corrigido', 'Removido', 'Problemas conhecidos'] as const;
const STEP_LABELS = ['**O quê**', '**Por quê**', '**Alternativas**', '**Riscos e armadilhas**'] as const;

export const COURSE_HEADINGS: string[] = [
  'Objetivo',
  'Escopo',
  'Entra',
  'Fica de fora',
  'Passo a passo',
  'Critérios de conclusão',
  'Testes',
  'Patch log',
  ...PATCH_LOG_SECTIONS,
];

const FENCE = /^\s*```/;

/** Linhas fora de blocos de código. */
function proseLines(md: string): string[] {
  let inFence = false;
  const out: string[] = [];
  for (const line of md.split('\n')) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) out.push(line);
  }
  return out;
}

export function headingsOf(md: string): string[] {
  return proseLines(md)
    .filter((l) => /^#{1,6}\s/.test(l))
    .map((l) => l.replace(/^#{1,6}\s+/, '').trim());
}

export function missingHeadings(md: string, required: string[]): string[] {
  const have = new Set(headingsOf(md));
  return required.filter((h) => !have.has(h));
}

const PATH_RE = /`((?:src|tests|tools|docs)\/[A-Za-z0-9_./-]*[A-Za-z0-9_-]\.[A-Za-z0-9]+)(?::\d+(?:-\d+)?)?`/g;

/** Caminhos de arquivo citados entre crases (sem repetir). */
export function pathRefs(md: string): string[] {
  const out = new Set<string>();
  for (const line of proseLines(md)) for (const m of line.matchAll(PATH_RE)) out.add(m[1]!);
  return [...out];
}

const FORBIDDEN = /\b(TODO|TBD|FIXME|XXX)\b|a definir|preencher depois/i;

export function forbiddenMarkers(md: string): string[] {
  return proseLines(md)
    .filter((l) => FORBIDDEN.test(l))
    .map((l) => l.trim());
}

const FACT_RE = /<!--\s*fact:\s*([A-Za-z0-9_.]+)=([^\s>]+)\s*-->/g;

export function factsOf(md: string): { path: string; expected: string }[] {
  return [...md.matchAll(FACT_RE)].map((m) => ({ path: m[1]!, expected: m[2]! }));
}

export function checkFacts(md: string, lookup: (path: string) => unknown): string[] {
  const failures: string[] = [];
  for (const { path, expected } of factsOf(md)) {
    const actual = lookup(path);
    if (actual === undefined) failures.push(`fato ${path}: caminho inexistente`);
    else if (String(actual) !== expected) failures.push(`fato ${path}: o documento diz ${expected}, o código tem ${String(actual)}`);
  }
  return failures;
}

export function stateLines(md: string): number {
  return proseLines(md).filter((l) => l.startsWith('**Estado:**')).length;
}

/** Estrutura do curso: no mínimo 3 passos, cada um com os 4 rótulos. */
export function checkCourse(md: string): string[] {
  const blocks: { title: string; text: string }[] = [];
  let current: { title: string; text: string } | null = null;
  for (const line of proseLines(md)) {
    if (/^###\s+Passo\s/.test(line)) {
      current = { title: line.replace(/^###\s+/, '').trim(), text: '' };
      blocks.push(current);
    } else if (/^#{1,3}\s/.test(line)) {
      current = null;
    } else if (current) {
      current.text += `${line}\n`;
    }
  }
  const failures: string[] = [];
  if (blocks.length < 3) failures.push(`curso: menos de 3 passos (achei ${blocks.length})`);
  for (const b of blocks) {
    for (const label of STEP_LABELS) if (!b.text.includes(label)) failures.push(`curso: "${b.title}" sem ${label}`);
  }
  return failures;
}

export function checkDoc(md: string, spec: DocSpec, io: { exists(path: string): boolean; fact(path: string): unknown }): string[] {
  const f: string[] = [];
  for (const h of missingHeadings(md, spec.headings)) f.push(`título ausente: ${h}`);
  for (const p of pathRefs(md)) if (!io.exists(p)) f.push(`caminho inexistente: ${p}`);
  for (const l of forbiddenMarkers(md)) f.push(`marcador proibido: ${l}`);
  f.push(...checkFacts(md, io.fact));
  const nFacts = factsOf(md).length;
  if (nFacts < (spec.minFacts ?? 0)) f.push(`fatos verificados: ${nFacts} (mínimo ${spec.minFacts})`);
  const nState = stateLines(md);
  if (nState < (spec.minStateLines ?? 0)) f.push(`linhas "**Estado:**": ${nState} (mínimo ${spec.minStateLines})`);
  if (spec.course) f.push(...checkCourse(md));
  return f.map((m) => `${spec.path}: ${m}`);
}
```

- [ ] **Step 4: Implementar `tools/docs-specs.ts` e `tools/docs-check.ts`; acrescentar o script**

`tools/docs-specs.ts`:

```ts
import type { DocSpec } from './docs-lib';

/** Cada task de documento do Plano 3 acrescenta a sua entrada aqui. */
export const DOC_SPECS: DocSpec[] = [];
```

`tools/docs-check.ts`:

```ts
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
```

Em `package.json`, dentro de `scripts`, acrescente (depois de `"sim:check"`):

```json
    "docs:check": "tsx tools/docs-check.ts"
```

(lembre da vírgula no fim da linha de `sim:check`).

- [ ] **Step 5: Rodar os testes e o CLI**

Run: `npx vitest run tests/docs-check.test.ts && npm run docs:check && npx tsc --noEmit`
Expected: testes PASS; o CLI imprime `Documentos conferidos: 0.`; `tsc` sem saída. Se `tsc` reclamar que `tools/` não está no `include`, confira `tsconfig.json` (o `include` já lista `tools` desde o Plano 1).

- [ ] **Step 6: Commit**

```bash
git add tools/docs-lib.ts tools/docs-specs.ts tools/docs-check.ts tests/docs-check.test.ts package.json
git commit -m "feat: verificador de documentos (docs:check) com títulos, caminhos, fatos do BALANCE e estrutura do curso"
```

---

### Task 2: Faixas por build no `sim:check` (decisão do usuário)

**Contexto da decisão:** o usuário escolheu "faixas por build" (2026-10-12). As 8 metas fora da faixa vêm de diferenças estruturais entre as builds (Uchiha é a mais fraca contra chefes, Uzumaki a mais resistente), maiores que a largura das faixas da spec §12. As faixas da spec ficam como **metas de design** (impressas como "distância", sem falhar). `sim:check` passa a falhar só quando uma build sai da **sua** faixa de regressão. Nenhum valor de `Balance.ts` muda.

**Files:**
- Modify: `src/game/sim/report.ts`, `tools/simulate.ts`, `docs/balance-log.md`
- Create: `tests/sim-bands.test.ts`

**Interfaces:**
- Consumes: `SimSummary`, `TARGETS`, `SIM_BUILDS` (`BuildDef.id`, `.focused`, `.label`).
- Produces (`report.ts`): `type Metric = keyof typeof TARGETS`, `type Band = [number, number]`, `BUILD_BANDS: Record<string, Partial<Record<Metric, Band>>>`, `bandFor(buildId: string, metric: Metric): Band`, `designGaps(rows: SimSummary[]): string[]`; `checkTargets` passa a usar `bandFor`.

Linha de base (1000 runs por build, determinística — `docs/balance-log.md`, "Medição após a iteração 4"): as 8 metas fora são exatamente as da tabela abaixo; todas as outras já estão dentro das metas de design.

| Build (`id`) | Métrica | Medido | Meta de design | Faixa da build |
|---|---|---|---|---|
| `nin-uchiha` | `beatZabuza` | 0,447 | 0,45–0,75 | 0,40–0,75 |
| `nin-uchiha` | `completed` | 0,338 | 0,35–0,70 | 0,30–0,70 |
| `nin-uzumaki` | `hakuGivenZabuza` | 0,954 | 0,70–0,85 | 0,70–0,97 |
| `nin-semcla` | `hakuGivenZabuza` | 0,924 | 0,70–0,85 | 0,70–0,95 |
| `tai-uzumaki` | `hakuGivenZabuza` | 0,939 | 0,70–0,85 | 0,70–0,97 |
| `tai-uzumaki` | `mainJutsuMastery` | 4,448 | 2–4 | 2–4,6 |
| `tai-semcla` | `hpEndCommon` | 0,745 | 0,75–0,85 | 0,72–0,85 |
| `tai-semcla` | `mainJutsuMastery` | 4,040 | 2–4 | 2–4,2 |

- [ ] **Step 1: Escrever o teste que falha — `tests/sim-bands.test.ts`**

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/sim-bands.test.ts`
Expected: FAIL (`BUILD_BANDS`/`bandFor`/`designGaps` não exportados).

- [ ] **Step 3: Implementar em `src/game/sim/report.ts`**

Substitua o bloco que vai de `/** Metas da spec §12 ...` até o fim de `checkTargets` (mantendo `pct` e `formatTable` como estão) por:

```ts
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
```

- [ ] **Step 4: Rodar os testes de simulador**

Run: `npx vitest run tests/sim-bands.test.ts tests/sim.test.ts && npx tsc --noEmit`
Expected: PASS; `tsc` sem saída. (O teste antigo de `sim.test.ts` que espera `hpEndCommon` na mensagem continua valendo: build sem override usa o texto `meta 0.75–0.85`, e `nin-uzumaki`/`SIM_BUILDS[1]` não tem override de `hpEndCommon`.)

- [ ] **Step 5: Atualizar `tools/simulate.ts`**

Troque o import e o bloco final. O cabeçalho vira:

```ts
/**
 * Simulador headless (DD v2 §18).
 *   npm run sim                 → 3000 runs por build, imprime a tabela e a distância das metas de design
 *   npm run sim:check           → 1000 runs por build e falha (exit 1) se uma build sair da SUA faixa de regressão
 *   npm run sim -- --runs 200   → quantidade customizada
 */
import { SIM_BUILDS } from '../src/game/sim/builds';
import { checkTargets, designGaps, formatTable, simulateMany } from '../src/game/sim/report';
```

e, depois da linha que imprime o tempo (`console.log(\`\nTempo: ...\`)`), antes de `if (check)`:

```ts
const gaps = designGaps(rows);
if (gaps.length) console.log(`\nDistância das metas de design (informativo, não derruba o check):\n- ${gaps.join('\n- ')}`);
```

e a mensagem final do `check` passa a ser:

```ts
  console.log('\nNenhuma build saiu da sua faixa de regressão.');
```

(a mensagem de falha continua `N meta(s) fora da faixa: ...`).

- [ ] **Step 6: Rodar o `sim:check` de verdade**

Run: `npm run sim:check`
Expected: demora 35–45 s; imprime a tabela, a seção "Distância das metas de design" com as 8 linhas da tabela acima, e termina com `Nenhuma build saiu da sua faixa de regressão.` (exit 0).
Se alguma linha falhar por margem mínima (a simulação é determinística, mas confirme): alargue só aquela faixa em `0,02` no lado que falhou, registre isso na tabela do Step 7 e rode de novo. Não alargue mais que `0,05` além do valor da tabela acima: se precisar disso, PARE e reporte (a medição mudou, o que indica regressão no motor).

- [ ] **Step 7: Registrar a decisão em `docs/balance-log.md`**

Acrescente no fim do arquivo:

```markdown

## Decisão: faixas por build (Plano 3, 2026-10-12)

A spec §13 pede `sim:check` verde para o MVP estar pronto. Depois de 4 iterações de calibração, 8 metas seguiam fora da faixa por uma razão estrutural: a distância entre a build mais fraca (Uchiha) e a mais forte (Uzumaki) é maior que a largura das faixas da spec §12, e os botões de calibração de grau movem todas as builds juntas. O usuário escolheu **faixas por build**: as metas de design da spec continuam impressas como "distância" (`designGaps`), e `sim:check` passa a proteger contra **regressão**: cada build que mede fora da meta ganha uma faixa própria em `src/game/sim/report.ts` (`BUILD_BANDS`), nunca mais estreita que a meta. Nenhum valor de `Balance.ts` mudou.

| Build | Métrica | Medido (1000 runs) | Meta de design | Faixa da build |
|---|---|---|---|---|
| Ninjutsu / Uchiha | vence Zabuza | 44,7% | 45–75% | 40–75% |
| Ninjutsu / Uchiha | completa a saga | 33,8% | 35–70% | 30–70% |
| Ninjutsu / Uzumaki | Haku dado Zabuza | 95,4% | 70–85% | 70–97% |
| Ninjutsu / Sem clã | Haku dado Zabuza | 92,4% | 70–85% | 70–95% |
| Taijutsu / Uzumaki | Haku dado Zabuza | 93,9% | 70–85% | 70–97% |
| Taijutsu / Uzumaki | maestria do jutsu principal | +4,45 | +2 a +4 | +2 a +4,6 |
| Taijutsu / Sem clã | HP no fim dos comuns | 74,5% | 75–85% | 72–85% |
| Taijutsu / Sem clã | maestria do jutsu principal | +4,04 | +2 a +4 | +2 a +4,2 |

**O que isso NÃO resolve:** o jogo continua mais fácil para Uzumaki (Haku quase sempre cai) e no limite para Uchiha (vence Zabuza em ~41% com 3000 runs). Decisões de design que fechariam a diferença de verdade (fora dos botões): tirar kits da escolha 1-de-3 ou reduzir a cura do kit (40% → 25–30%), e revisar a passiva do Uzumaki. Ficam para depois de o usuário jogar.
```

- [ ] **Step 8: Rodar tudo e commitar**

Run: `npm test && npx tsc --noEmit`
Expected: tudo verde.

```bash
git add src/game/sim/report.ts tools/simulate.ts tests/sim-bands.test.ts docs/balance-log.md
git commit -m "feat: sim:check com faixas por build e distância das metas de design (decisão do usuário)"
```

---

### Task 3: Pendências menores de código dos Planos 1 e 2

**Files:**
- Modify: `src/store/GameStore.ts`, `src/ui-dom/view/log.ts`, `src/i18n/pt-BR.ts`
- Test: `tests/ui/robustness.test.ts`, `tests/ui/log.test.ts`

**Interfaces:**
- Consumes: `GameStore.fight()`, `App`/`SCREENS` (helper `mountWith` do `robustness.test.ts`), `formatEvent` e a chave `log.effectOn`.
- Produces: chave de i18n `log.effectOnOne` (`'{target}: {effect} (1 turno).'`).

- [ ] **Step 1: Escrever os testes que falham**

Em `tests/ui/robustness.test.ts`, dentro do primeiro `describe('Robustez — erro de render', ...)` (logo depois do teste "ErrorScreen que também lança não derruba o App"), acrescente:

```ts
  it('render que quebra fora da batalha: a ErrorScreen não é sobrescrita pela tela de batalha', () => {
    const { store } = scenario();
    store.onBattleEvents(() => {});
    mountWith(store, {
      map: () => {
        throw new Error('mapa quebrou');
      },
    });
    expect(store.state.screen).toBe('map');
    store.fight();
    expect(store.state.screen).toBe('error');
    expect(store.state.locked).toBe(false);
  });
```

Em `tests/ui/log.test.ts`, dentro do `describe`, acrescente:

```ts
  it('efeito com 1 turno restante usa o singular', () => {
    expect(formatEvent({ type: 'effectApplied', targetId: 'enemy:bandido', effectId: 'queimadura', remaining: 1 }, names)?.text).toBe(
      'Bandido: Queimadura (1 turno).',
    );
    expect(formatEvent({ type: 'effectApplied', targetId: 'enemy:bandido', effectId: 'queimadura', remaining: 2 }, names)?.text).toBe(
      'Bandido: Queimadura (2 turnos).',
    );
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/ui/robustness.test.ts tests/ui/log.test.ts`
Expected: FAIL nos dois testes novos (tela termina em `battle`; texto sai "1 turnos").

- [ ] **Step 3: Implementar**

Em `src/store/GameStore.ts`, no bloco `if (animate) {`, troque as duas primeiras linhas do bloco por:

```ts
    if (animate) {
      // Se o render do passo acima já levou o jogo à tela de erro, ela não pode ser sobrescrita.
      if (this.s.screen === 'error') return true;
      // A batalha precisa estar na tela para ser animada; sair dela espera a animação.
      if (this.s.screen !== 'battle') this.set({ screen: 'battle', history: [] });
      if (this.s.screen === 'error') return true;
```

(as linhas seguintes — `this.deferredNav = ...` em diante — ficam como estão).

Em `src/i18n/pt-BR.ts`, logo abaixo de `'log.effectOn': ...`, acrescente:

```ts
  'log.effectOnOne': '{target}: {effect} (1 turno).',
```

Em `src/ui-dom/view/log.ts`, no caso `effectApplied`, troque a expressão por:

```ts
    case 'effectApplied':
      return {
        kind: 'effect',
        text:
          e.remaining === null
            ? t('log.effectOnSustained', { target: n(e.targetId), effect: effectName(e.effectId) })
            : t(e.remaining === 1 ? 'log.effectOnOne' : 'log.effectOn', {
                target: n(e.targetId),
                effect: effectName(e.effectId),
                turns: e.remaining,
              }),
      };
```

- [ ] **Step 4: Rodar tudo**

Run: `npx vitest run tests/ui/robustness.test.ts tests/ui/log.test.ts && npm test && npx tsc --noEmit`
Expected: PASS; suíte inteira verde; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add src/store/GameStore.ts src/ui-dom/view/log.ts src/i18n/pt-BR.ts tests/ui/robustness.test.ts tests/ui/log.test.ts
git commit -m "fix: ErrorScreen não é sobrescrita pela batalha e log usa '1 turno' no singular"
```

---

### Task 4: Atualizar `happy-dom` e `vitest` (alertas do `npm audit`)

**Contexto:** a revisão final do Plano 2 registrou 3 alertas críticos e 1 moderado **só em dependências de desenvolvimento** (`happy-dom` ≤ 20.8.8 — escape do VM; `tinypool` e `@vitest/mocker` via `vitest` 3). O build de produção está limpo. Nenhuma regra de jogo muda nesta task.

**Files:**
- Modify: `package.json`, `package-lock.json`; se o upgrade exigir, ajustes mínimos em `vite.config.ts` e nos testes (nunca em `src/game`).

- [ ] **Step 1: Registrar a linha de base**

Run: `npm audit 2>&1 | tail -25; npm test 2>&1 | tail -6`
Expected: lista os alertas de `happy-dom`/`tinypool`/`@vitest/mocker`; a suíte passa (hoje 309+ testes). Anote os números.

- [ ] **Step 2: Subir o `happy-dom`**

Run: `npm install -D happy-dom@latest && npm ls happy-dom && npm test 2>&1 | tail -15`
Expected: `happy-dom` ≥ 20.8.9 e a suíte verde. Se algum teste de DOM falhar, leia a mensagem e corrija **só o teste ou o helper** (`tests/ui/appHelpers.ts`), preservando o que ele afirma. Se uma API usada pelos testes mudou de nome, registre a mudança no relatório da task.

- [ ] **Step 3: Subir o `vitest`**

Run: `npm install -D vitest@latest && npm ls vitest && npm test 2>&1 | tail -15 && npx tsc --noEmit`
Expected: suíte verde e `tsc` limpo. Se o `vitest` novo exigir uma versão do `vite` diferente da 6, **pare** e deixe `vitest` na maior versão que mantém `vite@6` (use `npm install -D vitest@<versão>` e registre a razão); não suba o `vite` nesta task.

- [ ] **Step 4: Conferir `audit`, build e simulador**

Run: `npm audit 2>&1 | tail -15; npm run build 2>&1 | tail -8; npx tsx tools/simulate.ts --runs 20 | head -5`
Expected: `npm audit` sem alerta **crítico** (se sobrar algum moderado sem correção disponível, registre qual e por quê no relatório); build ok; o simulador roda e imprime a tabela.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git add -u tests vite.config.ts
git commit -m "chore: sobe happy-dom e vitest por alertas de segurança do npm audit (só devDependencies)"
```

---

### Task 5: `docs/ANALISE.md`

**Files:**
- Create: `docs/ANALISE.md`
- Modify: `tools/docs-specs.ts`

**Interfaces:**
- Consumes: `docs:check` (Task 1); spec §3 (C1–C15) e todas as marcações `ASSUMIDO`; o código real.
- Produces: o documento do spec §13.1: inconsistências, correções, o que foi mantido e todas as suposições `ASSUMIDO`.

- [ ] **Step 1: Registrar a especificação do documento (o teste que falha)**

Em `tools/docs-specs.ts`, troque a lista por:

```ts
export const DOC_SPECS: DocSpec[] = [
  {
    path: 'docs/ANALISE.md',
    headings: [
      'Análise do DD v2 e decisões do MVP',
      '1. Como ler este documento',
      '2. Inconsistências encontradas e correções (C1–C15)',
      '3. O que foi mantido do DD v2',
      '4. Suposições (ASSUMIDO)',
      '5. Decisões tomadas depois da spec',
      '6. Metas de balanceamento: metas de design × faixas de regressão',
      '7. Problemas conhecidos',
    ],
    minFacts: 6,
  },
];
```

Run: `npm run docs:check`
Expected: FAIL com `docs/ANALISE.md: arquivo ausente`.

- [ ] **Step 2: Levantar os fatos (leitura, sem escrever ainda)**

Run: `grep -n "ASSUMIDO" docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md`, `grep -rn "ASSUMIDO" src tools`, e leia a tabela da spec §3 (linhas 83–101). Para cada `Cn`, abra o arquivo do motor que implementa a correção e anote o caminho (ex.: C1 → `src/game/combat/damage.ts`, C5 → `src/game/combat/enemyFactory.ts`, C6 → `src/game/combat/ai.ts` e `src/game/Balance.ts`, C12 → `src/game/progression/unlock.ts` e `src/game/run/runManager.ts`, C13 → `src/game/combat/battle.ts`, C14 → `src/data/titles.ts`). Confirme cada caminho com `ls` antes de citar.

- [ ] **Step 3: Escrever `docs/ANALISE.md` com este esqueleto**

```markdown
# Análise do DD v2 e decisões do MVP

> Documento da spec §13.1. Cada afirmação sobre o código cita o arquivo; cada número do balanceamento vem do `BALANCE` e é marcado com `<!-- fact: BALANCE.x.y=valor -->` (o `npm run docs:check` confere).

## 1. Como ler este documento
(Duas ou três frases: o que é o DD v2, o que é a spec do MVP, o que significa `ASSUMIDO`, e como achar o código.)

## 2. Inconsistências encontradas e correções (C1–C15)
(Uma subseção `### C1 — título curto` ... `### C15 — título curto`. Em cada uma, exatamente estas três linhas em negrito:
`**Problema no DD v2:**` (a frase do DD v2 e por que não fecha), `**Correção:**` (o que o MVP faz),
`**Onde está no código:**` (caminho(s) em crase, conferidos com `ls`).)

## 3. O que foi mantido do DD v2
(Lista por tema — fórmulas, clãs, jutsus F1A, economia, saga — com o caminho do dado/regra em crase. Cite pelo menos 5 itens.)

## 4. Suposições (ASSUMIDO)
(Uma tabela com TODAS as marcações `ASSUMIDO` encontradas no Step 2, na ordem da spec: coluna `Suposição`, coluna `Por quê`, coluna `Onde está` (caminho em crase). Nenhuma pode faltar: compare a contagem da tabela com a saída do `grep`.)

## 5. Decisões tomadas depois da spec
(Uma subseção `### título` para cada decisão da lista abaixo, com o motivo e o arquivo.)

## 6. Metas de balanceamento: metas de design × faixas de regressão
(Explique a decisão do `docs/balance-log.md` "faixas por build"; inclua a tabela das 8 faixas e cite `src/game/sim/report.ts`.)

## 7. Problemas conhecidos
(Lista curta: `npm run sim` leva ~141 s (meta da spec: 30 s); Uchiha no limite inferior; Haku quase sempre cai para Uzumaki; conferência visual no navegador não feita por teste; `ANALISE` não cobre F2/F3.)
```

Decisões da seção 5 (todas já tomadas e registradas; confirme cada uma no código antes de citar):

1. **HP do Haku ×1,7 em vez de ×1,5 da C6** — `src/game/Balance.ts`, `enemyGrades.B.hpMult` <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->; Zabuza foi para HP ×2,1 <!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 --> e dano 0,81 <!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 -->; a C6 define o objetivo (Haku mais fácil que Zabuza), não o literal.
2. **Dano dos comuns (grau D) 0,65** <!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 --> — calibração do simulador (`docs/balance-log.md`).
3. **Métrica de maestria = jutsu principal** (o mais usado da run), como a spec §12 pede — `src/game/sim/bot.ts` e `src/game/sim/report.ts`.
4. **Robô do simulador não defende dois turnos seguidos** e compra na ordem estrita do Apêndice A.5 — `src/game/sim/bot.ts`.
5. **Título "Por um Fio" usa o limite de HP dos dados** (`bossMinHpPct`, não um 0,1 fixo) — `src/game/meta/stats.ts` e `src/data/titles.ts`.
6. **`recordRunEnd` idempotente** (id estável `run-${startedAt}-${seed}` e `lastRecordedRunId`) e **boot que finaliza uma run encerrada** — `src/game/meta/meta.ts`, `src/store/GameStore.ts`.
7. **Save**: `loadRun`/`loadMeta` nunca lançam e põem o save inválido em quarentena; aceita `nodeIndex === nodes.length` só na vitória — `src/game/save/save.ts`.
8. **Enciclopédia mostra jutsus bloqueados com requisitos** (alimenta as metas "faltam X para Y", spec §5) — `src/ui-dom/screens/EncyclopediaScreen.ts`.
9. **Títulos Colecionador e Novo Chunin ocultos até a F2** (C14) — `src/data/titles.ts`.
10. **Abandonar a run com a gravação da meta falhando** deixa a run salva; volta como ativa no próximo boot — `src/store/GameStore.ts`.
11. **Erro de render ou de animação nunca prende o jogador** (`GameStore.fail`, tela de erro com Recarregar) — `src/store/GameStore.ts`, `src/ui-dom/App.ts`.
12. **`phaser` fixo em `~3.88.2`; `happy-dom`/`vitest` atualizados por alertas de segurança** (Task 4 do Plano 3) — `package.json`.

- [ ] **Step 4: Rodar o verificador**

Run: `npm run docs:check`
Expected: `Documentos conferidos: 1.` Se falhar, leia a lista (título ausente, caminho inexistente, fato divergente, marcador proibido) e corrija o documento — **nunca** o verificador.

- [ ] **Step 5: Autoconferência**

Confira: (a) a tabela de `ASSUMIDO` tem tantas linhas quanto o `grep` do Step 2; (b) as 15 subseções `### C1` a `### C15` existem (`grep -c "^### C[0-9]" docs/ANALISE.md` → 15); (c) nenhuma frase afirma um valor que você não leu no código.

- [ ] **Step 6: Commit**

```bash
git add docs/ANALISE.md tools/docs-specs.ts
git commit -m "docs: ANALISE.md com inconsistências, correções C1–C15, suposições e decisões do MVP"
```

---

### Task 6: Curso — índice e Alfa 0.1 a 0.3

**Files:**
- Create: `docs/curso/README.md`, `docs/curso/alfa-0.1.md`, `docs/curso/alfa-0.2.md`, `docs/curso/alfa-0.3.md`
- Modify: `tools/docs-specs.ts`

**Interfaces:**
- Consumes: `docs:check` com `course: true` (Task 1); o histórico real do repositório (`git show <sha>` mostra o que cada versão acrescentou).
- Produces: as primeiras três versões do curso e o índice `docs/curso/README.md`.

**Modelo de cada versão do curso** (vale para as Tasks 6–9). Cada arquivo segue exatamente este esqueleto; os títulos de `## ` e `### ` são verificados:

```markdown
# Alfa 0.1 — título da versão

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `<sha curto>` ... (use `git log --oneline` para conferir).

## Objetivo
(Uma frase: o que o jogo passa a ter ao fim desta versão que não tinha antes.)

## Escopo
### Entra
(Lista: o que esta versão constrói, cada item com o arquivo em crase.)
### Fica de fora
(Lista: o que fica para versões seguintes ou para o pós-MVP, com o motivo.)

## Passo a passo
### Passo 1 — título do passo
**O quê**: o que fazer, com o arquivo e a função.
**Por quê**: a razão técnica e a razão de jogo (explique o conceito de jogo para quem nunca fez um).
**Alternativas**: pelo menos uma alternativa considerada e por que não foi escolhida.
**Riscos e armadilhas**: o que quebra se feito errado; cite um problema real do histórico quando houver.
### Passo 2 — ...
### Passo 3 — ...
(No mínimo 3 passos; use quantos forem precisos.)

## Critérios de conclusão
(Lista verificável: comandos e resultados, por exemplo `npx vitest run tests/rng.test.ts` passa.)

## Testes
(Quais testes cobrem a versão, com o caminho de cada arquivo de teste e o que cada um prova.)

## Patch log
### Adicionado
### Alterado
### Corrigido
### Removido
### Problemas conhecidos
(Em cada seção do patch log, itens em lista; escreva `Nada nesta versão.` se vazio.)
```

Regras de escrita (todas as tasks do curso): (1) abra os arquivos listados na task **antes** de escrever; (2) todo caminho em crase tem de existir (`docs:check` confere); (3) valores numéricos de balanceamento levam `<!-- fact: BALANCE.x.y=valor -->` colado ao número; (4) os "riscos e armadilhas" vêm do histórico real: `git log --oneline -- <arquivo>` e os commits `fix:` mostram o que quebrou de verdade; (5) explique "RNG com semente", "turno", "máquina de estados", "tick" quando aparecerem pela primeira vez; (6) a "Alfa X" descreve o código como estava **ao fim** da versão, mas aponte o que mudou depois quando relevante ("Alterado na Beta 0.9.1").

- [ ] **Step 1: Registrar as especificações (o teste que falha)**

Em `tools/docs-specs.ts`, acrescente no topo do arquivo `import { COURSE_HEADINGS } from './docs-lib';` (junto do `import type`) e, dentro de `DOC_SPECS`, depois da entrada de `ANALISE`:

```ts
  { path: 'docs/curso/README.md', headings: ['Curso: do zero ao NarutoTxGame', 'Como ler', 'Versões', 'Pré-requisitos'] },
  { path: 'docs/curso/alfa-0.1.md', headings: ['Alfa 0.1 — Projeto e RNG com semente', ...COURSE_HEADINGS], course: true },
  { path: 'docs/curso/alfa-0.2.md', headings: ['Alfa 0.2 — Tipos, constantes e fórmulas', ...COURSE_HEADINGS], course: true, minFacts: 4 },
  { path: 'docs/curso/alfa-0.3.md', headings: ['Alfa 0.3 — Dados do jogo e validação', ...COURSE_HEADINGS], course: true },
```

(`import { COURSE_HEADINGS, type DocSpec } from './docs-lib';` pode substituir os dois imports.)

Run: `npm run docs:check`
Expected: FAIL com `arquivo ausente` para os quatro arquivos novos.

- [ ] **Step 2: Escrever `docs/curso/README.md`**

Título `# Curso: do zero ao NarutoTxGame`. Seções obrigatórias:
- `## Como ler`: o curso reconstrói o jogo em 12 versões; cada versão termina com a suíte verde; os arquivos citados existem no repositório e o `npm run docs:check` confere isso.
- `## Pré-requisitos`: Node 22, JavaScript/TypeScript, Git; **nenhuma** experiência em jogos.
- `## Versões`: uma tabela com as 12 versões (`Versão | Título | Arquivo | Commits`). Use exatamente esta ordem e estes títulos: Alfa 0.1 Projeto e RNG com semente · 0.2 Tipos, constantes e fórmulas · 0.3 Dados do jogo e validação · 0.4 Personagem e progressão · 0.5 Efeitos e resolução de golpe · 0.6 Batalha por turnos e IA · 0.7 Loja, run e meta-progressão · 0.8 Save e simulador · Beta 0.9.0 Casca da interface e GameStore · 0.9.1 Telas · 0.9.2 Batalha em Phaser · 1.0 Robustez, calibração e entrega. Os links apontam para `alfa-0.1.md`... `1.0.md` (os arquivos das Tasks 7–9 ainda não existem; escreva o link mesmo assim, em texto simples, sem crase, para o `docs:check` não os tratar como caminho).

- [ ] **Step 3: Escrever `docs/curso/alfa-0.1.md`** — **Alfa 0.1 — Projeto e RNG com semente**

Commits: `6e0b7ec`. Arquivos-fonte (leia): `src/game/Rng.ts`, `tests/rng.test.ts`, `vite.config.ts`, `package.json`, `tsconfig.json`. Passos mínimos:
1. **Projeto TypeScript estrito com Vitest** — por quê estrito (o motor é regra pura, tipos pegam erro de regra), alternativa (JS puro), armadilha (`noUncheckedIndexedAccess` e `!`).
2. **Um gerador de números aleatórios com semente (`Rng`)** — explique "RNG com semente" para quem nunca viu: mesma semente ⇒ mesmo jogo; por que `Math.random` é proibido no motor (replay, testes, save-scum); o algoritmo `mulberry32` de `src/game/Rng.ts`; alternativa (`seedrandom`), armadilha (guardar o estado como número para salvar).
3. **Testes de determinismo** — o que `tests/rng.test.ts` prova e por que `sort()` lexicográfico em teste de números é uma armadilha (registrada como minor adiado no Plano 1).
Critérios: `npx vitest run tests/rng.test.ts` passa. Patch log: `Adicionado`: estrutura, `Rng`; `Problemas conhecidos`: sem valores fixos do `mulberry32` nos testes.

- [ ] **Step 4: Escrever `docs/curso/alfa-0.2.md`** — **Alfa 0.2 — Tipos, constantes e fórmulas**

Commits: `4181fe6`. Arquivos-fonte: `src/game/types.ts`, `src/game/attributes.ts`, `src/game/Balance.ts`, `src/game/formulas.ts`, `src/game/errors.ts`, `tests/formulas.test.ts`. Passos mínimos:
1. **`Balance.ts` como fonte única de números** — por quê (balancear sem caçar números), alternativa (constantes espalhadas), armadilha (número mágico fora dele; cite a regra do plano). Inclua fatos verificados: <!-- fact: BALANCE.damage.attrDivisor=40 -->, <!-- fact: BALANCE.dodge.capPct=40 -->, <!-- fact: BALANCE.crit.capPct=55 -->, <!-- fact: BALANCE.defense.cap=0.6 -->, <!-- fact: BALANCE.defense.totalCap=0.75 --> (cada um colado ao número no texto).
2. **Fórmulas puras** (`maxHp`, `maxChakra`, dano-base, esquiva, crítico, XP) — por quê puras (testar sem jogo), por quê tetos (esquiva 40%, crítico 55%).
3. **`RuleError` com `code`** — por quê erro tipado (a interface decide a mensagem), alternativa (`Error` genérico).
Critérios: `npx vitest run tests/formulas.test.ts` passa. Patch log `Problemas conhecidos`: chances sem piso em 0 com bônus negativo (não há bônus negativos nos dados do MVP).

- [ ] **Step 5: Escrever `docs/curso/alfa-0.3.md`** — **Alfa 0.3 — Dados do jogo e validação**

Commits: `13217f7`. Arquivos-fonte: `src/data/story.ts`, `effects.ts`, `jutsus.ts`, `clans.ts`, `items.ts`, `enemies.ts`, `saga.ts`, `titles.ts`, `validate.ts`, `tests/data.test.ts`. Passos mínimos:
1. **Conteúdo como dados tipados, regras como código** — por quê (novo jutsu sem código novo), alternativa (um `if` por jutsu).
2. **Validação com Zod e referências cruzadas** — o que `validateGameData`/`assertGameData` conferem (ids duplicados, pré-requisito inexistente), por quê falhar cedo, armadilha (schemas parciais: o que a validação ainda não cobre).
3. **A regra fixa de desbloqueio** (spec §5) — os campos `requires`, `clan`, `minStory`, `prereq` de `JutsuDef`, por que equipamento não conta, e o jutsu `enemyOnly` (golpes de inimigo que o jogador nunca aprende).
Critérios: `npx vitest run tests/data.test.ts` passa. Patch log `Problemas conhecidos`: `ELITE_OF` e ciclos de pré-requisito não validados.

- [ ] **Step 6: Rodar o verificador e conferir**

Run: `npm run docs:check`
Expected: `Documentos conferidos: 5.` Autoconferência: cada passo tem os quatro rótulos; os fatos estão colados ao número; os caminhos existem.

- [ ] **Step 7: Commit**

```bash
git add docs/curso tools/docs-specs.ts
git commit -m "docs: curso — índice e Alfa 0.1 a 0.3"
```

---

### Task 7: Curso — Alfa 0.4 a 0.6

**Files:**
- Create: `docs/curso/alfa-0.4.md`, `docs/curso/alfa-0.5.md`, `docs/curso/alfa-0.6.md`
- Modify: `tools/docs-specs.ts`

**Interfaces:** mesmo modelo e regras de escrita da Task 6.

- [ ] **Step 1: Registrar as especificações (o teste que falha)**

Acrescente em `DOC_SPECS`:

```ts
  { path: 'docs/curso/alfa-0.4.md', headings: ['Alfa 0.4 — Personagem e progressão', ...COURSE_HEADINGS], course: true, minFacts: 2 },
  { path: 'docs/curso/alfa-0.5.md', headings: ['Alfa 0.5 — Efeitos e resolução de golpe', ...COURSE_HEADINGS], course: true, minFacts: 3 },
  { path: 'docs/curso/alfa-0.6.md', headings: ['Alfa 0.6 — Batalha por turnos e IA', ...COURSE_HEADINGS], course: true, minFacts: 3 },
```

Run: `npm run docs:check`
Expected: FAIL (`arquivo ausente` para os três).

- [ ] **Step 2: Escrever `docs/curso/alfa-0.4.md`** — **Alfa 0.4 — Personagem e progressão**

Commit: `58685ee`. Arquivos-fonte: `src/game/progression/character.ts`, `loadout.ts`, `mastery.ts`, `unlock.ts`, `tests/progression.test.ts`, `tests/unlock.test.ts`. Passos mínimos:
1. **Criar o personagem** (`createCharacter`: 10 pontos, destaques, clã, afinidade, título) — fatos <!-- fact: BALANCE.attributes.start=5 --> e <!-- fact: BALANCE.attributes.creationPoints=10 --> colados aos números; armadilha: `RuleError('unknownTitle')` (título inexistente) foi acrescentado só na revisão final do Plano 1.
2. **XP, níveis e escolha 1-de-3 por nível** (`gainXp`: um laço que pode subir vários níveis de uma vez) — fato <!-- fact: BALANCE.xp.toNextBase=24 -->; armadilha: um chefe dá XP de vários níveis (Review Focus 5 do Plano 1) e `NaN`/`Infinity` num `while` seria um laço infinito.
3. **Desbloqueio de jutsu só por status** (`checkUnlocks` itera até estabilizar; atributo **base**, não efetivo) — explique por quê; **4 slots**: jutsu aprendido com os slots cheios vai para o repertório sem expulsar ninguém (`slotCount`).
4. **Maestria** (`masteryLevelFromUses`, teto +5 e +3 fora da afinidade) — por quê usar "usos" e não XP.
Critérios: `npx vitest run tests/progression.test.ts tests/unlock.test.ts` passa. Patch log `Problemas conhecidos`: `gainXp` sem teto de nível; `unequipJutsu` com id não equipado é um no-op silencioso.

- [ ] **Step 3: Escrever `docs/curso/alfa-0.5.md`** — **Alfa 0.5 — Efeitos e resolução de golpe**

Commits: `41b4395`, `cad6791`. Arquivos-fonte: `src/game/combat/types.ts`, `src/game/events.ts`, `src/game/effects/EffectSystem.ts`, `src/game/combat/cost.ts`, `src/game/combat/damage.ts`, `tests/effects.test.ts`, `tests/damage.test.ts`, `tests/helpers.ts`. Passos mínimos:
1. **Eventos (`GameEvent`) como a "saída" do motor** — por quê: a interface anima e escreve o log a partir deles; alternativa (callbacks); armadilha: um tipo novo de evento some do log se o `default` não for exaustivo.
2. **Sistema genérico de efeitos** (`applyEffect`, `tickDurations`, `aggregateMods`) e **Transformação** (Sharingan: ativação 0, manutenção por turno) — explique "efeito por tempo" e "carga"; controle e Tenacidade (teto 2 turnos em comuns, 1 em chefes). Armadilha: as funções do `EffectSystem` mutam um combatente **já clonado**: exceção documentada à regra "o motor não muta o argumento".
3. **Resolver um golpe** (`resolveHit`: Kawarimi → Henge → esquiva → crítico → variação) — a **fórmula de dano** da spec §4 e as correções C1 (maestria `(1 + 0,03·m)`) e C2 (balde aditivo único): fatos <!-- fact: BALANCE.mastery.damagePerLevel=0.03 --> e <!-- fact: BALANCE.power.attack=18 -->; por quê a **ordem dos sorteios** é contrato (testes de determinismo).
4. **Piso de dano** vem de `BALANCE.damage.minDamage` (não é número mágico): <!-- fact: BALANCE.damage.minDamage=1 -->.
Critérios: `npx vitest run tests/effects.test.ts tests/damage.test.ts` passa. Patch log: `Problemas conhecidos`: `chargeChance ?? 0` engole dado ausente; `effectiveAttr` sem piso em 0.

- [ ] **Step 4: Escrever `docs/curso/alfa-0.6.md`** — **Alfa 0.6 — Batalha por turnos e IA**

Commits: `3887828`, `350f4eb`. Arquivos-fonte: `src/game/combat/battle.ts`, `src/game/combat/ai.ts`, `src/game/combat/enemyFactory.ts`, `tests/battle.test.ts`, `tests/ai.test.ts`. Passos mínimos:
1. **A batalha como máquina de estados** (`startBattle`, `applyAction`, `status: 'running' | 'awaitingInput' | ...`) — explique "máquina de estados" e "turno sequencial" para quem nunca fez jogo; `applyActionInPlace` só existe para o simulador (desempenho).
2. **Início do turno**: regen, manutenção, dano por tempo, controle — armadilha real (Review Focus 3 do Plano 1): o jogador morre por queimadura no início do próprio turno e a batalha tem de terminar sem esperar ação; `transformOff` com motivo `battleEnd`. Fato: <!-- fact: BALANCE.battle.maxRounds=200 --> (batalha que passa disso termina em derrota por tempo).
3. **Ações do jogador** (Atacar, Defender, Meditar, Item, Jutsu, Transformar) e **Kai** sob Ilusão (C13).
4. **IA dos inimigos e geração por nível** (`distributePoints`, `createEnemy`; spec C5/C6; padrões de Zabuza e Haku com 2ª fase abaixo de 50% de HP) — fatos <!-- fact: BALANCE.ai.defensiveHpPct=0.25 --> e <!-- fact: BALANCE.ai.phase2HpPct=0.5 -->; HP por grau com <!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 --> e <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->.
Critérios: `npx vitest run tests/battle.test.ts tests/ai.test.ts` passa. Patch log `Corrigido`: limiares da IA passaram de literais para `BALANCE.ai` (revisão do Plano 1). `Problemas conhecidos`: o Zabuza escolhe por vantagem elemental, não por "maior dano esperado".

- [ ] **Step 5: Rodar o verificador e commitar**

Run: `npm run docs:check`
Expected: `Documentos conferidos: 8.`

```bash
git add docs/curso tools/docs-specs.ts
git commit -m "docs: curso — Alfa 0.4 a 0.6"
```

---

### Task 8: Curso — Alfa 0.7, 0.8 e Beta 0.9.0

**Files:**
- Create: `docs/curso/alfa-0.7.md`, `docs/curso/alfa-0.8.md`, `docs/curso/beta-0.9.0.md`
- Modify: `tools/docs-specs.ts`

**Interfaces:** mesmo modelo e regras da Task 6.

- [ ] **Step 1: Registrar as especificações (o teste que falha)**

```ts
  { path: 'docs/curso/alfa-0.7.md', headings: ['Alfa 0.7 — Loja, run e meta-progressão', ...COURSE_HEADINGS], course: true, minFacts: 3 },
  { path: 'docs/curso/alfa-0.8.md', headings: ['Alfa 0.8 — Save e simulador', ...COURSE_HEADINGS], course: true, minFacts: 2 },
  { path: 'docs/curso/beta-0.9.0.md', headings: ['Beta 0.9.0 — Casca da interface e GameStore', ...COURSE_HEADINGS], course: true },
```

Run: `npm run docs:check` → Expected: FAIL (`arquivo ausente`).

- [ ] **Step 2: Escrever `docs/curso/alfa-0.7.md`** — **Alfa 0.7 — Loja, run e meta-progressão**

Commits: `bbc2e8f`, `6d7f716`, `9b57eeb`, `e47876f`. Arquivos-fonte: `src/game/run/shop.ts`, `src/game/run/runManager.ts`, `src/game/run/types.ts`, `src/game/run/battleSetup.ts`, `src/game/meta/stats.ts`, `src/game/meta/meta.ts`, `tests/shop.test.ts`, `tests/run.test.ts`, `tests/stats.test.ts`, `tests/meta.test.ts`. Passos mínimos:
1. **Loja com estoque sorteado e Pergaminho Raro** — fatos <!-- fact: BALANCE.shop.rareScrollMaxPerRun=5 --> e <!-- fact: BALANCE.shop.rewardRyo=60 -->; por quê validar antes de clonar (erro nunca deixa estado pela metade).
2. **O ciclo da run** (`RunState`, mapa de 26 nós, Acampamento, elites, `startEncounter`/`battleAction`/`finishEncounter`) — fato <!-- fact: BALANCE.run.eliteForks=3 -->, <!-- fact: BALANCE.recovery.encounterHpPct=0.25 -->; **anti save-scum**: `encounterStart` guarda o estado do RNG antes do encontro.
3. **Estatísticas da run por eventos** (`trackBattleEvents`) — por quê derivar de eventos e não contar no motor; título "Por um Fio" usa `bossMinHpPct`.
4. **Meta-progressão** (Histórico de 50 runs — <!-- fact: BALANCE.history.maxEntries=50 -->; títulos; Enciclopédia) e `recordRunEnd`; armadilha real: a versão inicial **não era idempotente** e o id dependia do relógio; a revisão final do Plano 1 trocou por `run-${startedAt}-${seed}` + `lastRecordedRunId`.
Critérios: `npx vitest run tests/shop.test.ts tests/run.test.ts tests/stats.test.ts tests/meta.test.ts` passa. Patch log `Problemas conhecidos`: `buyItem` sem `else` para `kind` desconhecido.

- [ ] **Step 3: Escrever `docs/curso/alfa-0.8.md`** — **Alfa 0.8 — Save e simulador**

Commits: `3df4c72`, `c8dc2ea`, `3395adb`, `6b09742`, `e4db64a`. Arquivos-fonte: `src/game/save/save.ts`, `src/game/sim/bot.ts`, `src/game/sim/builds.ts`, `src/game/sim/report.ts`, `tools/simulate.ts`, `docs/balance-log.md`, `tests/save.test.ts`, `tests/sim.test.ts`. Passos mínimos:
1. **Save versionado com migração** (`nxr.run.v1`/`nxr.meta.v1`, `KeyValueStore` injetável) — por quê injetar (o motor não toca `localStorage`); **save inválido vai para quarentena** (`nxr.<tipo>.corrupt.<now>`); a leitura nunca lança — armadilha real: a primeira versão deixava um `setItem` de backup lançar dentro do `catch`.
2. **Simulador headless** (`simulateRun`, 8 builds, `simulateMany`) — por quê simular (balancear com dados, não com palpite); armadilha real: o robô entrava em **espiral de defesa** e distorcia "chega a Zabuza" (corrigido: não defende dois turnos seguidos).
3. **Metas e calibração** — as metas da spec §12, o limite de 8 iterações, os botões permitidos; resultado: 4 iterações, 23 → 8 metas fora; fatos <!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 --> e <!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 -->.
Critérios: `npx vitest run tests/save.test.ts tests/sim.test.ts` passa. Patch log: `Alterado`: o `sim:check` ganhou faixas por build na Task 2 do Plano 3 (descreva em uma linha). `Problemas conhecidos`: `npm run sim` leva ~141 s.

- [ ] **Step 4: Escrever `docs/curso/beta-0.9.0.md`** — **Beta 0.9.0 — Casca da interface e GameStore**

Commits: `0d07169`, `593aeca`, `ff7bc45`, `cbb351a`, `c8b9b93`, `1dfd7cd`. Arquivos-fonte: `index.html`, `src/main.ts`, `src/styles.css`, `src/i18n/pt-BR.ts`, `src/store/GameStore.ts`, `src/ui-dom/view/derived.ts`, `src/ui-dom/view/log.ts`, `src/game/progression/presets.ts`, `tests/ui/memoryStore.ts`, `tests/ui/store.test.ts`, `tests/ui/store-battle.test.ts`. Passos mínimos:
1. **Camadas: motor puro → `GameStore` → telas** — explique "fonte única da verdade"; só `src/main.ts` usa `localStorage`, relógio e semente.
2. **i18n: toda string de interface em `src/i18n/pt-BR.ts`** — por quê (consistência, revisão de texto num arquivo só); armadilha: separadores como `' · '` esquecidos no código.
3. **O `GameStore`**: comandos devolvem `true`/`false`, o motor decide, o store salva, registra o fim da run **no mesmo comando** e publica estado + eventos; **trava `locked`** durante a animação (só a primeira tecla vale). Armadilha real: salvar a run morta e apagar o save em dois `try` separados.
4. **Derivados de tela puros** (Poder Ninja, prévia da criação, metas "faltam X para Y") em `src/ui-dom/view/derived.ts` — por quê puros: testáveis sem DOM.
Critérios: `npx vitest run tests/ui/store.test.ts tests/ui/store-battle.test.ts tests/ui/derived.test.ts` passa; `npm run build` gera `dist/`. Patch log `Problemas conhecidos`: o store ainda permite `go`/`back` com a luta em andamento (a BattleScreen não oferece o caminho); mitigado na Task 3 do Plano 3 para a tela `battle` travada.

- [ ] **Step 5: Rodar o verificador e commitar**

Run: `npm run docs:check` → Expected: `Documentos conferidos: 11.`

```bash
git add docs/curso tools/docs-specs.ts
git commit -m "docs: curso — Alfa 0.7, 0.8 e Beta 0.9.0"
```

---

### Task 9: Curso — Beta 0.9.1, 0.9.2 e 1.0

**Files:**
- Create: `docs/curso/beta-0.9.1.md`, `docs/curso/beta-0.9.2.md`, `docs/curso/1.0.md`
- Modify: `tools/docs-specs.ts`

**Interfaces:** mesmo modelo e regras da Task 6.

- [ ] **Step 1: Registrar as especificações (o teste que falha)**

```ts
  { path: 'docs/curso/beta-0.9.1.md', headings: ['Beta 0.9.1 — Telas', ...COURSE_HEADINGS], course: true },
  { path: 'docs/curso/beta-0.9.2.md', headings: ['Beta 0.9.2 — Batalha em Phaser', ...COURSE_HEADINGS], course: true, minFacts: 1 },
  { path: 'docs/curso/1.0.md', headings: ['1.0 — Robustez, calibração e entrega', ...COURSE_HEADINGS], course: true, minFacts: 1 },
```

Run: `npm run docs:check` → Expected: FAIL.

- [ ] **Step 2: Escrever `docs/curso/beta-0.9.1.md`** — **Beta 0.9.1 — Telas**

Commits: `5425a49`, `f015e01`, `a369ca2`, `52d7088`, `e148bb1` e as correções `230e841`, `f8eba1e`, `742335d`, `2a4f2a7`, `4e57c67`. Arquivos-fonte: `src/ui-dom/dom.ts`, `src/ui-dom/App.ts`, `src/ui-dom/types.ts`, `src/ui-dom/screens/index.ts`, as telas em `src/ui-dom/screens/` (`MenuScreen.ts`, `CreateScreen.ts`, `MapScreen.ts`, `ResultScreen.ts`, `RunEndScreen.ts`, `PrepScreen.ts`, `SheetScreen.ts`, `EncyclopediaScreen.ts`, `HistoryScreen.ts`, `TitlesScreen.ts`, `ErrorScreen.ts`), `src/ui-dom/components/tabBar.ts`, `src/ui-dom/components/radar.ts`, `tests/ui/dom.test.ts`, `tests/ui/create.test.ts`, `tests/ui/map-result.test.ts`, `tests/ui/prep-sheet.test.ts`, `tests/ui/meta-screens.test.ts`. Passos mínimos:
1. **Telas como funções `(ctx) => HTMLElement` re-renderizadas a cada mudança** — por quê (sem estado escondido), alternativa (framework), armadilha real: o re-render perde o foco do teclado.
2. **Texto sempre via `h()`/nó de texto, nunca `innerHTML`** — Review Focus 5 do Plano 2: um nome `<img src=x onerror=alert(1)>` aparece como texto em todas as telas.
3. **Acessibilidade mínima (spec §10): nada só por cor** — aba ativa com `✓`, clã selecionado com `aria-pressed`, botão desabilitado com o motivo em texto; armadilha real: três correções vieram de revisões que pegaram estado só por cor.
4. **Criação, Mapa, Resultado (1-de-3), Preparação, Ficha com radar, Enciclopédia, Histórico, Títulos** — uma linha por tela dizendo o que mostra e de que dado vem; armadilha real: o estado "Treino selecionado" vazava para a oferta seguinte.
Critérios: `npx vitest run tests/ui` passa. Patch log `Corrigido`: os itens acima. `Problemas conhecidos`: o re-render perde o foco do teclado; o overlay de troca de jutsu não prende o foco.

- [ ] **Step 3: Escrever `docs/curso/beta-0.9.2.md`** — **Beta 0.9.2 — Batalha em Phaser**

Commits: `9ab3025`, `95f4d50`. Arquivos-fonte: `src/scenes/animationQueue.ts`, `src/scenes/BattleScene.ts`, `src/scenes/BootScene.ts`, `src/scenes/createGame.ts`, `src/ui-dom/screens/BattleScreen.ts`, `src/main.ts`, `tests/ui/animation.test.ts`, `tests/ui/battle-hud.test.ts`. Passos mínimos:
1. **Phaser só desenha; o motor decide** — por quê (regra no motor = testável), alternativa (lógica na cena), armadilha: só `src/main.ts` e `src/scenes/**` podem importar `phaser`.
2. **Fila de animação testável sem Phaser** (`stepsFor`, `AnimationQueue`, `waitStep` com relógio de garantia) — explique "loop de jogo" e por que o Phaser dorme fora da batalha (`loop.sleep()`/`wake()`); armadilha: uma aba em segundo plano para o loop e o jogo travaria sem o `setTimeout` de garantia.
3. **HUD em DOM sobre o canvas e atalhos** (`1`–`4`, `A`, `D`, `M`, `I`, `T`, `Enter`, `Esc`) — selecionar e depois confirmar o jutsu; o botão e a tecla decidem pelo **mesmo predicado** (`basicBlock`); `e.repeat` é ignorado.
4. **A morte é registrada antes da animação** — por quê (fechar a aba durante a animação não perde o Histórico).
Fato: <!-- fact: BALANCE.battle.maxRounds=200 -->. Critérios: `npx vitest run tests/ui/animation.test.ts tests/ui/battle-hud.test.ts` passa; `npm run build` passa. Patch log `Problemas conhecidos`: a verificação visual da BattleScene só foi feita por build e por requisição HTTP, não no navegador (ver o roteiro de conferência visual, criado na Task 13).

- [ ] **Step 4: Escrever `docs/curso/1.0.md`** — **1.0 — Robustez, calibração e entrega**

Commits: `0b6fbee`, `5aa63f0`, `bec6a2e` e as tasks de código do Plano 3 (use `git log --oneline` para os hashes). Arquivos-fonte: `tests/ui/e2e.test.ts`, `tests/ui/robustness.test.ts`, `src/store/GameStore.ts`, `src/ui-dom/App.ts`, `src/game/sim/report.ts`, `tools/simulate.ts`, `tools/docs-check.ts`, `README.md`, `docs/balance-log.md`, `package.json`. Passos mínimos:
1. **A run completa pela interface, com os 3 clãs** (`tests/ui/e2e.test.ts`) — por quê: o critério de pronto da spec §13; o teste monta o `App`, então um erro de render derruba o teste; `strong` + `scenario` provam a vitória de cada clã.
2. **Erro inesperado nunca prende o jogador** (`GameStore.fail`, `App.render` com `try/catch`, animador que falha solta a trava) — armadilha real: a revisão final achou que um render que lança deixava `locked: true` para sempre.
3. **Faixas de regressão por build** (`BUILD_BANDS`, `designGaps`) — por quê (a distância entre builds é maior que a largura das metas), alternativa (mexer no design do jogo), e o que isso NÃO resolve; fato <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->.
4. **Documentos verificáveis** (`npm run docs:check`: caminhos, títulos e fatos do `BALANCE`) — por quê (documento desatualizado é pior que nenhum).
5. **Entrega**: `npm install && npm run dev` abre o jogo; `npm run build` gera `dist/` estático; `npm test`, `npm run sim:check`, `npm run docs:check` verdes.
Critérios: os cinco comandos do passo 5 passam. Patch log `Problemas conhecidos`: `npm run sim` leva ~141 s; Uchiha vence Zabuza em ~41% (3000 runs); conferência visual pendente do usuário.

- [ ] **Step 5: Rodar o verificador e commitar**

Run: `npm run docs:check` → Expected: `Documentos conferidos: 14.`

```bash
git add docs/curso tools/docs-specs.ts
git commit -m "docs: curso — Beta 0.9.1, 0.9.2 e 1.0"
```

---

### Task 10: `docs/DESIGN.md` v3 — seções 1 a 8

**Files:**
- Create: `docs/DESIGN.md`
- Modify: `tools/docs-specs.ts`

**Interfaces:**
- Consumes: DD v2 (`docs/referencia/NarutoTxGame_Documento_de_Design_v2.md`), a spec, `docs/ANALISE.md` (Task 5), o código.
- Produces: a primeira parte do Documento de Design v3 (spec §13.4); as Tasks 11 e 12 acrescentam o resto no mesmo arquivo.

**Regras de reescrita do DESIGN v3 (Tasks 10–12):**
1. A estrutura segue a do DD v2: as 21 seções e os 5 apêndices, com os mesmos números e os mesmos títulos (o título do Apêndice E vira "Registro de Mudanças (v3.0)").
2. Cada seção começa com uma linha `**Estado:** Implementado (MVP)`, `**Estado:** Parcial (MVP)` ou `**Estado:** Futuro (F2/F3)`, e termina com o que a spec §1 deixou de fora, quando houver.
3. O texto de cada seção parte do DD v2, **aplica as correções C1–C15** (cite `Cn` entre parênteses onde a correção muda o texto) e **troca todo número pelo valor do código** (`src/game/Balance.ts` e `src/data/*.ts`); números de balanceamento levam `<!-- fact: BALANCE.x.y=valor -->`.
4. Onde o DD v2 descreve algo que o MVP não implementa (F2, F3, online), mantenha o texto de design como visão e marque `**Estado:** Futuro (F2/F3)`.
5. Não invente regra: se o DD v2 e o código divergem, vale o código e a divergência já está em `docs/ANALISE.md` (cite a seção).

- [ ] **Step 1: Registrar a especificação (o teste que falha)**

Em `tools/docs-specs.ts`, acrescente:

```ts
  {
    path: 'docs/DESIGN.md',
    headings: [
      'NarutoTxGame — Documento de Design v3',
      'Sumário',
      '1. Visão Geral do Projeto',
      '2. Pilares do Design',
      '3. Sistema de Atributos e Fórmulas de Base',
      '4. Rank Ninja e Reputação',
      '5. Criação de Personagem',
      '6. Sistema de Clãs',
      '7. Sistema de Chakra e Elementos',
      '8. Sistema de Jutsus e Progressão',
    ],
    minFacts: 10,
    minStateLines: 8,
  },
```

Run: `npm run docs:check` → Expected: FAIL (`docs/DESIGN.md: arquivo ausente`).

- [ ] **Step 2: Levantar o que cada seção precisa (leitura)**

Para cada seção abaixo, leia a seção correspondente do DD v2 e os arquivos indicados; anote só o que o código confirma:

| Seção | Fonte no código |
|---|---|
| 1 Visão Geral | spec §1 (entra/fica de fora), `README.md` |
| 2 Pilares | DD v2 §2 + `docs/ANALISE.md` §3 |
| 3 Atributos e fórmulas | `src/game/Balance.ts`, `src/game/formulas.ts`, `src/game/attributes.ts` (HP, chakra, dano, esquiva, crítico, Poder Ninja em `src/ui-dom/view/derived.ts`) |
| 4 Rank e Reputação | `src/game/run/runManager.ts` (reputação por encontro), spec C8; rank Chunin+ é F2 |
| 5 Criação | `src/ui-dom/screens/CreateScreen.ts`, `src/game/progression/character.ts`, `src/game/progression/presets.ts` (C9) |
| 6 Clãs | `src/data/clans.ts` (Uchiha, Uzumaki, Sem clã no MVP; Hyuuga/Nara/Akimichi/Aburame F2) |
| 7 Chakra e elementos | `src/game/formulas.ts`, `src/game/types.ts` (roda elemental), `src/game/combat/damage.ts` |
| 8 Jutsus e progressão | `src/data/jutsus.ts`, `src/game/progression/unlock.ts`, `loadout.ts`, `mastery.ts` (C12, spec §5) |

- [ ] **Step 3: Escrever `docs/DESIGN.md` — cabeçalho e seções 1 a 8**

Cabeçalho exato (título e sumário):

```markdown
# NarutoTxGame — Documento de Design v3

> Reescrita do DD v2 incorporando as correções C1–C15 (`docs/ANALISE.md`) e os números finais do código e do simulador. Onde este documento e o código divergirem, vale o código.

## Sumário

1. Visão Geral do Projeto · 2. Pilares do Design · 3. Atributos e Fórmulas · 4. Rank Ninja e Reputação · 5. Criação de Personagem · 6. Clãs · 7. Chakra e Elementos · 8. Jutsus e Progressão · 9. Combate e Grau de Inimigos · 10. Efeitos · 11. Economia e Loja · 12. Modo História · 13. Interface · 14. Ficha do Ninja · 15. Progressão e Meta-Progressão · 16. Histórico de Runs · 17. Modo Online · 18. Arquitetura Técnica · 19. Estrutura do Projeto · 20. Visão de Longo Prazo · 21. Roadmap · Apêndices A–E
```

Depois, as seções `## 1. Visão Geral do Projeto` até `## 8. Sistema de Jutsus e Progressão`, cada uma com `**Estado:**`, o texto reescrito e as marcações `<!-- fact: ... -->`. Exemplos de fatos verificáveis para a seção 3: <!-- fact: BALANCE.attributes.start=5 -->, <!-- fact: BALANCE.damage.attrDivisor=40 -->, <!-- fact: BALANCE.dodge.capPct=40 -->, <!-- fact: BALANCE.crit.capPct=55 -->, <!-- fact: BALANCE.defense.cap=0.6 -->, <!-- fact: BALANCE.defense.totalCap=0.75 -->; para a seção 8: <!-- fact: BALANCE.mastery.maxLevel=5 -->, <!-- fact: BALANCE.mastery.damagePerLevel=0.03 -->, <!-- fact: BALANCE.loadout.geninSlots=4 -->. Cole cada marcação logo depois do número a que ela se refere.

- [ ] **Step 4: Rodar o verificador**

Run: `npm run docs:check`
Expected: `Documentos conferidos: 15.` (corrija o documento, nunca o verificador, se falhar.)

- [ ] **Step 5: Autoconferência**

Cada seção tem `**Estado:**` (`grep -c "^\*\*Estado:\*\*" docs/DESIGN.md` ≥ 8); nenhum número de balanceamento sem fonte; as correções C1, C2, C9 e C12 aparecem citadas onde mudam o texto.

- [ ] **Step 6: Commit**

```bash
git add docs/DESIGN.md tools/docs-specs.ts
git commit -m "docs: DESIGN v3 — seções 1 a 8"
```

---

### Task 11: `docs/DESIGN.md` v3 — seções 9 a 16

**Files:**
- Modify: `docs/DESIGN.md`, `tools/docs-specs.ts`

**Interfaces:** mesmas regras de reescrita da Task 10.

- [ ] **Step 1: Ampliar a especificação (o teste que falha)**

Em `tools/docs-specs.ts`, na entrada de `docs/DESIGN.md`, acrescente ao fim da lista `headings`:

```ts
      '9. Sistema de Combate e Grau de Inimigos',
      '10. Efeitos, Buffs e Debuffs',
      '11. Economia e Loja',
      '12. Modo História',
      '13. Interface e Experiência do Jogador',
      '14. Ficha do Ninja (Sumário)',
      '15. Progressão do Personagem e Meta-Progressão',
      '16. Histórico de Runs',
```

e troque `minFacts: 10` por `minFacts: 22` e `minStateLines: 8` por `minStateLines: 16`.

Run: `npm run docs:check` → Expected: FAIL (oito títulos ausentes e fatos/estados abaixo do mínimo).

- [ ] **Step 2: Levantar o que cada seção precisa (leitura)**

| Seção | Fonte no código |
|---|---|
| 9 Combate e grau de inimigos | `src/game/combat/battle.ts`, `damage.ts`, `enemyFactory.ts`, `ai.ts`; `BALANCE.enemyGrades` (C5, C6); turno sequencial |
| 10 Efeitos | `src/data/effects.ts`, `src/game/effects/EffectSystem.ts` (controle, Tenacidade, queimadura, carga, Transformação C3/C13) |
| 11 Economia e loja | `src/data/items.ts`, `src/game/run/shop.ts`, `BALANCE.shop`, `BALANCE.rewards` |
| 12 Modo História | `src/data/saga.ts`, `src/data/story.ts`, `src/game/run/runManager.ts` (26 nós, Acampamento, elites C-spec §7) |
| 13 Interface | `src/ui-dom/screens/*.ts`, `src/scenes/*.ts`, `src/ui-dom/screens/BattleScreen.ts` (atalhos), spec §10 |
| 14 Ficha | `src/ui-dom/screens/SheetScreen.ts`, `src/ui-dom/components/radar.ts` |
| 15 Meta-progressão | `src/game/meta/meta.ts`, `src/data/titles.ts`, `src/ui-dom/screens/TitlesScreen.ts`, C14 |
| 16 Histórico | `src/game/meta/meta.ts` (`recordRunEnd`, `runEndText`), `src/ui-dom/screens/HistoryScreen.ts`, <!-- fact: BALANCE.history.maxEntries=50 --> |

- [ ] **Step 3: Escrever as seções 9 a 16**

Acrescente ao fim de `docs/DESIGN.md`, nesta ordem, `## 9. Sistema de Combate e Grau de Inimigos` até `## 16. Histórico de Runs`, cada uma com `**Estado:**` e as regras de reescrita da Task 10. Fatos obrigatórios (cole cada marcação logo depois do número): <!-- fact: BALANCE.battle.maxRounds=200 -->, <!-- fact: BALANCE.recovery.encounterHpPct=0.25 -->, <!-- fact: BALANCE.recovery.levelUpHpPct=0.25 -->, <!-- fact: BALANCE.enemyGrades.D.hpMult=0.8 -->, <!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 -->, <!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 -->, <!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 -->, <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->, <!-- fact: BALANCE.enemyGrades.B.damageMult=0.8 -->, <!-- fact: BALANCE.shop.rareScrollMaxPerRun=5 -->, <!-- fact: BALANCE.shop.rewardRyo=60 -->, <!-- fact: BALANCE.run.eliteForks=3 -->.

Na seção 9, explique a diferença entre "grau" de inimigo (D, D+, C, B) e o "grau" de item (C11: "grau" em todo texto) e cite que HP e dano dos graus C e B foram calibrados pelo simulador (`docs/balance-log.md`). Na seção 13, liste os atalhos `1`–`4`, `A`, `D`, `M`, `I`, `T`, `Enter`, `Esc` e o layout desktop com largura mínima de 1024 px.

- [ ] **Step 4: Rodar o verificador, autoconferir e commitar**

Run: `npm run docs:check` → Expected: `Documentos conferidos: 15.` Autoconferência: `grep -c "^\*\*Estado:\*\*" docs/DESIGN.md` ≥ 16.

```bash
git add docs/DESIGN.md tools/docs-specs.ts
git commit -m "docs: DESIGN v3 — seções 9 a 16"
```

---

### Task 12: `docs/DESIGN.md` v3 — seções 17 a 21 e apêndices

**Files:**
- Modify: `docs/DESIGN.md`, `tools/docs-specs.ts`

**Interfaces:** mesmas regras da Task 10. O Apêndice A traz **os números finais do simulador**.

- [ ] **Step 1: Ampliar a especificação (o teste que falha)**

Acrescente ao fim da lista `headings` de `docs/DESIGN.md`:

```ts
      '17. Modo Online (Futuro)',
      '18. Arquitetura Técnica',
      '19. Estrutura Sugerida do Projeto',
      '20. Visão de Longo Prazo',
      '21. Roadmap por Fases',
      'Apêndice A — Tabelas de Balanceamento e Simulação',
      'Apêndice B — Catálogo de Jutsus',
      'Apêndice C — Glossário',
      'Apêndice D — Decisões em Aberto',
      'Apêndice E — Registro de Mudanças (v3.0)',
```

e troque `minFacts: 22` por `minFacts: 30` e `minStateLines: 16` por `minStateLines: 21`.

Run: `npm run docs:check` → Expected: FAIL.

- [ ] **Step 2: Levantar o que cada parte precisa (leitura)**

| Parte | Fonte |
|---|---|
| 17 Online | DD v2 §17; `**Estado:** Futuro (F2/F3)` |
| 18 Arquitetura | spec §2, `src/store/GameStore.ts`, `src/game/**`, `src/ui-dom/**`, `src/scenes/**` (cite os caminhos reais) |
| 19 Estrutura do projeto | `git ls-files src tests tools docs` — a estrutura **real**, não a sugerida no DD v2 |
| 20 e 21 | DD v2 §20–21 + spec §1 (o que ficou de fora) e `README.md` |
| Apêndice A | tabela final de `docs/balance-log.md` ("Resultado final (3000 runs/build)"), `BUILD_BANDS` e `TARGETS` de `src/game/sim/report.ts`, `BALANCE.enemyGrades`, `BALANCE.xp`, `BALANCE.rewards` |
| Apêndice B | `src/data/jutsus.ts` (todos os jutsus do MVP e os futuros marcados `Fase`), spec §4.3 |
| Apêndice C | glossário do DD v2 + C11 ("grau") + termos novos: `ASSUMIDO`, faixa de regressão, quarentena de save |
| Apêndice D | DD v2 Apêndice D: para cada decisão em aberto, o que o MVP decidiu (cite `Cn` ou "decisão do usuário") e o que continua aberto |
| Apêndice E | lista de mudanças do v2 para o v3: as correções C1–C15 e as 12 decisões da seção 5 de `docs/ANALISE.md` |

- [ ] **Step 3: Escrever as seções 17 a 21 e os apêndices A a E**

Acrescente ao fim de `docs/DESIGN.md`. Requisitos específicos:
- **Apêndice A**: (a) a tabela final do simulador (3000 runs por build) copiada de `docs/balance-log.md`; (b) a tabela de metas de design × faixa da build (as 8 linhas); (c) uma tabela de `BALANCE.enemyGrades` com os quatro graus; fatos: <!-- fact: BALANCE.enemyGrades.D.hpMult=0.8 -->, <!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 -->, <!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 -->, <!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 -->, <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->, <!-- fact: BALANCE.enemyGrades.B.damageMult=0.8 -->, <!-- fact: BALANCE.xp.toNextBase=24 -->, <!-- fact: BALANCE.xp.eliteMult=1.6 -->; (d) uma nota "o que o simulador não mede" (escolha 1-de-3 sempre kit/pílula primeiro; jogador humano joga melhor ou pior que o robô).
- **Apêndice B**: tabela com `id`, nome, grau, custo, poder, requisitos, clã, fase (leia cada linha de `src/data/jutsus.ts`; não copie do DD v2).
- **Apêndice D**: marque cada decisão como "Decidido no MVP" (com a referência) ou "Segue em aberto".
- **Apêndice E**: título `## Apêndice E — Registro de Mudanças (v3.0)`.
Cada seção 17–21 leva `**Estado:**`; os apêndices não precisam. (Contando as seções 1–21, são 21 linhas `**Estado:**`.)

- [ ] **Step 4: Rodar o verificador, autoconferir e commitar**

Run: `npm run docs:check` → Expected: `Documentos conferidos: 15.` Autoconferência: o Apêndice A cita o mesmo número de runs e tempo (`3000`, `141,1 s`) que `docs/balance-log.md`; a seção 19 lista só arquivos que existem (o verificador confere os que estão em crase).

```bash
git add docs/DESIGN.md tools/docs-specs.ts
git commit -m "docs: DESIGN v3 — seções 17 a 21 e apêndices A a E com os números finais do simulador"
```

---

### Task 13: Conferência final, roteiro de olhar o jogo e README

**Files:**
- Create: `docs/CONFERENCIA-VISUAL.md`
- Modify: `README.md`, `docs/balance-log.md`, `tools/docs-specs.ts`

**Interfaces:** consome tudo; produz a conferência de pronto do spec §13 e o roteiro que o usuário usa para olhar o jogo no navegador (ninguém abriu o jogo ainda: tudo foi verificado por teste, build e requisição HTTP).

- [ ] **Step 1: Registrar a especificação do roteiro (o teste que falha)**

Em `tools/docs-specs.ts`:

```ts
  {
    path: 'docs/CONFERENCIA-VISUAL.md',
    headings: ['Conferência visual no navegador', 'Como abrir', 'Roteiro', 'O que anotar'],
  },
```

Run: `npm run docs:check` → Expected: FAIL (`arquivo ausente`).

- [ ] **Step 2: Escrever `docs/CONFERENCIA-VISUAL.md`**

Seções obrigatórias: `# Conferência visual no navegador`; `## Como abrir` (`npm install`, `npm run dev`, abrir a URL que o Vite imprime, janela com pelo menos 1024 px de largura); `## Roteiro`; `## O que anotar` (o que dá erro, em qual tela, com o que apareceu na tela). O `## Roteiro` é uma lista numerada com **exatamente** estes itens, cada um com o resultado esperado:
1. Menu → Nova Saga → criar um Uchiha com preset Ninjutsu; o botão "Começar" mostra o motivo enquanto faltar nome ou pontos.
2. Primeira entrada numa batalha: o canvas aparece com o tamanho certo? (o Phaser é criado escondido e o `ScaleManager` recalcula depois do `wake`; pode piscar até ~500 ms; anote se ficar errado.)
3. Painel da batalha sobre a arena em 1024×768: nada de painel cobrindo os lutadores; HP e chakra com números.
4. Atalhos: `1`–`4` (selecionar, depois `Enter`), `A`, `D`, `M`, `I`, `T`; apertar `A` três vezes rápido faz uma ação só.
5. Transformar (Uchiha): aura e contorno visíveis; sem gastar o turno.
6. Morrer de propósito: a animação termina, a tela de Fim de run aparece e o Histórico mostra a run; recarregar a aba durante a animação não perde o Histórico.
7. Subir de nível com vários jutsus novos: a tela de troca aparece, e as escolhas 1-de-3 continuam na ordem.
8. Navegar só com Tab/Enter na Criação e na Preparação (anote onde o foco some a cada clique).
9. Modo privado do Safari (ou `localStorage` bloqueado): aparece o aviso "Não foi possível salvar" e o jogo continua.
10. Nome com `<b>x</b>` na criação: aparece como texto na Ficha e no Histórico.

- [ ] **Step 3: Atualizar o `README.md`**

Troque a lista de comandos para incluir `npm run docs:check`; na seção de problemas conhecidos, **remova** a frase de que "8 metas de balanceamento ainda estão fora da faixa e o `sim:check` sai com falha" e escreva no lugar: `npm run sim:check` passa com **faixas por build** (as metas de design da spec §12 continuam impressas como distância; ver `docs/balance-log.md`). Mantenha: `npm run sim` leva cerca de 141 s. Acrescente uma seção `## Documentação` com os caminhos em crase: `docs/ANALISE.md`, `docs/DESIGN.md`, `docs/curso/README.md`, `docs/balance-log.md`, `docs/CONFERENCIA-VISUAL.md`.

- [ ] **Step 4: Rodar a verificação completa do spec §13**

Run:

```bash
npm test && npx tsc --noEmit && npm run build && npm run sim:check && npm run docs:check && npm audit 2>&1 | tail -6
```

Expected: testes verdes; `tsc` sem saída; build gera `dist/`; `sim:check` termina com `Nenhuma build saiu da sua faixa de regressão.`; `docs:check` imprime `Documentos conferidos: 16.`; `npm audit` sem alerta crítico. Anote os números exatos (testes, tempo do `sim:check`, tamanho do bundle) no relatório.

- [ ] **Step 5: Registrar o fechamento em `docs/balance-log.md`**

Acrescente no fim:

```markdown

## Fechamento do MVP (Plano 3)

`sim:check` verde com faixas por build; as metas de design continuam como distância impressa. O que fica em aberto é decisão de design, não de calibração: tirar kits da escolha 1-de-3 ou reduzir a cura do kit, e revisar a passiva do Uzumaki. Reavaliar depois de o usuário jogar (ver o roteiro de conferência visual, criado na Task 13).
```

- [ ] **Step 6: Commit**

```bash
git add docs/CONFERENCIA-VISUAL.md README.md docs/balance-log.md tools/docs-specs.ts
git commit -m "docs: roteiro de conferência visual, README final e fechamento do balanceamento"
```

---

## Cobertura da spec (autoverificação)

| Spec | Task |
|---|---|
| §13.1 `docs/ANALISE.md`: inconsistências, correções (§3), o que foi mantido, todas as `ASSUMIDO` | 5 |
| §13.2 MVP: código, testes, simulador, README | Planos 1 e 2; README final na 13 |
| §13.3 `docs/curso/`: Alfa 0.1–0.8, Beta 0.9.0–0.9.2, 1.0 (objetivo, escopo, passo a passo com porquê/alternativas/riscos, critérios, testes, patch log; "escrito a partir do código real") | 1 (verificador), 6, 7, 8, 9 |
| §13.4 `docs/DESIGN.md` v3 com correções e números finais do simulador | 10, 11, 12 |
| §13 ordem: MVP → curso → DESIGN v3 | 1–4 (código), 5–9 (curso), 10–12 (DESIGN) |
| §13 critério de pronto: `npm test` e `npm run sim:check` verdes; `npm run build` gera `dist/` | 2 (sim:check), 13 (verificação completa) |
| §12 metas e `sim:check` | 2 (faixas por build) |
| Pendências dos Planos 1 e 2 (alertas de `npm audit`, ordem do aviso de erro, "1 turno", conferência visual) | 3, 4, 13 |

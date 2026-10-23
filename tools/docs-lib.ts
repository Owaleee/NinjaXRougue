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

/** Marcadores em maiúsculas (diferencia caixa: "todo" é uma palavra comum em português) e frases de pendência. */
const FORBIDDEN_UPPER = /\b(?:TODO|TBD|FIXME|XXX)\b/;
const FORBIDDEN_PHRASE = /\ba definir\b|\bpreencher depois\b/i;

export function forbiddenMarkers(md: string): string[] {
  return proseLines(md)
    .filter((l) => FORBIDDEN_UPPER.test(l) || FORBIDDEN_PHRASE.test(l))
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

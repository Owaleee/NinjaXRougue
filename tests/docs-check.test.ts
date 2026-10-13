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

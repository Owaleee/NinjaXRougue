import { COURSE_HEADINGS, type DocSpec } from './docs-lib';

/** Cada task de documento do Plano 3 acrescenta a sua entrada aqui. */
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
  { path: 'docs/curso/README.md', headings: ['Curso: do zero ao NarutoTxGame', 'Como ler', 'Versões', 'Pré-requisitos'] },
  { path: 'docs/curso/alfa-0.1.md', headings: ['Alfa 0.1 — Projeto e RNG com semente', ...COURSE_HEADINGS], course: true },
  { path: 'docs/curso/alfa-0.2.md', headings: ['Alfa 0.2 — Tipos, constantes e fórmulas', ...COURSE_HEADINGS], course: true, minFacts: 4 },
  { path: 'docs/curso/alfa-0.3.md', headings: ['Alfa 0.3 — Dados do jogo e validação', ...COURSE_HEADINGS], course: true },
  { path: 'docs/curso/alfa-0.4.md', headings: ['Alfa 0.4 — Personagem e progressão', ...COURSE_HEADINGS], course: true, minFacts: 2 },
  { path: 'docs/curso/alfa-0.5.md', headings: ['Alfa 0.5 — Efeitos e resolução de golpe', ...COURSE_HEADINGS], course: true, minFacts: 3 },
  { path: 'docs/curso/alfa-0.6.md', headings: ['Alfa 0.6 — Batalha por turnos e IA', ...COURSE_HEADINGS], course: true, minFacts: 3 },
  { path: 'docs/curso/alfa-0.7.md', headings: ['Alfa 0.7 — Loja, run e meta-progressão', ...COURSE_HEADINGS], course: true, minFacts: 3 },
  { path: 'docs/curso/alfa-0.8.md', headings: ['Alfa 0.8 — Save e simulador', ...COURSE_HEADINGS], course: true, minFacts: 2 },
  { path: 'docs/curso/beta-0.9.0.md', headings: ['Beta 0.9.0 — Casca da interface e GameStore', ...COURSE_HEADINGS], course: true },
  { path: 'docs/curso/beta-0.9.1.md', headings: ['Beta 0.9.1 — Telas', ...COURSE_HEADINGS], course: true },
  { path: 'docs/curso/beta-0.9.2.md', headings: ['Beta 0.9.2 — Batalha em Phaser', ...COURSE_HEADINGS], course: true, minFacts: 1 },
  { path: 'docs/curso/1.0.md', headings: ['1.0 — Robustez, calibração e entrega', ...COURSE_HEADINGS], course: true, minFacts: 1 },
];

import type { DocSpec } from './docs-lib';

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
];

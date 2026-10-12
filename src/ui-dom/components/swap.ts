import { JUTSUS } from '../../data/jutsus';
import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenCtx } from '../types';

/** Abre sozinho quando um jutsu é aprendido com os slots cheios (spec §5; DD v2 §13). */
export function swapOverlay(ctx: ScreenCtx): HTMLElement | null {
  const { store } = ctx;
  const id = store.state.swapQueue[0];
  const run = store.state.run;
  if (!id || !run) return null;
  const j = JUTSUS[id];
  return h(
    'div',
    { class: 'dialog', attrs: { role: 'dialog', 'aria-modal': 'true' } },
    h('h2', {}, t('swap.title', { jutsu: j?.name ?? id })),
    h('p', {}, j?.description ?? ''),
    h('p', { class: 'muted' }, t('swap.body')),
    h(
      'div',
      { class: 'row' },
      ...run.character.equipped.map((eq) => button(t('swap.replace', { jutsu: JUTSUS[eq]?.name ?? eq }), () => store.resolveSwap(eq))),
    ),
    button(t('swap.keep'), () => store.resolveSwap(null), { primary: true }),
  );
}

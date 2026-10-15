import { TITLE_LIST } from '../../data/titles';
import { t } from '../../i18n/pt-BR';
import { button, h, icon } from '../dom';
import type { ScreenRenderer } from '../types';

/** Coleção de títulos (DD v2 §14): não conquistados aparecem como "???" com a dica. Ocultos (C14) não aparecem. */
export const TitlesScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const unlocked = new Set(store.state.meta.titlesUnlocked);
  const visible = TITLE_LIST.filter((ti) => !ti.hidden);
  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('titles.heading')),
    h('p', {}, t('titles.count', { n: visible.filter((ti) => unlocked.has(ti.id)).length, total: visible.length })),
    h('p', { class: 'muted' }, t('titles.info')),
    h(
      'div',
      { class: 'grid-2' },
      ...visible.map((ti) =>
        unlocked.has(ti.id)
          ? h('div', { class: 'card' }, h('h3', { class: 'with-icon' }, icon('medalha', 'md'), ti.name), h('span', { class: 'badge' }, t('titles.unlocked')), h('p', {}, ti.description))
          : h('div', { class: 'card muted' }, h('h3', {}, t('titles.locked')), h('p', {}, t('titles.hint', { desc: ti.description }))),
      ),
    ),
    button(t('common.back'), () => store.back()),
  );
};

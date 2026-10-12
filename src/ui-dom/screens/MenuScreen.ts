import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Menu principal (spec §10; DD v2 §13). */
export const MenuScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const active = store.hasActiveRun();
  const run = store.state.run;

  const story = () => {
    if (!active || !run) return store.go('create');
    ctx.modal.open(t('menu.abandonTitle'), t('menu.abandonBody', { name: run.character.name }), [
      { label: t('common.cancel'), onClick: () => {} },
      {
        label: t('menu.abandonConfirm'),
        primary: true,
        onClick: () => {
          store.abandonRun();
          store.go('create');
        },
      },
    ]);
  };

  return h(
    'div',
    { class: 'screen menu panel' },
    h('h1', {}, t('app.title')),
    h('p', { class: 'muted' }, t('menu.subtitle')),
    button(t('menu.continue'), () => store.continueRun(), { primary: active, disabled: !active }),
    active && run
      ? h('p', { class: 'muted' }, t('menu.continueInfo', { name: run.character.name, n: run.nodeIndex + 1, total: run.nodes.length }))
      : null,
    button(t('menu.story'), story, { primary: !active }),
    button(t('menu.infinite'), () => {}, { disabled: true, title: t('menu.soon') }),
    button(t('menu.encyclopedia'), () => store.go('encyclopedia')),
    button(t('menu.history'), () => store.go('history')),
    button(t('menu.titles'), () => store.go('titles')),
  );
};

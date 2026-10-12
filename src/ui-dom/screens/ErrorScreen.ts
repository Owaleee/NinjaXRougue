import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Dados inválidos no boot ou erro inesperado (spec §12 "Robustez"). */
export const ErrorScreen: ScreenRenderer = (ctx) =>
  h(
    'div',
    { class: 'screen panel' },
    h('h1', {}, t('error.title')),
    h('pre', { class: 'muted' }, ctx.store.state.fatalError ?? ''),
    button(t('error.reload'), () => window.location.reload(), { primary: true }),
  );

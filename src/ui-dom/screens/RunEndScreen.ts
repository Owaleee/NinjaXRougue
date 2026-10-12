import { mostUsedJutsu } from '../../game/meta/stats';
import { JUTSUS } from '../../data/jutsus';
import { TITLES } from '../../data/titles';
import { num, t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Resumo depois da morte ou da vitória. A meta já foi gravada pelo store. */
export const RunEndScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const info = store.state.runEnd;
  if (!info) return h('div', { class: 'panel' }, button(t('runEnd.menu'), () => store.toMenu(), { primary: true }));
  const s = info.stats;
  const most = mostUsedJutsu(s);
  const heading = info.result === 'victory' ? t('runEnd.victory') : info.result === 'dead' ? t('runEnd.dead') : t('runEnd.abandoned');
  const row = (label: string, value: string) => h('tr', {}, h('td', {}, label), h('td', {}, value));
  return h(
    'div',
    { class: 'screen panel' },
    h('h1', {}, heading),
    h('p', {}, `${info.name} — ${info.text}`),
    h('h3', {}, t('runEnd.stats')),
    h(
      'table',
      {},
      row(t('runEnd.encounters'), String(s.encountersWon)),
      row(t('runEnd.damageDealt'), num(s.damageDealt)),
      row(t('runEnd.damageTaken'), num(s.damageTaken)),
      row(t('runEnd.biggestHit'), num(s.biggestHit)),
      row(t('runEnd.crits'), String(s.crits)),
      row(t('runEnd.turns'), String(s.turns)),
      row(t('runEnd.mostUsed'), most ? (JUTSUS[most]?.name ?? most) : '—'),
    ),
    info.newTitles.length
      ? h('div', {}, h('h3', {}, t('runEnd.newTitles')), h('ul', {}, ...info.newTitles.map((id) => h('li', {}, TITLES[id]?.name ?? id))))
      : null,
    button(t('runEnd.menu'), () => store.toMenu(), { primary: true }),
  );
};

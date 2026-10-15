import { enemyArt } from '../../data/art';
import { ENEMIES } from '../../data/enemies';
import { t } from '../../i18n/pt-BR';
import { runHeader } from '../components/runHeader';
import { button, h, portrait } from '../dom';
import type { ScreenRenderer } from '../types';

/** Mapa da saga (spec §7 e §10): 26 nós, Acampamento antes dos chefes, bifurcação de elite. */
export const MapScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  if (!run) return h('div', { class: 'panel' }, t('notice.noRun'));
  const node = run.nodes[run.nodeIndex];

  const nodes = run.nodes.map((n) => {
    const enemy = ENEMIES[n.enemyId];
    const state = n.index < run.nodeIndex ? 'done' : n.index === run.nodeIndex ? 'current' : '';
    const label = `${n.campBefore ? '⛺ ' : ''}${n.kind === 'boss' ? t('map.boss') : String(n.index + 1)}`;
    // Estado também em texto (✓ / ▶), nunca só por cor.
    const mark = state === 'done' ? ` ✓ ${t('map.nodeDone')}` : state === 'current' ? ` ▶ ${t('map.nodeCurrent')}` : '';
    return h(
      'div',
      {
        class: `node ${state} ${n.kind === 'boss' ? 'boss' : ''}`.trim(),
        title: enemy?.name ?? n.enemyId,
        attrs: state === 'current' ? { 'aria-current': 'step' } : {},
      },
      `${label}${mark}`,
    );
  });

  let current: HTMLElement;
  if (!node) {
    current = h('div', { class: 'panel' });
  } else if (run.phase === 'camp') {
    current = h(
      'div',
      { class: 'panel' },
      h('h2', {}, `⛺ ${t('map.camp')}`),
      h('p', {}, t('map.campInfo')),
      button(t('map.rest'), () => store.rest(), { primary: true }),
    );
  } else {
    const enemy = ENEMIES[node.enemyId];
    const elite = node.eliteEnemyId ? ENEMIES[node.eliteEnemyId] : undefined;
    current = h(
      'div',
      { class: 'panel next-encounter' },
      portrait(enemyArt(node.enemyId), 'portrait-card'),
      h('div', { class: 'screen' },
      h('h2', {}, t('map.next', { n: node.index + 1, total: run.nodes.length })),
      h(
        'p',
        { class: 'row' },
        node.kind === 'boss' ? h('span', { class: 'badge' }, t('map.boss')) : null,
        h('strong', {}, enemy?.name ?? node.enemyId),
        enemy ? h('span', { class: 'badge' }, enemy.grade) : null,
      ),
      h(
        'div',
        { class: 'row' },
        button(t('map.fight'), () => store.fight(false), { primary: true }),
        elite ? button(t('map.fightElite', { name: elite.name }), () => store.fight(true)) : null,
      ),
      elite ? h('p', { class: 'muted' }, t('map.eliteInfo')) : null,
      ),
    );
  }

  return h(
    'div',
    { class: 'screen' },
    runHeader(run),
    h('h1', {}, t('map.heading')),
    h('div', { class: 'node-list' }, ...nodes),
    current,
    h(
      'div',
      { class: 'row' },
      button(t('map.prep'), () => store.go('prep')),
      button(t('map.sheet'), () => store.go('sheet')),
      button(t('map.menu'), () => store.toMenu()),
    ),
  );
};

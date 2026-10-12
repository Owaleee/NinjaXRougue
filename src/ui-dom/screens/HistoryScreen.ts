import { ATTR_NAMES } from '../../game/attributes';
import type { HistoryEntry, RunResult } from '../../game/meta/meta';
import { ATTR_KEYS } from '../../game/types';
import { CLANS } from '../../data/clans';
import { ENEMIES } from '../../data/enemies';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { num, t, type I18nKey } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

const RESULT_LABEL: Record<RunResult, I18nKey> = {
  dead: 'hist.result.dead',
  victory: 'hist.result.victory',
  abandoned: 'hist.result.abandoned',
};

function details(e: HistoryEntry): HTMLElement {
  const s = e.snapshot;
  const gear = [s.equipment.weapon, s.equipment.armor].filter((x): x is string => !!x).map((id) => ITEMS[id]?.name ?? id);
  return h(
    'div',
    { class: 'grid-2' },
    h(
      'div',
      {},
      h('h3', {}, t('hist.attrs')),
      h('table', {}, ...ATTR_KEYS.map((k) => h('tr', {}, h('td', {}, ATTR_NAMES[k]), h('td', {}, String(s.baseAttrs[k]))))),
    ),
    h(
      'div',
      {},
      h('h3', {}, t('hist.jutsus')),
      h('ul', {}, ...s.learned.map((id) => h('li', {}, t('hist.jutsuMastery', { name: JUTSUS[id]?.name ?? id, n: s.mastery[id] ?? 0 })))),
      h('h3', {}, t('hist.equipment')),
      h('p', {}, gear.length ? gear.join(t('format.join')) : t('common.none')),
      h(
        'table',
        {},
        h('tr', {}, h('td', {}, t('runEnd.damageDealt')), h('td', {}, num(s.stats.damageDealt))),
        h('tr', {}, h('td', {}, t('runEnd.biggestHit')), h('td', {}, num(s.stats.biggestHit))),
        h('tr', {}, h('td', {}, t('runEnd.crits')), h('td', {}, String(s.stats.crits))),
        h('tr', {}, h('td', {}, t('runEnd.turns')), h('td', {}, String(s.stats.turns))),
      ),
    ),
  );
}

/** Histórico de Runs (spec §9; DD v2 §16) + totais vitalícios. O nome do personagem entra só como texto. */
export const HistoryScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const meta = store.state.meta;
  const ui = ctx.local('ui', () => ({ open: null as string | null }));
  const life = meta.lifetime;
  const bosses = Object.entries(life.bossesDefeated).map(([id, n]) => t('hist.bossCount', { name: ENEMIES[id]?.name ?? id, n }));
  const grades = Object.entries(life.defeatedByGrade).map(([grade, n]) => t('hist.gradeCount', { grade, n }));
  const entries = meta.history.map((e) =>
    h(
      'div',
      { class: 'card' },
      h(
        'div',
        { class: 'row' },
        h('strong', {}, e.name),
        h('span', { class: 'badge' }, t(RESULT_LABEL[e.result])),
        h('span', { class: 'muted' }, new Date(e.date).toLocaleString('pt-BR')),
      ),
      h('p', {}, e.text),
      h(
        'p',
        { class: 'muted' },
        t('hist.line', { clan: CLANS[e.clan].name, element: t(`element.${e.affinity}`), level: e.level, rep: num(e.reputation), won: e.encountersWon }),
      ),
      button(
        t('hist.details'),
        () => {
          ui.open = ui.open === e.id ? null : e.id;
          ctx.rerender();
        },
        { attrs: { 'data-history': e.id, 'aria-expanded': String(ui.open === e.id) } },
      ),
      ui.open === e.id ? details(e) : null,
    ),
  );
  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('hist.heading')),
    h(
      'div',
      { class: 'panel' },
      h('p', {}, t('hist.lifetime', { runs: life.runs, wins: life.victories })),
      grades.length ? h('p', {}, t('hist.defeated', { list: grades.join(t('format.join')) })) : null,
      bosses.length ? h('p', {}, t('hist.bosses', { list: bosses.join(t('format.join')) })) : null,
    ),
    entries.length ? h('div', { class: 'screen' }, ...entries) : h('p', { class: 'muted' }, t('hist.empty')),
    button(t('common.back'), () => store.back()),
  );
};

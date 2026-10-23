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
const ELEMENTS_OK = new Set(['fogo', 'vento', 'raio', 'terra', 'agua']);

// O save valida `history` só como array: toda leitura abaixo tolera campo ausente ou inválido.
const unknown = () => t('hist.unknown');
const str = (v: unknown): string => (typeof v === 'string' && v ? v : unknown());
const numOr = (v: unknown): string => (typeof v === 'number' && Number.isFinite(v) ? num(v) : unknown());
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

function details(e: HistoryEntry): HTMLElement {
  const s = rec(e.snapshot);
  const attrs = rec(s['baseAttrs']);
  const mastery = rec(s['mastery']);
  const eq = rec(s['equipment']);
  const stats = rec(s['stats']);
  const learned = Array.isArray(s['learned']) ? (s['learned'] as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  const gear = [eq['weapon'], eq['armor']].filter((x): x is string => typeof x === 'string' && !!x).map((id) => ITEMS[id]?.name ?? id);
  return h(
    'div',
    { class: 'grid-2' },
    h(
      'div',
      {},
      h('h3', {}, t('hist.attrs')),
      h('table', {}, ...ATTR_KEYS.map((k) => h('tr', {}, h('td', {}, ATTR_NAMES[k]), h('td', {}, numOr(attrs[k]))))),
    ),
    h(
      'div',
      {},
      h('h3', {}, t('hist.jutsus')),
      h(
        'ul',
        {},
        ...learned.map((id) =>
          h('li', {}, t('hist.jutsuMastery', { name: JUTSUS[id]?.name ?? id, n: typeof mastery[id] === 'number' ? (mastery[id] as number) : 0 })),
        ),
      ),
      h('h3', {}, t('hist.equipment')),
      h('p', {}, gear.length ? gear.join(t('format.join')) : t('common.none')),
      h(
        'table',
        {},
        h('tr', {}, h('td', {}, t('runEnd.damageDealt')), h('td', {}, numOr(stats['damageDealt']))),
        h('tr', {}, h('td', {}, t('runEnd.biggestHit')), h('td', {}, numOr(stats['biggestHit']))),
        h('tr', {}, h('td', {}, t('runEnd.crits')), h('td', {}, numOr(stats['crits']))),
        h('tr', {}, h('td', {}, t('runEnd.turns')), h('td', {}, numOr(stats['turns']))),
      ),
    ),
  );
}

function when(date: unknown): string {
  if (typeof date !== 'number') return unknown();
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? unknown() : d.toLocaleString('pt-BR');
}

/** Histórico de Runs (spec §9; DD v2 §16) + totais vitalícios. O nome do personagem entra só como texto. */
export const HistoryScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const meta = store.state.meta;
  const ui = ctx.local('ui', () => ({ open: null as string | null }));
  const life = meta.lifetime;
  const bosses = Object.entries(life.bossesDefeated).map(([id, n]) => t('hist.bossCount', { name: ENEMIES[id]?.name ?? id, n }));
  const grades = Object.entries(life.defeatedByGrade).map(([grade, n]) => t('hist.gradeCount', { grade, n }));
  const entries = meta.history.map((e, i) => {
    const id = typeof e.id === 'string' ? e.id : `idx-${i}`;
    const clan = (CLANS as Record<string, { name: string } | undefined>)[String(e.clan)]?.name ?? unknown();
    const element = ELEMENTS_OK.has(String(e.affinity)) ? t(`element.${e.affinity}` as I18nKey) : unknown();
    const resultKey = RESULT_LABEL[e.result as RunResult];
    return h(
      'div',
      { class: 'card' },
      h(
        'div',
        { class: 'row' },
        h('strong', {}, str(e.name)),
        h('span', { class: 'badge' }, resultKey ? t(resultKey) : unknown()),
        h('span', { class: 'muted' }, when(e.date)),
      ),
      h('p', {}, str(e.text)),
      h(
        'p',
        { class: 'muted' },
        t('hist.line', { clan, element, level: numOr(e.level), rep: numOr(e.reputation), won: numOr(e.encountersWon) }),
      ),
      button(
        `${t('hist.details')} ${ui.open === id ? t('hist.markOpen') : t('hist.markClosed')}`,
        () => {
          ui.open = ui.open === id ? null : id;
          ctx.rerender();
        },
        { attrs: { 'data-history': id, 'aria-expanded': String(ui.open === id) } },
      ),
      ui.open === id ? details(e) : null,
    );
  });
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

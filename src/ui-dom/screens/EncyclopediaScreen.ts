import { ATTR_NAMES } from '../../game/attributes';
import { encyclopedia, type EncyclopediaEntry } from '../../game/meta/meta';
import { ATTR_KEYS, JUTSU_CATEGORIES, type JutsuCategory } from '../../game/types';
import { CLANS } from '../../data/clans';
import { JUTSUS, type JutsuDef } from '../../data/jutsus';
import { STORY_NAMES } from '../../data/story';
import { t, type I18nKey } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

type StatusFilter = 'todos' | 'desbloqueados' | 'bloqueados';
const STATUS: { id: StatusFilter; label: I18nKey }[] = [
  { id: 'todos', label: 'enc.status.todos' },
  { id: 'desbloqueados', label: 'enc.status.desbloqueados' },
  { id: 'bloqueados', label: 'enc.status.bloqueados' },
];
const CAT_LABEL: Record<JutsuCategory, I18nKey> = {
  ninjutsu: 'cat.ninjutsu',
  taijutsu: 'cat.taijutsu',
  genjutsu: 'cat.genjutsu',
  fuinjutsu: 'cat.fuinjutsu',
};
const MVP_PHASES: string[] = ['F0', 'F1A', 'F1B'];

function requirementText(j: JutsuDef): string {
  const attrs = ATTR_KEYS.filter((k) => (j.requires[k] ?? 0) > 0).map((k) => t('enc.attrReq', { attr: ATTR_NAMES[k], n: j.requires[k] ?? 0 }));
  const parts = [...attrs];
  if (j.prereq) parts.push(t('enc.prereq', { jutsu: JUTSUS[j.prereq]?.name ?? j.prereq }));
  parts.push(t('enc.minStory', { story: STORY_NAMES[j.minStory] }));
  const sep = t('format.dot');
  return attrs.length || j.prereq ? t('enc.requires', { list: parts.join(sep) }) : `${t('enc.noReq')}${sep}${parts.join(sep)}`;
}

function card(e: EncyclopediaEntry): HTMLElement {
  const j = e.jutsu;
  const sep = t('format.dot');
  return h(
    'div',
    { class: 'card' },
    h('h3', {}, j.name),
    h(
      'p',
      { class: 'row' },
      h('span', { class: 'badge' }, e.learned ? t('enc.unlocked') : t('enc.locked')),
      e.mastered ? h('span', { class: 'badge' }, t('enc.mastered')) : null,
      MVP_PHASES.includes(j.phase) ? null : h('span', { class: 'badge' }, t('enc.later', { phase: j.phase })),
    ),
    h(
      'p',
      { class: 'muted' },
      [t(CAT_LABEL[j.category]), j.grade, j.element ? t(`element.${j.element}`) : t('enc.neutral'), j.clan ? CLANS[j.clan].name : t('enc.general')].join(sep),
    ),
    h('p', { class: 'muted' }, requirementText(j)),
    h('p', {}, j.description),
  );
}

/** Pool completo de jutsus como coleção (DD v2 §13). Desbloqueado = aprendido em qualquer run. */
export const EncyclopediaScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const ui = ctx.local('filters', () => ({ category: '' as JutsuCategory | '', status: 'todos' as StatusFilter }));
  const all = encyclopedia(store.state.meta);
  const list = all.filter(
    (e) => (!ui.category || e.jutsu.category === ui.category) && (ui.status === 'todos' || (ui.status === 'desbloqueados') === e.learned),
  );
  const categorySel = h(
    'select',
    {
      attrs: { name: 'category', 'aria-label': t('enc.filterCategory') },
      on: {
        change: (ev) => {
          ui.category = (ev.target as HTMLSelectElement).value as JutsuCategory | '';
          ctx.rerender();
        },
      },
    },
    h('option', { value: '' }, t('enc.all')),
    ...JUTSU_CATEGORIES.map((c) => h('option', { value: c }, t(CAT_LABEL[c]))),
  );
  categorySel.value = ui.category;
  const statusSel = h(
    'select',
    {
      attrs: { name: 'status', 'aria-label': t('enc.filterStatus') },
      on: {
        change: (ev) => {
          ui.status = (ev.target as HTMLSelectElement).value as StatusFilter;
          ctx.rerender();
        },
      },
    },
    ...STATUS.map((s) => h('option', { value: s.id }, t(s.label))),
  );
  statusSel.value = ui.status;
  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('enc.heading')),
    h('p', {}, t('enc.count', { n: all.filter((e) => e.learned).length, total: all.length })),
    h('div', { class: 'row' }, h('label', {}, t('enc.filterCategory'), ' ', categorySel), h('label', {}, t('enc.filterStatus'), ' ', statusSel)),
    h('div', { class: 'grid-2' }, ...list.map(card)),
    button(t('common.back'), () => store.back()),
  );
};

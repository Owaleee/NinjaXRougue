import { ATTR_NAMES, sumAttributes } from '../../game/attributes';
import { PRESET_IDS, presetAllocation } from '../../game/progression/presets';
import { ATTR_KEYS, type Attributes } from '../../game/types';
import { t } from '../../i18n/pt-BR';
import { ATTR_ICON } from '../../data/art';
import { button, h, icon } from '../dom';

export interface AllocationOpts {
  /** Atributos base atuais (antes do rascunho). */
  base: Attributes;
  /** Pontos disponíveis para distribuir. */
  points: number;
  /** Rascunho: quanto somar em cada atributo. É MUTADO por este painel. */
  draft: Attributes;
  onChange: () => void;
}

/** Distribuição com prévia "5 → 8" e botão "Distribuir pelo preset" (spec C9). */
export function allocationPanel(o: AllocationOpts): HTMLElement {
  const remaining = o.points - sumAttributes(o.draft);
  const rows = ATTR_KEYS.map((k) =>
    h(
      'tr',
      {},
      h('td', {}, h('span', { class: 'with-icon' }, icon(ATTR_ICON[k]), ATTR_NAMES[k])),
      h('td', {}, o.draft[k] > 0 ? `${o.base[k]} → ${o.base[k] + o.draft[k]}` : String(o.base[k])),
      h(
        'td',
        {},
        button('−', () => {
          o.draft[k]--;
          o.onChange();
        }, { disabled: o.draft[k] <= 0, attrs: { 'data-attr': k, 'data-op': 'dec', 'aria-label': `− ${ATTR_NAMES[k]}` } }),
        button('+', () => {
          o.draft[k]++;
          o.onChange();
        }, { disabled: remaining <= 0, attrs: { 'data-attr': k, 'data-op': 'inc', 'aria-label': `+ ${ATTR_NAMES[k]}` } }),
      ),
    ),
  );
  const presets = PRESET_IDS.map((id) =>
    button(t(`preset.${id}`), () => {
      const add = presetAllocation(o.base, o.points, id);
      for (const k of ATTR_KEYS) o.draft[k] = add[k];
      o.onChange();
    }, { attrs: { 'data-preset': id } }),
  );
  return h(
    'div',
    { class: 'allocation' },
    h('p', {}, h('strong', {}, t('alloc.remaining', { n: remaining }))),
    h('table', {}, ...rows),
    h('div', { class: 'row' }, h('span', { class: 'muted' }, t('alloc.preset')), ...presets, button(t('alloc.reset'), () => {
      for (const k of ATTR_KEYS) o.draft[k] = 0;
      o.onChange();
    })),
  );
}

import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';

export interface TabDef<Id extends string> {
  id: Id;
  label: string;
}

/** Abas com marcador textual na ativa (spec §10: nada só por cor). */
export function tabBar<Id extends string>(tabs: TabDef<Id>[], active: Id, onSelect: (id: Id) => void): HTMLElement {
  return h(
    'div',
    { class: 'tabs', attrs: { role: 'tablist' } },
    ...tabs.map((tab) => {
      const on = tab.id === active;
      return button(on ? `${t('tabs.activeMark')} ${tab.label}` : tab.label, () => onSelect(tab.id), {
        class: on ? 'active' : '',
        attrs: { 'data-tab': tab.id, role: 'tab', 'aria-selected': String(on) },
      });
    }),
  );
}

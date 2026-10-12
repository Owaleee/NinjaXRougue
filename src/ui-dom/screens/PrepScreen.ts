import { ATTR_NAMES, emptyAttributes, sumAttributes } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import { costFor } from '../../game/combat/cost';
import { slotCount } from '../../game/progression/loadout';
import { masteryProgress } from '../../game/progression/mastery';
import { playerToCombatant } from '../../game/run/battleSetup';
import { priceOf } from '../../game/run/shop';
import type { RunState } from '../../game/run/types';
import { ATTR_KEYS } from '../../game/types';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { num, t, type I18nKey } from '../../i18n/pt-BR';
import type { GameStore } from '../../store/GameStore';
import { allocationPanel } from '../components/allocation';
import { runHeader } from '../components/runHeader';
import { bar, button, h } from '../dom';
import type { ScreenCtx, ScreenRenderer } from '../types';
import { bonusText, compareText } from '../view/format';

type PrepTab = 'loja' | 'jutsus' | 'equip' | 'attrs';
const TABS: { id: PrepTab; label: I18nKey }[] = [
  { id: 'loja', label: 'prep.tab.loja' },
  { id: 'jutsus', label: 'prep.tab.jutsus' },
  { id: 'equip', label: 'prep.tab.equip' },
  { id: 'attrs', label: 'prep.tab.attrs' },
];

/** Preparação entre encontros (spec §8 "Acesso"): loja, slots de jutsu, equipamento e pontos. */
export const PrepScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  if (!run) return h('div', { class: 'panel' }, t('notice.noRun'));
  const ui = ctx.local('ui', () => ({ tab: 'loja' as PrepTab, draft: emptyAttributes(0) }));
  const tabs = h(
    'div',
    { class: 'tabs', attrs: { role: 'tablist' } },
    ...TABS.map((tab) =>
      button(t(tab.label), () => {
        ui.tab = tab.id;
        ctx.rerender();
      }, { class: ui.tab === tab.id ? 'active' : '', attrs: { 'data-tab': tab.id, role: 'tab', 'aria-selected': String(ui.tab === tab.id) } }),
    ),
  );
  const body =
    ui.tab === 'loja' ? shopTab(store, run) : ui.tab === 'jutsus' ? jutsuTab(store, run) : ui.tab === 'equip' ? equipTab(store, run) : attrsTab(ctx, run, ui);
  return h('div', { class: 'screen' }, runHeader(run), h('h1', {}, t('prep.heading')), tabs, body, h('div', { class: 'row' }, button(t('common.back'), () => store.back())));
};

function shopTab(store: GameStore, run: RunState): HTMLElement {
  const c = run.character;
  const row = (id: string, soldOut = false) => {
    const item = ITEMS[id];
    if (!item) return null;
    const price = priceOf(id, c);
    const isGear = item.kind === 'weapon' || item.kind === 'armor';
    const owned = isGear && c.ownedEquipment.includes(id);
    const count = c.inventory[id] ?? 0;
    const reason = owned ? t('prep.reasonOwned') : soldOut ? t('prep.reasonRareMax') : c.ryo < price ? t('prep.reasonNoRyo') : '';
    return h(
      'tr',
      {},
      h('td', {}, item.name, ' ', h('span', { class: 'badge' }, item.grade)),
      h('td', { class: 'muted' }, item.description),
      h('td', {}, t('common.ryo', { n: num(price) })),
      h('td', {}, owned ? t('prep.owned') : count > 0 ? t('prep.have', { n: count }) : ''),
      h('td', {}, button(t('prep.buy'), () => store.buy(id), { disabled: reason !== '', attrs: { 'data-buy': id } }), reason ? h('div', { class: 'muted' }, reason) : null),
    );
  };
  return h(
    'div',
    { class: 'panel' },
    h('h3', {}, t('prep.consumables')),
    h('table', {}, ...run.shop.consumables.map((id) => row(id))),
    h('h3', {}, t('prep.equipment')),
    run.shop.equipment.length ? h('table', {}, ...run.shop.equipment.map((id) => row(id))) : h('p', { class: 'muted' }, t('prep.soldOut')),
    h('h3', {}, t('prep.rare')),
    run.shop.rareScrolls > 0
      ? h('table', {}, row('pergaminho_raro', c.rareScrollsUsed + (c.inventory['pergaminho_raro'] ?? 0) >= BALANCE.shop.rareScrollMaxPerRun))
      : h('p', { class: 'muted' }, t('prep.soldOut')),
    h('p', { class: 'muted' }, t('prep.rareUsed', { n: c.rareScrollsUsed, max: BALANCE.shop.rareScrollMaxPerRun })),
    h('p', { class: 'muted' }, t('prep.restock')),
  );
}

function jutsuTab(store: GameStore, run: RunState): HTMLElement {
  const c = run.character;
  const comb = playerToCombatant(c);
  const slots = slotCount(c);
  const info = (id: string) => {
    const j = JUTSUS[id];
    if (!j) return h('div', {}, id);
    const p = masteryProgress(c.masteryUses[id] ?? 0, j, c.clan, c.affinity);
    return h(
      'div',
      {},
      h('strong', {}, j.name),
      ' ',
      h('span', { class: 'badge' }, j.grade),
      j.element ? h('span', { class: 'badge' }, t(`element.${j.element}`)) : null,
      ' ',
      h('span', { class: 'muted' }, t('prep.cost', { n: costFor(comb, j) })),
      ' · ',
      h('span', {}, t('prep.mastery', { n: p.level })),
      p.usesForNext !== null ? bar('xp', p.usesIntoLevel, p.usesForNext, t('prep.masteryNext')) : h('span', { class: 'badge' }, t('prep.masteryMax')),
      h('p', { class: 'muted' }, j.description),
    );
  };
  const equipped = c.equipped.map((id) =>
    h('div', { class: 'card' }, info(id), button(t('prep.unequip'), () => store.setLoadout(c.equipped.filter((x) => x !== id)), { attrs: { 'data-unequip': id } })),
  );
  const empty = Array.from({ length: Math.max(0, slots - c.equipped.length) }, () => h('div', { class: 'card muted' }, t('prep.emptySlot')));
  const repertoire = c.learned
    .filter((id) => !c.equipped.includes(id))
    .map((id) =>
      h(
        'div',
        { class: 'card' },
        info(id),
        c.equipped.length < slots
          ? button(t('prep.equip'), () => store.equipJutsu(id), { primary: true, attrs: { 'data-equip': id } })
          : h(
              'div',
              { class: 'row' },
              h('span', { class: 'muted' }, t('prep.swapFor')),
              ...c.equipped.map((eq) =>
                button(t('swap.replace', { jutsu: JUTSUS[eq]?.name ?? eq }), () => store.equipJutsu(id, eq), {
                  attrs: { 'data-equip': id, 'data-replace': eq },
                }),
              ),
            ),
      ),
    );
  return h(
    'div',
    { class: 'panel' },
    h('h3', {}, t('prep.slots', { n: c.equipped.length, max: slots })),
    h('div', { class: 'grid-2' }, ...equipped, ...empty),
    h('h3', {}, t('prep.repertoire')),
    repertoire.length ? h('div', { class: 'grid-2' }, ...repertoire) : h('p', { class: 'muted' }, t('prep.noRepertoire')),
  );
}

function equipTab(store: GameStore, run: RunState): HTMLElement {
  const c = run.character;
  const slot = (kind: 'weapon' | 'armor') => {
    const cur = c.equipment[kind];
    const curItem = cur ? ITEMS[cur] : undefined;
    const owned = c.ownedEquipment.filter((id) => ITEMS[id]?.kind === kind);
    return h(
      'div',
      { class: 'panel' },
      h('h3', {}, t(kind === 'weapon' ? 'prep.weapon' : 'prep.armor')),
      h('p', {}, curItem ? t('sheet.gearValue', { name: curItem.name, bonus: bonusText(curItem.attrBonus) }) : t('prep.emptySlot')),
      owned.length
        ? h(
            'table',
            {},
            ...owned.map((id) => {
              const it = ITEMS[id]!;
              return h(
                'tr',
                {},
                h('td', {}, it.name, ' ', h('span', { class: 'badge' }, it.grade)),
                h('td', {}, bonusText(it.attrBonus)),
                h('td', {}, id === cur ? t('prep.current') : compareText(it.attrBonus, curItem?.attrBonus)),
                h('td', {}, button(t('prep.equip'), () => store.equipItem(id), { disabled: id === cur, attrs: { 'data-equip-item': id } })),
              );
            }),
          )
        : h('p', { class: 'muted' }, t('prep.noEquipment')),
    );
  };
  return h('div', { class: 'grid-2' }, slot('weapon'), slot('armor'));
}

function attrsTab(ctx: ScreenCtx, run: RunState, ui: { draft: ReturnType<typeof emptyAttributes> }): HTMLElement {
  const { store } = ctx;
  const c = run.character;
  const scrolls = c.inventory['pergaminho_raro'] ?? 0;
  const max = BALANCE.shop.rareScrollMaxPerRun;
  const points =
    c.unspentPoints > 0
      ? h(
          'div',
          {},
          allocationPanel({ base: c.baseAttrs, points: c.unspentPoints, draft: ui.draft, onChange: () => ctx.rerender() }),
          button(t('alloc.confirm'), () => {
            if (store.allocate({ ...ui.draft })) ui.draft = emptyAttributes(0);
            ctx.rerender();
          }, { primary: true, disabled: sumAttributes(ui.draft) === 0 }),
        )
      : h('p', { class: 'muted' }, t('prep.noPoints'));
  return h(
    'div',
    { class: 'grid-2' },
    h('div', { class: 'panel' }, h('h3', {}, t('result.pointsTitle')), points),
    h(
      'div',
      { class: 'panel' },
      h('h3', {}, t('prep.rare')),
      h('p', {}, t('prep.rareHave', { n: scrolls, used: c.rareScrollsUsed, max })),
      scrolls > 0
        ? h(
            'div',
            { class: 'row' },
            c.rareScrollsUsed >= max ? h('span', { class: 'muted' }, t('prep.reasonRareMax')) : null,
            ...ATTR_KEYS.map((k) => button(t('prep.rareUse', { attr: ATTR_NAMES[k] }), () => store.useRareScroll(k), { disabled: c.rareScrollsUsed >= max, attrs: { 'data-rare': k } })),
          )
        : null,
    ),
  );
}

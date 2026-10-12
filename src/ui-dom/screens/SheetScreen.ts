import { ATTR_NAMES } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import { costFor } from '../../game/combat/cost';
import { aggregateMods, effectiveAttr } from '../../game/effects/EffectSystem';
import { critChance, dodgeChance, totalReduction, xpToNext } from '../../game/formulas';
import { characterMaxChakra, characterMaxHp, effectiveAttrs } from '../../game/progression/character';
import { masteryProgress } from '../../game/progression/mastery';
import { playerToCombatant } from '../../game/run/battleSetup';
import type { RunState } from '../../game/run/types';
import { ATTR_KEYS } from '../../game/types';
import { CLANS } from '../../data/clans';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { STORY_NAMES } from '../../data/story';
import { TITLES } from '../../data/titles';
import { num, pct, t, type I18nKey } from '../../i18n/pt-BR';
import { tabBar } from '../components/tabBar';
import { radarSvg } from '../components/radar';
import { bar, button, h } from '../dom';
import type { ScreenRenderer } from '../types';
import { bonusText } from '../view/format';
import { fightingStyle, jutsuGoals, ninjaPower } from '../view/derived';

type SheetTab = 'perfil' | 'atributos' | 'jutsus' | 'equipamento';
const TABS: { id: SheetTab; label: I18nKey }[] = [
  { id: 'perfil', label: 'sheet.tab.perfil' },
  { id: 'atributos', label: 'sheet.tab.atributos' },
  { id: 'jutsus', label: 'sheet.tab.jutsus' },
  { id: 'equipamento', label: 'sheet.tab.equipamento' },
];

const row = (label: string, ...value: (string | HTMLElement)[]) => h('tr', {}, h('th', {}, label), h('td', {}, ...value));

/**
 * Ficha do Ninja (spec §10; DD v2 §14), abas Perfil, Atributos, Jutsus e Equipamento.
 * É SEMPRE somente leitura: pode ser aberta do mapa e da batalha sem gastar turno.
 */
export const SheetScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  if (!run) return h('div', { class: 'panel' }, t('notice.noRun'));
  const ui = ctx.local('ui', () => ({ tab: 'perfil' as SheetTab }));
  const tabs = tabBar(TABS.map((x) => ({ id: x.id, label: t(x.label) })), ui.tab, (id) => {
    ui.tab = id;
    ctx.rerender();
  });
  const body = ui.tab === 'perfil' ? profile(run) : ui.tab === 'atributos' ? attributes(run) : ui.tab === 'jutsus' ? jutsus(run) : equipment(run);
  return h('div', { class: 'screen' }, h('h1', {}, t('sheet.heading')), tabs, body, h('div', { class: 'row' }, button(t('common.back'), () => store.back())));
};

function profile(run: RunState): HTMLElement {
  const c = run.character;
  const title = c.titleId ? TITLES[c.titleId] : undefined;
  return h(
    'div',
    { class: 'panel' },
    h(
      'table',
      {},
      row(t('sheet.name'), c.name),
      row(t('sheet.clan'), CLANS[c.clan].name),
      row(t('sheet.affinity'), t(`element.${c.affinity}`)),
      row(t('sheet.level'), String(c.level), bar('xp', c.xp, xpToNext(c.level), t('header.xp'))),
      row(t('derived.power'), String(ninjaPower(effectiveAttrs(c)))),
      row(t('sheet.style'), t(`style.${fightingStyle(c.baseAttrs)}`)),
      row(t('sheet.rep'), num(c.reputation)),
      row(t('sheet.title'), title ? t('sheet.titleValue', { name: title.name, desc: title.description }) : t('common.none')),
      row(t('sheet.ryo'), num(c.ryo)),
      row(t('sheet.saga'), t('sheet.sagaValue', { n: run.nodeIndex + 1, total: run.nodes.length })),
      row(t('sheet.story'), STORY_NAMES[run.story]),
    ),
  );
}

function attributes(run: RunState): HTMLElement {
  const c = run.character;
  const eff = effectiveAttrs(c);
  const comb = playerToCombatant(c);
  const mods = aggregateMods(comb);
  const vel = effectiveAttr(comb, 'vel');
  const goals = jutsuGoals(c, run.story);
  return h(
    'div',
    { class: 'grid-2' },
    h('div', { class: 'panel' }, radarSvg(c.baseAttrs, eff)),
    h(
      'div',
      { class: 'panel' },
      h(
        'table',
        {},
        h('tr', {}, h('th', {}, t('sheet.attr')), h('th', {}, t('sheet.base')), h('th', {}, t('sheet.effective'))),
        ...ATTR_KEYS.map((k) => h('tr', {}, h('td', {}, ATTR_NAMES[k]), h('td', {}, String(c.baseAttrs[k])), h('td', {}, String(eff[k])))),
      ),
      h(
        'table',
        {},
        row(t('derived.hp'), `${c.hp}/${characterMaxHp(c)}`),
        row(t('derived.chakra'), `${c.chakra}/${characterMaxChakra(c)}`),
        row(t('derived.crit'), pct(critChance(effectiveAttr(comb, 'crit'), mods.crit))),
        row(t('sheet.dodgeEven'), pct(dodgeChance(vel, vel, mods.dodge))),
        row(t('derived.reduction'), pct(totalReduction(effectiveAttr(comb, 'def'), mods.reduction))),
      ),
      goals.length
        ? h(
            'div',
            {},
            h('h3', {}, t('sheet.goals')),
            h(
              'ul',
              {},
              ...goals.map((g) =>
                h(
                  'li',
                  {},
                  t('result.goal', {
                    jutsu: JUTSUS[g.jutsuId]?.name ?? g.jutsuId,
                    missing: g.missing.map((m) => t('result.goalPart', { n: m.missing, attr: ATTR_NAMES[m.attr] })).join(t('result.goalJoin')),
                  }),
                ),
              ),
            ),
          )
        : null,
    ),
  );
}

function jutsus(run: RunState): HTMLElement {
  const c = run.character;
  const comb = playerToCombatant(c);
  return h(
    'div',
    { class: 'panel grid-2' },
    ...c.learned.map((id) => {
      const j = JUTSUS[id];
      if (!j) return h('div', {}, id);
      const p = masteryProgress(c.masteryUses[id] ?? 0, j, c.clan, c.affinity);
      const at = c.learnedAt[id];
      return h(
        'div',
        { class: 'card' },
        h('strong', {}, j.name),
        ' ',
        c.equipped.includes(id) ? h('span', { class: 'badge' }, t('sheet.equipped')) : null,
        h('p', { class: 'muted' }, t('sheet.jutsuMeta', { grade: j.grade, element: j.element ? t(`element.${j.element}`) : t('format.none'), cost: t('prep.cost', { n: costFor(comb, j) }), mastery: t('prep.mastery', { n: p.level }) })),
        p.usesForNext !== null ? bar('xp', p.usesIntoLevel, p.usesForNext, t('prep.masteryNext')) : h('span', { class: 'badge' }, t('prep.masteryMax')),
        at ? h('p', {}, t('sheet.learnedAt', { level: at.level, n: at.nodeIndex + 1 })) : null,
        h('p', { class: 'muted' }, t('sheet.uses', { n: run.stats.jutsuUses[id] ?? 0 })),
        h('p', {}, j.description),
      );
    }),
  );
}

function equipment(run: RunState): HTMLElement {
  const c = run.character;
  const gear = (id: string | null) => (id && ITEMS[id] ? t('sheet.gearValue', { name: ITEMS[id]!.name, bonus: bonusText(ITEMS[id]!.attrBonus) }) : t('prep.emptySlot'));
  const consumables = Object.entries(c.inventory).filter(([id, n]) => n > 0 && ITEMS[id]?.kind === 'consumable');
  return h(
    'div',
    { class: 'panel' },
    h('table', {}, row(t('prep.weapon'), gear(c.equipment.weapon)), row(t('prep.armor'), gear(c.equipment.armor))),
    h('h3', {}, t('sheet.inventory')),
    consumables.length
      ? h('ul', {}, ...consumables.map(([id, n]) => h('li', {}, t('sheet.itemCount', { name: ITEMS[id]!.name, n }))))
      : h('p', { class: 'muted' }, t('sheet.noItems')),
    h('p', {}, t('sheet.rareUsed', { n: c.rareScrollsUsed, max: BALANCE.shop.rareScrollMaxPerRun })),
  );
}

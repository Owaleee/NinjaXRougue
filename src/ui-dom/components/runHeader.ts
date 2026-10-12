import { characterMaxChakra, characterMaxHp } from '../../game/progression/character';
import { xpToNext } from '../../game/formulas';
import type { RunState } from '../../game/run/types';
import { CLANS } from '../../data/clans';
import { TITLES } from '../../data/titles';
import { num, t } from '../../i18n/pt-BR';
import { bar, h } from '../dom';

/** Faixa de status da run, repetida no Mapa, Resultado e Preparação. */
export function runHeader(run: RunState): HTMLElement {
  const c = run.character;
  const title = c.titleId ? TITLES[c.titleId] : undefined;
  return h(
    'div',
    { class: 'panel row run-header' },
    h('strong', {}, c.name),
    title ? h('span', { class: 'badge' }, title.name) : null,
    h('span', {}, t('common.level', { n: c.level })),
    h('span', { class: 'badge' }, CLANS[c.clan].name),
    h('span', { class: 'badge' }, t(`element.${c.affinity}`)),
    bar('hp', c.hp, characterMaxHp(c), t('header.hp')),
    bar('chakra', c.chakra, characterMaxChakra(c), t('header.chakra')),
    bar('xp', c.xp, xpToNext(c.level), t('header.xp')),
    h('span', {}, t('common.ryo', { n: num(c.ryo) })),
    h('span', {}, t('header.rep', { n: num(c.reputation) })),
    c.unspentPoints > 0 ? h('span', { class: 'badge' }, t('header.points', { n: c.unspentPoints })) : null,
  );
}

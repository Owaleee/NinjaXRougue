import { emptyAttributes, sumAttributes } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import { availableTitles } from '../../game/meta/meta';
import type { Attributes, ClanId, Element } from '../../game/types';
import { CLANS, PLAYABLE_CLANS } from '../../data/clans';
import { JUTSUS } from '../../data/jutsus';
import { pct, t } from '../../i18n/pt-BR';
import { allocationPanel } from '../components/allocation';
import { button, clear, h } from '../dom';
import type { ScreenRenderer } from '../types';
import { creationPreview } from '../view/derived';

/** Raio só existe a partir da Fase 2 (spec §1 "Fica de fora"). */
export const AFFINITY_OPTIONS: readonly Element[] = ['fogo', 'vento', 'terra', 'agua'];

interface Draft {
  name: string;
  clan: ClanId;
  affinity: Element;
  titleId: string | null;
  alloc: Attributes;
}

/** Criação (spec §10): prévia das fórmulas derivadas e "jutsus que esta build libera". */
export const CreateScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const d = ctx.local<Draft>('draft', () => ({
    name: '',
    clan: PLAYABLE_CLANS[0] ?? 'uzumaki',
    affinity: 'vento',
    titleId: null,
    alloc: emptyAttributes(0),
  }));
  const clan = CLANS[d.clan];
  const affinity = clan.fixedAffinity ?? d.affinity;
  const points = BALANCE.attributes.creationPoints;
  const remaining = points - sumAttributes(d.alloc);
  const preview = creationPreview(d.clan, affinity, d.alloc);

  // Motivo visível de o botão "Começar" estar desabilitado (spec §10: não depender só do botão).
  // Atualizado no próprio evento de input: redesenhar a tela a cada tecla tiraria o foco do campo.
  const reasonBox = h('div', { attrs: { role: 'status' } });
  const startBtn = button(t('create.start'), () => start(), { primary: true });
  const refreshStart = () => {
    const reasons: string[] = [];
    if (!d.name.trim()) reasons.push(t('create.needName'));
    if (remaining !== 0) reasons.push(t('create.needPoints', { n: remaining }));
    startBtn.disabled = reasons.length > 0;
    clear(reasonBox);
    for (const msg of reasons) reasonBox.appendChild(h('p', { class: 'muted' }, msg));
  };
  refreshStart();

  const nameInput = h('input', {
    type: 'text',
    value: d.name,
    attrs: { name: 'name', maxlength: '20', placeholder: t('create.namePlaceholder'), 'aria-label': t('create.name') },
    on: {
      input: (e) => {
        d.name = (e.target as HTMLInputElement).value;
        refreshStart();
      },
    },
  });

  const clanCards = PLAYABLE_CLANS.map((id) =>
    h(
      'div',
      { class: `card ${id === d.clan ? 'selected' : ''}` },
      button(id === d.clan ? `${t('create.selectedMark')} ${CLANS[id].name}` : CLANS[id].name, () => {
        d.clan = id;
        ctx.rerender();
      }, { primary: id === d.clan, attrs: { 'aria-pressed': String(id === d.clan) } }),
      h('p', { class: 'muted' }, CLANS[id].description),
    ),
  );

  const affinitySelect = h(
    'select',
    {
      disabled: clan.fixedAffinity !== null,
      attrs: { name: 'affinity', 'aria-label': t('create.affinity') },
      on: { change: (e) => { d.affinity = (e.target as HTMLSelectElement).value as Element; ctx.rerender(); } },
    },
    ...(clan.fixedAffinity ? [clan.fixedAffinity] : AFFINITY_OPTIONS).map((el) =>
      h('option', { value: el }, t(`element.${el}`)),
    ),
  );
  affinitySelect.value = affinity;

  const titles = availableTitles(store.state.meta);
  const titleSelect = h(
    'select',
    {
      attrs: { name: 'title', 'aria-label': t('create.titleLabel') },
      on: { change: (e) => { const v = (e.target as HTMLSelectElement).value; d.titleId = v || null; } },
    },
    h('option', { value: '' }, t('common.none')),
    ...titles.map((ti) => h('option', { value: ti.id }, t('format.nameText', { name: ti.name, text: ti.description }))),
  );
  titleSelect.value = d.titleId ?? '';

  const start = () => {
    if (!d.name.trim()) return store.notify('error', t('create.needName'));
    if (remaining !== 0) return store.notify('error', t('create.needPoints', { n: remaining }));
    store.startNewRun({ name: d.name, clan: d.clan, affinity, allocation: { ...d.alloc }, titleId: d.titleId });
  };

  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('create.heading')),
    h(
      'div',
      { class: 'grid-2' },
      h(
        'div',
        { class: 'panel screen' },
        h('label', {}, t('create.name'), ' ', nameInput),
        h('h3', {}, t('create.clan')),
        h('div', { class: 'grid-2' }, ...clanCards),
        h('label', {}, t('create.affinity'), ' ', affinitySelect, clan.fixedAffinity ? ` ${t('create.affinityFixed')}` : ''),
        h('label', {}, t('create.titleLabel'), ' ', titleSelect),
      ),
      h(
        'div',
        { class: 'panel screen' },
        h('h3', {}, t('create.points')),
        allocationPanel({ base: emptyAttributes(BALANCE.attributes.start), points, draft: d.alloc, onChange: () => ctx.rerender() }),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', {}, t('create.preview')),
      h(
        'table',
        {},
        row(t('derived.hp'), String(preview.hp)),
        row(t('derived.chakra'), String(preview.chakra)),
        row(t('derived.regen'), String(preview.regen)),
        row(t('derived.crit'), pct(preview.critPct)),
        row(t('derived.reduction'), pct(preview.reductionPct)),
        row(t('derived.power'), String(preview.power)),
      ),
      h('h3', {}, t('create.unlocks')),
      preview.unlocks.length
        ? h('ul', {}, ...preview.unlocks.map((id) => h('li', {}, JUTSUS[id]?.name ?? id)))
        : h('p', { class: 'muted' }, t('create.noUnlocks')),
    ),
    h(
      'div',
      { class: 'row' },
      button(t('common.back'), () => store.back()),
      startBtn,
      reasonBox,
    ),
  );
};

function row(label: string, value: string): HTMLElement {
  return h('tr', {}, h('td', {}, label), h('td', {}, value));
}

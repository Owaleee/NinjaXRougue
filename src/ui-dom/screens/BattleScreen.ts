import { ATTR_NAMES } from '../../game/attributes';
import { getEnemy, getPlayer } from '../../game/combat/battle';
import type { Action, BattleState } from '../../game/combat/types';
import { EFFECTS, REFORCO_ATTRS } from '../../data/effects';
import { ATTR_ICON, ITEM_ICON, UI_ICON, jutsuIconRef, type IconRef } from '../../data/art';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { pct, t } from '../../i18n/pt-BR';
import type { UiState } from '../../store/GameStore';
import { bar, button, h } from '../dom';
import type { KeyHandler, ScreenCtx, ScreenRenderer } from '../types';
import { combatantView, jutsuButtons, type CombatantView, type JutsuButton } from '../view/derived';

interface BattleUi {
  selected: string | null;
  items: boolean;
  reforco: boolean;
}

const uiOf = (ctx: ScreenCtx) => ctx.local<BattleUi>('battle', () => ({ selected: null, items: false, reforco: false }));

function closePanels(ui: BattleUi): void {
  ui.selected = null;
  ui.items = false;
  ui.reforco = false;
}

/** Só dá para agir na batalha REAL (não no último quadro), na vez do jogador, sem animação rodando. */
function liveBattle(s: UiState): BattleState | null {
  const b = s.run?.battle;
  return b && !s.locked && b.status === 'awaitingInput' ? b : null;
}

function doAct(ctx: ScreenCtx, action: Action): void {
  closePanels(uiOf(ctx));
  // O store recusa (false) com a entrada travada: o clique/tecla repetido vira só um redesenho.
  if (!ctx.store.act(action)) ctx.rerender();
}

function pickJutsu(ctx: ScreenCtx, id: string): void {
  const ui = uiOf(ctx);
  if (ui.selected === id) return doAct(ctx, { type: 'jutsu', jutsuId: id });
  closePanels(ui);
  ui.selected = id;
  ctx.rerender();
}

function toggleItems(ctx: ScreenCtx): void {
  const ui = uiOf(ctx);
  const open = !ui.items;
  closePanels(ui);
  ui.items = open;
  ctx.rerender();
}

type BasicKind = 'attack' | 'defend' | 'meditate' | 'item' | 'transform';

/**
 * Por que um botão básico está apagado (null = liberado), fora a trava de animação.
 * Botão e atalho usam ESTA função: teclado e clique nunca divergem.
 */
function basicBlock(b: BattleState, kind: BasicKind): 'illusion' | 'toggled' | 'noForm' | null {
  if (b.onlyKai) return 'illusion';
  if (kind !== 'transform') return null;
  if (!getPlayer(b).transformationId) return 'noForm';
  return b.transformToggled ? 'toggled' : null;
}

/** Ícone do jutsu: o desenho próprio da entrega de arte. */
function jutsuIcon(id: string): IconRef | null {
  return JUTSUS[id] ? jutsuIconRef(id) : null;
}

/** Motivo visível de um jutsu apagado (spec §10: nunca só pela cor). */
function jutsuReason(j: JutsuButton): string | null {
  if (!j.allowed) return t('battle.reason.illusion');
  if (!j.affordable) return t('battle.reason.noChakra');
  return null;
}

function fighterPanel(ctx: ScreenCtx, v: CombatantView, side: 'player' | 'enemy'): HTMLElement {
  return h(
    'div',
    { class: 'panel fighter', attrs: { 'data-side': side } },
    h(
      'div',
      { class: 'row' },
      h('strong', {}, v.name),
      h('span', {}, t('common.level', { n: v.level })),
      v.grade ? h('span', { class: 'badge' }, t('battle.grade', { g: v.grade })) : null,
      v.isBoss ? h('span', { class: 'badge' }, t('map.boss')) : null,
      // Durante a animação a Ficha fica fechada: sair da tela de batalha só depois da luta resolver.
      side === 'player'
        ? button(t('battle.sheet'), () => ctx.store.go('sheet'), { disabled: ctx.store.state.locked, attrs: { 'data-sheet': '' } })
        : null,
    ),
    h('div', { class: 'muted' }, t('battle.stat', { label: t('derived.power'), value: v.power })),
    bar('hp', v.hp, v.maxHp, t('header.hp')),
    bar('chakra', v.chakra, v.maxChakra, t('header.chakra')),
    h(
      'div',
      { class: 'muted' },
      [
        t('battle.stat', { label: t('derived.crit'), value: pct(v.critPct) }),
        t('battle.stat', { label: t('derived.reduction'), value: pct(v.reductionPct) }),
        t('battle.stat', { label: t('derived.dodge'), value: pct(v.dodgePct) }),
      ].join(t('battle.statSep')),
    ),
    h(
      'div',
      { class: 'effects' },
      ...v.effects.map((e) =>
        h(
          'span',
          { class: 'effect-chip', title: e.description },
          t('battle.effectChip', { name: e.name, n: e.sustained || e.remaining === null ? t('battle.permanent') : e.remaining }),
        ),
      ),
    ),
  );
}

/** HUD da batalha (spec §10; DD v2 §13). O Phaser desenha a arena por baixo. */
export const BattleScreen: ScreenRenderer = (ctx) => {
  const s = ctx.store.state;
  const ui = uiOf(ctx);
  const battle = s.run?.battle ?? s.battleSnapshot;
  const live = liveBattle(s);

  const logEl = h('div', { class: 'battle-log', attrs: { role: 'log', 'aria-live': 'polite' } }, ...s.battleLog.slice(-80).map((l) => h('div', { class: `log-${l.kind}` }, l.text)));
  queueMicrotask(() => {
    logEl.scrollTop = logEl.scrollHeight;
  });
  if (!battle) return h('div', { class: 'battle-hud' }, logEl);

  const p = getPlayer(battle);
  const e = getEnemy(battle);
  const indicator = s.locked
    ? t('battle.resolving')
    : battle.status === 'awaitingInput'
      ? battle.onlyKai
        ? t('battle.onlyKai')
        : t('battle.yourTurn')
      : battle.status === 'ended'
        ? t('battle.ended')
        : t('battle.enemyTurn');

  const off = (kind: BasicKind) => !live || basicBlock(battle, kind) !== null;
  const form = p.transformationId ? (EFFECTS[p.transformationId]?.name ?? p.transformationId) : '';
  const pv = combatantView(p, e);
  const transformLabel = pv.transformed ? t('battle.transformOff', { form }) : t('battle.transformOn', { form });
  const basic = [
    button(t('battle.attack'), () => doAct(ctx, { type: 'attack' }), { icon: UI_ICON('attack'), disabled: off('attack'), attrs: { 'data-action': 'attack' } }),
    button(t('battle.defend'), () => doAct(ctx, { type: 'defend' }), { icon: UI_ICON('defend'), disabled: off('defend'), attrs: { 'data-action': 'defend' } }),
    button(t('battle.meditate'), () => doAct(ctx, { type: 'meditate' }), { icon: UI_ICON('meditate'), disabled: off('meditate'), attrs: { 'data-action': 'meditate' } }),
    button(t('battle.item'), () => toggleItems(ctx), {
      icon: UI_ICON('item'),
      disabled: off('item'),
      attrs: { 'data-action': 'item', 'aria-expanded': String(ui.items) },
    }),
    p.transformationId
      ? button(
          basicBlock(battle, 'transform') === 'toggled' ? t('battle.withReason', { label: transformLabel, reason: t('battle.reason.toggled') }) : transformLabel,
          () => doAct(ctx, { type: 'transform' }),
          { icon: UI_ICON('transform'), disabled: off('transform'), attrs: { 'data-action': 'transform' } },
        )
      : null,
  ];

  const jutsus = jutsuButtons(battle).map((j, i) => {
    const isSel = ui.selected === j.id;
    const base = t('battle.jutsu', { key: i + 1, name: j.name, cost: j.cost, mastery: j.mastery });
    const reason = jutsuReason(j);
    const withReason = reason ? t('battle.withReason', { label: base, reason }) : base;
    return button(isSel ? t('battle.selected', { label: withReason }) : withReason, () => pickJutsu(ctx, j.id), {
      class: `jutsu ${isSel ? 'primary' : ''}`,
      icon: jutsuIcon(j.id),
      disabled: !live || reason !== null,
      title: j.description,
      attrs: { 'data-jutsu': j.id, 'aria-pressed': String(isSel) },
    });
  });

  const selected = ui.selected ? JUTSUS[ui.selected] : undefined;
  const details = selected
    ? h(
        'div',
        { class: 'panel jutsu-detail' },
        h('strong', {}, selected.name),
        h('p', {}, selected.description),
        button(t('battle.use'), () => doAct(ctx, { type: 'jutsu', jutsuId: selected.id }), { primary: true, disabled: !live }),
      )
    : null;

  const consumables = Object.entries(p.inventory).filter(([id, n]) => n > 0 && ITEMS[id]?.kind === 'consumable');
  const items = ui.items
    ? h(
        'div',
        { class: 'panel row' },
        ...(consumables.length
          ? consumables.map(([id, n]) =>
              button(
                t('battle.itemEntry', { name: ITEMS[id]!.name, n }),
                () => {
                  if (ITEMS[id]!.buffAttr) {
                    ui.reforco = true;
                    return ctx.rerender();
                  }
                  doAct(ctx, { type: 'item', itemId: id });
                },
                { icon: ITEM_ICON[id] ?? null, disabled: !live },
              ),
            )
          : [h('span', { class: 'muted' }, t('battle.noItems'))]),
      )
    : null;
  const reforco = ui.reforco
    ? h(
        'div',
        { class: 'panel row' },
        h('span', {}, t('battle.reforcoPick')),
        ...REFORCO_ATTRS.map((a) =>
          button(t('battle.reforcoAttr', { attr: ATTR_NAMES[a] }), () => doAct(ctx, { type: 'item', itemId: 'pergaminho_reforco', attr: a }), { icon: ATTR_ICON[a], disabled: !live }),
        ),
      )
    : null;

  return h(
    'div',
    { class: 'battle-hud' },
    h(
      'div',
      { class: 'fighters' },
      fighterPanel(ctx, pv, 'player'),
      h('div', { class: 'panel turn-indicator', attrs: { 'aria-live': 'polite' } }, indicator),
      fighterPanel(ctx, combatantView(e, p), 'enemy'),
    ),
    h('div', {}),
    h('div', { class: 'grid-2 battle-bottom' }, logEl, h('div', { class: 'screen' }, details, items, reforco, h('div', { class: 'action-bar' }, h('div', { class: 'basic-row' }, ...basic), h('div', { class: 'jutsu-grid' }, ...jutsus)))),
  );
};

const DIRECT: Record<string, Action & { type: BasicKind }> = {
  a: { type: 'attack' },
  d: { type: 'defend' },
  m: { type: 'meditate' },
  t: { type: 'transform' },
};

/**
 * Atalhos (spec §10): 1–4 jutsus, A, D, M, I, T; Enter confirma o jutsu selecionado.
 * Esc só fecha a descrição/painel de itens: NUNCA sai da batalha (não há voltar aqui).
 */
export const battleKeys: KeyHandler = (ctx, e) => {
  const ui = uiOf(ctx);
  const k = e.key.toLowerCase();
  if (k === 'escape') {
    if (ui.selected || ui.items || ui.reforco) {
      closePanels(ui);
      ctx.rerender();
    }
    return;
  }
  const battle = liveBattle(ctx.store.state);
  if (!battle) return;
  const direct = DIRECT[k];
  // Tecla segurada não repete ações; botão apagado = atalho ignorado em silêncio.
  if (direct) {
    if (e.repeat || basicBlock(battle, direct.type) !== null) return;
    e.preventDefault();
    return doAct(ctx, direct);
  }
  if (k === 'i') {
    if (e.repeat || basicBlock(battle, 'item') !== null) return;
    return toggleItems(ctx);
  }
  if (e.repeat) return;
  if (/^[1-4]$/.test(k)) {
    const j = jutsuButtons(battle)[Number(k) - 1];
    if (j && jutsuReason(j) === null) pickJutsu(ctx, j.id);
    return;
  }
  if (k === 'enter' && ui.selected) {
    // Sem isso, Enter num botão focado também dispararia o clique dele (duas ações).
    e.preventDefault();
    return doAct(ctx, { type: 'jutsu', jutsuId: ui.selected });
  }
};

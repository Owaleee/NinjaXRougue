import { BALANCE as B } from '../Balance';
import { CATEGORY_ATTR } from '../attributes';
import { RuleError } from '../errors';
import type { GameEvent } from '../events';
import { chakraRegen, controlChance, effectChance } from '../formulas';
import type { Rng } from '../Rng';
import { CLANS } from '../../data/clans';
import { EFFECTS, REFORCO_ATTRS } from '../../data/effects';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import {
  activeControl,
  activeTransformation,
  applyDots,
  applyEffect,
  cleanseIllusions,
  effectiveAttr,
  payTransformationUpkeep,
  removeEffect,
  tickDurations,
} from '../effects/EffectSystem';
import { chooseAiAction } from './ai';
import { costFor, currentMasteryLevel } from './cost';
import { resolveHit } from './damage';
import type { Action, BattleState, Combatant } from './types';

/**
 * Máquina de estados da batalha.
 * - startBattle/applyAction devolvem um NOVO estado + os eventos do que aconteceu.
 * - Turnos de inimigos são resolvidos automaticamente até o jogador precisar agir.
 * - A interface (Plano 2) só anima a lista de eventos, na ordem.
 */
export function startBattle(player: Combatant, enemy: Combatant, rng: Rng): { state: BattleState; events: GameEvent[] } {
  const state: BattleState = {
    combatants: [structuredClone(player), structuredClone(enemy)],
    round: 0,
    order: [],
    turnPos: -1,
    activeId: null,
    status: 'running',
    winner: null,
    transformToggled: false,
    onlyKai: false,
  };
  const events: GameEvent[] = [{ type: 'battleStart', playerId: player.id, enemyId: enemy.id }];
  advance(state, rng, events);
  return { state, events };
}

export function applyAction(state: BattleState, action: Action, rng: Rng): { state: BattleState; events: GameEvent[] } {
  const s = structuredClone(state);
  const events = applyActionInPlace(s, action, rng);
  return { state: s, events };
}

/** Variante que MUTA o estado (usada pelo simulador, onde clonar a cada ação custa caro). */
export function applyActionInPlace(s: BattleState, action: Action, rng: Rng): GameEvent[] {
  if (s.status === 'ended') throw new RuleError('battleEnded', 'A batalha já terminou.');
  if (s.status !== 'awaitingInput' || !s.activeId) throw new RuleError('notYourTurn', 'Não é a vez do jogador.');
  const actor = byId(s, s.activeId);
  const events: GameEvent[] = [];

  if (action.type === 'transform') {
    if (s.onlyKai) throw new RuleError('onlyKai', 'Sob Ilusão, só é possível usar Kai.');
    const consumesTurn = toggleTransformation(s, actor, events);
    if (!consumesTurn) return events; // ação livre: continua a vez do jogador
  } else {
    if (s.onlyKai && !(action.type === 'jutsu' && JUTSUS[action.jutsuId]?.cleanse)) {
      throw new RuleError('onlyKai', 'Sob Ilusão, só é possível usar Kai.');
    }
    execute(s, actor, action, rng, events);
  }

  s.onlyKai = false;
  s.activeId = null;
  s.status = 'running';
  if (!checkEnd(s, events)) advance(s, rng, events);
  return events;
}

export function getPlayer(s: BattleState): Combatant {
  return s.combatants.find((c) => c.side === 'player') as Combatant;
}

export function getEnemy(s: BattleState): Combatant {
  return s.combatants.find((c) => c.side === 'enemy') as Combatant;
}

// ------------------------------------------------------------------ fluxo

function byId(s: BattleState, id: string): Combatant {
  const c = s.combatants.find((x) => x.id === id);
  if (!c) throw new RuleError('unknownCombatant', `Combatente desconhecido: ${id}`);
  return c;
}

function opponent(s: BattleState, actor: Combatant): Combatant {
  return s.combatants.find((c) => c.side !== actor.side) as Combatant;
}

/** Avança turnos (resolvendo os inimigos) até o jogador precisar agir ou a luta acabar. */
function advance(s: BattleState, rng: Rng, ev: GameEvent[]): void {
  while (s.status !== 'ended') {
    s.turnPos++;
    if (s.turnPos >= s.order.length) {
      newRound(s, rng, ev);
      if (checkEnd(s, ev)) return;
    }
    const actor = byId(s, s.order[s.turnPos] as string);
    if (actor.hp <= 0) continue;
    const outcome = beginTurn(s, actor, ev);
    if (checkEnd(s, ev)) return;
    if (outcome === 'skip') continue;
    if (actor.side === 'player') {
      s.status = 'awaitingInput';
      s.activeId = actor.id;
      return;
    }
    execute(s, actor, chooseAiAction(s, actor), rng, ev);
    if (checkEnd(s, ev)) return;
  }
}

/** Ordem da rodada: Velocidade efetiva × (1 + sorteio 0..10%), recalculada todo turno (DD v2 §9). */
function newRound(s: BattleState, rng: Rng, ev: GameEvent[]): void {
  s.round++;
  const rolls = s.combatants
    .filter((c) => c.hp > 0)
    .map((c) => ({ id: c.id, v: effectiveAttr(c, 'vel') * (1 + rng.range(0, B.turnOrderJitter)) }));
  rolls.sort((a, b) => b.v - a.v);
  s.order = rolls.map((r) => r.id);
  s.turnPos = 0;
  ev.push({ type: 'roundStart', round: s.round, order: [...s.order] });
}

/** Início do turno (spec §4): regen → manutenção → dano contínuo → controle → durações. */
function beginTurn(s: BattleState, actor: Combatant, ev: GameEvent[]): 'act' | 'skip' {
  ev.push({ type: 'turnStart', actorId: actor.id, round: s.round });
  actor.defending = false;
  s.transformToggled = false;
  s.onlyKai = false;

  const regen = Math.min(chakraRegen(effectiveAttr(actor, 'int')), actor.maxChakra - actor.chakra);
  if (regen > 0) {
    actor.chakra += regen;
    ev.push({ type: 'chakraRegen', actorId: actor.id, amount: regen });
  }
  ev.push(...payTransformationUpkeep(actor));
  ev.push(...applyDots(actor));
  if (actor.hp <= 0) return 'skip';

  const control = activeControl(actor);
  if (!control) {
    ev.push(...tickDurations(actor));
    return 'act';
  }
  const canKai =
    actor.side === 'player' &&
    EFFECTS[control.effectId]?.controlKind === 'illusion' &&
    actor.jutsus.some((id) => {
      const j = JUTSUS[id];
      return !!j?.cleanse && costFor(actor, j) <= actor.chakra;
    });
  if (canKai) {
    // A Ilusão não expira sozinha: o jogador precisa gastar o Kai.
    s.onlyKai = true;
    ev.push(...tickDurations(actor, [control.effectId]));
    return 'act';
  }
  ev.push({ type: 'controlledSkip', actorId: actor.id, effectId: control.effectId });
  ev.push(...tickDurations(actor));
  return 'skip';
}

function checkEnd(s: BattleState, ev: GameEvent[]): boolean {
  if (s.status === 'ended') return true;
  const fallen = s.combatants.find((c) => c.hp <= 0);
  const timeout = s.round > B.battle.maxRounds;
  if (!fallen && !timeout) return false;
  s.status = 'ended';
  s.activeId = null;
  s.onlyKai = false;
  s.winner = fallen ? (fallen.side === 'player' ? 'enemy' : 'player') : 'enemy';
  for (const c of s.combatants) {
    const t = activeTransformation(c);
    if (t) {
      removeEffect(c, t.effectId);
      ev.push({ type: 'transformOff', actorId: c.id, transformationId: t.effectId, reason: 'battleEnd' });
    }
  }
  ev.push({ type: 'battleEnd', winner: s.winner, reason: fallen ? 'ko' : 'timeout' });
  return true;
}

// ------------------------------------------------------------------ ações

function execute(s: BattleState, actor: Combatant, action: Action, rng: Rng, ev: GameEvent[]): void {
  const target = opponent(s, actor);
  ev.push({ type: 'actionChosen', actorId: actor.id, action });
  switch (action.type) {
    case 'attack':
      ev.push(
        ...resolveHit(actor, target, { power: B.power.attack, attrKey: 'tai', element: null, masteryLevel: 0, jutsuId: null }, rng)
          .events,
      );
      return;
    case 'jutsu':
      useJutsu(actor, target, action.jutsuId, rng, ev);
      return;
    case 'defend': {
      actor.defending = true;
      const gain = Math.min(Math.round(actor.maxChakra * B.actions.defendChakraPct), actor.maxChakra - actor.chakra);
      actor.chakra += gain;
      ev.push({ type: 'defend', actorId: actor.id, chakra: gain });
      return;
    }
    case 'meditate': {
      const bonus = actor.clan ? CLANS[actor.clan].meditateBonus : 0;
      const gain = Math.min(
        Math.round(actor.maxChakra * B.actions.meditateChakraPct * (1 + bonus)),
        actor.maxChakra - actor.chakra,
      );
      actor.chakra += gain;
      ev.push({ type: 'meditate', actorId: actor.id, chakra: gain });
      return;
    }
    case 'item':
      useItem(actor, action, ev);
      return;
    case 'transform':
      throw new RuleError('invalidAction', 'Transformação é tratada fora de execute().');
  }
}

function useJutsu(actor: Combatant, target: Combatant, jutsuId: string, rng: Rng, ev: GameEvent[]): void {
  const j = JUTSUS[jutsuId];
  if (!j || !actor.jutsus.includes(jutsuId)) throw new RuleError('notEquipped', 'Jutsu não equipado.');
  const level = currentMasteryLevel(actor, j);
  const cost = costFor(actor, j);
  if (actor.chakra < cost) throw new RuleError('noChakra', 'Chakra insuficiente.');

  actor.chakra -= cost;
  ev.push({ type: 'jutsuUsed', actorId: actor.id, jutsuId, cost });
  if (j.cleanse) ev.push(...cleanseIllusions(actor));

  let landed = true;
  if (j.power !== null) {
    const hit = resolveHit(actor, target, { power: j.power, attrKey: CATEGORY_ATTR[j.category], element: j.element, masteryLevel: level, jutsuId }, rng);
    ev.push(...hit.events);
    landed = hit.landed;
  }

  for (const spec of j.effects) {
    const who = spec.target === 'self' ? actor : target;
    // Efeito no inimigo de um jutsu de dano só vale se o golpe acertou.
    if (spec.target === 'enemy' && (!landed || target.hp <= 0)) continue;
    const def = EFFECTS[spec.effectId];
    if (!def) throw new RuleError('unknownEffect', `Efeito desconhecido: ${spec.effectId}`);
    const p =
      def.type === 'control'
        ? controlChance(spec.chance, effectiveAttr(actor, 'gen'), def.controlKind === 'illusion', level, who.isBoss)
        : effectChance(spec.chance, level);
    if (p >= 1 || rng.chance(p)) ev.push(...applyEffect(who, spec.effectId, { sourceId: actor.id, duration: spec.duration }));
    else ev.push({ type: 'effectResisted', targetId: who.id, effectId: spec.effectId, reason: 'chance' });
  }

  // Maestria: cada conjuração conta 1 uso (acertando ou não). Só cabe 1 jutsu por turno.
  actor.masteryUses[jutsuId] = (actor.masteryUses[jutsuId] ?? 0) + 1;
  const after = currentMasteryLevel(actor, j);
  if (after > level) ev.push({ type: 'masteryUp', actorId: actor.id, jutsuId, level: after });
}

function useItem(actor: Combatant, action: Extract<Action, { type: 'item' }>, ev: GameEvent[]): void {
  const item = ITEMS[action.itemId];
  if (!item || item.kind !== 'consumable') throw new RuleError('notConsumable', 'Este item não pode ser usado em batalha.');
  if ((actor.inventory[action.itemId] ?? 0) <= 0) throw new RuleError('noItem', 'Você não tem este item.');
  if (item.buffAttr && (!action.attr || !(REFORCO_ATTRS as readonly string[]).includes(action.attr))) {
    throw new RuleError('needAttr', 'Escolha o atributo do Pergaminho de Reforço.');
  }
  actor.inventory[action.itemId] = (actor.inventory[action.itemId] ?? 0) - 1;
  ev.push({ type: 'itemUsed', actorId: actor.id, itemId: action.itemId });
  if (item.buffAttr && action.attr) ev.push(...applyEffect(actor, `reforco_${action.attr}`, { sourceId: actor.id }));
  if (item.heal) {
    const hp = Math.min(Math.round(actor.maxHp * (item.heal.hpPct ?? 0)), actor.maxHp - actor.hp);
    const chakra = Math.min(Math.round(actor.maxChakra * (item.heal.chakraPct ?? 0)), actor.maxChakra - actor.chakra);
    actor.hp += hp;
    actor.chakra += chakra;
    ev.push({ type: 'heal', targetId: actor.id, hp, chakra });
  }
}

/** Liga/desliga a transformação. Devolve true se isso consumiu o turno. */
function toggleTransformation(s: BattleState, actor: Combatant, ev: GameEvent[]): boolean {
  if (!actor.transformationId) throw new RuleError('noTransformation', 'Este personagem não tem transformação.');
  if (s.transformToggled) throw new RuleError('alreadyToggled', 'A transformação só pode ser alternada uma vez por turno.');
  const def = EFFECTS[actor.transformationId];
  if (!def) throw new RuleError('unknownEffect', `Efeito desconhecido: ${actor.transformationId}`);

  if (activeTransformation(actor)) {
    s.transformToggled = true;
    ev.push(...removeEffect(actor, def.id));
    ev.push({ type: 'transformOff', actorId: actor.id, transformationId: def.id, reason: 'manual' });
    return false;
  }
  const cost = def.activationCost ?? 0;
  if (actor.chakra < cost) throw new RuleError('noChakra', 'Chakra insuficiente para transformar.');
  s.transformToggled = true;
  actor.chakra -= cost;
  ev.push(...applyEffect(actor, def.id, { sourceId: actor.id }));
  ev.push({ type: 'transformOn', actorId: actor.id, transformationId: def.id });
  return def.activationCostsTurn === true;
}

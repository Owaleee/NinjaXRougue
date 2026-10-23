import { BALANCE } from '../../game/Balance';
import { addAttributes, emptyAttributes } from '../../game/attributes';
import { getPlayer } from '../../game/combat/battle';
import { costFor, currentMasteryLevel } from '../../game/combat/cost';
import type { BattleState, Combatant } from '../../game/combat/types';
import { activeTransformation, aggregateMods, effectiveAttr } from '../../game/effects/EffectSystem';
import { chakraRegen, critChance, defenseReduction, dodgeChance, totalReduction } from '../../game/formulas';
import {
  characterMaxChakra,
  characterMaxHp,
  createCharacter,
  effectiveAttrs,
  type PlayerCharacter,
} from '../../game/progression/character';
import { checkUnlocks, missingRequirements } from '../../game/progression/unlock';
import {
  ATTR_KEYS,
  type AttrKey,
  type Attributes,
  type ClanId,
  type EffectType,
  type Element,
  type Grade,
  type StoryPointId,
} from '../../game/types';
import { EFFECTS } from '../../data/effects';
import { JUTSU_LIST, JUTSUS } from '../../data/jutsus';
import { SAGA_ONDA } from '../../data/saga';
import { storyIndex } from '../../data/story';

/**
 * Números que as telas mostram mas que NÃO são regra do jogo.
 * Tudo puro e testável sem DOM; as telas só formatam o resultado.
 */

/**
 * Poder Ninja (DD v2 §3): número informativo, nunca entra em fórmula.
 * PN = 2·HP + 3·(maior de Tai/Nin/Gen) + (soma dos outros dois) + 2·Vel + Int + 2·Crit + 2·Def
 */
export function ninjaPower(a: Attributes): number {
  const off = [a.tai, a.nin, a.gen].sort((x, y) => y - x);
  return 2 * a.hp + 3 * off[0]! + off[1]! + off[2]! + 2 * a.vel + a.int + 2 * a.crit + 2 * a.def;
}

export type StyleId = 'ninjutsu' | 'taijutsu' | 'genjutsu' | 'estrategista' | 'muralha' | 'agil' | 'equilibrado';

const STYLE_OF: Record<AttrKey, StyleId> = {
  nin: 'ninjutsu',
  tai: 'taijutsu',
  gen: 'genjutsu',
  int: 'estrategista',
  hp: 'muralha',
  def: 'muralha',
  vel: 'agil',
  crit: 'agil',
};

/** Rótulo da Ficha (DD v2 §14): o atributo mais investido, se tiver ≥ 30% do total investido. */
export function fightingStyle(base: Attributes): StyleId {
  const start = BALANCE.attributes.start;
  const invested = ATTR_KEYS.map((k) => ({ k, v: Math.max(0, base[k] - start) }));
  const total = invested.reduce((s, x) => s + x.v, 0);
  if (total === 0) return 'equilibrado';
  const top = invested.reduce((a, b) => (b.v > a.v ? b : a));
  const tied = invested.filter((x) => x.v === top.v).length > 1;
  return !tied && top.v / total >= 0.3 ? STYLE_OF[top.k] : 'equilibrado';
}

/**
 * Personagem "de mentira" para prévias. createCharacter exige exatamente 10
 * pontos; criamos com uma distribuição válida e trocamos os atributos base
 * pela distribuição parcial que o jogador está montando.
 */
export function previewCharacter(clan: ClanId, affinity: Element, alloc: Partial<Attributes>): PlayerCharacter {
  const c = createCharacter({
    name: 'Prévia',
    clan,
    affinity,
    allocation: { hp: BALANCE.attributes.creationPoints },
    titleId: null,
  });
  c.baseAttrs = addAttributes(emptyAttributes(BALANCE.attributes.start), alloc);
  c.hp = characterMaxHp(c);
  c.chakra = characterMaxChakra(c);
  return c;
}

export interface CreationPreview {
  hp: number;
  chakra: number;
  regen: number;
  critPct: number;
  reductionPct: number;
  power: number;
  unlocks: string[];
}

export function creationPreview(clan: ClanId, affinity: Element, alloc: Partial<Attributes>): CreationPreview {
  const c = previewCharacter(clan, affinity, alloc);
  const eff = effectiveAttrs(c);
  return {
    hp: characterMaxHp(c),
    chakra: characterMaxChakra(c),
    regen: chakraRegen(eff.int),
    critPct: critChance(eff.crit),
    reductionPct: defenseReduction(eff.def),
    power: ninjaPower(eff),
    unlocks: checkUnlocks(c, SAGA_ONDA.startStory, 0).learned,
  };
}

export interface JutsuGoal {
  jutsuId: string;
  missing: { attr: AttrKey; missing: number }[];
}

/** Jutsus que só dependem de atributo base para liberar, do mais perto ao mais longe. */
export function jutsuGoals(c: PlayerCharacter, story: StoryPointId, limit = 3): JutsuGoal[] {
  return JUTSU_LIST.filter(
    (j) =>
      !j.enemyOnly &&
      !c.learned.includes(j.id) &&
      (j.clan === null || j.clan === c.clan) &&
      storyIndex(j.minStory) <= storyIndex(story) &&
      (j.prereq === null || c.learned.includes(j.prereq)),
  )
    .map((j) => ({ jutsuId: j.id, missing: missingRequirements(c, j) }))
    .filter((g) => g.missing.length > 0)
    .sort((a, b) => sumMissing(a) - sumMissing(b))
    .slice(0, limit);
}

function sumMissing(g: JutsuGoal): number {
  return g.missing.reduce((s, m) => s + m.missing, 0);
}

export interface EffectChip {
  id: string;
  name: string;
  icon: string;
  remaining: number | null;
  sustained: boolean;
  description: string;
  type: EffectType;
}

export interface CombatantView {
  id: string;
  name: string;
  level: number;
  grade: Grade | null;
  isBoss: boolean;
  power: number;
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  critPct: number;
  dodgePct: number;
  reductionPct: number;
  effects: EffectChip[];
  transformed: boolean;
}

/** Painel de um lado da batalha (DD v2 §13): vitais, crítico/redução efetivos e efeitos. */
export function combatantView(c: Combatant, foe: Combatant): CombatantView {
  const mods = aggregateMods(c);
  return {
    id: c.id,
    name: c.name,
    level: c.level,
    grade: c.grade,
    isBoss: c.isBoss,
    power: ninjaPower(c.attrs),
    hp: c.hp,
    maxHp: c.maxHp,
    chakra: c.chakra,
    maxChakra: c.maxChakra,
    critPct: critChance(effectiveAttr(c, 'crit'), mods.crit),
    dodgePct: dodgeChance(effectiveAttr(c, 'vel'), effectiveAttr(foe, 'vel'), mods.dodge),
    reductionPct: totalReduction(effectiveAttr(c, 'def'), mods.reduction),
    effects: c.effects.map((e) => {
      const d = EFFECTS[e.effectId];
      return {
        id: e.effectId,
        name: d?.name ?? e.effectId,
        icon: d?.icon ?? '?',
        remaining: e.remaining,
        sustained: d?.duration === 'sustained',
        description: d?.description ?? '',
        type: d?.type ?? 'buff',
      };
    }),
    transformed: activeTransformation(c) !== undefined,
  };
}

export interface JutsuButton {
  id: string;
  name: string;
  cost: number;
  mastery: number;
  affordable: boolean;
  allowed: boolean;
  description: string;
  element: Element | null;
}

/** Fileira de jutsus equipados (DD v2 §13): custo já com descontos, maestria, apagado sem chakra. */
export function jutsuButtons(s: BattleState): JutsuButton[] {
  const p = getPlayer(s);
  return p.jutsus.flatMap((id) => {
    const j = JUTSUS[id];
    if (!j) return [];
    const cost = costFor(p, j);
    return [
      {
        id,
        name: j.name,
        cost,
        mastery: currentMasteryLevel(p, j),
        affordable: p.chakra >= cost,
        allowed: !s.onlyKai || j.cleanse === true,
        description: j.description,
        element: j.element,
      },
    ];
  });
}

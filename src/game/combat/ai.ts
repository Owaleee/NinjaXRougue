import { BALANCE as B } from '../Balance';
import { CATEGORY_ATTR } from '../attributes';
import { elementMultiplier } from '../formulas';
import { JUTSUS, type JutsuDef } from '../../data/jutsus';
import { effectiveAttr, hasEffect } from '../effects/EffectSystem';
import { costFor } from './cost';
import type { Action, BattleState, Combatant } from './types';

/**
 * IA dos inimigos (DD v2 §9). Determinística de propósito: o mesmo estado
 * gera a mesma escolha (testes e simulador estáveis).
 * Pode marcar `self.aiOpened` — é sempre chamada dentro de um estado clonado.
 */
export function chooseAiAction(s: BattleState, self: Combatant): Action {
  const foe = (s.combatants.find((c) => c.side !== self.side && c.hp > 0) ??
    s.combatants.find((c) => c.id !== self.id)) as Combatant;
  switch (self.ai) {
    case 'zabuza':
      return zabuza(self, foe);
    case 'haku':
      return haku(self, foe);
    default:
      return basic(self, foe, self.jutsus);
  }
}

const jutsu = (jutsuId: string): Action => ({ type: 'jutsu', jutsuId });

function canUse(self: Combatant, id: string): boolean {
  const j = JUTSUS[id];
  return !!j && self.jutsus.includes(id) && costFor(self, j) <= self.chakra;
}

/** Dano esperado sem sorteio (sem crítico/esquiva/defesa), para comparar opções. */
export function expectedDamage(self: Combatant, foe: Combatant, j: JutsuDef): number {
  if (j.power === null) return 0;
  const attr = effectiveAttr(self, CATEGORY_ATTR[j.category]);
  return j.power * (1 + attr / B.damage.attrDivisor) * elementMultiplier(j.element, foe.element);
}

/** Dano esperado de Atacar (golpe básico de Taijutsu), sem sorteio. */
export function attackExpected(self: Combatant): number {
  return B.power.attack * (1 + effectiveAttr(self, 'tai') / B.damage.attrDivisor);
}

/**
 * Regras gerais:
 * 1. HP abaixo de `defensiveHpPct` → jutsu defensivo (só efeitos em si mesmo) ainda não ativo;
 * 2. vantagem elemental tem prioridade;
 * 3. senão, maior dano esperado (ou Atacar, se for melhor);
 * 4. sem chakra para nada → Atacar.
 */
function basic(self: Combatant, foe: Combatant, pool: string[]): Action {
  const usable = pool.filter((id) => canUse(self, id)).map((id) => JUTSUS[id] as JutsuDef);
  if (self.hp < self.maxHp * B.ai.defensiveHpPct) {
    const defensive = usable.find(
      (j) =>
        j.power === null &&
        j.effects.length > 0 &&
        j.effects.every((e) => e.target === 'self') &&
        !j.effects.some((e) => hasEffect(self, e.effectId)),
    );
    if (defensive) return jutsu(defensive.id);
  }
  const damaging = usable.filter((j) => j.power !== null);
  if (damaging.length === 0) return { type: 'attack' };
  const advantaged = damaging.filter((j) => elementMultiplier(j.element, foe.element) > 1);
  const candidates = advantaged.length ? advantaged : damaging;
  const best = candidates.reduce((a, b) => (expectedDamage(self, foe, b) > expectedDamage(self, foe, a) ? b : a));
  if (!advantaged.length && expectedDamage(self, foe, best) <= attackExpected(self)) return { type: 'attack' };
  return jutsu(best.id);
}

/** Zabuza: abre com Kirigakure e a renova sempre que expira; na 2ª fase ataca de dentro da névoa. */
function zabuza(self: Combatant, foe: Combatant): Action {
  const mist = hasEffect(self, 'nevoa');
  if (!self.aiOpened) {
    self.aiOpened = true;
    if (canUse(self, 'kirigakure')) return jutsu('kirigakure');
  }
  if (!mist && canUse(self, 'kirigakure')) return jutsu('kirigakure');
  if (self.hp < self.maxHp * B.ai.phase2HpPct) {
    if (mist && canUse(self, 'muon_satsujin')) return jutsu('muon_satsujin');
    if (canUse(self, 'suiryuudan')) return jutsu('suiryuudan');
  }
  return basic(self, foe, ['kubikiribouchou', 'suiryuudan']);
}

/** Haku: abre com Makyou; na 2ª fase renova os espelhos e prioriza Sensatsu Suishou. */
function haku(self: Combatant, foe: Combatant): Action {
  const mirrors = hasEffect(self, 'makyou');
  if (!self.aiOpened) {
    self.aiOpened = true;
    if (canUse(self, 'makyou_hyoushou')) return jutsu('makyou_hyoushou');
  }
  if (self.hp < self.maxHp * B.ai.phase2HpPct) {
    if (!mirrors && canUse(self, 'makyou_hyoushou')) return jutsu('makyou_hyoushou');
    if (canUse(self, 'sensatsu_suishou')) return jutsu('sensatsu_suishou');
    if (canUse(self, 'senbon')) return jutsu('senbon');
    return { type: 'attack' };
  }
  return basic(self, foe, ['senbon', 'sensatsu_suishou']);
}

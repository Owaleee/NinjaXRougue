import { describe, it, expect } from 'vitest';
import { chooseAiAction } from '../src/game/combat/ai';
import { createEnemy, distributePoints } from '../src/game/combat/enemyFactory';
import type { BattleState, Combatant } from '../src/game/combat/types';
import { applyEffect } from '../src/game/effects/EffectSystem';
import { ARCHETYPES } from '../src/data/enemies';
import { sumAttributes } from '../src/game/attributes';
import { maxHp } from '../src/game/formulas';
import { RuleError } from '../src/game/errors';
import { makeCombatant, type CombatantOverrides } from './helpers';
import { BALANCE } from '../src/game/Balance';

function battleWith(enemy: Combatant): BattleState {
  const player = makeCombatant({ id: 'player', side: 'player', element: 'fogo' });
  return { combatants: [player, enemy], round: 1, order: [], turnPos: 0, activeId: null, status: 'running', winner: null, transformToggled: false, onlyKai: false };
}

const enemy = (over: CombatantOverrides = {}) => makeCombatant({ id: 'e', side: 'enemy', ai: 'basic', ...over });

describe('IA básica (DD v2 §9)', () => {
  it('sem chakra para nenhum jutsu, ataca', () => {
    const e = enemy({ jutsus: ['golpe_pesado'], chakra: 0 });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'attack' });
  });

  it('usa o golpe de maior dano esperado', () => {
    const e = enemy({ jutsus: ['golpe_pesado'] });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'golpe_pesado' });
  });

  it('prioriza jutsu com vantagem elemental mesmo com menos dano bruto', () => {
    const e = enemy({ jutsus: ['muon_satsujin', 'sensatsu_suishou'], attrs: { tai: 40, nin: 5 } });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'sensatsu_suishou' });
  });

  it('abaixo de 25% de HP usa jutsu defensivo que ainda não está ativo', () => {
    const e = enemy({ jutsus: ['kirigakure', 'golpe_pesado'], hp: 20 });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'kirigakure' });
    applyEffect(e, 'nevoa', { sourceId: 'e' });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'golpe_pesado' });
  });
});

describe('scripts de chefe', () => {
  it('Zabuza abre com Kirigakure e, abaixo de 50% com névoa, usa Muon Satsujin', () => {
    const z = createEnemy('zabuza', 5);
    const s = battleWith(z);
    expect(chooseAiAction(s, z)).toEqual({ type: 'jutsu', jutsuId: 'kirigakure' });
    expect(z.aiOpened).toBe(true);
    applyEffect(z, 'nevoa', { sourceId: z.id });
    z.hp = Math.floor(z.maxHp * 0.4);
    expect(chooseAiAction(s, z)).toEqual({ type: 'jutsu', jutsuId: 'muon_satsujin' });
  });

  it('Zabuza renova a névoa quando ela expira', () => {
    const z = createEnemy('zabuza', 5);
    z.aiOpened = true;
    expect(chooseAiAction(battleWith(z), z)).toEqual({ type: 'jutsu', jutsuId: 'kirigakure' });
  });

  it('Haku abre com Makyou; na 2ª fase prioriza Sensatsu Suishou; sem chakra usa Senbon', () => {
    const h = createEnemy('haku', 10);
    const s = battleWith(h);
    expect(chooseAiAction(s, h)).toEqual({ type: 'jutsu', jutsuId: 'makyou_hyoushou' });
    applyEffect(h, 'makyou', { sourceId: h.id });
    h.hp = Math.floor(h.maxHp * 0.4);
    expect(chooseAiAction(s, h)).toEqual({ type: 'jutsu', jutsuId: 'sensatsu_suishou' });
    h.chakra = 0;
    expect(chooseAiAction(s, h)).toEqual({ type: 'jutsu', jutsuId: 'senbon' });
  });
});

describe('geração de inimigos (spec C5)', () => {
  it('distributePoints soma o total e dá no mínimo 1 a cada atributo', () => {
    for (const total of [35, 53, 86, 136]) {
      for (const w of Object.values(ARCHETYPES)) {
        const a = distributePoints(total, w);
        expect(sumAttributes(a)).toBe(total);
        expect(Math.min(...Object.values(a))).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Bandido nível 1 tem 35 pontos (P(1) × 0,70)', () => {
    const b = createEnemy('bandido', 1);
    expect(sumAttributes(b.attrs)).toBe(35);
    expect(b).toMatchObject({ id: 'enemy:bandido', grade: 'D', damageMult: BALANCE.enemyGrades.D.damageMult, isBoss: false, side: 'enemy' });
    expect(b.maxHp).toBe(Math.round(maxHp(b.attrs.hp, 1) * 0.8));
    expect(b.hp).toBe(b.maxHp);
  });

  it('Zabuza nível 5 (C) e Haku nível 10 (B) aplicam o HP do grau', () => {
    const z = createEnemy('zabuza', 5);
    expect(sumAttributes(z.attrs)).toBe(86);
    expect(z.maxHp).toBe(Math.round(maxHp(z.attrs.hp, 5) * BALANCE.enemyGrades.C.hpMult));
    expect(z).toMatchObject({ isBoss: true, element: 'agua', ai: 'zabuza' });
    const h = createEnemy('haku', 10);
    expect(sumAttributes(h.attrs)).toBe(136);
    expect(h.maxHp).toBe(Math.round(maxHp(h.attrs.hp, 10) * BALANCE.enemyGrades.B.hpMult));
  });

  it('template desconhecido gera RuleError', () => {
    expect(() => createEnemy('nao_existe', 1)).toThrow(RuleError);
  });
});

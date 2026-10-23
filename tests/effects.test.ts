import { describe, it, expect } from 'vitest';
import {
  activeControl,
  aggregateMods,
  applyDots,
  applyEffect,
  cleanseIllusions,
  consumeCharge,
  effectiveAttr,
  hasEffect,
  payTransformationUpkeep,
  tickDurations,
} from '../src/game/effects/EffectSystem';
import { makeCombatant } from './helpers';

const src = { sourceId: 'x' };

describe('sistema de efeitos', () => {
  it('buff dura N turnos do portador e expira com evento', () => {
    const c = makeCombatant();
    applyEffect(c, 'bunshin', src);
    expect(aggregateMods(c).dodge).toBeCloseTo(0.12);
    tickDurations(c);
    expect(hasEffect(c, 'bunshin')).toBe(true);
    const ev = tickDurations(c);
    expect(hasEffect(c, 'bunshin')).toBe(false);
    expect(ev).toContainEqual({ type: 'effectExpired', targetId: 'c1', effectId: 'bunshin' });
  });

  it('reaplicar renova a duração sem acumular', () => {
    const c = makeCombatant();
    applyEffect(c, 'bunshin', src);
    tickDurations(c);
    applyEffect(c, 'bunshin', src);
    expect(c.effects).toHaveLength(1);
    expect(c.effects[0]!.remaining).toBe(2);
    expect(aggregateMods(c).dodge).toBeCloseTo(0.12);
  });

  it('controle em chefe dura no máximo 1 turno', () => {
    const boss = makeCombatant({ isBoss: true });
    applyEffect(boss, 'imobilizado', { sourceId: 'x', duration: 2 });
    expect(boss.effects[0]!.remaining).toBe(1);
  });

  it('Tenacidade: 2 turnos de imunidade depois que um controle termina', () => {
    const c = makeCombatant({ side: 'enemy' });
    applyEffect(c, 'atordoado', src);
    tickDurations(c);
    expect(activeControl(c)).toBeUndefined();
    expect(c.tenacity).toBe(2);
    expect(applyEffect(c, 'imobilizado', src)).toContainEqual(
      expect.objectContaining({ type: 'effectResisted', reason: 'tenacity' }),
    );
    tickDurations(c);
    tickDurations(c);
    expect(c.tenacity).toBe(0);
    applyEffect(c, 'imobilizado', src);
    expect(activeControl(c)?.effectId).toBe('imobilizado');
  });

  it('um controle por vez: o segundo só renova a duração', () => {
    const c = makeCombatant({ side: 'enemy' });
    applyEffect(c, 'atordoado', src);
    applyEffect(c, 'imobilizado', { sourceId: 'x', duration: 2 });
    expect(activeControl(c)?.effectId).toBe('atordoado');
    expect(activeControl(c)?.remaining).toBe(2);
    expect(c.effects).toHaveLength(1);
  });

  it('queimadura: 4% do HP máximo por turno, por 3 turnos', () => {
    const c = makeCombatant({ maxHp: 200, hp: 200 });
    applyEffect(c, 'queimadura', src);
    for (let i = 0; i < 3; i++) {
      applyDots(c);
      tickDurations(c);
    }
    expect(c.hp).toBe(176);
    expect(applyDots(c)).toEqual([]);
  });

  it('queimadura que zera o HP emite defeated', () => {
    const c = makeCombatant({ maxHp: 100, hp: 3 });
    applyEffect(c, 'queimadura', src);
    expect(applyDots(c)).toContainEqual({ type: 'defeated', targetId: 'c1' });
    expect(c.hp).toBe(0);
  });

  it('agrega passivas e efeitos de forma aditiva', () => {
    const c = makeCombatant({ passiveMods: [{ crit: 0.03 }] });
    applyEffect(c, 'sharingan', src);
    const m = aggregateMods(c);
    expect(m.crit).toBeCloseTo(0.17);
    expect(m.jutsuDamagePct).toBeCloseTo(0.15);
  });

  it('atributo efetivo com Pergaminho de Reforço', () => {
    const c = makeCombatant({ attrs: { nin: 20 } });
    applyEffect(c, 'reforco_nin', src);
    expect(effectiveAttr(c, 'nin')).toBeCloseTo(22);
  });

  it('transformação: cobra manutenção e termina sem chakra', () => {
    const c = makeCombatant({ chakra: 10 });
    applyEffect(c, 'sharingan', src);
    expect(payTransformationUpkeep(c)).toContainEqual({ type: 'transformUpkeep', actorId: 'c1', amount: 2 });
    expect(c.chakra).toBe(8);
    expect(c.transformTurns).toBe(1);
    c.chakra = 1;
    expect(payTransformationUpkeep(c)).toContainEqual(expect.objectContaining({ type: 'transformOff', reason: 'noChakra' }));
    expect(hasEffect(c, 'sharingan')).toBe(false);
  });

  it('cargas: Kawarimi some ao consumir; Kage Bunshin mantém o bônus', () => {
    const c = makeCombatant();
    applyEffect(c, 'kawarimi', src);
    expect(consumeCharge(c, 'negateHit')).not.toBeNull();
    expect(hasEffect(c, 'kawarimi')).toBe(false);
    applyEffect(c, 'kage_bunshin', src);
    expect(consumeCharge(c, 'absorbHit')).not.toBeNull();
    expect(consumeCharge(c, 'absorbHit')).toBeNull();
    expect(aggregateMods(c).jutsuDamagePct).toBeCloseTo(0.25);
  });

  it('Kai remove a Ilusão e inicia a Tenacidade', () => {
    const c = makeCombatant();
    applyEffect(c, 'ilusao', src);
    cleanseIllusions(c);
    expect(activeControl(c)).toBeUndefined();
    expect(c.tenacity).toBe(2);
  });

  it('tickDurations pode preservar um efeito (Ilusão aguardando Kai)', () => {
    const c = makeCombatant();
    applyEffect(c, 'ilusao', src);
    tickDurations(c, ['ilusao']);
    expect(activeControl(c)?.effectId).toBe('ilusao');
  });
});

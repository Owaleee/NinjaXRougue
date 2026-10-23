import { describe, it, expect } from 'vitest';
import { emptyRunStats, mostUsedJutsu, trackBattleEvents, trackEncounterEnd } from '../src/game/meta/stats';
import type { GameEvent } from '../src/game/events';

const events: GameEvent[] = [
  { type: 'turnStart', actorId: 'player', round: 1 },
  { type: 'jutsuUsed', actorId: 'player', jutsuId: 'bola_de_fogo', cost: 8 },
  { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 30, crit: true, elementMult: 1, jutsuId: 'bola_de_fogo', hpAfter: 64 },
  { type: 'turnStart', actorId: 'enemy:bandido', round: 1 },
  { type: 'damage', sourceId: 'enemy:bandido', targetId: 'player', amount: 12, crit: false, elementMult: 1, jutsuId: null, hpAfter: 100 },
  { type: 'dot', targetId: 'enemy:bandido', effectId: 'queimadura', amount: 4, hpAfter: 60 },
  { type: 'dot', targetId: 'player', effectId: 'queimadura', amount: 5, hpAfter: 95 },
  { type: 'itemUsed', actorId: 'player', itemId: 'kit_medico' },
];

const win = { won: true, grade: 'D' as const, isBoss: false, elite: false, enemyId: 'bandido', damageTaken: 10, hpPctEnd: 0.8, ryo: 30 };

describe('estatísticas por eventos', () => {
  it('conta dano, maior golpe, críticos, jutsus, chakra, turnos e itens', () => {
    const s = trackBattleEvents(emptyRunStats(), events, 'player');
    expect(s).toMatchObject({ damageDealt: 34, damageTaken: 17, biggestHit: 30, crits: 1, chakraSpent: 8, turns: 1, itemsUsed: 1 });
    expect(s.jutsuUses).toEqual({ bola_de_fogo: 1 });
    expect(mostUsedJutsu(s)).toBe('bola_de_fogo');
    expect(mostUsedJutsu(emptyRunStats())).toBeNull();
  });

  it('fim de encontro: vitórias, derrotados por grau, elites, ryo', () => {
    let s = trackEncounterEnd(emptyRunStats(), win);
    s = trackEncounterEnd(s, { ...win, grade: 'D+', elite: true, ryo: 50, damageTaken: 0 });
    expect(s).toMatchObject({ encountersWon: 2, elitesDefeated: 1, ryoEarned: 80, flawlessWins: 1 });
    expect(s.defeatedByGrade).toEqual({ D: 1, 'D+': 1 });
  });

  it('chefe sem dano e chefe com menos de 10% de HP', () => {
    const s1 = trackEncounterEnd(emptyRunStats(), { ...win, grade: 'C', isBoss: true, enemyId: 'zabuza', damageTaken: 0 });
    expect(s1.bossNoDamage).toBe(true);
    expect(s1.bossesDefeated).toEqual(['zabuza']);
    expect(s1.bossMinHpPct).toBe(0.8);
    const s2 = trackEncounterEnd(emptyRunStats(), { ...win, grade: 'B', isBoss: true, enemyId: 'haku', hpPctEnd: 0.05 });
    expect(s2.bossMinHpPct).toBe(0.05);
  });

  it('derrota não conta como vitória e nada é mutado', () => {
    const base = emptyRunStats();
    const s = trackEncounterEnd(base, { ...win, won: false });
    expect(s.encountersWon).toBe(0);
    trackBattleEvents(base, events, 'player');
    expect(base).toEqual(emptyRunStats());
  });
});

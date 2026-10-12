import { describe, it, expect } from 'vitest';
import { availableTitles, emptyMeta, encyclopedia, recordRunEnd, runEndText } from '../src/game/meta/meta';
import { newRun } from '../src/game/run/runManager';
import type { RunState } from '../src/game/run/types';
import type { CreateParams } from '../src/game/progression/character';

const params: CreateParams = { name: 'Teste', clan: 'uchiha', affinity: 'fogo', allocation: { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }, titleId: null };
const run = (): RunState => newRun(params, 1, 0);

describe('meta-progressão', () => {
  it('recordRunEnd é idempotente para a mesma run', () => {
    const r = run();
    r.phase = 'dead';
    const first = recordRunEnd(emptyMeta(), r, 'dead', 1000);
    const second = recordRunEnd(first.meta, r, 'dead', 2000);
    expect(second.meta.lifetime.runs).toBe(1);
    expect(second.meta.history).toHaveLength(1);
    expect(second.newTitles).toEqual([]);
  });

  it('idempotência vale mesmo se o histórico já cortou a entrada', () => {
    const r = run();
    const first = recordRunEnd(emptyMeta(), r, 'dead', 1000);
    const meta = { ...first.meta, history: [] };
    expect(recordRunEnd(meta, r, 'dead', 2000).meta.lifetime.runs).toBe(1);
  });

  it('registra o histórico com texto e snapshot, mais recente primeiro, no máximo 50', () => {
    const r = run();
    r.phase = 'dead';
    r.character.level = 4;
    r.lastResult = { nodeIndex: 9, enemyId: 'mercenario_nevoa', enemyName: 'Mercenário da Névoa', grade: 'D', isBoss: false, elite: false, won: false, xp: 0, ryo: 0, rep: 0, levelsGained: 0, learned: [], damageTaken: 50, rounds: 3, hpPctEnd: 0 };
    let meta = emptyMeta();
    for (let i = 0; i < 52; i++) meta = recordRunEnd(meta, { ...r, startedAt: 1000 + i }, 'dead', 1000 + i).meta;
    expect(meta.history).toHaveLength(50);
    expect(meta.history[0]!.date).toBe(1051);
    expect(meta.history[0]!.text).toBe('Morreu na Saga da Onda, nível 4, para Mercenário da Névoa');
    expect(meta.history[0]!.snapshot.learned).toEqual(r.character.learned);
    expect(meta.lifetime.runs).toBe(52);
  });

  it('textos de vitória e abandono', () => {
    const r = run();
    r.character.level = 11;
    expect(runEndText(r, 'victory')).toBe('Concluiu a Saga da Onda no nível 11');
    r.nodeIndex = 4;
    expect(runEndText(r, 'abandoned')).toBe('Abandonou a run no encontro 5 de 26');
  });

  it('Demônio da Névoa ao derrotar Zabuza; Caçador de Bandidos somando runs', () => {
    const a = run();
    a.stats.bossesDefeated = ['zabuza'];
    a.stats.defeatedByGrade = { D: 15 };
    const r1 = recordRunEnd(emptyMeta(), a, 'dead', 1);
    expect(r1.newTitles).toContain('demonio_da_nevoa');
    expect(r1.newTitles).not.toContain('cacador_de_bandidos');
    const r2 = recordRunEnd(r1.meta, { ...a, startedAt: 2 }, 'dead', 2);
    expect(r2.newTitles).toContain('cacador_de_bandidos');
    expect(r2.newTitles).not.toContain('demonio_da_nevoa'); // já tinha
  });

  it('Sem um Arranhão, Por um Fio e Mestre de Jutsus', () => {
    const a = run();
    a.stats.bossNoDamage = true;
    a.stats.bossMinHpPct = 0.05;
    a.character.learned = ['henge', 'bunshin', 'kawarimi', 'bola_de_fogo', 'sennen_goroshi', 'investida_ninja', 'kai', 'daitoppa', 'doryuuheki', 'goukakyuu'];
    const { newTitles } = recordRunEnd(emptyMeta(), a, 'victory', 1);
    expect(newTitles).toEqual(expect.arrayContaining(['sem_um_arranhao', 'por_um_fio', 'mestre_de_jutsus']));
  });

  it('linha elemental: maestria +5 em 2 jutsus de Fogo diferentes', () => {
    const a = run();
    a.character.learned = ['goukakyuu', 'bola_de_fogo'];
    a.character.masteryUses = { goukakyuu: 60, bola_de_fogo: 60 };
    const { meta, newTitles } = recordRunEnd(emptyMeta(), a, 'dead', 1);
    expect(meta.masteredEver).toEqual(expect.arrayContaining(['goukakyuu', 'bola_de_fogo']));
    expect(newTitles).toEqual(expect.arrayContaining(['iniciante_fogo', 'adepto_fogo']));
    expect(newTitles).not.toContain('mestre_fogo');
  });

  it('títulos ocultos nunca aparecem como disponíveis', () => {
    const meta = { ...emptyMeta(), titlesUnlocked: ['colecionador', 'demonio_da_nevoa'] };
    expect(availableTitles(meta).map((t) => t.id)).toEqual(['demonio_da_nevoa']);
  });

  it('enciclopédia: pool completo sem golpes de inimigo, com status', () => {
    const meta = { ...emptyMeta(), learnedEver: ['bola_de_fogo'], masteredEver: ['bola_de_fogo'] };
    const entries = encyclopedia(meta);
    expect(entries.some((e) => e.jutsu.id === 'rasengan' && !e.learned)).toBe(true);
    expect(entries.some((e) => e.jutsu.enemyOnly)).toBe(false);
    expect(entries.find((e) => e.jutsu.id === 'bola_de_fogo')).toMatchObject({ learned: true, mastered: true });
  });

  it('não muta a meta recebida', () => {
    const meta = emptyMeta();
    recordRunEnd(meta, run(), 'dead', 1);
    expect(meta).toEqual(emptyMeta());
  });
});

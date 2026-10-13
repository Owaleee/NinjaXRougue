import { describe, it, expect } from 'vitest';
import { formatEvent } from '../../src/ui-dom/view/log';

const names = { player: 'Kenji', 'enemy:bandido': 'Bandido' };

describe('log de batalha', () => {
  it('dano crítico tem texto próprio (não depende só da cor)', () => {
    const l = formatEvent(
      { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 31, crit: true, elementMult: 1, jutsuId: null, hpAfter: 10 },
      names,
    );
    expect(l).toEqual({ kind: 'damage', text: '✦ CRÍTICO! Bandido sofre 31 de dano.' });
  });

  it('marca vantagem e desvantagem elemental', () => {
    const base = { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 10, crit: false, jutsuId: 'bola_de_fogo', hpAfter: 5 } as const;
    expect(formatEvent({ ...base, elementMult: 1.3 }, names)?.text).toContain('vantagem elemental');
    expect(formatEvent({ ...base, elementMult: 0.8 }, names)?.text).toContain('desvantagem elemental');
  });

  it('efeito com 1 turno restante usa o singular', () => {
    expect(formatEvent({ type: 'effectApplied', targetId: 'enemy:bandido', effectId: 'queimadura', remaining: 1 }, names)?.text).toBe(
      'Bandido: Queimadura (1 turno).',
    );
    expect(formatEvent({ type: 'effectApplied', targetId: 'enemy:bandido', effectId: 'queimadura', remaining: 2 }, names)?.text).toBe(
      'Bandido: Queimadura (2 turnos).',
    );
  });

  it('usa os nomes de conteúdo dos dados', () => {
    expect(formatEvent({ type: 'jutsuUsed', actorId: 'player', jutsuId: 'henge', cost: 6 }, names)).toEqual({
      kind: 'player',
      text: 'Kenji usa Henge no Jutsu (−6 chakra).',
    });
    expect(formatEvent({ type: 'effectApplied', targetId: 'enemy:bandido', effectId: 'queimadura', remaining: 3 }, names)?.text).toBe(
      'Bandido: Queimadura (3 turnos).',
    );
    expect(formatEvent({ type: 'itemUsed', actorId: 'player', itemId: 'kit_medico' }, names)?.text).toBe('Kenji usa Kit médico.');
  });

  it('lado de quem age define a cor', () => {
    expect(formatEvent({ type: 'actionChosen', actorId: 'enemy:bandido', action: { type: 'attack' } }, names)?.kind).toBe('enemy');
    expect(formatEvent({ type: 'defend', actorId: 'player', chakra: 4 }, names)?.kind).toBe('player');
  });

  it('efeito sustentado mostra ∞', () => {
    expect(formatEvent({ type: 'effectApplied', targetId: 'player', effectId: 'sharingan', remaining: null }, names)?.text).toBe(
      'Kenji: Sharingan (sustentado ∞).',
    );
  });

  it('derrota por tempo tem mensagem própria', () => {
    expect(formatEvent({ type: 'battleEnd', winner: 'enemy', reason: 'timeout' }, names)?.text).toContain('limite de rodadas');
    expect(formatEvent({ type: 'battleEnd', winner: 'player', reason: 'ko' }, names)?.text).toBe('Vitória!');
  });

  it('eventos de bastidor não geram linha', () => {
    expect(formatEvent({ type: 'turnStart', actorId: 'player', round: 1 }, names)).toBeNull();
    expect(formatEvent({ type: 'chakraRegen', actorId: 'player', amount: 2 }, names)).toBeNull();
    expect(formatEvent({ type: 'actionChosen', actorId: 'player', action: { type: 'defend' } }, names)).toBeNull();
  });

  it('id desconhecido aparece cru em vez de quebrar', () => {
    expect(formatEvent({ type: 'defeated', targetId: 'enemy:x' }, names)?.text).toBe('enemy:x foi derrotado.');
  });
});

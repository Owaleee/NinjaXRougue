import { describe, expect, it } from 'vitest';
import { animForEvent, atlasKey, hasAnimations, parseSpriteMeta } from '../src/scenes/spriteAnims';

const ev = {
  attack: { type: 'actionChosen', actorId: 'p', action: { type: 'attack' } },
  meditate: { type: 'actionChosen', actorId: 'p', action: { type: 'meditate' } },
  defend: { type: 'actionChosen', actorId: 'p', action: { type: 'defend' } },
  jutsuAction: { type: 'actionChosen', actorId: 'p', action: { type: 'jutsu', jutsuId: 'bola_de_fogo' } },
  fire: { type: 'jutsuUsed', actorId: 'p', jutsuId: 'bola_de_fogo_basica', cost: 8 },
  damage: { type: 'damage', sourceId: 'p', targetId: 'e', amount: 5, crit: false, elementMult: 1, jutsuId: null, hpAfter: 10 },
  defeated: { type: 'defeated', targetId: 'e' },
  dodge: { type: 'dodge', sourceId: 'p', targetId: 'e' },
} as const;

describe('animação dos lutadores', () => {
  it('ataque básico → attack; meditar → cast; defender e jutsu na escolha → nada (o jutsu anima em jutsuUsed)', () => {
    expect(animForEvent(ev.attack, 'p', null)).toBe('attack');
    expect(animForEvent(ev.meditate, 'p', null)).toBe('cast');
    expect(animForEvent(ev.defend, 'p', null)).toBeNull();
    expect(animForEvent(ev.jutsuAction, 'p', null)).toBeNull();
  });

  it('jutsu: taijutsu ataca com o corpo, os demais conjuram', () => {
    expect(animForEvent(ev.fire, 'p', 'ninjutsu')).toBe('cast');
    expect(animForEvent(ev.fire, 'p', 'genjutsu')).toBe('cast');
    expect(animForEvent(ev.fire, 'p', 'taijutsu')).toBe('attack');
  });

  it('só reage quem é o ator ou o alvo do evento', () => {
    expect(animForEvent(ev.attack, 'e', null)).toBeNull();
    expect(animForEvent(ev.damage, 'e', null)).toBe('hit');
    expect(animForEvent(ev.damage, 'p', null)).toBeNull();
    expect(animForEvent(ev.defeated, 'e', null)).toBe('death');
    expect(animForEvent(ev.dodge, 'e', null)).toBe('dodge');
    expect(animForEvent(ev.dodge, 'p', null)).toBeNull();
  });

  it('chave do atlas e leitura do meta.animations do atlas.json', () => {
    expect(atlasKey('player_uchiha')).toBe('player_uchiha:sheet');
    const meta = parseSpriteMeta({ meta: { animations: { idle: { frames: ['idle_0', 'idle_1'], fps: 6, loop: true }, hit: { frames: ['hit_0'], fps: 10, loop: false } } } });
    expect(meta?.animations.idle).toEqual({ frames: ['idle_0', 'idle_1'], fps: 6, loop: true });
    expect(hasAnimations(meta, ['idle', 'hit'])).toBe(true);
    expect(hasAnimations(meta, ['idle', 'death'])).toBe(false);
  });

  it('meta inválido vira null (a arena cai na imagem estática)', () => {
    expect(parseSpriteMeta(null)).toBeNull();
    expect(parseSpriteMeta({})).toBeNull();
    expect(parseSpriteMeta({ meta: { animations: { idle: { frames: [], fps: 6, loop: true } } } })).toBeNull();
    expect(parseSpriteMeta({ meta: { animations: { idle: { frames: ['a'], fps: 0, loop: true } } } })).toBeNull();
  });
});

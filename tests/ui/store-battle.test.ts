import { describe, it, expect } from 'vitest';
import { META_KEY, RUN_KEY } from '../../src/game/save/save';
import type { GameEvent } from '../../src/game/events';
import { makeStore, PARAMS, playBattle, scenario, strong } from './memoryStore';

describe('GameStore — batalha', () => {
  it('lutar abre a batalha e começa o log do zero', () => {
    const { store } = scenario();
    store.fight();
    expect(store.state.screen).toBe('battle');
    expect(store.state.battleLog[0]?.text).toContain('começou');
    expect(store.state.locked).toBe(false); // sem animador registrado
  });

  it('com animador: trava até animationsDone e ignora ações repetidas (Review Focus 2)', () => {
    const { store } = scenario();
    const received: GameEvent[][] = [];
    store.onBattleEvents((ev) => received.push(ev));
    store.fight();
    expect(received[0]?.[0]?.type).toBe('battleStart');
    expect(store.state.locked).toBe(true);
    const run = store.state.run;
    expect(store.act({ type: 'attack' })).toBe(false);
    expect(store.act({ type: 'attack' })).toBe(false);
    expect(store.state.run).toBe(run);
    store.animationsDone();
    expect(store.state.locked).toBe(false);
    if (store.state.run?.phase === 'battle') {
      expect(store.act({ type: 'defend' })).toBe(true);
      expect(store.state.locked).toBe(true);
    }
  });

  it('vitória leva ao resultado e salva a run na fase "result"', () => {
    const { store, storage } = scenario(strong);
    store.fight();
    playBattle(store);
    expect(store.state.screen).toBe('result');
    expect(store.state.run?.lastResult?.won).toBe(true);
    expect(JSON.parse(storage.getItem(RUN_KEY)!).phase).toBe('result');
  });

  it('recarregar no meio da luta volta ao mapa com o RNG do início do encontro', () => {
    const { store, storage } = scenario();
    store.fight();
    store.act({ type: 'defend' });
    expect(store.state.run?.phase).toBe('battle');
    const startRng = store.state.run!.encounterStart!.rngState;
    const reloaded = makeStore(storage);
    reloaded.boot();
    reloaded.continueRun();
    expect(reloaded.state.screen).toBe('map');
    expect(reloaded.state.run?.nodeIndex).toBe(0);
    expect(reloaded.state.run?.rngState).toBe(startRng);
  });

  it('morte: Histórico e save atualizados ANTES do fim da animação (Review Focus 3)', () => {
    const { store, storage } = scenario((run) => {
      run.character.hp = 1;
    });
    store.onBattleEvents(() => {});
    store.fight();
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) {
      if (store.state.locked) store.animationsDone();
      store.act({ type: 'defend' });
    }
    expect(store.state.run?.phase).toBe('dead');
    // a animação ainda não terminou:
    expect(store.state.locked).toBe(true);
    expect(store.state.screen).toBe('battle');
    expect(storage.getItem(RUN_KEY)).toBeNull();
    expect(JSON.parse(storage.getItem(META_KEY)!).history[0].result).toBe('dead');
    // o HUD ainda tem o que desenhar durante a última animação:
    expect(store.state.battleLog.some((l) => l.text.includes('foi derrotado'))).toBe(true);
    const snap = store.state.battleSnapshot;
    expect(snap).not.toBeNull();
    expect(snap!.combatants.find((c) => c.side === 'player')?.hp).toBe(0);
    store.animationsDone();
    expect(store.state.screen).toBe('runEnd');
    expect(store.state.runEnd?.result).toBe('dead');
    expect(store.state.runEnd?.text).toContain('Morreu');
    store.toMenu();
    expect(store.state.run).toBeNull();
    expect(store.hasActiveRun()).toBe(false);
  });
});

describe('GameStore — troca de jutsu e escolhas 1-de-3', () => {
  it('jutsu aprendido com slots cheios entra na fila; substituir equipa', () => {
    const { store } = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    expect(store.state.run?.character.equipped).toHaveLength(4);
    store.allocate({ gen: 3 }); // Gen 8 → Kai
    expect(store.state.swapQueue).toEqual(['kai']);
    store.resolveSwap('henge');
    expect(store.state.swapQueue).toEqual([]);
    expect(store.state.run?.character.equipped).toContain('kai');
    expect(store.state.run?.character.equipped).not.toContain('henge');
  });

  it('"manter no repertório" não equipa nada', () => {
    const { store } = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    store.allocate({ gen: 3 });
    store.resolveSwap(null);
    expect(store.state.swapQueue).toEqual([]);
    expect(store.state.run?.character.equipped).not.toContain('kai');
    expect(store.state.run?.character.learned).toContain('kai');
  });

  it('vários níveis + jutsus novos num só encontro: fila de troca e 3 escolhas em ordem (Review Focus 4)', () => {
    const { store } = scenario((run) => {
      strong(run);
      run.character.xp = 200; // +12 de XP do 1º comum → 212: sobe 3 níveis (36 + 48 + 60 = 144; o 4º pede 72)
    });
    store.fight();
    playBattle(store);
    expect(store.state.screen).toBe('result');
    expect(store.state.run?.lastResult?.levelsGained).toBe(3);
    expect(store.state.run?.pendingChoices).toHaveLength(3);
    expect(store.state.swapQueue.length).toBeGreaterThan(0);
    const offers = structuredClone(store.state.run!.pendingChoices);

    // (b) resolve a fila de troca INTEIRA antes de qualquer escolha
    let guard = 0;
    while (store.state.swapQueue.length > 0 && guard++ < 20) store.resolveSwap(null);
    expect(store.state.swapQueue).toEqual([]);

    // (c) as 3 escolhas seguem pendentes, na mesma ordem
    expect(store.state.run?.pendingChoices).toEqual(offers);
    expect(store.continueFromResult()).toBe(false); // escolhas pendentes

    // (d) escolhe uma a uma, sempre a primeira oferta restante
    for (let i = 0; i < 3; i++) {
      const run = store.state.run!;
      expect(run.pendingChoices).toEqual(offers.slice(i));
      const option = run.pendingChoices[0]![0]!;
      expect(store.chooseReward(option, option === 'treino' ? run.character.equipped[0] : undefined)).toBe(true);
      expect(store.state.run?.pendingChoices).toEqual(offers.slice(i + 1));
    }
    expect(store.continueFromResult()).toBe(true);
    expect(store.state.screen).toBe('map');
  });

  it('com animador: resolveSwap ignorado travado; depois de animationsDone fila e escolhas intactas e em ordem', () => {
    const { store } = scenario((run) => {
      strong(run);
      run.character.xp = 200;
    });
    store.onBattleEvents(() => {});
    store.fight();
    playBattle(store); // libera a trava a cada ação; a última animação fica pendente
    expect(store.state.run?.phase).toBe('result');
    expect(store.state.locked).toBe(true);
    const offers = structuredClone(store.state.run!.pendingChoices);
    const queue = [...store.state.swapQueue];
    expect(offers).toHaveLength(3);
    expect(queue.length).toBeGreaterThan(0);

    store.resolveSwap(null);
    expect(store.state.swapQueue).toEqual(queue);
    expect(store.chooseReward('treino', store.state.run!.character.equipped[0])).toBe(false);
    expect(store.state.run?.pendingChoices).toEqual(offers);

    store.animationsDone();
    expect(store.state.screen).toBe('result');
    expect(store.state.swapQueue).toEqual(queue);
    expect(store.state.run?.pendingChoices).toEqual(offers);
    let guard = 0;
    while (store.state.swapQueue.length > 0 && guard++ < 20) store.resolveSwap(null);
    expect(store.state.swapQueue).toEqual([]);
    expect(store.state.run?.pendingChoices).toEqual(offers);
  });
});

describe('GameStore — trava de animação', () => {
  /** Animador falso: nunca chama animationsDone sozinho. */
  function locked() {
    const sc = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    sc.store.onBattleEvents(() => {});
    sc.store.allocate({ gen: 3 }); // enfileira "kai" para troca
    sc.store.fight();
    return sc;
  }

  it('abandonRun e resolveSwap são ignorados enquanto travado', () => {
    const { store } = locked();
    expect(store.state.locked).toBe(true);
    store.abandonRun();
    expect(store.hasActiveRun()).toBe(true);
    expect(store.state.run?.phase).toBe('battle');
    store.resolveSwap('henge');
    expect(store.state.swapQueue).toEqual(['kai']);
    expect(store.state.run?.character.equipped).toContain('henge');
    expect(store.act({ type: 'defend' })).toBe(false);
    store.animationsDone();
    store.resolveSwap(null); // destravado: a decisão é aceita
    expect(store.state.swapQueue).toEqual([]);
  });

  it('navegação adiada acontece só depois de animationsDone', () => {
    const { store } = scenario((run) => {
      strong(run);
    });
    store.onBattleEvents(() => {});
    store.fight();
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) {
      if (store.state.locked) store.animationsDone();
      store.act({ type: 'attack' });
    }
    expect(store.state.run?.phase).toBe('result');
    expect(store.state.locked).toBe(true);
    expect(store.state.screen).toBe('battle');
    store.animationsDone();
    expect(store.state.locked).toBe(false);
    expect(store.state.screen).toBe('result');
  });

  it('startNewRun depois de uma animação abandonada não nasce travado', () => {
    const { store } = scenario((run) => {
      run.character.hp = 1;
    });
    store.onBattleEvents(() => {});
    store.fight();
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) {
      if (store.state.locked) store.animationsDone();
      store.act({ type: 'defend' });
    }
    expect(store.state.run?.phase).toBe('dead');
    expect(store.state.locked).toBe(true);
    store.startNewRun(PARAMS); // sem animationsDone
    expect(store.state.locked).toBe(false);
    expect(store.state.screen).toBe('map');
    store.animationsDone(); // não deve navegar
    expect(store.state.screen).toBe('map');
    expect(store.fight()).toBe(true); // comandos aceitos
  });

  it('toMenu é ignorado na batalha travada e funciona depois da animação (achado 3 da revisão final)', () => {
    const { store } = scenario((run) => {
      run.character.hp = 1;
    });
    store.onBattleEvents(() => {});
    store.fight();
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) {
      if (store.state.locked) store.animationsDone();
      store.act({ type: 'defend' });
    }
    expect(store.state.locked).toBe(true);
    store.toMenu();
    expect(store.state.locked).toBe(true);
    expect(store.state.screen).toBe('battle');
    store.animationsDone();
    expect(store.state.screen).toBe('runEnd');
    store.toMenu();
    expect(store.state.screen).toBe('menu');
    expect(store.state.locked).toBe(false);
  });
});

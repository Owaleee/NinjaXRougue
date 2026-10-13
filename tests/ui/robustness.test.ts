// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { emptyMeta } from '../../src/game/meta/meta';
import { META_KEY, RUN_KEY } from '../../src/game/save/save';
import { App } from '../../src/ui-dom/App';
import { SCREENS } from '../../src/ui-dom/screens';
import type { ScreenId } from '../../src/store/GameStore';
import type { ScreenRenderer } from '../../src/ui-dom/types';
import { MemoryStore, PARAMS, makeStore, patchRun, playBattle, scenario, strong } from './memoryStore';
import { mount } from './appHelpers';

function mountWith(store: ReturnType<typeof makeStore>, override: Partial<Record<ScreenId, ScreenRenderer>>): HTMLElement {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  document.body.appendChild(root);
  new App(root, store, { screens: { ...SCREENS, ...override } }).mount();
  return root;
}

describe('Robustez — erro de render', () => {
  it('tela que lança vira a ErrorScreen e o jogo não fica travado', () => {
    const { store } = scenario();
    store.onBattleEvents(() => {}); // animador de mentira: trava ao animar
    const root = mountWith(store, {
      battle: () => {
        throw new Error('render quebrou');
      },
    });
    store.fight();
    expect(store.state.screen).toBe('error');
    expect(store.state.locked).toBe(false);
    expect(root.textContent).toContain('Algo deu errado');
    expect(root.textContent).toContain('render quebrou');
    expect(root.textContent).toContain('Recarregar o jogo');
  });

  it('render que quebra fora da batalha: a ErrorScreen não é sobrescrita pela tela de batalha', () => {
    const { store } = scenario();
    store.onBattleEvents(() => {});
    let broken = false;
    mountWith(store, {
      map: (ctx) => {
        if (broken) throw new Error('mapa quebrou');
        return SCREENS.map!(ctx);
      },
    });
    expect(store.state.screen).toBe('map');
    broken = true; // o render do mapa só quebra no re-render disparado pelo passo
    store.fight();
    expect(store.state.screen).toBe('error');
    expect(store.state.locked).toBe(false);
  });

  it('ErrorScreen que também lança não derruba o App', () => {
    const { store } = scenario();
    const root = mountWith(store, {
      map: () => {
        throw new Error('mapa');
      },
      error: () => {
        throw new Error('erro');
      },
    });
    expect(() => store.go('menu')).not.toThrow();
    expect(() => store.go('map')).not.toThrow();
    expect(root.textContent).toContain('Algo deu errado');
    expect(root.textContent).toContain('erro');
  });
});

describe('Robustez — animador que lança', () => {
  it('solta a trava e aplica a navegação adiada', () => {
    const { store } = scenario(strong);
    store.onBattleEvents(() => {
      throw new Error('animação quebrou');
    });
    store.fight();
    expect(store.state.locked).toBe(false);
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) store.act({ type: 'attack' });
    expect(store.state.run?.phase).toBe('result');
    expect(store.state.locked).toBe(false);
    expect(store.state.screen).toBe('result');
    expect(store.state.notices.some((n) => n.text.includes('animação quebrou'))).toBe(true);
  });
});

describe('Robustez — histórico com entrada inválida', () => {
  function storageWithNullHistory(): MemoryStore {
    const storage = new MemoryStore();
    storage.setItem(META_KEY, JSON.stringify({ ...emptyMeta(), history: [null] }));
    return storage;
  }

  it('boot descarta entradas que não são objetos e a Tela de Histórico abre', () => {
    const store = makeStore(storageWithNullHistory());
    const root = mount(store);
    store.boot();
    expect(store.state.meta.history).toEqual([]);
    expect(() => store.go('history')).not.toThrow();
    expect(root.textContent).toContain('Nenhuma run registrada ainda.');
  });

  it('fim de run registra mesmo com histórico sujo no save', () => {
    const storage = storageWithNullHistory();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun(PARAMS);
    patchRun(storage, (r) => {
      r.character.hp = 1;
    });
    const s = makeStore(storage);
    s.boot();
    s.continueRun();
    s.fight();
    for (let i = 0; i < 50 && s.state.run?.phase === 'battle'; i++) s.act({ type: 'defend' });
    expect(s.state.run?.phase).toBe('dead');
    expect(s.state.screen).toBe('runEnd');
    expect(s.state.meta.history).toHaveLength(1);
    expect(storage.getItem(RUN_KEY)).toBeNull();
  });

  it('erro inesperado no fim da run vai para o handleError e não deixa o jogo mudo', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun(PARAMS);
    patchRun(storage, (r) => {
      r.character.hp = 1;
    });
    const s = makeStore(storage);
    s.boot();
    s.continueRun();
    // meta em memória corrompida (como se viesse de uma versão antiga): history não é array
    (s.state.meta as unknown as { history: unknown }).history = null;
    s.fight();
    for (let i = 0; i < 50 && s.state.run?.phase === 'battle'; i++) s.act({ type: 'defend' });
    expect(s.state.screen).toBe('error');
    expect(s.state.fatalError).toContain('Erro inesperado');
  });
});

describe('Navegação durante a animação', () => {
  it('go/back/toMenu são ignorados na batalha travada', () => {
    const { store } = scenario();
    store.onBattleEvents(() => {});
    store.fight();
    expect(store.state.locked).toBe(true);
    store.go('sheet');
    store.back();
    store.toMenu();
    expect(store.state.screen).toBe('battle');
    expect(store.state.locked).toBe(true);
  });

  it('toMenu zera a fila de troca de jutsu', () => {
    const { store } = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    store.allocate({ gen: 3 });
    expect(store.state.swapQueue.length).toBeGreaterThan(0);
    store.toMenu();
    expect(store.state.swapQueue).toEqual([]);
  });
});

describe('Boot que refinaliza vitória', () => {
  it('run em victory com nodeIndex === nodes.length e meta que falhou: boot grava e limpa o save', () => {
    const { store, storage } = scenario((run) => {
      strong(run);
      run.nodeIndex = run.nodes.length - 1;
      run.phase = 'map';
    });
    storage.failKeys.add(META_KEY);
    store.fight();
    playBattle(store);
    expect(store.state.run?.phase).toBe('victory');
    const saved = JSON.parse(storage.getItem(RUN_KEY)!);
    expect(saved.phase).toBe('victory');
    expect(saved.nodeIndex).toBe(saved.nodes.length);

    storage.failKeys.clear();
    const b = makeStore(storage);
    b.boot();
    expect(b.state.meta.history).toHaveLength(1);
    expect(b.state.meta.history[0]?.result).toBe('victory');
    expect(b.state.meta.lifetime.victories).toBe(1);
    expect(storage.getItem(RUN_KEY)).toBeNull();
    expect(b.state.run).toBeNull();
  });
});

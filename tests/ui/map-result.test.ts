// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { characterMaxHp } from '../../src/game/progression/character';
import { click, findButton, mount } from './appHelpers';
import { playBattle, scenario, strong } from './memoryStore';

describe('Mapa da saga', () => {
  it('mostra o próximo encontro e luta', () => {
    const { store } = scenario();
    const root = mount(store);
    store.continueRun();
    expect(root.textContent).toContain('Encontro 1 de 26');
    expect(root.textContent).toContain('atual');
    click(root, 'Lutar');
    expect(store.state.screen).toBe('battle');
  });

  it('bifurcação de elite só aparece quando o nó tem elite', () => {
    const plain = scenario((run) => {
      run.nodes[0]!.eliteEnemyId = null;
    });
    const root1 = mount(plain.store);
    plain.store.continueRun();
    expect(root1.textContent).not.toContain('Enfrentar elite');

    const fork = scenario((run) => {
      run.nodes[0]!.eliteEnemyId = 'renegado_veterano';
    });
    const root2 = mount(fork.store);
    fork.store.continueRun();
    click(root2, 'Enfrentar elite');
    expect(fork.store.state.run?.elite).toBe(true);
  });

  it('Acampamento: só deixa descansar, e o descanso enche HP', () => {
    const { store } = scenario((run) => {
      run.phase = 'camp';
      run.character.hp = 10;
    });
    const root = mount(store);
    store.continueRun();
    expect(() => findButton(root, 'Lutar')).toThrow();
    click(root, 'Descansar');
    const c = store.state.run!.character;
    expect(c.hp).toBe(characterMaxHp(c));
    expect(store.state.run?.phase).toBe('map');
  });

  it('Salvar e voltar ao menu mantém a run', () => {
    const { store } = scenario();
    const root = mount(store);
    store.continueRun();
    click(root, 'Salvar e voltar ao menu');
    expect(store.state.screen).toBe('menu');
    expect(store.hasActiveRun()).toBe(true);
  });
});

describe('Resultado', () => {
  function afterBigWin() {
    const s = scenario((run) => {
      strong(run);
      run.character.xp = 200;
    });
    const root = mount(s.store);
    s.store.fight();
    playBattle(s.store);
    s.store.state.swapQueue.forEach(() => s.store.resolveSwap(null));
    return { ...s, root };
  }

  it('mostra recompensas, níveis e a escolha 1-de-3, com o motivo do Continuar bloqueado', () => {
    const { root, store } = afterBigWin();
    expect(store.state.screen).toBe('result');
    expect(root.textContent).toContain('Vitória contra');
    expect(root.textContent).toContain('Subiu 3 nível(is)');
    expect(root.textContent).toContain('Escolha uma recompensa (3 pendente(s))');
    expect(findButton(root, 'Continuar').disabled).toBe(true);
    expect(root.textContent).toContain('Resolva as escolhas de recompensa');
  });

  it('resolver as 3 escolhas libera o Continuar', () => {
    const { root, store } = afterBigWin();
    for (let i = 0; i < 3; i++) {
      const option = store.state.run!.pendingChoices[0]![0]!;
      const card = root.querySelector(`[data-reward=${option}]`) as HTMLButtonElement;
      card.click();
      if (option === 'treino') {
        const pressed = root.querySelector('[data-reward=treino]') as HTMLButtonElement;
        expect(pressed.getAttribute('aria-pressed')).toBe('true');
        expect(pressed.textContent).toContain('✓');
        (root.querySelector('[data-train]') as HTMLButtonElement).click();
      }
    }
    expect(store.state.run?.pendingChoices).toHaveLength(0);
    click(root, 'Continuar');
    expect(store.state.screen).toBe('map');
  });

  it('distribui os pontos ganhos pelo preset', () => {
    const { root, store } = afterBigWin();
    const before = store.state.run!.character.unspentPoints;
    expect(before).toBeGreaterThan(0);
    (root.querySelector('[data-preset=ninjutsu]') as HTMLButtonElement).click();
    click(root, 'Confirmar distribuição');
    expect(store.state.run?.character.unspentPoints).toBe(0);
  });
});

describe('Fim de run', () => {
  it('morte mostra o texto do Histórico e volta ao menu', () => {
    const { store } = scenario((run) => {
      run.character.hp = 1;
    });
    const root = mount(store);
    store.fight();
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) store.act({ type: 'defend' });
    expect(store.state.screen).toBe('runEnd');
    expect(root.textContent).toContain('Morreu na Saga da Onda');
    click(root, 'Voltar ao menu');
    expect(store.state.screen).toBe('menu');
    expect(findButton(root, 'Continuar run').disabled).toBe(true);
  });
});

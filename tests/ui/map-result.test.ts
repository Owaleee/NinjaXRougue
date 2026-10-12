// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { characterMaxHp } from '../../src/game/progression/character';
import type { RunState } from '../../src/game/run/types';
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
      if (option === 'treino') (root.querySelector('[data-train]') as HTMLButtonElement).click();
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

function resultScenario(choices: RunState['pendingChoices'], extra?: (run: RunState) => void) {
  const s = scenario((run) => {
    run.phase = 'result';
    run.pendingChoices = choices;
    run.lastResult = {
      nodeIndex: 0, enemyId: 'bandido', enemyName: 'Bandido', grade: 'D', isBoss: false, elite: false, won: true,
      xp: 10, ryo: 5, rep: 1, levelsGained: 0, learned: [], damageTaken: 0, rounds: 3, hpPctEnd: 1,
    };
    extra?.(run);
  });
  return { ...s, root: mount(s.store) };
}

describe('Resultado: Treino, metas e título', () => {
  const pick = (root: HTMLElement) => root.querySelector('[data-reward=treino]') as HTMLButtonElement;

  it('Treino é toggle com aria-pressed e marcador; data-train aplica o treino', () => {
    const { root, store } = resultScenario([['treino', 'kit', 'ryo']]);
    expect(pick(root).getAttribute('aria-pressed')).toBe('false');
    expect(root.textContent).not.toContain('Treinar qual jutsu?');
    pick(root).click();
    expect(pick(root).getAttribute('aria-pressed')).toBe('true');
    expect(pick(root).textContent).toContain('✓');
    expect(root.textContent).toContain('Treinar qual jutsu?');
    const target = store.state.run!.character.equipped[0]!;
    const before = store.state.run!.character.masteryUses[target] ?? 0;
    (root.querySelector(`[data-train=${target}]`) as HTMLButtonElement).click();
    expect(store.state.run!.character.masteryUses[target]).toBe(before + 4);
    expect(store.state.run!.pendingChoices).toHaveLength(0);
  });

  it('cartões que resolvem na hora não levam aria-pressed', () => {
    const { root } = resultScenario([['treino', 'kit', 'ryo']]);
    expect(root.querySelector('[data-reward=kit]')!.hasAttribute('aria-pressed')).toBe(false);
  });

  it('Treino seguido de Kit não vaza a seleção para a próxima oferta', () => {
    const { root, store } = resultScenario([['treino', 'kit', 'ryo'], ['treino', 'kit', 'pilula']]);
    pick(root).click();
    (root.querySelector('[data-reward=kit]') as HTMLButtonElement).click();
    expect(store.state.run!.pendingChoices).toHaveLength(1);
    expect(pick(root).getAttribute('aria-pressed')).toBe('false');
    expect(root.textContent).not.toContain('Treinar qual jutsu?');
  });

  it('metas "Faltam X para Y" usam o atributo BASE: pontos não gastos não mudam a meta', () => {
    const goalText = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('li')).filter((li) => li.textContent?.startsWith('Faltam')).map((li) => li.textContent);
    const a = resultScenario([]);
    const goalsA = goalText(a.root);
    expect(goalsA.length).toBeGreaterThan(0);
    const b = resultScenario([], (run) => {
      run.character.unspentPoints = 30;
    });
    expect(goalText(b.root)).toEqual(goalsA);
  });
});

describe('Fim de run: vitória com título novo', () => {
  it('mostra o nome do título conquistado', () => {
    const { store } = scenario((run) => {
      strong(run);
      run.nodeIndex = run.nodes.length - 1;
      run.phase = 'map';
      run.stats.bossesDefeated = ['zabuza'];
    });
    const root = mount(store);
    store.fight();
    playBattle(store);
    expect(store.state.run?.phase).toBe('victory');
    expect(store.state.screen).toBe('runEnd');
    expect(store.state.runEnd?.newTitles.length).toBeGreaterThan(0);
    expect(root.textContent).toContain('Saga da Onda concluída!');
    expect(root.textContent).toContain('Títulos conquistados');
    expect(root.textContent).toContain('Demônio da Névoa');
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

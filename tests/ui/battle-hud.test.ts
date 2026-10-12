// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import type { GameEvent } from '../../src/game/events';
import type { RunState } from '../../src/game/run/types';
import { JUTSUS } from '../../src/data/jutsus';
import { click, mount, press } from './appHelpers';
import { scenario, strong } from './memoryStore';

function battle(patch?: (run: RunState) => void) {
  const { store } = scenario(patch);
  const root = mount(store);
  store.fight();
  return { store, root };
}

const log = (root: ParentNode) => root.querySelector('.battle-log')?.textContent ?? '';

/** Batalha com um animador falso: cada `act` trava até `animationsDone`. */
function animatedBattle() {
  const { store } = scenario();
  const root = mount(store);
  const batches: GameEvent[][] = [];
  store.onBattleEvents((events) => batches.push(events));
  store.fight();
  store.animationsDone();
  const playerActions = () => batches.flat().filter((e) => e.type === 'actionChosen' && e.actorId === 'player').length;
  return { store, root, playerActions };
}

describe('HUD de batalha', () => {
  it('mostra os dois lados com vitais, Poder Ninja e indicador de turno', () => {
    const { store, root } = battle();
    const enemy = store.state.run!.battle!.combatants.find((c) => c.side === 'enemy')!;
    expect(root.querySelector('[data-side=player]')?.textContent).toContain('Kenji');
    expect(root.querySelector('[data-side=enemy]')?.textContent).toContain(enemy.name);
    expect(root.textContent).toContain('Poder Ninja');
    expect(root.textContent).toContain('Seu turno');
  });

  it('atalho D defende', () => {
    const { root } = battle();
    press('d');
    expect(log(root)).toContain('Kenji se defende');
  });

  it('1 seleciona e mostra a descrição; 1 de novo usa o jutsu', () => {
    const { root } = battle();
    press('1');
    expect(root.textContent).toContain(JUTSUS['henge']!.description);
    expect(log(root)).not.toContain('usa Henge');
    press('1');
    expect(log(root)).toContain('Kenji usa Henge no Jutsu');
  });

  it('Item lista os consumíveis e usa o Kit médico', () => {
    const { root } = battle((run) => {
      run.character.inventory['kit_medico'] = 1;
      run.character.hp = 40;
    });
    (root.querySelector('[data-action=item]') as HTMLButtonElement).click();
    click(root, 'Kit médico (1)');
    expect(log(root)).toContain('Kenji usa Kit médico');
  });

  it('Pergaminho de Reforço pede o atributo', () => {
    const { root } = battle((run) => {
      run.character.inventory['pergaminho_reforco'] = 1;
    });
    press('i');
    click(root, 'Pergaminho de Reforço (1)');
    expect(root.textContent).toContain('Reforçar qual atributo?');
    click(root, '+10% Ninjutsu');
    expect(log(root)).toContain('Kenji usa Pergaminho de Reforço');
  });

  it('durante a animação: botões desabilitados e teclas ignoradas (Review Focus 2)', () => {
    const { store } = scenario();
    const root = mount(store);
    store.onBattleEvents(() => {});
    store.fight();
    expect(store.state.locked).toBe(true);
    expect((root.querySelector('[data-action=attack]') as HTMLButtonElement).disabled).toBe(true);
    const run = store.state.run;
    press('a');
    press('a');
    expect(store.state.run).toBe(run);
    expect(root.textContent).toContain('Resolvendo');
  });

  it('Uchiha: T liga o Sharingan sem gastar o turno', () => {
    const { root } = battle((run) => {
      run.character.clan = 'uchiha';
      run.character.affinity = 'fogo';
    });
    expect(root.querySelector('[data-action=transform]')).not.toBeNull();
    press('t');
    expect(log(root)).toContain('Kenji ativa Sharingan');
    expect(root.textContent).toContain('Seu turno');
    expect(root.querySelector('[data-side=player] .effects')?.textContent).toContain('Sharingan ∞');
  });

  it('Ficha abre durante a batalha e Voltar retorna à luta', () => {
    const { store, root } = battle();
    (root.querySelector('[data-sheet]') as HTMLButtonElement).click();
    expect(store.state.screen).toBe('sheet');
    click(root, 'Voltar');
    expect(store.state.screen).toBe('battle');
  });

  it('vitória pelo teclado leva à tela de Resultado', () => {
    const { store } = battle(strong);
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 200) press('a');
    expect(store.state.screen).toBe('result');
  });
});

describe('HUD de batalha — repetição durante a animação (Review Focus 2)', () => {
  it('A três vezes rápido: uma ação só, sem erro', () => {
    const { store, playerActions } = animatedBattle();
    expect(store.state.locked).toBe(false);
    press('a');
    press('a');
    press('a');
    expect(playerActions()).toBe(1);
    expect(store.state.locked).toBe(true);
    expect(store.state.screen).toBe('battle');
    expect(store.state.notices).toEqual([]);
  });

  it('clique repetido no mesmo botão Atacar: uma ação só, sem erro', () => {
    const { store, root, playerActions } = animatedBattle();
    const attack = root.querySelector('[data-action=attack]') as HTMLButtonElement;
    attack.click();
    attack.click();
    attack.click();
    expect(playerActions()).toBe(1);
    expect(store.state.notices).toEqual([]);
  });

  it('Ficha fica desabilitada enquanto a animação roda (não sai da batalha)', () => {
    const { store, root } = animatedBattle();
    press('d');
    expect(store.state.locked).toBe(true);
    const sheet = root.querySelector('[data-sheet]') as HTMLButtonElement;
    expect(sheet.disabled).toBe(true);
    sheet.click();
    expect(store.state.screen).toBe('battle');
  });
});

describe('HUD de batalha — Esc e acessibilidade (spec §10)', () => {
  it('Esc fecha a descrição do jutsu e o painel de itens, e nunca sai da batalha', () => {
    const { store, root } = battle((run) => {
      run.character.inventory['kit_medico'] = 1;
    });
    press('1');
    expect(root.textContent).toContain(JUTSUS['henge']!.description);
    press('Escape');
    expect(root.textContent).not.toContain('Usar (Enter)');
    expect(store.state.screen).toBe('battle');
    press('i');
    expect(root.textContent).toContain('Kit médico (1)');
    press('Escape');
    expect(root.textContent).not.toContain('Kit médico (1)');
    press('Escape');
    expect(store.state.screen).toBe('battle');
    expect(store.state.run?.phase).toBe('battle');
  });

  it('jutsu selecionado: aria-pressed e marcador ✓; os outros aria-pressed=false', () => {
    const { root } = battle();
    press('1');
    const sel = root.querySelector('[data-jutsu=henge]') as HTMLButtonElement;
    expect(sel.getAttribute('aria-pressed')).toBe('true');
    expect(sel.textContent!.startsWith('✓ ')).toBe(true);
    const other = root.querySelector('[data-jutsu=bunshin]') as HTMLButtonElement;
    expect(other.getAttribute('aria-pressed')).toBe('false');
    expect(other.textContent!.startsWith('✓')).toBe(false);
  });

  it('jutsu sem chakra: desabilitado com o motivo em texto; vitais com números', () => {
    const { store, root } = battle((run) => {
      run.character.chakra = 0;
    });
    const p = store.state.run!.battle!.combatants.find((c) => c.side === 'player')!;
    const henge = root.querySelector('[data-jutsu=henge]') as HTMLButtonElement;
    expect(henge.disabled).toBe(true);
    expect(henge.textContent).toContain('(chakra insuficiente)');
    const side = root.querySelector('[data-side=player]')!.textContent!;
    expect(side).toContain(`HP: ${p.hp}/${p.maxHp}`);
    expect(side).toContain(`Chakra: ${p.chakra}/${p.maxChakra}`);
  });
});

// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { click, findButton, mount } from './appHelpers';
import { makeStore } from './memoryStore';

function open() {
  const store = makeStore();
  const root = mount(store);
  store.boot();
  store.go('create');
  return { store, root };
}

const q = (root: ParentNode, sel: string) => root.querySelector(sel) as HTMLElement;

describe('Criação de personagem', () => {
  it('Uchiha trava a afinidade em Fogo', () => {
    const { root } = open();
    click(root, 'Uchiha');
    const sel = q(root, 'select[name=affinity]') as HTMLSelectElement;
    expect(sel.disabled).toBe(true);
    expect(sel.value).toBe('fogo');
  });

  it('+ e − mexem nos pontos restantes', () => {
    const { root } = open();
    expect(root.textContent).toContain('Pontos restantes: 10');
    (q(root, '[data-attr=nin][data-op=inc]') as HTMLButtonElement).click();
    (q(root, '[data-attr=nin][data-op=inc]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Pontos restantes: 8');
    (q(root, '[data-attr=nin][data-op=dec]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Pontos restantes: 9');
    expect((q(root, '[data-attr=tai][data-op=dec]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('preset Ninjutsu usa os 10 pontos e a prévia lista os jutsus liberados', () => {
    const { root } = open();
    click(root, 'Sem clã');
    (q(root, '[data-preset=ninjutsu]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Pontos restantes: 0');
    expect(root.textContent).toContain('Henge no Jutsu');
    expect((q(root, '[data-attr=nin][data-op=inc]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('não começa sem nome nem com pontos sobrando', () => {
    const { root, store } = open();
    expect(findButton(root, 'Começar a Saga da Onda').disabled).toBe(true);
    (q(root, '[data-preset=ninjutsu]') as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.run).toBeNull();
    expect(store.state.notices.at(-1)?.text).toBe('Dê um nome ao seu ninja.');
  });

  it('com nome e pontos, cria a run e vai ao mapa', () => {
    const { root, store } = open();
    const input = q(root, 'input[name=name]') as HTMLInputElement;
    input.value = 'Kenji';
    input.dispatchEvent(new Event('input'));
    click(root, 'Sem clã');
    (q(root, '[data-preset=taijutsu]') as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.screen).toBe('map');
    expect(store.state.run?.character.name).toBe('Kenji');
    expect(store.state.run?.character.clan).toBe('semcla');
  });
});

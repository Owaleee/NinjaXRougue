// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { click, findButton, mount } from './appHelpers';
import { MemoryStore, makeStore } from './memoryStore';
import { emptyMeta } from '../../src/game/meta/meta';
import { saveMeta } from '../../src/game/save/save';

function open(storage = new MemoryStore()) {
  const store = makeStore(storage);
  const root = mount(store);
  store.boot();
  store.go('create');
  return { store, root, storage };
}

const q = (root: ParentNode, sel: string) => root.querySelector(sel) as HTMLElement;

function setName(root: ParentNode, name: string): void {
  const input = q(root, 'input[name=name]') as HTMLInputElement;
  input.value = name;
  input.dispatchEvent(new Event('input'));
}

/** Valor da linha "rótulo" da prévia (coluna da direita). */
function previewValue(root: ParentNode, label: string): string {
  const tr = Array.from(root.querySelectorAll('tr')).find((r) => r.querySelector('td')?.textContent === label);
  if (!tr) throw new Error(`linha "${label}" não encontrada`);
  return tr.querySelectorAll('td')[1]?.textContent ?? '';
}

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

  it('não começa sem nome nem com pontos sobrando, e mostra o motivo', () => {
    const { root, store } = open();
    expect(findButton(root, 'Começar a Saga da Onda').disabled).toBe(true);
    expect(root.textContent).toContain('Distribua os 10 pontos restantes.');
    expect(root.textContent).toContain('Dê um nome ao seu ninja.');
    (q(root, '[data-preset=ninjutsu]') as HTMLButtonElement).click();
    expect(findButton(root, 'Começar a Saga da Onda').disabled).toBe(true);
    expect(root.textContent).toContain('Dê um nome ao seu ninja.');
    expect(store.state.run).toBeNull();
  });

  it('com nome e pontos, cria a run e vai ao mapa', () => {
    const { root, store } = open();
    setName(root, 'Kenji');
    click(root, 'Sem clã');
    (q(root, '[data-preset=taijutsu]') as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.screen).toBe('map');
    expect(store.state.run?.character.name).toBe('Kenji');
    expect(store.state.run?.character.clan).toBe('semcla');
  });

  // (a) nome preenchido, pontos sobrando: desabilitado e motivo de pontos visível.
  it('com nome e pontos sobrando, o botão fica desabilitado e mostra o motivo de pontos', () => {
    const { root } = open();
    setName(root, 'Kenji');
    expect(findButton(root, 'Começar a Saga da Onda').disabled).toBe(true);
    expect(root.textContent).toContain('Distribua os 10 pontos restantes.');
    expect(root.textContent).not.toContain('Dê um nome ao seu ninja.');
  });

  // (b) pontos zerados, sem nome: desabilitado e motivo de nome visível.
  it('com pontos zerados e sem nome, o botão fica desabilitado e mostra o motivo de nome', () => {
    const { root } = open();
    (q(root, '[data-preset=ninjutsu]') as HTMLButtonElement).click();
    expect(findButton(root, 'Começar a Saga da Onda').disabled).toBe(true);
    expect(root.textContent).toContain('Dê um nome ao seu ninja.');
    expect(root.textContent).not.toContain('Distribua os');
  });

  // (c) título: só os desbloqueados e não ocultos.
  it('o select de títulos lista só os desbloqueados e não ocultos', () => {
    const storage = new MemoryStore();
    const meta = emptyMeta();
    meta.titlesUnlocked = ['demonio_da_nevoa', 'colecionador']; // colecionador é oculto no MVP
    saveMeta(storage, meta);
    const { root } = open(storage);
    const values = Array.from((q(root, 'select[name=title]') as HTMLSelectElement).options).map((o) => o.value);
    expect(values).toEqual(['', 'demonio_da_nevoa']);
  });

  // (d) Raio fora das opções de afinidade.
  it('Raio não aparece nas opções de afinidade', () => {
    const { root } = open();
    click(root, 'Sem clã');
    const sel = q(root, 'select[name=affinity]') as HTMLSelectElement;
    const values = Array.from(sel.options).map((o) => o.value);
    expect(values).toEqual(['fogo', 'vento', 'terra', 'agua']);
    expect(values).not.toContain('raio');
  });

  // (e) a afinidade escolhida chega ao personagem da run.
  it('a afinidade escolhida chega ao character da run', () => {
    const { root, store } = open();
    setName(root, 'Kenji');
    click(root, 'Sem clã');
    const sel = q(root, 'select[name=affinity]') as HTMLSelectElement;
    sel.value = 'terra';
    sel.dispatchEvent(new Event('change'));
    (q(root, '[data-preset=taijutsu]') as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.run?.character.affinity).toBe('terra');
  });

  // (f) texto de jogador com tags entra literal, sem elemento criado.
  it('um nome com tags aparece como texto literal, sem criar elemento', () => {
    const payload = '<img onerror=1>'; // 15 caracteres: cabe no limite de 20 do nome
    const { root, store } = open();
    setName(root, payload);
    click(root, 'Sem clã');
    (q(root, '[data-preset=taijutsu]') as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.run?.character.name).toBe(payload);
    store.toMenu();
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain(payload);
  });

  // (g) a prévia muda ao somar pontos.
  it('a prévia de HP máximo muda ao somar pontos em HP', () => {
    const { root } = open();
    const before = previewValue(root, 'HP máximo');
    (q(root, '[data-attr=hp][data-op=inc]') as HTMLButtonElement).click();
    (q(root, '[data-attr=hp][data-op=inc]') as HTMLButtonElement).click();
    expect(previewValue(root, 'HP máximo')).not.toBe(before);
  });

  // (h) clã selecionado: aria-pressed e marcador textual.
  it('o clã selecionado tem aria-pressed="true" e marcador textual', () => {
    const { root } = open();
    click(root, 'Uzumaki');
    // Consulta depois do clique: o rerender recria os botões.
    expect(findButton(root, 'Uzumaki').getAttribute('aria-pressed')).toBe('true');
    expect(findButton(root, 'Uzumaki').textContent).toContain('✓');
    expect(findButton(root, 'Uchiha').getAttribute('aria-pressed')).toBe('false');
    expect(findButton(root, 'Uchiha').textContent).not.toContain('✓');
    expect(findButton(root, 'Sem clã').getAttribute('aria-pressed')).toBe('false');
  });
});

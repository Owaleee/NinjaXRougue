// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { click, findButton, mount } from './appHelpers';
import { MemoryStore, PARAMS, makeStore } from './memoryStore';

describe('Menu principal', () => {
  it('sem run: Continuar desabilitado e Modo Infinito "em breve"', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    expect(findButton(root, 'Continuar run').disabled).toBe(true);
    expect(findButton(root, 'Modo Infinito').disabled).toBe(true);
    click(root, 'Enciclopédia');
    expect(store.state.screen).toBe('encyclopedia');
  });

  it('Modo História sem run vai direto à criação', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    click(root, 'Modo História');
    expect(store.state.screen).toBe('create');
  });

  it('com run: mostra o nome como texto literal (Review Focus 5) e pede confirmação para abandonar', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun({ ...PARAMS, name: '<b>Kenji</b>' });
    const store = makeStore(storage);
    const root = mount(store);
    store.boot();
    expect(root.textContent).toContain('<b>Kenji</b> — encontro 1 de 26');
    expect(root.querySelector('b')).toBeNull();

    click(root, 'Modo História');
    expect(root.textContent).toContain('Abandonar a run atual?');
    click(root, 'Cancelar');
    expect(store.hasActiveRun()).toBe(true);

    click(root, 'Modo História');
    click(root, 'Abandonar e criar novo ninja');
    expect(store.hasActiveRun()).toBe(false);
    expect(store.state.screen).toBe('create');
    expect(store.state.meta.history[0]?.result).toBe('abandoned');
  });

  it('Continuar leva à tela da run', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun(PARAMS);
    const store = makeStore(storage);
    const root = mount(store);
    store.boot();
    click(root, 'Continuar run');
    expect(store.state.screen).toBe('map');
  });
});

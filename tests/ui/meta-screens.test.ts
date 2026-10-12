// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { META_KEY } from '../../src/game/save/save';
import { mount } from './appHelpers';
import { MemoryStore, PARAMS, makeStore } from './memoryStore';

/** Meta com uma run abandonada (Sem clã, Nin 15: aprendeu Henge, Bunshin...). */
function withHistory(patchMeta?: (m: Record<string, any>) => void) {
  const storage = new MemoryStore();
  const a = makeStore(storage);
  a.boot();
  a.startNewRun(PARAMS);
  a.abandonRun();
  if (patchMeta) {
    const m = JSON.parse(storage.getItem(META_KEY)!);
    patchMeta(m);
    storage.setItem(META_KEY, JSON.stringify(m));
  }
  const store = makeStore(storage);
  const root = mount(store);
  store.boot();
  return { store, root };
}

function cardOf(root: ParentNode, name: string): HTMLElement | undefined {
  return Array.from(root.querySelectorAll('.card')).find((c) => c.querySelector('h3')?.textContent === name) as HTMLElement | undefined;
}

describe('Enciclopédia', () => {
  it('meta vazia: tudo bloqueado e sem golpes exclusivos de inimigos', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    store.go('encyclopedia');
    expect(root.textContent).toContain('Desbloqueados: 0 de');
    expect(cardOf(root, 'Henge no Jutsu')?.textContent).toContain('Bloqueado');
    expect(cardOf(root, 'Kunai Lançada')).toBeUndefined();
  });

  it('jutsu aprendido em run anterior fica desbloqueado; filtro de situação funciona', () => {
    const { store, root } = withHistory();
    store.go('encyclopedia');
    expect(cardOf(root, 'Henge no Jutsu')?.textContent).toContain('Desbloqueado');
    const sel = root.querySelector('select[name=status]') as HTMLSelectElement;
    sel.value = 'bloqueados';
    sel.dispatchEvent(new Event('change'));
    expect(cardOf(root, 'Henge no Jutsu')).toBeUndefined();
    expect(cardOf(root, 'Kawarimi no Jutsu')).toBeDefined();
  });

  it('filtro de categoria', () => {
    const { store, root } = withHistory();
    store.go('encyclopedia');
    const sel = root.querySelector('select[name=category]') as HTMLSelectElement;
    sel.value = 'taijutsu';
    sel.dispatchEvent(new Event('change'));
    expect(cardOf(root, 'Sennen Goroshi')).toBeDefined();
    expect(cardOf(root, 'Henge no Jutsu')).toBeUndefined();
  });
});

describe('Histórico', () => {
  it('vazio', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    store.go('history');
    expect(root.textContent).toContain('Nenhuma run registrada ainda.');
  });

  it('lista a run com o texto do resultado e abre os detalhes', () => {
    const { store, root } = withHistory();
    store.go('history');
    expect(root.textContent).toContain('Abandonou a run no encontro 1 de 26');
    expect(root.textContent).toContain('Runs: 1 · Vitórias: 0');
    (root.querySelector('[data-history]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Atributos base');
    expect(root.textContent).toContain('Henge no Jutsu +0');
  });

  it('nome do personagem com HTML aparece como texto literal', () => {
    const evil = '<img src=x onerror=alert(1)><b>Naruto</b>';
    const { store, root } = withHistory((m) => {
      m['history'][0].name = evil;
    });
    store.go('history');
    expect(root.querySelector('strong')?.textContent).toBe(evil);
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('b')).toBeNull();
  });
});

describe('Títulos', () => {
  it('bloqueados aparecem como ??? e ocultos não aparecem', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    store.go('titles');
    expect(root.textContent).toContain('Desbloqueados: 0 de');
    expect(root.textContent).toContain('???');
    expect(root.textContent).not.toContain('Colecionador');
    expect(root.textContent).not.toContain('Novo Chunin');
  });

  it('título conquistado mostra nome e buff', () => {
    const { store, root } = withHistory((m) => {
      m['titlesUnlocked'] = ['demonio_da_nevoa'];
    });
    store.go('titles');
    expect(root.textContent).toContain('Demônio da Névoa');
    expect(root.textContent).toContain('Desbloqueados: 1 de');
  });
});

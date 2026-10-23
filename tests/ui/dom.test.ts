// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { App } from '../../src/ui-dom/App';
import { bar, button, h } from '../../src/ui-dom/dom';
import type { ScreenCtx } from '../../src/ui-dom/types';
import { makeStore } from './memoryStore';

describe('h() e componentes básicos', () => {
  it('texto com HTML vira texto literal (Review Focus 5)', () => {
    const p = h('p', {}, '<img src=x onerror=alert(1)>');
    expect(p.querySelector('img')).toBeNull();
    expect(p.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('ignora filhos nulos e aceita números', () => {
    const d = h('div', {}, null, false, undefined, 3, ' ryo');
    expect(d.textContent).toBe('3 ryo');
  });

  it('button chama o handler e respeita disabled', () => {
    const fn = vi.fn();
    const b = button('Atacar', fn);
    b.click();
    expect(fn).toHaveBeenCalledOnce();
    expect(button('X', fn, { disabled: true }).disabled).toBe(true);
  });

  it('bar limita a largura entre 0% e 100% e expõe o valor para leitores de tela', () => {
    const el = bar('hp', 150, 100, 'HP');
    expect((el.querySelector('.bar > span') as HTMLElement).style.width).toBe('100%');
    expect(el.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe('150');
    expect((bar('hp', 5, 0, 'HP').querySelector('.bar > span') as HTMLElement).style.width).toBe('0%');
  });
});

describe('App', () => {
  function setup() {
    document.body.innerHTML = '';
    const root = document.createElement('div');
    document.body.appendChild(root);
    const store = makeStore();
    const seen: string[] = [];
    const app = new App(root, store, {
      screens: {
        menu: (ctx: ScreenCtx) => {
          const n = ctx.local('n', () => ({ v: 0 }));
          return h('div', {}, `menu ${n.v}`, button('+', () => { n.v++; ctx.rerender(); }));
        },
      },
      keys: { menu: (_ctx, e) => seen.push(e.key) },
    });
    app.mount();
    store.boot();
    return { root, store, seen };
  }

  it('renderiza a tela atual e mostra "em construção" para telas sem renderer', () => {
    const { root, store } = setup();
    expect(root.textContent).toContain('menu 0');
    store.go('history');
    expect(root.textContent).toContain('Tela em construção');
  });

  it('estado local sobrevive a re-render e zera ao trocar de tela', () => {
    const { root, store } = setup();
    (root.querySelector('button') as HTMLButtonElement).click();
    expect(root.textContent).toContain('menu 1');
    store.go('history');
    store.back();
    expect(root.textContent).toContain('menu 0');
  });

  it('avisos aparecem e podem ser fechados', () => {
    const { root, store } = setup();
    store.notify('error', 'Chakra insuficiente.');
    const toast = root.querySelector('.toast.error');
    expect(toast?.textContent).toContain('Chakra insuficiente.');
    (toast?.querySelector('button') as HTMLButtonElement).click();
    expect(root.querySelector('.toast')).toBeNull();
  });

  it('teclas vão para o handler da tela atual, mas não enquanto se digita num campo', () => {
    const { root, seen } = setup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    const input = document.createElement('input');
    root.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    expect(seen).toEqual(['a']);
  });
});

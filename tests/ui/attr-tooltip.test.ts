// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { ATTR_KEYS } from '../../src/game/types';
import { t } from '../../src/i18n/pt-BR';
import { attrLabel } from '../../src/ui-dom/components/attrLabel';
import { click, mount } from './appHelpers';
import { makeStore } from './memoryStore';

describe('tooltip dos atributos', () => {
  it('todo atributo tem um texto de explicação no i18n', () => {
    for (const k of ATTR_KEYS) expect(t(`attr.tip.${k}`)).not.toBe(`attr.tip.${k}`);
  });

  it('o rótulo é focável e leva a explicação sem mudar o texto visível', () => {
    const el = attrLabel('vel');
    expect(el.textContent).toBe('Velocidade');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.dataset.tip).toBe(t('attr.tip.vel'));
    expect(el.getAttribute('aria-description')).toBe(t('attr.tip.vel'));
  });

  it('a Criação mostra o tooltip nas 8 linhas de atributos', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    store.go('create');
    click(root, 'Uchiha');
    expect(root.querySelectorAll('[data-tip]').length).toBe(8);
  });
});

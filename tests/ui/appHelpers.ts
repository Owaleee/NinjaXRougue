import { App } from '../../src/ui-dom/App';
import { KEYS, OVERLAY, SCREENS } from '../../src/ui-dom/screens';
import type { GameStore } from '../../src/store/GameStore';

export function mount(store: GameStore): HTMLElement {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  document.body.appendChild(root);
  new App(root, store, { screens: SCREENS, keys: KEYS, overlay: OVERLAY }).mount();
  return root;
}

export function findButton(root: ParentNode, text: string): HTMLButtonElement {
  const b = Array.from(root.querySelectorAll('button')).find((x) => x.textContent?.includes(text));
  if (!b) throw new Error(`botão "${text}" não encontrado`);
  return b;
}

export function click(root: ParentNode, text: string): void {
  findButton(root, text).click();
}

export function press(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

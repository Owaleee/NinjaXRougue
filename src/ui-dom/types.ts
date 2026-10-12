import type { GameStore } from '../store/GameStore';

export interface ModalAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface ModalHost {
  open(title: string, body: Node | string, actions: ModalAction[]): void;
  close(): void;
}

/** Tudo o que uma tela recebe. */
export interface ScreenCtx {
  store: GameStore;
  /** Estado só da tela atual (aba aberta, rascunho). Zera quando a tela muda. */
  local<T>(key: string, init: () => T): T;
  rerender(): void;
  modal: ModalHost;
}

export type ScreenRenderer = (ctx: ScreenCtx) => HTMLElement;
export type KeyHandler = (ctx: ScreenCtx, e: KeyboardEvent) => void;

/** O que o App precisa saber do Phaser: só mostrar e esconder. */
export interface BattleView {
  show(): void;
  hide(): void;
}

import { screenBg, screenBgUrl } from '../data/art';
import { t } from '../i18n/pt-BR';
import type { GameStore, ScreenId } from '../store/GameStore';
import { button, clear, h } from './dom';
import type { BattleView, KeyHandler, ModalAction, ScreenCtx, ScreenRenderer } from './types';

export interface AppOptions {
  screens: Partial<Record<ScreenId, ScreenRenderer>>;
  keys?: Partial<Record<ScreenId, KeyHandler>>;
  /** Diálogo dirigido pelo estado (ex.: troca de jutsu), desenhado por cima da tela. */
  overlay?: ((ctx: ScreenCtx) => HTMLElement | null) | null;
}

/**
 * Monta as camadas da página e redesenha a tela atual a cada mudança do store.
 * Camadas (de baixo para cima): canvas do Phaser, tela DOM, avisos, modal, overlay.
 */
export class App {
  private gameEl!: HTMLElement;
  private uiEl!: HTMLElement;
  private toastEl!: HTMLElement;
  private modalEl!: HTMLElement;
  private overlayEl!: HTMLElement;
  private locals = new Map<string, unknown>();
  private lastScreen: ScreenId | null = null;
  private battleView: BattleView | null = null;
  private readonly ctx: ScreenCtx;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: GameStore,
    private readonly opts: AppOptions,
  ) {
    this.ctx = {
      store,
      local: <T>(key: string, init: () => T): T => {
        if (!this.locals.has(key)) this.locals.set(key, init());
        return this.locals.get(key) as T;
      },
      rerender: () => this.render(),
      modal: { open: (title, body, actions) => this.openModal(title, body, actions), close: () => clear(this.modalEl) },
    };
  }

  get gameLayer(): HTMLElement {
    return this.gameEl;
  }

  setBattleView(v: BattleView): void {
    this.battleView = v;
    this.render();
  }

  mount(): void {
    clear(this.root);
    this.gameEl = h('div', { id: 'game-layer' });
    this.uiEl = h('div', { id: 'ui-layer' });
    this.toastEl = h('div', { id: 'toast-layer', attrs: { 'aria-live': 'polite' } });
    this.modalEl = h('div', { id: 'modal-layer' });
    this.overlayEl = h('div', { id: 'overlay-layer' });
    this.root.append(this.gameEl, this.uiEl, this.toastEl, this.modalEl, this.overlayEl);
    this.store.subscribe(() => this.render());
    document.addEventListener('keydown', (e) => this.onKey(e));
    this.render();
  }

  render(): void {
    const s = this.store.state;
    if (s.screen !== this.lastScreen) {
      this.locals.clear();
      clear(this.modalEl);
      this.lastScreen = s.screen;
    }
    const inBattle = s.screen === 'battle';
    const bg = screenBg(s.screen, s.runEnd?.result);
    document.body.style.backgroundImage = bg ? `linear-gradient(rgba(18, 20, 26, 0.22), rgba(18, 20, 26, 0.22)), url(${screenBgUrl(bg)})` : '';
    this.gameEl.classList.toggle('visible', inBattle);
    this.uiEl.classList.toggle('battle', inBattle);
    if (inBattle) this.battleView?.show();
    else this.battleView?.hide();

    const renderer = this.opts.screens[s.screen];
    clear(this.uiEl);
    try {
      this.uiEl.appendChild(renderer ? renderer(this.ctx) : h('div', { class: 'panel' }, t('screen.wip')));
    } catch (e) {
      const msg = t('notice.unexpected', { msg: (e as Error).message ?? String(e) });
      if (s.screen !== 'error') {
        // fail() troca para a ErrorScreen e redesenha (re-entrante); o que vem abaixo já foi feito lá.
        this.store.fail(msg);
        return;
      }
      // A própria ErrorScreen falhou: painel mínimo, sem depender de nenhuma tela.
      clear(this.uiEl);
      this.uiEl.appendChild(
        h('div', { class: 'screen panel' }, h('h1', {}, t('error.title')), h('pre', { class: 'muted' }, msg), button(t('error.reload'), () => window.location.reload(), { primary: true })),
      );
    }

    clear(this.toastEl);
    for (const n of s.notices) {
      this.toastEl.appendChild(
        h(
          'div',
          { class: `toast ${n.kind}`, attrs: { role: n.kind === 'error' ? 'alert' : 'status' } },
          h('span', {}, n.text),
          button('×', () => this.store.dismissNotice(n.id), { title: t('common.close'), attrs: { 'aria-label': t('common.close') } }),
        ),
      );
    }

    clear(this.overlayEl);
    const overlay = !inBattle && this.opts.overlay ? this.opts.overlay(this.ctx) : null;
    if (overlay) this.overlayEl.appendChild(overlay);
  }

  private openModal(title: string, body: Node | string, actions: ModalAction[]): void {
    clear(this.modalEl);
    this.modalEl.appendChild(
      h(
        'div',
        { class: 'dialog', attrs: { role: 'dialog', 'aria-modal': 'true' } },
        h('h2', {}, title),
        typeof body === 'string' ? h('p', {}, body) : body,
        h(
          'div',
          { class: 'row' },
          ...actions.map((a) =>
            button(
              a.label,
              () => {
                clear(this.modalEl);
                a.onClick();
              },
              { primary: a.primary },
            ),
          ),
        ),
      ),
    );
  }

  private onKey(e: KeyboardEvent): void {
    if (this.modalEl.firstChild || this.overlayEl.firstChild) {
      if (e.key === 'Escape' && this.modalEl.firstChild) clear(this.modalEl);
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    this.opts.keys?.[this.store.state.screen]?.(this.ctx, e);
  }
}

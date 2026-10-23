/**
 * Mini-biblioteca de DOM. POR QUÊ não um framework: o jogo tem poucas telas,
 * todas recriadas a cada mudança do store; um helper de 60 linhas basta.
 * REGRA DE SEGURANÇA: texto entra sempre como nó de texto (nunca innerHTML),
 * então um nome como "<img onerror=...>" aparece literal e não executa nada.
 */
import { characterUrl, iconUrl, type CharacterArt, type IconRef } from '../data/art';

export type Child = Node | string | number | null | undefined | false;

export interface Props {
  class?: string;
  id?: string;
  title?: string;
  type?: string;
  value?: string;
  disabled?: boolean;
  checked?: boolean;
  attrs?: Record<string, string>;
  on?: { [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void };
}

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.id) el.id = props.id;
  if (props.title) el.title = props.title;
  if (props.type !== undefined) el.setAttribute('type', props.type);
  if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) el.setAttribute(k, v);
  if (props.value !== undefined) (el as unknown as HTMLInputElement).value = props.value;
  if (props.disabled) (el as unknown as HTMLButtonElement).disabled = true;
  if (props.checked) (el as unknown as HTMLInputElement).checked = true;
  if (props.on) for (const [ev, fn] of Object.entries(props.on)) el.addEventListener(ev, fn as EventListener);
  append(el, children);
  return el;
}

export function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function button(
  label: string,
  onClick: () => void,
  opts: { primary?: boolean; disabled?: boolean; title?: string; class?: string; attrs?: Record<string, string>; icon?: IconRef | null } = {},
): HTMLButtonElement {
  const cls = [opts.primary ? 'primary' : '', opts.icon ? 'with-icon' : '', opts.class ?? ''].join(' ').trim();
  return h(
    'button',
    { type: 'button', class: cls, disabled: opts.disabled, title: opts.title, attrs: opts.attrs, on: { click: () => onClick() } },
    opts.icon ? icon(opts.icon) : null,
    label,
  );
}

/** Ícone decorativo: o texto ao lado sempre diz o que é (alt vazio, fora do leitor de tela). */
export function icon(name: IconRef | null | undefined, size: 'sm' | 'md' | 'lg' = 'sm'): HTMLImageElement | null {
  if (!name) return null;
  return h('img', { class: `icon icon-${size}`, attrs: { src: iconUrl(name), alt: '', 'aria-hidden': 'true', draggable: 'false' } });
}

/** Retrato de personagem (decorativo: o nome sempre aparece em texto ao lado). */
export function portrait(art: CharacterArt, cls = ''): HTMLImageElement {
  return h('img', { class: `portrait ${cls}`.trim(), attrs: { src: characterUrl(art), alt: '', 'aria-hidden': 'true', draggable: 'false' } });
}

/** Barra de HP/chakra/XP com o número em texto (não só a cor/largura). */
export function bar(kind: 'hp' | 'chakra' | 'xp', value: number, max: number, label: string): HTMLElement {
  const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const fill = h('span');
  fill.style.width = `${width}%`;
  return h(
    'div',
    { class: 'bar-wrap' },
    h('div', { class: 'muted' }, `${label}: ${Math.round(value)}/${Math.round(max)}`),
    h(
      'div',
      {
        class: `bar ${kind}`,
        attrs: { role: 'progressbar', 'aria-label': label, 'aria-valuenow': String(Math.round(value)), 'aria-valuemax': String(Math.round(max)) },
      },
      fill,
    ),
  );
}

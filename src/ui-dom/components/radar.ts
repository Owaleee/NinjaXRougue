import { ATTR_KEYS, type AttrKey, type Attributes } from '../../game/types';
import { t, type I18nKey } from '../../i18n/pt-BR';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SHORT: Record<AttrKey, I18nKey> = {
  hp: 'attr.short.hp',
  tai: 'attr.short.tai',
  nin: 'attr.short.nin',
  gen: 'attr.short.gen',
  vel: 'attr.short.vel',
  int: 'attr.short.int',
  crit: 'attr.short.crit',
  def: 'attr.short.def',
};

/** Vértices "x,y x,y ..." de um polígono radial; o primeiro eixo aponta para cima. */
export function radarPoints(values: number[], max: number, radius: number, cx: number, cy: number): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const r = max > 0 ? (Math.min(v, max) / max) * radius : 0;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${(Math.abs(x) < 1e-9 ? 0 : x).toFixed(1)},${(Math.abs(y) < 1e-9 ? 0 : y).toFixed(1)}`;
    })
    .join(' ');
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

/** Gráfico octogonal da Ficha (DD v2 §14): contorno = base, preenchido = efetivo. */
export function radarSvg(base: Attributes, effective: Attributes, size = 240): SVGSVGElement {
  const c = size / 2;
  const radius = size / 2 - 28;
  const max = Math.max(10, ...ATTR_KEYS.map((k) => effective[k]));
  const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, width: String(size), height: String(size), role: 'img', 'aria-label': t('radar.label') });
  svg.appendChild(el('polygon', { points: radarPoints(ATTR_KEYS.map(() => max), max, radius, c, c), fill: 'none', stroke: 'var(--line)' }));
  svg.appendChild(el('polygon', { points: radarPoints(ATTR_KEYS.map((k) => effective[k]), max, radius, c, c), fill: 'rgba(240,138,36,0.35)', stroke: 'var(--accent)' }));
  svg.appendChild(el('polygon', { points: radarPoints(ATTR_KEYS.map((k) => base[k]), max, radius, c, c), fill: 'none', stroke: 'var(--accent-2)', 'stroke-dasharray': '4 3' }));
  const labels = radarPoints(ATTR_KEYS.map(() => max), max, radius + 16, c, c).split(' ');
  ATTR_KEYS.forEach((k, i) => {
    const [x, y] = (labels[i] ?? '0,0').split(',');
    const text = el('text', { x: x ?? '0', y: y ?? '0', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text)', 'font-size': '11' });
    text.textContent = `${t(SHORT[k])} ${effective[k]}`;
    svg.appendChild(text);
  });
  return svg;
}

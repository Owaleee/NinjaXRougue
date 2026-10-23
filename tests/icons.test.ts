import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Ícones-fonte da entrega de arte (tools/gen-icons.py reescreve os redesenhados). */
const ICONES = join(__dirname, '..', 'assets', 'icones');
const tipos = readdirSync(ICONES).filter((t) => statSync(join(ICONES, t)).isDirectory());
const svgs = (tipo: string) => readdirSync(join(ICONES, tipo)).filter((f) => f.endsWith('.svg'));
const ler = (tipo: string, f: string) => readFileSync(join(ICONES, tipo, f), 'utf-8');

/** O desenho de um ícone normal: o <g> que vem depois do fundo (o quadro é igual em todos). */
function glifo(svg: string): string {
  const fundo = svg.indexOf('<g opacity=".14">');
  const inicio = svg.indexOf('<g>', fundo);
  expect(fundo, 'ícone sem o quadro padrão').toBeGreaterThan(0);
  return svg.slice(inicio);
}

describe('ícones SVG (assets/icones)', () => {
  it('nenhum par de ids diferentes do mesmo tipo tem o mesmo desenho', () => {
    for (const tipo of tipos) {
      const porHash = new Map<string, string>();
      for (const f of svgs(tipo).filter((n) => !n.endsWith('_locked.svg'))) {
        const h = createHash('md5').update(glifo(ler(tipo, f))).digest('hex');
        expect(porHash.get(h), `${tipo}/${f} repete ${tipo}/${porHash.get(h)}`).toBeUndefined();
        porHash.set(h, f);
      }
    }
  });

  it('nenhum ícone usa <text> (dependeria da fonte do sistema)', () => {
    for (const tipo of tipos) for (const f of svgs(tipo)) expect(ler(tipo, f), `${tipo}/${f}`).not.toMatch(/<text[\s>]/);
  });

  it('todo ícone tem viewBox 64×64 e cabe em 4 KB', () => {
    for (const tipo of tipos)
      for (const f of svgs(tipo)) {
        const texto = ler(tipo, f);
        expect(texto, `${tipo}/${f}`).toContain('viewBox="0 0 64 64"');
        expect(Buffer.byteLength(texto, 'utf-8'), `${tipo}/${f}`).toBeLessThanOrEqual(4096);
        expect(texto, `${tipo}/${f}`).not.toMatch(/<script|<image|<foreignObject|href="https?:/i);
      }
  });

  it('os 7 graus têm silhuetas diferentes entre si', () => {
    const graus = ['d', 'd_plus', 'c', 'b', 'a', 's', 'raro'];
    const formas = graus.map((g) => {
      const m = glifo(ler('grade', `${g}.svg`)).match(/<(path|polygon)\b[^>]*\b(?:d|points)="([^"]+)"/);
      expect(m, `grade/${g} sem forma`).not.toBeNull();
      return m![2];
    });
    expect(new Set(formas).size).toBe(graus.length);
  });

  it('cada _locked corresponde a um ícone normal', () => {
    for (const tipo of tipos)
      for (const f of svgs(tipo).filter((n) => n.endsWith('_locked.svg')))
        expect(svgs(tipo), `${tipo}/${f}`).toContain(f.replace('_locked', ''));
  });
});

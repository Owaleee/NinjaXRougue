/**
 * Gerador pseudoaleatório com semente (algoritmo mulberry32).
 *
 * POR QUÊ: Math.random() não pode ser reproduzido. Com uma semente, a mesma
 * run gera exatamente os mesmos sorteios. Isso dá:
 *  - testes determinísticos;
 *  - bugs reproduzíveis (basta guardar a semente);
 *  - "recarregar no meio da luta" não vira roleta (anti save-scum).
 * Todo o estado é um único inteiro de 32 bits, trivial de salvar.
 */
export class Rng {
  protected s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** Recria um gerador exatamente do ponto em que outro parou. */
  static fromState(state: number): Rng {
    return new Rng(state);
  }

  get state(): number {
    return this.s;
  }

  /** Número em [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Inteiro em [min, max] (inclusivo). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** true com probabilidade p (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: lista vazia');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Embaralha uma cópia (Fisher-Yates); não altera a lista original. */
  shuffle<T>(items: readonly T[]): T[] {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j] as T, a[i] as T];
    }
    return a;
  }
}

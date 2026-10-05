# Plano 1 de 3 — Motor de Regras + Simulador (NarutoTxGame MVP)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o motor de regras completo do MVP (combate, efeitos, progressão, run, loja, meta, save) em TypeScript puro, testado com Vitest, e um simulador headless que valida o balanceamento contra as metas da spec.

**Architecture:** Motor 100% puro em `src/game/` (nenhum import de Phaser/DOM, nenhum `Math.random`/`Date`), dirigido por dados tipados em `src/data/`. Toda função pública recebe estado e devolve novo estado + lista de eventos (`GameEvent`). O simulador em `src/game/sim/` + `tools/simulate.ts` joga runs completas usando exatamente as mesmas funções que a interface (Plano 2) usará.

**Tech Stack:** Node 22, TypeScript 5 (strict), Vite 6 (só como config do Vitest neste plano), Vitest 3, Zod 3, tsx 4.

**Spec:** `docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md` (e o DD v2 em `docs/referencia/`).

**Planos seguintes:** Plano 2 = interface (Phaser + telas DOM + GameStore); Plano 3 = `docs/ANALISE.md`, curso e `docs/DESIGN.md` v3. Serão escritos após este plano ser executado.

## Global Constraints

- Idioma: identificadores de código em inglês; textos de jogo, comentários e mensagens de erro em **português (pt-BR)**.
- Motor (`src/game/**`) **não pode** importar `phaser`, usar `window`/`document`/`localStorage`, `Math.random()` ou `Date.now()`. Todo sorteio passa por `Rng`; o tempo chega como parâmetro `now: number`.
- Toda constante numérica de balanceamento vive em `src/game/Balance.ts` (fonte única). Nenhum número mágico de balanceamento em outros arquivos.
- Nomes e descrições de conteúdo (jutsus, itens, inimigos, títulos) ficam nos arquivos de `src/data/` em pt-BR. Strings de interface ficarão em `src/i18n/pt-BR.ts` (Plano 2). *(Decisão deste plano: conteúdo é dado, não texto de UI.)*
- Regra fixa de jutsu (spec §5): só é aprendido automaticamente ao cumprir atributo **base** + clã + saga mínima + pré-requisito. Nenhuma outra fonte concede jutsu.
- Fórmula de dano (spec §4): `Poder × (1 + 0,03·m) × (1 + Atr/40) × Elem × (1 + Σbônus%) × (1 − Red) × Crit × Var` × multiplicador de dano do grau (inimigos) × 0,5 se defendendo.
- Erros de regra lançam `RuleError` (com `code`), nunca `Error` genérico.
- Funções públicas do motor não mutam o argumento (clonam com `structuredClone`), exceto as variantes `...InPlace` explicitamente nomeadas (usadas pelo simulador por desempenho).
- Imports relativos sem extensão (`'../Balance'`), compatíveis com Vite e tsx.
- Commits pequenos, mensagem em pt-BR no formato `tipo: descrição`, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Save corrompido ou de versão desconhecida** no `localStorage` → o jogo não pode quebrar: faz backup em `nxr.<tipo>.corrupt.<now>`, descarta e segue limpo (teste na Task 13).
2. **Recarregar no meio de uma batalha** → a run volta ao mapa do mesmo nó com o **mesmo** estado de RNG do início do encontro (sem save-scum) (teste na Task 13).
3. **Jogador morre por queimadura no início do próprio turno** → batalha termina com vitória do inimigo, sem ficar esperando ação do jogador (teste na Task 7).
4. **Aprender jutsu com os 4 slots cheios** → vai para o repertório, não é equipado sozinho e não expulsa ninguém (teste na Task 4).
5. **Subir vários níveis com um único chefe** (XP de Zabuza) → uma escolha 1-de-3 por nível ganho e os pontos livres acumulam corretamente (teste na Task 11).

---

## Estrutura de arquivos

```
package.json, tsconfig.json, vite.config.ts, .gitignore (já existe)
src/
  game/
    Rng.ts                 sorteio com semente (mulberry32)
    Balance.ts             todas as constantes
    types.ts               tipos e tuplas de domínio (atributos, elementos, graus, sagas...)
    attributes.ts          utilitários de atributos + nomes + categoria→atributo
    formulas.ts            fórmulas puras (HP, chakra, dano-base, esquiva, crítico, XP...)
    errors.ts              RuleError
    events.ts              união GameEvent
    combat/
      types.ts             Combatant, ActiveEffect, Action, BattleState
      cost.ts              custo de chakra e nível de maestria de um combatente
      damage.ts            resolveHit (um golpe)
      battle.ts            startBattle / applyAction / applyActionInPlace
      ai.ts                IA básica + scripts de Zabuza e Haku
      enemyFactory.ts      distributePoints / createEnemy
    effects/
      EffectSystem.ts      aplicar/remover/tick/agregação de modificadores/transformação
    progression/
      character.ts         PlayerCharacter, criação, XP, pontos, atributos efetivos
      mastery.ts           maestria e custo de chakra
      unlock.ts            regra fixa de desbloqueio
      loadout.ts           slots de jutsu
    run/
      types.ts             RunState, RunNode, EncounterResult, RewardOptionId
      shop.ts              estoque, compra, equipamento, Pergaminho Raro
      battleSetup.ts       PlayerCharacter <-> Combatant
      runManager.ts        ciclo da run
    meta/
      stats.ts             RunStats + rastreador por eventos
      meta.ts              MetaState, títulos, histórico, enciclopédia
    save/
      save.ts              persistência versionada (KeyValueStore injetável)
    sim/
      builds.ts            builds do Apêndice A.5
      bot.ts               robô jogador
      report.ts            agregação, tabela e metas
  data/
    story.ts  effects.ts  jutsus.ts  clans.ts  items.ts  enemies.ts  saga.ts  titles.ts  validate.ts
tools/simulate.ts
tests/
  helpers.ts  rng.test.ts  formulas.test.ts  data.test.ts  progression.test.ts  unlock.test.ts
  effects.test.ts  damage.test.ts  battle.test.ts  ai.test.ts  shop.test.ts  stats.test.ts
  run.test.ts  meta.test.ts  save.test.ts  sim.test.ts
docs/balance-log.md        (criado na Task 14)
```

---

### Task 1: Projeto, ferramentas e Rng com semente

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `src/game/Rng.ts`, `tests/rng.test.ts`

**Interfaces:**
- Produces: `class Rng { constructor(seed: number); static fromState(state: number): Rng; get state(): number; next(): number; range(min: number, max: number): number; int(min: number, maxInclusive: number): number; chance(p: number): boolean; pick<T>(items: readonly T[]): T; shuffle<T>(items: readonly T[]): T[] }` — `s` é `protected` para subclasses de teste.

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "ninja-x-rogue",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "sim": "tsx tools/simulate.ts",
    "sim:check": "tsx tools/simulate.ts --check"
  }
}
```

- [ ] **Step 2: Instalar dependências**

Run: `npm install zod@^3.23 && npm install -D typescript@^5.6 vite@^6 vitest@^3 tsx@^4 @types/node@^22`
Expected: `added N packages`, sem erros.

- [ ] **Step 3: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "strict": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "tests", "tools"]
}
```

- [ ] **Step 4: Criar `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

// Neste plano o Vite só serve de configuração para o Vitest.
// O Plano 2 acrescenta a configuração do jogo (Phaser + DOM).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Escrever o teste que falha — `tests/rng.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/game/Rng';

describe('Rng (mulberry32 com semente)', () => {
  it('é determinístico para a mesma semente', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const sa = Array.from({ length: 10 }, () => a.next());
    const sb = Array.from({ length: 10 }, () => b.next());
    expect(sa).toEqual(sb);
  });

  it('sementes diferentes geram sequências diferentes', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it('gera valores em [0, 1)', () => {
    const r = new Rng(7);
    for (let i = 0; i < 5000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('restaura a sequência a partir do estado salvo', () => {
    const a = new Rng(99);
    a.next();
    a.next();
    const b = Rng.fromState(a.state);
    expect(b.next()).toBe(a.next());
  });

  it('int respeita os limites inclusivos', () => {
    const r = new Rng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(r.int(1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('pick lança erro em lista vazia e shuffle não muta a original', () => {
    const r = new Rng(5);
    expect(() => r.pick([])).toThrow();
    const orig = [1, 2, 3, 4, 5];
    const copy = [...orig];
    const shuffled = r.shuffle(orig);
    expect(orig).toEqual(copy);
    expect([...shuffled].sort()).toEqual(copy);
  });
});
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `npx vitest run tests/rng.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/Rng"`.

- [ ] **Step 7: Implementar `src/game/Rng.ts`**

```ts
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
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run tests/rng.test.ts && npx tsc --noEmit`
Expected: 6 testes PASS; `tsc` sem saída.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts src/game/Rng.ts tests/rng.test.ts
git commit -m "chore: estrutura do projeto e Rng com semente

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Tipos de domínio, constantes de balanceamento e fórmulas

**Files:**
- Create: `src/game/types.ts`, `src/game/attributes.ts`, `src/game/Balance.ts`, `src/game/formulas.ts`, `src/game/errors.ts`
- Test: `tests/formulas.test.ts`

**Interfaces:**
- Produces (types.ts): `ATTR_KEYS`, `AttrKey`, `Attributes`, `ELEMENTS`, `Element`, `GRADES`, `Grade`, `CLAN_IDS`, `ClanId`, `JUTSU_CATEGORIES`, `JutsuCategory`, `PHASES`, `Phase`, `STORY_POINTS`, `StoryPointId`, `ControlKind`, `EffectType`, `Modifiers`.
- Produces (attributes.ts): `ATTR_NAMES: Record<AttrKey,string>`, `CATEGORY_ATTR: Record<JutsuCategory, AttrKey>`, `emptyAttributes(v?: number): Attributes`, `addAttributes(a: Attributes, b: Partial<Attributes>): Attributes`, `sumAttributes(a: Partial<Attributes>): number`.
- Produces (Balance.ts): `BALANCE` (estrutura abaixo), `GradeScaling`.
- Produces (formulas.ts): `expectedPoints(level)`, `maxHp(hpAttr, level, mult=1)`, `maxChakra(int, level)`, `chakraRegen(int)`, `defenseReduction(def)`, `totalReduction(def, bonus)`, `dodgeChance(targetVel, attackerVel, bonus=0)`, `critChance(critAttr, bonus=0)`, `elementBeats(a, b)`, `elementMultiplier(atk: Element|null, def: Element|null)`, `xpToNext(level)`, `xpForCommon(storyLevel)`, `controlChance(base, gen, isIllusion, masteryLevel, isBoss)`, `effectChance(base, masteryLevel)` — todas retornam `number` (chances em fração 0..1) exceto `elementBeats` (`boolean`).
- Produces (errors.ts): `class RuleError extends Error { code: string }`.

- [ ] **Step 1: Escrever o teste que falha — `tests/formulas.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import * as F from '../src/game/formulas';
import { addAttributes, emptyAttributes, sumAttributes } from '../src/game/attributes';

describe('fórmulas de base (DD v2 §3 e Apêndice A)', () => {
  it('HP máximo bate com a tabela A.1', () => {
    expect(F.maxHp(7, 1)).toBe(114);
    expect(F.maxHp(11, 5)).toBe(154);
    expect(F.maxHp(7, 1, 1.1)).toBe(125); // Uzumaki
  });

  it('chakra máximo e regeneração', () => {
    expect(F.maxChakra(6, 1)).toBe(40);
    expect(F.maxChakra(7, 5)).toBe(57);
    expect(F.chakraRegen(7)).toBe(2);
    expect(F.chakraRegen(8)).toBe(3);
    expect(F.chakraRegen(16)).toBe(4);
  });

  it('redução de dano pela Defesa (com tetos)', () => {
    expect(F.defenseReduction(10)).toBeCloseTo(0.1667, 3);
    expect(F.defenseReduction(30)).toBeCloseTo(0.375, 5);
    expect(F.defenseReduction(50)).toBeCloseTo(0.5, 5);
    expect(F.defenseReduction(500)).toBe(0.6);
    expect(F.totalReduction(500, 0.5)).toBe(0.75);
    expect(F.totalReduction(10, 0.25)).toBeCloseTo(0.4167, 3);
  });

  it('chance de crítico (curva assintótica, teto 55%)', () => {
    expect(F.critChance(5)).toBeCloseTo(0.0385, 3);
    expect(F.critChance(60)).toBeCloseTo(0.25, 5);
    expect(F.critChance(60, 0.5)).toBe(0.55);
  });

  it('chance de esquiva (teto 40%, piso 0%)', () => {
    expect(F.dodgeChance(10, 10)).toBeCloseTo(0.04, 5);
    expect(F.dodgeChance(100, 10)).toBeCloseTo(0.4, 5);
    expect(F.dodgeChance(0, 30)).toBe(0);
    expect(F.dodgeChance(10, 10, 0.5)).toBeCloseTo(0.4, 5);
  });

  it('roda elemental Fogo → Vento → Raio → Terra → Água → Fogo', () => {
    expect(F.elementMultiplier('fogo', 'vento')).toBe(1.3);
    expect(F.elementMultiplier('agua', 'fogo')).toBe(1.3);
    expect(F.elementMultiplier('terra', 'agua')).toBe(1.3);
    expect(F.elementMultiplier('fogo', 'agua')).toBe(0.8);
    expect(F.elementMultiplier('fogo', 'terra')).toBe(1);
    expect(F.elementMultiplier(null, 'agua')).toBe(1);
    expect(F.elementMultiplier('fogo', null)).toBe(1);
  });

  it('XP e pontos esperados P(N)', () => {
    expect(F.xpToNext(1)).toBe(36);
    expect(F.xpToNext(10)).toBe(144);
    expect([1, 2, 3, 4].reduce((s, n) => s + F.xpToNext(n), 0)).toBe(216);
    expect(F.xpForCommon(1)).toBe(12);
    expect(F.xpForCommon(9)).toBe(44);
    expect(F.expectedPoints(1)).toBe(50);
    expect(F.expectedPoints(10)).toBe(113);
  });

  it('chance de controle (ilusão, maestria, chefe, teto 85%)', () => {
    expect(F.controlChance(0.4, 20, true, 0, false)).toBeCloseTo(0.48, 5);
    expect(F.controlChance(0.4, 20, true, 0, true)).toBeCloseTo(0.24, 5);
    expect(F.controlChance(0.55, 0, false, 5, false)).toBeCloseTo(0.77, 5);
    expect(F.controlChance(0.9, 100, true, 5, false)).toBe(0.85);
  });

  it('chance de efeito comum cresce com a maestria', () => {
    expect(F.effectChance(0.2, 5)).toBeCloseTo(0.28, 5);
    expect(F.effectChance(1, 3)).toBe(1);
  });
});

describe('utilitários de atributos', () => {
  it('cria, soma e totaliza', () => {
    const a = emptyAttributes(5);
    expect(sumAttributes(a)).toBe(40);
    const b = addAttributes(a, { nin: 3, def: 2 });
    expect(b.nin).toBe(8);
    expect(b.def).toBe(7);
    expect(a.nin).toBe(5); // não muta
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/formulas.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/formulas"`.

- [ ] **Step 3: Implementar `src/game/types.ts`**

```ts
/**
 * Tipos de domínio do jogo. As listas "as const" existem para que o mesmo
 * conjunto de valores sirva tanto para o TypeScript (tipos) quanto para o
 * Zod (validação dos dados em tempo de execução).
 */
export const ATTR_KEYS = ['hp', 'tai', 'nin', 'gen', 'vel', 'int', 'crit', 'def'] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];
export type Attributes = Record<AttrKey, number>;

/** Ordem da roda: cada elemento vence o seguinte (o último vence o primeiro). */
export const ELEMENTS = ['fogo', 'vento', 'raio', 'terra', 'agua'] as const;
export type Element = (typeof ELEMENTS)[number];

/** "Grau" = escala D..S de jutsus, inimigos e itens (nunca chamar de "rank"). */
export const GRADES = ['D', 'D+', 'C', 'B', 'A', 'S'] as const;
export type Grade = (typeof GRADES)[number];

export const CLAN_IDS = ['uchiha', 'uzumaki', 'semcla', 'hyuuga', 'nara', 'akimichi', 'aburame'] as const;
export type ClanId = (typeof CLAN_IDS)[number];

export const JUTSU_CATEGORIES = ['ninjutsu', 'taijutsu', 'genjutsu', 'fuinjutsu'] as const;
export type JutsuCategory = (typeof JUTSU_CATEGORIES)[number];

export const PHASES = ['F0', 'F1A', 'F1B', 'F2', 'F3', 'Futuro'] as const;
export type Phase = (typeof PHASES)[number];

/**
 * Pontos da história em ordem cronológica. "saga mínima" de um jutsu
 * compara posições nesta lista.
 */
export const STORY_POINTS = [
  'inicio',
  'onda',
  'onda_pos_zabuza',
  'exame_chunin_inicio',
  'exame_chunin_floresta',
  'exame_chunin_preliminares',
  'exame_chunin',
  'exame_chunin_finais',
  'busca_tsunade',
  'recuperacao_sasuke',
  'shippuden',
  'perseguicao_itachi',
] as const;
export type StoryPointId = (typeof STORY_POINTS)[number];

export type ControlKind = 'immobilized' | 'stunned' | 'illusion';
export type EffectType = 'buff' | 'debuff' | 'control' | 'dot' | 'transformation';

/**
 * Modificadores de combate/economia. Todos em FRAÇÃO (0.10 = 10%).
 * Somam-se de forma aditiva (spec C2: um único "balde" de bônus).
 */
export interface Modifiers {
  attrPct?: Partial<Record<AttrKey, number>>;
  dodge?: number;
  crit?: number;
  damagePct?: number;
  jutsuDamagePct?: number;
  elementDamagePct?: Partial<Record<Element, number>>;
  reduction?: number;
  chakraCostPct?: number;
  ryoPct?: number;
  repPct?: number;
  shopPricePct?: number;
}
```

- [ ] **Step 4: Implementar `src/game/attributes.ts`**

```ts
import { ATTR_KEYS, type AttrKey, type Attributes, type JutsuCategory } from './types';

export const ATTR_NAMES: Record<AttrKey, string> = {
  hp: 'HP',
  tai: 'Taijutsu',
  nin: 'Ninjutsu',
  gen: 'Genjutsu',
  vel: 'Velocidade',
  int: 'Inteligência',
  crit: 'Chance de Crítico',
  def: 'Defesa',
};

/** Qual atributo escala o dano de cada categoria de jutsu (DD v2 §8). */
export const CATEGORY_ATTR: Record<JutsuCategory, AttrKey> = {
  ninjutsu: 'nin',
  taijutsu: 'tai',
  genjutsu: 'gen',
  fuinjutsu: 'int',
};

export function emptyAttributes(value = 0): Attributes {
  return { hp: value, tai: value, nin: value, gen: value, vel: value, int: value, crit: value, def: value };
}

/** Soma b em a e devolve um objeto novo (não muta a). */
export function addAttributes(a: Attributes, b: Partial<Attributes>): Attributes {
  const out = { ...a };
  for (const k of ATTR_KEYS) out[k] += b[k] ?? 0;
  return out;
}

export function sumAttributes(a: Partial<Attributes>): number {
  return ATTR_KEYS.reduce((s, k) => s + (a[k] ?? 0), 0);
}
```

- [ ] **Step 5: Implementar `src/game/errors.ts`**

```ts
/**
 * Erro de regra do jogo (ação inválida, compra sem ryo, etc.).
 * O `code` é estável e pode ser usado pela interface para decidir a mensagem.
 */
export class RuleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RuleError';
  }
}
```

- [ ] **Step 6: Implementar `src/game/Balance.ts`**

```ts
import type { Grade } from './types';

/**
 * TODAS as constantes de balanceamento do jogo vivem aqui.
 * POR QUÊ: mudar um número não pode exigir caçar valores espalhados pelo código.
 * Toda mudança neste arquivo deve ser conferida com `npm run sim:check`.
 * Fonte: DD v2 §3, §7, §9, §10, §11 e Apêndice A, com as correções da spec §3.
 */
export interface GradeScaling {
  /** Fração de P(N) que o inimigo recebe em pontos de atributo. */
  pointsRatio: number;
  hpMult: number;
  /** Multiplica o Poder dos golpes do inimigo. */
  damageMult: number;
}

const enemyGrades: Record<Grade, GradeScaling> = {
  D: { pointsRatio: 0.7, hpMult: 0.8, damageMult: 0.6 },
  'D+': { pointsRatio: 0.9, hpMult: 1.0, damageMult: 0.8 },
  C: { pointsRatio: 1.1, hpMult: 1.3, damageMult: 0.72 },
  B: { pointsRatio: 1.2, hpMult: 1.5, damageMult: 0.8 }, // spec C6: HP 1,3 → 1,5
  A: { pointsRatio: 1.35, hpMult: 1.5, damageMult: 0.9 },
  S: { pointsRatio: 1.5, hpMult: 1.7, damageMult: 1.0 },
};

const rewards: Partial<Record<Grade, { ryo: number; rep: number }>> = {
  D: { ryo: 30, rep: 22 },
  'D+': { ryo: 50, rep: 38 },
  C: { ryo: 200, rep: 160 },
  B: { ryo: 300, rep: 240 },
  A: { ryo: 500, rep: 400 },
};

const bossXpMult: Partial<Record<Grade, number>> = { C: 4, B: 4, A: 6, S: 6 };

export const BALANCE = {
  attributes: { start: 5, creationPoints: 10, expectedBase: 50, expectedPerLevel: 7 },
  hp: { base: 80, perPoint: 4, perLevel: 6 },
  chakra: { base: 30, perLevel: 4, perInt: 1, regenBase: 2, regenIntDivisor: 8 },
  damage: {
    attrDivisor: 40,
    critMultiplier: 1.5,
    varianceMin: 0.9,
    varianceMax: 1.1,
    elementAdvantage: 1.3,
    elementDisadvantage: 0.8,
  },
  power: { D: 26, C: 40, B: 60, A: 90, S: 130, attack: 18 },
  defense: { k: 50, cap: 0.6, totalCap: 0.75 },
  dodge: { basePct: 4, perVelPct: 0.8, capPct: 40 },
  crit: { scalePct: 50, k: 60, capPct: 55 },
  turnOrderJitter: 0.1,
  battle: { maxRounds: 200 },
  actions: { defendDamageMult: 0.5, defendChakraPct: 0.1, meditateChakraPct: 0.25 },
  recovery: { encounterHpPct: 0.25, encounterChakraPct: 0.5, levelUpHpPct: 0.25 },
  control: {
    maxTurnsCommon: 2,
    maxTurnsBoss: 1,
    bossChanceMult: 0.5,
    chanceCap: 0.85,
    tenacityTurns: 2,
    genjutsuDivisor: 100,
  },
  mastery: {
    stepUses: [6, 9, 12, 15, 18],
    costPerLevel: 0.05,
    damagePerLevel: 0.03,
    effectChancePerLevel: 0.08,
    maxLevel: 5,
    maxLevelOffAffinity: 3,
  },
  cost: { offAffinityMult: 1.25 },
  xp: { toNextBase: 24, toNextPerLevel: 12, commonBase: 8, commonPerLevel: 4, eliteMult: 1.6, bossMult: bossXpMult },
  enemyGrades,
  rewards,
  loadout: { geninSlots: 4 },
  shop: { equipmentOffers: 2, rareScrollsPerStock: 1, rareScrollMaxPerRun: 5, rewardRyo: 60, trainingUses: 4 },
  history: { maxEntries: 50 },
};
```

- [ ] **Step 7: Implementar `src/game/formulas.ts`**

```ts
import { BALANCE as B } from './Balance';
import { ELEMENTS, type Element } from './types';

/**
 * Fórmulas puras do DD v2 §3. Chances são devolvidas como FRAÇÃO (0..1).
 * Nada aqui sorteia: quem sorteia é o combate, usando o Rng.
 */

/** P(N): pontos totais esperados de um personagem de clã no nível N. */
export function expectedPoints(level: number): number {
  return B.attributes.expectedBase + B.attributes.expectedPerLevel * (level - 1);
}

export function maxHp(hpAttr: number, level: number, mult = 1): number {
  return Math.round((B.hp.base + B.hp.perPoint * hpAttr + B.hp.perLevel * level) * mult);
}

export function maxChakra(int: number, level: number): number {
  return B.chakra.base + B.chakra.perLevel * level + B.chakra.perInt * Math.floor(int);
}

export function chakraRegen(int: number): number {
  return B.chakra.regenBase + Math.floor(int / B.chakra.regenIntDivisor);
}

/** Redução só pela Defesa: mín(60%, Def/(Def+50)). */
export function defenseReduction(def: number): number {
  if (def <= 0) return 0;
  return Math.min(B.defense.cap, def / (def + B.defense.k));
}

/** Defesa + bônus de efeitos (ex.: Doryuuheki), com teto total de 75% (spec §4). */
export function totalReduction(def: number, bonus: number): number {
  return Math.min(B.defense.totalCap, defenseReduction(def) + bonus);
}

export function dodgeChance(targetVel: number, attackerVel: number, bonus = 0): number {
  const basePct = Math.min(B.dodge.capPct, Math.max(0, B.dodge.basePct + B.dodge.perVelPct * (targetVel - attackerVel)));
  return Math.min(B.dodge.capPct / 100, basePct / 100 + bonus);
}

export function critChance(critAttr: number, bonus = 0): number {
  const fromAttr = critAttr <= 0 ? 0 : (B.crit.scalePct * critAttr) / (critAttr + B.crit.k) / 100;
  return Math.min(B.crit.capPct / 100, fromAttr + bonus);
}

/** true se o elemento a vence o elemento b na roda. */
export function elementBeats(a: Element, b: Element): boolean {
  const i = ELEMENTS.indexOf(a);
  return ELEMENTS[(i + 1) % ELEMENTS.length] === b;
}

export function elementMultiplier(atk: Element | null, def: Element | null): number {
  if (!atk || !def) return 1;
  if (elementBeats(atk, def)) return B.damage.elementAdvantage;
  if (elementBeats(def, atk)) return B.damage.elementDisadvantage;
  return 1;
}

export function xpToNext(level: number): number {
  return B.xp.toNextBase + B.xp.toNextPerLevel * level;
}

export function xpForCommon(storyLevel: number): number {
  return B.xp.commonBase + B.xp.commonPerLevel * storyLevel;
}

/**
 * Chance de aplicar controle (DD v2 §10):
 * base × (1 + Gen/100 se ilusão) × (1 + 0,08·maestria) × (0,5 se chefe), teto 85%.
 */
export function controlChance(
  base: number,
  gen: number,
  isIllusion: boolean,
  masteryLevel: number,
  isBoss: boolean,
): number {
  let p = base * (1 + (isIllusion ? gen / B.control.genjutsuDivisor : 0));
  p *= 1 + B.mastery.effectChancePerLevel * masteryLevel;
  if (isBoss) p *= B.control.bossChanceMult;
  return Math.min(B.control.chanceCap, p);
}

/** Chance de efeito que não é controle (queimadura, lentidão...): +8% relativo por nível. */
export function effectChance(base: number, masteryLevel: number): number {
  return Math.min(1, base * (1 + B.mastery.effectChancePerLevel * masteryLevel));
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run tests/formulas.test.ts && npx tsc --noEmit`
Expected: todos PASS; `tsc` sem saída.

- [ ] **Step 9: Commit**

```bash
git add src/game/types.ts src/game/attributes.ts src/game/Balance.ts src/game/formulas.ts src/game/errors.ts tests/formulas.test.ts
git commit -m "feat: tipos de domínio, constantes de balanceamento e fórmulas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Dados do jogo (efeitos, jutsus, clãs, itens, inimigos, saga, títulos) + validação

**Files:**
- Create: `src/data/story.ts`, `src/data/effects.ts`, `src/data/jutsus.ts`, `src/data/clans.ts`, `src/data/items.ts`, `src/data/enemies.ts`, `src/data/saga.ts`, `src/data/titles.ts`, `src/data/validate.ts`
- Test: `tests/data.test.ts`

**Interfaces:**
- Consumes: tudo de `src/game/types.ts`, `ATTR_NAMES` de `attributes.ts`.
- Produces:
  - `storyIndex(id: StoryPointId): number`, `STORY_NAMES: Record<StoryPointId,string>`
  - `interface EffectDef { id; name; type: EffectType; icon: string; controlKind?: ControlKind; mods?: Modifiers; dotPctMaxHp?: number; charge?: 'negateHit'|'absorbHit'|'missChance'; chargeChance?: number; duration: number|'battle'|'sustained'; removableByKai?: boolean; activationCost?: number; activationCostsTurn?: boolean; upkeepPerTurn?: number; description: string }`, `EFFECT_LIST: EffectDef[]`, `EFFECTS: Record<string, EffectDef>`, `REFORCO_ATTRS: readonly ['tai','nin','gen','vel','def']`, `type ReforcoAttr`
  - `interface JutsuEffectSpec { effectId: string; target: 'self'|'enemy'; chance: number; duration?: number }`, `interface JutsuDef { id; name; category: JutsuCategory; element: Element|null; clan: ClanId|null; requires: Partial<Attributes>; prereq: string|null; minStory: StoryPointId; grade: Grade; cost: number; power: number|null; effects: JutsuEffectSpec[]; phase: Phase; enemyOnly?: boolean; inheritance?: boolean; cleanse?: boolean; description: string }`, `JUTSU_LIST`, `JUTSUS: Record<string, JutsuDef>`
  - `interface ClanDef { id: ClanId; name; playable: boolean; highlights: AttrKey[]; freePointsPerLevel: number; hpMult: number; meditateBonus: number; fixedAffinity: Element|null; passiveMods: Modifiers; transformationId: string|null; ignoresAffinityPenalty: boolean; generalJutsuCostMult: number; masteryUseMult: number; jutsuCostMult: Record<string, number>; description }`, `CLANS: Record<ClanId, ClanDef>`, `PLAYABLE_CLANS: ClanId[]`
  - `interface ItemDef { id; name; kind: 'consumable'|'weapon'|'armor'|'rareScroll'; grade: Grade; price: number; attrBonus?: Partial<Attributes>; heal?: { hpPct?: number; chakraPct?: number }; buffAttr?: boolean; description }`, `ITEM_LIST`, `ITEMS`, `EQUIPMENT_POOL: string[]`, `CONSUMABLE_IDS: string[]`
  - `type ArchetypeId = 'bruto'|'ninja'|'espadachim'|'agil'`, `ARCHETYPES: Record<ArchetypeId, Attributes>` (pesos), `type AiId = 'basic'|'zabuza'|'haku'`, `interface EnemyTemplate { id; name; archetype: ArchetypeId; grade: Grade; element: Element|null; jutsus: string[]; ai: AiId; isBoss: boolean }`, `ENEMY_LIST`, `ENEMIES`, `ELITE_OF: Record<string,string>`
  - `interface SagaNodeDef { index: number; kind: 'common'|'boss'; storyLevel: number; pool: string[]; bossId: string|null; campBefore: boolean; advancesStoryTo: StoryPointId|null }`, `interface SagaDef { id: string; name: string; startStory: StoryPointId; nodes: SagaNodeDef[] }`, `SAGA_ONDA: SagaDef`
  - `type TitleCondition` (união abaixo), `interface TitleDef { id; name; condition: TitleCondition; mods: Modifiers; hidden: boolean; description }`, `TITLE_LIST`, `TITLES`
  - `interface GameData { jutsus: JutsuDef[]; effects: EffectDef[]; items: ItemDef[]; enemies: EnemyTemplate[]; titles: TitleDef[]; saga: SagaDef; clans: ClanDef[] }`, `DEFAULT_DATA: GameData`, `validateGameData(data?: GameData): string[]`, `assertGameData(data?: GameData): void`

- [ ] **Step 1: Escrever o teste que falha — `tests/data.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_DATA, validateGameData, assertGameData } from '../src/data/validate';
import { SAGA_ONDA } from '../src/data/saga';
import { JUTSUS } from '../src/data/jutsus';
import { ARCHETYPES } from '../src/data/enemies';
import { sumAttributes } from '../src/game/attributes';
import { storyIndex } from '../src/data/story';

describe('dados do jogo', () => {
  it('passam na validação de esquema e de referências', () => {
    expect(validateGameData()).toEqual([]);
    expect(() => assertGameData()).not.toThrow();
  });

  it('acusa pré-requisito inexistente', () => {
    const jutsus = DEFAULT_DATA.jutsus.map((j) => (j.id === 'rasengan' ? { ...j, prereq: 'nao_existe' } : j));
    const issues = validateGameData({ ...DEFAULT_DATA, jutsus });
    expect(issues.some((i) => i.includes('nao_existe'))).toBe(true);
  });

  it('acusa efeito inexistente e id duplicado', () => {
    const bad = { ...JUTSUS['bola_de_fogo']!, effects: [{ effectId: 'xyz', target: 'enemy' as const, chance: 0.1 }] };
    const issues = validateGameData({ ...DEFAULT_DATA, jutsus: [...DEFAULT_DATA.jutsus, bad] });
    expect(issues.some((i) => i.includes('xyz'))).toBe(true);
    expect(issues.some((i) => i.includes('duplicado'))).toBe(true);
  });

  it('acusa custo negativo (esquema Zod)', () => {
    const jutsus = DEFAULT_DATA.jutsus.map((j) => (j.id === 'kai' ? { ...j, cost: -1 } : j));
    expect(validateGameData({ ...DEFAULT_DATA, jutsus }).length).toBeGreaterThan(0);
  });

  it('Saga da Onda tem 26 nós com os níveis do Apêndice A.3', () => {
    const n = SAGA_ONDA.nodes;
    expect(n).toHaveLength(26);
    expect(n.map((x) => x.storyLevel)).toEqual([
      1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10,
    ]);
    expect(n[12]).toMatchObject({ kind: 'boss', bossId: 'zabuza', campBefore: true, advancesStoryTo: 'onda_pos_zabuza' });
    expect(n[25]).toMatchObject({ kind: 'boss', bossId: 'haku', campBefore: true });
  });

  it('pesos de arquétipo somam 100%', () => {
    for (const w of Object.values(ARCHETYPES)) expect(sumAttributes(w)).toBeCloseTo(1, 6);
  });

  it('Gogyou Fuuin é geral e F2 (spec C7); Suiryuudan só após Zabuza', () => {
    expect(JUTSUS['gogyou_fuuin']).toMatchObject({ clan: null, phase: 'F2' });
    expect(storyIndex(JUTSUS['suiryuudan']!.minStory)).toBeGreaterThan(storyIndex('onda'));
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/data.test.ts`
Expected: FAIL — `Failed to resolve import "../src/data/validate"`.

- [ ] **Step 3: Implementar `src/data/story.ts`**

```ts
import { STORY_POINTS, type StoryPointId } from '../game/types';

export const STORY_NAMES: Record<StoryPointId, string> = {
  inicio: 'Início',
  onda: 'Saga da Onda',
  onda_pos_zabuza: 'Saga da Onda (após Zabuza)',
  exame_chunin_inicio: 'Exame Chunin (início)',
  exame_chunin_floresta: 'Exame Chunin (Floresta da Morte)',
  exame_chunin_preliminares: 'Exame Chunin (Preliminares)',
  exame_chunin: 'Exame Chunin (mês de treino)',
  exame_chunin_finais: 'Exame Chunin (Finais)',
  busca_tsunade: 'Busca por Tsunade',
  recuperacao_sasuke: 'Recuperação do Sasuke',
  shippuden: 'Shippuden',
  perseguicao_itachi: 'Perseguição a Itachi',
};

/** Posição cronológica; usada para comparar "saga mínima" com o ponto atual. */
export function storyIndex(id: StoryPointId): number {
  return STORY_POINTS.indexOf(id);
}
```

- [ ] **Step 4: Implementar `src/data/effects.ts`**

```ts
import { ATTR_NAMES } from '../game/attributes';
import type { AttrKey, ControlKind, EffectType, Modifiers } from '../game/types';

/**
 * Definição de um efeito (DD v2 §10). Um único formato cobre buff, debuff,
 * controle, dano contínuo e transformação — por isso Modo Sábio/Bijuu no
 * futuro são só dados novos, não código novo.
 */
export interface EffectDef {
  id: string;
  name: string;
  type: EffectType;
  icon: string;
  controlKind?: ControlKind;
  mods?: Modifiers;
  /** Dano contínuo: fração do HP máximo do alvo por turno. */
  dotPctMaxHp?: number;
  /** Carga consumida pelo próximo golpe recebido. */
  charge?: 'negateHit' | 'absorbHit' | 'missChance';
  /** Para 'missChance': probabilidade de o golpe errar. */
  chargeChance?: number;
  /** Turnos do PRÓPRIO portador; 'sustained' = enquanto pagar o custo. */
  duration: number | 'battle' | 'sustained';
  removableByKai?: boolean;
  activationCost?: number;
  activationCostsTurn?: boolean;
  upkeepPerTurn?: number;
  description: string;
}

export const REFORCO_ATTRS = ['tai', 'nin', 'gen', 'vel', 'def'] as const;
export type ReforcoAttr = (typeof REFORCO_ATTRS)[number];

const reforcos: EffectDef[] = REFORCO_ATTRS.map((a) => ({
  id: `reforco_${a}`,
  name: `Reforço de ${ATTR_NAMES[a]}`,
  type: 'buff' as const,
  icon: 'scroll',
  mods: { attrPct: { [a]: 0.1 } as Partial<Record<AttrKey, number>> },
  duration: 5,
  description: `+10% de ${ATTR_NAMES[a]} por 5 turnos.`,
}));

export const EFFECT_LIST: EffectDef[] = [
  { id: 'queimadura', name: 'Queimadura', type: 'dot', icon: 'burn', dotPctMaxHp: 0.04, duration: 3, description: 'Perde 4% do HP máximo por turno.' },
  { id: 'defesa_reduzida', name: 'Defesa Reduzida', type: 'debuff', icon: 'def-down', mods: { attrPct: { def: -0.05 } }, duration: 2, description: '−5% de Defesa.' },
  { id: 'lentidao', name: 'Lentidão', type: 'debuff', icon: 'slow', mods: { attrPct: { vel: -0.2 } }, duration: 2, description: '−20% de Velocidade.' },
  { id: 'imobilizado', name: 'Imobilizado', type: 'control', icon: 'chains', controlKind: 'immobilized', duration: 2, description: 'Não pode agir.' },
  { id: 'atordoado', name: 'Atordoado', type: 'control', icon: 'stun', controlKind: 'stunned', duration: 1, description: 'Não pode agir.' },
  { id: 'ilusao', name: 'Ilusão', type: 'control', icon: 'eye', controlKind: 'illusion', duration: 1, removableByKai: true, description: 'Preso num genjutsu: só pode usar Kai.' },
  { id: 'henge', name: 'Henge', type: 'buff', icon: 'mask', charge: 'missChance', chargeChance: 0.3, duration: 1, description: '30% de chance de o próximo golpe inimigo errar.' },
  { id: 'bunshin', name: 'Clones Ilusórios', type: 'buff', icon: 'clones', mods: { dodge: 0.12 }, duration: 2, description: '+12% de esquiva.' },
  { id: 'kawarimi', name: 'Substituição', type: 'buff', icon: 'log', charge: 'negateHit', duration: 2, description: 'Anula o próximo golpe recebido.' },
  { id: 'doryuuheki', name: 'Muralha de Lama', type: 'buff', icon: 'wall', mods: { reduction: 0.25 }, duration: 3, description: '+25% de redução de dano.' },
  { id: 'kage_bunshin', name: 'Clones das Sombras', type: 'buff', icon: 'shadow-clones', mods: { jutsuDamagePct: 0.25 }, charge: 'absorbHit', duration: 3, description: '+25% de dano em jutsus; um clone absorve 1 golpe.' },
  { id: 'nevoa', name: 'Névoa', type: 'buff', icon: 'mist', mods: { dodge: 0.15 }, duration: 3, description: '+15% de esquiva.' },
  { id: 'makyou', name: 'Espelhos de Gelo', type: 'buff', icon: 'mirrors', mods: { dodge: 0.25 }, duration: 3, description: '+25% de esquiva.' },
  {
    id: 'sharingan',
    name: 'Sharingan',
    type: 'transformation',
    icon: 'sharingan',
    mods: { crit: 0.14, dodge: 0.1, jutsuDamagePct: 0.15 },
    duration: 'sustained',
    activationCost: 0,
    activationCostsTurn: false,
    upkeepPerTurn: 2,
    description: 'Transformação (tomoe 1): +14% de crítico, +10% de esquiva e +15% de dano de jutsus. Custa 2 de chakra por turno.',
  },
  ...reforcos,
];

export const EFFECTS: Record<string, EffectDef> = Object.fromEntries(EFFECT_LIST.map((e) => [e.id, e]));
```

- [ ] **Step 5: Implementar `src/data/jutsus.ts`**

```ts
import type { Attributes, ClanId, Element, Grade, JutsuCategory, Phase, StoryPointId } from '../game/types';

export interface JutsuEffectSpec {
  effectId: string;
  target: 'self' | 'enemy';
  /** Chance base (0..1). Controle passa por controlChance; o resto por effectChance. */
  chance: number;
  /** Para controle: duração pedida (o motor limita a 2 em comuns e 1 em chefes). */
  duration?: number;
}

export interface JutsuDef {
  id: string;
  name: string;
  category: JutsuCategory;
  element: Element | null;
  clan: ClanId | null;
  /** Requisitos de atributo BASE (spec §5). */
  requires: Partial<Attributes>;
  prereq: string | null;
  minStory: StoryPointId;
  grade: Grade;
  cost: number;
  /** null = jutsu sem dano direto. */
  power: number | null;
  effects: JutsuEffectSpec[];
  phase: Phase;
  /** Golpes exclusivos de inimigos (não aparecem na Enciclopédia). */
  enemyOnly?: boolean;
  /** Regra de Herança de clã (DD v2 §8). */
  inheritance?: boolean;
  /** Kai: remove Ilusão/efeitos de Genjutsu de si mesmo. */
  cleanse?: boolean;
  description: string;
}

/** Atalho para jutsus que só existem na Enciclopédia (fases futuras, sem efeito mecânico no MVP). */
function future(
  id: string,
  name: string,
  category: JutsuCategory,
  element: Element | null,
  clan: ClanId | null,
  requires: Partial<Attributes>,
  prereq: string | null,
  minStory: StoryPointId,
  grade: Grade,
  cost: number,
  power: number | null,
  phase: Phase,
  description: string,
  inheritance = false,
): JutsuDef {
  return { id, name, category, element, clan, requires, prereq, minStory, grade, cost, power, effects: [], phase, inheritance, description };
}

export const JUTSU_LIST: JutsuDef[] = [
  // ---------- Gerais jogáveis no MVP (Apêndice B.1) ----------
  { id: 'henge', name: 'Henge no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { nin: 5 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 6, power: null, effects: [{ effectId: 'henge', target: 'self', chance: 1 }], phase: 'F1B', description: 'Transformação: 30% de chance de o próximo golpe inimigo errar.' },
  { id: 'bunshin', name: 'Bunshin no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { nin: 5 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: null, effects: [{ effectId: 'bunshin', target: 'self', chance: 1 }], phase: 'F1A', description: 'Clones ilusórios: +12% de esquiva por 2 turnos.' },
  { id: 'kawarimi', name: 'Kawarimi no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { vel: 8 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 10, power: null, effects: [{ effectId: 'kawarimi', target: 'self', chance: 1 }], phase: 'F1A', description: 'Substituição por um tronco: anula o próximo golpe recebido (2 turnos).' },
  { id: 'bola_de_fogo', name: 'Bola de Fogo Básica', category: 'ninjutsu', element: 'fogo', clan: null, requires: { nin: 6 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: 26, effects: [{ effectId: 'queimadura', target: 'enemy', chance: 0.15 }], phase: 'F0', description: 'Pequena bola de fogo: dano e 15% de Queimadura.' },
  { id: 'sennen_goroshi', name: 'Sennen Goroshi', category: 'taijutsu', element: null, clan: null, requires: { tai: 6 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: 26, effects: [{ effectId: 'defesa_reduzida', target: 'enemy', chance: 1 }], phase: 'F0', description: 'O "Mil Anos de Dor" de Kakashi: dano e −5% de Defesa do alvo por 2 turnos.' },
  { id: 'investida_ninja', name: 'Investida Ninja', category: 'taijutsu', element: null, clan: null, requires: { tai: 12 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 14, power: 40, effects: [], phase: 'F0', description: 'Técnica de Academia: investida de corpo inteiro (nome genérico, não canônico).' },
  { id: 'kai', name: 'Kai', category: 'genjutsu', element: null, clan: null, requires: { gen: 8 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 6, power: null, effects: [], cleanse: true, phase: 'F1A', description: 'Dispersa o fluxo de chakra: remove Ilusão e efeitos de Genjutsu de si mesmo.' },
  { id: 'daitoppa', name: 'Fuuton: Daitoppa', category: 'ninjutsu', element: 'vento', clan: null, requires: { nin: 12 }, prereq: null, minStory: 'onda', grade: 'C', cost: 14, power: 40, effects: [{ effectId: 'lentidao', target: 'enemy', chance: 0.25 }], phase: 'F1A', description: 'Rajada de vento: dano e 25% de reduzir a Velocidade do alvo.' },
  { id: 'doryuuheki', name: 'Doton: Doryuuheki', category: 'ninjutsu', element: 'terra', clan: null, requires: { nin: 12 }, prereq: null, minStory: 'onda', grade: 'C', cost: 14, power: null, effects: [{ effectId: 'doryuuheki', target: 'self', chance: 1 }], phase: 'F1B', description: 'Muralha de lama: +25% de redução de dano por 3 turnos.' },
  { id: 'suiryuudan', name: 'Suiton: Suiryuudan no Jutsu', category: 'ninjutsu', element: 'agua', clan: null, requires: { nin: 22 }, prereq: null, minStory: 'onda_pos_zabuza', grade: 'B', cost: 22, power: 60, effects: [], phase: 'F1A', description: 'O dragão de água usado por Zabuza.' },
  { id: 'kage_bunshin', name: 'Kage Bunshin no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { nin: 20 }, prereq: null, minStory: 'onda', grade: 'B', cost: 24, power: null, effects: [{ effectId: 'kage_bunshin', target: 'self', chance: 1 }], phase: 'F1A', description: 'Clones reais: +25% de dano em jutsus por 3 turnos e um clone absorve 1 golpe.' },

  // ---------- Clã jogáveis no MVP (B.2 / B.3) ----------
  { id: 'kongou_fuusa', name: 'Kongou Fuusa', category: 'fuinjutsu', element: null, clan: 'uzumaki', requires: { int: 14, nin: 8 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 16, power: null, effects: [{ effectId: 'imobilizado', target: 'enemy', chance: 0.55, duration: 2 }], phase: 'F1A', inheritance: true, description: 'Correntes de chakra adamantinas: 55% de imobilizar (1 a 2 turnos).' },
  { id: 'goukakyuu', name: 'Katon: Goukakyuu no Jutsu', category: 'ninjutsu', element: 'fogo', clan: 'uchiha', requires: { nin: 12 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 14, power: 40, effects: [{ effectId: 'queimadura', target: 'enemy', chance: 0.25 }], phase: 'F1A', inheritance: true, description: 'A grande bola de fogo do clã Uchiha: dano e 25% de Queimadura.' },
  { id: 'genjutsu_sharingan', name: 'Genjutsu: Sharingan', category: 'genjutsu', element: null, clan: 'uchiha', requires: { gen: 10 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 12, power: null, effects: [{ effectId: 'ilusao', target: 'enemy', chance: 0.4, duration: 1 }], phase: 'F1A', inheritance: true, description: 'Ilusão pelo olhar: 40% de prender o alvo num genjutsu (1 turno).' },

  // ---------- Fases futuras (só Enciclopédia) ----------
  future('konoha_senpuu', 'Konoha Senpuu', 'taijutsu', null, null, { tai: 14 }, null, 'exame_chunin_inicio', 'C', 14, 40, 'F2', 'Chute giratório da Folha.'),
  future('jubaku_satsu', 'Magen: Jubaku Satsu', 'genjutsu', null, null, { gen: 14 }, null, 'exame_chunin_inicio', 'C', 16, null, 'F2', 'Ilusão da árvore que prende o alvo.'),
  future('nehan_shouja', 'Magen: Nehan Shouja no Jutsu', 'genjutsu', null, null, { gen: 20 }, null, 'exame_chunin', 'B', 22, null, 'F2', 'Penas ilusórias que adormecem.'),
  future('gogyou_fuuin', 'Fuuinjutsu: Gogyou Fuuin', 'fuinjutsu', null, null, { int: 22 }, null, 'exame_chunin_floresta', 'B', 22, null, 'F2', 'Selo dos Cinco Elementos: sela buffs e passivas do alvo.'),
  future('naruto_rendan', 'Uzumaki Naruto Rendan', 'taijutsu', null, null, { tai: 20, nin: 12 }, 'kage_bunshin', 'exame_chunin_preliminares', 'B', 24, 70, 'F2', 'Combo de clones em sequência.'),
  future('shishi_rendan', 'Shishi Rendan', 'taijutsu', null, null, { tai: 22, vel: 14 }, null, 'exame_chunin_finais', 'B', 22, 65, 'F2', 'Combo do Leão: dois golpes.'),
  future('chidori', 'Chidori', 'ninjutsu', 'raio', null, { nin: 30, vel: 18 }, null, 'exame_chunin', 'A', 38, 100, 'F2', 'Mil pássaros: estocada de raio.'),
  future('rasengan', 'Rasengan', 'ninjutsu', null, null, { nin: 32, int: 15 }, 'kage_bunshin', 'busca_tsunade', 'A', 40, 100, 'F3', 'Esfera espiral de chakra puro.'),
  future('kuchiyose', 'Kuchiyose no Jutsu', 'ninjutsu', null, null, { nin: 25, int: 20 }, null, 'busca_tsunade', 'A', 40, null, 'Futuro', 'Invoca um aliado.'),
  future('rasen_shuriken', 'Fuuton: Rasen Shuriken', 'ninjutsu', 'vento', null, { nin: 45, int: 30 }, 'rasengan', 'shippuden', 'S', 70, 160, 'Futuro', 'Rasengan com natureza Vento.'),
  future('omote_renge', 'Omote Renge', 'taijutsu', null, null, { tai: 40, vel: 30 }, null, 'exame_chunin_preliminares', 'S', 60, 150, 'Futuro', 'Lótus Primária (Oito Portões).'),
  future('hakke_no_fuuin_shiki', 'Hakke no Fuuin Shiki', 'fuinjutsu', null, 'uzumaki', { int: 30, nin: 20 }, null, 'shippuden', 'A', 36, null, 'F3', 'Selo dos Oito Trigramas.'),
  future('ryuuka', 'Katon: Ryuuka no Jutsu', 'ninjutsu', 'fogo', 'uchiha', { nin: 24 }, null, 'exame_chunin', 'B', 24, 65, 'F2', 'Fogo do dragão.'),
  future('amaterasu', 'Amaterasu', 'ninjutsu', null, 'uchiha', { gen: 40, nin: 25 }, null, 'perseguicao_itachi', 'S', 50, 130, 'Futuro', 'Chamas negras que não se apagam.'),
  future('tsukuyomi', 'Tsukuyomi', 'genjutsu', null, 'uchiha', { gen: 42, nin: 20 }, null, 'perseguicao_itachi', 'S', 50, null, 'Futuro', 'Genjutsu supremo do Mangekyou.'),
  future('jyuuken', 'Jyuuken', 'taijutsu', null, 'hyuuga', { tai: 10 }, null, 'inicio', 'C', 12, 40, 'F2', 'Punho Gentil.', true),
  future('hakke_sanjuuni', 'Hakke Sanjuuni Shou', 'taijutsu', null, 'hyuuga', { tai: 18 }, null, 'exame_chunin', 'B', 22, 60, 'F2', 'Trinta e Duas Palmas.'),
  future('kaiten', 'Kaiten', 'taijutsu', null, 'hyuuga', { tai: 22, vel: 12 }, null, 'exame_chunin_preliminares', 'B', 22, null, 'F2', 'Rotação Celestial.'),
  future('hakke_rokujuuyon', 'Hakke Rokujuuyon Shou', 'taijutsu', null, 'hyuuga', { tai: 34, vel: 20 }, null, 'exame_chunin_finais', 'A', 38, 100, 'F2', 'Sessenta e Quatro Palmas.'),
  future('kagemane', 'Kagemane no Jutsu', 'ninjutsu', null, 'nara', { nin: 10, int: 12 }, null, 'exame_chunin_floresta', 'C', 14, null, 'F2', 'Imitação da Sombra.'),
  future('kagenui', 'Kagenui no Jutsu', 'ninjutsu', null, 'nara', { nin: 18, int: 16 }, null, 'exame_chunin', 'B', 22, 45, 'F2', 'Costura da Sombra.'),
  future('kage_kubishibari', 'Kage Kubishibari no Jutsu', 'ninjutsu', null, 'nara', { nin: 22, int: 18 }, null, 'exame_chunin_finais', 'B', 24, 50, 'F2', 'Estrangulamento da Sombra.'),
  future('bubun_baika', 'Bubun Baika no Jutsu', 'taijutsu', null, 'akimichi', { tai: 10 }, null, 'inicio', 'C', 12, 42, 'F2', 'Expansão parcial.', true),
  future('baika', 'Baika no Jutsu', 'taijutsu', null, 'akimichi', { tai: 16 }, null, 'exame_chunin', 'B', 20, null, 'F2', 'Expansão.'),
  future('nikudan_sensha', 'Nikudan Sensha', 'taijutsu', null, 'akimichi', { tai: 22 }, 'baika', 'exame_chunin_preliminares', 'B', 22, 70, 'F2', 'Tanque Humano.'),
  future('chou_baika', 'Chou Baika no Jutsu', 'taijutsu', null, 'akimichi', { tai: 30, hp: 25 }, null, 'recuperacao_sasuke', 'A', 36, null, 'F3', 'Super Expansão.'),
  future('kikaichuu', 'Kikaichuu no Jutsu', 'ninjutsu', null, 'aburame', { nin: 10, int: 10 }, null, 'inicio', 'C', 12, null, 'F2', 'Insetos parasitas de chakra.', true),
  future('mushi_bunshin', 'Mushi Bunshin no Jutsu', 'ninjutsu', null, 'aburame', { int: 14 }, null, 'exame_chunin', 'C', 14, null, 'F2', 'Clone de insetos.'),
  future('mushidama', 'Mushidama', 'ninjutsu', null, 'aburame', { nin: 30, int: 20 }, null, 'shippuden', 'A', 36, 90, 'Futuro', 'Esfera de insetos.'),

  // ---------- Golpes de inimigos (Apêndice A.4) ----------
  { id: 'golpe_pesado', name: 'Golpe Pesado', category: 'taijutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: 24, effects: [], phase: 'F0', enemyOnly: true, description: 'Pancada bruta.' },
  { id: 'kunai_lancada', name: 'Kunai Lançada', category: 'ninjutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'D', cost: 6, power: 22, effects: [], phase: 'F0', enemyOnly: true, description: 'Kunai arremessada.' },
  { id: 'kubikiribouchou', name: 'Kubikiribouchou', category: 'taijutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 0, power: 30, effects: [], phase: 'F1A', enemyOnly: true, description: 'Golpe da Espada Decapitadora.' },
  { id: 'kirigakure', name: 'Kirigakure no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 12, power: null, effects: [{ effectId: 'nevoa', target: 'self', chance: 1 }], phase: 'F1A', enemyOnly: true, description: 'Névoa Oculta: +15% de esquiva por 3 turnos.' },
  { id: 'muon_satsujin', name: 'Muon Satsujin', category: 'taijutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 18, power: 45, effects: [], phase: 'F1A', enemyOnly: true, description: 'Assassinato Silencioso.' },
  { id: 'senbon', name: 'Senbon', category: 'ninjutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 0, power: 30, effects: [], phase: 'F1A', enemyOnly: true, description: 'Agulhas precisas.' },
  { id: 'makyou_hyoushou', name: 'Makyou Hyoushou', category: 'ninjutsu', element: 'agua', clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'B', cost: 14, power: null, effects: [{ effectId: 'makyou', target: 'self', chance: 1 }], phase: 'F1A', enemyOnly: true, description: 'Espelhos de Gelo Demoníacos: +25% de esquiva por 3 turnos.' },
  { id: 'sensatsu_suishou', name: 'Sensatsu Suishou', category: 'ninjutsu', element: 'agua', clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'B', cost: 20, power: 55, effects: [], phase: 'F1A', enemyOnly: true, description: 'Mil Agulhas da Morte de água.' },
];

export const JUTSUS: Record<string, JutsuDef> = Object.fromEntries(JUTSU_LIST.map((j) => [j.id, j]));
```

- [ ] **Step 6: Implementar `src/data/clans.ts`**

```ts
import type { AttrKey, ClanId, Element, Modifiers } from '../game/types';

export interface ClanDef {
  id: ClanId;
  name: string;
  playable: boolean;
  /** Recebem +1 automático por nível (DD v2 §3). */
  highlights: AttrKey[];
  freePointsPerLevel: number;
  hpMult: number;
  /** Bônus relativo do Meditar (Uzumaki 0,20 → 25% vira 30%). */
  meditateBonus: number;
  fixedAffinity: Element | null;
  passiveMods: Modifiers;
  transformationId: string | null;
  ignoresAffinityPenalty: boolean;
  generalJutsuCostMult: number;
  /** Multiplica os usos exigidos por nível de maestria (Sem clã 0,75). */
  masteryUseMult: number;
  jutsuCostMult: Record<string, number>;
  description: string;
}

const base = {
  playable: false,
  highlights: [] as AttrKey[],
  freePointsPerLevel: 5,
  hpMult: 1,
  meditateBonus: 0,
  fixedAffinity: null,
  passiveMods: {},
  transformationId: null,
  ignoresAffinityPenalty: false,
  generalJutsuCostMult: 1,
  masteryUseMult: 1,
  jutsuCostMult: {},
};

export const CLANS: Record<ClanId, ClanDef> = {
  uchiha: {
    ...base,
    id: 'uchiha',
    name: 'Uchiha',
    playable: true,
    highlights: ['gen', 'crit'],
    fixedAffinity: 'fogo',
    passiveMods: { elementDamagePct: { fogo: 0.15 } },
    transformationId: 'sharingan',
    description: 'Afinidade Fogo fixa (+15% de dano de Fogo) e a transformação Sharingan.',
  },
  uzumaki: {
    ...base,
    id: 'uzumaki',
    name: 'Uzumaki',
    playable: true,
    highlights: ['hp', 'int'],
    hpMult: 1.1,
    meditateBonus: 0.2,
    jutsuCostMult: { kage_bunshin: 0.8 },
    description: '+10% de HP máximo, Meditar +20% e Kage Bunshin −20% de custo.',
  },
  semcla: {
    ...base,
    id: 'semcla',
    name: 'Sem clã',
    playable: true,
    freePointsPerLevel: 6,
    ignoresAffinityPenalty: true,
    generalJutsuCostMult: 0.9,
    masteryUseMult: 0.75,
    description: '+1 ponto livre por nível, sem penalidade de afinidade, jutsus gerais −10% de custo e maestria 25% mais rápida.',
  },
  hyuuga: { ...base, id: 'hyuuga', name: 'Hyuuga', highlights: ['tai', 'crit'], description: 'Fase 2.' },
  nara: { ...base, id: 'nara', name: 'Nara', highlights: ['int', 'vel'], description: 'Fase 2.' },
  akimichi: { ...base, id: 'akimichi', name: 'Akimichi', highlights: ['hp', 'def'], hpMult: 1.15, description: 'Fase 2.' },
  aburame: { ...base, id: 'aburame', name: 'Aburame', highlights: ['nin', 'int'], description: 'Fase 2.' },
};

export const PLAYABLE_CLANS: ClanId[] = ['uchiha', 'uzumaki', 'semcla'];
```

- [ ] **Step 7: Implementar `src/data/items.ts`**

```ts
import type { Attributes, Grade } from '../game/types';

export interface ItemDef {
  id: string;
  name: string;
  kind: 'consumable' | 'weapon' | 'armor' | 'rareScroll';
  grade: Grade;
  price: number;
  attrBonus?: Partial<Attributes>;
  heal?: { hpPct?: number; chakraPct?: number };
  /** Pergaminho de Reforço: o atributo é escolhido ao usar. */
  buffAttr?: boolean;
  description: string;
}

export const ITEM_LIST: ItemDef[] = [
  { id: 'kit_medico', name: 'Kit médico', kind: 'consumable', grade: 'D', price: 80, heal: { hpPct: 0.4 }, description: 'Restaura 40% do HP máximo.' },
  { id: 'pilula_chakra', name: 'Pílula de chakra', kind: 'consumable', grade: 'D', price: 70, heal: { chakraPct: 0.5 }, description: 'Restaura 50% do chakra máximo.' },
  { id: 'pergaminho_reforco', name: 'Pergaminho de Reforço', kind: 'consumable', grade: 'D', price: 60, buffAttr: true, description: '+10% em Taijutsu, Ninjutsu, Genjutsu, Velocidade ou Defesa por 5 turnos.' },
  { id: 'kunai', name: 'Kunai', kind: 'weapon', grade: 'D', price: 250, attrBonus: { vel: 2, crit: 2 }, description: '+2 Velocidade e +2 Chance de Crítico.' },
  { id: 'colete_ninja', name: 'Colete ninja', kind: 'armor', grade: 'D', price: 300, attrBonus: { def: 3 }, description: '+3 Defesa.' },
  { id: 'katana', name: 'Katana', kind: 'weapon', grade: 'C', price: 600, attrBonus: { tai: 4 }, description: '+4 Taijutsu.' },
  { id: 'colete_reforcado', name: 'Colete reforçado', kind: 'armor', grade: 'C', price: 700, attrBonus: { def: 5, hp: 3 }, description: '+5 Defesa e +3 HP.' },
  { id: 'pergaminho_raro', name: 'Pergaminho Raro', kind: 'rareScroll', grade: 'S', price: 900, description: '+1 permanente (nesta run) em um atributo base à escolha.' },
];

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]));
export const EQUIPMENT_POOL = ['kunai', 'colete_ninja', 'katana', 'colete_reforcado'];
export const CONSUMABLE_IDS = ['kit_medico', 'pilula_chakra', 'pergaminho_reforco'];
```

> Nota: o grau "Raro" do DD v2 não existe na escala D–S; o Pergaminho Raro usa `S` só para ordenação. A interface mostra "Raro" pelo `kind`.

- [ ] **Step 8: Implementar `src/data/enemies.ts`**

```ts
import type { Attributes, Element, Grade } from '../game/types';

export type ArchetypeId = 'bruto' | 'ninja' | 'espadachim' | 'agil';
export type AiId = 'basic' | 'zabuza' | 'haku';

/** Pesos (somam 1) para distribuir os pontos do inimigo — Apêndice A.4. */
export const ARCHETYPES: Record<ArchetypeId, Attributes> = {
  bruto: { hp: 0.22, tai: 0.25, nin: 0.04, gen: 0.02, vel: 0.12, int: 0.05, crit: 0.1, def: 0.2 },
  ninja: { hp: 0.18, tai: 0.18, nin: 0.2, gen: 0.03, vel: 0.14, int: 0.07, crit: 0.08, def: 0.12 },
  espadachim: { hp: 0.2, tai: 0.22, nin: 0.18, gen: 0.04, vel: 0.12, int: 0.06, crit: 0.08, def: 0.1 },
  agil: { hp: 0.12, tai: 0.1, nin: 0.24, gen: 0.04, vel: 0.28, int: 0.06, crit: 0.1, def: 0.06 },
};

export interface EnemyTemplate {
  id: string;
  name: string;
  archetype: ArchetypeId;
  grade: Grade;
  element: Element | null;
  jutsus: string[];
  ai: AiId;
  isBoss: boolean;
}

export const ENEMY_LIST: EnemyTemplate[] = [
  { id: 'bandido', name: 'Bandido', archetype: 'bruto', grade: 'D', element: null, jutsus: ['golpe_pesado'], ai: 'basic', isBoss: false },
  { id: 'ninja_renegado', name: 'Ninja Renegado', archetype: 'ninja', grade: 'D', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'mercenario_nevoa', name: 'Mercenário da Névoa', archetype: 'ninja', grade: 'D', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'bandido_veterano', name: 'Bandido Veterano', archetype: 'bruto', grade: 'D+', element: null, jutsus: ['golpe_pesado'], ai: 'basic', isBoss: false },
  { id: 'renegado_veterano', name: 'Renegado Veterano', archetype: 'ninja', grade: 'D+', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'mercenario_veterano', name: 'Mercenário Veterano', archetype: 'ninja', grade: 'D+', element: null, jutsus: ['kunai_lancada'], ai: 'basic', isBoss: false },
  { id: 'zabuza', name: 'Zabuza Momochi', archetype: 'espadachim', grade: 'C', element: 'agua', jutsus: ['kubikiribouchou', 'kirigakure', 'suiryuudan', 'muon_satsujin'], ai: 'zabuza', isBoss: true },
  { id: 'haku', name: 'Haku', archetype: 'agil', grade: 'B', element: 'agua', jutsus: ['senbon', 'makyou_hyoushou', 'sensatsu_suishou'], ai: 'haku', isBoss: true },
];

export const ENEMIES: Record<string, EnemyTemplate> = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e]));

/** Qual elite (D+) substitui cada comum na bifurcação do mapa. */
export const ELITE_OF: Record<string, string> = {
  bandido: 'bandido_veterano',
  ninja_renegado: 'renegado_veterano',
  mercenario_nevoa: 'mercenario_veterano',
};
```

- [ ] **Step 9: Implementar `src/data/saga.ts`**

```ts
import type { StoryPointId } from '../game/types';

export interface SagaNodeDef {
  index: number;
  kind: 'common' | 'boss';
  /** Nível de história: define a força do inimigo (DD v2 §9). */
  storyLevel: number;
  pool: string[];
  bossId: string | null;
  campBefore: boolean;
  advancesStoryTo: StoryPointId | null;
}

export interface SagaDef {
  id: string;
  name: string;
  startStory: StoryPointId;
  nodes: SagaNodeDef[];
}

/** 26 encontros: 12 comuns, Zabuza, 12 comuns, Haku (Apêndice A.3). Três comuns = um nível. */
function buildOndaNodes(): SagaNodeDef[] {
  const nodes: SagaNodeDef[] = [];
  for (let i = 0; i < 26; i++) {
    if (i === 12) {
      nodes.push({ index: i, kind: 'boss', storyLevel: 5, pool: [], bossId: 'zabuza', campBefore: true, advancesStoryTo: 'onda_pos_zabuza' });
    } else if (i === 25) {
      nodes.push({ index: i, kind: 'boss', storyLevel: 10, pool: [], bossId: 'haku', campBefore: true, advancesStoryTo: null });
    } else {
      const firstHalf = i < 12;
      const storyLevel = firstHalf ? Math.floor(i / 3) + 1 : Math.floor((i - 13) / 3) + 6;
      const pool = firstHalf ? ['bandido', 'ninja_renegado'] : ['mercenario_nevoa', 'ninja_renegado'];
      nodes.push({ index: i, kind: 'common', storyLevel, pool, bossId: null, campBefore: false, advancesStoryTo: null });
    }
  }
  return nodes;
}

export const SAGA_ONDA: SagaDef = {
  id: 'onda',
  name: 'Saga da Onda',
  startStory: 'onda',
  nodes: buildOndaNodes(),
};
```

- [ ] **Step 10: Implementar `src/data/titles.ts`**

```ts
import { ELEMENTS, type Element, type Grade, type Modifiers } from '../game/types';

/** Condições de título como DADO (DD v2 §14): título novo não exige código novo. */
export type TitleCondition =
  | { kind: 'bossDefeated'; enemyId: string }
  | { kind: 'lifetimeDefeatedGrade'; grade: Grade; count: number }
  | { kind: 'bossNoDamage' }
  | { kind: 'bossLowHp'; maxHpPct: number }
  | { kind: 'jutsusLearnedInRun'; count: number }
  | { kind: 'elementMastery'; element: Element; count: number }
  | { kind: 'rareScrollsInRun'; count: number }
  | { kind: 'promotedRank'; rank: 'chunin' };

export interface TitleDef {
  id: string;
  name: string;
  condition: TitleCondition;
  mods: Modifiers;
  /** Oculto = existe nos dados mas não aparece no MVP (spec C14). */
  hidden: boolean;
  description: string;
}

const ELEMENT_LABEL: Record<Element, string> = { fogo: 'Fogo', vento: 'Vento', raio: 'Raio', terra: 'Terra', agua: 'Água' };
const LEVEL_NAMES = ['Iniciante', 'Adepto', 'Mestre'];

const elementLines: TitleDef[] = ELEMENTS.flatMap((el) =>
  [1, 2, 3].map((lvl) => ({
    id: `${LEVEL_NAMES[lvl - 1]!.toLowerCase()}_${el}`,
    name: `${LEVEL_NAMES[lvl - 1]} do ${ELEMENT_LABEL[el]}`,
    condition: { kind: 'elementMastery' as const, element: el, count: lvl },
    mods: { elementDamagePct: { [el]: 0.02 * lvl } as Partial<Record<Element, number>> },
    hidden: el === 'raio', // Raio só existe a partir da Fase 2
    description: `Maestria +5 em ${lvl} jutsu(s) de ${ELEMENT_LABEL[el]} diferentes: +${2 * lvl}% de dano de ${ELEMENT_LABEL[el]}.`,
  })),
);

export const TITLE_LIST: TitleDef[] = [
  { id: 'demonio_da_nevoa', name: 'Demônio da Névoa', condition: { kind: 'bossDefeated', enemyId: 'zabuza' }, mods: { dodge: 0.03 }, hidden: false, description: 'Derrotou Zabuza Momochi: +3% de esquiva.' },
  { id: 'cacador_de_bandidos', name: 'Caçador de Bandidos', condition: { kind: 'lifetimeDefeatedGrade', grade: 'D', count: 30 }, mods: { ryoPct: 0.05 }, hidden: false, description: 'Derrotou 30 inimigos de grau D (somando todas as runs): +5% de ryo.' },
  { id: 'sem_um_arranhao', name: 'Sem um Arranhão', condition: { kind: 'bossNoDamage' }, mods: { reduction: 0.02 }, hidden: false, description: 'Venceu um chefe sem sofrer dano: +2% de redução de dano.' },
  { id: 'por_um_fio', name: 'Por um Fio', condition: { kind: 'bossLowHp', maxHpPct: 0.1 }, mods: { crit: 0.03 }, hidden: false, description: 'Venceu um chefe com menos de 10% de HP: +3% de crítico.' },
  { id: 'mestre_de_jutsus', name: 'Mestre de Jutsus', condition: { kind: 'jutsusLearnedInRun', count: 10 }, mods: { chakraCostPct: -0.03 }, hidden: false, description: 'Aprendeu 10 jutsus na mesma run: −3% de custo de chakra.' },
  { id: 'colecionador', name: 'Colecionador', condition: { kind: 'rareScrollsInRun', count: 5 }, mods: { shopPricePct: -0.05 }, hidden: true, description: 'Aplicou 5 Pergaminhos Raros na mesma run: −5% de preço na loja.' },
  { id: 'novo_chunin', name: 'Novo Chunin', condition: { kind: 'promotedRank', rank: 'chunin' }, mods: { repPct: 0.05 }, hidden: true, description: 'Foi promovido a Chunin: +5% de reputação.' },
  ...elementLines,
];

export const TITLES: Record<string, TitleDef> = Object.fromEntries(TITLE_LIST.map((t) => [t.id, t]));
```

- [ ] **Step 11: Implementar `src/data/validate.ts`**

```ts
import { z } from 'zod';
import { ATTR_KEYS, CLAN_IDS, ELEMENTS, GRADES, JUTSU_CATEGORIES, PHASES, STORY_POINTS } from '../game/types';
import { CLANS, type ClanDef } from './clans';
import { EFFECT_LIST, type EffectDef } from './effects';
import { ENEMY_LIST, type EnemyTemplate } from './enemies';
import { ITEM_LIST, type ItemDef } from './items';
import { JUTSU_LIST, type JutsuDef } from './jutsus';
import { SAGA_ONDA, type SagaDef } from './saga';
import { TITLE_LIST, type TitleDef } from './titles';

/**
 * Validação dos dados ao carregar (DD v2 §18).
 * POR QUÊ: um erro de digitação num requisito ou num id de efeito precisa
 * falhar CEDO, com mensagem clara, e não virar bug silencioso no meio da run.
 */
export interface GameData {
  jutsus: JutsuDef[];
  effects: EffectDef[];
  items: ItemDef[];
  enemies: EnemyTemplate[];
  titles: TitleDef[];
  saga: SagaDef;
  clans: ClanDef[];
}

export const DEFAULT_DATA: GameData = {
  jutsus: JUTSU_LIST,
  effects: EFFECT_LIST,
  items: ITEM_LIST,
  enemies: ENEMY_LIST,
  titles: TITLE_LIST,
  saga: SAGA_ONDA,
  clans: Object.values(CLANS),
};

const attrShape = Object.fromEntries(ATTR_KEYS.map((k) => [k, z.number().int().min(0).optional()]));
const PartialAttrs = z.object(attrShape).strict();

const JutsuSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(JUTSU_CATEGORIES),
  element: z.enum(ELEMENTS).nullable(),
  clan: z.enum(CLAN_IDS).nullable(),
  requires: PartialAttrs,
  prereq: z.string().nullable(),
  minStory: z.enum(STORY_POINTS),
  grade: z.enum(GRADES),
  cost: z.number().int().min(0),
  power: z.number().positive().nullable(),
  effects: z.array(
    z.object({
      effectId: z.string().min(1),
      target: z.enum(['self', 'enemy']),
      chance: z.number().min(0).max(1),
      duration: z.number().int().positive().optional(),
    }),
  ),
  phase: z.enum(PHASES),
  enemyOnly: z.boolean().optional(),
  inheritance: z.boolean().optional(),
  cleanse: z.boolean().optional(),
  description: z.string().min(1),
});

const EffectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['buff', 'debuff', 'control', 'dot', 'transformation']),
  duration: z.union([z.number().int().positive(), z.literal('battle'), z.literal('sustained')]),
});

const ItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['consumable', 'weapon', 'armor', 'rareScroll']),
  grade: z.enum(GRADES),
  price: z.number().int().positive(),
  attrBonus: PartialAttrs.optional(),
});

const EnemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  grade: z.enum(GRADES),
  element: z.enum(ELEMENTS).nullable(),
  jutsus: z.array(z.string()).min(1),
});

function zodIssues(label: string, schema: z.ZodTypeAny, list: unknown[]): string[] {
  const out: string[] = [];
  list.forEach((item, idx) => {
    const r = schema.safeParse(item);
    if (!r.success) {
      const id = (item as { id?: string }).id ?? `#${idx}`;
      for (const issue of r.error.issues) out.push(`${label} ${id}: ${issue.path.join('.')} ${issue.message}`);
    }
  });
  return out;
}

function duplicates(label: string, ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) out.push(`${label} ${id}: id duplicado`);
    seen.add(id);
  }
  return out;
}

/** Devolve a lista de problemas encontrados (vazia = dados válidos). */
export function validateGameData(data: GameData = DEFAULT_DATA): string[] {
  const issues: string[] = [
    ...zodIssues('jutsu', JutsuSchema, data.jutsus),
    ...zodIssues('efeito', EffectSchema, data.effects),
    ...zodIssues('item', ItemSchema, data.items),
    ...zodIssues('inimigo', EnemySchema, data.enemies),
    ...duplicates('jutsu', data.jutsus.map((j) => j.id)),
    ...duplicates('efeito', data.effects.map((e) => e.id)),
    ...duplicates('item', data.items.map((i) => i.id)),
    ...duplicates('inimigo', data.enemies.map((e) => e.id)),
    ...duplicates('título', data.titles.map((t) => t.id)),
  ];
  const jutsuIds = new Set(data.jutsus.map((j) => j.id));
  const effectIds = new Set(data.effects.map((e) => e.id));
  const enemyIds = new Set(data.enemies.map((e) => e.id));

  for (const j of data.jutsus) {
    if (j.prereq && !jutsuIds.has(j.prereq)) issues.push(`jutsu ${j.id}: pré-requisito inexistente "${j.prereq}"`);
    for (const e of j.effects) if (!effectIds.has(e.effectId)) issues.push(`jutsu ${j.id}: efeito inexistente "${e.effectId}"`);
  }
  for (const e of data.enemies) {
    for (const id of e.jutsus) if (!jutsuIds.has(id)) issues.push(`inimigo ${e.id}: golpe inexistente "${id}"`);
  }
  for (const n of data.saga.nodes) {
    for (const id of n.pool) if (!enemyIds.has(id)) issues.push(`saga nó ${n.index}: inimigo inexistente "${id}"`);
    if (n.bossId && !enemyIds.has(n.bossId)) issues.push(`saga nó ${n.index}: chefe inexistente "${n.bossId}"`);
  }
  for (const c of data.clans) {
    if (c.transformationId && !effectIds.has(c.transformationId)) issues.push(`clã ${c.id}: transformação inexistente "${c.transformationId}"`);
    for (const id of Object.keys(c.jutsuCostMult)) if (!jutsuIds.has(id)) issues.push(`clã ${c.id}: jutsu inexistente "${id}"`);
  }
  for (const t of data.titles) {
    if (t.condition.kind === 'bossDefeated' && !enemyIds.has(t.condition.enemyId)) issues.push(`título ${t.id}: chefe inexistente`);
  }
  return issues;
}

export function assertGameData(data: GameData = DEFAULT_DATA): void {
  const issues = validateGameData(data);
  if (issues.length) throw new Error(`Dados do jogo inválidos:\n- ${issues.join('\n- ')}`);
}
```

- [ ] **Step 12: Rodar e ver passar**

Run: `npx vitest run tests/data.test.ts && npx tsc --noEmit`
Expected: 7 testes PASS; `tsc` sem saída.

- [ ] **Step 13: Commit**

```bash
git add src/data tests/data.test.ts
git commit -m "feat: dados da Saga da Onda (jutsus, clãs, itens, inimigos, títulos) com validação Zod

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Personagem, XP/níveis, maestria, custo de chakra, desbloqueio e slots

**Files:**
- Create: `src/game/progression/character.ts`, `src/game/progression/mastery.ts`, `src/game/progression/unlock.ts`, `src/game/progression/loadout.ts`
- Test: `tests/progression.test.ts`, `tests/unlock.test.ts`

**Interfaces:**
- Consumes: `BALANCE`, fórmulas, `attributes.ts`, `RuleError`, `CLANS`, `ITEMS`, `JUTSU_LIST`, `JUTSUS`, `storyIndex`.
- Produces (character.ts):
  - `interface PlayerCharacter { name: string; clan: ClanId; affinity: Element; level: number; xp: number; baseAttrs: Attributes; unspentPoints: number; learned: string[]; learnedAt: Record<string, { level: number; nodeIndex: number }>; equipped: string[]; masteryUses: Record<string, number>; equipment: { weapon: string | null; armor: string | null }; ownedEquipment: string[]; inventory: Record<string, number>; ryo: number; reputation: number; titleId: string | null; transformTurns: number; rareScrollsUsed: number; hp: number; chakra: number }`
  - `interface CreateParams { name: string; clan: ClanId; affinity: Element; allocation: Partial<Attributes>; titleId: string | null }`
  - `createCharacter(p: CreateParams): PlayerCharacter`, `equipmentBonus(c): Attributes`, `effectiveAttrs(c): Attributes`, `characterMaxHp(c): number`, `characterMaxChakra(c): number`, `clampVitals(c: PlayerCharacter): void` (muta), `allocatePoints(c, alloc: Partial<Attributes>): PlayerCharacter`, `gainXp(c, amount: number): { character: PlayerCharacter; levelsGained: number }`
- Produces (mastery.ts): `masteryStepUses(clan: ClanId | null): number[]`, `isOffAffinity(j: JutsuDef, clan: ClanId | null, affinity: Element | null): boolean`, `masteryCap(j, clan, affinity): number`, `masteryLevelFromUses(uses: number, j, clan, affinity): number`, `masteryProgress(uses, j, clan, affinity): { level: number; usesIntoLevel: number; usesForNext: number | null }`, `interface CostContext { clan: ClanId | null; affinity: Element | null; masteryLevel: number; costPct: number }`, `jutsuChakraCost(j: JutsuDef, ctx: CostContext): number`
- Produces (unlock.ts): `meetsRequirements(c: PlayerCharacter, j: JutsuDef, story: StoryPointId): boolean`, `missingRequirements(c, j): { attr: AttrKey; missing: number }[]`, `checkUnlocks(c, story: StoryPointId, nodeIndex: number): { character: PlayerCharacter; learned: string[] }`
- Produces (loadout.ts): `slotCount(c): number`, `equipJutsu(c, jutsuId: string, replaceId?: string | null): PlayerCharacter`, `unequipJutsu(c, jutsuId: string): PlayerCharacter`, `setLoadout(c, ids: string[]): PlayerCharacter`

- [ ] **Step 1: Escrever os testes que falham — `tests/progression.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  allocatePoints,
  characterMaxChakra,
  characterMaxHp,
  createCharacter,
  effectiveAttrs,
  gainXp,
} from '../src/game/progression/character';
import {
  isOffAffinity,
  jutsuChakraCost,
  masteryLevelFromUses,
  masteryProgress,
  masteryStepUses,
} from '../src/game/progression/mastery';
import { sumAttributes } from '../src/game/attributes';
import { expectedPoints } from '../src/game/formulas';
import { RuleError } from '../src/game/errors';
import { JUTSUS } from '../src/data/jutsus';

const base = { name: 'Tester', affinity: 'vento' as const, titleId: null };
const ninAlloc = { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 };
const J = (id: string) => JUTSUS[id]!;

describe('criação de personagem', () => {
  it('começa com 50 pontos, nível 1, HP e chakra cheios', () => {
    const c = createCharacter({ ...base, clan: 'uzumaki', allocation: ninAlloc });
    expect(sumAttributes(c.baseAttrs)).toBe(50);
    expect(c.level).toBe(1);
    expect(c.hp).toBe(characterMaxHp(c));
    expect(c.hp).toBe(Math.round((80 + 4 * 7 + 6) * 1.1));
    expect(c.chakra).toBe(characterMaxChakra(c));
  });

  it('Uchiha tem afinidade Fogo fixa', () => {
    const c = createCharacter({ ...base, affinity: 'agua', clan: 'uchiha', allocation: ninAlloc });
    expect(c.affinity).toBe('fogo');
  });

  it('rejeita distribuição inválida, nome vazio e clã não jogável', () => {
    expect(() => createCharacter({ ...base, clan: 'semcla', allocation: { nin: 9 } })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, clan: 'semcla', allocation: { nin: 11, hp: -1 } })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, clan: 'semcla', allocation: { nin: 9.5, hp: 0.5 } })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, name: '   ', clan: 'semcla', allocation: ninAlloc })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, clan: 'hyuuga', allocation: ninAlloc })).toThrow(RuleError);
  });
});

describe('XP e níveis', () => {
  it('216 de XP leva do nível 1 ao 5 (Apêndice A.1)', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    const r = gainXp(c, 216);
    expect(r.character.level).toBe(5);
    expect(r.levelsGained).toBe(4);
    expect(r.character.xp).toBe(0);
  });

  it('clã: 5 pontos livres + 1 em cada destaque; total = P(N)', () => {
    const c = createCharacter({ ...base, clan: 'uzumaki', allocation: ninAlloc });
    const r = gainXp(c, 216).character;
    expect(r.unspentPoints).toBe(20);
    expect(r.baseAttrs.hp).toBe(c.baseAttrs.hp + 4);
    expect(r.baseAttrs.int).toBe(c.baseAttrs.int + 4);
    expect(sumAttributes(r.baseAttrs) + r.unspentPoints).toBe(expectedPoints(5));
  });

  it('Sem clã: 6 pontos livres por nível, sem destaques', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    const r = gainXp(c, 216).character;
    expect(r.unspentPoints).toBe(24);
    expect(sumAttributes(r.baseAttrs)).toBe(50);
  });

  it('subir de nível cura 25% do HP máximo (além do aumento do máximo)', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    c.hp = 10;
    const before = characterMaxHp(c);
    const r = gainXp(c, 36).character;
    const after = characterMaxHp(r);
    expect(r.hp).toBe(Math.min(after, 10 + (after - before) + Math.round(after * 0.25)));
  });

  it('não muta o personagem original', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    gainXp(c, 500);
    expect(c.level).toBe(1);
  });
});

describe('distribuição de pontos e atributo efetivo', () => {
  it('aplica pontos e sobe o HP atual junto com o máximo', () => {
    const c = gainXp(createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc }), 36).character;
    const hpBefore = c.hp;
    const r = allocatePoints(c, { hp: 5 });
    expect(r.baseAttrs.hp).toBe(c.baseAttrs.hp + 5);
    expect(r.unspentPoints).toBe(c.unspentPoints - 5);
    expect(r.hp).toBe(Math.min(characterMaxHp(r), hpBefore + 20));
  });

  it('rejeita mais pontos que o disponível', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    expect(() => allocatePoints(c, { nin: 1 })).toThrow(RuleError);
  });

  it('equipamento entra no efetivo, mas não no base', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    c.equipment.armor = 'colete_ninja';
    expect(effectiveAttrs(c).def).toBe(c.baseAttrs.def + 3);
    expect(c.baseAttrs.def).toBe(7);
  });
});

describe('maestria e custo de chakra', () => {
  it('limiares acumulados 6/15/27/42/60', () => {
    expect(masteryStepUses('uchiha')).toEqual([6, 9, 12, 15, 18]);
    const g = J('goukakyuu');
    expect(masteryLevelFromUses(5, g, 'uchiha', 'fogo')).toBe(0);
    expect(masteryLevelFromUses(6, g, 'uchiha', 'fogo')).toBe(1);
    expect(masteryLevelFromUses(15, g, 'uchiha', 'fogo')).toBe(2);
    expect(masteryLevelFromUses(59, g, 'uchiha', 'fogo')).toBe(4);
    expect(masteryLevelFromUses(60, g, 'uchiha', 'fogo')).toBe(5);
    expect(masteryLevelFromUses(999, g, 'uchiha', 'fogo')).toBe(5);
  });

  it('Sem clã precisa de 25% menos usos (arredondado para cima)', () => {
    expect(masteryStepUses('semcla')).toEqual([5, 7, 9, 12, 14]);
    expect(masteryLevelFromUses(47, J('bunshin'), 'semcla', 'vento')).toBe(5);
  });

  it('fora da afinidade trava em +3 (exceto Sem clã e jutsus neutros)', () => {
    expect(isOffAffinity(J('bola_de_fogo'), 'uzumaki', 'agua')).toBe(true);
    expect(masteryLevelFromUses(60, J('bola_de_fogo'), 'uzumaki', 'agua')).toBe(3);
    expect(masteryLevelFromUses(60, J('bola_de_fogo'), 'semcla', 'agua')).toBe(5);
    expect(masteryLevelFromUses(60, J('bunshin'), 'uzumaki', 'agua')).toBe(5);
  });

  it('progresso dentro do nível para a barra da interface', () => {
    expect(masteryProgress(8, J('goukakyuu'), 'uchiha', 'fogo')).toEqual({ level: 1, usesIntoLevel: 2, usesForNext: 9 });
    expect(masteryProgress(60, J('goukakyuu'), 'uchiha', 'fogo')).toEqual({ level: 5, usesIntoLevel: 0, usesForNext: null });
  });

  it('custo de chakra combina maestria, afinidade, clã e título', () => {
    const ctx = (clan: 'uzumaki' | 'semcla' | 'uchiha' | null, affinity: 'agua' | 'fogo' | null, m = 0, costPct = 0) => ({ clan, affinity, masteryLevel: m, costPct });
    expect(jutsuChakraCost(J('kage_bunshin'), ctx('uzumaki', 'agua'))).toBe(19);
    expect(jutsuChakraCost(J('bola_de_fogo'), ctx('uzumaki', 'agua'))).toBe(10);
    expect(jutsuChakraCost(J('bola_de_fogo'), ctx('semcla', 'agua'))).toBe(7);
    expect(jutsuChakraCost(J('goukakyuu'), ctx('uchiha', 'fogo', 5))).toBe(11);
    expect(jutsuChakraCost(J('kubikiribouchou'), ctx(null, 'agua'))).toBe(0);
    expect(jutsuChakraCost(J('bunshin'), ctx('semcla', null, 0, -0.03))).toBe(7);
  });
});
```

- [ ] **Step 2: Escrever os testes que falham — `tests/unlock.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { createCharacter } from '../src/game/progression/character';
import { checkUnlocks, meetsRequirements, missingRequirements } from '../src/game/progression/unlock';
import { equipJutsu, setLoadout, unequipJutsu } from '../src/game/progression/loadout';
import { RuleError } from '../src/game/errors';
import { JUTSUS } from '../src/data/jutsus';
import type { Attributes, ClanId } from '../src/game/types';

const mk = (clan: ClanId, allocation: Partial<Attributes>) =>
  createCharacter({ name: 'T', clan, affinity: 'vento', allocation, titleId: null });

describe('regra fixa de desbloqueio (spec §5)', () => {
  it('aprende automaticamente o que já cumpre e equipa nos slots livres', () => {
    const r = checkUnlocks(mk('semcla', { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }), 'onda', 0);
    expect(r.learned).toEqual(['henge', 'bunshin', 'bola_de_fogo']);
    expect(r.character.equipped).toEqual(['henge', 'bunshin', 'bola_de_fogo']);
    expect(r.character.learnedAt['bola_de_fogo']).toEqual({ level: 1, nodeIndex: 0 });
  });

  it('atributo efetivo (equipamento) NÃO desbloqueia', () => {
    const c = mk('semcla', { tai: 6, hp: 4 }); // Tai base 11
    c.equipment.weapon = 'katana'; // efetivo 15
    const r = checkUnlocks(c, 'onda', 0);
    expect(r.learned).toContain('sennen_goroshi');
    expect(r.learned).not.toContain('investida_ninja');
  });

  it('jutsu exclusivo só para o próprio clã', () => {
    expect(checkUnlocks(mk('uzumaki', { nin: 7, hp: 3 }), 'onda', 0).learned).not.toContain('goukakyuu');
    expect(checkUnlocks(mk('uchiha', { nin: 7, hp: 3 }), 'onda', 0).learned).toContain('goukakyuu');
  });

  it('saga mínima trava Suiryuudan até vencer Zabuza', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 22;
    expect(checkUnlocks(c, 'onda', 0).learned).not.toContain('suiryuudan');
    expect(checkUnlocks(c, 'onda_pos_zabuza', 13).learned).toContain('suiryuudan');
  });

  it('pré-requisito: Rasengan exige Kage Bunshin (cadeia resolvida na mesma checagem)', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 40;
    c.baseAttrs.int = 20;
    expect(meetsRequirements(c, JUTSUS['rasengan']!, 'busca_tsunade')).toBe(false);
    const r = checkUnlocks(c, 'busca_tsunade', 0);
    expect(r.learned).toContain('kage_bunshin');
    expect(r.learned).toContain('rasengan');
  });

  it('com os 4 slots cheios, o novo jutsu vai só para o repertório', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 22;
    c.baseAttrs.vel = 8;
    const r = checkUnlocks(c, 'onda', 0);
    expect(r.learned.length).toBeGreaterThan(4);
    expect(r.character.equipped).toHaveLength(4);
    expect(r.character.equipped).toEqual(r.learned.slice(0, 4));
    const again = checkUnlocks(r.character, 'onda', 1);
    expect(again.learned).toEqual([]);
    expect(again.character.equipped).toEqual(r.character.equipped);
  });

  it('missingRequirements diz quantos pontos faltam', () => {
    const c = mk('semcla', { nin: 4, hp: 6 }); // Nin 9
    expect(missingRequirements(c, JUTSUS['kage_bunshin']!)).toEqual([{ attr: 'nin', missing: 11 }]);
  });

  it('golpes de inimigo nunca são aprendidos', () => {
    const c = mk('semcla', { tai: 10 });
    expect(meetsRequirements(c, JUTSUS['golpe_pesado']!, 'onda')).toBe(false);
  });
});

describe('slots de jutsu', () => {
  it('equipa, troca quando cheio e valida', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 22;
    c.baseAttrs.vel = 8;
    const r = checkUnlocks(c, 'onda', 0).character;
    const reserve = r.learned.find((id) => !r.equipped.includes(id))!;
    expect(() => equipJutsu(r, reserve)).toThrow(RuleError);
    const swapped = equipJutsu(r, reserve, r.equipped[0]);
    expect(swapped.equipped[0]).toBe(reserve);
    expect(() => equipJutsu(r, 'rasengan')).toThrow(RuleError); // não aprendido
    expect(unequipJutsu(r, r.equipped[0]!).equipped).toHaveLength(3);
    expect(() => setLoadout(r, [...r.learned.slice(0, 5)])).toThrow(RuleError);
    expect(setLoadout(r, [reserve]).equipped).toEqual([reserve]);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/progression.test.ts tests/unlock.test.ts`
Expected: FAIL — imports de `src/game/progression/*` não resolvem.

- [ ] **Step 4: Implementar `src/game/progression/mastery.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { CLANS } from '../../data/clans';
import type { JutsuDef } from '../../data/jutsus';
import type { ClanId, Element } from '../types';

/**
 * Maestria de jutsu (DD v2 §8): +1..+5 por uso.
 * Sem clã precisa de 25% menos usos; jutsu elemental fora da afinidade
 * para em +3 (exceto Sem clã, que ignora a penalidade).
 */
export function masteryStepUses(clan: ClanId | null): number[] {
  const mult = clan ? CLANS[clan].masteryUseMult : 1;
  return B.mastery.stepUses.map((u) => Math.ceil(u * mult));
}

export function isOffAffinity(j: JutsuDef, clan: ClanId | null, affinity: Element | null): boolean {
  if (!clan || !j.element) return false;
  if (CLANS[clan].ignoresAffinityPenalty) return false;
  return j.element !== affinity;
}

export function masteryCap(j: JutsuDef, clan: ClanId | null, affinity: Element | null): number {
  return isOffAffinity(j, clan, affinity) ? B.mastery.maxLevelOffAffinity : B.mastery.maxLevel;
}

export function masteryLevelFromUses(uses: number, j: JutsuDef, clan: ClanId | null, affinity: Element | null): number {
  let level = 0;
  let acc = 0;
  for (const step of masteryStepUses(clan)) {
    acc += step;
    if (uses >= acc) level++;
    else break;
  }
  return Math.min(level, masteryCap(j, clan, affinity));
}

/** Para a barra de progresso: quantos usos já entraram no nível atual e quantos o próximo exige. */
export function masteryProgress(
  uses: number,
  j: JutsuDef,
  clan: ClanId | null,
  affinity: Element | null,
): { level: number; usesIntoLevel: number; usesForNext: number | null } {
  const level = masteryLevelFromUses(uses, j, clan, affinity);
  const steps = masteryStepUses(clan);
  if (level >= masteryCap(j, clan, affinity)) return { level, usesIntoLevel: 0, usesForNext: null };
  const spent = steps.slice(0, level).reduce((s, x) => s + x, 0);
  return { level, usesIntoLevel: uses - spent, usesForNext: steps[level] ?? null };
}

export interface CostContext {
  clan: ClanId | null;
  affinity: Element | null;
  masteryLevel: number;
  /** Soma de chakraCostPct de títulos/efeitos (ex.: −0,03). */
  costPct: number;
}

/**
 * Custo final de chakra. Modificadores MULTIPLICATIVOS (spec §4):
 * maestria (−5%/nível) × fora da afinidade (+25%) × Sem clã em geral (−10%)
 * × desconto específico do clã (Uzumaki em Kage Bunshin −20%) × (1 + título).
 */
export function jutsuChakraCost(j: JutsuDef, ctx: CostContext): number {
  if (j.cost === 0) return 0;
  let mult = 1 - B.mastery.costPerLevel * ctx.masteryLevel;
  if (isOffAffinity(j, ctx.clan, ctx.affinity)) mult *= B.cost.offAffinityMult;
  if (ctx.clan) {
    const clan = CLANS[ctx.clan];
    if (j.clan === null) mult *= clan.generalJutsuCostMult;
    mult *= clan.jutsuCostMult[j.id] ?? 1;
  }
  mult *= 1 + ctx.costPct;
  return Math.max(1, Math.round(j.cost * mult));
}
```

- [ ] **Step 5: Implementar `src/game/progression/character.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { addAttributes, emptyAttributes, sumAttributes } from '../attributes';
import { RuleError } from '../errors';
import { maxChakra, maxHp, xpToNext } from '../formulas';
import { ATTR_KEYS, type Attributes, type ClanId, type Element } from '../types';
import { CLANS } from '../../data/clans';
import { ITEMS } from '../../data/items';

/**
 * O personagem do jogador DENTRO de uma run (tudo aqui morre com a run).
 * baseAttrs = pontos + bônus de clã + Pergaminhos Raros (é o que desbloqueia jutsu).
 */
export interface PlayerCharacter {
  name: string;
  clan: ClanId;
  affinity: Element;
  level: number;
  /** XP acumulado dentro do nível atual. */
  xp: number;
  baseAttrs: Attributes;
  unspentPoints: number;
  learned: string[];
  learnedAt: Record<string, { level: number; nodeIndex: number }>;
  equipped: string[];
  masteryUses: Record<string, number>;
  equipment: { weapon: string | null; armor: string | null };
  ownedEquipment: string[];
  inventory: Record<string, number>;
  ryo: number;
  reputation: number;
  titleId: string | null;
  transformTurns: number;
  rareScrollsUsed: number;
  hp: number;
  chakra: number;
}

export interface CreateParams {
  name: string;
  clan: ClanId;
  affinity: Element;
  allocation: Partial<Attributes>;
  titleId: string | null;
}

function normalizeAllocation(a: Partial<Attributes>): Attributes {
  const out = emptyAttributes(0);
  for (const k of ATTR_KEYS) {
    const v = a[k] ?? 0;
    if (!Number.isInteger(v) || v < 0) throw new RuleError('invalidAllocation', `Valor inválido em ${k}: ${v}`);
    out[k] = v;
  }
  return out;
}

export function createCharacter(p: CreateParams): PlayerCharacter {
  const name = p.name.trim();
  if (name.length < 1 || name.length > 20) throw new RuleError('invalidName', 'O nome precisa ter de 1 a 20 caracteres.');
  const clan = CLANS[p.clan];
  if (!clan?.playable) throw new RuleError('invalidClan', `Clã não jogável: ${p.clan}`);
  const alloc = normalizeAllocation(p.allocation);
  if (sumAttributes(alloc) !== B.attributes.creationPoints) {
    throw new RuleError('invalidAllocation', `Distribua exatamente ${B.attributes.creationPoints} pontos.`);
  }
  const c: PlayerCharacter = {
    name,
    clan: p.clan,
    affinity: clan.fixedAffinity ?? p.affinity,
    level: 1,
    xp: 0,
    baseAttrs: addAttributes(emptyAttributes(B.attributes.start), alloc),
    unspentPoints: 0,
    learned: [],
    learnedAt: {},
    equipped: [],
    masteryUses: {},
    equipment: { weapon: null, armor: null },
    ownedEquipment: [],
    inventory: {},
    ryo: 0,
    reputation: 0,
    titleId: p.titleId,
    transformTurns: 0,
    rareScrollsUsed: 0,
    hp: 0,
    chakra: 0,
  };
  c.hp = characterMaxHp(c);
  c.chakra = characterMaxChakra(c);
  return c;
}

export function equipmentBonus(c: PlayerCharacter): Attributes {
  let bonus = emptyAttributes(0);
  for (const id of [c.equipment.weapon, c.equipment.armor]) {
    if (id) bonus = addAttributes(bonus, ITEMS[id]?.attrBonus ?? {});
  }
  return bonus;
}

/** Base + equipamento (sem efeitos de batalha). */
export function effectiveAttrs(c: PlayerCharacter): Attributes {
  return addAttributes(c.baseAttrs, equipmentBonus(c));
}

export function characterMaxHp(c: PlayerCharacter): number {
  return maxHp(effectiveAttrs(c).hp, c.level, CLANS[c.clan].hpMult);
}

export function characterMaxChakra(c: PlayerCharacter): number {
  return maxChakra(effectiveAttrs(c).int, c.level);
}

/** Garante HP/chakra dentro do máximo (muta; usar em cópias). */
export function clampVitals(c: PlayerCharacter): void {
  c.hp = Math.max(0, Math.min(characterMaxHp(c), c.hp));
  c.chakra = Math.max(0, Math.min(characterMaxChakra(c), c.chakra));
}

/** Gasta pontos livres. Ao subir o máximo de HP/chakra, o valor atual sobe junto. */
export function allocatePoints(c: PlayerCharacter, alloc: Partial<Attributes>): PlayerCharacter {
  const a = normalizeAllocation(alloc);
  const total = sumAttributes(a);
  if (total > c.unspentPoints) throw new RuleError('notEnoughPoints', `Você só tem ${c.unspentPoints} ponto(s).`);
  const hpBefore = characterMaxHp(c);
  const chBefore = characterMaxChakra(c);
  const next = structuredClone(c);
  next.baseAttrs = addAttributes(next.baseAttrs, a);
  next.unspentPoints -= total;
  next.hp += characterMaxHp(next) - hpBefore;
  next.chakra += characterMaxChakra(next) - chBefore;
  clampVitals(next);
  return next;
}

/**
 * Ganha XP e sobe quantos níveis couberem. Por nível: pontos livres do clã,
 * +1 em cada atributo de destaque e cura de 25% do HP máximo (DD v2 §9).
 */
export function gainXp(c: PlayerCharacter, amount: number): { character: PlayerCharacter; levelsGained: number } {
  if (amount < 0) throw new RuleError('invalidXp', 'XP negativo.');
  const next = structuredClone(c);
  const clan = CLANS[next.clan];
  next.xp += amount;
  let levelsGained = 0;
  while (next.xp >= xpToNext(next.level)) {
    const hpBefore = characterMaxHp(next);
    const chBefore = characterMaxChakra(next);
    next.xp -= xpToNext(next.level);
    next.level++;
    levelsGained++;
    next.unspentPoints += clan.freePointsPerLevel;
    for (const k of clan.highlights) next.baseAttrs[k] += 1;
    const hpMax = characterMaxHp(next);
    next.hp += hpMax - hpBefore + Math.round(hpMax * B.recovery.levelUpHpPct);
    next.chakra += characterMaxChakra(next) - chBefore;
    clampVitals(next);
  }
  return { character: next, levelsGained };
}
```

- [ ] **Step 6: Implementar `src/game/progression/unlock.ts`**

```ts
import { BALANCE as B } from '../Balance';
import type { AttrKey, StoryPointId } from '../types';
import { JUTSU_LIST, type JutsuDef } from '../../data/jutsus';
import { storyIndex } from '../../data/story';
import type { PlayerCharacter } from './character';

/**
 * REGRA FIXA (spec §5): um jutsu é aprendido automaticamente quando o
 * personagem cumpre TODAS as condições — atributo(s) BASE, clã, saga mínima e
 * pré-requisito. Nenhuma outra fonte concede jutsu. Equipamento/buffs não contam.
 */
export function meetsRequirements(c: PlayerCharacter, j: JutsuDef, story: StoryPointId): boolean {
  if (j.enemyOnly) return false;
  if (j.clan && j.clan !== c.clan) return false;
  if (storyIndex(j.minStory) > storyIndex(story)) return false;
  if (j.prereq && !c.learned.includes(j.prereq)) return false;
  return missingRequirements(c, j).length === 0;
}

/** Atributos que ainda faltam (usado na interface: "faltam X pontos para Kage Bunshin"). */
export function missingRequirements(c: PlayerCharacter, j: JutsuDef): { attr: AttrKey; missing: number }[] {
  const out: { attr: AttrKey; missing: number }[] = [];
  for (const [attr, min] of Object.entries(j.requires) as [AttrKey, number][]) {
    const have = c.baseAttrs[attr];
    if (have < min) out.push({ attr, missing: min - have });
  }
  return out;
}

/**
 * Aprende tudo o que ficou disponível. Repete até estabilizar para resolver
 * cadeias de pré-requisito (ex.: Kage Bunshin → Rasengan) numa só chamada.
 * Novos jutsus ocupam slots livres; com os slots cheios, ficam só no repertório.
 */
export function checkUnlocks(
  c: PlayerCharacter,
  story: StoryPointId,
  nodeIndex: number,
): { character: PlayerCharacter; learned: string[] } {
  const next = structuredClone(c);
  const learned: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const j of JUTSU_LIST) {
      if (next.learned.includes(j.id) || !meetsRequirements(next, j, story)) continue;
      next.learned.push(j.id);
      next.learnedAt[j.id] = { level: next.level, nodeIndex };
      learned.push(j.id);
      if (next.equipped.length < B.loadout.geninSlots) next.equipped.push(j.id);
      changed = true;
    }
  }
  return { character: next, learned };
}
```

- [ ] **Step 7: Implementar `src/game/progression/loadout.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { RuleError } from '../errors';
import type { PlayerCharacter } from './character';

/** Slots por rank ninja (DD v2 §8). No MVP todo personagem é Genin. */
export function slotCount(_c: PlayerCharacter): number {
  return B.loadout.geninSlots;
}

export function equipJutsu(c: PlayerCharacter, jutsuId: string, replaceId: string | null = null): PlayerCharacter {
  if (!c.learned.includes(jutsuId)) throw new RuleError('notLearned', 'Jutsu ainda não aprendido.');
  if (c.equipped.includes(jutsuId)) throw new RuleError('alreadyEquipped', 'Jutsu já equipado.');
  const next = structuredClone(c);
  if (next.equipped.length < slotCount(next)) {
    next.equipped.push(jutsuId);
    return next;
  }
  const idx = replaceId ? next.equipped.indexOf(replaceId) : -1;
  if (idx < 0) throw new RuleError('slotsFull', 'Todos os slots estão ocupados: escolha qual jutsu substituir.');
  next.equipped[idx] = jutsuId;
  return next;
}

export function unequipJutsu(c: PlayerCharacter, jutsuId: string): PlayerCharacter {
  const next = structuredClone(c);
  next.equipped = next.equipped.filter((id) => id !== jutsuId);
  return next;
}

/** Define o conjunto inteiro de uma vez (tela de slots e robô do simulador). */
export function setLoadout(c: PlayerCharacter, ids: string[]): PlayerCharacter {
  if (ids.length > slotCount(c)) throw new RuleError('slotsFull', `No máximo ${slotCount(c)} jutsus equipados.`);
  if (new Set(ids).size !== ids.length) throw new RuleError('duplicate', 'Jutsu repetido.');
  for (const id of ids) if (!c.learned.includes(id)) throw new RuleError('notLearned', `Jutsu não aprendido: ${id}`);
  const next = structuredClone(c);
  next.equipped = [...ids];
  return next;
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run tests/progression.test.ts tests/unlock.test.ts && npx tsc --noEmit`
Expected: todos PASS; `tsc` sem saída.

- [ ] **Step 9: Commit**

```bash
git add src/game/progression tests/progression.test.ts tests/unlock.test.ts
git commit -m "feat: personagem, níveis, maestria, custo de chakra e desbloqueio de jutsu por status

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Combatente, eventos e sistema genérico de efeitos (inclui Transformação)

**Files:**
- Create: `src/game/combat/types.ts`, `src/game/events.ts`, `src/game/effects/EffectSystem.ts`, `tests/helpers.ts`
- Test: `tests/effects.test.ts`

**Interfaces:**
- Consumes: `EFFECTS`, `BALANCE`, `emptyAttributes`, `RuleError`, tipos.
- Produces (combat/types.ts):
  - `interface ActiveEffect { effectId: string; remaining: number | null; sourceId: string; chargeUsed: boolean }`
  - `interface Combatant { id: string; name: string; side: 'player' | 'enemy'; level: number; grade: Grade | null; isBoss: boolean; clan: ClanId | null; element: Element | null; attrs: Attributes; maxHp: number; hp: number; maxChakra: number; chakra: number; damageMult: number; jutsus: string[]; masteryUses: Record<string, number>; inventory: Record<string, number>; passiveMods: Modifiers[]; transformationId: string | null; transformTurns: number; effects: ActiveEffect[]; tenacity: number; defending: boolean; ai: 'player' | AiId; templateId: string | null; aiOpened: boolean }`
  - `type Action = { type: 'attack' } | { type: 'jutsu'; jutsuId: string } | { type: 'defend' } | { type: 'meditate' } | { type: 'item'; itemId: string; attr?: ReforcoAttr } | { type: 'transform' }`
  - `interface BattleState { combatants: Combatant[]; round: number; order: string[]; turnPos: number; activeId: string | null; status: 'running' | 'awaitingInput' | 'ended'; winner: 'player' | 'enemy' | null; transformToggled: boolean; onlyKai: boolean }`
- Produces (events.ts): `type GameEvent` (união abaixo).
- Produces (EffectSystem.ts): `interface ModTotals`, `emptyTotals()`, `addMods(t, m)`, `sumModifiers(list: Modifiers[]): ModTotals`, `aggregateMods(c): ModTotals`, `effectiveAttr(c, k): number`, `hasEffect(c, id): boolean`, `activeControl(c): ActiveEffect | undefined`, `activeTransformation(c): ActiveEffect | undefined`, `controlDuration(c, requested): number`, `applyEffect(c, effectId, opts: { sourceId: string; duration?: number }): GameEvent[]`, `removeEffect(c, effectId): GameEvent[]`, `consumeCharge(c, kind: 'negateHit' | 'absorbHit' | 'missChance'): ActiveEffect | null`, `applyDots(c): GameEvent[]`, `payTransformationUpkeep(c): GameEvent[]`, `tickDurations(c, keep?: string[]): GameEvent[]`, `cleanseIllusions(c): GameEvent[]` — todas as que recebem `c` MUTAM o combatente (são chamadas dentro de um estado já clonado).
- Produces (tests/helpers.ts): `class SeqRng extends Rng` e `makeCombatant(over?)`.

- [ ] **Step 1: Criar `src/game/combat/types.ts`**

```ts
import type { AiId } from '../../data/enemies';
import type { ReforcoAttr } from '../../data/effects';
import type { Attributes, ClanId, Element, Grade, Modifiers } from '../types';

export interface ActiveEffect {
  effectId: string;
  /** Turnos restantes do portador; null = sustentado/até o fim da batalha. */
  remaining: number | null;
  sourceId: string;
  chargeUsed: boolean;
}

/**
 * Qualquer participante da batalha. O combate trabalha com uma LISTA de
 * combatentes (não "jogador vs inimigo" fixo) para abrir caminho a
 * invocações e equipes no futuro (DD v2 §9).
 */
export interface Combatant {
  id: string;
  name: string;
  side: 'player' | 'enemy';
  level: number;
  grade: Grade | null;
  isBoss: boolean;
  clan: ClanId | null;
  /** Afinidade do jogador ou elemento do inimigo; usado como elemento de defesa. */
  element: Element | null;
  /** Atributos base + equipamento (efeitos entram via effectiveAttr). */
  attrs: Attributes;
  maxHp: number;
  hp: number;
  maxChakra: number;
  chakra: number;
  /** Multiplicador de dano do grau (inimigos); 1 para o jogador. */
  damageMult: number;
  jutsus: string[];
  masteryUses: Record<string, number>;
  inventory: Record<string, number>;
  /** Passivas do clã e título ativo. */
  passiveMods: Modifiers[];
  transformationId: string | null;
  transformTurns: number;
  effects: ActiveEffect[];
  /** Turnos de imunidade a controle (Tenacidade). */
  tenacity: number;
  defending: boolean;
  ai: 'player' | AiId;
  templateId: string | null;
  aiOpened: boolean;
}

export type Action =
  | { type: 'attack' }
  | { type: 'jutsu'; jutsuId: string }
  | { type: 'defend' }
  | { type: 'meditate' }
  | { type: 'item'; itemId: string; attr?: ReforcoAttr }
  | { type: 'transform' };

export interface BattleState {
  combatants: Combatant[];
  round: number;
  /** Ordem de ação desta rodada (ids). */
  order: string[];
  turnPos: number;
  activeId: string | null;
  status: 'running' | 'awaitingInput' | 'ended';
  winner: 'player' | 'enemy' | null;
  /** Transformação já ligada/desligada neste turno? (ação livre, 1 vez por turno) */
  transformToggled: boolean;
  /** Jogador sob Ilusão com Kai disponível: só Kai é permitido. */
  onlyKai: boolean;
}
```

- [ ] **Step 2: Criar `src/game/events.ts`**

```ts
import type { Action } from './combat/types';
import type { StoryPointId } from './types';

/**
 * Tudo o que acontece no jogo vira um evento. A interface anima os eventos,
 * o log os descreve e o rastreador de estatísticas os conta — o motor não
 * conhece nenhum deles (DD v2 §14 "Como funciona por baixo").
 */
export type GameEvent =
  | { type: 'battleStart'; playerId: string; enemyId: string }
  | { type: 'roundStart'; round: number; order: string[] }
  | { type: 'turnStart'; actorId: string; round: number }
  | { type: 'chakraRegen'; actorId: string; amount: number }
  | { type: 'actionChosen'; actorId: string; action: Action }
  | { type: 'jutsuUsed'; actorId: string; jutsuId: string; cost: number }
  | { type: 'damage'; sourceId: string; targetId: string; amount: number; crit: boolean; elementMult: number; jutsuId: string | null; hpAfter: number }
  | { type: 'dodge'; sourceId: string; targetId: string }
  | { type: 'miss'; sourceId: string; targetId: string; reason: 'henge' }
  | { type: 'negated'; sourceId: string; targetId: string; reason: 'kawarimi' | 'clone' }
  | { type: 'dot'; targetId: string; effectId: string; amount: number; hpAfter: number }
  | { type: 'heal'; targetId: string; hp: number; chakra: number }
  | { type: 'defend'; actorId: string; chakra: number }
  | { type: 'meditate'; actorId: string; chakra: number }
  | { type: 'itemUsed'; actorId: string; itemId: string }
  | { type: 'effectApplied'; targetId: string; effectId: string; remaining: number | null }
  | { type: 'effectResisted'; targetId: string; effectId: string; reason: 'tenacity' | 'chance' }
  | { type: 'effectExpired'; targetId: string; effectId: string }
  | { type: 'controlledSkip'; actorId: string; effectId: string }
  | { type: 'transformOn'; actorId: string; transformationId: string }
  | { type: 'transformOff'; actorId: string; transformationId: string; reason: 'manual' | 'noChakra' | 'battleEnd' }
  | { type: 'transformUpkeep'; actorId: string; amount: number }
  | { type: 'masteryUp'; actorId: string; jutsuId: string; level: number }
  | { type: 'defeated'; targetId: string }
  | { type: 'battleEnd'; winner: 'player' | 'enemy'; reason: 'ko' | 'timeout' }
  | { type: 'reward'; xp: number; ryo: number; rep: number }
  | { type: 'levelUp'; level: number }
  | { type: 'jutsuLearned'; jutsuId: string }
  | { type: 'bossDefeated'; enemyId: string }
  | { type: 'storyAdvanced'; story: StoryPointId }
  | { type: 'runEnded'; result: 'dead' | 'victory' };
```

- [ ] **Step 3: Criar `tests/helpers.ts`**

```ts
import { Rng } from '../src/game/Rng';
import { emptyAttributes } from '../src/game/attributes';
import type { Combatant } from '../src/game/combat/types';
import type { Attributes } from '../src/game/types';

/** Rng de teste: devolve os valores dados, em ordem, e depois `fallback`. */
export class SeqRng extends Rng {
  private queue: number[];
  constructor(
    values: number[],
    private readonly fallback = 0.5,
  ) {
    super(1);
    this.queue = [...values];
  }
  override next(): number {
    return this.queue.length ? (this.queue.shift() as number) : this.fallback;
  }
}

type CombatantOverrides = Partial<Omit<Combatant, 'attrs'>> & { attrs?: Partial<Attributes> };

/** Combatente neutro (todos os atributos 5, 100 HP, 50 chakra), sobrescrevível. */
export function makeCombatant(over: CombatantOverrides = {}): Combatant {
  const { attrs, ...rest } = over;
  return {
    id: 'c1',
    name: 'Teste',
    side: 'player',
    level: 1,
    grade: null,
    isBoss: false,
    clan: null,
    element: null,
    attrs: { ...emptyAttributes(5), ...attrs },
    maxHp: 100,
    hp: 100,
    maxChakra: 50,
    chakra: 50,
    damageMult: 1,
    jutsus: [],
    masteryUses: {},
    inventory: {},
    passiveMods: [],
    transformationId: null,
    transformTurns: 0,
    effects: [],
    tenacity: 0,
    defending: false,
    ai: 'player',
    templateId: null,
    aiOpened: false,
    ...rest,
  };
}
```

- [ ] **Step 4: Escrever o teste que falha — `tests/effects.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  activeControl,
  aggregateMods,
  applyDots,
  applyEffect,
  cleanseIllusions,
  consumeCharge,
  effectiveAttr,
  hasEffect,
  payTransformationUpkeep,
  tickDurations,
} from '../src/game/effects/EffectSystem';
import { makeCombatant } from './helpers';

const src = { sourceId: 'x' };

describe('sistema de efeitos', () => {
  it('buff dura N turnos do portador e expira com evento', () => {
    const c = makeCombatant();
    applyEffect(c, 'bunshin', src);
    expect(aggregateMods(c).dodge).toBeCloseTo(0.12);
    tickDurations(c);
    expect(hasEffect(c, 'bunshin')).toBe(true);
    const ev = tickDurations(c);
    expect(hasEffect(c, 'bunshin')).toBe(false);
    expect(ev).toContainEqual({ type: 'effectExpired', targetId: 'c1', effectId: 'bunshin' });
  });

  it('reaplicar renova a duração sem acumular', () => {
    const c = makeCombatant();
    applyEffect(c, 'bunshin', src);
    tickDurations(c);
    applyEffect(c, 'bunshin', src);
    expect(c.effects).toHaveLength(1);
    expect(c.effects[0]!.remaining).toBe(2);
    expect(aggregateMods(c).dodge).toBeCloseTo(0.12);
  });

  it('controle em chefe dura no máximo 1 turno', () => {
    const boss = makeCombatant({ isBoss: true });
    applyEffect(boss, 'imobilizado', { sourceId: 'x', duration: 2 });
    expect(boss.effects[0]!.remaining).toBe(1);
  });

  it('Tenacidade: 2 turnos de imunidade depois que um controle termina', () => {
    const c = makeCombatant({ side: 'enemy' });
    applyEffect(c, 'atordoado', src);
    tickDurations(c);
    expect(activeControl(c)).toBeUndefined();
    expect(c.tenacity).toBe(2);
    expect(applyEffect(c, 'imobilizado', src)).toContainEqual(
      expect.objectContaining({ type: 'effectResisted', reason: 'tenacity' }),
    );
    tickDurations(c);
    tickDurations(c);
    expect(c.tenacity).toBe(0);
    applyEffect(c, 'imobilizado', src);
    expect(activeControl(c)?.effectId).toBe('imobilizado');
  });

  it('um controle por vez: o segundo só renova a duração', () => {
    const c = makeCombatant({ side: 'enemy' });
    applyEffect(c, 'atordoado', src);
    applyEffect(c, 'imobilizado', { sourceId: 'x', duration: 2 });
    expect(activeControl(c)?.effectId).toBe('atordoado');
    expect(activeControl(c)?.remaining).toBe(2);
    expect(c.effects).toHaveLength(1);
  });

  it('queimadura: 4% do HP máximo por turno, por 3 turnos', () => {
    const c = makeCombatant({ maxHp: 200, hp: 200 });
    applyEffect(c, 'queimadura', src);
    for (let i = 0; i < 3; i++) {
      applyDots(c);
      tickDurations(c);
    }
    expect(c.hp).toBe(176);
    expect(applyDots(c)).toEqual([]);
  });

  it('queimadura que zera o HP emite defeated', () => {
    const c = makeCombatant({ maxHp: 100, hp: 3 });
    applyEffect(c, 'queimadura', src);
    expect(applyDots(c)).toContainEqual({ type: 'defeated', targetId: 'c1' });
    expect(c.hp).toBe(0);
  });

  it('agrega passivas e efeitos de forma aditiva', () => {
    const c = makeCombatant({ passiveMods: [{ crit: 0.03 }] });
    applyEffect(c, 'sharingan', src);
    const m = aggregateMods(c);
    expect(m.crit).toBeCloseTo(0.17);
    expect(m.jutsuDamagePct).toBeCloseTo(0.15);
  });

  it('atributo efetivo com Pergaminho de Reforço', () => {
    const c = makeCombatant({ attrs: { nin: 20 } });
    applyEffect(c, 'reforco_nin', src);
    expect(effectiveAttr(c, 'nin')).toBeCloseTo(22);
  });

  it('transformação: cobra manutenção e termina sem chakra', () => {
    const c = makeCombatant({ chakra: 10 });
    applyEffect(c, 'sharingan', src);
    expect(payTransformationUpkeep(c)).toContainEqual({ type: 'transformUpkeep', actorId: 'c1', amount: 2 });
    expect(c.chakra).toBe(8);
    expect(c.transformTurns).toBe(1);
    c.chakra = 1;
    expect(payTransformationUpkeep(c)).toContainEqual(expect.objectContaining({ type: 'transformOff', reason: 'noChakra' }));
    expect(hasEffect(c, 'sharingan')).toBe(false);
  });

  it('cargas: Kawarimi some ao consumir; Kage Bunshin mantém o bônus', () => {
    const c = makeCombatant();
    applyEffect(c, 'kawarimi', src);
    expect(consumeCharge(c, 'negateHit')).not.toBeNull();
    expect(hasEffect(c, 'kawarimi')).toBe(false);
    applyEffect(c, 'kage_bunshin', src);
    expect(consumeCharge(c, 'absorbHit')).not.toBeNull();
    expect(consumeCharge(c, 'absorbHit')).toBeNull();
    expect(aggregateMods(c).jutsuDamagePct).toBeCloseTo(0.25);
  });

  it('Kai remove a Ilusão e inicia a Tenacidade', () => {
    const c = makeCombatant();
    applyEffect(c, 'ilusao', src);
    cleanseIllusions(c);
    expect(activeControl(c)).toBeUndefined();
    expect(c.tenacity).toBe(2);
  });

  it('tickDurations pode preservar um efeito (Ilusão aguardando Kai)', () => {
    const c = makeCombatant();
    applyEffect(c, 'ilusao', src);
    tickDurations(c, ['ilusao']);
    expect(activeControl(c)?.effectId).toBe('ilusao');
  });
});
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `npx vitest run tests/effects.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/effects/EffectSystem"`.

- [ ] **Step 6: Implementar `src/game/effects/EffectSystem.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { emptyAttributes } from '../attributes';
import { RuleError } from '../errors';
import type { GameEvent } from '../events';
import { ATTR_KEYS, ELEMENTS, type AttrKey, type Element, type Modifiers } from '../types';
import { EFFECTS, type EffectDef } from '../../data/effects';
import type { ActiveEffect, Combatant } from '../combat/types';

/**
 * Sistema GENÉRICO de efeitos (DD v2 §10). Buff, debuff, controle, dano
 * contínuo e transformação passam todos por aqui.
 * As funções MUTAM o combatente recebido: o combate sempre trabalha numa
 * cópia do estado, então isso é seguro e evita clonar a cada passo.
 */

export interface ModTotals {
  attrPct: Record<AttrKey, number>;
  dodge: number;
  crit: number;
  damagePct: number;
  jutsuDamagePct: number;
  elementDamagePct: Record<Element, number>;
  reduction: number;
  chakraCostPct: number;
  ryoPct: number;
  repPct: number;
  shopPricePct: number;
}

export function emptyTotals(): ModTotals {
  return {
    attrPct: emptyAttributes(0),
    dodge: 0,
    crit: 0,
    damagePct: 0,
    jutsuDamagePct: 0,
    elementDamagePct: { fogo: 0, vento: 0, raio: 0, terra: 0, agua: 0 },
    reduction: 0,
    chakraCostPct: 0,
    ryoPct: 0,
    repPct: 0,
    shopPricePct: 0,
  };
}

export function addMods(t: ModTotals, m: Modifiers): void {
  for (const k of ATTR_KEYS) t.attrPct[k] += m.attrPct?.[k] ?? 0;
  for (const e of ELEMENTS) t.elementDamagePct[e] += m.elementDamagePct?.[e] ?? 0;
  t.dodge += m.dodge ?? 0;
  t.crit += m.crit ?? 0;
  t.damagePct += m.damagePct ?? 0;
  t.jutsuDamagePct += m.jutsuDamagePct ?? 0;
  t.reduction += m.reduction ?? 0;
  t.chakraCostPct += m.chakraCostPct ?? 0;
  t.ryoPct += m.ryoPct ?? 0;
  t.repPct += m.repPct ?? 0;
  t.shopPricePct += m.shopPricePct ?? 0;
}

export function sumModifiers(list: Modifiers[]): ModTotals {
  const t = emptyTotals();
  for (const m of list) addMods(t, m);
  return t;
}

function def(id: string): EffectDef {
  const d = EFFECTS[id];
  if (!d) throw new RuleError('unknownEffect', `Efeito desconhecido: ${id}`);
  return d;
}

/** Soma passivas (clã, título) + efeitos ativos num único "balde" aditivo. */
export function aggregateMods(c: Combatant): ModTotals {
  const t = sumModifiers(c.passiveMods);
  for (const e of c.effects) {
    const d = def(e.effectId);
    if (d.mods) addMods(t, d.mods);
  }
  return t;
}

/** Atributo efetivo em batalha = (base + equipamento) × (1 + % de efeitos). */
export function effectiveAttr(c: Combatant, k: AttrKey): number {
  return c.attrs[k] * (1 + aggregateMods(c).attrPct[k]);
}

export function hasEffect(c: Combatant, id: string): boolean {
  return c.effects.some((e) => e.effectId === id);
}

export function activeControl(c: Combatant): ActiveEffect | undefined {
  return c.effects.find((e) => def(e.effectId).type === 'control');
}

export function activeTransformation(c: Combatant): ActiveEffect | undefined {
  return c.effects.find((e) => def(e.effectId).type === 'transformation');
}

/** Controle dura no máximo 2 turnos em comuns e 1 em chefes. */
export function controlDuration(c: Combatant, requested: number): number {
  const cap = c.isBoss ? B.control.maxTurnsBoss : B.control.maxTurnsCommon;
  return Math.max(1, Math.min(requested, cap));
}

export function applyEffect(c: Combatant, effectId: string, opts: { sourceId: string; duration?: number }): GameEvent[] {
  const d = def(effectId);

  if (d.type === 'control') {
    if (c.tenacity > 0) return [{ type: 'effectResisted', targetId: c.id, effectId, reason: 'tenacity' }];
    const duration = controlDuration(c, opts.duration ?? (typeof d.duration === 'number' ? d.duration : 1));
    const current = activeControl(c);
    if (current) {
      // Um controle por vez: o novo só renova a duração do atual (sem somar).
      current.remaining = Math.max(current.remaining ?? 0, duration);
      return [{ type: 'effectApplied', targetId: c.id, effectId: current.effectId, remaining: current.remaining }];
    }
    c.effects.push({ effectId, remaining: duration, sourceId: opts.sourceId, chargeUsed: false });
    return [{ type: 'effectApplied', targetId: c.id, effectId, remaining: duration }];
  }

  const events: GameEvent[] = [];
  if (d.type === 'transformation') {
    const current = activeTransformation(c);
    if (current && current.effectId !== effectId) events.push(...removeEffect(c, current.effectId));
  }
  const remaining = typeof d.duration === 'number' ? (opts.duration ?? d.duration) : null;
  const existing = c.effects.find((e) => e.effectId === effectId);
  if (existing) {
    existing.remaining = remaining; // renova, não acumula
    existing.chargeUsed = false;
    existing.sourceId = opts.sourceId;
  } else {
    c.effects.push({ effectId, remaining, sourceId: opts.sourceId, chargeUsed: false });
  }
  events.push({ type: 'effectApplied', targetId: c.id, effectId, remaining });
  return events;
}

/** Remove um efeito. Se for controle, começa a Tenacidade. */
export function removeEffect(c: Combatant, effectId: string): GameEvent[] {
  const e = c.effects.find((x) => x.effectId === effectId);
  if (!e) return [];
  c.effects = c.effects.filter((x) => x !== e);
  if (def(effectId).type === 'control') c.tenacity = B.control.tenacityTurns;
  return [{ type: 'effectExpired', targetId: c.id, effectId }];
}

/**
 * Consome a primeira carga disponível do tipo pedido. Efeitos que SÓ têm
 * carga (Kawarimi, Henge) somem; os que também têm bônus (Kage Bunshin) ficam.
 */
export function consumeCharge(c: Combatant, kind: 'negateHit' | 'absorbHit' | 'missChance'): ActiveEffect | null {
  const e = c.effects.find((x) => def(x.effectId).charge === kind && !x.chargeUsed);
  if (!e) return null;
  e.chargeUsed = true;
  if (!def(e.effectId).mods) c.effects = c.effects.filter((x) => x !== e);
  return e;
}

export function applyDots(c: Combatant): GameEvent[] {
  const events: GameEvent[] = [];
  for (const e of c.effects) {
    const d = def(e.effectId);
    if (d.type !== 'dot' || !d.dotPctMaxHp || c.hp <= 0) continue;
    const amount = Math.max(1, Math.round(c.maxHp * d.dotPctMaxHp));
    c.hp = Math.max(0, c.hp - amount);
    events.push({ type: 'dot', targetId: c.id, effectId: e.effectId, amount, hpAfter: c.hp });
    if (c.hp === 0) events.push({ type: 'defeated', targetId: c.id });
  }
  return events;
}

/** Cobra o custo por turno da transformação ativa; sem chakra, ela termina. */
export function payTransformationUpkeep(c: Combatant): GameEvent[] {
  const t = activeTransformation(c);
  if (!t) return [];
  const upkeep = def(t.effectId).upkeepPerTurn ?? 0;
  if (c.chakra < upkeep) {
    return [
      ...removeEffect(c, t.effectId),
      { type: 'transformOff', actorId: c.id, transformationId: t.effectId, reason: 'noChakra' },
    ];
  }
  c.chakra -= upkeep;
  c.transformTurns++;
  return [{ type: 'transformUpkeep', actorId: c.id, amount: upkeep }];
}

/**
 * Passa um turno do portador: Tenacidade −1 e duração dos efeitos −1.
 * `keep` preserva efeitos específicos (Ilusão enquanto o jogador decide usar Kai).
 */
export function tickDurations(c: Combatant, keep: string[] = []): GameEvent[] {
  const events: GameEvent[] = [];
  if (c.tenacity > 0) c.tenacity--;
  for (const e of [...c.effects]) {
    if (e.remaining === null || keep.includes(e.effectId)) continue;
    e.remaining--;
    if (e.remaining <= 0) events.push(...removeEffect(c, e.effectId));
  }
  return events;
}

/** Kai: remove Ilusão e efeitos de Genjutsu de si mesmo. */
export function cleanseIllusions(c: Combatant): GameEvent[] {
  const events: GameEvent[] = [];
  for (const e of [...c.effects]) if (def(e.effectId).removableByKai) events.push(...removeEffect(c, e.effectId));
  return events;
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run tests/effects.test.ts && npx tsc --noEmit`
Expected: 13 testes PASS; `tsc` sem saída.

- [ ] **Step 8: Commit**

```bash
git add src/game/combat/types.ts src/game/events.ts src/game/effects tests/helpers.ts tests/effects.test.ts
git commit -m "feat: sistema genérico de efeitos com controle, Tenacidade e transformação

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Resolução de um golpe (dano, esquiva, crítico, cargas)

**Files:**
- Create: `src/game/combat/cost.ts`, `src/game/combat/damage.ts`
- Test: `tests/damage.test.ts`

**Interfaces:**
- Consumes: `EffectSystem` (aggregateMods, effectiveAttr, consumeCharge), fórmulas, `masteryLevelFromUses`, `jutsuChakraCost`, `EFFECTS`.
- Produces (cost.ts): `currentMasteryLevel(c: Combatant, j: JutsuDef): number`, `costFor(c: Combatant, j: JutsuDef): number`
- Produces (damage.ts): `interface HitSpec { power: number; attrKey: AttrKey; element: Element | null; masteryLevel: number; jutsuId: string | null }`, `interface HitResult { events: GameEvent[]; landed: boolean }`, `resolveHit(att: Combatant, tgt: Combatant, spec: HitSpec, rng: Rng): HitResult` (muta `tgt`).
- Ordem de sorteio (importante para testes): sem cargas, consome exatamente 3 valores do Rng: **esquiva, crítico, variação**. Com Henge ativo, consome 1 valor antes (erro do Henge). Kawarimi e clone do Kage Bunshin não consomem sorteio.

- [ ] **Step 1: Escrever o teste que falha — `tests/damage.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { resolveHit, type HitSpec } from '../src/game/combat/damage';
import { applyEffect, hasEffect } from '../src/game/effects/EffectSystem';
import { makeCombatant, SeqRng } from './helpers';

const attacker = () => makeCombatant({ id: 'a', attrs: { tai: 8, crit: 5, vel: 10 } });
const target = () => makeCombatant({ id: 'd', side: 'enemy', attrs: { def: 10, vel: 10 } });
const atk: HitSpec = { power: 18, attrKey: 'tai', element: null, masteryLevel: 0, jutsuId: null };
const NO_DODGE_NO_CRIT = [0.99, 0.99, 0.5]; // esquiva, crítico, variação (0,5 → ×1,0)

describe('resolveHit', () => {
  it('dano base: 18 × (1 + 8/40) × (1 − 16,7%) = 18', () => {
    const d = target();
    const r = resolveHit(attacker(), d, atk, new SeqRng(NO_DODGE_NO_CRIT));
    expect(r.landed).toBe(true);
    expect(d.hp).toBe(82);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'damage', amount: 18, crit: false, hpAfter: 82 }));
  });

  it('crítico multiplica por 1,5', () => {
    const d = target();
    resolveHit(attacker(), d, atk, new SeqRng([0.99, 0.0, 0.5]));
    expect(d.hp).toBe(73);
  });

  it('esquiva: nenhum dano e landed = false', () => {
    const d = target();
    const r = resolveHit(attacker(), d, atk, new SeqRng([0.0]));
    expect(r.landed).toBe(false);
    expect(d.hp).toBe(100);
    expect(r.events).toEqual([{ type: 'dodge', sourceId: 'a', targetId: 'd' }]);
  });

  it('vantagem elemental e bônus percentuais somam num único balde', () => {
    const a = makeCombatant({ id: 'a', attrs: { nin: 10, crit: 0 }, passiveMods: [{ elementDamagePct: { fogo: 0.15 } }] });
    const d = makeCombatant({ id: 'd', side: 'enemy', element: 'vento', attrs: { def: 0 } });
    resolveHit(a, d, { power: 26, attrKey: 'nin', element: 'fogo', masteryLevel: 0, jutsuId: 'bola_de_fogo' }, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(100 - 49); // 26 × 1,25 × 1,3 × 1,15 = 48,6
  });

  it('maestria +5 soma 15% de dano', () => {
    const d = target();
    resolveHit(attacker(), d, { ...atk, masteryLevel: 5 }, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(100 - 21);
  });

  it('multiplicador de grau do inimigo e Defender reduzem o dano', () => {
    const a = makeCombatant({ id: 'a', attrs: { tai: 8, crit: 5 }, damageMult: 0.6 });
    const d = makeCombatant({ id: 'd', side: 'enemy', attrs: { def: 10 }, defending: true });
    resolveHit(a, d, atk, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(100 - 5); // 18 × 0,6 × 0,5 = 5,4
  });

  it('Kawarimi anula o golpe sem sortear nada', () => {
    const d = target();
    applyEffect(d, 'kawarimi', { sourceId: 'd' });
    const r = resolveHit(attacker(), d, atk, new SeqRng([]));
    expect(r.events).toEqual([{ type: 'negated', sourceId: 'a', targetId: 'd', reason: 'kawarimi' }]);
    expect(hasEffect(d, 'kawarimi')).toBe(false);
    expect(d.hp).toBe(100);
  });

  it('clone do Kage Bunshin absorve um golpe depois da esquiva e mantém o bônus', () => {
    const d = target();
    applyEffect(d, 'kage_bunshin', { sourceId: 'd' });
    const r = resolveHit(attacker(), d, atk, new SeqRng([0.99]));
    expect(r.events).toEqual([{ type: 'negated', sourceId: 'a', targetId: 'd', reason: 'clone' }]);
    expect(hasEffect(d, 'kage_bunshin')).toBe(true);
  });

  it('Henge: 30% de errar, consumido acertando ou não', () => {
    const d1 = target();
    applyEffect(d1, 'henge', { sourceId: 'd' });
    expect(resolveHit(attacker(), d1, atk, new SeqRng([0.1])).events[0]).toMatchObject({ type: 'miss', reason: 'henge' });
    const d2 = target();
    applyEffect(d2, 'henge', { sourceId: 'd' });
    resolveHit(attacker(), d2, atk, new SeqRng([0.5, ...NO_DODGE_NO_CRIT]));
    expect(d2.hp).toBe(82);
    expect(hasEffect(d2, 'henge')).toBe(false);
  });

  it('nunca causa menos de 1 de dano e emite defeated ao zerar', () => {
    const d = makeCombatant({ id: 'd', side: 'enemy', attrs: { def: 500 }, hp: 1 });
    const r = resolveHit(makeCombatant({ id: 'a', attrs: { crit: 0 } }), d, { ...atk, power: 1 }, new SeqRng(NO_DODGE_NO_CRIT));
    expect(d.hp).toBe(0);
    expect(r.events).toContainEqual({ type: 'defeated', targetId: 'd' });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/damage.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/combat/damage"`.

- [ ] **Step 3: Implementar `src/game/combat/cost.ts`**

```ts
import type { JutsuDef } from '../../data/jutsus';
import { aggregateMods } from '../effects/EffectSystem';
import { jutsuChakraCost, masteryLevelFromUses } from '../progression/mastery';
import type { Combatant } from './types';

export function currentMasteryLevel(c: Combatant, j: JutsuDef): number {
  return masteryLevelFromUses(c.masteryUses[j.id] ?? 0, j, c.clan, c.element);
}

/** Custo de chakra do jutsu para este combatente agora (maestria, clã, afinidade, título). */
export function costFor(c: Combatant, j: JutsuDef): number {
  return jutsuChakraCost(j, {
    clan: c.clan,
    affinity: c.element,
    masteryLevel: currentMasteryLevel(c, j),
    costPct: aggregateMods(c).chakraCostPct,
  });
}
```

- [ ] **Step 4: Implementar `src/game/combat/damage.ts`**

```ts
import { BALANCE as B } from '../Balance';
import type { GameEvent } from '../events';
import { critChance, dodgeChance, elementMultiplier, totalReduction } from '../formulas';
import type { Rng } from '../Rng';
import type { AttrKey, Element } from '../types';
import { EFFECTS } from '../../data/effects';
import { aggregateMods, consumeCharge, effectiveAttr } from '../effects/EffectSystem';
import type { Combatant } from './types';

export interface HitSpec {
  power: number;
  attrKey: AttrKey;
  element: Element | null;
  masteryLevel: number;
  jutsuId: string | null;
}

export interface HitResult {
  events: GameEvent[];
  /** O golpe acertou? Efeitos "no inimigo" de um jutsu de dano só valem se acertar. */
  landed: boolean;
}

/**
 * Resolve UM golpe (DD v2 §9 + spec §4). Ordem:
 * 1. Kawarimi anula;  2. Henge pode fazer errar;  3. esquiva;
 * 4. clone do Kage Bunshin absorve;  5. dano.
 * Dano = Poder × (1+0,03·m) × (1+Atr/40) × Elem × (1+Σbônus) × (1−Red) × Crit × Var × multGrau × (0,5 se defendendo)
 */
export function resolveHit(att: Combatant, tgt: Combatant, spec: HitSpec, rng: Rng): HitResult {
  const base = { sourceId: att.id, targetId: tgt.id };

  if (consumeCharge(tgt, 'negateHit')) {
    return { events: [{ type: 'negated', ...base, reason: 'kawarimi' }], landed: false };
  }
  const henge = consumeCharge(tgt, 'missChance');
  if (henge && rng.chance(EFFECTS[henge.effectId]?.chargeChance ?? 0)) {
    return { events: [{ type: 'miss', ...base, reason: 'henge' }], landed: false };
  }

  const am = aggregateMods(att);
  const tm = aggregateMods(tgt);
  if (rng.chance(dodgeChance(effectiveAttr(tgt, 'vel'), effectiveAttr(att, 'vel'), tm.dodge))) {
    return { events: [{ type: 'dodge', ...base }], landed: false };
  }
  if (consumeCharge(tgt, 'absorbHit')) {
    return { events: [{ type: 'negated', ...base, reason: 'clone' }], landed: false };
  }

  const attr = effectiveAttr(att, spec.attrKey);
  const elem = elementMultiplier(spec.element, tgt.element);
  const bonus =
    am.damagePct + (spec.jutsuId ? am.jutsuDamagePct : 0) + (spec.element ? am.elementDamagePct[spec.element] : 0);
  const reduction = totalReduction(effectiveAttr(tgt, 'def'), tm.reduction);
  const crit = rng.chance(critChance(effectiveAttr(att, 'crit'), am.crit));
  const variance = rng.range(B.damage.varianceMin, B.damage.varianceMax);

  let dmg =
    spec.power *
    (1 + B.mastery.damagePerLevel * spec.masteryLevel) *
    (1 + attr / B.damage.attrDivisor) *
    elem *
    (1 + bonus) *
    (1 - reduction) *
    (crit ? B.damage.critMultiplier : 1) *
    variance *
    att.damageMult;
  if (tgt.defending) dmg *= B.actions.defendDamageMult;

  const amount = Math.max(1, Math.round(dmg));
  tgt.hp = Math.max(0, tgt.hp - amount);
  const events: GameEvent[] = [
    { type: 'damage', ...base, amount, crit, elementMult: elem, jutsuId: spec.jutsuId, hpAfter: tgt.hp },
  ];
  if (tgt.hp === 0) events.push({ type: 'defeated', targetId: tgt.id });
  return { events, landed: true };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/damage.test.ts && npx tsc --noEmit`
Expected: 10 testes PASS; `tsc` sem saída.

- [ ] **Step 6: Commit**

```bash
git add src/game/combat/cost.ts src/game/combat/damage.ts tests/damage.test.ts
git commit -m "feat: resolução de golpe com esquiva, crítico, elemento e cargas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: Batalha por turnos (fluxo, ações, transformação, controle, fim)

**Files:**
- Create: `src/game/combat/battle.ts`, `src/game/combat/ai.ts` (versão mínima neste passo; completada na Task 8)
- Test: `tests/battle.test.ts`

**Interfaces:**
- Consumes: Tasks 5 e 6 (EffectSystem, `resolveHit`, `costFor`, `currentMasteryLevel`), `controlChance`, `effectChance`, `chakraRegen`, `JUTSUS`, `ITEMS`, `CLANS`, `EFFECTS`, `REFORCO_ATTRS`.
- Produces:
  - `startBattle(player: Combatant, enemy: Combatant, rng: Rng): { state: BattleState; events: GameEvent[] }` — clona os combatentes e avança até precisar de entrada do jogador ou a luta acabar.
  - `applyAction(state: BattleState, action: Action, rng: Rng): { state: BattleState; events: GameEvent[] }` — não muta `state`.
  - `applyActionInPlace(state: BattleState, action: Action, rng: Rng): GameEvent[]` — muta (simulador).
  - `getPlayer(s: BattleState): Combatant`, `getEnemy(s: BattleState): Combatant`
  - `chooseAiAction(s: BattleState, self: Combatant): Action` (ai.ts; completo na Task 8)
- Regras de turno (spec §4): início do turno = regenera chakra → manutenção da transformação → dano contínuo → checa controle (perde a vez, exceto Ilusão com Kai disponível para o jogador) → desconta durações. Transformar é ação livre 1×/turno quando `activationCostsTurn` é falso. Limite de segurança: `BALANCE.battle.maxRounds` (200) → derrota por tempo.

- [ ] **Step 1: Criar a IA mínima `src/game/combat/ai.ts` (substituída na Task 8)**

```ts
import type { Action, BattleState, Combatant } from './types';

/** Versão mínima: sempre ataca. A Task 8 implementa as regras do DD v2 §9. */
export function chooseAiAction(_s: BattleState, _self: Combatant): Action {
  return { type: 'attack' };
}
```

- [ ] **Step 2: Escrever o teste que falha — `tests/battle.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { applyAction, getEnemy, getPlayer, startBattle } from '../src/game/combat/battle';
import { activeControl, applyEffect } from '../src/game/effects/EffectSystem';
import type { Action, BattleState, Combatant } from '../src/game/combat/types';
import { Rng } from '../src/game/Rng';
import { RuleError } from '../src/game/errors';
import { makeCombatant, SeqRng } from './helpers';

function players(over: Partial<Combatant> = {}): { p: Combatant; e: Combatant } {
  const p = makeCombatant({ id: 'player', side: 'player', attrs: { vel: 30, tai: 10, gen: 8 }, jutsus: ['bola_de_fogo'], ...over });
  const e = makeCombatant({ id: 'enemy', side: 'enemy', ai: 'basic', attrs: { vel: 1 }, jutsus: ['golpe_pesado'] });
  return { p, e };
}

function codeOf(fn: () => unknown): string | null {
  try {
    fn();
  } catch (err) {
    return err instanceof RuleError ? err.code : 'not-a-rule-error';
  }
  return null;
}

describe('fluxo da batalha', () => {
  it('o mais rápido recebe o primeiro turno', () => {
    const { p, e } = players();
    const { state, events } = startBattle(p, e, new Rng(1));
    expect(events[0]).toEqual({ type: 'battleStart', playerId: 'player', enemyId: 'enemy' });
    expect(events.some((x) => x.type === 'roundStart')).toBe(true);
    expect(state.status).toBe('awaitingInput');
    expect(state.activeId).toBe('player');
  });

  it('depois da ação do jogador o inimigo age e a vez volta', () => {
    const { p, e } = players();
    const s0 = startBattle(p, e, new Rng(1)).state;
    const { state, events } = applyAction(s0, { type: 'attack' }, new Rng(2));
    expect(events.some((x) => x.type === 'turnStart' && x.actorId === 'enemy')).toBe(true);
    expect(state.status).toBe('awaitingInput');
    expect(state.round).toBe(2);
    expect(s0.round).toBe(1); // não muta o estado anterior
  });

  it('erros de regra: sem chakra, não equipado, batalha encerrada', () => {
    const { p, e } = players();
    const s = startBattle(p, e, new Rng(1)).state;
    getPlayer(s).chakra = 0;
    expect(codeOf(() => applyAction(s, { type: 'jutsu', jutsuId: 'bola_de_fogo' }, new Rng(1)))).toBe('noChakra');
    expect(codeOf(() => applyAction(s, { type: 'jutsu', jutsuId: 'goukakyuu' }, new Rng(1)))).toBe('notEquipped');
    const ended: BattleState = { ...s, status: 'ended' };
    expect(codeOf(() => applyAction(ended, { type: 'attack' }, new Rng(1)))).toBe('battleEnded');
  });

  it('vitória quando o inimigo chega a 0 de HP', () => {
    const { p, e } = players();
    e.hp = 1;
    const rng = new SeqRng([], 0.99);
    const s = startBattle(p, e, rng).state;
    const { state, events } = applyAction(s, { type: 'attack' }, rng);
    expect(state.status).toBe('ended');
    expect(state.winner).toBe('player');
    expect(events.at(-1)).toEqual({ type: 'battleEnd', winner: 'player', reason: 'ko' });
  });

  it('jogador morre por queimadura no início do próprio turno (Review Focus 3)', () => {
    const { p, e } = players({ hp: 1 });
    applyEffect(p, 'queimadura', { sourceId: 'enemy' });
    const { state, events } = startBattle(p, e, new SeqRng([], 0.99));
    expect(state.status).toBe('ended');
    expect(state.winner).toBe('enemy');
    expect(events.some((x) => x.type === 'dot' && x.targetId === 'player')).toBe(true);
  });
});

describe('ações', () => {
  it('transformação é ação livre (1×/turno) e cobra manutenção no turno seguinte', () => {
    const { p, e } = players({ transformationId: 'sharingan' });
    const rng = new Rng(7);
    const s0 = startBattle(p, e, rng).state;
    const r1 = applyAction(s0, { type: 'transform' }, rng);
    expect(r1.events).toContainEqual({ type: 'transformOn', actorId: 'player', transformationId: 'sharingan' });
    expect(r1.state.status).toBe('awaitingInput');
    expect(r1.state.activeId).toBe('player');
    expect(codeOf(() => applyAction(r1.state, { type: 'transform' }, rng))).toBe('alreadyToggled');
    const r2 = applyAction(r1.state, { type: 'attack' }, rng);
    expect(r2.events).toContainEqual({ type: 'transformUpkeep', actorId: 'player', amount: 2 });
  });

  it('inimigo controlado perde o turno', () => {
    const { p, e } = players();
    applyEffect(e, 'imobilizado', { sourceId: 'player', duration: 1 });
    const s = startBattle(p, e, new Rng(3)).state;
    const { events } = applyAction(s, { type: 'attack' }, new Rng(4));
    expect(events).toContainEqual({ type: 'controlledSkip', actorId: 'enemy', effectId: 'imobilizado' });
  });

  it('sob Ilusão o jogador só pode usar Kai', () => {
    const { p, e } = players({ jutsus: ['kai'] });
    applyEffect(p, 'ilusao', { sourceId: 'enemy' });
    const s = startBattle(p, e, new Rng(5)).state;
    expect(s.onlyKai).toBe(true);
    expect(codeOf(() => applyAction(s, { type: 'attack' }, new Rng(1)))).toBe('onlyKai');
    const { state } = applyAction(s, { type: 'jutsu', jutsuId: 'kai' }, new Rng(1));
    expect(activeControl(getPlayer(state))).toBeUndefined();
  });

  it('maestria sobe com o uso e emite masteryUp', () => {
    const { p, e } = players({ masteryUses: { bola_de_fogo: 5 } });
    const s = startBattle(p, e, new Rng(9)).state;
    const { state, events } = applyAction(s, { type: 'jutsu', jutsuId: 'bola_de_fogo' }, new Rng(9));
    expect(getPlayer(state).masteryUses['bola_de_fogo']).toBe(6);
    expect(events).toContainEqual({ type: 'masteryUp', actorId: 'player', jutsuId: 'bola_de_fogo', level: 1 });
  });

  it('Meditar recupera 25% do chakra máximo (Uzumaki 30%)', () => {
    for (const [clan, gain] of [[null, 13], ['uzumaki', 15]] as const) {
      const { p, e } = players({ clan });
      const s = startBattle(p, e, new Rng(1)).state;
      getPlayer(s).chakra = 0;
      const { events } = applyAction(s, { type: 'meditate' }, new Rng(1));
      expect(events).toContainEqual({ type: 'meditate', actorId: 'player', chakra: gain });
    }
  });

  it('Defender: ganha 10% de chakra e reduz o dano até o próximo turno', () => {
    const { p, e } = players();
    const s = startBattle(p, e, new Rng(1)).state;
    getPlayer(s).chakra = 0;
    const { events } = applyAction(s, { type: 'defend' }, new Rng(1));
    expect(events).toContainEqual({ type: 'defend', actorId: 'player', chakra: 5 });
  });

  it('Item: kit cura 40% e é consumido; sem item gera erro', () => {
    const { p, e } = players({ hp: 50, inventory: { kit_medico: 1 } });
    const s = startBattle(p, e, new Rng(1)).state;
    const r = applyAction(s, { type: 'item', itemId: 'kit_medico' }, new Rng(1));
    expect(r.events).toContainEqual({ type: 'heal', targetId: 'player', hp: 40, chakra: 0 });
    expect(getPlayer(r.state).inventory['kit_medico']).toBe(0);
    expect(codeOf(() => applyAction(r.state, { type: 'item', itemId: 'kit_medico' }, new Rng(1)))).toBe('noItem');
    expect(codeOf(() => applyAction(s, { type: 'item', itemId: 'katana' }, new Rng(1)))).toBe('notConsumable');
  });

  it('mesma semente + mesmas ações = mesmo resultado', () => {
    const play = () => {
      const { p, e } = players();
      const rng = new Rng(123);
      let s = startBattle(p, e, rng).state;
      const act: Action = { type: 'attack' };
      for (let i = 0; i < 30 && s.status === 'awaitingInput'; i++) s = applyAction(s, act, rng).state;
      return JSON.stringify(s);
    };
    expect(play()).toBe(play());
  });

  it('getEnemy devolve o lado inimigo', () => {
    const { p, e } = players();
    expect(getEnemy(startBattle(p, e, new Rng(1)).state).id).toBe('enemy');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/battle.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/combat/battle"`.

- [ ] **Step 4: Implementar `src/game/combat/battle.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { CATEGORY_ATTR } from '../attributes';
import { RuleError } from '../errors';
import type { GameEvent } from '../events';
import { chakraRegen, controlChance, effectChance } from '../formulas';
import type { Rng } from '../Rng';
import { CLANS } from '../../data/clans';
import { EFFECTS, REFORCO_ATTRS } from '../../data/effects';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import {
  activeControl,
  activeTransformation,
  applyDots,
  applyEffect,
  cleanseIllusions,
  effectiveAttr,
  payTransformationUpkeep,
  removeEffect,
  tickDurations,
} from '../effects/EffectSystem';
import { chooseAiAction } from './ai';
import { costFor, currentMasteryLevel } from './cost';
import { resolveHit } from './damage';
import type { Action, BattleState, Combatant } from './types';

/**
 * Máquina de estados da batalha.
 * - startBattle/applyAction devolvem um NOVO estado + os eventos do que aconteceu.
 * - Turnos de inimigos são resolvidos automaticamente até o jogador precisar agir.
 * - A interface (Plano 2) só anima a lista de eventos, na ordem.
 */
export function startBattle(player: Combatant, enemy: Combatant, rng: Rng): { state: BattleState; events: GameEvent[] } {
  const state: BattleState = {
    combatants: [structuredClone(player), structuredClone(enemy)],
    round: 0,
    order: [],
    turnPos: -1,
    activeId: null,
    status: 'running',
    winner: null,
    transformToggled: false,
    onlyKai: false,
  };
  const events: GameEvent[] = [{ type: 'battleStart', playerId: player.id, enemyId: enemy.id }];
  advance(state, rng, events);
  return { state, events };
}

export function applyAction(state: BattleState, action: Action, rng: Rng): { state: BattleState; events: GameEvent[] } {
  const s = structuredClone(state);
  const events = applyActionInPlace(s, action, rng);
  return { state: s, events };
}

/** Variante que MUTA o estado (usada pelo simulador, onde clonar a cada ação custa caro). */
export function applyActionInPlace(s: BattleState, action: Action, rng: Rng): GameEvent[] {
  if (s.status === 'ended') throw new RuleError('battleEnded', 'A batalha já terminou.');
  if (s.status !== 'awaitingInput' || !s.activeId) throw new RuleError('notYourTurn', 'Não é a vez do jogador.');
  const actor = byId(s, s.activeId);
  const events: GameEvent[] = [];

  if (action.type === 'transform') {
    if (s.onlyKai) throw new RuleError('onlyKai', 'Sob Ilusão, só é possível usar Kai.');
    const consumesTurn = toggleTransformation(s, actor, events);
    if (!consumesTurn) return events; // ação livre: continua a vez do jogador
  } else {
    if (s.onlyKai && !(action.type === 'jutsu' && JUTSUS[action.jutsuId]?.cleanse)) {
      throw new RuleError('onlyKai', 'Sob Ilusão, só é possível usar Kai.');
    }
    execute(s, actor, action, rng, events);
  }

  s.onlyKai = false;
  s.activeId = null;
  s.status = 'running';
  if (!checkEnd(s, events)) advance(s, rng, events);
  return events;
}

export function getPlayer(s: BattleState): Combatant {
  return s.combatants.find((c) => c.side === 'player') as Combatant;
}

export function getEnemy(s: BattleState): Combatant {
  return s.combatants.find((c) => c.side === 'enemy') as Combatant;
}

// ------------------------------------------------------------------ fluxo

function byId(s: BattleState, id: string): Combatant {
  const c = s.combatants.find((x) => x.id === id);
  if (!c) throw new RuleError('unknownCombatant', `Combatente desconhecido: ${id}`);
  return c;
}

function opponent(s: BattleState, actor: Combatant): Combatant {
  return s.combatants.find((c) => c.side !== actor.side) as Combatant;
}

/** Avança turnos (resolvendo os inimigos) até o jogador precisar agir ou a luta acabar. */
function advance(s: BattleState, rng: Rng, ev: GameEvent[]): void {
  while (s.status !== 'ended') {
    s.turnPos++;
    if (s.turnPos >= s.order.length) {
      newRound(s, rng, ev);
      if (checkEnd(s, ev)) return;
    }
    const actor = byId(s, s.order[s.turnPos] as string);
    if (actor.hp <= 0) continue;
    const outcome = beginTurn(s, actor, ev);
    if (checkEnd(s, ev)) return;
    if (outcome === 'skip') continue;
    if (actor.side === 'player') {
      s.status = 'awaitingInput';
      s.activeId = actor.id;
      return;
    }
    execute(s, actor, chooseAiAction(s, actor), rng, ev);
    if (checkEnd(s, ev)) return;
  }
}

/** Ordem da rodada: Velocidade efetiva × (1 + sorteio 0..10%), recalculada todo turno (DD v2 §9). */
function newRound(s: BattleState, rng: Rng, ev: GameEvent[]): void {
  s.round++;
  const rolls = s.combatants
    .filter((c) => c.hp > 0)
    .map((c) => ({ id: c.id, v: effectiveAttr(c, 'vel') * (1 + rng.range(0, B.turnOrderJitter)) }));
  rolls.sort((a, b) => b.v - a.v);
  s.order = rolls.map((r) => r.id);
  s.turnPos = 0;
  ev.push({ type: 'roundStart', round: s.round, order: [...s.order] });
}

/** Início do turno (spec §4): regen → manutenção → dano contínuo → controle → durações. */
function beginTurn(s: BattleState, actor: Combatant, ev: GameEvent[]): 'act' | 'skip' {
  ev.push({ type: 'turnStart', actorId: actor.id, round: s.round });
  actor.defending = false;
  s.transformToggled = false;
  s.onlyKai = false;

  const regen = Math.min(chakraRegen(effectiveAttr(actor, 'int')), actor.maxChakra - actor.chakra);
  if (regen > 0) {
    actor.chakra += regen;
    ev.push({ type: 'chakraRegen', actorId: actor.id, amount: regen });
  }
  ev.push(...payTransformationUpkeep(actor));
  ev.push(...applyDots(actor));
  if (actor.hp <= 0) return 'skip';

  const control = activeControl(actor);
  if (!control) {
    ev.push(...tickDurations(actor));
    return 'act';
  }
  const canKai =
    actor.side === 'player' &&
    EFFECTS[control.effectId]?.controlKind === 'illusion' &&
    actor.jutsus.some((id) => {
      const j = JUTSUS[id];
      return !!j?.cleanse && costFor(actor, j) <= actor.chakra;
    });
  if (canKai) {
    // A Ilusão não expira sozinha: o jogador precisa gastar o Kai.
    s.onlyKai = true;
    ev.push(...tickDurations(actor, [control.effectId]));
    return 'act';
  }
  ev.push({ type: 'controlledSkip', actorId: actor.id, effectId: control.effectId });
  ev.push(...tickDurations(actor));
  return 'skip';
}

function checkEnd(s: BattleState, ev: GameEvent[]): boolean {
  if (s.status === 'ended') return true;
  const fallen = s.combatants.find((c) => c.hp <= 0);
  const timeout = s.round > B.battle.maxRounds;
  if (!fallen && !timeout) return false;
  s.status = 'ended';
  s.activeId = null;
  s.onlyKai = false;
  s.winner = fallen ? (fallen.side === 'player' ? 'enemy' : 'player') : 'enemy';
  for (const c of s.combatants) {
    const t = activeTransformation(c);
    if (t) {
      removeEffect(c, t.effectId);
      ev.push({ type: 'transformOff', actorId: c.id, transformationId: t.effectId, reason: 'battleEnd' });
    }
  }
  ev.push({ type: 'battleEnd', winner: s.winner, reason: fallen ? 'ko' : 'timeout' });
  return true;
}

// ------------------------------------------------------------------ ações

function execute(s: BattleState, actor: Combatant, action: Action, rng: Rng, ev: GameEvent[]): void {
  const target = opponent(s, actor);
  ev.push({ type: 'actionChosen', actorId: actor.id, action });
  switch (action.type) {
    case 'attack':
      ev.push(
        ...resolveHit(actor, target, { power: B.power.attack, attrKey: 'tai', element: null, masteryLevel: 0, jutsuId: null }, rng)
          .events,
      );
      return;
    case 'jutsu':
      useJutsu(actor, target, action.jutsuId, rng, ev);
      return;
    case 'defend': {
      actor.defending = true;
      const gain = Math.min(Math.round(actor.maxChakra * B.actions.defendChakraPct), actor.maxChakra - actor.chakra);
      actor.chakra += gain;
      ev.push({ type: 'defend', actorId: actor.id, chakra: gain });
      return;
    }
    case 'meditate': {
      const bonus = actor.clan ? CLANS[actor.clan].meditateBonus : 0;
      const gain = Math.min(
        Math.round(actor.maxChakra * B.actions.meditateChakraPct * (1 + bonus)),
        actor.maxChakra - actor.chakra,
      );
      actor.chakra += gain;
      ev.push({ type: 'meditate', actorId: actor.id, chakra: gain });
      return;
    }
    case 'item':
      useItem(actor, action, ev);
      return;
    case 'transform':
      throw new RuleError('invalidAction', 'Transformação é tratada fora de execute().');
  }
}

function useJutsu(actor: Combatant, target: Combatant, jutsuId: string, rng: Rng, ev: GameEvent[]): void {
  const j = JUTSUS[jutsuId];
  if (!j || !actor.jutsus.includes(jutsuId)) throw new RuleError('notEquipped', 'Jutsu não equipado.');
  const level = currentMasteryLevel(actor, j);
  const cost = costFor(actor, j);
  if (actor.chakra < cost) throw new RuleError('noChakra', 'Chakra insuficiente.');

  actor.chakra -= cost;
  ev.push({ type: 'jutsuUsed', actorId: actor.id, jutsuId, cost });
  if (j.cleanse) ev.push(...cleanseIllusions(actor));

  let landed = true;
  if (j.power !== null) {
    const hit = resolveHit(actor, target, { power: j.power, attrKey: CATEGORY_ATTR[j.category], element: j.element, masteryLevel: level, jutsuId }, rng);
    ev.push(...hit.events);
    landed = hit.landed;
  }

  for (const spec of j.effects) {
    const who = spec.target === 'self' ? actor : target;
    // Efeito no inimigo de um jutsu de dano só vale se o golpe acertou.
    if (spec.target === 'enemy' && (!landed || target.hp <= 0)) continue;
    const def = EFFECTS[spec.effectId];
    if (!def) throw new RuleError('unknownEffect', `Efeito desconhecido: ${spec.effectId}`);
    const p =
      def.type === 'control'
        ? controlChance(spec.chance, effectiveAttr(actor, 'gen'), def.controlKind === 'illusion', level, who.isBoss)
        : effectChance(spec.chance, level);
    if (p >= 1 || rng.chance(p)) ev.push(...applyEffect(who, spec.effectId, { sourceId: actor.id, duration: spec.duration }));
    else ev.push({ type: 'effectResisted', targetId: who.id, effectId: spec.effectId, reason: 'chance' });
  }

  // Maestria: cada conjuração conta 1 uso (acertando ou não). Só cabe 1 jutsu por turno.
  actor.masteryUses[jutsuId] = (actor.masteryUses[jutsuId] ?? 0) + 1;
  const after = currentMasteryLevel(actor, j);
  if (after > level) ev.push({ type: 'masteryUp', actorId: actor.id, jutsuId, level: after });
}

function useItem(actor: Combatant, action: Extract<Action, { type: 'item' }>, ev: GameEvent[]): void {
  const item = ITEMS[action.itemId];
  if (!item || item.kind !== 'consumable') throw new RuleError('notConsumable', 'Este item não pode ser usado em batalha.');
  if ((actor.inventory[action.itemId] ?? 0) <= 0) throw new RuleError('noItem', 'Você não tem este item.');
  if (item.buffAttr && (!action.attr || !(REFORCO_ATTRS as readonly string[]).includes(action.attr))) {
    throw new RuleError('needAttr', 'Escolha o atributo do Pergaminho de Reforço.');
  }
  actor.inventory[action.itemId] = (actor.inventory[action.itemId] ?? 0) - 1;
  ev.push({ type: 'itemUsed', actorId: actor.id, itemId: action.itemId });
  if (item.buffAttr && action.attr) ev.push(...applyEffect(actor, `reforco_${action.attr}`, { sourceId: actor.id }));
  if (item.heal) {
    const hp = Math.min(Math.round(actor.maxHp * (item.heal.hpPct ?? 0)), actor.maxHp - actor.hp);
    const chakra = Math.min(Math.round(actor.maxChakra * (item.heal.chakraPct ?? 0)), actor.maxChakra - actor.chakra);
    actor.hp += hp;
    actor.chakra += chakra;
    ev.push({ type: 'heal', targetId: actor.id, hp, chakra });
  }
}

/** Liga/desliga a transformação. Devolve true se isso consumiu o turno. */
function toggleTransformation(s: BattleState, actor: Combatant, ev: GameEvent[]): boolean {
  if (!actor.transformationId) throw new RuleError('noTransformation', 'Este personagem não tem transformação.');
  if (s.transformToggled) throw new RuleError('alreadyToggled', 'A transformação só pode ser alternada uma vez por turno.');
  const def = EFFECTS[actor.transformationId];
  if (!def) throw new RuleError('unknownEffect', `Efeito desconhecido: ${actor.transformationId}`);

  if (activeTransformation(actor)) {
    s.transformToggled = true;
    ev.push(...removeEffect(actor, def.id));
    ev.push({ type: 'transformOff', actorId: actor.id, transformationId: def.id, reason: 'manual' });
    return false;
  }
  const cost = def.activationCost ?? 0;
  if (actor.chakra < cost) throw new RuleError('noChakra', 'Chakra insuficiente para transformar.');
  s.transformToggled = true;
  actor.chakra -= cost;
  ev.push(...applyEffect(actor, def.id, { sourceId: actor.id }));
  ev.push({ type: 'transformOn', actorId: actor.id, transformationId: def.id });
  return def.activationCostsTurn === true;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/battle.test.ts && npx tsc --noEmit`
Expected: 14 testes PASS; `tsc` sem saída.

- [ ] **Step 6: Commit**

```bash
git add src/game/combat/battle.ts src/game/combat/ai.ts tests/battle.test.ts
git commit -m "feat: batalha por turnos com ações, transformação livre, controle e Kai

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: IA dos inimigos e geração de inimigos pelo nível de história

**Files:**
- Modify: `src/game/combat/ai.ts` (substitui a versão mínima por completo)
- Create: `src/game/combat/enemyFactory.ts`
- Test: `tests/ai.test.ts`

**Interfaces:**
- Consumes: `costFor`, `effectiveAttr`, `hasEffect`, `elementMultiplier`, `expectedPoints`, `maxHp`, `maxChakra`, `ENEMIES`, `ARCHETYPES`, `JUTSUS`, `BALANCE.enemyGrades`.
- Produces (ai.ts): `chooseAiAction(s: BattleState, self: Combatant): Action` (mesma assinatura da Task 7), `expectedDamage(self: Combatant, foe: Combatant, j: JutsuDef): number`
- Produces (enemyFactory.ts): `distributePoints(total: number, weights: Attributes): Attributes`, `createEnemy(templateId: string, storyLevel: number): Combatant` (id = `enemy:<templateId>`)

- [ ] **Step 1: Escrever o teste que falha — `tests/ai.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { chooseAiAction } from '../src/game/combat/ai';
import { createEnemy, distributePoints } from '../src/game/combat/enemyFactory';
import type { BattleState, Combatant } from '../src/game/combat/types';
import { applyEffect } from '../src/game/effects/EffectSystem';
import { ARCHETYPES } from '../src/data/enemies';
import { sumAttributes } from '../src/game/attributes';
import { maxHp } from '../src/game/formulas';
import { RuleError } from '../src/game/errors';
import { makeCombatant } from './helpers';

function battleWith(enemy: Combatant): BattleState {
  const player = makeCombatant({ id: 'player', side: 'player', element: 'fogo' });
  return { combatants: [player, enemy], round: 1, order: [], turnPos: 0, activeId: null, status: 'running', winner: null, transformToggled: false, onlyKai: false };
}

const enemy = (over: Partial<Combatant> = {}) => makeCombatant({ id: 'e', side: 'enemy', ai: 'basic', ...over });

describe('IA básica (DD v2 §9)', () => {
  it('sem chakra para nenhum jutsu, ataca', () => {
    const e = enemy({ jutsus: ['golpe_pesado'], chakra: 0 });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'attack' });
  });

  it('usa o golpe de maior dano esperado', () => {
    const e = enemy({ jutsus: ['golpe_pesado'] });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'golpe_pesado' });
  });

  it('prioriza jutsu com vantagem elemental mesmo com menos dano bruto', () => {
    const e = enemy({ jutsus: ['muon_satsujin', 'sensatsu_suishou'], attrs: { tai: 40, nin: 5 } });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'sensatsu_suishou' });
  });

  it('abaixo de 25% de HP usa jutsu defensivo que ainda não está ativo', () => {
    const e = enemy({ jutsus: ['kirigakure', 'golpe_pesado'], hp: 20 });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'kirigakure' });
    applyEffect(e, 'nevoa', { sourceId: 'e' });
    expect(chooseAiAction(battleWith(e), e)).toEqual({ type: 'jutsu', jutsuId: 'golpe_pesado' });
  });
});

describe('scripts de chefe', () => {
  it('Zabuza abre com Kirigakure e, abaixo de 50% com névoa, usa Muon Satsujin', () => {
    const z = createEnemy('zabuza', 5);
    const s = battleWith(z);
    expect(chooseAiAction(s, z)).toEqual({ type: 'jutsu', jutsuId: 'kirigakure' });
    expect(z.aiOpened).toBe(true);
    applyEffect(z, 'nevoa', { sourceId: z.id });
    z.hp = Math.floor(z.maxHp * 0.4);
    expect(chooseAiAction(s, z)).toEqual({ type: 'jutsu', jutsuId: 'muon_satsujin' });
  });

  it('Zabuza renova a névoa quando ela expira', () => {
    const z = createEnemy('zabuza', 5);
    z.aiOpened = true;
    expect(chooseAiAction(battleWith(z), z)).toEqual({ type: 'jutsu', jutsuId: 'kirigakure' });
  });

  it('Haku abre com Makyou; na 2ª fase prioriza Sensatsu Suishou; sem chakra usa Senbon', () => {
    const h = createEnemy('haku', 10);
    const s = battleWith(h);
    expect(chooseAiAction(s, h)).toEqual({ type: 'jutsu', jutsuId: 'makyou_hyoushou' });
    applyEffect(h, 'makyou', { sourceId: h.id });
    h.hp = Math.floor(h.maxHp * 0.4);
    expect(chooseAiAction(s, h)).toEqual({ type: 'jutsu', jutsuId: 'sensatsu_suishou' });
    h.chakra = 0;
    expect(chooseAiAction(s, h)).toEqual({ type: 'jutsu', jutsuId: 'senbon' });
  });
});

describe('geração de inimigos (spec C5)', () => {
  it('distributePoints soma o total e dá no mínimo 1 a cada atributo', () => {
    for (const total of [35, 53, 86, 136]) {
      for (const w of Object.values(ARCHETYPES)) {
        const a = distributePoints(total, w);
        expect(sumAttributes(a)).toBe(total);
        expect(Math.min(...Object.values(a))).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Bandido nível 1 tem 35 pontos (P(1) × 0,70)', () => {
    const b = createEnemy('bandido', 1);
    expect(sumAttributes(b.attrs)).toBe(35);
    expect(b).toMatchObject({ id: 'enemy:bandido', grade: 'D', damageMult: 0.6, isBoss: false, side: 'enemy' });
    expect(b.maxHp).toBe(Math.round(maxHp(b.attrs.hp, 1) * 0.8));
    expect(b.hp).toBe(b.maxHp);
  });

  it('Zabuza nível 5 (C) e Haku nível 10 (B, HP ×1,5)', () => {
    const z = createEnemy('zabuza', 5);
    expect(sumAttributes(z.attrs)).toBe(86);
    expect(z.maxHp).toBe(Math.round(maxHp(z.attrs.hp, 5) * 1.3));
    expect(z).toMatchObject({ isBoss: true, element: 'agua', ai: 'zabuza' });
    const h = createEnemy('haku', 10);
    expect(sumAttributes(h.attrs)).toBe(136);
    expect(h.maxHp).toBe(Math.round(maxHp(h.attrs.hp, 10) * 1.5));
  });

  it('template desconhecido gera RuleError', () => {
    expect(() => createEnemy('nao_existe', 1)).toThrow(RuleError);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/ai.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/combat/enemyFactory"`.

- [ ] **Step 3: Implementar `src/game/combat/enemyFactory.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { emptyAttributes, sumAttributes } from '../attributes';
import { RuleError } from '../errors';
import { expectedPoints, maxChakra, maxHp } from '../formulas';
import { ATTR_KEYS, type Attributes } from '../types';
import { ARCHETYPES, ENEMIES } from '../../data/enemies';
import type { Combatant } from './types';

/**
 * Distribui `total` pontos pelos pesos (soma 1) com o método do maior resto,
 * garantindo no mínimo 1 em cada atributo. O resultado soma exatamente `total`.
 */
export function distributePoints(total: number, weights: Attributes): Attributes {
  const raw = ATTR_KEYS.map((k) => ({ k, v: total * weights[k] }));
  const out = emptyAttributes(0);
  for (const r of raw) out[r.k] = Math.max(1, Math.floor(r.v));
  let diff = total - sumAttributes(out);
  const byFraction = [...raw].sort((a, b) => b.v - Math.floor(b.v) - (a.v - Math.floor(a.v)));
  for (let i = 0; diff > 0; i++, diff--) out[byFraction[i % byFraction.length]!.k]++;
  while (diff < 0) {
    const largest = ATTR_KEYS.reduce((m, k) => (out[k] > out[m] ? k : m));
    out[largest]--;
    diff++;
  }
  return out;
}

/**
 * Cria um inimigo a partir do NÍVEL DE HISTÓRIA do encontro (não do nível do jogador):
 * pontos = round(P(N) × razão do grau), distribuídos pelo arquétipo (DD v2 §9, spec C5).
 */
export function createEnemy(templateId: string, storyLevel: number): Combatant {
  const t = ENEMIES[templateId];
  if (!t) throw new RuleError('unknownEnemy', `Inimigo desconhecido: ${templateId}`);
  const g = B.enemyGrades[t.grade];
  const attrs = distributePoints(Math.round(expectedPoints(storyLevel) * g.pointsRatio), ARCHETYPES[t.archetype]);
  const hp = Math.round(maxHp(attrs.hp, storyLevel) * g.hpMult);
  const chakra = maxChakra(attrs.int, storyLevel);
  return {
    id: `enemy:${t.id}`,
    name: t.name,
    side: 'enemy',
    level: storyLevel,
    grade: t.grade,
    isBoss: t.isBoss,
    clan: null,
    element: t.element,
    attrs,
    maxHp: hp,
    hp,
    maxChakra: chakra,
    chakra,
    damageMult: g.damageMult,
    jutsus: [...t.jutsus],
    masteryUses: {},
    inventory: {},
    passiveMods: [],
    transformationId: null,
    transformTurns: 0,
    effects: [],
    tenacity: 0,
    defending: false,
    ai: t.ai,
    templateId: t.id,
    aiOpened: false,
  };
}
```

- [ ] **Step 4: Substituir `src/game/combat/ai.ts` pela versão completa**

```ts
import { BALANCE as B } from '../Balance';
import { CATEGORY_ATTR } from '../attributes';
import { elementMultiplier } from '../formulas';
import { JUTSUS, type JutsuDef } from '../../data/jutsus';
import { effectiveAttr, hasEffect } from '../effects/EffectSystem';
import { costFor } from './cost';
import type { Action, BattleState, Combatant } from './types';

/**
 * IA dos inimigos (DD v2 §9). Determinística de propósito: o mesmo estado
 * gera a mesma escolha (testes e simulador estáveis).
 * Pode marcar `self.aiOpened` — é sempre chamada dentro de um estado clonado.
 */
export function chooseAiAction(s: BattleState, self: Combatant): Action {
  const foe = (s.combatants.find((c) => c.side !== self.side && c.hp > 0) ??
    s.combatants.find((c) => c.id !== self.id)) as Combatant;
  switch (self.ai) {
    case 'zabuza':
      return zabuza(self, foe);
    case 'haku':
      return haku(self, foe);
    default:
      return basic(self, foe, self.jutsus);
  }
}

const jutsu = (jutsuId: string): Action => ({ type: 'jutsu', jutsuId });

function canUse(self: Combatant, id: string): boolean {
  const j = JUTSUS[id];
  return !!j && self.jutsus.includes(id) && costFor(self, j) <= self.chakra;
}

/** Dano esperado sem sorteio (sem crítico/esquiva/defesa), para comparar opções. */
export function expectedDamage(self: Combatant, foe: Combatant, j: JutsuDef): number {
  if (j.power === null) return 0;
  const attr = effectiveAttr(self, CATEGORY_ATTR[j.category]);
  return j.power * (1 + attr / B.damage.attrDivisor) * elementMultiplier(j.element, foe.element);
}

function attackExpected(self: Combatant): number {
  return B.power.attack * (1 + effectiveAttr(self, 'tai') / B.damage.attrDivisor);
}

/**
 * Regras gerais:
 * 1. HP < 25% → jutsu defensivo (só efeitos em si mesmo) ainda não ativo;
 * 2. vantagem elemental tem prioridade;
 * 3. senão, maior dano esperado (ou Atacar, se for melhor);
 * 4. sem chakra para nada → Atacar.
 */
function basic(self: Combatant, foe: Combatant, pool: string[]): Action {
  const usable = pool.filter((id) => canUse(self, id)).map((id) => JUTSUS[id] as JutsuDef);
  if (self.hp < self.maxHp * 0.25) {
    const defensive = usable.find(
      (j) =>
        j.power === null &&
        j.effects.length > 0 &&
        j.effects.every((e) => e.target === 'self') &&
        !j.effects.some((e) => hasEffect(self, e.effectId)),
    );
    if (defensive) return jutsu(defensive.id);
  }
  const damaging = usable.filter((j) => j.power !== null);
  if (damaging.length === 0) return { type: 'attack' };
  const advantaged = damaging.filter((j) => elementMultiplier(j.element, foe.element) > 1);
  const candidates = advantaged.length ? advantaged : damaging;
  const best = candidates.reduce((a, b) => (expectedDamage(self, foe, b) > expectedDamage(self, foe, a) ? b : a));
  if (!advantaged.length && expectedDamage(self, foe, best) <= attackExpected(self)) return { type: 'attack' };
  return jutsu(best.id);
}

/** Zabuza: abre com Kirigakure e a renova sempre que expira; na 2ª fase ataca de dentro da névoa. */
function zabuza(self: Combatant, foe: Combatant): Action {
  const mist = hasEffect(self, 'nevoa');
  if (!self.aiOpened) {
    self.aiOpened = true;
    if (canUse(self, 'kirigakure')) return jutsu('kirigakure');
  }
  if (!mist && canUse(self, 'kirigakure')) return jutsu('kirigakure');
  if (self.hp < self.maxHp * 0.5) {
    if (mist && canUse(self, 'muon_satsujin')) return jutsu('muon_satsujin');
    if (canUse(self, 'suiryuudan')) return jutsu('suiryuudan');
  }
  return basic(self, foe, ['kubikiribouchou', 'suiryuudan']);
}

/** Haku: abre com Makyou; na 2ª fase renova os espelhos e prioriza Sensatsu Suishou. */
function haku(self: Combatant, foe: Combatant): Action {
  const mirrors = hasEffect(self, 'makyou');
  if (!self.aiOpened) {
    self.aiOpened = true;
    if (canUse(self, 'makyou_hyoushou')) return jutsu('makyou_hyoushou');
  }
  if (self.hp < self.maxHp * 0.5) {
    if (!mirrors && canUse(self, 'makyou_hyoushou')) return jutsu('makyou_hyoushou');
    if (canUse(self, 'sensatsu_suishou')) return jutsu('sensatsu_suishou');
    if (canUse(self, 'senbon')) return jutsu('senbon');
    return { type: 'attack' };
  }
  return basic(self, foe, ['senbon', 'sensatsu_suishou']);
}
```

- [ ] **Step 5: Rodar e ver passar (incluindo a batalha, que agora usa a IA real)**

Run: `npx vitest run tests/ai.test.ts tests/battle.test.ts && npx tsc --noEmit`
Expected: todos PASS; `tsc` sem saída.

- [ ] **Step 6: Commit**

```bash
git add src/game/combat/ai.ts src/game/combat/enemyFactory.ts tests/ai.test.ts
git commit -m "feat: IA de inimigos (básica, Zabuza, Haku) e geração por nível de história

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Loja, equipamento e Pergaminho Raro

**Files:**
- Create: `src/game/run/shop.ts`
- Test: `tests/shop.test.ts`

**Interfaces:**
- Consumes: `PlayerCharacter`, `characterMaxHp`, `characterMaxChakra`, `clampVitals`, `ITEMS`, `CONSUMABLE_IDS`, `EQUIPMENT_POOL`, `TITLES`, `BALANCE.shop`.
- Produces: `interface ShopStock { consumables: string[]; equipment: string[]; rareScrolls: number }`, `generateStock(rng: Rng): ShopStock`, `priceOf(itemId: string, c: PlayerCharacter): number`, `buyItem(c, stock, itemId): { character: PlayerCharacter; stock: ShopStock }`, `equipItem(c, itemId): PlayerCharacter`, `useRareScroll(c, attr: AttrKey): PlayerCharacter` (não checa desbloqueio — quem chama faz; ver Task 11).

- [ ] **Step 1: Escrever o teste que falha — `tests/shop.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buyItem, equipItem, generateStock, priceOf, useRareScroll, type ShopStock } from '../src/game/run/shop';
import { characterMaxHp, createCharacter } from '../src/game/progression/character';
import { EQUIPMENT_POOL } from '../src/data/items';
import { RuleError } from '../src/game/errors';
import { Rng } from '../src/game/Rng';

const rich = () => {
  const c = createCharacter({ name: 'T', clan: 'semcla', affinity: 'vento', allocation: { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }, titleId: null });
  c.ryo = 5000;
  return c;
};
const stock = (): ShopStock => ({ consumables: ['kit_medico', 'pilula_chakra', 'pergaminho_reforco'], equipment: ['kunai', 'colete_reforcado'], rareScrolls: 1 });

describe('loja', () => {
  it('estoque: consumíveis fixos, 2 equipamentos distintos do pool e 1 Pergaminho Raro', () => {
    const s = generateStock(new Rng(4));
    expect(s.consumables).toEqual(['kit_medico', 'pilula_chakra', 'pergaminho_reforco']);
    expect(s.equipment).toHaveLength(2);
    expect(new Set(s.equipment).size).toBe(2);
    for (const id of s.equipment) expect(EQUIPMENT_POOL).toContain(id);
    expect(s.rareScrolls).toBe(1);
  });

  it('consumível: desconta ryo e soma ao inventário (estoque ilimitado)', () => {
    let { character, stock: st } = buyItem(rich(), stock(), 'kit_medico');
    ({ character, stock: st } = buyItem(character, st, 'kit_medico'));
    expect(character.ryo).toBe(5000 - 160);
    expect(character.inventory['kit_medico']).toBe(2);
    expect(st.consumables).toContain('kit_medico');
  });

  it('sem ryo suficiente ou item fora do estoque gera RuleError', () => {
    const c = rich();
    c.ryo = 79;
    expect(() => buyItem(c, stock(), 'kit_medico')).toThrow(RuleError);
    expect(() => buyItem(rich(), stock(), 'katana')).toThrow(RuleError);
  });

  it('equipamento sai do estoque e não pode ser comprado duas vezes', () => {
    const r = buyItem(rich(), stock(), 'kunai');
    expect(r.character.ownedEquipment).toEqual(['kunai']);
    expect(r.stock.equipment).toEqual(['colete_reforcado']);
    expect(() => buyItem(r.character, stock(), 'kunai')).toThrow(RuleError);
  });

  it('equipar aplica o bônus e sobe o HP atual junto com o máximo', () => {
    const { character } = buyItem(rich(), stock(), 'colete_reforcado');
    const before = character.hp;
    const eq = equipItem(character, 'colete_reforcado');
    expect(eq.equipment.armor).toBe('colete_reforcado');
    expect(characterMaxHp(eq)).toBe(characterMaxHp(character) + 12);
    expect(eq.hp).toBe(before + 12);
    expect(() => equipItem(rich(), 'katana')).toThrow(RuleError);
    expect(() => equipItem(character, 'kit_medico')).toThrow(RuleError);
  });

  it('Pergaminho Raro: um por estoque, +1 no atributo base, limite de 5 por run', () => {
    const r = buyItem(rich(), stock(), 'pergaminho_raro');
    expect(r.stock.rareScrolls).toBe(0);
    expect(() => buyItem(r.character, r.stock, 'pergaminho_raro')).toThrow(RuleError);
    let c = r.character;
    c.inventory['pergaminho_raro'] = 6;
    const nin = c.baseAttrs.nin;
    for (let i = 0; i < 5; i++) c = useRareScroll(c, 'nin');
    expect(c.baseAttrs.nin).toBe(nin + 5);
    expect(c.rareScrollsUsed).toBe(5);
    expect(() => useRareScroll(c, 'nin')).toThrow(RuleError);
  });

  it('título Colecionador dá 5% de desconto', () => {
    const c = rich();
    c.titleId = 'colecionador';
    expect(priceOf('kit_medico', c)).toBe(76);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/shop.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/run/shop"`.

- [ ] **Step 3: Implementar `src/game/run/shop.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { RuleError } from '../errors';
import type { Rng } from '../Rng';
import { ATTR_KEYS, type AttrKey } from '../types';
import { CONSUMABLE_IDS, EQUIPMENT_POOL, ITEMS } from '../../data/items';
import { TITLES } from '../../data/titles';
import { characterMaxChakra, characterMaxHp, clampVitals, type PlayerCharacter } from '../progression/character';

/**
 * Loja (DD v2 §11). Consumíveis sempre à venda; 2 equipamentos sorteados;
 * 1 Pergaminho Raro por estoque. O estoque renova no início e após cada chefe.
 */
export interface ShopStock {
  consumables: string[];
  equipment: string[];
  rareScrolls: number;
}

export function generateStock(rng: Rng): ShopStock {
  return {
    consumables: [...CONSUMABLE_IDS],
    equipment: rng.shuffle(EQUIPMENT_POOL).slice(0, B.shop.equipmentOffers),
    rareScrolls: B.shop.rareScrollsPerStock,
  };
}

export function priceOf(itemId: string, c: PlayerCharacter): number {
  const item = ITEMS[itemId];
  if (!item) throw new RuleError('unknownItem', `Item desconhecido: ${itemId}`);
  const pct = c.titleId ? (TITLES[c.titleId]?.mods.shopPricePct ?? 0) : 0;
  return Math.round(item.price * (1 + pct));
}

export function buyItem(c: PlayerCharacter, stock: ShopStock, itemId: string): { character: PlayerCharacter; stock: ShopStock } {
  const item = ITEMS[itemId];
  if (!item) throw new RuleError('unknownItem', `Item desconhecido: ${itemId}`);
  if (item.kind === 'consumable' && !stock.consumables.includes(itemId)) throw new RuleError('notInStock', 'Item fora do estoque.');
  if (item.kind === 'rareScroll' && stock.rareScrolls <= 0) throw new RuleError('notInStock', 'Sem Pergaminho Raro neste estoque.');
  if (item.kind === 'weapon' || item.kind === 'armor') {
    if (!stock.equipment.includes(itemId)) throw new RuleError('notInStock', 'Item fora do estoque.');
    if (c.ownedEquipment.includes(itemId)) throw new RuleError('alreadyOwned', 'Você já possui este equipamento.');
  }
  const price = priceOf(itemId, c);
  if (c.ryo < price) throw new RuleError('notEnoughRyo', `Faltam ${price - c.ryo} ryo.`);

  const character = structuredClone(c);
  const next = structuredClone(stock);
  character.ryo -= price;
  if (item.kind === 'consumable' || item.kind === 'rareScroll') {
    character.inventory[itemId] = (character.inventory[itemId] ?? 0) + 1;
  }
  if (item.kind === 'rareScroll') next.rareScrolls--;
  if (item.kind === 'weapon' || item.kind === 'armor') {
    character.ownedEquipment.push(itemId);
    next.equipment = next.equipment.filter((id) => id !== itemId);
  }
  return { character, stock: next };
}

/** Troca de equipamento (fora de batalha). HP/chakra atuais acompanham a mudança do máximo. */
export function equipItem(c: PlayerCharacter, itemId: string): PlayerCharacter {
  const item = ITEMS[itemId];
  if (!item || (item.kind !== 'weapon' && item.kind !== 'armor')) throw new RuleError('notEquipment', 'Isto não é um equipamento.');
  if (!c.ownedEquipment.includes(itemId)) throw new RuleError('notOwned', 'Você não possui este equipamento.');
  const hpBefore = characterMaxHp(c);
  const chBefore = characterMaxChakra(c);
  const next = structuredClone(c);
  if (item.kind === 'weapon') next.equipment.weapon = itemId;
  else next.equipment.armor = itemId;
  next.hp += characterMaxHp(next) - hpBefore;
  next.chakra += characterMaxChakra(next) - chBefore;
  clampVitals(next);
  return next;
}

/** +1 permanente (na run) no atributo BASE — por isso pode desbloquear jutsu. Limite 5 por run. */
export function useRareScroll(c: PlayerCharacter, attr: AttrKey): PlayerCharacter {
  if (!ATTR_KEYS.includes(attr)) throw new RuleError('invalidAttr', `Atributo inválido: ${attr}`);
  if ((c.inventory['pergaminho_raro'] ?? 0) <= 0) throw new RuleError('noItem', 'Você não tem Pergaminho Raro.');
  if (c.rareScrollsUsed >= B.shop.rareScrollMaxPerRun) {
    throw new RuleError('rareScrollLimit', `Limite de ${B.shop.rareScrollMaxPerRun} Pergaminhos Raros por run.`);
  }
  const hpBefore = characterMaxHp(c);
  const chBefore = characterMaxChakra(c);
  const next = structuredClone(c);
  next.inventory['pergaminho_raro'] = (next.inventory['pergaminho_raro'] ?? 0) - 1;
  next.rareScrollsUsed++;
  next.baseAttrs[attr]++;
  next.hp += characterMaxHp(next) - hpBefore;
  next.chakra += characterMaxChakra(next) - chBefore;
  clampVitals(next);
  return next;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/shop.test.ts && npx tsc --noEmit`
Expected: 7 testes PASS; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add src/game/run/shop.ts tests/shop.test.ts
git commit -m "feat: loja com estoque sorteado, equipamento e Pergaminho Raro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Estatísticas da run por eventos

**Files:**
- Create: `src/game/meta/stats.ts`
- Test: `tests/stats.test.ts`

**Interfaces:**
- Consumes: `GameEvent`, `Grade`.
- Produces: `interface RunStats { defeatedByGrade: Partial<Record<Grade, number>>; bossesDefeated: string[]; elitesDefeated: number; encountersWon: number; damageDealt: number; damageTaken: number; biggestHit: number; crits: number; jutsuUses: Record<string, number>; turns: number; chakraSpent: number; ryoEarned: number; ryoSpent: number; itemsUsed: number; flawlessWins: number; bossNoDamage: boolean; bossLowHp: boolean }`, `interface EncounterSummary { won: boolean; grade: Grade; isBoss: boolean; elite: boolean; enemyId: string; damageTaken: number; hpPctEnd: number; ryo: number }`, `emptyRunStats(): RunStats`, `trackBattleEvents(stats, events: GameEvent[], playerId: string): RunStats`, `trackEncounterEnd(stats, r: EncounterSummary): RunStats`, `mostUsedJutsu(stats): string | null` — todas puras.

- [ ] **Step 1: Escrever o teste que falha — `tests/stats.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { emptyRunStats, mostUsedJutsu, trackBattleEvents, trackEncounterEnd } from '../src/game/meta/stats';
import type { GameEvent } from '../src/game/events';

const events: GameEvent[] = [
  { type: 'turnStart', actorId: 'player', round: 1 },
  { type: 'jutsuUsed', actorId: 'player', jutsuId: 'bola_de_fogo', cost: 8 },
  { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 30, crit: true, elementMult: 1, jutsuId: 'bola_de_fogo', hpAfter: 64 },
  { type: 'turnStart', actorId: 'enemy:bandido', round: 1 },
  { type: 'damage', sourceId: 'enemy:bandido', targetId: 'player', amount: 12, crit: false, elementMult: 1, jutsuId: null, hpAfter: 100 },
  { type: 'dot', targetId: 'enemy:bandido', effectId: 'queimadura', amount: 4, hpAfter: 60 },
  { type: 'dot', targetId: 'player', effectId: 'queimadura', amount: 5, hpAfter: 95 },
  { type: 'itemUsed', actorId: 'player', itemId: 'kit_medico' },
];

const win = { won: true, grade: 'D' as const, isBoss: false, elite: false, enemyId: 'bandido', damageTaken: 10, hpPctEnd: 0.8, ryo: 30 };

describe('estatísticas por eventos', () => {
  it('conta dano, maior golpe, críticos, jutsus, chakra, turnos e itens', () => {
    const s = trackBattleEvents(emptyRunStats(), events, 'player');
    expect(s).toMatchObject({ damageDealt: 34, damageTaken: 17, biggestHit: 30, crits: 1, chakraSpent: 8, turns: 1, itemsUsed: 1 });
    expect(s.jutsuUses).toEqual({ bola_de_fogo: 1 });
    expect(mostUsedJutsu(s)).toBe('bola_de_fogo');
    expect(mostUsedJutsu(emptyRunStats())).toBeNull();
  });

  it('fim de encontro: vitórias, derrotados por grau, elites, ryo', () => {
    let s = trackEncounterEnd(emptyRunStats(), win);
    s = trackEncounterEnd(s, { ...win, grade: 'D+', elite: true, ryo: 50, damageTaken: 0 });
    expect(s).toMatchObject({ encountersWon: 2, elitesDefeated: 1, ryoEarned: 80, flawlessWins: 1 });
    expect(s.defeatedByGrade).toEqual({ D: 1, 'D+': 1 });
  });

  it('chefe sem dano e chefe com menos de 10% de HP', () => {
    const s1 = trackEncounterEnd(emptyRunStats(), { ...win, grade: 'C', isBoss: true, enemyId: 'zabuza', damageTaken: 0 });
    expect(s1.bossNoDamage).toBe(true);
    expect(s1.bossesDefeated).toEqual(['zabuza']);
    const s2 = trackEncounterEnd(emptyRunStats(), { ...win, grade: 'B', isBoss: true, enemyId: 'haku', hpPctEnd: 0.05 });
    expect(s2.bossLowHp).toBe(true);
  });

  it('derrota não conta como vitória e nada é mutado', () => {
    const base = emptyRunStats();
    const s = trackEncounterEnd(base, { ...win, won: false });
    expect(s.encountersWon).toBe(0);
    trackBattleEvents(base, events, 'player');
    expect(base).toEqual(emptyRunStats());
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/stats.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/meta/stats"`.

- [ ] **Step 3: Implementar `src/game/meta/stats.ts`**

```ts
import type { GameEvent } from '../events';
import type { Grade } from '../types';

/**
 * Estatísticas da run, alimentadas SÓ por eventos do motor (DD v2 §14).
 * A Ficha, os títulos e o histórico leem daqui; o combate não sabe que isso existe.
 */
export interface RunStats {
  defeatedByGrade: Partial<Record<Grade, number>>;
  bossesDefeated: string[];
  elitesDefeated: number;
  encountersWon: number;
  damageDealt: number;
  damageTaken: number;
  biggestHit: number;
  crits: number;
  jutsuUses: Record<string, number>;
  turns: number;
  chakraSpent: number;
  ryoEarned: number;
  ryoSpent: number;
  itemsUsed: number;
  flawlessWins: number;
  bossNoDamage: boolean;
  bossLowHp: boolean;
}

export interface EncounterSummary {
  won: boolean;
  grade: Grade;
  isBoss: boolean;
  elite: boolean;
  enemyId: string;
  damageTaken: number;
  /** HP/HP máximo ao fim da luta, ANTES da recuperação pós-encontro. */
  hpPctEnd: number;
  ryo: number;
}

export function emptyRunStats(): RunStats {
  return {
    defeatedByGrade: {},
    bossesDefeated: [],
    elitesDefeated: 0,
    encountersWon: 0,
    damageDealt: 0,
    damageTaken: 0,
    biggestHit: 0,
    crits: 0,
    jutsuUses: {},
    turns: 0,
    chakraSpent: 0,
    ryoEarned: 0,
    ryoSpent: 0,
    itemsUsed: 0,
    flawlessWins: 0,
    bossNoDamage: false,
    bossLowHp: false,
  };
}

export function trackBattleEvents(stats: RunStats, events: GameEvent[], playerId: string): RunStats {
  const s = structuredClone(stats);
  for (const e of events) {
    switch (e.type) {
      case 'damage':
        if (e.sourceId === playerId) {
          s.damageDealt += e.amount;
          s.biggestHit = Math.max(s.biggestHit, e.amount);
          if (e.crit) s.crits++;
        } else if (e.targetId === playerId) {
          s.damageTaken += e.amount;
        }
        break;
      case 'dot':
        if (e.targetId === playerId) s.damageTaken += e.amount;
        else s.damageDealt += e.amount;
        break;
      case 'jutsuUsed':
        if (e.actorId === playerId) {
          s.jutsuUses[e.jutsuId] = (s.jutsuUses[e.jutsuId] ?? 0) + 1;
          s.chakraSpent += e.cost;
        }
        break;
      case 'turnStart':
        if (e.actorId === playerId) s.turns++;
        break;
      case 'itemUsed':
        if (e.actorId === playerId) s.itemsUsed++;
        break;
      default:
        break;
    }
  }
  return s;
}

export function trackEncounterEnd(stats: RunStats, r: EncounterSummary): RunStats {
  const s = structuredClone(stats);
  if (!r.won) return s;
  s.encountersWon++;
  s.defeatedByGrade[r.grade] = (s.defeatedByGrade[r.grade] ?? 0) + 1;
  s.ryoEarned += r.ryo;
  if (r.elite) s.elitesDefeated++;
  if (r.damageTaken === 0) s.flawlessWins++;
  if (r.isBoss) {
    s.bossesDefeated.push(r.enemyId);
    if (r.damageTaken === 0) s.bossNoDamage = true;
    if (r.hpPctEnd < 0.1) s.bossLowHp = true;
  }
  return s;
}

export function mostUsedJutsu(stats: RunStats): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [id, n] of Object.entries(stats.jutsuUses)) {
    if (n > max) {
      max = n;
      best = id;
    }
  }
  return best;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/stats.test.ts && npx tsc --noEmit`
Expected: 4 testes PASS; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add src/game/meta/stats.ts tests/stats.test.ts
git commit -m "feat: rastreador de estatísticas da run por eventos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Ciclo da run (mapa, Acampamento, encontros, recompensas, escolha 1-de-3)

**Files:**
- Create: `src/game/run/types.ts`, `src/game/run/battleSetup.ts`, `src/game/run/runManager.ts`
- Test: `tests/run.test.ts`

**Interfaces:**
- Consumes: tudo das Tasks 4–10; `SAGA_ONDA`, `ELITE_OF`, `ENEMIES`, `TITLES`, `BALANCE.run.eliteForks`.
- Produces (types.ts):
  - `interface RunNode { index: number; kind: 'common' | 'boss'; storyLevel: number; enemyId: string; eliteEnemyId: string | null; campBefore: boolean; advancesStoryTo: StoryPointId | null }`
  - `type RunPhase = 'camp' | 'map' | 'battle' | 'result' | 'dead' | 'victory'`
  - `REWARD_OPTIONS = ['kit','pilula','reforco','ryo','treino'] as const`, `type RewardOptionId`
  - `interface EncounterResult { nodeIndex: number; enemyId: string; enemyName: string; grade: Grade; isBoss: boolean; elite: boolean; won: boolean; xp: number; ryo: number; rep: number; levelsGained: number; learned: string[]; damageTaken: number; rounds: number; hpPctEnd: number }`
  - `interface RunState { version: 1; seed: number; rngState: number; encounterStart: { rngState: number; stats: RunStats } | null; startedAt: number; sagaId: string; story: StoryPointId; character: PlayerCharacter; nodes: RunNode[]; nodeIndex: number; phase: RunPhase; battle: BattleState | null; elite: boolean; battleTally: { damageTaken: number; rounds: number }; shop: ShopStock; pendingChoices: RewardOptionId[][]; stats: RunStats; lastResult: EncounterResult | null }`
- Produces (battleSetup.ts): `playerToCombatant(c: PlayerCharacter): Combatant` (id `'player'`), `applyBattleResult(c: PlayerCharacter, p: Combatant): PlayerCharacter`
- Produces (runManager.ts): `buildRunNodes(rng: Rng): RunNode[]`, `newRun(params: CreateParams, seed: number, now: number): RunState`, `currentNode(run): RunNode`, `restAtCamp(run): RunState`, `startEncounter(run, elite?: boolean): { run: RunState; events: GameEvent[] }`, `battleAction(run, action: Action, opts?: { inPlace?: boolean }): { run: RunState; events: GameEvent[] }`, `chooseReward(run, option: RewardOptionId, jutsuId?: string): RunState`, `continueFromResult(run): RunState`, `allocateRunPoints(run, alloc: Partial<Attributes>): { run: RunState; learned: string[] }`, `buyInRun(run, itemId): RunState`, `equipItemInRun(run, itemId): RunState`, `useRareScrollInRun(run, attr: AttrKey): { run: RunState; learned: string[] }`, `equipJutsuInRun(run, jutsuId, replaceId?: string | null): RunState`, `setLoadoutInRun(run, ids: string[]): RunState`

- [ ] **Step 1: Acrescentar a constante de elites em `src/game/Balance.ts`**

No objeto `BALANCE`, logo após a linha `history: { maxEntries: 50 },`, acrescentar:

```ts
  /** Bifurcações "Comum ou Elite" sorteadas por run (spec §7, ASSUMIDO). */
  run: { eliteForks: 3 },
```

- [ ] **Step 2: Escrever o teste que falha — `tests/run.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  allocateRunPoints,
  battleAction,
  buyInRun,
  chooseReward,
  continueFromResult,
  newRun,
  restAtCamp,
  startEncounter,
  useRareScrollInRun,
} from '../src/game/run/runManager';
import type { RunState } from '../src/game/run/types';
import { characterMaxHp, type CreateParams } from '../src/game/progression/character';
import { xpForCommon } from '../src/game/formulas';
import { RuleError } from '../src/game/errors';

const params: CreateParams = { name: 'Teste', clan: 'semcla', affinity: 'vento', allocation: { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }, titleId: null };

function overpowered(run: RunState): RunState {
  const r = structuredClone(run);
  Object.assign(r.character.baseAttrs, { tai: 300, vel: 300, hp: 300, def: 200 });
  r.character.hp = characterMaxHp(r.character);
  return r;
}

function winCurrent(run: RunState, elite = false): RunState {
  let r = startEncounter(run, elite).run;
  while (r.phase === 'battle') r = battleAction(r, { type: 'attack' }).run;
  return r;
}

function takeAllChoices(run: RunState): RunState {
  let r = run;
  while (r.pendingChoices.length) {
    const opt = r.pendingChoices[0]![0]!;
    r = chooseReward(r, opt, opt === 'treino' ? r.character.equipped[0] : undefined);
  }
  return r;
}

describe('nova run', () => {
  it('26 nós, 3 bifurcações de elite (nunca antes de Acampamento), loja e jutsus iniciais', () => {
    const r = newRun(params, 42, 1000);
    expect(r.nodes).toHaveLength(26);
    const elites = r.nodes.filter((n) => n.eliteEnemyId);
    expect(elites).toHaveLength(3);
    for (const n of elites) {
      expect(n.kind).toBe('common');
      expect([11, 24]).not.toContain(n.index);
    }
    expect(r.phase).toBe('map');
    expect(r.story).toBe('onda');
    expect(r.character.learned).toContain('bola_de_fogo');
    expect(r.shop.equipment).toHaveLength(2);
    expect(r.startedAt).toBe(1000);
  });

  it('mesma semente gera a mesma run', () => {
    expect(JSON.stringify(newRun(params, 7, 0))).toBe(JSON.stringify(newRun(params, 7, 0)));
  });
});

describe('encontros', () => {
  it('vencer um comum dá as recompensas da tabela e avança', () => {
    let r = winCurrent(overpowered(newRun(params, 1, 0)));
    expect(r.phase).toBe('result');
    expect(r.lastResult).toMatchObject({ won: true, xp: 12, ryo: 30, rep: 22, nodeIndex: 0, elite: false });
    expect(r.character.ryo).toBe(30);
    expect(r.character.reputation).toBe(22);
    expect(r.nodeIndex).toBe(1);
    expect(r.stats.encountersWon).toBe(1);
    r = continueFromResult(r);
    expect(r.phase).toBe('map');
  });

  it('elite só onde há bifurcação; paga 50 ryo e XP ×1,6', () => {
    const base = overpowered(newRun(params, 1, 0));
    const plain = { ...structuredClone(base), nodeIndex: base.nodes.find((n) => n.kind === 'common' && !n.eliteEnemyId)!.index };
    expect(() => startEncounter(plain, true)).toThrow(RuleError);
    const node = base.nodes.find((n) => n.eliteEnemyId)!;
    const r = winCurrent({ ...structuredClone(base), nodeIndex: node.index }, true);
    expect(r.lastResult).toMatchObject({ elite: true, ryo: 50, rep: 38, xp: Math.round(xpForCommon(node.storyLevel) * 1.6) });
  });

  it('Zabuza: Acampamento, vários níveis com uma escolha por nível, saga avança e loja renova (Review Focus 5)', () => {
    let r = overpowered(newRun(params, 3, 0));
    r.nodeIndex = 12;
    r.phase = 'camp';
    r.character.hp = 1;
    r.shop.rareScrolls = 0;
    r = restAtCamp(r);
    expect(r.character.hp).toBe(characterMaxHp(r.character));
    expect(r.phase).toBe('map');
    r = winCurrent(r);
    expect(r.lastResult).toMatchObject({ xp: 112, ryo: 200, rep: 160, isBoss: true, levelsGained: 2 });
    expect(r.character.level).toBe(3);
    expect(r.character.unspentPoints).toBe(12);
    expect(r.pendingChoices).toHaveLength(2);
    for (const offer of r.pendingChoices) expect(new Set(offer).size).toBe(3);
    expect(r.story).toBe('onda_pos_zabuza');
    expect(r.stats.bossesDefeated).toEqual(['zabuza']);
    expect(r.shop.rareScrolls).toBe(1);
    expect(() => continueFromResult(r)).toThrow(RuleError);
    r = continueFromResult(takeAllChoices(r));
    expect(r.phase).toBe('map');
  });

  it('chooseReward aplica a recompensa e valida a oferta', () => {
    const r = newRun(params, 2, 0);
    r.phase = 'result';
    r.pendingChoices = [['kit', 'ryo', 'treino']];
    expect(chooseReward(r, 'kit').character.inventory['kit_medico']).toBe(1);
    expect(chooseReward(r, 'ryo').character.ryo).toBe(60);
    expect(() => chooseReward(r, 'reforco')).toThrow(RuleError);
    expect(() => chooseReward(r, 'treino')).toThrow(RuleError);
    const id = r.character.equipped[0]!;
    expect(chooseReward(r, 'treino', id).character.masteryUses[id]).toBe(4);
  });

  it('derrota encerra a run e guarda a causa', () => {
    const r0 = newRun(params, 11, 0);
    r0.character.hp = 1;
    r0.character.baseAttrs.vel = 0;
    const r = winCurrent(r0);
    expect(r.phase).toBe('dead');
    expect(r.lastResult).toMatchObject({ won: false, nodeIndex: 0 });
    expect(r.lastResult!.enemyName.length).toBeGreaterThan(0);
  });

  it('vencer Haku conclui a saga', () => {
    let r = overpowered(newRun(params, 4, 0));
    r.nodeIndex = 25;
    r.phase = 'camp';
    r = winCurrent(restAtCamp(r));
    expect(r.phase).toBe('victory');
    expect(r.pendingChoices).toEqual([]);
  });

  it('não muta a run e rejeita ação na fase errada', () => {
    const r = newRun(params, 5, 0);
    expect(() => battleAction(r, { type: 'attack' })).toThrow(RuleError);
    startEncounter(r);
    expect(r.phase).toBe('map');
    expect(r.battle).toBeNull();
  });

  it('mesma semente + mesmas ações = mesma run', () => {
    const play = () => {
      let r = overpowered(newRun(params, 9, 0));
      for (let i = 0; i < 3; i++) r = continueFromResult(takeAllChoices(winCurrent(r)));
      return JSON.stringify(r);
    };
    expect(play()).toBe(play());
  });
});

describe('preparação entre encontros', () => {
  it('distribuir pontos e usar Pergaminho Raro podem desbloquear jutsus (regra de status)', () => {
    const r = newRun(params, 6, 0);
    r.character.unspentPoints = 3;
    const a = allocateRunPoints(r, { nin: 3 });
    expect(a.learned).toEqual(expect.arrayContaining(['daitoppa', 'doryuuheki']));
    const s = structuredClone(a.run);
    s.character.inventory['pergaminho_raro'] = 1;
    s.character.baseAttrs.vel = 7;
    expect(useRareScrollInRun(s, 'vel').learned).toContain('kawarimi');
  });

  it('comprar desconta ryo e registra o gasto', () => {
    const r = newRun(params, 8, 0);
    r.character.ryo = 100;
    const b = buyInRun(r, 'kit_medico');
    expect(b.character.ryo).toBe(20);
    expect(b.stats.ryoSpent).toBe(80);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/run.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/run/runManager"`.

- [ ] **Step 4: Implementar `src/game/run/types.ts`**

```ts
import type { BattleState } from '../combat/types';
import type { RunStats } from '../meta/stats';
import type { PlayerCharacter } from '../progression/character';
import type { Grade, StoryPointId } from '../types';
import type { ShopStock } from './shop';

export interface RunNode {
  index: number;
  kind: 'common' | 'boss';
  storyLevel: number;
  enemyId: string;
  /** Se houver, o mapa oferece a bifurcação "Comum ou Elite". */
  eliteEnemyId: string | null;
  campBefore: boolean;
  advancesStoryTo: StoryPointId | null;
}

export type RunPhase = 'camp' | 'map' | 'battle' | 'result' | 'dead' | 'victory';

/** Opções da escolha 1-de-3 ao subir de nível (spec C12: nunca jutsu). */
export const REWARD_OPTIONS = ['kit', 'pilula', 'reforco', 'ryo', 'treino'] as const;
export type RewardOptionId = (typeof REWARD_OPTIONS)[number];

export interface EncounterResult {
  nodeIndex: number;
  enemyId: string;
  enemyName: string;
  grade: Grade;
  isBoss: boolean;
  elite: boolean;
  won: boolean;
  xp: number;
  ryo: number;
  rep: number;
  levelsGained: number;
  learned: string[];
  damageTaken: number;
  rounds: number;
  hpPctEnd: number;
}

export interface RunState {
  version: 1;
  seed: number;
  rngState: number;
  /** Foto do início do encontro: recarregar no meio da luta volta exatamente para cá. */
  encounterStart: { rngState: number; stats: RunStats } | null;
  startedAt: number;
  sagaId: string;
  story: StoryPointId;
  character: PlayerCharacter;
  nodes: RunNode[];
  nodeIndex: number;
  phase: RunPhase;
  battle: BattleState | null;
  elite: boolean;
  battleTally: { damageTaken: number; rounds: number };
  shop: ShopStock;
  /** Uma oferta 1-de-3 por nível ganho, resolvidas em ordem. */
  pendingChoices: RewardOptionId[][];
  stats: RunStats;
  lastResult: EncounterResult | null;
}
```

- [ ] **Step 5: Implementar `src/game/run/battleSetup.ts`**

```ts
import { CLANS } from '../../data/clans';
import { TITLES } from '../../data/titles';
import type { Combatant } from '../combat/types';
import {
  characterMaxChakra,
  characterMaxHp,
  clampVitals,
  effectiveAttrs,
  type PlayerCharacter,
} from '../progression/character';

/** Converte o personagem da run num combatente (atributos base + equipamento; passivas de clã e título). */
export function playerToCombatant(c: PlayerCharacter): Combatant {
  const clan = CLANS[c.clan];
  const title = c.titleId ? TITLES[c.titleId] : undefined;
  return {
    id: 'player',
    name: c.name,
    side: 'player',
    level: c.level,
    grade: null,
    isBoss: false,
    clan: c.clan,
    element: c.affinity,
    attrs: effectiveAttrs(c),
    maxHp: characterMaxHp(c),
    hp: c.hp,
    maxChakra: characterMaxChakra(c),
    chakra: c.chakra,
    damageMult: 1,
    jutsus: [...c.equipped],
    masteryUses: { ...c.masteryUses },
    inventory: { ...c.inventory },
    passiveMods: title ? [clan.passiveMods, title.mods] : [clan.passiveMods],
    transformationId: clan.transformationId,
    transformTurns: c.transformTurns,
    effects: [],
    tenacity: 0,
    defending: false,
    ai: 'player',
    templateId: null,
    aiOpened: false,
  };
}

/** Traz de volta para o personagem o que a batalha mudou: HP, chakra, maestria, itens, turnos de transformação. */
export function applyBattleResult(c: PlayerCharacter, p: Combatant): PlayerCharacter {
  const next = structuredClone(c);
  next.hp = p.hp;
  next.chakra = p.chakra;
  next.masteryUses = { ...p.masteryUses };
  next.inventory = { ...p.inventory };
  next.transformTurns = p.transformTurns;
  clampVitals(next);
  return next;
}
```

- [ ] **Step 6: Implementar `src/game/run/runManager.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { RuleError } from '../errors';
import type { GameEvent } from '../events';
import { xpForCommon } from '../formulas';
import { Rng } from '../Rng';
import type { AttrKey, Attributes, Grade } from '../types';
import { ELITE_OF, ENEMIES } from '../../data/enemies';
import { SAGA_ONDA } from '../../data/saga';
import { TITLES } from '../../data/titles';
import { applyActionInPlace, getEnemy, getPlayer, startBattle } from '../combat/battle';
import { createEnemy } from '../combat/enemyFactory';
import type { Action } from '../combat/types';
import { emptyRunStats, trackBattleEvents, trackEncounterEnd } from '../meta/stats';
import {
  allocatePoints,
  characterMaxChakra,
  characterMaxHp,
  clampVitals,
  createCharacter,
  gainXp,
  type CreateParams,
  type PlayerCharacter,
} from '../progression/character';
import { equipJutsu, setLoadout } from '../progression/loadout';
import { checkUnlocks } from '../progression/unlock';
import { applyBattleResult, playerToCombatant } from './battleSetup';
import { buyItem, equipItem, generateStock, priceOf, useRareScroll } from './shop';
import { REWARD_OPTIONS, type RewardOptionId, type RunNode, type RunPhase, type RunState } from './types';

/**
 * Ciclo da run (spec §7): mapa → (Acampamento) → batalha → resultado → ...
 * Todas as funções devolvem uma NOVA run (exceto battleAction com inPlace).
 * O RNG da run vive em `rngState`; cada função recria o Rng, usa e guarda o novo estado.
 */

export function buildRunNodes(rng: Rng): RunNode[] {
  const defs = SAGA_ONDA.nodes;
  // Elite nunca no nó imediatamente antes de um Acampamento (spec §7).
  const eligible = defs.filter((n) => n.kind === 'common' && !defs[n.index + 1]?.campBefore).map((n) => n.index);
  const elites = new Set(rng.shuffle(eligible).slice(0, B.run.eliteForks));
  return defs.map((n) => {
    const enemyId = n.kind === 'boss' ? (n.bossId as string) : rng.pick(n.pool);
    return {
      index: n.index,
      kind: n.kind,
      storyLevel: n.storyLevel,
      enemyId,
      eliteEnemyId: elites.has(n.index) ? (ELITE_OF[enemyId] ?? null) : null,
      campBefore: n.campBefore,
      advancesStoryTo: n.advancesStoryTo,
    };
  });
}

export function newRun(params: CreateParams, seed: number, now: number): RunState {
  const rng = new Rng(seed);
  const { character } = checkUnlocks(createCharacter(params), SAGA_ONDA.startStory, 0);
  const nodes = buildRunNodes(rng);
  const shop = generateStock(rng);
  return {
    version: 1,
    seed,
    rngState: rng.state,
    encounterStart: null,
    startedAt: now,
    sagaId: SAGA_ONDA.id,
    story: SAGA_ONDA.startStory,
    character,
    nodes,
    nodeIndex: 0,
    phase: nodes[0]?.campBefore ? 'camp' : 'map',
    battle: null,
    elite: false,
    battleTally: { damageTaken: 0, rounds: 0 },
    shop,
    pendingChoices: [],
    stats: emptyRunStats(),
    lastResult: null,
  };
}

export function currentNode(run: RunState): RunNode {
  const n = run.nodes[run.nodeIndex];
  if (!n) throw new RuleError('noNode', 'A run já terminou.');
  return n;
}

function requirePhase(run: RunState, ...phases: RunPhase[]): void {
  if (!phases.includes(run.phase)) throw new RuleError('wrongPhase', `Ação indisponível na fase "${run.phase}".`);
}

const PREP_PHASES: RunPhase[] = ['map', 'camp', 'result'];

/** Acampamento antes de chefe: HP e chakra 100% (checkpoint). */
export function restAtCamp(run: RunState): RunState {
  requirePhase(run, 'camp');
  const r = structuredClone(run);
  r.character.hp = characterMaxHp(r.character);
  r.character.chakra = characterMaxChakra(r.character);
  r.phase = 'map';
  return r;
}

export function startEncounter(run: RunState, elite = false): { run: RunState; events: GameEvent[] } {
  requirePhase(run, 'map');
  const node = currentNode(run);
  if (elite && !node.eliteEnemyId) throw new RuleError('noElite', 'Este encontro não tem variante elite.');
  const r = structuredClone(run);
  r.encounterStart = { rngState: r.rngState, stats: structuredClone(r.stats) };
  const rng = Rng.fromState(r.rngState);
  const enemy = createEnemy(elite ? (node.eliteEnemyId as string) : node.enemyId, node.storyLevel);
  const { state, events } = startBattle(playerToCombatant(r.character), enemy, rng);
  r.battle = state;
  r.elite = elite;
  r.phase = 'battle';
  r.battleTally = { damageTaken: 0, rounds: 0 };
  r.rngState = rng.state;
  absorbBattleEvents(r, events);
  if (state.status === 'ended') events.push(...finishEncounter(r));
  return { run: r, events };
}

/** Executa uma ação do jogador. `inPlace` evita clonar a run (simulador). */
export function battleAction(run: RunState, action: Action, opts: { inPlace?: boolean } = {}): { run: RunState; events: GameEvent[] } {
  requirePhase(run, 'battle');
  if (!run.battle) throw new RuleError('noBattle', 'Nenhuma batalha em andamento.');
  const r = opts.inPlace ? run : structuredClone(run);
  const rng = Rng.fromState(r.rngState);
  const events = applyActionInPlace(r.battle as NonNullable<RunState['battle']>, action, rng);
  r.rngState = rng.state;
  absorbBattleEvents(r, events);
  if (r.battle?.status === 'ended') events.push(...finishEncounter(r));
  return { run: r, events };
}

function absorbBattleEvents(r: RunState, events: GameEvent[]): void {
  r.stats = trackBattleEvents(r.stats, events, 'player');
  for (const e of events) {
    if ((e.type === 'damage' || e.type === 'dot') && e.targetId === 'player') r.battleTally.damageTaken += e.amount;
    if (e.type === 'roundStart') r.battleTally.rounds = e.round;
  }
}

function xpReward(node: RunNode, grade: Grade, elite: boolean): number {
  const base = xpForCommon(node.storyLevel);
  if (node.kind === 'boss') return base * (B.xp.bossMult[grade] ?? 4);
  return elite ? Math.round(base * B.xp.eliteMult) : base;
}

function rollRewardChoices(c: PlayerCharacter, rng: Rng): RewardOptionId[] {
  const options = REWARD_OPTIONS.filter((o) => o !== 'treino' || c.equipped.length > 0);
  return rng.shuffle(options).slice(0, 3);
}

/** Fecha o encontro: aplica resultado, recompensas, níveis, recuperação, saga, loja e desbloqueios (muta r). */
function finishEncounter(r: RunState): GameEvent[] {
  const events: GameEvent[] = [];
  const battle = r.battle as NonNullable<RunState['battle']>;
  const node = currentNode(r);
  const enemy = getEnemy(battle);
  const template = ENEMIES[enemy.templateId as string];
  if (!template) throw new RuleError('unknownEnemy', `Inimigo desconhecido: ${enemy.templateId}`);

  r.character = applyBattleResult(r.character, getPlayer(battle));
  const hpPctEnd = r.character.hp / characterMaxHp(r.character);
  const won = battle.winner === 'player';
  const common = {
    nodeIndex: node.index,
    enemyId: template.id,
    enemyName: template.name,
    grade: template.grade,
    isBoss: template.isBoss,
    elite: r.elite,
    won,
    damageTaken: r.battleTally.damageTaken,
    rounds: r.battleTally.rounds,
    hpPctEnd,
  };
  r.battle = null;
  r.encounterStart = null;

  if (!won) {
    r.lastResult = { ...common, xp: 0, ryo: 0, rep: 0, levelsGained: 0, learned: [] };
    r.phase = 'dead';
    events.push({ type: 'runEnded', result: 'dead' });
    return events;
  }

  const rng = Rng.fromState(r.rngState);
  const mods = r.character.titleId ? (TITLES[r.character.titleId]?.mods ?? {}) : {};
  const table = B.rewards[template.grade] ?? { ryo: 0, rep: 0 };
  const ryo = Math.round(table.ryo * (1 + (mods.ryoPct ?? 0)));
  const rep = Math.round(table.rep * (1 + (mods.repPct ?? 0)));
  const xp = xpReward(node, template.grade, r.elite);
  r.character.ryo += ryo;
  r.character.reputation += rep;
  events.push({ type: 'reward', xp, ryo, rep });

  const startLevel = r.character.level;
  const lv = gainXp(r.character, xp);
  r.character = lv.character;
  for (let i = 1; i <= lv.levelsGained; i++) {
    events.push({ type: 'levelUp', level: startLevel + i });
    r.pendingChoices.push(rollRewardChoices(r.character, rng));
  }

  // Recuperação pós-encontro (DD v2 §9): +25% HP e +50% chakra.
  r.character.hp += Math.round(characterMaxHp(r.character) * B.recovery.encounterHpPct);
  r.character.chakra += Math.round(characterMaxChakra(r.character) * B.recovery.encounterChakraPct);
  clampVitals(r.character);

  if (template.isBoss) {
    events.push({ type: 'bossDefeated', enemyId: template.id });
    r.shop = generateStock(rng);
  }
  if (node.advancesStoryTo) {
    r.story = node.advancesStoryTo;
    events.push({ type: 'storyAdvanced', story: r.story });
  }
  const unlocked = checkUnlocks(r.character, r.story, node.index);
  r.character = unlocked.character;
  for (const id of unlocked.learned) events.push({ type: 'jutsuLearned', jutsuId: id });

  r.rngState = rng.state;
  r.stats = trackEncounterEnd(r.stats, {
    won: true,
    grade: template.grade,
    isBoss: template.isBoss,
    elite: r.elite,
    enemyId: template.id,
    damageTaken: common.damageTaken,
    hpPctEnd,
    ryo,
  });
  r.lastResult = { ...common, xp, ryo, rep, levelsGained: lv.levelsGained, learned: unlocked.learned };
  r.nodeIndex++;
  if (r.nodeIndex >= r.nodes.length) {
    r.phase = 'victory';
    r.pendingChoices = [];
    events.push({ type: 'runEnded', result: 'victory' });
  } else {
    r.phase = 'result';
  }
  return events;
}

const REWARD_ITEM: Partial<Record<RewardOptionId, string>> = {
  kit: 'kit_medico',
  pilula: 'pilula_chakra',
  reforco: 'pergaminho_reforco',
};

/** Resolve a primeira oferta 1-de-3 pendente. "treino" exige um jutsu equipado. */
export function chooseReward(run: RunState, option: RewardOptionId, jutsuId?: string): RunState {
  requirePhase(run, 'result');
  const offer = run.pendingChoices[0];
  if (!offer) throw new RuleError('noPendingChoice', 'Não há escolha pendente.');
  if (!offer.includes(option)) throw new RuleError('notOffered', 'Esta opção não foi oferecida.');
  const r = structuredClone(run);
  const c = r.character;
  const itemId = REWARD_ITEM[option];
  if (itemId) {
    c.inventory[itemId] = (c.inventory[itemId] ?? 0) + 1;
  } else if (option === 'ryo') {
    c.ryo += B.shop.rewardRyo;
    r.stats.ryoEarned += B.shop.rewardRyo;
  } else {
    if (!jutsuId || !c.equipped.includes(jutsuId)) throw new RuleError('needJutsu', 'Escolha um jutsu equipado para o treino.');
    c.masteryUses[jutsuId] = (c.masteryUses[jutsuId] ?? 0) + B.shop.trainingUses;
  }
  r.pendingChoices.shift();
  return r;
}

export function continueFromResult(run: RunState): RunState {
  requirePhase(run, 'result');
  if (run.pendingChoices.length) throw new RuleError('pendingChoices', 'Resolva as escolhas de recompensa antes de seguir.');
  const r = structuredClone(run);
  r.phase = currentNode(r).campBefore ? 'camp' : 'map';
  return r;
}

export function allocateRunPoints(run: RunState, alloc: Partial<Attributes>): { run: RunState; learned: string[] } {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  const u = checkUnlocks(allocatePoints(r.character, alloc), r.story, r.nodeIndex);
  r.character = u.character;
  return { run: r, learned: u.learned };
}

export function buyInRun(run: RunState, itemId: string): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  const price = priceOf(itemId, r.character);
  const b = buyItem(r.character, r.shop, itemId);
  r.character = b.character;
  r.shop = b.stock;
  r.stats.ryoSpent += price;
  return r;
}

export function equipItemInRun(run: RunState, itemId: string): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  r.character = equipItem(r.character, itemId);
  return r;
}

export function useRareScrollInRun(run: RunState, attr: AttrKey): { run: RunState; learned: string[] } {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  const u = checkUnlocks(useRareScroll(r.character, attr), r.story, r.nodeIndex);
  r.character = u.character;
  return { run: r, learned: u.learned };
}

export function equipJutsuInRun(run: RunState, jutsuId: string, replaceId: string | null = null): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  r.character = equipJutsu(r.character, jutsuId, replaceId);
  return r;
}

export function setLoadoutInRun(run: RunState, ids: string[]): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  r.character = setLoadout(r.character, ids);
  return r;
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run tests/run.test.ts && npx tsc --noEmit`
Expected: 12 testes PASS; `tsc` sem saída. Se o teste "derrota encerra a run" vencer por sorte com a semente 11, troque a semente por outra (o teste é determinístico; só a semente escolhida importa) e registre a troca no commit.

- [ ] **Step 8: Rodar a suíte inteira**

Run: `npm test`
Expected: todos os arquivos de teste PASS.

- [ ] **Step 9: Commit**

```bash
git add src/game/Balance.ts src/game/run tests/run.test.ts
git commit -m "feat: ciclo da run com mapa, elites, Acampamento, recompensas e escolha 1-de-3

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Meta-progressão (histórico, títulos, enciclopédia)

**Files:**
- Create: `src/game/meta/meta.ts`
- Test: `tests/meta.test.ts`

**Interfaces:**
- Consumes: `RunState`, `RunStats`, `TITLE_LIST`, `JUTSU_LIST`, `JUTSUS`, `masteryLevelFromUses`, `SAGA_ONDA`, `BALANCE`.
- Produces:
  - `type RunResult = 'dead' | 'victory' | 'abandoned'`
  - `interface HistoryEntry { id: string; date: number; name: string; clan: ClanId; affinity: Element; level: number; reputation: number; encountersWon: number; result: RunResult; text: string; snapshot: { baseAttrs: Attributes; learned: string[]; mastery: Record<string, number>; equipment: { weapon: string | null; armor: string | null }; stats: RunStats } }`
  - `interface LifetimeStats { runs: number; victories: number; defeatedByGrade: Partial<Record<Grade, number>>; bossesDefeated: Record<string, number> }`
  - `interface MetaState { version: 1; learnedEver: string[]; masteredEver: string[]; titlesUnlocked: string[]; lifetime: LifetimeStats; history: HistoryEntry[] }`
  - `emptyMeta(): MetaState`, `runEndText(run: RunState, result: RunResult): string`, `isTitleEarned(t: TitleDef, meta: MetaState, run: RunState): boolean`, `recordRunEnd(meta, run, result, now: number): { meta: MetaState; newTitles: string[] }`, `availableTitles(meta): TitleDef[]`, `interface EncyclopediaEntry { jutsu: JutsuDef; learned: boolean; mastered: boolean }`, `encyclopedia(meta): EncyclopediaEntry[]`
- Decisão: a meta é atualizada **uma vez, no fim da run** (morte, vitória ou abandono). Títulos conquistados numa run só podem ser escolhidos na próxima, então não há perda — e isso elimina o risco de contar o mesmo encontro duas vezes.

- [ ] **Step 1: Escrever o teste que falha — `tests/meta.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { availableTitles, emptyMeta, encyclopedia, recordRunEnd, runEndText } from '../src/game/meta/meta';
import { newRun } from '../src/game/run/runManager';
import type { RunState } from '../src/game/run/types';
import type { CreateParams } from '../src/game/progression/character';

const params: CreateParams = { name: 'Teste', clan: 'uchiha', affinity: 'fogo', allocation: { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }, titleId: null };
const run = (): RunState => newRun(params, 1, 0);

describe('meta-progressão', () => {
  it('registra o histórico com texto e snapshot, mais recente primeiro, no máximo 50', () => {
    const r = run();
    r.phase = 'dead';
    r.character.level = 4;
    r.lastResult = { nodeIndex: 9, enemyId: 'mercenario_nevoa', enemyName: 'Mercenário da Névoa', grade: 'D', isBoss: false, elite: false, won: false, xp: 0, ryo: 0, rep: 0, levelsGained: 0, learned: [], damageTaken: 50, rounds: 3, hpPctEnd: 0 };
    let meta = emptyMeta();
    for (let i = 0; i < 52; i++) meta = recordRunEnd(meta, r, 'dead', 1000 + i).meta;
    expect(meta.history).toHaveLength(50);
    expect(meta.history[0]!.date).toBe(1051);
    expect(meta.history[0]!.text).toBe('Morreu na Saga da Onda, nível 4, para Mercenário da Névoa');
    expect(meta.history[0]!.snapshot.learned).toEqual(r.character.learned);
    expect(meta.lifetime.runs).toBe(52);
  });

  it('textos de vitória e abandono', () => {
    const r = run();
    r.character.level = 11;
    expect(runEndText(r, 'victory')).toBe('Concluiu a Saga da Onda no nível 11');
    r.nodeIndex = 4;
    expect(runEndText(r, 'abandoned')).toBe('Abandonou a run no encontro 5 de 26');
  });

  it('Demônio da Névoa ao derrotar Zabuza; Caçador de Bandidos somando runs', () => {
    const a = run();
    a.stats.bossesDefeated = ['zabuza'];
    a.stats.defeatedByGrade = { D: 15 };
    const r1 = recordRunEnd(emptyMeta(), a, 'dead', 1);
    expect(r1.newTitles).toContain('demonio_da_nevoa');
    expect(r1.newTitles).not.toContain('cacador_de_bandidos');
    const r2 = recordRunEnd(r1.meta, a, 'dead', 2);
    expect(r2.newTitles).toContain('cacador_de_bandidos');
    expect(r2.newTitles).not.toContain('demonio_da_nevoa'); // já tinha
  });

  it('Sem um Arranhão, Por um Fio e Mestre de Jutsus', () => {
    const a = run();
    a.stats.bossNoDamage = true;
    a.stats.bossLowHp = true;
    a.character.learned = ['henge', 'bunshin', 'kawarimi', 'bola_de_fogo', 'sennen_goroshi', 'investida_ninja', 'kai', 'daitoppa', 'doryuuheki', 'goukakyuu'];
    const { newTitles } = recordRunEnd(emptyMeta(), a, 'victory', 1);
    expect(newTitles).toEqual(expect.arrayContaining(['sem_um_arranhao', 'por_um_fio', 'mestre_de_jutsus']));
  });

  it('linha elemental: maestria +5 em 2 jutsus de Fogo diferentes', () => {
    const a = run();
    a.character.learned = ['goukakyuu', 'bola_de_fogo'];
    a.character.masteryUses = { goukakyuu: 60, bola_de_fogo: 60 };
    const { meta, newTitles } = recordRunEnd(emptyMeta(), a, 'dead', 1);
    expect(meta.masteredEver).toEqual(expect.arrayContaining(['goukakyuu', 'bola_de_fogo']));
    expect(newTitles).toEqual(expect.arrayContaining(['iniciante_fogo', 'adepto_fogo']));
    expect(newTitles).not.toContain('mestre_fogo');
  });

  it('títulos ocultos nunca aparecem como disponíveis', () => {
    const meta = { ...emptyMeta(), titlesUnlocked: ['colecionador', 'demonio_da_nevoa'] };
    expect(availableTitles(meta).map((t) => t.id)).toEqual(['demonio_da_nevoa']);
  });

  it('enciclopédia: pool completo sem golpes de inimigo, com status', () => {
    const meta = { ...emptyMeta(), learnedEver: ['bola_de_fogo'], masteredEver: ['bola_de_fogo'] };
    const entries = encyclopedia(meta);
    expect(entries.some((e) => e.jutsu.id === 'rasengan' && !e.learned)).toBe(true);
    expect(entries.some((e) => e.jutsu.enemyOnly)).toBe(false);
    expect(entries.find((e) => e.jutsu.id === 'bola_de_fogo')).toMatchObject({ learned: true, mastered: true });
  });

  it('não muta a meta recebida', () => {
    const meta = emptyMeta();
    recordRunEnd(meta, run(), 'dead', 1);
    expect(meta).toEqual(emptyMeta());
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/meta.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/meta/meta"`.

- [ ] **Step 3: Implementar `src/game/meta/meta.ts`**

```ts
import { BALANCE as B } from '../Balance';
import type { Attributes, ClanId, Element, Grade } from '../types';
import { JUTSU_LIST, JUTSUS, type JutsuDef } from '../../data/jutsus';
import { SAGA_ONDA } from '../../data/saga';
import { TITLE_LIST, type TitleDef } from '../../data/titles';
import { masteryLevelFromUses } from '../progression/mastery';
import type { RunState } from '../run/types';
import type { RunStats } from './stats';

/**
 * Tudo o que sobrevive entre runs (DD v2 §15): coleção de jutsus, títulos,
 * estatísticas vitalícias e histórico. Atualizada uma vez, no fim de cada run.
 */
export type RunResult = 'dead' | 'victory' | 'abandoned';

export interface HistoryEntry {
  id: string;
  date: number;
  name: string;
  clan: ClanId;
  affinity: Element;
  level: number;
  reputation: number;
  encountersWon: number;
  result: RunResult;
  text: string;
  snapshot: {
    baseAttrs: Attributes;
    learned: string[];
    mastery: Record<string, number>;
    equipment: { weapon: string | null; armor: string | null };
    stats: RunStats;
  };
}

export interface LifetimeStats {
  runs: number;
  victories: number;
  defeatedByGrade: Partial<Record<Grade, number>>;
  bossesDefeated: Record<string, number>;
}

export interface MetaState {
  version: 1;
  learnedEver: string[];
  masteredEver: string[];
  titlesUnlocked: string[];
  lifetime: LifetimeStats;
  history: HistoryEntry[];
}

export function emptyMeta(): MetaState {
  return {
    version: 1,
    learnedEver: [],
    masteredEver: [],
    titlesUnlocked: [],
    lifetime: { runs: 0, victories: 0, defeatedByGrade: {}, bossesDefeated: {} },
    history: [],
  };
}

export function runEndText(run: RunState, result: RunResult): string {
  const level = run.character.level;
  if (result === 'victory') return `Concluiu a ${SAGA_ONDA.name} no nível ${level}`;
  if (result === 'abandoned') return `Abandonou a run no encontro ${run.nodeIndex + 1} de ${run.nodes.length}`;
  return `Morreu na ${SAGA_ONDA.name}, nível ${level}, para ${run.lastResult?.enemyName ?? 'um inimigo'}`;
}

function masteryLevels(run: RunState): Record<string, number> {
  const c = run.character;
  const out: Record<string, number> = {};
  for (const id of c.learned) {
    const j = JUTSUS[id];
    if (j) out[id] = masteryLevelFromUses(c.masteryUses[id] ?? 0, j, c.clan, c.affinity);
  }
  return out;
}

/** Avalia a condição de um título. `meta` já deve conter os números desta run. */
export function isTitleEarned(t: TitleDef, meta: MetaState, run: RunState): boolean {
  const cond = t.condition;
  switch (cond.kind) {
    case 'bossDefeated':
      return (meta.lifetime.bossesDefeated[cond.enemyId] ?? 0) > 0;
    case 'lifetimeDefeatedGrade':
      return (meta.lifetime.defeatedByGrade[cond.grade] ?? 0) >= cond.count;
    case 'bossNoDamage':
      return run.stats.bossNoDamage;
    case 'bossLowHp':
      return run.stats.bossLowHp;
    case 'jutsusLearnedInRun':
      return run.character.learned.length >= cond.count;
    case 'elementMastery':
      return meta.masteredEver.filter((id) => JUTSUS[id]?.element === cond.element).length >= cond.count;
    case 'rareScrollsInRun':
      return run.character.rareScrollsUsed >= cond.count;
    case 'promotedRank':
      return false; // promoção só existe a partir da Fase 2
  }
}

export function recordRunEnd(
  meta: MetaState,
  run: RunState,
  result: RunResult,
  now: number,
): { meta: MetaState; newTitles: string[] } {
  const m = structuredClone(meta);
  const c = run.character;
  m.lifetime.runs++;
  if (result === 'victory') m.lifetime.victories++;
  for (const [grade, n] of Object.entries(run.stats.defeatedByGrade) as [Grade, number][]) {
    m.lifetime.defeatedByGrade[grade] = (m.lifetime.defeatedByGrade[grade] ?? 0) + n;
  }
  for (const id of run.stats.bossesDefeated) m.lifetime.bossesDefeated[id] = (m.lifetime.bossesDefeated[id] ?? 0) + 1;

  const mastery = masteryLevels(run);
  m.learnedEver = [...new Set([...m.learnedEver, ...c.learned])];
  const masteredNow = Object.entries(mastery).filter(([, lvl]) => lvl >= B.mastery.maxLevel).map(([id]) => id);
  m.masteredEver = [...new Set([...m.masteredEver, ...masteredNow])];

  m.history.unshift({
    id: `run-${now}-${run.seed}`,
    date: now,
    name: c.name,
    clan: c.clan,
    affinity: c.affinity,
    level: c.level,
    reputation: c.reputation,
    encountersWon: run.stats.encountersWon,
    result,
    text: runEndText(run, result),
    snapshot: {
      baseAttrs: { ...c.baseAttrs },
      learned: [...c.learned],
      mastery,
      equipment: { ...c.equipment },
      stats: structuredClone(run.stats),
    },
  });
  m.history = m.history.slice(0, B.history.maxEntries);

  const newTitles = TITLE_LIST.filter((t) => !m.titlesUnlocked.includes(t.id) && isTitleEarned(t, m, run)).map((t) => t.id);
  m.titlesUnlocked.push(...newTitles);
  return { meta: m, newTitles };
}

/** Títulos que o jogador pode escolher na criação (ocultos nunca aparecem no MVP). */
export function availableTitles(meta: MetaState): TitleDef[] {
  return TITLE_LIST.filter((t) => !t.hidden && meta.titlesUnlocked.includes(t.id));
}

export interface EncyclopediaEntry {
  jutsu: JutsuDef;
  learned: boolean;
  mastered: boolean;
}

/** Pool COMPLETO de jutsus (todas as fases e clãs), sem golpes exclusivos de inimigos. */
export function encyclopedia(meta: MetaState): EncyclopediaEntry[] {
  return JUTSU_LIST.filter((j) => !j.enemyOnly).map((jutsu) => ({
    jutsu,
    learned: meta.learnedEver.includes(jutsu.id),
    mastered: meta.masteredEver.includes(jutsu.id),
  }));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/meta.test.ts && npx tsc --noEmit`
Expected: 8 testes PASS; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add src/game/meta/meta.ts tests/meta.test.ts
git commit -m "feat: meta-progressão com histórico, títulos e enciclopédia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Salvamento versionado com migração e recuperação de save inválido

**Files:**
- Create: `src/game/save/save.ts`
- Test: `tests/save.test.ts`

**Interfaces:**
- Consumes: `RunState`, `MetaState`, `emptyMeta`, `zod`.
- Produces: `interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }` (o `localStorage` do navegador já cumpre essa interface), `RUN_KEY = 'nxr.run.v1'`, `META_KEY = 'nxr.meta.v1'`, `RUN_VERSION = 1`, `META_VERSION = 1`, `RUN_MIGRATIONS`, `META_MIGRATIONS`, `interface LoadResult<T> { value: T | null; error: string | null }`, `saveRun(store, run: RunState): void`, `loadRun(store, now: number): LoadResult<RunState>`, `deleteRun(store): void`, `saveMeta(store, meta: MetaState): void`, `loadMeta(store, now: number): LoadResult<MetaState>` (com `value` = `emptyMeta()` quando não há save ou ele é inválido).

- [ ] **Step 1: Escrever o teste que falha — `tests/save.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { deleteRun, loadMeta, loadRun, META_KEY, RUN_KEY, saveMeta, saveRun, type KeyValueStore } from '../src/game/save/save';
import { battleAction, newRun, startEncounter } from '../src/game/run/runManager';
import { emptyMeta } from '../src/game/meta/meta';
import type { CreateParams } from '../src/game/progression/character';

class MemoryStore implements KeyValueStore {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const params: CreateParams = { name: 'Teste', clan: 'uzumaki', affinity: 'terra', allocation: { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }, titleId: null };

describe('salvamento', () => {
  it('ida e volta da run e da meta', () => {
    const store = new MemoryStore();
    const r = newRun(params, 3, 0);
    saveRun(store, r);
    expect(loadRun(store, 0)).toEqual({ value: r, error: null });
    const meta = { ...emptyMeta(), titlesUnlocked: ['demonio_da_nevoa'] };
    saveMeta(store, meta);
    expect(loadMeta(store, 0)).toEqual({ value: meta, error: null });
  });

  it('sem save: run nula e meta vazia, sem erro', () => {
    const store = new MemoryStore();
    expect(loadRun(store, 0)).toEqual({ value: null, error: null });
    expect(loadMeta(store, 0)).toEqual({ value: emptyMeta(), error: null });
  });

  it('save corrompido: faz backup, descarta e avisa (Review Focus 1)', () => {
    const store = new MemoryStore();
    store.setItem(RUN_KEY, '{oops');
    const r = loadRun(store, 555);
    expect(r.value).toBeNull();
    expect(r.error).toMatch(/inválido/);
    expect(store.getItem('nxr.run.corrupt.555')).toBe('{oops');
    expect(store.getItem(RUN_KEY)).toBeNull();
    store.setItem(META_KEY, '[]');
    const m = loadMeta(store, 556);
    expect(m.value).toEqual(emptyMeta());
    expect(m.error).not.toBeNull();
    expect(store.getItem('nxr.meta.corrupt.556')).toBe('[]');
  });

  it('versão mais nova que a suportada é tratada como inválida', () => {
    const store = new MemoryStore();
    store.setItem(RUN_KEY, JSON.stringify({ ...newRun(params, 1, 0), version: 99 }));
    expect(loadRun(store, 1).error).toMatch(/99/);
  });

  it('migra save v0 (sem version e sem ownedEquipment)', () => {
    const store = new MemoryStore();
    const old = JSON.parse(JSON.stringify(newRun(params, 2, 0)));
    delete old.version;
    delete old.character.ownedEquipment;
    store.setItem(RUN_KEY, JSON.stringify(old));
    const r = loadRun(store, 0);
    expect(r.error).toBeNull();
    expect(r.value!.version).toBe(1);
    expect(r.value!.character.ownedEquipment).toEqual([]);
  });

  it('salvar no meio da batalha volta ao mapa com o mesmo RNG do início do encontro (Review Focus 2)', () => {
    const store = new MemoryStore();
    const r0 = newRun(params, 5, 0);
    const started = startEncounter(r0).run;
    const mid = battleAction(started, { type: 'attack' }).run;
    expect(mid.phase).toBe('battle');
    saveRun(store, mid);
    const loaded = loadRun(store, 0).value!;
    expect(loaded.phase).toBe('map');
    expect(loaded.battle).toBeNull();
    expect(loaded.rngState).toBe(r0.rngState);
    expect(loaded.stats).toEqual(r0.stats);
    expect(JSON.stringify(startEncounter(loaded).run.battle)).toBe(JSON.stringify(started.battle));
  });

  it('deleteRun remove a run', () => {
    const store = new MemoryStore();
    saveRun(store, newRun(params, 1, 0));
    deleteRun(store);
    expect(store.getItem(RUN_KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/save.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/save/save"`.

- [ ] **Step 3: Implementar `src/game/save/save.ts`**

```ts
import { z } from 'zod';
import { ATTR_KEYS } from '../types';
import { emptyMeta, type MetaState } from '../meta/meta';
import type { RunState } from '../run/types';

/**
 * Persistência versionada (DD v2 §18).
 * - O armazenamento é injetado (KeyValueStore): no navegador é o localStorage,
 *   nos testes é um Map. Assim o motor continua sem tocar em `window`.
 * - Todo save tem `version`; versões antigas passam pelas migrações em ordem.
 * - Save ilegível NUNCA derruba o jogo: vira backup e o jogo segue limpo.
 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const RUN_KEY = 'nxr.run.v1';
export const META_KEY = 'nxr.meta.v1';
export const RUN_VERSION = 1;
export const META_VERSION = 1;

type Json = Record<string, unknown>;
type Migration = (data: Json) => Json;

/** v0 → v1: saves anteriores ao versionamento, sem `ownedEquipment`. */
export const RUN_MIGRATIONS: Record<number, Migration> = {
  0: (d) => {
    const c = d['character'] as Json | undefined;
    if (c && !Array.isArray(c['ownedEquipment'])) c['ownedEquipment'] = [];
    return { ...d, version: 1 };
  },
};

export const META_MIGRATIONS: Record<number, Migration> = {
  0: (d) => ({ ...d, version: 1 }),
};

export interface LoadResult<T> {
  value: T | null;
  error: string | null;
}

const attrNumbers = z.object(Object.fromEntries(ATTR_KEYS.map((k) => [k, z.number()])));

/** Esquema mínimo: garante o que o jogo precisa para não quebrar ao carregar. */
const RunShape = z
  .object({
    version: z.literal(1),
    seed: z.number(),
    rngState: z.number(),
    nodeIndex: z.number().int().min(0),
    phase: z.enum(['camp', 'map', 'battle', 'result', 'dead', 'victory']),
    nodes: z.array(z.object({ enemyId: z.string() }).passthrough()).min(1),
    character: z
      .object({
        baseAttrs: attrNumbers,
        learned: z.array(z.string()),
        equipped: z.array(z.string()),
        ownedEquipment: z.array(z.string()),
      })
      .passthrough(),
  })
  .passthrough();

const MetaShape = z
  .object({
    version: z.literal(1),
    learnedEver: z.array(z.string()),
    masteredEver: z.array(z.string()),
    titlesUnlocked: z.array(z.string()),
    lifetime: z.object({}).passthrough(),
    history: z.array(z.unknown()),
  })
  .passthrough();

function migrate(data: Json, migrations: Record<number, Migration>, current: number): Json {
  let d = data;
  let v = typeof d['version'] === 'number' ? (d['version'] as number) : 0;
  if (v > current) throw new Error(`versão ${v} é mais nova que a suportada (${current})`);
  while (v < current) {
    const step = migrations[v];
    if (!step) throw new Error(`não há migração a partir da versão ${v}`);
    d = step(d);
    v = d['version'] as number;
  }
  return d;
}

function parseObject(raw: string): Json {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('formato inesperado');
  return parsed as Json;
}

/**
 * Salva a run. Se estiver no meio de uma batalha, salva o estado do INÍCIO do
 * encontro (mesmo RNG e mesmas estatísticas): recarregar recomeça a mesma luta.
 */
export function saveRun(store: KeyValueStore, run: RunState): void {
  const toSave: RunState =
    run.phase === 'battle' && run.encounterStart
      ? {
          ...run,
          phase: 'map',
          battle: null,
          rngState: run.encounterStart.rngState,
          stats: run.encounterStart.stats,
          encounterStart: null,
          battleTally: { damageTaken: 0, rounds: 0 },
        }
      : run;
  store.setItem(RUN_KEY, JSON.stringify(toSave));
}

export function loadRun(store: KeyValueStore, now: number): LoadResult<RunState> {
  const raw = store.getItem(RUN_KEY);
  if (raw === null) return { value: null, error: null };
  try {
    const data = migrate(parseObject(raw), RUN_MIGRATIONS, RUN_VERSION);
    RunShape.parse(data);
    return { value: data as unknown as RunState, error: null };
  } catch (e) {
    store.setItem(`nxr.run.corrupt.${now}`, raw);
    store.removeItem(RUN_KEY);
    return { value: null, error: `Save da run inválido (${(e as Error).message}). Uma cópia foi guardada e a run foi descartada.` };
  }
}

export function deleteRun(store: KeyValueStore): void {
  store.removeItem(RUN_KEY);
}

export function saveMeta(store: KeyValueStore, meta: MetaState): void {
  store.setItem(META_KEY, JSON.stringify(meta));
}

export function loadMeta(store: KeyValueStore, now: number): LoadResult<MetaState> {
  const raw = store.getItem(META_KEY);
  if (raw === null) return { value: emptyMeta(), error: null };
  try {
    const data = migrate(parseObject(raw), META_MIGRATIONS, META_VERSION);
    MetaShape.parse(data);
    return { value: data as unknown as MetaState, error: null };
  } catch (e) {
    store.setItem(`nxr.meta.corrupt.${now}`, raw);
    store.removeItem(META_KEY);
    return { value: emptyMeta(), error: `Progresso salvo inválido (${(e as Error).message}). Uma cópia foi guardada e o progresso recomeçou.` };
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/save.test.ts && npx tsc --noEmit`
Expected: 7 testes PASS; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add src/game/save tests/save.test.ts
git commit -m "feat: salvamento versionado com migração, backup de save inválido e anti save-scum

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 14: Simulador headless, metas de balanceamento e calibração

**Files:**
- Create: `src/game/sim/builds.ts`, `src/game/sim/bot.ts`, `src/game/sim/report.ts`, `tools/simulate.ts`, `docs/balance-log.md`
- Modify (só se a calibração exigir): `src/game/Balance.ts`
- Test: `tests/sim.test.ts`

**Interfaces:**
- Consumes: `runManager` inteiro, `getPlayer`, `getEnemy`, `expectedDamage`, `costFor`, `effectiveAttr`, `activeTransformation`, `masteryLevelFromUses`, `priceOf`, `ITEMS`, `JUTSUS`.
- Produces (builds.ts): `interface BuildDef { id: string; label: string; clan: ClanId; affinity: Element; weights: Partial<Record<AttrKey, number>>; focused: boolean }`, `SIM_BUILDS: BuildDef[]` (as 8 linhas do Apêndice A.5).
- Produces (bot.ts): `allocationByWeights(current: Attributes, points: number, weights: Partial<Record<AttrKey, number>>): Attributes`, `creationAllocation(build): Attributes`, `botAllocate(run, build): RunState`, `botShop(run, build): RunState`, `botLoadout(run): RunState`, `botReward(run): RunState`, `botAction(s: BattleState): Action`, `interface RunOutcome { reachedZabuza: boolean; beatZabuza: boolean; completed: boolean; zabuzaRounds: number | null; hakuRounds: number | null; commonRounds: number[]; commonHpEnd: number[]; maxMastery: number; encountersWon: number }`, `simulateRun(build, seed: number): RunOutcome`
- Produces (report.ts): `interface SimSummary { build: BuildDef; runs: number; reachZabuza: number; beatZabuza: number; completed: number; hakuGivenZabuza: number; roundsZabuza: number; roundsHaku: number; roundsCommon: number; hpEndCommon: number; maxMastery: number }`, `simulateMany(build, runs: number, seedBase: number): SimSummary`, `TARGETS`, `checkTargets(rows: SimSummary[]): string[]`, `formatTable(rows: SimSummary[]): string`
- O robô reproduz o do A.5: jutsu de maior dano que o chakra permite, medita quando falta chakra, kit abaixo de 35% de HP, pílula nos chefes, defende abaixo de 25% sem kit, compra em ordem fixa, liga o Sharingan (a passiva simulada no DD v2), nunca escolhe elite. **Decisão de desempenho:** `sim:check` roda 1000 runs por build (erro estatístico ≈ ±1,6 p.p.); `sim` roda 3000 para o relatório.

- [ ] **Step 1: Escrever o teste que falha — `tests/sim.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { allocationByWeights, simulateRun } from '../src/game/sim/bot';
import { SIM_BUILDS } from '../src/game/sim/builds';
import { checkTargets, formatTable, simulateMany } from '../src/game/sim/report';
import { emptyAttributes, sumAttributes } from '../src/game/attributes';

describe('simulador', () => {
  it('distribui pontos seguindo os pesos', () => {
    const a = allocationByWeights(emptyAttributes(5), 10, { nin: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 });
    expect(sumAttributes(a)).toBe(10);
    expect(a.nin).toBe(4);
    expect(a.hp).toBe(2);
    expect(a.tai).toBe(0);
  });

  it('uma run simulada termina e é determinística', () => {
    const a = simulateRun(SIM_BUILDS[0]!, 1);
    const b = simulateRun(SIM_BUILDS[0]!, 1);
    expect(a).toEqual(b);
    expect(a.encountersWon).toBeGreaterThan(0);
    expect(a.commonRounds.length).toBeGreaterThan(0);
  });

  it('agrega, formata e confere metas', () => {
    const rows = [simulateMany(SIM_BUILDS[1]!, 5, 100)];
    expect(rows[0]!.runs).toBe(5);
    expect(formatTable(rows)).toContain(SIM_BUILDS[1]!.label);
    expect(Array.isArray(checkTargets(rows))).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/sim.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/sim/bot"`.

- [ ] **Step 3: Implementar `src/game/sim/builds.ts`**

```ts
import type { AttrKey, ClanId, Element } from '../types';

/**
 * As 8 builds do Apêndice A.5. "focused" = entra nas metas de calibração.
 * ASSUMIDO: Uzumaki e Sem clã usam afinidade Vento (Daitoppa é o único jutsu
 * elemental de dano da afinidade deles na Onda); "Semi-equilibrado" não tinha
 * pesos no DD v2 e recebeu os abaixo.
 */
export interface BuildDef {
  id: string;
  label: string;
  clan: ClanId;
  affinity: Element;
  weights: Partial<Record<AttrKey, number>>;
  focused: boolean;
}

const NIN = { nin: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 };
const TAI = { tai: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 };
const SEMI = { nin: 0.25, tai: 0.2, hp: 0.15, def: 0.15, vel: 0.15, int: 0.1 };
const ALL = { hp: 0.125, tai: 0.125, nin: 0.125, gen: 0.125, vel: 0.125, int: 0.125, crit: 0.125, def: 0.125 };

export const SIM_BUILDS: BuildDef[] = [
  { id: 'nin-uchiha', label: 'Ninjutsu / Uchiha', clan: 'uchiha', affinity: 'fogo', weights: NIN, focused: true },
  { id: 'nin-uzumaki', label: 'Ninjutsu / Uzumaki', clan: 'uzumaki', affinity: 'vento', weights: NIN, focused: true },
  { id: 'nin-semcla', label: 'Ninjutsu / Sem clã', clan: 'semcla', affinity: 'vento', weights: NIN, focused: true },
  { id: 'tai-uchiha', label: 'Taijutsu / Uchiha', clan: 'uchiha', affinity: 'fogo', weights: TAI, focused: true },
  { id: 'tai-uzumaki', label: 'Taijutsu / Uzumaki', clan: 'uzumaki', affinity: 'vento', weights: TAI, focused: true },
  { id: 'tai-semcla', label: 'Taijutsu / Sem clã', clan: 'semcla', affinity: 'vento', weights: TAI, focused: true },
  { id: 'semi-uzumaki', label: 'Semi-equilibrado / Uzumaki', clan: 'uzumaki', affinity: 'vento', weights: SEMI, focused: false },
  { id: 'eq-semcla', label: 'Equilibrado / Sem clã', clan: 'semcla', affinity: 'vento', weights: ALL, focused: false },
];
```

- [ ] **Step 4: Implementar `src/game/sim/bot.ts`**

```ts
import { BALANCE as B } from '../Balance';
import { emptyAttributes } from '../attributes';
import { ATTR_KEYS, type AttrKey, type Attributes } from '../types';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { expectedDamage } from '../combat/ai';
import { getEnemy, getPlayer } from '../combat/battle';
import { costFor } from '../combat/cost';
import type { Action, BattleState } from '../combat/types';
import { activeTransformation, effectiveAttr } from '../effects/EffectSystem';
import { masteryLevelFromUses } from '../progression/mastery';
import {
  allocateRunPoints,
  battleAction,
  buyInRun,
  chooseReward,
  continueFromResult,
  currentNode,
  equipItemInRun,
  newRun,
  restAtCamp,
  setLoadoutInRun,
  startEncounter,
} from '../run/runManager';
import { priceOf } from '../run/shop';
import type { RewardOptionId, RunState } from '../run/types';
import type { BuildDef } from './builds';

/**
 * Robô jogador do simulador (DD v2 Apêndice A.5). Simples de propósito:
 * um humano deve se sair MELHOR que ele.
 */

/** A cada ponto, investe no atributo mais "atrasado" em relação ao peso desejado. */
export function allocationByWeights(current: Attributes, points: number, weights: Partial<Record<AttrKey, number>>): Attributes {
  const alloc = emptyAttributes(0);
  const keys = ATTR_KEYS.filter((k) => (weights[k] ?? 0) > 0);
  const invested = (k: AttrKey) => current[k] - B.attributes.start + alloc[k];
  for (let p = 0; p < points; p++) {
    const total = keys.reduce((s, k) => s + invested(k), 0) + 1;
    let best = keys[0] as AttrKey;
    let bestGap = -Infinity;
    for (const k of keys) {
      const gap = (weights[k] ?? 0) * total - invested(k);
      if (gap > bestGap) {
        bestGap = gap;
        best = k;
      }
    }
    alloc[best]++;
  }
  return alloc;
}

export function creationAllocation(build: BuildDef): Attributes {
  return allocationByWeights(emptyAttributes(B.attributes.start), B.attributes.creationPoints, build.weights);
}

export function botAllocate(run: RunState, build: BuildDef): RunState {
  const c = run.character;
  if (c.unspentPoints <= 0) return run;
  return allocateRunPoints(run, allocationByWeights(c.baseAttrs, c.unspentPoints, build.weights)).run;
}

const BUY_ORDER = ['colete_ninja', 'kunai', 'kit_medico', 'kit_medico', 'pilula_chakra', 'katana', 'colete_reforcado'];

export function botShop(run: RunState, build: BuildDef): RunState {
  let r = run;
  const taiBuild = (build.weights.tai ?? 0) > (build.weights.nin ?? 0);
  for (const id of BUY_ORDER) {
    const item = ITEMS[id];
    if (!item) continue;
    const c = r.character;
    if (item.kind === 'consumable') {
      const want = id === 'kit_medico' ? 2 : 1;
      if ((c.inventory[id] ?? 0) >= want) continue;
    } else {
      if (c.ownedEquipment.includes(id) || !r.shop.equipment.includes(id)) continue;
      if (id === 'katana' && !taiBuild) continue;
    }
    if (c.ryo < priceOf(id, c)) continue;
    r = buyInRun(r, id);
    if (item.kind === 'weapon' || item.kind === 'armor') r = equipItemInRun(r, id);
  }
  return r;
}

/** Equipa os 4 jutsus de dano mais fortes (o robô ignora buffs e controle). */
export function botLoadout(run: RunState): RunState {
  const damaging = run.character.learned
    .map((id) => JUTSUS[id])
    .filter((j): j is NonNullable<typeof j> => !!j && j.power !== null)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.cost - b.cost)
    .slice(0, B.loadout.geninSlots)
    .map((j) => j.id);
  if (damaging.length === 0 || damaging.join() === run.character.equipped.join()) return run;
  return setLoadoutInRun(run, damaging);
}

const REWARD_PRIORITY: RewardOptionId[] = ['kit', 'pilula', 'treino', 'ryo', 'reforco'];

export function botReward(run: RunState): RunState {
  const offer = run.pendingChoices[0];
  if (!offer) return run;
  const option = REWARD_PRIORITY.find((o) => offer.includes(o)) as RewardOptionId;
  return chooseReward(run, option, option === 'treino' ? run.character.equipped[0] : undefined);
}

export function botAction(s: BattleState): Action {
  const me = getPlayer(s);
  const foe = getEnemy(s);
  if (s.onlyKai) {
    const kai = me.jutsus.find((id) => JUTSUS[id]?.cleanse);
    if (kai) return { type: 'jutsu', jutsuId: kai };
  }
  if (me.transformationId && !activeTransformation(me) && !s.transformToggled && me.chakra >= 20) return { type: 'transform' };
  const hpPct = me.hp / me.maxHp;
  if (hpPct < 0.35 && (me.inventory['kit_medico'] ?? 0) > 0) return { type: 'item', itemId: 'kit_medico' };
  if (foe.isBoss && me.chakra < me.maxChakra * 0.3 && (me.inventory['pilula_chakra'] ?? 0) > 0) {
    return { type: 'item', itemId: 'pilula_chakra' };
  }
  if (hpPct < 0.25) return { type: 'defend' };
  const usable = me.jutsus
    .map((id) => JUTSUS[id])
    .filter((j): j is NonNullable<typeof j> => !!j && j.power !== null && costFor(me, j) <= me.chakra)
    .sort((a, b) => expectedDamage(me, foe, b) - expectedDamage(me, foe, a));
  const best = usable[0];
  const attack = B.power.attack * (1 + effectiveAttr(me, 'tai') / B.damage.attrDivisor);
  if (best && expectedDamage(me, foe, best) > attack) return { type: 'jutsu', jutsuId: best.id };
  const hasDamageJutsu = me.jutsus.some((id) => (JUTSUS[id]?.power ?? null) !== null);
  if (hasDamageJutsu && !best && me.chakra < me.maxChakra * 0.5) return { type: 'meditate' };
  return { type: 'attack' };
}

export interface RunOutcome {
  reachedZabuza: boolean;
  beatZabuza: boolean;
  completed: boolean;
  zabuzaRounds: number | null;
  hakuRounds: number | null;
  commonRounds: number[];
  commonHpEnd: number[];
  maxMastery: number;
  encountersWon: number;
}

export function simulateRun(build: BuildDef, seed: number): RunOutcome {
  let run = newRun(
    { name: 'Robô', clan: build.clan, affinity: build.affinity, allocation: creationAllocation(build), titleId: null },
    seed,
    0,
  );
  const out: RunOutcome = {
    reachedZabuza: false,
    beatZabuza: false,
    completed: false,
    zabuzaRounds: null,
    hakuRounds: null,
    commonRounds: [],
    commonHpEnd: [],
    maxMastery: 0,
    encountersWon: 0,
  };
  for (let guard = 0; run.phase !== 'dead' && run.phase !== 'victory'; guard++) {
    if (guard > 5000) throw new Error(`Simulação travou (build ${build.id}, semente ${seed}).`);
    if (run.phase === 'result') {
      while (run.pendingChoices.length) run = botReward(run);
      run = continueFromResult(run);
      continue;
    }
    if (run.phase === 'camp') {
      run = restAtCamp(run);
      continue;
    }
    run = botLoadout(botShop(botAllocate(run, build), build));
    if (currentNode(run).enemyId === 'zabuza') out.reachedZabuza = true;
    run = startEncounter(run).run;
    while (run.phase === 'battle' && run.battle) run = battleAction(run, botAction(run.battle), { inPlace: true }).run;
    const res = run.lastResult;
    if (!res) continue;
    if (res.enemyId === 'zabuza') {
      out.zabuzaRounds = res.rounds;
      out.beatZabuza = res.won;
    } else if (res.enemyId === 'haku') {
      out.hakuRounds = res.rounds;
    } else if (res.won) {
      out.commonRounds.push(res.rounds);
      out.commonHpEnd.push(res.hpPctEnd);
    }
  }
  const c = run.character;
  out.completed = run.phase === 'victory';
  out.encountersWon = run.stats.encountersWon;
  out.maxMastery = Math.max(
    0,
    ...c.learned.map((id) => {
      const j = JUTSUS[id];
      return j ? masteryLevelFromUses(c.masteryUses[id] ?? 0, j, c.clan, c.affinity) : 0;
    }),
  );
  return out;
}
```

- [ ] **Step 5: Implementar `src/game/sim/report.ts`**

```ts
import { simulateRun, type RunOutcome } from './bot';
import type { BuildDef } from './builds';

export interface SimSummary {
  build: BuildDef;
  runs: number;
  reachZabuza: number;
  beatZabuza: number;
  completed: number;
  /** De quem venceu Zabuza, quantos venceram Haku (spec C6). */
  hakuGivenZabuza: number;
  roundsZabuza: number;
  roundsHaku: number;
  roundsCommon: number;
  hpEndCommon: number;
  maxMastery: number;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function simulateMany(build: BuildDef, runs: number, seedBase: number): SimSummary {
  const outs: RunOutcome[] = [];
  for (let i = 0; i < runs; i++) outs.push(simulateRun(build, seedBase + i));
  const rate = (f: (o: RunOutcome) => boolean) => outs.filter(f).length / runs;
  const beat = outs.filter((o) => o.beatZabuza).length;
  return {
    build,
    runs,
    reachZabuza: rate((o) => o.reachedZabuza),
    beatZabuza: rate((o) => o.beatZabuza),
    completed: rate((o) => o.completed),
    hakuGivenZabuza: beat ? outs.filter((o) => o.completed).length / beat : 0,
    roundsZabuza: avg(outs.flatMap((o) => (o.zabuzaRounds === null ? [] : [o.zabuzaRounds]))),
    roundsHaku: avg(outs.flatMap((o) => (o.hakuRounds === null ? [] : [o.hakuRounds]))),
    roundsCommon: avg(outs.flatMap((o) => o.commonRounds)),
    hpEndCommon: avg(outs.flatMap((o) => o.commonHpEnd)),
    maxMastery: avg(outs.map((o) => o.maxMastery)),
  };
}

/** Metas da spec §12 (faixas inclusivas), aplicadas às builds focadas. */
export const TARGETS: Record<'hpEndCommon' | 'roundsCommon' | 'reachZabuza' | 'beatZabuza' | 'completed' | 'hakuGivenZabuza' | 'maxMastery', [number, number]> = {
  hpEndCommon: [0.75, 0.85],
  roundsCommon: [2, 4],
  reachZabuza: [0.95, 1],
  beatZabuza: [0.45, 0.75],
  completed: [0.35, 0.7],
  hakuGivenZabuza: [0.7, 0.85],
  maxMastery: [2, 4],
};

export function checkTargets(rows: SimSummary[]): string[] {
  const failures: string[] = [];
  for (const row of rows.filter((r) => r.build.focused)) {
    for (const [metric, [min, max]] of Object.entries(TARGETS) as [keyof typeof TARGETS, [number, number]][]) {
      const v = row[metric];
      if (v < min || v > max) failures.push(`${row.build.label}: ${metric} = ${v.toFixed(3)} (meta ${min}–${max})`);
    }
  }
  return failures;
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

export function formatTable(rows: SimSummary[]): string {
  const head =
    '| Build | Runs | Chega a Zabuza | Vence Zabuza | Completa | Haku dado Zabuza | Rodadas Z/H/comum | HP fim comum | Maestria máx |\n' +
    '|---|---|---|---|---|---|---|---|---|';
  const lines = rows.map(
    (r) =>
      `| ${r.build.label} | ${r.runs} | ${pct(r.reachZabuza)} | ${pct(r.beatZabuza)} | ${pct(r.completed)} | ${pct(r.hakuGivenZabuza)} | ` +
      `${r.roundsZabuza.toFixed(1)} / ${r.roundsHaku.toFixed(1)} / ${r.roundsCommon.toFixed(1)} | ${pct(r.hpEndCommon)} | +${r.maxMastery.toFixed(1)} |`,
  );
  return [head, ...lines].join('\n');
}
```

- [ ] **Step 6: Implementar `tools/simulate.ts`**

```ts
/**
 * Simulador headless (DD v2 §18).
 *   npm run sim                 → 3000 runs por build, imprime a tabela
 *   npm run sim:check           → 1000 runs por build e falha (exit 1) se alguma meta sair da faixa
 *   npm run sim -- --runs 200   → quantidade customizada
 */
import { SIM_BUILDS } from '../src/game/sim/builds';
import { checkTargets, formatTable, simulateMany } from '../src/game/sim/report';

const args = process.argv.slice(2);
const check = args.includes('--check');
const runsFlag = args.indexOf('--runs');
const runs = runsFlag >= 0 ? Number(args[runsFlag + 1]) : check ? 1000 : 3000;
if (!Number.isInteger(runs) || runs <= 0) {
  console.error('Uso: --runs <inteiro positivo>');
  process.exit(2);
}

const t0 = performance.now();
const rows = SIM_BUILDS.map((b, i) => simulateMany(b, runs, 100_000 * (i + 1)));
console.log(formatTable(rows));
console.log(`\nTempo: ${((performance.now() - t0) / 1000).toFixed(1)} s (${runs} runs × ${SIM_BUILDS.length} builds)`);

if (check) {
  const failures = checkTargets(rows);
  if (failures.length) {
    console.error(`\n${failures.length} meta(s) fora da faixa:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }
  console.log('\nTodas as metas de balanceamento foram atingidas.');
}
```

- [ ] **Step 7: Rodar os testes do simulador e a suíte inteira**

Run: `npx vitest run tests/sim.test.ts && npm test && npx tsc --noEmit`
Expected: todos PASS; `tsc` sem saída.

- [ ] **Step 8: Commit do simulador (antes de calibrar)**

```bash
git add src/game/sim tools/simulate.ts tests/sim.test.ts
git commit -m "feat: simulador headless com robô do Apêndice A.5 e metas automatizadas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Primeira medição**

Run: `npm run sim:check`
Expected: a tabela é impressa. Anote o tempo total. Pode falhar nas metas — é para isso que existe o passo seguinte.

- [ ] **Step 10: Criar `docs/balance-log.md` com a medição inicial**

```markdown
# Registro de balanceamento

Cada linha = UMA mudança em `src/game/Balance.ts`, seguida de `npm run sim:check` (1000 runs/build).
Metas (spec §12): HP fim comum 75–85% · rodadas comum 2–4 · chega a Zabuza ≥ 95% · vence Zabuza 45–75% · completa 35–70% · Haku dado Zabuza 70–85% · maestria máx +2 a +4.

## Medição inicial (sem mudanças)

<colar aqui a tabela impressa pelo sim:check e a lista de metas que falharam>

## Iterações

| # | Mudança (constante: antes → depois) | Metas fora após a mudança | Observação |
|---|---|---|---|
```

Substitua o marcador `<colar aqui ...>` pela saída real do Step 9.

- [ ] **Step 11: Calibrar (somente se o Step 9 falhou)**

Mude **uma constante por iteração**, rode `npm run sim:check`, e acrescente uma linha na tabela de iterações. Botões permitidos, na ordem de prioridade (passos indicados entre parênteses):

1. HP no fim dos comuns ou rodadas por comum fora da faixa → `enemyGrades.D.damageMult` (±0,05); depois `enemyGrades.D.hpMult` (±0,05).
2. Vitória contra Zabuza fora da faixa → `enemyGrades.C.hpMult` (±0,05); depois `enemyGrades.C.damageMult` (±0,03).
3. Haku dado Zabuza fora da faixa → `enemyGrades.B.hpMult` (±0,1); depois `enemyGrades.B.damageMult` (±0,03).
4. Saga completa fora da faixa → só depois que 2 e 3 estiverem dentro; usar os mesmos botões de 2/3.
5. Maestria máxima média fora da faixa → multiplicar todos os `mastery.stepUses` por 0,9 ou 1,1 (arredondando).

**Proibido** mexer em fórmulas do jogador, passivas de clã, custos/poderes de jutsus do jogador ou recompensas — são decisões de design do DD v2, não botões de calibração.

**Limite:** 8 iterações. Se depois de 8 ainda houver metas fora, PARE, faça o commit do log como está e reporte ao usuário as metas que faltam e a sua recomendação (não continue ajustando sem aprovação).

- [ ] **Step 12: Relatório final com 3000 runs**

Run: `npm run sim`
Expected: tabela impressa. Cole-a no fim de `docs/balance-log.md` sob o título `## Resultado final (3000 runs/build)`, junto com o tempo total. Se o tempo passar de 30 s, registre o valor como "problema conhecido" no log (otimização fica para o Plano 2 se necessário).

- [ ] **Step 13: Verificação completa**

Run: `npm test && npx tsc --noEmit && npm run sim:check`
Expected: testes PASS, `tsc` sem saída, `sim:check` termina com "Todas as metas de balanceamento foram atingidas." (ou o Step 11 parou no limite e o usuário foi avisado).

- [ ] **Step 14: Commit da calibração**

```bash
git add src/game/Balance.ts docs/balance-log.md
git commit -m "chore: calibração de balanceamento pelo simulador

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Cobertura da spec (autoverificação)

| Spec | Task |
|---|---|
| §2 Stack, camadas, contrato `applyAction`, eventos | 1, 5, 7 (UI e `GameStore` → Plano 2) |
| §3 C1 maestria no dano, C2 balde aditivo | 2, 6 |
| §3 C3 Kawarimi sem prioridade, C4 Kunai no atributo | 3 (dados), 6 |
| §3 C5 inimigos gerados por código, grau D+ | 3, 8 |
| §3 C6 Haku HP ×1,5 + 2ª fase | 2, 8, 14 |
| §3 C7 Gogyou geral/F2, C15 Hakke F3 | 3 |
| §3 C8 texto de reputação, C11 "grau" | Plano 3 (documentos) |
| §3 C9 presets na criação | builds do simulador (14); tela de criação → Plano 2 |
| §3 C10 Meditar na barra | 7 (ação existe); barra → Plano 2 |
| §3 C12 1-de-3 sem jutsu, §5 regra fixa | 4, 11 |
| §3 C13 Kai sob Ilusão | 5, 7 |
| §3 C14 títulos ocultos | 3, 12 |
| §4 turno, fórmulas, custos, ações | 2, 4, 6, 7 |
| §4.1 Transformação | 3, 5, 7 |
| §4.2–4.3 efeitos e jutsus do MVP | 3, 5, 7 |
| §6 progressão e presets | 4, 14 |
| §7 run, elites, Acampamento, IA | 8, 11 |
| §8 economia e loja | 9, 11 |
| §9 meta, títulos, histórico, enciclopédia | 10, 12 |
| §10 interface | Plano 2 |
| §11 persistência | 13 |
| §12 testes, simulador, metas | todas + 14 |
| §13 entregáveis (ANALISE, README, curso, DESIGN v3) | Plano 3 (README de execução no Plano 2) |

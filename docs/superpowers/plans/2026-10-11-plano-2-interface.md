# Plano 2 de 3 — Interface (GameStore + telas DOM + batalha Phaser) — NarutoTxGame MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o motor do Plano 1 num jogo jogável no navegador: `npm run dev` abre o menu e permite jogar uma run completa da Saga da Onda com os 3 clãs, com batalha animada em Phaser, telas em HTML/CSS e save no `localStorage`.

**Architecture:** Uma única fonte da verdade, `GameStore` (`src/store/`), recebe comandos da interface, chama as funções puras do motor (`src/game/run/runManager.ts`), persiste, registra a meta no fim da run e publica (a) o novo estado para as telas DOM e (b) a lista de `GameEvent` para a `BattleScene`. As telas DOM (`src/ui-dom/`) são funções `(ctx) => HTMLElement` re-renderizadas a cada mudança. A lógica de tela que dá para testar sem DOM (prévias, Poder Ninja, log, botões de jutsu) fica em `src/ui-dom/view/`, como funções puras. O Phaser só desenha a arena e anima eventos; nenhuma regra vive nele.

**Tech Stack:** Node 22, TypeScript 5 (strict), Vite 6, Phaser 3.88, Vitest 3 (+ happy-dom 15 para testes de DOM), Zod 3 (já instalado).

**Spec:** `docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md` (§2, §10, §11, §13) + DD v2 §13 e §14 em `docs/referencia/`. **Pré-requisito:** o Plano 1 (`docs/superpowers/plans/2026-10-04-plano-1-motor.md`) tem de estar executado, com `npm test` e `npm run sim:check` verdes. Este plano usa as assinaturas exatas do Plano 1. Se a execução do Plano 1 mudou alguma delas (rode `git log --stat` e confira os blocos **Interfaces** do Plano 1), ajuste a task afetada antes de começar.

## Global Constraints

- Idioma: identificadores em inglês; textos de interface, comentários e mensagens em **pt-BR**.
- **Toda string de interface** vive em `src/i18n/pt-BR.ts` e é lida com `t(chave, vars)`. Nomes de conteúdo (jutsus, itens, efeitos, inimigos, títulos, clãs, atributos) já vêm de `src/data/` e `ATTR_NAMES` (Plano 1) e **não** são duplicados no i18n.
- Motor (`src/game/**`) continua puro: nada deste plano pode importar `phaser`, `window` ou `document` dentro de `src/game/`. Só `src/main.ts` e `src/scenes/**` importam `phaser`. `GameStore` e `src/ui-dom/view/**` não importam `phaser`.
- `Math.random`, `Date.now` e `crypto` só em `src/main.ts`, que injeta `now()` e `newSeed()` no `GameStore`.
- A interface **nunca** altera o `RunState` diretamente; tudo passa por um método do `GameStore`, que chama o motor.
- Texto dinâmico entra no DOM só via `textContent`/nós de texto (helper `h()`), **nunca** via `innerHTML` com dado do jogador.
- Nenhuma informação só por cor: log, efeitos e estados têm texto ou símbolo junto da cor (spec §10).
- Layout desktop, largura mínima de 1024px; Phaser com `Scale.FIT` (spec §10). Arte só com placeholders (formas e nomes), nunca arte oficial.
- Atalhos na batalha: `1`–`4` jutsus, `A` Atacar, `D` Defender, `M` Meditar, `I` Item, `T` Transformar (spec §10).
- Chaves de save: `nxr.run.v1` e `nxr.meta.v1`, via `saveRun`/`loadRun`/`saveMeta`/`loadMeta` do Plano 1 (spec §11). A interface não escreve outras chaves.
- Testes de DOM começam com o comentário `// @vitest-environment happy-dom`; os demais rodam no ambiente `node`.
- Commits pequenos, mensagem em pt-BR no formato `tipo: descrição`, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **`localStorage` cheio ou bloqueado** (cota estourada, modo privado) → `saveRun` lança exceção; o jogo **não** pode travar nem perder o estado em memória: mostra o aviso "Não foi possível salvar" e segue (teste na Task 4).
2. **Tecla ou clique repetido durante a animação** (ex.: apertar `A` três vezes rápido) → só a primeira ação vale; as outras são ignoradas enquanto `locked` é `true`, sem erro e sem ação dupla (teste na Task 5 e na Task 11).
3. **Fechar ou recarregar a aba durante a animação da morte** → a run já foi registrada no Histórico e apagada do save **no momento** em que o motor declarou a derrota, não ao fim da animação (teste na Task 5).
4. **Fim de encontro que sobe vários níveis e aprende um jutsu com os 4 slots cheios** → a tela de troca aparece e as escolhas 1-de-3 continuam todas pendentes, em ordem, sem que uma apague a outra (teste na Task 5).
5. **Nome do personagem com HTML** (`<img src=x onerror=alert(1)>`) → aparece como texto literal em todas as telas e no Histórico (teste na Task 6).

---

## Estrutura de arquivos

```
index.html                          ponto de entrada do Vite
vite.config.ts                      (modificado) base relativa + build
README.md                           como executar + o que ficou de fora
src/
  main.ts                           liga localStorage, relógio, semente, App e Phaser
  styles.css                        tokens de cor, layout e componentes
  i18n/pt-BR.ts                     dicionário + t() + pct()
  game/progression/presets.ts       presets de distribuição (spec C9) — puro, fica no motor
  store/GameStore.ts                fonte única da verdade da aplicação
  ui-dom/
    dom.ts                          h(), clear(), button()
    App.ts                          camadas, roteamento de telas, avisos, modal, teclado
    types.ts                        ScreenCtx, ScreenRenderer, KeyHandler, BattleView
    view/derived.ts                 Poder Ninja, estilo de luta, prévias, metas de jutsu, HUD
    view/log.ts                     GameEvent → linha de log
    components/allocation.ts        painel de distribuição de pontos
    components/radar.ts             radar SVG de 8 pontas
    components/swap.ts              diálogo "aprendeu jutsu com slots cheios"
    screens/index.ts                registro ScreenId → renderer e atalhos
    screens/MenuScreen.ts  ErrorScreen.ts  CreateScreen.ts  MapScreen.ts  ResultScreen.ts
    screens/RunEndScreen.ts  PrepScreen.ts  SheetScreen.ts  EncyclopediaScreen.ts
    screens/HistoryScreen.ts  TitlesScreen.ts  BattleScreen.ts
  scenes/
    animationQueue.ts               fila de animação pura (testável)
    BootScene.ts  BattleScene.ts  createGame.ts
tests/ui/
  i18n.test.ts  presets.test.ts  derived.test.ts  log.test.ts  store.test.ts  store-battle.test.ts
  dom.test.ts  menu.test.ts  create.test.ts  map-result.test.ts  prep-sheet.test.ts
  meta-screens.test.ts  animation.test.ts  battle-hud.test.ts  e2e.test.ts  memoryStore.ts
```

---

### Task 1: Casca do app (Vite + Phaser + happy-dom), estilos e i18n

**Files:**
- Create: `index.html`, `src/main.ts`, `src/styles.css`, `src/i18n/pt-BR.ts`, `tests/ui/i18n.test.ts`
- Modify: `vite.config.ts`, `package.json` (dependências)

**Interfaces:**
- Consumes: nada do motor.
- Produces: `PT_BR` (objeto `as const`), `type I18nKey = keyof typeof PT_BR`, `t(key: I18nKey, vars?: Record<string, string | number>): string`, `pct(fraction: number, digits = 1): string`, `num(n: number): string`. **Toda task seguinte acrescenta chaves ao objeto `PT_BR`** (listadas em cada task); o tipo `I18nKey` cresce sozinho.

- [ ] **Step 1: Instalar dependências**

Run: `npm install phaser@^3.88 && npm install -D happy-dom@^15`
Expected: `added N packages`, sem erros.

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/i18n.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { PT_BR, num, pct, t } from '../../src/i18n/pt-BR';

describe('i18n pt-BR', () => {
  it('interpola variáveis', () => {
    expect(t('common.ryo', { n: 30 })).toBe('30 ryo');
    expect(t('common.level', { n: 4 })).toBe('Nível 4');
  });

  it('deixa intacta uma variável não informada (bug visível, não silencioso)', () => {
    expect(t('common.ryo')).toBe('{n} ryo');
  });

  it('formata porcentagem e número no padrão brasileiro', () => {
    expect(pct(0.1667)).toBe('16,7%');
    expect(pct(0.04, 0)).toBe('4%');
    expect(num(1220)).toBe('1.220');
  });

  it('nenhuma chave tem texto vazio', () => {
    for (const [k, v] of Object.entries(PT_BR)) expect(v.trim(), k).not.toBe('');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/i18n.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/i18n/pt-BR"`.

- [ ] **Step 4: Implementar `src/i18n/pt-BR.ts`**

```ts
/**
 * Todas as strings de INTERFACE do jogo (spec §2: i18n PT-BR).
 * Nomes de conteúdo (jutsus, itens, inimigos...) ficam em src/data/.
 * POR QUÊ um objeto `as const`: o TypeScript passa a conhecer cada chave, e
 * um t('chave.errada') vira erro de compilação, não texto quebrado na tela.
 * Variáveis: "{nome}" no texto, preenchidas por t(chave, { nome: valor }).
 */
export const PT_BR = {
  'app.title': 'NarutoTxGame',
  'common.back': 'Voltar',
  'common.confirm': 'Confirmar',
  'common.cancel': 'Cancelar',
  'common.close': 'Fechar',
  'common.continue': 'Continuar',
  'common.ryo': '{n} ryo',
  'common.level': 'Nível {n}',
  'common.none': 'Nenhum',
  'notice.saveFailed': 'Não foi possível salvar o progresso (armazenamento cheio ou bloqueado). O jogo continua, mas pode se perder ao fechar a aba.',
  'notice.unexpected': 'Erro inesperado: {msg}',
  'error.title': 'Algo deu errado',
  'error.reload': 'Recarregar o jogo',
  'screen.wip': 'Tela em construção.',
  'element.fogo': 'Fogo',
  'element.vento': 'Vento',
  'element.raio': 'Raio',
  'element.terra': 'Terra',
  'element.agua': 'Água',
} as const;

export type I18nKey = keyof typeof PT_BR;

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  const tpl: string = PT_BR[key];
  if (!vars) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** 0.1667 → "16,7%". */
export function pct(fraction: number, digits = 1): string {
  return `${(fraction * 100).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

/** 1220 → "1.220". */
export function num(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/ui/i18n.test.ts`
Expected: 4 testes PASS.

- [ ] **Step 6: Atualizar `vite.config.ts`**

Substituir o arquivo inteiro por:

```ts
import { defineConfig } from 'vitest/config';

// base './' → o dist/ funciona aberto de qualquer pasta (spec §13: "dist/ estático").
// O Phaser sozinho passa de 1 MB; o aviso de chunk grande é esperado.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 7: Criar `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NarutoTxGame</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: Criar `src/styles.css`**

```css
/* Tokens de cor e tamanho. Toda cor da interface sai daqui. */
:root {
  --bg: #12141a;
  --panel: #1c1f28;
  --panel-2: #262a36;
  --line: #3a3f4f;
  --text: #e8e6e1;
  --muted: #9a9caa;
  --accent: #f08a24;
  --accent-2: #3fa7d6;
  --good: #4caf6a;
  --bad: #e0524a;
  --heal: #59c98a;
  --effect: #b98ce8;
  --hp: #d6453d;
  --chakra: #3a7bd5;
  --radius: 8px;
  --gap: 12px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  background: var(--bg);
}

* { box-sizing: border-box; }
body { margin: 0; min-width: 1024px; background: var(--bg); }
h1, h2, h3 { margin: 0 0 var(--gap); }
button {
  font: inherit; color: var(--text); background: var(--panel-2);
  border: 1px solid var(--line); border-radius: var(--radius);
  padding: 8px 14px; cursor: pointer;
}
button:hover:not(:disabled) { border-color: var(--accent); }
button:disabled { opacity: 0.45; cursor: not-allowed; }
button.primary { background: var(--accent); color: #1a1205; border-color: var(--accent); font-weight: 600; }
input, select { font: inherit; color: var(--text); background: var(--panel-2); border: 1px solid var(--line); border-radius: var(--radius); padding: 6px 10px; }

/* Camadas: canvas do Phaser por baixo, telas DOM por cima. */
#app { position: relative; min-height: 100vh; }
#game-layer { position: absolute; inset: 0; display: none; }
#game-layer.visible { display: block; }
#ui-layer { position: relative; z-index: 1; padding: 24px; max-width: 1280px; margin: 0 auto; }
#ui-layer.battle { padding: 0; max-width: none; pointer-events: none; }
#ui-layer.battle > * { pointer-events: auto; }
#toast-layer { position: fixed; top: 16px; right: 16px; z-index: 30; display: flex; flex-direction: column; gap: 8px; max-width: 420px; }
#modal-layer:empty, #overlay-layer:empty { display: none; }
#modal-layer, #overlay-layer { position: fixed; inset: 0; z-index: 20; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; }

.screen { display: flex; flex-direction: column; gap: var(--gap); }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; }
.row { display: flex; gap: var(--gap); align-items: center; flex-wrap: wrap; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
.muted { color: var(--muted); }
.tabs { display: flex; gap: 4px; }
.tabs button.active { border-color: var(--accent); color: var(--accent); }
.toast { background: var(--panel-2); border-left: 4px solid var(--accent-2); padding: 10px 12px; border-radius: var(--radius); display: flex; gap: 8px; align-items: start; }
.toast.error { border-left-color: var(--bad); }
.dialog { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; min-width: 420px; max-width: 640px; }
.bar { height: 10px; background: var(--panel-2); border-radius: 5px; overflow: hidden; }
.bar > span { display: block; height: 100%; transition: width 300ms ease; }
.bar.hp > span { background: var(--hp); }
.bar.chakra > span { background: var(--chakra); }
.bar.xp > span { background: var(--accent); }
.card { background: var(--panel-2); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px; }
.card.selected { border-color: var(--accent); }
table { border-collapse: collapse; width: 100%; }
td, th { padding: 4px 8px; text-align: left; border-bottom: 1px solid var(--line); }
.badge { display: inline-block; padding: 1px 8px; border-radius: 10px; background: var(--panel-2); border: 1px solid var(--line); font-size: 0.85em; }
.node-list { display: grid; grid-template-columns: repeat(13, 1fr); gap: 6px; }
.node { text-align: center; padding: 6px 2px; border-radius: var(--radius); border: 1px solid var(--line); font-size: 0.8em; }
.node.done { opacity: 0.5; }
.node.current { border-color: var(--accent); color: var(--accent); font-weight: 600; }
.node.boss { border-style: double; border-width: 3px; }

/* Batalha */
.battle-hud { position: relative; min-height: 100vh; display: grid; grid-template-rows: auto 1fr auto; gap: var(--gap); padding: 16px; }
.fighters { display: grid; grid-template-columns: 340px 1fr 340px; gap: var(--gap); }
.fighter { background: rgba(28, 31, 40, 0.92); }
.effects { display: flex; gap: 4px; flex-wrap: wrap; min-height: 24px; }
.effect-chip { font-size: 0.8em; padding: 1px 6px; border-radius: 4px; background: var(--panel-2); border: 1px solid var(--effect); }
.turn-indicator { text-align: center; font-weight: 600; }
.battle-log { background: rgba(18, 20, 26, 0.92); border: 1px solid var(--line); border-radius: var(--radius); padding: 8px; height: 220px; overflow-y: auto; font-size: 0.9em; align-self: end; }
.log-player { color: #8fd0ff; }
.log-enemy { color: #ffb08a; }
.log-damage { color: var(--bad); }
.log-heal { color: var(--heal); }
.log-effect { color: var(--effect); }
.log-system { color: var(--muted); }
.action-bar { display: flex; gap: 8px; flex-wrap: wrap; background: rgba(28, 31, 40, 0.95); padding: 12px; border-radius: var(--radius); border: 1px solid var(--line); }
.action-bar .jutsu { min-width: 150px; text-align: left; }
.key { font-size: 0.75em; color: var(--muted); margin-right: 4px; }
```

- [ ] **Step 9: Criar `src/main.ts` provisório**

```ts
import './styles.css';
import { t } from './i18n/pt-BR';

// Provisório: a Task 6 troca este arquivo pela montagem do App e do GameStore.
const root = document.getElementById('app');
if (root) root.textContent = t('app.title');
```

- [ ] **Step 10: Conferir que o app abre e que a build funciona**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros de tipo; `dist/index.html` gerado.

Run: `npm run dev`, abrir a URL mostrada. Expected: página escura com o texto "NarutoTxGame". Encerrar com Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vite.config.ts index.html src/main.ts src/styles.css src/i18n/pt-BR.ts tests/ui/i18n.test.ts
git commit -m "chore: casca do app com Vite, Phaser, estilos e i18n pt-BR

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Presets de distribuição e derivados de tela (Poder Ninja, estilo, prévias, metas de jutsu, HUD)

**Files:**
- Create: `src/game/progression/presets.ts`, `src/ui-dom/view/derived.ts`
- Test: `tests/ui/presets.test.ts`, `tests/ui/derived.test.ts`

**Interfaces:**
- Consumes (Plano 1): `allocationByWeights(current: Attributes, points: number, weights)` de `src/game/sim/bot.ts`; `createCharacter`, `characterMaxHp`, `characterMaxChakra`, `effectiveAttrs`, `type PlayerCharacter`, `type CreateParams` de `progression/character.ts`; `checkUnlocks`, `missingRequirements` de `progression/unlock.ts`; `costFor`, `currentMasteryLevel` de `combat/cost.ts`; `getPlayer`, `getEnemy`, `startBattle` de `combat/battle.ts`; `aggregateMods`, `effectiveAttr`, `activeTransformation`, `applyEffect` de `effects/EffectSystem.ts`; fórmulas `chakraRegen`, `critChance`, `defenseReduction`, `dodgeChance`, `totalReduction`; `EFFECTS`, `JUTSU_LIST`, `JUTSUS`, `SAGA_ONDA`, `storyIndex`, `BALANCE`, `addAttributes`, `emptyAttributes`, `ATTR_KEYS`.
- Produces (presets.ts): `PRESET_IDS = ['ninjutsu','taijutsu','equilibrado'] as const`, `type PresetId`, `PRESET_WEIGHTS: Record<PresetId, Partial<Record<AttrKey, number>>>`, `presetAllocation(current: Attributes, points: number, preset: PresetId): Attributes` (devolve **só os pontos a somar**, total = `points`).
- Produces (derived.ts):
  - `ninjaPower(a: Attributes): number`
  - `type StyleId = 'ninjutsu'|'taijutsu'|'genjutsu'|'estrategista'|'muralha'|'agil'|'equilibrado'`, `fightingStyle(base: Attributes): StyleId`
  - `previewCharacter(clan: ClanId, affinity: Element, alloc: Partial<Attributes>): PlayerCharacter`
  - `interface CreationPreview { hp: number; chakra: number; regen: number; critPct: number; reductionPct: number; power: number; unlocks: string[] }`, `creationPreview(clan, affinity, alloc): CreationPreview`
  - `interface JutsuGoal { jutsuId: string; missing: { attr: AttrKey; missing: number }[] }`, `jutsuGoals(c: PlayerCharacter, story: StoryPointId, limit = 3): JutsuGoal[]`
  - `interface EffectChip { id: string; name: string; icon: string; remaining: number | null; sustained: boolean; description: string; type: EffectType }`, `interface CombatantView { id: string; name: string; level: number; grade: Grade | null; isBoss: boolean; power: number; hp: number; maxHp: number; chakra: number; maxChakra: number; critPct: number; dodgePct: number; reductionPct: number; effects: EffectChip[]; transformed: boolean }`, `combatantView(c: Combatant, foe: Combatant): CombatantView`
  - `interface JutsuButton { id: string; name: string; cost: number; mastery: number; affordable: boolean; allowed: boolean; description: string; element: Element | null }`, `jutsuButtons(s: BattleState): JutsuButton[]`

- [ ] **Step 1: Escrever o teste que falha — `tests/ui/presets.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { emptyAttributes, sumAttributes } from '../../src/game/attributes';
import { PRESET_IDS, PRESET_WEIGHTS, presetAllocation } from '../../src/game/progression/presets';

describe('presets de distribuição (spec C9 e §6)', () => {
  it('pesos de cada preset somam 100%', () => {
    for (const id of PRESET_IDS) {
      const total = Object.values(PRESET_WEIGHTS[id]).reduce((s, v) => s + (v ?? 0), 0);
      expect(total, id).toBeCloseTo(1, 5);
    }
  });

  it('distribui exatamente os pontos pedidos, só em atributos do preset', () => {
    const add = presetAllocation(emptyAttributes(5), 10, 'ninjutsu');
    expect(sumAttributes(add)).toBe(10);
    expect(add.nin).toBe(4);
    expect(add.tai).toBe(0);
    expect(add.gen).toBe(0);
  });

  it('Taijutsu troca Nin por Tai', () => {
    const add = presetAllocation(emptyAttributes(5), 10, 'taijutsu');
    expect(add.tai).toBe(4);
    expect(add.nin).toBe(0);
  });

  it('respeita o que já foi investido (corrige a build na direção do preset)', () => {
    const current = { ...emptyAttributes(5), nin: 15 };
    const add = presetAllocation(current, 5, 'ninjutsu');
    expect(add.nin).toBe(0);
    expect(sumAttributes(add)).toBe(5);
  });

  it('0 pontos devolve tudo zerado', () => {
    expect(sumAttributes(presetAllocation(emptyAttributes(5), 0, 'equilibrado'))).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/ui/presets.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/game/progression/presets"`.

- [ ] **Step 3: Implementar `src/game/progression/presets.ts`**

```ts
import { allocationByWeights } from '../sim/bot';
import type { AttrKey, Attributes } from '../types';

/**
 * Presets de distribuição de pontos (spec C9 e §6). Existem porque builds
 * espalhadas travam em Zabuza (DD v2 A.5): o jogador recebe um caminho
 * seguro, mas continua livre para distribuir à mão.
 * Reaproveita o algoritmo do robô do simulador: o preset da interface é
 * exatamente o build que o balanceamento mediu.
 */
export const PRESET_IDS = ['ninjutsu', 'taijutsu', 'equilibrado'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const PRESET_WEIGHTS: Record<PresetId, Partial<Record<AttrKey, number>>> = {
  ninjutsu: { nin: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 },
  taijutsu: { tai: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 },
  equilibrado: { nin: 0.3, tai: 0.1, hp: 0.2, def: 0.15, vel: 0.15, int: 0.1 },
};

/** Pontos a SOMAR (não o total final) para aproximar a build do preset. */
export function presetAllocation(current: Attributes, points: number, preset: PresetId): Attributes {
  return allocationByWeights(current, points, PRESET_WEIGHTS[preset]);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/ui/presets.test.ts`
Expected: 5 testes PASS. (Se `add.nin` vier 5 em vez de 4 no primeiro teste, o arredondamento de `allocationByWeights` mudou na execução do Plano 1: troque o número esperado pelo que `creationAllocation` do Plano 1 produz para o build `nin-*` e registre no commit.)

- [ ] **Step 5: Escrever o teste que falha — `tests/ui/derived.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/game/Rng';
import { emptyAttributes } from '../../src/game/attributes';
import { startBattle } from '../../src/game/combat/battle';
import { costFor } from '../../src/game/combat/cost';
import { createEnemy } from '../../src/game/combat/enemyFactory';
import { applyEffect } from '../../src/game/effects/EffectSystem';
import { critChance, defenseReduction } from '../../src/game/formulas';
import { playerToCombatant } from '../../src/game/run/battleSetup';
import { JUTSUS } from '../../src/data/jutsus';
import {
  combatantView,
  creationPreview,
  fightingStyle,
  jutsuButtons,
  jutsuGoals,
  ninjaPower,
  previewCharacter,
} from '../../src/ui-dom/view/derived';

describe('Poder Ninja e estilo de luta (DD v2 §3 e §14)', () => {
  it('Poder Ninja segue a fórmula de referência', () => {
    // 2·5 + 3·5 + 5 + 5 + 2·5 + 5 + 2·5 + 2·5 = 70
    expect(ninjaPower(emptyAttributes(5))).toBe(70);
    // nin 15 vira o "maior ofensivo": 70 + 3·10 = 100
    expect(ninjaPower({ ...emptyAttributes(5), nin: 15 })).toBe(100);
  });

  it('estilo pelo atributo mais investido (≥ 30% do investido)', () => {
    expect(fightingStyle({ ...emptyAttributes(5), nin: 9, hp: 7, def: 6, vel: 6, int: 6, crit: 6 })).toBe('ninjutsu');
    expect(fightingStyle(emptyAttributes(5))).toBe('equilibrado');
    expect(fightingStyle(emptyAttributes(7))).toBe('equilibrado');
    expect(fightingStyle({ ...emptyAttributes(5), int: 12 })).toBe('estrategista');
  });
});

describe('prévia da criação (spec §10: fórmulas derivadas e jutsus liberados)', () => {
  it('calcula HP, chakra e derivados para qualquer distribuição parcial', () => {
    const p = creationPreview('semcla', 'vento', { hp: 2, nin: 8 });
    expect(p.hp).toBe(114);
    expect(p.chakra).toBe(39);
    expect(p.regen).toBe(2);
    expect(p.critPct).toBeCloseTo(critChance(5), 6);
    expect(p.reductionPct).toBeCloseTo(defenseReduction(5), 6);
  });

  it('lista os jutsus que a build libera, sem jutsus de outro clã', () => {
    const semcla = creationPreview('semcla', 'vento', { nin: 10 }).unlocks;
    expect(semcla).toContain('henge');
    expect(semcla).toContain('daitoppa');
    expect(semcla).not.toContain('goukakyuu');
    const uchiha = creationPreview('uchiha', 'fogo', { nin: 7, gen: 3 }).unlocks;
    expect(uchiha).toContain('goukakyuu');
  });

  it('Uzumaki aplica o multiplicador de HP do clã', () => {
    expect(creationPreview('uzumaki', 'vento', { hp: 2 }).hp).toBe(125);
  });
});

describe('metas de jutsu ("faltam X para...")', () => {
  it('ordena pelos que estão mais perto e ignora outro clã e jutsus já aprendidos', () => {
    const c = previewCharacter('semcla', 'vento', { nin: 4 }); // nin 9
    const goals = jutsuGoals(c, 'onda');
    expect(goals.length).toBeLessThanOrEqual(3);
    expect(goals[0]?.jutsuId).toBe('sennen_goroshi'); // falta 1 de Tai
    expect(goals.map((g) => g.jutsuId)).not.toContain('goukakyuu');
    expect(goals.map((g) => g.jutsuId)).not.toContain('henge');
  });
});

describe('modelos do HUD de batalha', () => {
  function battle() {
    const c = previewCharacter('semcla', 'vento', { hp: 2, nin: 8 });
    c.learned = ['henge', 'bunshin', 'bola_de_fogo', 'daitoppa'];
    c.equipped = [...c.learned];
    return startBattle(playerToCombatant(c), createEnemy('ninja_renegado', 1), new Rng(1)).state;
  }

  it('combatantView traz vitais, porcentagens e efeitos com turnos', () => {
    const s = battle();
    const p = s.combatants.find((x) => x.side === 'player')!;
    const e = s.combatants.find((x) => x.side === 'enemy')!;
    applyEffect(p, 'queimadura', { sourceId: e.id });
    const v = combatantView(p, e);
    expect(v.maxHp).toBe(114);
    expect(v.reductionPct).toBeCloseTo(defenseReduction(5), 6);
    expect(v.effects[0]?.name).toBe('Queimadura');
    expect(v.effects[0]?.remaining).toBe(3);
    expect(v.transformed).toBe(false);
  });

  it('jutsuButtons mostra custo real, apaga sem chakra e bloqueia tudo sob Ilusão (menos Kai)', () => {
    const s = battle();
    const p = s.combatants.find((x) => x.side === 'player')!;
    const btns = jutsuButtons(s);
    expect(btns.map((b) => b.id)).toEqual(['henge', 'bunshin', 'bola_de_fogo', 'daitoppa']);
    expect(btns[3]?.cost).toBe(costFor(p, JUTSUS['daitoppa']!));
    p.chakra = 0;
    expect(jutsuButtons(s).every((b) => !b.affordable)).toBe(true);
    s.onlyKai = true;
    expect(jutsuButtons(s).every((b) => !b.allowed)).toBe(true);
  });
});
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `npx vitest run tests/ui/derived.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/ui-dom/view/derived"`.

- [ ] **Step 7: Implementar `src/ui-dom/view/derived.ts`**

```ts
import { BALANCE } from '../../game/Balance';
import { addAttributes, emptyAttributes } from '../../game/attributes';
import { getPlayer } from '../../game/combat/battle';
import { costFor, currentMasteryLevel } from '../../game/combat/cost';
import type { BattleState, Combatant } from '../../game/combat/types';
import { activeTransformation, aggregateMods, effectiveAttr } from '../../game/effects/EffectSystem';
import { chakraRegen, critChance, defenseReduction, dodgeChance, totalReduction } from '../../game/formulas';
import {
  characterMaxChakra,
  characterMaxHp,
  createCharacter,
  effectiveAttrs,
  type PlayerCharacter,
} from '../../game/progression/character';
import { checkUnlocks, missingRequirements } from '../../game/progression/unlock';
import {
  ATTR_KEYS,
  type AttrKey,
  type Attributes,
  type ClanId,
  type EffectType,
  type Element,
  type Grade,
  type StoryPointId,
} from '../../game/types';
import { EFFECTS } from '../../data/effects';
import { JUTSU_LIST, JUTSUS } from '../../data/jutsus';
import { SAGA_ONDA } from '../../data/saga';
import { storyIndex } from '../../data/story';

/**
 * Números que as telas mostram mas que NÃO são regra do jogo.
 * Tudo puro e testável sem DOM; as telas só formatam o resultado.
 */

/**
 * Poder Ninja (DD v2 §3): número informativo, nunca entra em fórmula.
 * PN = 2·HP + 3·(maior de Tai/Nin/Gen) + (soma dos outros dois) + 2·Vel + Int + 2·Crit + 2·Def
 */
export function ninjaPower(a: Attributes): number {
  const off = [a.tai, a.nin, a.gen].sort((x, y) => y - x);
  return 2 * a.hp + 3 * off[0]! + off[1]! + off[2]! + 2 * a.vel + a.int + 2 * a.crit + 2 * a.def;
}

export type StyleId = 'ninjutsu' | 'taijutsu' | 'genjutsu' | 'estrategista' | 'muralha' | 'agil' | 'equilibrado';

const STYLE_OF: Record<AttrKey, StyleId> = {
  nin: 'ninjutsu',
  tai: 'taijutsu',
  gen: 'genjutsu',
  int: 'estrategista',
  hp: 'muralha',
  def: 'muralha',
  vel: 'agil',
  crit: 'agil',
};

/** Rótulo da Ficha (DD v2 §14): o atributo mais investido, se tiver ≥ 30% do total investido. */
export function fightingStyle(base: Attributes): StyleId {
  const start = BALANCE.attributes.start;
  const invested = ATTR_KEYS.map((k) => ({ k, v: Math.max(0, base[k] - start) }));
  const total = invested.reduce((s, x) => s + x.v, 0);
  if (total === 0) return 'equilibrado';
  const top = invested.reduce((a, b) => (b.v > a.v ? b : a));
  const tied = invested.filter((x) => x.v === top.v).length > 1;
  return !tied && top.v / total >= 0.3 ? STYLE_OF[top.k] : 'equilibrado';
}

/**
 * Personagem "de mentira" para prévias. createCharacter exige exatamente 10
 * pontos; criamos com uma distribuição válida e trocamos os atributos base
 * pela distribuição parcial que o jogador está montando.
 */
export function previewCharacter(clan: ClanId, affinity: Element, alloc: Partial<Attributes>): PlayerCharacter {
  const c = createCharacter({
    name: 'Prévia',
    clan,
    affinity,
    allocation: { hp: BALANCE.attributes.creationPoints },
    titleId: null,
  });
  c.baseAttrs = addAttributes(emptyAttributes(BALANCE.attributes.start), alloc);
  c.hp = characterMaxHp(c);
  c.chakra = characterMaxChakra(c);
  return c;
}

export interface CreationPreview {
  hp: number;
  chakra: number;
  regen: number;
  critPct: number;
  reductionPct: number;
  power: number;
  unlocks: string[];
}

export function creationPreview(clan: ClanId, affinity: Element, alloc: Partial<Attributes>): CreationPreview {
  const c = previewCharacter(clan, affinity, alloc);
  const eff = effectiveAttrs(c);
  return {
    hp: characterMaxHp(c),
    chakra: characterMaxChakra(c),
    regen: chakraRegen(eff.int),
    critPct: critChance(eff.crit),
    reductionPct: defenseReduction(eff.def),
    power: ninjaPower(eff),
    unlocks: checkUnlocks(c, SAGA_ONDA.startStory, 0).learned,
  };
}

export interface JutsuGoal {
  jutsuId: string;
  missing: { attr: AttrKey; missing: number }[];
}

/** Jutsus que só dependem de atributo base para liberar, do mais perto ao mais longe. */
export function jutsuGoals(c: PlayerCharacter, story: StoryPointId, limit = 3): JutsuGoal[] {
  return JUTSU_LIST.filter(
    (j) =>
      !j.enemyOnly &&
      !c.learned.includes(j.id) &&
      (j.clan === null || j.clan === c.clan) &&
      storyIndex(j.minStory) <= storyIndex(story) &&
      (j.prereq === null || c.learned.includes(j.prereq)),
  )
    .map((j) => ({ jutsuId: j.id, missing: missingRequirements(c, j) }))
    .filter((g) => g.missing.length > 0)
    .sort((a, b) => sumMissing(a) - sumMissing(b))
    .slice(0, limit);
}

function sumMissing(g: JutsuGoal): number {
  return g.missing.reduce((s, m) => s + m.missing, 0);
}

export interface EffectChip {
  id: string;
  name: string;
  icon: string;
  remaining: number | null;
  sustained: boolean;
  description: string;
  type: EffectType;
}

export interface CombatantView {
  id: string;
  name: string;
  level: number;
  grade: Grade | null;
  isBoss: boolean;
  power: number;
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  critPct: number;
  dodgePct: number;
  reductionPct: number;
  effects: EffectChip[];
  transformed: boolean;
}

/** Painel de um lado da batalha (DD v2 §13): vitais, crítico/redução efetivos e efeitos. */
export function combatantView(c: Combatant, foe: Combatant): CombatantView {
  const mods = aggregateMods(c);
  return {
    id: c.id,
    name: c.name,
    level: c.level,
    grade: c.grade,
    isBoss: c.isBoss,
    power: ninjaPower(c.attrs),
    hp: c.hp,
    maxHp: c.maxHp,
    chakra: c.chakra,
    maxChakra: c.maxChakra,
    critPct: critChance(effectiveAttr(c, 'crit'), mods.crit),
    dodgePct: dodgeChance(effectiveAttr(c, 'vel'), effectiveAttr(foe, 'vel'), mods.dodge),
    reductionPct: totalReduction(effectiveAttr(c, 'def'), mods.reduction),
    effects: c.effects.map((e) => {
      const d = EFFECTS[e.effectId];
      return {
        id: e.effectId,
        name: d?.name ?? e.effectId,
        icon: d?.icon ?? '?',
        remaining: e.remaining,
        sustained: d?.duration === 'sustained',
        description: d?.description ?? '',
        type: d?.type ?? 'buff',
      };
    }),
    transformed: activeTransformation(c) !== undefined,
  };
}

export interface JutsuButton {
  id: string;
  name: string;
  cost: number;
  mastery: number;
  affordable: boolean;
  allowed: boolean;
  description: string;
  element: Element | null;
}

/** Fileira de jutsus equipados (DD v2 §13): custo já com descontos, maestria, apagado sem chakra. */
export function jutsuButtons(s: BattleState): JutsuButton[] {
  const p = getPlayer(s);
  return p.jutsus.flatMap((id) => {
    const j = JUTSUS[id];
    if (!j) return [];
    const cost = costFor(p, j);
    return [
      {
        id,
        name: j.name,
        cost,
        mastery: currentMasteryLevel(p, j),
        affordable: p.chakra >= cost,
        allowed: !s.onlyKai || j.cleanse === true,
        description: j.description,
        element: j.element,
      },
    ];
  });
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run tests/ui/derived.test.ts && npx tsc --noEmit`
Expected: todos PASS; `tsc` sem saída. Se o teste de metas falhar porque `sennen_goroshi` não é o primeiro, confira `requires` dos jutsus no `src/data/jutsus.ts` real: o primeiro deve ser o jutsu com menor soma de pontos faltando. Corrija o valor esperado, não a função.

- [ ] **Step 9: Commit**

```bash
git add src/game/progression/presets.ts src/ui-dom/view/derived.ts tests/ui/presets.test.ts tests/ui/derived.test.ts
git commit -m "feat: presets de distribuição e derivados de tela (Poder Ninja, prévias, HUD)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Log de batalha (GameEvent → linha de texto)

**Files:**
- Create: `src/ui-dom/view/log.ts`
- Modify: `src/i18n/pt-BR.ts` (chaves `log.*`)
- Test: `tests/ui/log.test.ts`

**Interfaces:**
- Consumes: `type GameEvent` (`src/game/events.ts`), `JUTSUS`, `EFFECTS`, `ITEMS`, `t()`.
- Produces: `type LogKind = 'player' | 'enemy' | 'damage' | 'heal' | 'effect' | 'system'`, `interface LogLine { kind: LogKind; text: string }`, `formatEvent(e: GameEvent, names: Record<string, string>): LogLine | null` (`null` = evento sem linha no log, ex.: `turnStart`, `chakraRegen`).

- [ ] **Step 1: Acrescentar as chaves ao objeto `PT_BR` em `src/i18n/pt-BR.ts`** (antes de `} as const;`)

```ts
  'log.battleStart': 'A batalha contra {enemy} começou.',
  'log.round': '— Rodada {n} —',
  'log.attack': '{who} ataca.',
  'log.jutsu': '{who} usa {jutsu} (−{cost} chakra).',
  'log.damage': '{target} sofre {amount} de dano.',
  'log.damageCrit': '✦ CRÍTICO! {target} sofre {amount} de dano.',
  'log.superEffective': ' (vantagem elemental)',
  'log.notEffective': ' (desvantagem elemental)',
  'log.dodge': '{target} ESQUIVOU.',
  'log.missHenge': 'O golpe de {who} errou o alvo disfarçado (Henge).',
  'log.negatedKawarimi': '{target} escapa com Kawarimi: golpe anulado.',
  'log.negatedClone': 'Um clone de {target} absorve o golpe.',
  'log.dot': '{target} sofre {amount} de dano por {effect}.',
  'log.heal': '{target} recupera {hp} de HP e {chakra} de chakra.',
  'log.defend': '{who} se defende (+{chakra} chakra).',
  'log.meditate': '{who} medita (+{chakra} chakra).',
  'log.item': '{who} usa {item}.',
  'log.effectOn': '{target}: {effect} ({turns} turnos).',
  'log.effectOnSustained': '{target}: {effect} (sustentado ∞).',
  'log.resisted': '{target} resiste a {effect}.',
  'log.resistedTenacity': '{target} está imune a controle (Tenacidade): {effect} falhou.',
  'log.effectOff': '{target}: {effect} terminou.',
  'log.skip': '{who} perde o turno ({effect}).',
  'log.transformOn': '{who} ativa {form}.',
  'log.transformOff': '{who} desativa {form}.',
  'log.transformOffNoChakra': '{who} fica sem chakra e perde {form}.',
  'log.mastery': 'Maestria de {jutsu} subiu para +{level}!',
  'log.defeated': '{target} foi derrotado.',
  'log.victory': 'Vitória!',
  'log.defeat': 'Derrota...',
  'log.timeout': 'Derrota: a luta passou do limite de rodadas.',
  'log.reward': '+{xp} XP, +{ryo} ryo, +{rep} de reputação.',
  'log.levelUp': '▲ Subiu para o nível {level}!',
  'log.learned': '★ Novo jutsu aprendido: {jutsu}.',
```

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/log.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { formatEvent } from '../../src/ui-dom/view/log';

const names = { player: 'Kenji', 'enemy:bandido': 'Bandido' };

describe('log de batalha', () => {
  it('dano crítico tem texto próprio (não depende só da cor)', () => {
    const l = formatEvent(
      { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 31, crit: true, elementMult: 1, jutsuId: null, hpAfter: 10 },
      names,
    );
    expect(l).toEqual({ kind: 'damage', text: '✦ CRÍTICO! Bandido sofre 31 de dano.' });
  });

  it('marca vantagem e desvantagem elemental', () => {
    const base = { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 10, crit: false, jutsuId: 'bola_de_fogo', hpAfter: 5 } as const;
    expect(formatEvent({ ...base, elementMult: 1.3 }, names)?.text).toContain('vantagem elemental');
    expect(formatEvent({ ...base, elementMult: 0.8 }, names)?.text).toContain('desvantagem elemental');
  });

  it('usa os nomes de conteúdo dos dados', () => {
    expect(formatEvent({ type: 'jutsuUsed', actorId: 'player', jutsuId: 'henge', cost: 6 }, names)).toEqual({
      kind: 'player',
      text: 'Kenji usa Henge no Jutsu (−6 chakra).',
    });
    expect(formatEvent({ type: 'effectApplied', targetId: 'enemy:bandido', effectId: 'queimadura', remaining: 3 }, names)?.text).toBe(
      'Bandido: Queimadura (3 turnos).',
    );
    expect(formatEvent({ type: 'itemUsed', actorId: 'player', itemId: 'kit_medico' }, names)?.text).toBe('Kenji usa Kit médico.');
  });

  it('lado de quem age define a cor', () => {
    expect(formatEvent({ type: 'actionChosen', actorId: 'enemy:bandido', action: { type: 'attack' } }, names)?.kind).toBe('enemy');
    expect(formatEvent({ type: 'defend', actorId: 'player', chakra: 4 }, names)?.kind).toBe('player');
  });

  it('efeito sustentado mostra ∞', () => {
    expect(formatEvent({ type: 'effectApplied', targetId: 'player', effectId: 'sharingan', remaining: null }, names)?.text).toBe(
      'Kenji: Sharingan (sustentado ∞).',
    );
  });

  it('derrota por tempo tem mensagem própria', () => {
    expect(formatEvent({ type: 'battleEnd', winner: 'enemy', reason: 'timeout' }, names)?.text).toContain('limite de rodadas');
    expect(formatEvent({ type: 'battleEnd', winner: 'player', reason: 'ko' }, names)?.text).toBe('Vitória!');
  });

  it('eventos de bastidor não geram linha', () => {
    expect(formatEvent({ type: 'turnStart', actorId: 'player', round: 1 }, names)).toBeNull();
    expect(formatEvent({ type: 'chakraRegen', actorId: 'player', amount: 2 }, names)).toBeNull();
    expect(formatEvent({ type: 'actionChosen', actorId: 'player', action: { type: 'defend' } }, names)).toBeNull();
  });

  it('id desconhecido aparece cru em vez de quebrar', () => {
    expect(formatEvent({ type: 'defeated', targetId: 'enemy:x' }, names)?.text).toBe('enemy:x foi derrotado.');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/log.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/ui-dom/view/log"`.

- [ ] **Step 4: Implementar `src/ui-dom/view/log.ts`**

```ts
import type { GameEvent } from '../../game/events';
import { EFFECTS } from '../../data/effects';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { t } from '../../i18n/pt-BR';

/**
 * Converte um evento do motor numa linha do log de batalha (DD v2 §13).
 * A cor vem do `kind`, mas o texto sozinho já diz o que aconteceu
 * (spec §10: nenhuma informação só por cor).
 */
export type LogKind = 'player' | 'enemy' | 'damage' | 'heal' | 'effect' | 'system';

export interface LogLine {
  kind: LogKind;
  text: string;
}

const jutsuName = (id: string) => JUTSUS[id]?.name ?? id;
const effectName = (id: string) => EFFECTS[id]?.name ?? id;
const itemName = (id: string) => ITEMS[id]?.name ?? id;

export function formatEvent(e: GameEvent, names: Record<string, string>): LogLine | null {
  const n = (id: string) => names[id] ?? id;
  const side = (id: string): LogKind => (id === 'player' ? 'player' : 'enemy');
  switch (e.type) {
    case 'battleStart':
      return { kind: 'system', text: t('log.battleStart', { enemy: n(e.enemyId) }) };
    case 'roundStart':
      return { kind: 'system', text: t('log.round', { n: e.round }) };
    case 'actionChosen':
      return e.action.type === 'attack' ? { kind: side(e.actorId), text: t('log.attack', { who: n(e.actorId) }) } : null;
    case 'jutsuUsed':
      return { kind: side(e.actorId), text: t('log.jutsu', { who: n(e.actorId), jutsu: jutsuName(e.jutsuId), cost: e.cost }) };
    case 'damage': {
      const base = t(e.crit ? 'log.damageCrit' : 'log.damage', { target: n(e.targetId), amount: e.amount });
      const elem = e.elementMult > 1 ? t('log.superEffective') : e.elementMult < 1 ? t('log.notEffective') : '';
      return { kind: 'damage', text: base + elem };
    }
    case 'dodge':
      return { kind: side(e.targetId), text: t('log.dodge', { target: n(e.targetId) }) };
    case 'miss':
      return { kind: side(e.targetId), text: t('log.missHenge', { who: n(e.sourceId) }) };
    case 'negated':
      return {
        kind: side(e.targetId),
        text: t(e.reason === 'kawarimi' ? 'log.negatedKawarimi' : 'log.negatedClone', { target: n(e.targetId) }),
      };
    case 'dot':
      return { kind: 'damage', text: t('log.dot', { target: n(e.targetId), amount: e.amount, effect: effectName(e.effectId) }) };
    case 'heal':
      return { kind: 'heal', text: t('log.heal', { target: n(e.targetId), hp: e.hp, chakra: e.chakra }) };
    case 'defend':
      return { kind: side(e.actorId), text: t('log.defend', { who: n(e.actorId), chakra: e.chakra }) };
    case 'meditate':
      return { kind: side(e.actorId), text: t('log.meditate', { who: n(e.actorId), chakra: e.chakra }) };
    case 'itemUsed':
      return { kind: side(e.actorId), text: t('log.item', { who: n(e.actorId), item: itemName(e.itemId) }) };
    case 'effectApplied':
      return {
        kind: 'effect',
        text:
          e.remaining === null
            ? t('log.effectOnSustained', { target: n(e.targetId), effect: effectName(e.effectId) })
            : t('log.effectOn', { target: n(e.targetId), effect: effectName(e.effectId), turns: e.remaining }),
      };
    case 'effectResisted':
      return {
        kind: 'effect',
        text: t(e.reason === 'tenacity' ? 'log.resistedTenacity' : 'log.resisted', {
          target: n(e.targetId),
          effect: effectName(e.effectId),
        }),
      };
    case 'effectExpired':
      return { kind: 'effect', text: t('log.effectOff', { target: n(e.targetId), effect: effectName(e.effectId) }) };
    case 'controlledSkip':
      return { kind: 'effect', text: t('log.skip', { who: n(e.actorId), effect: effectName(e.effectId) }) };
    case 'transformOn':
      return { kind: 'effect', text: t('log.transformOn', { who: n(e.actorId), form: effectName(e.transformationId) }) };
    case 'transformOff':
      if (e.reason === 'battleEnd') return null;
      return {
        kind: 'effect',
        text: t(e.reason === 'noChakra' ? 'log.transformOffNoChakra' : 'log.transformOff', {
          who: n(e.actorId),
          form: effectName(e.transformationId),
        }),
      };
    case 'masteryUp':
      return { kind: 'player', text: t('log.mastery', { jutsu: jutsuName(e.jutsuId), level: e.level }) };
    case 'defeated':
      return { kind: 'system', text: t('log.defeated', { target: n(e.targetId) }) };
    case 'battleEnd':
      if (e.winner === 'player') return { kind: 'system', text: t('log.victory') };
      return { kind: 'system', text: t(e.reason === 'timeout' ? 'log.timeout' : 'log.defeat') };
    case 'reward':
      return { kind: 'system', text: t('log.reward', { xp: e.xp, ryo: e.ryo, rep: e.rep }) };
    case 'levelUp':
      return { kind: 'system', text: t('log.levelUp', { level: e.level }) };
    case 'jutsuLearned':
      return { kind: 'system', text: t('log.learned', { jutsu: jutsuName(e.jutsuId) }) };
    default:
      return null;
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/ui/log.test.ts && npx tsc --noEmit`
Expected: 8 testes PASS; `tsc` sem saída. Se o `switch` acusar erro de tipo num `case`, compare o campo com a união `GameEvent` real de `src/game/events.ts` e ajuste o nome do campo aqui (o motor é a fonte da verdade).

- [ ] **Step 6: Commit**

```bash
git add src/ui-dom/view/log.ts src/i18n/pt-BR.ts tests/ui/log.test.ts
git commit -m "feat: formatação do log de batalha a partir dos eventos do motor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: GameStore — boot, navegação, run nova, comandos de preparação, persistência e fim de run

**Files:**
- Create: `src/store/GameStore.ts`, `tests/ui/memoryStore.ts`
- Modify: `src/i18n/pt-BR.ts` (chaves `notice.*`)
- Test: `tests/ui/store.test.ts`

**Interfaces:**
- Consumes (Plano 1): `runManager` (`newRun`, `restAtCamp`, `startEncounter`, `battleAction`, `chooseReward`, `continueFromResult`, `allocateRunPoints`, `buyInRun`, `equipItemInRun`, `useRareScrollInRun`, `equipJutsuInRun`, `setLoadoutInRun`), `RuleError`, `recordRunEnd`, `runEndText`, `emptyMeta`, `type MetaState`, `type RunResult`, `type RunStats`, `saveRun`, `loadRun`, `deleteRun`, `saveMeta`, `loadMeta`, `type KeyValueStore`, `RUN_KEY`, `META_KEY`, `assertGameData`; da Task 3: `formatEvent`, `type LogLine`.
- Produces:
  - `type ScreenId = 'menu' | 'create' | 'map' | 'battle' | 'result' | 'prep' | 'sheet' | 'encyclopedia' | 'history' | 'titles' | 'runEnd' | 'error'`
  - `interface Notice { id: number; kind: 'error' | 'info'; text: string }`
  - `interface RunEndInfo { result: RunResult; text: string; newTitles: string[]; stats: RunStats; level: number; name: string }`
  - `interface UiState { screen: ScreenId; history: ScreenId[]; run: RunState | null; meta: MetaState; notices: Notice[]; fatalError: string | null; locked: boolean; swapQueue: string[]; battleLog: LogLine[]; runEnd: RunEndInfo | null; battleSnapshot: BattleState | null }`
  - `interface StoreDeps { storage: KeyValueStore; now: () => number; newSeed: () => number; validateData?: () => void }`
  - `screenForRun(run: RunState): ScreenId`
  - `class GameStore` com: `state: Readonly<UiState>`, `subscribe(fn: (s: UiState) => void): () => void`, `onBattleEvents(fn: (events: GameEvent[]) => void): () => void`, `hasActiveRun(): boolean`, `boot(): void`, `go(screen: ScreenId): void`, `back(): void`, `toMenu(): void`, `continueRun(): void`, `startNewRun(p: CreateParams): void`, `abandonRun(): void`, `rest(): boolean`, `fight(elite?: boolean): boolean`, `act(action: Action): boolean`, `animationsDone(): void`, `chooseReward(option: RewardOptionId, jutsuId?: string): boolean`, `continueFromResult(): boolean`, `allocate(alloc: Partial<Attributes>): boolean`, `buy(itemId: string): boolean`, `equipItem(itemId: string): boolean`, `useRareScroll(attr: AttrKey): boolean`, `equipJutsu(jutsuId: string, replaceId?: string | null): boolean`, `setLoadout(ids: string[]): boolean`, `resolveSwap(replaceId: string | null): void`, `notify(kind: Notice['kind'], text: string): void`, `dismissNotice(id: number): void`. Os comandos devolvem `true` se o motor aceitou.
  - (tests) `class MemoryStore implements KeyValueStore { data: Map<string,string>; failWrites: boolean }`, `makeStore(storage?, extra?): GameStore`, `PARAMS: CreateParams`, `patchRun(storage, fn: (run: RunState) => void): void`
- Regras do store (decididas aqui):
  - Comando com `RuleError` → aviso (`notices`) e estado intocado. Outro erro → tela de erro com a mensagem.
  - Enquanto `locked` (animação), **todo comando de run é ignorado** e devolve `false`.
  - Save depois de **todo** comando aceito fora de batalha (superconjunto dos "momentos de save" da spec §11; o `saveRun` do Plano 1 já converte uma run em batalha para o início do encontro).
  - Fim da run (fase `dead` ou `victory`) → `recordRunEnd` + `saveMeta` + `deleteRun` **no mesmo comando**, antes de qualquer animação.
  - Jutsu aprendido que não coube nos slots → entra em `swapQueue` (a tela de troca da Task 9 consome a fila).
  - `battleSnapshot` = a batalha que o HUD desenha. No golpe final o motor já pôs `run.battle = null`; o store guarda o último quadro (HP dos eventos `damage`/`dot` aplicados), para o HUD não ficar vazio durante a animação final.

- [ ] **Step 1: Acrescentar as chaves ao `PT_BR`**

```ts
  'notice.runExists': 'Já existe uma run em andamento. Abandone-a no menu antes de começar outra.',
  'notice.noRun': 'Nenhuma run em andamento.',
```

- [ ] **Step 2: Criar o utilitário de teste `tests/ui/memoryStore.ts`**

```ts
import { GameStore, type StoreDeps } from '../../src/store/GameStore';
import type { CreateParams } from '../../src/game/progression/character';
import type { RunState } from '../../src/game/run/types';
import { RUN_KEY, type KeyValueStore } from '../../src/game/save/save';

/** localStorage de mentira. `failWrites` simula cota estourada / modo privado. */
export class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  failWrites = false;
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

export function makeStore(storage: MemoryStore = new MemoryStore(), extra: Partial<StoreDeps> = {}): GameStore {
  let clock = 1_700_000_000_000;
  let seed = 1;
  return new GameStore({ storage, now: () => clock++, newSeed: () => seed++, validateData: () => {}, ...extra });
}

/** Sem clã com Nin 15: aprende Henge, Bunshin, Bola de Fogo, Daitoppa e Doryuuheki (4 equipados + 1 no repertório). */
export const PARAMS: CreateParams = { name: 'Kenji', clan: 'semcla', affinity: 'vento', allocation: { nin: 10 }, titleId: null };

/** Altera a run SALVA (para montar cenários); depois é só dar boot num store novo. */
export function patchRun(storage: MemoryStore, fn: (run: RunState) => void): void {
  const raw = storage.getItem(RUN_KEY);
  if (!raw) throw new Error('não há run salva');
  const run = JSON.parse(raw) as RunState;
  fn(run);
  storage.data.set(RUN_KEY, JSON.stringify(run));
}
```

- [ ] **Step 3: Escrever o teste que falha — `tests/ui/store.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { META_KEY, RUN_KEY } from '../../src/game/save/save';
import { MemoryStore, PARAMS, makeStore } from './memoryStore';

describe('GameStore — boot', () => {
  it('sem save: menu, sem run, meta vazia', () => {
    const s = makeStore();
    s.boot();
    expect(s.state.screen).toBe('menu');
    expect(s.state.run).toBeNull();
    expect(s.state.meta.history).toEqual([]);
    expect(s.hasActiveRun()).toBe(false);
  });

  it('save de run corrompido: aviso, backup e jogo limpo', () => {
    const storage = new MemoryStore();
    storage.setItem(RUN_KEY, '{isto não é json');
    const s = makeStore(storage);
    s.boot();
    expect(s.state.screen).toBe('menu');
    expect(s.state.run).toBeNull();
    expect(s.state.notices[0]?.kind).toBe('error');
    expect([...storage.data.keys()].some((k) => k.startsWith('nxr.run.corrupt.'))).toBe(true);
  });

  it('dados do jogo inválidos: tela de erro com a mensagem', () => {
    const s = makeStore(new MemoryStore(), {
      validateData: () => {
        throw new Error('jutsu "x" sem nome');
      },
    });
    s.boot();
    expect(s.state.screen).toBe('error');
    expect(s.state.fatalError).toContain('jutsu "x" sem nome');
  });
});

describe('GameStore — run nova e navegação', () => {
  it('cria a run, vai ao mapa e salva', () => {
    const storage = new MemoryStore();
    const s = makeStore(storage);
    s.boot();
    s.go('create');
    s.startNewRun(PARAMS);
    expect(s.state.screen).toBe('map');
    expect(s.state.run?.character.name).toBe('Kenji');
    expect(storage.getItem(RUN_KEY)).not.toBeNull();
    expect(s.hasActiveRun()).toBe(true);
  });

  it('parâmetros inválidos viram aviso e não criam run', () => {
    const s = makeStore();
    s.boot();
    s.go('create');
    s.startNewRun({ ...PARAMS, allocation: { nin: 3 } });
    expect(s.state.run).toBeNull();
    expect(s.state.screen).toBe('create');
    expect(s.state.notices.at(-1)?.text).toContain('10 pontos');
  });

  it('não deixa começar outra run por cima da atual', () => {
    const s = makeStore();
    s.boot();
    s.startNewRun(PARAMS);
    const run = s.state.run;
    s.startNewRun({ ...PARAMS, name: 'Outro' });
    expect(s.state.run).toBe(run);
    expect(s.state.notices.at(-1)?.kind).toBe('error');
  });

  it('go/back empilham telas; back sem histórico volta à tela da run', () => {
    const s = makeStore();
    s.boot();
    s.startNewRun(PARAMS);
    s.go('sheet');
    s.go('encyclopedia');
    s.back();
    expect(s.state.screen).toBe('sheet');
    s.back();
    expect(s.state.screen).toBe('map');
    s.back();
    expect(s.state.screen).toBe('map');
  });

  it('continuar depois de recarregar a página volta ao mapa', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun(PARAMS);
    const b = makeStore(storage);
    b.boot();
    expect(b.state.screen).toBe('menu');
    b.continueRun();
    expect(b.state.screen).toBe('map');
    expect(b.state.run?.nodeIndex).toBe(0);
  });
});

describe('GameStore — comandos e erros', () => {
  it('RuleError vira aviso e não altera a run', () => {
    const s = makeStore();
    s.boot();
    s.startNewRun(PARAMS);
    const before = s.state.run;
    expect(s.buy('pergaminho_raro')).toBe(false); // 0 ryo
    expect(s.state.run).toBe(before);
    expect(s.state.notices.at(-1)?.kind).toBe('error');
  });

  it('avisos podem ser dispensados', () => {
    const s = makeStore();
    s.boot();
    s.notify('info', 'olá');
    const id = s.state.notices[0]!.id;
    s.dismissNotice(id);
    expect(s.state.notices).toEqual([]);
  });

  it('armazenamento cheio: avisa uma vez e o jogo segue em memória', () => {
    const storage = new MemoryStore();
    const s = makeStore(storage);
    s.boot();
    storage.failWrites = true;
    s.startNewRun(PARAMS);
    expect(s.state.screen).toBe('map');
    expect(s.state.run).not.toBeNull();
    s.allocate({});
    const saveNotices = s.state.notices.filter((n) => n.text.includes('Não foi possível salvar'));
    expect(saveNotices).toHaveLength(1);
  });

  it('abandonar registra no Histórico e apaga o save da run', () => {
    const storage = new MemoryStore();
    const s = makeStore(storage);
    s.boot();
    s.startNewRun(PARAMS);
    s.abandonRun();
    expect(s.state.run).toBeNull();
    expect(storage.getItem(RUN_KEY)).toBeNull();
    expect(s.state.meta.history[0]?.result).toBe('abandoned');
    expect(JSON.parse(storage.getItem(META_KEY)!).history).toHaveLength(1);
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run tests/ui/store.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/store/GameStore"`.

- [ ] **Step 5: Implementar `src/store/GameStore.ts`**

```ts
import { RuleError } from '../game/errors';
import type { GameEvent } from '../game/events';
import type { Action, BattleState } from '../game/combat/types';
import { emptyMeta, recordRunEnd, runEndText, type MetaState, type RunResult } from '../game/meta/meta';
import type { RunStats } from '../game/meta/stats';
import type { CreateParams } from '../game/progression/character';
import * as RM from '../game/run/runManager';
import type { RewardOptionId, RunState } from '../game/run/types';
import { deleteRun, loadMeta, loadRun, saveMeta, saveRun, type KeyValueStore } from '../game/save/save';
import type { AttrKey, Attributes } from '../game/types';
import { assertGameData } from '../data/validate';
import { t } from '../i18n/pt-BR';
import { formatEvent, type LogLine } from '../ui-dom/view/log';

/**
 * Fonte ÚNICA da verdade da aplicação (spec §2, "Fluxo de dados"):
 * UI → comando do store → motor → {run, eventos} → store guarda, salva e publica.
 * As telas nunca mexem no RunState; só chamam métodos daqui e leem `state`.
 */
export type ScreenId =
  | 'menu'
  | 'create'
  | 'map'
  | 'battle'
  | 'result'
  | 'prep'
  | 'sheet'
  | 'encyclopedia'
  | 'history'
  | 'titles'
  | 'runEnd'
  | 'error';

export interface Notice {
  id: number;
  kind: 'error' | 'info';
  text: string;
}

export interface RunEndInfo {
  result: RunResult;
  text: string;
  newTitles: string[];
  stats: RunStats;
  level: number;
  name: string;
}

export interface UiState {
  screen: ScreenId;
  /** Pilha de telas para o botão Voltar. */
  history: ScreenId[];
  /** Run em memória. Depois da morte/vitória continua aqui (para o HUD e o resumo) até ir ao menu. */
  run: RunState | null;
  meta: MetaState;
  notices: Notice[];
  fatalError: string | null;
  /** true enquanto a BattleScene anima: nenhuma ação é aceita (spec §10). */
  locked: boolean;
  /** Jutsus aprendidos com os slots cheios, esperando a decisão do jogador. */
  swapQueue: string[];
  battleLog: LogLine[];
  runEnd: RunEndInfo | null;
  /** O que o HUD de batalha desenha (ver lastFrame). */
  battleSnapshot: BattleState | null;
}

export interface StoreDeps {
  storage: KeyValueStore;
  now: () => number;
  newSeed: () => number;
  /** Validação dos dados no boot (padrão: assertGameData). Injetável para teste. */
  validateData?: () => void;
}

interface Step {
  run: RunState;
  events?: GameEvent[];
  learned?: string[];
}

export function screenForRun(run: RunState): ScreenId {
  switch (run.phase) {
    case 'battle':
      return 'battle';
    case 'result':
      return 'result';
    case 'dead':
    case 'victory':
      return 'runEnd';
    default:
      return 'map';
  }
}

const ENDED: RunState['phase'][] = ['dead', 'victory'];

/**
 * No golpe final o motor encerra o encontro e descarta a batalha (run.battle = null).
 * Para o HUD continuar mostrando a luta durante a última animação, guardamos o quadro
 * anterior com o HP atualizado pelos eventos de dano.
 */
function lastFrame(prev: BattleState | null, events: GameEvent[]): BattleState | null {
  if (!prev) return null;
  const s = structuredClone(prev);
  for (const e of events) {
    if (e.type === 'damage' || e.type === 'dot') {
      const c = s.combatants.find((x) => x.id === e.targetId);
      if (c) c.hp = e.hpAfter;
    }
  }
  s.status = 'ended';
  return s;
}

export class GameStore {
  private s: UiState = {
    screen: 'menu',
    history: [],
    run: null,
    meta: emptyMeta(),
    notices: [],
    fatalError: null,
    locked: false,
    swapQueue: [],
    battleLog: [],
    runEnd: null,
    battleSnapshot: null,
  };
  private listeners = new Set<(s: UiState) => void>();
  private animators = new Set<(events: GameEvent[]) => void>();
  private nextNoticeId = 1;
  /** Navegação adiada até o fim da animação (sair da batalha). */
  private deferredNav = false;

  constructor(private readonly deps: StoreDeps) {}

  get state(): Readonly<UiState> {
    return this.s;
  }

  subscribe(fn: (s: UiState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** A BattleScene se registra aqui. Sem animador (testes), nada trava. */
  onBattleEvents(fn: (events: GameEvent[]) => void): () => void {
    this.animators.add(fn);
    return () => this.animators.delete(fn);
  }

  hasActiveRun(): boolean {
    return this.s.run !== null && !ENDED.includes(this.s.run.phase);
  }

  // ------------------------------------------------------------ ciclo de vida

  boot(): void {
    try {
      (this.deps.validateData ?? (() => assertGameData()))();
    } catch (e) {
      this.set({ screen: 'error', fatalError: (e as Error).message });
      return;
    }
    const now = this.deps.now();
    const notices: Notice[] = [];
    const safe = <T>(f: () => { value: T | null; error: string | null }): T | null => {
      try {
        const r = f();
        if (r.error) notices.push(this.mkNotice('error', r.error));
        return r.value;
      } catch (e) {
        notices.push(this.mkNotice('error', t('notice.unexpected', { msg: (e as Error).message })));
        return null;
      }
    };
    const meta = safe(() => loadMeta(this.deps.storage, now)) ?? emptyMeta();
    let run = safe(() => loadRun(this.deps.storage, now));
    if (run && ENDED.includes(run.phase)) run = null;
    this.set({ screen: 'menu', history: [], meta, run, notices });
  }

  // ------------------------------------------------------------ navegação

  go(screen: ScreenId): void {
    if (screen === this.s.screen) return;
    this.set({ history: [...this.s.history, this.s.screen], screen });
  }

  back(): void {
    const history = [...this.s.history];
    const prev = history.pop();
    const fallback: ScreenId = this.hasActiveRun() && this.s.run ? screenForRun(this.s.run) : 'menu';
    this.set({ history, screen: prev ?? fallback });
  }

  toMenu(): void {
    this.set({
      screen: 'menu',
      history: [],
      run: this.hasActiveRun() ? this.s.run : null,
      runEnd: null,
      battleLog: [],
      battleSnapshot: null,
    });
  }

  continueRun(): void {
    if (!this.hasActiveRun() || !this.s.run) return this.notify('error', t('notice.noRun'));
    this.set({ screen: screenForRun(this.s.run), history: [] });
  }

  startNewRun(p: CreateParams): void {
    if (this.hasActiveRun()) return this.notify('error', t('notice.runExists'));
    let run: RunState;
    try {
      run = RM.newRun(p, this.deps.newSeed(), this.deps.now());
    } catch (e) {
      return this.handleError(e);
    }
    this.persist(run);
    this.set({ run, screen: screenForRun(run), history: [], battleLog: [], swapQueue: [], runEnd: null, battleSnapshot: null });
  }

  abandonRun(): void {
    const run = this.s.run;
    if (!run || !this.hasActiveRun()) return;
    const { meta } = this.recordEnd(run, 'abandoned');
    this.set({ run: null, meta, runEnd: null, swapQueue: [], battleLog: [], battleSnapshot: null });
  }

  // ------------------------------------------------------------ comandos da run

  rest(): boolean {
    return this.step((r) => ({ run: RM.restAtCamp(r) }));
  }

  fight(elite = false): boolean {
    return this.step((r) => RM.startEncounter(r, elite), { resetLog: true });
  }

  act(action: Action): boolean {
    return this.step((r) => RM.battleAction(r, action));
  }

  chooseReward(option: RewardOptionId, jutsuId?: string): boolean {
    return this.step((r) => ({ run: RM.chooseReward(r, option, jutsuId) }));
  }

  continueFromResult(): boolean {
    return this.step((r) => ({ run: RM.continueFromResult(r) }));
  }

  allocate(alloc: Partial<Attributes>): boolean {
    return this.step((r) => RM.allocateRunPoints(r, alloc));
  }

  buy(itemId: string): boolean {
    return this.step((r) => ({ run: RM.buyInRun(r, itemId) }));
  }

  equipItem(itemId: string): boolean {
    return this.step((r) => ({ run: RM.equipItemInRun(r, itemId) }));
  }

  useRareScroll(attr: AttrKey): boolean {
    return this.step((r) => RM.useRareScrollInRun(r, attr));
  }

  equipJutsu(jutsuId: string, replaceId: string | null = null): boolean {
    return this.step((r) => ({ run: RM.equipJutsuInRun(r, jutsuId, replaceId) }));
  }

  setLoadout(ids: string[]): boolean {
    return this.step((r) => ({ run: RM.setLoadoutInRun(r, ids) }));
  }

  /** Decide o primeiro jutsu da fila de troca: substituir `replaceId` ou (null) deixar no repertório. */
  resolveSwap(replaceId: string | null): void {
    const jutsuId = this.s.swapQueue[0];
    if (!jutsuId) return;
    if (replaceId && !this.step((r) => ({ run: RM.equipJutsuInRun(r, jutsuId, replaceId) }))) return;
    this.set({ swapQueue: this.s.swapQueue.slice(1) });
  }

  /** Chamado pela BattleScene quando a fila de animações esvazia. */
  animationsDone(): void {
    if (!this.s.locked) return;
    const nav = this.deferredNav;
    this.deferredNav = false;
    this.set({ locked: false });
    if (nav && this.s.run) this.set({ screen: screenForRun(this.s.run), history: [] });
  }

  // ------------------------------------------------------------ avisos

  notify(kind: Notice['kind'], text: string): void {
    this.set({ notices: [...this.s.notices, this.mkNotice(kind, text)] });
  }

  dismissNotice(id: number): void {
    this.set({ notices: this.s.notices.filter((n) => n.id !== id) });
  }

  // ------------------------------------------------------------ internos

  private set(patch: Partial<UiState>): void {
    this.s = { ...this.s, ...patch };
    for (const fn of this.listeners) fn(this.s);
  }

  private mkNotice(kind: Notice['kind'], text: string): Notice {
    return { id: this.nextNoticeId++, kind, text };
  }

  private handleError(e: unknown): void {
    if (e instanceof RuleError) return this.notify('error', e.message);
    this.set({ screen: 'error', fatalError: t('notice.unexpected', { msg: (e as Error).message ?? String(e) }) });
  }

  private persist(run: RunState): void {
    try {
      saveRun(this.deps.storage, run);
    } catch {
      this.warnSaveFailed();
    }
  }

  private warnSaveFailed(): void {
    const text = t('notice.saveFailed');
    if (!this.s.notices.some((n) => n.text === text)) this.notify('error', text);
  }

  /** Fecha a run na meta e apaga o save — no MESMO comando que a encerrou (Review Focus 3). */
  private recordEnd(run: RunState, result: RunResult): { meta: MetaState; info: RunEndInfo } {
    const { meta, newTitles } = recordRunEnd(this.s.meta, run, result, this.deps.now());
    try {
      saveMeta(this.deps.storage, meta);
      deleteRun(this.deps.storage);
    } catch {
      this.warnSaveFailed();
    }
    return {
      meta,
      info: {
        result,
        text: runEndText(run, result),
        newTitles,
        stats: run.stats,
        level: run.character.level,
        name: run.character.name,
      },
    };
  }

  /**
   * Executa um comando da run: chama o motor, salva (ou fecha a run), formata
   * o log, enfileira trocas de jutsu e decide a navegação.
   */
  private step(fn: (run: RunState) => Step, opts: { resetLog?: boolean } = {}): boolean {
    const before = this.s.run;
    if (!before || this.s.locked || !this.hasActiveRun()) return false;
    let out: Step;
    try {
      out = fn(before);
    } catch (e) {
      this.handleError(e);
      return false;
    }
    const run = out.run;
    const events = out.events ?? [];

    let meta = this.s.meta;
    let runEnd = this.s.runEnd;
    if (run.phase === 'dead' || run.phase === 'victory') {
      const rec = this.recordEnd(run, run.phase === 'dead' ? 'dead' : 'victory');
      meta = rec.meta;
      runEnd = rec.info;
    } else {
      this.persist(run);
    }

    const enteredResult = before.phase !== 'result' && run.phase === 'result';
    const learned = [...(out.learned ?? []), ...(enteredResult ? (run.lastResult?.learned ?? []) : [])];
    const swaps = learned.filter((id) => !run.character.equipped.includes(id) && !this.s.swapQueue.includes(id));

    const battle = run.battle ?? before.battle;
    const names: Record<string, string> = battle ? Object.fromEntries(battle.combatants.map((c) => [c.id, c.name])) : {};
    const lines = events.map((e) => formatEvent(e, names)).filter((l): l is LogLine => l !== null);
    const animate = events.length > 0 && this.animators.size > 0;

    this.set({
      run,
      meta,
      runEnd,
      swapQueue: [...this.s.swapQueue, ...swaps],
      battleLog: [...(opts.resetLog ? [] : this.s.battleLog), ...lines],
      battleSnapshot: run.battle ?? (events.length ? lastFrame(before.battle, events) : this.s.battleSnapshot),
      locked: animate,
    });

    if (animate) {
      // A batalha precisa estar na tela para ser animada; sair dela espera a animação.
      if (this.s.screen !== 'battle') this.set({ screen: 'battle', history: [] });
      this.deferredNav = run.phase !== 'battle';
      for (const fnA of this.animators) fnA(events);
    } else if (run.phase !== before.phase) {
      this.set({ screen: screenForRun(run), history: [] });
    }
    return true;
  }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run tests/ui/store.test.ts && npx tsc --noEmit`
Expected: 12 testes PASS; `tsc` sem saída.

- [ ] **Step 7: Commit**

```bash
git add src/store/GameStore.ts src/i18n/pt-BR.ts tests/ui/memoryStore.ts tests/ui/store.test.ts
git commit -m "feat: GameStore com boot, navegação, persistência e fim de run

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: GameStore — batalha, trava de animação, troca de jutsu e várias subidas de nível

**Files:**
- Test: `tests/ui/store-battle.test.ts`
- Modify: `src/store/GameStore.ts` somente se algum teste abaixo falhar (o código da Task 4 já cobre estes casos; esta task **prova** o comportamento de batalha, que é onde os bugs de interface costumam morar).

**Interfaces:**
- Consumes: `GameStore` (Task 4), `MemoryStore`, `makeStore`, `PARAMS`, `patchRun` (Task 4), `botAction(s: BattleState): Action` (Plano 1, `src/game/sim/bot.ts`), `characterMaxHp`, `characterMaxChakra`, `emptyAttributes`, `RUN_KEY`, `META_KEY`.
- Produces: nada novo; fixa o contrato `fight`/`act`/`animationsDone`/`resolveSwap` que as Tasks 9 e 11 usam.

- [ ] **Step 1: Acrescentar cenários reutilizáveis ao fim de `tests/ui/memoryStore.ts`**

Acrescente estes imports no topo do arquivo:

```ts
import { emptyAttributes } from '../../src/game/attributes';
import { characterMaxChakra, characterMaxHp } from '../../src/game/progression/character';
import { botAction } from '../../src/game/sim/bot';
```

E estas funções no fim (as Tasks 8, 9, 11 e 12 também as usam):

```ts
export function strong(run: RunState): void {
  run.character.baseAttrs = emptyAttributes(40);
  run.character.hp = characterMaxHp(run.character);
  run.character.chakra = characterMaxChakra(run.character);
}

/** Cria a run, aplica o patch no save e devolve um store "recarregado" já no mapa. */
export function scenario(patch?: (run: RunState) => void): { store: GameStore; storage: MemoryStore } {
  const storage = new MemoryStore();
  const a = makeStore(storage);
  a.boot();
  a.startNewRun(PARAMS);
  if (patch) patchRun(storage, patch);
  const store = makeStore(storage);
  store.boot();
  store.continueRun();
  return { store, storage };
}

/** Joga a batalha com o robô do simulador, liberando a trava se houver animador. */
export function playBattle(store: GameStore): void {
  let guard = 0;
  while (store.state.run?.phase === 'battle' && guard++ < 500) {
    if (store.state.locked) store.animationsDone();
    store.act(botAction(store.state.run.battle!));
  }
}
```

- [ ] **Step 2: Escrever os testes — `tests/ui/store-battle.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { META_KEY, RUN_KEY } from '../../src/game/save/save';
import type { GameEvent } from '../../src/game/events';
import { makeStore, playBattle, scenario, strong } from './memoryStore';

describe('GameStore — batalha', () => {
  it('lutar abre a batalha e começa o log do zero', () => {
    const { store } = scenario();
    store.fight();
    expect(store.state.screen).toBe('battle');
    expect(store.state.battleLog[0]?.text).toContain('começou');
    expect(store.state.locked).toBe(false); // sem animador registrado
  });

  it('com animador: trava até animationsDone e ignora ações repetidas (Review Focus 2)', () => {
    const { store } = scenario();
    const received: GameEvent[][] = [];
    store.onBattleEvents((ev) => received.push(ev));
    store.fight();
    expect(received[0]?.[0]?.type).toBe('battleStart');
    expect(store.state.locked).toBe(true);
    const run = store.state.run;
    expect(store.act({ type: 'attack' })).toBe(false);
    expect(store.act({ type: 'attack' })).toBe(false);
    expect(store.state.run).toBe(run);
    store.animationsDone();
    expect(store.state.locked).toBe(false);
    if (store.state.run?.phase === 'battle') {
      expect(store.act({ type: 'defend' })).toBe(true);
      expect(store.state.locked).toBe(true);
    }
  });

  it('vitória leva ao resultado e salva a run na fase "result"', () => {
    const { store, storage } = scenario(strong);
    store.fight();
    playBattle(store);
    expect(store.state.screen).toBe('result');
    expect(store.state.run?.lastResult?.won).toBe(true);
    expect(JSON.parse(storage.getItem(RUN_KEY)!).phase).toBe('result');
  });

  it('recarregar no meio da luta volta ao mapa com o RNG do início do encontro', () => {
    const { store, storage } = scenario();
    store.fight();
    store.act({ type: 'defend' });
    expect(store.state.run?.phase).toBe('battle');
    const startRng = store.state.run!.encounterStart!.rngState;
    const reloaded = makeStore(storage);
    reloaded.boot();
    reloaded.continueRun();
    expect(reloaded.state.screen).toBe('map');
    expect(reloaded.state.run?.nodeIndex).toBe(0);
    expect(reloaded.state.run?.rngState).toBe(startRng);
  });

  it('morte: Histórico e save atualizados ANTES do fim da animação (Review Focus 3)', () => {
    const { store, storage } = scenario((run) => {
      run.character.hp = 1;
    });
    store.onBattleEvents(() => {});
    store.fight();
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) {
      if (store.state.locked) store.animationsDone();
      store.act({ type: 'defend' });
    }
    expect(store.state.run?.phase).toBe('dead');
    // a animação ainda não terminou:
    expect(store.state.locked).toBe(true);
    expect(store.state.screen).toBe('battle');
    expect(storage.getItem(RUN_KEY)).toBeNull();
    expect(JSON.parse(storage.getItem(META_KEY)!).history[0].result).toBe('dead');
    // o HUD ainda tem o que desenhar durante a última animação:
    expect(store.state.battleLog.some((l) => l.text.includes('foi derrotado'))).toBe(true);
    const snap = store.state.battleSnapshot;
    if (snap) expect(snap.combatants.find((c) => c.side === 'player')?.hp).toBe(0);
    store.animationsDone();
    expect(store.state.screen).toBe('runEnd');
    expect(store.state.runEnd?.result).toBe('dead');
    expect(store.state.runEnd?.text).toContain('Morreu');
    store.toMenu();
    expect(store.state.run).toBeNull();
    expect(store.hasActiveRun()).toBe(false);
  });
});

describe('GameStore — troca de jutsu e escolhas 1-de-3', () => {
  it('jutsu aprendido com slots cheios entra na fila; substituir equipa', () => {
    const { store } = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    expect(store.state.run?.character.equipped).toHaveLength(4);
    store.allocate({ gen: 3 }); // Gen 8 → Kai
    expect(store.state.swapQueue).toEqual(['kai']);
    store.resolveSwap('henge');
    expect(store.state.swapQueue).toEqual([]);
    expect(store.state.run?.character.equipped).toContain('kai');
    expect(store.state.run?.character.equipped).not.toContain('henge');
  });

  it('"manter no repertório" não equipa nada', () => {
    const { store } = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    store.allocate({ gen: 3 });
    store.resolveSwap(null);
    expect(store.state.swapQueue).toEqual([]);
    expect(store.state.run?.character.equipped).not.toContain('kai');
    expect(store.state.run?.character.learned).toContain('kai');
  });

  it('vários níveis + jutsus novos num só encontro: fila de troca e 3 escolhas em ordem (Review Focus 4)', () => {
    const { store } = scenario((run) => {
      strong(run);
      run.character.xp = 200; // +12 de XP do 1º comum → 212: sobe 3 níveis (36 + 48 + 60 = 144; o 4º pede 72)
    });
    store.fight();
    playBattle(store);
    expect(store.state.screen).toBe('result');
    expect(store.state.run?.lastResult?.levelsGained).toBe(3);
    expect(store.state.run?.pendingChoices).toHaveLength(3);
    expect(store.state.swapQueue.length).toBeGreaterThan(0);
    const swaps = [...store.state.swapQueue];

    expect(store.continueFromResult()).toBe(false); // escolhas pendentes
    for (let i = 3; i > 0; i--) {
      const run = store.state.run!;
      const option = run.pendingChoices[0]![0]!;
      expect(store.chooseReward(option, option === 'treino' ? run.character.equipped[0] : undefined)).toBe(true);
      expect(store.state.run?.pendingChoices).toHaveLength(i - 1);
    }
    expect(store.state.swapQueue).toEqual(swaps);
    expect(store.continueFromResult()).toBe(true);
    expect(store.state.screen).toBe('map');
  });
});
```

- [ ] **Step 3: Rodar**

Run: `npx vitest run tests/ui/store-battle.test.ts`
Expected: 8 testes PASS. Se algum falhar, corrija **o `GameStore`** (não o teste), usando o comentário de cada teste como especificação. Casos conhecidos:
- "lutar abre a batalha" falha com tela `map`: o `step` não está navegando quando a fase muda de `map` para `battle` sem animador — confira o `else if (run.phase !== before.phase)`.
- "morte" falha com `RUN_KEY` presente: `recordEnd` não está sendo chamado dentro do `step`, ou está sendo chamado em `animationsDone`.
- "vários níveis" falha com `levelsGained` ≠ 3: confira `xpToNext` do Plano 1 (`24 + 12·N`) e ajuste o `xp` inicial do cenário para que 200 + XP do 1º comum dê exatamente 3 níveis.

- [ ] **Step 4: Rodar a suíte inteira e o typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/ui/store-battle.test.ts tests/ui/memoryStore.ts src/store/GameStore.ts
git commit -m "test: fluxo de batalha do GameStore (trava, morte, troca de jutsu, níveis)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: Kit de DOM, App (camadas, rotas, avisos, modal, teclado), Menu, tela de erro e `main.ts`

**Files:**
- Create: `src/ui-dom/dom.ts`, `src/ui-dom/types.ts`, `src/ui-dom/App.ts`, `src/ui-dom/screens/index.ts`, `src/ui-dom/screens/MenuScreen.ts`, `src/ui-dom/screens/ErrorScreen.ts`, `tests/ui/appHelpers.ts`
- Modify: `src/main.ts` (substitui o provisório), `src/i18n/pt-BR.ts` (chaves `menu.*`)
- Test: `tests/ui/dom.test.ts`, `tests/ui/menu.test.ts`

**Interfaces:**
- Consumes: `GameStore`, `ScreenId` (Task 4), `t` (Task 1), `MemoryStore`, `makeStore`, `PARAMS` (Task 4), `type KeyValueStore` (Plano 1).
- Produces:
  - (dom.ts) `type Child = Node | string | number | null | undefined | false`, `interface Props { class?: string; id?: string; title?: string; type?: string; value?: string; disabled?: boolean; checked?: boolean; attrs?: Record<string, string>; on?: { [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void } }`, `h(tag, props?, ...children): HTMLElement` (tipado por tag), `append(el: Node, children: Child[]): void`, `clear(el: Element): void`, `button(label: string, onClick: () => void, opts?: { primary?: boolean; disabled?: boolean; title?: string; class?: string; attrs?: Record<string, string> }): HTMLButtonElement`, `bar(kind: 'hp' | 'chakra' | 'xp', value: number, max: number, label: string): HTMLElement`
  - (types.ts) `interface ModalAction { label: string; onClick: () => void; primary?: boolean }`, `interface ModalHost { open(title: string, body: Node | string, actions: ModalAction[]): void; close(): void }`, `interface ScreenCtx { store: GameStore; local<T>(key: string, init: () => T): T; rerender(): void; modal: ModalHost }`, `type ScreenRenderer = (ctx: ScreenCtx) => HTMLElement`, `type KeyHandler = (ctx: ScreenCtx, e: KeyboardEvent) => void`, `interface BattleView { show(): void; hide(): void }`
  - (App.ts) `interface AppOptions { screens: Partial<Record<ScreenId, ScreenRenderer>>; keys?: Partial<Record<ScreenId, KeyHandler>>; overlay?: ((ctx: ScreenCtx) => HTMLElement | null) | null }`, `class App { constructor(root: HTMLElement, store: GameStore, opts: AppOptions); mount(): void; render(): void; get gameLayer(): HTMLElement; setBattleView(v: BattleView): void }`
  - (screens/index.ts) `SCREENS: Partial<Record<ScreenId, ScreenRenderer>>`, `KEYS: Partial<Record<ScreenId, KeyHandler>>`, `OVERLAY: ((ctx: ScreenCtx) => HTMLElement | null) | null` — **cada task de tela seguinte registra sua tela aqui.**
  - (tests) `mount(store: GameStore): HTMLElement`, `click(root: ParentNode, text: string): void`, `findButton(root: ParentNode, text: string): HTMLButtonElement`, `press(key: string): void`
- Decisão: a tela inteira é recriada a cada mudança do store (simples e previsível). Estado só da tela (rascunho de distribuição, aba aberta) vive em `ctx.local(chave, init)`, que dura enquanto a tela não muda. Campos de texto **não** chamam `rerender` ao digitar (senão perderiam o foco).

- [ ] **Step 1: Acrescentar as chaves ao `PT_BR`**

```ts
  'menu.subtitle': 'Saga da Onda — roguelite de ninjas por turnos',
  'menu.continue': 'Continuar run',
  'menu.continueInfo': '{name} — encontro {n} de {total}',
  'menu.story': 'Modo História',
  'menu.infinite': 'Modo Infinito (em breve)',
  'menu.soon': 'Em breve',
  'menu.encyclopedia': 'Enciclopédia de Jutsus',
  'menu.history': 'Histórico de Runs',
  'menu.titles': 'Títulos',
  'menu.abandonTitle': 'Abandonar a run atual?',
  'menu.abandonBody': 'A run de {name} será encerrada e registrada no Histórico como abandonada.',
  'menu.abandonConfirm': 'Abandonar e criar novo ninja',
  'notice.storageUnavailable': 'O armazenamento do navegador está indisponível: o progresso não será salvo nesta sessão.',
```

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/dom.test.ts`**

```ts
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
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/dom.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/ui-dom/App"`.

- [ ] **Step 4: Implementar `src/ui-dom/dom.ts`**

```ts
/**
 * Mini-biblioteca de DOM. POR QUÊ não um framework: o jogo tem poucas telas,
 * todas recriadas a cada mudança do store; um helper de 60 linhas basta.
 * REGRA DE SEGURANÇA: texto entra sempre como nó de texto (nunca innerHTML),
 * então um nome como "<img onerror=...>" aparece literal e não executa nada.
 */
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
  opts: { primary?: boolean; disabled?: boolean; title?: string; class?: string; attrs?: Record<string, string> } = {},
): HTMLButtonElement {
  const cls = [opts.primary ? 'primary' : '', opts.class ?? ''].join(' ').trim();
  return h(
    'button',
    { type: 'button', class: cls, disabled: opts.disabled, title: opts.title, attrs: opts.attrs, on: { click: () => onClick() } },
    label,
  );
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
```

- [ ] **Step 5: Implementar `src/ui-dom/types.ts`**

```ts
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
```

- [ ] **Step 6: Implementar `src/ui-dom/App.ts`**

```ts
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
    this.gameEl.classList.toggle('visible', inBattle);
    this.uiEl.classList.toggle('battle', inBattle);
    if (inBattle) this.battleView?.show();
    else this.battleView?.hide();

    const renderer = this.opts.screens[s.screen];
    clear(this.uiEl);
    this.uiEl.appendChild(renderer ? renderer(this.ctx) : h('div', { class: 'panel' }, t('screen.wip')));

    clear(this.toastEl);
    for (const n of s.notices) {
      this.toastEl.appendChild(
        h(
          'div',
          { class: `toast ${n.kind}`, attrs: { role: n.kind === 'error' ? 'alert' : 'status' } },
          h('span', {}, n.text),
          button('×', () => this.store.dismissNotice(n.id), { title: t('common.close') }),
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
            button(a.label, () => {
              clear(this.modalEl);
              a.onClick();
            }, { primary: a.primary }),
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
```

- [ ] **Step 7: Implementar `src/ui-dom/screens/ErrorScreen.ts`**

```ts
import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Dados inválidos no boot ou erro inesperado (spec §12 "Robustez"). */
export const ErrorScreen: ScreenRenderer = (ctx) =>
  h(
    'div',
    { class: 'screen panel' },
    h('h1', {}, t('error.title')),
    h('pre', { class: 'muted' }, ctx.store.state.fatalError ?? ''),
    button(t('error.reload'), () => window.location.reload(), { primary: true }),
  );
```

- [ ] **Step 8: Implementar `src/ui-dom/screens/MenuScreen.ts`**

```ts
import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Menu principal (spec §10; DD v2 §13). */
export const MenuScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const active = store.hasActiveRun();
  const run = store.state.run;

  const story = () => {
    if (!active || !run) return store.go('create');
    ctx.modal.open(t('menu.abandonTitle'), t('menu.abandonBody', { name: run.character.name }), [
      { label: t('common.cancel'), onClick: () => {} },
      {
        label: t('menu.abandonConfirm'),
        primary: true,
        onClick: () => {
          store.abandonRun();
          store.go('create');
        },
      },
    ]);
  };

  return h(
    'div',
    { class: 'screen menu panel' },
    h('h1', {}, t('app.title')),
    h('p', { class: 'muted' }, t('menu.subtitle')),
    button(t('menu.continue'), () => store.continueRun(), { primary: active, disabled: !active }),
    active && run
      ? h('p', { class: 'muted' }, t('menu.continueInfo', { name: run.character.name, n: run.nodeIndex + 1, total: run.nodes.length }))
      : null,
    button(t('menu.story'), story, { primary: !active }),
    button(t('menu.infinite'), () => {}, { disabled: true, title: t('menu.soon') }),
    button(t('menu.encyclopedia'), () => store.go('encyclopedia')),
    button(t('menu.history'), () => store.go('history')),
    button(t('menu.titles'), () => store.go('titles')),
  );
};
```

- [ ] **Step 9: Implementar `src/ui-dom/screens/index.ts`**

```ts
import type { ScreenId } from '../../store/GameStore';
import type { KeyHandler, ScreenCtx, ScreenRenderer } from '../types';
import { ErrorScreen } from './ErrorScreen';
import { MenuScreen } from './MenuScreen';

/** Registro de telas. Cada task de tela acrescenta a sua aqui. */
export const SCREENS: Partial<Record<ScreenId, ScreenRenderer>> = {
  menu: MenuScreen,
  error: ErrorScreen,
};

export const KEYS: Partial<Record<ScreenId, KeyHandler>> = {};

export const OVERLAY: ((ctx: ScreenCtx) => HTMLElement | null) | null = null;
```

- [ ] **Step 10: Criar `tests/ui/appHelpers.ts`**

```ts
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
  const b = [...root.querySelectorAll('button')].find((x) => x.textContent?.includes(text));
  if (!b) throw new Error(`botão "${text}" não encontrado`);
  return b;
}

export function click(root: ParentNode, text: string): void {
  findButton(root, text).click();
}

export function press(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
}
```

- [ ] **Step 11: Escrever o teste do menu — `tests/ui/menu.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { click, findButton, mount } from './appHelpers';
import { MemoryStore, PARAMS, makeStore } from './memoryStore';

describe('Menu principal', () => {
  it('sem run: Continuar desabilitado e Modo Infinito "em breve"', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    expect(findButton(root, 'Continuar run').disabled).toBe(true);
    expect(findButton(root, 'Modo Infinito').disabled).toBe(true);
    click(root, 'Enciclopédia');
    expect(store.state.screen).toBe('encyclopedia');
  });

  it('Modo História sem run vai direto à criação', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    click(root, 'Modo História');
    expect(store.state.screen).toBe('create');
  });

  it('com run: mostra o nome como texto literal (Review Focus 5) e pede confirmação para abandonar', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun({ ...PARAMS, name: '<b>Kenji</b>' });
    const store = makeStore(storage);
    const root = mount(store);
    store.boot();
    expect(root.textContent).toContain('<b>Kenji</b> — encontro 1 de 26');
    expect(root.querySelector('b')).toBeNull();

    click(root, 'Modo História');
    expect(root.textContent).toContain('Abandonar a run atual?');
    click(root, 'Cancelar');
    expect(store.hasActiveRun()).toBe(true);

    click(root, 'Modo História');
    click(root, 'Abandonar e criar novo ninja');
    expect(store.hasActiveRun()).toBe(false);
    expect(store.state.screen).toBe('create');
    expect(store.state.meta.history[0]?.result).toBe('abandoned');
  });

  it('Continuar leva à tela da run', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun(PARAMS);
    const store = makeStore(storage);
    const root = mount(store);
    store.boot();
    click(root, 'Continuar run');
    expect(store.state.screen).toBe('map');
  });
});
```

- [ ] **Step 12: Rodar e ver passar**

Run: `npx vitest run tests/ui/dom.test.ts tests/ui/menu.test.ts && npx tsc --noEmit`
Expected: todos PASS; `tsc` sem saída.

- [ ] **Step 13: Substituir `src/main.ts`**

```ts
import './styles.css';
import type { KeyValueStore } from './game/save/save';
import { t } from './i18n/pt-BR';
import { GameStore } from './store/GameStore';
import { App } from './ui-dom/App';
import { KEYS, OVERLAY, SCREENS } from './ui-dom/screens';

/**
 * Único lugar que toca no navegador "de verdade": localStorage, relógio e
 * sorteio da semente. Tudo isso é injetado no GameStore (o motor continua puro).
 */
function pickStorage(): { storage: KeyValueStore; ok: boolean } {
  try {
    const ls = window.localStorage;
    ls.getItem('nxr.probe');
    return { storage: ls, ok: true };
  } catch {
    const mem = new Map<string, string>();
    return {
      ok: false,
      storage: {
        getItem: (k) => mem.get(k) ?? null,
        setItem: (k, v) => void mem.set(k, v),
        removeItem: (k) => void mem.delete(k),
      },
    };
  }
}

function newSeed(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]!;
}

const root = document.getElementById('app');
if (!root) throw new Error('#app não encontrado');
const { storage, ok } = pickStorage();
const store = new GameStore({ storage, now: () => Date.now(), newSeed });
const app = new App(root, store, { screens: SCREENS, keys: KEYS, overlay: OVERLAY });
app.mount();
store.boot();
if (!ok) store.notify('error', t('notice.storageUnavailable'));
```

- [ ] **Step 14: Conferir no navegador**

Run: `npm run dev`. Expected: menu com "Continuar run" desabilitado; "Modo História" leva a "Tela em construção."; "Modo Infinito (em breve)" desabilitado. Ctrl+C.

- [ ] **Step 15: Commit**

```bash
git add src/ui-dom src/main.ts src/i18n/pt-BR.ts tests/ui/dom.test.ts tests/ui/menu.test.ts tests/ui/appHelpers.ts
git commit -m "feat: App com camadas, avisos, modal e teclado; menu principal e tela de erro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Tela de criação (clã, afinidade, título, pontos com presets e prévia)

**Files:**
- Create: `src/ui-dom/components/allocation.ts`, `src/ui-dom/screens/CreateScreen.ts`
- Modify: `src/ui-dom/screens/index.ts`, `src/i18n/pt-BR.ts`
- Test: `tests/ui/create.test.ts`

**Interfaces:**
- Consumes: `presetAllocation`, `PRESET_IDS`, `type PresetId` (Task 2); `creationPreview` (Task 2); `availableTitles(meta)` (Plano 1 `meta/meta.ts`); `CLANS`, `PLAYABLE_CLANS`, `JUTSUS`, `ATTR_NAMES`, `ATTR_KEYS`, `emptyAttributes`, `sumAttributes`, `BALANCE`; `h`, `button`, `ScreenRenderer` (Task 6); `GameStore.startNewRun`, `notify`, `back`.
- Produces:
  - (allocation.ts) `interface AllocationOpts { base: Attributes; points: number; draft: Attributes; onChange: () => void }`, `allocationPanel(o: AllocationOpts): HTMLElement` — muta `draft` e chama `onChange`. Botões com `data-attr="<chave>"` e `data-op="inc|dec"`; presets com `data-preset="<id>"`.
  - `AFFINITY_OPTIONS: readonly Element[]` (sem Raio: só na F2), `CreateScreen: ScreenRenderer`.

- [ ] **Step 1: Acrescentar as chaves ao `PT_BR`**

```ts
  'create.heading': 'Novo ninja',
  'create.name': 'Nome',
  'create.namePlaceholder': 'Até 20 caracteres',
  'create.clan': 'Clã',
  'create.affinity': 'Afinidade elemental',
  'create.affinityFixed': '(fixa pelo clã)',
  'create.titleLabel': 'Título (buff passivo da run)',
  'create.points': 'Atributos',
  'create.preview': 'Prévia',
  'create.unlocks': 'Jutsus que esta build libera',
  'create.noUnlocks': 'Nenhum ainda — invista em Ninjutsu, Taijutsu, Genjutsu, Velocidade ou Inteligência.',
  'create.start': 'Começar a Saga da Onda',
  'create.needName': 'Dê um nome ao seu ninja.',
  'create.needPoints': 'Distribua os {n} pontos restantes.',
  'derived.hp': 'HP máximo',
  'derived.chakra': 'Chakra máximo',
  'derived.regen': 'Chakra por turno',
  'derived.crit': 'Chance de crítico',
  'derived.reduction': 'Redução de dano',
  'derived.dodge': 'Esquiva',
  'derived.power': 'Poder Ninja',
  'alloc.remaining': 'Pontos restantes: {n}',
  'alloc.preset': 'Distribuir pelo preset:',
  'alloc.reset': 'Limpar',
  'alloc.confirm': 'Confirmar distribuição',
  'preset.ninjutsu': 'Ninjutsu',
  'preset.taijutsu': 'Taijutsu',
  'preset.equilibrado': 'Equilibrado',
```

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/create.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { click, findButton, mount } from './appHelpers';
import { makeStore } from './memoryStore';

function open() {
  const store = makeStore();
  const root = mount(store);
  store.boot();
  store.go('create');
  return { store, root };
}

const q = (root: ParentNode, sel: string) => root.querySelector(sel) as HTMLElement;

describe('Criação de personagem', () => {
  it('Uchiha trava a afinidade em Fogo', () => {
    const { root } = open();
    click(root, 'Uchiha');
    const sel = q(root, 'select[name=affinity]') as HTMLSelectElement;
    expect(sel.disabled).toBe(true);
    expect(sel.value).toBe('fogo');
  });

  it('+ e − mexem nos pontos restantes', () => {
    const { root } = open();
    expect(root.textContent).toContain('Pontos restantes: 10');
    (q(root, '[data-attr=nin][data-op=inc]') as HTMLButtonElement).click();
    (q(root, '[data-attr=nin][data-op=inc]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Pontos restantes: 8');
    (q(root, '[data-attr=nin][data-op=dec]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Pontos restantes: 9');
    expect((q(root, '[data-attr=tai][data-op=dec]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('preset Ninjutsu usa os 10 pontos e a prévia lista os jutsus liberados', () => {
    const { root } = open();
    click(root, 'Sem clã');
    (q(root, '[data-preset=ninjutsu]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Pontos restantes: 0');
    expect(root.textContent).toContain('Henge no Jutsu');
    expect((q(root, '[data-attr=nin][data-op=inc]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('não começa sem nome nem com pontos sobrando', () => {
    const { root, store } = open();
    expect(findButton(root, 'Começar a Saga da Onda').disabled).toBe(true);
    (q(root, '[data-preset=ninjutsu]') as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.run).toBeNull();
    expect(store.state.notices.at(-1)?.text).toBe('Dê um nome ao seu ninja.');
  });

  it('com nome e pontos, cria a run e vai ao mapa', () => {
    const { root, store } = open();
    const input = q(root, 'input[name=name]') as HTMLInputElement;
    input.value = 'Kenji';
    input.dispatchEvent(new Event('input'));
    click(root, 'Sem clã');
    (q(root, '[data-preset=taijutsu]') as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.screen).toBe('map');
    expect(store.state.run?.character.name).toBe('Kenji');
    expect(store.state.run?.character.clan).toBe('semcla');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/create.test.ts`
Expected: FAIL — os testes acham "Tela em construção." no lugar da tela (por exemplo, `botão "Uchiha" não encontrado`).

- [ ] **Step 4: Implementar `src/ui-dom/components/allocation.ts`**

```ts
import { ATTR_NAMES, sumAttributes } from '../../game/attributes';
import { PRESET_IDS, presetAllocation } from '../../game/progression/presets';
import { ATTR_KEYS, type Attributes } from '../../game/types';
import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';

export interface AllocationOpts {
  /** Atributos base atuais (antes do rascunho). */
  base: Attributes;
  /** Pontos disponíveis para distribuir. */
  points: number;
  /** Rascunho: quanto somar em cada atributo. É MUTADO por este painel. */
  draft: Attributes;
  onChange: () => void;
}

/** Distribuição com prévia "5 → 8" e botão "Distribuir pelo preset" (spec C9). */
export function allocationPanel(o: AllocationOpts): HTMLElement {
  const remaining = o.points - sumAttributes(o.draft);
  const rows = ATTR_KEYS.map((k) =>
    h(
      'tr',
      {},
      h('td', {}, ATTR_NAMES[k]),
      h('td', {}, o.draft[k] > 0 ? `${o.base[k]} → ${o.base[k] + o.draft[k]}` : String(o.base[k])),
      h(
        'td',
        {},
        button('−', () => {
          o.draft[k]--;
          o.onChange();
        }, { disabled: o.draft[k] <= 0, attrs: { 'data-attr': k, 'data-op': 'dec', 'aria-label': `− ${ATTR_NAMES[k]}` } }),
        button('+', () => {
          o.draft[k]++;
          o.onChange();
        }, { disabled: remaining <= 0, attrs: { 'data-attr': k, 'data-op': 'inc', 'aria-label': `+ ${ATTR_NAMES[k]}` } }),
      ),
    ),
  );
  const presets = PRESET_IDS.map((id) =>
    button(t(`preset.${id}`), () => {
      const add = presetAllocation(o.base, o.points, id);
      for (const k of ATTR_KEYS) o.draft[k] = add[k];
      o.onChange();
    }, { attrs: { 'data-preset': id } }),
  );
  return h(
    'div',
    { class: 'allocation' },
    h('p', {}, h('strong', {}, t('alloc.remaining', { n: remaining }))),
    h('table', {}, ...rows),
    h('div', { class: 'row' }, h('span', { class: 'muted' }, t('alloc.preset')), ...presets, button(t('alloc.reset'), () => {
      for (const k of ATTR_KEYS) o.draft[k] = 0;
      o.onChange();
    })),
  );
}
```

> Nota: `t(\`preset.${id}\`)` compila porque `PresetId` é uma união de literais e as três chaves `preset.*` existem no `PT_BR`. Se o TypeScript reclamar, troque por um mapa `const PRESET_LABEL: Record<PresetId, I18nKey> = { ninjutsu: 'preset.ninjutsu', taijutsu: 'preset.taijutsu', equilibrado: 'preset.equilibrado' }`.

- [ ] **Step 5: Implementar `src/ui-dom/screens/CreateScreen.ts`**

```ts
import { emptyAttributes, sumAttributes } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import { availableTitles } from '../../game/meta/meta';
import type { Attributes, ClanId, Element } from '../../game/types';
import { CLANS, PLAYABLE_CLANS } from '../../data/clans';
import { JUTSUS } from '../../data/jutsus';
import { pct, t } from '../../i18n/pt-BR';
import { allocationPanel } from '../components/allocation';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';
import { creationPreview } from '../view/derived';

/** Raio só existe a partir da Fase 2 (spec §1 "Fica de fora"). */
export const AFFINITY_OPTIONS: readonly Element[] = ['fogo', 'vento', 'terra', 'agua'];

interface Draft {
  name: string;
  clan: ClanId;
  affinity: Element;
  titleId: string | null;
  alloc: Attributes;
}

/** Criação (spec §10): prévia das fórmulas derivadas e "jutsus que esta build libera". */
export const CreateScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const d = ctx.local<Draft>('draft', () => ({
    name: '',
    clan: PLAYABLE_CLANS[0] ?? 'uzumaki',
    affinity: 'vento',
    titleId: null,
    alloc: emptyAttributes(0),
  }));
  const clan = CLANS[d.clan];
  const affinity = clan.fixedAffinity ?? d.affinity;
  const points = BALANCE.attributes.creationPoints;
  const remaining = points - sumAttributes(d.alloc);
  const preview = creationPreview(d.clan, affinity, d.alloc);

  const nameInput = h('input', {
    type: 'text',
    value: d.name,
    attrs: { name: 'name', maxlength: '20', placeholder: t('create.namePlaceholder'), 'aria-label': t('create.name') },
    on: { input: (e) => (d.name = (e.target as HTMLInputElement).value) },
  });

  const clanCards = PLAYABLE_CLANS.map((id) =>
    h(
      'div',
      { class: `card ${id === d.clan ? 'selected' : ''}` },
      button(CLANS[id].name, () => {
        d.clan = id;
        ctx.rerender();
      }, { primary: id === d.clan }),
      h('p', { class: 'muted' }, CLANS[id].description),
    ),
  );

  const affinitySelect = h(
    'select',
    {
      disabled: clan.fixedAffinity !== null,
      attrs: { name: 'affinity', 'aria-label': t('create.affinity') },
      on: { change: (e) => { d.affinity = (e.target as HTMLSelectElement).value as Element; ctx.rerender(); } },
    },
    ...(clan.fixedAffinity ? [clan.fixedAffinity] : AFFINITY_OPTIONS).map((el) =>
      h('option', { value: el, attrs: el === affinity ? { selected: 'selected' } : {} }, t(`element.${el}`)),
    ),
  );
  affinitySelect.value = affinity;

  const titles = availableTitles(store.state.meta);
  const titleSelect = h(
    'select',
    {
      attrs: { name: 'title', 'aria-label': t('create.titleLabel') },
      on: { change: (e) => { const v = (e.target as HTMLSelectElement).value; d.titleId = v || null; } },
    },
    h('option', { value: '' }, t('common.none')),
    ...titles.map((ti) => h('option', { value: ti.id }, `${ti.name} — ${ti.description}`)),
  );
  titleSelect.value = d.titleId ?? '';

  const start = () => {
    if (!d.name.trim()) return store.notify('error', t('create.needName'));
    if (remaining !== 0) return store.notify('error', t('create.needPoints', { n: remaining }));
    store.startNewRun({ name: d.name, clan: d.clan, affinity, allocation: { ...d.alloc }, titleId: d.titleId });
  };

  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('create.heading')),
    h(
      'div',
      { class: 'grid-2' },
      h(
        'div',
        { class: 'panel screen' },
        h('label', {}, t('create.name'), ' ', nameInput),
        h('h3', {}, t('create.clan')),
        h('div', { class: 'grid-2' }, ...clanCards),
        h('label', {}, t('create.affinity'), ' ', affinitySelect, clan.fixedAffinity ? ` ${t('create.affinityFixed')}` : ''),
        h('label', {}, t('create.titleLabel'), ' ', titleSelect),
      ),
      h(
        'div',
        { class: 'panel screen' },
        h('h3', {}, t('create.points')),
        allocationPanel({ base: emptyAttributes(BALANCE.attributes.start), points, draft: d.alloc, onChange: () => ctx.rerender() }),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', {}, t('create.preview')),
      h(
        'table',
        {},
        row(t('derived.hp'), String(preview.hp)),
        row(t('derived.chakra'), String(preview.chakra)),
        row(t('derived.regen'), String(preview.regen)),
        row(t('derived.crit'), pct(preview.critPct)),
        row(t('derived.reduction'), pct(preview.reductionPct)),
        row(t('derived.power'), String(preview.power)),
      ),
      h('h3', {}, t('create.unlocks')),
      preview.unlocks.length
        ? h('ul', {}, ...preview.unlocks.map((id) => h('li', {}, JUTSUS[id]?.name ?? id)))
        : h('p', { class: 'muted' }, t('create.noUnlocks')),
    ),
    h(
      'div',
      { class: 'row' },
      button(t('common.back'), () => store.back()),
      button(t('create.start'), start, { primary: true, disabled: remaining !== 0 }),
    ),
  );
};

function row(label: string, value: string): HTMLElement {
  return h('tr', {}, h('td', {}, label), h('td', {}, value));
}
```

> Nota sobre o teste "não começa sem nome": o botão fica desabilitado enquanto sobram pontos; com 0 pontos e nome vazio ele habilita e o clique mostra o aviso. Por isso o teste aplica o preset antes de clicar.

- [ ] **Step 6: Registrar a tela em `src/ui-dom/screens/index.ts`**

Acrescentar o import e a entrada:

```ts
import { CreateScreen } from './CreateScreen';
```

```ts
export const SCREENS: Partial<Record<ScreenId, ScreenRenderer>> = {
  menu: MenuScreen,
  error: ErrorScreen,
  create: CreateScreen,
};
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run tests/ui/create.test.ts && npx tsc --noEmit`
Expected: 5 testes PASS; `tsc` sem saída.

- [ ] **Step 8: Commit**

```bash
git add src/ui-dom/components/allocation.ts src/ui-dom/screens/CreateScreen.ts src/ui-dom/screens/index.ts src/i18n/pt-BR.ts tests/ui/create.test.ts
git commit -m "feat: tela de criação com presets, prévia derivada e jutsus liberados

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Mapa da saga, tela de Resultado (pontos, metas, escolha 1-de-3) e Fim de run

**Files:**
- Create: `src/ui-dom/components/runHeader.ts`, `src/ui-dom/screens/MapScreen.ts`, `src/ui-dom/screens/ResultScreen.ts`, `src/ui-dom/screens/RunEndScreen.ts`
- Modify: `src/ui-dom/screens/index.ts`, `src/i18n/pt-BR.ts`
- Test: `tests/ui/map-result.test.ts`

**Interfaces:**
- Consumes: `characterMaxHp`, `characterMaxChakra`, `xpToNext` (Plano 1); `ENEMIES`, `CLANS`, `TITLES`, `JUTSUS`, `ATTR_NAMES`, `BALANCE`, `emptyAttributes`, `sumAttributes`; `mostUsedJutsu(stats)` (Plano 1 `meta/stats.ts`); `type RewardOptionId` (Plano 1); `jutsuGoals` (Task 2); `allocationPanel` (Task 7); `GameStore.rest/fight/chooseReward/continueFromResult/allocate/go/toMenu` (Task 4); `scenario`, `strong`, `playBattle`, `patchRun` (Tasks 4–5).
- Produces: `runHeader(run: RunState): HTMLElement`, `MapScreen`, `ResultScreen`, `RunEndScreen` (todos `ScreenRenderer`).

- [ ] **Step 1: Acrescentar as chaves ao `PT_BR`**

```ts
  'header.rep': 'Reputação {n}',
  'header.points': '{n} ponto(s) livre(s)',
  'header.hp': 'HP',
  'header.chakra': 'Chakra',
  'header.xp': 'XP',
  'map.heading': 'Saga da Onda',
  'map.next': 'Encontro {n} de {total}',
  'map.boss': 'CHEFE',
  'map.camp': 'Acampamento',
  'map.campInfo': 'Antes do chefe: descanse para recuperar 100% de HP e chakra. É também um ponto de save.',
  'map.rest': 'Descansar',
  'map.fight': 'Lutar',
  'map.fightElite': 'Enfrentar elite: {name}',
  'map.eliteInfo': 'Elite (grau D+): mais forte, rende mais ryo, reputação e XP ×1,6.',
  'map.prep': 'Preparação (loja, jutsus, equipamento)',
  'map.sheet': 'Ficha do Ninja',
  'map.menu': 'Salvar e voltar ao menu',
  'map.nodeDone': 'vencido',
  'map.nodeCurrent': 'atual',
  'result.victory': 'Vitória contra {enemy}!',
  'result.rewards': '+{xp} XP · +{ryo} ryo · +{rep} de reputação',
  'result.levels': '▲ Subiu {n} nível(is): agora nível {level}.',
  'result.learned': '★ Jutsu(s) aprendido(s): {list}',
  'result.pointsTitle': 'Distribuir pontos',
  'result.pointsLeft': 'Pontos não distribuídos ficam guardados para depois.',
  'result.goals': 'Próximos jutsus',
  'result.goal': 'Faltam {missing} para {jutsu}',
  'result.goalPart': '{n} de {attr}',
  'result.choiceTitle': 'Escolha uma recompensa ({n} pendente(s))',
  'result.trainPick': 'Treinar qual jutsu?',
  'reward.kit.name': 'Kit médico',
  'reward.kit.desc': 'Ganha 1 Kit médico (+40% de HP em batalha).',
  'reward.pilula.name': 'Pílula de chakra',
  'reward.pilula.desc': 'Ganha 1 Pílula de chakra (+50% de chakra em batalha).',
  'reward.reforco.name': 'Pergaminho de Reforço',
  'reward.reforco.desc': 'Ganha 1 Pergaminho de Reforço (+10% num atributo por 5 turnos).',
  'reward.ryo.name': 'Bolsa de ryo',
  'reward.ryo.desc': '+{n} ryo.',
  'reward.treino.name': 'Treino',
  'reward.treino.desc': '+{n} usos de maestria num jutsu equipado.',
  'runEnd.victory': 'Saga da Onda concluída!',
  'runEnd.dead': 'Fim da linha',
  'runEnd.abandoned': 'Run abandonada',
  'runEnd.stats': 'Estatísticas da run',
  'runEnd.encounters': 'Encontros vencidos',
  'runEnd.damageDealt': 'Dano causado',
  'runEnd.damageTaken': 'Dano sofrido',
  'runEnd.biggestHit': 'Maior golpe',
  'runEnd.crits': 'Críticos',
  'runEnd.turns': 'Turnos',
  'runEnd.mostUsed': 'Jutsu mais usado',
  'runEnd.newTitles': 'Títulos conquistados',
  'runEnd.menu': 'Voltar ao menu',
```

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/map-result.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { characterMaxHp } from '../../src/game/progression/character';
import { click, findButton, mount } from './appHelpers';
import { playBattle, scenario, strong } from './memoryStore';

describe('Mapa da saga', () => {
  it('mostra o próximo encontro e luta', () => {
    const { store } = scenario();
    const root = mount(store);
    store.continueRun();
    expect(root.textContent).toContain('Encontro 1 de 26');
    click(root, 'Lutar');
    expect(store.state.screen).toBe('battle');
  });

  it('bifurcação de elite só aparece quando o nó tem elite', () => {
    const plain = scenario((run) => {
      run.nodes[0]!.eliteEnemyId = null;
    });
    const root1 = mount(plain.store);
    plain.store.continueRun();
    expect(root1.textContent).not.toContain('Enfrentar elite');

    const fork = scenario((run) => {
      run.nodes[0]!.eliteEnemyId = 'renegado_veterano';
    });
    const root2 = mount(fork.store);
    fork.store.continueRun();
    click(root2, 'Enfrentar elite');
    expect(fork.store.state.run?.elite).toBe(true);
  });

  it('Acampamento: só deixa descansar, e o descanso enche HP', () => {
    const { store } = scenario((run) => {
      run.phase = 'camp';
      run.character.hp = 10;
    });
    const root = mount(store);
    store.continueRun();
    expect(() => findButton(root, 'Lutar')).toThrow();
    click(root, 'Descansar');
    const c = store.state.run!.character;
    expect(c.hp).toBe(characterMaxHp(c));
    expect(store.state.run?.phase).toBe('map');
  });

  it('Salvar e voltar ao menu mantém a run', () => {
    const { store } = scenario();
    const root = mount(store);
    store.continueRun();
    click(root, 'Salvar e voltar ao menu');
    expect(store.state.screen).toBe('menu');
    expect(store.hasActiveRun()).toBe(true);
  });
});

describe('Resultado', () => {
  function afterBigWin() {
    const s = scenario((run) => {
      strong(run);
      run.character.xp = 200;
    });
    const root = mount(s.store);
    s.store.fight();
    playBattle(s.store);
    s.store.state.swapQueue.forEach(() => s.store.resolveSwap(null));
    return { ...s, root };
  }

  it('mostra recompensas, níveis e a escolha 1-de-3', () => {
    const { root, store } = afterBigWin();
    expect(store.state.screen).toBe('result');
    expect(root.textContent).toContain('Vitória contra');
    expect(root.textContent).toContain('Subiu 3 nível(is)');
    expect(root.textContent).toContain('Escolha uma recompensa (3 pendente(s))');
    expect(findButton(root, 'Continuar').disabled).toBe(true);
  });

  it('resolver as 3 escolhas libera o Continuar', () => {
    const { root, store } = afterBigWin();
    for (let i = 0; i < 3; i++) {
      const option = store.state.run!.pendingChoices[0]![0]!;
      const card = root.querySelector(`[data-reward=${option}]`) as HTMLButtonElement;
      card.click();
      if (option === 'treino') (root.querySelector('[data-train]') as HTMLButtonElement).click();
    }
    expect(store.state.run?.pendingChoices).toHaveLength(0);
    click(root, 'Continuar');
    expect(store.state.screen).toBe('map');
  });

  it('distribui os pontos ganhos pelo preset', () => {
    const { root, store } = afterBigWin();
    const before = store.state.run!.character.unspentPoints;
    expect(before).toBeGreaterThan(0);
    (root.querySelector('[data-preset=ninjutsu]') as HTMLButtonElement).click();
    click(root, 'Confirmar distribuição');
    expect(store.state.run?.character.unspentPoints).toBe(0);
  });
});

describe('Fim de run', () => {
  it('morte mostra o texto do Histórico e volta ao menu', () => {
    const { store } = scenario((run) => {
      run.character.hp = 1;
    });
    const root = mount(store);
    store.fight();
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 500) store.act({ type: 'defend' });
    expect(store.state.screen).toBe('runEnd');
    expect(root.textContent).toContain('Morreu na Saga da Onda');
    click(root, 'Voltar ao menu');
    expect(store.state.screen).toBe('menu');
    expect(findButton(root, 'Continuar run').disabled).toBe(true);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/map-result.test.ts`
Expected: FAIL — `botão "Lutar" não encontrado` (a tela ainda é "em construção").

- [ ] **Step 4: Implementar `src/ui-dom/components/runHeader.ts`**

```ts
import { characterMaxChakra, characterMaxHp } from '../../game/progression/character';
import { xpToNext } from '../../game/formulas';
import type { RunState } from '../../game/run/types';
import { CLANS } from '../../data/clans';
import { TITLES } from '../../data/titles';
import { num, t } from '../../i18n/pt-BR';
import { bar, h } from '../dom';

/** Faixa de status da run, repetida no Mapa, Resultado e Preparação. */
export function runHeader(run: RunState): HTMLElement {
  const c = run.character;
  const title = c.titleId ? TITLES[c.titleId] : undefined;
  return h(
    'div',
    { class: 'panel row run-header' },
    h('strong', {}, c.name),
    title ? h('span', { class: 'badge' }, title.name) : null,
    h('span', {}, t('common.level', { n: c.level })),
    h('span', { class: 'badge' }, CLANS[c.clan].name),
    h('span', { class: 'badge' }, t(`element.${c.affinity}`)),
    bar('hp', c.hp, characterMaxHp(c), t('header.hp')),
    bar('chakra', c.chakra, characterMaxChakra(c), t('header.chakra')),
    bar('xp', c.xp, xpToNext(c.level), t('header.xp')),
    h('span', {}, t('common.ryo', { n: num(c.ryo) })),
    h('span', {}, t('header.rep', { n: num(c.reputation) })),
    c.unspentPoints > 0 ? h('span', { class: 'badge' }, t('header.points', { n: c.unspentPoints })) : null,
  );
}
```

- [ ] **Step 5: Implementar `src/ui-dom/screens/MapScreen.ts`**

```ts
import { ENEMIES } from '../../data/enemies';
import { t } from '../../i18n/pt-BR';
import { runHeader } from '../components/runHeader';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Mapa da saga (spec §7 e §10): 26 nós, Acampamento antes dos chefes, bifurcação de elite. */
export const MapScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  if (!run) return h('div', { class: 'panel' }, t('notice.noRun'));
  const node = run.nodes[run.nodeIndex];

  const nodes = run.nodes.map((n) => {
    const enemy = ENEMIES[n.enemyId];
    const state = n.index < run.nodeIndex ? 'done' : n.index === run.nodeIndex ? 'current' : '';
    const label = `${n.campBefore ? '⛺ ' : ''}${n.kind === 'boss' ? `${t('map.boss')}` : String(n.index + 1)}`;
    const status = state === 'done' ? ` (${t('map.nodeDone')})` : state === 'current' ? ` (${t('map.nodeCurrent')})` : '';
    return h('div', { class: `node ${state} ${n.kind === 'boss' ? 'boss' : ''}`, title: `${enemy?.name ?? n.enemyId}${status}` }, label);
  });

  let current: HTMLElement;
  if (!node) {
    current = h('div', { class: 'panel' });
  } else if (run.phase === 'camp') {
    current = h(
      'div',
      { class: 'panel' },
      h('h2', {}, `⛺ ${t('map.camp')}`),
      h('p', {}, t('map.campInfo')),
      button(t('map.rest'), () => store.rest(), { primary: true }),
    );
  } else {
    const enemy = ENEMIES[node.enemyId];
    const elite = node.eliteEnemyId ? ENEMIES[node.eliteEnemyId] : undefined;
    current = h(
      'div',
      { class: 'panel' },
      h('h2', {}, t('map.next', { n: node.index + 1, total: run.nodes.length })),
      h(
        'p',
        { class: 'row' },
        node.kind === 'boss' ? h('span', { class: 'badge' }, t('map.boss')) : null,
        h('strong', {}, enemy?.name ?? node.enemyId),
        enemy ? h('span', { class: 'badge' }, `${enemy.grade}`) : null,
      ),
      h(
        'div',
        { class: 'row' },
        button(t('map.fight'), () => store.fight(false), { primary: true }),
        elite ? button(t('map.fightElite', { name: elite.name }), () => store.fight(true)) : null,
      ),
      elite ? h('p', { class: 'muted' }, t('map.eliteInfo')) : null,
    );
  }

  return h(
    'div',
    { class: 'screen' },
    runHeader(run),
    h('h1', {}, t('map.heading')),
    h('div', { class: 'node-list' }, ...nodes),
    current,
    h(
      'div',
      { class: 'row' },
      button(t('map.prep'), () => store.go('prep')),
      button(t('map.sheet'), () => store.go('sheet')),
      button(t('map.menu'), () => store.toMenu()),
    ),
  );
};
```

- [ ] **Step 6: Implementar `src/ui-dom/screens/ResultScreen.ts`**

```ts
import { ATTR_NAMES, emptyAttributes, sumAttributes } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import type { RewardOptionId } from '../../game/run/types';
import { JUTSUS } from '../../data/jutsus';
import { t, type I18nKey } from '../../i18n/pt-BR';
import { allocationPanel } from '../components/allocation';
import { runHeader } from '../components/runHeader';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';
import { jutsuGoals } from '../view/derived';

const REWARD_TEXT: Record<RewardOptionId, { name: I18nKey; desc: I18nKey }> = {
  kit: { name: 'reward.kit.name', desc: 'reward.kit.desc' },
  pilula: { name: 'reward.pilula.name', desc: 'reward.pilula.desc' },
  reforco: { name: 'reward.reforco.name', desc: 'reward.reforco.desc' },
  ryo: { name: 'reward.ryo.name', desc: 'reward.ryo.desc' },
  treino: { name: 'reward.treino.name', desc: 'reward.treino.desc' },
};

/** Resultado do encontro (spec §10): recompensas, pontos com "faltam X para jutsu" e 1-de-3. */
export const ResultScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  const r = run?.lastResult;
  if (!run || !r) return h('div', { class: 'panel' }, t('notice.noRun'));
  const c = run.character;
  const ui = ctx.local('ui', () => ({ draft: emptyAttributes(0), training: false }));

  const summary = h(
    'div',
    { class: 'panel' },
    h('h1', {}, t('result.victory', { enemy: r.enemyName })),
    h('p', {}, t('result.rewards', { xp: r.xp, ryo: r.ryo, rep: r.rep })),
    r.levelsGained > 0 ? h('p', {}, t('result.levels', { n: r.levelsGained, level: c.level })) : null,
    r.learned.length ? h('p', {}, t('result.learned', { list: r.learned.map((id) => JUTSUS[id]?.name ?? id).join(', ') })) : null,
  );

  const points =
    c.unspentPoints > 0
      ? h(
          'div',
          { class: 'panel' },
          h('h2', {}, t('result.pointsTitle')),
          allocationPanel({ base: c.baseAttrs, points: c.unspentPoints, draft: ui.draft, onChange: () => ctx.rerender() }),
          button(t('alloc.confirm'), () => {
            if (store.allocate({ ...ui.draft })) ui.draft = emptyAttributes(0);
            ctx.rerender();
          }, { primary: true, disabled: sumAttributes(ui.draft) === 0 }),
          h('p', { class: 'muted' }, t('result.pointsLeft')),
        )
      : null;

  const goals = jutsuGoals(c, run.story);
  const goalsPanel = goals.length
    ? h(
        'div',
        { class: 'panel' },
        h('h3', {}, t('result.goals')),
        h(
          'ul',
          {},
          ...goals.map((g) =>
            h(
              'li',
              {},
              t('result.goal', {
                jutsu: JUTSUS[g.jutsuId]?.name ?? g.jutsuId,
                missing: g.missing.map((m) => t('result.goalPart', { n: m.missing, attr: ATTR_NAMES[m.attr] })).join(' e '),
              }),
            ),
          ),
        ),
      )
    : null;

  const offer = run.pendingChoices[0];
  const choice = offer
    ? h(
        'div',
        { class: 'panel' },
        h('h2', {}, t('result.choiceTitle', { n: run.pendingChoices.length })),
        h(
          'div',
          { class: 'row' },
          ...offer.map((o) =>
            h(
              'div',
              { class: 'card' },
              button(t(REWARD_TEXT[o].name), () => {
                if (o === 'treino') {
                  ui.training = true;
                  return ctx.rerender();
                }
                store.chooseReward(o);
              }, { attrs: { 'data-reward': o } }),
              h('p', { class: 'muted' }, t(REWARD_TEXT[o].desc, { n: o === 'ryo' ? BALANCE.shop.rewardRyo : BALANCE.shop.trainingUses })),
            ),
          ),
        ),
        ui.training
          ? h(
              'div',
              { class: 'row' },
              h('span', {}, t('result.trainPick')),
              ...c.equipped.map((id) =>
                button(JUTSUS[id]?.name ?? id, () => {
                  ui.training = false;
                  store.chooseReward('treino', id);
                }, { attrs: { 'data-train': id } }),
              ),
            )
          : null,
      )
    : null;

  return h(
    'div',
    { class: 'screen' },
    runHeader(run),
    summary,
    choice,
    points,
    goalsPanel,
    h(
      'div',
      { class: 'row' },
      button(t('map.prep'), () => store.go('prep')),
      button(t('map.sheet'), () => store.go('sheet')),
      button(t('common.continue'), () => store.continueFromResult(), { primary: true, disabled: run.pendingChoices.length > 0 }),
    ),
  );
};
```

- [ ] **Step 7: Implementar `src/ui-dom/screens/RunEndScreen.ts`**

```ts
import { mostUsedJutsu } from '../../game/meta/stats';
import { JUTSUS } from '../../data/jutsus';
import { TITLES } from '../../data/titles';
import { num, t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Resumo depois da morte ou da vitória. A meta já foi gravada pelo store. */
export const RunEndScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const info = store.state.runEnd;
  if (!info) return h('div', { class: 'panel' }, button(t('runEnd.menu'), () => store.toMenu(), { primary: true }));
  const s = info.stats;
  const most = mostUsedJutsu(s);
  const heading = info.result === 'victory' ? t('runEnd.victory') : info.result === 'dead' ? t('runEnd.dead') : t('runEnd.abandoned');
  const row = (label: string, value: string) => h('tr', {}, h('td', {}, label), h('td', {}, value));
  return h(
    'div',
    { class: 'screen panel' },
    h('h1', {}, heading),
    h('p', {}, `${info.name} — ${info.text}`),
    h('h3', {}, t('runEnd.stats')),
    h(
      'table',
      {},
      row(t('runEnd.encounters'), String(s.encountersWon)),
      row(t('runEnd.damageDealt'), num(s.damageDealt)),
      row(t('runEnd.damageTaken'), num(s.damageTaken)),
      row(t('runEnd.biggestHit'), num(s.biggestHit)),
      row(t('runEnd.crits'), String(s.crits)),
      row(t('runEnd.turns'), String(s.turns)),
      row(t('runEnd.mostUsed'), most ? (JUTSUS[most]?.name ?? most) : '—'),
    ),
    info.newTitles.length
      ? h('div', {}, h('h3', {}, t('runEnd.newTitles')), h('ul', {}, ...info.newTitles.map((id) => h('li', {}, TITLES[id]?.name ?? id))))
      : null,
    button(t('runEnd.menu'), () => store.toMenu(), { primary: true }),
  );
};
```

- [ ] **Step 8: Registrar as três telas em `src/ui-dom/screens/index.ts`**

```ts
import { MapScreen } from './MapScreen';
import { ResultScreen } from './ResultScreen';
import { RunEndScreen } from './RunEndScreen';
```

E no objeto `SCREENS`, acrescentar:

```ts
  map: MapScreen,
  result: ResultScreen,
  runEnd: RunEndScreen,
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx vitest run tests/ui/map-result.test.ts && npx tsc --noEmit`
Expected: 8 testes PASS; `tsc` sem saída. Se `t(\`element.${c.affinity}\`)` não compilar, é porque `Element` inclui `'raio'` e a chave `element.raio` está faltando: ela já foi criada na Task 1, confira.

- [ ] **Step 10: Conferir no navegador**

Run: `npm run dev`. Criar um ninja → o mapa mostra 26 nós com "⛺ CHEFE" no 13 e no 26. "Lutar" leva a "Tela em construção." (a batalha chega na Task 11). Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add src/ui-dom/components/runHeader.ts src/ui-dom/screens src/i18n/pt-BR.ts tests/ui/map-result.test.ts
git commit -m "feat: mapa da saga, tela de resultado com 1-de-3 e resumo de fim de run

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Preparação (Loja, Jutsus, Equipamento, Atributos), Ficha do Ninja com radar e diálogo de troca de jutsu

**Files:**
- Create: `src/ui-dom/view/format.ts`, `src/ui-dom/components/radar.ts`, `src/ui-dom/components/swap.ts`, `src/ui-dom/screens/PrepScreen.ts`, `src/ui-dom/screens/SheetScreen.ts`
- Modify: `src/ui-dom/screens/index.ts`, `src/i18n/pt-BR.ts`
- Test: `tests/ui/prep-sheet.test.ts`

**Interfaces:**
- Consumes: `priceOf(itemId, c)` (Plano 1 `run/shop.ts`); `slotCount(c)` (`progression/loadout.ts`); `masteryProgress(uses, j, clan, affinity): { level; usesIntoLevel; usesForNext: number | null }` (`progression/mastery.ts`); `playerToCombatant` (`run/battleSetup.ts`); `costFor` (`combat/cost.ts`); `aggregateMods`, `effectiveAttr` (EffectSystem); `critChance`, `dodgeChance`, `totalReduction`; `effectiveAttrs`, `characterMaxHp`, `characterMaxChakra`, `xpToNext`; `ITEMS`, `JUTSUS`, `CLANS`, `TITLES`, `STORY_NAMES`, `ATTR_NAMES`, `ATTR_KEYS`, `BALANCE`; `ninjaPower`, `fightingStyle`, `jutsuGoals` (Task 2); `allocationPanel` (Task 7); `runHeader` (Task 8); `GameStore.buy/equipItem/useRareScroll/equipJutsu/setLoadout/allocate/resolveSwap/back`.
- Produces:
  - (format.ts) `bonusText(b?: Partial<Attributes>): string`, `compareText(next?: Partial<Attributes>, cur?: Partial<Attributes>): string`
  - (radar.ts) `radarPoints(values: number[], max: number, radius: number, cx: number, cy: number): string`, `radarSvg(base: Attributes, effective: Attributes, size?: number): SVGSVGElement`
  - (swap.ts) `swapOverlay(ctx: ScreenCtx): HTMLElement | null`
  - `PrepScreen`, `SheetScreen` (`ScreenRenderer`); `OVERLAY` em `screens/index.ts` passa a ser `swapOverlay`.
- Seletores estáveis (usados pelos testes): `[data-tab=<id>]`, `[data-buy=<itemId>]`, `[data-equip=<jutsuId>]` (+ `[data-replace=<jutsuId>]`), `[data-unequip=<jutsuId>]`, `[data-equip-item=<itemId>]`, `[data-rare=<attr>]`.

- [ ] **Step 1: Acrescentar as chaves ao `PT_BR`**

```ts
  'prep.heading': 'Preparação',
  'prep.tab.loja': 'Loja',
  'prep.tab.jutsus': 'Jutsus',
  'prep.tab.equip': 'Equipamento',
  'prep.tab.attrs': 'Atributos',
  'prep.consumables': 'Consumíveis',
  'prep.equipment': 'Equipamentos',
  'prep.rare': 'Pergaminho Raro',
  'prep.soldOut': 'Esgotado até o próximo chefe.',
  'prep.restock': 'O estoque se renova depois de cada chefe.',
  'prep.buy': 'Comprar',
  'prep.owned': 'Já possui',
  'prep.have': 'Você tem {n}',
  'prep.rareUsed': 'Pergaminhos Raros usados nesta run: {n}/{max}',
  'prep.slots': 'Jutsus equipados ({n}/{max})',
  'prep.emptySlot': 'Vazio',
  'prep.repertoire': 'Repertório',
  'prep.noRepertoire': 'Todos os jutsus aprendidos estão equipados.',
  'prep.equip': 'Equipar',
  'prep.unequip': 'Remover',
  'prep.swapFor': 'Slots cheios — equipar',
  'prep.cost': '{n} chakra',
  'prep.mastery': 'Maestria +{n}',
  'prep.masteryNext': 'Próximo nível de maestria',
  'prep.masteryMax': 'Maestria máxima',
  'prep.weapon': 'Arma',
  'prep.armor': 'Armadura',
  'prep.noEquipment': 'Nenhum equipamento deste tipo. Compre na Loja.',
  'prep.noChange': 'sem mudança',
  'prep.noPoints': 'Nenhum ponto livre agora.',
  'prep.rareHave': 'Você tem {n}. Usados: {used}/{max}. Cada um dá +1 permanente num atributo base (pode liberar jutsus).',
  'swap.title': 'Você aprendeu {jutsu}!',
  'swap.body': 'Todos os slots estão ocupados. Substitua um jutsu ou mantenha o novo no repertório (dá para trocar depois na Preparação).',
  'swap.replace': 'No lugar de {jutsu}',
  'swap.keep': 'Manter no repertório',
  'sheet.heading': 'Ficha do Ninja',
  'sheet.tab.perfil': 'Perfil',
  'sheet.tab.atributos': 'Atributos',
  'sheet.tab.jutsus': 'Jutsus',
  'sheet.tab.equipamento': 'Equipamento',
  'sheet.name': 'Nome',
  'sheet.clan': 'Clã',
  'sheet.affinity': 'Afinidade',
  'sheet.level': 'Nível',
  'sheet.style': 'Estilo de luta',
  'sheet.title': 'Título',
  'sheet.saga': 'Saga',
  'sheet.sagaValue': 'Saga da Onda — encontro {n} de {total}',
  'sheet.story': 'Ponto da história',
  'sheet.attr': 'Atributo',
  'sheet.base': 'Base',
  'sheet.effective': 'Efetivo',
  'sheet.dodgeEven': 'Esquiva (contra a mesma Velocidade)',
  'sheet.learnedAt': 'Aprendido no nível {level}, encontro {n}',
  'sheet.uses': 'Usado {n} vez(es) nesta run',
  'sheet.equipped': 'equipado',
  'sheet.inventory': 'Consumíveis',
  'sheet.noItems': 'Nenhum consumível.',
  'sheet.rareUsed': 'Pergaminhos Raros aplicados: {n}/{max}',
  'sheet.goals': 'Quase desbloqueados',
  'style.ninjutsu': 'Especialista em Ninjutsu',
  'style.taijutsu': 'Lutador de Taijutsu',
  'style.genjutsu': 'Ilusionista',
  'style.estrategista': 'Estrategista',
  'style.muralha': 'Muralha',
  'style.agil': 'Ágil',
  'style.equilibrado': 'Equilibrado',
  'attr.short.hp': 'HP',
  'attr.short.tai': 'Tai',
  'attr.short.nin': 'Nin',
  'attr.short.gen': 'Gen',
  'attr.short.vel': 'Vel',
  'attr.short.int': 'Int',
  'attr.short.crit': 'Crit',
  'attr.short.def': 'Def',
```

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/prep-sheet.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { emptyAttributes } from '../../src/game/attributes';
import { radarPoints, radarSvg } from '../../src/ui-dom/components/radar';
import { bonusText, compareText } from '../../src/ui-dom/view/format';
import { click, mount } from './appHelpers';
import { scenario } from './memoryStore';

const q = (root: ParentNode, sel: string) => {
  const el = root.querySelector(sel) as HTMLButtonElement | null;
  if (!el) throw new Error(`seletor ${sel} não encontrado`);
  return el;
};

function prep(patch?: Parameters<typeof scenario>[0], tab?: string) {
  const { store } = scenario(patch);
  const root = mount(store);
  store.go('prep');
  if (tab) q(root, `[data-tab=${tab}]`).click();
  return { store, root };
}

describe('formatação de bônus', () => {
  it('lista bônus e compara com setas (não só cor)', () => {
    expect(bonusText({ vel: 2, crit: 2 })).toBe('+2 Velocidade, +2 Chance de Crítico');
    expect(bonusText(undefined)).toBe('—');
    expect(compareText({ tai: 4 }, { vel: 2 })).toBe('▲ +4 Taijutsu, ▼ −2 Velocidade');
    expect(compareText({ def: 3 }, { def: 3 })).toBe('sem mudança');
  });
});

describe('radar de 8 pontas', () => {
  it('primeiro vértice fica no topo', () => {
    expect(radarPoints([1, 1, 1, 1], 1, 10, 0, 0).split(' ')[0]).toBe('0.0,-10.0');
  });
  it('desenha base, efetivo e 8 rótulos', () => {
    const svg = radarSvg(emptyAttributes(5), { ...emptyAttributes(5), def: 8 });
    expect(svg.querySelectorAll('polygon').length).toBeGreaterThanOrEqual(3);
    expect(svg.querySelectorAll('text')).toHaveLength(8);
  });
});

describe('Preparação — loja', () => {
  it('compra consumível e debita o ryo', () => {
    const { store, root } = prep((run) => {
      run.character.ryo = 1000;
    });
    q(root, '[data-buy=kit_medico]').click();
    expect(store.state.run?.character.inventory['kit_medico']).toBe(1);
    expect(store.state.run?.character.ryo).toBe(920);
    expect(root.textContent).toContain('Você tem 1');
  });

  it('sem ryo, todo botão de compra fica desabilitado', () => {
    const { root } = prep();
    const buttons = [...root.querySelectorAll('[data-buy]')] as HTMLButtonElement[];
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.disabled)).toBe(true);
  });

  it('Pergaminho Raro: compra na loja e aplica na aba Atributos', () => {
    const { store, root } = prep((run) => {
      run.character.ryo = 1000;
    });
    q(root, '[data-buy=pergaminho_raro]').click();
    q(root, '[data-tab=attrs]').click();
    q(root, '[data-rare=gen]').click();
    expect(store.state.run?.character.baseAttrs.gen).toBe(6);
    expect(store.state.run?.character.rareScrollsUsed).toBe(1);
  });
});

describe('Preparação — jutsus', () => {
  it('troca um equipado por um do repertório', () => {
    const { store, root } = prep(undefined, 'jutsus');
    q(root, '[data-equip=doryuuheki][data-replace=henge]').click();
    expect(store.state.run?.character.equipped).toContain('doryuuheki');
    expect(store.state.run?.character.equipped).not.toContain('henge');
  });

  it('remover libera um slot e o repertório passa a mostrar "Equipar"', () => {
    const { store, root } = prep(undefined, 'jutsus');
    q(root, '[data-unequip=henge]').click();
    expect(store.state.run?.character.equipped).toHaveLength(3);
    q(root, '[data-equip=doryuuheki]:not([data-replace])').click();
    expect(store.state.run?.character.equipped).toContain('doryuuheki');
  });
});

describe('Preparação — equipamento', () => {
  it('compara antes de trocar e equipa', () => {
    const { store, root } = prep((run) => {
      run.character.ownedEquipment = ['kunai', 'katana'];
    }, 'equip');
    expect(root.textContent).toContain('▲ +2 Velocidade');
    q(root, '[data-equip-item=kunai]').click();
    expect(store.state.run?.character.equipment.weapon).toBe('kunai');
    expect(root.textContent).toContain('▲ +4 Taijutsu, ▼ −2 Velocidade, ▼ −2 Chance de Crítico');
  });
});

describe('Ficha do Ninja', () => {
  it('Perfil com Poder Ninja e estilo; Atributos com radar; Jutsus com origem', () => {
    const { store } = scenario();
    const root = mount(store);
    store.go('sheet');
    expect(root.textContent).toContain('Poder Ninja');
    expect(root.textContent).toContain('Especialista em Ninjutsu');
    q(root, '[data-tab=atributos]').click();
    expect(root.querySelector('svg')).not.toBeNull();
    q(root, '[data-tab=jutsus]').click();
    expect(root.textContent).toContain('Aprendido no nível 1, encontro 1');
    click(root, 'Voltar');
    expect(store.state.screen).toBe('map');
  });
});

describe('Diálogo de troca de jutsu', () => {
  it('aparece ao aprender com slots cheios; "manter" fecha sem equipar', () => {
    const { store } = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    const root = mount(store);
    store.allocate({ gen: 3 });
    expect(root.textContent).toContain('Você aprendeu Kai!');
    click(root, 'Manter no repertório');
    expect(root.textContent).not.toContain('Você aprendeu Kai!');
    expect(store.state.run?.character.equipped).not.toContain('kai');
  });

  it('substituir equipa o novo jutsu', () => {
    const { store } = scenario((run) => {
      run.character.unspentPoints = 3;
    });
    const root = mount(store);
    store.allocate({ gen: 3 });
    click(root, 'No lugar de Henge no Jutsu');
    expect(store.state.run?.character.equipped).toContain('kai');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/prep-sheet.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/ui-dom/components/radar"`.

- [ ] **Step 4: Implementar `src/ui-dom/view/format.ts`**

```ts
import { ATTR_NAMES } from '../../game/attributes';
import { ATTR_KEYS, type Attributes } from '../../game/types';
import { t } from '../../i18n/pt-BR';

/** "+2 Velocidade, +2 Chance de Crítico" */
export function bonusText(b?: Partial<Attributes>): string {
  if (!b) return '—';
  const parts = ATTR_KEYS.filter((k) => (b[k] ?? 0) !== 0).map((k) => `+${b[k]} ${ATTR_NAMES[k]}`);
  return parts.length ? parts.join(', ') : '—';
}

/** Comparação antes de trocar (DD v2 §13): seta + sinal, nunca só cor. */
export function compareText(next?: Partial<Attributes>, cur?: Partial<Attributes>): string {
  const parts = ATTR_KEYS.map((k) => ({ k, d: (next?.[k] ?? 0) - (cur?.[k] ?? 0) }))
    .filter((x) => x.d !== 0)
    .map((x) => `${x.d > 0 ? '▲ +' : '▼ −'}${Math.abs(x.d)} ${ATTR_NAMES[x.k]}`);
  return parts.length ? parts.join(', ') : t('prep.noChange');
}
```

- [ ] **Step 5: Implementar `src/ui-dom/components/radar.ts`**

```ts
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
  const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, width: String(size), height: String(size), role: 'img', 'aria-label': 'Radar de atributos' });
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
```

- [ ] **Step 6: Implementar `src/ui-dom/components/swap.ts`**

```ts
import { JUTSUS } from '../../data/jutsus';
import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenCtx } from '../types';

/** Abre sozinho quando um jutsu é aprendido com os slots cheios (spec §5; DD v2 §13). */
export function swapOverlay(ctx: ScreenCtx): HTMLElement | null {
  const { store } = ctx;
  const id = store.state.swapQueue[0];
  const run = store.state.run;
  if (!id || !run) return null;
  const j = JUTSUS[id];
  return h(
    'div',
    { class: 'dialog', attrs: { role: 'dialog', 'aria-modal': 'true' } },
    h('h2', {}, t('swap.title', { jutsu: j?.name ?? id })),
    h('p', {}, j?.description ?? ''),
    h('p', { class: 'muted' }, t('swap.body')),
    h(
      'div',
      { class: 'row' },
      ...run.character.equipped.map((eq) => button(t('swap.replace', { jutsu: JUTSUS[eq]?.name ?? eq }), () => store.resolveSwap(eq))),
    ),
    button(t('swap.keep'), () => store.resolveSwap(null), { primary: true }),
  );
}
```

- [ ] **Step 7: Implementar `src/ui-dom/screens/PrepScreen.ts`**

```ts
import { ATTR_NAMES, emptyAttributes, sumAttributes } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import { costFor } from '../../game/combat/cost';
import { slotCount } from '../../game/progression/loadout';
import { masteryProgress } from '../../game/progression/mastery';
import { playerToCombatant } from '../../game/run/battleSetup';
import { priceOf } from '../../game/run/shop';
import type { RunState } from '../../game/run/types';
import { ATTR_KEYS } from '../../game/types';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { num, t, type I18nKey } from '../../i18n/pt-BR';
import type { GameStore } from '../../store/GameStore';
import { allocationPanel } from '../components/allocation';
import { runHeader } from '../components/runHeader';
import { bar, button, h } from '../dom';
import type { ScreenCtx, ScreenRenderer } from '../types';
import { bonusText, compareText } from '../view/format';

type PrepTab = 'loja' | 'jutsus' | 'equip' | 'attrs';
const TABS: { id: PrepTab; label: I18nKey }[] = [
  { id: 'loja', label: 'prep.tab.loja' },
  { id: 'jutsus', label: 'prep.tab.jutsus' },
  { id: 'equip', label: 'prep.tab.equip' },
  { id: 'attrs', label: 'prep.tab.attrs' },
];

/** Preparação entre encontros (spec §8 "Acesso"): loja, slots de jutsu, equipamento e pontos. */
export const PrepScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  if (!run) return h('div', { class: 'panel' }, t('notice.noRun'));
  const ui = ctx.local('ui', () => ({ tab: 'loja' as PrepTab, draft: emptyAttributes(0) }));
  const tabs = h(
    'div',
    { class: 'tabs', attrs: { role: 'tablist' } },
    ...TABS.map((tab) =>
      button(t(tab.label), () => {
        ui.tab = tab.id;
        ctx.rerender();
      }, { class: ui.tab === tab.id ? 'active' : '', attrs: { 'data-tab': tab.id, role: 'tab', 'aria-selected': String(ui.tab === tab.id) } }),
    ),
  );
  const body =
    ui.tab === 'loja' ? shopTab(store, run) : ui.tab === 'jutsus' ? jutsuTab(store, run) : ui.tab === 'equip' ? equipTab(store, run) : attrsTab(ctx, run, ui);
  return h('div', { class: 'screen' }, runHeader(run), h('h1', {}, t('prep.heading')), tabs, body, h('div', { class: 'row' }, button(t('common.back'), () => store.back())));
};

function shopTab(store: GameStore, run: RunState): HTMLElement {
  const c = run.character;
  const row = (id: string, soldOut = false) => {
    const item = ITEMS[id];
    if (!item) return null;
    const price = priceOf(id, c);
    const isGear = item.kind === 'weapon' || item.kind === 'armor';
    const owned = isGear && c.ownedEquipment.includes(id);
    const count = c.inventory[id] ?? 0;
    return h(
      'tr',
      {},
      h('td', {}, item.name, ' ', h('span', { class: 'badge' }, item.grade)),
      h('td', { class: 'muted' }, item.description),
      h('td', {}, t('common.ryo', { n: num(price) })),
      h('td', {}, owned ? t('prep.owned') : count > 0 ? t('prep.have', { n: count }) : ''),
      h('td', {}, button(t('prep.buy'), () => store.buy(id), { disabled: soldOut || owned || c.ryo < price, attrs: { 'data-buy': id } })),
    );
  };
  return h(
    'div',
    { class: 'panel' },
    h('h3', {}, t('prep.consumables')),
    h('table', {}, ...run.shop.consumables.map((id) => row(id))),
    h('h3', {}, t('prep.equipment')),
    run.shop.equipment.length ? h('table', {}, ...run.shop.equipment.map((id) => row(id))) : h('p', { class: 'muted' }, t('prep.soldOut')),
    h('h3', {}, t('prep.rare')),
    run.shop.rareScrolls > 0
      ? h('table', {}, row('pergaminho_raro', c.rareScrollsUsed + (c.inventory['pergaminho_raro'] ?? 0) >= BALANCE.shop.rareScrollMaxPerRun))
      : h('p', { class: 'muted' }, t('prep.soldOut')),
    h('p', { class: 'muted' }, t('prep.rareUsed', { n: c.rareScrollsUsed, max: BALANCE.shop.rareScrollMaxPerRun })),
    h('p', { class: 'muted' }, t('prep.restock')),
  );
}

function jutsuTab(store: GameStore, run: RunState): HTMLElement {
  const c = run.character;
  const comb = playerToCombatant(c);
  const slots = slotCount(c);
  const info = (id: string) => {
    const j = JUTSUS[id];
    if (!j) return h('div', {}, id);
    const p = masteryProgress(c.masteryUses[id] ?? 0, j, c.clan, c.affinity);
    return h(
      'div',
      {},
      h('strong', {}, j.name),
      ' ',
      h('span', { class: 'badge' }, j.grade),
      j.element ? h('span', { class: 'badge' }, t(`element.${j.element}`)) : null,
      ' ',
      h('span', { class: 'muted' }, t('prep.cost', { n: costFor(comb, j) })),
      ' · ',
      h('span', {}, t('prep.mastery', { n: p.level })),
      p.usesForNext !== null ? bar('xp', p.usesIntoLevel, p.usesForNext, t('prep.masteryNext')) : h('span', { class: 'badge' }, t('prep.masteryMax')),
      h('p', { class: 'muted' }, j.description),
    );
  };
  const equipped = c.equipped.map((id) =>
    h('div', { class: 'card' }, info(id), button(t('prep.unequip'), () => store.setLoadout(c.equipped.filter((x) => x !== id)), { attrs: { 'data-unequip': id } })),
  );
  const empty = Array.from({ length: Math.max(0, slots - c.equipped.length) }, () => h('div', { class: 'card muted' }, t('prep.emptySlot')));
  const repertoire = c.learned
    .filter((id) => !c.equipped.includes(id))
    .map((id) =>
      h(
        'div',
        { class: 'card' },
        info(id),
        c.equipped.length < slots
          ? button(t('prep.equip'), () => store.equipJutsu(id), { primary: true, attrs: { 'data-equip': id } })
          : h(
              'div',
              { class: 'row' },
              h('span', { class: 'muted' }, t('prep.swapFor')),
              ...c.equipped.map((eq) =>
                button(t('swap.replace', { jutsu: JUTSUS[eq]?.name ?? eq }), () => store.equipJutsu(id, eq), {
                  attrs: { 'data-equip': id, 'data-replace': eq },
                }),
              ),
            ),
      ),
    );
  return h(
    'div',
    { class: 'panel' },
    h('h3', {}, t('prep.slots', { n: c.equipped.length, max: slots })),
    h('div', { class: 'grid-2' }, ...equipped, ...empty),
    h('h3', {}, t('prep.repertoire')),
    repertoire.length ? h('div', { class: 'grid-2' }, ...repertoire) : h('p', { class: 'muted' }, t('prep.noRepertoire')),
  );
}

function equipTab(store: GameStore, run: RunState): HTMLElement {
  const c = run.character;
  const slot = (kind: 'weapon' | 'armor') => {
    const cur = c.equipment[kind];
    const curItem = cur ? ITEMS[cur] : undefined;
    const owned = c.ownedEquipment.filter((id) => ITEMS[id]?.kind === kind);
    return h(
      'div',
      { class: 'panel' },
      h('h3', {}, t(kind === 'weapon' ? 'prep.weapon' : 'prep.armor')),
      h('p', {}, curItem ? `${curItem.name} (${bonusText(curItem.attrBonus)})` : t('prep.emptySlot')),
      owned.length
        ? h(
            'table',
            {},
            ...owned.map((id) => {
              const it = ITEMS[id]!;
              return h(
                'tr',
                {},
                h('td', {}, it.name, ' ', h('span', { class: 'badge' }, it.grade)),
                h('td', {}, bonusText(it.attrBonus)),
                h('td', {}, id === cur ? '' : compareText(it.attrBonus, curItem?.attrBonus)),
                h('td', {}, button(t('prep.equip'), () => store.equipItem(id), { disabled: id === cur, attrs: { 'data-equip-item': id } })),
              );
            }),
          )
        : h('p', { class: 'muted' }, t('prep.noEquipment')),
    );
  };
  return h('div', { class: 'grid-2' }, slot('weapon'), slot('armor'));
}

function attrsTab(ctx: ScreenCtx, run: RunState, ui: { draft: ReturnType<typeof emptyAttributes> }): HTMLElement {
  const { store } = ctx;
  const c = run.character;
  const scrolls = c.inventory['pergaminho_raro'] ?? 0;
  const max = BALANCE.shop.rareScrollMaxPerRun;
  const points =
    c.unspentPoints > 0
      ? h(
          'div',
          {},
          allocationPanel({ base: c.baseAttrs, points: c.unspentPoints, draft: ui.draft, onChange: () => ctx.rerender() }),
          button(t('alloc.confirm'), () => {
            if (store.allocate({ ...ui.draft })) ui.draft = emptyAttributes(0);
            ctx.rerender();
          }, { primary: true, disabled: sumAttributes(ui.draft) === 0 }),
        )
      : h('p', { class: 'muted' }, t('prep.noPoints'));
  return h(
    'div',
    { class: 'grid-2' },
    h('div', { class: 'panel' }, h('h3', {}, t('result.pointsTitle')), points),
    h(
      'div',
      { class: 'panel' },
      h('h3', {}, t('prep.rare')),
      h('p', {}, t('prep.rareHave', { n: scrolls, used: c.rareScrollsUsed, max })),
      scrolls > 0
        ? h(
            'div',
            { class: 'row' },
            ...ATTR_KEYS.map((k) => button(`+1 ${ATTR_NAMES[k]}`, () => store.useRareScroll(k), { disabled: c.rareScrollsUsed >= max, attrs: { 'data-rare': k } })),
          )
        : null,
    ),
  );
}
```

- [ ] **Step 8: Implementar `src/ui-dom/screens/SheetScreen.ts`**

```ts
import { ATTR_NAMES } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import { costFor } from '../../game/combat/cost';
import { aggregateMods, effectiveAttr } from '../../game/effects/EffectSystem';
import { critChance, dodgeChance, totalReduction, xpToNext } from '../../game/formulas';
import { characterMaxChakra, characterMaxHp, effectiveAttrs } from '../../game/progression/character';
import { masteryProgress } from '../../game/progression/mastery';
import { playerToCombatant } from '../../game/run/battleSetup';
import type { RunState } from '../../game/run/types';
import { ATTR_KEYS } from '../../game/types';
import { CLANS } from '../../data/clans';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { STORY_NAMES } from '../../data/story';
import { TITLES } from '../../data/titles';
import { num, pct, t, type I18nKey } from '../../i18n/pt-BR';
import { radarSvg } from '../components/radar';
import { bar, button, h } from '../dom';
import type { ScreenRenderer } from '../types';
import { bonusText } from '../view/format';
import { fightingStyle, jutsuGoals, ninjaPower } from '../view/derived';

type SheetTab = 'perfil' | 'atributos' | 'jutsus' | 'equipamento';
const TABS: { id: SheetTab; label: I18nKey }[] = [
  { id: 'perfil', label: 'sheet.tab.perfil' },
  { id: 'atributos', label: 'sheet.tab.atributos' },
  { id: 'jutsus', label: 'sheet.tab.jutsus' },
  { id: 'equipamento', label: 'sheet.tab.equipamento' },
];

const row = (label: string, ...value: (string | HTMLElement)[]) => h('tr', {}, h('th', {}, label), h('td', {}, ...value));

/**
 * Ficha do Ninja (spec §10; DD v2 §14), abas Perfil, Atributos, Jutsus e Equipamento.
 * É SEMPRE somente leitura: pode ser aberta do mapa e da batalha sem gastar turno.
 */
export const SheetScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  if (!run) return h('div', { class: 'panel' }, t('notice.noRun'));
  const ui = ctx.local('ui', () => ({ tab: 'perfil' as SheetTab }));
  const tabs = h(
    'div',
    { class: 'tabs', attrs: { role: 'tablist' } },
    ...TABS.map((tab) =>
      button(t(tab.label), () => {
        ui.tab = tab.id;
        ctx.rerender();
      }, { class: ui.tab === tab.id ? 'active' : '', attrs: { 'data-tab': tab.id, role: 'tab', 'aria-selected': String(ui.tab === tab.id) } }),
    ),
  );
  const body = ui.tab === 'perfil' ? profile(run) : ui.tab === 'atributos' ? attributes(run) : ui.tab === 'jutsus' ? jutsus(run) : equipment(run);
  return h('div', { class: 'screen' }, h('h1', {}, t('sheet.heading')), tabs, body, h('div', { class: 'row' }, button(t('common.back'), () => store.back())));
};

function profile(run: RunState): HTMLElement {
  const c = run.character;
  const title = c.titleId ? TITLES[c.titleId] : undefined;
  return h(
    'div',
    { class: 'panel' },
    h(
      'table',
      {},
      row(t('sheet.name'), c.name),
      row(t('sheet.clan'), CLANS[c.clan].name),
      row(t('sheet.affinity'), t(`element.${c.affinity}`)),
      row(t('sheet.level'), String(c.level), bar('xp', c.xp, xpToNext(c.level), t('header.xp'))),
      row(t('derived.power'), String(ninjaPower(effectiveAttrs(c)))),
      row(t('sheet.style'), t(`style.${fightingStyle(c.baseAttrs)}`)),
      row(t('header.rep', { n: '' }).trim(), num(c.reputation)),
      row(t('sheet.title'), title ? `${title.name} — ${title.description}` : t('common.none')),
      row('Ryo', num(c.ryo)),
      row(t('sheet.saga'), t('sheet.sagaValue', { n: run.nodeIndex + 1, total: run.nodes.length })),
      row(t('sheet.story'), STORY_NAMES[run.story]),
    ),
  );
}

function attributes(run: RunState): HTMLElement {
  const c = run.character;
  const eff = effectiveAttrs(c);
  const comb = playerToCombatant(c);
  const mods = aggregateMods(comb);
  const vel = effectiveAttr(comb, 'vel');
  const goals = jutsuGoals(c, run.story);
  return h(
    'div',
    { class: 'grid-2' },
    h('div', { class: 'panel' }, radarSvg(c.baseAttrs, eff)),
    h(
      'div',
      { class: 'panel' },
      h(
        'table',
        {},
        h('tr', {}, h('th', {}, t('sheet.attr')), h('th', {}, t('sheet.base')), h('th', {}, t('sheet.effective'))),
        ...ATTR_KEYS.map((k) => h('tr', {}, h('td', {}, ATTR_NAMES[k]), h('td', {}, String(c.baseAttrs[k])), h('td', {}, String(eff[k])))),
      ),
      h(
        'table',
        {},
        row(t('derived.hp'), `${c.hp}/${characterMaxHp(c)}`),
        row(t('derived.chakra'), `${c.chakra}/${characterMaxChakra(c)}`),
        row(t('derived.crit'), pct(critChance(effectiveAttr(comb, 'crit'), mods.crit))),
        row(t('sheet.dodgeEven'), pct(dodgeChance(vel, vel, mods.dodge))),
        row(t('derived.reduction'), pct(totalReduction(effectiveAttr(comb, 'def'), mods.reduction))),
      ),
      goals.length
        ? h(
            'div',
            {},
            h('h3', {}, t('sheet.goals')),
            h(
              'ul',
              {},
              ...goals.map((g) =>
                h(
                  'li',
                  {},
                  t('result.goal', {
                    jutsu: JUTSUS[g.jutsuId]?.name ?? g.jutsuId,
                    missing: g.missing.map((m) => t('result.goalPart', { n: m.missing, attr: ATTR_NAMES[m.attr] })).join(' e '),
                  }),
                ),
              ),
            ),
          )
        : null,
    ),
  );
}

function jutsus(run: RunState): HTMLElement {
  const c = run.character;
  const comb = playerToCombatant(c);
  return h(
    'div',
    { class: 'panel grid-2' },
    ...c.learned.map((id) => {
      const j = JUTSUS[id];
      if (!j) return h('div', {}, id);
      const p = masteryProgress(c.masteryUses[id] ?? 0, j, c.clan, c.affinity);
      const at = c.learnedAt[id];
      return h(
        'div',
        { class: 'card' },
        h('strong', {}, j.name),
        ' ',
        c.equipped.includes(id) ? h('span', { class: 'badge' }, t('sheet.equipped')) : null,
        h('p', { class: 'muted' }, `${j.grade} · ${j.element ? t(`element.${j.element}`) : '—'} · ${t('prep.cost', { n: costFor(comb, j) })} · ${t('prep.mastery', { n: p.level })}`),
        p.usesForNext !== null ? bar('xp', p.usesIntoLevel, p.usesForNext, t('prep.masteryNext')) : h('span', { class: 'badge' }, t('prep.masteryMax')),
        at ? h('p', {}, t('sheet.learnedAt', { level: at.level, n: at.nodeIndex + 1 })) : null,
        h('p', { class: 'muted' }, t('sheet.uses', { n: run.stats.jutsuUses[id] ?? 0 })),
        h('p', {}, j.description),
      );
    }),
  );
}

function equipment(run: RunState): HTMLElement {
  const c = run.character;
  const gear = (id: string | null) => (id && ITEMS[id] ? `${ITEMS[id]!.name} (${bonusText(ITEMS[id]!.attrBonus)})` : t('prep.emptySlot'));
  const consumables = Object.entries(c.inventory).filter(([id, n]) => n > 0 && ITEMS[id]?.kind === 'consumable');
  return h(
    'div',
    { class: 'panel' },
    h('table', {}, row(t('prep.weapon'), gear(c.equipment.weapon)), row(t('prep.armor'), gear(c.equipment.armor))),
    h('h3', {}, t('sheet.inventory')),
    consumables.length
      ? h('ul', {}, ...consumables.map(([id, n]) => h('li', {}, `${ITEMS[id]!.name} ×${n}`)))
      : h('p', { class: 'muted' }, t('sheet.noItems')),
    h('p', {}, t('sheet.rareUsed', { n: c.rareScrollsUsed, max: BALANCE.shop.rareScrollMaxPerRun })),
  );
}
```

> Nota: no `profile`, o rótulo de reputação reaproveita `header.rep` sem número. Se preferir um rótulo próprio, crie `'sheet.rep': 'Reputação'` e use-o — é só texto.

- [ ] **Step 9: Registrar telas e overlay em `src/ui-dom/screens/index.ts`**

Acrescentar os imports:

```ts
import { swapOverlay } from '../components/swap';
import { PrepScreen } from './PrepScreen';
import { SheetScreen } from './SheetScreen';
```

No objeto `SCREENS`, acrescentar:

```ts
  prep: PrepScreen,
  sheet: SheetScreen,
```

E trocar a linha do `OVERLAY` por:

```ts
export const OVERLAY: ((ctx: ScreenCtx) => HTMLElement | null) | null = swapOverlay;
```

- [ ] **Step 10: Rodar e ver passar**

Run: `npx vitest run tests/ui/prep-sheet.test.ts && npm test && npx tsc --noEmit`
Expected: todos PASS. Se "troca um equipado por um do repertório" falhar porque `doryuuheki` não está no repertório, confira a ordem de `JUTSU_LIST` no Plano 1: os 4 primeiros jutsus que `PARAMS` (Nin 15, Sem clã) libera são equipados; use o 5º no teste.

- [ ] **Step 11: Commit**

```bash
git add src/ui-dom src/i18n/pt-BR.ts tests/ui/prep-sheet.test.ts
git commit -m "feat: preparação (loja, jutsus, equipamento, atributos), ficha com radar e troca de jutsu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Enciclopédia de Jutsus, Histórico de Runs e Títulos

**Files:**
- Create: `src/ui-dom/screens/EncyclopediaScreen.ts`, `src/ui-dom/screens/HistoryScreen.ts`, `src/ui-dom/screens/TitlesScreen.ts`
- Modify: `src/ui-dom/screens/index.ts`, `src/i18n/pt-BR.ts`
- Test: `tests/ui/meta-screens.test.ts`

**Interfaces:**
- Consumes: `encyclopedia(meta): EncyclopediaEntry[]`, `type HistoryEntry`, `type MetaState` (Plano 1 `meta/meta.ts`); `TITLE_LIST`, `JUTSUS`, `CLANS`, `STORY_NAMES`, `ITEMS`, `ATTR_NAMES`, `ATTR_KEYS`, `JUTSU_CATEGORIES`, `type JutsuCategory`; `META_KEY` (Plano 1 save).
- Produces: `EncyclopediaScreen`, `HistoryScreen`, `TitlesScreen` (`ScreenRenderer`). Seletores: `select[name=category]`, `select[name=status]`, `[data-history=<id>]`.

- [ ] **Step 1: Acrescentar as chaves ao `PT_BR`**

```ts
  'enc.heading': 'Enciclopédia de Jutsus',
  'enc.count': 'Desbloqueados: {n} de {total}',
  'enc.filterCategory': 'Categoria',
  'enc.filterStatus': 'Situação',
  'enc.all': 'Todas',
  'enc.status.todos': 'Todos',
  'enc.status.desbloqueados': 'Desbloqueados',
  'enc.status.bloqueados': 'Bloqueados',
  'enc.unlocked': '✔ Desbloqueado',
  'enc.locked': '🔒 Bloqueado',
  'enc.mastered': '★ Maestria +5',
  'enc.general': 'Geral',
  'enc.neutral': 'Neutro',
  'enc.requires': 'Requisitos: {list}',
  'enc.noReq': 'Requisitos: nenhum atributo',
  'enc.prereq': 'depois de {jutsu}',
  'enc.minStory': 'a partir de: {story}',
  'enc.later': 'Chega na fase {phase}',
  'cat.ninjutsu': 'Ninjutsu',
  'cat.taijutsu': 'Taijutsu',
  'cat.genjutsu': 'Genjutsu',
  'cat.fuinjutsu': 'Fuinjutsu',
  'hist.heading': 'Histórico de Runs',
  'hist.empty': 'Nenhuma run registrada ainda.',
  'hist.lifetime': 'Runs: {runs} · Vitórias: {wins}',
  'hist.bosses': 'Chefes derrotados: {list}',
  'hist.defeated': 'Inimigos derrotados por grau: {list}',
  'hist.details': 'Detalhes',
  'hist.result.dead': 'Morte',
  'hist.result.victory': 'Vitória',
  'hist.result.abandoned': 'Abandonada',
  'hist.line': '{clan} · {element} · nível {level} · reputação {rep} · {won} encontro(s) vencido(s)',
  'hist.attrs': 'Atributos base',
  'hist.jutsus': 'Jutsus (maestria)',
  'hist.equipment': 'Equipamento',
  'titles.heading': 'Títulos',
  'titles.count': 'Desbloqueados: {n} de {total}',
  'titles.info': 'Escolha um título desbloqueado ao criar o ninja: o buff vale durante a run inteira.',
  'titles.locked': '???',
  'titles.hint': 'Dica: {desc}',
  'titles.unlocked': '✔ Conquistado',
```

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/meta-screens.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { META_KEY } from '../../src/game/save/save';
import { mount } from './appHelpers';
import { MemoryStore, PARAMS, makeStore } from './memoryStore';

/** Meta com uma run abandonada (Sem clã, Nin 15: aprendeu Henge, Bunshin...). */
function withHistory(patchMeta?: (m: Record<string, unknown>) => void) {
  const storage = new MemoryStore();
  const a = makeStore(storage);
  a.boot();
  a.startNewRun(PARAMS);
  a.abandonRun();
  if (patchMeta) {
    const m = JSON.parse(storage.getItem(META_KEY)!);
    patchMeta(m);
    storage.setItem(META_KEY, JSON.stringify(m));
  }
  const store = makeStore(storage);
  const root = mount(store);
  store.boot();
  return { store, root };
}

function cardOf(root: ParentNode, name: string): HTMLElement | undefined {
  return [...root.querySelectorAll('.card')].find((c) => c.querySelector('h3')?.textContent === name) as HTMLElement | undefined;
}

describe('Enciclopédia', () => {
  it('meta vazia: tudo bloqueado e sem golpes exclusivos de inimigos', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    store.go('encyclopedia');
    expect(root.textContent).toContain('Desbloqueados: 0 de');
    expect(cardOf(root, 'Henge no Jutsu')?.textContent).toContain('Bloqueado');
    expect(cardOf(root, 'Kunai Lançada')).toBeUndefined();
  });

  it('jutsu aprendido em run anterior fica desbloqueado; filtro de situação funciona', () => {
    const { store, root } = withHistory();
    store.go('encyclopedia');
    expect(cardOf(root, 'Henge no Jutsu')?.textContent).toContain('Desbloqueado');
    const sel = root.querySelector('select[name=status]') as HTMLSelectElement;
    sel.value = 'bloqueados';
    sel.dispatchEvent(new Event('change'));
    expect(cardOf(root, 'Henge no Jutsu')).toBeUndefined();
    expect(cardOf(root, 'Kawarimi no Jutsu')).toBeDefined();
  });

  it('filtro de categoria', () => {
    const { store, root } = withHistory();
    store.go('encyclopedia');
    const sel = root.querySelector('select[name=category]') as HTMLSelectElement;
    sel.value = 'taijutsu';
    sel.dispatchEvent(new Event('change'));
    expect(cardOf(root, 'Sennen Goroshi')).toBeDefined();
    expect(cardOf(root, 'Henge no Jutsu')).toBeUndefined();
  });
});

describe('Histórico', () => {
  it('vazio', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    store.go('history');
    expect(root.textContent).toContain('Nenhuma run registrada ainda.');
  });

  it('lista a run com o texto do resultado e abre os detalhes', () => {
    const { store, root } = withHistory();
    store.go('history');
    expect(root.textContent).toContain('Abandonou a run no encontro 1 de 26');
    expect(root.textContent).toContain('Runs: 1 · Vitórias: 0');
    (root.querySelector('[data-history]') as HTMLButtonElement).click();
    expect(root.textContent).toContain('Atributos base');
    expect(root.textContent).toContain('Henge no Jutsu +0');
  });
});

describe('Títulos', () => {
  it('bloqueados aparecem como ??? e ocultos não aparecem', () => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    store.go('titles');
    expect(root.textContent).toContain('Desbloqueados: 0 de');
    expect(root.textContent).toContain('???');
    expect(root.textContent).not.toContain('Colecionador');
    expect(root.textContent).not.toContain('Novo Chunin');
  });

  it('título conquistado mostra nome e buff', () => {
    const { store, root } = withHistory((m) => {
      m['titlesUnlocked'] = ['demonio_da_nevoa'];
    });
    store.go('titles');
    expect(root.textContent).toContain('Demônio da Névoa');
    expect(root.textContent).toContain('Desbloqueados: 1 de');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/meta-screens.test.ts`
Expected: FAIL — as telas ainda são "em construção" (ex.: `expected '...' to contain 'Desbloqueados: 0 de'`).

- [ ] **Step 4: Implementar `src/ui-dom/screens/EncyclopediaScreen.ts`**

```ts
import { ATTR_NAMES } from '../../game/attributes';
import { encyclopedia, type EncyclopediaEntry } from '../../game/meta/meta';
import { ATTR_KEYS, JUTSU_CATEGORIES, type JutsuCategory } from '../../game/types';
import { CLANS } from '../../data/clans';
import { JUTSUS, type JutsuDef } from '../../data/jutsus';
import { STORY_NAMES } from '../../data/story';
import { t, type I18nKey } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

type StatusFilter = 'todos' | 'desbloqueados' | 'bloqueados';
const STATUS: { id: StatusFilter; label: I18nKey }[] = [
  { id: 'todos', label: 'enc.status.todos' },
  { id: 'desbloqueados', label: 'enc.status.desbloqueados' },
  { id: 'bloqueados', label: 'enc.status.bloqueados' },
];
const CAT_LABEL: Record<JutsuCategory, I18nKey> = {
  ninjutsu: 'cat.ninjutsu',
  taijutsu: 'cat.taijutsu',
  genjutsu: 'cat.genjutsu',
  fuinjutsu: 'cat.fuinjutsu',
};
const MVP_PHASES = ['F0', 'F1A', 'F1B'];

function requirementText(j: JutsuDef): string {
  const attrs = ATTR_KEYS.filter((k) => (j.requires[k] ?? 0) > 0).map((k) => `${ATTR_NAMES[k]} ${j.requires[k]}`);
  const parts = [...attrs];
  if (j.prereq) parts.push(t('enc.prereq', { jutsu: JUTSUS[j.prereq]?.name ?? j.prereq }));
  parts.push(t('enc.minStory', { story: STORY_NAMES[j.minStory] }));
  return attrs.length || j.prereq ? t('enc.requires', { list: parts.join(' · ') }) : `${t('enc.noReq')} · ${parts.join(' · ')}`;
}

function card(e: EncyclopediaEntry): HTMLElement {
  const j = e.jutsu;
  return h(
    'div',
    { class: 'card' },
    h('h3', {}, j.name),
    h(
      'p',
      { class: 'row' },
      h('span', { class: 'badge' }, e.learned ? t('enc.unlocked') : t('enc.locked')),
      e.mastered ? h('span', { class: 'badge' }, t('enc.mastered')) : null,
      MVP_PHASES.includes(j.phase) ? null : h('span', { class: 'badge' }, t('enc.later', { phase: j.phase })),
    ),
    h(
      'p',
      { class: 'muted' },
      `${t(CAT_LABEL[j.category])} · ${j.grade} · ${j.element ? t(`element.${j.element}`) : t('enc.neutral')} · ${j.clan ? CLANS[j.clan].name : t('enc.general')}`,
    ),
    h('p', { class: 'muted' }, requirementText(j)),
    h('p', {}, j.description),
  );
}

/** Pool completo de jutsus como coleção (DD v2 §13). Desbloqueado = aprendido em qualquer run. */
export const EncyclopediaScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const ui = ctx.local('filters', () => ({ category: '' as JutsuCategory | '', status: 'todos' as StatusFilter }));
  const all = encyclopedia(store.state.meta);
  const list = all.filter(
    (e) => (!ui.category || e.jutsu.category === ui.category) && (ui.status === 'todos' || (ui.status === 'desbloqueados') === e.learned),
  );
  const categorySel = h(
    'select',
    { attrs: { name: 'category', 'aria-label': t('enc.filterCategory') }, on: { change: (ev) => { ui.category = (ev.target as HTMLSelectElement).value as JutsuCategory | ''; ctx.rerender(); } } },
    h('option', { value: '' }, t('enc.all')),
    ...JUTSU_CATEGORIES.map((c) => h('option', { value: c }, t(CAT_LABEL[c]))),
  );
  categorySel.value = ui.category;
  const statusSel = h(
    'select',
    { attrs: { name: 'status', 'aria-label': t('enc.filterStatus') }, on: { change: (ev) => { ui.status = (ev.target as HTMLSelectElement).value as StatusFilter; ctx.rerender(); } } },
    ...STATUS.map((s) => h('option', { value: s.id }, t(s.label))),
  );
  statusSel.value = ui.status;
  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('enc.heading')),
    h('p', {}, t('enc.count', { n: all.filter((e) => e.learned).length, total: all.length })),
    h('div', { class: 'row' }, h('label', {}, t('enc.filterCategory'), ' ', categorySel), h('label', {}, t('enc.filterStatus'), ' ', statusSel)),
    h('div', { class: 'grid-2' }, ...list.map(card)),
    button(t('common.back'), () => store.back()),
  );
};
```

- [ ] **Step 5: Implementar `src/ui-dom/screens/HistoryScreen.ts`**

```ts
import { ATTR_NAMES } from '../../game/attributes';
import type { HistoryEntry, RunResult } from '../../game/meta/meta';
import { ATTR_KEYS } from '../../game/types';
import { CLANS } from '../../data/clans';
import { ENEMIES } from '../../data/enemies';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { num, t, type I18nKey } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

const RESULT_LABEL: Record<RunResult, I18nKey> = {
  dead: 'hist.result.dead',
  victory: 'hist.result.victory',
  abandoned: 'hist.result.abandoned',
};

function details(e: HistoryEntry): HTMLElement {
  const s = e.snapshot;
  const gear = [s.equipment.weapon, s.equipment.armor].filter((x): x is string => !!x).map((id) => ITEMS[id]?.name ?? id);
  return h(
    'div',
    { class: 'grid-2' },
    h(
      'div',
      {},
      h('h3', {}, t('hist.attrs')),
      h('table', {}, ...ATTR_KEYS.map((k) => h('tr', {}, h('td', {}, ATTR_NAMES[k]), h('td', {}, String(s.baseAttrs[k]))))),
    ),
    h(
      'div',
      {},
      h('h3', {}, t('hist.jutsus')),
      h('ul', {}, ...s.learned.map((id) => h('li', {}, `${JUTSUS[id]?.name ?? id} +${s.mastery[id] ?? 0}`))),
      h('h3', {}, t('hist.equipment')),
      h('p', {}, gear.length ? gear.join(', ') : t('common.none')),
      h(
        'table',
        {},
        h('tr', {}, h('td', {}, t('runEnd.damageDealt')), h('td', {}, num(s.stats.damageDealt))),
        h('tr', {}, h('td', {}, t('runEnd.biggestHit')), h('td', {}, num(s.stats.biggestHit))),
        h('tr', {}, h('td', {}, t('runEnd.crits')), h('td', {}, String(s.stats.crits))),
        h('tr', {}, h('td', {}, t('runEnd.turns')), h('td', {}, String(s.stats.turns))),
      ),
    ),
  );
}

/** Histórico de Runs (spec §9; DD v2 §16) + totais vitalícios. */
export const HistoryScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const meta = store.state.meta;
  const ui = ctx.local('ui', () => ({ open: null as string | null }));
  const life = meta.lifetime;
  const bosses = Object.entries(life.bossesDefeated).map(([id, n]) => `${ENEMIES[id]?.name ?? id} ×${n}`);
  const grades = Object.entries(life.defeatedByGrade).map(([g, n]) => `${g}: ${n}`);
  const entries = meta.history.map((e) =>
    h(
      'div',
      { class: 'card' },
      h(
        'div',
        { class: 'row' },
        h('strong', {}, e.name),
        h('span', { class: 'badge' }, t(RESULT_LABEL[e.result])),
        h('span', { class: 'muted' }, new Date(e.date).toLocaleString('pt-BR')),
      ),
      h('p', {}, e.text),
      h(
        'p',
        { class: 'muted' },
        t('hist.line', { clan: CLANS[e.clan].name, element: t(`element.${e.affinity}`), level: e.level, rep: num(e.reputation), won: e.encountersWon }),
      ),
      button(t('hist.details'), () => {
        ui.open = ui.open === e.id ? null : e.id;
        ctx.rerender();
      }, { attrs: { 'data-history': e.id, 'aria-expanded': String(ui.open === e.id) } }),
      ui.open === e.id ? details(e) : null,
    ),
  );
  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('hist.heading')),
    h(
      'div',
      { class: 'panel' },
      h('p', {}, t('hist.lifetime', { runs: life.runs, wins: life.victories })),
      grades.length ? h('p', {}, t('hist.defeated', { list: grades.join(', ') })) : null,
      bosses.length ? h('p', {}, t('hist.bosses', { list: bosses.join(', ') })) : null,
    ),
    entries.length ? h('div', { class: 'screen' }, ...entries) : h('p', { class: 'muted' }, t('hist.empty')),
    button(t('common.back'), () => store.back()),
  );
};
```

- [ ] **Step 6: Implementar `src/ui-dom/screens/TitlesScreen.ts`**

```ts
import { TITLE_LIST } from '../../data/titles';
import { t } from '../../i18n/pt-BR';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';

/** Coleção de títulos (DD v2 §14): não conquistados aparecem como "???" com a dica. Ocultos (C14) não aparecem. */
export const TitlesScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const unlocked = new Set(store.state.meta.titlesUnlocked);
  const visible = TITLE_LIST.filter((ti) => !ti.hidden);
  return h(
    'div',
    { class: 'screen' },
    h('h1', {}, t('titles.heading')),
    h('p', {}, t('titles.count', { n: visible.filter((ti) => unlocked.has(ti.id)).length, total: visible.length })),
    h('p', { class: 'muted' }, t('titles.info')),
    h(
      'div',
      { class: 'grid-2' },
      ...visible.map((ti) =>
        unlocked.has(ti.id)
          ? h('div', { class: 'card' }, h('h3', {}, ti.name), h('span', { class: 'badge' }, t('titles.unlocked')), h('p', {}, ti.description))
          : h('div', { class: 'card muted' }, h('h3', {}, t('titles.locked')), h('p', {}, t('titles.hint', { desc: ti.description }))),
      ),
    ),
    button(t('common.back'), () => store.back()),
  );
};
```

- [ ] **Step 7: Registrar as três telas em `src/ui-dom/screens/index.ts`**

```ts
import { EncyclopediaScreen } from './EncyclopediaScreen';
import { HistoryScreen } from './HistoryScreen';
import { TitlesScreen } from './TitlesScreen';
```

No objeto `SCREENS`:

```ts
  encyclopedia: EncyclopediaScreen,
  history: HistoryScreen,
  titles: TitlesScreen,
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run tests/ui/meta-screens.test.ts && npm test && npx tsc --noEmit`
Expected: todos PASS. Atenção ao teste "bloqueados aparecem como ???": a **descrição** dos títulos bloqueados aparece como dica. Se a descrição de algum título visível citar "Colecionador" ou "Novo Chunin", o teste acusa — nesse caso o problema está no texto do dado, não na tela.

- [ ] **Step 9: Commit**

```bash
git add src/ui-dom/screens src/i18n/pt-BR.ts tests/ui/meta-screens.test.ts
git commit -m "feat: enciclopédia de jutsus, histórico de runs e coleção de títulos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 11: Batalha — fila de animação, HUD em DOM com atalhos, BattleScene/BootScene em Phaser

**Files:**
- Create: `src/scenes/animationQueue.ts`, `src/scenes/BootScene.ts`, `src/scenes/BattleScene.ts`, `src/scenes/createGame.ts`, `src/ui-dom/screens/BattleScreen.ts`
- Modify: `src/ui-dom/screens/index.ts`, `src/main.ts`, `src/i18n/pt-BR.ts`
- Test: `tests/ui/animation.test.ts`, `tests/ui/battle-hud.test.ts`

**Interfaces:**
- Consumes: `GameStore.onBattleEvents`, `animationsDone`, `act`, `go`, `state.battleSnapshot`, `state.battleLog`, `state.locked` (Tasks 4–5); `getPlayer`, `getEnemy` (Plano 1); `type Action`, `type BattleState`, `type Combatant`, `type GameEvent`; `REFORCO_ATTRS`, `EFFECTS`, `ITEMS`, `JUTSUS`, `ATTR_NAMES`; `combatantView`, `jutsuButtons` (Task 2); `h`, `button`, `bar`, `ScreenCtx`, `KeyHandler`, `BattleView`, `App.gameLayer`, `App.setBattleView` (Task 6).
- Produces:
  - (animationQueue.ts) `interface AnimStep { event: GameEvent; durationMs: number }`, `DURATIONS: Partial<Record<GameEvent['type'], number>>`, `stepsFor(events: GameEvent[], enemyDelayMs?: number): AnimStep[]`, `class AnimationQueue { constructor(play: (s: AnimStep) => Promise<void>, onIdle: () => void); enqueue(events: GameEvent[]): void; get busy(): boolean }`
  - (createGame.ts) `createGame(parent: HTMLElement, store: GameStore): BattleView`
  - `BattleScreen: ScreenRenderer`, `battleKeys: KeyHandler`. Seletores: `[data-side=player|enemy]`, `[data-action=attack|defend|meditate|item|transform]`, `[data-jutsu=<id>]`, `[data-sheet]`.
- Regras da batalha na interface (spec §10): entrada travada durante as animações (`store.state.locked`); atraso curto no turno do inimigo (`enemyDelayMs`, 350 ms); clicar num jutsu (ou apertar 1–4) **seleciona** e mostra a descrição; clicar de novo (ou a mesma tecla, ou Enter) confirma. A, D, M e T agem direto.

- [ ] **Step 1: Acrescentar as chaves ao `PT_BR`**

```ts
  'battle.yourTurn': 'Seu turno',
  'battle.enemyTurn': 'Turno do inimigo',
  'battle.resolving': 'Resolvendo…',
  'battle.onlyKai': 'Sob Ilusão: só Kai pode ser usado',
  'battle.ended': 'Fim da batalha',
  'battle.grade': 'Grau {g}',
  'battle.sheet': 'Ficha',
  'battle.attack': '[A] Atacar',
  'battle.defend': '[D] Defender',
  'battle.meditate': '[M] Meditar',
  'battle.item': '[I] Item',
  'battle.transformOn': '[T] Ativar {form}',
  'battle.transformOff': '[T] Desativar {form}',
  'battle.jutsu': '[{key}] {name} — {cost} chakra · +{mastery}',
  'battle.use': 'Usar (Enter)',
  'battle.noItems': 'Nenhum consumível no inventário.',
  'battle.itemEntry': '{name} ({n})',
  'battle.reforcoPick': 'Reforçar qual atributo?',
  'battle.reforcoAttr': '+10% {attr}',
  'fx.crit': 'CRÍTICO!',
  'fx.dodge': 'ESQUIVOU',
  'fx.miss': 'ERROU',
  'fx.negated': 'ANULADO',
  'notice.noCanvas': 'Não foi possível iniciar as animações da batalha; o jogo segue sem elas.',
```

- [ ] **Step 2: Escrever o teste que falha — `tests/ui/animation.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import type { GameEvent } from '../../src/game/events';
import { AnimationQueue, DURATIONS, stepsFor } from '../../src/scenes/animationQueue';

const start: GameEvent = { type: 'battleStart', playerId: 'player', enemyId: 'enemy:bandido' };
const hit: GameEvent = { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 10, crit: false, elementMult: 1, jutsuId: null, hpAfter: 20 };
const dodge: GameEvent = { type: 'dodge', sourceId: 'enemy:bandido', targetId: 'player' };
const turn: GameEvent = { type: 'turnStart', actorId: 'player', round: 1 };

describe('stepsFor', () => {
  it('ignora eventos sem animação e atrasa o início do turno do inimigo', () => {
    const steps = stepsFor(
      [turn, { type: 'actionChosen', actorId: 'enemy:bandido', action: { type: 'attack' } }, { type: 'actionChosen', actorId: 'player', action: { type: 'attack' } }],
      300,
    );
    expect(steps).toHaveLength(2);
    expect(steps[0]!.durationMs).toBe(DURATIONS.actionChosen! + 300);
    expect(steps[1]!.durationMs).toBe(DURATIONS.actionChosen!);
  });
});

describe('AnimationQueue', () => {
  it('toca em ordem, aceita eventos novos no meio e avisa UMA vez ao esvaziar', async () => {
    const played: string[] = [];
    let idle = 0;
    const q = new AnimationQueue(async (s) => {
      played.push(s.event.type);
    }, () => idle++);
    q.enqueue([start, hit]);
    expect(q.busy).toBe(true);
    q.enqueue([dodge]);
    await vi.waitFor(() => expect(idle).toBe(1));
    expect(played).toEqual(['battleStart', 'damage', 'dodge']);
    expect(q.busy).toBe(false);
  });

  it('lote sem nada para animar libera na hora', () => {
    let idle = 0;
    const q = new AnimationQueue(async () => {}, () => idle++);
    q.enqueue([turn]);
    expect(idle).toBe(1);
  });

  it('uma animação que falha não trava a fila', async () => {
    const played: string[] = [];
    let idle = 0;
    const q = new AnimationQueue(async (s) => {
      played.push(s.event.type);
      if (s.event.type === 'battleStart') throw new Error('textura faltando');
    }, () => idle++);
    q.enqueue([start, hit]);
    await vi.waitFor(() => expect(idle).toBe(1));
    expect(played).toEqual(['battleStart', 'damage']);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/ui/animation.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/scenes/animationQueue"`.

- [ ] **Step 4: Implementar `src/scenes/animationQueue.ts`**

```ts
import type { GameEvent } from '../game/events';

/**
 * Fila de animações, SEM Phaser (testável). A BattleScene só fornece a função
 * `play`; a fila garante ordem, aceita eventos novos no meio e chama `onIdle`
 * (→ store.animationsDone) exatamente uma vez quando esvazia.
 */
export interface AnimStep {
  event: GameEvent;
  durationMs: number;
}

/** Duração de cada tipo de evento animado. Ausente = não anima. */
export const DURATIONS: Partial<Record<GameEvent['type'], number>> = {
  battleStart: 400,
  actionChosen: 250,
  jutsuUsed: 350,
  damage: 450,
  dodge: 400,
  miss: 400,
  negated: 400,
  dot: 350,
  heal: 350,
  defend: 250,
  meditate: 250,
  itemUsed: 300,
  effectApplied: 250,
  effectExpired: 150,
  controlledSkip: 350,
  transformOn: 450,
  transformOff: 300,
  defeated: 600,
  battleEnd: 500,
};

/** Converte eventos em passos. O início do turno do inimigo ganha um atraso curto (spec §10). */
export function stepsFor(events: GameEvent[], enemyDelayMs = 350): AnimStep[] {
  const steps: AnimStep[] = [];
  for (const e of events) {
    const d = DURATIONS[e.type];
    if (d === undefined) continue;
    const enemyTurn = e.type === 'actionChosen' && e.actorId !== 'player';
    steps.push({ event: e, durationMs: d + (enemyTurn ? enemyDelayMs : 0) });
  }
  return steps;
}

export class AnimationQueue {
  private queue: AnimStep[] = [];
  private running = false;

  constructor(
    private readonly play: (step: AnimStep) => Promise<void>,
    private readonly onIdle: () => void,
  ) {}

  get busy(): boolean {
    return this.running;
  }

  enqueue(events: GameEvent[]): void {
    this.queue.push(...stepsFor(events));
    if (!this.running) void this.run();
  }

  private async run(): Promise<void> {
    this.running = true;
    try {
      while (this.queue.length) {
        const step = this.queue.shift() as AnimStep;
        try {
          await this.play(step);
        } catch {
          // Uma animação quebrada nunca pode travar a entrada do jogador.
        }
      }
    } finally {
      this.running = false;
      this.onIdle();
    }
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/ui/animation.test.ts`
Expected: 4 testes PASS.

- [ ] **Step 6: Escrever o teste que falha — `tests/ui/battle-hud.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import type { RunState } from '../../src/game/run/types';
import { JUTSUS } from '../../src/data/jutsus';
import { click, mount, press } from './appHelpers';
import { scenario, strong } from './memoryStore';

function battle(patch?: (run: RunState) => void) {
  const { store } = scenario(patch);
  const root = mount(store);
  store.fight();
  return { store, root };
}

const log = (root: ParentNode) => root.querySelector('.battle-log')?.textContent ?? '';

describe('HUD de batalha', () => {
  it('mostra os dois lados com vitais, Poder Ninja e indicador de turno', () => {
    const { store, root } = battle();
    const enemy = store.state.run!.battle!.combatants.find((c) => c.side === 'enemy')!;
    expect(root.querySelector('[data-side=player]')?.textContent).toContain('Kenji');
    expect(root.querySelector('[data-side=enemy]')?.textContent).toContain(enemy.name);
    expect(root.textContent).toContain('Poder Ninja');
    expect(root.textContent).toContain('Seu turno');
  });

  it('atalho D defende', () => {
    const { root } = battle();
    press('d');
    expect(log(root)).toContain('Kenji se defende');
  });

  it('1 seleciona e mostra a descrição; 1 de novo usa o jutsu', () => {
    const { root } = battle();
    press('1');
    expect(root.textContent).toContain(JUTSUS['henge']!.description);
    expect(log(root)).not.toContain('usa Henge');
    press('1');
    expect(log(root)).toContain('Kenji usa Henge no Jutsu');
  });

  it('Item lista os consumíveis e usa o Kit médico', () => {
    const { root } = battle((run) => {
      run.character.inventory['kit_medico'] = 1;
      run.character.hp = 40;
    });
    (root.querySelector('[data-action=item]') as HTMLButtonElement).click();
    click(root, 'Kit médico (1)');
    expect(log(root)).toContain('Kenji usa Kit médico');
  });

  it('Pergaminho de Reforço pede o atributo', () => {
    const { root } = battle((run) => {
      run.character.inventory['pergaminho_reforco'] = 1;
    });
    press('i');
    click(root, 'Pergaminho de Reforço (1)');
    expect(root.textContent).toContain('Reforçar qual atributo?');
    click(root, '+10% Ninjutsu');
    expect(log(root)).toContain('Kenji usa Pergaminho de Reforço');
  });

  it('durante a animação: botões desabilitados e teclas ignoradas (Review Focus 2)', () => {
    const { store } = scenario();
    const root = mount(store);
    store.onBattleEvents(() => {});
    store.fight();
    expect(store.state.locked).toBe(true);
    expect((root.querySelector('[data-action=attack]') as HTMLButtonElement).disabled).toBe(true);
    const run = store.state.run;
    press('a');
    press('a');
    expect(store.state.run).toBe(run);
    expect(root.textContent).toContain('Resolvendo');
  });

  it('Uchiha: T liga o Sharingan sem gastar o turno', () => {
    const { root } = battle((run) => {
      run.character.clan = 'uchiha';
      run.character.affinity = 'fogo';
    });
    expect(root.querySelector('[data-action=transform]')).not.toBeNull();
    press('t');
    expect(log(root)).toContain('Kenji ativa Sharingan');
    expect(root.textContent).toContain('Seu turno');
    expect(root.querySelector('[data-side=player] .effects')?.textContent).toContain('Sharingan ∞');
  });

  it('Ficha abre durante a batalha e Voltar retorna à luta', () => {
    const { store, root } = battle();
    (root.querySelector('[data-sheet]') as HTMLButtonElement).click();
    expect(store.state.screen).toBe('sheet');
    click(root, 'Voltar');
    expect(store.state.screen).toBe('battle');
  });

  it('vitória pelo teclado leva à tela de Resultado', () => {
    const { store } = battle(strong);
    let guard = 0;
    while (store.state.run?.phase === 'battle' && guard++ < 200) press('a');
    expect(store.state.screen).toBe('result');
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx vitest run tests/ui/battle-hud.test.ts`
Expected: FAIL — `[data-side=player]` não encontrado (a tela ainda é "em construção").

- [ ] **Step 8: Implementar `src/ui-dom/screens/BattleScreen.ts`**

```ts
import { ATTR_NAMES } from '../../game/attributes';
import { getEnemy, getPlayer } from '../../game/combat/battle';
import type { Action, BattleState } from '../../game/combat/types';
import { EFFECTS, REFORCO_ATTRS } from '../../data/effects';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { pct, t } from '../../i18n/pt-BR';
import type { UiState } from '../../store/GameStore';
import { bar, button, h } from '../dom';
import type { KeyHandler, ScreenCtx, ScreenRenderer } from '../types';
import { combatantView, jutsuButtons, type CombatantView } from '../view/derived';

interface BattleUi {
  selected: string | null;
  items: boolean;
  reforco: boolean;
}

const uiOf = (ctx: ScreenCtx) => ctx.local<BattleUi>('battle', () => ({ selected: null, items: false, reforco: false }));

/** Só dá para agir na batalha REAL (não no último quadro), na vez do jogador, sem animação rodando. */
function liveBattle(s: UiState): BattleState | null {
  const b = s.run?.battle;
  return b && !s.locked && b.status === 'awaitingInput' ? b : null;
}

function doAct(ctx: ScreenCtx, action: Action): void {
  const ui = uiOf(ctx);
  ui.selected = null;
  ui.items = false;
  ui.reforco = false;
  if (!ctx.store.act(action)) ctx.rerender();
}

function pickJutsu(ctx: ScreenCtx, id: string): void {
  const ui = uiOf(ctx);
  if (ui.selected === id) return doAct(ctx, { type: 'jutsu', jutsuId: id });
  ui.selected = id;
  ui.items = false;
  ui.reforco = false;
  ctx.rerender();
}

function fighterPanel(ctx: ScreenCtx, v: CombatantView, side: 'player' | 'enemy'): HTMLElement {
  return h(
    'div',
    { class: 'panel fighter', attrs: { 'data-side': side } },
    h(
      'div',
      { class: 'row' },
      h('strong', {}, v.name),
      h('span', {}, t('common.level', { n: v.level })),
      v.grade ? h('span', { class: 'badge' }, t('battle.grade', { g: v.grade })) : null,
      v.isBoss ? h('span', { class: 'badge' }, t('map.boss')) : null,
      side === 'player' ? button(t('battle.sheet'), () => ctx.store.go('sheet'), { attrs: { 'data-sheet': '' } }) : null,
    ),
    h('div', { class: 'muted' }, `${t('derived.power')}: ${v.power}`),
    bar('hp', v.hp, v.maxHp, t('header.hp')),
    bar('chakra', v.chakra, v.maxChakra, t('header.chakra')),
    h('div', { class: 'muted' }, `${t('derived.crit')}: ${pct(v.critPct)} · ${t('derived.reduction')}: ${pct(v.reductionPct)} · ${t('derived.dodge')}: ${pct(v.dodgePct)}`),
    h(
      'div',
      { class: 'effects' },
      ...v.effects.map((e) => h('span', { class: 'effect-chip', title: e.description }, `${e.name} ${e.sustained || e.remaining === null ? '∞' : e.remaining}`)),
    ),
  );
}

/** HUD da batalha (spec §10; DD v2 §13). O Phaser desenha a arena por baixo. */
export const BattleScreen: ScreenRenderer = (ctx) => {
  const s = ctx.store.state;
  const ui = uiOf(ctx);
  const battle = s.run?.battle ?? s.battleSnapshot;
  const live = liveBattle(s);

  const logEl = h('div', { class: 'battle-log', attrs: { role: 'log', 'aria-live': 'polite' } }, ...s.battleLog.slice(-80).map((l) => h('div', { class: `log-${l.kind}` }, l.text)));
  queueMicrotask(() => {
    logEl.scrollTop = logEl.scrollHeight;
  });
  if (!battle) return h('div', { class: 'battle-hud' }, logEl);

  const p = getPlayer(battle);
  const e = getEnemy(battle);
  const indicator = s.locked
    ? t('battle.resolving')
    : battle.status === 'awaitingInput'
      ? battle.onlyKai
        ? t('battle.onlyKai')
        : t('battle.yourTurn')
      : battle.status === 'ended'
        ? t('battle.ended')
        : t('battle.enemyTurn');

  const blockedBasic = !live || battle.onlyKai;
  const form = p.transformationId ? (EFFECTS[p.transformationId]?.name ?? p.transformationId) : '';
  const pv = combatantView(p, e);
  const basic = [
    button(t('battle.attack'), () => doAct(ctx, { type: 'attack' }), { disabled: blockedBasic, attrs: { 'data-action': 'attack' } }),
    button(t('battle.defend'), () => doAct(ctx, { type: 'defend' }), { disabled: blockedBasic, attrs: { 'data-action': 'defend' } }),
    button(t('battle.meditate'), () => doAct(ctx, { type: 'meditate' }), { disabled: blockedBasic, attrs: { 'data-action': 'meditate' } }),
    button(t('battle.item'), () => {
      ui.items = !ui.items;
      ui.reforco = false;
      ui.selected = null;
      ctx.rerender();
    }, { disabled: blockedBasic, attrs: { 'data-action': 'item' } }),
    p.transformationId
      ? button(pv.transformed ? t('battle.transformOff', { form }) : t('battle.transformOn', { form }), () => doAct(ctx, { type: 'transform' }), {
          disabled: blockedBasic || battle.transformToggled,
          attrs: { 'data-action': 'transform' },
        })
      : null,
  ];

  const jutsus = jutsuButtons(battle).map((j, i) =>
    button(t('battle.jutsu', { key: i + 1, name: j.name, cost: j.cost, mastery: j.mastery }), () => pickJutsu(ctx, j.id), {
      class: `jutsu ${ui.selected === j.id ? 'primary' : ''}`,
      disabled: !live || !j.affordable || !j.allowed,
      title: j.description,
      attrs: { 'data-jutsu': j.id },
    }),
  );

  const selected = ui.selected ? JUTSUS[ui.selected] : undefined;
  const details = selected
    ? h('div', { class: 'panel' }, h('strong', {}, selected.name), h('p', {}, selected.description), button(t('battle.use'), () => doAct(ctx, { type: 'jutsu', jutsuId: selected.id }), { primary: true, disabled: !live }))
    : null;

  const consumables = Object.entries(p.inventory).filter(([id, n]) => n > 0 && ITEMS[id]?.kind === 'consumable');
  const items = ui.items
    ? h(
        'div',
        { class: 'panel row' },
        ...(consumables.length
          ? consumables.map(([id, n]) =>
              button(t('battle.itemEntry', { name: ITEMS[id]!.name, n }), () => {
                if (ITEMS[id]!.buffAttr) {
                  ui.reforco = true;
                  return ctx.rerender();
                }
                doAct(ctx, { type: 'item', itemId: id });
              }, { disabled: !live }),
            )
          : [h('span', { class: 'muted' }, t('battle.noItems'))]),
      )
    : null;
  const reforco = ui.reforco
    ? h(
        'div',
        { class: 'panel row' },
        h('span', {}, t('battle.reforcoPick')),
        ...REFORCO_ATTRS.map((a) => button(t('battle.reforcoAttr', { attr: ATTR_NAMES[a] }), () => doAct(ctx, { type: 'item', itemId: 'pergaminho_reforco', attr: a }), { disabled: !live })),
      )
    : null;

  return h(
    'div',
    { class: 'battle-hud' },
    h(
      'div',
      { class: 'fighters' },
      fighterPanel(ctx, pv, 'player'),
      h('div', { class: 'panel turn-indicator', attrs: { 'aria-live': 'polite' } }, indicator),
      fighterPanel(ctx, combatantView(e, p), 'enemy'),
    ),
    h('div', {}),
    h('div', { class: 'grid-2' }, logEl, h('div', { class: 'screen' }, details, items, reforco, h('div', { class: 'action-bar' }, ...basic, ...jutsus))),
  );
};

const DIRECT: Record<string, Action> = {
  a: { type: 'attack' },
  d: { type: 'defend' },
  m: { type: 'meditate' },
  t: { type: 'transform' },
};

/** Atalhos (spec §10): 1–4 jutsus, A, D, M, I, T; Enter confirma o jutsu selecionado; Esc cancela. */
export const battleKeys: KeyHandler = (ctx, e) => {
  const battle = liveBattle(ctx.store.state);
  if (!battle) return;
  const ui = uiOf(ctx);
  const k = e.key.toLowerCase();
  const direct = DIRECT[k];
  if (direct) {
    if (k === 't' && !getPlayer(battle).transformationId) return;
    e.preventDefault();
    return doAct(ctx, direct);
  }
  if (k === 'i') {
    ui.items = !ui.items;
    ui.reforco = false;
    ui.selected = null;
    return ctx.rerender();
  }
  if (/^[1-4]$/.test(k)) {
    const id = getPlayer(battle).jutsus[Number(k) - 1];
    if (id) pickJutsu(ctx, id);
    return;
  }
  if (k === 'enter' && ui.selected) return doAct(ctx, { type: 'jutsu', jutsuId: ui.selected });
  if (k === 'escape') {
    ui.selected = null;
    ui.items = false;
    ui.reforco = false;
    ctx.rerender();
  }
};
```

- [ ] **Step 9: Registrar tela e atalhos em `src/ui-dom/screens/index.ts`**

```ts
import { BattleScreen, battleKeys } from './BattleScreen';
```

No objeto `SCREENS`, acrescentar `battle: BattleScreen,` e trocar a linha do `KEYS` por:

```ts
export const KEYS: Partial<Record<ScreenId, KeyHandler>> = { battle: battleKeys };
```

- [ ] **Step 10: Rodar e ver passar**

Run: `npx vitest run tests/ui/battle-hud.test.ts && npx tsc --noEmit`
Expected: 8 testes PASS. Se "1 seleciona..." falhar porque o inimigo agiu primeiro e o jogador não está em `awaitingInput`, isso não acontece: `fight()` só devolve o controle na vez do jogador ou com a luta encerrada. Se "Uchiha" falhar em "Sharingan ∞", confira se o efeito `sharingan` tem `duration: 'sustained'` no `src/data/effects.ts` real.

- [ ] **Step 11: Implementar `src/scenes/BootScene.ts`**

```ts
import Phaser from 'phaser';

/** Ponto de entrada do Phaser. Quando houver arte, o carregamento de assets entra aqui. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.scene.start('battle');
  }
}
```

- [ ] **Step 12: Implementar `src/scenes/BattleScene.ts`**

```ts
import Phaser from 'phaser';
import type { Combatant } from '../game/combat/types';
import type { GameEvent } from '../game/events';
import { EFFECTS } from '../data/effects';
import { JUTSUS } from '../data/jutsus';
import { t } from '../i18n/pt-BR';
import type { GameStore } from '../store/GameStore';
import { AnimationQueue, type AnimStep } from './animationQueue';

/** Cor do placeholder por elemento (nunca arte oficial: só formas e nomes). */
const ELEMENT_COLOR: Record<string, number> = {
  fogo: 0xe4572e,
  vento: 0x9bd17b,
  raio: 0xf2d04b,
  terra: 0xa47148,
  agua: 0x3f88c5,
  none: 0x8a8f9c,
};
const PLAYER_COLOR = 0x4f7cff;
const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';

interface Fighter {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  aura: Phaser.GameObjects.Arc;
  baseX: number;
  color: number;
}

/**
 * Arena da batalha. NÃO decide nada: só anima a lista de eventos que o store
 * publica e avisa `animationsDone()` quando a fila esvazia (spec §2).
 */
export class BattleScene extends Phaser.Scene {
  private queue!: AnimationQueue;
  private fighters = new Map<string, Fighter>();
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly store: GameStore) {
    super('battle');
  }

  create(): void {
    this.add.rectangle(640, 600, 1280, 240, 0x1d2a20);
    this.queue = new AnimationQueue((step) => this.play(step), () => this.store.animationsDone());
    this.unsubscribe = this.store.onBattleEvents((events) => {
      if (events.some((e) => e.type === 'battleStart')) this.resetFighters();
      this.queue.enqueue(events);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.resetFighters();
  }

  private combatants(): Combatant[] {
    const s = this.store.state;
    return (s.run?.battle ?? s.battleSnapshot)?.combatants ?? [];
  }

  private resetFighters(): void {
    for (const f of this.fighters.values()) f.container.destroy();
    this.fighters.clear();
    for (const c of this.combatants()) {
      const x = c.side === 'player' ? 400 : 880;
      const color = c.side === 'player' ? PLAYER_COLOR : (ELEMENT_COLOR[c.element ?? 'none'] ?? ELEMENT_COLOR['none']!);
      const aura = this.add.circle(0, 0, 115, 0xff2a2a, 0.22).setVisible(false);
      const body = this.add.rectangle(0, 0, 110, 170, color).setStrokeStyle(3, 0xffffff, 0.6);
      const label = this.add.text(0, -115, c.name, { fontFamily: FONT, fontSize: '20px', color: '#e8e6e1' }).setOrigin(0.5);
      const container = this.add.container(x, 430, [aura, body, label]);
      this.fighters.set(c.id, { container, body, aura, baseX: x, color });
    }
  }

  private play(step: AnimStep): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      this.time.delayedCall(step.durationMs, finish);
      // Garantia: com a aba em segundo plano o loop do Phaser pausa; a fila não pode travar a partida.
      window.setTimeout(finish, step.durationMs + 1000);
      this.animate(step.event);
    });
  }

  private animate(e: GameEvent): void {
    switch (e.type) {
      case 'actionChosen':
      case 'jutsuUsed':
        return this.lunge(e.actorId);
      case 'damage': {
        const element = e.jutsuId ? (JUTSUS[e.jutsuId]?.element ?? null) : null;
        this.flash(e.targetId, element ? (ELEMENT_COLOR[element] ?? 0xffffff) : 0xffffff);
        this.shake(e.targetId);
        return this.float(e.targetId, `-${e.amount}${e.crit ? ` ${t('fx.crit')}` : ''}`, e.crit ? '#ffd23f' : '#ff5a4f', e.crit ? 34 : 26);
      }
      case 'dot':
        return this.float(e.targetId, `-${e.amount}`, '#ff8c42', 22);
      case 'dodge':
        return this.float(e.targetId, t('fx.dodge'), '#cfd8dc', 26);
      case 'miss':
        return this.float(e.targetId, t('fx.miss'), '#cfd8dc', 26);
      case 'negated':
        return this.float(e.targetId, t('fx.negated'), '#b98ce8', 26);
      case 'heal':
        return this.float(e.targetId, `+${e.hp}`, '#59c98a', 26);
      case 'effectApplied':
        return this.float(e.targetId, EFFECTS[e.effectId]?.name ?? e.effectId, '#b98ce8', 18);
      case 'transformOn':
        return this.setAura(e.actorId, true);
      case 'transformOff':
        return this.setAura(e.actorId, false);
      case 'defeated': {
        const f = this.fighters.get(e.targetId);
        if (f) this.tweens.add({ targets: f.container, alpha: 0.25, duration: 500 });
        return;
      }
      default:
        return;
    }
  }

  private lunge(id: string): void {
    const f = this.fighters.get(id);
    if (!f) return;
    const dir = f.baseX < 640 ? 1 : -1;
    this.tweens.add({ targets: f.container, x: f.baseX + 40 * dir, duration: 120, yoyo: true, onComplete: () => f.container.setX(f.baseX) });
  }

  private shake(id: string): void {
    const f = this.fighters.get(id);
    if (!f) return;
    this.tweens.add({ targets: f.container, x: f.baseX + 8, duration: 40, yoyo: true, repeat: 3, onComplete: () => f.container.setX(f.baseX) });
  }

  private flash(id: string, color: number): void {
    const f = this.fighters.get(id);
    if (!f) return;
    f.body.setFillStyle(color);
    this.time.delayedCall(150, () => f.body.setFillStyle(f.color));
  }

  private float(id: string, text: string, color: string, size: number): void {
    const f = this.fighters.get(id);
    if (!f) return;
    const txt = this.add
      .text(f.container.x, f.container.y - 150, text, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5);
    this.tweens.add({ targets: txt, y: txt.y - 60, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  /** Aura e contorno vermelhos enquanto a transformação está ativa (spec §4.1 "Visual"). */
  private setAura(id: string, on: boolean): void {
    const f = this.fighters.get(id);
    if (!f) return;
    f.aura.setVisible(on);
    f.body.setStrokeStyle(3, on ? 0xff2a2a : 0xffffff, on ? 1 : 0.6);
  }
}
```

- [ ] **Step 13: Implementar `src/scenes/createGame.ts`**

```ts
import Phaser from 'phaser';
import type { GameStore } from '../store/GameStore';
import type { BattleView } from '../ui-dom/types';
import { BattleScene } from './BattleScene';
import { BootScene } from './BootScene';

/** Cria o Phaser dentro da camada do jogo. Fora da batalha o loop dorme (economiza CPU). */
export function createGame(parent: HTMLElement, store: GameStore): BattleView {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#12141a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new BootScene(), new BattleScene(store)],
  });
  return {
    show: () => {
      if (game.isBooted) game.loop.wake();
    },
    hide: () => {
      if (game.isBooted) game.loop.sleep();
    },
  };
}
```

- [ ] **Step 14: Ligar o Phaser em `src/main.ts`**

Acrescentar o import:

```ts
import { createGame } from './scenes/createGame';
```

E trocar as três últimas linhas (`app.mount();` até o fim) por:

```ts
app.mount();
try {
  app.setBattleView(createGame(app.gameLayer, store));
} catch {
  // Sem WebGL/canvas o jogo continua jogável: sem animador registrado, nada trava.
  store.notify('error', t('notice.noCanvas'));
}
store.boot();
if (!ok) store.notify('error', t('notice.storageUnavailable'));
```

- [ ] **Step 15: Rodar tudo e conferir no navegador**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: todos PASS; build gera `dist/` (aviso de chunk grande do Phaser é esperado).

Run: `npm run dev` e jogar:
1. Criar um Uchiha com o preset Ninjutsu → Lutar. Expected: dois retângulos com nomes; o painel do HUD por cima; "Seu turno".
2. Apertar `1` → descrição aparece; `1` de novo → o jutsu sai, número de dano sobe sobre o inimigo, a barra de HP desce, o log registra.
3. Apertar `T` → aura vermelha no jogador, chip "Sharingan ∞" no HUD, ainda "Seu turno".
4. Apertar `A` várias vezes rápido → só uma ação por vez (o indicador mostra "Resolvendo…" durante a animação).
5. Vencer → tela de Resultado só **depois** da última animação.
6. Recarregar a página no meio de uma luta → "Continuar run" volta ao mapa no mesmo encontro.
Ctrl+C.

- [ ] **Step 16: Commit**

```bash
git add src/scenes src/ui-dom/screens src/main.ts src/i18n/pt-BR.ts tests/ui/animation.test.ts tests/ui/battle-hud.test.ts
git commit -m "feat: batalha com HUD em DOM, atalhos de teclado e animações em Phaser

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Run completa de ponta a ponta (3 clãs), README e verificação final

**Files:**
- Create: `tests/ui/e2e.test.ts`, `README.md`
- Test: `tests/ui/e2e.test.ts`

**Interfaces:**
- Consumes: tudo das Tasks 4–11; `presetAllocation`, `type PresetId` (Task 2); `botAction` (Plano 1); `mount`, `click` (Task 6); `makeStore`, `scenario`, `strong` (Tasks 4–5).
- Produces: a prova automatizada do critério de pronto da spec §13 ("uma run completa jogável de ponta a ponta com os 3 caminhos de clã") e o `README.md` (spec §13, item 2).

- [ ] **Step 1: Escrever o teste — `tests/ui/e2e.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { presetAllocation, type PresetId } from '../../src/game/progression/presets';
import { botAction } from '../../src/game/sim/bot';
import type { GameStore } from '../../src/store/GameStore';
import { click, mount } from './appHelpers';
import { makeStore, scenario, strong } from './memoryStore';

/**
 * Joga uma run inteira pelos MESMOS comandos que a interface usa,
 * com o App montado (toda tela é desenhada a cada passo — um erro de
 * renderização em qualquer tela derruba o teste).
 */
function autoplay(store: GameStore, preset: PresetId): void {
  for (let guard = 0; guard < 6000 && store.hasActiveRun(); guard++) {
    const s = store.state;
    const run = s.run!;
    const c = run.character;
    if (s.swapQueue.length) {
      store.resolveSwap(null);
      continue;
    }
    switch (run.phase) {
      case 'camp':
        store.rest();
        break;
      case 'battle':
        store.act(botAction(run.battle!));
        break;
      case 'result': {
        const offer = run.pendingChoices[0];
        if (offer) {
          const o = offer[0]!;
          store.chooseReward(o, o === 'treino' ? c.equipped[0] : undefined);
        } else if (c.unspentPoints > 0) {
          store.allocate(presetAllocation(c.baseAttrs, c.unspentPoints, preset));
        } else {
          store.continueFromResult();
        }
        break;
      }
      case 'map':
        if (c.unspentPoints > 0) {
          store.allocate(presetAllocation(c.baseAttrs, c.unspentPoints, preset));
        } else {
          if (c.ryo >= 80 && (c.inventory['kit_medico'] ?? 0) < 2) store.buy('kit_medico');
          store.fight();
        }
        break;
      default:
        return;
    }
  }
}

const CASES: [string, string, PresetId][] = [
  ['Uchiha', 'fogo', 'ninjutsu'],
  ['Uzumaki', 'vento', 'ninjutsu'],
  ['Sem clã', 'terra', 'taijutsu'],
];

describe('run completa pela interface (spec §13: critério de pronto)', () => {
  it.each(CASES)('%s: criação pela tela, run até o fim, Histórico gravado', (clanLabel, affinity, preset) => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    click(root, 'Modo História');
    const name = root.querySelector('input[name=name]') as HTMLInputElement;
    name.value = 'Teste';
    name.dispatchEvent(new Event('input'));
    click(root, clanLabel);
    const aff = root.querySelector('select[name=affinity]') as HTMLSelectElement;
    if (!aff.disabled) {
      aff.value = affinity;
      aff.dispatchEvent(new Event('change'));
    }
    (root.querySelector(`[data-preset=${preset}]`) as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.screen).toBe('map');

    autoplay(store, preset);

    expect(store.hasActiveRun()).toBe(false);
    expect(store.state.fatalError).toBeNull();
    expect(store.state.screen).toBe('runEnd');
    expect(store.state.meta.history).toHaveLength(1);
    expect(store.state.notices.filter((n) => n.text.startsWith('Erro inesperado'))).toEqual([]);
    expect(root.textContent).toContain(store.state.runEnd!.text);
    click(root, 'Voltar ao menu');
    expect(store.state.screen).toBe('menu');
  }, 120_000);

  it('build forte conclui a saga e registra a vitória', () => {
    const { store } = scenario(strong);
    mount(store);
    autoplay(store, 'ninjutsu');
    expect(store.state.runEnd?.result).toBe('victory');
    expect(store.state.runEnd?.text).toContain('Concluiu a Saga da Onda');
    expect(store.state.meta.lifetime.victories).toBe(1);
    expect(store.state.meta.titlesUnlocked).toContain('demonio_da_nevoa');
  }, 120_000);
});
```

- [ ] **Step 2: Rodar**

Run: `npx vitest run tests/ui/e2e.test.ts`
Expected: 4 testes PASS, em menos de ~60 s no total. Se algum clã ficar preso (o `guard` esgota com `hasActiveRun()` ainda `true`), imprima `store.state.run.phase` e `store.state.notices` no teste: um aviso repetido mostra qual comando o motor está recusando — corrija a tela/store, não o robô. Se "build forte conclui a saga" terminar em derrota, o Plano 1 deixou Haku mais forte que o esperado: suba `emptyAttributes(40)` para `emptyAttributes(60)` no helper `strong` (o objetivo do teste é provar o caminho de vitória, não medir balanceamento).

- [ ] **Step 3: Criar `README.md`**

````markdown
# NarutoTxGame — MVP (Saga da Onda)

Roguelite de ninjas por turnos, **single player e 100% local no navegador**. Este MVP cobre a Saga da Onda completa: 26 encontros, Zabuza e Haku, três caminhos de clã (Uchiha, Uzumaki e Sem clã), loja, maestria, títulos, Enciclopédia e Histórico de Runs.

> Projeto de fã, sem fins comerciais. Não usa nenhuma arte oficial: todos os personagens são placeholders (formas e nomes).

## Como executar

Requisitos: Node 22+ e npm.

```bash
npm install
npm run dev        # abre o jogo (Vite) — use uma janela com 1024px de largura ou mais
npm test           # testes (motor + interface)
npm run sim        # simulador de balanceamento: 3000 runs × 8 builds, imprime a tabela
npm run sim:check  # falha se alguma meta de balanceamento sair da faixa
npm run build      # gera dist/ estático (abre com qualquer servidor estático)
npm run preview    # serve o dist/ localmente
```

## Controles na batalha

| Tecla | Ação |
|---|---|
| `1`–`4` | Seleciona o jutsu do slot (mostra a descrição); a mesma tecla de novo ou `Enter` usa |
| `A` | Atacar |
| `D` | Defender |
| `M` | Meditar |
| `I` | Abre os itens |
| `T` | Liga/desliga a transformação (Uchiha: Sharingan; não gasta o turno) |
| `Esc` | Cancela a seleção |

## Save

O progresso fica no `localStorage` do navegador:

- `nxr.run.v1` — a run em andamento (salva no fim de cada encontro, no Acampamento e a cada compra/troca na Preparação). Recarregar no meio de uma luta volta ao início daquele encontro, com o mesmo sorteio.
- `nxr.meta.v1` — Enciclopédia, títulos, estatísticas e Histórico.

Save inválido não quebra o jogo: ele é copiado para `nxr.<tipo>.corrupt.<data>` e o jogo segue limpo. Para recomeçar do zero, apague as chaves `nxr.*` no DevTools (Application → Local Storage).

## Estrutura

```
src/game/      motor puro (regras, run, meta, save, simulador) — sem Phaser/DOM
src/data/      jutsus, clãs, itens, inimigos, saga, títulos (validados com Zod no boot)
src/store/     GameStore: única fonte da verdade da aplicação
src/ui-dom/    telas em HTML/CSS (uma por arquivo) e lógica de tela testável (view/)
src/scenes/    Phaser: só desenha a arena e anima os eventos do motor
src/i18n/      todas as strings de interface (pt-BR)
tools/         simulador de linha de comando
tests/         Vitest (motor em tests/, interface em tests/ui/)
```

## O que ficou de fora do MVP (e por quê)

| Item | Motivo |
|---|---|
| Online, PvP, servidor, cronômetro de turno | Decisão de projeto: jogo 100% local |
| Modo Infinito | Aparece no menu como "em breve" |
| Promoção a Chunin/Jounin, slots 6/8, 2ª afinidade, Raio, Chidori | Dependem da Saga do Exame Chunin (Fase 2) |
| Clãs Hyuuga, Nara, Akimichi, Aburame; Sharingan tomoe 2/3 | Fase 2 (o contador de turnos do Sharingan já é salvo) |
| Livro Bingo, rival, Pontos de Legado, cosméticos, desbloqueio de clãs | Fase 2 (meta-progressão completa) |
| Eventos entre encontros (loja ambulante, treino, descanso) | Só a escolha 1-de-3 ao subir de nível entrou |
| Aba Registro de Batalha e tela de equipamento com silhueta | As estatísticas aparecem de forma simples no Histórico e no fim da run |
| Tempo de run na Ficha | Não pedido pela spec do MVP; o Histórico guarda a data |
| Sprites, áudio, layout mobile (< 1024px) | Sem arte oficial; foco no núcleo do jogo |

Detalhes de regras e decisões: `docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md`.
````

- [ ] **Step 4: Verificação final completa**

Run: `npm test && npx tsc --noEmit && npm run sim:check && npm run build`
Expected: todos os testes PASS; `tsc` sem saída; `sim:check` sem metas fora da faixa; `dist/` gerado.

Run: `npm run preview` e, na URL mostrada, repetir o roteiro da Task 11 (Step 15) também com **Uzumaki** e **Sem clã**, e conferir:
- Menu → Enciclopédia, Histórico e Títulos abrem e voltam.
- Uma run inteira até Haku (ou até morrer) termina na tela de fim de run, e a entrada aparece no Histórico.
- Com a janela em 1024px de largura, nada fica cortado e não há rolagem horizontal.
Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add tests/ui/e2e.test.ts README.md
git commit -m "test: run completa pela interface nos 3 clãs; docs: README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Cobertura da spec (autoverificação)

| Spec | Task(s) |
|---|---|
| §2 Stack (Vite + TS + Phaser; Phaser só na batalha, resto em DOM) | 1, 6, 11 |
| §2 `GameStore` única fonte da verdade; fluxo UI → store → motor → eventos → cena → DOM | 4, 5, 11 |
| §2 `i18n/pt-BR.ts`, `scenes/BootScene` e `BattleScene`, `ui-dom/` uma tela por arquivo | 1, 6–11 |
| §3 C9 presets na criação e "Distribuir pelo preset" no level-up | 2, 7, 8, 9 |
| §3 C10 Meditar na barra de batalha | 11 |
| §3 C11 "grau" em item e inimigo | 8 (badge de grau), 9 (loja), 11 (HUD) |
| §3 C12 escolha 1-de-3 sem jutsus | 8 (as opções vêm do motor) |
| §3 C13 sob Ilusão só Kai | 2 (`allowed`), 11 (botões e indicador) |
| §3 C14 títulos ocultos | 10 |
| §4.1 Sharingan: não gasta turno, aura vermelha, ícone ∞ | 11 |
| §5 aprender com os 4 slots cheios abre a tela de troca | 4, 5, 9 |
| §7 mapa com 26 nós, Acampamento, bifurcação de elite | 8 |
| §8 loja, equipamento, Pergaminho Raro, troca só fora de batalha | 9 |
| §9 Enciclopédia, Histórico (texto + snapshot), Títulos | 10 |
| §10 telas: Menu, Criação, Mapa, Resultado, Preparação, Ficha, Enciclopédia, Histórico, Títulos, Erro | 6–10 |
| §10 batalha: painéis, log colorido + texto, barra de ações, trava, atraso do inimigo, atalhos | 3, 11 |
| §10 nenhuma informação só por cor; desktop ≥ 1024px; placeholders | 1, 3, 9, 11, 12 |
| §11 save (`nxr.run.v1`, `nxr.meta.v1`), momentos de save, morte apaga a run, save inválido | 4, 5 |
| §12 Zod no boot → tela de erro; `RuleError` vira aviso | 4, 6 |
| §13 `npm run dev`, run completa nos 3 clãs, `npm test`/`sim:check` verdes, `npm run build` | 11, 12 |
| §13 README com como executar e o que ficou de fora | 12 |
| §13 ANALISE.md, curso, DESIGN v3 | **Plano 3** |

**Fora deste plano, de propósito:** o Plano 3 escreve `docs/ANALISE.md`, o curso em `docs/curso/` e o `docs/DESIGN.md` v3 a partir do código real e dos números finais do simulador.

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
      this.fail(t('notice.unexpected', { msg: (e as Error).message ?? String(e) }));
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
    let finalMeta = meta;
    if (run && (run.phase === 'dead' || run.phase === 'victory')) {
      // Run encerrada cuja meta não chegou a ser gravada: refinaliza (idempotente).
      try {
        finalMeta = recordRunEnd(meta, run, run.phase, now).meta;
      } catch (e) {
        this.fail(t('notice.unexpected', { msg: (e as Error).message ?? String(e) }));
        return;
      }
      this.set({ notices });
      this.finalizeStorage(finalMeta, run);
      notices.splice(0, notices.length, ...this.s.notices);
      run = null;
    }
    this.set({ screen: 'menu', history: [], meta: finalMeta, run, notices });
  }

  // ------------------------------------------------------------ navegação

  go(screen: ScreenId): void {
    if (this.navBlocked() || screen === this.s.screen) return;
    this.set({ history: [...this.s.history, this.s.screen], screen });
  }

  back(): void {
    if (this.navBlocked()) return;
    const history = [...this.s.history];
    const prev = history.pop();
    const fallback: ScreenId = this.hasActiveRun() && this.s.run ? screenForRun(this.s.run) : 'menu';
    this.set({ history, screen: prev ?? fallback });
  }

  toMenu(): void {
    if (this.navBlocked()) return;
    this.deferredNav = false;
    this.set({
      locked: false,
      swapQueue: [],
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
    this.deferredNav = false;
    this.set({ run, locked: false, screen: screenForRun(run), history: [], battleLog: [], swapQueue: [], runEnd: null, battleSnapshot: null });
  }

  abandonRun(): void {
    const run = this.s.run;
    if (this.s.locked || !run || !this.hasActiveRun()) return;
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
    if (this.s.locked || !jutsuId) return;
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

  /** Durante a animação da batalha a navegação espera (spec §10). */
  private navBlocked(): boolean {
    return this.s.locked && this.s.screen === 'battle';
  }

  private set(patch: Partial<UiState>): void {
    this.s = { ...this.s, ...patch };
    for (const fn of Array.from(this.listeners)) {
      try {
        fn(this.s);
      } catch (e) {
        this.fail(t('notice.unexpected', { msg: (e as Error).message ?? String(e) }));
        return;
      }
    }
  }

  private failing = false;

  /** Erro fatal: vai para a ErrorScreen e solta qualquer trava de animação. */
  fail(message: string): void {
    this.deferredNav = false;
    if (this.failing) return;
    this.failing = true;
    try {
      this.set({ screen: 'error', fatalError: message, locked: false });
    } finally {
      this.failing = false;
    }
  }

  private mkNotice(kind: Notice['kind'], text: string): Notice {
    return { id: this.nextNoticeId++, kind, text };
  }

  private handleError(e: unknown): void {
    if (e instanceof RuleError) return this.notify('error', e.message);
    this.fail(t('notice.unexpected', { msg: (e as Error).message ?? String(e) }));
  }

  private persist(run: RunState): void {
    try {
      saveRun(this.deps.storage, run);
    } catch {
      this.warnSaveFailed();
    }
  }

  /** Em método à parte para o TS não estreitar `this.s.screen` entre as chamadas a `set()`. */
  private isError(): boolean {
    return this.s.screen === 'error';
  }

  private warnSaveFailed(): void {
    const text = t('notice.saveFailed');
    if (!this.s.notices.some((n) => n.text === text)) this.notify('error', text);
  }

  /** Fecha a run na meta e apaga o save — no MESMO comando que a encerrou (Review Focus 3). */
  private recordEnd(run: RunState, result: RunResult): { meta: MetaState; info: RunEndInfo } {
    const { meta, newTitles } = recordRunEnd(this.s.meta, run, result, this.deps.now());
    this.finalizeStorage(meta, run);
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

  /** Grava a meta e, só se isso der certo, apaga a run (dois try separados). */
  private finalizeStorage(meta: MetaState, run: RunState): void {
    let metaSaved = true;
    try {
      saveMeta(this.deps.storage, meta);
    } catch {
      metaSaved = false;
      this.warnSaveFailed();
    }
    if (metaSaved) {
      try {
        deleteRun(this.deps.storage);
      } catch {
        this.warnSaveFailed();
      }
    } else {
      // A meta não foi gravada: guarda a run encerrada para o boot refinalizar.
      this.persist(run);
    }
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
      try {
        const rec = this.recordEnd(run, run.phase === 'dead' ? 'dead' : 'victory');
        meta = rec.meta;
        runEnd = rec.info;
      } catch (e) {
        this.handleError(e);
        return false;
      }
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
      // Se o render do passo acima já levou o jogo à tela de erro, ela não pode ser sobrescrita.
      if (this.isError()) return true;
      // A batalha precisa estar na tela para ser animada; sair dela espera a animação.
      if (this.s.screen !== 'battle') this.set({ screen: 'battle', history: [] });
      if (this.isError()) return true;
      this.deferredNav = run.phase !== 'battle';
      let failed = false;
      for (const fnA of Array.from(this.animators)) {
        try {
          fnA(events);
        } catch (e) {
          failed = true;
          this.notify('error', t('notice.unexpected', { msg: (e as Error).message ?? String(e) }));
        }
      }
      // Animação quebrada não pode prender o jogador: solta a trava e aplica a navegação adiada.
      if (failed) this.animationsDone();
    } else if (run.phase !== before.phase) {
      this.set({ screen: screenForRun(run), history: [] });
    }
    return true;
  }
}

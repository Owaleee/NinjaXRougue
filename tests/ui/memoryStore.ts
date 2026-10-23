import { GameStore, type StoreDeps } from '../../src/store/GameStore';
import type { RunState } from '../../src/game/run/types';
import { RUN_KEY, type KeyValueStore } from '../../src/game/save/save';
import { emptyAttributes } from '../../src/game/attributes';
import { characterMaxChakra, characterMaxHp, type CreateParams } from '../../src/game/progression/character';
import { botAction } from '../../src/game/sim/bot';

/** localStorage de mentira. `failWrites` simula cota estourada / modo privado. */
export class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  failWrites = false;
  /** Falha a escrita só nestas chaves (ex.: só a meta). */
  failKeys = new Set<string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites || this.failKeys.has(key)) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

let nextSeedBase = 1;

/** Zera o contador de sementes (a 1ª instância de cada teste volta a usar a semente 1). */
export function resetSeedBase(): void {
  nextSeedBase = 1;
}

export function makeStore(storage: MemoryStore = new MemoryStore(), extra: Partial<StoreDeps> = {}): GameStore {
  let clock = 1_700_000_000_000;
  // Semente inicial distinta por instância: dois stores no mesmo storage não colidem no id da run da meta.
  let seed = nextSeedBase;
  nextSeedBase += 1000;
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

export function strong(run: RunState): void {
  run.character.baseAttrs = emptyAttributes(40);
  run.character.hp = characterMaxHp(run.character);
  run.character.chakra = characterMaxChakra(run.character);
}

/** Cria a run, aplica o patch no save e devolve um store "recarregado" já no mapa. */
export function scenario(patch?: (run: RunState) => void, params: CreateParams = PARAMS): { store: GameStore; storage: MemoryStore } {
  const storage = new MemoryStore();
  const a = makeStore(storage);
  a.boot();
  a.startNewRun(params);
  if (patch) patchRun(storage, patch);
  const store = makeStore(storage);
  store.boot();
  store.continueRun();
  return { store, storage };
}

/** Joga a batalha com o robô do simulador, liberando a trava se houver animador. */
export function playBattle(store: GameStore): void {
  let guard = 0;
  let jd = false;
  while (store.state.run?.phase === 'battle' && guard++ < 500) {
    if (store.state.locked) store.animationsDone();
    const b = store.state.run.battle!;
    const a = botAction(b, jd);
    jd = a.type === 'defend';
    store.act(a);
  }
}

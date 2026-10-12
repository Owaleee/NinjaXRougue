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
 * - Leitura (`loadRun`/`loadMeta`) nunca lança, mesmo com armazenamento bloqueado ou cheio.
 * - Escrita (`saveRun`/`saveMeta`) lança em falha; quem chama (GameStore) captura.
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

/**
 * Esquema mínimo: garante o que o jogo precisa para não quebrar ao carregar.
 * As regras extras (superRefine) rejeitam saves que carregam mas quebram depois.
 */
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
  .passthrough()
  .superRefine((r, ctx) => {
    // Na vitória o índice fica em nodes.length (todos os nós concluídos); nas demais fases precisa ser um nó real.
    const limit = r.phase === 'victory' ? r.nodes.length : r.nodes.length - 1;
    if (r.nodeIndex > limit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `nodeIndex ${r.nodeIndex} fora dos ${r.nodes.length} nós` });
    }
    if (r.phase === 'battle' && !r.encounterStart) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'batalha sem início de encontro' });
    }
  });

const MetaShape = z
  .object({
    version: z.literal(1),
    learnedEver: z.array(z.string()),
    masteredEver: z.array(z.string()),
    titlesUnlocked: z.array(z.string()),
    lifetime: z
      .object({
        runs: z.number(),
        victories: z.number(),
        defeatedByGrade: z.record(z.string(), z.number()),
        bossesDefeated: z.record(z.string(), z.number()),
      })
      .passthrough(),
    // Opcional: metas antigas não tinham o campo; o load normaliza para null (sem bump de versão).
    lastRecordedRunId: z.string().nullable().optional(),
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

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Guarda o save ilegível em `backupKey` e remove `key`. Nunca lança: se o backup
 * falhar, tenta remover mesmo assim. Devolve se a cópia foi guardada.
 */
function quarantine(store: KeyValueStore, backupKey: string, key: string, raw: string): boolean {
  let kept = true;
  try {
    store.setItem(backupKey, raw);
  } catch {
    kept = false;
  }
  try {
    store.removeItem(key);
  } catch {
    // Sem remoção possível, o jogo segue limpo em memória e o save ruim volta a ser avisado na próxima leitura.
  }
  return kept;
}

/**
 * Salva a run. Se estiver no meio de uma batalha, salva o estado do INÍCIO do
 * encontro (mesmo RNG e mesmas estatísticas): recarregar recomeça a mesma luta.
 * Lança se o armazenamento falhar na escrita.
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

/**
 * Carrega a run. Nunca lança: falha de leitura, save inválido ou versão nova
 * devolvem `value: null` com `error` preenchido.
 */
export function loadRun(store: KeyValueStore, now: number): LoadResult<RunState> {
  let raw: string | null;
  try {
    raw = store.getItem(RUN_KEY);
  } catch (e) {
    return { value: null, error: `Não foi possível ler o save da run (${messageOf(e)}).` };
  }
  if (raw === null) return { value: null, error: null };
  try {
    const data = migrate(parseObject(raw), RUN_MIGRATIONS, RUN_VERSION);
    RunShape.parse(data);
    return { value: data as unknown as RunState, error: null };
  } catch (e) {
    const kept = quarantine(store, `nxr.run.corrupt.${now}`, RUN_KEY, raw);
    const note = kept ? 'Uma cópia foi guardada e a run foi descartada.' : 'Não foi possível guardar a cópia; a run foi descartada.';
    return { value: null, error: `Save da run inválido (${messageOf(e)}). ${note}` };
  }
}

/** Apaga a run salva. Lança em falha de escrita; o chamador captura (como `saveRun`). */
export function deleteRun(store: KeyValueStore): void {
  store.removeItem(RUN_KEY);
}

/** Salva a meta. Lança se o armazenamento falhar na escrita. */
export function saveMeta(store: KeyValueStore, meta: MetaState): void {
  store.setItem(META_KEY, JSON.stringify(meta));
}

/**
 * Carrega a meta. Nunca lança: sem save ou com save inválido devolve `emptyMeta()`
 * (com `error` preenchido no segundo caso).
 */
export function loadMeta(store: KeyValueStore, now: number): LoadResult<MetaState> {
  let raw: string | null;
  try {
    raw = store.getItem(META_KEY);
  } catch (e) {
    return { value: emptyMeta(), error: `Não foi possível ler o progresso salvo (${messageOf(e)}).` };
  }
  if (raw === null) return { value: emptyMeta(), error: null };
  try {
    const data = migrate(parseObject(raw), META_MIGRATIONS, META_VERSION);
    MetaShape.parse(data);
    const meta = data as unknown as MetaState;
    meta.lastRecordedRunId ??= null;
    return { value: meta, error: null };
  } catch (e) {
    const kept = quarantine(store, `nxr.meta.corrupt.${now}`, META_KEY, raw);
    const note = kept ? 'Uma cópia foi guardada e o progresso recomeçou.' : 'Não foi possível guardar a cópia; o progresso recomeçou.';
    return { value: emptyMeta(), error: `Progresso salvo inválido (${messageOf(e)}). ${note}` };
  }
}

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

class FaultyStore extends MemoryStore {
  failGet = false;
  failSet = false;
  override getItem(k: string) {
    if (this.failGet) throw new Error('acesso negado');
    return super.getItem(k);
  }
  override setItem(k: string, v: string) {
    if (this.failSet) throw new Error('cota estourada');
    super.setItem(k, v);
  }
}

describe('leitura nunca lança (falhas de armazenamento)', () => {
  it('getItem lança: loadRun e loadMeta devolvem estado limpo com erro', () => {
    const store = new FaultyStore();
    store.failGet = true;
    const r = loadRun(store, 0);
    expect(r.value).toBeNull();
    expect(r.error).not.toBeNull();
    const m = loadMeta(store, 0);
    expect(m.value).toEqual(emptyMeta());
    expect(m.error).not.toBeNull();
  });

  it('save corrompido e setItem lança: não lança, devolve null com erro e remove a chave original', () => {
    const store = new FaultyStore();
    store.setItem(RUN_KEY, '{oops');
    store.failSet = true;
    let r: ReturnType<typeof loadRun> | undefined;
    expect(() => {
      r = loadRun(store, 777);
    }).not.toThrow();
    expect(r!.value).toBeNull();
    expect(r!.error).toMatch(/inválido/);
    expect(r!.error).toMatch(/Não foi possível guardar a cópia/);
    store.failSet = false;
    expect(store.getItem(RUN_KEY)).toBeNull();
  });

  it('saveRun lança quando a escrita falha', () => {
    const store = new FaultyStore();
    store.failSet = true;
    expect(() => saveRun(store, newRun(params, 1, 0))).toThrow();
  });
});

describe('validação extra da run', () => {
  it('rejeita nodeIndex fora dos nós', () => {
    const store = new MemoryStore();
    const base = newRun(params, 1, 0);
    store.setItem(RUN_KEY, JSON.stringify({ ...base, nodeIndex: base.nodes.length }));
    const r = loadRun(store, 42);
    expect(r.value).toBeNull();
    expect(r.error).toMatch(/inválido/);
    expect(store.getItem(RUN_KEY)).toBeNull();
    expect(store.getItem('nxr.run.corrupt.42')).not.toBeNull();
  });

  it('rejeita fase de batalha sem início de encontro', () => {
    const store = new MemoryStore();
    store.setItem(RUN_KEY, JSON.stringify({ ...newRun(params, 1, 0), phase: 'battle', encounterStart: null }));
    const r = loadRun(store, 43);
    expect(r.value).toBeNull();
    expect(r.error).toMatch(/inválido/);
    expect(store.getItem(RUN_KEY)).toBeNull();
  });
});

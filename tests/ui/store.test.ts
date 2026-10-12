import { beforeEach, describe, it, expect } from 'vitest';
import { META_KEY, RUN_KEY } from '../../src/game/save/save';
import { MemoryStore, PARAMS, makeStore, patchRun, resetSeedBase } from './memoryStore';

beforeEach(resetSeedBase);

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

/** Mata a run: hp=1 no save, novo store, luta e defende até a fase 'dead'. */
function dieIn(storage: MemoryStore): ReturnType<typeof makeStore> {
  patchRun(storage, (r) => {
    r.character.hp = 1;
  });
  const s = makeStore(storage);
  s.boot();
  s.continueRun();
  s.fight();
  for (let i = 0; i < 50 && s.state.run?.phase === 'battle'; i++) s.act({ type: 'defend' });
  return s;
}

describe('GameStore — fim de run com falha de armazenamento', () => {
  it('falha só na meta: a run continua salva e o boot seguinte refinaliza', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun(PARAMS);
    storage.failKeys.add(META_KEY);
    const d = dieIn(storage);
    expect(d.state.run?.phase).toBe('dead');
    expect(storage.getItem(RUN_KEY)).not.toBeNull();
    expect(d.state.notices.some((n) => n.text.includes('Não foi possível salvar'))).toBe(true);

    storage.failKeys.clear();
    const b = makeStore(storage);
    b.boot();
    expect(b.state.meta.history).toHaveLength(1);
    expect(b.state.meta.history[0]?.result).toBe('dead');
    expect(storage.getItem(RUN_KEY)).toBeNull();
    expect(b.hasActiveRun()).toBe(false);
  });

  it('abandonar com a meta falhando mantém a run salva', () => {
    const storage = new MemoryStore();
    const s = makeStore(storage);
    s.boot();
    s.startNewRun(PARAMS);
    storage.failKeys.add(META_KEY);
    s.abandonRun();
    expect(storage.getItem(RUN_KEY)).not.toBeNull();
    expect(s.state.notices.some((n) => n.text.includes('Não foi possível salvar'))).toBe(true);
  });

  it('run morta no save com meta que já a registrou: boot não duplica', () => {
    const storage = new MemoryStore();
    const a = makeStore(storage);
    a.boot();
    a.startNewRun(PARAMS);
    const d = dieIn(storage); // grava meta e apaga o save
    expect(d.state.meta.lifetime.runs).toBe(1);
    const dead = JSON.stringify(d.state.run);
    storage.setItem(RUN_KEY, dead); // simula o save da run morta que sobrou
    const b = makeStore(storage);
    b.boot();
    expect(b.state.meta.lifetime.runs).toBe(1);
    expect(b.state.meta.history).toHaveLength(1);
    expect(storage.getItem(RUN_KEY)).toBeNull();
    expect(b.state.run).toBeNull();
  });
});

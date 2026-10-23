// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { presetAllocation, type PresetId } from '../../src/game/progression/presets';
import { botAction } from '../../src/game/sim/bot';
import type { GameStore } from '../../src/store/GameStore';
import { click, mount } from './appHelpers';
import { makeStore, PARAMS, scenario, strong } from './memoryStore';

/**
 * Joga uma run inteira pelos MESMOS comandos que a interface usa,
 * com o App montado (toda tela é desenhada a cada passo — um erro de
 * renderização em qualquer tela derruba o teste).
 */
function autoplay(store: GameStore, preset: PresetId): void {
  let jd = false;
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
        {
          const a = botAction(run.battle!, jd);
          jd = a.type === 'defend';
          store.act(a);
        }
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
          jd = false;
          store.fight();
        }
        break;
      default:
        return;
    }
  }
}

const CASES: [string, string, string, boolean, PresetId][] = [
  ['Uchiha', 'uchiha', 'fogo', true, 'ninjutsu'],
  ['Uzumaki', 'uzumaki', 'vento', false, 'ninjutsu'],
  ['Sem clã', 'semcla', 'terra', false, 'taijutsu'],
];

describe('run completa pela interface (spec §13: critério de pronto)', () => {
  it.each(CASES)('%s: criação pela tela, run até o fim, Histórico gravado', (clanLabel, clanId, affinity, fixedAffinity, preset) => {
    const store = makeStore();
    const root = mount(store);
    store.boot();
    click(root, 'Modo História');
    const name = root.querySelector('input[name=name]') as HTMLInputElement;
    name.value = 'Teste';
    name.dispatchEvent(new Event('input'));
    click(root, clanLabel);
    const aff = root.querySelector('select[name=affinity]') as HTMLSelectElement;
    expect(aff.disabled).toBe(fixedAffinity);
    if (!fixedAffinity) {
      aff.value = affinity;
      aff.dispatchEvent(new Event('change'));
    }
    (root.querySelector(`[data-preset=${preset}]`) as HTMLButtonElement).click();
    click(root, 'Começar a Saga da Onda');
    expect(store.state.screen).toBe('map');
    expect(store.state.run!.character.clan).toBe(clanId);
    expect(store.state.run!.character.affinity).toBe(affinity);

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

  it.each([
    { clan: 'uchiha', affinity: 'fogo' },
    { clan: 'uzumaki', affinity: 'vento' },
    { clan: 'semcla', affinity: 'terra' },
  ] as const)('build forte ($clan) conclui a saga e registra a vitória', ({ clan, affinity }) => {
    const { store } = scenario(strong, { ...PARAMS, clan, affinity });
    mount(store);
    autoplay(store, 'ninjutsu');
    expect(store.state.runEnd?.result).toBe('victory');
    expect(store.state.runEnd?.text).toContain('Concluiu a Saga da Onda');
    expect(store.state.meta.lifetime.victories).toBe(1);
    expect(store.state.meta.titlesUnlocked).toContain('demonio_da_nevoa');
  }, 120_000);
});

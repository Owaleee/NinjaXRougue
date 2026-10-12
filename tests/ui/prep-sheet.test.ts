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
    const buttons = Array.from(root.querySelectorAll('[data-buy]')) as HTMLButtonElement[];
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

describe('Ficha — base vs efetivo e motivos', () => {
  it('Atributos mostra Taijutsu base 5 e efetivo 9 com a katana equipada', () => {
    const { store } = scenario((run) => {
      run.character.ownedEquipment = ['katana'];
      run.character.equipment.weapon = 'katana';
    });
    const root = mount(store);
    store.go('sheet');
    q(root, '[data-tab=atributos]').click();
    const row = Array.from(root.querySelectorAll('tr')).find((r) => r.querySelector('td')?.textContent === 'Taijutsu');
    expect(Array.from(row!.querySelectorAll('td')).map((td) => td.textContent)).toEqual(['Taijutsu', '5', '9']);
  });

  it('compra desabilitada por falta de ryo mostra o motivo em texto', () => {
    const { root } = prep();
    expect(root.textContent).toContain('Ryo insuficiente.');
  });

  it('a aba ativa é marcada com aria-selected', () => {
    const { root } = prep(undefined, 'jutsus');
    expect(q(root, '[data-tab=jutsus]').getAttribute('aria-selected')).toBe('true');
    expect(q(root, '[data-tab=loja]').getAttribute('aria-selected')).toBe('false');
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

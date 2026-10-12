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

// Nota: o grau "Raro" do DD v2 não existe na escala D–S; o Pergaminho Raro usa `S` só para ordenação.
// A interface mostra "Raro" pelo `kind`.

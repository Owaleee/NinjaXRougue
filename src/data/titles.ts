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

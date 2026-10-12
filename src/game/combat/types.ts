import type { AiId } from '../../data/enemies';
import type { ReforcoAttr } from '../../data/effects';
import type { Attributes, ClanId, Element, Grade, Modifiers } from '../types';

export interface ActiveEffect {
  effectId: string;
  /** Turnos restantes do portador; null = sustentado/até o fim da batalha. */
  remaining: number | null;
  sourceId: string;
  chargeUsed: boolean;
}

/**
 * Qualquer participante da batalha. O combate trabalha com uma LISTA de
 * combatentes (não "jogador vs inimigo" fixo) para abrir caminho a
 * invocações e equipes no futuro (DD v2 §9).
 */
export interface Combatant {
  id: string;
  name: string;
  side: 'player' | 'enemy';
  level: number;
  grade: Grade | null;
  isBoss: boolean;
  clan: ClanId | null;
  /** Afinidade do jogador ou elemento do inimigo; usado como elemento de defesa. */
  element: Element | null;
  /** Atributos base + equipamento (efeitos entram via effectiveAttr). */
  attrs: Attributes;
  maxHp: number;
  hp: number;
  maxChakra: number;
  chakra: number;
  /** Multiplicador de dano do grau (inimigos); 1 para o jogador. */
  damageMult: number;
  jutsus: string[];
  masteryUses: Record<string, number>;
  inventory: Record<string, number>;
  /** Passivas do clã e título ativo. */
  passiveMods: Modifiers[];
  transformationId: string | null;
  transformTurns: number;
  effects: ActiveEffect[];
  /** Turnos de imunidade a controle (Tenacidade). */
  tenacity: number;
  defending: boolean;
  ai: 'player' | AiId;
  templateId: string | null;
  aiOpened: boolean;
}

export type Action =
  | { type: 'attack' }
  | { type: 'jutsu'; jutsuId: string }
  | { type: 'defend' }
  | { type: 'meditate' }
  | { type: 'item'; itemId: string; attr?: ReforcoAttr }
  | { type: 'transform' };

export interface BattleState {
  combatants: Combatant[];
  round: number;
  /** Ordem de ação desta rodada (ids). */
  order: string[];
  turnPos: number;
  activeId: string | null;
  status: 'running' | 'awaitingInput' | 'ended';
  winner: 'player' | 'enemy' | null;
  /** Transformação já ligada/desligada neste turno? (ação livre, 1 vez por turno) */
  transformToggled: boolean;
  /** Jogador sob Ilusão com Kai disponível: só Kai é permitido. */
  onlyKai: boolean;
}

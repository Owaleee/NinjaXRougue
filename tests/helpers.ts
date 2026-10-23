import { Rng } from '../src/game/Rng';
import { emptyAttributes } from '../src/game/attributes';
import type { Combatant } from '../src/game/combat/types';
import type { Attributes } from '../src/game/types';

/** Rng de teste: devolve os valores dados, em ordem, e depois `fallback`. */
export class SeqRng extends Rng {
  private queue: number[];
  constructor(
    values: number[],
    private readonly fallback = 0.5,
  ) {
    super(1);
    this.queue = [...values];
  }
  override next(): number {
    return this.queue.length ? (this.queue.shift() as number) : this.fallback;
  }
}

export type CombatantOverrides = Partial<Omit<Combatant, 'attrs'>> & { attrs?: Partial<Attributes> };

/** Combatente neutro (todos os atributos 5, 100 HP, 50 chakra), sobrescrevível. */
export function makeCombatant(over: CombatantOverrides = {}): Combatant {
  const { attrs, ...rest } = over;
  return {
    id: 'c1',
    name: 'Teste',
    side: 'player',
    level: 1,
    grade: null,
    isBoss: false,
    clan: null,
    element: null,
    attrs: { ...emptyAttributes(5), ...attrs },
    maxHp: 100,
    hp: 100,
    maxChakra: 50,
    chakra: 50,
    damageMult: 1,
    jutsus: [],
    masteryUses: {},
    inventory: {},
    passiveMods: [],
    transformationId: null,
    transformTurns: 0,
    effects: [],
    tenacity: 0,
    defending: false,
    ai: 'player',
    templateId: null,
    aiOpened: false,
    ...rest,
  };
}

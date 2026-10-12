import { BALANCE as B } from '../Balance';
import type { AttrKey, StoryPointId } from '../types';
import { JUTSU_LIST, type JutsuDef } from '../../data/jutsus';
import { storyIndex } from '../../data/story';
import type { PlayerCharacter } from './character';
import { slotCount } from './loadout';

/**
 * REGRA FIXA (spec §5): um jutsu é aprendido automaticamente quando o
 * personagem cumpre TODAS as condições — atributo(s) BASE, clã, saga mínima e
 * pré-requisito. Nenhuma outra fonte concede jutsu. Equipamento/buffs não contam.
 */
export function meetsRequirements(c: PlayerCharacter, j: JutsuDef, story: StoryPointId): boolean {
  if (j.enemyOnly) return false;
  if (j.clan && j.clan !== c.clan) return false;
  if (storyIndex(j.minStory) > storyIndex(story)) return false;
  if (j.prereq && !c.learned.includes(j.prereq)) return false;
  return missingRequirements(c, j).length === 0;
}

/** Atributos que ainda faltam (usado na interface: "faltam X pontos para Kage Bunshin"). */
export function missingRequirements(c: PlayerCharacter, j: JutsuDef): { attr: AttrKey; missing: number }[] {
  const out: { attr: AttrKey; missing: number }[] = [];
  for (const [attr, min] of Object.entries(j.requires) as [AttrKey, number][]) {
    const have = c.baseAttrs[attr];
    if (have < min) out.push({ attr, missing: min - have });
  }
  return out;
}

/**
 * Aprende tudo o que ficou disponível. Repete até estabilizar para resolver
 * cadeias de pré-requisito (ex.: Kage Bunshin → Rasengan) numa só chamada.
 * Novos jutsus ocupam slots livres; com os slots cheios, ficam só no repertório.
 */
export function checkUnlocks(
  c: PlayerCharacter,
  story: StoryPointId,
  nodeIndex: number,
): { character: PlayerCharacter; learned: string[] } {
  const next = structuredClone(c);
  const learned: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const j of JUTSU_LIST) {
      if (next.learned.includes(j.id) || !meetsRequirements(next, j, story)) continue;
      next.learned.push(j.id);
      next.learnedAt[j.id] = { level: next.level, nodeIndex };
      learned.push(j.id);
      if (next.equipped.length < slotCount(next)) next.equipped.push(j.id);
      changed = true;
    }
  }
  return { character: next, learned };
}

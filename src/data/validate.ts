import { z } from 'zod';
import { ATTR_KEYS, CLAN_IDS, ELEMENTS, GRADES, JUTSU_CATEGORIES, PHASES, STORY_POINTS } from '../game/types';
import { CLANS, type ClanDef } from './clans';
import { EFFECT_LIST, type EffectDef } from './effects';
import { ENEMY_LIST, type EnemyTemplate } from './enemies';
import { ITEM_LIST, type ItemDef } from './items';
import { JUTSU_LIST, type JutsuDef } from './jutsus';
import { SAGA_ONDA, type SagaDef } from './saga';
import { TITLE_LIST, type TitleDef } from './titles';

/**
 * Validação dos dados ao carregar (DD v2 §18).
 * POR QUÊ: um erro de digitação num requisito ou num id de efeito precisa
 * falhar CEDO, com mensagem clara, e não virar bug silencioso no meio da run.
 */
export interface GameData {
  jutsus: JutsuDef[];
  effects: EffectDef[];
  items: ItemDef[];
  enemies: EnemyTemplate[];
  titles: TitleDef[];
  saga: SagaDef;
  clans: ClanDef[];
}

export const DEFAULT_DATA: GameData = {
  jutsus: JUTSU_LIST,
  effects: EFFECT_LIST,
  items: ITEM_LIST,
  enemies: ENEMY_LIST,
  titles: TITLE_LIST,
  saga: SAGA_ONDA,
  clans: Object.values(CLANS),
};

const attrShape = Object.fromEntries(ATTR_KEYS.map((k) => [k, z.number().int().min(0).optional()]));
const PartialAttrs = z.object(attrShape).strict();

const JutsuSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(JUTSU_CATEGORIES),
  element: z.enum(ELEMENTS).nullable(),
  clan: z.enum(CLAN_IDS).nullable(),
  requires: PartialAttrs,
  prereq: z.string().nullable(),
  minStory: z.enum(STORY_POINTS),
  grade: z.enum(GRADES),
  cost: z.number().int().min(0),
  power: z.number().positive().nullable(),
  effects: z.array(
    z.object({
      effectId: z.string().min(1),
      target: z.enum(['self', 'enemy']),
      chance: z.number().min(0).max(1),
      duration: z.number().int().positive().optional(),
    }),
  ),
  phase: z.enum(PHASES),
  enemyOnly: z.boolean().optional(),
  inheritance: z.boolean().optional(),
  cleanse: z.boolean().optional(),
  description: z.string().min(1),
});

const EffectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['buff', 'debuff', 'control', 'dot', 'transformation']),
  duration: z.union([z.number().int().positive(), z.literal('battle'), z.literal('sustained')]),
});

const ItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['consumable', 'weapon', 'armor', 'rareScroll']),
  grade: z.enum(GRADES),
  price: z.number().int().positive(),
  attrBonus: PartialAttrs.optional(),
});

const EnemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  grade: z.enum(GRADES),
  element: z.enum(ELEMENTS).nullable(),
  jutsus: z.array(z.string()).min(1),
});

function zodIssues(label: string, schema: z.ZodTypeAny, list: unknown[]): string[] {
  const out: string[] = [];
  list.forEach((item, idx) => {
    const r = schema.safeParse(item);
    if (!r.success) {
      const id = (item as { id?: string }).id ?? `#${idx}`;
      for (const issue of r.error.issues) out.push(`${label} ${id}: ${issue.path.join('.')} ${issue.message}`);
    }
  });
  return out;
}

function duplicates(label: string, ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) out.push(`${label} ${id}: id duplicado`);
    seen.add(id);
  }
  return out;
}

/** Devolve a lista de problemas encontrados (vazia = dados válidos). */
export function validateGameData(data: GameData = DEFAULT_DATA): string[] {
  const issues: string[] = [
    ...zodIssues('jutsu', JutsuSchema, data.jutsus),
    ...zodIssues('efeito', EffectSchema, data.effects),
    ...zodIssues('item', ItemSchema, data.items),
    ...zodIssues('inimigo', EnemySchema, data.enemies),
    ...duplicates('jutsu', data.jutsus.map((j) => j.id)),
    ...duplicates('efeito', data.effects.map((e) => e.id)),
    ...duplicates('item', data.items.map((i) => i.id)),
    ...duplicates('inimigo', data.enemies.map((e) => e.id)),
    ...duplicates('título', data.titles.map((t) => t.id)),
  ];
  const jutsuIds = new Set(data.jutsus.map((j) => j.id));
  const effectIds = new Set(data.effects.map((e) => e.id));
  const enemyIds = new Set(data.enemies.map((e) => e.id));

  for (const j of data.jutsus) {
    if (j.prereq && !jutsuIds.has(j.prereq)) issues.push(`jutsu ${j.id}: pré-requisito inexistente "${j.prereq}"`);
    for (const e of j.effects) if (!effectIds.has(e.effectId)) issues.push(`jutsu ${j.id}: efeito inexistente "${e.effectId}"`);
  }
  for (const e of data.enemies) {
    for (const id of e.jutsus) if (!jutsuIds.has(id)) issues.push(`inimigo ${e.id}: golpe inexistente "${id}"`);
  }
  for (const n of data.saga.nodes) {
    for (const id of n.pool) if (!enemyIds.has(id)) issues.push(`saga nó ${n.index}: inimigo inexistente "${id}"`);
    if (n.bossId && !enemyIds.has(n.bossId)) issues.push(`saga nó ${n.index}: chefe inexistente "${n.bossId}"`);
  }
  for (const c of data.clans) {
    if (c.transformationId && !effectIds.has(c.transformationId)) issues.push(`clã ${c.id}: transformação inexistente "${c.transformationId}"`);
    for (const id of Object.keys(c.jutsuCostMult)) if (!jutsuIds.has(id)) issues.push(`clã ${c.id}: jutsu inexistente "${id}"`);
  }
  for (const t of data.titles) {
    if (t.condition.kind === 'bossDefeated' && !enemyIds.has(t.condition.enemyId)) issues.push(`título ${t.id}: chefe inexistente`);
  }
  return issues;
}

export function assertGameData(data: GameData = DEFAULT_DATA): void {
  const issues = validateGameData(data);
  if (issues.length) throw new Error(`Dados do jogo inválidos:\n- ${issues.join('\n- ')}`);
}

import type { GameEvent } from '../game/events';
import type { JutsuCategory } from '../game/types';

/**
 * Animações por quadros dos lutadores (sem Phaser, testável). A arte vem de
 * public/assets/sprites/<id>/{sheet.png,atlas.json}; o atlas traz `meta.animations`.
 * Sem o atlas (ou com meta inválido) a arena usa a imagem estática de sempre.
 */
export type FighterAnim = 'idle' | 'attack' | 'cast' | 'hit' | 'death' | 'dodge';
/** `dodge` é opcional: sem ela o lutador só mostra o texto de esquiva. */
export const REQUIRED_ANIMS: FighterAnim[] = ['idle', 'attack', 'cast', 'hit', 'death'];

export interface AtlasAnim {
  frames: string[];
  fps: number;
  loop: boolean;
}
export interface SpriteMeta {
  animations: Record<string, AtlasAnim>;
}

export const atlasKey = (art: string): string => `${art}:sheet`;
export const metaKey = (art: string): string => `${art}:meta`;
/** Nome da animação no Phaser (global por textura). */
export const animKey = (art: string, anim: string): string => `${art}:${anim}`;

export function parseSpriteMeta(json: unknown): SpriteMeta | null {
  const animations = (json as { meta?: { animations?: unknown } } | null)?.meta?.animations;
  if (!animations || typeof animations !== 'object') return null;
  const out: Record<string, AtlasAnim> = {};
  for (const [name, a] of Object.entries(animations as Record<string, Partial<AtlasAnim>>)) {
    if (!Array.isArray(a.frames) || a.frames.length === 0 || typeof a.fps !== 'number' || a.fps <= 0) return null;
    out[name] = { frames: a.frames.map(String), fps: a.fps, loop: a.loop === true };
  }
  return Object.keys(out).length ? { animations: out } : null;
}

export function hasAnimations(meta: SpriteMeta | null, needed: string[]): boolean {
  return !!meta && needed.every((n) => !!meta.animations[n]);
}

/**
 * Qual animação o lutador `id` toca neste evento (ou null: continua no idle).
 * Jutsu anima em `jutsuUsed` (que sabe a categoria); `actionChosen` cobre as ações básicas.
 */
export function animForEvent(e: GameEvent, id: string, category: JutsuCategory | null): FighterAnim | null {
  switch (e.type) {
    case 'actionChosen':
      if (e.actorId !== id) return null;
      if (e.action.type === 'attack') return 'attack';
      return e.action.type === 'meditate' || e.action.type === 'transform' || e.action.type === 'item' ? 'cast' : null;
    case 'jutsuUsed':
      return e.actorId === id ? (category === 'taijutsu' ? 'attack' : 'cast') : null;
    case 'damage':
      return e.targetId === id ? 'hit' : null;
    case 'dodge':
      return e.targetId === id ? 'dodge' : null;
    case 'defeated':
      return e.targetId === id ? 'death' : null;
    default:
      return null;
  }
}

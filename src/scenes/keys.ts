/** Chaves de textura do Phaser para a arte da arena (sem importar o Phaser: testável). */
export const vfxKey = (name: string): string => `vfx:${name}`;
export const sceneKey = (scene: string, layer: string): string => `bg:${scene}:${layer}`;
export const VFX_MANIFEST_KEY = 'vfx:manifest';
export const OVERLAY_KEY = { nevoa: 'bg:overlay:nevoa', gelo: 'bg:overlay:gelo' } as const;

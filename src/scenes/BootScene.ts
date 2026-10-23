import Phaser from 'phaser';
import {
  BATTLE_SCENES,
  CHARACTER_ARTS,
  OVERLAY_GELO_URL,
  OVERLAY_NEVOA_URL,
  SCENE_LAYERS,
  VFX_MANIFEST_URL,
  VFX_NAMES,
  characterUrl,
  sceneLayerUrl,
  spriteAtlasUrl,
  spriteSheetUrl,
  vfxAtlasUrl,
  vfxSheetUrl,
} from '../data/art';
import { atlasKey, metaKey } from './spriteAnims';
import { OVERLAY_KEY, VFX_MANIFEST_KEY, sceneKey, vfxKey } from './keys';

export interface BootHooks {
  /** 0..1, para a barra da tela de carregamento. */
  onProgress?: (p: number) => void;
  /** Tudo carregado (ou falhou: a arena cai nos substitutos). */
  onReady?: () => void;
}

/** Ponto de entrada do Phaser: carrega a arte (lutadores, VFX, cenários) antes da arena. */
export class BootScene extends Phaser.Scene {
  constructor(private readonly hooks: BootHooks = {}) {
    super('boot');
  }

  preload(): void {
    this.load.on('progress', (p: number) => this.hooks.onProgress?.(p));
    // Se um arquivo faltar, a arena cai no substituto (imagem estática, retângulo, sem efeito) em vez de quebrar.
    for (const art of CHARACTER_ARTS) {
      this.load.image(art, characterUrl(art));
      this.load.atlas(atlasKey(art), spriteSheetUrl(art), spriteAtlasUrl(art));
      this.load.json(metaKey(art), spriteAtlasUrl(art));
    }
    this.load.json(VFX_MANIFEST_KEY, VFX_MANIFEST_URL);
    for (const n of VFX_NAMES) this.load.atlas(vfxKey(n), vfxSheetUrl(n), vfxAtlasUrl(n));
    for (const s of BATTLE_SCENES) for (const l of SCENE_LAYERS) this.load.image(sceneKey(s, l), sceneLayerUrl(s, l));
    this.load.image(OVERLAY_KEY.nevoa, OVERLAY_NEVOA_URL);
    this.load.image(OVERLAY_KEY.gelo, OVERLAY_GELO_URL);
  }

  create(): void {
    this.hooks.onReady?.();
    this.scene.start('battle');
  }
}

import Phaser from 'phaser';
import { CHARACTER_ARTS, characterUrl } from '../data/art';

/** Ponto de entrada do Phaser: carrega a arte dos personagens antes da arena. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    // Se um arquivo faltar, a arena cai no placeholder (retângulo) em vez de quebrar.
    for (const art of CHARACTER_ARTS) this.load.image(art, characterUrl(art));
  }

  create(): void {
    this.scene.start('battle');
  }
}

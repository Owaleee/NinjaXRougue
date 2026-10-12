import Phaser from 'phaser';

/** Ponto de entrada do Phaser. Quando houver arte, o carregamento de assets entra aqui. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.scene.start('battle');
  }
}

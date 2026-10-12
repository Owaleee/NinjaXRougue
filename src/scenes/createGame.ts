import Phaser from 'phaser';
import type { GameStore } from '../store/GameStore';
import type { BattleView } from '../ui-dom/types';
import { BattleScene } from './BattleScene';
import { BootScene } from './BootScene';

/** Cria o Phaser dentro da camada do jogo. Fora da batalha o loop dorme (economiza CPU). */
export function createGame(parent: HTMLElement, store: GameStore): BattleView {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#12141a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new BootScene(), new BattleScene(store)],
  });
  // show/hide chegam antes do boot terminar. O loop precisa rodar até a BattleScene
  // existir (é no create dela que o animador se registra no store); depois disso
  // aplica o último pedido de mostrar/esconder.
  let visible = false;
  const apply = () => {
    if (!game.scene.isActive('battle')) return;
    if (visible) game.loop.wake();
    else game.loop.sleep();
  };
  const settle = () => {
    if (!game.scene.isActive('battle')) return;
    game.events.off(Phaser.Core.Events.POST_STEP, settle);
    apply();
  };
  game.events.on(Phaser.Core.Events.POST_STEP, settle);
  return {
    show: () => {
      visible = true;
      apply();
    },
    hide: () => {
      visible = false;
      apply();
    },
  };
}

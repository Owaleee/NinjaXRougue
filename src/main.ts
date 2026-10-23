import './styles.css';
import type { KeyValueStore } from './game/save/save';
import { t } from './i18n/pt-BR';
import { GameStore } from './store/GameStore';
import { App } from './ui-dom/App';
import { KEYS, OVERLAY, SCREENS } from './ui-dom/screens';
import { createGame } from './scenes/createGame';

/**
 * Único lugar que toca no navegador "de verdade": localStorage, relógio e
 * sorteio da semente. Tudo isso é injetado no GameStore (o motor continua puro).
 */
function pickStorage(): { storage: KeyValueStore; ok: boolean } {
  try {
    const ls = window.localStorage;
    ls.getItem('nxr.probe');
    return { storage: ls, ok: true };
  } catch {
    const mem = new Map<string, string>();
    return {
      ok: false,
      storage: {
        getItem: (k) => mem.get(k) ?? null,
        setItem: (k, v) => void mem.set(k, v),
        removeItem: (k) => void mem.delete(k),
      },
    };
  }
}

function newSeed(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]!;
}

const root = document.getElementById('app');
if (!root) throw new Error('#app não encontrado');
const { storage, ok } = pickStorage();
const store = new GameStore({ storage, now: () => Date.now(), newSeed });
const app = new App(root, store, { screens: SCREENS, keys: KEYS, overlay: OVERLAY });
app.mount();
// Tela de carregamento (index.html): sai quando a arte da arena termina de carregar,
// e nunca fica presa (se o Phaser falhar ou demorar, sai mesmo assim).
const splash = document.getElementById('splash');
const splashBar = document.getElementById('splash-bar');
let splashGone = false;
const hideSplash = () => {
  if (splashGone) return;
  splashGone = true;
  splash?.classList.add('done');
  window.setTimeout(() => splash?.remove(), 400);
};
window.setTimeout(hideSplash, 15000);
let canvasOk = true;
try {
  app.setBattleView(
    createGame(app.gameLayer, store, {
      onProgress: (p) => {
        if (splashBar) splashBar.style.width = `${Math.round(p * 100)}%`;
      },
      onReady: hideSplash,
    }),
  );
} catch {
  // Sem WebGL/canvas o jogo continua jogável: sem animador registrado, nada trava.
  canvasOk = false;
  hideSplash();
}
store.boot();
// Avisos só depois do boot: o boot substitui a lista de avisos.
if (!canvasOk) store.notify('error', t('notice.noCanvas'));
if (!ok) store.notify('error', t('notice.storageUnavailable'));

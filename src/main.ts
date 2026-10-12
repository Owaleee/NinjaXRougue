import './styles.css';
import type { KeyValueStore } from './game/save/save';
import { t } from './i18n/pt-BR';
import { GameStore } from './store/GameStore';
import { App } from './ui-dom/App';
import { KEYS, OVERLAY, SCREENS } from './ui-dom/screens';

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
store.boot();
if (!ok) store.notify('error', t('notice.storageUnavailable'));

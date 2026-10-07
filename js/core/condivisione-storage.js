// Chi apre un link condiviso deve vedere la vista del mittente senza perdere le proprie preferenze.
// Un overlay di window.localStorage serve i valori condivisi e tiene in memoria le scritture sulle chiavi che
// cambiano ciò che si vede: il storage reale del visitatore non viene toccato. Le altre chiavi passano al reale.
import { CHIAVI_STORAGE } from './condivisione-codec.js';

export const PROTETTE = new Set([...CHIAVI_STORAGE, 'dt-tema']);

export function creaOverlay(reale, iniziali) {
  const memoria = new Map(Object.entries(iniziali));
  const prova = (f, ripiego = null) => { try { return f(); } catch { return ripiego; } };
  return {
    getItem(k) {
      k = String(k);
      if (memoria.has(k)) return memoria.get(k);
      if (PROTETTE.has(k)) return null; // il mittente non l'aveva: si vede il predefinito, non la scelta del visitatore
      return prova(() => reale?.getItem(k) ?? null);
    },
    setItem(k, v) {
      k = String(k);
      if (PROTETTE.has(k)) memoria.set(k, String(v)); else prova(() => reale?.setItem(k, v));
    },
    removeItem(k) {
      k = String(k);
      if (PROTETTE.has(k)) memoria.delete(k); else prova(() => reale?.removeItem(k));
    },
    key: i => prova(() => reale?.key(i) ?? null),
    get length() { return prova(() => reale?.length ?? 0, 0); },
    clear() { memoria.clear(); prova(() => reale?.clear()); },
  };
}

// true se window.localStorage ora è l'overlay.
export function installaOverlay(finestra, iniziali) {
  let reale = null;
  try { reale = finestra.localStorage; } catch { /* storage bloccato: l'overlay lavora solo in memoria */ }
  const overlay = creaOverlay(reale, iniziali);
  try {
    Object.defineProperty(finestra, 'localStorage', { configurable: true, get: () => overlay });
    return true;
  } catch {
    return false;
  }
}

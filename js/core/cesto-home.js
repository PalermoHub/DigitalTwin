// Gli strati scelti nella home («Aggiungi alla mappa») e quelli accesi sulla mappa sono lo stesso elenco: stanno in sessionStorage
// sotto una chiave sola, così la home mostra il badge «Aggiunto» anche per gli strati accesi dalla mappa, e il Ripristina li spegne tutti.
import { ESTERNO } from './condivisione-stato.js';

export const CHIAVE_CESTO = 'dt-home-strati';

export function leggiCesto(storage) {
  try {
    const ids = JSON.parse(storage?.getItem(CHIAVE_CESTO));
    return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
  } catch { return []; /* storage non disponibile o illeggibile */ }
}

export function salvaCesto(storage, ids) {
  try { storage?.setItem(CHIAVE_CESTO, JSON.stringify([...ids])); } catch { /* storage non disponibile */ }
}

export function svuotaCesto(storage) {
  try { storage?.removeItem(CHIAVE_CESTO); } catch { /* storage non disponibile */ }
}

// Tiene il cesto allineato alle caselle degli strati della mappa (i layer aggiunti dall'utente non hanno una card in home).
export function collegaCestoAllaMappa(doc, storage) {
  const salva = () => salvaCesto(storage, [...doc.querySelectorAll('input[id^="strato-"]')].filter(x => x.checked).map(x => x.id.slice(7)).filter(id => !ESTERNO.test(id)));
  doc.addEventListener('change', e => { if (e.target.matches?.('input[id^="strato-"]')) salva(); });
  salva();
}

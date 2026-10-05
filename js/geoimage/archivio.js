// js/geoimage/archivio.js
// Il progetto si ricorda tra una sessione e l'altra: i parametri (angoli, GCP, opacità…) in localStorage, l'immagine — troppo
// grande per i 5 MB di localStorage — in IndexedDB con ID_IMMAGINE (vedi js/rndt/dati.js).
// Se il browser blocca lo storage o è pieno l'app funziona lo stesso, senza memoria.
import { TIPI } from './trasformazioni.js';

export const CHIAVE = 'dt:geoimage:v1';
export const ID_IMMAGINE = 'geoimage:immagine';

const numero = v => typeof v === 'number' && Number.isFinite(v);
const punto = p => p && numero(p.lat) && numero(p.lng);
const quattro = a => Array.isArray(a) && a.length === 4 && a.every(punto);

// null se manca, è di un'altra versione o è rovinato
export function leggi(storage) {
  try {
    const grezzo = storage?.getItem(CHIAVE);
    if (!grezzo) return null;
    const p = JSON.parse(grezzo);
    if (p?.v !== 1 || !quattro(p.angoli) || !quattro(p.angoliIniziali)) return null;
    if (!numero(p.larghezza) || !numero(p.altezza) || typeof p.nome !== 'string') return null;
    return {
      nome: p.nome,
      larghezza: p.larghezza,
      altezza: p.altezza,
      angoli: p.angoli.map(({ lat, lng }) => ({ lat, lng })),
      angoliIniziali: p.angoliIniziali.map(({ lat, lng }) => ({ lat, lng })),
      opacita: numero(p.opacita) ? Math.min(1, Math.max(0, p.opacita)) : 0.7,
      tipo: TIPI.includes(p.tipo) ? p.tipo : 'poly1',
      gcp: (Array.isArray(p.gcp) ? p.gcp : []).filter(g => g && [g.px, g.py, g.lat, g.lng].every(numero)).map(({ px, py, lat, lng }) => ({ px, py, lat, lng })),
    };
  } catch {
    return null;
  }
}

// true se salvato
export function salva(storage, p) {
  try {
    storage.setItem(CHIAVE, JSON.stringify({ v: 1, ...p }));
    return true;
  } catch {
    return false;
  }
}

export function elimina(storage) {
  try { storage?.removeItem(CHIAVE); } catch { /* storage bloccato: niente da cancellare */ }
}

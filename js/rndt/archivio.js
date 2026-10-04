// js/rndt/archivio.js
// I layer RNDT aggiunti si ricordano tra una sessione e l'altra (localStorage, passato come parametro).
// Se il browser lo blocca o è pieno l'app funziona lo stesso, senza memoria.

export const CHIAVE = 'dt:rndt:v1';
const TIPI = ['wms', 'tile', 'geojson'];
const vuoto = () => ({ v: 1, layers: [] });
// un GeoJSON si richiama dall'URL, dai dati nell'archivio dati (`dati: true`) o, nel vecchio formato, dai dati dentro l'elenco
const sorgenteValida = l => l.tipo !== 'geojson'
  || typeof l.sorgente?.url === 'string'
  || l.sorgente?.dati === true
  || l.sorgente?.dati?.type === 'FeatureCollection';

export function leggi(storage) {
  try {
    const grezzo = storage?.getItem(CHIAVE);
    if (!grezzo) return vuoto();
    const s = JSON.parse(grezzo);
    if (s?.v !== 1 || !Array.isArray(s.layers)) return vuoto();
    return { v: 1, layers: s.layers.filter(l => l && typeof l.id === 'string' && TIPI.includes(l.tipo) && sorgenteValida(l)) };
  } catch {
    return vuoto();
  }
}

export function salva(storage, stato) {
  try {
    storage.setItem(CHIAVE, JSON.stringify(stato));
    return true;
  } catch {
    return false;
  }
}

export const aggiungi = (stato, salvato) => ({ ...stato, layers: [...stato.layers.filter(l => l.id !== salvato.id), salvato] });
export const rimuovi = (stato, id) => ({ ...stato, layers: stato.layers.filter(l => l.id !== id) });
export const aggiorna = (stato, id, patch) => ({ ...stato, layers: stato.layers.map(l => (l.id === id ? { ...l, ...patch } : l)) });

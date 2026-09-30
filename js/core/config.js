export const DATI = 'dati/';
export const CENTRO = [13.3614, 38.1157];
export const ZOOM = 12;

// Stile della base cartografica delle app originali (porta con sé i font dei numeri civici).
export const STILE_BASE = 'https://tiles.openfreemap.org/styles/positron';

// Percorso in dati/ -> link pubblicato (dal catalogo). Chi non ha un link si legge da dati/.
const remoti = new Map();
// Tileset pubblicati (cartelle z/x/y, non copiabili): id -> modello di URL, sempre dal catalogo.
const tileset = new Map();

export function impostaCatalogo(voci) {
  remoti.clear();
  tileset.clear();
  for (const v of voci) {
    if (v.tipo === 'tileset') tileset.set(v.id, v.url);
    else if (v.url) remoti.set(v.percorso, v.url);
  }
}

export function urlTileset(id) {
  return tileset.get(id) ?? null;
}

export function urlDati(rel) {
  return remoti.get(rel) || new URL(DATI + rel, document.baseURI).href;
}

export function pmt(rel) {
  return 'pmtiles://' + urlDati(rel);
}

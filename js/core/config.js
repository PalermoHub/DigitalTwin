export const DATI = 'dati/';
export const CENTRO = [13.3614, 38.1157];
export const ZOOM = 12;

// Stile della base cartografica delle app originali (porta con sé i font dei numeri civici).
export const STILE_BASE = 'https://tiles.openfreemap.org/styles/positron';

// Vestizione PRG/PPE/vincoli: tile raster già pubblicati (1,6 GB e 414.000 file: non si copiano).
export const RASTER_PRG = 'https://palermohub.github.io/PRG2004/';

// Percorso in dati/ -> link pubblicato (dal catalogo). Chi non ha un link si legge da dati/.
const remoti = new Map();

export function impostaCatalogo(voci) {
  remoti.clear();
  for (const v of voci) if (v.url) remoti.set(v.percorso, v.url);
}

export function urlDati(rel) {
  return remoti.get(rel) || new URL(DATI + rel, document.baseURI).href;
}

export function pmt(rel) {
  return 'pmtiles://' + urlDati(rel);
}

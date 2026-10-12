export const DATI = 'dati/';
// Vista iniziale ed estensione della mappa come nell'app catasto-app di palermohub.opendatasicilia.it.
export const CENTRO = [13.33225, 38.14074];
export const ZOOM = window.matchMedia('(max-width: 768px)').matches ? 11 : 12;
// Limiti di spostamento molto larghi e simmetrici attorno al CENTRO: la vista iniziale resta al centro dei limiti.
const MARGINE = [1.5, 1];
export const LIMITI = [[CENTRO[0] - MARGINE[0], CENTRO[1] - MARGINE[1]], [CENTRO[0] + MARGINE[0], CENTRO[1] + MARGINE[1]]];
export const ZOOM_SLIDER = [12, 18];
// Al clic sulla mappa (scheda del luogo) la vista si avvicina almeno a questo zoom, senza mai allontanarsi.
export const ZOOM_SCHEDA = 16.5;

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

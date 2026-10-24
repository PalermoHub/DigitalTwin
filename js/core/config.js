export const DATI = 'dati/';
// Vista iniziale ed estensione della mappa come nell'app catasto-app di palermohub.opendatasicilia.it.
export const CENTRO = [13.33225, 38.14074];
export const ZOOM = window.matchMedia('(max-width: 768px)').matches ? 11 : 12;
// Limiti di spostamento: tutta la Sicilia con le isole minori e un po' di mare, l'area dei servizi in tempo reale (terremoti, voli, navi, allerte).
export const LIMITI = [[11.7, 36.3], [16.2, 39.2]];
export const ZOOM_SLIDER = [12, 18];
// Al clic sulla mappa (scheda del luogo) la vista si avvicina almeno a questo zoom, senza mai allontanarsi.
export const ZOOM_SCHEDA = 16.5;

// Stile della base cartografica delle app originali (porta con sé i font dei numeri civici).
export const STILE_BASE = 'https://tiles.openfreemap.org/styles/positron'; // Positron: la base «Mappa chiara» scelta dall'utente e la mini-mappa della scheda
// Stile con cui parte la mappa: senza sorgenti né layer, perché la base di partenza è raster (Mapbox). Servono solo i font delle etichette;
// gli stili OpenFreeMap (con sprite e sorgenti vettoriali) arrivano soltanto se l'utente sceglie una base OpenFreeMap (vedi layers/base.js).
// I font stanno in fonts/glyphs/ (Noto Sans copiato da OpenFreeMap, IM FELL English per la base «Antica»; solo gli intervalli latino, greco, cirillico e arabo di base):
// l'indirizzo dev'essere assoluto, perché lo legge un worker. Fuori dal browser (test) resta quello di OpenFreeMap.
const FONT = typeof document === 'undefined' ? 'https://tiles.openfreemap.org/fonts/' : new URL('fonts/glyphs/', document.baseURI).href;
export const STILE_AVVIO = { version: 8, glyphs: `${FONT}{fontstack}/{range}.pbf`, sources: {}, layers: [] };

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

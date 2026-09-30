export const DATI = 'dati/';
export const CENTRO = [13.3614, 38.1157];
export const ZOOM = 12;

export function urlDati(rel) {
  return new URL(DATI + rel, document.baseURI).href;
}

export function pmt(rel) {
  return 'pmtiles://' + urlDati(rel);
}

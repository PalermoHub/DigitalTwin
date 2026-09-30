import { CENTRO, ZOOM, STILE_BASE } from './config.js';

const STILE_VUOTO = {
  version: 8,
  sources: {},
  layers: [{ id: 'sfondo', type: 'background', paint: { 'background-color': '#f2f2f2' } }],
};

// `suRipiego` viene chiamata se lo stile della base non si carica: la mappa passa a uno sfondo
// vuoto e gli strati dei dati restano utilizzabili.
export function creaMappa(idContenitore, suRipiego = () => {}) {
  const protocollo = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocollo.tile);
  const map = new maplibregl.Map({
    container: idContenitore, center: CENTRO, zoom: ZOOM, maxZoom: 19, style: STILE_BASE,
  });
  let stileCaricato = false;
  let ripiegato = false;
  map.on('style.load', () => { stileCaricato = true; });
  map.on('error', () => {
    if (stileCaricato || ripiegato) return;
    ripiegato = true;
    map.setStyle(STILE_VUOTO);
    suRipiego();
  });
  return map;
}

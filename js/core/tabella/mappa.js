// js/core/tabella/mappa.js
// Tutto ciò che la tabella chiede a MapLibre: leggere le feature, trovare le aree amministrative, evidenziare le righe.
import { normalizza } from './modello.js';
import { interseca } from './geom.js';

const STRATO_AREE = 'confini-upl-fill'; // ha le proprietà UPL, Quartiere e Circoscrizione (vedi js/layers/confini.js)
const CAMPO_AREA = { circoscrizione: 'Circoscrizione', quartiere: 'Quartiere', upl: 'UPL' };

export function attiva(map, sorgente) {
  if (!sorgente.strati.every(id => map.getLayer(id))) return false;
  return sorgente.visibili.some(id => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none');
}

export function leggiVista(map, sorgente) {
  let feature = [];
  try { feature = map.queryRenderedFeatures({ layers: sorgente.strati.filter(id => map.getLayer(id)) }); } catch { feature = []; }
  return normalizza(feature, sorgente);
}

export const righeIn = (righe, poligoni) => righe.filter(r => r.geometrie.some(g => interseca(g, poligoni)));

// Un quartiere arriva a pezzi (tagliato dai tile): si prendono tutti i pezzi in vista con lo stesso valore del campo.
export function poligoniArea(map, punto, livello) {
  const campo = CAMPO_AREA[livello];
  if (!campo || !map.getLayer(STRATO_AREE)) return [];
  let sotto;
  let tutti;
  try {
    sotto = map.queryRenderedFeatures([punto.x, punto.y], { layers: [STRATO_AREE] })[0];
    tutti = map.queryRenderedFeatures({ layers: [STRATO_AREE] });
  } catch { return []; }
  const valore = sotto?.properties?.[campo];
  if (valore == null) return [];
  return tutti.filter(f => f.properties?.[campo] === valore).flatMap(f => {
    if (f.geometry.type === 'Polygon') return [f.geometry.coordinates];
    return f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
  });
}

const SORGENTE_SEL = 'tabella-sel';
const STRATI_SEL = ['tabella-sel-fill', 'tabella-sel-line', 'tabella-sel-punti'];
const vuota = { type: 'FeatureCollection', features: [] };

function assicuraStrati(map) {
  if (map.getSource(SORGENTE_SEL)) return;
  map.addSource(SORGENTE_SEL, { type: 'geojson', data: vuota });
  const colore = ['get', 'colore'];
  map.addLayer({ id: STRATI_SEL[0], type: 'fill', source: SORGENTE_SEL, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': colore, 'fill-opacity': 0.25 } });
  map.addLayer({ id: STRATI_SEL[1], type: 'line', source: SORGENTE_SEL, filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': colore, 'line-width': 3 } });
  map.addLayer({ id: STRATI_SEL[2], type: 'circle', source: SORGENTE_SEL, filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': colore, 'circle-opacity': 0.4, 'circle-radius': 9, 'circle-stroke-color': colore, 'circle-stroke-width': 3 } });
}

export function evidenziaRighe(map, righe, colore) {
  assicuraStrati(map);
  map.getSource(SORGENTE_SEL).setData({
    type: 'FeatureCollection',
    features: righe.flatMap(r => r.geometrie.map(g => ({ type: 'Feature', geometry: g, properties: { colore } }))),
  });
  for (const id of STRATI_SEL) map.moveLayer(id);
}

export function cancellaEvidenza(map) {
  if (map.getSource(SORGENTE_SEL)) map.getSource(SORGENTE_SEL).setData(vuota);
}

// Porta la mappa sulla riga: un punto si centra, il resto si inquadra.
export function vaiA(map, riga) {
  const coordinate = [];
  const raccogli = c => { if (typeof c[0] === 'number') coordinate.push(c); else c.forEach(raccogli); };
  for (const g of riga.geometrie) raccogli(g.coordinates ?? g.geometries?.map(x => x.coordinates) ?? []);
  if (!coordinate.length) return;
  const xs = coordinate.map(c => c[0]);
  const ys = coordinate.map(c => c[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  if (x0 === x1 && y0 === y1) map.easeTo({ center: [x0, y0], zoom: Math.max(map.getZoom(), 17) });
  else map.fitBounds([[x0, y0], [x1, y1]], { padding: 80, maxZoom: 18 });
}

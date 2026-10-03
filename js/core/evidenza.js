import { piuVicino } from './scheda-util.js';

// Evidenziazione sulla mappa delle aree da cui vengono i dati della scheda del luogo.
// Ogni layer "hit" ha un'etichetta (mostrata nella scheda) e un colore (usato sulla mappa).
export const FONTI = {
  'edifici-hit': { etichetta: 'Edificio', colore: '#e8590c' },
  'pop-hit': { etichetta: 'Sezione di censimento', colore: '#1c7ed6' },
  'catasto-hit': { etichetta: 'Particella catastale', colore: '#2f9e44' },
  'prg-zto-hit': { etichetta: 'Zona PRG', colore: '#9c36b5' },
  'prg-ns-hit': { etichetta: 'Netto storico PRG', colore: '#9c36b5' },
  'prg-cs-hit': { etichetta: 'Centro storico PRG', colore: '#9c36b5' },
  'prg-va-hit': { etichetta: 'Vincolo PRG (area)', colore: '#c2255c' },
  'prg-vl-hit': { etichetta: 'Vincolo PRG (linea)', colore: '#c2255c' },
  'omi-hit': { etichetta: 'Zona OMI', colore: '#e67700' },
  'immobili-hit': { etichetta: 'Immobile comunale', colore: '#0b7285' },
  'civici-hit': { etichetta: 'Numero civico', colore: '#d6336c' },
  'monumenti-hit-poli': { etichetta: 'Monumento', colore: '#862e9c' },
  'monumenti-hit-punti': { etichetta: 'Monumento', colore: '#862e9c' },
  'scuole-hit-poli': { etichetta: 'Scuola o asilo', colore: '#1971c2' },
  'scuole-hit-punti': { etichetta: 'Scuola o asilo', colore: '#1971c2' },
  'seggi-hit-poli': { etichetta: 'Sede di sezioni elettorali', colore: '#0c8599' },
  'seggi-hit-punti': { etichetta: 'Sede di sezioni elettorali', colore: '#0c8599' },
  'uffici-hit': { etichetta: 'Sede di uffici comunali', colore: '#a61e4d' },
  'trasporto-hit-fermate': { etichetta: 'Fermata', colore: '#364fc7' },
  'trasporto-hit-linee': { etichetta: 'Linea', colore: '#e03131' },
  'griglia-hit': { etichetta: 'Punto di griglia del terreno (50 m)', colore: '#5c940d' },
};

const SORGENTE = 'scheda-evidenza';
const STRATI = ['scheda-evidenza-fill', 'scheda-evidenza-line', 'scheda-evidenza-punti'];

const uguali = (a, b) => JSON.stringify(a.properties) === JSON.stringify(b.properties);

// Tra i risultati di un layer tiene la feature da cui la scheda prende i dati e i suoi frammenti
// (un poligono tagliato dai tile compare in più pezzi con le stesse proprietà).
export function sceltePerLayer(trovati, lngLat) {
  const ids = [...new Set(trovati.map(f => f.layer.id))].filter(id => FONTI[id]);
  return ids.map(id => {
    const prima = id === 'griglia-hit'
      ? piuVicino(trovati, id, lngLat)
      : trovati.find(f => f.layer.id === id);
    const pezzi = prima.geometry.type === 'Point'
      ? [prima]
      : trovati.filter(f => f.layer.id === id && uguali(f, prima));
    return { id, ...FONTI[id], features: pezzi };
  });
}

// GeoJSON da disegnare: ogni geometria porta il colore della propria fonte.
export function collezione(scelte) {
  return {
    type: 'FeatureCollection',
    features: scelte.flatMap(s => s.features.map(f => ({
      type: 'Feature', geometry: f.geometry, properties: { colore: s.colore },
    }))),
  };
}

// Evidenzia una sola cosa: l'edificio se il clic cade su un edificio (il poligono del monumento,
// scuola o seggio, altrimenti quello dell'edificato), il punto se cade fuori dall'edificato.
// Senza nessuno dei due (es. solo catasto o PRG) restano tutte le aree. La griglia del terreno non conta.
export function soloCliccato(scelte) {
  const poligono = scelte.find(s => /-hit-poli$/.test(s.id)) ?? scelte.find(s => s.id === 'edifici-hit');
  const punto = scelte.find(s => s.id !== 'griglia-hit' && s.features[0].geometry.type === 'Point');
  const scelta = poligono ?? punto;
  return scelta ? [scelta] : scelte;
}

function assicuraStrati(map) {
  if (map.getSource(SORGENTE)) return;
  map.addSource(SORGENTE, { type: 'geojson', data: collezione([]) });
  const colore = ['get', 'colore'];
  map.addLayer({ id: STRATI[0], type: 'fill', source: SORGENTE, filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': colore, 'fill-opacity': 0.2 } });
  map.addLayer({ id: STRATI[1], type: 'line', source: SORGENTE, filter: ['!=', ['geometry-type'], 'Point'],
    paint: { 'line-color': colore, 'line-width': 3 } });
  map.addLayer({ id: STRATI[2], type: 'circle', source: SORGENTE, filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-color': colore, 'circle-opacity': 0.35, 'circle-radius': 9, 'circle-stroke-color': colore, 'circle-stroke-width': 3 } });
}

export function evidenzia(map, scelte) {
  assicuraStrati(map);
  map.getSource(SORGENTE).setData(collezione(scelte));
  // sempre sopra agli strati aggiunti dopo (es. riaccensioni dei layer dei dati)
  for (const id of STRATI) map.moveLayer(id);
}

export function cancellaEvidenza(map) {
  if (map.getSource(SORGENTE)) map.getSource(SORGENTE).setData(collezione([]));
}

// Mini-grafico dell'andamento 2011-2035 come geometria sulla mappa: linea dei dati osservati, tratteggio dello scenario,
// freccia in punta e nome (nessuna area sotto la curva: coprirebbe il colore della mappa). Essendo disegnato in coordinate geografiche, si rimpicciolisce e ingrandisce con lo
// zoom come i confini. Il profilo normalizzato viene da `profilo` in scheda-trend.js.
import { profilo, COLORE_CALO, COLORE_CRESCITA } from './scheda-trend.js';

const M_LON = 111320; // metri per grado di longitudine all'equatore (× cos latitudine)
const M_LAT = 110574; // metri per grado di latitudine
// Il riquadro del grafico (centro gx, gy e larghezza gw in metri) lo calcola scripts/trend_demografico.py: è il riquadro più
// largo, alto la metà, che sta dentro il poligono. Il grafico occupa la parte alta del riquadro e sotto resta il posto del nome.
const QUOTA_LARGHEZZA = 0.9; // larghezza della linea / larghezza del riquadro (il resto è per la freccia in punta)
const ALTEZZA = 0.34; // altezza del grafico / larghezza del riquadro (il riquadro è alto 0,5)
const SPOSTA_SU = 0.06; // il grafico è alzato di questo tanto, sempre in larghezze del riquadro
// tinte più scure di quelle dell'area, perché la linea si stacchi dal colore di fondo
const SCURO = { [COLORE_CRESCITA]: '#1b5e1b', [COLORE_CALO]: '#521a85' };
const PUNTA = 0.035; // lato della freccia / larghezza del riquadro: piccola, solo per dare il verso

// `p`: proprietà del punto (dati del trend e riquadro gx, gy, gw). Ritorna feature GeoJSON con `tipo`: linea e
// proiezione (linee), punta (poligono), nome (punto).
export function costruisciGrafico(p) {
  const { gx: lon, gy: lat, gw } = p;
  const cos = Math.cos((lat * Math.PI) / 180);
  const larghezza = gw * QUOTA_LARGHEZZA;
  const altezza = gw * ALTEZZA;
  const su = gw * SPOSTA_SU;
  const aGradi = ([x, y]) => [lon + x / (M_LON * cos), lat + y / M_LAT];
  const { colore: c, punti } = profilo(p);
  const locali = punti.map(d => [(d.x - 0.5) * larghezza, (0.5 - d.y) * altezza + su, d.osservato]);
  const osservati = locali.filter(d => d[2]);
  const ultimo = osservati.at(-1);
  const proiezione = [ultimo, ...locali.filter(d => !d[2])];
  const percorso = locali.map(d => [d[0], d[1]]);
  const comuni = { livello: p.livello, nome: p.nome, colore: SCURO[c] ?? c };
  const f = (tipo, geometry) => ({ type: 'Feature', properties: { ...comuni, tipo }, geometry });
  const fondo = su - altezza / 2;
  // freccia in punta, orientata come l'ultimo tratto del percorso
  const [x1, y1] = percorso.at(-2);
  const [x2, y2] = percorso.at(-1);
  const lunghezza = Math.hypot(x2 - x1, y2 - y1) || 1;
  const dx = (x2 - x1) / lunghezza;
  const dy = (y2 - y1) / lunghezza;
  const lato = PUNTA * gw;
  const punta = [[x2 + dx * lato, y2 + dy * lato], [x2 - dy * lato * 0.5, y2 + dx * lato * 0.5], [x2 + dy * lato * 0.5, y2 - dx * lato * 0.5]];
  return [
    f('linea', { type: 'LineString', coordinates: osservati.map(d => aGradi(d)) }),
    f('proiezione', { type: 'LineString', coordinates: proiezione.map(d => aGradi(d)) }),
    f('punta', { type: 'Polygon', coordinates: [[...punta.map(aGradi), aGradi(punta[0])]] }),
    f('nome', { type: 'Point', coordinates: aGradi([0, fondo - 0.01 * gw]) }),
  ];
}

// Tutti i grafici di una FeatureCollection del trend (un disegno per ogni punto che ha un riquadro).
export function costruisciGrafici(collezione) {
  return {
    type: 'FeatureCollection',
    features: collezione.features.filter(f => f.properties.tipo === 'punto' && f.properties.gw > 0).flatMap(f => costruisciGrafico(f.properties)),
  };
}

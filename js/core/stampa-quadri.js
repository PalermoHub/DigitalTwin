// Quadri d'unione per la stampa in scala: per ogni scala (1:500, 1:2.000, 1:5.000, 1:10.000) l'elenco delle tavole predefinite
// (dati/qu/quadri-stampa.json, generato da scripts/prepara_quadri_stampa.py). Sceglierne una porta il riquadro di stampa sulla tavola.

import { STRATI_AREA } from './stampa-aree.js';
import { FASCIA_TESTI_MM, MARGINE_MM } from './stampa.js';

export const FORMATO_TAVOLA = 'Tavola'; // formato su misura: la mappa è grande come la tavola
const SORGENTE = 'stampa-quadri';
const STRATI = ['stampa-quadri-riempimento', 'stampa-quadri-linea'];
const M_PER_GRADO = 111320;
let promessa = null;

// { '500': [{ nome, centro: [lng, lat], anello: [[lng, lat]…] }], '2000': […], … }
export function caricaQuadri() {
  promessa ??= import('./config.js').then(({ urlDati }) => fetch(urlDati('qu/quadri-stampa.json'))).then(r => r.json()).catch(() => { promessa = null; return {}; });
  return promessa;
}

// Larghezza e altezza della tavola in metri sul terreno
export function misureTavolaM(tavola) {
  if (tavola.larghezza && tavola.altezza) return { larghezza: tavola.larghezza, altezza: tavola.altezza };
  const xs = tavola.anello.map(p => p[0]);
  const ys = tavola.anello.map(p => p[1]);
  return {
    larghezza: (Math.max(...xs) - Math.min(...xs)) * Math.cos(tavola.centro[1] * Math.PI / 180) * M_PER_GRADO,
    altezza: (Math.max(...ys) - Math.min(...ys)) * M_PER_GRADO,
  };
}

// Pagina (mm) la cui area di mappa è esattamente `area` (mm): il foglio aggiunge margini e fascia dei testi, il poster banner e cornice
export function paginaSuMisura(area, uscita) {
  if (uscita === 'stampa') return { larghezza: area.larghezza + 2 * MARGINE_MM, altezza: area.altezza + 2 * MARGINE_MM + FASCIA_TESTI_MM };
  // poster: corpo = max(2,4; larghezza pagina / 120), cornice 3 corpi per lato, banner 4,2 corpi
  const corpo = Math.max(2.4, area.larghezza / 114) // da area = pagina - 6 corpi e corpo = pagina / 120;
  return { larghezza: area.larghezza + 6 * corpo, altezza: area.altezza + 10.2 * corpo };
}

// Orizzontale se la tavola è più larga che alta (misure in metri, non in gradi)
export function orientamentoQuadro(tavola) {
  const { larghezza, altezza } = misureTavolaM(tavola);
  return larghezza >= altezza ? 'landscape' : 'portrait';
}

const collezione = (tavole, scelta) => ({
  type: 'FeatureCollection',
  features: tavole.map(t => ({ type: 'Feature', properties: { nome: t.nome, scelto: t.nome === scelta ? 1 : 0 }, geometry: { type: 'Polygon', coordinates: [t.anello] } })),
});

// Disegna i contorni delle tavole (quella scelta evidenziata); si può richiamare quante volte si vuole
export function mostraQuadri(map, tavole, scelta = null) {
  const dati = collezione(tavole, scelta);
  if (map.getSource(SORGENTE)) { map.getSource(SORGENTE).setData(dati); return; }
  map.addSource(SORGENTE, { type: 'geojson', data: dati });
  map.addLayer({ id: STRATI[0], type: 'fill', source: SORGENTE, paint: { 'fill-color': '#d4380d', 'fill-opacity': ['case', ['==', ['get', 'scelto'], 1], 0.12, 0.03] } });
  map.addLayer({ id: STRATI[1], type: 'line', source: SORGENTE, paint: { 'line-color': '#d4380d', 'line-width': ['case', ['==', ['get', 'scelto'], 1], 3, 1.2], 'line-dasharray': [4, 2] } });
}

export function nascondiQuadri(map) {
  for (const id of STRATI) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(SORGENTE)) map.removeSource(SORGENTE);
}

// Esegue `azione` con i contorni nascosti (non devono finire nell'anteprima né nel file esportato) e poi li rimette
export async function senzaQuadri(map, azione) {
  const visibili = [...STRATI, ...STRATI_AREA].filter(id => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none');
  for (const id of visibili) map.setLayoutProperty(id, 'visibility', 'none');
  try { return await azione(); } finally { for (const id of visibili) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible'); }
}

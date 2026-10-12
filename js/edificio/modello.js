// Modello della vista «Edificio in 3D»: espressioni MapLibre per l'esploso dei piani, filtri, colori e scheda.
// Niente DOM né MapLibre qui (vedi tests/js/edificio-modello.test.mjs).
// I dati sono quelli di scripts/edificio/crociferi.py: ogni oggetto ha piano, livello (0 = terra), tipo, quota e h (m).
import { t, localeIntl } from '../core/i18n.js';

// tipi di oggetto raggruppati come interruttori della vista (etichetta: edificio.gruppo.<id>)
export const GRUPPI = [
  { id: 'muri', tipi: ['muro', 'tamburo'] },
  { id: 'aperture', tipi: ['architrave', 'davanzale'] },
  { id: 'solai', tipi: ['solaio'] },
  { id: 'stanze', tipi: ['stanza', 'esterno'] },
  { id: 'copertura', tipi: ['tetto', 'cupola', 'lanterna'] },
];

// un colore per piano: colora le stanze e la tacca dei piani nell'elenco
export const COLORI_PIANI = {
  terra: '#d9a441', ammezzato: '#c97b4a', primo: '#5b8fb9', secondo: '#6aa36f', terzo: '#9a72b5', copertura: '#b0503a',
};
const COLORI_TIPI = {
  muro: '#e6dcc8', tamburo: '#e6dcc8', architrave: '#d8ccb4', davanzale: '#d8ccb4', solaio: '#b9b4ab',
  esterno: '#9cc58a', tetto: '#b4624a', cupola: '#c98a62', lanterna: '#efe6d4',
};

// L'esploso alza ogni piano di `passo` metri per livello: base e cima di un oggetto si spostano insieme.
export function altezze(passo) {
  const spinta = ['*', ['coalesce', ['get', 'livello'], 0], passo];
  const quota = ['to-number', ['get', 'quota'], 0];
  return {
    base: ['+', quota, spinta],
    cima: ['+', ['max', ['to-number', ['get', 'h'], 0], ['+', quota, 0.02]], spinta],
  };
}

export function tipiAccesi(gruppiAccesi) {
  return GRUPPI.filter(g => gruppiAccesi.includes(g.id)).flatMap(g => g.tipi);
}

// Filtro dei volumi: piani e gruppi accesi; i vuoti (la chiesa sopra il piano terra) e i punti dei numeri mai.
export function filtroVolumi(piani, gruppiAccesi) {
  return ['all',
    ['==', ['geometry-type'], 'Polygon'],
    ['in', ['get', 'piano'], ['literal', piani]],
    ['in', ['get', 'tipo'], ['literal', tipiAccesi(gruppiAccesi)]],
  ];
}

export function filtroNumeri(piani) {
  return ['all', ['==', ['get', 'tipo'], 'numero'], ['in', ['get', 'piano'], ['literal', piani]]];
}

// Stanze del colore del loro piano, il resto del colore del tipo; in evidenza (hover) un giallo.
export function coloreVolumi() {
  const perPiano = ['match', ['get', 'piano'], ...Object.entries(COLORI_PIANI).flat(), '#cccccc'];
  const perTipo = ['match', ['get', 'tipo'], ...Object.entries(COLORI_TIPI).flat(), '#cccccc'];
  return ['case',
    ['boolean', ['feature-state', 'evidenza'], false], '#ffcf33',
    ['==', ['get', 'tipo'], 'stanza'], perPiano,
    perTipo];
}

// nome del piano nella lingua corrente; i dati portano quello italiano come riserva
export const nomePiano = (id, nome) => {
  const k = `edificio.piano.${id}`;
  const v = t(k);
  return v === k ? (nome || id) : v;
};

const numero = (v, cifre) => Number(v).toLocaleString(localeIntl(), { minimumFractionDigits: cifre, maximumFractionDigits: cifre });

// --- stanza di un clic: il numero va nel popup anche se si clicca un muro, un'apertura o il solaio ---

const anelloContiene = (anello, [x, y]) => {
  let dentro = false;
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [xi, yi] = anello[i], [xj, yj] = anello[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
};
// un poligono GeoJSON (anello esterno e fori) contiene il punto [lon, lat]
export const poligonoContiene = (coords, pt) => anelloContiene(coords[0], pt) && !coords.slice(1).some(r => anelloContiene(r, pt));

// distanze in metri tra punti [lon, lat] vicini (proiezione equirettangolare locale: basta per un edificio)
const M_LAT = 110540;
const inMetri = ([x, y], lat0) => [x * M_LAT * Math.cos(lat0 * Math.PI / 180) * (111320 / M_LAT), y * M_LAT];
function distSegmento(p, a, b) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const l2 = dx * dx + dy * dy;
  const k = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - a[0] - k * dx, p[1] - a[1] - k * dy);
}
function distBordo(p, anelloM) {
  let d = Infinity;
  for (let i = 1; i < anelloM.length; i++) d = Math.min(d, distSegmento(p, anelloM[i - 1], anelloM[i]));
  return d;
}
// distanza (m) di un punto da un poligono: 0 se è dentro
export function distanzaPoligono(coords, pt) {
  if (poligonoContiene(coords, pt)) return 0;
  const lat0 = pt[1];
  return Math.min(...coords.map(r => distBordo(inMetri(pt, lat0), r.map(q => inMetri(q, lat0)))));
}
// due poligoni si toccano se un vertice dell'uno sta entro `soglia` metri dal bordo dell'altro
function siToccano(a, b, soglia) {
  const lat0 = a[0][0][1];
  const am = a[0].map(q => inMetri(q, lat0)), bm = b[0].map(q => inMetri(q, lat0));
  return am.some(p => distBordo(p, bm) < soglia) || bm.some(p => distBordo(p, am) < soglia);
}
const perNumero = (a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b));

// le stanze numerate di un piano, dagli oggetti del GeoJSON
export const stanzeNumerate = (features, piano) =>
  features.filter(f => f.properties.tipo === 'stanza' && f.properties.numero && f.properties.piano === piano);

// La stanza (o le stanze) di un clic. Pavimento e solaio: quella che contiene il punto. Muri, architravi e davanzali:
// tra le stanze che li toccano (entro 0,6 m), le una o due più vicine al punto del clic: un muro lungo, come la spina
// del corridoio, tocca tutte le stanze dell'ala. Restituisce { stanza } o { adiacenti }.
export function stanzeDelClic(feature, lngLat, features) {
  const p = feature.properties;
  if (p.tipo === 'stanza') return p.numero ? { stanza: p.numero } : {};
  const stanze = stanzeNumerate(features, p.piano);
  if (p.tipo === 'solaio' || p.tipo === 'esterno') {
    const s = stanze.find(f => poligonoContiene(f.geometry.coordinates, lngLat));
    return s ? { stanza: s.properties.numero } : {};
  }
  if (!['muro', 'architrave', 'davanzale'].includes(p.tipo) || feature.geometry?.type !== 'Polygon') return {};
  const vicine = stanze.filter(f => siToccano(feature.geometry.coordinates, f.geometry.coordinates, 0.6))
    .map(f => ({ n: f.properties.numero, d: distanzaPoligono(f.geometry.coordinates, lngLat) }))
    .sort((a, b) => a.d - b.d);
  if (!vicine.length) return {};
  const scelte = vicine.filter(v => v.d <= vicine[0].d + 2).slice(0, 2).map(v => v.n);
  return { adiacenti: [...new Set(scelte)].sort(perNumero) };
}

// Righe della scheda di un oggetto cliccato; `stanze` viene da stanzeDelClic.
export function righeScheda(p, stanze = {}) {
  // un ambiente con nome proprio (l'ex chiesa) mostra il nome al posto del tipo
  const righe = [[t('edificio.scheda.piano'), nomePiano(p.piano, p.nome_piano)], [t('edificio.scheda.elemento'), p.nome || t(`edificio.tipo.${p.tipo}`)]];
  const n = stanze.stanza ?? p.numero;
  if (n) righe.push([t('edificio.scheda.stanza'), n]);
  else if (stanze.adiacenti?.length) {
    righe.push([t(stanze.adiacenti.length === 1 ? 'edificio.scheda.adiacente' : 'edificio.scheda.adiacenti'), stanze.adiacenti.join(', ')]);
  }
  if (p.area != null) righe.push([t('edificio.scheda.superficie'), `${numero(p.area, 1)} m²`]);
  if (p.tipo === 'stanza' || p.tipo === 'solaio' || p.tipo === 'esterno') righe.push([t('edificio.scheda.calpestio'), `${numero(p.quota, 2)} m`]);
  else righe.push([t('edificio.scheda.da'), `${numero(p.quota, 2)} m`], [t('edificio.scheda.a'), `${numero(p.h, 2)} m`]);
  return righe;
}

// I prospetti coprono l'edificio intero: si vedono solo a piani riuniti, fuori dalla pianta e con le murature accese.
export function prospettiVisibili({ acceso, passo, pianta, gruppi, piani }) {
  return Boolean(acceso) && passo === 0 && !pianta && gruppi.includes('muri') && piani.includes('primo');
}

// Piani nell'ordine dal basso, dai metadati del GeoJSON (o dagli oggetti, se mancano).
export function pianiDa(fc) {
  if (fc.metadata?.piani?.length) return [...fc.metadata.piani].sort((a, b) => a.livello - b.livello);
  const visti = new Map();
  for (const f of fc.features) {
    const p = f.properties;
    if (!visti.has(p.piano)) visti.set(p.piano, { id: p.piano, nome: p.nome_piano || p.piano, livello: p.livello ?? 0 });
  }
  return [...visti.values()].sort((a, b) => a.livello - b.livello);
}

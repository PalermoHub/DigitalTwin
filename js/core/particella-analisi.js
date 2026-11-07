// Analisi di una particella catastale incrociata con gli edifici: superficie, edifici dentro, coperto, altezze, volume.
// Modulo puro (nessun accesso alla mappa): riceve la geometria della particella e i pezzi di edificio letti dai tile.
// Come in «Palermo ordinata» (js/lotti.js): un edificio conta se almeno il 10% della sua impronta cade nella particella;
// «a cavallo» se ne esce una parte. Edifici (CTC 2006 + globale) e catasto non coincidono al metro: i valori sono stime.
import { areaMq, estremi } from './scheda-pdf-geom.js';

export const SOGLIA_CONTA = 0.1;   // quota minima dell'impronta nella particella perché l'edificio conti
export const SOGLIA_INTERNO = 0.9; // sopra questa quota l'edificio è tutto dentro
const M_PER_GRADO = 111320;
const MAX_CAMPIONI = 900;          // punti di prova per edificio
const PASSO_MIN = 0.5;             // m

// Anelli [x, y] in metri su un piano locale centrato in (lng0, lat0), uno per poligono
function proietta(geom, lng0, lat0) {
  const k = Math.cos(lat0 * Math.PI / 180);
  const anello = r => r.map(([lng, lat]) => [(lng - lng0) * k * M_PER_GRADO, (lat - lat0) * M_PER_GRADO]);
  const poligoni = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  return poligoni.map(p => p.map(anello));
}

// Pari-dispari su tutti gli anelli del poligono (i buchi escludono il punto)
function dentroPoligono(x, y, anelli) {
  let dentro = false;
  for (const a of anelli) {
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i], [xj, yj] = a[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dentro = !dentro;
    }
  }
  return dentro;
}

const dentroAlmenoUno = (x, y, poligoni) => poligoni.some(p => dentroPoligono(x, y, p));

function riquadro(poligoni) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of poligoni) for (const a of p) for (const [x, y] of a) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}

const sovrapposti = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

// Quota (0-1) dell'impronta dell'edificio che cade nella particella, per campionamento a griglia
function quotaDentro(edificio, particella, rParticella) {
  const r = riquadro(edificio);
  const w = r[2] - r[0], h = r[3] - r[1];
  if (!(w > 0 && h > 0)) return 0;
  const passo = Math.max(PASSO_MIN, Math.sqrt(w * h / MAX_CAMPIONI));
  let tot = 0, dentro = 0;
  for (let y = r[1] + passo / 2; y < r[3]; y += passo) {
    for (let x = r[0] + passo / 2; x < r[2]; x += passo) {
      if (!dentroAlmenoUno(x, y, edificio)) continue;
      tot++;
      if (x >= rParticella[0] && x <= rParticella[2] && y >= rParticella[1] && y <= rParticella[3] && dentroAlmenoUno(x, y, particella)) dentro++;
    }
  }
  if (tot) return dentro / tot;
  const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; // edificio più piccolo del passo: basta il centro
  return dentroAlmenoUno(cx, cy, particella) ? 1 : 0;
}

// Area dell'unione dei poligoni (m²) per campionamento a griglia: non conta due volte le sovrapposizioni
function areaUnione(poligoni, r) {
  const w = r[2] - r[0], h = r[3] - r[1];
  const passo = Math.max(PASSO_MIN, Math.sqrt(w * h / 40000));
  let dentro = 0;
  for (let y = r[1] + passo / 2; y < r[3]; y += passo) for (let x = r[0] + passo / 2; x < r[2]; x += passo) if (dentroAlmenoUno(x, y, poligoni)) dentro++;
  return dentro * passo * passo;
}

/* particella: geometria GeoJSON intera (Polygon/MultiPolygon).
   pezzi: [{ id, geometry, altezza?, pop? }]: i tile possono tagliare un edificio in più pezzi con lo stesso id (si ricompongono).
   Ritorna { m2, copertoM2, copertura (0-100), n, nCavallo, altezze: { min, med, max, noti, ignote }, volumeM3, residenti } o null. */
export function analizzaParticella(particella, pezzi, { pezziUniti = false } = {}) {
  // pezziUniti: la particella è il MultiPolygon dei pezzi di tile, che si sovrappongono nel buffer: l'area si misura sull'unione
  const [o, s, e, n] = estremi([particella]);
  if (![o, s, e, n].every(Number.isFinite)) return null;
  const lng0 = (o + e) / 2, lat0 = (s + n) / 2;
  const pp = proietta(particella, lng0, lat0), rp = riquadro(pp);
  const m2 = pezziUniti ? areaUnione(pp, rp) : areaMq(particella);
  if (!(m2 > 0)) return null;

  const perId = new Map();
  pezzi.forEach((p, i) => {
    if (!p.geometry || !/Polygon/.test(p.geometry.type)) return;
    const chiave = p.id ?? `#${i}`;
    if (!perId.has(chiave)) perId.set(chiave, { pezzi: new Map(), altezza: p.altezza, pop: p.pop });
    perId.get(chiave).pezzi.set(JSON.stringify(p.geometry), p.geometry); // copie identiche (stesso tile letto due volte) una volta sola
  });

  let copertoM2 = 0, conta = 0, cavallo = 0, volume = 0, residenti = 0, haPop = false, pesoH = 0, sommaH = 0, hMin = Infinity, hMax = 0, ignote = 0;
  for (const ed of perId.values()) {
    const geoms = [...ed.pezzi.values()];
    const poli = geoms.flatMap(g => proietta(g, lng0, lat0));
    if (!sovrapposti(riquadro(poli), rp)) continue;
    const quota = quotaDentro(poli, pp, rp);
    if (quota < SOGLIA_CONTA) continue;
    const area = geoms.reduce((a, g) => a + areaMq(g), 0), dentro = area * quota;
    conta++;
    if (quota < SOGLIA_INTERNO) cavallo++;
    copertoM2 += dentro;
    if (Number.isFinite(ed.pop)) { residenti += ed.pop * quota; haPop = true; }
    const h = Number(ed.altezza);
    if (h > 0) { // altezza 0 o assente = ignota: non entra in media, minimo, massimo e volume
      hMin = Math.min(hMin, h); hMax = Math.max(hMax, h);
      sommaH += h * dentro; pesoH += dentro; volume += h * dentro;
    } else ignote++;
  }
  return {
    m2, copertoM2, copertura: Math.min(100, copertoM2 / m2 * 100), n: conta, nCavallo: cavallo,
    altezze: { min: pesoH ? hMin : null, med: pesoH ? sommaH / pesoH : null, max: pesoH ? hMax : null, noti: conta - ignote, ignote },
    volumeM3: pesoH ? volume : null, residenti: haPop ? residenti : null,
  };
}

// Zone urbanistiche (PRG) o vincoli che intersecano una particella: m² e quota di particella per ciascuna.
// Modulo puro (nessun accesso alla mappa): riceve la geometria della particella e i pezzi letti dai tile.
// I tile tagliano le zone in più pezzi che si sovrappongono nel buffer: per chiave si uniscono, poi si interseca con la particella.
import { areaMq } from './scheda-pdf-geom.js';

const poligoni = g => (g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : []);
const SOGLIA_MQ = 0.5; // sotto questa area l'intersezione è un residuo di calcolo

/* particella: geometria GeoJSON (Polygon/MultiPolygon).
   pezzi: [{ geometry, properties }] di zone (poligoni) o vincoli areali.
   chiave(pezzo) → stringa che identifica la classe (es. la zona ZTO); null/'' = pezzo ignorato.
   lib: { union, intersection } di polygon-clipping.
   Ritorna { m2, righe: [{ chiave, m2, quota (0-100), esempio }], fuoriM2 } o null.
   Le righe sono dalla più estesa; `fuoriM2` è la parte non coperta da nessun pezzo (solo per zone che non si sovrappongono). */
export function urbanisticaParticella(particella, pezzi, chiave, lib) {
  if (!lib?.union || !lib?.intersection) return null;
  const pp = poligoni(particella);
  const m2 = areaMq(particella);
  if (!pp.length || !(m2 > 0)) return null;

  const perChiave = new Map();
  for (const p of pezzi) {
    const k = chiave(p);
    if (!k) continue;
    const poli = poligoni(p.geometry);
    if (!poli.length) continue;
    if (!perChiave.has(k)) perChiave.set(k, { poli: [], esempio: p });
    perChiave.get(k).poli.push(...poli);
  }

  const righe = [];
  const coperti = [];
  for (const [k, { poli, esempio }] of perChiave) {
    try {
      const unione = poli.length > 1 ? lib.union(poli[0], ...poli.slice(1)) : poli;
      const dentro = lib.intersection(pp, unione);
      const area = areaMq({ type: 'MultiPolygon', coordinates: dentro });
      if (area < SOGLIA_MQ) continue;
      righe.push({ chiave: k, m2: area, quota: Math.min(100, area / m2 * 100), esempio });
      coperti.push(...dentro);
    } catch { /* geometria non valida: la classe si salta */ }
  }
  righe.sort((a, b) => b.m2 - a.m2);

  let copertoM2 = 0;
  if (coperti.length) {
    try { copertoM2 = areaMq({ type: 'MultiPolygon', coordinates: coperti.length > 1 ? lib.union(coperti[0], ...coperti.slice(1)) : coperti }); } catch { copertoM2 = righe.reduce((a, r) => a + r.m2, 0); }
  }
  return { m2, righe, fuoriM2: Math.max(0, m2 - Math.min(m2, copertoM2)) };
}

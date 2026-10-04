// js/rndt/area.js
// Area di lavoro del catalogo RNDT: solo Palermo. Moduli puri, senza DOM.

// ovest, sud, est, nord = LIMITI di core/config.js (config.js usa `window`: qui non si importa)
export const BBOX_PALERMO = [13.1, 37.9785, 13.55, 38.2919];
export const CENTRO_PALERMO = [13.33225, 38.14074];
export const SOGLIA_FILTRO = 5000; // sopra questo numero di feature il filtro sul confine costa troppo nel browser

export function intersezione(a, b) {
  const w = Math.max(a[0], b[0]), s = Math.max(a[1], b[1]), e = Math.min(a[2], b[2]), n = Math.min(a[3], b[3]);
  return w < e && s < n ? [w, s, e, n] : null;
}

// La vista della mappa ristretta a Palermo; fuori da Palermo (o senza vista) vale tutta Palermo.
export function vistaPalermo(vista) {
  return (vista && intersezione(vista, BBOX_PALERMO)) || BBOX_PALERMO;
}

export function dentroAnello([x, y], anello) {
  let dentro = false;
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [xi, yi] = anello[i], [xj, yj] = anello[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

const dentroConfine = (p, anelli) => anelli.some(a => dentroAnello(p, a));

function* vertici(g) {
  if (!g) return;
  switch (g.type) {
    case 'Point': yield g.coordinates; break;
    case 'MultiPoint': case 'LineString': yield* g.coordinates; break;
    case 'MultiLineString': case 'Polygon': for (const r of g.coordinates) yield* r; break;
    case 'MultiPolygon': for (const p of g.coordinates) for (const r of p) yield* r; break;
    case 'GeometryCollection': for (const x of g.geometries) yield* vertici(x); break;
  }
}

// un poligono regionale può contenere Palermo senza avere un solo vertice dentro il Comune
function contieneCentro(g) {
  const poligoni = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
  return poligoni.some(p => dentroAnello(CENTRO_PALERMO, p[0]));
}

// Tiene le feature intere che toccano il Comune (nessun taglio geometrico). Sopra soglia, o senza confine, non filtra.
export function filtraSuConfine(fc, anelli, soglia = SOGLIA_FILTRO) {
  const feature = fc.features ?? [];
  if (!anelli?.length || feature.length > soglia) return { fc, filtrato: false };
  const tocca = f => { for (const v of vertici(f.geometry)) if (dentroConfine(v, anelli)) return true; return contieneCentro(f.geometry); };
  return { fc: { ...fc, features: feature.filter(tocca) }, filtrato: true };
}

// `confini_zone.json` (popolazione): le circoscrizioni sono anelli [lng, lat]; insieme coprono il Comune
export const anelliDaZone = zone => (zone?.circoscrizioni ?? []).map(c => c.ring).filter(r => Array.isArray(r) && r.length > 3);

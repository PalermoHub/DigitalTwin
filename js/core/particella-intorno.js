// Intorno di una particella: confinanti, particelle e civici entro un raggio, distanza dal vincolo lineare più vicino.
// Modulo puro: tutte le geometrie sono GeoJSON in gradi; i calcoli sono in metri su un piano locale.
const M_PER_GRADO = 111320;
export const RAGGIO_M = 100;
const TOCCO_M = 0.5; // due particelle si toccano se i bordi distano meno di così

const poligoni = g => (g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : []);
const linee = g => (g?.type === 'LineString' ? [g.coordinates] : g?.type === 'MultiLineString' ? g.coordinates : []);

const distPuntoSegmento = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

function dentro(px, py, anelli) { // pari-dispari su tutti gli anelli
  let d = false;
  for (const a of anelli) for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
    const [xi, yi] = a[i], [xj, yj] = a[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) d = !d;
  }
  return d;
}

const distPuntoAnelli = (px, py, anelli) => Math.min(...anelli.flatMap(a => a.slice(1).map((q, i) => distPuntoSegmento(px, py, a[i], q))));

// distanza minima tra due insiemi di poligoni proiettati (0 se si toccano o uno sta nell'altro)
function distPoligoni(A, B) {
  let min = Infinity;
  for (const [X, Y] of [[A, B], [B, A]]) {
    for (const px of X) for (const [x, y] of px.flat()) {
      if (Y.some(py => dentro(x, y, py))) return 0;
      for (const py of Y) min = Math.min(min, distPuntoAnelli(x, y, py));
    }
  }
  return min;
}

/* particella: GeoJSON. vicine: [{ id, geometry }] (anche più pezzi con lo stesso id; `id` della particella stessa è escluso da `propria`).
   civici: [{ geometry: Point }]. lineari: [{ tipo, geometry }].
   Ritorna { confinanti: [id], vicine: n, civici: n, lineare: { d, tipo } | null }. */
export function intornoParticella(particella, { vicine = [], civici = [], lineari = [], propria = null, raggio = RAGGIO_M } = {}) {
  const pp = poligoni(particella);
  if (!pp.length) return null;
  const tutti = pp.flat(2);
  const lng0 = tutti.reduce((s, p) => s + p[0], 0) / tutti.length, lat0 = tutti.reduce((s, p) => s + p[1], 0) / tutti.length;
  const k = Math.cos(lat0 * Math.PI / 180);
  const proj = ([x, y]) => [(x - lng0) * k * M_PER_GRADO, (y - lat0) * M_PER_GRADO];
  const P = pp.map(p => p.map(a => a.map(proj)));

  const minPerId = new Map();
  for (const v of vicine) {
    if (v.id == null || v.id === propria) continue;
    const Q = poligoni(v.geometry).map(p => p.map(a => a.map(proj)));
    if (!Q.length) continue;
    const d = distPoligoni(P, Q);
    minPerId.set(v.id, Math.min(d, minPerId.get(v.id) ?? Infinity));
  }
  const confinanti = [...minPerId].filter(([, d]) => d <= TOCCO_M).map(([id]) => id);
  const nVicine = [...minPerId.values()].filter(d => d <= raggio).length;

  const nCivici = civici.filter(c => {
    if (c.geometry?.type !== 'Point') return false;
    const [x, y] = proj(c.geometry.coordinates);
    return P.some(p => dentro(x, y, p)) || Math.min(...P.map(p => distPuntoAnelli(x, y, p))) <= raggio;
  }).length;

  const cx = (Math.min(...P.flat(2).map(p => p[0])) + Math.max(...P.flat(2).map(p => p[0]))) / 2;
  const cy = (Math.min(...P.flat(2).map(p => p[1])) + Math.max(...P.flat(2).map(p => p[1]))) / 2;
  let lineare = null;
  for (const l of lineari) for (const seg of linee(l.geometry)) {
    const s = seg.map(proj);
    for (let i = 0; i < s.length - 1; i++) {
      const d = distPuntoSegmento(cx, cy, s[i], s[i + 1]);
      if (!lineare || d < lineare.d) lineare = { d, tipo: l.tipo };
    }
  }
  return { confinanti, vicine: nVicine, civici: nCivici, lineare };
}

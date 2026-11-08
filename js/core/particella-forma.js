// Forma del lotto: compattezza (Polsby-Popper), rapporto tra i lati del rettangolo minimo, perimetro.
// Modulo puro: riceve la geometria GeoJSON della particella (Polygon/MultiPolygon, si usa il poligono più esteso).
const M_PER_GRADO = 111320;

const areaAnello = pts => { let a = 0; for (let i = 0; i < pts.length - 1; i++) a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]; return Math.abs(a) / 2; };

/* Ritorna { compattezza (0-1), rapporto (0-1), perimetro (m), lungo (m), corto (m), esito } o null.
   esito: 'stretto' | 'irregolare' | 'compatto' | 'regolare' (la frase la sceglie chi mostra il dato). */
export function formaLotto(geom) {
  const poligoni = geom?.type === 'Polygon' ? [geom.coordinates] : geom?.type === 'MultiPolygon' ? geom.coordinates : [];
  let anello = null, migliore = 0;
  for (const p of poligoni) {
    const r = p[0];
    if (!r || r.length < 4) continue;
    const k = Math.cos(r[0][1] * Math.PI / 180);
    const a = areaAnello(r.map(([x, y]) => [x * k * M_PER_GRADO, y * M_PER_GRADO]));
    if (a > migliore) { migliore = a; anello = r; }
  }
  if (!anello) return null;
  const k = Math.cos(anello[0][1] * Math.PI / 180);
  const pts = anello.map(([x, y]) => [x * k * M_PER_GRADO, y * M_PER_GRADO]);
  let perimetro = 0;
  for (let i = 0; i < pts.length - 1; i++) perimetro += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  if (!migliore || !perimetro) return null;
  // rettangolo di area minima: scansione degli angoli a passo di 2°
  let best = null;
  for (let d = 0; d < 90; d += 2) {
    const c = Math.cos(d * Math.PI / 180), s = Math.sin(d * Math.PI / 180);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { const u = x * c + y * s, v = -x * s + y * c; if (u < x0) x0 = u; if (u > x1) x1 = u; if (v < y0) y0 = v; if (v > y1) y1 = v; }
    const w = x1 - x0, h = y1 - y0;
    if (!best || w * h < best.w * best.h) best = { w, h };
  }
  const lungo = Math.max(best.w, best.h), corto = Math.min(best.w, best.h);
  const compattezza = 4 * Math.PI * migliore / (perimetro * perimetro);
  const rapporto = lungo > 0 ? corto / lungo : 0;
  const esito = rapporto < 0.25 ? 'stretto' : compattezza < 0.35 ? 'irregolare' : compattezza > 0.65 && rapporto > 0.5 ? 'compatto' : 'regolare';
  return { compattezza, rapporto, perimetro, lungo, corto, esito };
}

// Un edificio letto dai tile arriva in più pezzi (uno per tile, con fasce di buffer sovrapposte): disegnati
// separatamente darebbero giunture e tinta doppia. Qui si uniscono in un'unica geometria (polygon-clipping, js/vendor).
const poligoni = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

// union: polygonClipping.union. Restituisce un MultiPolygon unico (se l'unione fallisce, i pezzi così come sono)
export function unisciPezzi(geoms, union) {
  const tutti = (geoms || []).flatMap(poligoni);
  if (!tutti.length) return null;
  if (tutti.length < 2 || !union) return { type: 'MultiPolygon', coordinates: tutti };
  try {
    const [primo, ...resto] = tutti;
    const u = union(primo, ...resto);
    return u.length ? { type: 'MultiPolygon', coordinates: u } : null;
  } catch { return { type: 'MultiPolygon', coordinates: tutti }; }
}

let caricamento;
// Carica la libreria al primo uso (script classico: espone globalThis.polygonClipping)
export function caricaUnione() {
  if (globalThis.polygonClipping) return Promise.resolve(globalThis.polygonClipping.union);
  caricamento ??= new Promise(ok => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/polygon-clipping.umd.min.js', import.meta.url);
    s.onload = () => ok(globalThis.polygonClipping?.union);
    s.onerror = () => { caricamento = null; ok(null); };
    document.head.append(s);
  });
  return caricamento;
}

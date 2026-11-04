// Geometria della particella per il PDF: area (sferica), riquadro e riconoscimento dei pezzi di tile.
const R = 6378137; // raggio terrestre, m (come Turf)
const rad = g => g * Math.PI / 180;

// area di un anello (formula sferica approssimata)
function anello(c) {
  let s = 0;
  for (let i = 0; i < c.length - 1; i++) {
    const [x1, y1] = c[i], [x2, y2] = c[i + 1];
    s += rad(x2 - x1) * (2 + Math.sin(rad(y1)) + Math.sin(rad(y2)));
  }
  return Math.abs(s * R * R / 2);
}

// m² di un Polygon o MultiPolygon (i buchi si sottraggono); 0 per altre geometrie
export function areaMq(g) {
  const poligono = rr => rr.reduce((a, r, i) => a + (i ? -anello(r) : anello(r)), 0);
  if (g?.type === 'Polygon') return poligono(g.coordinates);
  if (g?.type === 'MultiPolygon') return g.coordinates.reduce((a, p) => a + poligono(p), 0);
  return 0;
}

const punti = g => (g.type === 'Polygon' ? g.coordinates.flat() : g.type === 'MultiPolygon' ? g.coordinates.flat(2) : []);

// [ovest, sud, est, nord] di un insieme di geometrie
export function estremi(geometrie) {
  const p = geometrie.flatMap(punti);
  return [Math.min(...p.map(x => x[0])), Math.min(...p.map(x => x[1])), Math.max(...p.map(x => x[0])), Math.max(...p.map(x => x[1]))];
}

// I tile tagliano le geometrie: la stessa particella può arrivare in più pezzi. Con un solo pezzo (o copie identiche) la geometria
// è intera e l'area è affidabile; con pezzi diversi → null (il PDF omette l'area invece di darne una sbagliata).
export function particellaUnica(feature) {
  const diverse = new Map(feature.map(f => [JSON.stringify(f.geometry), f.geometry]));
  return diverse.size === 1 ? [...diverse.values()][0] : null;
}

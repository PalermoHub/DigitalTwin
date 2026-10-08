// Geometria minima, in coordinate piane [x, y] (lng/lat trattate come piano: basta a ritagli di una città).
// Un «criterio» è un elenco di poligoni GeoJSON (ognuno: elenco di anelli, il primo è il contorno, gli altri i buchi).

const dentroAnello = (p, anello) => {
  let dentro = false;
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [xi, yi] = anello[i];
    const [xj, yj] = anello[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
};

export const puntoInPoligono = (p, poligono) => dentroAnello(p, poligono[0]) && !poligono.slice(1).some(buco => dentroAnello(p, buco));

const orientamento = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
const sulSegmento = (a, b, p) => Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]);

export function segmentiSiIncrociano(a, b, c, d) {
  const o1 = orientamento(a, b, c);
  const o2 = orientamento(a, b, d);
  const o3 = orientamento(c, d, a);
  const o4 = orientamento(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && sulSegmento(a, b, c)) || (o2 === 0 && sulSegmento(a, b, d))
    || (o3 === 0 && sulSegmento(c, d, a)) || (o4 === 0 && sulSegmento(c, d, b));
}

const segmenti = linea => linea.slice(1).map((p, i) => [linea[i], p]);
const bordi = poligoni => poligoni.flatMap(poligono => poligono.flatMap(segmenti));

function lineaTocca(linea, poligoni) {
  if (linea.some(p => poligoni.some(g => puntoInPoligono(p, g)))) return true;
  const contorni = bordi(poligoni);
  return segmenti(linea).some(([a, b]) => contorni.some(([c, d]) => segmentiSiIncrociano(a, b, c, d)));
}

// tocca se: il contorno tocca il criterio; oppure un vertice del criterio sta nel corpo (non nei buchi);
// oppure un buco della feature incrocia il contorno del criterio
const poligonoTocca = (poligono, poligoni) => {
  if (lineaTocca(poligono[0], poligoni)) return true;
  if (poligoni.some(g => g[0].some(v => puntoInPoligono(v, poligono)))) return true;
  const contorni = bordi(poligoni);
  return poligono.slice(1).some(buco => segmenti(buco).some(([a, b]) => contorni.some(([c, d]) => segmentiSiIncrociano(a, b, c, d))));
};

export function interseca(geometria, poligoni) {
  if (!geometria || !poligoni.length) return false;
  const g = geometria;
  switch (g.type) {
    case 'Point': return poligoni.some(p => puntoInPoligono(g.coordinates, p));
    case 'MultiPoint': return g.coordinates.some(c => interseca({ type: 'Point', coordinates: c }, poligoni));
    case 'LineString': return lineaTocca(g.coordinates, poligoni);
    case 'MultiLineString': return g.coordinates.some(l => lineaTocca(l, poligoni));
    case 'Polygon': return poligonoTocca(g.coordinates, poligoni);
    case 'MultiPolygon': return g.coordinates.some(p => poligonoTocca(p, poligoni));
    case 'GeometryCollection': return g.geometries.some(x => interseca(x, poligoni));
    default: return false;
  }
}

export function riquadro(a, b) {
  const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
}

// Vertici cliccati → poligono chiuso. Il doppio clic aggiunge due volte l'ultimo vertice: si tolgono i consecutivi uguali.
export function chiudiPoligono(vertici) {
  const distinti = vertici.filter((v, i) => i === 0 || v[0] !== vertici[i - 1][0] || v[1] !== vertici[i - 1][1]);
  if (distinti.length < 3) return null;
  return [[...distinti, distinti[0]]];
}

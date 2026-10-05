// js/geoimage/geometria.js
// Geometria dei 4 angoli dell'immagine, in gradi lat/lng, nell'ordine NO, NE, SO, SE ({ lat, lng }).
// Spostamenti, rotazione e scala di Geoimage; le distanze est-ovest si correggono con cos(lat).
const RAD = Math.PI / 180;
const cosLat = lat => Math.cos(lat * RAD);
const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export const centro = a => ({
  lat: (a[0].lat + a[1].lat + a[2].lat + a[3].lat) / 4,
  lng: (a[0].lng + a[1].lng + a[2].lng + a[3].lng) / 4,
});

// Passo dei pulsanti freccia: 5 % del lato più corto
export const passo = a => Math.min(Math.abs(a[0].lat - a[2].lat), Math.abs(a[0].lng - a[1].lng)) * 0.05;

export const sposta = (a, dLat, dLng) => a.map(p => ({ lat: p.lat + dLat, lng: p.lng + dLng }));

// gradi > 0 = in senso orario
export function ruota(a, gradi) {
  const c = centro(a), k = cosLat(c.lat);
  const cos = Math.cos(gradi * RAD), sin = Math.sin(gradi * RAD);
  return a.map(p => {
    const y = p.lat - c.lat, x = (p.lng - c.lng) * k;
    return { lat: c.lat + y * cos - x * sin, lng: c.lng + (y * sin + x * cos) / k };
  });
}

export const scala = (a, fattore, ancora = centro(a)) => a.map(p => ({
  lat: ancora.lat + (p.lat - ancora.lat) * fattore,
  lng: ancora.lng + (p.lng - ancora.lng) * fattore,
}));

// Trascinando l'angolo `i` verso `punto` l'immagine si ingrandisce senza deformarsi, tenendo fermo l'angolo opposto.
// `a` sono gli angoli all'inizio del trascinamento.
export function scalaDaAngolo(a, i, punto) {
  const ancora = a[3 - i], k = cosLat(ancora.lat);
  const y0 = a[i].lat - ancora.lat, x0 = (a[i].lng - ancora.lng) * k;
  const y1 = punto.lat - ancora.lat, x1 = (punto.lng - ancora.lng) * k;
  const dot = y0 * y0 + x0 * x0;
  if (dot === 0) return copia(a);
  return scala(a, (y1 * y0 + x1 * x0) / dot, ancora);
}

// Posizione della maniglia di rotazione: oltre il lato nord, il 30 % della distanza dal centro
export function postoRotazione(a) {
  const c = centro(a);
  const lat = (a[0].lat + a[1].lat) / 2, lng = (a[0].lng + a[1].lng) / 2;
  return { lat: lat + (lat - c.lat) * 0.3, lng: lng + (lng - c.lng) * 0.3 };
}

// Da un punto della mappa al pixel dell'immagine (interpolazione bilineare risolta con Newton)
export function geoAPixel(a, larghezza, altezza, lat, lng) {
  const [NO, NE, SO, SE] = a;
  let s = 0.5, t = 0.5;
  for (let i = 0; i < 30; i++) {
    const fLat = (1 - s) * (1 - t) * NO.lat + s * (1 - t) * NE.lat + (1 - s) * t * SO.lat + s * t * SE.lat - lat;
    const fLng = (1 - s) * (1 - t) * NO.lng + s * (1 - t) * NE.lng + (1 - s) * t * SO.lng + s * t * SE.lng - lng;
    if (Math.abs(fLat) < 1e-11 && Math.abs(fLng) < 1e-11) break;
    const dLatS = -(1 - t) * NO.lat + (1 - t) * NE.lat - t * SO.lat + t * SE.lat;
    const dLatT = -(1 - s) * NO.lat - s * NE.lat + (1 - s) * SO.lat + s * SE.lat;
    const dLngS = -(1 - t) * NO.lng + (1 - t) * NE.lng - t * SO.lng + t * SE.lng;
    const dLngT = -(1 - s) * NO.lng - s * NE.lng + (1 - s) * SO.lng + s * SE.lng;
    const det = dLatS * dLngT - dLatT * dLngS;
    if (Math.abs(det) < 1e-15) break;
    s -= (fLat * dLngT - fLng * dLatT) / det;
    t -= (dLatS * fLng - dLngS * fLat) / det;
  }
  return { px: Math.round(s * larghezza), py: Math.round(t * altezza), valido: s >= -0.02 && s <= 1.02 && t >= -0.02 && t <= 1.02 };
}

// [[ovest, sud], [est, nord]] per fitBounds
export function limiti(a) {
  const lats = a.map(p => p.lat), lngs = a.map(p => p.lng);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

// Posizione iniziale di una nuova immagine: centrata sulla vista, nel 38 % dello spazio visibile, con le sue proporzioni
export function angoliIniziali(vista, larghezza, altezza) {
  const { centro: c, nord, sud, est, ovest } = vista;
  const spanLat = (nord - sud) * 0.38, spanLng = (est - ovest) * 0.38;
  const proporzione = larghezza / altezza;
  const dLat = proporzione > spanLng / spanLat ? spanLng / proporzione : spanLat;
  const dLng = proporzione > spanLng / spanLat ? spanLng : spanLat * proporzione;
  return [
    { lat: c.lat + dLat / 2, lng: c.lng - dLng / 2 },
    { lat: c.lat + dLat / 2, lng: c.lng + dLng / 2 },
    { lat: c.lat - dLat / 2, lng: c.lng - dLng / 2 },
    { lat: c.lat - dLat / 2, lng: c.lng + dLng / 2 },
  ];
}

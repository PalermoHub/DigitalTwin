// Punti con l'icona del tema in mappa (la pompa dei distributori, la spina delle colonnine): un disco del colore della categoria
// con il glifo di `icone.js` dentro. Le immagini si disegnano su canvas, una per ogni colore (sono poche: bandiere, stati),
// e il layer `symbol` sceglie quella giusta con un'espressione. A differenza delle forme SDF (forme.js) il colore è nell'immagine.
import { ICONE } from './icone.js';

const PR = 2; // pixelRatio: l'immagine misura il doppio dei punti a schermo
const LATO = 56; // px dell'immagine
const GLIFO = 1.2; // scala del glifo (viewBox 24) dentro il disco

export const idBadge = (icona, colore) => `badge-${icona}-${colore}`;

// Glifo scuro su sfondo chiaro, bianco su sfondo scuro.
export function coloreGlifo(colore) {
  const m = /^#([0-9a-f]{6})$/i.exec(colore) ?? /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(colore);
  if (!m) return '#fff';
  const h = m.length === 2 ? m[1] : m.slice(1).map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? '#222' : '#fff';
}

// Immagine per `map.addImage` (solo nel browser: usa un canvas).
export function immagineBadge(icona, colore) {
  const c = document.createElement('canvas');
  c.width = c.height = LATO;
  const g = c.getContext('2d');
  g.beginPath();
  g.arc(LATO / 2, LATO / 2, LATO / 2 - 3, 0, 2 * Math.PI);
  g.fillStyle = colore;
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = '#fff';
  g.stroke();
  const lato = 24 * GLIFO;
  g.translate((LATO - lato) / 2, (LATO - lato) / 2);
  g.scale(GLIFO, GLIFO);
  g.fillStyle = coloreGlifo(colore);
  g.fill(new Path2D(ICONE[icona]));
  return g.getImageData(0, 0, LATO, LATO);
}

// Registra l'immagine di ogni colore (quelle già presenti restano).
export function registraBadge(map, icona, colori) {
  for (const colore of new Set(colori)) {
    const id = idBadge(icona, colore);
    if (!map.hasImage(id)) map.addImage(id, immagineBadge(icona, colore), { pixelRatio: PR });
  }
}

// Espressione `icon-image`: l'immagine del colore della categoria (`voci` = [[valore, colore], …]), `altro` se nessuna.
export const espressioneBadge = (icona, campo, voci, altro) =>
  ['match', ['get', campo], ...voci.flatMap(([valore, colore]) => [valore, idBadge(icona, colore)]), idBadge(icona, altro)];

// Il layer `symbol` che mostra i badge. `icon-size` a 1 = 28 punti; qui da 17 (zoom 11) a 25 (zoom 17).
export function layerBadge({ id, source, immagine, layout = {}, paint = {} }) {
  return {
    id, type: 'symbol', source,
    layout: {
      'icon-image': immagine,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 17, 0.9],
      'icon-allow-overlap': true, 'icon-ignore-placement': true,
      ...layout,
    },
    paint,
  };
}

// Simbolo di legenda e di tooltip: un <i class="monumenti-pallino"> col disco colorato e il glifo come sfondo.
export function stileBadge(icona, colore) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${coloreGlifo(colore)}" d="${ICONE[icona]}"/></svg>`;
  return {
    background: `${colore} url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 78% no-repeat`,
    width: '16px', height: '16px',
  };
}

export function simboloBadge(icona, colore) {
  const i = document.createElement('i');
  i.className = 'monumenti-pallino';
  Object.assign(i.style, stileBadge(icona, colore));
  return i;
}

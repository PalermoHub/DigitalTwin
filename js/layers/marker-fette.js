// Icona canvas di un marker aggregato: anello a fette colorate (una per voce) o cerchio pieno (una sola), numero al centro.
// Usata dalle sedi degli uffici e dai progetti PNRR. `lista` = [{ colore, n }] come da `fette` (uffici-fette.js).
import { raggio, archi } from './uffici-fette.js';
import { ICONE } from '../core/icone.js';

export const PR = 2; // pixelRatio delle icone

// `glifo` (nome in icone.js): al centro va quell'icona al posto del numero (le sedi degli uffici; la dimensione dell'icona dice già quanti uffici ci sono).
export function iconaFette(lista, glifo = null) {
  const n = lista.reduce((s, f) => s + f.n, 0);
  const r = raggio(n);
  const lato = (r + 2) * 2;
  const c = document.createElement('canvas');
  c.width = c.height = lato * PR;
  const g = c.getContext('2d');
  g.scale(PR, PR);
  const cx = lato / 2;
  g.lineWidth = 1.5;
  g.strokeStyle = '#fff';
  for (const a of archi(lista)) {
    g.beginPath();
    if (lista.length > 1) g.moveTo(cx, cx);
    g.arc(cx, cx, r, a.da, a.a);
    g.closePath();
    g.fillStyle = a.colore;
    g.fill();
    if (lista.length > 1) g.stroke();
  }
  if (lista.length > 1) { // foro dell'anello
    g.beginPath(); g.arc(cx, cx, r * 0.58, 0, 2 * Math.PI);
    g.fillStyle = '#fff'; g.fill();
  } else {
    g.beginPath(); g.arc(cx, cx, r, 0, 2 * Math.PI); g.stroke();
  }
  if (glifo) {
    const lato = r * (lista.length > 1 ? 0.95 : 1.25);
    g.save();
    g.translate(cx - lato / 2, cx - lato / 2);
    g.scale(lato / 24, lato / 24);
    g.fillStyle = lista.length > 1 ? '#222' : '#fff';
    g.fill(new Path2D(ICONE[glifo]));
    g.restore();
    return g.getImageData(0, 0, c.width, c.height);
  }
  g.font = `700 ${Math.max(10, Math.round(r * (lista.length > 1 ? 0.62 : 0.8)))}px sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = lista.length > 1 ? '#222' : '#fff';
  g.fillText(String(n), cx, cx + 0.5);
  return g.getImageData(0, 0, c.width, c.height);
}

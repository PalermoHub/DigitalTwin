// Etichette «▲ +27,3%» / «▼ −4,6%» disegnate su canvas e usate come icone nel modo «Variazione»: pillola arrotondata con fondo
// tenue, triangolo e variazione % nel colore del segno (verde crescita, viola calo).
import { conSegno, coloreVariazione } from './scheda-trend.js';

const ALTEZZA = 20; // px della pillola
const PADDING = 7;
const TRIANGOLO = 8;

export const idEtichetta = variazione => `trend-var-${variazione}`;

const tondo = (g, x, y, w, h, r) => {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};

// ritorna { dati: ImageData, larghezza } in pixel dello schermo × `pr`
export function iconaEtichetta(variazione, pr = 2) {
  const testo = conSegno(variazione);
  const colore = coloreVariazione(variazione);
  const misura = document.createElement('canvas').getContext('2d');
  misura.font = '700 12px sans-serif';
  const larghezza = Math.ceil(PADDING + TRIANGOLO + 4 + misura.measureText(testo).width + PADDING);
  const c = document.createElement('canvas');
  c.width = larghezza * pr;
  c.height = ALTEZZA * pr;
  const g = c.getContext('2d');
  g.scale(pr, pr);
  tondo(g, 0.5, 0.5, larghezza - 1, ALTEZZA - 1, (ALTEZZA - 1) / 2);
  g.fillStyle = '#fff'; g.fill();
  g.globalAlpha = 0.16; g.fillStyle = colore; g.fill(); g.globalAlpha = 1;
  g.strokeStyle = colore; g.lineWidth = 1; g.stroke();
  // triangolo: punta in su per la crescita, in giù per il calo
  const cx = PADDING + TRIANGOLO / 2;
  const cy = ALTEZZA / 2;
  const s = variazione >= 0 ? -1 : 1;
  g.beginPath();
  g.moveTo(cx - TRIANGOLO / 2, cy - s * 3); g.lineTo(cx + TRIANGOLO / 2, cy - s * 3); g.lineTo(cx, cy + s * 3.5); g.closePath();
  g.fillStyle = colore; g.fill();
  g.font = '700 12px sans-serif'; g.textBaseline = 'middle'; g.fillStyle = colore;
  g.fillText(testo, PADDING + TRIANGOLO + 4, cy + 0.5);
  return g.getImageData(0, 0, larghezza * pr, ALTEZZA * pr);
}

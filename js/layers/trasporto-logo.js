// Simbolo delle stazioni della metropolitana: il logo delle metropolitane italiane (quadrato rosso con la «M» bianca),
// disegnato su canvas con la sua path SVG (nessun file da caricare) e con un bordo bianco che lo stacca dalla mappa.
const LATO = 687; // lato del disegno originale
const ROSSO = '#E7271E';
const M = 'M135,126.8 h130.5 l77.2,294.2 l77.2,-294.2 h131 l89.9,434.2 h-89.5 l-68,-329 l-95,329 h-90.5 l-95,-329 l-68,329 h-89.5';

function disegna(px) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const bordo = Math.max(2, Math.round(px / 14));
  g.fillStyle = '#fff';
  g.fillRect(0, 0, px, px);
  g.fillStyle = ROSSO;
  g.fillRect(bordo, bordo, px - 2 * bordo, px - 2 * bordo);
  g.translate(bordo, bordo);
  g.scale((px - 2 * bordo) / LATO, (px - 2 * bordo) / LATO);
  g.fillStyle = '#fafafa';
  g.fill(new Path2D(M));
  return { canvas, g };
}

// Per `map.addImage` (con pixelRatio 2 il simbolo misura px / 2 punti).
export function immagineStazione(px = 64) {
  const { g } = disegna(px);
  return g.getImageData(0, 0, px, px);
}

// Per la legenda: stesso simbolo come data URL.
export const urlStazione = (px = 48) => disegna(px).canvas.toDataURL('image/png');

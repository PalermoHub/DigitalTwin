// js/geoimage/omografia.js
// Matematica pura: porta il rettangolo dell'immagine (0,0)-(larghezza,altezza) su un quadrilatero qualsiasi dello schermo
// e lo scrive come CSS matrix3d. Angoli nell'ordine NO, NE, SO, SE (come quelli di Geoimage).

// Quadrato unitario → quadrilatero (Heckbert, «Fundamentals of Texture Mapping», 1989). null se il quadrilatero è degenere.
export function omografia(larghezza, altezza, angoli) {
  const [[x0, y0], [x1, y1], [x3, y3], [x2, y2]] = angoli; // p0=NO, p1=NE, p2=SE, p3=SO
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0, a, b, d, e;
  if (dx3 === 0 && dy3 === 0) {
    a = x1 - x0; b = x3 - x0; d = y1 - y0; e = y3 - y0; // caso affine: colonne = lati NO→NE e NO→SO
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    if (den === 0) return null;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + h * x3;
    d = y1 - y0 + g * y1; e = y3 - y0 + h * y3;
  }
  if (a * e - b * d === 0) return null; // lati paralleli o coincidenti: nessuna immagine da mostrare
  const m = { A: a / larghezza, B: b / altezza, C: x0, D: d / larghezza, E: e / altezza, F: y0, G: g / larghezza, H: h / altezza };
  return Object.values(m).every(Number.isFinite) ? m : null;
}

// Dove va a finire il punto (x, y) dell'immagine; w > 0 solo se il punto sta davanti alla camera
export function proietta(m, x, y) {
  const w = m.G * x + m.H * y + 1;
  return { x: (m.A * x + m.B * y + m.C) / w, y: (m.D * x + m.E * y + m.F) / w, w };
}

// Il quadrilatero è valido solo se i quattro angoli dell'immagine stanno davanti alla camera
export function davanti(m, larghezza, altezza) {
  return [[0, 0], [larghezza, 0], [0, altezza], [larghezza, altezza]].every(([x, y]) => proietta(m, x, y).w > 0);
}

// matrix3d è in colonne: x' = A·x + B·y + C, y' = D·x + E·y + F, w = G·x + H·y + 1
export const css3d = m => `matrix3d(${m.A},${m.D},0,${m.G},${m.B},${m.E},0,${m.H},0,0,1,0,${m.C},${m.F},0,1)`;

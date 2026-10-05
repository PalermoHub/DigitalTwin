// js/geoimage/confronto-clip.js
// I ritagli CSS di Swipe e Spotlight: stringhe pure, applicate al contenitore dell'immagine (vedi confronto.js).

// Swipe: l'immagine si vede a sinistra della linea; `percentuale` è la posizione della linea (0-100)
export const clipSwipe = percentuale => `inset(0 ${100 - percentuale}% 0 0)`;

// Spotlight: di norma un foro rotondo nell'immagine (si vede la mappa di base); invertito, l'immagine si vede solo nel cerchio.
// `larghezza` e `altezza` sono quelle della mappa: servono al rettangolo da cui si toglie il cerchio.
export function clipSpotlight({ x, y, raggio, invertito, larghezza, altezza }) {
  if (invertito) return `circle(${raggio}px at ${x}px ${y}px)`;
  const R = raggio * 2;
  return `path(evenodd, "M0 0 H${larghezza} V${altezza} H0 Z M${x} ${y} m${-raggio} 0 a${raggio} ${raggio} 0 1 0 ${R} 0 a${raggio} ${raggio} 0 1 0 ${-R} 0")`;
}

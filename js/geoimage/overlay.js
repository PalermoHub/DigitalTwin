// js/geoimage/overlay.js
// L'immagine storica sulla mappa: un <img> sopra il canvas, portato sui 4 angoli proiettati con un'omografia CSS (matrix3d).
// A ogni render della mappa (pan, zoom, rotazione, inclinazione) si riproiettano gli angoli, quindi segue anche il 3D.
// Sta sopra tutti gli strati: è un confronto con la base, e Swipe e Spotlight sono ritagli CSS del contenitore.
import { omografia, css3d, davanti } from './omografia.js';

// Lato lungo massimo dell'immagine mostrata: oltre, un matrix3d su un'immagine enorme appesantisce la mappa.
// L'originale resta in memoria per l'export.
export const LATO_MASSIMO = 4096;

export function dimensioniSchermo(larghezza, altezza, massimo = LATO_MASSIMO) {
  const lungo = Math.max(larghezza, altezza);
  if (lungo <= massimo) return { larghezza, altezza, ridotta: false };
  const f = massimo / lungo;
  return { larghezza: Math.round(larghezza * f), altezza: Math.round(altezza * f), ridotta: true };
}

// CSS che porta l'immagine (larghezza×altezza) sui 4 angoli geografici; null se non si può disegnare
// (punti non finiti, quadrilatero degenere o angoli dietro la camera con la mappa molto inclinata)
export function trasformazione(map, angoli, larghezza, altezza) {
  const p = angoli.map(a => { const q = map.project([a.lng, a.lat]); return [q.x, q.y]; });
  if (!p.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) return null;
  const m = omografia(larghezza, altezza, p);
  return m && davanti(m, larghezza, altezza) ? css3d(m) : null;
}

// Legge il file come immagine e, se serve, ne prepara una versione ridotta per lo schermo.
// → { src, larghezza, altezza (mostrate), originaleL, originaleA }
export function preparaSchermo(dataUrl) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onerror = () => ko(new Error('immagine non leggibile'));
    img.onload = () => {
      const originaleL = img.naturalWidth, originaleA = img.naturalHeight;
      if (!originaleL || !originaleA) return ko(new Error('immagine vuota'));
      const d = dimensioniSchermo(originaleL, originaleA);
      if (!d.ridotta) return ok({ src: dataUrl, larghezza: originaleL, altezza: originaleA, originaleL, originaleA });
      const cv = Object.assign(document.createElement('canvas'), { width: d.larghezza, height: d.altezza });
      cv.getContext('2d').drawImage(img, 0, 0, d.larghezza, d.altezza);
      ok({ src: cv.toDataURL('image/jpeg', 0.92), larghezza: d.larghezza, altezza: d.altezza, originaleL, originaleA });
    };
    img.src = dataUrl;
  });
}

export function creaOverlay(map) {
  const contenitore = document.createElement('div');
  contenitore.className = 'gi-overlay';
  contenitore.hidden = true;
  const img = document.createElement('img');
  img.className = 'gi-immagine';
  img.alt = '';
  img.draggable = false;
  contenitore.append(img);
  map.getCanvasContainer().append(contenitore);

  let corrente = null; // { angoli, larghezza, altezza } dell'immagine mostrata
  const ridisegna = () => {
    if (!corrente) return;
    const t = trasformazione(map, corrente.angoli, corrente.larghezza, corrente.altezza);
    img.style.transform = t ?? 'none';
    img.style.visibility = t ? 'visible' : 'hidden';
  };
  map.on('render', ridisegna);

  return {
    contenitore,
    mostra(schermo, angoli) {
      img.style.width = `${schermo.larghezza}px`;
      img.style.height = `${schermo.altezza}px`;
      img.src = schermo.src;
      corrente = { angoli, larghezza: schermo.larghezza, altezza: schermo.altezza };
      contenitore.hidden = false;
      ridisegna();
    },
    angoli(angoli) {
      if (!corrente) return;
      corrente.angoli = angoli;
      ridisegna();
    },
    // l'opacità sta sul contenitore, così il ritaglio di Swipe e Spotlight resta indipendente
    opacita(valore) { contenitore.style.opacity = String(valore); },
    nascondi() {
      corrente = null;
      contenitore.hidden = true;
      contenitore.style.clipPath = '';
      img.removeAttribute('src');
    },
  };
}

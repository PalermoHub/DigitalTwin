// Modello della vista «Strati in 3D»: quali piani mostrare e come un punto di un piano torna un punto della mappa.
// Niente DOM né MapLibre qui: le funzioni lavorano su elenchi e numeri (vedi tests/js/strati-3d.test.mjs).

// Piani massimi: oltre, si tengono quelli più in alto nell'ordine di disegno (la base resta sempre).
export const MAX_PIANI = { desktop: 14, telefono: 8 };

const visibile = l => (l.layout?.visibility ?? 'visible') !== 'none';

// Un piano per strato acceso del pannello, nell'ordine di disegno della mappa (il primo sta sotto), più:
// - la base cartografica, sotto a tutto, se ha qualche layer visibile;
// - «altri», i layer visibili che nessuno strato dei moduli possiede (RNDT, I miei layer, mappe aggiunte),
//   esclusi quelli che leggono una sorgente dei moduli (sono i layer di servizio: clic, evidenze).
// stile: map.getStyle().layers · strati: [{ id, etichetta, layers }] · acceso(id) · eBase(idLayer)
export function gruppiStrati(stile, strati, acceso, eBase) {
  const posizione = new Map(stile.map((l, i) => [l.id, i]));
  const perId = new Map(stile.map(l => [l.id, l]));
  const vivi = ids => ids.filter(id => perId.has(id) && visibile(perId.get(id)));
  const gruppi = [];
  const base = stile.filter(l => eBase(l.id) && visibile(l)).map(l => l.id);
  if (base.length) gruppi.push({ id: 'base', base: true, layers: base });
  const posseduti = new Set();
  const sorgentiModuli = new Set();
  for (const s of strati) {
    for (const id of s.layers) { posseduti.add(id); const src = perId.get(id)?.source; if (src) sorgentiModuli.add(src); }
    if (!acceso(s.id)) continue;
    const layers = vivi(s.layers);
    if (layers.length) gruppi.push({ id: s.id, etichetta: s.etichetta, layers });
  }
  const altri = stile.filter(l => visibile(l) && !eBase(l.id) && !posseduti.has(l.id) && l.type !== 'background'
    && !(l.source && sorgentiModuli.has(l.source))).map(l => l.id);
  if (altri.length) gruppi.push({ id: 'altri', altri: true, layers: altri });
  const quota = g => (g.base ? -1 : Math.min(...g.layers.map(id => posizione.get(id))));
  return gruppi.sort((a, b) => quota(a) - quota(b));
}

// Tiene la base e gli ultimi `max - 1` piani (quelli più in alto): ritorna anche quanti ne restano fuori.
export function limitaPiani(gruppi, max) {
  if (gruppi.length <= max) return { piani: gruppi, fuori: 0 };
  const base = gruppi.filter(g => g.base);
  const resto = gruppi.filter(g => !g.base);
  const tenuti = resto.slice(resto.length - (max - base.length));
  return { piani: [...base, ...tenuti], fuori: resto.length - tenuti.length };
}

// Dalla posizione su un piano (u, v in 0..1, origine in alto a sinistra) alle coordinate Mercator della mappa:
// a beccheggio zero la vista è un'affinità, quindi basta interpolare i quattro angoli catturati [no, ne, se, so].
export function puntoDaPiano(angoli, u, v) {
  const [no, ne, se, so] = angoli;
  const lerp = (a, b, k) => a + (b - a) * k;
  const su = [lerp(no[0], ne[0], u), lerp(no[1], ne[1], u)];
  const giu = [lerp(so[0], se[0], u), lerp(so[1], se[1], u)];
  return [lerp(su[0], giu[0], v), lerp(su[1], giu[1], v)];
}

// Quote dei piani esplosi: passo uguale, proporzionale al lato della cattura.
export const quote = (n, lato) => Array.from({ length: n }, (_, i) => i * lato * 0.075);

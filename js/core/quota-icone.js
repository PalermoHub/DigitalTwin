// Vista 3D: le icone di uno strato GeoJSON (sedi, progetti) si posano sul tetto del proprio edificio.
// L'altezza viene da `altezza` dei tile dell'edificato; lo spostamento verso l'alto è `icon-offset` per singola icona,
// in pixel sullo schermo (quindi indifferente alla rotazione), ricalcolato a ogni zoom e inclinazione.
import { pixelPerMetro } from './allinea-piano.js';

const SORGENTE_EDIFICI = 'edificato';
const STRATO_EDIFICI = 'edificato';
export const ALTEZZA_PREDEFINITA = 15; // m, finché il tile dell'edificio non è caricato
const ALTEZZA_MAX = 90;

function dentro(anelli, x, y) {
  let dentroAlPoligono = false;
  for (const a of anelli) {
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i], [xj, yj] = a[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dentroAlPoligono = !dentroAlPoligono;
    }
  }
  return dentroAlPoligono;
}

// Poligoni e riquadro di ogni edificio, calcolati una volta sola per feature: il riquadro scarta quasi tutti gli edifici
// senza percorrere i loro vertici (migliaia di punti per migliaia di edifici bloccavano la pagina per secondi).
const sagome = new WeakMap();
function sagoma(f) {
  let s = sagome.get(f);
  if (!s) {
    const g = f.geometry;
    const poli = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of poli) for (const a of p) for (const [x, y] of a) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    s = { poli, x0, y0, x1, y1 };
    sagome.set(f, s);
  }
  return s;
}

// Altezza (m) dell'edificio che contiene il punto, o undefined se il tile non è caricato o il punto è fuori sagoma.
export function altezzaInPunto(poligoni, lng, lat) {
  let max;
  for (const f of poligoni) {
    const { poli, x0, y0, x1, y1 } = sagoma(f);
    if (lng < x0 || lng > x1 || lat < y0 || lat > y1) continue;
    if (poli.some(p => dentro(p, lng, lat))) max = Math.max(max ?? 0, Number(f.properties?.altezza) || 0);
  }
  return max;
}

export function offsetIcona(h, pitch, zoom, lat, dimensione = 1) {
  const px = Math.min(h, ALTEZZA_MAX) * pixelPerMetro(zoom, lat) * Math.sin(Math.min(Math.max(pitch, 0), 85) * Math.PI / 180);
  return [0, -Math.round(px * 10) / 10 / dimensione];
}

// Va chiamata dopo addSource dello strato: da qui setData() passa da qui e ogni punto riceve la proprietà `off`.
export function quotaIcone(map, idSorgente, dimensione = 1) {
  const sorgente = map.getSource(idSorgente);
  const scrivi = sorgente.setData.bind(sorgente);
  let dati = null;
  let firmaScritta = '';
  const quote = new Map(); // "lng,lat" -> altezza trovata
  const chiave = c => c[0].toFixed(6) + ',' + c[1].toFixed(6);

  const risolvi = () => {
    // Senza inclinazione l'altezza non sposta nulla (sin 0 = 0): niente da cercare finché la vista è piatta.
    if (!dati?.features || map.getPitch() < 1 || !map.getSource(SORGENTE_EDIFICI)) return;
    const vista = map.getBounds();
    const mancanti = dati.features.filter(f => f.geometry?.type === 'Point' && vista.contains(f.geometry.coordinates) && !quote.has(chiave(f.geometry.coordinates)));
    if (!mancanti.length) return;
    const poligoni = map.querySourceFeatures(SORGENTE_EDIFICI, { sourceLayer: STRATO_EDIFICI });
    for (const f of mancanti) {
      const [x, y] = f.geometry.coordinates;
      const h = altezzaInPunto(poligoni, x, y);
      if (h !== undefined) quote.set(chiave(f.geometry.coordinates), h);
    }
  };
  const applica = () => {
    const pitch = map.getPitch(), zoom = map.getZoom(), lat = map.getCenter().lat;
    firmaScritta = [pitch.toFixed(0), zoom.toFixed(1), quote.size].join();
    scrivi({
      type: 'FeatureCollection',
      features: dati.features.map(f => f.geometry?.type !== 'Point' ? f : {
        ...f, properties: { ...f.properties, off: offsetIcona(quote.get(chiave(f.geometry.coordinates)) ?? ALTEZZA_PREDEFINITA, pitch, zoom, lat, dimensione) },
      }),
    });
  };
  sorgente.setData = d => {
    if (typeof d === 'string' || !d?.features) { dati = null; scrivi(d); return sorgente; }
    dati = d;
    risolvi();
    applica();
    return sorgente;
  };
  const aggiorna = () => {
    if (!dati?.features?.length) return;
    risolvi();
    const firma = [map.getPitch().toFixed(0), map.getZoom().toFixed(1), quote.size].join();
    if (firma !== firmaScritta) applica();
  };
  let atteso = 0;
  const rallenta = () => { if (!atteso) atteso = setTimeout(() => { atteso = 0; aggiorna(); }, 120); };
  for (const e of ['pitch', 'zoom', 'moveend', 'idle']) map.on(e, rallenta);
  return sorgente;
}

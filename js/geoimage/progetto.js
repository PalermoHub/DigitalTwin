// js/geoimage/progetto.js
// Il progetto Geoimage come file JSON. Il formato è quello dell'app originale (version 1), così i file si scambiano:
// immagine incorporata come data URL, 4 angoli [lat, lng] nell'ordine NO, NE, SO, SE, opacità e GCP.
// `transformType` è un'aggiunta facoltativa: i file di Geoimage senza il campo si aprono con l'affine.
import { TIPI } from './trasformazioni.js';

const numero = v => typeof v === 'number' && Number.isFinite(v);
const coordinataValida = ([lat, lng]) => numero(lat) && numero(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

// stato → oggetto da scrivere nel file
export function serializza(s) {
  return {
    version: 1,
    imageName: s.immagine.nome,
    imageWidth: s.immagine.larghezza,
    imageHeight: s.immagine.altezza,
    imageDataUrl: s.immagine.dataUrl,
    overlayCorners: s.angoli.map(p => [p.lat, p.lng]),
    opacity: s.opacita,
    transformType: s.tipo,
    gcps: s.gcp.map(g => ({ px: g.px, py: g.py, lat: g.lat, lng: g.lng })),
  };
}

// oggetto (già letto da JSON) → stato; lancia un Error con un messaggio per l'utente se il file non è un progetto valido
export function leggi(dati) {
  if (!dati || typeof dati !== 'object') throw new Error('il file non è un progetto Geoimage');
  if (typeof dati.imageDataUrl !== 'string' || !dati.imageDataUrl.startsWith('data:image/')) throw new Error('manca l\'immagine');
  const c = dati.overlayCorners;
  if (!Array.isArray(c) || c.length !== 4 || !c.every(p => Array.isArray(p) && coordinataValida(p))) throw new Error('le coordinate dell\'immagine non sono valide');
  const gcp = (dati.gcps ?? []).filter(g => g && [g.px, g.py, g.lat, g.lng].every(numero) && coordinataValida([g.lat, g.lng]));
  const opacita = numero(dati.opacity) ? Math.min(1, Math.max(0, dati.opacity)) : 0.7;
  const angoli = c.map(([lat, lng]) => ({ lat, lng }));
  return {
    immagine: { dataUrl: dati.imageDataUrl, larghezza: dati.imageWidth || 0, altezza: dati.imageHeight || 0, nome: dati.imageName || 'immagine' },
    angoli,
    angoliIniziali: angoli.map(p => ({ ...p })),
    opacita,
    tipo: TIPI.includes(dati.transformType) ? dati.transformType : 'poly1',
    gcp: gcp.map(g => ({ px: g.px, py: g.py, lat: g.lat, lng: g.lng })),
  };
}

// testo del file → stato
export function daTesto(testo) {
  let dati;
  try { dati = JSON.parse(testo); } catch { throw new Error('il file non è un JSON valido'); }
  return leggi(dati);
}

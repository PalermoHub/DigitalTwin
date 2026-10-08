// Testo dei file esportati. Si esportano i nomi originali dei campi, non le etichette tradotte: restano stabili tra le lingue.
import { cella, geometriaUnita } from './modello.js';

const BOM = '﻿'; // per Excel: senza, le lettere accentate si leggono male
const virgolette = s => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function csv(righe, colonne, { fonte = null } = {}) {
  const testa = [...colonne.map(c => virgolette(c.campo)), ...(fonte != null ? ['fonte'] : [])]; // i18n-ok
  const corpo = righe.map(r => [...colonne.map(c => virgolette(cella(r.proprieta[c.campo]))), ...(fonte != null ? [virgolette(fonte)] : [])]);
  return BOM + [testa, ...corpo].map(r => r.join(',')).join('\r\n') + '\r\n';
}

// Come nel CSV: numeri e booleani restano, null resta null, il resto diventa testo (anche le stringhe JSON di array).
const valore = v => {
  if (v == null) return null;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  return cella(v);
};

export function geojson(righe, colonne, { layer, fonte, approssimata, data }) {
  return JSON.stringify({
    type: 'FeatureCollection',
    metadata: { layer, fonte, geometria_approssimata: approssimata, data }, // i18n-ok
    features: righe.map(r => ({
      type: 'Feature',
      properties: Object.fromEntries(colonne.map(c => [c.campo, valore(r.proprieta[c.campo])])),
      geometry: geometriaUnita(r),
    })),
  }, null, 2);
}

export function nomeFile(layer, estensione, data = new Date()) {
  const due = n => String(n).padStart(2, '0');
  return `${layer}-${data.getFullYear()}-${due(data.getMonth() + 1)}-${due(data.getDate())}.${estensione}`;
}

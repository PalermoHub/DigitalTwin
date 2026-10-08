// Testo dei file esportati. Si esportano i nomi originali dei campi, non le etichette tradotte: restano stabili tra le lingue.
import { cella, geometriaUnita } from './modello.js';

const BOM = '﻿'; // per Excel: senza, le lettere accentate si leggono male
const virgolette = s => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function csv(righe, colonne, { fonte = null } = {}) {
  const testa = [...colonne.map(c => virgolette(c.campo)), ...(fonte != null ? ['fonte'] : [])]; // i18n-ok
  const corpo = righe.map(r => [...colonne.map(c => virgolette(cella(r.proprieta[c.campo]))), ...(fonte != null ? [virgolette(fonte)] : [])]);
  return BOM + [testa, ...corpo].map(r => r.join(',')).join('\r\n') + '\r\n';
}

const valore = v => (v == null || ['string', 'number', 'boolean'].includes(typeof v) ? v : cella(v));

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

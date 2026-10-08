// js/geoimage/librerie.js
// Le librerie dell'export (js/vendor/) si caricano solo al primo uso: l'avvio dell'app non cambia.
import { t } from '../core/i18n.js';
const url = nome => new URL(`../vendor/${nome}`, import.meta.url).href;
const caricate = new Map();
const unaVolta = (nome, carica) => {
  if (!caricate.has(nome)) caricate.set(nome, carica().catch(errore => { caricate.delete(nome); throw errore; }));
  return caricate.get(nome);
};

// script classico (UMD): definisce una variabile globale
const script = src => new Promise((ok, ko) => {
  const s = Object.assign(document.createElement('script'), { src, onload: ok, onerror: () => ko(new Error(t('err.caricareScript', { src }))) });
  document.head.append(s);
});

export const jszip = () => unaVolta('jszip', async () => { await script(url('jszip.min.js')); return window.JSZip; });
export const proj4 = () => unaVolta('proj4', async () => { await script(url('proj4.js')); return window.proj4; });

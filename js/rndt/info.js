// js/rndt/info.js
// Cosa dice un layer RNDT in un punto: richieste GetFeatureInfo (WMS), proprietà delle feature (GeoJSON) e voci
// nel formato della scheda (scheda-modello.js). Modulo puro: la rete e la mappa arrivano come parametri.
import { t as tr } from '../core/i18n.js';

const R = 20037508.342789244; // metà circonferenza in Web Mercator
const PIXEL = 101; // finestra della richiesta, con il punto cliccato al centro
const META = 50;
const FORMATI = ['application/json', 'text/plain', 'text/html'];
const MAX_TESTO = 2000;
const NASCOSTE = /^(geom|the_geom|shape|geometry|wkb_geometry|bbox)$/i;

export function lngLatA3857([lng, lat]) {
  return [(lng * R) / 180, (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / Math.PI) * R];
}

// Richiesta in EPSG:3857 attorno al punto: la finestra copre ±50 pixel allo zoom della mappa.
export function urlGetFeatureInfo(sorgente, lngLat, zoom, formato) {
  const [x, y] = lngLatA3857(lngLat);
  const m = ((2 * R) / 256 / 2 ** zoom) * META;
  const v13 = String(sorgente.version).startsWith('1.3');
  const url = new URL(sorgente.url);
  const imposta = (k, v) => url.searchParams.set(k, String(v));
  imposta('SERVICE', 'WMS');
  imposta('REQUEST', 'GetFeatureInfo');
  imposta('VERSION', sorgente.version);
  imposta('LAYERS', sorgente.layers);
  imposta('QUERY_LAYERS', sorgente.layers);
  imposta('STYLES', '');
  imposta(v13 ? 'CRS' : 'SRS', 'EPSG:3857');
  imposta('BBOX', [x - m, y - m, x + m, y + m].join(','));
  imposta('WIDTH', PIXEL);
  imposta('HEIGHT', PIXEL);
  imposta(v13 ? 'I' : 'X', META);
  imposta(v13 ? 'J' : 'Y', META);
  imposta('INFO_FORMAT', formato);
  imposta('FEATURE_COUNT', 5);
  return url.toString();
}

export function proprieta(props) {
  return Object.entries(props ?? {})
    .filter(([k, v]) => v != null && v !== '' && typeof v !== 'object' && !NASCOSTE.test(k))
    .slice(0, 25)
    .map(([k, v]) => ({ etichetta: k, valore: String(v).slice(0, 300) }));
}

const pulisciHtml = t => t
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
  .replace(/<\/t[dh]>/gi, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/ *\n+ */g, '\n').trim();

export function leggiRisposta(testo) {
  const t = String(testo ?? '').trim();
  if (!t) return { tipo: 'vuoto' };
  if (/<ServiceException|<ows:Exception|<ExceptionReport/i.test(t)) return { tipo: 'errore' };
  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t);
      const elementi = (Array.isArray(j.features) ? j.features : []).map(f => proprieta(f.properties)).filter(r => r.length);
      return elementi.length ? { tipo: 'json', elementi } : { tipo: 'vuoto' };
    } catch {
      return { tipo: 'errore' };
    }
  }
  const pulito = pulisciHtml(t).slice(0, MAX_TESTO);
  return pulito ? { tipo: 'testo', testo: pulito } : { tipo: 'vuoto' };
}

const fonteDi = layer => {
  try { return new URL(layer.sorgente?.url ?? '').host; } catch { return ''; }
};

export function vociDa(layer, esito) {
  const host = fonteDi(layer);
  const base = { peso: 100, icona: 'mappa', legale: true, sempre: true, ...(host && { fonte: tr('rndt.info.fonte', { host }) }) };
  const chiave = `rndt:${layer.id}:0`;
  const riga = valore => ({ ...base, chiave, titolo: layer.nome, gruppi: [{ righe: [{ etichetta: 'Esito', valore }] }] });
  if (esito.tipo === 'json' && esito.elementi?.length) {
    const n = esito.elementi.length;
    return esito.elementi.map((righe, i) => ({
      ...base, chiave: `rndt:${layer.id}:${i}`, titolo: n > 1 ? `${layer.nome} (${i + 1}/${n})` : layer.nome, gruppi: [{ righe }],
    }));
  }
  if (esito.tipo === 'testo') return [{ ...base, chiave, titolo: layer.nome, testo: esito.testo, gruppi: [] }];
  if (esito.tipo === 'errore') return [{ ...base, chiave, titolo: layer.nome, gruppi: [], nota: 'Servizio non raggiungibile o senza informazioni interrogabili.' }];
  if (esito.tipo === 'non-interrogabile') return [riga('livello solo grafico, senza informazioni interrogabili')];
  return [riga('nessun dato in questo punto')];
}

export const segnaposto = () => ({
  chiave: 'rndt:attesa', peso: 100, titolo: 'Altri dati (RNDT)', icona: 'mappa', sempre: true,
  gruppi: [{ righe: [{ etichetta: 'Stato', valore: 'Interrogazione dei servizi in corso…' }] }],
});

function conTimeout(promessa, ms) {
  let timer;
  const scaduto = new Promise((_, rifiuta) => { timer = setTimeout(() => rifiuta(new Error('timeout')), ms); });
  return Promise.race([promessa, scaduto]).finally(() => clearTimeout(timer));
}

async function interrogaWms(sorgente, lngLat, zoom, leggiTesto) {
  for (const formato of FORMATI) {
    try {
      const esito = leggiRisposta(await leggiTesto(urlGetFeatureInfo(sorgente, lngLat, zoom, formato)));
      if (esito.tipo !== 'errore') return esito;
    } catch { /* si prova il formato successivo */ }
  }
  return { tipo: 'errore' };
}

const uniche = lista => {
  const viste = new Set();
  return lista.filter(p => { const k = JSON.stringify(p); return !viste.has(k) && viste.add(k); });
};

export async function interrogaTutti({ layers, lngLat, zoom, leggiTesto, featureAlPunto, timeoutMs = 8000 }) {
  const lavori = layers.map(async layer => {
    try {
      if (layer.tipo === 'geojson') {
        const elementi = uniche(featureAlPunto(layer).map(f => f.properties)).map(proprieta).filter(r => r.length);
        return vociDa(layer, elementi.length ? { tipo: 'json', elementi } : { tipo: 'vuoto' });
      }
      if (layer.tipo === 'wms' && layer.sorgente?.queryable === false) return vociDa(layer, { tipo: 'non-interrogabile' }); // il server lo dichiara non interrogabile
      if (layer.tipo === 'wms') return vociDa(layer, await conTimeout(interrogaWms(layer.sorgente, lngLat, zoom, leggiTesto), timeoutMs));
      return vociDa(layer, { tipo: 'non-interrogabile' });
    } catch {
      return vociDa(layer, { tipo: 'errore' });
    }
  });
  return (await Promise.all(lavori)).flat();
}

// worker/traffico-core.js
// Traffico a flusso di Palermo da TomTom: tile colorate del flusso e velocità del tratto di strada cliccato. Rotte: /traffico/tile/{z}/{x}/{y} e /traffico/segmento?lat=&lon=
// La chiave TOMTOM_KEY è un secret del Worker (mai nel codice). Piano gratuito: 200.000 tile e 20.000 richieste di segmento al mese, senza carta:
// la cache di Cloudflare (condivisa da tutti gli utenti) tiene ogni tile e ogni segmento per TTL_SECONDI, e il Worker serve solo l'area di Palermo, a zoom da città.
// La chiave è ristretta al dominio del progetto: TomTom controlla l'intestazione Referer, che il Worker imposta. Origin e Referer del visitatore non sono una difesa (si falsificano): la difesa è il tetto giornaliero (TETTO_GIORNO).

export const FONTE = 'TomTom Traffic Flow';
export const TTL_SECONDI = 120;
export const ZOOM_MIN = 8;
export const ZOOM_MAX = 17;
// Tetto giornaliero di richieste a TomTom (solo le cache miss), a prescindere da chi le fa: Origin e Referer li falsifica chiunque, e senza tetto
// un client qualunque che varia le coordinate esaurirebbe la quota gratuita del mese (20.000 segmenti, 200.000 tile) e spegnerebbe il layer per tutti.
// Il conteggio sta nel KV (env.NAVI): non è atomico, ma per un tetto grossolano basta. Oltre il tetto il Worker risponde 429 (si ferma da solo).
export const TETTO_GIORNO = { tile: 6000, segmento: 600 }; // circa 180.000 e 18.000 al mese
export const AREA = { ovest: 13.05, sud: 37.95, est: 13.65, nord: 38.35 }; // Palermo e dintorni
const REFERER = 'https://palermodigitaltwin.opendatasicilia.it/';
const BASE = 'https://api.tomtom.com/traffic';
const ZOOM_SEGMENTO = 18; // a zoom alto TomTom restituisce anche le strade minori

const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), { status: stato, headers: { 'content-type': 'application/json', ...intestazioni } });
const dentro = (lat, lon) => lat >= AREA.sud && lat <= AREA.nord && lon >= AREA.ovest && lon <= AREA.est;

// Estremi (lon, lat) del tile z/x/y nel mosaico Web Mercator
export function estremiTile(z, x, y) {
  const n = 2 ** z;
  const lon = i => (i / n) * 360 - 180;
  const lat = j => (Math.atan(Math.sinh(Math.PI * (1 - (2 * j) / n))) * 180) / Math.PI;
  return { ovest: lon(x), est: lon(x + 1), nord: lat(y), sud: lat(y + 1) };
}

// Il tile tocca l'area servita?
export function tileInArea(z, x, y) {
  const e = estremiTile(z, x, y);
  return e.est > AREA.ovest && e.ovest < AREA.est && e.nord > AREA.sud && e.sud < AREA.nord;
}

// Risposta di TomTom (flowSegmentData) → campi del Worker; velocità in km/h, tempi in secondi
export function segmento(dati) {
  const d = dati?.flowSegmentData;
  if (!d || !Number.isFinite(d.currentSpeed) || !Number.isFinite(d.freeFlowSpeed)) throw new Error('risposta TomTom non prevista');
  return {
    velocita: d.currentSpeed, velocitaLibera: d.freeFlowSpeed, tempo: d.currentTravelTime, tempoLibero: d.freeFlowTravelTime,
    confidenza: d.confidence ?? null, chiusa: d.roadClosure === true, classe: d.frc ?? null, fonte: FONTE,
    linea: (d.coordinates?.coordinate ?? []).map(c => [Math.round(c.longitude * 1e5) / 1e5, Math.round(c.latitude * 1e5) / 1e5]),
  };
}

// L'origine ammessa: dall'intestazione Origin o, se manca (le immagini non la mandano), da quella del Referer
function origineDi(richiesta) {
  const o = richiesta.headers.get('origin');
  if (o) return o;
  try { return new URL(richiesta.headers.get('referer')).origin; } catch { return null; }
}

// true se la richiesta rientra nel tetto di oggi (e la conta); senza KV non si può contare e si lascia passare
export async function entroIlTetto(env, tipo, adesso = new Date()) {
  if (!env?.NAVI) return true;
  const chiave = `traffico:${tipo}:${adesso.toISOString().slice(0, 10)}`;
  const n = Number(await env.NAVI.get(chiave)) || 0;
  if (n >= TETTO_GIORNO[tipo]) return false;
  await env.NAVI.put(chiave, String(n + 1), { expirationTtl: 2 * 24 * 60 * 60 });
  return true;
}

async function servi(cache, chiave, produci, cors) {
  const salvata = await cache?.match(chiave);
  if (salvata) return new Response(salvata.body, { status: 200, headers: { ...Object.fromEntries(salvata.headers), ...cors } });
  const { corpo, tipo } = await produci();
  const intestazioni = { 'content-type': tipo, 'cache-control': `public, max-age=${TTL_SECONDI}` };
  await cache?.put(chiave, new Response(corpo, { headers: intestazioni }));
  return new Response(corpo, { status: 200, headers: { ...intestazioni, ...cors } });
}

export async function gestisciTraffico(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = origineDi(richiesta);
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });
  if (!env?.TOMTOM_KEY) return json(503, { errore: 'traffico non configurato' }, { ...cors, 'cache-control': 'no-store' });

  const url = new URL(richiesta.url);
  const dalleTomTom = { headers: { referer: REFERER, 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } };
  const chiaveTomTom = `key=${encodeURIComponent(env.TOMTOM_KEY)}`;
  try {
    const tile = /^\/traffico\/tile\/(\d{1,2})\/(\d{1,6})\/(\d{1,6})$/.exec(url.pathname);
    if (tile) {
      const [z, x, y] = tile.slice(1).map(Number);
      if (z < ZOOM_MIN || z > ZOOM_MAX || x >= 2 ** z || y >= 2 ** z) return json(400, { errore: 'tile fuori dai livelli di zoom serviti' }, { ...cors, 'cache-control': 'no-store' });
      if (!tileInArea(z, x, y)) return json(404, { errore: 'tile fuori da Palermo' }, { ...cors, 'cache-control': 'no-store' });
      return await servi(cache, new Request(`https://cache.interno/traffico/${z}/${x}/${y}`), async () => {
        if (!await entroIlTetto(env, 'tile')) throw Object.assign(new Error('tetto giornaliero'), { tetto: true });
        const r = await fetchFn(`${BASE}/map/4/tile/flow/relative0/${z}/${x}/${y}.png?tileSize=256&${chiaveTomTom}`, dalleTomTom);
        if (!r.ok) throw new Error(`TomTom ${r.status}`);
        return { corpo: await r.arrayBuffer(), tipo: 'image/png' };
      }, cors);
    }
    if (url.pathname === '/traffico/segmento') {
      const lat = Number(url.searchParams.get('lat'));
      const lon = Number(url.searchParams.get('lon'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !dentro(lat, lon)) return json(400, { errore: 'punto non valido o fuori da Palermo' }, { ...cors, 'cache-control': 'no-store' });
      const punto = `${lat.toFixed(4)},${lon.toFixed(4)}`; // circa 11 m: clic vicini condividono la risposta
      return await servi(cache, new Request(`https://cache.interno/traffico-segmento/${punto}`), async () => {
        if (!await entroIlTetto(env, 'segmento')) throw Object.assign(new Error('tetto giornaliero'), { tetto: true });
        const r = await fetchFn(`${BASE}/services/4/flowSegmentData/absolute/${ZOOM_SEGMENTO}/json?point=${punto}&unit=KMPH&${chiaveTomTom}`, dalleTomTom);
        if (r.status === 400) throw Object.assign(new Error('nessuna strada'), { nessunaStrada: true });
        if (!r.ok) throw new Error(`TomTom ${r.status}`);
        return { corpo: JSON.stringify(segmento(await r.json())), tipo: 'application/json' };
      }, cors);
    }
    return json(404, { errore: 'rotta non trovata' }, { ...cors, 'cache-control': 'no-store' });
  } catch (e) {
    if (e?.tetto) return json(429, { errore: 'limite giornaliero raggiunto, riprova domani' }, { ...cors, 'cache-control': 'no-store' });
    if (e?.nessunaStrada) return json(404, { errore: 'nessuna strada vicino al punto' }, { ...cors, 'cache-control': 'public, max-age=60' });
    return json(502, { errore: 'TomTom non raggiungibile', dettaglio: String(e?.message ?? e).replace(/key=[^&\s]+/g, 'key=…').slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}

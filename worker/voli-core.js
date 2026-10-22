// worker/voli-core.js
// Aerei attorno all'aeroporto di Palermo (LICJ), da adsb.lol, come GeoJSON. Rotta: /voli
// adsb.lol limita a 500 richieste al giorno per indirizzo e non ammette il browser (niente CORS): il Worker lo interroga
// al massimo una volta ogni TTL_SECONDI (cache di Cloudflare, condivisa da tutti gli utenti) e rimette il risultato nei dati del sito.
// adsb.lol non dice da dove parte né dove arriva un volo: lo stato è dedotto da quota, distanza dall'aeroporto e velocità verticale.

export const AEROPORTO = [38.1759, 13.0910]; // lat, lon
export const RAGGIO_NM = 100;
export const TTL_SECONDI = 300;
export const TTL_ULTIMO_SECONDI = 3600; // per quanto si tiene l'ultima risposta buona, da servire se adsb.lol non risponde
const URL_FONTE = `https://api.adsb.lol/v2/point/${AEROPORTO[0]}/${AEROPORTO[1]}/${RAGGIO_NM}`;
const VICINO_NM = 60; // oltre questa distanza non si deduce arrivo o partenza
const TERRA_NM = 4;
const RATEO_FPM = 300; // velocità verticale minima (piedi al minuto) per dire che sale o scende
const QUOTA_MAX_FT = 15000; // sopra, un aereo è in crociera

export function distanzaNm(lat, lon) {
  const rad = x => x * Math.PI / 180;
  const a = Math.sin(rad(AEROPORTO[0] - lat) / 2) ** 2
    + Math.cos(rad(lat)) * Math.cos(rad(AEROPORTO[0])) * Math.sin(rad(AEROPORTO[1] - lon) / 2) ** 2;
  return 3440.065 * 2 * Math.asin(Math.sqrt(a));
}

// quota in piedi (null = sconosciuta, «ground» = a terra), rateo in piedi al minuto, distanza in miglia nautiche
export function stato(quota, rateo, distanza) {
  if (quota === 'ground') return distanza <= TERRA_NM ? 'A terra' : 'In transito';
  if (typeof quota !== 'number' || distanza > VICINO_NM) return 'In transito';
  if (typeof rateo === 'number' && quota <= QUOTA_MAX_FT) {
    if (rateo <= -RATEO_FPM) return 'In arrivo';
    if (rateo >= RATEO_FPM) return 'In partenza';
  }
  return 'In transito';
}

const numero = (v, f = x => x) => (typeof v === 'number' && Number.isFinite(v) ? f(v) : null);

function feature(a) {
  const d = distanzaNm(a.lat, a.lon);
  const rateo = a.baro_rate ?? a.geom_rate;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [Math.round(a.lon * 1e5) / 1e5, Math.round(a.lat * 1e5) / 1e5] },
    properties: {
      id: a.hex, volo: String(a.flight ?? '').trim(), matricola: a.r ?? '', tipo: a.t ?? '',
      stato: stato(a.alt_baro, rateo, d), quota_ft: numero(a.alt_baro, Math.round), velocita_kt: numero(a.gs, Math.round),
      rotta: numero(a.track, Math.round), rateo_fpm: numero(rateo, Math.round), distanza_nm: Math.round(d * 10) / 10,
    },
  };
}

export function estrai(risposta) {
  if (!risposta || !Array.isArray(risposta.ac)) throw new Error('risposta di adsb.lol non valida (manca «ac»)');
  const visti = risposta.ac.filter(a => a?.hex && Number.isFinite(a.lat) && Number.isFinite(a.lon));
  const now = Number(risposta.now);
  return {
    type: 'FeatureCollection', aggiornato: Number.isFinite(now) && now > 0 ? Math.floor(now / 1000) : null,
    fonte: 'adsb.lol (ADS-B raccolto da volontari) - ODbL 1.0',
    features: visti.sort((x, y) => (x.hex < y.hex ? -1 : 1)).map(feature),
  };
}

const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), {
  status: stato, headers: { 'content-type': 'application/json', ...intestazioni },
});

// cache = Cache API (caches.default); la chiave è fissa, quindi tutti gli utenti condividono una sola richiesta ogni TTL_SECONDI
export async function gestisciVoli(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });

  const chiave = new Request('https://cache.interno/voli');
  const CHIAVE_ULTIMO = new Request('https://cache.interno/voli-ultimo');
  const salvata = await cache?.match(chiave);
  if (salvata) return new Response(salvata.body, { status: 200, headers: { ...Object.fromEntries(salvata.headers), ...cors } });
  try {
    const remota = await fetchFn(URL_FONTE, { headers: { accept: 'application/json', 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } });
    if (!remota.ok) throw new Error(`adsb.lol ${remota.status}`);
    const corpo = JSON.stringify(estrai(await remota.json()));
    const intestazioni = { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_SECONDI}` };
    await cache?.put(chiave, new Response(corpo, { headers: intestazioni }));
    await cache?.put(CHIAVE_ULTIMO, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_ULTIMO_SECONDI}` } }));
    return new Response(corpo, { status: 200, headers: { ...intestazioni, ...cors } });
  } catch (e) {
    // adsb.lol limita le richieste (429) o non risponde: meglio gli ultimi aerei buoni, già vecchi di poco, che nessun dato
    const ultimo = await cache?.match(CHIAVE_ULTIMO);
    if (ultimo) return new Response(ultimo.body, { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30', 'x-dati': 'precedenti', ...cors } });
    return json(502, { errore: 'adsb.lol non raggiungibile', dettaglio: String(e?.message ?? e).slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}

// worker/satelliti-core.js
// Elementi orbitali (OMM/JSON) dei satelliti più interessanti da vedere su Palermo, da CelesTrak. Rotta: /satelliti
// Il browser calcola le posizioni da solo (SGP4, js/vendor/satellite.js): qui si scarica e si conserva soltanto l'elenco degli elementi.
// CelesTrak chiede di non scaricare lo stesso gruppo più di una volta ogni 2 ore: la cache di Cloudflare è condivisa da tutti gli utenti.

export const FONTE = 'CelesTrak (celestrak.org)';
export const GRUPPI = [['stations', 'Stazioni spaziali'], ['visual', 'Più luminosi']];
export const TTL_SECONDI = 2 * 60 * 60;
export const TTL_ULTIMO_SECONDI = 7 * 24 * 60 * 60;
const MAX_SATELLITI = 200;
const URL_GRUPPO = g => `https://celestrak.org/NORAD/elements/gp.php?GROUP=${g}&FORMAT=json`;
const CAMPI = ['OBJECT_NAME', 'OBJECT_ID', 'EPOCH', 'MEAN_MOTION', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY',
  'EPHEMERIS_TYPE', 'CLASSIFICATION_TYPE', 'NORAD_CAT_ID', 'ELEMENT_SET_NO', 'REV_AT_EPOCH', 'BSTAR', 'MEAN_MOTION_DOT', 'MEAN_MOTION_DDOT'];
const NUMERICI = CAMPI.filter(c => !['OBJECT_NAME', 'OBJECT_ID', 'EPOCH', 'CLASSIFICATION_TYPE'].includes(c));

const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), { status: stato, headers: { 'content-type': 'application/json', ...intestazioni } });

// Un elemento della fonte → elemento pulito, o null se manca qualcosa che SGP4 richiede
export function pulisci(o) {
  if (!o || typeof o !== 'object') return null;
  for (const c of NUMERICI) if (!Number.isFinite(o[c])) return null;
  if (!Number.isInteger(o.NORAD_CAT_ID) || o.NORAD_CAT_ID <= 0) return null;
  if (!(Date.parse(o.EPOCH) > 0)) return null;
  const nome = String(o.OBJECT_NAME ?? '').replace(/[\0-\x1f]+/g, ' ').trim().slice(0, 40);
  if (!nome) return null;
  const r = {};
  for (const c of CAMPI) r[c] = o[c];
  r.OBJECT_NAME = nome;
  r.OBJECT_ID = String(o.OBJECT_ID ?? '').slice(0, 20);
  r.CLASSIFICATION_TYPE = String(o.CLASSIFICATION_TYPE ?? 'U').slice(0, 1);
  return r;
}

// Gruppi già scaricati → un solo elenco: un satellite per numero NORAD (vince il primo gruppo), al massimo MAX_SATELLITI.
export function unisci(gruppi) {
  const visti = new Map();
  for (const [gruppo, elenco] of gruppi) {
    if (!Array.isArray(elenco)) continue;
    for (const o of elenco) {
      const p = pulisci(o);
      if (p && !visti.has(p.NORAD_CAT_ID)) visti.set(p.NORAD_CAT_ID, { ...p, gruppo });
    }
  }
  return [...visti.values()].slice(0, MAX_SATELLITI);
}

export async function gestisciSatelliti(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });

  const chiave = new Request('https://cache.interno/satelliti');
  const CHIAVE_ULTIMO = new Request('https://cache.interno/satelliti-ultimo');
  const salvata = await cache?.match(chiave);
  if (salvata) return new Response(salvata.body, { status: 200, headers: { ...Object.fromEntries(salvata.headers), ...cors } });
  try {
    const opzioni = { headers: { accept: 'application/json', 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } };
    const gruppi = [];
    for (const [g] of GRUPPI) {
      const r = await fetchFn(URL_GRUPPO(g), opzioni);
      if (!r.ok) throw new Error(`CelesTrak ${g} ${r.status}`);
      // un gruppo senza dati risponde con testo semplice, non JSON: è un errore, non «nessun satellite»
      gruppi.push([g, await r.json()]);
    }
    const satelliti = unisci(gruppi);
    if (!satelliti.some(s => s.NORAD_CAT_ID === 25544)) throw new Error('ISS assente');
    const corpo = JSON.stringify({ fonte: FONTE, aggiornato: Math.floor(Date.now() / 1000), satelliti });
    const intestazioni = { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_SECONDI}` };
    await cache?.put(chiave, new Response(corpo, { headers: intestazioni }));
    await cache?.put(CHIAVE_ULTIMO, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_ULTIMO_SECONDI}` } }));
    return new Response(corpo, { status: 200, headers: { ...intestazioni, ...cors } });
  } catch (e) {
    // meglio gli ultimi elementi buoni, vecchi di qualche ora (un'orbita invecchia piano), che nessun dato
    const ultimo = await cache?.match(CHIAVE_ULTIMO);
    if (ultimo) return new Response(ultimo.body, { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300', 'x-dati': 'precedenti', ...cors } });
    return json(502, { errore: 'CelesTrak non raggiungibile', dettaglio: String(e?.message ?? e).slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}

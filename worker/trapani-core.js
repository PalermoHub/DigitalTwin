// worker/trapani-core.js
// Arrivi e partenze dell'aeroporto di Trapani-Birgi (Airgest), per l'app Marsala TPL. Rotta: /aeroporto-trapani
// Airgest pubblica due JSON (voli-dati?type=arr|dep) senza CORS: il Worker li rilancia con cache condivisa di TTL_SECONDI.
// Se Airgest non risponde si servono gli ultimi dati buoni (con l'intestazione x-dati: precedenti); altrimenti errore.

export const URL_AIRGEST = 'https://www.airgest.it/voli-dati?type=';
export const TTL_SECONDI = 60;
export const TTL_ULTIMO_SECONDI = 3600;
export const FONTE = 'Airgest, Aeroporto di Trapani-Birgi (airgest.it)';

const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), {
  status: stato, headers: { 'content-type': 'application/json', ...intestazioni },
});
const INTESTAZIONI = { headers: { accept: 'application/json', 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } };
const ordina = voli => voli.slice().sort((a, b) => String(a.scheduled).localeCompare(String(b.scheduled)));

export async function leggiTrapani(fetchFn, cache) {
  const chiave = new Request('https://cache.interno/trapani');
  const ultimoChiave = new Request('https://cache.interno/trapani-ultimo');
  const salvata = await cache?.match(chiave);
  if (salvata) return { dati: await salvata.json(), precedenti: false };
  try {
    const [arr, dep] = await Promise.all(['arr', 'dep'].map(async tipo => {
      const r = await fetchFn(URL_AIRGEST + tipo, INTESTAZIONI);
      if (!r.ok) throw new Error(`Airgest ${r.status}`);
      const lista = await r.json();
      if (!Array.isArray(lista)) throw new Error('Airgest: formato cambiato');
      return ordina(lista);
    }));
    const dati = { fonte: FONTE, aggiornato: new Date().toISOString(), arrivi: arr, partenze: dep };
    const corpo = JSON.stringify(dati);
    await cache?.put(chiave, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_SECONDI}` } }));
    await cache?.put(ultimoChiave, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_ULTIMO_SECONDI}` } }));
    return { dati, precedenti: false };
  } catch (e) {
    const ultimo = await cache?.match(ultimoChiave);
    if (ultimo) return { dati: await ultimo.json(), precedenti: true };
    throw e;
  }
}

export async function gestisciTrapani(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });
  try {
    const { dati, precedenti } = await leggiTrapani(fetchFn, cache);
    return json(200, dati, { ...cors, 'cache-control': `public, max-age=${precedenti ? 20 : TTL_SECONDI}`, ...(precedenti ? { 'x-dati': 'precedenti' } : {}) });
  } catch (e) {
    return json(502, { errore: 'Airgest non raggiungibile o formato cambiato', dettaglio: String(e?.message ?? e).slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}

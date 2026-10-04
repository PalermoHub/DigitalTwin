// worker/rndt-proxy.js
// Proxy CORS per i servizi del catalogo RNDT (WMS, WFS, GeoJSON, catalogo). Rotta: /t/<host>/<percorso>?<query>
// Non è un proxy aperto: solo https, solo GET/HEAD, solo nomi pubblici (niente IP, localhost, porte), solo dalle origini
// in ORIGINI e al massimo 10 MB per risposta. Nessuna cache e nessun cookie.

export const LIMITE_BYTE = 10 * 1024 * 1024;
const PRIVATO = /^(localhost|.*\.(local|localhost|internal|lan|home|corp))$/i;

export function ospiteValido(host) {
  const h = String(host).toLowerCase();
  if (h.includes(':') || h.startsWith('[') || !h.includes('.') || PRIVATO.test(h)) return false;
  return !/^\d+\.\d+\.\d+\.\d+$/.test(h);
}

export function urlDestinazione(richiesta) {
  const u = new URL(richiesta.url);
  const m = u.pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  if (!m) return null;
  const host = decodeURIComponent(m[1]);
  return ospiteValido(host) ? `https://${host}${m[2] ?? '/'}${u.search}` : null;
}

const risposta = (stato, testo, intestazioni = {}) => new Response(JSON.stringify({ errore: testo }), {
  status: stato, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...intestazioni },
});

export async function gestisci(richiesta, env, fetchFn) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return risposta(403, 'origine non ammessa');
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': '*', 'access-control-max-age': '86400' } });
  }
  if (richiesta.method !== 'GET' && richiesta.method !== 'HEAD') return risposta(405, 'metodo non ammesso', cors);
  const destinazione = urlDestinazione(richiesta);
  if (!destinazione) return risposta(400, 'indirizzo non valido', cors);

  let remota;
  try {
    remota = await fetchFn(destinazione, {
      method: richiesta.method, redirect: 'follow',
      headers: { accept: richiesta.headers.get('accept') ?? '*/*', 'user-agent': 'DigitalTwinPalermo-RNDT-proxy' },
    });
  } catch {
    return risposta(502, 'servizio non raggiungibile', cors);
  }
  const limite = Number(env?.LIMITE_BYTE) || LIMITE_BYTE;
  if (Number(remota.headers.get('content-length')) > limite) return risposta(413, 'risposta troppo grande', cors);

  let letti = 0;
  const controllo = new TransformStream({
    transform(blocco, flusso) {
      letti += blocco.byteLength;
      if (letti > limite) flusso.error(new Error('risposta troppo grande'));
      else flusso.enqueue(blocco);
    },
  });
  const intestazioni = { ...cors, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  for (const k of ['content-type', 'content-length']) if (remota.headers.get(k)) intestazioni[k] = remota.headers.get(k);
  return new Response(remota.body ? remota.body.pipeThrough(controllo) : null, { status: remota.status, headers: intestazioni });
}

export default { fetch: (richiesta, env) => gestisci(richiesta, env, fetch) };

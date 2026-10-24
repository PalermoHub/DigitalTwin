// Link corto: chiede al Worker (POST /corto) un indirizzo breve per il link lungo della condivisione.
// Se non si può (sviluppo locale, rete assente, Worker che non risponde) restituisce null e si resta sul link lungo.
import { PROXY_PREDEFINITO } from '../rndt/proxy.js';

const LOCALI = new Set(['localhost', '127.0.0.1']);
const ATTESA_MS = 5000;

export async function accorcia(href, { fetchFn = fetch, proxy = PROXY_PREDEFINITO, hostname = location.hostname, attesaMs = ATTESA_MS } = {}) {
  if (LOCALI.has(hostname)) return null; // il servizio accetta solo link dei siti pubblicati
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), attesaMs);
  try {
    const r = await fetchFn(`${proxy}/corto`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: href }),
      signal: stop.signal,
    });
    if (!r.ok) return null;
    const { url } = await r.json();
    return typeof url === 'string' && /^https:\/\/[^/\s]+\/[\w-]+$/.test(url) ? url : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

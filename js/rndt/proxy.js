// js/rndt/proxy.js
// Quale Worker usare. In produzione è fisso: un link con ?rndt-proxy= non può portare i dati degli utenti su un proxy altrui.
// Solo in locale (localhost, 127.0.0.1) il parametro serve per provare un Worker di sviluppo (`wrangler dev`).
export const PROXY_PREDEFINITO = 'https://rndt-proxy.gbvitrano.workers.dev';
const LOCALI = new Set(['localhost', '127.0.0.1']);

export function scegliProxy(search, hostname) {
  if (!LOCALI.has(hostname)) return PROXY_PREDEFINITO;
  const richiesto = new URLSearchParams(search).get('rndt-proxy');
  if (!richiesto) return PROXY_PREDEFINITO;
  try {
    const u = new URL(richiesto);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.origin : PROXY_PREDEFINITO;
  } catch {
    return PROXY_PREDEFINITO;
  }
}

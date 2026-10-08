// js/aggiungi/credenziali.js
// Utente e password dei servizi protetti: solo in memoria, per la sessione. Mai in localStorage, IndexedDB o URL.
// Ogni host ha la sua intestazione `Authorization: Basic …`.
import { t } from '../core/i18n.js';

export function ospiteDi(url) {
  try { return new URL(String(url).replace(/[{}]/g, '')).hostname; } catch { return null; }
}

// btoa lavora in Latin-1: si passa dai byte UTF-8, così «é» o «ö» nella password restano giusti
function base64(testo) {
  let s = '';
  for (const b of new TextEncoder().encode(testo)) s += String.fromCharCode(b);
  return btoa(s);
}

export function creaCredenziali() {
  const mappa = new Map(); // host → { utente, intestazione }
  const tokens = new Map(); // host → token (ArcGIS)
  // `<proxy>/t/<host>/…` → host, altrimenti null
  const ospiteDaProxy = (proxy, url) => {
    const base = `${String(proxy).replace(/\/$/, '')}/t/`;
    if (!String(url).startsWith(base)) return null;
    try { return decodeURIComponent(String(url).slice(base.length).split(/[/?#]/)[0]); } catch { return null; }
  };
  // il token si aggiunge per concatenazione: i segnaposto {z} {x} {y} devono restare com'erano
  const aggiungiToken = (url, token) => (!token || /[?&]token=/i.test(url) ? url : `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`);
  return {
    imposta(host, utente, password) {
      if (!utente) throw new Error(t('err.manca.utente'));
      if (utente.includes(':')) throw new Error(t('err.utente.dueppunti'));
      mappa.set(host, { utente, intestazione: `Basic ${base64(`${utente}:${password ?? ''}`)}` });
    },
    impostaToken(host, valore) {
      if (!valore) throw new Error(t('err.manca.token'));
      tokens.set(host, valore);
    },
    token: host => tokens.get(host) ?? null,
    ha: host => mappa.has(host) || tokens.has(host),
    utente: host => mappa.get(host)?.utente ?? null,
    intestazione: host => mappa.get(host)?.intestazione ?? null,
    togli: host => { mappa.delete(host); tokens.delete(host); },
    conToken: url => aggiungiToken(url, tokens.get(ospiteDi(url))),
    riscriviPerProxy: (proxy, url) => aggiungiToken(url, tokens.get(ospiteDaProxy(proxy, url))),
    // Una richiesta ai tile: solo se va al nostro proxy (`<proxy>/t/<host>/…`) si dà l'intestazione di quell'host
    perUrlProxy(proxy, url) {
      const host = ospiteDaProxy(proxy, url);
      return host === null ? null : mappa.get(host)?.intestazione ?? null;
    },
  };
}

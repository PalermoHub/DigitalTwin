// js/aggiungi/credenziali.js
// Utente e password dei servizi protetti: solo in memoria, per la sessione. Mai in localStorage, IndexedDB o URL.
// Ogni host ha la sua intestazione `Authorization: Basic …`.

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
  return {
    imposta(host, utente, password) {
      if (!utente) throw new Error('manca il nome utente');
      if (utente.includes(':')) throw new Error('il nome utente non può contenere due punti');
      mappa.set(host, { utente, intestazione: `Basic ${base64(`${utente}:${password ?? ''}`)}` });
    },
    ha: host => mappa.has(host),
    utente: host => mappa.get(host)?.utente ?? null,
    intestazione: host => mappa.get(host)?.intestazione ?? null,
    togli: host => mappa.delete(host),
    // Una richiesta ai tile: solo se va al nostro proxy (`<proxy>/t/<host>/…`) si dà l'intestazione di quell'host
    perUrlProxy(proxy, url) {
      const base = `${String(proxy).replace(/\/$/, '')}/t/`;
      if (!String(url).startsWith(base)) return null;
      let host;
      try { host = decodeURIComponent(String(url).slice(base.length).split(/[/?#]/)[0]); } catch { return null; }
      return mappa.get(host)?.intestazione ?? null;
    },
  };
}

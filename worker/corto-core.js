// worker/corto-core.js
// Link corti: POST /corto salva il link lungo del sito nel KV (LINK) e restituisce DOMINIO_CORTO/<codice>;
// GET /<codice> sul dominio corto riporta al link lungo con un redirect. Il link lungo resta quello che l'app sa già leggere (?v=…).
// Non è un redirect aperto: si salvano e si seguono solo indirizzi che stanno su un sito di SITI.

export const LUNGHEZZA_CODICE = 7;
export const MAX_URL = 8000;
const MAX_CORPO = 12000;
export const TTL_SECONDI = 2 * 365 * 24 * 60 * 60;
// senza 0 O 1 I l: si leggono e si dettano senza equivoci
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const FORMA_CODICE = new RegExp(`^/[${ALFABETO}]{${LUNGHEZZA_CODICE}}$`);

const elenco = v => String(v ?? '').split(',').map(s => s.trim()).filter(Boolean);
const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), { status: stato, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...intestazioni } });

export function generaCodice() {
  // si scartano i byte che darebbero un resto sbilanciato, così ogni carattere è equiprobabile
  const limite = 256 - (256 % ALFABETO.length);
  let codice = '';
  while (codice.length < LUNGHEZZA_CODICE) {
    for (const b of crypto.getRandomValues(new Uint8Array(LUNGHEZZA_CODICE * 2))) {
      if (b < limite && codice.length < LUNGHEZZA_CODICE) codice += ALFABETO[b % ALFABETO.length];
    }
  }
  return codice;
}

export function urlAmmesso(testo, siti) {
  if (typeof testo !== 'string' || !testo || testo.length > MAX_URL) return false;
  let u;
  try { u = new URL(testo); } catch { return false; }
  return !u.username && !u.password && siti.includes(u.origin);
}

async function impronta(testo) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
  return [...new Uint8Array(h).slice(0, 12)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function crea(richiesta, env, cors) {
  const testo = await richiesta.text();
  if (testo.length > MAX_CORPO) return json(413, { errore: 'richiesta troppo lunga' }, cors);
  let url;
  try { url = JSON.parse(testo)?.url; } catch { return json(400, { errore: 'corpo non valido' }, cors); }
  if (!urlAmmesso(url, elenco(env.SITI))) return json(400, { errore: 'indirizzo non ammesso' }, cors);

  // lo stesso link rende sempre lo stesso codice: condividere due volte la stessa vista non riempie l'archivio
  const chiaveHash = `h:${await impronta(url)}`;
  let codice = await env.LINK.get(chiaveHash);
  if (!codice || await env.LINK.get(`u:${codice}`) !== url) {
    codice = null;
    for (let i = 0; i < 5 && !codice; i++) {
      const candidato = generaCodice();
      if (await env.LINK.get(`u:${candidato}`) === null) codice = candidato;
    }
    if (!codice) return json(503, { errore: 'riprovare' }, cors);
    await env.LINK.put(`u:${codice}`, url, { expirationTtl: TTL_SECONDI });
    await env.LINK.put(chiaveHash, codice, { expirationTtl: TTL_SECONDI });
  }
  return json(200, { url: `${String(env.DOMINIO_CORTO).replace(/\/+$/, '')}/${codice}` }, cors);
}

async function segui(percorso, env) {
  const siti = elenco(env.SITI);
  if (percorso === '/') return new Response(null, { status: 302, headers: { location: `${siti[0]}/`, 'cache-control': 'public, max-age=3600' } });
  if (!FORMA_CODICE.test(percorso)) return json(404, { errore: 'link non trovato' });
  const url = await env.LINK.get(`u:${percorso.slice(1)}`);
  // un valore che non sia del sito (KV manomesso) non diventa mai un redirect
  if (!urlAmmesso(url, siti)) return json(404, { errore: 'link non trovato o scaduto' });
  return new Response(null, { status: 302, headers: { location: url, 'cache-control': 'public, max-age=86400' } });
}

export async function gestisciCorto(richiesta, env) {
  if (!env?.LINK) return json(503, { errore: 'link corti non configurati' });
  const { pathname } = new URL(richiesta.url);
  if (pathname !== '/corto') return richiesta.method === 'GET' || richiesta.method === 'HEAD' ? segui(pathname, env) : json(405, { errore: 'metodo non ammesso' });

  const ammesse = elenco(env.ORIGINI);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'POST') return json(405, { errore: 'metodo non ammesso' }, cors);
  return crea(richiesta, env, cors);
}

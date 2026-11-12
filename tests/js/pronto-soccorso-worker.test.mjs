// tests/js/pronto-soccorso-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizzaPs, costruisci, gestisciProntoSoccorso } from '../../worker/pronto-soccorso-core.js';

const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE };
const rq = (init = {}) => new Request('https://proxy.test/pronto-soccorso', { headers: { origin: ORIGINE }, ...init });
const cacheFinta = () => { const m = new Map(); return { match: async k => m.get(k.url)?.clone(), put: async (k, r) => { m.set(k.url, r); } }; };

const PS = {
  id: 'villa-sofia-adulti', nome: 'Villa Sofia', struttura: 'Ospedali Riuniti', tipo: 'adulti', indirizzo: 'Piazza Salerno 1', coords: { lat: 38.15, lng: 13.33 },
  sito: 'https://www.ospedaliriunitipalermo.it', fonteUrl: 'javascript:alert(1)', acquisitaAlle: '2026-11-12T08:52:53.940Z', ultimoErrore: null,
  lettura: { rilevataAlle: '2026-11-12T09:52:00+01:00', codici: { rosso: { attesa: 0, trattamento: null, osservazione: null, totale: null }, verde: { attesa: 3, trattamento: 'x' } },
    pazientiTotali: 62, inAttesa: 4, sovraffollamentoPct: 207, postiTecnici: 30, permanenza: { meno24h: 46, da24a48h: 15, oltre48h: 4 }, tempiMediAttesaMin: null },
  affidabilita: { stato: 'ok', etaFonteMin: 1 },
};
const fonte = (n = { chiamate: 0 }, guasto = null) => async () => {
  n.chiamate++;
  if (guasto) return new Response('no', { status: guasto });
  return new Response(JSON.stringify({ aggiornatoAlle: '2026-11-12T08:52:53.940Z', ps: [PS, { id: 'rotto' }] }));
};

test('normalizzaPs: tiene i campi utili, null per i valori mancanti o di tipo sbagliato, scarta i link non http', () => {
  const p = normalizzaPs(PS);
  assert.equal(p.id, 'villa-sofia-adulti');
  assert.equal(p.lat, 38.15);
  assert.equal(p.pazientiTotali, 62);
  assert.equal(p.codici.rosso.attesa, 0);
  assert.equal(p.codici.rosso.trattamento, null);
  assert.equal(p.codici.verde.trattamento, null); // 'x' non è un numero
  assert.equal(p.fonteUrl, null);
  assert.equal(p.sito, 'https://www.ospedaliriunitipalermo.it');
  assert.equal(p.tempiMediAttesaMin, null);
  assert.equal(p.telefono, null);
  assert.equal(p.stato, 'ok');
});

test('normalizzaPs: senza coordinate o senza id il presidio non entra', () => {
  assert.equal(normalizzaPs({ id: 'x' }), null);
  assert.equal(normalizzaPs({ coords: { lat: 1, lng: 2 } }), null);
});

test('normalizzaPs: senza lettura i conteggi sono null (mai 0 inventato)', () => {
  const p = normalizzaPs({ ...PS, lettura: null, affidabilita: undefined });
  assert.equal(p.pazientiTotali, null);
  assert.equal(p.inAttesa, null);
  assert.deepEqual(p.codici, {});
  assert.equal(p.stato, 'assente');
});

test('costruisci: scarta i presidi rotti; risposta senza presidi = errore', () => {
  assert.equal(costruisci({ aggiornatoAlle: 'x', ps: [PS, { id: 'rotto' }] }).ps.length, 1);
  assert.throws(() => costruisci({ ps: [] }));
  assert.throws(() => costruisci(null));
});

test('gestisciProntoSoccorso: risposta con CORS, poi dalla cache senza richiamare la fonte', async () => {
  const n = { chiamate: 0 };
  const cache = cacheFinta();
  const a = await gestisciProntoSoccorso(rq(), env, fonte(n), cache);
  assert.equal(a.status, 200);
  assert.equal(a.headers.get('access-control-allow-origin'), ORIGINE);
  assert.equal((await a.json()).ps.length, 1);
  const b = await gestisciProntoSoccorso(rq(), env, fonte(n), cache);
  assert.equal(b.status, 200);
  assert.equal(n.chiamate, 1);
});

test('gestisciProntoSoccorso: origine non ammessa 403, metodo POST 405, OPTIONS 204', async () => {
  assert.equal((await gestisciProntoSoccorso(new Request('https://p.test/x', { headers: { origin: 'https://altro.example' } }), env, fonte(), cacheFinta())).status, 403);
  assert.equal((await gestisciProntoSoccorso(rq({ method: 'POST' }), env, fonte(), cacheFinta())).status, 405);
  assert.equal((await gestisciProntoSoccorso(rq({ method: 'OPTIONS' }), env, fonte(), cacheFinta())).status, 204);
});

test('gestisciProntoSoccorso: fonte guasta → ultimo dato buono (x-dati: precedenti), senza ultimo → 502', async () => {
  const cache = cacheFinta();
  assert.equal((await gestisciProntoSoccorso(rq(), env, fonte(), cache)).status, 200);
  cache.match = (orig => async k => (k.url.endsWith('/pronto-soccorso') ? undefined : orig(k)))(cache.match); // scade la cache breve, resta l'ultimo
  const r = await gestisciProntoSoccorso(rq(), env, fonte({ chiamate: 0 }, 500), cache);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-dati'), 'precedenti');
  assert.equal((await gestisciProntoSoccorso(rq(), env, fonte({ chiamate: 0 }, 500), cacheFinta())).status, 502);
});

test('storico: tiene solo le serie delle 24 ore, valori non numerici → null; fonte rotta → errore', async () => {
  const { costruisciStorico, gestisciProntoSoccorsoStorico } = await import('../../worker/pronto-soccorso-core.js');
  const f = { passo: 1800, spark: { da: 100, ps: { a: [1, null, 'x', 2.5] } }, ps7: { a: [9] }, citta: {} };
  assert.deepEqual(costruisciStorico(f), { da: 100, passo: 1800, ps: { a: [1, null, null, 2.5] } });
  assert.throws(() => costruisciStorico({}));
  const cache = cacheFinta(); let n = 0;
  const fn = async () => { n++; return new Response(JSON.stringify(f)); };
  const r = await gestisciProntoSoccorsoStorico(new Request('https://p.test/pronto-soccorso-storico', { headers: { origin: ORIGINE } }), env, fn, cache);
  assert.equal(r.status, 200);
  await gestisciProntoSoccorsoStorico(new Request('https://p.test/pronto-soccorso-storico', { headers: { origin: ORIGINE } }), env, fn, cache);
  assert.equal(n, 1);
  assert.equal((await gestisciProntoSoccorsoStorico(new Request('https://p.test/x', { headers: { origin: 'https://altro.example' } }), env, fn, cache)).status, 403);
});

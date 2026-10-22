// tests/js/aeroporto-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leggiGesap, ritardoMin, riepilogo, abbina, arricchisci, costruisci, gestisciAeroporto, leggiAeroporto, inRitardo } from '../../worker/aeroporto-core.js';
import { gestisciVoli } from '../../worker/voli-core.js';

const HTML = readFileSync(new URL('./fixtures/gesap-voli.html', import.meta.url), 'utf8');
const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE };
const rq = (percorso = 'aeroporto', init = {}) => new Request(`https://proxy.test/${percorso}`, { headers: { origin: ORIGINE }, ...init });
const cacheFinta = () => { const m = new Map(); return { match: async k => m.get(k.url)?.clone(), put: async (k, r) => { m.set(k.url, r); } }; };
const pagina = (corpo, stato = 200) => async () => new Response(corpo, { status: stato });

test('legge partenze e arrivi dalla pagina di Gesap', () => {
  const p = leggiGesap(HTML);
  assert.equal(p.aggiornato, '2026-10-23T00:15');
  assert.ok(p.partenze.length >= 3 && p.arrivi.length >= 3);
  const wizz = p.partenze[0];
  assert.deepEqual([wizz.compagnia, wizz.volo, wizz.citta, wizz.programmato, wizz.stimato, wizz.gate], ['WIZZ AIR MALTA', 'W4 06607', 'VENEZIA', '05:55', '05:55', 'A19']);
  assert.equal(wizz.ritardo_min, 0);
  assert.equal(wizz.cancellato, false);
});

test('ritardo oltre la mezzanotte: stimato con data del giorno dopo', () => {
  const easy = leggiGesap(HTML).partenze.find(v => v.volo === 'EC 03512');
  assert.equal(easy.programmato, '23:45');
  assert.equal(easy.stimato, '00:06');
  assert.equal(easy.ritardo_min, 21);
  assert.equal(easy.stimato_giorno_dopo, true);
  assert.equal(inRitardo(easy), true);
});

test('cancellati senza ritardo, atterrati negli arrivi', () => {
  const p = leggiGesap(HTML);
  const cancellati = [...p.partenze, ...p.arrivi].filter(v => v.cancellato);
  assert.ok(cancellati.length >= 1);
  for (const c of cancellati) { assert.equal(c.ritardo_min, null); assert.equal(inRitardo(c), false); }
  assert.ok(p.arrivi.some(v => v.stato === 'ATTERRATO'));
  assert.equal(p.arrivi[0].gate, '');
});

test('ritardoMin: orari semplici, mezzanotte, anticipo', () => {
  const giorno = Math.floor(Date.UTC(2026, 9, 23) / 86400000);
  assert.equal(ritardoMin('06:05', '06:05', giorno), 0);
  assert.equal(ritardoMin('00:50', '01:27', giorno), 37);
  assert.equal(ritardoMin('23:45', '24/10/2026 00:06', giorno), 21);
  assert.equal(ritardoMin('23:45', '00:06', giorno), 21); // senza data si sceglie la differenza più corta
  assert.equal(ritardoMin('10:00', '09:50', giorno), -10);
  assert.equal(ritardoMin('10:00', '', giorno), null);
  assert.equal(ritardoMin('xx', '10:00', giorno), null);
});

test('pagina cambiata = errore, non voli vuoti', () => {
  assert.throws(() => leggiGesap('<html><body><table><thead><tr><th>Altro</th></tr></thead></table></body></html>'), /cambiata/);
  assert.throws(() => leggiGesap(null), /non valida/);
  assert.throws(() => leggiGesap(HTML.replace(/Destinazione/g, 'Meta')), /cambiata/);
});

test('riepilogo: ritardati, cancellati, ritardo medio', () => {
  const r = riepilogo([{ ritardo_min: 0, cancellato: false }, { ritardo_min: 20, cancellato: false }, { ritardo_min: 40, cancellato: false }, { ritardo_min: null, cancellato: true }, { ritardo_min: 3, cancellato: false }]);
  assert.deepEqual(r, { voli: 5, ritardati: 2, cancellati: 1, ritardo_medio_min: 30 });
  assert.deepEqual(riepilogo([]), { voli: 0, ritardati: 0, cancellati: 0, ritardo_medio_min: 0 });
});

const AERO = {
  arrivi: [{ volo: 'EC 03511', compagnia: 'EasyJet Europe', ritardo_min: 17 }, { volo: 'AZ 01771', compagnia: 'ITA AIRWAYS', ritardo_min: 0 }],
  partenze: [{ volo: 'FR 04342', compagnia: 'RYANAIR LIMITED', ritardo_min: 12 }, { volo: 'EC 03512', compagnia: 'EasyJet Europe', ritardo_min: 21 }],
};

test('abbina il nominativo radio al numero di volo, senza indovinare', () => {
  assert.equal(abbina('RYR4342', 'In partenza', AERO).volo.volo, 'FR 04342');
  assert.equal(abbina('EJU3511', 'In arrivo', AERO).direzione, 'arrivo');
  assert.equal(abbina('EJU3512', 'In transito', AERO).direzione, 'partenza');
  assert.equal(abbina('EJU3512', 'In arrivo', AERO), null); // 3512 è una partenza, l'aereo sta arrivando
  assert.equal(abbina('RYR8PK', 'In partenza', AERO), null); // nominativo alfanumerico
  assert.equal(abbina('VLG4342', 'In partenza', AERO), null); // numero uguale, compagnia diversa
  assert.equal(abbina('', 'In arrivo', AERO), null);
  assert.equal(abbina(undefined, 'In arrivo', AERO), null);
  const doppio = { arrivi: [], partenze: [{ volo: 'FR 04342' }, { volo: 'FR 4342' }] };
  assert.equal(abbina('RYR4342', 'In partenza', doppio), null); // due voli possibili = nessuno
});

test('arricchisci: solo gli aerei abbinati ricevono i campi linea_', () => {
  const fc = { features: [
    { properties: { id: 'a', volo: 'EJU3512', stato: 'In partenza' } },
    { properties: { id: 'b', volo: 'N123AB', stato: 'In transito' } },
  ] };
  arricchisci(fc, AERO);
  assert.equal(fc.features[0].properties.linea_ritardo_min, 21);
  assert.equal(fc.features[0].properties.linea_volo, 'EC 03512');
  assert.equal('linea_volo' in fc.features[1].properties, false);
});

test('/aeroporto: una sola richiesta a Gesap per molti utenti (cache), con CORS e riepilogo', async () => {
  const n = { chiamate: 0 };
  const cache = cacheFinta();
  const f = async (...a) => { n.chiamate++; return pagina(HTML)(...a); };
  const a = await gestisciAeroporto(rq(), env, f, cache);
  const b = await gestisciAeroporto(rq(), env, f, cache);
  assert.equal(n.chiamate, 1);
  assert.equal(a.headers.get('access-control-allow-origin'), ORIGINE);
  const corpo = await b.json();
  assert.ok(corpo.partenze.length > 0 && corpo.riepilogo.cancellati >= 1);
  assert.equal(corpo.fonte.includes('Gesap'), true);
});

test('/aeroporto: origine non ammessa, metodo non ammesso, pagina cambiata = 502', async () => {
  const cache = cacheFinta();
  assert.equal((await gestisciAeroporto(new Request('https://proxy.test/aeroporto', { headers: { origin: 'https://altro.example' } }), env, pagina(HTML), cache)).status, 403);
  assert.equal((await gestisciAeroporto(rq('aeroporto', { method: 'POST' }), env, pagina(HTML), cache)).status, 405);
  const r = await gestisciAeroporto(rq(), env, pagina('<html></html>'), cacheFinta());
  assert.equal(r.status, 502);
  assert.equal((await gestisciAeroporto(rq(), env, pagina('boom', 500), cacheFinta())).status, 502);
});

test('Gesap giù dopo una lettura buona: si servono gli ultimi dati, segnalati come precedenti', async () => {
  const cache = cacheFinta();
  await leggiAeroporto(pagina(HTML), cache);
  cache.cancella = true;
  // la chiave breve scade, quella lunga resta: la simuliamo togliendo solo la breve
  const senzaBreve = { match: async k => (k.url.endsWith('/aeroporto') ? undefined : cache.match(k)), put: cache.put };
  const { dati, precedenti } = await leggiAeroporto(pagina('', 503), senzaBreve);
  assert.equal(precedenti, true);
  assert.ok(dati.partenze.length > 0);
});

test('/voli porta il volo di linea degli aerei abbinati e non si rompe se Gesap non risponde', async () => {
  const aereo = { hex: 'abc123', flight: 'EJU3512 ', r: 'OE-IJA', t: 'A320', alt_baro: 2500, gs: 160, track: 90, baro_rate: 1500, lat: 38.2, lon: 13.2 };
  const adsb = async url => new Response(JSON.stringify({ now: 1000, ac: [aereo] }), { status: 200 });
  const conGesap = async (url, init) => (String(url).includes('aeroportodipalermo') ? pagina(HTML)() : adsb(url, init));
  const ok = await (await gestisciVoli(rq('voli'), env, conGesap, cacheFinta())).json();
  assert.equal(ok.features[0].properties.linea_ritardo_min, 21);
  const senzaGesap = async (url, init) => (String(url).includes('aeroportodipalermo') ? pagina('', 503)() : adsb(url, init));
  const r = await gestisciVoli(rq('voli'), env, senzaGesap, cacheFinta());
  assert.equal(r.status, 200);
  assert.equal((await r.json()).features[0].properties.linea_volo, undefined);
});

test('costruisci: forma della risposta', () => {
  const d = costruisci(leggiGesap(HTML), 1792700000000);
  assert.equal(d.letto, 1792700000);
  assert.deepEqual(Object.keys(d).sort(), ['aggiornato', 'arrivi', 'fonte', 'letto', 'partenze', 'riepilogo']);
});

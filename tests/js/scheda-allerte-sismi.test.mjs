import test from 'node:test';
import assert from 'node:assert/strict';
import './setup-i18n.mjs';
import { sismiRecenti, sismoNotevole, caricaSismi24h, MAG_SISMI, MAG_NOTEVOLE, ORE_SISMI } from '../../js/layers/scheda-allerte.js';

const LIM = [[11.7, 36.3], [16.2, 39.2]];
const ADESSO = Date.parse('2026-10-26T12:00:00Z');
const ev = (mag, oreFa, luogo = 'Tirreno Meridionale [Mare]', id = `${mag}-${oreFa}`) => ({ id, mag, ts: ADESSO - oreFa * 3600000, luogo });

test('sismiRecenti: tiene solo magnitudo sopra soglia e ultime ore', () => {
  const r = sismiRecenti([ev(MAG_SISMI, 1), ev(MAG_SISMI - 0.1, 1), ev(4, ORE_SISMI + 1)], ADESSO);
  assert.deepEqual(r.map(e => e.id), [`${MAG_SISMI}-1`]);
});

test('sismiRecenti: dal più recente, al massimo 5', () => {
  const lista = Array.from({ length: 8 }, (_, i) => ev(4, i + 1));
  const r = sismiRecenti(lista, ADESSO);
  assert.equal(r.length, 5);
  assert.equal(r[0].id, '4-1');
});

test('sismiRecenti: eventi nel futuro o senza dati sono scartati', () => {
  assert.deepEqual(sismiRecenti([ev(4, -2), { mag: NaN, ts: ADESSO }, null], ADESSO), []);
});

test('sismoNotevole: il più forte delle ultime 24 ore se arriva a MAG_NOTEVOLE, altrimenti null', () => {
  assert.equal(sismoNotevole([ev(MAG_NOTEVOLE - 0.1, 1)], ADESSO), null);
  assert.equal(sismoNotevole([ev(MAG_NOTEVOLE, 5, 'A', 'a'), ev(MAG_NOTEVOLE + 1, 20, 'B', 'b'), ev(6, ORE_SISMI + 2, 'C', 'c')], ADESSO).id, 'b');
});

test('caricaSismi24h: interroga INGV con area e soglia, restituisce le proprietà; 204 = nessun evento', async () => {
  let url;
  const geo = { features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [14, 38, 10] }, properties: { eventId: 1, time: '2026-10-26T10:00:00.000000', mag: 3.4, place: 'Tirreno' } }] };
  const r = await caricaSismi24h(LIM, async u => { url = u; return { ok: true, status: 200, json: async () => geo }; }, ADESSO);
  assert.match(url, /webservices\.ingv\.it.*minmag=3/);
  assert.equal(r[0].mag, 3.4);
  assert.deepEqual(await caricaSismi24h(LIM, async () => ({ ok: true, status: 204 }), ADESSO), []);
  await assert.rejects(caricaSismi24h(LIM, async () => ({ ok: false, status: 500 }), ADESSO));
});

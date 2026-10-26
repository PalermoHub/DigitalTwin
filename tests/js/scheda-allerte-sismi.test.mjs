import test from 'node:test';
import assert from 'node:assert/strict';
import './setup-i18n.mjs';
import { sismiRecenti, MAG_SISMI, ORE_SISMI } from '../../js/layers/scheda-allerte.js';

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

import test from 'node:test';
import assert from 'node:assert/strict';
import { posizioneSole, localeInData, dataInLocale, scartoRoma, hhmm } from '../../js/core/ombre-sole.js';

test('ora legale: +2 h d\'estate, +1 h d\'inverno, cambio l\'ultima domenica di marzo e di ottobre', () => {
  assert.equal(scartoRoma(Date.UTC(2026, 5, 21, 12)), 120);
  assert.equal(scartoRoma(Date.UTC(2026, 11, 21, 12)), 60);
  assert.equal(scartoRoma(Date.UTC(2026, 2, 29, 0, 59)), 60);
  assert.equal(scartoRoma(Date.UTC(2026, 2, 29, 1, 0)), 120);
  assert.equal(scartoRoma(Date.UTC(2026, 9, 25, 0, 59)), 120);
  assert.equal(scartoRoma(Date.UTC(2026, 9, 25, 1, 0)), 60);
});

test('locale -> Date -> locale è l\'identità', () => {
  const d = localeInData('2026-06-21', 14 * 60 + 30);
  assert.equal(d.toISOString(), '2026-06-21T12:30:00.000Z');
  assert.deepEqual(dataInLocale(d), { giorno: '2026-06-21', minuti: 870 });
});

test('solstizio d\'estate a mezzogiorno solare: sole a sud, quota ~ 90 - lat + 23,44', () => {
  const s = posizioneSole(localeInData('2026-06-21', 13 * 60 + 9)); // mezzogiorno solare a 13,35°E con ora legale ≈ 13:09
  assert.ok(Math.abs(s.el - (90 - 38.1367 + 23.44)) < 0.6, `elevazione ${s.el}`);
  assert.ok(Math.abs(s.az - 180) < 3, `azimut ${s.az}`);
});

test('solstizio d\'inverno: sole a mezzogiorno molto più basso', () => {
  const s = posizioneSole(localeInData('2026-12-21', 12 * 60 + 11));
  assert.ok(Math.abs(s.el - (90 - 38.1367 - 23.44)) < 0.6, `elevazione ${s.el}`);
});

test('di mattina il sole sta a est, di sera a ovest, di notte è sotto l\'orizzonte', () => {
  assert.ok(posizioneSole(localeInData('2026-09-23', 8 * 60)).az < 120);
  assert.ok(posizioneSole(localeInData('2026-09-23', 17 * 60)).az > 240);
  assert.ok(posizioneSole(localeInData('2026-09-23', 2 * 60)).el < 0);
});

test('hhmm', () => assert.equal(hhmm(605), '10:05'));

test('orario iniziale: di giorno è adesso, di notte diventa mezzogiorno dello stesso giorno', async () => {
  const { orarioIniziale, ORA_MIN, ORA_MAX } = await import('../../js/core/ombre-sole.js');
  assert.deepEqual(orarioIniziale(localeInData('2026-06-21', 15 * 60)), { giorno: '2026-06-21', minuti: 900 });
  assert.deepEqual(orarioIniziale(localeInData('2026-06-21', 23 * 60)), { giorno: '2026-06-21', minuti: 720 });
  assert.deepEqual(orarioIniziale(localeInData('2026-06-21', 20 * 60 + 30)), { giorno: '2026-06-21', minuti: 720 }); // dopo le 20 non si parte da lì
  assert.equal(ORA_MIN, 300);
  assert.equal(ORA_MAX, 1200);
});

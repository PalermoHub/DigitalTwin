import test from 'node:test';
import assert from 'node:assert/strict';
import { idPin, leggiIdPin, spicchi } from '../../js/layers/pronto-soccorso-pin.js';

test('idPin e leggiIdPin: andata e ritorno', () => {
  const id = idPin({ inAttesa: 33, codici: { rosso: { attesa: 2 }, verde: { attesa: 17 }, bianco: { attesa: null } } }, 'molto');
  assert.equal(id, 'ps-pin|molto|33|2,0,0,17,0');
  assert.deepEqual(leggiIdPin(id), { livello: 'molto', totale: 33, parti: [2, 0, 0, 17, 0] });
});

test('dato assente: totale vuoto, mai 0 inventato', () => {
  const id = idPin({ codici: {} }, 'nd');
  assert.equal(leggiIdPin(id).totale, null);
  assert.equal(leggiIdPin('altro|nd||'), null);
  assert.equal(leggiIdPin('ps-pin|inventato|1|0,0,0,0,0'), null);
});

test('spicchi: proporzionali, dalle 12 in senso orario; nessuno senza attese', () => {
  assert.deepEqual(spicchi([0, 0, 0, 0, 0]), []);
  const s = spicchi([1, 0, 0, 3, 0]);
  assert.equal(s.length, 2);
  assert.ok(Math.abs(s[0].da + Math.PI / 2) < 1e-9);
  assert.ok(Math.abs((s[0].a - s[0].da) - Math.PI / 2) < 1e-9); // 1/4 del giro
  assert.ok(Math.abs(s[1].a - (3 * Math.PI / 2)) < 1e-9);
});

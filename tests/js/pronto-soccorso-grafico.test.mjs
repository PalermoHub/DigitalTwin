// tests/js/pronto-soccorso-grafico.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { serieDi, tracciato } from '../../js/layers/pronto-soccorso-grafico.js';

test('serieDi: serve il presidio e almeno 6 letture', () => {
  const ok = [1, 2, 3, 4, 5, 6, null];
  assert.equal(serieDi({ ps: { a: ok } }, 'a'), ok);
  assert.equal(serieDi({ ps: { a: [1, 2, null, null] } }, 'a'), null);
  assert.equal(serieDi({ ps: {} }, 'a'), null);
  assert.equal(serieDi(null, 'a'), null);
});

test('tracciato: i buchi spezzano la linea, il massimo è arrotondato a multipli di 4', () => {
  const t = tracciato([2, 3, null, null, 5, 6, 7.2]);
  assert.equal(t.max, 8);
  assert.equal((t.linea.match(/M/g) ?? []).length, 2); // due tratti continui
  assert.ok(t.y(0) > t.y(8));
});

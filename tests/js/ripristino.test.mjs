import test from 'node:test';
import assert from 'node:assert/strict';
import { ripristinaPersonalizzazioni, collegaRipristino, CHIAVI_PERSONALIZZAZIONI } from '../../js/core/ripristino.js';

const finto = dati => ({ dati, getItem: k => dati[k] ?? null, removeItem: k => { delete dati[k]; } });

test('toglie solo le personalizzazioni, non i layer RNDT', () => {
  const s = finto({ 'dt-temi-strati': '{}', 'dt.scheda.nascosti': '{}', 'dt-ordine-strati': '[]', 'dt:rndt:v1': '{"layer":1}' });
  assert.equal(ripristinaPersonalizzazioni(s), 3);
  assert.deepEqual(Object.keys(s.dati), ['dt:rndt:v1']);
  assert.equal(CHIAVI_PERSONALIZZAZIONI.length, 3);
});

test('storage assente o che lancia: nessun errore', () => {
  assert.equal(ripristinaPersonalizzazioni(null), 0);
  assert.equal(ripristinaPersonalizzazioni({ getItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } }), 0);
});

test('il pulsante chiede conferma e ricarica solo se accettata', () => {
  let click; const bottone = { addEventListener: (_, f) => { click = f; } };
  const s = finto({ 'dt-temi-strati': '{}' }); let ricaricata = 0;
  collegaRipristino(bottone, s, () => ricaricata++, () => false);
  click();
  assert.equal(ricaricata, 0); assert.ok('dt-temi-strati' in s.dati);
  collegaRipristino(bottone, s, () => ricaricata++, () => true);
  click();
  assert.equal(ricaricata, 1); assert.deepEqual(s.dati, {});
});

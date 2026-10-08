import test from 'node:test';
import assert from 'node:assert/strict';
import { TIPI, ICONE } from '../../js/aggiungi/albero.js';

test('ogni tipo di servizio ha la sua icona, diversa dalla cartella', () => {
  for (const t of TIPI) {
    assert.ok(ICONE[t.id], `manca l'icona di ${t.id}`);
    assert.notEqual(ICONE[t.id], ICONE.cartella);
  }
  assert.equal(new Set(TIPI.map(t => ICONE[t.id])).size, TIPI.length, 'le icone dei tipi devono essere distinte');
});

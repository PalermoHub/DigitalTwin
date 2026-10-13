import test from 'node:test';
import assert from 'node:assert/strict';
import { modelliDaVoci } from '../../js/core/tooltip-scheda.js';

const voce = (strato, titolo, valori = [['Foglio', '127']]) => ({ chiave: titolo, strato, titolo, gruppi: [{ righe: valori.map(([etichetta, valore]) => ({ etichetta, valore })) }] });

test('tooltip da scheda: solo strati accesi', () => {
  const m = modelliDaVoci([voce('catasto', 'Particella'), voce('prg', 'Zonizzazione')], { acceso: id => id === 'catasto' });
  assert.deepEqual(m.map(x => x.titolo), ['Particella']);
  assert.deepEqual(m[0].righe, [{ etichetta: 'Foglio', valore: '127' }]);
});

test('tooltip da scheda: strati esclusi, doppioni e righe in eccesso', () => {
  const tante = [['a', '1'], ['b', '2'], ['c', '3'], ['d', '4']];
  const m = modelliDaVoci([voce('immobili', 'Immobile'), voce('x', 'Uno', tante), voce('x', 'Uno', tante)], { acceso: () => true, escludi: ['immobili'] });
  assert.equal(m.length, 1);
  assert.equal(m[0].righe.length, 3);
});

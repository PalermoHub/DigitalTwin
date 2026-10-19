import test from 'node:test';
import assert from 'node:assert/strict';
import { statoPercorso, commutaPercorso, portaAllaVista } from '../../js/core/chat-bot-percorsi.js';

function docFinto(caselle) {
  const mappa = new Map(Object.entries(caselle).map(([id, acceso]) => {
    const c = { checked: acceso, dataset: {}, closest: () => ({ innerText: `Etichetta ${id}` }), dispatchEvent() {} };
    return [`strato-${id}`, c];
  }));
  return { getElementById: id => mappa.get(id) ?? null, mappa };
}

test('statoPercorso: tiene solo gli strati presenti e dice se sono tutti accesi', () => {
  const d = docFinto({ a: true, b: false });
  assert.deepEqual(statoPercorso(d, ['a', 'b', 'x']), { presenti: ['a', 'b'], acceso: false });
  assert.equal(statoPercorso(docFinto({ a: true, b: true }), ['a', 'b', 'x']).acceso, true);
  assert.deepEqual(statoPercorso(docFinto({}), ['x']), { presenti: [], acceso: false });
});

test('commutaPercorso: accende i mancanti con la legenda sulla mappa, poi spegne tutto', () => {
  const d = docFinto({ a: true, b: false });
  assert.equal(commutaPercorso(d, ['a', 'b']), true);
  assert.equal(d.mappa.get('strato-a').checked, true);
  assert.equal(d.mappa.get('strato-b').checked, true);
  assert.equal(d.mappa.get('strato-b').dataset.legendaMappa, '1');
  assert.equal(commutaPercorso(d, ['a', 'b']), false);
  assert.equal(d.mappa.get('strato-a').checked, false);
  assert.equal(d.mappa.get('strato-b').checked, false);
});

test('commutaPercorso: nessuno strato presente -> null', () => {
  assert.equal(commutaPercorso(docFinto({}), ['x']), null);
});

test('portaAllaVista: solo con una vista a cinque numeri', () => {
  const chiamate = [];
  const mappa = { flyTo: o => chiamate.push(o) };
  portaAllaVista(mappa, null);
  portaAllaVista(mappa, [1, 2]);
  portaAllaVista(null, [13.36, 38.11, 16, 0, 0]);
  assert.equal(chiamate.length, 0);
  portaAllaVista(mappa, [13.36, 38.11, 16, 0, 0]);
  assert.deepEqual(chiamate, [{ center: [13.36, 38.11], zoom: 16, bearing: 0, pitch: 0 }]);
});

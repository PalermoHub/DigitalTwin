import test from 'node:test';
import assert from 'node:assert/strict';
import { statoStrato, accendiStrato } from '../../js/core/chat-bot-strati.js';

function docFinto(caselle) {
  const mappa = new Map(Object.entries(caselle).map(([id, acceso]) => {
    const c = { checked: acceso, eventi: [], closest: () => ({ innerText: `Etichetta ${id}\n` }), dispatchEvent(e) { this.eventi.push(e.type); } };
    return [`strato-${id}`, c];
  }));
  return { getElementById: id => mappa.get(id) ?? null, mappa };
}

test('statoStrato: nome dall\'etichetta e stato acceso', () => {
  const d = docFinto({ bus: false, tram: true });
  assert.deepEqual(statoStrato(d, 'bus'), { nome: 'Etichetta bus', acceso: false });
  assert.equal(statoStrato(d, 'tram').acceso, true);
});
test('statoStrato: layer inesistente -> null', () => {
  assert.equal(statoStrato(docFinto({}), 'bus'), null);
});
test('accendiStrato: spunta la casella e lancia «change»', () => {
  const d = docFinto({ bus: false });
  assert.equal(accendiStrato(d, 'bus'), true);
  assert.equal(d.mappa.get('strato-bus').checked, true);
  assert.deepEqual(d.mappa.get('strato-bus').eventi, ['change']);
});
test('accendiStrato: già acceso o inesistente -> false, nessun evento', () => {
  const d = docFinto({ bus: true });
  assert.equal(accendiStrato(d, 'bus'), false);
  assert.deepEqual(d.mappa.get('strato-bus').eventi, []);
  assert.equal(accendiStrato(d, 'xx'), false);
});

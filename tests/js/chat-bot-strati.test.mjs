import test from 'node:test';
import assert from 'node:assert/strict';
import { statoStrato, commutaStrato } from '../../js/core/chat-bot-strati.js';

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
test('commutaStrato: accende, poi spegne, lanciando «change» ogni volta', () => {
  const d = docFinto({ bus: false });
  assert.equal(commutaStrato(d, 'bus'), true);
  assert.equal(d.mappa.get('strato-bus').checked, true);
  assert.equal(commutaStrato(d, 'bus'), false);
  assert.equal(d.mappa.get('strato-bus').checked, false);
  assert.deepEqual(d.mappa.get('strato-bus').eventi, ['change', 'change']);
});
test('commutaStrato: layer inesistente -> null, nessun errore', () => {
  assert.equal(commutaStrato(docFinto({}), 'xx'), null);
});

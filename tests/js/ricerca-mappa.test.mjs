import test from 'node:test';
import assert from 'node:assert/strict';
import { creaRicercaMappa } from '../../js/core/ricerca-mappa.js';

const zone = { suggerisci: q => (q === 'ZISA' ? [{ etichetta: 'Zisa', nota: 'Quartiere', vai: () => {} }] : []) };
const territorio = { suggerisci: async q => (q.includes('incendi') ? { inCima: [{ etichetta: 'Incendi 2023', vai: () => {} }], inCoda: [] } : { inCima: [], inCoda: [] }) };

test('trova una zona dentro una frase', async () => {
  const r = await creaRicercaMappa({ zone })('dove si trova il quartiere Zisa?');
  assert.equal(r[0].etichetta, 'Zisa');
  assert.equal(typeof r[0].vai, 'function');
});

test('la particella si riconosce anche in una frase e chiama vaiParticella', async () => {
  const chiamate = [];
  const r = await creaRicercaMappa({ vaiParticella: (f, n) => chiamate.push([f, n]) })('mostrami il foglio 12 particella 345');
  r[0].vai();
  assert.deepEqual(chiamate, [['12', '345']]);
  assert.equal((await creaRicercaMappa({ vaiParticella: () => {} })('apri 7/88'))[0].nota.includes('88'), true);
});

test('incendi e PAI vengono dal territorio; senza corrispondenze nulla', async () => {
  const cerca = creaRicercaMappa({ zone, territorio, vaiParticella: () => {} });
  assert.equal((await cerca('incendi 2023'))[0].etichetta, 'Incendi 2023');
  assert.deepEqual(await cerca('buongiorno'), []);
});

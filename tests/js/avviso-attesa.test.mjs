import test from 'node:test';
import assert from 'node:assert/strict';
import { creaAvvisoAttesa } from '../../js/core/avviso-attesa.js';

function contenitoreFinto() {
  const figli = [];
  return { figli, append: n => { figli.push(n); n.remove = () => figli.splice(figli.indexOf(n), 1); } };
}
const nodoFinto = () => ({});
const pausa = ms => new Promise(r => setTimeout(r, ms));

test('avviso: compare solo se l\'attesa supera il ritardo e sparisce alla fine', async () => {
  const c = contenitoreFinto();
  const a = creaAvvisoAttesa(c, 'Attendere', { ritardo: 20, creaNodo: nodoFinto });
  let finisci;
  const p = a.durante(new Promise(r => { finisci = r; }));
  assert.equal(c.figli.length, 0);
  await pausa(40);
  assert.equal(c.figli.length, 1);
  assert.equal(c.figli[0].textContent, 'Attendere');
  finisci('x');
  assert.equal(await p, 'x');
  await pausa(0);
  assert.equal(c.figli.length, 0);
});

test('avviso: un caricamento rapido non lo mostra mai', async () => {
  const c = contenitoreFinto();
  const a = creaAvvisoAttesa(c, 'Attendere', { ritardo: 30, creaNodo: nodoFinto });
  await a.durante(Promise.resolve());
  await pausa(50);
  assert.equal(c.figli.length, 0);
});

test('avviso: con più attese resta finché non finiscono tutte, e un errore non lo blocca', async () => {
  const c = contenitoreFinto();
  const a = creaAvvisoAttesa(c, 'Attendere', { ritardo: 10, creaNodo: nodoFinto });
  let primo; let secondo;
  const p1 = a.durante(new Promise(r => { primo = r; }));
  const p2 = a.durante(new Promise((_, no) => { secondo = no; }));
  await pausa(30);
  assert.equal(c.figli.length, 1);
  primo();
  await p1;
  await pausa(0);
  assert.equal(c.figli.length, 1);
  secondo(new Error('rete'));
  await assert.rejects(p2, /rete/);
  await pausa(0);
  assert.equal(c.figli.length, 0);
});

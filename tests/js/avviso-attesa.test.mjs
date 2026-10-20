import test from 'node:test';
import assert from 'node:assert/strict';
import { creaAvvisoAttesa, mappaFerma } from '../../js/core/avviso-attesa.js';

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

function mappaFinta(caricata) {
  const ascoltatori = new Set();
  return { loaded: () => caricata, on: (_, f) => ascoltatori.add(f), off: (_, f) => ascoltatori.delete(f), idle: () => [...ascoltatori].forEach(f => f()), ascoltatori };
}

test('mappaFerma: si risolve subito al primo controllo se la mappa è già carica', async () => {
  const m = mappaFinta(true);
  await mappaFerma(m, { primoControllo: 5, attesaMax: 1000 });
  assert.equal(m.ascoltatori.size, 0);
});

test('mappaFerma: se la mappa carica attende l\'evento idle', async () => {
  const m = mappaFinta(false);
  let finita = false;
  const p = mappaFerma(m, { primoControllo: 5, attesaMax: 1000 }).then(() => { finita = true; });
  await pausa(20);
  assert.equal(finita, false);
  m.idle();
  await p;
  assert.equal(m.ascoltatori.size, 0);
});

test('mappaFerma: dopo attesaMax si risolve comunque', async () => {
  const m = mappaFinta(false);
  await mappaFerma(m, { primoControllo: 5, attesaMax: 30 });
  assert.equal(m.ascoltatori.size, 0);
});

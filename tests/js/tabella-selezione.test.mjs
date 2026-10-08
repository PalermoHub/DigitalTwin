import test from 'node:test';
import assert from 'node:assert/strict';
import { nuovoStato, commutaRiga, tutte, nessuna, inverti, statoTutte, righeDaEsportare, commutaColonna, spostaColonna, colonneDaEsportare } from '../../js/core/tabella/selezione.js';

const ordine = ['a', 'b', 'c', 'd', 'e'];

test('commutaRiga: spunta e toglie la spunta, ricorda l’ultima', () => {
  let s = commutaRiga(nuovoStato(), 'b', ordine);
  assert.deepEqual([...s.sel], ['b']);
  assert.equal(s.ultimo, 'b');
  s = commutaRiga(s, 'b', ordine);
  assert.equal(s.sel.size, 0);
});

test('commutaRiga con Maiusc: intervallo dall’ultima riga, nei due versi', () => {
  let s = commutaRiga(nuovoStato(), 'b', ordine);
  s = commutaRiga(s, 'd', ordine, true);
  assert.deepEqual([...s.sel].sort(), ['b', 'c', 'd']);
  s = commutaRiga(s, 'a', ordine, true);
  assert.deepEqual([...s.sel].sort(), ['a', 'b', 'c', 'd']);
});

test('commutaRiga con Maiusc senza riga precedente o con chiave non in elenco: spunta solo quella', () => {
  assert.deepEqual([...commutaRiga(nuovoStato(), 'c', ordine, true).sel], ['c']);
  const s = { sel: new Set(['x']), ultimo: 'x' };
  assert.deepEqual([...commutaRiga(s, 'c', ordine, true).sel].sort(), ['c', 'x']);
});

test('commutaRiga non modifica lo stato di partenza', () => {
  const s = nuovoStato();
  commutaRiga(s, 'a', ordine);
  assert.equal(s.sel.size, 0);
});

test('tutte, nessuna e inverti agiscono solo sulle righe elencate', () => {
  const s = { sel: new Set(['z']), ultimo: null };
  assert.deepEqual([...tutte(s, ['a', 'b']).sel].sort(), ['a', 'b', 'z']);
  assert.deepEqual([...nessuna({ sel: new Set(['a', 'z']), ultimo: null }, ['a', 'b']).sel], ['z']);
  assert.deepEqual([...inverti({ sel: new Set(['a']), ultimo: null }, ['a', 'b']).sel], ['b']);
});

test('statoTutte: nessuna, parziale, tutte e lista vuota', () => {
  const s = { sel: new Set(['a']), ultimo: null };
  assert.equal(statoTutte(s, ['a', 'b']), 'parziale');
  assert.equal(statoTutte(s, ['a']), 'tutte');
  assert.equal(statoTutte(s, ['b']), 'nessuna');
  assert.equal(statoTutte(s, []), 'nessuna');
});

test('righeDaEsportare: le selezionate, altrimenti tutte quelle mostrate', () => {
  const righe = [{ chiave: 'a' }, { chiave: 'b' }, { chiave: 'c' }];
  assert.deepEqual(righeDaEsportare(righe, { sel: new Set(['c', 'a']), ultimo: null }).map(r => r.chiave), ['a', 'c']);
  assert.equal(righeDaEsportare(righe, nuovoStato()).length, 3);
  assert.equal(righeDaEsportare(righe, { sel: new Set(['fuori-vista']), ultimo: null }).length, 3, 'selezione non più visibile');
  assert.deepEqual(righeDaEsportare([], nuovoStato()), []);
});

test('colonne: nascondere toglie anche dall’export, esporta è indipendente, sposta e filtra', () => {
  const cols = [{ campo: 'a', visibile: true, esporta: true }, { campo: 'b', visibile: true, esporta: true }, { campo: 'c', visibile: true, esporta: true }];
  const nascosta = commutaColonna(cols, 'b', 'visibile');
  assert.deepEqual(nascosta[1], { campo: 'b', visibile: false, esporta: false });
  assert.deepEqual(commutaColonna(nascosta, 'b', 'visibile')[1], { campo: 'b', visibile: true, esporta: true });
  assert.deepEqual(commutaColonna(cols, 'c', 'esporta')[2], { campo: 'c', visibile: true, esporta: false });
  assert.deepEqual(spostaColonna(cols, 'c', -1).map(c => c.campo), ['a', 'c', 'b']);
  assert.deepEqual(spostaColonna(cols, 'a', -1).map(c => c.campo), ['a', 'b', 'c'], 'ai bordi non fa nulla');
  assert.deepEqual(colonneDaEsportare(commutaColonna(cols, 'a', 'esporta')).map(c => c.campo), ['b', 'c']);
});

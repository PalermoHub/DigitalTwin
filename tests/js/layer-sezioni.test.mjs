import test from 'node:test';
import assert from 'node:assert/strict';
import { CHIAVE, ordinaSezioni, leggiAperte, salvaAperta } from '../../js/core/layer-sezioni.js';

const finto = (iniziale) => {
  const m = new Map(iniziale ? [[CHIAVE, iniziale]] : []);
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m };
};

test('ordinaSezioni: alfabetico italiano, senza badare a maiuscole', () => {
  const voci = [
    { id: 'trasporto', titolo: 'Trasporti' }, { id: 'edifici', titolo: 'Edifici' },
    { id: 'colonnine', titolo: 'Servizi' }, { id: 'confini', titolo: 'confini' },
  ];
  assert.deepEqual(ordinaSezioni(voci), ['confini', 'edifici', 'colonnine', 'trasporto']);
});

test('ordinaSezioni: non modifica l\'elenco ricevuto', () => {
  const voci = [{ id: 'b', titolo: 'B' }, { id: 'a', titolo: 'A' }];
  ordinaSezioni(voci);
  assert.deepEqual(voci.map(v => v.id), ['b', 'a']);
});

test('leggiAperte: senza storage, vuoto o con JSON corrotto restituisce []', () => {
  assert.deepEqual(leggiAperte(null), []);
  assert.deepEqual(leggiAperte(finto()), []);
  assert.deepEqual(leggiAperte(finto('{non json')), []);
  assert.deepEqual(leggiAperte(finto('{"a":1}')), []);
  assert.deepEqual(leggiAperte(finto('["edifici", 3, null]')), ['edifici']);
});

test('salvaAperta: aggiunge e toglie senza duplicati', () => {
  const s = finto();
  salvaAperta(s, 'edifici', true);
  salvaAperta(s, 'edifici', true);
  salvaAperta(s, 'confini', true);
  assert.deepEqual(leggiAperte(s), ['edifici', 'confini']);
  salvaAperta(s, 'edifici', false);
  assert.deepEqual(leggiAperte(s), ['confini']);
});

test('salvaAperta: storage che lancia o assente non produce eccezioni', () => {
  assert.doesNotThrow(() => salvaAperta(null, 'a', true));
  const rotto = { getItem: () => { throw new Error('bloccato'); }, setItem: () => { throw new Error('pieno'); } };
  assert.doesNotThrow(() => salvaAperta(rotto, 'a', true));
  assert.deepEqual(leggiAperte(rotto), []);
});

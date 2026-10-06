// tests/js/aggiungi-salvati.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHIAVE_SERVIZI, TETTO_SERVIZI, idServizio, leggiServizi, salvaServizi, aggiungiServizio, rimuoviServizio,
} from '../../js/aggiungi/salvati.js';

const finto = () => {
  const m = new Map();
  return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } };
};
const vuoto = { v: 1, servizi: [] };
const wms = { tipo: 'wms', nome: 'PAI', url: 'https://wms.example.org/ows', voci: [{ chiave: 'pai', nome: 'Piano PAI', opz: { layers: 'pai' } }] };

test('l’id dipende da tipo e URL', () => {
  assert.equal(idServizio('wms', 'https://a.it/'), idServizio('wms', 'https://a.it/'));
  assert.notEqual(idServizio('wms', 'https://a.it/'), idServizio('wfs', 'https://a.it/'));
});

test('aggiungi, rileggi, rimuovi', () => {
  const s = finto();
  const { stato, pieno } = aggiungiServizio(vuoto, wms);
  assert.equal(pieno, false);
  assert.equal(salvaServizi(s, stato), true);
  assert.deepEqual([...s.m.keys()], [CHIAVE_SERVIZI]);
  const letto = leggiServizi(s);
  assert.equal(letto.servizi.length, 1);
  assert.equal(letto.servizi[0].nome, 'PAI');
  assert.deepEqual(rimuoviServizio(letto, letto.servizi[0].id), vuoto);
});

test('lo stesso servizio due volte non si duplica e unisce le voci', () => {
  const a = aggiungiServizio(vuoto, wms).stato;
  const b = aggiungiServizio(a, { ...wms, voci: [{ chiave: 'altro', nome: 'Altro', opz: { layers: 'altro' } }, wms.voci[0]] }).stato;
  assert.equal(b.servizi.length, 1);
  assert.deepEqual(b.servizi[0].voci.map(v => v.chiave).sort(), ['altro', 'pai']);
});

test('oltre il tetto non si salva e si segnala', () => {
  let stato = vuoto;
  for (let i = 0; i < TETTO_SERVIZI; i++) stato = aggiungiServizio(stato, { tipo: 'xyz', nome: `T${i}`, url: `https://t${i}.it/{z}/{x}/{y}.png` }).stato;
  assert.equal(stato.servizi.length, TETTO_SERVIZI);
  const r = aggiungiServizio(stato, { tipo: 'xyz', nome: 'Uno di troppo', url: 'https://troppo.it/{z}/{x}/{y}.png' });
  assert.equal(r.pieno, true);
  assert.equal(r.stato.servizi.length, TETTO_SERVIZI);
  // un servizio già presente si può aggiornare anche a tetto raggiunto
  assert.equal(aggiungiServizio(stato, { tipo: 'xyz', nome: 'T0', url: 'https://t0.it/{z}/{x}/{y}.png' }).pieno, false);
});

test('stato corrotto o voci non valide: elenco vuoto o filtrato; storage bloccato senza eccezioni', () => {
  const s = finto();
  s.m.set(CHIAVE_SERVIZI, '{non json');
  assert.deepEqual(leggiServizi(s), vuoto);
  s.m.set(CHIAVE_SERVIZI, JSON.stringify({ v: 1, servizi: [{ id: 'x' }, { id: 'y', tipo: 'xyz', nome: 'Y', url: 'https://y.it/{z}/{x}/{y}.png', voci: [] }] }));
  assert.deepEqual(leggiServizi(s).servizi.map(x => x.id), ['y']);
  const rotto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); } };
  assert.deepEqual(leggiServizi(rotto), vuoto);
  assert.equal(salvaServizi(rotto, vuoto), false);
});

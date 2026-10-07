import test from 'node:test';
import assert from 'node:assert/strict';
import { CHIAVE, leggi, salva, elimina } from '../../js/geoimage/archivio.js';

const finto = (iniziale = {}) => {
  const dati = new Map(Object.entries(iniziale));
  return { getItem: k => dati.get(k) ?? null, setItem: (k, v) => { dati.set(k, v); }, removeItem: k => { dati.delete(k); }, dati };
};
const quattro = n => [0, 1, 2, 3].map(i => ({ lat: 38 + n + i / 100, lng: 13 + n }));
const progetto = () => ({ nome: 'a.png', larghezza: 300, altezza: 200, angoli: quattro(0), angoliIniziali: quattro(1), opacita: 0.4, tipo: 'poly2', gcp: [{ px: 1, py: 2, lat: 38, lng: 13 }] });

test('senza storage o senza dati non c\'è nulla da ripristinare', () => {
  assert.equal(leggi(null), null);
  assert.equal(leggi(finto()), null);
});

test('salva e rilegge lo stesso progetto', () => {
  const s = finto();
  assert.equal(salva(s, progetto()), true);
  assert.deepEqual(leggi(s), progetto());
});

test('JSON rotto, versione diversa o angoli sbagliati non rompono la lettura', () => {
  assert.equal(leggi(finto({ [CHIAVE]: '{rotto' })), null);
  assert.equal(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 2, ...progetto() }) })), null);
  assert.equal(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 1, ...progetto(), angoli: [{ lat: 1, lng: 2 }] }) })), null);
  assert.equal(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 1, ...progetto(), angoli: quattro(0).map(p => ({ lat: null, lng: p.lng })) }) })), null);
});

test('un GCP rovinato si scarta, il resto resta; un tipo sconosciuto torna all\'affine', () => {
  const s = finto({ [CHIAVE]: JSON.stringify({ v: 1, ...progetto(), tipo: 'altro', gcp: [{ px: 1, py: 2, lat: 38, lng: 13 }, { px: 'x' }] }) });
  const p = leggi(s);
  assert.equal(p.gcp.length, 1);
  assert.equal(p.tipo, 'poly1');
});

test('storage pieno o bloccato: salva dice false e non lancia', () => {
  const pieno = { setItem() { throw new DOMException('quota', 'QuotaExceededError'); } };
  assert.equal(salva(pieno, progetto()), false);
  assert.equal(salva(null, progetto()), false);
});

test('elimina toglie il progetto e non lancia senza storage', () => {
  const s = finto();
  salva(s, progetto());
  elimina(s);
  assert.equal(leggi(s), null);
  assert.doesNotThrow(() => elimina(null));
});

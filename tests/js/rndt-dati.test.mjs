// tests/js/rndt-dati.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { archivioInMemoria, archivioIndexedDB } from '../../js/rndt/dati.js';

const fc = { type: 'FeatureCollection', features: [] };

test('archivio in memoria: scrive, legge, elimina; un id sconosciuto dà null', async () => {
  const a = archivioInMemoria();
  assert.equal(await a.leggi('x'), null);
  await a.scrivi('x', fc);
  assert.deepEqual(await a.leggi('x'), fc);
  await a.elimina('x');
  assert.equal(await a.leggi('x'), null);
  await a.elimina('x'); // eliminare un id assente non è un errore
});

test('archivioIndexedDB senza IndexedDB nel browser dà null', () => {
  assert.equal(archivioIndexedDB(undefined), null);
});

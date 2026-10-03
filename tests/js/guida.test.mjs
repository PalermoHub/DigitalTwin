import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSI } from '../../js/core/guida-contenuti.js';

test('sette passi nell\'ordine previsto', () => {
  assert.deepEqual(PASSI.map(p => p.id), ['cos-e', 'dati', 'strati', 'clic', 'scheda', 'filtri', 'avvertenze']);
});

test('id univoci e validi come ancora', () => {
  const ids = PASSI.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test('ogni passo ha titolo, paragrafi, narrazione e immagine completa', () => {
  for (const p of PASSI) {
    assert.ok(p.titolo.trim(), `${p.id}: titolo`);
    assert.ok(p.paragrafi.length >= 1 && p.paragrafi.every(t => t.trim()), `${p.id}: paragrafi`);
    assert.ok(p.narrazione.trim().length > 40, `${p.id}: narrazione`);
    assert.equal(p.immagine.file, `img/guida/passi/${p.id}.webp`);
    assert.ok(p.immagine.alt.trim() && p.immagine.didascalia.trim(), `${p.id}: alt e didascalia`);
  }
});

test('le narrazioni non contengono cifre né sigle da leggere male', () => {
  for (const p of PASSI) {
    assert.doesNotMatch(p.narrazione, /\d/, `${p.id}: cifre`);
    assert.doesNotMatch(p.narrazione, /\b(PRG|GTFS|DTM|ISTAT|OSM)\b/, `${p.id}: sigle`);
  }
});

test('nessun passo parla di 3D', () => {
  for (const p of PASSI) assert.doesNotMatch(JSON.stringify(p), /3D/i, p.id);
});

test('la scena ha centro dentro Palermo e zoom nel range della mappa', () => {
  for (const p of PASSI) {
    const [lon, lat] = p.scena.centro;
    assert.ok(lon > 13.2 && lon < 13.5 && lat > 38.0 && lat < 38.3, `${p.id}: centro`);
    assert.ok(p.scena.zoom >= 12 && p.scena.zoom <= 18, `${p.id}: zoom`);
  }
});

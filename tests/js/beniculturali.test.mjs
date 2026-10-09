import test from 'node:test';
import assert from 'node:assert/strict';
import { BENI_CULTURALI, baseBeneCulturale } from '../../js/aggiungi/beniculturali.js';

test('beni culturali: id unici e base MapServer sul server SITR', () => {
  assert.equal(new Set(BENI_CULTURALI.map(b => b.id)).size, BENI_CULTURALI.length);
  for (const b of BENI_CULTURALI) {
    assert.equal(baseBeneCulturale(b), `https://map.sitr.regione.sicilia.it/gis/rest/services/beni_culturali/${b.id}/MapServer`);
    assert.ok(Number.isInteger(b.layer));
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { BENI_CULTURALI, urlBeneCulturale } from '../../js/aggiungi/beniculturali.js';

test('beni culturali: id unici e URL export sul MapServer SITR con il layer giusto', () => {
  assert.equal(new Set(BENI_CULTURALI.map(b => b.id)).size, BENI_CULTURALI.length);
  for (const b of BENI_CULTURALI) {
    assert.match(urlBeneCulturale(b), new RegExp(`^https://map\\.sitr\\.regione\\.sicilia\\.it/gis/rest/services/beni_culturali/${b.id}/MapServer/export\\?bbox=\\{bbox-epsg-3857\\}.*layers=show%3A${b.layer}&f=image$`));
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { ORTOFOTO, urlOrtofoto } from '../../js/aggiungi/ortofoto.js';

test('ortofoto: id unici, zoom massimo sensato e URL a tile ArcGIS /z/y/x sul server SITR', () => {
  assert.equal(new Set(ORTOFOTO.map(o => o.id)).size, ORTOFOTO.length);
  for (const o of ORTOFOTO) {
    assert.ok(o.max >= 17 && o.max <= 22, o.id);
    assert.match(urlOrtofoto(o), /^https:\/\/map\.sitr\.regione\.sicilia\.it\/gis\/rest\/services\/ortofoto\/[\w]+\/(MapServer|ImageServer)\/tile\/\{z\}\/\{y\}\/\{x\}$/);
  }
});

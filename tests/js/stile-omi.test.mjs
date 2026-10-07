import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { STILE_OMI } from '../../js/layers/stile-omi.js';
import { estrai } from '../../scripts/estrai_stile_omi.mjs';

const SORGENTE = '/mnt/d/GitHub - Clone/SiciliaHub/palermohub/pmtiles/js/catasto_script.js';

test('stile OMI: match su Zona_OMI, coppie zona/colore esadecimale, colore di riserva', () => {
  assert.equal(STILE_OMI[0], 'match');
  assert.deepEqual(STILE_OMI[1], ['get', 'Zona_OMI']);
  const coppie = STILE_OMI.slice(2, -1);
  assert.equal(coppie.length % 2, 0);
  assert.ok(coppie.length / 2 >= 40, `zone: ${coppie.length / 2}`);
  for (let i = 0; i < coppie.length; i += 2) {
    assert.match(coppie[i], /^[A-Z]\d+$/);
    assert.match(coppie[i + 1], /^#[0-9a-f]{6}$/i);
  }
  assert.match(STILE_OMI.at(-1), /^#[0-9a-f]{6}$/i);
});

test('stile OMI: alcune zone coincidono con l\'app originale', () => {
  const i = k => STILE_OMI.indexOf(k);
  assert.equal(STILE_OMI[i('B14') + 1], '#ff8094');
  assert.equal(STILE_OMI[i('D1') + 1], '#002bff');
  assert.equal(STILE_OMI[i('R2') + 1], '#2e992e');
});

test('stile OMI: identico a quello estratto ora dal sorgente originale', { skip: !existsSync(SORGENTE) }, () => {
  assert.deepEqual(STILE_OMI, estrai(readFileSync(SORGENTE, 'utf8')));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { idBadge, coloreGlifo, espressioneBadge, layerBadge, stileBadge } from '../../js/core/icone-mappa.js';

test('coloreGlifo: scuro su sfondo chiaro, bianco su sfondo scuro, bianco se il colore non è esadecimale', () => {
  assert.equal(coloreGlifo('#ffd43b'), '#222');
  assert.equal(coloreGlifo('#1971c2'), '#fff');
  assert.equal(coloreGlifo('#fff'), '#222');
  assert.equal(coloreGlifo('rosso'), '#fff');
});

test('espressioneBadge: un\'immagine per valore e una di riserva', () => {
  const e = espressioneBadge('colonnine', 'stato', [['A', '#111111'], ['B', '#222222']], '#555');
  assert.deepEqual(e, ['match', ['get', 'stato'], 'A', 'badge-colonnine-#111111', 'B', 'badge-colonnine-#222222', 'badge-colonnine-#555']);
  assert.equal(idBadge('x', '#abc'), 'badge-x-#abc');
});

test('layerBadge: symbol che non nasconde i punti vicini; stileBadge: disco col glifo come sfondo', () => {
  const l = layerBadge({ id: 'p', source: 's', immagine: 'img', layout: { visibility: 'none' } });
  assert.equal(l.type, 'symbol');
  assert.equal(l.layout['icon-image'], 'img');
  assert.equal(l.layout['icon-allow-overlap'], true);
  assert.equal(l.layout.visibility, 'none');
  const s = stileBadge('distributori', '#1971c2');
  assert.match(s.background, /^#1971c2 url\("data:image\/svg\+xml,/);
});

import { sdfDaMaschera, layerGlifo, stileGlifo, idGlifo } from '../../js/core/icone-mappa.js';

test('sdfDaMaschera: alfa alto dentro, 191 circa sul bordo, 0 lontano', () => {
  const lato = 20;
  const alfa = new Uint8Array(lato * lato);
  for (let y = 6; y < 14; y++) for (let x = 6; x < 14; x++) alfa[y * lato + x] = 255; // quadrato 8×8
  const img = sdfDaMaschera(alfa, lato, 4);
  const a = (x, y) => img.data[(y * lato + x) * 4 + 3];
  assert.ok(a(10, 10) > 191, 'dentro');
  assert.ok(a(6, 10) >= 191 && a(5, 10) < 191, 'bordo');
  assert.equal(a(0, 0), 0, 'lontano');
});

test('layerGlifo e stileGlifo', () => {
  const l = layerGlifo({ id: 'm', source: 's', icona: 'monumento', colore: '#123456' });
  assert.equal(l.layout['icon-image'], idGlifo('monumento'));
  assert.equal(l.metadata.forme, true);
  assert.equal(l.paint['icon-color'], '#123456');
  const st = stileGlifo('monumento', '#123456');
  assert.equal(st.background, '#123456');
  assert.match(st.mask, /^url\("data:image\/svg\+xml,/);
});

import { espressioneGlifo } from '../../js/core/icone-mappa.js';

test('espressioneGlifo e layerGlifo con più glifi', () => {
  const e = espressioneGlifo('categoria', [['A', 'chiesa'], ['B', 'teatro']], 'indirizzo');
  assert.deepEqual(e, ['match', ['get', 'categoria'], 'A', 'glifo-chiesa', 'B', 'glifo-teatro', 'glifo-indirizzo']);
  assert.equal(layerGlifo({ id: 'm', source: 's', immagine: e, colore: '#000' }).layout['icon-image'], e);
});

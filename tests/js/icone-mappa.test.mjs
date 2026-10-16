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

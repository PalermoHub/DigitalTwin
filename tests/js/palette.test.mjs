import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { densityStops, confiniStyle, sezioniColors, EDIFICATO_NEUTRAL } from '../../js/core/palette.js';

test('palette.js è la copia identica di quella di palermo_popolazione', () => {
  const originale = readFileSync(new URL('../../../palermo_popolazione/js/palette.js', import.meta.url));
  const copia = readFileSync(new URL('../../js/core/palette.js', import.meta.url));
  assert.equal(createHash('sha256').update(copia).digest('hex'), createHash('sha256').update(originale).digest('hex'));
});

test('rampe di densità e vecchiaia (tema chiaro) come nell\'app originale', () => {
  assert.deepEqual(densityStops('popolazione', false),
    [[0, '#8fa3c9'], [50, '#e0a93b'], [150, '#d9602b'], [400, '#a4243b']]);
  assert.deepEqual(densityStops('vecchiaia', false).map(([v]) => v), [0, 100, 150, 250, 400]);
});

test('stile dei confini e delle sezioni come nell\'app originale', () => {
  assert.deepEqual(confiniStyle('quartieri', false), { color: '#0f7f86', width: 1.5, dash: [3, 2], css: 'dashed' });
  assert.equal(confiniStyle('circoscrizioni', false).color, '#2b3350');
  assert.deepEqual(sezioniColors(false), { fill: '#2f4278', border: '#4a5b8f' });
  assert.equal(EDIFICATO_NEUTRAL, '#8a94a8');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { ePuntoVisibile } from '../../js/core/cursore-punti.js';

test('un punto visibile e opaco è cliccabile', () => {
  assert.equal(ePuntoVisibile('circle', 'visible', 0.9), true);
  assert.equal(ePuntoVisibile('circle', undefined, undefined), true); // senza `layout` e senza opacità esplicita
  assert.equal(ePuntoVisibile('circle', 'visible', ['interpolate', ['linear'], ['zoom'], 11, 0.2, 14, 1]), true);
});

test('gli strati spenti e i punti «hit» trasparenti non cambiano il puntatore', () => {
  assert.equal(ePuntoVisibile('circle', 'none', 1), false);
  assert.equal(ePuntoVisibile('circle', undefined, 0), false); // «hit»: sempre presenti, invisibili
});

test('solo i cerchi: poligoni, linee ed etichette hanno già i loro gestori', () => {
  for (const tipo of ['fill', 'line', 'symbol', 'raster', 'heatmap']) assert.equal(ePuntoVisibile(tipo, 'visible', 1), false, tipo);
});

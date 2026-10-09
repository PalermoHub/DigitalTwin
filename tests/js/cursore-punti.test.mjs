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

test('poligoni e linee dei layer aggiunti: mano se accesi', async () => {
  const { eEsternoCliccabile } = await import('../../js/core/cursore-punti.js');
  assert.equal(eEsternoCliccabile('miei-ab12-fill', 'fill', 'visible'), true);
  assert.equal(eEsternoCliccabile('rndt-x-line', 'line', undefined), true);
  assert.equal(eEsternoCliccabile('miei-ab12-fill', 'fill', 'none'), false);
  assert.equal(eEsternoCliccabile('confini-upl-fill', 'fill', 'visible'), false); // i layer del progetto hanno i loro gestori
});

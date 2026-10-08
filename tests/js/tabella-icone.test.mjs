import test from 'node:test';
import assert from 'node:assert/strict';
import { svgTabella, nomiIconeTabella } from '../../js/core/tabella/icone.js';

test('ogni icona è un SVG decorativo con viewBox 24', () => {
  for (const n of ['click', 'riquadro', 'poligono', 'area', 'torna', 'colonne', 'tutte', 'svuota', 'inverti', 'esporta']) {
    assert.ok(nomiIconeTabella.includes(n), n);
    const s = svgTabella(n);
    assert.match(s, /^<svg viewBox="0 0 24 24"/);
    assert.match(s, /aria-hidden="true"/);
  }
});
test('nome sconosciuto: stringa vuota', () => assert.equal(svgTabella('xx'), ''));

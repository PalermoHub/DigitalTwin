import test from 'node:test';
import assert from 'node:assert/strict';
import { areaOmbraHa } from '../../js/core/ombre-grafico.js';
import { ZH } from '../../js/core/ombre-sole.js';

// un edificio quadrato 10x10 m alto 10 m, anello antiorario (solido a sinistra di A->B)
function quadrato(h = 10) {
  const pts = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const buf = new ArrayBuffer(16 * 4);
  const dv = new DataView(buf);
  pts.forEach(([ax, ay], i) => {
    const [bx, by] = pts[(i + 1) % 4];
    dv.setInt32(i * 16, ax * 100, true); dv.setInt32(i * 16 + 4, ay * 100, true);
    dv.setInt16(i * 16 + 8, (bx - ax) * 100, true); dv.setInt16(i * 16 + 10, (by - ay) * 100, true);
    dv.setUint16(i * 16 + 12, h * 10, true);
  });
  return buf;
}

test('sole sotto l\'orizzonte: nessuna ombra', () => assert.equal(areaOmbraHa(quadrato(), 4, 180, -3), 0));

test('sole a 45° da sud: l\'ombra spazzata è larghezza x lunghezza dell\'ombra', () => {
  // spigolo nord lungo 10 m Mercator (10 / ZH m veri), ombra lunga h / tan(45°) = 10 m veri verso nord: 100 / ZH m²
  const ha = areaOmbraHa(quadrato(), 4, 180, 45);
  assert.ok(Math.abs(ha - 0.01 / ZH) < 0.0002, `ha ${ha}`);
});

test('più il sole è basso, più ombra (a parità di edificio)', () => {
  assert.ok(areaOmbraHa(quadrato(), 4, 180, 20) > areaOmbraHa(quadrato(), 4, 180, 60));
});

test('il tetto alla lunghezza massima dell\'ombra limita l\'area', () => {
  const lunga = areaOmbraHa(quadrato(100), 4, 180, 0.5);
  assert.ok(lunga < 100 * 600 / ZH / ZH / 1e4 * 1.01 + 0.1, `ha ${lunga}`);
});

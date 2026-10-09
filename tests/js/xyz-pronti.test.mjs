import test from 'node:test';
import assert from 'node:assert/strict';
import { XYZ_PRONTI } from '../../js/aggiungi/xyz-pronti.js';

test('xyz pronti: id unici, https e segnaposto {z}/{y}/{x}', () => {
  assert.equal(new Set(XYZ_PRONTI.map(o => o.id)).size, XYZ_PRONTI.length);
  for (const o of XYZ_PRONTI) {
    assert.match(o.url, /^https:\/\/(server|services)\.arcgisonline\.com\/.+\/tile\/\{z\}\/\{y\}\/\{x\}$/);
    assert.ok(o.max >= 15 && o.max <= 22, o.id);
  }
});

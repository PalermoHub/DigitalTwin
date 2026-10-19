import test from 'node:test';
import assert from 'node:assert/strict';
import { WMS_ISPRA } from '../../js/aggiungi/ispra.js';

test('ispra: id unici, https, layer e bbox validi', () => {
  assert.equal(new Set(WMS_ISPRA.map(o => o.id)).size, WMS_ISPRA.length);
  assert.equal(new Set(WMS_ISPRA.map(o => o.nome)).size, WMS_ISPRA.length);
  for (const o of WMS_ISPRA) {
    assert.match(o.url, /^https:\/\/(sinacloud|sgi2)\.isprambiente\.it\/.+\/WMSServer$/, o.id);
    assert.match(o.layers, /^\d+$/, o.id);
    const [w, s, e, n] = o.bbox;
    assert.ok(w < e && s < n && w > 5 && e < 20 && s > 35 && n < 48, o.id);
  }
});

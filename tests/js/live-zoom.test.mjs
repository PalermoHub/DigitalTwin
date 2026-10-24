import test from 'node:test';
import assert from 'node:assert/strict';
import { riquadroDa, caricaLiveZoom, impostaLiveZoom, liveZoomAttivo, CHIAVE_LIVE_ZOOM } from '../../js/core/live-zoom.js';

const deposito = (valore = null) => { const d = { valore, scritto: null }; return Object.assign(d, { getItem: () => d.valore, setItem: (k, v) => { d.scritto = [k, v]; } }); };

test('riquadroDa: punti, linee e poligoni; senza coordinate → null', () => {
  const f = [
    { geometry: { type: 'Point', coordinates: [13.3, 38.1] } },
    { geometry: { type: 'Polygon', coordinates: [[[13.4, 38.2], [13.5, 38.0], [13.4, 38.2]]] } },
    { geometry: null },
  ];
  assert.deepEqual(riquadroDa(f), [[13.3, 38.0], [13.5, 38.2]]);
  assert.equal(riquadroDa([]), null);
  assert.equal(riquadroDa([{ geometry: { type: 'Point', coordinates: [NaN, 1] } }]), null);
});

test('Live Zoom: spento all\'inizio, impostaLiveZoom salva e avvisa il document', () => {
  const eventi = [];
  globalThis.document = { dispatchEvent: e => eventi.push(e.type) };
  assert.equal(caricaLiveZoom(deposito()), false);
  const d = deposito();
  assert.equal(impostaLiveZoom(true, d), true);
  assert.deepEqual(d.scritto, [CHIAVE_LIVE_ZOOM, '1']);
  assert.equal(liveZoomAttivo(), true);
  assert.deepEqual(eventi, ['dt:live-zoom']);
  assert.equal(caricaLiveZoom(deposito('1')), true);
  assert.equal(caricaLiveZoom({ getItem() { throw new Error('bloccato'); } }), false);
});

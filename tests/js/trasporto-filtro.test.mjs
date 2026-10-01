import test from 'node:test';
import assert from 'node:assert/strict';
import { filtriPerLinea, opzioniLinee, stratiDaAccendere } from '../../js/layers/trasporto-filtro.js';

const l = (route_id, numero, tipo, direzione = 0, nome = `Nome ${numero}`) => ({ route_id, numero, tipo, direzione, nome });

test('opzioniLinee: una per linea (direzioni unite), bus prima dei tram, numeri in ordine numerico', () => {
  const o = opzioniLinee([l('TRAM1', 'TRAM1', 'tram'), l('101', '101', 'bus', 0), l('9', '9', 'bus'), l('101', '101', 'bus', 1), l('N1', 'N1', 'bus')]);
  assert.deepEqual(o.map(x => x.numero), ['9', '101', 'N1', 'TRAM1']);
  assert.deepEqual(Object.keys(o[1]).sort(), ['nome', 'numero', 'route_id', 'tipo']);
});

test('filtriPerLinea: senza linea ripristina i filtri di base; con la linea restringe tracciati e fermate', () => {
  const base = filtriPerLinea(null);
  assert.deepEqual(base['trasporto-bus'], ['==', ['get', 'tipo'], 'bus']);
  assert.deepEqual(base['trasporto-tram'], ['==', ['get', 'tipo'], 'tram']);
  for (const id of ['trasporto-fermate', 'trasporto-hit-linee', 'trasporto-hit-fermate']) assert.equal(base[id], null);

  const f = filtriPerLinea(l('101', '101', 'bus'));
  assert.deepEqual(f['trasporto-bus'], ['all', ['==', ['get', 'tipo'], 'bus'], ['==', ['get', 'route_id'], '101']]);
  assert.deepEqual(f['trasporto-hit-linee'], ['==', ['get', 'route_id'], '101']);
  assert.deepEqual(f['trasporto-fermate'], ['in', '101', ['get', 'linee']]);
  assert.deepEqual(f['trasporto-hit-fermate'], f['trasporto-fermate']);
});

test('stratiDaAccendere: il tipo della linea e le fermate', () => {
  assert.deepEqual(stratiDaAccendere(l('101', '101', 'bus')), ['trasporto-bus', 'trasporto-fermate']);
  assert.deepEqual(stratiDaAccendere(l('TRAM1', 'TRAM1', 'tram')), ['trasporto-tram', 'trasporto-fermate']);
});

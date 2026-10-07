import test from 'node:test';
import assert from 'node:assert/strict';
import { creaSospensione } from '../../js/geoimage/sospensione.js';

const mappaFinta = () => {
  const visti = [];
  return { visti, fire(evento) { visti.push(typeof evento === 'string' ? evento : evento.type); return this; } };
};

test('senza sospensione tutti gli eventi arrivano agli altri', () => {
  const m = mappaFinta();
  creaSospensione(m);
  m.fire('click'); m.fire({ type: 'move' });
  assert.deepEqual(m.visti, ['click', 'move']);
});

test('con la sospensione il clic va solo al gestore, il resto passa', () => {
  const m = mappaFinta();
  const s = creaSospensione(m);
  const dentro = [];
  s.attiva(e => dentro.push(e.type));
  m.fire({ type: 'click' }); m.fire({ type: 'move' });
  assert.deepEqual(dentro, ['click']);
  assert.deepEqual(m.visti, ['move']);
});

test('dopo disattiva i clic tornano a tutti', () => {
  const m = mappaFinta();
  const s = creaSospensione(m);
  s.attiva(() => {});
  s.disattiva();
  m.fire('click');
  assert.deepEqual(m.visti, ['click']);
});

test('fire restituisce la mappa, come l\'originale', () => {
  const m = mappaFinta();
  creaSospensione(m).attiva(() => {});
  assert.equal(m.fire({ type: 'click' }), m);
});

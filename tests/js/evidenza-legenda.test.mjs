import test from 'node:test';
import assert from 'node:assert/strict';
import { vociLegenda, scelteAccese, attributoDi } from '../../js/core/evidenza.js';

test('vociLegenda: una voce per etichetta, senza doppioni', () => {
  const voci = vociLegenda([
    { etichetta: 'Edificio', colore: '#e8590c', features: [{ geometry: { type: 'Polygon' } }] },
    { etichetta: 'Fermata vicina', colore: '#364fc7', features: [{ geometry: { type: 'Point' } }] },
    { etichetta: 'Fermata vicina', colore: '#364fc7', features: [{ geometry: { type: 'Point' } }] },
  ]);
  assert.deepEqual(voci, [{ etichetta: 'Edificio', colore: '#e8590c', punto: false }, { etichetta: 'Fermata vicina', colore: '#364fc7', punto: true }]);
});

test('vociLegenda: nessuna selezione, nessuna voce', () => assert.deepEqual(vociLegenda([]), []));

test('scelteAccese: restano solo le etichette accese', () => {
  const scelte = [{ etichetta: 'A' }, { etichetta: 'B' }];
  assert.deepEqual(scelteAccese(scelte, new Set(['B'])), [{ etichetta: 'B' }]);
});

test('attributoDi: zona PRG, fermata e valore esplicito', () => {
  assert.equal(attributoDi('prg-zto-hit', { ZTO: 'B2', DESCRIZION: 'Residenziale' }), 'B2 — Residenziale');
  assert.equal(attributoDi('trasporto-hit-fermate', { nome: 'Via Roma' }), 'Via Roma');
  assert.equal(attributoDi('trasporto-vicine', { attributo: 'Politeama' }), 'Politeama');
  assert.equal(attributoDi('edifici-hit', {}), undefined);
  assert.equal(attributoDi('monumenti-hit-poli', { nome: 'Teatro Massimo' }), 'Teatro Massimo');
});

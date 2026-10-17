import test from 'node:test';
import assert from 'node:assert/strict';
import { vociLegenda, collezione, scelteAccese, attributoDi } from '../../js/core/evidenza.js';

test('vociLegenda: una voce per etichetta, senza doppioni', () => {
  const voci = vociLegenda([
    { id: 'edifici-hit', etichetta: 'Edificio', colore: '#e8590c', features: [{ geometry: { type: 'Polygon' } }] },
    { id: 'trasporto-hit-fermate-vicini', etichetta: 'Fermata vicina', colore: '#364fc7', features: [{ geometry: { type: 'Point' } }] },
    { id: 'trasporto-hit-fermate-vicini', etichetta: 'Fermata vicina', colore: '#364fc7', features: [{ geometry: { type: 'Point' } }] },
  ]);
  assert.deepEqual(voci, [{ etichetta: 'Edificio', colore: '#e8590c', punto: false, icona: '' }, { etichetta: 'Fermata vicina', colore: '#364fc7', punto: true, icona: 'trasporto' }]);
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

test('collezione: i punti dei layer con icona la portano, gli altri restano cerchi', () => {
  const punto = { type: 'Point', coordinates: [13, 38] };
  const c = collezione([
    { id: 'distributori-hit', etichetta: 'Distributore', colore: '#f2b705', features: [{ geometry: punto, properties: {} }] },
    { id: 'civici-hit', etichetta: 'Civico', colore: '#d6336c', features: [{ geometry: punto, properties: {} }] },
    { id: 'edifici-hit', etichetta: 'Edificio', colore: '#e8590c', features: [{ geometry: { type: 'Polygon', coordinates: [] }, properties: {} }] },
  ]);
  assert.deepEqual(c.features.map(f => f.properties.icona), ['distributori', '', '']);
  assert.equal(collezione([{ id: 'distributori-vicini', etichetta: 'D', colore: '#f2b705', features: [{ geometry: punto, properties: {} }] }]).features[0].properties.icona, 'distributori');
});

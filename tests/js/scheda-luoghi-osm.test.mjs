import test from 'node:test';
import assert from 'node:assert/strict';
import { BISOGNI, bisogno, tipoIt, featureDaLuoghi, voceLuogoOsm, modelloPopupLuogoOsm, PESO } from '../../js/layers/scheda-luoghi-osm.js';
import { ICONE } from '../../js/core/icone.js';

test('cinque bisogni con icona nota, colore e forma distinti', () => {
  assert.deepEqual(BISOGNI.map(b => b.id), ['alimentari', 'cibo', 'salute', 'parchi', 'negozi']); // ordine del pannello Layer
  for (const b of BISOGNI) assert.ok(ICONE[b.icona], `manca l'icona ${b.icona}`);
  assert.equal(new Set(BISOGNI.map(b => b.icona)).size, BISOGNI.length);
  assert.equal(new Set(BISOGNI.map(b => b.colore)).size, BISOGNI.length);
  assert.equal(bisogno('3').id, 'salute');
  assert.equal(bisogno(4), null);
});

test('tipoIt: tradotto se noto, altrimenti il valore OSM', () => {
  assert.equal(tipoIt('pharmacy'), 'Farmacia');
  assert.equal(tipoIt('musical_instrument'), 'musical_instrument');
  assert.equal(tipoIt(undefined), '');
});

test('featureDaLuoghi: una feature per punto, con bisogno e id stabile', () => {
  const gj = featureDaLuoghi({ 3: [[13.36, 38.11, 'Farmacia Centrale', 'pharmacy']], 1: [[13.37, 38.12, '', 'bar'], [13.38, 38.13, 'Mazzara', 'cafe']] });
  assert.equal(gj.features.length, 3);
  const f = gj.features.find(x => x.properties.nome === 'Farmacia Centrale');
  assert.deepEqual(f.geometry.coordinates, [13.36, 38.11]);
  assert.deepEqual([f.properties.k, f.properties.tipo, f.properties.id], [3, 'pharmacy', 'osm-3-0']);
  assert.deepEqual([f.properties.lon, f.properties.lat], [13.36, 38.11]);
  assert.equal(new Set(gj.features.map(x => x.properties.id)).size, 3);
  assert.deepEqual(featureDaLuoghi(null).features, []);
});

test('voceLuogoOsm: con nome mostra il tipo, senza nome il tipo è il titolo', () => {
  const con = voceLuogoOsm({ id: 'osm-3-0', k: 3, nome: 'Farmacia Centrale', tipo: 'pharmacy' });
  assert.equal(con.titolo, 'Farmacia Centrale');
  assert.equal(con.peso, PESO);
  assert.ok(con.gruppi[0].righe.some(r => r.etichetta === 'Tipo' && r.valore === 'Farmacia'));
  assert.equal(con.sempre, true);
  const conCoord = voceLuogoOsm({ id: 'osm-3-0', k: 3, nome: 'Farmacia', tipo: 'pharmacy', lon: 13.36, lat: 38.11 });
  const percorso = conCoord.gruppi[0].righe.find(r => r.etichetta === 'Percorso a piedi');
  assert.equal(percorso.urlValore, 'https://www.google.com/maps/dir/?api=1&destination=38.11,13.36&travelmode=walking');
  const osm = conCoord.gruppi[0].righe.find(r => r.etichetta === 'Percorso a piedi (OpenStreetMap)');
  assert.equal(osm.urlValore, 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=%3B38.11%2C13.36');
  assert.equal(conCoord.link, undefined); // dentro la card, non nella barra in fondo
  assert.ok(!con.gruppi[0].righe.some(r => r.etichetta === 'Percorso a piedi'));
  const senza = voceLuogoOsm({ id: 'osm-1-4', k: 1, nome: '', tipo: 'bar' });
  assert.equal(senza.titolo, 'Bar');
  assert.ok(!senza.gruppi[0].righe.some(r => r.etichetta === 'Tipo'));
});

test('modelloPopupLuogoOsm: stesse righe della scheda', () => {
  const m = modelloPopupLuogoOsm({ id: 'osm-0-2', k: 0, nome: 'Conad', tipo: 'supermarket' });
  assert.equal(m.titolo, 'Conad');
  assert.equal(m.sottotitolo, 'Supermercato');
});

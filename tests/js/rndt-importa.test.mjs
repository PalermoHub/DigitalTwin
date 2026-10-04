// tests/js/rndt-importa.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ESTENSIONI, nomeLayer, importaFile } from '../../js/rndt/importa.js';

const file = (name, testo = '', buffer = new ArrayBuffer(0)) => ({ name, text: async () => testo, arrayBuffer: async () => buffer });
const fc = (...features) => ({ type: 'FeatureCollection', features });
const pt = (lon, lat, properties = {}) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lon, lat] } });
const libFinta = (extra = {}) => ({
  kml: async testo => fc(pt(13.3, 38.1, { da: `kml:${testo}` })),
  gpx: async testo => fc(pt(13.3, 38.1, { da: `gpx:${testo}` })),
  kmz: async () => '<kml>dentro</kml>',
  shp: async () => fc(pt(13.3, 38.1)),
  ...extra,
});

test('nomeLayer toglie solo l’ultima estensione', () => {
  assert.equal(nomeLayer('Parchi urbani.geojson'), 'Parchi urbani');
  assert.equal(nomeLayer('dati.2024.csv'), 'dati.2024');
  assert.equal(nomeLayer('senza'), 'senza');
});

test('GeoJSON: FeatureCollection, Feature singola e geometria nuda', async () => {
  const a = await importaFile(file('a.geojson', JSON.stringify(fc(pt(13.3, 38.1)))), libFinta());
  assert.equal(a.fc.features.length, 1);
  const b = await importaFile(file('b.json', JSON.stringify(pt(13.3, 38.1))), libFinta());
  assert.equal(b.fc.type, 'FeatureCollection');
  assert.equal(b.fc.features[0].geometry.type, 'Point');
  const c = await importaFile(file('c.geojson', JSON.stringify({ type: 'Point', coordinates: [13.3, 38.1] })), libFinta());
  assert.deepEqual(c.fc.features[0].properties, {});
  assert.equal(a.nome, 'a');
});

test('GeoJSON: BOM iniziale tollerato; JSON rotto o non GeoJSON = errore chiaro', async () => {
  const conBom = '﻿' + JSON.stringify(fc(pt(13.3, 38.1)));
  assert.equal((await importaFile(file('a.geojson', conBom), libFinta())).fc.features.length, 1);
  await assert.rejects(importaFile(file('a.geojson', '{rotto'), libFinta()), /non è un JSON valido/);
  await assert.rejects(importaFile(file('a.geojson', '{"ciao": 1}'), libFinta()), /non è un GeoJSON valido/);
});

test('GeoJSON: sistema di coordinate diverso da WGS84 rifiutato; CRS84 e 4326 accettati', async () => {
  const con = nome => JSON.stringify({ ...fc(pt(13.3, 38.1)), crs: { type: 'name', properties: { name: nome } } });
  await assert.rejects(importaFile(file('a.geojson', con('urn:ogc:def:crs:EPSG::3003')), libFinta()), /EPSG::3003.*non WGS84/);
  assert.ok(await importaFile(file('a.geojson', con('urn:ogc:def:crs:OGC:1.3:CRS84')), libFinta()));
  assert.ok(await importaFile(file('a.geojson', con('EPSG:4326')), libFinta()));
});

test('coordinate fuori dai gradi (per esempio metri senza .prj) = errore chiaro', async () => {
  const metri = JSON.stringify(fc(pt(2411234, 4216789)));
  await assert.rejects(importaFile(file('a.geojson', metri), libFinta()), /non sono in gradi/);
  await assert.rejects(importaFile(file('a.zip', '', new ArrayBuffer(8)), libFinta({ shp: async () => fc(pt(2411234, 4216789)) })), /manca il \.prj/);
});

test('file vuoto o senza elementi = errore', async () => {
  await assert.rejects(importaFile(file('a.geojson', JSON.stringify(fc())), libFinta()), /non contiene elementi/);
});

test('l’estensione decide il lettore, maiuscole comprese', async () => {
  const k = await importaFile(file('Parchi.KML', '<kml/>'), libFinta());
  assert.equal(k.fc.features[0].properties.da, 'kml:<kml/>');
  assert.equal(k.nome, 'Parchi');
  const g = await importaFile(file('traccia.GPX', '<gpx/>'), libFinta());
  assert.equal(g.fc.features[0].properties.da, 'gpx:<gpx/>');
});

test('KMZ: lo zip dà il testo del KML, che passa dal lettore KML', async () => {
  const r = await importaFile(file('a.kmz', '', new ArrayBuffer(4)), libFinta());
  assert.equal(r.fc.features[0].properties.da, 'kml:<kml>dentro</kml>');
});

test('KMZ senza KML: l’errore della libreria arriva a chi chiama', async () => {
  const lib = libFinta({ kmz: async () => { throw new Error('il KMZ non contiene un file KML'); } });
  await assert.rejects(importaFile(file('a.kmz'), lib), /non contiene un file KML/);
});

test('Shapefile zip: più shapefile nello zip si uniscono in un solo layer', async () => {
  const lib = libFinta({ shp: async () => [fc(pt(13.3, 38.1)), fc(pt(13.4, 38.2), pt(13.5, 38.2))] });
  const r = await importaFile(file('a.zip', '', new ArrayBuffer(4)), lib);
  assert.equal(r.fc.features.length, 3);
});

test('formato non supportato: l’elenco dei formati accettati è nel messaggio', async () => {
  await assert.rejects(importaFile(file('a.dwg'), libFinta()), /formato \.dwg non supportato.*\.geojson/);
  await assert.rejects(importaFile(file('senza'), libFinta()), /senza estensione/);
  assert.ok(ESTENSIONI.includes('.csv'));
});

test('CSV: colonne lat/lon per nome, altre colonne come proprietà', async () => {
  const r = await importaFile(file('p.csv', 'nome,lat,lon\nPiazza,38.12,13.36\nParco,38.15,13.35\n'), libFinta());
  assert.equal(r.fc.features.length, 2);
  assert.deepEqual(r.fc.features[0].geometry.coordinates, [13.36, 38.12]);
  assert.deepEqual(r.fc.features[0].properties, { nome: 'Piazza' });
  assert.deepEqual(r.avvisi, []);
});

test('CSV: BOM, separatore ;, virgola decimale e nomi italiani', async () => {
  const testo = '﻿nome;Latitudine;Longitudine\r\nPiazza;38,12;13,36\r\n';
  const r = await importaFile(file('p.csv', testo), libFinta());
  assert.deepEqual(r.fc.features[0].geometry.coordinates, [13.36, 38.12]);
});

test('CSV: campi tra virgolette con virgole, virgolette doppie e a capo', async () => {
  const testo = 'nome,lat,lon\n"Via ""Roma"", 1\nsecondo rigo",38.1,13.3\n';
  const r = await importaFile(file('p.csv', testo), libFinta());
  assert.equal(r.fc.features.length, 1);
  assert.equal(r.fc.features[0].properties.nome, 'Via "Roma", 1\nsecondo rigo');
});

test('CSV: righe senza coordinate valide saltate e contate nell’avviso; nessuna riga valida = errore', async () => {
  const r = await importaFile(file('p.csv', 'lat,lon\n38.1,13.3\n38.2,\nabc,13.3\n,\n'), libFinta());
  assert.equal(r.fc.features.length, 1);
  assert.match(r.avvisi[0], /2 righe senza coordinate valide/);
  await assert.rejects(importaFile(file('p.csv', 'lat,lon\n38.1,\n'), libFinta()), /nessuna riga con coordinate valide/);
});

test('CSV senza colonne di coordinate, o vuoto = errore', async () => {
  await assert.rejects(importaFile(file('p.csv', 'nome,valore\na,1\n'), libFinta()), /nessuna colonna di latitudine e longitudine/);
  await assert.rejects(importaFile(file('p.csv', ''), libFinta()), /vuoto/);
});

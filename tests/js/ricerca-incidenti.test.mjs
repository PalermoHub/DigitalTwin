import test from 'node:test';
import assert from 'node:assert/strict';
import { leggiQuery, cercaVie, preparaIncidenti, cercaIncidenti } from '../../js/core/ricerca-incidenti.js';

test('leggiQuery: senza parola chiave non è una ricerca di incidenti', () => {
  assert.equal(leggiQuery('via libertà'), null);
  assert.equal(leggiQuery('mortale roma'), null);
  assert.equal(leggiQuery('2018'), null);
});

test('leggiQuery: «incidente mortale roma 2018» → gravità, anno e parole del luogo', () => {
  assert.deepEqual(leggiQuery('Incidente mortale Roma 2018'), { gravita: 'M', anno: 2018, token: ['ROMA'] });
  assert.deepEqual(leggiQuery('incidenti libertà'), { gravita: null, anno: null, token: ['LIBERTA'] });
  assert.deepEqual(leggiQuery('sinistri feriti'), { gravita: 'F', anno: null, token: [] });
});

test('leggiQuery: sinonimi di gravità e anni fuori intervallo restano parole del luogo', () => {
  assert.equal(leggiQuery('incidente riservata').gravita, 'R');
  assert.equal(leggiQuery('incidente danni').gravita, 'C');
  assert.deepEqual(leggiQuery('incidenti via 1999').token, ['VIA', '1999']);
});

const vie = [
  { nome: 'Via della Libertà', incidenti: 243, mortali: 3, km: 3.8, lon: 13.35, lat: 38.12, bbox: [13.34, 38.12, 13.36, 38.14], rango: 4, gravita_km: 50.3 },
  { nome: 'Viale della Libertà', incidenti: 10, mortali: 0, km: 1, lon: 13.4, lat: 38.1, bbox: [13.4, 38.1, 13.41, 38.11] },
  { nome: 'Via Libera', incidenti: 0, mortali: 0, km: 1, lon: 13.4, lat: 38.1, bbox: [13.4, 38.1, 13.41, 38.11] },
  { nome: 'Via Roma', incidenti: 1, mortali: 1, km: 2, lon: 13.36, lat: 38.11, bbox: [13.35, 38.1, 13.37, 38.12] },
];

test('cercaVie: nome e sintesi con mortali e posto in classifica', () => {
  const [r] = cercaVie(vie, 'liberta');
  assert.equal(r.etichetta, 'Via della Libertà');
  assert.equal(r.nota, '243 incidenti, 3 mortali (#4 tra le più pericolose)');
  assert.deepEqual(r.bbox, [13.34, 38.12, 13.36, 38.14]);
});

test('cercaVie: prima chi inizia con il testo, poi più incidenti; senza incidenti esclusa; massimo due', () => {
  assert.deepEqual(cercaVie(vie, 'via').map(r => r.etichetta), ['Via della Libertà', 'Viale della Libertà']);
  assert.deepEqual(cercaVie(vie, 'libert').map(r => r.etichetta), ['Via della Libertà', 'Viale della Libertà']);
  assert.deepEqual(cercaVie(vie, 'via libera'), []); // 0 incidenti
});

test('cercaVie: singolare e nessun mortale', () => {
  assert.equal(cercaVie(vie, 'roma')[0].nota, '1 incidente, 1 mortale');
  assert.equal(cercaVie(vie, 'viale libert')[0].nota, '10 incidenti');
});

test('cercaVie: meno di 3 caratteri o testo vuoto non cercano', () => {
  assert.deepEqual(cercaVie(vie, 'vi'), []);
  assert.deepEqual(cercaVie(vie, '  '), []);
});

const feature = (luogo, tip, anno, lon = 13.3, lat = 38.1) =>
  ({ type: 'Feature', properties: { Luogo: luogo, Tipologia: tip, anno }, geometry: { type: 'Point', coordinates: [lon, lat] } });
const voci = preparaIncidenti([
  feature('VIA ROMA altezza civico 12', 'F', 2016), feature('VIA ROMA intersezione VIA LIBERTA', 'M', 2018),
  feature('VIA ROMA pressi -', 'M', 2021), feature('VIA LIBERTA', 'C', 2020), feature('VIA BONOMO', 'R', 2023),
]);

test('cercaIncidenti: gravità poi anno più recente; etichetta, nota e destinazione', () => {
  const r = cercaIncidenti(voci, leggiQuery('incidenti roma'));
  assert.deepEqual(r.map(x => x.etichetta), ['VIA ROMA pressi -', 'VIA ROMA intersezione VIA LIBERTA', 'VIA ROMA altezza civico 12']);
  assert.equal(r[0].nota, 'Incidente mortale 2021');
  assert.equal(r[2].nota, 'Incidente con feriti 2016');
  assert.equal(r[0].strato, 'sicurezza-incidenti');
  assert.equal(r[0].zoom, 18);
});

test('cercaIncidenti: filtri di anno e gravità, anche senza parole del luogo', () => {
  assert.deepEqual(cercaIncidenti(voci, leggiQuery('incidente mortale')).map(x => x.nota), ['Incidente mortale 2021', 'Incidente mortale 2018']);
  assert.deepEqual(cercaIncidenti(voci, leggiQuery('sinistri 2020')).map(x => x.etichetta), ['VIA LIBERTA']);
  assert.deepEqual(cercaIncidenti(voci, leggiQuery('incidente roma mortale 2018')).map(x => x.nota), ['Incidente mortale 2018']);
});

test('cercaIncidenti: il 2019 non esiste e «incidenti» da solo non elenca tutto', () => {
  assert.deepEqual(cercaIncidenti(voci, leggiQuery('incidenti 2019')), []);
  assert.deepEqual(cercaIncidenti(voci, leggiQuery('incidenti')), []);
});

test('cercaIncidenti: rispetta il massimo e scarta i punti senza coordinate', () => {
  const tanti = preparaIncidenti([...Array.from({ length: 10 }, (_, i) => feature(`VIA X ${i}`, 'F', 2016)),
    { type: 'Feature', properties: { Luogo: 'VIA X senza', Tipologia: 'F', anno: 2016 }, geometry: null }]);
  assert.equal(cercaIncidenti(tanti, leggiQuery('incidenti via x')).length, 6);
  assert.equal(tanti.length, 10);
});

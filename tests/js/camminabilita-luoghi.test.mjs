import test from 'node:test';
import assert from 'node:assert/strict';
import {
  M_PER_MINUTO, raggioMinuti, normalizzaNome, nomiCoincidono, luoghiVicini, confrontaBisogno, puntiDaGeojson, puntiDaBisogno, urlPercorso, urlPercorsoOsm, SORGENTI, nomeVero,
} from '../../js/layers/camminabilita-luoghi.js';

const centro = [13.36, 38.11];
// ~ metri a nord del centro (1 grado di latitudine = 111.320 m)
const aNord = (m, nome = 'x') => ({ lon: centro[0], lat: centro[1] + m / 111320, nome, tipo: 't' });

test('raggioMinuti: 80 m al minuto, come Walkably', () => {
  assert.equal(M_PER_MINUTO, 80);
  assert.equal(raggioMinuti(5), 400);
  assert.equal(raggioMinuti(10), 800);
});

test('normalizzaNome: minuscole, senza accenti né punteggiatura', () => {
  assert.equal(normalizzaNome('  Caffè  "Mazzara", S.R.L. '), 'caffe mazzara s r l');
  assert.equal(normalizzaNome(null), '');
  assert.equal(normalizzaNome("L'Allodola"), 'l allodola');
});

test('nomiCoincidono: uguali dopo la normalizzazione o uno contenuto nell’altro (almeno 5 lettere)', () => {
  assert.equal(nomiCoincidono('Biblioteca Comunale', 'biblioteca  comunale'), true);
  assert.equal(nomiCoincidono('Teatro Massimo', 'Teatro Massimo Vittorio Emanuele'), true);
  assert.equal(nomiCoincidono('Teatro Massimo', 'Teatro Politeama'), false);
  assert.equal(nomiCoincidono('Bar', 'Bar Stella'), false); // troppo corto per fidarsi
  assert.equal(nomiCoincidono('', 'Bar Stella'), false);
  assert.equal(nomiCoincidono(null, null), false);
});

test('luoghiVicini: entro il raggio, dal più vicino, con la distanza', () => {
  const punti = [aNord(700, 'lontano'), aNord(100, 'vicino'), aNord(390, 'medio'), aNord(900, 'fuori')];
  const v = luoghiVicini(punti, centro, 800);
  assert.deepEqual(v.map(p => p.nome), ['vicino', 'medio', 'lontano']);
  assert.ok(Math.abs(v[0].distanzaM - 100) < 2);
});

test('confrontaBisogno: nostri entro 5 e 10 minuti, residuo mai negativo', () => {
  const b = { entro5: 3, entro10: 7, oltre5: false, oltre10: false, nome: null };
  const punti = [aNord(100, 'a'), aNord(300, 'b'), aNord(600, 'c')];
  const r = confrontaBisogno(b, punti, centro);
  assert.deepEqual([r.nostri5, r.nostri10, r.residuo5, r.residuo10], [2, 3, 1, 4]);
  const molti = confrontaBisogno({ ...b, entro5: 1, entro10: 1 }, punti, centro);
  assert.deepEqual([molti.residuo5, molti.residuo10], [0, 0]);
});

test('confrontaBisogno: conteggio al tetto = residuo minimo, con «almeno»', () => {
  const b = { entro5: 15, entro10: 15, oltre5: true, oltre10: true, nome: null };
  const r = confrontaBisogno(b, [aNord(100)], centro);
  assert.equal(r.residuo5, 14);
  assert.equal(r.residuo10, 14);
  assert.equal(r.almeno5, true);
  assert.equal(r.almeno10, true);
  const pari = confrontaBisogno({ ...b, entro10: 1 }, [aNord(100)], centro);
  assert.equal(pari.residuo10, 0);
});

test('confrontaBisogno: il più vicino secondo Walkably è già nei nostri dati se il nome coincide', () => {
  const b = { entro5: 1, entro10: 1, oltre5: false, oltre10: false, nome: 'Teatro Massimo', tipo: 'theatre', minuti: 4 };
  const dentro = confrontaBisogno(b, [aNord(200, 'Teatro Massimo')], centro);
  assert.equal(dentro.piuVicino.nostro, true);
  const fuori = confrontaBisogno(b, [aNord(200, 'Politeama')], centro);
  assert.equal(fuori.piuVicino.nostro, false);
  assert.equal(fuori.piuVicino.nome, 'Teatro Massimo');
  const senza = confrontaBisogno({ ...b, nome: null }, [aNord(200)], centro);
  assert.equal(senza.piuVicino, null);
});

test('confrontaBisogno: un nome generato da Walkably («an unnamed park») non è un nome da confrontare', () => {
  const b = { entro5: 1, entro10: 1, oltre5: false, oltre10: false, nome: 'an unnamed park', tipo: 'park', minuti: 2.7 };
  assert.equal(confrontaBisogno(b, [aNord(100, 'Villa Filippina')], centro).piuVicino, null);
  assert.equal(nomeVero('an unnamed small garden'), false);
  assert.equal(nomeVero('Villa Filippina'), true);
});

test('confrontaBisogno: senza nostro layer per il bisogno non c’è residuo', () => {
  const b = { entro5: 4, entro10: 9, oltre5: false, oltre10: false, nome: null };
  const r = confrontaBisogno(b, null, centro);
  assert.equal(r.nostri5, null);
  assert.equal(r.residuo5, null);
  assert.equal(r.residuo10, null);
});

test('puntiDaGeojson: tiene i punti con nome e un filtro per categoria', () => {
  const gj = { features: [
    { geometry: { type: 'Point', coordinates: [13.3, 38.1] }, properties: { nome: 'Museo A', categoria: "Gallerie d'Arte e Musei" } },
    { geometry: { type: 'Point', coordinates: [13.31, 38.11] }, properties: { nome: 'Chiesa B', categoria: 'Chiese ed Oratori' } },
    { geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: { nome: 'Linea' } },
  ] };
  assert.equal(puntiDaGeojson(gj).length, 2);
  const solo = puntiDaGeojson(gj, p => p.categoria === "Gallerie d'Arte e Musei");
  assert.deepEqual(solo.map(p => [p.nome, p.lon, p.lat]), [['Museo A', 13.3, 38.1]]);
  assert.equal(puntiDaGeojson({ features: [{ geometry: { type: 'Point', coordinates: [1, 2] }, properties: { id: 'scuola-7', nome: 'X' } }] })[0].id, 'scuola-7');
});

test('SORGENTI: ogni bisogno collegato ha file e etichetta', () => {
  for (const [k, lista] of Object.entries(SORGENTI)) {
    assert.ok(Number(k) >= 0 && Number(k) <= 7);
    for (const s of lista) assert.ok(s.file && s.etichetta, `bisogno ${k}`);
  }
  assert.deepEqual(Object.keys(SORGENTI).map(Number).sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('puntiDaBisogno: legge il file compatto di OpenStreetMap', () => {
  const dati = { bisogni: { 3: [[13.3, 38.1, 'Farmacia A', 'pharmacy'], [13.31, 38.11, '', 'dentist']] } };
  assert.deepEqual(puntiDaBisogno(dati, 3)[0], { id: 'osm-3-0', lon: 13.3, lat: 38.1, nome: 'Farmacia A', tipo: 'pharmacy' });
  assert.equal(puntiDaBisogno(dati, 3).length, 2);
  assert.deepEqual(puntiDaBisogno(dati, 0), []);
  assert.deepEqual(puntiDaBisogno(null, 0), []);
});

test('urlPercorso: Google Maps a piedi, con latitudine prima della longitudine', () => {
  assert.equal(urlPercorso(13.3569, 38.1203), 'https://www.google.com/maps/dir/?api=1&destination=38.1203,13.3569&travelmode=walking');
});

test('SORGENTI: la chiave della card nella scheda è quella che i moduli usano', () => {
  assert.equal(SORGENTI[3][0].chiave('osm-3-4'), 'luogo-osm-osm-3-4');
  assert.equal(SORGENTI[4][0].chiave('scuola-1'), 'scuola-1');
  assert.equal(SORGENTI[6][0].chiave('16-4'), 'monumento-16-4');
  assert.equal(SORGENTI[7][0].chiave('12'), 'fermata-12');
});

test('urlPercorsoOsm: routing a piedi su OpenStreetMap, partenza vuota e arrivo lat,lon', () => {
  assert.equal(urlPercorsoOsm(13.3569, 38.1203), 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=%3B38.1203%2C13.3569');
});

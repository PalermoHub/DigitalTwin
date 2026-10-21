import test from 'node:test';
import assert from 'node:assert/strict';
import { corseAttive, preparaRotte, posizioneCorsa, mezziAl, volumi, scatola, nastro, fattoreZoom, geojsonMezzi } from '../../js/layers/trasporto-simulazione.js';

// linea dritta verso est, circa 1,1 km per 0,01° di longitudine a 0° di latitudine
const linee = [{ properties: { id: 'linea-ferrovia-1-0', route_id: 'ferrovia-1', direzione: 0, colore: '#c00', numero: 'A', tipo: 'ferrovia' }, geometry: { type: 'LineString', coordinates: [[0, 0], [0.01, 0], [0.02, 0]] } }];
const stazioni = new Map([['fA', [0, 0]], ['fB', [0.01, 0]], ['fC', [0.02, 0]]]);
const dati = {
  servizi: { 1000: ['2026-10-03'], 1001: ['2026-10-02'] },
  corse: [
    { r: 'ferrovia-1', d: 0, s: 1000, f: ['fA', 'fB', 'fC'], t: [600, 610, 630] },
    { r: 'ferrovia-1', d: 0, s: 1001, f: ['fA', 'fB', 'fC'], t: [1430, 1450, 1460] }, // ieri, oltre mezzanotte
  ],
};

test('corseAttive: solo le corse in viaggio, anche quelle di ieri oltre mezzanotte', () => {
  assert.equal(corseAttive(dati, '2026-10-03', 605).length, 1);
  assert.equal(corseAttive(dati, '2026-10-03', 640).length, 0);
  assert.equal(corseAttive(dati, '2026-10-03', 599).length, 0);
  const ieri = corseAttive(dati, '2026-10-03', 15); // 00:15 = 1455 del giorno prima
  assert.equal(ieri.length, 1);
  assert.equal(ieri[0].m, 1455);
});

test('posizioneCorsa: interpola sul tracciato tra due stazioni', () => {
  const rotte = preparaRotte(linee);
  const p = posizioneCorsa(dati.corse[0], 605, rotte, stazioni);
  assert.ok(Math.abs(p.lng - 0.005) < 1e-4 && Math.abs(p.lat) < 1e-6);
  assert.equal(Math.round(p.bearing), 90);
  assert.equal(p.verso, 'fB');
  const q = posizioneCorsa(dati.corse[0], 620, rotte, stazioni);
  assert.ok(Math.abs(q.lng - 0.015) < 1e-4);
});

test('posizioneCorsa: in stazione coincide con la stazione', () => {
  const p = posizioneCorsa(dati.corse[0], 610, preparaRotte(linee), stazioni);
  assert.ok(Math.abs(p.lng - 0.01) < 1e-5);
});

test('posizioneCorsa: senza tracciato interpola in linea retta', () => {
  const p = posizioneCorsa(dati.corse[0], 605, new Map(), stazioni);
  assert.ok(Math.abs(p.lng - 0.005) < 1e-6);
});

test('mezziAl: feature con colore, sigla e tipo della linea; filtro per tipo', () => {
  const mezzi = mezziAl(dati, linee, stazioni, '2026-10-03', 605);
  assert.equal(mezzi.length, 1);
  assert.equal(mezzi[0].properties.colore, '#c00');
  assert.equal(mezzi[0].properties.numero, 'A');
  assert.equal(mezzi[0].properties.tipo, 'ferrovia');
  assert.equal(geojsonMezzi(mezzi).type, 'FeatureCollection');
  assert.equal(mezziAl(dati, linee, stazioni, '2026-10-03', 605, undefined, new Set(['bus'])).length, 0);
});

test('mezziAl: la corsa con una fermata sconosciuta si salta', () => {
  assert.equal(mezziAl(dati, linee, new Map([['fA', [0, 0]]]), '2026-10-03', 605).length, 0);
});

test('scatola: rettangolo di lunghezza e larghezza date, orientato come la marcia', () => {
  const [anello] = scatola([0, 0], 90, 100, 10); // verso est: lungo in longitudine
  const lng = anello.map(p => p[0]), lat = anello.map(p => p[1]);
  assert.ok(Math.abs((Math.max(...lng) - Math.min(...lng)) * 111320 - 100) < 1);
  assert.ok(Math.abs((Math.max(...lat) - Math.min(...lat)) * 110540 - 10) < 1);
  assert.deepEqual(anello[0], anello[4]); // anello chiuso
});

test('volumi: altezza del tipo, ingrandita dal fattore (fino a 6×)', () => {
  const m = mezziAl(dati, linee, stazioni, '2026-10-03', 605);
  assert.equal(volumi(m)[0].properties.altezza, 4.5);
  assert.equal(volumi(m, 4)[0].properties.altezza, 18);
  assert.equal(volumi(m, 20)[0].properties.altezza, 27);
});

test('volumi: la lunghezza non supera quella massima del tipo, anche ingrandendo', () => {
  const m = mezziAl(dati, linee, stazioni, '2026-10-03', 605);
  const lunghezza = f => { const lng = f.geometry.coordinates[0].map(p => p[0]); return (Math.max(...lng) - Math.min(...lng)) * 111320; };
  assert.ok(lunghezza(volumi(m, 20, preparaRotte(linee))[0]) < 71);
  assert.ok(lunghezza(volumi(m, 20)[0]) < 71); // anche senza tracciato (rettangolo)
});

test('nastro: in curva la sagoma segue il tracciato e non esce dalla fascia', () => {
  // L: 500 m verso est, poi 500 m verso nord
  const k = 111320, h = 110540;
  const curva = preparaRotte([{ properties: { route_id: 'x', direzione: 0 }, geometry: { type: 'LineString', coordinates: [[0, 0], [500 / k, 0], [500 / k, 500 / h]] } }]).get('x|0');
  const [anello] = nastro(curva, 500, 120, 10); // centrato sulla curva
  for (const [x, y] of anello) {
    const sulBraccioEst = Math.abs(y * h) <= 5.1 && x * k <= 505.1; // sul braccio est y ≈ 0, sul braccio nord x ≈ 500
    const sulBraccioNord = Math.abs(x * k - 500) <= 5.1 && y * h >= -5.1;
    assert.ok(sulBraccioEst || sulBraccioNord, `punto fuori dalla fascia: ${x * k}, ${y * h}`);
  }
  assert.ok(anello.length > 6); // più di un rettangolo: ha almeno il vertice della curva
});

test('fattoreZoom: almeno 2 da vicino, cresce allontanandosi, con un tetto', () => {
  assert.equal(fattoreZoom(18), 2);
  assert.equal(fattoreZoom(15), 4);
  assert.equal(fattoreZoom(8), 20);
});

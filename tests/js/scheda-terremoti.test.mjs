import test from 'node:test';
import assert from 'node:assert/strict';
import { eventoDaIngv, fasciaEta, raggioMagnitudo, oraEvento, distanzaKm, modelloPopupTerremoto, voceTerremoto, riassuntoTerremoti, FASCE, passaFiltro, espressioneFiltro, altriTerremoti, accordionTerremoti, voceAltri, MAX_ELENCO } from '../../js/layers/scheda-terremoti.js';

const ingv = (extra = {}, coord = [14.1717, 38.7938, 8.8]) => ({
  type: 'Feature', geometry: { type: 'Point', coordinates: coord },
  properties: { eventId: 47606532, time: '2026-10-23T10:19:15.470000', magType: 'ML', mag: 5, place: 'Tirreno Meridionale [Mare]', author: 'SURVEY-INGV', ...extra },
});
const ADESSO = Date.parse('2026-10-23T10:49:15Z');

test('oraEvento: ora UTC senza Z e con microsecondi', () => {
  assert.equal(oraEvento('2026-10-23T10:19:15.470000'), Date.parse('2026-10-23T10:19:15.470Z'));
});

test('fasciaEta: ultima ora, 24 ore, 7 giorni', () => {
  assert.equal(fasciaEta(ADESSO - 30 * 60000, ADESSO).nome, 'Ultima ora');
  assert.equal(fasciaEta(ADESSO - 5 * 3600000, ADESSO).nome, 'Ultime 24 ore');
  assert.equal(fasciaEta(ADESSO - 3 * 86400000, ADESSO).nome, 'Oltre 24 ore');
  assert.equal(FASCE.at(-1).finoA, Infinity);
});

test('raggioMagnitudo cresce con la magnitudo e ha un minimo', () => {
  assert.ok(raggioMagnitudo(1) >= 3);
  assert.ok(raggioMagnitudo(5) > raggioMagnitudo(3));
});

test('eventoDaIngv: proprietà piatte, profondità dalla terza coordinata', () => {
  const f = eventoDaIngv(ingv(), ADESSO);
  assert.equal(f.properties.id, '47606532');
  assert.equal(f.properties.prof, 8.8);
  assert.equal(f.properties.fascia, 'Ultima ora');
  assert.deepEqual(f.geometry.coordinates, [14.1717, 38.7938]);
});

test('eventoDaIngv: dati incompleti scartati', () => {
  assert.equal(eventoDaIngv(ingv({ mag: null })), null);
  assert.equal(eventoDaIngv(ingv({ time: 'boh' })), null);
  assert.equal(eventoDaIngv({}), null);
});

test('distanzaKm: Palermo-Catania circa 167 km', () => {
  const d = distanzaKm([13.3614, 38.1157], [15.087, 37.5079]);
  assert.ok(d > 150 && d < 185, String(d));
});

test('popup e voce: righe principali e link all\'evento', () => {
  const f = eventoDaIngv(ingv(), ADESSO);
  const p = { ...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
  const m = modelloPopupTerremoto(p, ADESSO);
  const val = e => m.righe.find(r => r.etichetta === e)?.valore;
  assert.match(m.titolo, /^M /);
  assert.match(val('Profondità'), /8[.,]8 km/);
  assert.ok(val('Distanza da Palermo'));
  assert.equal(m.righe.find(r => r.etichetta === 'Zona'), undefined);
  const v = voceTerremoto(p, ADESSO);
  assert.equal(v.link.url, 'https://terremoti.ingv.it/event/47606532');
  assert.equal(v.strato, 'terremoti');
});

test('riassuntoTerremoti: numero e più forte', () => {
  assert.equal(riassuntoTerremoti([]), null);
  const r = riassuntoTerremoti([{ mag: 1.2 }, { mag: 4.1 }, { mag: 2 }]);
  assert.equal(r.n, 3);
  assert.equal(r.forte.mag, 4.1);
});

const ev = (id, mag, oreFa) => ({ id, mag, ts: ADESSO - oreFa * 3600000, luogo: 'Z', lon: 13, lat: 38 });

test('passaFiltro: magnitudo minima e periodo', () => {
  const f = { giorni: 1, magMin: 2 };
  assert.equal(passaFiltro(ev('a', 2.5, 3), f, ADESSO), true);
  assert.equal(passaFiltro(ev('b', 1.5, 3), f, ADESSO), false);
  assert.equal(passaFiltro(ev('c', 3, 30), f, ADESSO), false);
});

test('espressioneFiltro: stesse soglie per la mappa', () => {
  const e = espressioneFiltro({ giorni: 7, magMin: 3 }, ADESSO);
  assert.deepEqual(e[1], ['>=', ['get', 'mag'], 3]);
  assert.deepEqual(e[2], ['>=', ['get', 'ts'], ADESSO - 7 * 86400000]);
});

test('altriTerremoti: esclude i cliccati, ordina dal più recente, limita', () => {
  const eventi = [ev('a', 3, 5), ev('b', 3, 1), ev('c', 3, 2), ev('d', 0.5, 1)];
  const r = altriTerremoti(eventi, new Set(['b']), { giorni: 7, magMin: 1 }, ADESSO);
  assert.deepEqual(r.mostrati.map(p => p.id), ['c', 'a']);
  assert.equal(r.n, 2);
  const molti = Array.from({ length: MAX_ELENCO + 5 }, (_, i) => ev(String(i), 2, 1 + i / 1000));
  const l = altriTerremoti(molti, new Set(), { giorni: 7, magMin: 1 }, ADESSO);
  assert.equal(l.mostrati.length, MAX_ELENCO);
  assert.equal(l.n, MAX_ELENCO + 5);
});

test('accordionTerremoti: una card per evento con il link INGV', () => {
  const a = accordionTerremoti({ n: 1, mostrati: [{ ...ev('x', 3, 2), tipoMag: 'ML', prof: 10, autore: 'INGV' }] }, ADESSO);
  assert.equal(a.elementi.length, 1);
  assert.match(a.elementi[0].righe.at(-1).urlValore, /ingv\.it\/event\/x$/);
});

test('voceAltri: sezione con contenuto dinamico', () => {
  const v = voceAltri(() => null);
  assert.equal(v.sempre, true);
  assert.equal(typeof v.dinamico, 'function');
});

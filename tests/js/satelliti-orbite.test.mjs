// tests/js/satelliti-orbite.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaSatelliti, posizione, daPalermo, traccia, prossimoPassaggio, elementiVecchi, puntoCardinale } from '../../js/layers/satelliti-orbite.js';

const ISS = {
  OBJECT_NAME: 'ISS (ZARYA)', OBJECT_ID: '1998-067A', EPOCH: '2026-10-21T01:08:59.469792', MEAN_MOTION: 15.48967427, ECCENTRICITY: 0.00067597,
  INCLINATION: 51.6327, RA_OF_ASC_NODE: 37.2623, ARG_OF_PERICENTER: 289.5321, MEAN_ANOMALY: 70.4938, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U',
  NORAD_CAT_ID: 25544, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 59126, BSTAR: 0.00018187691, MEAN_MOTION_DOT: 9.575e-5, MEAN_MOTION_DDOT: 0, gruppo: 'stations',
};
const [iss] = creaSatelliti([ISS]);
const ORA = new Date('2026-10-23T00:00:00Z');

test('creaSatelliti: legge gli elementi e scarta quelli rotti', () => {
  assert.equal(iss.id, 25544);
  assert.equal(iss.nome, 'ISS (ZARYA)');
  assert.equal(iss.gruppo, 'stations');
  assert.equal(creaSatelliti([{ ...ISS, ECCENTRICITY: 5 }, ISS]).length, 1);
  assert.deepEqual(creaSatelliti(null), []);
});

test('posizione: l\'ISS sta a ~420 km e ~7,66 km/s, entro ±52° di latitudine', () => {
  const p = posizione(iss, ORA);
  assert.ok(p.quotaKm > 380 && p.quotaKm < 460, String(p.quotaKm));
  assert.ok(Math.abs(p.velocitaKmS - 7.66) < 0.1, String(p.velocitaKmS));
  assert.ok(Math.abs(p.lat) <= 52 && Math.abs(p.lng) <= 180);
});

test('daPalermo: elevazione tra -90 e 90, azimut tra 0 e 360', () => {
  const v = daPalermo(iss, ORA);
  assert.ok(v.elevazione >= -90 && v.elevazione <= 90);
  assert.ok(v.azimut >= 0 && v.azimut < 360);
  assert.ok(v.distanzaKm > 400);
});

test('traccia: ogni tratto resta continuo, senza salti dall\'antimeridiano', () => {
  const linee = traccia(iss, ORA, 90, 90);
  assert.ok(linee.length >= 1);
  for (const l of linee) for (let i = 1; i < l.length; i++) assert.ok(Math.abs(l[i][0] - l[i - 1][0]) < 180);
  const punti = linee.reduce((n, l) => n + l.length, 0);
  assert.ok(punti > 300);
});

test('prossimoPassaggio: in 3 giorni l\'ISS passa sopra Palermo, in ordine inizio ≤ culmine ≤ fine', () => {
  const p = prossimoPassaggio(iss, ORA, 72);
  assert.ok(p, 'nessun passaggio in 3 giorni');
  assert.ok(p.inizio <= p.culmine && p.culmine <= p.fine);
  assert.ok(p.elevazioneMax >= 10 && p.elevazioneMax <= 90);
  const v = daPalermo(iss, p.culmine);
  assert.ok(Math.abs(v.elevazione - p.elevazioneMax) < 1);
});

test('elementiVecchi: oltre 14 giorni dall\'epoca', () => {
  assert.equal(elementiVecchi(iss, new Date('2026-10-23T00:00:00Z')), false);
  assert.equal(elementiVecchi(iss, new Date('2026-11-20T00:00:00Z')), true);
});

test('puntoCardinale', () => {
  assert.deepEqual([0, 44, 90, 181, 270, 359].map(puntoCardinale), ['N', 'NE', 'E', 'S', 'O', 'N']);
});

import { proiezioneCielo, arcoCielo, RAGGIO_CIELO_KM, CENTRO_CIELO } from '../../js/layers/satelliti-orbite.js';

test('proiezioneCielo: zenit al centro, nord sopra, est a destra, orizzonte sul cerchio', () => {
  const [cx, cy] = CENTRO_CIELO;
  assert.deepEqual(proiezioneCielo(123, 90), [cx, cy]);
  const nord = proiezioneCielo(0, 0), est = proiezioneCielo(90, 0), sud = proiezioneCielo(180, 0);
  assert.ok(nord[1] > cy && Math.abs(nord[0] - cx) < 1e-9);
  assert.ok(est[0] > cx && Math.abs(est[1] - cy) < 1e-9);
  assert.ok(sud[1] < cy);
  assert.ok(Math.abs((nord[1] - cy) * 111.32 - RAGGIO_CIELO_KM) < 0.01);
  const meta = proiezioneCielo(0, 45);
  assert.ok(Math.abs((meta[1] - cy) * 111.32 - RAGGIO_CIELO_KM / 2) < 0.01);
});

test('arcoCielo: l\'arco del passaggio sta dentro il cerchio e senza passaggio è vuoto', () => {
  const p = prossimoPassaggio(iss, ORA, 72);
  const arco = arcoCielo(iss, p);
  assert.ok(arco.length > 4);
  for (const [x, y] of arco) {
    const dx = (x - CENTRO_CIELO[0]) * 111.32 * Math.cos(CENTRO_CIELO[1] * Math.PI / 180), dy = (y - CENTRO_CIELO[1]) * 111.32;
    assert.ok(Math.hypot(dx, dy) <= RAGGIO_CIELO_KM + 0.01);
  }
  assert.deepEqual(arcoCielo(iss, null), []);
});

import { dettaglioPassaggio } from '../../js/layers/satelliti-orbite.js';

test('dettaglioPassaggio: sorge, culmina e tramonta, nell\'ordine giusto e con azimut validi', () => {
  const p = prossimoPassaggio(iss, ORA, 72);
  const d = dettaglioPassaggio(iss, p);
  assert.equal(d.inCorso, false);
  for (const k of ['inizio', 'culmine', 'fine']) assert.ok(d[k].azimut >= 0 && d[k].azimut < 360, k);
  assert.ok(d.inizio.quando <= d.culmine.quando && d.culmine.quando <= d.fine.quando);
  assert.ok(Math.abs(d.culmine.elevazione - p.elevazioneMax) < 1);
  assert.ok(d.durataS > 60 && d.durataS < 900);
  assert.equal(dettaglioPassaggio(iss, null), null);
});

import { testoPassaggioIss } from '../../js/layers/scheda-satelliti.js';

test('testoPassaggioIss: titolo e righe, anche senza passaggio e con passaggio in corso', () => {
  const p = prossimoPassaggio(iss, ORA, 72);
  const d = dettaglioPassaggio(iss, p);
  const x = testoPassaggioIss(d, ORA);
  assert.ok(x.titolo.length > 0);
  assert.equal(x.righe.length, 4); // tra quanto, sorge, culmina, tramonta
  assert.ok(x.righe.every(r => r.length > 5 && !/\{|undefined|NaN/.test(r)), x.righe.join(' | '));
  assert.deepEqual(testoPassaggioIss(null).righe, []);
  const incorso = testoPassaggioIss({ ...d, inCorso: true, inizio: null }, ORA);
  assert.equal(incorso.righe.length, 3);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARI, cameraVista, ASSE_CASSARO, soleSchermo, daPortaFelice, coloriCielo, riflessoCassaro, LINEA_CASSARO } from '../../js/core/ombre-scenari.js';
import { posizioneSole, localeInData } from '../../js/core/ombre-sole.js';

const cam = { bearing: 63, pitch: 85, w: 800, h: 600 };

test('sole davanti alla camera, in asse: sta a metà larghezza e sopra il centro', () => {
  const p = soleSchermo(63, 3, cam);
  assert.ok(Math.abs(p.x - 400) < 1e-6);
  assert.ok(p.y < 300);
});
test('sole alle spalle: non si disegna', () => assert.equal(soleSchermo(243, 10, cam), null));
test('sole a destra dell\'asse finisce a destra', () => assert.ok(soleSchermo(70, 3, cam).x > 400));
test('orizzonte 5° sopra il centro, sole a 3° sotto di esso', () => {
  assert.ok(soleSchermo(63, 0, cam).y < 300);
  assert.ok(soleSchermo(63, 3, cam).y < soleSchermo(63, 0, cam).y);
});
test('alba del solstizio: alle 06:10 il sole è a meno di 1° dall\'asse del Cassaro', () => {
  for (const sc of SCENARI) {
    const { az, el } = posizioneSole(localeInData(`2026-${sc.giorno}`, sc.minuti));
    assert.ok(Math.abs(az - ASSE_CASSARO) < 1, `az ${az}`);
    assert.ok(el > 2 && el < 5, `el ${el}`);
  }
});
test('camere sull\'asse: la strada a 130 m, il colle a circa 8 km da Porta Felice', () => {
  const [strada, colle] = SCENARI;
  assert.equal(strada.quota, 13);
  assert.ok(colle.lat < strada.lat && colle.lng < strada.lng);
  const p = daPortaFelice(100, 0);
  assert.ok(Math.abs((p.lat - 38.1195699) * 111320 - 100) < 0.01);
});
test('cielo: sole alto più chiaro del sole all\'orizzonte', () => {
  assert.notEqual(coloriCielo(0).alto, coloriCielo(40).alto);
});

test('vista dal mare: 300 m di quota sul mare a nord-est (entro 1 km) di Porta Felice, lungo l\'asse del Cassaro, sole alle spalle', () => {
  const mare = SCENARI.find(x => x.id === 'mare');
  assert.equal(mare.bearing, 243); // guarda a sud-ovest, lungo l'asse del Cassaro
  assert.ok(mare.lat > 38.1195699 && mare.lng > 13.3713217);
  assert.ok(Math.hypot((mare.lat - 38.1195699) * 111320, (mare.lng - 13.3713217) * 87570) < 1000);
  const { az, el } = posizioneSole(localeInData(`2026-${mare.giorno}`, mare.minuti));
  assert.equal(soleSchermo(az, el, { bearing: mare.bearing, pitch: mare.pitch, w: 800, h: 600 }), null);
});

test('cameraVista: il centro sta davanti all\'osservatore, lo zoom cala con la quota', () => {
  const [strada, colle, mare] = SCENARI.map(sc => cameraVista(sc, 750));
  assert.ok(colle.zoom < mare.zoom && mare.zoom < strada.zoom);
  assert.ok(colle.zoom > 13 && colle.zoom < 15, `colle ${colle.zoom}`);
  assert.ok(strada.center[0] > SCENARI[0].lng && strada.center[1] > SCENARI[0].lat); // si guarda a nord-est
  assert.ok(mare.center[0] < SCENARI[2].lng && mare.center[1] < SCENARI[2].lat);     // si guarda a sud-ovest
  assert.equal(strada.pitch, 80);
});

test('padding dei pannelli: il sole in asse segue il centro dell\'area libera, non della mappa', () => {
  const p = soleSchermo(63, 3, { ...cam, padding: { left: 300, right: 0 } });
  assert.ok(Math.abs(p.x - 550) < 1e-6);
});

test('riflesso sul Cassaro: sole basso in asse sì, alto o di traverso no, di notte no', () => {
  assert.ok(riflessoCassaro(63, 4) > 0.9);
  assert.ok(riflessoCassaro(243, 4) > 0.9);
  assert.equal(riflessoCassaro(63, 50), 0);
  assert.equal(riflessoCassaro(120, 4), 0);
  assert.equal(riflessoCassaro(63, -3), 0);
  assert.ok(Math.abs(LINEA_CASSARO[0][0] - 13.3714) < 1e-3 && Math.abs(LINEA_CASSARO[0][1] - 38.1197) < 1e-3); // parte da Porta Felice
  assert.ok(LINEA_CASSARO.length > 20);
});
test('alba del solstizio: il sole è in asse e il riflesso è pieno', () => {
  const { az, el } = posizioneSole(localeInData('2026-06-21', 370));
  assert.ok(riflessoCassaro(az, el) > 0.8, `${az} ${el}`);
});

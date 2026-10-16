import test from 'node:test';
import assert from 'node:assert/strict';
import { FORME, idForma, vertici, stileForma, distanzaForma, immagineForma, registraForme, layerForme } from '../../js/core/forme.js';

test('ogni forma ha il centro dentro e un punto lontano fuori', () => {
  for (const nome of FORME) {
    assert.ok(distanzaForma(nome, 0, 0, 10) < 0, `${nome}: centro`);
    assert.ok(distanzaForma(nome, 40, 40, 10) > 0, `${nome}: fuori`);
  }
});

test('il cerchio ha distanza esatta; il quadrato (lato ≈ 12,7) lascia fuori il punto a 7 sull\'asse che il cerchio contiene', () => {
  assert.equal(distanzaForma('cerchio', 15, 0, 10), 5);
  assert.ok(distanzaForma('cerchio', 7, 0, 10) < 0);
  assert.ok(distanzaForma('quadrato', 7, 0, 10) > 0);
  assert.ok(distanzaForma('quadrato', 6, 6, 10) < 0);
  assert.equal(vertici('cerchio'), null);
  assert.equal(vertici('triangolo').length, 3);
  assert.equal(vertici('stella').length, 10);
});

test('immagineForma: SDF con alfa 191 sul bordo, pieno dentro, vuoto lontano', () => {
  const img = immagineForma('quadrato');
  assert.equal(img.width, img.height);
  assert.equal(img.data.length, img.width * img.height * 4);
  const alfa = (x, y) => img.data[(y * img.width + x) * 4 + 3];
  const c = img.width / 2;
  assert.ok(alfa(c, c) > 191, 'dentro');
  assert.equal(alfa(0, 0), 0, 'angolo');
  assert.equal(img.data[0], 255); // RGB bianco: il colore lo dà `icon-color`
});

test('registraForme aggiunge ogni forma una sola volta, come SDF', () => {
  const aggiunte = [];
  const map = { hasImage: id => aggiunte.some(a => a[0] === id), addImage: (...a) => aggiunte.push(a) };
  registraForme(map);
  registraForme(map);
  assert.equal(aggiunte.length, FORME.length);
  assert.ok(aggiunte.every(([, , opzioni]) => opzioni.sdf === true));
  assert.deepEqual(aggiunte.map(a => a[0]), FORME.map(idForma));
});

test('layerForme: symbol che non nasconde i punti vicini, con colore e alone da stile', () => {
  const l = layerForme({ id: 'x', source: 's', forma: 'triangolo', colore: '#123456', layout: { visibility: 'none' } });
  assert.equal(l.type, 'symbol');
  assert.equal(l.layout['icon-image'], 'forma-triangolo');
  assert.equal(l.layout['icon-allow-overlap'], true);
  assert.equal(l.layout.visibility, 'none');
  assert.equal(l.paint['icon-color'], '#123456');
  const espr = ['get', 'f'];
  assert.equal(layerForme({ id: 'y', source: 's', forma: espr, colore: '#000' }).layout['icon-image'], espr);
});

test('stileForma: cerchio = solo colore; altre forme = colore ritagliato con clip-path', () => {
  assert.deepEqual(stileForma('cerchio', '#123'), { background: '#123' });
  const s = stileForma('triangolo', '#123');
  assert.equal(s.background, '#123');
  assert.match(s.clipPath, /^polygon\((\d+\.\d% \d+\.\d%,){2}\d+\.\d% \d+\.\d%\)$/);
  assert.equal(s.borderRadius, '0');
});

test('le forme dei layer sono tutte note e ogni forma ha un nome distinto', () => {
  assert.equal(new Set(FORME).size, FORME.length);
  for (const nome of FORME.filter(n => n !== 'cerchio')) assert.ok(vertici(nome).length >= 3, nome);
});

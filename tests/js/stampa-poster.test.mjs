import test from 'node:test';
import assert from 'node:assert/strict';
import { paginaMm, zoomPerPagina, creaPdf, spezzaRighe, areaMappaPoster, proiettore, passoGriglia, etichettaGradi, valoriGriglia } from '../../js/core/stampa-poster.js';

test('pagina A0 verticale e orizzontale', () => {
  assert.deepEqual(paginaMm('A0', 'portrait'), { larghezza: 841, altezza: 1189 });
  assert.deepEqual(paginaMm('A0', 'landscape'), { larghezza: 1189, altezza: 841 });
});
test('zoomPerPagina: riquadro dimezzato = un livello in meno', () => {
  assert.equal(zoomPerPagina(8, { larghezza: 1000, altezza: 800 }, { larghezza: 500, altezza: 400 }), 7);
});
test('PDF: intestazione, oggetti e xref coerenti', async () => {
  const blob = creaPdf(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 10, 5, 297, 210);
  const testo = new TextDecoder('latin1').decode(await blob.arrayBuffer());
  assert.ok(testo.startsWith('%PDF-1.4'));
  const off = +testo.match(/startxref\n(\d+)/)[1];
  assert.equal(testo.slice(off, off + 4), 'xref');
  const o4 = +testo.split('\n').filter(l => / 00000 n $/.test(l))[3].slice(0, 10);
  assert.equal(testo.slice(o4, o4 + 7), '4 0 obj');
  assert.ok(testo.includes('/MediaBox [0 0 841.89 595.28]'));
});
test('spezzaRighe', () => {
  const ctx = { measureText: s => ({ width: s.length }) };
  assert.deepEqual(spezzaRighe(ctx, 'aaa bbb ccc', 7), ['aaa bbb', 'ccc']);
});

test('areaMappaPoster: sta dentro la pagina con cornice e banner', () => {
  const p = paginaMm('A4', 'landscape');
  const m = areaMappaPoster('A4', 'landscape');
  assert.ok(m.x > 0 && m.y > m.banner && m.x + m.larghezza <= p.larghezza && m.y + m.altezza <= p.altezza);
  assert.ok(Math.abs(m.x - (p.larghezza - m.x - m.larghezza)) < 1e-9);
});
test('proiettore: il centro cade a metà mappa e lng/lat sono l’inverso di verso', () => {
  const area = { larghezza: 200, altezza: 100 };
  const pr = proiettore({ lng: 12.5, lat: 41.9 }, 6, area);
  const c = pr.verso(12.5, 41.9);
  assert.ok(Math.abs(c.x - 100) < 1e-9 && Math.abs(c.y - 50) < 1e-9);
  const q = pr.verso(14, 40);
  assert.ok(Math.abs(pr.lng(q.x) - 14) < 1e-9 && Math.abs(pr.lat(q.y) - 40) < 1e-9);
  assert.ok(q.x > 100 && q.y > 50); // est a destra, sud in basso
});
test('passoGriglia: al più circa 6 linee', () => {
  assert.equal(passoGriglia(12), 2);
  assert.equal(passoGriglia(0.4), 0.1);
});
test('etichettaGradi', () => {
  assert.equal(etichettaGradi(12, 'lng', 1), '12° E');
  assert.equal(etichettaGradi(12.5, 'lng', 0.5), '12°30′ E');
  assert.equal(etichettaGradi(-3, 'lat', 1), '3° S');
  assert.equal(etichettaGradi(38.12, 'lat', 0.01), '38.12° N');
});
test('valoriGriglia: multipli del passo dentro l’intervallo', () => {
  assert.deepEqual(valoriGriglia(11.2, 14.1, 1), [12, 13, 14]);
  assert.deepEqual(valoriGriglia(37.05, 37.4, 0.1), [37.1, 37.2, 37.3, 37.4]);
});

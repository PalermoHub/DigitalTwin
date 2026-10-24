import test from 'node:test';
import assert from 'node:assert/strict';
import { calcolaPadding } from '../../js/core/padding-mappa.js';

const rett = (left, right, top = 0, bottom = 1000) => ({ left, right, top, bottom, width: right - left, height: bottom - top });
const doc = mappa => ({ querySelector: sel => mappa[sel] ? { getBoundingClientRect: () => mappa[sel], classList: { contains: () => false } } : null });
const tela = { getBoundingClientRect: () => rett(0, 1920) };

test('desktop: il margine è lo spazio tolto dai pannelli a sinistra e a destra', () => {
  const d = doc({ '#barra-strati': rett(0, 44), '#pannello': rett(44, 364), '#rail-pannelli': rett(1876, 1920), '#scheda': rett(1436, 1876) });
  assert.deepEqual(calcolaPadding(d, tela, false), { top: 0, right: 484, bottom: 0, left: 364 });
});

test('desktop: pannelli chiusi (senza dimensioni) tolgono solo le barre', () => {
  const d = doc({ '#barra-strati': rett(0, 44), '#pannello': rett(0, 0), '#rail-pannelli': rett(1876, 1920), '#scheda': rett(0, 0) });
  assert.deepEqual(calcolaPadding(d, tela, false), { top: 0, right: 44, bottom: 0, left: 44 });
});

test('mobile: la scheda è un foglio basso e toglie spazio in basso', () => {
  const d = doc({ '#scheda': rett(0, 400, 600, 1000) });
  const t = { getBoundingClientRect: () => ({ ...rett(0, 400), bottom: 1000 }) };
  assert.deepEqual(calcolaPadding(d, t, true), { top: 0, right: 0, bottom: 400, left: 0 });
});

test('zoomPerCerchio: il cerchio di 300 m entra nell\'area visibile e un raggio doppio toglie un livello di zoom', async () => {
  const { zoomPerCerchio } = await import('../../js/core/padding-mappa.js');
  const pad = { top: 0, right: 44, bottom: 0, left: 364 };
  const extra = { top: 70, right: 20, bottom: 90, left: 20 };
  const z = zoomPerCerchio({ larghezza: 1920, altezza: 1100 }, pad, extra, 300, 38.1);
  const mPerPx = 78271.517 * Math.cos(38.1 * Math.PI / 180) / 2 ** z;
  assert.ok(Math.abs(mPerPx * 940 - 600) < 1); // lato minimo disponibile: 1100-160 = 940 px
  assert.ok(Math.abs(zoomPerCerchio({ larghezza: 1920, altezza: 1100 }, pad, extra, 600, 38.1) - (z - 1)) < 1e-9);
});

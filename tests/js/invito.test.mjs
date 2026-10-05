import test from 'node:test';
import assert from 'node:assert/strict';
import { collegaInvito, CHIAVE_INVITO, DURATA_INVITO } from '../../js/core/invito.js';

function scenario(dati = {}) {
  const figli = [];
  const doc = { createElement: () => ({ setAttribute() {}, remove() { figli.splice(figli.indexOf(this), 1); } }), body: { append: e => figli.push(e) } };
  const ascolti = {};
  const map = { on: (t, f) => { ascolti[t] = f; }, off: t => { delete ascolti[t]; } };
  const archivio = { getItem: k => dati[k] ?? null, setItem: (k, v) => { dati[k] = v; } };
  const timer = { f: null, annullato: false };
  const opz = { adesso: (f, ms) => { timer.f = f; timer.ms = ms; return 1; }, annulla: () => { timer.annullato = true; } };
  return { figli, map, ascolti, archivio, dati, timer, doc, opz };
}

test('si mostra al primo avvio e sparisce al primo clic, ricordandolo', () => {
  const s = scenario();
  collegaInvito(s.map, s.doc, s.archivio, s.opz);
  assert.equal(s.figli.length, 1);
  assert.equal(s.figli[0].className, 'invito-clic');
  s.ascolti.click();
  assert.equal(s.figli.length, 0);
  assert.equal(s.dati[CHIAVE_INVITO], '1');
  assert.equal(s.ascolti.click, undefined);
  assert.equal(s.timer.annullato, true);
});

test('sparisce da solo dopo qualche secondo', () => {
  const s = scenario();
  collegaInvito(s.map, s.doc, s.archivio, s.opz);
  assert.equal(s.timer.ms, DURATA_INVITO);
  s.timer.f();
  assert.equal(s.figli.length, 0);
});

test('non si mostra a chi l\'ha già visto o se l\'indirizzo apre una scheda', () => {
  const visto = scenario({ [CHIAVE_INVITO]: '1' });
  assert.equal(collegaInvito(visto.map, visto.doc, visto.archivio, visto.opz), null);
  assert.equal(visto.figli.length, 0);
  const link = scenario();
  assert.equal(collegaInvito(link.map, link.doc, link.archivio, { ...link.opz, url: 'http://x/?scheda=38.1,13.3#14/38/13' }), null);
  assert.equal(link.figli.length, 0);
});

test('senza storage funziona comunque', () => {
  const s = scenario();
  collegaInvito(s.map, s.doc, null, s.opz);
  assert.equal(s.figli.length, 1);
  s.ascolti.click();
  assert.equal(s.figli.length, 0);
});

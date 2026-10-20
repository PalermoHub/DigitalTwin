import test from 'node:test';
import assert from 'node:assert/strict';
import { reteLenta, risorseMappa, precaricaMappa, precaricaMappaARiposo } from '../../js/core/precarica-mappa.js';

const finestraFinta = (connessione, stato = 'complete') => {
  const link = [];
  const ascoltatori = {};
  return {
    link, ascoltatori,
    navigator: { connection: connessione },
    document: { readyState: stato, createElement: () => ({}), head: { append: l => link.push(l) } },
    addEventListener: (nome, f) => { ascoltatori[nome] = f; },
    setTimeout: f => f(),
  };
};

test('reteLenta: risparmio dati o 2g sì, 4g e assenza di dati no', () => {
  assert.equal(reteLenta({ saveData: true }), true);
  assert.equal(reteLenta({ effectiveType: '2g' }), true);
  assert.equal(reteLenta({ effectiveType: 'slow-2g' }), true);
  assert.equal(reteLenta({ effectiveType: '4g' }), false);
  assert.equal(reteLenta(undefined), false);
});

test('risorseMappa: moduli, fogli di stile, script e dizionario della lingua, senza dati pesanti', () => {
  const r = risorseMappa('en');
  assert.deepEqual(r.filter(x => x.rel === 'modulepreload').map(x => x.href), ['js/avvio.js', 'js/app.js']);
  assert.ok(r.some(x => x.href === 'js/locales/en.json' && x.as === 'fetch'));
  assert.ok(r.some(x => x.href === 'css/app.css' && x.as === 'style'));
  assert.ok(!r.some(x => /geojson|pmtiles$|\.pmtiles/.test(x.href)));
});

test('precaricaMappa: aggiunge i link in <head>, ma non con la rete lenta', () => {
  const f = finestraFinta({ effectiveType: '4g' });
  assert.equal(precaricaMappa(f, 'it'), f.link.length);
  assert.ok(f.link.length > 5);
  const lenta = finestraFinta({ saveData: true });
  assert.equal(precaricaMappa(lenta, 'it'), 0);
  assert.equal(lenta.link.length, 0);
});

test('precaricaMappaARiposo: aspetta load se la pagina non è completa', () => {
  const f = finestraFinta(undefined, 'loading');
  precaricaMappaARiposo(f, 'it');
  assert.equal(f.link.length, 0);
  f.ascoltatori.load();
  assert.ok(f.link.length > 5);
});

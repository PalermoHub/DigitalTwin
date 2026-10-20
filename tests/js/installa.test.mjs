import test from 'node:test';
import assert from 'node:assert/strict';
import { collegaInstallazione, CHIAVE_INSTALLA } from '../../js/core/installa.js';

function scenario({ dati = {}, telefono = true, app = false, ua = 'Android', search = '' } = {}) {
  const figli = [];
  const crea = () => ({ figli: [], ascolti: {}, addEventListener(t, f) { this.ascolti[t] = f; }, setAttribute() {}, append(...f) { this.figli.push(...f); }, remove() { const i = figli.indexOf(this); if (i >= 0) figli.splice(i, 1); } });
  const doc = { createElement: crea, body: { append: e => figli.push(e) } };
  const ascolti = {};
  const win = {
    matchMedia: q => ({ matches: q.includes('display-mode') ? app : telefono }),
    navigator: { userAgent: ua }, location: { search }, addEventListener: (t, f) => { ascolti[t] = f; },
  };
  const archivio = { getItem: k => dati[k] ?? null, setItem: (k, v) => { dati[k] = v; } };
  const timer = {};
  const opz = { ritardo: 5, adesso: (f, ms) => { timer.f = f; timer.ms = ms; } };
  return { figli, doc, win, archivio, dati, ascolti, timer, opz };
}
const bottoni = s => s.figli[0].figli.at(-1).figli;

test('da telefono compare dopo il ritardo con «Non ora» e istruzioni se manca il prompt nativo', () => {
  const s = scenario();
  assert.ok(collegaInstallazione(s.doc, s.win, s.archivio, s.opz));
  assert.equal(s.figli.length, 0);
  s.timer.f();
  assert.equal(s.figli[0].className, 'invito-installa');
  assert.equal(bottoni(s).length, 1);
  assert.match(s.figli[0].figli[1].textContent, /Installa app/);
});

test('su iPhone spiega Condividi → Aggiungi alla schermata Home', () => {
  const s = scenario({ ua: 'iPhone' });
  collegaInstallazione(s.doc, s.win, s.archivio, s.opz);
  s.timer.f();
  assert.match(s.figli[0].figli[1].textContent, /Condividi/);
});

test('con il prompt nativo mostra «Installa» e lo lancia', async () => {
  const s = scenario();
  collegaInstallazione(s.doc, s.win, s.archivio, s.opz);
  let lanciato = false;
  s.ascolti.beforeinstallprompt({ preventDefault() {}, prompt() { lanciato = true; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  s.timer.f();
  assert.equal(bottoni(s).length, 2);
  bottoni(s)[0].ascolti.click();
  assert.equal(lanciato, true);
  assert.equal(s.figli.length, 0);
  await new Promise(r => setImmediate(r));
  assert.equal(s.dati[CHIAVE_INSTALLA], '1'); // installata: non si ripropone
});

test('«Non ora» lo spegne per sempre', () => {
  const s = scenario();
  collegaInstallazione(s.doc, s.win, s.archivio, s.opz);
  s.timer.f();
  bottoni(s).at(-1).ascolti.click();
  assert.equal(s.figli.length, 0);
  assert.equal(s.dati[CHIAVE_INSTALLA], '1');
  assert.equal(collegaInstallazione(...(({ doc, win, archivio, opz }) => [doc, win, archivio, opz])(scenario({ dati: s.dati }))), null);
});

test('non compare su desktop né se il sito è già installato', () => {
  assert.equal(collegaInstallazione(...(({ doc, win, archivio, opz }) => [doc, win, archivio, opz])(scenario({ telefono: false }))), null);
  assert.equal(collegaInstallazione(...(({ doc, win, archivio, opz }) => [doc, win, archivio, opz])(scenario({ app: true }))), null);
});

test('con ?installa=1 compare anche se spento, installato o su desktop', () => {
  const s = scenario({ telefono: false, app: true, dati: { [CHIAVE_INSTALLA]: '1' }, search: '?installa=1' });
  assert.ok(collegaInstallazione(s.doc, s.win, s.archivio, s.opz));
  s.timer.f();
  assert.equal(s.figli.length, 1);
});

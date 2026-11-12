import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_TELEFONO, modoAttivo, moduliAlClic, STRATO_EMERGENZA, zoomMinimoEmergenza } from '../../js/core/modo-emergenza.js';

test('modoAttivo: serve telefono, strato acceso e non uscito a mano', () => {
  assert.equal(modoAttivo({ telefono: true, stratoAcceso: true, uscito: false }), true);
  assert.equal(modoAttivo({ telefono: false, stratoAcceso: true, uscito: false }), false);
  assert.equal(modoAttivo({ telefono: true, stratoAcceso: false, uscito: false }), false);
  assert.equal(modoAttivo({ telefono: true, stratoAcceso: true, uscito: true }), false);
});

test('moduliAlClic: in emergenza resta solo il Piano di emergenza, altrimenti tutti', () => {
  const moduli = [{ id: 'monumenti' }, { id: STRATO_EMERGENZA }, { id: 'scuole' }];
  assert.deepEqual(moduliAlClic(moduli, true), [{ id: STRATO_EMERGENZA }]);
  assert.equal(moduliAlClic(moduli, false), moduli);
});

test('mini-mappa aree: zoom in base alla superficie e filtro sull\'id delle aree cliccate', async () => {
  const { zoomPerSuperficie, filtroEvidenza } = await import('../../js/layers/scheda-protezione-civile.js');
  assert.ok(zoomPerSuperficie(500) > zoomPerSuperficie(50000));
  assert.ok(zoomPerSuperficie(1e9) >= 13.5 && zoomPerSuperficie(1) <= 16);
  assert.equal(zoomPerSuperficie(NaN), 14.8);
  assert.deepEqual(filtroEvidenza([12]), ['in', ['get', 'id'], ['literal', [12]]]);
});

test('zoomMinimoEmergenza: con un rischio PAI acceso non scende sotto zoom 12 (partenza dei tile)', () => {
  assert.equal(zoomMinimoEmergenza(false), 11);
  assert.equal(zoomMinimoEmergenza(true), 12);
});

test('MEDIA_TELEFONO: telefono in piedi o ruotato (touch e basso), non il desktop', () => {
  assert.match(MEDIA_TELEFONO, /max-width: 720px/);
  assert.match(MEDIA_TELEFONO, /\(pointer: coarse\) and \(max-height: 500px\)/);
});

test('riepilogoPs: somma i pazienti in attesa dei soli presidi con lettura fresca e conta gli affollati', async () => {
  const { riepilogoPs, schedaSinteticaPs, ordinaPs } = await import('../../js/layers/scheda-pronto-soccorso.js');
  const ps = [
    { id: 'a', nome: 'Civico', stato: 'ok', inAttesa: 37, sovraffollamentoPct: 219, codici: { verde: { attesa: 20 } } },
    { id: 'b', nome: 'Villa Sofia', stato: 'ok', inAttesa: 7, sovraffollamentoPct: 90, codici: {} },
    { id: 'c', nome: 'Senza dato', stato: 'assente', codici: {} },
    { id: 'd', nome: 'Vecchio', stato: 'vecchio', inAttesa: 50, sovraffollamentoPct: 300, codici: {} },
  ];
  const r = riepilogoPs(ps);
  assert.equal(r.inAttesa, 44); // 37 + 7: il dato vecchio e quello assente non entrano
  assert.equal(r.conDato, 2);
  assert.equal(r.presidi, 4);
  assert.equal(r.affollati, 1);
  assert.deepEqual(ordinaPs(ps).map(p => p.id), ['d', 'a', 'b', 'c']);
  const s = schedaSinteticaPs(ps[0]);
  assert.equal(s.inAttesa, '37');
  assert.match(s.indice, /^219/);
  assert.equal(s.codici.length, 5);
  assert.equal(s.codici.find(c => c.chiave === 'verde').attesa, '20');
  assert.equal(s.codici.find(c => c.chiave === 'rosso').attesa, '–'); // non pubblicato: «–», mai 0
  assert.equal(schedaSinteticaPs(ps[2]).indice, '');
});

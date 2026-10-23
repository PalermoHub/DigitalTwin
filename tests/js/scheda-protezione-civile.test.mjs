import test from 'node:test';
import assert from 'node:assert/strict';
import './setup-i18n.mjs';
import { CLASSI, classe, titolo, modelloPopup, vocePc, vociPc } from '../../js/layers/scheda-protezione-civile.js';

const attesa = { id: 1, numero: '253.2', tipo: 'AT', classe: 'attesa', descrizione: 'Area attesa popolazione', sup_m2: 5200, circoscrizione: 'I', quartiere: 'Tribunali-Castellammare', upl: 'Tribunali o Kalsa' };
const vvf = { id: 2, tipo: 'AM VV.F.', classe: 'ammassamento', descrizione: 'Area ammassamento soccorsi - Colonna mobile Vigili del Fuoco', sup_m2: 800, circoscrizione: 'II', quartiere: 'Q', upl: 'U', nota: 'Solo VV.F.' };
const righeDi = v => Object.fromEntries(v.gruppi.flatMap(g => g.righe).map(r => [r.etichetta, r.valore]));

test('simbologia dell\'Allegato B: tratteggio verde (attesa), rosso (accoglienza), giallo (ammassamento), un simbolo per classe', () => {
  assert.equal(classe('attesa').colore, '#6cb6a6');
  assert.equal(classe('accoglienza').colore, '#ffb09d');
  assert.equal(classe('ammassamento').colore, '#ffe044');
  assert.equal(new Set(CLASSI.map(c => c.colore)).size, CLASSI.length);
  assert.ok(CLASSI.filter(c => c.icona).every(c => /^img\/protezione-civile\/\w+\.png$/.test(c.icona)));
});

test('popup: titolo dalla classe, numero e zona', () => {
  const m = modelloPopup(attesa);
  assert.equal(m.titolo, 'Area di attesa della popolazione');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Circoscrizione', 'Quartiere', 'UPL', 'Superficie']);
  assert.equal(titolo({ classe: 'x', descrizione: 'Altro' }), 'Altro');
});

test('scheda: circoscrizione, quartiere e UPL; le righe assenti non compaiono', () => {
  const r = righeDi(vocePc(attesa));
  assert.equal(r['Circoscrizione'], 'I');
  assert.equal(r['Quartiere'], 'Tribunali-Castellammare');
  assert.equal(r['UPL'], 'Tribunali o Kalsa');
  assert.ok(!('Note' in r) && !('Tipologia' in r));
  assert.equal(vocePc(attesa).peso, 7); // tab Luogo
  assert.equal(righeDi(vocePc(vvf))['Note'], 'Solo VV.F.');
  assert.match(righeDi(vocePc(vvf))['Tipologia'], /Vigili del Fuoco/);
});

test('più aree sovrapposte: una sola voce a fisarmonica', () => {
  assert.equal(vociPc([attesa]).length, 1);
  assert.ok(!vociPc([attesa])[0].accordion);
  const v = vociPc([attesa, vvf]);
  assert.equal(v.length, 1);
  assert.equal(v[0].accordion.elementi.length, 2);
});

test('percorso: link universale alle indicazioni stradali verso l\'area, solo se ci sono le coordinate', () => {
  const con = { ...attesa, lat: 38.1157, lon: 13.3615 };
  const riga = vocePc(con).gruppi.flatMap(g => g.righe).find(r => r.etichetta === 'Percorso');
  assert.equal(riga.urlValore, 'https://www.google.com/maps/dir/?api=1&destination=38.1157,13.3615&travelmode=driving');
  assert.ok(!vocePc(attesa).gruppi.flatMap(g => g.righe).some(r => r.etichetta === 'Percorso'));
});

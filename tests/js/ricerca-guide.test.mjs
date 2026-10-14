import test from 'node:test';
import assert from 'node:assert/strict';
import { vociGuide, cercaGuide, collegaRicercaGuide } from '../../js/core/ricerca-guide.js';

const passi = [
  { id: 'ordine-layer', titolo: 'Mettere un layer sopra o sotto un altro', paragrafi: ['Si riordina con le frecce o trascinando la maniglia.'] },
  { id: 'colori', titolo: 'Cambiare i colori di uno strato', paragrafi: ['La rampa Crameri è leggibile anche con il daltonismo.'] },
  { id: 'tema', titolo: 'Tema dell\'interfaccia', paragrafi: ['Il tooltip segue il tema.'] },
];
const rndt = [{ id: 'rndt-catalogo', titolo: 'Cercare nel catalogo RNDT', paragrafi: ['Il catalogo nazionale.'] }];
const sezioni = [{ id: 'cos-e', titolo: 'Cos’è Geoimage', paragrafi: ['Sovrappone una mappa storica.'], passi: [{ titolo: 'Inquadra la zona', testo: 'Porta la mappa sull’area.', elenco: ['maniglie agli angoli'] }] }];
const voci = vociGuide(passi, rndt, sezioni);
const titoli = r => r.map(v => v.titolo);

test('vociGuide: scheda e id della sezione di ogni guida', () => {
  assert.deepEqual(voci.map(v => [v.scheda, v.sezione]), [
    ['guida', 'guida-ordine-layer'], ['guida', 'guida-colori'], ['guida', 'guida-tema'],
    ['plugin', 'guida-rndt-catalogo'], ['geoimage', 'guida-geoimage-cos-e']]);
  assert.ok(voci[4].testi.includes('maniglie agli angoli'));
});

test('cercaGuide: parola del titolo, senza accenti e a prefisso', () => {
  assert.deepEqual(titoli(cercaGuide(voci, 'colori')), ['Cambiare i colori di uno strato']);
  assert.deepEqual(titoli(cercaGuide(voci, 'COLOR')), ['Cambiare i colori di uno strato']);
  assert.deepEqual(titoli(cercaGuide(voci, 'catalogo')), ['Cercare nel catalogo RNDT']);
});

test('cercaGuide: una parola chiave dei paragrafi trova la sezione, dopo i titoli', () => {
  assert.deepEqual(titoli(cercaGuide(voci, 'daltonismo')), ['Cambiare i colori di uno strato']);
  assert.deepEqual(titoli(cercaGuide(voci, 'tooltip')), ['Tema dell\'interfaccia']);
  assert.deepEqual(titoli(cercaGuide(voci, 'maniglie')), ['Cos’è Geoimage']);
  assert.deepEqual(titoli(cercaGuide(voci, 'maniglia')), ['Mettere un layer sopra o sotto un altro']);
  // «catalogo» sta nel titolo RNDT e nel testo: il titolo vince
  assert.equal(cercaGuide(voci, 'layer')[0].titolo, 'Mettere un layer sopra o sotto un altro');
});

test('cercaGuide: tutte le parole devono comparire; parole vuote e corte non cercano', () => {
  assert.deepEqual(cercaGuide(voci, 'colori daltonismo').length, 1);
  assert.deepEqual(cercaGuide(voci, 'colori catalogo'), []);
  assert.deepEqual(cercaGuide(voci, 'via'), []);
  assert.deepEqual(cercaGuide(voci, 'co'), []);
  assert.deepEqual(cercaGuide(voci, '  '), []);
  assert.deepEqual(cercaGuide(voci, 'via colori').length, 1);
});

test('cercaGuide: in inglese cerca nei testi tradotti', () => {
  const lt = s => ({ 'Cambiare i colori di uno strato': 'Changing a layer\'s colours' }[s] ?? s);
  assert.deepEqual(titoli(cercaGuide(voci, 'colours', lt)), ['Cambiare i colori di uno strato']);
  assert.deepEqual(titoli(cercaGuide(voci, 'colori', lt)), ['Cambiare i colori di uno strato']); // anche in italiano
  assert.deepEqual(cercaGuide(voci, 'colours'), []);
});

test('collegaRicercaGuide: righe in coda, dopo quelle della ricerca già collegata, con la sezione da aprire', async () => {
  const aperte = [];
  const altra = { suggerisci: async () => ({ inCima: ['a'], inCoda: ['b'] }) };
  const r = await collegaRicercaGuide((s, id) => aperte.push([s, id]), altra, voci).suggerisci('colori');
  assert.deepEqual(r.inCima, ['a']);
  assert.equal(r.inCoda[0], 'b');
  assert.equal(r.inCoda[1].etichetta, 'Cambiare i colori di uno strato');
  assert.equal(r.inCoda[1].nota, 'Guida');
  r.inCoda[1].vai();
  assert.deepEqual(aperte, [['guida', 'guida-colori']]);
});

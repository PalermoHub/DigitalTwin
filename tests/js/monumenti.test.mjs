import test from 'node:test';
import assert from 'node:assert/strict';
import { voceMonumento, modelloPopup, idScomparsi } from '../../js/layers/scheda-monumenti.js';
import { unisci } from '../../js/core/scheda-modello.js';

const P = {
  id: '17-123', nome: "Torre di San Nicolo' all'Albergheria", categoria: 'Monumenti',
  descrizione: 'La Torre campanaria.', foto: 'foto/17-123.jpg', url: 'https://turismo.comune.palermo.it/x?id=123',
};
const risolvi = rel => `http://h/dati/monumenti/${rel}`;

test('voce della scheda: titolo, categoria, foto, testo e link al sito del Comune', () => {
  const v = voceMonumento(P, risolvi);
  assert.equal(v.chiave, 'monumento-17-123');
  assert.equal(v.titolo, P.nome);
  assert.equal(v.badge, 'Monumenti');
  assert.deepEqual(v.immagine, { url: 'http://h/dati/monumenti/foto/17-123.jpg', alt: P.nome });
  assert.equal(v.testo, P.descrizione);
  assert.equal(v.link.url, P.url);
  assert.match(v.link.testo, /Comune/);
});

test('senza foto né descrizione la voce resta valida (c\'è il link)', () => {
  const v = voceMonumento({ ...P, foto: null, descrizione: '' }, risolvi);
  assert.equal(v.immagine, undefined);
  assert.equal(v.testo, undefined);
  assert.equal(unisci([v]).sezioni.length, 1);
});

test('unisci conserva immagine e testo', () => {
  const { sezioni } = unisci([voceMonumento(P, risolvi)]);
  assert.equal(sezioni[0].immagine.alt, P.nome);
  assert.equal(sezioni[0].testo, P.descrizione);
});

test('due monumenti sullo stesso edificio restano due sezioni', () => {
  const { sezioni } = unisci([voceMonumento(P, risolvi), voceMonumento({ ...P, id: '16-5', nome: 'Chiesa' }, risolvi)]);
  assert.equal(sezioni.length, 2);
});

test('popup: stessi campi della scheda', () => {
  const m = modelloPopup(P, risolvi);
  assert.equal(m.titolo, P.nome);
  assert.equal(m.foto, 'http://h/dati/monumenti/foto/17-123.jpg');
  assert.equal(m.descrizione, P.descrizione);
  assert.equal(m.url, P.url);
});

const K = {
  id: 'k-12', nome: 'Palazzo Butera', categoria: 'Palazzi', descrizione: 'Un palazzo.', fonte: "Mappa monumentale di Palermo e dell'Agro Palermitano",
  foto: 'https://mymaps.usercontent.google.com/hostedimage/m/*/ABC?authuser=0&fife=s400', url: null,
};

test('luogo dal KML: foto assoluta usata così com\'è, nessun pulsante, fonte propria', () => {
  const v = voceMonumento(K, risolvi);
  assert.equal(v.immagine.url, K.foto);
  assert.equal(v.link, undefined);
  assert.match(v.fonte, /Mappa monumentale/);
  assert.equal(unisci([v]).sezioni.length, 1); // testo e foto bastano a tenere la sezione
});

test('luogo del Comune: la fonte resta il portale', () => {
  assert.match(voceMonumento({ ...P, fonte: 'Portale del Turismo — Comune di Palermo' }, risolvi).fonte, /Portale del Turismo/);
});

test('popup del KML: senza url, con fonte', () => {
  const m = modelloPopup(K, risolvi);
  assert.equal(m.url, null);
  assert.equal(m.foto, K.foto);
  assert.match(m.fonte, /Mappa monumentale/);
});

test('luogo senza foto, testo né link: la sezione non compare', () => {
  assert.equal(unisci([voceMonumento({ ...K, foto: null, descrizione: null }, risolvi)]).sezioni.length, 0);
});

test('bene scomparso: avviso in scheda e nel popup; la frase da sola non si ripete nel testo', () => {
  const v = voceMonumento({ ...P, descrizione: 'non più esistente' }, risolvi);
  assert.match(v.avviso.etichetta, /Non più presente/);
  assert.equal(v.testo, undefined);
  assert.equal(unisci([v]).sezioni[0].avviso.etichetta, v.avviso.etichetta);
  assert.equal(modelloPopup({ ...P, descrizione: 'Non più esistente' }, risolvi).scomparso, true);
});

test('bene scomparso con motivo: il testo resta', () => {
  const v = voceMonumento({ ...P, descrizione: 'Distrutto dai bombardamenti del 1943' }, risolvi);
  assert.ok(v.avviso);
  assert.equal(v.testo, 'Distrutto dai bombardamenti del 1943');
});

test('nessun avviso: fontanelle di fonderie non esistenti e storie di edifici ancora in piedi', () => {
  for (const d of ['Fonderia Di Maggio 1887 non esistente', 'Fonderia Oretea 1887 non più esistente', 'Scalone scomparso intorno al 1830', 'La Torre campanaria.', '']) {
    assert.equal(voceMonumento({ ...P, descrizione: d }, risolvi).avviso, undefined, d);
    assert.equal(modelloPopup({ ...P, descrizione: d }, risolvi).scomparso, false, d);
  }
});

test('popup di un bene scomparso: la frase da sola non si ripete sotto l\'avviso', () => {
  assert.equal(modelloPopup({ ...P, descrizione: 'non più esistente' }, risolvi).descrizione, null);
  assert.equal(modelloPopup({ ...P, descrizione: 'Demolita nel 1965' }, risolvi).descrizione, 'Demolita nel 1965');
});

test('scheda di un bene scomparso senza foto, link né testo: la sezione resta, con l\'avviso', () => {
  const v = voceMonumento({ ...P, foto: null, url: null, descrizione: 'non più esistente' }, risolvi);
  const { sezioni } = unisci([v]);
  assert.equal(sezioni.length, 1);
  assert.ok(sezioni[0].avviso);
});

test('idScomparsi: solo i beni non più presenti, non le fontanelle delle fonderie', () => {
  const lista = [{ ...P, id: 'a', descrizione: 'non più esistente' }, { ...P, id: 'b', descrizione: 'Fonderia Di Maggio 1887 non esistente' }, { ...P, id: 'c', descrizione: 'Demolita nel 1965' }];
  assert.deepEqual(idScomparsi(lista), ['a', 'c']);
});

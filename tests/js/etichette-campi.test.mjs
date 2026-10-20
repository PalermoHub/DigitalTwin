import test from 'node:test';
import assert from 'node:assert/strict';
import { nomeCampo, unitaCampo, famigliaUso, nomeUso, nomeValore, coloreValore, vociCategorie } from '../../js/core/etichette-campi.js';
import { legendaAttributo, etichetteClassi } from '../../js/core/tema-attributo.js';

test('nomeCampo: i campi dell\'edificato hanno un nome, gli altri restano com\'erano', () => {
  assert.equal(nomeCampo('altezza'), 'Altezza (m)');
  assert.equal(nomeCampo('occupancy'), 'Uso dell’edificio');
  assert.equal(nomeCampo('nome_via'), 'nome_via');
  assert.equal(unitaCampo('altezza'), ' m');
  assert.equal(unitaCampo('pop_stim'), '');
});

test('nomeUso: famiglia e sottocodice, con il codice in parentesi; i descritti dalla fonte hanno il nome proprio', () => {
  assert.equal(famigliaUso('COM4'), 'COM');
  assert.equal(famigliaUso('XYZ'), null);
  assert.equal(nomeUso('RES2'), 'Residenziale plurifamiliare (RES2)');
  assert.equal(nomeUso('RES1'), 'Residenziale monofamiliare (RES1)');
  assert.equal(nomeUso('COM4'), 'Commerciale e pubblico (COM4)');
  assert.equal(nomeUso('UNK'), 'Sconosciuto (UNK)');
  assert.equal(nomeUso('XYZ'), 'XYZ');
  assert.equal(nomeValore('altro', 'COM4'), 'COM4');
});

test('colori di partenza: uno per famiglia d\'uso, nessuno per gli altri campi', () => {
  assert.equal(coloreValore('occupancy', 'RES1'), '#3498db');
  assert.equal(coloreValore('occupancy', 'RES2'), '#2980b9');
  assert.equal(coloreValore('occupancy', 'COM4'), '#e74c3c');
  assert.equal(coloreValore('occupancy', 'GOV1'), '#34495e');
  assert.equal(coloreValore('occupancy', 'XYZ'), null);
  assert.equal(coloreValore('altro', 'RES'), null);
});

test('vociCategorie: per l\'uso una riga per famiglia, per gli altri campi una per valore', () => {
  const colori = { RES: '#3498db', RES1: '#3498db', RES2: '#2980b9', COM1: '#e74c3c', COM4: '#e74c3c', UNK: '#bdc3c7' };
  assert.deepEqual(vociCategorie('occupancy', colori).map(v => v.testo), ['Commerciale e pubblico', 'Residenziale', 'Residenziale plurifamiliare', 'Sconosciuto']);
  assert.deepEqual(vociCategorie('k', { a: '#111111', b: '#222222' }).map(v => v.testo), ['a', 'b']);
  const vecchi = { COM1: '#111111', COM4: '#222222', RES: '#333333', RES1: '#333333' }; // colori diversi, stesso nome: una riga
  assert.deepEqual(vociCategorie('occupancy', vecchi), [{ colore: '#111111', testo: 'Commerciale e pubblico' }, { colore: '#333333', testo: 'Residenziale' }]);
});

test('legenda dell\'altezza: titolo leggibile e unità nelle classi', () => {
  assert.deepEqual(etichetteClassi([6, 12], ' m'), ['< 6 m', '6 – 12 m', '≥ 12 m']);
  const l = legendaAttributo({ campo: 'altezza', tipo: 'graduata', rampa: 'Blu', soglie: [6, 12] });
  assert.equal(l.titolo, 'Altezza (m)');
  assert.deepEqual(l.voci.map(v => v.testo), ['< 6 m', '6 – 12 m', '≥ 12 m']);
});

test('in inglese: titolo, famiglie d\'uso e legenda', async () => {
  const { readFileSync } = await import('node:fs');
  const { impostaDizionari } = await import('../../js/core/i18n.js');
  const leggi = f => JSON.parse(readFileSync(new URL(`../../js/locales/${f}.json`, import.meta.url), 'utf8'));
  impostaDizionari('en', leggi('en'), leggi('it'));
  try {
    assert.equal(nomeCampo('occupancy'), 'Building use');
    assert.equal(nomeUso('RES2'), 'Multi-family residential (RES2)');
    assert.equal(nomeUso('COM4'), 'Commercial and public (COM4)');
    assert.equal(legendaAttributo({ campo: 'altezza', tipo: 'graduata', rampa: 'Blu', soglie: [6] }).titolo, 'Height (m)');
  } finally { impostaDizionari('it', leggi('it'), leggi('it')); }
});

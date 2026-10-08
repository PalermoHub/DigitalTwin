// tests/js/tabella-sorgenti.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SORGENTI, sorgentePer, LIMITE_RIGHE, MAX_DOM } from '../../js/core/tabella/sorgenti.js';

const radice = new URL('../../', import.meta.url);
const it = JSON.parse(readFileSync(new URL('js/locales/it.json', radice), 'utf8'));
const en = JSON.parse(readFileSync(new URL('js/locales/en.json', radice), 'utf8'));

test('ogni sorgente ha strati, strati visibili, nome, fonte e colore', () => {
  assert.ok(SORGENTI.length >= 6);
  for (const s of SORGENTI) {
    assert.ok(s.id && s.strati.length && s.visibili.length, s.id);
    assert.ok(s.nome && !s.nome.startsWith('tabella.'), `nome non tradotto: ${s.id}`);
    assert.ok(s.fonte && !s.fonte.startsWith('tabella.'), `fonte non tradotta: ${s.id}`);
    assert.match(s.colore, /^#[0-9a-f]{6}$/i);
    assert.equal(typeof s.esporta, 'boolean');
    assert.equal(typeof s.approssimata, 'boolean');
  }
  assert.equal(new Set(SORGENTI.map(s => s.id)).size, SORGENTI.length, 'id univoci');
});

test('chiave: colonnine e fermate per id, catasto per foglio e particella (anche con il refuso Paricella), assenti → null', () => {
  assert.equal(sorgentePer('colonnine').chiave({ id: 'IT*X' }), 'IT*X');
  assert.equal(sorgentePer('fermate').chiave({ id: '12' }), '12');
  assert.equal(sorgentePer('catasto').chiave({ Foglio: 7, Paricella: 12 }), '7/12');
  assert.equal(sorgentePer('catasto').chiave({}), null);
  assert.equal(sorgentePer('incidenti').chiave, undefined);
});

test('i layer da PMTiles segnalano la geometria approssimata, i GeoJSON no', () => {
  assert.equal(sorgentePer('catasto').approssimata, true);
  assert.equal(sorgentePer('incidenti').approssimata, true);
  assert.equal(sorgentePer('scuole').approssimata, false);
});

test('export spento per i layer sulla rete stradale OSM (licenza ODbL da chiarire), acceso per gli altri', () => {
  const osm = id => id === 'incidenti' || id.startsWith('sicurezza-');
  for (const s of SORGENTI) assert.equal(s.esporta, !osm(s.id), s.id);
});

test('limiti', () => {
  assert.ok(LIMITE_RIGHE >= MAX_DOM && MAX_DOM >= 500);
});

test('tutte le chiavi tabella.* hanno italiano e inglese', () => {
  const chiavi = Object.keys(it).filter(k => k.startsWith('tabella.') || k === 'html.btn.tabella' || k === 'tab.tabella');
  assert.ok(chiavi.length > 30, 'dizionari non aggiornati');
  for (const k of chiavi) assert.ok(k in en, `manca in en.json: ${k}`);
});

test('confini: cinque sorgenti con chiave stabile e colonne di partenza', () => {
  for (const id of ['circoscrizioni', 'quartieri', 'upl', 'amap-distretti', 'sezioni']) assert.ok(sorgentePer(id)?.colonne?.length, id);
  assert.equal(sorgentePer('circoscrizioni').chiave({ Circoscrizione: 'I' }), 'I');
  assert.equal(sorgentePer('quartieri').chiave({ Circoscrizione: 'I', Quartiere: 'Tribunali' }), 'I/Tribunali');
  assert.equal(sorgentePer('quartieri').chiave({}), null);
  assert.equal(sorgentePer('upl').chiave({ Quartiere: 'Q', UPL: 'U' }), 'Q/U');
  assert.equal(sorgentePer('amap-distretti').chiave({ DISTRETTO: 'ZEN' }), 'ZEN');
  assert.equal(sorgentePer('sezioni').chiave({ SEZ21_ID: 820530000004 }), 820530000004);
  assert.equal(sorgentePer('amap-distretti').approssimata, false);
});

test('layer tematici: chiavi e filtri delle sorgenti aggiunte dopo il primo rilascio', () => {
  assert.equal(sorgentePer('incendi').chiave({ anno: 2023, id: 7 }), '2023/7');
  assert.equal(sorgentePer('civici').chiave({ PROGRESSIVO_SNC: 5 }), 5);
  assert.equal(sorgentePer('isole-calore').chiave({ sez: 99 }), 99);
  assert.equal(sorgentePer('trasporto-bus').filtro({ tipo: 'bus' }), true);
  assert.equal(sorgentePer('trasporto-bus').filtro({ tipo: 'tram' }), false);
  assert.equal(sorgentePer('trasporto-tram').filtro({ tipo: 'tram' }), true);
  for (const id of ['monumenti', 'alberi', 'fontanelle', 'omi', 'prg', 'prg-ppe', 'vincoli-areali', 'vincoli-lineari', 'popolazione']) assert.ok(sorgentePer(id), id);
});

test('registraSorgenti aggiunge una sola volta', async () => {
  const { registraSorgenti, SORGENTI: tutte } = await import('../../js/core/tabella/sorgenti.js');
  const n = tutte.length;
  const nuova = { id: 'prova-x', nome: 'x', strati: ['a'], visibili: ['b'], fonte: 'f', colore: '#000000', esporta: true, approssimata: false };
  registraSorgenti([nuova, nuova]);
  assert.equal(tutte.length, n + 1);
  tutte.pop();
});

test('layer esterni: entrano, si rinominano e escono senza toccare quelli del progetto', async () => {
  const { sincronizzaEsterne, SORGENTI: tutte } = await import('../../js/core/tabella/sorgenti.js');
  const base = tutte.length;
  let r = sincronizzaEsterne([{ id: 'miei-ab', nome: 'Ciclabili', strati: ['miei-ab-fill', 'miei-ab-line', 'miei-ab-pt'] }]);
  assert.equal(r.entrate.length, 1);
  assert.equal(tutte.length, base + 1);
  assert.deepEqual(tutte.at(-1).visibili, ['miei-ab-fill', 'miei-ab-line', 'miei-ab-pt']);
  assert.equal(tutte.at(-1).esterna, true);
  r = sincronizzaEsterne([{ id: 'miei-ab', nome: 'Piste', strati: ['miei-ab-line'] }]);
  assert.equal(r.entrate.length, 0);
  assert.equal(tutte.at(-1).nome, 'Piste');
  r = sincronizzaEsterne([]);
  assert.deepEqual(r.uscite, ['miei-ab']);
  assert.equal(tutte.length, base);
});

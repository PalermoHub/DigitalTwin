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

test('limiti', () => {
  assert.ok(LIMITE_RIGHE >= MAX_DOM && MAX_DOM >= 500);
});

test('tutte le chiavi tabella.* hanno italiano e inglese', () => {
  const chiavi = Object.keys(it).filter(k => k.startsWith('tabella.') || k === 'html.btn.tabella' || k === 'tab.tabella');
  assert.ok(chiavi.length > 30, 'dizionari non aggiornati');
  for (const k of chiavi) assert.ok(k in en, `manca in en.json: ${k}`);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTORI } from '../../js/layers/scheda-opere.js';
import { chiaveLuogo, opereDa, ammessa, raggruppa, firma, conteggiTitolari, modelloTooltipLuogo, elencoLuogo, etichettaOpzione } from '../../js/layers/opere-luoghi.js';

const SOC = 'INFRASTRUTTURE SOCIALI';
const TRA = 'INFRASTRUTTURE DI TRASPORTO';
const O = (cup, settore, titolare, coordinates, extra = {}) => ({ cup, settore, titolare, stato: 'ATTIVO', precisione: 'civico', titolo: `OPERA ${cup}`, indirizzo: 'Via Roma 1', coordinates, ...extra });
const A = [13.36, 38.11];
const B = [13.37, 38.12];
const TUTTE = [O('1', SOC, 'COMUNE DI PALERMO', A), O('2', SOC, 'COMUNE DI PALERMO', A), O('3', TRA, 'ANAS', A), O('4', TRA, 'ANAS', B, { stato: 'CHIUSO' })];

test('chiaveLuogo: stessa posizione, stessa chiave (5 decimali)', () => {
  assert.equal(chiaveLuogo([13.360001, 38.11]), chiaveLuogo([13.36, 38.110004]));
  assert.notEqual(chiaveLuogo(A), chiaveLuogo(B));
});

test('opereDa: tiene i punti e le proprietà utili', () => {
  const f = [{ geometry: { type: 'Point', coordinates: A }, properties: { cup: 'X', settore: SOC, titolare: 'T', stato: 'CHIUSO', fase: 'In esecuzione', precisione: 'via', titolo: 'T', indirizzo: 'V' } },
    { geometry: { type: 'Polygon', coordinates: [] }, properties: { cup: 'Y' } }];
  const p = opereDa(f);
  assert.equal(p.length, 1);
  assert.deepEqual([p[0].cup, p[0].settore, p[0].titolare, p[0].stato, p[0].fase, p[0].precisione], ['X', SOC, 'T', 'CHIUSO', 'In esecuzione', 'via']);
});

test('ammessa: settori, opere chiuse e titolare', () => {
  const p = O('1', SOC, 'ANAS', A);
  assert.equal(ammessa(p), true);
  assert.equal(ammessa(p, { settori: new Set([TRA]) }), false);
  assert.equal(ammessa(p, { settori: new Set([SOC]) }), true);
  assert.equal(ammessa({ ...p, stato: 'CHIUSO' }, { chiuse: false }), false);
  assert.equal(ammessa({ ...p, stato: 'CHIUSO' }, { chiuse: true }), true);
  assert.equal(ammessa(p, { titolare: 'ANAS' }), true);
  assert.equal(ammessa(p, { titolare: 'ALTRO' }), false);
});

test('raggruppa: un luogo per posizione, fette per settore dalla più numerosa, numero delle opere', () => {
  const l = raggruppa(TUTTE);
  assert.equal(l.length, 2);
  const a = l.find(x => x.id === chiaveLuogo(A));
  assert.equal(a.n, 3);
  assert.deepEqual(a.fette.map(f => [f.area, f.n]), [[SOC, 2], [TRA, 1]]);
  assert.deepEqual(a.coordinates, A);
});

test('raggruppa: i filtri tolgono le opere e i luoghi rimasti vuoti', () => {
  assert.equal(raggruppa(TUTTE, { chiuse: false }).length, 1);
  assert.equal(raggruppa(TUTTE, { titolare: 'ANAS' }).find(x => x.id === chiaveLuogo(A)).n, 1);
  assert.equal(raggruppa(TUTTE, { settori: new Set(['ALTRO']) }).length, 0);
});

test('firma: stessa combinazione di fette, stessa icona; nomi di settore con apostrofi e virgole sono sicuri', () => {
  const l = raggruppa(TUTTE);
  const a = l.find(x => x.id === chiaveLuogo(A));
  assert.equal(firma(a.fette), firma(raggruppa(TUTTE.slice(0, 3)).find(x => x.id === chiaveLuogo(A)).fette));
  assert.match(firma(raggruppa([O('9', "INFRASTRUTTURE PER L'ATTREZZATURA DI AREE PRODUTTIVE", 'X', A)])[0].fette), /^[A-Za-z0-9_-]+$/);
});

test('firma: ogni settore ha una chiave diversa (i nomi cominciano quasi tutti con INFRASTRUTTURE)', () => {
  const chiavi = SETTORI.map(([c]) => firma(raggruppa([O('1', c, 'X', A)])[0].fette));
  assert.equal(new Set(chiavi).size, SETTORI.length);
  assert.notEqual(firma([{ area: SOC, n: 1 }]), firma([{ area: TRA, n: 1 }]));
  assert.notEqual(firma([{ area: SOC, n: 2 }, { area: TRA, n: 1 }]), firma([{ area: SOC, n: 1 }, { area: TRA, n: 2 }]));
  assert.match(firma([{ area: 'SCONOSCIUTO', n: 3 }]), /^x_3$/);
});

test('conteggiTitolari: dal più numeroso, a parità per nome', () => {
  assert.deepEqual(conteggiTitolari(TUTTE), [{ voce: 'ANAS', n: 2 }, { voce: 'COMUNE DI PALERMO', n: 2 }]);
  assert.deepEqual(conteggiTitolari([O('1', SOC, null, A)]), []);
});

test('elencoLuogo: per settore (come l\'anello) e poi per titolo', () => {
  const a = raggruppa(TUTTE).find(x => x.id === chiaveLuogo(A));
  assert.deepEqual(elencoLuogo(a).map(p => p.cup), ['1', '2', '3']);
});

test('modelloTooltipLuogo: un\'opera → titolo e titolare; più opere → numero, indirizzo e primi titoli', () => {
  const uno = modelloTooltipLuogo(raggruppa([O('1', SOC, 'COMUNE DI PALERMO', A)])[0]);
  assert.equal(uno.titolo, 'Opera 1');
  assert.ok(uno.righe.some(r => /Comune di Palermo/.test(String(r.valore))));
  const molte = modelloTooltipLuogo(raggruppa(TUTTE).find(x => x.id === chiaveLuogo(A)));
  assert.equal(molte.sottotitolo, 'Via Roma 1');
  assert.equal(molte.elenco.length, 3);
  assert.ok(molte.elenco.every(v => typeof v === 'string' || (v.pallino && v.testo)));
});

test('modelloTooltipLuogo: oltre quattro opere, «e altre»', () => {
  const tante = raggruppa(Array.from({ length: 6 }, (_, i) => O(String(i), SOC, 'X', A)))[0];
  const m = modelloTooltipLuogo(tante);
  assert.equal(m.elenco.length, 5);
  assert.equal(typeof m.elenco[4], 'string');
});

test('etichettaOpzione: settore, titolo e, senza punto, «senza posizione»', () => {
  assert.match(etichettaOpzione(O('1', SOC, 'X', A)), /^Infrastrutture sociali · Opera 1$/);
  assert.match(etichettaOpzione({ ...O('1', SOC, 'X', A), precisione: null }), /\((opere\.senzaPosizione|senza posizione)\)$/);   // con o senza dizionario caricato (dipende dai test eseguiti prima)
});

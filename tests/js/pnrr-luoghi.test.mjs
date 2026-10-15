import test from 'node:test';
import assert from 'node:assert/strict';
import { chiaveLuogo, progettiDa, ammesso, raggruppa, firma, conteggiAttuatori, modelloTooltipLuogo, elencoLuogo, nomeProgetto } from '../../js/layers/pnrr-luoghi.js';
import { righeProgetto, filtroAttuatore } from '../../js/layers/scheda-pnrr.js';

const P = (cup, missione, attuatore, coordinates, extra = {}) => ({ cup, missione, attuatore, precisione: 'civico', titolo: `Titolo ${cup}`, indirizzo: 'Via Roma 1', coordinates, ...extra });
const A = [13.36, 38.11];
const B = [13.37, 38.12];
const TUTTI = [P('1', 'M4', 'SCUOLA X', A), P('2', 'M4', 'SCUOLA X', A), P('3', 'M1', 'COMUNE DI PALERMO', A), P('4', 'M5', 'REGIONE', B, { precisione: 'sede' })];

test('chiaveLuogo: stessa posizione, stessa chiave (5 decimali)', () => {
  assert.equal(chiaveLuogo([13.360001, 38.11]), chiaveLuogo([13.36, 38.110004]));
  assert.notEqual(chiaveLuogo(A), chiaveLuogo(B));
});

test('progettiDa: tiene i punti e le proprietà utili', () => {
  const f = [{ geometry: { type: 'Point', coordinates: A }, properties: { cup: 'X', missione: 'M4', attuatore: 'S', precisione: 'via', titolo: 'T', indirizzo: 'V' } },
    { geometry: { type: 'Polygon', coordinates: [] }, properties: { cup: 'Y' } }];
  const p = progettiDa(f);
  assert.equal(p.length, 1);
  assert.deepEqual([p[0].cup, p[0].missione, p[0].attuatore, p[0].precisione], ['X', 'M4', 'S', 'via']);
});

test('ammesso: missioni, sede delle scuole e soggetto attuatore', () => {
  const p = P('1', 'M4', 'S', A);
  assert.equal(ammesso(p), true);
  assert.equal(ammesso(p, { missioni: new Set(['M1']) }), false);
  assert.equal(ammesso(p, { missioni: new Set(['M4']) }), true);
  assert.equal(ammesso({ ...p, precisione: 'sede' }, { conSede: false }), false);
  assert.equal(ammesso({ ...p, precisione: 'sede' }, { conSede: true }), true);
  assert.equal(ammesso(p, { attuatore: 'S' }), true);
  assert.equal(ammesso(p, { attuatore: 'ALTRO' }), false);
});

test('raggruppa: un luogo per posizione, fette per missione dalla più numerosa, numero dei progetti', () => {
  const l = raggruppa(TUTTI);
  assert.equal(l.length, 2);
  const a = l.find(x => x.id === chiaveLuogo(A));
  assert.equal(a.n, 3);
  assert.deepEqual(a.fette.map(f => [f.area, f.n]), [['M4', 2], ['M1', 1]]);
  assert.ok(a.fette.every(f => /^#/.test(f.colore)));
});

test('raggruppa: i filtri tolgono progetti e luoghi interi', () => {
  assert.deepEqual(raggruppa(TUTTI, { attuatore: 'SCUOLA X' }).map(l => l.n), [2]);
  assert.equal(raggruppa(TUTTI, { missioni: new Set(['M1']) })[0].n, 1);
  assert.equal(raggruppa(TUTTI, { conSede: false }).length, 1);       // il luogo B ha solo un progetto «sede»
  assert.deepEqual(raggruppa(TUTTI, { attuatore: 'NESSUNO' }), []);
});

test('firma: stessa combinazione di fette, stessa icona', () => {
  const l = raggruppa(TUTTI).find(x => x.id === chiaveLuogo(A));
  assert.equal(firma(l.fette), 'M42-M11');
});

test('conteggiAttuatori: dal più numeroso, a parità per nome', () => {
  assert.deepEqual(conteggiAttuatori(TUTTI), [{ voce: 'SCUOLA X', n: 2 }, { voce: 'COMUNE DI PALERMO', n: 1 }, { voce: 'REGIONE', n: 1 }]);
});

test('modelloTooltipLuogo: un progetto → il titolo; più progetti → il numero e le missioni', () => {
  const [b, a] = [raggruppa(TUTTI).find(x => x.id === chiaveLuogo(B)), raggruppa(TUTTI).find(x => x.id === chiaveLuogo(A))];
  assert.match(modelloTooltipLuogo(b).titolo, /^Titolo 4$/i);
  const m = modelloTooltipLuogo(a);
  assert.equal(m.titolo, '3 progetti PNRR');
  assert.equal(m.sottotitolo, 'Via Roma 1');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['M4', 'M4', 'M1']);                  // un titolo per progetto, per missione
  assert.deepEqual(m.righe.map(r => r.valore), ['Titolo 1', 'Titolo 2', 'Titolo 3']);
});

test('scheda: il soggetto attuatore è un filtro della mappa', () => {
  const r = righeProgetto({ cup: 'X', attuatore: 'COMUNE DI PALERMO', missione: 'M1' });
  const riga = r.find(x => x.etichetta === 'Soggetto attuatore');
  assert.deepEqual(riga.filtro, filtroAttuatore('COMUNE DI PALERMO'));
  assert.deepEqual(riga.filtro, { strato: 'pnrr', campo: 'attuatore', valore: 'COMUNE DI PALERMO' });
  assert.equal(r.find(x => x.etichetta === 'CUP').filtro, undefined);
});

test('modelloTooltipLuogo: oltre i primi titoli dice quanti altri ce ne sono', () => {
  const molti = Array.from({ length: 7 }, (_, i) => P(String(i), 'M4', 'S', A));
  const m = modelloTooltipLuogo(raggruppa(molti)[0]);
  assert.equal(m.righe.length, 5);
  assert.deepEqual(m.righe.at(-1), { etichetta: '…', valore: '… e altri 3' });
});

test('nomeProgetto: se il titolo è solo un codice si aggiunge la misura del PNRR', () => {
  assert.equal(nomeProgetto({ titolo: 'p3', submisura_nome: 'Scuola 4.0', cup: 'X' }), 'Scuola 4.0 (p3)');
  assert.equal(nomeProgetto({ titolo: 'LAVORI DI RIQUALIFICAZIONE DELLA SCUOLA', submisura_nome: 'Scuola 4.0', cup: 'X' }), 'Lavori di riqualificazione della scuola');
});

test('elencoLuogo: per missione (come l\'anello) e poi per titolo', () => {
  const l = raggruppa([P('1', 'M1', 'S', A, { titolo: 'Zeta' }), P('2', 'M4', 'S', A, { titolo: 'Beta' }), P('3', 'M4', 'S', A, { titolo: 'Alfa' })])[0];
  assert.deepEqual(elencoLuogo(l).map(p => p.cup), ['3', '2', '1']);
});

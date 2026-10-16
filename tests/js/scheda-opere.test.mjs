import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTORI, FASI, COLORI_FASE, coloreSettore, nomeSettore, titoloOpera, righeAnagrafica, righeCosti, righeDate, voceScheda, modelloTooltipOpera, voceTendina, voceSintesi, filtroTitolare, descrizioneOpera } from '../../js/layers/scheda-opere.js';

const P = {
  cup: 'D76E18000090001', titolo: "LAVORI DI MANUTENZIONE DEL PLESSO SCOLASTICO", dettagli: 'RISTRUTTURAZIONE', stato: 'ATTIVO', fase: 'In esecuzione',
  titolare: "CITTA' METROPOLITANA DI PALERMO", settore: 'INFRASTRUTTURE SOCIALI', sottosettore: 'EDILIZIA SCOLASTICA', tipologia: 'RISTRUTTURAZIONE', natura: 'LAVORI',
  costo_previsto: 1200000, costo_effettivo: 0, fin_statali: 1000000, fin_altri: 0, esec_inizio_eff: '12/10/2022', esec_fine_prev: '31/12/2024',
  indirizzo: 'VIA ZISA, 21', precisione: 'via',
};
const valore = (righe, e) => righe.find(r => r.etichetta === e)?.valore;

test('SETTORI: chiavi e colori distinti; colore e nome di un settore sconosciuto', () => {
  assert.equal(new Set(SETTORI.map(([c]) => c)).size, SETTORI.length);
  assert.equal(new Set(SETTORI.map(([, , col]) => col)).size, SETTORI.length);
  assert.equal(coloreSettore('INFRASTRUTTURE SOCIALI'), SETTORI[0][2]);
  assert.equal(coloreSettore('BOH'), '#adb5bd');
  assert.equal(nomeSettore('INFRASTRUTTURE SOCIALI'), 'Infrastrutture sociali');
  assert.equal(nomeSettore('ALTRO SETTORE'), 'Altro settore');   // fuori elenco: portato a frase
  assert.equal(nomeSettore(null), 'n.d.');
});

test('FASI: ogni fase ha il suo colore', () => {
  for (const f of FASI) assert.ok(COLORI_FASE[f], f);
});

test('titoloOpera: titolo a frase, altrimenti il CUP', () => {
  assert.equal(titoloOpera(P), 'Lavori di manutenzione del plesso scolastico');
  assert.equal(titoloOpera({ cup: 'X' }), 'X');
});

test('righeAnagrafica: titolare filtro, stato e fase come badge, CUP link a OpenCUP', () => {
  const r = righeAnagrafica(P);
  assert.deepEqual(r.find(x => x.etichetta === 'Titolare').filtro, filtroTitolare(P.titolare));
  assert.equal(valore(r, 'Titolare'), "Città Metropolitana di Palermo");
  assert.ok(r.find(x => x.etichetta === 'Stato del CUP').colore);
  assert.equal(r.find(x => x.etichetta === 'Fase (dalle date dichiarate)').colore, COLORI_FASE['In esecuzione']);
  const cup = r.find(x => x.etichetta === 'CUP');
  assert.equal(cup.urlValore, 'https://opencup.gov.it/portale/progetto/-/cup/D76E18000090001');
  assert.equal(valore(r, 'Posizione'), 'Solo la via: posizione approssimata');
  assert.equal(valore(r, 'Settore'), 'Infrastrutture sociali');
});

test('righeAnagrafica: gli altri titolari possono arrivare come testo JSON da MapLibre', () => {
  assert.equal(valore(righeAnagrafica({ ...P, altri_titolari: ['ANAS'] }), 'Altri titolari'), 'Anas');
  assert.equal(valore(righeAnagrafica({ ...P, altri_titolari: '["ANAS","REGIONE SICILIANA"]' }), 'Altri titolari'), 'Anas, Regione Siciliana');
  assert.equal(valore(righeAnagrafica(P), 'Altri titolari'), undefined);
  assert.doesNotThrow(() => righeAnagrafica({ ...P, altri_titolari: 'non json' }));
});

test('righeCosti: gli importi a zero (non indicati nella fonte) non compaiono', () => {
  const r = righeCosti(P);
  assert.ok(valore(r, 'Costo dei lavori previsto'));
  assert.equal(valore(r, 'Costo dei lavori effettivo'), undefined);
  assert.ok(valore(r, 'Finanziamenti statali'));
  assert.equal(valore(r, 'Altre fonti di finanziamento'), undefined);
});

test('righeDate: solo le date presenti', () => {
  const r = righeDate(P);
  assert.equal(valore(r, 'Inizio esecuzione effettiva'), '12/10/2022');
  assert.equal(valore(r, 'Fine esecuzione prevista'), '31/12/2024');
  assert.equal(r.length, 2);
});

test('descrizioneOpera: i dettagli, se non ripetono il titolo', () => {
  assert.equal(descrizioneOpera(P), 'Ristrutturazione');
  assert.equal(descrizioneOpera({ titolo: 'ABC', dettagli: 'abc' }), undefined);
});

test('voceScheda: tab Opere (peso 98), strato opere, senza gruppi vuoti', () => {
  const v = voceScheda(P);
  assert.equal(v.peso, 98);
  assert.equal(v.strato, 'opere');
  assert.equal(v.chiave, 'opere-D76E18000090001');
  assert.equal(v.sempre, true);
  assert.ok(v.gruppi.every(g => g.righe.length));
  assert.deepEqual(v.gruppi.map(g => g.titolo), [undefined, 'Costi e finanziamenti dichiarati', 'Date']);
  const senza = voceScheda({ cup: 'X', titolo: 'Y', titolare: 'Z' });
  assert.ok(senza.gruppi.every(g => g.righe.length));
});

test('modelloTooltipOpera: titolo, fase e stato, pallino del settore', () => {
  const m = modelloTooltipOpera(P);
  assert.equal(m.titolo, 'Lavori di manutenzione del plesso scolastico');
  assert.equal(m.sottotitolo, 'In esecuzione · Attivo');
  assert.equal(m.pallino, coloreSettore(P.settore));
});

test('voceTendina e voceSintesi: pesi 97 e 99 (tab Opere), il dinamico riceve i dati', () => {
  const titolari = [{ voce: 'A', n: 2, progetti: [] }, { voce: 'B', n: 3, progetti: [] }];
  let visto = null;
  const t = voceTendina(titolari, (x, s) => { visto = [x, s]; return 'dom'; }, { n: 5 });
  assert.equal(t.peso, 97);
  assert.equal(t.badge, '5');
  assert.equal(t.dinamico(), 'dom');
  assert.deepEqual(visto, [titolari, { n: 5 }]);
  const s = voceSintesi({ estrazione: '30/09/2026' }, x => x.estrazione);
  assert.equal(s.peso, 99);
  assert.equal(s.badge, '2026');
  assert.equal(s.dinamico(), '30/09/2026');
});

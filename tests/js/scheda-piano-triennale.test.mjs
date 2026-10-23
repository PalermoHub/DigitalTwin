import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANNUALITA, SETTORI, coloreClasse, coloreSettore, nomeSettore, nomeClasse, codici, indicePerCodice, titoloIntervento, righeAnagrafica, righeImporti, righeFonti, righeAnnuale, righeCandidato, voceScheda, modelloTooltip, voceTendina, voceSintesi } from '../../js/layers/scheda-piano-triennale.js';

const O = {
  cod: '01-01_033', titolo: 'VIA DI FUGA, STRADA DI COLLEGAMENTO TRA VIA NICOLETTI E SFERRACAVALLO', cui: '80016350821199700006', cup: 'D71B00000180001',
  rup: 'Rossi Ing. Mario', affidamento: 2026, tipologia: '01 - Nuova realizzazione', sottosettore: '01.01 - Stradali', settore: '01', priorita: 2,
  c1: 8000000, c2: 0, c3: 0, triennio: 8000000, complessivo: 8000000, localizzato: true, circoscrizione: 'VII', quartiere: 'Tommaso Natale - Sferracavallo',
  fonti: { risorsa: 'Destinazione vincolata per legge', descrizione: 'FSC delibera 192', importo_totale: 8000000 },
  annuale: { importo: 8000000, finalita: 'URB', progettazione: 3 },
};
const valore = (righe, e) => righe.find(r => r.etichetta === e)?.valore;
const leggi = f => JSON.parse(readFileSync(new URL(`../../dati/piano-triennale/${f}`, import.meta.url), 'utf8'));

test('annualità e settori: chiavi e colori distinti, nomi e colori di riserva', () => {
  assert.equal(new Set(ANNUALITA.map(([, , c]) => c)).size, 3);
  assert.equal(new Set(SETTORI.map(([, , c]) => c)).size, SETTORI.length);
  assert.equal(coloreClasse(2), ANNUALITA[1][2]);
  assert.equal(coloreClasse(null), '#808080');
  assert.equal(nomeClasse(3), 'III annualità (2028)');
  assert.equal(nomeSettore('01'), 'Trasporti');
  assert.equal(nomeSettore('99'), 'n.d.');
  assert.equal(coloreSettore('99'), '#adb5bd');
});

test('codici: una geometria può riguardare più interventi', () => {
  assert.deepEqual(codici('01-01_025;01-01_235;05-31_005'), ['01-01_025', '01-01_235', '05-31_005']);
  assert.deepEqual(codici('01-01_003'), ['01-01_003']);
  assert.deepEqual(codici(null), []);
  assert.equal(indicePerCodice([O]).get('01-01_033'), O);
});

test('titoloIntervento: titolo a frase, altrimenti il codice', () => {
  assert.equal(titoloIntervento(O), 'Via di fuga, strada di collegamento tra via nicoletti e sferracavallo');
  assert.equal(titoloIntervento({ cod: 'X' }), 'X');
});

test('righe: anagrafica con CUP come link, importi e annuale solo se presenti', () => {
  const a = righeAnagrafica(O);
  assert.equal(valore(a, 'Settore'), 'Trasporti');
  assert.equal(valore(a, 'Priorità'), '2');
  assert.match(a.find(r => r.etichetta === 'CUP').urlValore, /opencup\.gov\.it\/portale\/progetto\/-\/cup\/D71B00000180001/);
  assert.equal(a.find(r => r.etichetta === 'Stato del CUP'), undefined);   // il CUP c'è
  assert.equal(a.find(r => r.etichetta === 'Posizione sulla mappa'), undefined);
  const i = righeImporti(O);
  assert.ok(valore(i, 'Primo anno (2026)').includes('8.000.000'));
  assert.equal(i.find(r => r.etichetta === 'Secondo anno (2027)'), undefined);   // 0 = nessun importo
  assert.equal(valore(righeFonti(O), 'Tipologia di risorsa'), 'Destinazione vincolata per legge');
  assert.equal(valore(righeAnnuale(O), 'Livello di progettazione'), '3');
  assert.deepEqual(righeAnnuale({ cod: 'Y' }), []);
  assert.deepEqual(righeCandidato(O), []);
});

test('righe: senza CUP e non localizzato si dice perché', () => {
  const a = righeAnagrafica({ cod: 'Z', cup_stato: 'CUP assente: non ancora richiesto, opera solo programmata', localizzato: false });
  assert.match(valore(a, 'Stato del CUP'), /non ancora richiesto/);
  assert.match(valore(a, 'Posizione sulla mappa'), /Non localizzato/);
});

test('CUP candidato: proposta con link a OpenCUP', () => {
  const r = righeCandidato({ cup_candidato: { cup: 'D77H', affidabilita: 'alta', importo_coincide: true, link: 'https://www.opencup.gov.it/x' } });
  assert.equal(valore(r, 'CUP candidato'), 'D77H');
  assert.equal(valore(r, 'Importo coincidente'), 'Sì');
  assert.equal(r.find(x => x.etichetta === 'CUP candidato').urlValore, 'https://www.opencup.gov.it/x');
});

test('voceScheda: peso nel tab Piano triennale, gruppi e link', () => {
  const v = voceScheda(O);
  assert.equal(v.peso, 102);
  assert.equal(v.chiave, 'piano-01-01_033');
  assert.equal(v.strato, 'piano-triennale');
  assert.ok(v.sempre);
  assert.deepEqual(v.gruppi.map(g => g.titolo), [undefined, 'Importi del Programma', 'Fonti di finanziamento', 'Elenco annuale 2026']);
  assert.equal(v.link.length, 2);
});

test('modelloTooltip: titolo accorciato, settore e importo', () => {
  const m = modelloTooltip({ cod: 'a;b', n: 2, titolo: 'X'.repeat(200), settore: '05', importo: 1000000, classe: 2, quartiere: 'Zisa' });
  assert.ok(m.titolo.length <= 91);
  assert.equal(m.badge.colore, coloreClasse(2));
  assert.match(m.sottotitolo, new RegExp(nomeSettore('05')));
  assert.equal(valore(m.righe, 'Interventi sulla geometria'), '2');
  assert.equal(valore(m.righe, 'Quartiere'), 'Zisa');
  assert.match(modelloTooltip({ cod: 'a', origine: 'approssimato' }).sottotitolo, /approssimata/);
});

test('sezioni della tab: tendina (101), schede (102), sintesi (103)', () => {
  assert.equal(voceTendina([O], () => {}).peso, 101);
  const s = voceSintesi({ importo_triennio: 4373410918.53 }, () => {});
  assert.equal(s.peso, 103);
  assert.match(s.badge, /Mld/);
});

test('dati: 548 interventi, totale ufficiale, 454 localizzati e coerenti con le geometrie', () => {
  const elenco = leggi('elenco.json');
  const sintesi = leggi('sintesi.json');
  const geo = leggi('interventi.geojson');
  assert.equal(elenco.length, 548);
  assert.equal(new Set(elenco.map(o => o.cod)).size, 548);
  assert.equal(Math.round(elenco.reduce((s, o) => s + (o.triennio ?? 0), 0) * 100) / 100, 4373410918.53);
  assert.equal(sintesi.n_localizzati, 454);
  assert.equal(sintesi.n_localizzati + sintesi.n_non_localizzati, 548);
  const conGeometria = new Set(geo.features.flatMap(f => codici(f.properties.cod)));
  assert.equal(conGeometria.size, 454);
  assert.ok(elenco.filter(o => o.localizzato).every(o => conGeometria.has(o.cod)));
  const indice = indicePerCodice(elenco);
  assert.ok(geo.features.every(f => codici(f.properties.cod).every(c => indice.has(c))));
  assert.ok(geo.features.every(f => ['punto', 'linea', 'poligono'].includes(f.properties.tipo)));
  assert.deepEqual(sintesi.per_anno.map(a => a.voce), ['2026', '2027', '2028']);
});

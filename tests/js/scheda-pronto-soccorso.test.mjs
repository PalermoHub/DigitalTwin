// tests/js/scheda-pronto-soccorso.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { tabScheda } from '../../js/core/scheda-modello.js';
import { livello, vocePs, modelloPopupPs, pannelloPs, quando } from '../../js/layers/scheda-pronto-soccorso.js';

const base = { id: 'x', nome: 'Villa Sofia', struttura: 'Ospedali Riuniti', tipo: 'adulti', indirizzo: 'Piazza Salerno 1', stato: 'ok', acquisitaAlle: '2026-11-12T08:52:53.940Z',
  rilevataAlle: '2026-11-12T09:52:00+01:00', pazientiTotali: 62, inAttesa: 4, sovraffollamentoPct: 207, postiTecnici: 30,
  codici: { rosso: { attesa: 0, trattamento: null, osservazione: null, totale: null }, verde: { attesa: 3, trattamento: null, osservazione: null, totale: null } },
  permanenza: { meno24h: 46, da24a48h: 15, oltre48h: 4 }, tempiMediAttesaMin: null };

test('livello: soglie 100% e 150%, grigio senza indice o con lettura non fresca', () => {
  assert.equal(livello({ ...base, sovraffollamentoPct: 80 }), 'regolare');
  assert.equal(livello({ ...base, sovraffollamentoPct: 100 }), 'regolare');
  assert.equal(livello({ ...base, sovraffollamentoPct: 120 }), 'affollato');
  assert.equal(livello({ ...base, sovraffollamentoPct: 150 }), 'affollato');
  assert.equal(livello({ ...base, sovraffollamentoPct: 207 }), 'molto');
  assert.equal(livello({ ...base, sovraffollamentoPct: null }), 'nd');
  assert.equal(livello({ ...base, stato: 'vecchio' }), 'nd');
  assert.equal(livello({ ...base, stato: 'assente' }), 'nd');
});

test('vocePs: gruppi con i soli valori presenti, mai zeri inventati', () => {
  const v = vocePs(base);
  const titoli = v.gruppi.map(g => g.titolo);
  assert.deepEqual(titoli, ['Struttura', 'Situazione adesso', 'Pazienti per codice colore', 'Permanenza dei pazienti presenti']);
  const codici = v.gruppi[2].righe.map(r => r.etichetta);
  assert.deepEqual(codici, ['Codice rosso', 'Codice verde']); // gli altri codici non sono pubblicati
  // senza dizionari t() restituisce la chiave: «0 in attesa» è un dato vero e c'è, il trattamento null (non pubblicato) no
  assert.match(v.gruppi[2].righe[0].valore, /ps\.inAttesa|in attesa|waiting/);
  assert.doesNotMatch(v.gruppi[2].righe[0].valore, /ps\.inTrattamento|trattamento|treatment/);
  assert.equal(v.badge, 'Molto affollato');
  assert.equal(v.peso, 105);
  assert.equal(tabScheda(v.peso, v.chiave), 'pronto-soccorso');
  assert.equal(v.sempre, true);
  assert.equal(v.avviso, undefined);
});

test('vocePs: senza telefono niente riga, con telefono riga chiamabile', () => {
  assert.ok(!vocePs(base).gruppi[0].righe.some(r => r.etichetta === 'Telefono'));
  const r = vocePs({ ...base, telefono: '091 123' }).gruppi[0].righe.find(x => x.etichetta === 'Telefono');
  assert.equal(r.tel, '091 123');
});

test('vocePs: dato vecchio o assente = avviso e nessuna percentuale', () => {
  const vecchio = vocePs({ ...base, stato: 'ferma' });
  assert.match(vecchio.avviso, /non è aggiornato/);
  assert.ok(!vecchio.gruppi.flatMap(g => g.righe).some(r => r.etichetta === 'Affollamento'));
  const assente = vocePs({ id: 'y', nome: 'Civico', tipo: 'adulti', stato: 'assente', codici: {} });
  assert.match(assente.avviso, /non ha ancora pubblicato/);
  assert.equal(assente.badge, 'Dato non disponibile');
});

test('titolo: pediatrico distinto, indice calcolato dichiarato', () => {
  assert.match(vocePs({ ...base, nome: 'Cervello', tipo: 'pediatrico' }).titolo, /ps\.titoloPediatrico|pediatrico|paediatric/);
  assert.doesNotMatch(vocePs(base).titolo, /pediatric|paediatric/);
  const c = vocePs({ ...base, sovraffollamentoCalcolato: true }).gruppi[1].righe.find(r => r.etichetta === 'Indice');
  assert.ok(c);
  assert.ok(!modelloPopupPs({ ...base, sovraffollamentoCalcolato: true }).righe.some(r => r.etichetta === 'Indice'));
});

test('quando: ora di Roma dalla rilevazione dell\'ospedale; vuoto se manca', () => {
  assert.match(quando(base), /10[:.]52|09[:.]52/);
  assert.equal(quando({}), '');
});

test('pannelloPs: cinque codici, non pubblicato = «–» e mai 0 inventato', () => {
  const d = pannelloPs(base);
  assert.deepEqual(d.codici.map(c => c.chiave), ['rosso', 'arancione', 'azzurro', 'verde', 'bianco']);
  assert.equal(d.codici[0].attesa, '0'); // 0 pubblicato: è un dato vero
  assert.equal(d.codici[1].attesa, '–'); // arancione non pubblicato
  assert.equal(d.tipo, 'Adulti');
  assert.equal(d.stato.livello, 'molto');
  assert.equal(pannelloPs({ ...base, tipo: 'pediatrico', inAttesa: null, stato: 'assente' }).inAttesa, '–');
});

test('indirizzo e sito sono collegamenti: percorso su Google Maps e sito ufficiale', () => {
  const v = vocePs({ ...base, lat: 38.1, lng: 13.3, sito: 'https://www.ospedaliriunitipalermo.it' });
  const righe = v.gruppi[0].righe;
  assert.match(righe.find(r => r.etichetta === 'Indirizzo').urlValore, /maps\/dir\/\?api=1&destination=38\.1,13\.3/);
  assert.equal(righe.find(r => r.etichetta === 'Sito ufficiale').urlValore, 'https://www.ospedaliriunitipalermo.it');
  assert.ok(!vocePs(base).gruppi[0].righe.some(r => r.etichetta === 'Sito ufficiale' || r.urlValore));
});

test('struttura: fonte dei dati subito dopo il sito ufficiale', () => {
  const r = vocePs({ ...base, sito: 'https://a.it', fonteUrl: 'https://x.it/attese' }).gruppi[0].righe.map(z => z.etichetta);
  assert.equal(r.indexOf('Fonte dei dati'), r.indexOf('Sito ufficiale') + 1);
  assert.ok(!vocePs(base).gruppi[0].righe.some(z => z.etichetta === 'Fonte dei dati'));
});

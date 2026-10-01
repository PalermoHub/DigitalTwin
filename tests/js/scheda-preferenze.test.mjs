import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci } from '../../js/core/scheda-modello.js';
import {
  tipoSezione, applicaPreferenze, registraVisti, elencoPannello, commutaSezione, commutaRiga, azzera, nessunaPreferenza,
  leggiPreferenze, salvaPreferenze, CHIAVE_STORAGE,
} from '../../js/core/scheda-preferenze.js';

const voce = (chiave, titolo, righe, extra = {}) => ({ chiave, peso: 10, titolo, gruppi: [{ righe: righe.map(([etichetta, valore]) => ({ etichetta, valore })) }], ...extra });
const dati = () => unisci([
  voce('indirizzo', 'Indirizzo', [['Via', 'VIA ROMA'], ['Civico', '12']]),
  voce('arco-77', 'Via Roma', [['Pendenza media', '2%'], ['Incidenti 2015–2023', '5']], { badge: 'Tratto stradale', legale: true }),
  voce('fermata-S1', 'Piazza X', [['Linee', '100']], { badge: 'Fermata' }),
]);
const vuote = () => ({ nascoste: { sezioni: [], righe: [] }, visti: {} });

test('tipoSezione: la chiave senza l\'id che la rende unica', () => {
  assert.equal(tipoSezione({ chiave: 'arco-77' }), 'arco');
  assert.equal(tipoSezione({ chiave: 'scuola-12' }), 'scuola');
  assert.equal(tipoSezione({ chiave: 'luogo:abc' }), 'luogo');
  assert.equal(tipoSezione({ chiave: 'edificio' }), 'edificio');
  assert.equal(tipoSezione({ chiave: 'incidente-8416-2015-VIA X' }), 'incidente');
  assert.equal(tipoSezione({ chiave: 'x', tipo: 'esplicito' }), 'esplicito');
});

test('applicaPreferenze: senza preferenze la scheda resta identica', () => {
  const d = dati();
  assert.deepEqual(applicaPreferenze(d, vuote()), d);
});

test('applicaPreferenze: una sezione nascosta sparisce per qualunque id (arco-77 e arco-99)', () => {
  const p = commutaSezione(vuote(), 'arco', false);
  assert.deepEqual(applicaPreferenze(dati(), p).sezioni.map(s => s.chiave), ['indirizzo', 'fermata-S1']);
  const altro = unisci([voce('arco-99', 'Via Y', [['Pendenza media', '9%']])]);
  assert.equal(applicaPreferenze(altro, p).sezioni.length, 0);
});

test('applicaPreferenze: una riga nascosta sparisce solo nella sua sezione', () => {
  const d = unisci([voce('arco-1', 'A', [['Quartiere', 'X'], ['Pendenza media', '2%']]), voce('fermata-1', 'B', [['Quartiere', 'Y']])]);
  const out = applicaPreferenze(d, commutaRiga(vuote(), 'arco', 'Quartiere', false));
  const righe = s => s.gruppi.flatMap(g => g.righe.map(r => r.etichetta));
  assert.deepEqual(righe(out.sezioni.find(s => s.chiave === 'arco-1')), ['Pendenza media']);
  assert.deepEqual(righe(out.sezioni.find(s => s.chiave === 'fermata-1')), ['Quartiere']);
});

test('applicaPreferenze: nascoste tutte le righe di una sezione senza altro contenuto, la sezione sparisce; con `sempre` resta', () => {
  const d = unisci([voce('arco-1', 'A', [['Pendenza media', '2%']]), voce('fermata-1', 'B', [['Linee', '1']], { sempre: true })]);
  let p = commutaRiga(commutaRiga(vuote(), 'arco', 'Pendenza media', false), 'fermata', 'Linee', false);
  const out = applicaPreferenze(d, p);
  assert.deepEqual(out.sezioni.map(s => s.chiave), ['fermata-1']);
  assert.deepEqual(out.sezioni[0].gruppi, []);
});

test('applicaPreferenze: l\'avviso legale resta solo se resta una sezione, e non muta l\'originale', () => {
  const d = dati();
  assert.equal(d.legale, true);
  assert.equal(applicaPreferenze(d, commutaSezione(vuote(), 'arco', false)).legale, true); // restano altre sezioni
  const tutte = ['indirizzo', 'arco', 'fermata'].reduce((p, t) => commutaSezione(p, t, false), vuote());
  const out = applicaPreferenze(d, tutte);
  assert.deepEqual(out.sezioni, []);
  assert.equal(out.legale, false);
  assert.equal(d.sezioni.length, 3); // l'originale è intatto
});

test('applicaPreferenze: il contesto (quartiere, UPL…) non si tocca', () => {
  const d = unisci([voce('arco-1', 'A', [['Pendenza media', '2%']], { contesto: { quartiere: 'Libertà' } })]);
  assert.deepEqual(applicaPreferenze(d, commutaSezione(vuote(), 'arco', false)).contesto, { quartiere: 'Libertà' });
});

test('registraVisti: ricorda tipi e righe viste, con titolo fisso per i tipi dal titolo variabile', () => {
  const p = registraVisti(vuote(), dati().sezioni);
  assert.deepEqual(p.visti.arco, { titolo: 'Tratto stradale', righe: ['Pendenza media', 'Incidenti 2015–2023'] });
  assert.equal(p.visti.fermata.titolo, 'Fermata');
  assert.equal(p.visti.indirizzo.titolo, 'Indirizzo');
});

test('registraVisti: righe nuove si aggiungono senza duplicati e sono limitate', () => {
  let p = registraVisti(vuote(), dati().sezioni);
  p = registraVisti(p, unisci([voce('arco-5', 'Z', [['Pendenza media', '1%'], ['Rischio frane', 'R4']])]).sezioni);
  assert.deepEqual(p.visti.arco.righe, ['Pendenza media', 'Incidenti 2015–2023', 'Rischio frane']);
  const molte = unisci([voce('arco-6', 'Z', Array.from({ length: 80 }, (_, i) => [`Riga ${i}`, 'v']))]);
  assert.equal(registraVisti(vuote(), molte.sezioni).visti.arco.righe.length, 60);
});

test('elencoPannello: tipi e righe viste con lo stato di visibilità; i nascosti restano elencati anche se non nella scheda', () => {
  let p = registraVisti(vuote(), dati().sezioni);
  p = commutaSezione(p, 'fermata', false);
  p = commutaRiga(p, 'arco', 'Pendenza media', false);
  const el = elencoPannello(p);
  assert.deepEqual(el.map(e => e.titolo), ['Fermata', 'Indirizzo', 'Tratto stradale']);
  assert.equal(el.find(e => e.tipo === 'fermata').visibile, false);
  assert.deepEqual(el.find(e => e.tipo === 'arco').righe, [{ etichetta: 'Pendenza media', visibile: false }, { etichetta: 'Incidenti 2015–2023', visibile: true }]);
});

test('commutaSezione / commutaRiga: nascondere e rimostrare, senza duplicati e senza mutare', () => {
  const base = vuote();
  const nascosta = commutaSezione(commutaSezione(base, 'arco', false), 'arco', false);
  assert.deepEqual(nascosta.nascoste.sezioni, ['arco']);
  assert.deepEqual(base.nascoste.sezioni, []);
  assert.deepEqual(commutaSezione(nascosta, 'arco', true).nascoste.sezioni, []);
  assert.deepEqual(commutaRiga(vuote(), 'arco', 'Pendenza media', false).nascoste.righe, ['arco/Pendenza media']);
});

test('azzera: mostra tutto ma ricorda cosa si è visto; nessunaPreferenza dice se c\'è qualcosa di nascosto', () => {
  const p = commutaSezione(registraVisti(vuote(), dati().sezioni), 'arco', false);
  assert.equal(nessunaPreferenza(p), false);
  const a = azzera(p);
  assert.equal(nessunaPreferenza(a), true);
  assert.ok(a.visti.arco);
});

const storageFinto = (iniziale = {}) => {
  const m = new Map(Object.entries(iniziale));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, v); }, _m: m };
};

test('storage: scrive e rilegge le preferenze', () => {
  const s = storageFinto();
  const p = commutaSezione(registraVisti(vuote(), dati().sezioni), 'arco', false);
  assert.equal(salvaPreferenze(s, p), true);
  assert.deepEqual(leggiPreferenze(s), p);
});

test('storage: assente, rotto o con dati malformati → preferenze vuote, mai un errore', () => {
  assert.deepEqual(leggiPreferenze(null), vuote());
  assert.deepEqual(leggiPreferenze(storageFinto()), vuote());
  assert.deepEqual(leggiPreferenze(storageFinto({ [CHIAVE_STORAGE]: '{non json' })), vuote());
  assert.deepEqual(leggiPreferenze(storageFinto({ [CHIAVE_STORAGE]: JSON.stringify({ nascoste: 'boh', visti: 3 }) })), vuote());
  assert.deepEqual(leggiPreferenze(storageFinto({ [CHIAVE_STORAGE]: JSON.stringify({ nascoste: { sezioni: [1, 'arco', null], righe: ['arco/x', {}] }, visti: {} }) })).nascoste,
    { sezioni: ['arco'], righe: ['arco/x'] });
  const rotto = { getItem() { throw new Error('bloccato'); }, setItem() { throw new Error('quota'); } };
  assert.deepEqual(leggiPreferenze(rotto), vuote());
  assert.equal(salvaPreferenze(rotto, vuote()), false);
  assert.equal(salvaPreferenze(null, vuote()), false);
});

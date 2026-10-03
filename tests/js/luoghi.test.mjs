import test from 'node:test';
import assert from 'node:assert/strict';
import { preparaLuoghi, cercaLuoghi } from '../../js/core/luoghi.js';

const punto = (nome, extra) => ({ properties: { nome, lon: 13.36, lat: 38.11, ...extra } });
const voci = preparaLuoghi([
  { strato: 'scuole', nota: p => p.tipo, campi: p => [p.nome, p.indirizzo], sezioni: p => p.seggio_sezioni,
    features: [punto('Allodola', { tipo: 'Asilo nido', indirizzo: "Via Dell'Allodola 36", seggio_sezioni: '10, 11*' }), punto('Collodi', { tipo: 'Plesso scolastico', indirizzo: 'Via Roma 5' })] },
  { strato: 'seggi', nota: () => 'Sezioni elettorali', campi: p => [p.nome, p.indirizzo], sezioni: p => p.sezioni,
    features: [punto('Circolo Didattico LOMBARDO RADICE', { indirizzo: 'Corso Calatafimi, 241', sezioni: '247*, 248, 600' })] },
  { strato: 'monumenti', nota: p => p.categoria, campi: p => [p.nome],
    features: [punto('Cappella Palatina', { categoria: 'Chiese ed Oratori' }), punto('Chiesa della Martorana', { categoria: 'Chiese ed Oratori' })] },
]);

test('trova per nome con strato e nota', () => {
  const [r] = cercaLuoghi(voci, 'palatina');
  assert.equal(r.etichetta, 'Cappella Palatina');
  assert.equal(r.strato, 'monumenti');
  assert.equal(r.nota, 'Chiese ed Oratori');
});

test('accenti e maiuscole non contano; tutte le parole devono comparire', () => {
  assert.equal(cercaLuoghi(voci, 'LOMBARDO radice')[0].strato, 'seggi');
  assert.equal(cercaLuoghi(voci, 'martorana chiesa').length, 1);
  assert.equal(cercaLuoghi(voci, 'martorana palatina').length, 0);
});

test('il nome che inizia col testo precede gli altri', () => {
  const r = cercaLuoghi(voci, 'cap');
  assert.equal(r[0].etichetta, 'Cappella Palatina');
  assert.equal(r[0].prefisso, true);
});

test("l'indirizzo trova scuole e sedi di seggio, ma dopo i nomi", () => {
  const r = cercaLuoghi(voci, 'calatafimi');
  assert.equal(r[0].etichetta, 'Circolo Didattico LOMBARDO RADICE');
  const roma = cercaLuoghi(voci, 'via roma');
  assert.equal(roma[0].etichetta, 'Collodi');
});

test('meno di 3 caratteri: nessun risultato; max rispettato', () => {
  assert.deepEqual(cercaLuoghi(voci, 'ca'), []);
  assert.equal(cercaLuoghi(voci, 'a', 1).length, 0);
  assert.equal(cercaLuoghi(voci, 'chi', 1).length, 1);
});

test('voci senza coordinate o nome sono scartate', () => {
  const v = preparaLuoghi([{ strato: 's', nota: () => '', campi: p => [p.nome], features: [{ properties: { nome: 'Senza coordinate' } }, { properties: { nome: '', lon: 1, lat: 1 } }] }]);
  assert.equal(v.length, 0);
});

test('numero di sezione: trova la sede, nei seggi e nelle scuole che li ospitano', () => {
  for (const q of ['248', 'sez 248', 'Sezione 248', 'seggio 248']) {
    const r = cercaLuoghi(voci, q);
    assert.equal(r.length, 1, q);
    assert.equal(r[0].etichetta, 'Sezione 248 — Circolo Didattico LOMBARDO RADICE');
    assert.equal(r[0].strato, 'seggi');
  }
  assert.equal(cercaLuoghi(voci, '247')[0].strato, 'seggi'); // l\'asterisco non conta
  assert.equal(cercaLuoghi(voci, '11')[0].strato, 'scuole');
  assert.equal(cercaLuoghi(voci, '600').length, 1);
  assert.deepEqual(cercaLuoghi(voci, '24'), []); // numero esatto, non prefisso
});

const trasporto = preparaLuoghi([
  { strato: 'trasporto-fermate', nota: p => `Fermata, linee ${p.linee.join(', ')}`, campi: p => [p.nome],
    features: [punto('Piazza Indipendenza', { linee: ['100', '101'] })] },
  { strato: p => (p.tipo === 'tram' ? 'trasporto-tram' : 'trasporto-bus'), zoom: 14, nota: p => `${p.tipo}, ${p.da} → ${p.a}`,
    campi: p => [`Linea ${p.numero} ${p.nome}`],
    features: [punto('x', { numero: '100', nome: 'John Lennon - Oreto', tipo: 'bus', da: 'A', a: 'B' }),
      punto('x', { numero: 'TRAM1', nome: 'Linea 1', tipo: 'tram', da: 'C', a: 'D' })] },
]);

test('fermata trovata per nome, con le linee nella nota', () => {
  const [r] = cercaLuoghi(trasporto, 'indipendenza');
  assert.equal(r.etichetta, 'Piazza Indipendenza');
  assert.equal(r.nota, 'Fermata, linee 100, 101');
  assert.equal(r.strato, 'trasporto-fermate');
  assert.equal(r.zoom, undefined);
});

test('linea trovata per numero «100» (non è una sezione) e per nome; lo strato dipende dal tipo', () => {
  const [r] = cercaLuoghi(trasporto, '100');
  assert.equal(r.etichetta, 'Linea 100 John Lennon - Oreto');
  assert.equal(r.strato, 'trasporto-bus');
  assert.equal(r.zoom, 14);
  assert.equal(cercaLuoghi(trasporto, 'linea tram1')[0].strato, 'trasporto-tram');
});

test('un numero che è una sezione elettorale cerca ancora la sede', () => {
  const r = cercaLuoghi([...voci, ...trasporto], '248');
  assert.equal(r[0].strato, 'seggi');
});

const sedeEMeta = preparaLuoghi([
  { strato: 'seggi', nota: () => 'Sezioni elettorali', campi: p => [p.nome, p.indirizzo], sezioni: p => p.sezioni,
    features: [punto('Scuola D\'Angelo', { indirizzo: 'Via Roma 1', sezioni: '99, 100, 101' })] },
  { strato: p => (p.tipo === 'tram' ? 'trasporto-tram' : 'trasporto-bus'), zoom: 14, numero: p => p.numero,
    nota: p => `${p.tipo}, ${p.da} → ${p.a}`, campi: p => [`Linea ${p.numero} ${p.nome}`],
    features: [punto('x', { numero: '100', nome: 'John Lennon - Oreto', tipo: 'bus', da: 'A', a: 'B' }),
      punto('x', { numero: 'N1', nome: 'Notturna', tipo: 'bus', da: 'C', a: 'D' })] },
]);

test('«100» è sia una sezione sia una linea: compaiono entrambe', () => {
  const r = cercaLuoghi(sedeEMeta, '100');
  assert.deepEqual(r.map(x => x.strato).sort(), ['seggi', 'trasporto-bus']);
  assert.ok(r.some(x => x.etichetta.startsWith('Sezione 100')));
  assert.ok(r.some(x => x.etichetta === 'Linea 100 John Lennon - Oreto'));
});

test('sigla di linea corta («N1», 2 caratteri) trova la linea', () => {
  const r = cercaLuoghi(sedeEMeta, 'n1');
  assert.equal(r[0].etichetta, 'Linea N1 Notturna');
  assert.deepEqual(cercaLuoghi(sedeEMeta, 'zz'), []); // nessun numero di linea: sotto i 3 caratteri non si cerca
});

test('gli uffici si trovano per nome, responsabile o sede; coordinate dalla geometria', () => {
  const ufficio = (nome, p) => ({ geometry: { coordinates: [13.36, 38.12] }, properties: { nome, area: 'Area Servizi', ...p } });
  const v = preparaLuoghi([{
    strato: 'uffici', nota: p => [p.area, p.sede].filter(Boolean).join(' · '), campi: p => [p.nome, p.sede, p.responsabile],
    features: [ufficio('Ufficio Anagrafe', { sede: 'Via Roma, 209', responsabile: "Maria Mandala' (Dirigente)" }), ufficio('Ufficio Tributi', { sede: 'Piazza Giulio Cesare 1' })],
  }]);
  const [r] = cercaLuoghi(v, 'anagrafe');
  assert.equal(r.strato, 'uffici');
  assert.equal(r.nota, 'Area Servizi · Via Roma, 209');
  assert.equal(r.lat, 38.12);
  assert.equal(cercaLuoghi(v, 'mandala')[0].etichetta, 'Ufficio Anagrafe');
  assert.equal(cercaLuoghi(v, 'giulio cesare')[0].etichetta, 'Ufficio Tributi');
});

test('la sede degli uffici si trova per nome e precede i suoi uffici', () => {
  const punto = (nome, p) => ({ geometry: { coordinates: [13.34, 38.13] }, properties: { nome, ...p } });
  const v = preparaLuoghi([
    { strato: 'uffici', nota: p => `Sede comunale, ${p.n_uffici} uffici`, campi: p => [p.nome, p.indirizzo], features: [punto('Polo Tecnico', { indirizzo: 'Via Ausonia, 69', n_uffici: 95 })] },
    { strato: 'uffici', nota: p => p.area, campi: p => [p.nome, p.sede], features: [punto('U.O. Segreteria Assessore – Polo Tecnico', { area: 'Area X', sede: 'Polo Tecnico' })] },
  ]);
  const r = cercaLuoghi(v, 'polo tecnico');
  assert.equal(r[0].etichetta, 'Polo Tecnico');
  assert.equal(r[0].nota, 'Sede comunale, 95 uffici');
  assert.equal(r.length, 2);
});

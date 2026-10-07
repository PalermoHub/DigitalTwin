import test from 'node:test';
import assert from 'node:assert/strict';
import { voceScuola, voceSeggio, voceIndirizzo, viaCivico, modelloPopupScuola } from '../../js/layers/scheda-scuole.js';
import { unisci, chiaveLuogo } from '../../js/core/scheda-modello.js';

const S = {
  id: 'scuola-7', nome: 'Smith', tipo: 'Plesso scolastico', categoria: 'Istituto comprensivo',
  indirizzo: 'Via Smith Adamo 17', quartiere: 'Pallavicino', sede: 'Sciacca', sede_indirizzo: 'Via De Gobbis Francesco 13',
};
const G = {
  id: 'seggio-1', nome: 'Circolo Didattico LOMBARDO RADICE', tipo: 'Sede di sezioni elettorali',
  indirizzo: 'Corso Calatafimi, 241', circoscrizione: '4', sezioni: '247*, 248, 249', n_sezioni: 3,
};
const etichette = v => v.gruppi.flatMap(g => g.righe).map(r => r.etichetta);

test('scuola: titolo, tipo, istituto e sede (indirizzo e quartiere altrove)', () => {
  const v = voceScuola(S);
  assert.equal(v.chiave, 'scuola-7');
  assert.equal(v.titolo, 'Smith');
  assert.equal(v.badge, 'Plesso scolastico');
  assert.deepEqual(etichette(v), ['Istituto', 'Sede']);
  assert.equal(v.fonte, undefined);
});

test('asilo nido senza sede né categoria: la sezione resta', () => {
  const v = voceScuola({ ...S, tipo: 'Asilo nido', categoria: '', sede: undefined, sede_indirizzo: undefined });
  assert.deepEqual(etichette(v), []);
  assert.equal(unisci([v]).sezioni.length, 1);
});

test('seggio: solo sezioni elettorali', () => {
  const v = voceSeggio(G);
  assert.equal(v.titolo, G.nome);
  assert.deepEqual(etichette(v), ['Sezioni (3)']);
  assert.equal(v.gruppi[0].righe.at(-1).valore, '247*, 248, 249');
});

test('scuola e seggio sullo stesso edificio con nomi diversi restano due sezioni nella scheda', () => {
  assert.equal(unisci([voceScuola(S), voceSeggio(G)]).sezioni.length, 2);
});

test('popup: titolo, tipo e righe', () => {
  const m = modelloPopupScuola(S);
  assert.equal(m.titolo, 'Smith');
  assert.equal(m.sottotitolo, 'Plesso scolastico');
  assert.ok(m.righe.some(r => r.valore === 'Via Smith Adamo 17'));
});

test('scuola che è anche sede elettorale: gruppo «Sede elettorale» con le sezioni', () => {
  const p = { ...S, seggio_circoscrizione: '4', seggio_sezioni: '247*, 248', seggio_n_sezioni: 2 };
  const v = voceScuola(p);
  assert.equal(v.gruppi[1].titolo, 'Sede elettorale');
  assert.deepEqual(v.gruppi[1].righe.map(r => r.etichetta), ['Sezioni (2)']);
  assert.ok(modelloPopupScuola(p).righe.some(r => r.valore === '247*, 248'));
  assert.equal(voceScuola(S).gruppi.length, 1);
});

test('stesso luogo con nomi diversi (scuola, seggio, monumento): una sola scheda con badge e fonti uniti', () => {
  const scuola = voceScuola({ ...S, id: 'scuola-230', nome: "Nicolo' Turrisi" });
  const seggio = voceSeggio({ ...G, id: 'seggio-91', nome: 'Scuola primaria NICOLO’ TURRISI' });
  const monumento = { chiave: 'monumento-1', peso: 5, luogo: chiaveLuogo("Scuola d'Epoca Nicolò Turrisi"), titolo: "Scuola d'Epoca Nicolò Turrisi",
    badge: 'Palazzi', gruppi: [], immagine: { url: 'x.jpg', alt: 'x' }, fonte: 'Fonte: Petrucci' };
  const { sezioni } = unisci([seggio, monumento, scuola]);
  assert.equal(sezioni.length, 1);
  assert.equal(sezioni[0].titolo, "Nicolo' Turrisi");
  assert.deepEqual(sezioni[0].badges, ['Plesso scolastico', 'Sede di sezioni elettorali', 'Palazzi']);
  assert.ok(sezioni[0].immagine);
  assert.equal(sezioni[0].fonte, 'Fonte: Petrucci');
  assert.ok(sezioni[0].gruppi.some(g => g.titolo === 'Sede elettorale'));
});

test('nomi diversi o troppo generici non si fondono', () => {
  assert.equal(chiaveLuogo('Scuola primaria'), '');
  assert.notEqual(chiaveLuogo('Scuola Garibaldi Nord'), chiaveLuogo('Scuola Garibaldi Sud'));
});

test('viaCivico separa via e numero', () => {
  assert.deepEqual(viaCivico('Piazza Vittorio E. Orlando 3'), { via: 'Piazza Vittorio E. Orlando', civico: '3' });
  assert.deepEqual(viaCivico('Corso Calatafimi, 241'), { via: 'Corso Calatafimi', civico: '241' });
  assert.deepEqual(viaCivico('Via Roma 12/A'), { via: 'Via Roma', civico: '12/A' });
  assert.deepEqual(viaCivico('Via Roma'), { via: 'Via Roma', civico: '' });
});

test('indirizzo: sezione «Indirizzo» con Via e Civico; vale il civico vero, poi la scuola, poi il seggio', () => {
  const scuola = voceIndirizzo({ indirizzo: 'Piazza Orlando Vittorio Emanuele 3' }, 1);
  const seggio = voceIndirizzo({ indirizzo: 'Piazza Vittorio E. Orlando 3' }, 2);
  const civico = { chiave: 'indirizzo', peso: 10, titolo: 'Indirizzo', gruppi: [{ righe: [{ etichetta: 'Via', valore: 'ORLANDO' }, { etichetta: 'Civico', valore: '3' }] }] };
  const via = voci => unisci(voci).sezioni.find(x => x.chiave === 'indirizzo').gruppi[0].righe.find(r => r.etichetta === 'Via').valore;
  assert.equal(via([seggio, scuola]), 'Piazza Orlando Vittorio Emanuele');
  assert.equal(via([scuola, seggio]), 'Piazza Orlando Vittorio Emanuele');
  assert.equal(via([seggio]), 'Piazza Vittorio E. Orlando');
  assert.equal(via([scuola, civico, seggio]), 'ORLANDO');
  assert.equal(via([civico, scuola]), 'ORLANDO');
});

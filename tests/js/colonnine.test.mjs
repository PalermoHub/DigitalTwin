import test from 'node:test';
import assert from 'node:assert/strict';
import { vociColonnine, modelloPopupColonnina } from '../../js/layers/scheda-colonnine.js';
import { statistiche } from '../../js/layers/colonnine-grafici.js';
import { statoPunto, applicaSnapshot, descriviAggiornamento } from '../../js/layers/colonnine-live.js';

const P = {
  id: 'IT*ENX*E1*1', stato: 'Disponibile', operatore: 'ENEL X WAY ITALIA SRL', indirizzo: 'Via Libertà 10', cap: '90143',
  potenza_kw: 22, corrente: 'AC', connettore: 'Tipo 2', n_connettori: 2, h24: true, tempo_reale: true,
};
const el = (v, i = 0) => v.accordion.elementi[i];
const riga = (e, k) => e.righe.find(r => r.etichetta === k)?.valore;

test('sezione unica «Colonnine di ricarica» nel tab servizi, con una card per colonnina', () => {
  const [v, ...resto] = vociColonnine([P, { ...P, id: 'B', stato: 'In ricarica', indirizzo: 'Via Roma 1' }], '2026-10-04T06:38:16+00:00');
  assert.equal(resto.length, 0);
  assert.equal(v.chiave, 'colonnine:gruppo');
  assert.equal(v.peso, 90);
  assert.equal(v.badge, '2 colonnine');
  assert.equal(v.accordion.riassunto, '2 colonnine · 1 disponibile');
  assert.equal(v.accordion.elementi.length, 2);
  assert.match(v.fonte, /PUN/);
  assert.match(v.fonte, /04\/10\/2026/);
  assert.equal(v.link.url, 'https://palermohub.github.io/evcharginglogsicilia/');
});

test('anche una sola colonnina sta nella sezione a fisarmonica', () => {
  const [v] = vociColonnine([P]);
  assert.equal(v.badge, '1 colonnina');
  assert.equal(v.accordion.riassunto, '1 colonnina · 1 disponibile');
});

test('card: indirizzo come titolo, stato a destra, pulsante Mappa, righe tecniche', () => {
  const e = el(vociColonnine([P])[0]);
  assert.equal(e.titolo, 'Via Libertà 10');
  assert.equal(e.anteprima, 'Disponibile');
  assert.equal(e.strato, 'colonnine');
  assert.deepEqual(e.righe.map(r => r.etichetta), ['Operatore', 'Indirizzo', 'Potenza', 'Connettore', 'Connettori', 'Orario']);
  assert.equal(riga(e, 'Potenza'), '22 kW (AC)');
});

test('card: potenza con decimali, non h24, non in tempo reale; senza potenza la riga manca', () => {
  const e = el(vociColonnine([{ ...P, potenza_kw: 7.4, h24: false, tempo_reale: false }])[0]);
  assert.equal(riga(e, 'Potenza'), '7,4 kW (AC)');
  assert.equal(riga(e, 'Orario'), undefined);
  assert.equal(riga(e, 'Stato'), 'Non aggiornato in tempo reale dall\'operatore');
  assert.equal(riga(el(vociColonnine([{ ...P, potenza_kw: 0 }])[0]), 'Potenza'), undefined);
});

test('nessuna colonnina: nessuna sezione', () => {
  assert.deepEqual(vociColonnine([]), []);
});

test('popup: titolo operatore, stato come sottotitolo, indirizzo e potenza', () => {
  const m = modelloPopupColonnina(P);
  assert.equal(m.titolo, 'ENEL X WAY ITALIA SRL');
  assert.equal(m.sottotitolo, 'Disponibile');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Indirizzo', 'Potenza', 'Connettore', 'Connettori']);
});

test('statoPunto: tre classi come nello script', () => {
  assert.equal(statoPunto({ stato: 'Attivo', stato_raw: 'AVAILABLE' }), 'Disponibile');
  assert.equal(statoPunto({ stato: 'Attivo', stato_raw: 'CHARGING' }), 'In ricarica');
  assert.equal(statoPunto({ stato: 'Non Attivo', stato_raw: 'BLOCKED' }), 'Non attiva');
});

test('applicaSnapshot: aggiorna solo lo stato dei punti noti e ignora gli altri comuni', () => {
  const dettagli = new Map([[P.id, { ...P }], ['B', { ...P, id: 'B', stato: 'Non attiva' }]]);
  const snap = { generated_at: 'T2', points: [
    { id_evse: P.id, stato: 'Attivo', stato_raw: 'CHARGING', real_time: true },
    { id_evse: 'ALTROVE', stato: 'Attivo', stato_raw: 'AVAILABLE' },
  ] };
  const r = applicaSnapshot(dettagli, snap);
  assert.equal(dettagli.get(P.id).stato, 'In ricarica');
  assert.equal(dettagli.get('B').stato, 'Non attiva'); // assente dallo snapshot: resta com'è
  assert.deepEqual(r, { aggiornato: 'T2', cambiati: 1 });
});

test('applicaSnapshot: snapshot vuoto o malformato non cambia nulla', () => {
  const dettagli = new Map([[P.id, { ...P }]]);
  assert.equal(applicaSnapshot(dettagli, { points: [] }), null);
  assert.equal(applicaSnapshot(dettagli, null), null);
  assert.equal(dettagli.get(P.id).stato, 'Disponibile');
});

test('descriviAggiornamento: data e ora in italiano, vuoto se manca', () => {
  assert.match(descriviAggiornamento('2026-10-04T06:38:16+00:00'), /^04\/10\/2026, \d{2}:\d{2}$/);
  assert.equal(descriviAggiornamento(''), '');
});

test('statistiche: monitorabili = in uso + attive in tempo reale; percentuale sulle monitorabili', () => {
  const s = statistiche([
    { ...P, stato: 'In ricarica' }, { ...P, stato: 'Disponibile' }, { ...P, stato: 'Disponibile', tempo_reale: false },
    { ...P, stato: 'Non attiva' }, { ...P, stato: 'Non attiva' },
  ]);
  assert.deepEqual([s.totale, s.inUso, s.reale, s.stimata, s.nonAttiva, s.attive, s.monitorabili], [5, 1, 1, 1, 2, 3, 2]);
  assert.equal(s.percentuale, 50);
});

test('statistiche: nessuna colonnina monitorabile -> 0%, senza dividere per zero', () => {
  assert.equal(statistiche([]).percentuale, 0);
  assert.equal(statistiche([{ ...P, stato: 'Disponibile', tempo_reale: false }]).percentuale, 0);
});

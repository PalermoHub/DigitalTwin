import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rilevaLingua, impostaDizionari, lingua, localeIntl, t, tn, tl, applicaDom, impostaLingua,
} from '../../js/core/i18n.js';

const memoria = (iniziale = {}) => {
  const d = { ...iniziale };
  return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, d };
};

test('rilevaLingua: preferenza salvata vince sul browser', () => {
  assert.equal(rilevaLingua(memoria({ 'dt-lingua': 'en' }), { language: 'it-IT' }), 'en');
  assert.equal(rilevaLingua(memoria({ 'dt-lingua': 'it' }), { language: 'en-US' }), 'it');
});

test('rilevaLingua: senza preferenza usa il browser, valore non valido ignorato', () => {
  assert.equal(rilevaLingua(memoria(), { language: 'it-IT' }), 'it');
  assert.equal(rilevaLingua(memoria(), { language: 'fr-FR' }), 'en');
  assert.equal(rilevaLingua(memoria({ 'dt-lingua': 'xx' }), { language: 'it' }), 'it');
  assert.equal(rilevaLingua(null, null), 'it');
});

test('rilevaLingua: storage che lancia eccezione (modalità privata)', () => {
  const rotto = { getItem() { throw new Error('negato'); } };
  assert.equal(rilevaLingua(rotto, { language: 'de' }), 'en');
});

test('t: lingua corrente, riserva italiana, chiave nuda con avviso', () => {
  impostaDizionari('en', { 'a.b': 'Hello', 'a.c': 'Hi {nome}, {n} left' }, { 'a.b': 'Ciao', 'solo.it': 'Solo italiano' });
  assert.equal(lingua(), 'en');
  assert.equal(t('a.b'), 'Hello');
  assert.equal(t('solo.it'), 'Solo italiano');
  assert.equal(t('a.c', { nome: 'Ann', n: 3 }), 'Hi Ann, 3 left');
  assert.equal(t('a.c', { nome: 'Ann' }), 'Hi Ann, {n} left');
  const avvisi = [];
  const orig = console.warn; console.warn = m => avvisi.push(m);
  try { assert.equal(t('non.esiste'), 'non.esiste'); } finally { console.warn = orig; }
  assert.equal(avvisi.length, 1);
});

test('tn: singolare e plurale', () => {
  impostaDizionari('it', { 'r.uno': '{n} risultato', 'r.altri': '{n} risultati' }, {});
  assert.equal(tn('r', 1), '1 risultato');
  assert.equal(tn('r', 0), '0 risultati');
  assert.equal(tn('r', 5), '5 risultati');
});

test('localeIntl segue la lingua', () => {
  impostaDizionari('en', {}, {});
  assert.equal(localeIntl(), 'en-GB');
  impostaDizionari('it', {}, {});
  assert.equal(localeIntl(), 'it-IT');
});

// stub minimo di DOM: elementi con attributi, selettore «[attributo]»
function elemento(attrs) {
  const a = { ...attrs };
  return {
    textContent: '', innerHTML: '',
    getAttribute: k => (k in a ? a[k] : null),
    setAttribute: (k, v) => { a[k] = v; },
    hasAttribute: k => k in a,
    attrs: a,
  };
}
const radiceCon = (elementi, html = { setAttribute() {}, attrs: {} }) => ({
  querySelectorAll: sel => { const k = sel.slice(1, -1); return elementi.filter(e => e.hasAttribute(k)); },
  documentElement: html,
});

test('applicaDom: testo, html, title, aria, placeholder, content, alt, lang', () => {
  impostaDizionari('en', { 'k.t': 'Text', 'k.h': '<b>Bold</b>', 'k.ti': 'Tip', 'k.ar': 'Aria', 'k.p': 'Ph', 'k.c': 'Meta', 'k.al': 'Alt' }, {});
  const e1 = elemento({ 'data-i18n': 'k.t' });
  const e2 = elemento({ 'data-i18n-html': 'k.h' });
  const e3 = elemento({ 'data-i18n-title': 'k.ti', 'data-i18n-aria': 'k.ar', 'data-i18n-placeholder': 'k.p', 'data-i18n-content': 'k.c', 'data-i18n-alt': 'k.al' });
  const html = elemento({});
  applicaDom(radiceCon([e1, e2, e3], html));
  assert.equal(e1.textContent, 'Text');
  assert.equal(e2.innerHTML, '<b>Bold</b>');
  assert.equal(e3.attrs.title, 'Tip');
  assert.equal(e3.attrs['aria-label'], 'Aria');
  assert.equal(e3.attrs.placeholder, 'Ph');
  assert.equal(e3.attrs.content, 'Meta');
  assert.equal(e3.attrs.alt, 'Alt');
  assert.equal(html.attrs.lang, 'en');
});

test('impostaLingua: salva e ricarica solo se cambia; storage rotto non blocca', () => {
  impostaDizionari('it', {}, {});
  const st = memoria();
  let ricaricata = 0;
  impostaLingua('en', { storage: st, ricarica: () => { ricaricata++; } });
  assert.equal(st.d['dt-lingua'], 'en');
  assert.equal(ricaricata, 1);
  impostaLingua('it', { storage: st, ricarica: () => { ricaricata++; } });
  assert.equal(ricaricata, 1, 'la lingua corrente è già «it»: nessun reload');
  const rotto = { setItem() { throw new Error('negato'); } };
  impostaLingua('en', { storage: rotto, ricarica: () => { ricaricata++; } });
  assert.equal(ricaricata, 2);
});

test('tl: in italiano restituisce il testo com\'è; in inglese cerca «lbl.<testo>» e ripiega sull\'italiano senza avvisi', () => {
  impostaDizionari('it', { 'lbl.Indirizzo': 'Indirizzo' }, {});
  assert.equal(tl('Indirizzo'), 'Indirizzo');
  assert.equal(tl('Non in dizionario'), 'Non in dizionario');
  impostaDizionari('en', { 'lbl.Indirizzo': 'Address' }, { 'lbl.Indirizzo': 'Indirizzo' });
  assert.equal(tl('Indirizzo'), 'Address');
  const avvisi = [];
  const orig = console.warn; console.warn = m => avvisi.push(m);
  try { assert.equal(tl('Nome della via'), 'Nome della via'); } finally { console.warn = orig; }
  assert.equal(avvisi.length, 0, 'un testo-dato non tradotto non è un errore');
  assert.equal(tl(undefined), undefined);
  assert.equal(tl(''), '');
});

test('applicaDom: se la chiave manca nei dizionari lascia il testo che c\'era (HTML italiano di partenza)', () => {
  impostaDizionari('it', {}, {});
  const e1 = elemento({ 'data-i18n': 'k.assente' }); e1.textContent = 'Guida';
  const e2 = elemento({ 'data-i18n-title': 'k.assente', title: 'Titolo originale' });
  const e3 = elemento({ 'data-i18n-html': 'k.assente' }); e3.innerHTML = '<b>Originale</b>';
  const avvisi = [];
  const orig = console.warn; console.warn = m => avvisi.push(m);
  try { applicaDom(radiceCon([e1, e2, e3])); } finally { console.warn = orig; }
  assert.equal(e1.textContent, 'Guida');
  assert.equal(e2.attrs.title, 'Titolo originale');
  assert.equal(e3.innerHTML, '<b>Originale</b>');
  assert.ok(avvisi.length >= 1, 'la chiave mancante resta segnalata in console');
});

test('senza localStorage la scelta si ricorda per la sessione (sessionStorage) e rilevaLingua la rilegge', () => {
  const rotto = { getItem() { throw new Error('negato'); }, setItem() { throw new Error('negato'); } };
  const sessione = memoria();
  impostaDizionari('it', {}, {});
  let ricaricata = 0;
  impostaLingua('en', { storage: rotto, sessione, ricarica: () => { ricaricata++; } });
  assert.equal(sessione.d['dt-lingua'], 'en');
  assert.equal(ricaricata, 1);
  assert.equal(rilevaLingua(rotto, { language: 'it-IT' }, sessione), 'en');
});

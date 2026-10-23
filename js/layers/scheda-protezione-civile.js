// Modello puro del Piano di emergenza della Protezione civile (Comune di Palermo): popup breve sulla mappa e sezione della scheda di destra.
// Le righe senza valore non compaiono.
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl, tn } from '../core/i18n.js';

export const FONTE = 'Fonte: Comune di Palermo, Protezione civile — Piano di emergenza (Portale Open Data, dataset 351). Aree di emergenza nel Comune di Palermo.';

// Le tre classi del piano (attesa, accoglienza, ammassamento) più due di contesto: ospedali e siti a rischio industriale.
export const CLASSI = [
  { id: 'attesa', etichetta: 'Area di attesa della popolazione', breve: 'Area di attesa', colore: '#2f9e44' },
  { id: 'accoglienza', etichetta: 'Area di ricovero e accoglienza', breve: 'Area di accoglienza', colore: '#e03131' },
  { id: 'ammassamento', etichetta: 'Area di ammassamento dei soccorritori', breve: 'Area di ammassamento', colore: '#f2c200' },
  { id: 'ospedale', etichetta: 'Ospedale', breve: 'Ospedale', colore: '#1c7ed6' },
  { id: 'rischio', etichetta: 'Sito a rischio industriale', breve: 'Rischio industriale', colore: '#7048e8' },
];
export const classe = id => CLASSI.find(c => c.id === id) ?? null;

const mq = v => (Number.isFinite(Number(v)) && Number(v) > 0
  ? (Number(v) >= 10000 ? `${(Number(v) / 10000).toLocaleString(localeIntl(), { maximumFractionDigits: 2 })} ha` : `${Number(v).toLocaleString(localeIntl())} m²`)
  : null);

export const titolo = p => classe(p.classe)?.etichetta ?? p.descrizione;

// La colonna mobile dei Vigili del Fuoco ha un tipo suo (AM VV.F.): il dettaglio sta nella descrizione del file.
const tipologia = p => p.descrizione?.split(' - ')[1] ?? null;

// Chiave stabile: i tile spezzano le feature, `id` è quello del file.
export const chiave = p => `pc:${p.id}`;

export function modelloPopup(p) {
  return {
    titolo: titolo(p),
    sottotitolo: p.numero ? t('pc.numero', { n: p.numero }) : null,
    righe: righe([['Circoscrizione', p.circoscrizione], ['Quartiere', p.quartiere], ['UPL', p.upl], ['Superficie', mq(p.sup_m2)]]),
  };
}

export function vocePc(p) {
  return {
    chiave: chiave(p), peso: 7, strato: 'protezione-civile', titolo: titolo(p), icona: 'protezione-civile', badge: p.numero ? t('pc.numero', { n: p.numero }) : undefined, sempre: true,
    gruppi: [
      { righe: righe([['Tipologia', tipologia(p)], ['Numero area', p.numero], ['Superficie', mq(p.sup_m2)], ['Note', p.nota]]) },
      { titolo: 'Dove si trova', righe: righe([['Circoscrizione', p.circoscrizione], ['Quartiere', p.quartiere], ['UPL', p.upl]]) },
    ],
    fonte: FONTE,
  };
}

// Più aree sovrapposte nello stesso punto: una sola sezione a fisarmonica; con una sola resta la sezione completa.
export function vociPc(lista) {
  if (lista.length <= 1) return lista.map(vocePc);
  return [{
    chiave: 'pc:gruppo', peso: 7, strato: 'protezione-civile', titolo: 'Piano di emergenza', icona: 'protezione-civile', badge: tn('pc.aree', lista.length), sempre: true,
    gruppi: [],
    accordion: {
      icona: 'protezione-civile', suggerimento: 'Seleziona un\'area per vedere i dettagli',
      riassunto: t('pc.riassunto', { n: lista.length, tipi: [...new Set(lista.map(p => tl(classe(p.classe)?.breve ?? p.descrizione)))].join(', ') }),
      elementi: lista.map(p => ({ titolo: titolo(p), anteprima: p.numero ? t('pc.numero', { n: p.numero }) : '', righe: vocePc(p).gruppi.flatMap(g => g.righe) })),
    },
    fonte: FONTE,
  }];
}

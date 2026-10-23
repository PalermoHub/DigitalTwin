// Modello puro del Piano di emergenza della Protezione civile (Comune di Palermo): popup breve sulla mappa e sezione della scheda di destra.
// Le righe senza valore non compaiono.
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl, tn } from '../core/i18n.js';

export const FONTE = 'Fonte: Comune di Palermo, Protezione civile — Piano di emergenza (Portale Open Data, dataset 351). Aree di emergenza nel Comune di Palermo.';

// Le tre classi del piano (attesa, accoglienza, ammassamento) più due di contesto: ospedali e siti a rischio industriale.
// Simbologia dell'Allegato B «Simbologia» del Dipartimento della Protezione Civile (v. 1.0, gennaio 2024, Tema 04): poligoni a tratteggio
// (`colore` = colore delle righe) con contorno grigio, e il simbolo blu della classe (`icona`) al centro dell'area.
// Attesa → «Aree di attesa»; accoglienza → «Assistenza» (aree di assistenza alla popolazione per attendamenti campali);
// ammassamento → «Aree di ammassamento dei soccorritori e risorse»; ospedale → «Strutture ospedaliere e socio-sanitarie».
export const CONTORNO = '#929290';
export const CLASSI = [
  { id: 'attesa', etichetta: 'Area di attesa della popolazione', breve: 'Area di attesa', colore: '#6cb6a6', icona: 'img/protezione-civile/attesa.png' },
  { id: 'accoglienza', etichetta: 'Area di ricovero e accoglienza', breve: 'Area di accoglienza', colore: '#ffb09d', icona: 'img/protezione-civile/accoglienza.png' },
  { id: 'ammassamento', etichetta: 'Area di ammassamento dei soccorritori', breve: 'Area di ammassamento', colore: '#ffe044', icona: 'img/protezione-civile/ammassamento.png' },
  { id: 'ospedale', etichetta: 'Ospedale', breve: 'Ospedale', colore: '#1c7ed6', icona: 'img/protezione-civile/ospedale.png' },
  { id: 'rischio', etichetta: 'Sito a rischio industriale', breve: 'Rischio industriale', colore: '#7048e8', icona: null }, // l'Allegato B non ha un simbolo per questa classe
];
export const classe = id => CLASSI.find(c => c.id === id) ?? null;

const mq = v => (Number.isFinite(Number(v)) && Number(v) > 0
  ? (Number(v) >= 10000 ? `${(Number(v) / 10000).toLocaleString(localeIntl(), { maximumFractionDigits: 2 })} ha` : `${Number(v).toLocaleString(localeIntl())} m²`)
  : null);

// Link universale «indicazioni stradali verso»: sul telefono si apre nell'app di navigazione, altrove nel browser.
export const urlPercorso = p => (Number.isFinite(p.lat) && Number.isFinite(p.lon)
  ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=driving`
  : null);
const rigaPercorso = p => (urlPercorso(p) ? [{ etichetta: 'Percorso', valore: t('pc.percorso'), urlValore: urlPercorso(p), colore: '#009a49', pieno: true }] : []);

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

// Con lo strato acceso l'area cliccata è la ragione del clic: la sua sezione apre il tab Luogo (peso 1, prima anche dell'edificio).
export const PESO_PRIMO = 1;
const PESO = 7;

export function vocePc(p, primo = false) {
  return {
    chiave: chiave(p), peso: primo ? PESO_PRIMO : PESO, strato: 'protezione-civile', titolo: titolo(p), icona: 'protezione-civile', badge: p.numero ? t('pc.numero', { n: p.numero }) : undefined, sempre: true,
    gruppi: [
      { righe: righe([['Tipologia', tipologia(p)], ['Numero area', p.numero], ['Superficie', mq(p.sup_m2)], ['Note', p.nota]]) },
      { titolo: 'Dove si trova', righe: [...righe([['Circoscrizione', p.circoscrizione], ['Quartiere', p.quartiere], ['UPL', p.upl]]), ...rigaPercorso(p)] },
    ],
    fonte: FONTE,
  };
}

// Più aree sovrapposte nello stesso punto: una sola sezione a fisarmonica; con una sola resta la sezione completa.
export function vociPc(lista, primo = false) {
  if (lista.length <= 1) return lista.map(p => vocePc(p, primo));
  return [{
    chiave: 'pc:gruppo', peso: primo ? PESO_PRIMO : PESO, strato: 'protezione-civile', titolo: 'Piano di emergenza', icona: 'protezione-civile', badge: tn('pc.aree', lista.length), sempre: true,
    gruppi: [],
    accordion: {
      icona: 'protezione-civile', suggerimento: 'Seleziona un\'area per vedere i dettagli',
      riassunto: t('pc.riassunto', { n: lista.length, tipi: [...new Set(lista.map(p => tl(classe(p.classe)?.breve ?? p.descrizione)))].join(', ') }),
      elementi: lista.map(p => ({ titolo: titolo(p), anteprima: p.numero ? t('pc.numero', { n: p.numero }) : '', righe: vocePc(p).gruppi.flatMap(g => g.righe) })),
    },
    fonte: FONTE,
  }];
}

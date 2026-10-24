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
export const GLOSSARIO = 'https://www.protezionecivile.gov.it/it/glossario/';
export const CONTORNO = '#929290';
export const CLASSI = [
  { id: 'attesa', etichetta: 'Area di attesa della popolazione', breve: 'Area di attesa', colore: '#6cb6a6', icona: 'img/protezione-civile/attesa.png',
    definizione: 'Luoghi di prima accoglienza per la popolazione: possono essere utilizzate piazze, slarghi, parcheggi, spazi pubblici o privati non soggetti a rischio (fuori da frane, alluvioni, crolli di strutture), raggiungibili attraverso un percorso sicuro. La popolazione riceve qui le prime informazioni sull\'evento e i primi generi di conforto, per un periodo da poche ore a qualche giorno. Fonte: Glossario della Protezione Civile.' },
  { id: 'accoglienza', etichetta: 'Area di ricovero e accoglienza', breve: 'Area di accoglienza', colore: '#ffb09d', icona: 'img/protezione-civile/accoglienza.png',
    definizione: 'Luoghi in aree sicure, vicini a risorse idriche, elettriche e fognarie, dove vengono installati i primi insediamenti abitativi per alloggiare la popolazione colpita. Devono essere facilmente raggiungibili anche da mezzi di grandi dimensioni, per consentire allestimento e gestione. Possono rientrare anche strutture ricettive (hotel, residence, campeggi). Fonte: Glossario della Protezione Civile.' },
  { id: 'ammassamento', etichetta: 'Area di ammassamento dei soccorritori', breve: 'Area di ammassamento', colore: '#ffe044', icona: 'img/protezione-civile/ammassamento.png',
    definizione: 'Zone sicure rispetto ai rischi, dove trovano sistemazione idonea soccorritori e risorse necessarie per un razionale intervento nelle zone di emergenza. Devono essere facilmente raggiungibili attraverso percorsi sicuri, anche con mezzi di grandi dimensioni, e vicine a risorse idriche, elettriche e con possibilità di smaltimento delle acque reflue. La permanenza in emergenza va da poche settimane a qualche mese. Fonte: Glossario della Protezione Civile.' },
  { id: 'ospedale', etichetta: 'Ospedale', breve: 'Ospedale', colore: '#1c7ed6', icona: 'img/protezione-civile/ospedale.png' },
  { id: 'rischio', etichetta: 'Sito a rischio industriale', breve: 'Rischio industriale', colore: '#7048e8', icona: null,
    definizione: 'La presenza sul territorio di stabilimenti industriali che utilizzano o detengono sostanze chimiche espone la popolazione e l\'ambiente al rischio industriale: un incidente può ferire le persone e danneggiare l\'ambiente. Gli effetti dipendono dalle caratteristiche, dalla concentrazione e dalla durata dell\'esposizione alle sostanze. Conoscere questi aspetti serve a ridurre il rischio al minimo. Fonte: Glossario della Protezione Civile.' }, // l'Allegato B non ha un simbolo per questa classe
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

// Numeri utili in emergenza (uguali per ogni area): su telefono un tocco apre la chiamata.
const ROSSO = '#d7263d';
const num = (etichetta, n) => ({ etichetta, valore: n, tel: n, colore: ROSSO });
export const NUMERI_EMERGENZA = [
  num('Emergenza (numero unico)', '112'), num('Vigili del Fuoco', '115'), num('Emergenza sanitaria', '118'),
  num('Polizia di Stato', '113'), num('Incendi boschivi', '1515'),
];
export const NUMERI_PROTEZIONE_CIVILE = [
  num('Protezione civile (numero verde nazionale)', '800 840 840'), num('Sala operativa Regione Siciliana', '800 404 040'),
];
// Una sola volta per scheda, anche con più aree sovrapposte.
const gruppiNumeri = () => [
  { titolo: 'In caso di emergenza', righe: [...NUMERI_EMERGENZA, { etichetta: 'Cosa dire', valore: 'Dove sei, cosa è successo, quante persone sono coinvolte e in che condizioni. Non riagganciare finché non lo dice l\'operatore.' }] },
  { titolo: 'Protezione civile', righe: NUMERI_PROTEZIONE_CIVILE },
];

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

export function vocePc(p, primo = false, conNumeri = true) {
  return {
    chiave: chiave(p), peso: primo ? PESO_PRIMO : PESO, strato: 'protezione-civile', titolo: titolo(p), icona: 'protezione-civile', badge: p.numero ? t('pc.numero', { n: p.numero }) : undefined, sempre: true,
    gruppi: [
      { righe: righe([['Tipologia', tipologia(p)], ['Numero area', p.numero], ['Superficie', mq(p.sup_m2)], ['Note', p.nota]]) },
      { titolo: 'Dove si trova', righe: [...righe([['Circoscrizione', p.circoscrizione], ['Quartiere', p.quartiere], ['UPL', p.upl]]), ...rigaPercorso(p)] },
      ...(conNumeri ? gruppiNumeri() : []),
    ],
    nota: classe(p.classe)?.definizione,
    link: classe(p.classe)?.definizione ? { testo: 'Glossario della Protezione Civile', url: GLOSSARIO, icona: 'esterno', suggerimento: 'Definizioni ufficiali dei termini di protezione civile' } : undefined,
    fonte: FONTE,
  };
}

// Più aree sovrapposte nello stesso punto: una sola sezione a fisarmonica; con una sola resta la sezione completa.
export function vociPc(lista, primo = false) {
  if (lista.length <= 1) return lista.map(p => vocePc(p, primo));
  return [{
    chiave: 'pc:gruppo', peso: primo ? PESO_PRIMO : PESO, strato: 'protezione-civile', titolo: 'Piano di emergenza', icona: 'protezione-civile', badge: tn('pc.aree', lista.length), sempre: true,
    gruppi: gruppiNumeri(),
    accordion: {
      icona: 'protezione-civile', suggerimento: 'Seleziona un\'area per vedere i dettagli',
      riassunto: t('pc.riassunto', { n: lista.length, tipi: [...new Set(lista.map(p => tl(classe(p.classe)?.breve ?? p.descrizione)))].join(', ') }),
      elementi: lista.map(p => ({ titolo: titolo(p), anteprima: p.numero ? t('pc.numero', { n: p.numero }) : '', righe: vocePc(p, false, false).gruppi.flatMap(g => g.righe) })),
    },
    fonte: FONTE,
  }];
}

// Zoom in base alla superficie dell'area (m²): le aree grandi si vedono intere, le piccole con più contesto intorno.
export const zoomPerSuperficie = mq => (Number.isFinite(mq) ? Math.max(13.5, Math.min(16, 16.2 - Math.log2(Math.max(mq, 400) / 400) * 0.45)) : 14.8);

// Filtro delle aree cliccate (per id)
export const filtroEvidenza = ids => ['in', ['get', 'id'], ['literal', ids]];

// Retino dell'Allegato B: righe oblique del colore della classe su fondo trasparente (la base resta visibile).
export function retino(colore) {
  const N = 16;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d');
  x.strokeStyle = colore;
  x.lineWidth = 3;
  for (const d of [-N, 0, N]) { x.beginPath(); x.moveTo(d, N); x.lineTo(d + N, 0); x.stroke(); }
  return x.getImageData(0, 0, N, N);
}

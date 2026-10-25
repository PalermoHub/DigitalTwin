// Legende del PRG 2004: zonizzazione e vincoli. Come lo stile (tile raster già pubblicati), le voci sono quelle della legenda
// originale di OpenDataSicilia: simbolo 16×16 (img/prg/) e testo. Voci solo informative, senza filtri.
import { tl } from '../core/i18n.js';

const ZONIZZAZIONE = [
  ['ns', 'Aree ed immobili soggetti a tutela ambientale - Netto Storico'],
  ['zto-a1', 'A1 - Manufatti storici e relative pertinenze e fondi di rilevante pregio storico ed ambientale'],
  ['zto-a2', 'A2 - Tessuti urbani storici'],
  ['zto-b0a', 'B0a - Aree urbane che ripropongono e proseguono l\'impianto urbanistico delle zone A2 facenti parte del centro urbano di Palermo'],
  ['zto-b0b', 'B0b - Aree urbane che ripropongono e proseguono l\'impianto urbanistico delle zone A2 facenti parte delle borgate'],
  ['zto-b1', 'B1 - Aree urbane caratterizzate da edilizia residenziale a bassa densità con tipologia a casa unifamiliare'],
  ['zto-b2', 'B2 - Aree urbane caratterizzate da edilizia residenziale con densità pari o inferiore a 4mc/mq.'],
  ['zto-b3', 'B3 - Aree urbane caratterizzate da edilizia residenziale con densità superiore a 4mc/mq.'],
  ['zto-b4a', 'B4A - Parte di territorio urbanizzata sulla base di piani di edilizia economica e popolare o sovvenzionata realizzate fino agli anni 50.'],
  ['zto-b4b', 'B4B - Parte di territorio urbanizzata sulla base di piani di edilizia economica e popolare o sovvenzionata realizzate dopo gli anni 50.'],
  ['zto-b5', 'B5 - Parti di territorio agricolo che hanno subito massiccia edificazione'],
  ['zto-ca', 'Ca - Aree di nuova edificazione'],
  ['zto-cb', 'Cb - Aree di nuova edificazione che discendono dal declassamento delle B1'],
  ['zto-d1', 'D1 - Aree di insediamenti produttivi esistenti'],
  ['zto-d2', 'D2 - Nuove aree per insediamenti Produttivi da assoggettare a PIP o a PE'],
  ['zto-e1', 'E1 - Parti di territorio prevalentemente pianeggianti caratterizzati da colture agricole'],
  ['zto-e2', 'E2 - Parti di territorio prevalentemente collinari caratterizzati da vegetazione di tipo spontaneo'],
  ['zto-f', 'Zone F - Spazi ed attrezzature di interesse generale'],
  ['zto-ic', 'Zone IC - Attrezzature di interesse comune'],
  ['zto-parcheggi', 'Parcheggi'],
  ['zto-istruzione', 'Istruzione'],
  ['zto-verde', 'Verde pubblico'],
  ['zto-verde-storico', 'Verde Storico'],
];

const CITTA_STORICA = ['cs', 'Città Storica'];

// il numero nel nome del file è la posizione del simbolo nello strato originale
const VINCOLI_AREALI = [
  'Area aeroportuale', 'Area Demanio Montepellegrino', 'Aree boscate artificiali', 'Aree boscate naturali',
  'Aree cave attive di coltivazione', 'Aree Cave Storiche', 'Aree di interesse archeologico', 'Aree falde acquifere',
  'Aree inondazioni', 'Aree interdette', 'Aree Qanat', 'Aree Rischio Idraulico e frana', 'Aree ristagni acqua',
  'Attività estrattiva', 'Fasce di rispetto faglie e sovrascorrimenti', 'Fascia battigia',
  'Fascia di rispetto aree boscate artificiali', 'Fascia di rispetto Aree boscate naturali',
  'Fascia di rispetto cimiteriale e depuratori', 'Fascia di rispetto corsi d\'acqua', 'Fascia di rispetto ferrovia',
  'Immobili Vincoli Legge 1089/39 - Cimiteri', 'Immobili Vincoli Legge 1089/39 - Quanat', 'Immobili Vincoli Legge 1089/39 - Ville',
  'Pozzi idrici non potabili', 'Siti di Importanza Comunitaria', 'Vincolo paesaggistico L. 1497', 'Vincolo paesaggistico L. 431',
  'Zona A - Riserva', 'Zona B - Preriserva', 'Zona B1 - Preriserva',
].map((testo, i) => [`va-${i}`, testo]);

const VINCOLI_LINEARI = ['Corsi d\'acqua', 'Corsi d\'acqua interrati', 'Faglie e Sovrascorrimenti', 'Regie Trazzere']
  .map((testo, i) => [`vl-${i}`, testo]);

// PPE (Piano Particolareggiato Esecutivo del centro storico): simboli disegnati come SVG 16×16 che ripetono quelli della legenda
// QGIS originale (tratteggi neri per la modalità di intervento, campiture a tinta unita o a punti per la tipologia edilizia)
const tratti = (d, sp, col = '#000') => {
  let linee = '';
  for (let i = -16; i <= 32; i += sp) linee += d === 'h' ? `M0 ${i}H16` : `M${i} 0L${i + (d === 'd' ? 16 : -16)} 16`;
  return `<path d="${linee}" stroke="${col}" stroke-width="0.8" fill="none"/>`;
};
const punti = (sp, col = '#000', r = 0.9, off = 2) => {
  let c = '';
  for (let y = off; y < 16; y += sp) for (let x = off + ((y / sp) % 2 && sp > 3 ? sp / 2 : 0); x < 16; x += sp) c += `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`;
  return c;
};
const campo = (fill, extra = '', bordo = 'rgba(0,0,0,.35)') => `<rect x=".5" y=".5" width="15" height="15" fill="${fill}" stroke="${bordo}"/>${extra}`;
const SIMBOLI_PPE = {
  'ppe-restauro': campo('#fff', tratti('d', 4), '#999'),
  'ppe-ristrutturazione': campo('#fff', tratti('d', 4) + tratti('r', 4), '#999'),
  'ppe-ripr-filologico': campo('#fff', tratti('d', 2.5), '#999'),
  'ppe-ripr-tipologico': campo('#fff', tratti('r', 4), '#999'),
  'ppe-dem-filologico': campo('#fff', `<path d="${[3, 6, 9, 12].map(y => `M1 ${y}H15`).join('')}" stroke="#000" stroke-width="0.8" stroke-dasharray="3 1.5" fill="none"/>`, '#999'),
  'ppe-dem-tipologico': campo('#fff', `<path d="${[2.5, 5.5, 8.5, 11.5, 14].map(y => `M1 ${y}H15`).join('')}" stroke="#000" stroke-width="0.8" stroke-dasharray="4 1" fill="none"/>`, '#999'),
  'ppe-dem-senza': campo('#fff', tratti('d', 3) + tratti('r', 3), '#999'),
  'ppe-archeologica': campo('#fff', punti(3), '#999'),
  'ppe-archeologica-dem': campo('#fff', punti(3) + tratti('d', 4) + tratti('r', 4), '#555'),
  'ppe-base': campo('#f7a74f'),
  'ppe-palazzetto': campo('#fb9a99'),
  'ppe-plurifamiliare': campo('#fb9a99', tratti('h', 3, '#e31a1c')),
  'ppe-palazzo': campo('#e31a1c'),
  'ppe-religiosi-chiese': campo('#e063f5'),
  'ppe-religiosi-conventi': campo('#c42a7a'),
  'ppe-civili-pubblici': campo('#ccffff', '', '#9ac'),
  'ppe-civili-produttivi': campo('#f4ffff', tratti('r', 3.5, '#17a6b8'), '#17a6b8'),
  'ppe-giarrusso': campo('#cc7a45'),
  'ppe-postbellica': campo('#a9b4b0'),
  'ppe-superfetazioni': campo('#fff', punti(4, '#000', 1), '#999'),
  'ppe-superf-chiese': campo('#d65cf0', punti(4, '#000', 1)),
  'ppe-superf-verde-privato': campo('#cfe8a8', punti(4, '#000', 1)),
  'ppe-superf-verde-pubblico': campo('#7fbf4f', punti(4, '#000', 1)),
  'ppe-torri': campo('#7ccbf5'),
  'ppe-mura': campo('#7ccbf5'),
  'ppe-verde-privato': campo('#cfe8a8'),
  'ppe-verde-pubblico': campo('#7fbf4f'),
};
const svgUrl = id => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">${SIMBOLI_PPE[id]}</svg>`)}`;

const PPE_MODALITA = [
  ['ppe-restauro', 'Restauro'], ['ppe-ristrutturazione', 'Ristrutturazione'], ['ppe-ripr-filologico', 'Ripristino Filologico'],
  ['ppe-ripr-tipologico', 'Ripristino Tipologico'], ['ppe-dem-filologico', 'Demolizione delle superfetazioni e ripristino filologico'],
  ['ppe-dem-tipologico', 'Demolizione delle superfetazioni e ripristino tipologico'], ['ppe-dem-senza', 'Demolizione senza ricostruzione'],
  ['ppe-archeologica', 'Area Archeologica'], ['ppe-archeologica-dem', 'Area Archeologica - Demolizione senza ricostruzione'],
];

const PPE_TIPOLOGIA = [
  ['ppe-base', 'Edilizia di Base'], ['ppe-palazzetto', 'Palazzetto'], ['ppe-plurifamiliare', 'Palazzetto Plurifamiliare'],
  ['ppe-palazzo', 'Palazzo'], ['ppe-religiosi-chiese', 'Edilizia Specialistici religiosi (chiese, oratori, cappelle)'],
  ['ppe-religiosi-conventi', 'Edilizia Specialistici religiosi (conventi, collegi, seminari)'],
  ['ppe-civili-pubblici', 'Edifici Specialistici Civili Pubblici'], ['ppe-civili-produttivi', 'Edifici Specialistici Civili Produttivi'],
  ['ppe-giarrusso', 'Edilizia Conseguente al Piano Giarrusso'], ['ppe-postbellica', 'Edilizia Postbellica'],
  ['ppe-superfetazioni', 'Superfetazioni'], ['ppe-superf-chiese', 'Superfetazioni - Chiese'],
  ['ppe-superf-verde-privato', 'Superfetazioni - Verde Privato'], ['ppe-superf-verde-pubblico', 'Superfetazioni - Verde Pubblico'],
  ['ppe-torri', 'Torri Difensive'], ['ppe-mura', 'Mura Bastioni Fortificazioni'], ['ppe-verde-privato', 'Verde Privato'],
  ['ppe-verde-pubblico', 'Verde Pubblico'],
];

// Simbolo di legenda (campione per il tooltip della scheda) della zona, dell'ambito o del vincolo trovati sotto il cursore.
// La zona è il codice ZTO del PRG (A1, B0a, F10, IC3, V2, S1…): le zone F, IC, S e V condividono il simbolo della loro famiglia.
const campionePrg = id => (id ? { legenda: 'legenda-prg', immagine: `img/prg/${id}.png` } : undefined);
const chiaveTesto = testo => String(testo ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const ZONE_CON_SIMBOLO = new Set(ZONIZZAZIONE.map(([id]) => id.slice(4)).filter(z => /^(a\d|b|ca|cb|d\d|e\d)/.test(z)));
export function campioneZona(zto) {
  const z = String(zto ?? '').toLowerCase();
  if (z === 'parcheggi') return campionePrg('zto-parcheggi');
  if (z === 'vs') return campionePrg('zto-verde-storico');
  if (ZONE_CON_SIMBOLO.has(z)) return campionePrg(`zto-${z}`);
  if (/^f\d/.test(z)) return campionePrg('zto-f');
  if (/^ic\d/.test(z)) return campionePrg('zto-ic');
  if (/^s\d/.test(z)) return campionePrg('zto-istruzione');
  if (/^v\d/.test(z)) return campionePrg('zto-verde');
  return undefined;
}
export const campioneAmbito = ambito => campionePrg(ambito === 'Netto storico' ? 'ns' : ambito === 'Centro storico' ? 'cs' : null);
export function campioneVincolo(tipo, lineare = false) {
  const voce = (lineare ? VINCOLI_LINEARI : VINCOLI_AREALI).find(([, testo]) => chiaveTesto(testo) === chiaveTesto(tipo));
  return campionePrg(voce?.[0]);
}

const el = (tag, classe, testo) => Object.assign(document.createElement(tag), { className: classe ?? '', textContent: testo ?? '' });

function riga([simbolo, testo], classe = 'prg-voce') {
  const r = el('div', classe);
  const img = el('img');
  img.src = simbolo in SIMBOLI_PPE ? svgUrl(simbolo) : `img/prg/${simbolo}.png`;
  img.alt = '';
  img.width = img.height = 16;
  r.append(img, el('span', '', tl(testo)));
  return r;
}

function legenda(classe, titolo, sezioni) {
  const l = el('div', `legenda legenda-prg ${classe}`);
  l.hidden = true;
  l.append(el('strong', '', tl(titolo)));
  for (const [sottotitolo, voci, classeRiga, classeTitolo] of sezioni) {
    if (sottotitolo) l.append(el('div', classeTitolo ?? 'prg-sezione', tl(sottotitolo)));
    l.append(...voci.map(v => riga(v, classeRiga)));
  }
  document.getElementById('legende').append(l);
  return l;
}

export const creaLegendaZonizzazione = () => legenda('lg-prg', 'Zonizzazione', [[null, ZONIZZAZIONE], [null, [CITTA_STORICA], 'prg-voce prg-voce-titolo'],
  ['PPE', [], null, 'prg-sezione prg-ppe'],
  ['Modalità Intervento', PPE_MODALITA, 'prg-voce prg-voce-sotto', 'prg-sezione prg-gruppo'],
  ['Tipologia edilizia', PPE_TIPOLOGIA, 'prg-voce prg-voce-sotto', 'prg-sezione prg-gruppo']]);
export const creaLegendaVincoli = () => legenda('lg-vincoli', 'Vincoli', [['Vincoli areali', VINCOLI_AREALI], ['Vincoli lineari', VINCOLI_LINEARI]]);

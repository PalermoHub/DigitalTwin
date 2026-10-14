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

const el = (tag, classe, testo) => Object.assign(document.createElement(tag), { className: classe ?? '', textContent: testo ?? '' });

function riga([simbolo, testo], classe = 'prg-voce') {
  const r = el('div', classe);
  const img = el('img');
  img.src = `img/prg/${simbolo}.png`;
  img.alt = '';
  img.width = img.height = 16;
  r.append(img, el('span', '', tl(testo)));
  return r;
}

function legenda(classe, titolo, sezioni) {
  const l = el('div', `legenda legenda-prg ${classe}`);
  l.hidden = true;
  l.append(el('strong', '', tl(titolo)));
  for (const [sottotitolo, voci, classeRiga] of sezioni) {
    if (sottotitolo) l.append(el('div', 'prg-sezione', tl(sottotitolo)));
    l.append(...voci.map(v => riga(v, classeRiga)));
  }
  document.getElementById('legende').append(l);
  return l;
}

export const creaLegendaZonizzazione = () => legenda('lg-prg', 'Zonizzazione', [[null, ZONIZZAZIONE], [null, [CITTA_STORICA], 'prg-voce prg-voce-titolo']]);
export const creaLegendaVincoli = () => legenda('lg-vincoli', 'Vincoli', [['Vincoli areali', VINCOLI_AREALI], ['Vincoli lineari', VINCOLI_LINEARI]]);

// Modello puro delle opere pubbliche di Palermo (BDAP-MOP, Ragioneria generale dello Stato): colori e nomi dei settori, sezioni della scheda
// di destra e tooltip. Una feature per CUP (dati/opere/opere.geojson, generato da scripts/opere.py).
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl } from '../core/i18n.js';
import { frase, nomeSoggetto } from './scheda-pnrr.js';

export { barre, euroCompatto, frase, nomeSoggetto } from './scheda-pnrr.js';

export const FONTE = 'Open BDAP, Ragioneria generale dello Stato: Monitoraggio Opere Pubbliche (MOP), progetti e localizzazione (CC BY, citando la fonte)';
const LINK_BDAP = 'https://bdap-opendata.rgs.mef.gov.it/content/progetti-opere-pubbliche-mop-totale';
const LINK_LOCALIZZAZIONE = 'https://bdap-opendata.rgs.mef.gov.it/';
const LINK_CRUSCOTTO = 'https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#opere';
// link in fondo alla tab Opere: dataset BDAP dei progetti, portale open data BDAP (anche la localizzazione), Cruscotto Italia
const LINK_FONTI = [
  { testo: 'Progetti Opere Pubbliche MOP su Open BDAP', icona: 'esterno', url: LINK_BDAP },
  { testo: 'Portale Open BDAP (localizzazione delle opere)', icona: 'esterno', url: LINK_LOCALIZZAZIONE },
  { testo: 'Opere pubbliche di Palermo su Cruscotto Italia', icona: 'esterno', url: LINK_CRUSCOTTO },
];

// [settore come nella fonte, nome breve, colore]
export const SETTORI = [
  ['INFRASTRUTTURE SOCIALI', 'Infrastrutture sociali', '#1c7ed6'],
  ['INFRASTRUTTURE DI TRASPORTO', 'Infrastrutture di trasporto', '#f08c00'],
  ['INFRASTRUTTURE AMBIENTALI E RISORSE IDRICHE', 'Ambiente e risorse idriche', '#2f9e44'],
  ['INFRASTRUTTURE DEL SETTORE ENERGETICO', 'Energia', '#e03131'],
  ["OPERE, IMPIANTI ED ATTREZZATURE PER ATTIVITA' PRODUTTIVE, E LA RICERCA E L'IMPRESA SOCIALE", 'Attività produttive e ricerca', '#d6336c'],
  ["INFRASTRUTTURE PER L'ATTREZZATURA DI AREE PRODUTTIVE", 'Aree produttive', '#7048e8'],
  ['ISTRUZIONE, FORMAZIONE E SOSTEGNI PER IL MERCATO DEL LAVORO', 'Istruzione e formazione', '#0c8599'],
  ['INFRASTRUTTURE PER TELECOMUNICAZIONI E TECNOLOGIE INFORMATICHE', 'Telecomunicazioni e informatica', '#9c36b5'],
  ['RICERCA SVILUPPO TECNOLOGICO ED INNOVAZIONE', 'Ricerca e innovazione', '#5c940d'],
  ["SERVIZI PER LA P.A. E PER LA COLLETTIVITA'", 'Servizi alla collettività', '#868e96'],
];
export const COLORE_ALTRO = '#adb5bd';
const settoreDi = settore => SETTORI.find(([c]) => c === settore);
export const coloreSettore = settore => settoreDi(settore)?.[2] ?? COLORE_ALTRO;
export const nomeSettore = settore => settoreDi(settore)?.[1] ?? frase(settore) ?? 'n.d.';

// Fasi ricavate dalle date effettive dichiarate (scripts/opere.py): nell'ordine dall'ultima alla prima
export const FASI = ['In funzione', 'Lavori conclusi', 'Esecuzione terminata', 'In esecuzione', 'In progettazione', 'Fase non indicata'];
export const COLORI_FASE = {
  'In funzione': '#2f9e44', 'Lavori conclusi': '#74b816', 'Esecuzione terminata': '#a9c23f', 'In esecuzione': '#e8590c',
  'In progettazione': '#1c7ed6', 'Fase non indicata': '#868e96',
};
export const COLORI_STATO = { ATTIVO: '#e8590c', CHIUSO: '#868e96' };
const COLORE_CUP = '#7048e8';

const PRECISIONE = {
  civico: 'Indirizzo (civico)',
  via: 'Solo la via: posizione approssimata',
};

const euro = v => (v != null && Number.isFinite(Number(v)) && Number(v) !== 0
  ? Number(v).toLocaleString(localeIntl(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  : null);   // 0 = non indicato nella fonte

// Il titolare è un filtro: il clic mostra in mappa solo le sue opere (layer opere.js, evento `dt:filtro`).
export const filtroTitolare = valore => ({ strato: 'opere', campo: 'titolare', valore });

export const titoloOpera = p => frase(p.titolo) ?? p.cup;

const MAX_TITOLO_TOOLTIP = 90;
export const accorcia = (s, max = MAX_TITOLO_TOOLTIP) => (s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s);

// MapLibre restituisce gli array delle proprietà come testo JSON
const altriTitolari = p => {
  let v = p.altri_titolari;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = [v]; } }
  return Array.isArray(v) ? v : [];
};

export function righeAnagrafica(p) {
  return righe([
    ['Titolare', nomeSoggetto(p.titolare)],
    ['Altri titolari', altriTitolari(p).length ? altriTitolari(p).map(nomeSoggetto).join(', ') : null],
    ['Stato del CUP', p.stato ? tl(frase(p.stato)) : null],
    ['Fase (dalle date dichiarate)', p.fase ? tl(p.fase) : null],
    ['Settore', p.settore ? tl(nomeSettore(p.settore)) : null], ['Sottosettore', frase(p.sottosettore) !== frase(p.settore) ? frase(p.sottosettore) : null],
    ['Tipologia', frase(p.tipologia)], ['Natura', frase(p.natura)], ['Categoria', frase(p.categoria)],
    ['Indirizzo', p.indirizzo], ['Posizione', PRECISIONE[p.precisione] ? tl(PRECISIONE[p.precisione]) : null],
    ['CUP', p.cup],
  ]).map(r => {
    if (r.etichetta === 'CUP') return { ...r, colore: COLORE_CUP, urlValore: `https://opencup.gov.it/portale/progetto/-/cup/${encodeURIComponent(p.cup)}` };
    if (r.etichetta === 'Titolare') return { ...r, filtro: filtroTitolare(p.titolare) };
    if (r.etichetta === 'Stato del CUP' && COLORI_STATO[p.stato]) return { ...r, colore: COLORI_STATO[p.stato] };
    if (r.etichetta === 'Fase (dalle date dichiarate)' && COLORI_FASE[p.fase]) return { ...r, colore: COLORI_FASE[p.fase] };
    return r;
  });
}

export const righeCosti = p => righe([
  ['Costo dei lavori previsto', euro(p.costo_previsto)], ['Costo dei lavori effettivo', euro(p.costo_effettivo)],
  ['Somme a disposizione previste', euro(p.somme_previste)], ['Oneri di investimento previsti', euro(p.oneri_previsti)],
  ['Finanziamenti statali', euro(p.fin_statali)], ['Finanziamenti europei', euro(p.fin_europei)], ['Finanziamenti di enti territoriali', euro(p.fin_enti)],
  ['Finanziamenti privati', euro(p.fin_privati)], ['Altre fonti di finanziamento', euro(p.fin_altri)], ['Finanziamenti da reperire', euro(p.da_reperire)],
  ['Economie', euro(p.economie)],
]);

export const righeDate = p => righe([
  ['Fine progettazione effettiva', p.prog_fine_eff],
  ['Inizio esecuzione prevista', p.esec_inizio_prev], ['Inizio esecuzione effettiva', p.esec_inizio_eff],
  ['Fine esecuzione prevista', p.esec_fine_prev], ['Fine esecuzione effettiva', p.esec_fine_eff],
  ['Fine conclusione prevista', p.concl_fine_prev], ['Fine conclusione effettiva', p.concl_fine_eff],
  ['Inizio funzionalità effettivo', p.funz_inizio_eff],
]);

export function descrizioneOpera(p) {
  const d = frase(p.dettagli);
  return d && d.toLowerCase() !== (frase(p.titolo) ?? '').toLowerCase() ? d : undefined;
}

export function voceScheda(p) {
  const gruppi = [{ righe: righeAnagrafica(p) }, { titolo: 'Costi e finanziamenti dichiarati', righe: righeCosti(p) }, { titolo: 'Date', righe: righeDate(p) }]
    .filter(g => g.righe.length);
  return {
    chiave: `opere-${p.cup}`,
    peso: 98, // tab «Opere» della scheda (core/scheda.js)
    strato: 'opere',
    titolo: titoloOpera(p),
    icona: 'cantiere',
    badge: p.fase ? tl(p.fase) : t('opere.badge'),
    sempre: true,
    gruppi,
    testo: descrizioneOpera(p),
    link: LINK_FONTI,
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloTooltipOpera(p) {
  return {
    titolo: accorcia(titoloOpera(p)),
    sottotitolo: [p.fase ? tl(p.fase) : null, p.stato ? tl(frase(p.stato)) : null].filter(Boolean).join(' · '),
    pallino: coloreSettore(p.settore),
    righe: righe([['Titolare', nomeSoggetto(p.titolare)], ['Costo dei lavori previsto', euro(p.costo_previsto)], ['Indirizzo', p.indirizzo]]),
  };
}

// ---------- sezioni della tab Opere ----------

// Sezione in cima alla tab con i due menu a tendina per aprire la scheda di ogni opera senza punto sulla mappa; `dinamico` li disegna
// (scheda-opere-dom.js). I titolari sono [{ voce, n, progetti }] di elenco.json.
export function voceTendina(titolari, dinamico, sintesi = null) {
  const totale = titolari.reduce((s, x) => s + x.n, 0);
  return {
    chiave: 'opere-tendina',
    peso: 97, // prima delle schede delle opere cliccate (98) e della sintesi (99)
    strato: 'opere',
    titolo: 'Opere senza un punto sulla mappa',
    icona: 'cantiere',
    badge: String(totale),
    sempre: true,
    gruppi: [],
    dinamico: () => dinamico(titolari, sintesi),
  };
}

// Sezione della tab con i numeri e i grafici dell'insieme delle opere di Palermo; `dinamico` li disegna (scheda-opere-dom.js).
export function voceSintesi(sintesi, dinamico) {
  return {
    chiave: 'opere-sintesi',
    peso: 99,
    strato: 'opere',
    titolo: 'Opere pubbliche a Palermo',
    icona: 'cantiere',
    badge: sintesi.estrazione ? String(sintesi.estrazione).slice(-4) : undefined,
    sempre: true,
    gruppi: [],
    dinamico: () => dinamico(sintesi),
    link: LINK_FONTI,
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

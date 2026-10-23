// Modello puro del Programma triennale dei lavori pubblici 2026-2028 del Comune di Palermo (DCC 553/2026): colori e nomi di annualità e settori,
// sezioni della tab «Piano triennale» della scheda e tooltip. Dati in dati/piano-triennale/ (generati da scripts/piano_triennale.py).
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl } from '../core/i18n.js';
import { euroCompatto, frase } from './scheda-pnrr.js';

export { barre, euroCompatto, frase } from './scheda-pnrr.js';

export const FONTE = 'Comune di Palermo: Programma triennale dei lavori pubblici 2026-2028, schede e allegati (DCC 553/2026); estrazione e georeferenziazione OpenDataSicilia con Claude AI';
const LINK_FONTI = [
  { testo: 'Mappa originale del Piano triennale (OpenDataSicilia)', icona: 'esterno', url: 'https://opendatasicilia.github.io/piano_triennale_26_28/' },
  { testo: 'OpenCUP: portale dei Codici Unici di Progetto', icona: 'esterno', url: 'https://www.opencup.gov.it/' },
];
export const COLORE = '#c2255c';
export const COLORE_APPROSSIMATO = '#808080';

// [classe, nome, colore]: stesse annualità e colori della mappa originale
export const ANNUALITA = [
  [1, 'I annualità (2026)', '#b40000'],
  [2, 'II annualità (2027)', '#f09332'],
  [3, 'III annualità (2028)', '#dcdc00'],
];
export const coloreClasse = classe => ANNUALITA.find(([c]) => c === Number(classe))?.[2] ?? COLORE_APPROSSIMATO;
export const nomeClasse = classe => ANNUALITA.find(([c]) => c === Number(classe))?.[1] ?? 'Annualità non indicata';

// [codice, nome breve, colore]: il codice è il primo gruppo del codice sottosettore («01.01 - Stradali»)
export const SETTORI = [
  ['01', 'Trasporti', '#1c7ed6'],
  ['02', 'Ambiente e risorse idriche', '#2f9e44'],
  ['03', 'Energia', '#e03131'],
  ['04', 'Aree produttive', '#7048e8'],
  ['05', 'Infrastrutture sociali', '#f08c00'],
  ['06', 'Turismo, commercio e ricerca', '#0c8599'],
  ['10', 'Altri servizi', '#868e96'],
];
const settoreDi = codice => SETTORI.find(([c]) => c === codice);
export const coloreSettore = codice => settoreDi(codice)?.[2] ?? '#adb5bd';
export const nomeSettore = codice => settoreDi(codice)?.[1] ?? 'n.d.';

export const euro = v => (v != null && Number.isFinite(Number(v)) && Number(v) !== 0
  ? Number(v).toLocaleString(localeIntl(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  : null);   // 0 = nessun importo in quell'anno

export const titoloIntervento = o => frase(o.titolo) ?? o.cod;
const MAX_TITOLO_TOOLTIP = 90;
export const accorcia = (s, max = MAX_TITOLO_TOOLTIP) => (s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s);

// MapLibre restituisce i booleani e i numeri delle proprietà così come sono, ma ogni geometria porta uno o più codici separati da «;»
export const codici = cod => String(cod ?? '').split(';').map(c => c.trim()).filter(Boolean);

// Un intervento dell'elenco per codice (dati/piano-triennale/elenco.json)
export const indicePerCodice = elenco => new Map(elenco.map(o => [o.cod, o]));

export function righeAnagrafica(o) {
  const cup = o.cup ?? null;
  return righe([
    ['Codice intervento', o.cod], ['Settore', o.settore ? nomeSettore(o.settore) : null], ['Sottosettore', o.sottosettore],
    ['Tipologia', o.tipologia], ['Priorità', o.priorita], ['RUP', o.rup],
    ['Affidamento previsto', o.affidamento], ['Lotto funzionale', o.lotto ? 'Sì' : null], ['Lavoro complesso', o.complesso ? 'Sì' : null],
    ['CUI', o.cui], ['CUP', cup], ['Stato del CUP', cup ? null : o.cup_stato],
    ['Circoscrizione', o.circoscrizione], ['Quartiere', o.quartiere], ['UPL', o.upl],
    ['Posizione sulla mappa', o.localizzato ? null : 'Non localizzato: compare solo nella scheda'],
  ]).map(r => (r.etichetta === 'CUP' ? { ...r, colore: COLORE, urlValore: o.opencup ?? `https://www.opencup.gov.it/portale/progetto/-/cup/${encodeURIComponent(o.cup)}` } : r));
}

export const righeImporti = o => righe([
  ['Primo anno (2026)', euro(o.c1)], ['Secondo anno (2027)', euro(o.c2)], ['Terzo anno (2028)', euro(o.c3)],
  ['Totale del triennio', euro(o.triennio)], ['Annualità successive', euro(o.successive)], ['Importo complessivo', euro(o.complessivo)],
  ['Capitale privato', euro(o.privato)], ['Tipologia del capitale privato', o.privato_tipologia], ['Valore degli immobili (scheda C)', euro(o.immobili)],
  ['Scadenza ultima rata del mutuo', o.mutuo_scadenza], ['Intervento aggiunto o variato', o.variato],
]);

export const righeFonti = o => righe([
  ['Tipologia di risorsa', o.fonti?.risorsa], ['Descrizione del finanziamento', o.fonti?.descrizione],
  ['Importo 2025', euro(o.fonti?.importo_2025)], ['Importo totale', euro(o.fonti?.importo_totale)], ['Progressivo', o.fonti?.prog],
]);

export const righeAnnuale = o => righe([
  ['Importo dell’annualità 2026', euro(o.annuale?.importo)], ['Finalità', o.annuale?.finalita], ['Livello di progettazione', o.annuale?.progettazione],
  ['Conformità urbanistica', o.annuale?.conformita_urbanistica], ['Verifica dei vincoli ambientali', o.annuale?.vincoli_ambientali],
  ['Stazione appaltante', o.annuale?.stazione_appaltante], ['Codice AUSA', o.annuale?.ausa], ['CIG dell’accordo quadro', o.annuale?.cig_accordo_quadro],
]);

// CUP «candidato»: proposta da verificare, il CUP ufficiale non è stato modificato
export const righeCandidato = o => (o.cup_candidato?.cup ? righe([
  ['CUP candidato', o.cup_candidato.cup], ['Affidabilità', o.cup_candidato.affidabilita],
  ['Importo coincidente', o.cup_candidato.importo_coincide == null ? null : (o.cup_candidato.importo_coincide ? 'Sì' : 'No')],
  ['Descrizione in OpenCUP', o.cup_candidato.descrizione], ['Costo in OpenCUP', euro(o.cup_candidato.costo)], ['Anno', o.cup_candidato.anno],
]).map(r => (r.etichetta === 'CUP candidato' && o.cup_candidato.link ? { ...r, colore: COLORE, urlValore: o.cup_candidato.link } : r)) : []);

export function voceScheda(o) {
  const gruppi = [
    { righe: righeAnagrafica(o) }, { titolo: 'Importi del Programma', righe: righeImporti(o) },
    { titolo: 'Fonti di finanziamento', righe: righeFonti(o) }, { titolo: 'Elenco annuale 2026', righe: righeAnnuale(o) },
    { titolo: 'CUP candidato (proposta da verificare)', righe: righeCandidato(o) },
  ].filter(g => g.righe.length);
  return {
    chiave: `piano-${o.cod}`,
    peso: 102, // tab «Piano triennale» della scheda (core/scheda-modello.js)
    strato: 'piano-triennale',
    titolo: titoloIntervento(o),
    icona: 'piano',
    badge: o.triennio ? euroCompatto(o.triennio) : t('piano.badge'),
    sempre: true,
    gruppi,
    testo: o.descrizione && frase(o.descrizione).toLowerCase() !== (frase(o.titolo) ?? '').toLowerCase() ? frase(o.descrizione) : undefined,
    link: LINK_FONTI,
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloTooltip(p) {
  const n = Number(p.n) || codici(p.cod).length;
  return {
    titolo: accorcia(frase(p.titolo) ?? p.cod ?? ''),
    // settore col pallino della legenda (campione); l'annualità è l'etichetta colorata come sulla mappa
    sottotitolo: [p.settore ? nomeSettore(p.settore) : null, p.origine === 'approssimato' ? 'Posizione approssimata' : null].filter(Boolean).map(tl).join(' · '),
    badge: Number(p.classe) ? { testo: tl(nomeClasse(p.classe)), colore: coloreClasse(p.classe) } : undefined,
    righe: righe([['Importo del triennio', euro(p.importo)], ['Interventi sulla geometria', n > 1 ? n : null], ['Quartiere', p.quartiere], ['Circoscrizione', p.circoscrizione]]),
    elenco: [euro(p.importo) ? `${tl('Importo del triennio')}: ${euro(p.importo)}` : null, p.quartiere ? `${tl('Quartiere')}: ${p.quartiere}` : null].filter(Boolean),
    suggerimento: t('piano.tooltipSuggerimento'),
  };
}

// ---------- sezioni della tab Piano triennale ----------

// Sezione in cima alla tab: i due menu a tendina (settore, intervento) per aprire la scheda di ogni intervento, anche di quelli senza geometria.
export function voceTendina(elenco, dinamico) {
  return {
    chiave: 'piano-tendina',
    peso: 101, // prima delle schede degli interventi cliccati (102) e della sintesi (103)
    strato: 'piano-triennale',
    titolo: 'Cerca un intervento del Programma',
    icona: 'piano',
    badge: String(elenco.length),
    sempre: true,
    gruppi: [],
    dinamico: () => dinamico(elenco),
  };
}

// Sezione con i numeri e i grafici dell'insieme del Programma; `dinamico` li disegna (scheda-piano-triennale-dom.js).
export function voceSintesi(sintesi, dinamico) {
  return {
    chiave: 'piano-sintesi',
    peso: 103,
    strato: 'piano-triennale',
    titolo: 'Programma triennale 2026-2028',
    icona: 'piano',
    badge: euroCompatto(sintesi.importo_triennio),
    sempre: true,
    gruppi: [],
    dinamico: () => dinamico(sintesi),
    link: LINK_FONTI,
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

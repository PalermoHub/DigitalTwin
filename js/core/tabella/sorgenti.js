// js/core/tabella/sorgenti.js
// I layer che la tabella sa leggere. Si interrogano gli strati «hit» (sempre presenti e invisibili): `visibili` dice
// quali strati disegnati devono essere accesi perché le righe abbiano senso.
import { t } from '../i18n.js';

export const LIMITE_RIGHE = 20000; // oltre, la tabella chiede di restringere la vista
export const MAX_DOM = 2000; // righe messe davvero nella pagina

const progetto = t('tabella.fonte.progetto');
const comune = t('tabella.fonte.comune');
const confini = t('tabella.fonte.confini');
const istat = t('tabella.fonte.istat');
const amap = t('tabella.fonte.amap');
const prg = t('tabella.fonte.prg');
const omi = t('tabella.fonte.omi');
const incendi = t('tabella.fonte.incendi');
const calore = t('tabella.fonte.calore');
const pai = t('tabella.fonte.pai');
const alberi = t('tabella.fonte.alberi');
const turismo = t('tabella.fonte.monumenti');
const esterna = t('tabella.fonte.esterna');
const sicurezza = t('tabella.fonte.incidenti');
const mef = t('tabella.fonte.mef');

export const SORGENTI = [
  { id: 'colonnine', nome: t('tabella.layer.colonnine'), strati: ['colonnine-hit'], visibili: ['colonnine-punti'], chiave: p => p.id, fonte: progetto, approssimata: false, esporta: true, colore: '#2b8a3e' },
  { id: 'scuole', nome: t('tabella.layer.scuole'), strati: ['scuole-hit-punti'], visibili: ['scuole-punti'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#1971c2' },
  { id: 'uffici', nome: t('tabella.layer.uffici'), strati: ['uffici-hit'], visibili: ['uffici-punti'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#a61e4d' },
  { id: 'fermate', nome: t('tabella.layer.fermate'), strati: ['trasporto-hit-fermate'], visibili: ['trasporto-fermate'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#364fc7' },
  // il campo si chiama davvero «Paricella» nei dati del catasto
  { id: 'catasto', nome: t('tabella.layer.catasto'), strati: ['catasto-hit'], visibili: ['catasto'], chiave: p => (p.Foglio != null ? `${p.Foglio}/${p.Paricella}` : null), fonte: comune, approssimata: true, esporta: true, colore: '#2f9e44' },
  { id: 'incidenti', nome: t('tabella.layer.incidenti'), strati: ['sicurezza-hit-incidenti'], visibili: ['sicurezza-incidenti'], fonte: t('tabella.fonte.incidenti'), approssimata: true, esporta: true, colore: '#c92a2a' },
  // confini: chiave dal nome (o dal codice di sezione). `colonne` dice quali campi mostrare e in che ordine; gli altri restano nel menu Colonne
  { id: 'circoscrizioni', nome: t('tabella.layer.circoscrizioni'), strati: ['confini-circoscrizioni-hit'], visibili: ['confini-circoscrizioni'], chiave: p => p.Circoscrizione, colonne: ['Circoscrizione', 'Area'], fonte: confini, approssimata: true, esporta: true, colore: '#c2255c' },
  { id: 'quartieri', nome: t('tabella.layer.quartieri'), strati: ['confini-quartieri-hit'], visibili: ['confini-quartieri'], chiave: p => (p.Quartiere != null ? `${p.Circoscrizione}/${p.Quartiere}` : null), colonne: ['Quartiere', 'Circoscrizione', 'Area'], fonte: confini, approssimata: true, esporta: true, colore: '#9c36b5' },
  { id: 'upl', nome: t('tabella.layer.upl'), strati: ['confini-upl-fill'], visibili: ['confini-upl'], chiave: p => (p.UPL != null ? `${p.Quartiere}/${p.UPL}` : null), colonne: ['UPL', 'Quartiere', 'Circoscrizione', 'Area'], fonte: confini, approssimata: true, esporta: true, colore: '#6741d9' },
  { id: 'amap-distretti', nome: t('tabella.layer.amap'), strati: ['amap-distretti-hit'], visibili: ['confini-amap'], chiave: p => p.DISTRETTO, colonne: ['DISTRETTO'], fonte: amap, approssimata: false, esporta: true, colore: '#d32f2f' },
  { id: 'sezioni', nome: t('tabella.layer.sezioni'), strati: ['confini-sezioni-hit'], visibili: ['confini-sezioni'], chiave: p => p.SEZ21_ID, colonne: ['SEZ21_ID', 'Circoscrizione', 'Quartiere', 'UPL', 'POP21', 'Pop_2022', 'FAM21', 'ABI21', 'EDI21', 'Area'], fonte: istat, approssimata: true, esporta: true, colore: '#0b7285' },
  // monumenti: solo i luoghi singoli (a zoom bassi quelli raccolti nei cerchi dei gruppi non sono interrogabili)
  { id: 'monumenti', nome: t('tabella.layer.monumenti'), strati: ['monumenti-hit-punti'], visibili: ['monumenti-punti', 'monumenti-poli', 'monumenti-cluster'], chiave: p => p.id, colonne: ['nome', 'categoria', 'url', 'fonte'], fonte: turismo, approssimata: false, esporta: true, colore: '#4a5d8a' },
  { id: 'alberi', nome: t('tabella.layer.alberi'), strati: ['alberi-hit-punti'], visibili: ['alberi-punti'], chiave: p => p.id, colonne: ['nome', 'specie', 'localita', 'altezza', 'circonferenza', 'altitudine', 'insieme', 'criteri', 'dichiarato', 'scheda'], fonte: alberi, approssimata: false, esporta: true, colore: '#2f9e44' },
  { id: 'fontanelle', nome: t('tabella.layer.fontanelle'), strati: ['fontanelle-hit-punti'], visibili: ['fontanelle-punti'], chiave: p => p.id, colonne: ['denominazione', 'indirizzo', 'civico', 'tipo_ubicazione', 'quartiere', 'upl', 'circoscrizione', 'note'], fonte: comune, approssimata: false, esporta: true, colore: '#1c7ed6' },
  { id: 'seggi', nome: t('tabella.layer.seggi'), strati: ['seggi-hit-punti'], visibili: ['seggi-punti', 'seggi-poli'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#0c8599' },
  { id: 'immobili', nome: t('tabella.layer.immobili'), strati: ['immobili-hit'], visibili: ['immobili'], chiave: p => p.fid, colonne: ['TIPO', 'SUBTIPO', 'CATEGORIA', 'INDIRIZZO', 'NUMERO_CIVICO', 'FOGLIO', 'PLLA', 'SUB', 'Quartiere', 'UPL_nome', 'circoscrizione'], fonte: comune, approssimata: true, esporta: true, colore: '#868e96' },
  // sicurezza stradale: si interrogano gli strati disegnati (accesi) e non gli «hit», che partono da zoom più alti
  { id: 'sicurezza-archi', nome: t('tabella.layer.archi'), strati: ['sicurezza-archi'], visibili: ['sicurezza-archi'], chiave: p => p.arco_id, colonne: ['nome', 'highway', 'classe', 'Quartiere', 'UPL', 'Circoscrizione', 'lunghezza_m', 'n_incidenti', 'tasso_km', 'tasso_affidabile', 'via_incidenti', 'via_mortali', 'via_km', 'via_rango'], fonte: sicurezza, approssimata: true, esporta: true, colore: '#f46d43' },
  { id: 'sicurezza-pericolose', nome: t('tabella.layer.pericolose'), strati: ['sicurezza-pericolose'], visibili: ['sicurezza-pericolose'], chiave: p => p.arco_id, colonne: ['via_rango', 'nome', 'via_incidenti', 'via_mortali', 'via_km', 'via_gravita_km', 'Quartiere', 'UPL', 'Circoscrizione'], fonte: sicurezza, approssimata: true, esporta: true, colore: '#67000d' },
  { id: 'sicurezza-hotspot', nome: t('tabella.layer.hotspot'), strati: ['sicurezza-hotspot'], visibili: ['sicurezza-hotspot'], chiave: p => p.cell_id, colonne: ['cell_id', 'n_incidenti', 'gravita_tot', 'livello_gravita', 'livello_conteggio'], fonte: sicurezza, approssimata: true, esporta: true, colore: '#a50026' },
  // `filtro` toglie le feature di uno strato condiviso (le linee bus e tram stanno nello stesso strato «hit»)
  { id: 'trasporto-bus', nome: t('tabella.layer.bus'), strati: ['trasporto-hit-linee'], visibili: ['trasporto-bus'], filtro: p => p.tipo === 'bus', chiave: p => p.id, colonne: ['numero', 'nome', 'direzione', 'da', 'a'], fonte: comune, approssimata: false, esporta: true, colore: '#e8590c' },
  { id: 'trasporto-tram', nome: t('tabella.layer.tram'), strati: ['trasporto-hit-linee'], visibili: ['trasporto-tram'], filtro: p => p.tipo === 'tram', chiave: p => p.id, colonne: ['numero', 'nome', 'direzione', 'da', 'a'], fonte: comune, approssimata: false, esporta: true, colore: '#c92a2a' },
  { id: 'incendi', nome: t('tabella.layer.incendi'), strati: ['incendi-hit'], visibili: ['incendi-fill'], chiave: p => (p.id != null ? `${p.anno}/${p.id}` : null), colonne: ['anno', 'data', 'localita', 'luogo_inizio', 'tipo_evento', 'uso', 'sup_ha', 'sup_boscata_ha', 'sup_non_boscata_ha', 'durata_min', 'squadre_aib', 'feriti', 'periti'], fonte: incendi, approssimata: true, esporta: true, colore: '#e03131' },
  { id: 'civici', nome: t('tabella.layer.civici'), strati: ['civici-hit'], visibili: ['civici'], chiave: p => p.PROGRESSIVO_SNC, colonne: ['Odonimo', 'Civico', 'Esponente', 'Quartiere', 'UPL', 'Circoscrizione'], fonte: comune, approssimata: false, esporta: true, colore: '#495057' },
  { id: 'omi', nome: t('tabella.layer.omi'), strati: ['omi-hit'], visibili: ['omi'], chiave: p => p.fid, colonne: ['Zona', 'Zona_Descr', 'Microzona', 'Descr_Tipologia', 'Fascia', 'Fascia_Descr', 'Compr_min', 'Compr_max', 'Loc_min', 'Loc_max', 'Stato', 'Anno_Semestre'], fonte: omi, approssimata: true, esporta: true, colore: '#f08c00' },
  { id: 'prg', nome: t('tabella.layer.prg'), strati: ['prg-zto-hit'], visibili: ['prg-zto'], chiave: p => p.fid, colonne: ['ZTO', 'DESCRIZION', 'NOTE'], fonte: prg, approssimata: true, esporta: true, colore: '#d6336c' },
  { id: 'prg-ppe', nome: t('tabella.layer.prgPpe'), strati: ['prg-cs-hit'], visibili: ['prg-ppe'], chiave: p => p.fid, colonne: ['Comune', 'Circoscriz', 'Superficie', 'Popolazion'], fonte: prg, approssimata: true, esporta: true, colore: '#ae3ec9' },
  { id: 'vincoli-areali', nome: t('tabella.layer.vincoliAreali'), strati: ['prg-va-hit'], visibili: ['prg-va'], chiave: p => p.fid, colonne: ['tipo', 'descrizone', 'note'], fonte: prg, approssimata: true, esporta: true, colore: '#862e9c' },
  { id: 'vincoli-lineari', nome: t('tabella.layer.vincoliLineari'), strati: ['prg-vl-hit'], visibili: ['prg-vl'], chiave: p => p.fid, colonne: ['TIPO', 'DESCRIZION', 'NOTE'], fonte: prg, approssimata: true, esporta: true, colore: '#5f3dc4' },
  { id: 'isole-calore', nome: t('tabella.layer.calore'), strati: ['isole-calore-hit'], visibili: ['isole-calore-fill'], chiave: p => p.sez, colonne: ['sez', 'circoscrizione', 'Quartiere', 'UPL_nome', 'LST_2025', 'LST_2024', 'LST_2023', 'LST_2022', 'LST_2021', 'LST_2020', 'LST_2019'], fonte: calore, approssimata: true, esporta: true, colore: '#fd7e14' },
  // beni dichiarati al MEF: edifici (poligoni) e beni senza edificio (punti); le colonne sono i campi piatti, il JSON `beni` resta nella scheda
  { id: 'mef-immobili', nome: t('tabella.layer.mef'), strati: ['mef-immobili-hit', 'mef-immobili-hit-punti'], visibili: ['mef-immobili-fill', 'mef-immobili-linea', 'mef-immobili-punti'], chiave: p => p.id_poligono ?? p.id_edificio ?? p.id_bene ?? null, colonne: ['tipologia', 'indirizzo', 'catastale', 'superficie_mq', 'n_beni', 'forma', 'posizione', 'anno'], fonte: mef, approssimata: false, esporta: true, colore: '#b5651d' },
  { id: 'popolazione', nome: t('tabella.layer.popolazione'), strati: ['pop-hit'], visibili: ['pop-fill'], chiave: p => p.SEZ21_ID, colonne: ['SEZ21_ID', 'Circoscrizione', 'Quartiere', 'UPL', 'POP21', 'Pop_2022', 'FAM21', 'ABI21', 'EDI21', 'Area'], fonte: istat, approssimata: true, esporta: true, colore: '#1c7ed6' },
];

// I temi del PAI vengono dal manifest (pai/pai.json), che si legge a caricamento: li registra js/layers/pai.js.
export function registraSorgenti(nuove) {
  for (const n of nuove) if (!SORGENTI.some(s => s.id === n.id)) SORGENTI.push(n);
}

// I layer che l'utente aggiunge (file, WFS, ArcGIS, RNDT) sono GeoJSON con tre strati: poligoni, linee e punti. Nascono e spariscono mentre l'app gira.
export const sorgenteEsterna = e => ({
  id: e.id, nome: e.nome, strati: e.strati, visibili: e.strati, esterna: true, fonte: esterna, approssimata: true, esporta: true, colore: '#868e96',
});

// Allinea il registro all'elenco corrente dei layer esterni; ritorna ciò che è entrato e ciò che è uscito.
export function sincronizzaEsterne(elenco) {
  const ora = new Map(elenco.map(e => [e.id, e]));
  const uscite = SORGENTI.filter(s => s.esterna && !ora.has(s.id));
  for (const s of uscite) SORGENTI.splice(SORGENTI.indexOf(s), 1);
  const entrate = [];
  for (const [id, e] of ora) {
    const gia = SORGENTI.find(s => s.id === id);
    if (gia) { gia.nome = e.nome; gia.strati = e.strati; gia.visibili = e.strati; continue; }
    const nuova = sorgenteEsterna(e);
    SORGENTI.push(nuova);
    entrate.push(nuova);
  }
  return { entrate, uscite: uscite.map(s => s.id) };
}

export const sorgentePer = id => SORGENTI.find(s => s.id === id);

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

export const SORGENTI = [
  { id: 'colonnine', nome: t('tabella.layer.colonnine'), strati: ['colonnine-hit'], visibili: ['colonnine-punti'], chiave: p => p.id, fonte: progetto, approssimata: false, esporta: true, colore: '#2b8a3e' },
  { id: 'scuole', nome: t('tabella.layer.scuole'), strati: ['scuole-hit-punti'], visibili: ['scuole-punti'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#1971c2' },
  { id: 'uffici', nome: t('tabella.layer.uffici'), strati: ['uffici-hit'], visibili: ['uffici-punti'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#a61e4d' },
  { id: 'fermate', nome: t('tabella.layer.fermate'), strati: ['trasporto-hit-fermate'], visibili: ['trasporto-fermate'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#364fc7' },
  // il campo si chiama davvero «Paricella» nei dati del catasto
  { id: 'catasto', nome: t('tabella.layer.catasto'), strati: ['catasto-hit'], visibili: ['catasto'], chiave: p => (p.Foglio != null ? `${p.Foglio}/${p.Paricella}` : null), fonte: comune, approssimata: true, esporta: true, colore: '#2f9e44' },
  { id: 'incidenti', nome: t('tabella.layer.incidenti'), strati: ['sicurezza-hit-incidenti'], visibili: ['sicurezza-incidenti'], fonte: t('tabella.fonte.incidenti'), approssimata: true, esporta: false, colore: '#c92a2a' },
  // confini: chiave dal nome (o dal codice di sezione). `colonne` dice quali campi mostrare e in che ordine; gli altri restano nel menu Colonne
  { id: 'circoscrizioni', nome: t('tabella.layer.circoscrizioni'), strati: ['confini-circoscrizioni-hit'], visibili: ['confini-circoscrizioni'], chiave: p => p.Circoscrizione, colonne: ['Circoscrizione', 'Area'], fonte: confini, approssimata: true, esporta: true, colore: '#c2255c' },
  { id: 'quartieri', nome: t('tabella.layer.quartieri'), strati: ['confini-quartieri-hit'], visibili: ['confini-quartieri'], chiave: p => (p.Quartiere != null ? `${p.Circoscrizione}/${p.Quartiere}` : null), colonne: ['Quartiere', 'Circoscrizione', 'Area'], fonte: confini, approssimata: true, esporta: true, colore: '#9c36b5' },
  { id: 'upl', nome: t('tabella.layer.upl'), strati: ['confini-upl-fill'], visibili: ['confini-upl'], chiave: p => (p.UPL != null ? `${p.Quartiere}/${p.UPL}` : null), colonne: ['UPL', 'Quartiere', 'Circoscrizione', 'Area'], fonte: confini, approssimata: true, esporta: true, colore: '#6741d9' },
  { id: 'amap-distretti', nome: t('tabella.layer.amap'), strati: ['amap-distretti-hit'], visibili: ['confini-amap'], chiave: p => p.DISTRETTO, colonne: ['DISTRETTO'], fonte: amap, approssimata: false, esporta: true, colore: '#d32f2f' },
  { id: 'sezioni', nome: t('tabella.layer.sezioni'), strati: ['confini-sezioni-hit'], visibili: ['confini-sezioni'], chiave: p => p.SEZ21_ID, colonne: ['SEZ21_ID', 'Circoscrizione', 'Quartiere', 'UPL', 'POP21', 'Pop_2022', 'FAM21', 'ABI21', 'EDI21', 'Area'], fonte: istat, approssimata: true, esporta: true, colore: '#0b7285' },
];

export const sorgentePer = id => SORGENTI.find(s => s.id === id);

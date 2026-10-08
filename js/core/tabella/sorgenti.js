// js/core/tabella/sorgenti.js
// I layer che la tabella sa leggere. Si interrogano gli strati «hit» (sempre presenti e invisibili): `visibili` dice
// quali strati disegnati devono essere accesi perché le righe abbiano senso.
import { t } from '../i18n.js';

export const LIMITE_RIGHE = 20000; // oltre, la tabella chiede di restringere la vista
export const MAX_DOM = 2000; // righe messe davvero nella pagina

const progetto = t('tabella.fonte.progetto');
const comune = t('tabella.fonte.comune');

export const SORGENTI = [
  { id: 'colonnine', nome: t('tabella.layer.colonnine'), strati: ['colonnine-hit'], visibili: ['colonnine-punti'], chiave: p => p.id, fonte: progetto, approssimata: false, esporta: true, colore: '#2b8a3e' },
  { id: 'scuole', nome: t('tabella.layer.scuole'), strati: ['scuole-hit-punti'], visibili: ['scuole-punti'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#1971c2' },
  { id: 'uffici', nome: t('tabella.layer.uffici'), strati: ['uffici-hit'], visibili: ['uffici-punti'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#a61e4d' },
  { id: 'fermate', nome: t('tabella.layer.fermate'), strati: ['trasporto-hit-fermate'], visibili: ['trasporto-fermate'], chiave: p => p.id, fonte: comune, approssimata: false, esporta: true, colore: '#364fc7' },
  // il campo si chiama davvero «Paricella» nei dati del catasto
  { id: 'catasto', nome: t('tabella.layer.catasto'), strati: ['catasto-hit'], visibili: ['catasto'], chiave: p => (p.Foglio != null ? `${p.Foglio}/${p.Paricella}` : null), fonte: comune, approssimata: true, esporta: true, colore: '#2f9e44' },
  { id: 'incidenti', nome: t('tabella.layer.incidenti'), strati: ['sicurezza-hit-incidenti'], visibili: ['sicurezza-incidenti'], fonte: t('tabella.fonte.incidenti'), approssimata: true, esporta: false, colore: '#c92a2a' },
];

export const sorgentePer = id => SORGENTI.find(s => s.id === id);

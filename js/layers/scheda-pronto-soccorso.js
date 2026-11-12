import { presente } from '../core/scheda-util.js';
import { localeIntl, t, tl } from '../core/i18n.js';

// Modello puro dei pronto soccorso di Palermo: stesse righe per il popup e per la scheda di destra.
// Dati: app «palermo-ps» (letture degli ospedali ogni 2 minuti), rilanciate dal Worker alla rotta /pronto-soccorso.
// Regola dell'app d'origine, qui rispettata: un valore non pubblicato dall'ospedale è null e non si mostra; mai 0 inventato.

export const FONTE = 'Ospedali Riuniti Villa Sofia-Cervello, ARNAS Civico, AOUP Policlinico, ASP Palermo e Fatebenefratelli (liste di attesa pubblicate dagli ospedali), raccolte dall\'app PalermoHub «palermo-ps»';
export const APP = 'https://palermo-ps.coseerobe.workers.dev/';
export const PAGINA_PS = 'https://palermohub.opendatasicilia.it/ps_palermo.html';
// Peso 105 = tab dedicato «Pronto soccorso» (vedi tabScheda): si apre da solo al clic su un ospedale a strato acceso.
export const PESO_TAB = 105;

export const COLORE_CODICE = { rosso: '#e03131', arancione: '#f76707', azzurro: '#1c7ed6', verde: '#2f9e44', bianco: '#adb5bd' };
export const NOME_CODICE = { rosso: 'Rosso', arancione: 'Arancione', azzurro: 'Azzurro', verde: 'Verde', bianco: 'Bianco' };
export const LIVELLI = [
  ['regolare', 'Entro i posti disponibili', '#2f9e44'],
  ['affollato', 'Affollato', '#f08c00'],
  ['molto', 'Molto affollato', '#e03131'],
  ['nd', 'Dato non disponibile', '#868e96'],
];
export const COLORE_LIVELLO = Object.fromEntries(LIVELLI.map(([k, , c]) => [k, c]));
const NOME_LIVELLO = Object.fromEntries(LIVELLI.map(([k, n]) => [k, n]));
export const SOGLIA_AFFOLLATO = 100;
export const SOGLIA_MOLTO = 150;

const num = n => (n == null ? '' : Number(n).toLocaleString(localeIntl()));
const ha = v => v != null && Number.isFinite(Number(v));

// Livello di affollamento dall'indice dell'ospedale (presenti / posti tecnici, in %); solo se la lettura è fresca.
export function livello(p) {
  if (p.stato !== 'ok' || !ha(p.sovraffollamentoPct)) return 'nd';
  return p.sovraffollamentoPct > SOGLIA_MOLTO ? 'molto' : p.sovraffollamentoPct > SOGLIA_AFFOLLATO ? 'affollato' : 'regolare';
}

export const etichettaLivello = p => NOME_LIVELLO[livello(p)];

// «ore 9:52» dalla rilevazione dichiarata dall'ospedale (ISO con offset), altrimenti dalla nostra lettura.
export function quando(p) {
  const iso = p.rilevataAlle || p.acquisitaAlle;
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(localeIntl(), { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const riga = (etichetta, valore, extra = {}) => (presente(valore) ? [{ etichetta, valore: String(valore), ...extra }] : []);

function righeAnagrafica(p) {
  return [
    ...riga('Struttura', p.struttura), ...riga('Reparto', p.tipo === 'pediatrico' ? 'Pronto soccorso pediatrico' : 'Pronto soccorso adulti'),
    ...riga('Indirizzo', p.indirizzo), ...(presente(p.telefono) ? [{ etichetta: 'Telefono', valore: p.telefono, tel: p.telefono }] : []),
  ];
}

function righeSituazione(p) {
  const l = livello(p);
  return [
    ...(l !== 'nd' ? [{ etichetta: 'Affollamento', valore: `${NOME_LIVELLO[l]} (${num(p.sovraffollamentoPct)}%)`, colore: COLORE_LIVELLO[l] }] : []),
    ...(ha(p.sovraffollamentoPct) && p.sovraffollamentoCalcolato ? riga('Indice', 'Calcolato da PalermoHub: l\'ospedale non lo pubblica') : []),
    ...riga('Pazienti presenti', num(p.pazientiTotali)), ...riga('Pazienti in attesa', num(p.inAttesa)), ...riga('Posti tecnici', num(p.postiTecnici)),
    ...riga('Aggiornato alle', quando(p)),
  ];
}

// Per ogni codice colore i pazienti in attesa (e, se l'ospedale li pubblica, in trattamento e in osservazione); il tempo medio solo per chi lo dà.
function righeCodici(p) {
  return Object.keys(COLORE_CODICE).flatMap(c => {
    const v = p.codici?.[c];
    if (!v) return [];
    const parti = [ha(v.attesa) && t('ps.inAttesa', { n: num(v.attesa) }), ha(v.trattamento) && t('ps.inTrattamento', { n: num(v.trattamento) }), ha(v.osservazione) && t('ps.inOsservazione', { n: num(v.osservazione) }),
      ha(p.tempiMediAttesaMin?.[c]) && t('ps.attesaMedia', { n: num(p.tempiMediAttesaMin[c]) })].filter(Boolean);
    return parti.length ? [{ etichetta: `Codice ${NOME_CODICE[c].toLowerCase()}`, valore: parti.join(' · '), colore: COLORE_CODICE[c] }] : [];
  });
}

function righePermanenza(p) {
  const m = p.permanenza;
  return m ? [...riga('Da meno di 24 ore', num(m.meno24h)), ...riga('Da 24 a 48 ore', num(m.da24a48h)), ...riga('Da oltre 48 ore', num(m.oltre48h))] : [];
}

function avviso(p) {
  if (p.stato === 'assente') return 'Questo ospedale non ha ancora pubblicato dati sulle attese.';
  if (p.stato !== 'ok') return 'Il dato non è aggiornato: la fonte non risponde o non cambia da tempo. Non usarlo per decidere.';
  return '';
}

export const titoloPs = p => t(p.tipo === 'pediatrico' && !/pediatric/i.test(p.nome) ? 'ps.titoloPediatrico' : 'ps.titolo', { nome: p.nome });

export function vocePs(p) {
  const l = livello(p);
  return {
    chiave: `pronto-soccorso-${p.id}`,
    peso: PESO_TAB,
    strato: 'pronto-soccorso',
    titolo: titoloPs(p),
    icona: 'ospedale',
    badge: NOME_LIVELLO[l],
    sempre: true,
    gruppi: [
      { titolo: 'Struttura', righe: righeAnagrafica(p) },
      { titolo: 'Situazione adesso', righe: righeSituazione(p) },
      { titolo: 'Pazienti per codice colore', righe: righeCodici(p) },
      { titolo: 'Permanenza dei pazienti presenti', righe: righePermanenza(p) },
    ].filter(g => g.righe.length),
    ...(avviso(p) && { avviso: avviso(p) }),
    nota: 'Il dato conta i pazienti, non è un tempo di attesa promesso. In caso di emergenza chiama il 112 (118 per l\'emergenza sanitaria).',
    link: [
      ...(p.sito ? [{ testo: 'Sito dell\'ospedale', url: p.sito, icona: 'esterno', suggerimento: 'Sito ufficiale della struttura' }] : []),
      { testo: 'Pronto soccorso Palermo su PalermoHub', url: PAGINA_PS, icona: 'esterno', suggerimento: 'Pagina di PalermoHub con le attese di tutti i pronto soccorso' },
    ],
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloPopupPs(p) {
  const l = livello(p);
  return {
    titolo: titoloPs(p), sottotitolo: NOME_LIVELLO[l],
    righe: [...riga('Indirizzo', p.indirizzo), ...righeSituazione(p).filter(r => r.etichetta !== 'Indice')],
    url: APP, fonte: FONTE,
  };
}

// Dati del pannello grafico di popup e tooltip (stile dell'app d'origine): tipo, pazienti in attesa, stato e attesa per ogni codice colore.
// Un codice non pubblicato dall'ospedale ha attesa null: nel pannello compare come «–», mai come 0.
export function pannelloPs(p) {
  const l = livello(p);
  return {
    tipo: p.tipo === 'pediatrico' ? 'Pediatrico' : 'Adulti',
    inAttesa: ha(p.inAttesa) ? num(p.inAttesa) : '–',
    stato: { testo: NOME_LIVELLO[l], livello: l, colore: COLORE_LIVELLO[l] },
    codici: Object.keys(COLORE_CODICE).map(c => ({ chiave: c, nome: NOME_CODICE[c], colore: COLORE_CODICE[c], attesa: ha(p.codici?.[c]?.attesa) ? num(p.codici[c].attesa) : '–' })),
    aggiornato: quando(p),
  };
}

// Modello puro dei progetti PNRR di Palermo (Italia Domani, open data): colori e nomi delle missioni, sezione della scheda di destra e
// tooltip. Una feature per CUP (dati/pnrr/pnrr.geojson, generato da scripts/pnrr.py).
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl } from '../core/i18n.js';

export const FONTE = 'Italia Domani — Struttura di missione PNRR, Sogei: catalogo open data (CC BY 4.0)';
const LINK = 'https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html';
const LINK_LOCALIZZAZIONE = 'https://www.italiadomani.gov.it/content/dam/sogei-ng/opendata/PNRR_Localizzazione.csv';
const LINK_CRUSCOTTO = 'https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#pnrr';
// link in fondo alla tab PNRR: catalogo open data (file dei progetti e di localizzazione), elenco nazionale delle localizzazioni, Cruscotto Italia
const LINK_FONTI = [
  { testo: 'Catalogo open data di Italia Domani', icona: 'esterno', url: LINK },
  { testo: 'Localizzazione dei progetti (CSV)', icona: 'esterno', url: LINK_LOCALIZZAZIONE },
  { testo: 'PNRR di Palermo su Cruscotto Italia', icona: 'esterno', url: LINK_CRUSCOTTO },
];

// [codice, nome, colore]
export const MISSIONI = [
  ['M1', 'Digitalizzazione, innovazione, competitività, cultura e turismo', '#1c7ed6'],
  ['M2', 'Rivoluzione verde e transizione ecologica', '#2f9e44'],
  ['M3', 'Infrastrutture per una mobilità sostenibile', '#f08c00'],
  ['M4', 'Istruzione e ricerca', '#7048e8'],
  ['M5', 'Inclusione e coesione', '#d6336c'],
  ['M6', 'Salute', '#e03131'],
  ['M7', 'REPowerEU', '#0c8599'],
];
export const coloreMissione = codice => MISSIONI.find(([c]) => c === codice)?.[2] ?? '#868e96';

const PRECISIONE = {
  civico: 'Indirizzo (civico)',
  via: 'Solo la via: posizione approssimata',
  sede: 'Sede dell’istituto scolastico: posizione approssimata',
};

const euro = v => (v != null && Number.isFinite(Number(v))
  ? Number(v).toLocaleString(localeIntl(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  : null);

// «LAVORI DI RIQUALIFICAZIONE…» è in maiuscolo nella fonte: si porta a frase per leggerlo meglio
export function frase(testo) {
  if (!testo) return null;
  const s = String(testo).trim();
  if (s !== s.toUpperCase() || s.length < 4) return s;
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const MINUSCOLE = new Set(['di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'e', 'per', 'a', 'da', 'in', 'al', 'alla', 'ai', 'con', 'il', 'la', 'lo']);
const ACCENTATE = { A: '\u00e0', E: '\u00e8', I: '\u00ec', O: '\u00f2', U: '\u00f9' }; // i18n-ok: lettere accentate, non testi

// «UNIVERSITA' DEGLI STUDI DI PALERMO» → «Università degli Studi di Palermo»: i nomi propri tengono le maiuscole (frase() le toglierebbe).
// Solo i testi tutti maiuscoli: le sigle con i punti («I.C.») e i numeri romani restano come sono.
export function nomeSoggetto(testo) {
  if (!testo) return null;
  const s = String(testo).trim();
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/([a-z])'(?=\s|$)/g, (_, v) => ACCENTATE[v.toUpperCase()] ?? `${v}'`).split(/(\s+)/).map((parola, i) => {
    if (/^\s*$/.test(parola)) return parola;
    const origine = s.split(/\s+/)[Math.floor(i / 2)] ?? '';
    if (/\./.test(origine) || /^[IVXL]{1,5}$/.test(origine)) return origine;       // sigle («I.C.», «E.») e numeri romani
    if (i > 0 && MINUSCOLE.has(parola)) return parola;
    return parola.replace(/(^|[-'])([a-z\u00e0\u00e8\u00ec\u00f2\u00f9])/g, (m, a, b) => a + b.toUpperCase()); // i18n-ok
  }).join('');
}

// La fonte tronca spesso il titolo a 40 caratteri; il titolo intero sta di solito nella prima parte della descrizione
// («titolo*INDIRIZZO*dettagli»): lo si usa solo se ricomincia con lo stesso testo.
// Un titolo che è solo un codice («p3», «1.4.1fwk8r3v1i.c. publio…») si sostituisce con la prima parte della descrizione.
export const SEMBRA_CODICE = /^\d+(\.\d+)+[a-z_]/i;
const primaParte = p => String(p.descrizione ?? p.sintesi ?? '').split('*')[0].trim();
export function titoloProgetto(p) {
  const titolo = (p.titolo ?? '').trim();
  const intero = primaParte(p);
  if (titolo && intero.length > titolo.length && intero.toLowerCase().startsWith(titolo.toLowerCase().slice(0, 25))) return frase(intero);
  if ((titolo.length < 12 || SEMBRA_CODICE.test(titolo)) && intero.length >= 12) return frase(intero);
  return frase(p.titolo) ?? frase(p.submisura_nome) ?? p.cup;
}

// La descrizione della fonte è «titolo*INDIRIZZO*dettagli»: senza gli asterischi e senza ripetere il titolo già mostrato.
export function descrizioneProgetto(p) {
  const parti = String(p.sintesi ?? '').split('*').map(x => x.trim()).filter(Boolean);
  const titolo = titoloProgetto(p).toLowerCase();
  const altre = parti.filter(x => frase(x).toLowerCase() !== titolo);
  return altre.length ? altre.map(frase).join(' · ') : undefined;
}

// Colori del badge dello stato di avanzamento (valori della fonte)
export const COLORI_STATO = { Concluso: '#2f9e44', 'In Corso': '#e8590c' };

// Il soggetto attuatore è un filtro: il clic mostra in mappa solo i suoi progetti (layer pnrr.js, evento `dt:filtro`).
export const filtroAttuatore = valore => ({ strato: 'pnrr', campo: 'attuatore', valore });

export function righeProgetto(p) {
  return righe([
    ['Missione', p.missione ? `${p.missione} — ${tl(MISSIONI.find(([c]) => c === p.missione)?.[1] ?? p.missione_nome ?? '')}` : null],
    ['Componente', p.componente_nome],
    ['Misura', p.submisura_nome ?? p.misura],
    ['Stato', p.stato ? tl(frase(p.stato)) : null], ['Soggetto attuatore', nomeSoggetto(p.attuatore)],
    ['Finanziamento PNRR', euro(p.pnrr)], ['Costo totale', euro(p.totale)],
    ['Inizio previsto', p.inizio_previsto], ['Inizio effettivo', p.inizio_effettivo],
    ['Fine prevista', p.fine_prevista], ['Fine effettiva', p.fine_effettiva],
    ['Natura', frase(p.natura)], ['Tipologia', frase(p.tipologia)], ['Settore', frase(p.settore)],
    ['Indirizzo', p.indirizzo], ['Sede del soggetto attuatore', p.sede], ['Scuola (layer Scuole)', p.scuola], ['Posizione', PRECISIONE[p.precisione] ? tl(PRECISIONE[p.precisione]) : null],
    ['CUP', p.cup],
  ]).map(r => {
    if (r.etichetta === 'Soggetto attuatore') return { ...r, filtro: filtroAttuatore(p.attuatore) };
    if (r.etichetta === 'Stato' && COLORI_STATO[p.stato]) return { ...r, colore: COLORI_STATO[p.stato] }; // badge colorato
    return r;
  });
}

export function voceScheda(p) {
  return {
    chiave: `pnrr-${p.cup}`,
    peso: 95, // tab «PNRR» della scheda (core/scheda.js)
    strato: 'pnrr',
    titolo: titoloProgetto(p),
    icona: 'euro',
    badge: p.missione ? `PNRR ${p.missione}` : 'PNRR',
    sempre: true,
    gruppi: [{ righe: righeProgetto(p) }],
    testo: descrizioneProgetto(p),
    link: LINK_FONTI,
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

const MAX_TITOLO_TOOLTIP = 90;
const accorcia = s => (s.length > MAX_TITOLO_TOOLTIP ? `${s.slice(0, MAX_TITOLO_TOOLTIP).replace(/\s+\S*$/, '')}…` : s);

export function modelloTooltipPnrr(p) {
  return {
    titolo: accorcia(titoloProgetto(p)),
    sottotitolo: p.missione ? `${p.missione} · ${p.stato ?? ''}`.replace(/ · $/, '') : (p.stato ?? ''),
    righe: righe([['Finanziamento PNRR', euro(p.pnrr)], ['Soggetto attuatore', p.attuatore], ['Indirizzo', p.indirizzo]]),
  };
}

// ---------- sintesi cittadina per i grafici (dati/pnrr/sintesi.json, generata da scripts/pnrr.py) ----------

// 921364866 → «921,4 M€»; 128000 → «128 k€»; 950 → «950 €»
export function euroCompatto(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const f = (x, d) => x.toLocaleString(localeIntl(), { minimumFractionDigits: 0, maximumFractionDigits: d });
  if (Math.abs(n) >= 1e9) return `${f(n / 1e9, 2)} Mld €`;
  if (Math.abs(n) >= 1e6) return `${f(n / 1e6, 1)} M€`;
  if (Math.abs(n) >= 1e3) return `${f(n / 1e3, 0)} k€`;
  return `${f(n, 0)} €`;
}

// [{voce, n, pnrr}] → [{voce, valore, quota}] con la quota (0-100) rispetto al massimo: serve alla lunghezza delle barre
export function barre(gruppi, campo) {
  const max = Math.max(0, ...gruppi.map(g => Number(g[campo]) || 0));
  return gruppi.map(g => ({ ...g, valore: Number(g[campo]) || 0, quota: max > 0 ? ((Number(g[campo]) || 0) / max) * 100 : 0 }));
}

export const quotaConclusi = s => {
  const c = s.per_stato?.find(g => g.voce === 'Concluso')?.n ?? 0;
  return s.n > 0 ? Math.round((c / s.n) * 1000) / 10 : 0;
};

// Sezione della tab PNRR con i numeri e i grafici dell'insieme dei progetti di Palermo; `dinamico` li disegna (scheda-pnrr-dom.js).
export function voceSintesi(sintesi, dinamico) {
  return {
    chiave: 'pnrr-sintesi',
    peso: 96,
    strato: 'pnrr',
    titolo: 'PNRR a Palermo',
    icona: 'euro',
    badge: sintesi.estrazione ? String(sintesi.estrazione).slice(-4) : undefined,
    sempre: true,
    gruppi: [],
    dinamico: () => dinamico(sintesi),
    link: LINK_FONTI,
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

// Modello puro della scheda «Camminabilità» (Walkably, Raian Pollock): punteggio 0–100 della cella esagonale di ~95 m,
// Reach (a piedi verso otto bisogni quotidiani), qualità stradale e minuti fino al luogo più vicino per ciascun bisogno.
// Le righe senza valore non compaiono.
import { righe } from '../core/scheda-util.js';
import { lingua, localeIntl, t } from '../core/i18n.js';
import { contenutoDinamico } from './scheda-camminabilita-dom.js';

export const FONTE = 'Fonte: Walkably (Raian Pollock), punteggi di camminabilità, release 2026.10-m3, su dati © OpenStreetMap contributors. Licenza ODbL 1.0. Sono stime.';
export const URL_WALKABLY = 'https://walkably.org';
export const URL_OSM = 'https://www.openstreetmap.org/copyright';
export const URL_ODBL = 'https://opendatacommons.org/licenses/odbl/1-0/';
export const URL_ACCURATEZZA = 'https://walkably.org/accuracy';
export const URL_METODO = 'https://walkably.org/about';
export const URL_PALERMO_IT = 'https://walkably.org/city/it/palermo/'; // pagina di Palermo in italiano
export const URL_PALERMO_EN = 'https://walkably.org/en/city/it/palermo/'; // e in inglese
export const urlPalermo = () => (lingua() === 'en' ? URL_PALERMO_EN : URL_PALERMO_IT);
export const PESO = 104; // tab «Walkably» della scheda (core/scheda-modello.js)

// Cinque classi di punteggio (estremi inclusi in basso): tavolozza sequenziale ColorBrewer YlGnBu, leggibile anche con daltonismo.
export const CLASSI = [
  { id: 0, da: 0, a: 19, etichetta: 'Camminabilità molto bassa', colore: '#ffffcc' },
  { id: 1, da: 20, a: 39, etichetta: 'Camminabilità bassa', colore: '#a1dab4' },
  { id: 2, da: 40, a: 59, etichetta: 'Camminabilità media', colore: '#41b6c4' },
  { id: 3, da: 60, a: 79, etichetta: 'Camminabilità alta', colore: '#2c7fb8' },
  { id: 4, da: 80, a: 100, etichetta: 'Camminabilità molto alta', colore: '#253494' },
];
// Edifici colorati dalla cella sotto di loro: perClasse = {classe: [fid]} (edifici_fid.json), accese = classi accese (null = tutte).
export function coloriEdifici(perClasse, accese = null) {
  const perFid = new Map();
  for (const c of CLASSI) {
    if (accese && !accese.has(c.id)) continue;
    for (const fid of perClasse?.[c.id] ?? []) perFid.set(fid, c.colore);
  }
  return perFid;
}

// Stesso colore per il poligono piatto 2D: match sull'id del tile edificato; gli edifici non colorati restano trasparenti.
export function espressioneEdifici2d(perClasse, accese = null) {
  const rami = CLASSI.filter(c => (!accese || accese.has(c.id)) && perClasse?.[c.id]?.length).flatMap(c => [perClasse[c.id], c.colore]);
  return rami.length ? ['match', ['id'], ...rami, 'rgba(0,0,0,0)'] : 'rgba(0,0,0,0)';
}

export const classe = id => CLASSI.find(c => c.id === Number(id)) ?? null;
export const classePerPunteggio = s => [...CLASSI].reverse().find(c => s >= c.da) ?? CLASSI[0];

// Tre classi di strada sul valore di qualità (0–100), come nella legenda di Walkably: sotto 45 trafficata, 45–74 mista, 75 e oltre tranquilla.
export const CLASSI_STRADA = [
  { id: 0, etichetta: 'Strada trafficata', colore: '#1f2430', spessore: 2.6 },
  { id: 1, etichetta: 'Strada mista', colore: '#7a8394', spessore: 1.8 },
  { id: 2, etichetta: 'Strada tranquilla', colore: '#b9c2d3', spessore: 1.2 },
];
export const classeStrada = id => CLASSI_STRADA.find(c => c.id === Number(id)) ?? null;
export const classeStradaPerQualita = q => [...CLASSI_STRADA].reverse().find(c => (c.id === 0 ? true : q >= (c.id === 1 ? 45 : 75))) ?? CLASSI_STRADA[0];

// Tipo di strada: valore `highway` di OpenStreetMap in italiano; i valori non elencati restano com'è.
const TIPI_STRADA = {
  motorway: 'Autostrada', trunk: 'Superstrada', primary: 'Strada primaria', secondary: 'Strada secondaria', tertiary: 'Strada terziaria',
  unclassified: 'Strada minore', residential: 'Strada residenziale', living_street: 'Zona residenziale a precedenza pedonale',
  service: 'Strada di servizio', pedestrian: 'Via pedonale', footway: 'Marciapiede o sentiero pedonale', path: 'Sentiero', steps: 'Scalinata',
  cycleway: 'Pista ciclabile', track: 'Strada sterrata', primary_link: 'Raccordo', secondary_link: 'Raccordo', tertiary_link: 'Raccordo', trunk_link: 'Raccordo',
};
export const tipoStrada = hw => TIPI_STRADA[hw] ?? hw ?? null;

// I bisogni, nell'ordine dei campi 0–7 del file Walkably.
export const BISOGNI = [
  { k: 0, etichetta: 'Alimentari' }, { k: 1, etichetta: 'Cibo e bevande' }, { k: 2, etichetta: 'Negozi' }, { k: 3, etichetta: 'Salute' },
  { k: 4, etichetta: 'Scuola' }, { k: 5, etichetta: 'Parchi' }, { k: 6, etichetta: 'Cultura' }, { k: 7, etichetta: 'Trasporto pubblico' },
];
const MAX_MINUTI = 22; // oltre questa distanza il file non cerca (m = -1)

// Luoghi entro 5 e 10 minuti, impacchettati in un solo numero (campo vK): 5 min = v & 15, 10 min = (v >> 4) & 15;
// il bit 8 (256) o il bit 9 (512) acceso dice che il conteggio è al tetto e i luoghi veri possono essere di più. Assente = nessun luogo entro 10 minuti.
export function luoghiEntro(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return { entro5: 0, entro10: 0, oltre5: false, oltre10: false };
  return { entro5: n & 15, entro10: (n >> 4) & 15, oltre5: (n & 256) !== 0, oltre10: (n & 512) !== 0 };
}

// Un elemento per bisogno, con tutti i dati della cella: punteggio 0–100, minuti, luoghi entro 5/10 minuti, tipo e nome del più vicino.
export function tabellaBisogni(p) {
  return BISOGNI.map(({ k, etichetta }) => {
    const m = Number(p[`m${k}`]);
    const r = Number(p[`r${k}`]);
    return {
      k, etichetta,
      punteggio: Number.isFinite(r) ? r : null,
      minuti: Number.isFinite(m) && m >= 0 ? m : null, // null = nessun luogo entro 22 minuti
      ...luoghiEntro(p[`v${k}`]),
      tipo: p[`kd${k}`] ?? null, nome: p[`n${k}`] ?? null,
    };
  });
}

// Cosa c'è nel parco più vicino (campo pc, parole separate da |) e se la cella è su una rete stradale isolata.
export const dentroParco = p => (p.pc ? String(p.pc).split('|').map(x => x.trim()).filter(Boolean) : []);
export const stradaIsolataM = p => (Number.isFinite(Number(p.isl_m)) ? Number(p.isl_m) : null);

const num1 = v => Number(v).toLocaleString(localeIntl(), { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const punteggio = v => (Number.isFinite(Number(v)) ? num1(v) : null);

// Riga di un bisogno: minuti a piedi e, se c'è, tipo e nome del luogo più vicino.
export function rigaBisogno(p, { k, etichetta }) {
  const m = Number(p[`m${k}`]);
  if (!Number.isFinite(m)) return null;
  if (m < 0) return { etichetta, valore: t('camminabilita.oltre', { n: MAX_MINUTI }) };
  const luogo = [p[`kd${k}`], p[`n${k}`]].filter(Boolean).join(': ');
  return { etichetta, valore: t('camminabilita.minuti', { n: num1(m) }) + (luogo ? ` · ${luogo}` : '') };
}

export function modelloPopup(p) {
  const c = classePerPunteggio(Number(p.s));
  return {
    titolo: t('camminabilita.titoloPunteggio', { n: punteggio(p.s) ?? '–' }),
    sottotitolo: c.etichetta,
    righe: righe([['Reach (a piedi verso i servizi)', punteggio(p.r)], ['Qualità della strada', punteggio(p.q)]]),
  };
}

// Chiave stabile: i tile spezzano le celle, ma gli attributi di una cella restano gli stessi.
export const chiave = p => `camminabilita:${p.s}:${p.r}:${p.q}:${p.m0}:${p.m7}`;

export function voceCamminabilita(p, centro = null, leggi = null) {
  const c = classePerPunteggio(Number(p.s));
  const bisogni = BISOGNI.map(b => rigaBisogno(p, b)).filter(Boolean);
  const parco = Number.isFinite(Number(p.pg)) ? [{ etichetta: 'Area giochi più vicina', valore: t('camminabilita.minuti', { n: num1(p.pg) }) }] : [];
  return {
    chiave: chiave(p), peso: PESO, strato: 'camminabilita', titolo: 'Camminabilità', icona: 'camminabilita', badge: punteggio(p.s) ?? undefined, sempre: true,
    gruppi: [
      { righe: [
        { ...righe([['Punteggio (0–100)', punteggio(p.s)]])[0], campione: { legenda: 'legenda-camminabilita', colore: c.colore } },
        ...righe([['Valutazione', c.etichetta], ['Reach (a piedi verso i servizi)', punteggio(p.r)], ['Qualità della strada', punteggio(p.q)], ['Meglio del (% delle celle)', p.p != null ? `${num1(p.p)}%` : null]]).filter(r => r.etichetta !== 'Punteggio (0–100)'),
      ] },
      ...(bisogni.length ? [{ titolo: 'A piedi dalla cella', righe: [...bisogni, ...parco] }] : []),
      // la fonte in un blocco a sé, ben visibile (il credito ODbL chiede Walkably con link a walkably.org e OpenStreetMap)
      { titolo: 'Fonte e licenza', righe: [
        { etichetta: 'Punteggi', valore: 'Walkably (Raian Pollock), 2026.10-m3', urlValore: URL_WALKABLY }, // i18n-ok: nome proprio
        { etichetta: 'Dati di base', valore: '© OpenStreetMap contributors', urlValore: URL_OSM },
        { etichetta: 'Licenza', valore: 'ODbL 1.0', urlValore: URL_ODBL }, // i18n-ok: nome della licenza
      ] },
    ],
    dinamico: () => contenutoDinamico(p, centro, leggi),
    nota: 'Il punteggio unisce la raggiungibilità a piedi di otto bisogni quotidiani (60%) e la qualità della strada (40%). Sono stime da OpenStreetMap: un luogo mancante o sbagliato sulla mappa cambia il punteggio. Non descrive sicurezza, criminalità o reddito.',
    link: [
      { testo: 'Come si calcola il punteggio (Walkably)', url: URL_METODO, icona: 'esterno', suggerimento: 'Il metodo di calcolo spiegato da Walkably' },
      { testo: 'Limiti dei dati (Walkably)', url: URL_ACCURATEZZA, icona: 'esterno', suggerimento: 'Verifiche di accuratezza, anche quelle fallite' },
      { testo: 'Calcoli specifici per Palermo (Walkably)', url: urlPalermo(), icona: 'esterno', suggerimento: 'Punteggi e dettagli di Palermo sul sito di Walkably' },
    ],
    fonte: FONTE,
  };
}

// Scheda del tratto di strada cliccato: qualità e le sue parti (rumore, ombra, strade trafficate vicine, pendenza, alberi).
export const chiaveStrada = p => `camminabilita-strada:${p.name ?? ''}:${p.q}:${p.hw}:${p.sl}`;

export function voceStrada(p) {
  const c = classeStradaPerQualita(Number(p.q));
  const dB = Number.isFinite(Number(p.nz)) ? `${num1(p.nz)} dB` : null;
  const pct = v => (Number.isFinite(Number(v)) ? `${num1(v)}%` : null);
  return {
    chiave: chiaveStrada(p), peso: PESO, strato: 'camminabilita', titolo: p.name ? p.name : 'Strada senza nome', icona: 'camminabilita', badge: punteggio(p.q) ?? undefined, sempre: true,
    gruppi: [{ righe: [
      { ...righe([['Qualità della strada (0–100)', punteggio(p.q)]])[0], campione: { legenda: 'legenda-camminabilita', colore: c.colore } },
      ...righe([['Tipo di strada', tipoStrada(p.hw)], ['Classe', c.etichetta], ['Rumore', dB], ['Ombra estiva (stima)', pct(p.sh)], ['Vicino a strade trafficate', pct(p.bz)], ['Pendenza', pct(p.sl)], ['Alberi ogni 100 m', Number.isFinite(Number(p.tr)) ? num1(p.tr) : null]]),
    ] }],
    nota: 'La qualità della strada pesa il 40% del punteggio di camminabilità e unisce traffico, rumore (dove esiste una mappa del rumore), ombra estiva, strade trafficate vicine e pendenza. Ombra e rumore sono stime.',
    link: [
      { testo: 'Come si calcola il punteggio (Walkably)', url: URL_METODO, icona: 'esterno', suggerimento: 'Il metodo di calcolo spiegato da Walkably' },
      { testo: 'Limiti dei dati (Walkably)', url: URL_ACCURATEZZA, icona: 'esterno', suggerimento: 'Verifiche di accuratezza, anche quelle fallite' },
      { testo: 'Calcoli specifici per Palermo (Walkably)', url: urlPalermo(), icona: 'esterno', suggerimento: 'Punteggi e dettagli di Palermo sul sito di Walkably' },
    ],
    fonte: FONTE,
  };
}

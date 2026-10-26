import { righe } from '../core/scheda-util.js';
import { t, tl, localeIntl } from '../core/i18n.js';
import { URL_SERVIZIO, eventoDaIngv } from './scheda-terremoti.js';

// Modello puro dell'allerta meteo-idro del Dipartimento della Protezione Civile per le zone di allerta della Sicilia: la card della scheda (tab «Luogo») e il riassunto della legenda.
// I dati li serve il Worker (/allerte): una feature per zona, con i livelli di oggi e di domani; il livello è 0 (nessuna allerta), 1 gialla, 2 arancione, 3 rossa.

const FONTE = 'Dipartimento della Protezione Civile, bollettino di criticità nazionale (CC BY 4.0)';
export const LINK = 'https://mappe.protezionecivile.gov.it/it/mappe-rischi/bollettino-di-criticita/';
const PESO_LUOGO = 8;

export const LIVELLI = [
  { nome: 'Nessuna allerta', colore: '#90c985' },
  { nome: 'Allerta gialla', colore: '#f8f865' },
  { nome: 'Allerta arancione', colore: '#f0bf01' },
  { nome: 'Allerta rossa', colore: '#fd6767' },
];
export const coloreLivello = n => (LIVELLI[n] ?? LIVELLI[0]).colore;
export const nomeLivello = n => (LIVELLI[n] ?? LIVELLI[0]).nome;

const ora = d => d.toLocaleTimeString(localeIntl(), { hour: '2-digit', minute: '2-digit' });
const data = d => d.toLocaleDateString(localeIntl(), { day: 'numeric', month: 'long' });

// «Nessuna allerta» oppure «Allerta gialla (temporali)»: i rischi che hanno fatto salire il livello
function testoGiorno(g) {
  if (!g || !g.livello) return tl(nomeLivello(0));
  const rischi = [['idraulico', t('allerte.idraulico')], ['temporali', t('allerte.temporali')], ['idrogeologico', t('allerte.idrogeologico')]]
    .filter(([k]) => g[k] === g.livello).map(([, nome]) => nome);
  return rischi.length ? `${tl(nomeLivello(g.livello))} (${rischi.join(', ')})` : tl(nomeLivello(g.livello));
}

export const livelloMassimo = p => Math.max(p?.oggi?.livello ?? 0, p?.domani?.livello ?? 0);

// Riassunto per la legenda, per `giorno` ('oggi' o 'domani'): una riga per ogni zona in allerta, dalla più grave; senza allerte una riga sola.
// La zona di Palermo ha sempre la sua riga, in allerta o no.
export function riassuntoGiorno(zone, giorno) {
  const righe = zone.filter(z => z[giorno]?.livello > 0 && !z.palermo).sort((a, b) => b[giorno].livello - a[giorno].livello)
    .map(z => ({ livello: z[giorno].livello, testo: `${z.zona}: ${testoGiorno(z[giorno])}` }));
  const palermo = zone.find(z => z.palermo);
  if (palermo) righe.unshift({ livello: palermo[giorno]?.livello ?? 0, testo: `${t('allerte.zonaPalermo')}: ${testoGiorno(palermo[giorno])}` });
  if (!righe.some(r => r.livello > 0)) righe.push({ livello: 0, testo: t('allerte.nessunaInSicilia') });
  return righe;
}

// Terremoti recenti in legenda: non sono allerte del DPC (il sisma non ne ha) ma eventi INGV sopra soglia, a fianco del bollettino
export const MAG_SISMI = 3;
export const ORE_SISMI = 24;
export const MAG_NOTEVOLE = 4; // da qui in su una scossa accende il pulsante «Emergenze» della home
const MAX_SISMI = 5;

// `eventi` = proprietà degli eventi INGV ({ id, mag, ts, luogo }) → i più recenti sopra soglia, dal più recente
export function sismiRecenti(eventi, adesso = Date.now(), magMin = MAG_SISMI, max = MAX_SISMI) {
  return (eventi ?? [])
    .filter(e => e && e.mag >= magMin && Number.isFinite(e.ts) && e.ts <= adesso && adesso - e.ts <= ORE_SISMI * 3600000)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, max);
}

// La scossa più forte delle ultime ORE_SISMI ore se è notevole (M ≥ MAG_NOTEVOLE), altrimenti null
export const sismoNotevole = (eventi, adesso = Date.now()) => sismiRecenti(eventi, adesso, MAG_NOTEVOLE, Infinity)
  .sort((a, b) => b.mag - a.mag)[0] ?? null;

// Terremoti INGV M ≥ MAG_SISMI delle ultime ORE_SISMI ore nei `limiti` ([[lonMin, latMin], [lonMax, latMax]]) → proprietà degli eventi; lancia se il servizio non risponde (204 = nessun evento)
export async function caricaSismi24h(limiti, fetchFn = fetch, adesso = Date.now()) {
  const q = new URLSearchParams({ format: 'geojson', starttime: new Date(adesso - ORE_SISMI * 3600000).toISOString().slice(0, 19), orderby: 'time', minmag: String(MAG_SISMI), limit: '100', minlon: limiti[0][0], minlat: limiti[0][1], maxlon: limiti[1][0], maxlat: limiti[1][1] });
  const r = await fetchFn(`${URL_SERVIZIO}?${q}`);
  if (!r.ok && r.status !== 204) throw new Error(String(r.status));
  const dati = r.status === 204 ? { features: [] } : await r.json();
  return (dati.features ?? []).map(f => eventoDaIngv(f, adesso)).filter(Boolean).map(f => f.properties);
}

function righeAllerta(p, adesso) {
  const agg = Number.isFinite(p.aggiornato) ? new Date(p.aggiornato * 1000) : null;
  return righe([
    ['Zona di allerta', p.palermo ? `${p.zona} (${t('allerte.conPalermo')})` : p.zona],
    ['Oggi', testoGiorno(p.oggi)],
    ['Domani', testoGiorno(p.domani)],
    ['Bollettino', p.bollettino],
    ['Pubblicato', agg ? `${agg.toDateString() === adesso.toDateString() ? '' : `${data(agg)}, `}${ora(agg)}` : ''],
  ]);
}

// `p` = proprietà della zona dal Worker (oggi e domani sono oggetti; `aggiornato` in secondi, aggiunto dal layer)
export function voceAllerta(p, adesso = new Date()) {
  return {
    chiave: 'allerta-meteo', tipo: 'allerta', peso: PESO_LUOGO, strato: 'allerte', titolo: tl('Allerta meteo-idro'), icona: 'allerta', badge: tl(nomeLivello(livelloMassimo(p))), sempre: true,
    gruppi: [{ righe: righeAllerta(p, adesso) }],
    link: { testo: 'Bollettino della Protezione Civile', url: LINK, icona: 'esterno', suggerimento: 'Allertamento meteo-idro sul sito della Protezione Civile' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

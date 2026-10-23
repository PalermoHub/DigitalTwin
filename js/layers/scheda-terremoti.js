import { righe } from '../core/scheda-util.js';
import { t, tl, tn, localeIntl } from '../core/i18n.js';
import { posizioneIn } from '../core/scheda-navigazione.js';

// Modello puro dei terremoti in tempo reale (INGV, servizio FDSN event): stesse righe per il popup e per la scheda di destra (tab «Luogo»).
// Il browser interroga direttamente il servizio (risponde con CORS aperto): ogni evento ha magnitudo, ora (UTC), zona, profondità (km, terza coordinata) e autore della localizzazione.

export const FONTE = 'INGV, Istituto Nazionale di Geofisica e Vulcanologia: terremoti in tempo reale (CC BY 4.0)';
export const SITO = 'https://terremoti.ingv.it/';
export const LINK = 'https://terremoti.ingv.it/event/';
export const URL_SERVIZIO = 'https://webservices.ingv.it/fdsnws/event/1/query';
const PESO_LUOGO = 8;
const PALERMO = [13.3614, 38.1157]; // Palazzo delle Aquile
const ORA_MS = 3600 * 1000;

// Fasce di età: l'evento più recente è il più acceso
export const FASCE = [
  { nome: 'Ultima ora', colore: '#e03131', finoA: ORA_MS },
  { nome: 'Ultime 24 ore', colore: '#f08c00', finoA: 24 * ORA_MS },
  { nome: 'Oltre 24 ore', colore: '#4c6ef5', finoA: Infinity },
];
export const fasciaEta = (ts, adesso = Date.now()) => FASCE.find(f => adesso - ts < f.finoA) ?? FASCE.at(-1);

// Filtri della scheda e della legenda: periodo (giorni) e magnitudo minima. Il servizio si interroga per GIORNI_MAX giorni, la vista parte da GIORNI_INIZIALI.
export const GIORNI_MAX = 30;
export const SCELTE_GIORNI = [1, 7, 30];
export const SCELTE_MAGNITUDO = [1, 2, 3, 4];
export const filtro = { giorni: 7, magMin: 1 };
const GIORNO_MS = 24 * ORA_MS;
export const passaFiltro = (p, { giorni, magMin } = filtro, adesso = Date.now()) => p.mag >= magMin && adesso - p.ts <= giorni * GIORNO_MS;
// Stesso filtro come espressione MapLibre (per cerchi e strato di interrogazione)
export const espressioneFiltro = ({ giorni, magMin } = filtro, adesso = Date.now()) => ['all', ['>=', ['get', 'mag'], magMin], ['>=', ['get', 'ts'], adesso - giorni * GIORNO_MS]];

// Magnitudo → raggio del cerchio in pixel (cresce in modo esponenziale, come l'energia)
export const raggioMagnitudo = m => Math.max(3, Math.round(2.2 * 1.45 ** (Math.max(m, 0) )));

const num = (n, d = 1) => n.toLocaleString(localeIntl(), { minimumFractionDigits: d, maximumFractionDigits: d });

// INGV scrive l'ora UTC senza «Z» e con microsecondi: "2026-10-23T10:19:15.470000"
export const oraEvento = testo => Date.parse(`${String(testo).slice(0, 23)}Z`);

// Feature GeoJSON di INGV → feature per la sorgente della mappa (proprietà piatte e già calcolate), o null se i dati sono incompleti
export function eventoDaIngv(f, adesso = Date.now()) {
  const p = f?.properties ?? {};
  const [lon, lat, prof] = f?.geometry?.coordinates ?? [];
  const ts = oraEvento(p.time);
  if (!Number.isFinite(p.mag) || !Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isFinite(ts)) return null;
  const fascia = fasciaEta(ts, adesso);
  return {
    type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: { id: String(p.eventId), mag: p.mag, tipoMag: p.magType ?? '', luogo: p.place ?? '', ts, ora: new Date(ts).toISOString().slice(0, 16).replace('T', ' '), prof: Number.isFinite(prof) ? prof : null, autore: p.author ?? '', fascia: fascia.nome, colore: fascia.colore, raggio: raggioMagnitudo(p.mag) },
  };
}

export function distanzaKm([lon1, lat1], [lon2, lat2]) {
  const rad = g => g * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

// «3 ore fa», «12 minuti fa»
export function quantoTempoFa(ts, adesso = Date.now()) {
  const min = Math.max(0, Math.round((adesso - ts) / 60000));
  const rtf = new Intl.RelativeTimeFormat(localeIntl(), { numeric: 'always' });
  if (min < 60) return rtf.format(-min, 'minute');
  if (min < 48 * 60) return rtf.format(-Math.round(min / 60), 'hour');
  return rtf.format(-Math.round(min / 1440), 'day');
}

const quando = ts => new Date(ts).toLocaleString(localeIntl(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export const titoloTerremoto = p => `M ${num(p.mag)} · ${p.luogo || t('terremoti.zonaSconosciuta')}`;

function righeTerremoto(p, adesso) {
  const dist = distanzaKm(PALERMO, [p.lon, p.lat]);
  return righe([
    ['Magnitudo', `${num(p.mag)}${p.tipoMag ? ` (${p.tipoMag})` : ''}`],
    ['Ora locale', `${quando(p.ts)} · ${quantoTempoFa(p.ts, adesso)}`],
    ['Zona', p.luogo],
    ['Profondità', p.prof == null ? '' : `${num(p.prof)} km`],
    ['Distanza da Palermo', Number.isFinite(dist) ? `${num(dist, 0)} km` : ''],
    ['Localizzazione', p.autore],
  ]);
}

// `p` = proprietà della feature in mappa + `lon`/`lat` (aggiunte da chi chiama)
export function modelloPopupTerremoto(p, adesso = Date.now()) {
  return { titolo: titoloTerremoto(p), sottotitolo: p.fascia, righe: righeTerremoto(p, adesso).filter(r => r.etichetta !== 'Zona') };
}

export function voceTerremoto(p, adesso = Date.now(), dinamico = null) {
  return {
    chiave: `terremoto-${p.id}`, tipo: 'terremoto', peso: PESO_LUOGO, strato: 'terremoti', titolo: titoloTerremoto(p), icona: 'terremoto', badge: p.fascia, sempre: true,
    gruppi: [{ righe: righeTerremoto(p, adesso) }], miniatura: miniatura(p),
    link: { testo: 'Scheda dell\'evento su INGV', url: LINK + p.id, icona: 'esterno', suggerimento: 'Pagina dell\'evento sul sito terremoti.ingv.it' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
    ...(dinamico ? { dinamico } : {}),
  };
}

// Posto dell'evento `id` tra quelli in mappa, dal più recente: `prec` è l'evento più recente, `succ` il meno recente
export const posizioneEvento = (visibili, id) => posizioneIn([...visibili].sort((a, b) => b.ts - a.ts), id);

export const MAX_ELENCO = 100;

// Miniatura rettangolare dell'epicentro, che sta sempre al centro: poche tessere raster (al massimo 3×2, caricate solo quando la card si apre) invece di una mappa interattiva per card.
// Il riquadro si adatta alla larghezza della scheda e ritaglia ai lati. Un clic apre la mappa del sito sullo stesso punto.
const ZOOM_MINIATURA = 8;
const LARGHEZZA_MINIATURA = 320;
const ALTEZZA_MINIATURA = 150;
const TESSERA = 256;
export function miniatura({ lon, lat }, zoom = ZOOM_MINIATURA, larghezza = LARGHEZZA_MINIATURA, altezza = ALTEZZA_MINIATURA) {
  const n = 2 ** zoom;
  const rad = lat * Math.PI / 180;
  const sinistra = (lon + 180) / 360 * n * TESSERA - larghezza / 2;
  const alto = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n * TESSERA - altezza / 2;
  const tessere = [];
  for (let ty = Math.floor(alto / TESSERA); ty <= Math.floor((alto + altezza - 1) / TESSERA); ty++) {
    for (let tx = Math.floor(sinistra / TESSERA); tx <= Math.floor((sinistra + larghezza - 1) / TESSERA); tx++) {
      tessere.push({ url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`, x: Math.round(tx * TESSERA - sinistra), y: Math.round(ty * TESSERA - alto) });
    }
  }
  return { larghezza, altezza, tessere, href: `mappa.html#${zoom + 1}/${lat.toFixed(4)}/${lon.toFixed(4)}`, attribuzione: '© OpenStreetMap' };
}

// Elenco «gli altri terremoti» della scheda: quelli che passano il filtro, senza i cliccati, dal più recente (al massimo MAX_ELENCO)
export function altriTerremoti(eventi, esclusi, f = filtro, adesso = Date.now()) {
  const tutti = eventi.filter(p => !esclusi.has(p.id) && passaFiltro(p, f, adesso)).sort((a, b) => b.ts - a.ts);
  return { n: tutti.length, mostrati: tutti.slice(0, MAX_ELENCO) };
}

// Fisarmonica con una card per evento (stesse righe della scheda), per `disegnaAccordion`
export function accordionTerremoti(elenco, adesso = Date.now()) {
  const { n, mostrati } = elenco;
  return {
    icona: 'terremoto', aperto: n > 0 && n <= 10,
    riassunto: n > mostrati.length ? t('terremoti.altriParziale', { mostrati: mostrati.length, n }) : tn('terremoti.altri', n),
    elementi: mostrati.map(p => ({
      titolo: titoloTerremoto(p), anteprima: quantoTempoFa(p.ts, adesso),
      miniatura: miniatura(p),
      righe: [...righeTerremoto(p, adesso), { etichetta: 'Scheda INGV', valore: 'terremoti.ingv.it', urlValore: LINK + p.id }],
    })),
  };
}

// Sezione sotto agli eventi cliccati; `dinamico` disegna filtro ed elenco (scheda-terremoti-dom.js)
export const voceAltri = dinamico => ({
  chiave: 'terremoti:altri', tipo: 'terremoto', peso: PESO_LUOGO, strato: 'terremoti', titolo: 'Gli altri terremoti', icona: 'terremoto', sempre: true,
  gruppi: [], dinamico,
  link: { testo: 'Tutti i terremoti su INGV', url: SITO, icona: 'esterno', suggerimento: 'Elenco completo sul sito terremoti.ingv.it' },
  fonte: t('layer.fonte', { fonte: tl(FONTE) }),
});

// ---------- serie temporale: eventi per giorno, mese o anno, con sciami e sequenze ----------
// Il servizio si interroga una volta sola per gli ultimi ANNI_STORICO anni, dalla magnitudo MAG_STORICO (sotto, in 5 anni, gli eventi sarebbero decine di migliaia).
export const UNITA = ['giorno', 'mese', 'anno'];
export const ANNI_STORICO = 5;
export const MAG_STORICO = 2;
const FINESTRE = { giorno: 30, mese: 24, anno: ANNI_STORICO }; // quante barre
const MIN_SCIAME = 6; // sotto questo numero di eventi in una barra non è mai uno sciame

export const urlStorico = (area, adesso = Date.now()) => {
  const q = new URLSearchParams({ format: 'text', starttime: new Date(adesso - ANNI_STORICO * 366 * GIORNO_MS).toISOString().slice(0, 19), orderby: 'time', minmag: String(MAG_STORICO), limit: '20000', ...Object.fromEntries(Object.entries(area).map(([k, v]) => [k, v.toFixed(3)])) });
  return `${URL_SERVIZIO}?${q}`;
};

// Formato «text» di INGV: righe separate da «|», la prima con l'intestazione. Colonne: 1 = ora, 10 = magnitudo
export function eventiDaTesto(testo) {
  const eventi = [];
  for (const riga of String(testo).split('\n')) {
    if (!riga || riga.startsWith('#')) continue;
    const c = riga.split('|');
    const ts = oraEvento(c[1]), mag = Number(c[10]);
    if (Number.isFinite(ts) && Number.isFinite(mag)) eventi.push({ ts, mag });
  }
  return eventi;
}

// Inizio della barra che contiene `ts` e della successiva (ora locale: «giorno» è il giorno di calendario di Palermo)
function inizioBarra(ts, unita, passo = 0) {
  const d = new Date(ts);
  if (unita === 'giorno') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + passo).getTime();
  if (unita === 'mese') return new Date(d.getFullYear(), d.getMonth() + passo, 1).getTime();
  return new Date(d.getFullYear() + passo, 0, 1).getTime();
}

// Barre della serie (dalla più vecchia alla più recente) con il conteggio degli eventi M ≥ magMin e la magnitudo massima; `sciame` = barra anomala rispetto alle altre.
// Le sequenze sono le barre di sciame consecutive, riunite.
export function serieEventi(eventi, unita, magMin = MAG_STORICO, adesso = Date.now()) {
  const n = FINESTRE[unita];
  const barre = [];
  for (let i = n - 1; i >= 0; i--) {
    const da = inizioBarra(inizioBarra(adesso, unita), unita, -i);
    barre.push({ da, a: inizioBarra(da, unita, 1), n: 0, magMax: null, sciame: false });
  }
  const primo = barre[0].da;
  for (const e of eventi) {
    if (e.mag < Math.max(magMin, MAG_STORICO) || e.ts < primo || e.ts > adesso) continue;
    const b = barre.find(x => e.ts >= x.da && e.ts < x.a);
    if (!b) continue;
    b.n++;
    if (b.magMax == null || e.mag > b.magMax) b.magMax = e.mag;
  }
  // mediana e scarto mediano (robusti: gli sciami stessi non alzano la soglia)
  const mediana = v => { const o = [...v].sort((a, b) => a - b); return (o[Math.floor((n - 1) / 2)] + o[Math.ceil((n - 1) / 2)]) / 2; };
  const centro = mediana(barre.map(b => b.n));
  const scarto = Math.max(1, mediana(barre.map(b => Math.abs(b.n - centro))));
  const soglia = Math.max(MIN_SCIAME, Math.ceil(centro + 4 * scarto));
  const max = Math.max(1, ...barre.map(b => b.n));
  for (const b of barre) { b.sciame = b.n >= soglia; b.quota = b.n / max * 100; }
  const sequenze = [];
  for (const b of barre) {
    if (!b.sciame) continue;
    const ultima = sequenze.at(-1);
    if (ultima && ultima.a === b.da) { ultima.a = b.a; ultima.n += b.n; ultima.barre++; ultima.magMax = Math.max(ultima.magMax, b.magMax); }
    else sequenze.push({ da: b.da, a: b.a, n: b.n, barre: 1, magMax: b.magMax });
  }
  return { unita, barre, sequenze: sequenze.sort((x, y) => y.n - x.n), soglia, totale: barre.reduce((s, b) => s + b.n, 0) };
}

// Etichetta breve sotto la barra e testo completo del suggerimento
export function etichettaBarra(b, unita) {
  const f = opz => new Date(b.da).toLocaleDateString(localeIntl(), opz);
  if (unita === 'giorno') return { breve: f({ day: 'numeric' }), lunga: f({ day: 'numeric', month: 'long', year: 'numeric' }) };
  if (unita === 'mese') return { breve: f({ month: 'short' }).slice(0, 3), lunga: f({ month: 'long', year: 'numeric' }) };
  return { breve: f({ year: 'numeric' }), lunga: f({ year: 'numeric' }) };
}

// Periodo di una sequenza: «12 ott» o «12 – 15 ott 2026» (l'ultima barra è inclusa)
export function periodoSequenza(s, unita) {
  const opz = unita === 'giorno' ? { day: 'numeric', month: 'short' } : unita === 'mese' ? { month: 'short', year: 'numeric' } : { year: 'numeric' };
  const fmt = ts => new Date(ts).toLocaleDateString(localeIntl(), opz);
  const dal = fmt(s.da), al = fmt(s.a - 1);
  return dal === al ? dal : `${dal} – ${al}`;
}

export const voceSerie = dinamico => ({
  chiave: 'terremoti:serie', tipo: 'terremoto', peso: PESO_LUOGO, strato: 'terremoti', titolo: 'Terremoti nel tempo', icona: 'terremoto', sempre: true,
  gruppi: [], dinamico,
  fonte: t('layer.fonte', { fonte: tl(FONTE) }),
});

// Riassunto per la legenda: quanti eventi e il più forte
export function riassuntoTerremoti(eventi) {
  if (!eventi.length) return null;
  const forte = eventi.reduce((a, b) => (b.mag > a.mag ? b : a));
  return { n: eventi.length, forte };
}

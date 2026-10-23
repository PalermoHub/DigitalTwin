// Modello puro del PEBA (Piano di Eliminazione delle Barriere Architettoniche): palette, righe della scheda di destra, tooltip.
// Il disegno interattivo (barra del punteggio, criticità, foto) sta in scheda-peba-dom.js e arriva da `voce.dinamico`.
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl } from '../core/i18n.js';
import { puntoInPoligono } from '../core/tabella/geom.js';
import { posizioneIn } from '../core/scheda-navigazione.js';

export const SITO = 'https://palermohub.github.io/peba/';
export const INFO = 'https://palermohub.opendatasicilia.it/peba.html';
export const FONTE = 'Comune di Palermo, PEBA (Delibera di Giunta n. 272 del 18/07/2026); elaborazione OpenDataSicilia e PalermoHub; CC BY 4.0';

export const LIVELLI = [
  ['Accessibile', '#0072b2'], ['Parzialmente accessibile', '#56b4e9'], ['Parzialmente inaccessibile', '#e69f00'],
  ['Inaccessibile', '#d55e00'], ['Non valutabile', '#999999'],
];
export const GRUPPI = [
  ['Percorso storico', '#6d3ba0'], ['Via cittadina', '#3e548e'], ['Scuola', '#ef9ffc'], ['Asilo', '#c49bfc'],
  ['Sede amministrativa/istituzionale', '#a4d060'], ['Area verde', '#55af5e'], ['Sito UNESCO (edificio)', '#916a39'],
  ['Percorso UNESCO', '#e6370c'], ['Piazza', '#db8337'], ['Museo', '#e336b7'],
];
export const COLORE_LIVELLO = Object.fromEntries(LIVELLI);
export const COLORE_GRUPPO = Object.fromEntries(GRUPPI);
const GRIGIO = '#999999';

// Nota che la scheda mostra in un blocco apri/chiudi in fondo (vedi scheda-peba-dom.js)
export const NOTA_QUALITA = 'Schede, testi e foto sono stati estratti in automatico dai PDF originali del rilievo con script Python e assistenza di Claude (Anthropic); le coordinate sono state ricavate per geocodifica degli indirizzi. Possono essere presenti errori, campi mancanti o posizionamenti imprecisi sulla mappa.';

export const urlPdf = file => `${SITO}dati/pdf/${encodeURIComponent(file)}`;
const NN = i => String(i).padStart(2, '0');
export const urlFoto = (codice, i) => `${SITO}img/foto/${encodeURIComponent(codice)}/${NN(i)}.jpg`;
export const percorsoMiniatura = (codice, i) => `peba/foto/${encodeURIComponent(codice)}/${NN(i)}_thumb.jpg`;

// colore del testo del badge: la tinta del livello scurita, perché resti leggibile su fondo chiaro
export function testoBadge(colore) {
  const n = parseInt(colore.slice(1), 16);
  const scuro = c => Math.round(c * 0.55).toString(16).padStart(2, '0');
  return `#${scuro((n >> 16) & 255)}${scuro((n >> 8) & 255)}${scuro(n & 255)}`;
}

const num = (v, d = 0) => Number(v).toLocaleString(localeIntl(), { minimumFractionDigits: d, maximumFractionDigits: d });
export const euro = n => Number(n).toLocaleString(localeIntl(), { style: 'currency', currency: 'EUR' });

export function dimensioneFile(byte) {
  if (!Number.isFinite(byte)) return '';
  return byte >= 1e6 ? `${num(byte / 1048576, 1)} MB` : `${num(byte / 1024)} kB`;
}

// Visore delle foto: indice della foto dopo `delta` passi (circolare) e rotazione in gradi (0, 90, 180, 270)
export const passoFoto = (i, delta, n) => (n > 0 ? (((i + delta) % n) + n) % n : 0);
// Fuoco dopo Tab dentro il visore (trappola del fuoco): indice dell'elemento successivo o precedente, circolare; -1 se non ce ne sono
export function fuocoDopoTab(i, n, indietro) {
  if (n <= 0) return -1;
  if (i < 0) return indietro ? n - 1 : 0;
  return (i + (indietro ? -1 : 1) + n) % n;
}
export const ruotaGradi = (gradi, delta) => (((gradi ?? 0) + delta) % 360 + 360) % 360;

export const criticita = p => String(p.criticita ?? '').split(';').map(v => v.trim()).filter(Boolean);

// Righe con valore a badge (come nell'app originale): `colore` è la tinta del badge, il disegno ne ricava fondo, bordo e testo.
const VERDE = '#16a34a';
const conColore = (elenco, colori) => elenco.map(r => (colori[r.etichetta] ? { ...r, colore: colori[r.etichetta] } : r));

export function righeAnagrafica(p) {
  return conColore(righe([
    ['Codice', p.codice], ['Costo stimato', p.costo > 0 ? euro(p.costo) : null], ['Nome', p.nome], ['Indirizzo', p.indirizzo],
    ['Gruppo', p.gruppo], ['Categoria', p.categoria], ['Contesto urbano', p.contesto], ['Elemento', p.elemento],
  ]), { Codice: COLORE_GRUPPO[p.gruppo], 'Costo stimato': VERDE });
}

export function righeAccessibilita(p) {
  const scarto = p.punteggio - p.media_circ;
  const media = p.punteggio != null && p.media_circ != null
    ? `${num(p.media_circ)} (${scarto >= 0 ? '+' : '-'}${num(Math.abs(scarto))})` : null;
  const livello = COLORE_LIVELLO[p.livello ?? 'Non valutabile'];
  return conColore(righe([
    ['Livello', p.livello ?? 'Non valutabile'],
    ['Punteggio di inaccessibilità', p.punteggio != null ? `${num(p.punteggio)} / 100` : 'n/d'],
    ['Rilevanza', p.rilevanza], ['Classe priorità', p.classe != null ? `Classe ${p.classe}` : null],
    ['Media della circoscrizione', media],
  ]), { Livello: livello, 'Classe priorità': livello, Rilevanza: p.rilevanza === 'Alta' ? '#dc2626' : '#6b7280' });
}

// La scheda di destra; `dinamico` costruisce barra del punteggio, criticità e foto (vedi scheda-peba-dom.js).
export function voceScheda(p, dinamico) {
  const link = [];
  if (p.pdf) {
    const dim = dimensioneFile(p.pdf_byte);
    link.push({ testo: 'Apri scheda PDF originale', icona: 'esterno', url: urlPdf(p.pdf), etichetta: dim || undefined,
      suggerimento: dim ? t('peba.pdfPesante', { dimensione: dim }) : undefined });
  }
  link.push({ testo: 'Maggiori informazioni sul PEBA', icona: 'esterno', url: INFO });
  return {
    chiave: `peba-${p.codice}`, peso: 57, strato: 'peba', titolo: 'PEBA – Barriere architettoniche', icona: 'casa',
    badge: p.livello ?? 'Non valutabile',
    contesto: { circoscrizione: p.circoscrizione, quartiere: p.quartiere, upl: p.upl },
    gruppi: [{ titolo: 'Anagrafica', righe: righeAnagrafica(p) }, { titolo: 'Accessibilità', righe: righeAccessibilita(p) }],
    dinamico: () => dinamico(p), link,
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

// Come il tooltip dell'app originale: pallino, «Codice – Nome» e badge; colore e badge seguono la modalità (livello o gruppo).
export function modelloTooltipPeba(p, modo) {
  const nome = p.nome || p.gruppo || '';
  const titolo = p.codice ? (nome ? `${p.codice} – ${nome}` : p.codice) : nome;
  const valore = modo === 'gruppo' ? p.gruppo : (p.livello ?? 'Non valutabile');
  const colore = (modo === 'gruppo' ? COLORE_GRUPPO : COLORE_LIVELLO)[valore] ?? GRIGIO;
  return { titolo, pallino: colore, badge: valore ? { testo: tl(valore), colore: testoBadge(colore) } : undefined };
}

// Punto su cui cliccare per aprire la scheda di un elemento: il punto stesso, o per un'area il centro del riquadro se cade dentro, altrimenti il primo punto interno di una griglia
export function puntoInterno(geometria) {
  if (geometria?.type === 'Point') return geometria.coordinates;
  const poligoni = geometria?.type === 'MultiPolygon' ? geometria.coordinates : geometria?.type === 'Polygon' ? [geometria.coordinates] : [];
  const grande = poligoni.reduce((a, b) => (areaAnello(b[0]) > areaAnello(a?.[0] ?? []) ? b : a), null);
  if (!grande) return null;
  const xs = grande[0].map(c => c[0]);
  const ys = grande[0].map(c => c[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const N = 8;
  const candidati = [[(x0 + x1) / 2, (y0 + y1) / 2]];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) candidati.push([x0 + (x1 - x0) * (i + 0.5) / N, y0 + (y1 - y0) * (j + 0.5) / N]);
  return candidati.find(c => puntoInPoligono(c, grande)) ?? grande[0][0];
}
const areaAnello = anello => Math.abs(anello.reduce((s, [x, y], i) => { const [x2, y2] = anello[(i + 1) % anello.length]; return s + x * y2 - x2 * y; }, 0)) / 2;

// Posto della scheda `codice` tra quelle in elenco, in ordine di codice (AV_2 prima di AV_10)
const ordineCodice = new Intl.Collator('it', { numeric: true }).compare;
export const posizioneScheda = (elenco, codice) => posizioneIn(elenco.map(p => ({ ...p, id: p.codice })).sort((a, b) => ordineCodice(a.codice, b.codice)), codice);

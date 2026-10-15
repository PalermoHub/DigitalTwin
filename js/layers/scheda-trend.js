// Modello puro del trend demografico 2011 → 2021 → 2023 per UPL, quartiere e circoscrizione (ISTAT) con proiezione di tendenza
// al 2030 e al 2035. Il disegno del grafico sta in scheda-trend-dom.js e arriva da `voce.dinamico`.
import { localeIntl, tl } from '../core/i18n.js';

export const FONTE = 'ISTAT, Censimento 2011 (sezioni di censimento), Censimento permanente 2021 e 2023; elaborazione DigitalTwin Palermo: popolazione 2011 ripartita sulle aree attuali per sovrapposizione dei confini';
export const NOTA = 'Il censimento 2011 (tradizionale) e quelli del 2021 e 2023 (permanenti, a campione) non sono pienamente confrontabili. Tra il 2021 e il 2023 le variazioni di una singola area sono in gran parte rumore. La proiezione è uno scenario di tendenza, non una previsione demografica: la fascia va dal minimo al massimo di tre ipotesi (tasso 2011-2021, tasso 2021-2023, retta sui tre dati).';
export const LIVELLI = [['upl', 'UPL'], ['quartiere', 'Quartiere'], ['circoscrizione', 'Circoscrizione']];
export const ORIZZONTI = [2030, 2035];
export const COLORE_CALO = '#7b2cbf';
export const COLORE_CRESCITA = '#2e8b2e';
// variazione % 2011→2021 → colore: viola per il calo, verde per la crescita, chiaro attorno allo zero
export const RAMPA = [[-15, '#7b2cbf'], [-7, '#b78bd9'], [-2, '#e3d3ee'], [0, '#f2f1e4'], [2, '#cfe3a8'], [7, '#8cc152'], [20, '#2e8b2e']];

const num = v => Math.round(Number(v)).toLocaleString(localeIntl());
export const conSegno = (v, cifre = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toLocaleString(localeIntl(), { minimumFractionDigits: cifre, maximumFractionDigits: cifre })}%`;
export const coloreVariazione = v => (v >= 0 ? COLORE_CRESCITA : COLORE_CALO);

// Punti osservati e proiettati per il grafico: {anno, valore, min, max}, i proiettati hanno la fascia.
export function serie(p) {
  const osservati = [[2011, p.p11], [2021, p.p21], [2023, p.p23]].map(([anno, valore]) => ({ anno, valore, osservato: true }));
  const proiettati = ORIZZONTI.filter(a => p[`p${a}_centrale`] != null)
    .map(anno => ({ anno, valore: p[`p${anno}_centrale`], min: p[`p${anno}_min`], max: p[`p${anno}_max`], osservato: false }));
  return [...osservati, ...proiettati];
}

export const nomeLivello = chiave => LIVELLI.find(([c]) => c === chiave)?.[1] ?? '';

// Una sola voce con i livelli presenti nel punto (UPL, quartiere, circoscrizione, in quest'ordine): in alto il confronto
// delle variazioni, sotto il dettaglio di ciascuno (`dinamico`, vedi scheda-trend-dom.js).
export function voceScheda(aree, dinamico) {
  const ordinate = LIVELLI.map(([chiave]) => aree.find(p => p.livello === chiave)).filter(Boolean);
  if (!ordinate.length) return null;
  return {
    chiave: 'trend-popolazione', peso: 70, // tab «Popolazione» della scheda (core/scheda.js)
    strato: 'trend-popolazione', titolo: 'Trend della popolazione 2011-2023', icona: 'popolazione',
    badge: `${tl('Trend')} ${conSegno(ordinate[0].var1121, 0)}`,
    gruppi: [{ titolo: tl('Variazione 2011-2021'), righe: ordinate.map(p => ({ etichetta: `${tl(nomeLivello(p.livello))}: ${p.nome}`, valore: conSegno(p.var1121) })) }],
    dinamico: () => dinamico(ordinate),
    fonte: tl(FONTE),
  };
}

export function modelloTooltipTrend(p) {
  const colore = coloreVariazione(p.var1121);
  return { titolo: p.nome, pallino: colore, badge: { testo: `${tl('Abitanti 2011-2021')} ${conSegno(p.var1121)}`, colore } };
}

// Profilo per il mini-grafico in mappa: punti normalizzati, x da 0 (2011) a 1 (2035) e y da 0 (in alto, massimo) a 1 (in basso,
// minimo), calcolati su tutti i valori compresa la fascia dello scenario. Se l'area non ha proiezione restano i tre dati osservati.
export function profilo(p) {
  const s = serie(p);
  const valori = s.flatMap(d => [d.valore, d.min ?? d.valore, d.max ?? d.valore]);
  const lo = Math.min(...valori);
  const hi = Math.max(...valori);
  const y = v => (hi === lo ? 0.5 : 1 - (v - lo) / (hi - lo));
  return {
    colore: coloreVariazione(p.var1121),
    punti: s.map(d => ({ x: (d.anno - 2011) / (ORIZZONTI.at(-1) - 2011), y: y(d.valore), osservato: d.osservato, ...(d.osservato ? {} : { yMin: y(d.min), yMax: y(d.max) }) })),
  };
}

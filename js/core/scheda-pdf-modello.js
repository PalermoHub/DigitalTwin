// Scheda PDF del percorso Urbanistica: parti pure (quando compare il pulsante, quali sezioni entrano, come si appiattiscono).
// Il disegno del PDF e il caricamento di jsPDF stanno in scheda-pdf.js, che si carica solo al clic.
import { MANCANTE } from './scheda-modello.js';

// Gli strati del percorso «Urbanistica» (core/home-percorsi.json): se uno è acceso, la scheda offre il PDF
export const STRATI_URBANISTICA = ['prg', 'vincoli', 'catasto', 'omi', 'civici'];

export const urbanisticaAttiva = (doc = document) => STRATI_URBANISTICA.some(id => doc.querySelector(`#strato-${id}`)?.checked);

// L'ordine di lettura di un lotto: indirizzo, particella, zonizzazione, vincoli, quotazioni
export const sezioniPdf = sezioni => sezioni
  .filter(s => STRATI_URBANISTICA.includes(s.strato))
  .sort((a, b) => a.peso - b.peso);

const righeValide = righe => (righe ?? []).filter(r => r.valore != null && r.valore !== '' && r.valore !== MANCANTE).map(r => [r.etichetta, String(r.valore)]);

// Sezione del modello scheda -> blocco piatto per il PDF: { titolo, badge, gruppi: [{ titolo, righe: [[etichetta, valore]] }], note }
export function bloccoPdf(s) {
  const gruppi = [
    ...(s.gruppi ?? []).map(g => ({ titolo: g.titolo ?? '', righe: righeValide(g.righe) })),
    ...(s.accordion?.elementi ?? []).map(e => ({ titolo: e.stato ? `${e.titolo} (${e.stato})` : e.titolo, righe: righeValide(e.righe) })),
  ].filter(g => g.righe.length);
  return { titolo: s.titolo, badge: s.badge ?? '', gruppi, note: [s.fonte, s.nota].filter(Boolean) };
}

// Foglio e particella se la scheda li ha, altrimenti le coordinate del clic ("lng,lat")
export function nomeFilePdf(sezioni, punto) {
  const righe = sezioni.find(s => s.chiave === 'particella')?.gruppi?.flatMap(g => g.righe) ?? [];
  const v = nome => righe.find(r => r.etichetta === nome)?.valore;
  if (v('Foglio') && v('Particella')) return `particella_${v('Foglio')}_${v('Particella')}.pdf`;
  const [lng, lat] = String(punto ?? '').split(',').map(Number);
  return Number.isFinite(lng) && Number.isFinite(lat) ? `urbanistica_${lat.toFixed(4)}_${lng.toFixed(4)}.pdf` : 'urbanistica.pdf';
}

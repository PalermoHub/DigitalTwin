// Scheda PDF del percorso Urbanistica: A4 verticale con stralcio di mappa, dati catastali, zonizzazione, vincoli e quotazioni OMI.
// jsPDF (js/vendor/jspdf.umd.min.js) si carica solo al clic. Il contenuto viene dal modello della scheda, non da una nuova interrogazione.
import { sezioniPdf, bloccoPdf, nomeFilePdf } from './scheda-pdf-modello.js';
import { t as tr, tl, lingua } from './i18n.js';

let caricamento = null;
function caricaJsPdf() {
  if (globalThis.jspdf) return Promise.resolve(globalThis.jspdf);
  return caricamento ??= new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/jspdf.umd.min.js', import.meta.url);
    s.onload = () => ok(globalThis.jspdf);
    s.onerror = () => { caricamento = null; s.remove(); no(new Error('jsPDF non caricato')); }; // i18n-ok: messaggio solo per la console
    document.head.append(s);
  });
}

// Helvetica di jsPDF è WinAnsi: accenti, €, ², · e trattini vanno bene, il resto (frecce, emoji) si toglie
const pulisci = s => String(s ?? '').normalize('NFC').replace(/[^\x20-\x7E -ÿ–—‘’“”•€…\n]/g, '');

const INK = [26, 26, 26], MUTED = [110, 110, 110], RULE = [205, 205, 205], ACCENT = [214, 36, 110], ACCENT_TXT = [160, 20, 78];
const M = 15; // margine pagina, mm

// `immagine`: data URL JPEG/PNG dello stralcio di mappa (null se il canvas non era leggibile)
export async function creaSchedaPdf({ sezioni, immagine, mappaLotto = false, area = null, titolo, coordinate, contesto, punto, avvertenza }) {
  const { jsPDF } = await caricaJsPdf();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const CW = W - 2 * M, FOOT = H - 16;
  const ink = c => doc.setTextColor(...c);
  let y = 0;
  const ensure = h => { if (y + h > FOOT) { doc.addPage(); y = M; } };
  const heading = testo => {
    ensure(24);
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); ink(ACCENT_TXT);
    doc.text(pulisci(testo).toUpperCase(), M, y);
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.5); doc.line(M, y + 1.8, M + 12, y + 1.8);
    doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.line(M + 12, y + 1.8, W - M, y + 1.8);
    y += 7;
  };
  const sottotitolo = testo => {
    ensure(10);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); ink(INK);
    doc.text(pulisci(testo), M, y);
    y += 5;
  };
  const riga = (etichetta, valore) => {
    const linee = doc.splitTextToSize(pulisci(valore), CW - 38);
    ensure(linee.length * 4.6 + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); ink(MUTED);
    doc.text(pulisci(etichetta), M, y);
    doc.setFontSize(9.5); ink(INK);
    doc.text(linee, M + 38, y);
    y += linee.length * 4.6 + 1.2;
  };
  const nota = testo => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); ink(MUTED);
    for (const l of doc.splitTextToSize(pulisci(testo), CW)) { ensure(4); doc.text(l, M, y); y += 3.5; }
    y += 1;
  };

  // Testata
  doc.setFillColor(...ACCENT); doc.rect(0, 0, W, 4, 'F');
  y = 18;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); ink(ACCENT_TXT);
  doc.text(pulisci(tr('schedaPdf.sopra')).toUpperCase(), M, y);
  const ora = new Date();
  doc.setFont('helvetica', 'normal'); ink(MUTED);
  doc.text(`${ora.toLocaleDateString(lingua())} ${ora.toLocaleTimeString(lingua(), { hour: '2-digit', minute: '2-digit' })}`, W - M, y, { align: 'right' });
  y += 10;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); ink(INK);
  const titoli = doc.splitTextToSize(pulisci(titolo), CW);
  doc.text(titoli, M, y);
  y += titoli.length * 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); ink(MUTED);
  doc.text(pulisci([coordinate, contesto].filter(Boolean).join(' · ')), M, y);
  y += 6;

  // Avviso: documento informativo
  doc.setFillColor(253, 236, 244); doc.setDrawColor(...ACCENT); doc.setLineWidth(0.4);
  doc.rect(M, y, CW, 12, 'FD');
  doc.setFillColor(...ACCENT); doc.rect(M, y, 2, 12, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); ink(ACCENT_TXT);
  doc.text(pulisci(tr('schedaPdf.avvisoTitolo')).toUpperCase(), M + 6, y + 4.8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); ink(INK);
  doc.text(doc.splitTextToSize(pulisci(tr('schedaPdf.avviso')), CW - 8).slice(0, 1), M + 6, y + 9.2);
  y += 17;

  // Dati chiave (solo quelli che la scheda ha): foglio, particella, zona
  const dato = (chiave, etichetta) => sezioni.find(s => s.chiave === chiave)?.gruppi?.flatMap(g => g.righe).find(r => r.etichetta === etichetta)?.valore;
  const chiavi = [['Foglio', dato('particella', 'Foglio')], ['Particella', dato('particella', 'Particella')], ['Zona', dato('zonizzazione', 'Zona')]].filter(([, v]) => v);
  if (area) chiavi.push([tr('schedaPdf.area'), `${Math.round(area).toLocaleString(lingua())} m²`]);
  if (chiavi.length) {
    const fw = CW / chiavi.length;
    doc.setDrawColor(...RULE); doc.setLineWidth(0.2);
    doc.line(M, y, W - M, y);
    chiavi.forEach(([l, v], i) => {
      const x = M + i * fw;
      if (i) doc.line(x, y + 2, x, y + 15);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); ink(MUTED);
      doc.text(pulisci(tl(l)).toUpperCase(), x + (i ? 4 : 0), y + 6);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); ink(INK);
      doc.text(pulisci(v), x + (i ? 4 : 0), y + 13);
    });
    y += 17;
    doc.line(M, y, W - M, y);
    y += 5;
  }

  // Stralcio di mappa
  if (immagine) {
    const { width, height } = doc.getImageProperties(immagine);
    const h = Math.min(height / width * CW, 130);
    ensure(h + 8);
    doc.addImage(immagine, immagine.startsWith('data:image/png') ? 'PNG' : 'JPEG', M, y, CW, h);
    doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.rect(M, y, CW, h);
    y += h + 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); ink(MUTED);
    doc.text(pulisci(tr(mappaLotto ? 'schedaPdf.mappaLotto' : 'schedaPdf.mappa')), M, y);
    y += 3;
  }

  // Una sezione per strato (indirizzo, particella, zonizzazione, vincoli, quotazioni)
  for (const blocco of sezioni.map(bloccoPdf)) {
    heading(tl(blocco.titolo) + (blocco.badge ? ` · ${tl(blocco.badge)}` : ''));
    if (!blocco.gruppi.length) riga('', tr('schedaPdf.nessunDato'));
    for (const g of blocco.gruppi) {
      if (g.titolo) sottotitolo(tl(g.titolo));
      for (const [e, v] of g.righe) riga(tl(e), tl(v));
    }
    for (const n of blocco.note) nota(tl(n));
  }

  // Fonti e avvertenze
  heading(tr('schedaPdf.fonti'));
  nota(avvertenza);

  // Piè di pagina
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.line(M, H - 12, W - M, H - 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); ink(MUTED);
    doc.text(pulisci(tr('schedaPdf.piede')), M, H - 8);
    doc.text(pulisci(tr('schedaPdf.pagina', { i, n })), W - M, H - 8, { align: 'right' });
  }
  doc.save(nomeFilePdf(sezioni, punto));
}

export { sezioniPdf };

// Grafici delle colonnine di Palermo nella scheda (stile PalermoHub/evcharginglogsicilia, con i colori e i caratteri del viewer):
// indicatore delle colonnine occupate ora e barre dello stato di tutte le colonnine del comune.
export const COLORI = { inUso: '#1971c2', reale: '#2b8a3e', stimata: '#94d3a2', nonAttiva: '#c0392b' };

// Conteggi su tutte le colonnine del comune. «Monitorabili» = quelle di cui si sa se sono in uso (attive con stato in tempo reale):
// le altre attive hanno uno stato solo stimato. Percentuale = in ricarica / monitorabili.
export function statistiche(punti) {
  const s = { totale: punti.length, inUso: 0, reale: 0, stimata: 0, nonAttiva: 0 };
  for (const p of punti) {
    if (p.stato === 'Non attiva') s.nonAttiva++;
    else if (p.stato === 'In ricarica') s.inUso++;
    else if (p.tempo_reale) s.reale++;
    else s.stimata++;
  }
  s.attive = s.inUso + s.reale + s.stimata;
  s.monitorabili = s.inUso + s.reale;
  s.percentuale = s.monitorabili ? (s.inUso / s.monitorabili) * 100 : 0;
  return s;
}

const it = (n, d = 1) => n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function indicatore(s) {
  const box = el('div', 'col-graf');
  box.append(el('h4', 'col-graf-titolo', 'Colonnine occupate ora'));
  const p = Math.min(100, Math.max(0, s.percentuale));
  const svg = el('div', 'col-gauge');
  // semicerchio di raggio 50: pathLength=100 permette di dare la percentuale direttamente a stroke-dasharray
  svg.innerHTML = `<svg viewBox="0 0 120 68" role="img" aria-label="${it(s.percentuale)}% delle colonnine monitorabili è in ricarica">`
    + '<path d="M10 60A50 50 0 0 1 110 60" fill="none" stroke="var(--border)" stroke-width="10" stroke-linecap="round" pathLength="100"/>'
    + (p > 0 ? `<path d="M10 60A50 50 0 0 1 110 60" fill="none" stroke="${COLORI.inUso}" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="${p} 100"/>` : '')
    + '</svg>';
  box.append(svg, el('div', 'col-gauge-val', `${it(s.percentuale, 1)}%`), el('div', 'col-gauge-sub', `${s.inUso} in carica`));
  box.append(el('p', 'col-graf-nota', `${s.inUso} veicoli in carica in questo momento (${it(s.percentuale, 1)}% delle ${s.monitorabili} colonnine dove è possibile avere il monitoraggio).`));
  return box;
}

function barra(segmenti, totale) {
  const b = el('div', 'col-barra');
  for (const g of segmenti.filter(x => x.n > 0)) {
    const seg = el('span', 'col-barra-seg', g.n >= totale * 0.08 ? String(g.n) : '');
    seg.style.flexGrow = String(g.n);
    seg.style.background = g.colore;
    seg.style.color = g.testo ?? '#fff';
    seg.title = `${g.etichetta}: ${g.n} (${it((g.n / totale) * 100)}%)`;
    b.append(seg);
  }
  return b;
}

function totali(s) {
  const box = el('div', 'col-graf');
  box.append(el('h4', 'col-graf-titolo', 'Colonnine totali'));
  const t = el('p', 'col-graf-nota');
  t.append(el('b', null, String(s.totale)), ' colonnine in totale');
  box.append(t);
  const gruppi = [
    { etichetta: 'Attive', n: s.attive, colore: COLORI.reale },
    { etichetta: 'Non attive', n: s.nonAttiva, colore: COLORI.nonAttiva },
  ];
  const dettaglio = [
    { etichetta: 'In uso', n: s.inUso, colore: COLORI.inUso },
    { etichetta: 'Attiva (reale)', n: s.reale, colore: COLORI.reale },
    { etichetta: 'Attiva (stimata)', n: s.stimata, colore: COLORI.stimata, testo: '#1b1f24' },
  ];
  box.append(barra(gruppi, s.totale), el('p', 'col-graf-di-cui', 'di cui attive'), barra(dettaglio, s.attive || 1));
  const legenda = el('div', 'col-legenda');
  for (const g of [...dettaglio, gruppi[1]]) {
    const voce = el('span');
    const pallino = el('i');
    pallino.style.background = g.colore;
    voce.append(pallino, `${g.etichetta} · `, el('b', null, String(g.n)));
    legenda.append(voce);
  }
  box.append(legenda, el('p', 'col-graf-nota', 'Non tutte le colonnine sono monitorabili: «in uso» si vede solo per quelle con stato in tempo reale.'));
  return box;
}

export function graficiColonnine(punti) {
  const s = statistiche(punti);
  const radice = el('div', 'col-grafici');
  radice.append(indicatore(s), totali(s));
  return radice;
}

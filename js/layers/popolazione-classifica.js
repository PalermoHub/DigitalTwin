// Classifica dei residenti per circoscrizione, quartiere e UPL (italiani/stranieri, tendenza 2021→2023),
// la stessa di palermo_popolazione. I totali sono precalcolati in dati/popolazione/classifica.json
// (scripts/compatta_dati.py classifica): [nome, residenti, stranieri] per livello e anno.
export const LIVELLI = {
  circoscrizioni: { campo: 'circoscrizione', bottone: 'Circoscrizione', titolo: 'circoscrizione', prefisso: 'Circ. ', tip: 'Circoscrizione ' },
  quartieri: { campo: 'quartiere', bottone: 'Quartieri', titolo: 'quartiere', prefisso: '', tip: 'Quartiere ' },
  upl: { campo: 'upl', bottone: 'UPL', titolo: 'UPL', prefisso: '', tip: 'UPL ' },
};

const fmt = v => Math.round(v).toLocaleString('it-IT');
let livello = 'circoscrizioni'; // sopravvive alla riapertura della scheda
let promessa = null;

function carica() {
  // config.js legge window: import tardivo, così le funzioni pure si provano anche da node
  promessa ??= import('../core/config.js').then(({ urlDati }) => fetch(urlDati('popolazione/classifica.json')))
    .then(r => { if (!r.ok) throw new Error('classifica popolazione'); return r.json(); })
    .catch(err => { promessa = null; throw err; });
  return promessa;
}

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Variazione percentuale 2021→2023: null se manca uno dei due dati.
export function tendenza(prima, dopo) {
  if (dopo == null || !prima) return null;
  const pct = ((dopo - prima) / prima) * 100;
  const verso = Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down';
  const testo = `${verso === 'up' ? '▲' : verso === 'down' ? '▼' : '≈'} ${pct > 0 ? '+' : ''}${pct.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;
  return { pct, verso, testo, titolo: `2021: ${fmt(prima)} → 2023: ${fmt(dopo)}` };
}

function badge(prima, dopo) {
  const t = tendenza(prima, dopo);
  if (!t) return null;
  const b = el('span', `pop-trend ${t.verso}`, t.testo);
  b.title = t.titolo;
  return b;
}

// `luogo`: { circoscrizione, quartiere, upl } dell'unità in cui cade il punto cliccato (evidenziata nella lista).
export function costruisciClassifica(dati, luogo = {}) {
  const radice = el('div', 'pop-classifica');
  radice.append(el('div', 'pop-classifica-titolo'));
  const bottoni = el('div', 'pop-livelli');
  bottoni.setAttribute('role', 'group');
  bottoni.setAttribute('aria-label', 'Livello della classifica');
  const legenda = el('div', 'pop-legenda');
  legenda.innerHTML = '<span><i class="pop-dot pop-it"></i>Italiani</span><span><i class="pop-dot pop-st"></i>Stranieri</span><span class="pop-legenda-pct">% str.</span>';
  const lista = el('div', 'pop-lista');
  const totale = el('div', 'pop-totale');
  const fonte = el('p', 'scheda-nota scheda-fonte', 'Fonte: ISTAT, Censimento permanente 2021 — sezioni di censimento. Tendenza: aggiornamento 2023, Cruscotto Statistico Comunale (dati.gov.it).');
  radice.append(bottoni, legenda, lista, totale, fonte);

  const btn = {};
  const disegna = () => {
    const cfg = LIVELLI[livello];
    const righe = dati['2021'][livello];
    const del23 = new Map((dati['2023']?.[livello] ?? []).map(([n, t]) => [n, t]));
    const corrente = luogo[cfg.campo];
    const max = righe[0]?.[1] || 1;
    const tot = righe.reduce((a, r) => a + r[1], 0);
    const str = righe.reduce((a, r) => a + r[2], 0);
    const tot23 = dati['2023'] ? [...del23.values()].reduce((a, t) => a + t, 0) : null;

    radice.firstChild.textContent = `Popolazione residente per ${cfg.titolo}`;
    for (const [l, b] of Object.entries(btn)) b.setAttribute('aria-pressed', String(l === livello));
    lista.classList.toggle('lunga', livello !== 'circoscrizioni');

    lista.replaceChildren(...righe.map(([nome, t, st], i) => {
      const pct = t ? (st / t) * 100 : 0;
      const r = el('div', 'pop-riga' + (nome === corrente ? ' corrente' : ''));
      r.title = `${cfg.tip}${nome}\nTotale: ${fmt(t)}\nItaliani: ${fmt(t - st)}\nStranieri: ${fmt(st)} (${pct.toFixed(1)}%)`;
      const barra = el('span', 'pop-barra');
      const it = el('span', 'pop-it'); it.style.width = `${((t - st) / max) * 100}%`;
      const s = el('span', 'pop-st'); s.style.width = `${(st / max) * 100}%`;
      barra.append(it, s);
      r.append(el('span', 'pop-n', i + 1), el('span', 'pop-nome', cfg.prefisso + nome), barra,
        el('span', 'pop-valore', fmt(t)), el('span', 'pop-pct', `${pct.toFixed(1)}%`));
      const b = badge(t, del23.get(nome));
      if (b) r.append(b);
      return r;
    }));

    const v = el('span', 'pop-totale-valore', `${fmt(tot)} · str. ${fmt(str)} (${tot ? ((str / tot) * 100).toFixed(1) : '0.0'}%)`);
    const bt = badge(tot, tot23);
    if (bt) v.append(' ', bt);
    totale.replaceChildren(el('span', null, 'Palermo — totale'), v);

    // porta in vista l'unità del punto dentro la lista scorrevole, senza muovere la scheda
    const cur = lista.querySelector('.corrente');
    lista.scrollTop = cur && lista.scrollHeight > lista.clientHeight ? cur.offsetTop - lista.clientHeight / 2 + cur.offsetHeight / 2 : 0;
  };

  for (const [l, cfg] of Object.entries(LIVELLI)) {
    const b = el('button', 'pop-livello', cfg.bottone);
    b.type = 'button';
    b.addEventListener('click', () => { livello = l; disegna(); });
    btn[l] = b;
    bottoni.append(b);
  }
  disegna();
  return radice;
}

// Contenuto interattivo per la sezione «Sezione di censimento» della scheda: i dati arrivano in un attimo (6 KB).
export function classificaDinamica(luogo) {
  const contenitore = el('div', 'pop-classifica-contenitore');
  carica().then(dati => contenitore.replaceChildren(costruisciClassifica(dati, luogo)), () => {});
  return contenitore;
}

import { unisci, sezioniConRitardo, testoContesto, titoloScheda, separaMancanti, dividiDettaglio, valoreLungo, NOTA_LEGALE } from './scheda-modello.js';
import { svgIcona } from './icone.js';
import { segnala } from './pannello.js';
import {
  applicaPreferenze, registraVisti, elencoPannello, commutaSezione, commutaRiga, azzera, nascondiTutto, tuttoNascosto, nessunaPreferenza,
  leggiPreferenze, salvaPreferenze,
} from './scheda-preferenze.js';
import { ZOOM_SCHEDA } from './config.js';
import { sceltePerLayer, soloCliccato, evidenzia, cancellaEvidenza } from './evidenza.js';

const R = 4; // tolleranza in pixel attorno al clic

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Icona SVG inline della sezione: decorativa, nascosta ai lettori di schermo
function icona(nome) {
  const i = el('span', 'scheda-icona');
  i.dataset.icona = nome;
  i.innerHTML = svgIcona(nome, 16);
  return i;
}

function disegnaRiga(r) {
  const riga = el('div', 'scheda-riga');
  if (r.url) { // etichetta-collegamento (es. scheda di un ufficio sul sito del Comune); il valore va a capo
    const et = el('span', 'scheda-et');
    const a = el('a', null, r.etichetta);
    a.href = r.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    et.append(a);
    riga.append(et);
    riga.classList.add('scheda-riga--lunga');
    if (r.valore) riga.append(el('span', 'scheda-val scheda-val--nota', r.valore));
    return riga;
  }
  riga.append(el('span', 'scheda-et', r.etichetta));
  if (r.classe) {
    const { valore, dettaglio } = dividiDettaglio(r.valore);
    const badge = el('span', 'scheda-val scheda-badge scheda-badge--c' + r.classe);
    badge.title = `Classe ${r.classe} su 5 (1 = migliore)`;
    badge.append(el('span', 'scheda-badge-num', String(r.classe)), ` ${valore}`);
    riga.append(badge);
    if (dettaglio) riga.append(el('span', 'scheda-dettaglio', dettaglio));
  } else {
    riga.append(el('span', 'scheda-val', r.valore));
    if (valoreLungo(r.valore)) riga.classList.add('scheda-riga--lunga');
  }
  return riga;
}

function disegnaGruppo(g) {
  const box = el('div', 'scheda-gruppo');
  if (g.titolo) box.append(el('h4', null, g.titolo));
  const { presenti, mancanti } = separaMancanti(g.righe);
  for (const r of presenti) box.append(disegnaRiga(r));
  if (mancanti.length) box.append(el('p', 'scheda-mancanti', `Non disponibili: ${mancanti.join(', ')}`));
  if (g.griglia?.length) {
    const griglia = el('div', 'scheda-griglia');
    for (const c of g.griglia) {
      const cella = el('div', 'scheda-cella');
      cella.append(el('div', 'scheda-cella-val', c.valore), el('div', 'scheda-cella-chiave', c.chiave));
      griglia.append(cella);
    }
    box.append(griglia);
  }
  return box;
}

function disegnaAccordion(a) {
  const radice = el('details', 'scheda-acc');
  if (a.aperto) radice.open = true;
  const riassunto = el('summary');
  if (a.icona) riassunto.append(icona(a.icona));
  riassunto.append(a.riassunto);
  radice.append(riassunto);
  if (a.suggerimento) radice.append(el('p', 'scheda-suggerimento', a.suggerimento));
  for (const e of a.elementi) {
    const tipo = el('details', 'scheda-tipo');
    const sommario = el('summary');
    sommario.append(el('span', 'scheda-tipo-nome', e.titolo));
    if (e.stato) sommario.append(el('em', 'scheda-tipo-stato', e.stato));
    if (e.anteprima) sommario.append(el('span', 'scheda-tipo-anteprima', e.anteprima));
    tipo.append(sommario);
    if (e.strato) tipo.dataset.strato = e.strato;
    for (const r of e.righe) tipo.append(disegnaRiga(r));
    radice.append(tipo);
  }
  return radice;
}

function disegnaLink(l) {
  const a = el('a', 'scheda-link');
  a.href = l.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (l.suggerimento) a.title = l.suggerimento;
  const testo = el('span');
  if (l.icona) testo.append(icona(l.icona));
  testo.append(l.testo);
  a.append(testo);
  if (l.etichetta) a.append(el('span', 'scheda-link-et', l.etichetta));
  return a;
}

const BREVI = [[/^Particella catastale/i, 'Catasto'], [/^Zonizzazione/i, 'PRG'], [/^Quotazioni OMI/i, 'OMI'], [/^Sezione di censimento/i, 'Censimento'], [/^Terreno/i, 'Terreno']];
function titoloBreve(t) {
  const m = BREVI.find(([re]) => re.test(t));
  return m ? m[1] : t.replace(/\s*\(.*\)\s*$/, '');
}

function riassunto(s) {
  const r = s.gruppi.flatMap(g => g.righe).find(x => x.valore && x.valore !== 'senza dato');
  if (!r) return '';
  const v = String(r.valore);
  return v.length > 26 ? v.slice(0, 25) + '…' : v;
}

// Interruttore «Mappa» nell'intestazione di una sezione: accende o spegne lo strato collegato. Passa dalla casella del
// pannello strati (`#strato-<id>`), unica fonte di verità, come fa la tab Argomenti.
function sincronizzaStrato(b) {
  const origine = document.getElementById(`strato-${b.dataset.strato}`);
  b.hidden = !origine;
  b.disabled = !!origine?.disabled;
  b.setAttribute('aria-pressed', String(!!origine?.checked));
  b.title = origine?.disabled ? origine.title : origine?.checked ? 'Nascondi lo strato dalla mappa' : 'Mostra lo strato sulla mappa';
}

// strati accesi da un interruttore della scheda: si spengono quando la scheda si chiude
const acceseDaScheda = new Set();

function spegniStratiDaScheda() {
  for (const id of acceseDaScheda) {
    const origine = document.getElementById(`strato-${id}`);
    if (!origine?.checked) continue;
    origine.checked = false;
    origine.dispatchEvent(new Event('change', { bubbles: true }));
  }
  acceseDaScheda.clear();
}

function creaInterruttoreStrato(id) {
  const b = el('button', 'scheda-strato', 'Mappa');
  b.type = 'button';
  b.dataset.strato = id;
  b.addEventListener('click', () => {
    const origine = document.getElementById(`strato-${id}`);
    if (!origine || origine.disabled) return;
    origine.checked = !origine.checked;
    acceseDaScheda[origine.checked ? 'add' : 'delete'](id);
    origine.dispatchEvent(new Event('change', { bubbles: true }));
  });
  sincronizzaStrato(b);
  return b;
}

function disegnaSezione(s, i) {
  const titolo = el('h3');
  if (s.icona) titolo.append(icona(s.icona));
  titolo.append(s.titolo);
  for (const b of s.badges ?? (s.badge ? [s.badge] : [])) titolo.append(' ', el('span', 'scheda-tag', b));
  const corpo = [];
  if (s.immagine) {
    const img = el('img', 'scheda-foto');
    img.src = s.immagine.url;
    img.alt = s.immagine.alt;
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    corpo.push(img);
  }
  if (s.testo) corpo.push(el('p', 'scheda-testo', s.testo));
  corpo.push(...s.gruppi.map(disegnaGruppo));
  if (s.dinamico) corpo.push(s.dinamico()); // contenuto interattivo costruito dal layer (es. orari con selettore del giorno)
  if (s.accordion) corpo.push(disegnaAccordion(s.accordion));
  for (const l of [].concat(s.link ?? [])) corpo.push(disegnaLink(l));
  if (s.nota) corpo.push(el('p', 'scheda-nota', s.nota));
  for (const f of s.fonte?.split('\n') ?? []) corpo.push(el('p', 'scheda-nota scheda-fonte', f));

  const sezione = el('details', 'scheda-sez');
  sezione.open = s.aperta !== false;
  sezione.dataset.peso = s.peso;
  const sommario = el('summary');
  sommario.append(titolo);
  const sunto = riassunto(s);
  if (sunto) sommario.append(el('span', 'scheda-riassunto', sunto));
  sezione.append(sommario, ...corpo);
  sezione.dataset.chiave = s.chiave;
  sezione.dataset.titolo = s.titolo;
  if (s.strato) sezione.dataset.strato = s.strato;
  return sezione;
}

const ICONA_ESPANDI = svgIcona('espandi', 18);
const ICONA_RIDUCI = svgIcona('riduci', 18);

const ICONA_INGRANAGGIO = svgIcona('ingranaggio', 18);

const ICONA_X = svgIcona('chiudi', 18);

const NOTA_SALVATE = 'Scegli cosa mostrare nelle schede. Le scelte restano salvate in questo browser.';
const NOTA_LAYER = 'Attenzione: la scelta non attiva il layer dell\u2019argomento sulla mappa, ma solo le sue informazioni nella scheda. Il layer va attivato a mano.';
const NOTA_NON_SALVATE = 'Non riesco a salvare: la scelta vale finché la pagina resta aperta.';

// Pannello «Personalizza»: una casella per sezione e una per riga. Ogni scelta si salva subito e vale per tutte le schede.
// `pref` = { leggi(), scrivi(p) → salvato? }; `aggiorna()` ridisegna il corpo della scheda con le nuove scelte.
function creaPannelloPreferenze(pref, aggiorna) {
  const pannello = el('div', 'scheda-pref');
  pannello.hidden = true;
  const nota = el('p', 'scheda-pref-nota', NOTA_SALVATE);
  const elenco = el('div', 'scheda-pref-elenco');
  const spazioAzioni = el('div', 'scheda-pref-azioni');
  const notaLayer = el('p', 'scheda-pref-nota scheda-pref-nota-layer', NOTA_LAYER);
  const cerca = el('input', 'scheda-pref-cerca');
  cerca.type = 'search';
  cerca.placeholder = 'Cerca argomento…';
  cerca.setAttribute('aria-label', 'Cerca argomento');
  pannello.append(nota, notaLayer, cerca, spazioAzioni, elenco); // i pulsanti sopra la lista: la lista scorre, loro restano a vista

  const casella = (attributo, valore, testo, spuntata) => {
    const label = el('label', 'scheda-pref-voce');
    const input = el('input');
    input.type = 'checkbox';
    input.checked = spuntata;
    input.dataset[attributo] = valore;
    label.append(input, ' ', testo);
    return label;
  };

  const bottone = (classe, testo, azione) => {
    const b = el('button', `scheda-pref-bottone ${classe}`, testo);
    b.type = 'button';
    b.addEventListener('click', azione);
    return b;
  };
  const tutto = bottone('scheda-pref-tutto', 'Seleziona tutto', () => cambia(azzera(pref.leggi())));
  const niente = bottone('scheda-pref-niente', 'Deseleziona tutto', () => cambia(nascondiTutto(pref.leggi())));
  spazioAzioni.append(tutto, niente);

  // le caselle seguono sempre lo stato salvato; «Seleziona tutto» mostra anche le righe nascoste a mano
  function sincronizza() {
    const p = pref.leggi();
    const sezioniNascoste = new Set(p.nascoste.sezioni);
    const righeNascoste = new Set(p.nascoste.righe);
    for (const i of elenco.querySelectorAll('input[data-sezione]')) i.checked = !sezioniNascoste.has(i.dataset.sezione);
    for (const i of elenco.querySelectorAll('input[data-riga]')) {
      i.checked = !righeNascoste.has(i.dataset.riga);
      i.disabled = sezioniNascoste.has(i.dataset.riga.split('/')[0]); // le righe seguono la sezione
    }
    tutto.disabled = nessunaPreferenza(p);
    niente.disabled = tuttoNascosto(p);
  }

  function cambia(nuove) {
    nota.textContent = pref.scrivi(nuove) ? NOTA_SALVATE : NOTA_NON_SALVATE;
    sincronizza();
    aggiorna();
  }

  for (const sez of elencoPannello(pref.leggi())) {
    const gruppo = el('fieldset', 'scheda-pref-sez');
    const intestazione = casella('sezione', sez.tipo, sez.titolo, sez.visibile);
    intestazione.classList.add('scheda-pref-titolo');
    intestazione.querySelector('input').addEventListener('change', e => cambia(commutaSezione(pref.leggi(), sez.tipo, e.target.checked)));
    gruppo.append(intestazione);
    for (const r of sez.righe) {
      const voce = casella('riga', `${sez.tipo}/${r.etichetta}`, r.etichetta, r.visibile);
      voce.querySelector('input').addEventListener('change', e => cambia(commutaRiga(pref.leggi(), sez.tipo, r.etichetta, e.target.checked)));
      gruppo.append(voce);
    }
    elenco.append(gruppo);
  }
  // filtro di sola vista: se il testo è nel titolo della sezione resta tutta, altrimenti restano le righe che lo contengono
  cerca.addEventListener('input', () => {
    const q = cerca.value.trim().toLowerCase();
    for (const gruppo of elenco.children) {
      const titolo = gruppo.querySelector('.scheda-pref-titolo').textContent.toLowerCase();
      const tutta = !q || titolo.includes(q);
      let trovata = tutta;
      for (const voce of gruppo.querySelectorAll('.scheda-pref-voce:not(.scheda-pref-titolo)')) {
        voce.hidden = !tutta && !voce.textContent.toLowerCase().includes(q);
        if (!voce.hidden) trovata = true;
      }
      gruppo.hidden = !trovata;
    }
  });
  sincronizza();
  return pannello;
}

// Indirizzo condivisibile: la posizione cliccata e la scheda attiva stanno nella query (la vista della mappa è già nell'hash).
function aggiornaUrl(lngLat, tab) {
  try {
    const u = new URL(location.href);
    if (lngLat) {
      u.searchParams.set('scheda', `${lngLat.lat.toFixed(5)},${lngLat.lng.toFixed(5)}`);
      if (tab) u.searchParams.set('tab', tab);
    } else { u.searchParams.delete('scheda'); u.searchParams.delete('tab'); }
    history.replaceState(history.state, '', u);
  } catch { /* contesti senza history: nessun link condivisibile */ }
}

const ICONA_COPIA = svgIcona('copia', 18);
const ICONA_OK = svgIcona('seggio', 18);
const ICONA_STAMPA = svgIcona('stampa', 18);

function copiaTesto(testo) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(testo);
  const t = document.createElement('textarea');
  t.value = testo;
  document.body.append(t);
  t.select();
  document.execCommand('copy');
  t.remove();
  return Promise.resolve();
}

function mostra(contenitore, lngLat, dati, chiusura, adattaVista, pref) {
  const { contesto, sezioni, legale } = dati;
  let corrente = dati; // le sezioni RNDT arrivano dopo: `aggiungi` le fonde qui e ridisegna il corpo
  const titoloTesto = titoloScheda(sezioni);
  const titolo = el('h2', null, titoloTesto);
  const x = el('button', 'scheda-x');
  x.type = 'button';
  x.title = 'Chiudi (Esc)';
  x.setAttribute('aria-label', 'Chiudi la scheda');
  x.innerHTML = ICONA_X;
  x.addEventListener('click', chiusura);
  // su mobile la scheda è un foglio basso: il pulsante la porta a tutto schermo per leggerla meglio
  const espandi = el('button', 'scheda-espandi');
  espandi.type = 'button';
  const ALT = ['peek', 'meta', 'pieno'];
  const maniglia = el('button', 'scheda-maniglia');
  maniglia.type = 'button';
  maniglia.setAttribute('aria-label', 'Cambia l\u2019altezza della scheda');
  maniglia.append(el('i'));
  const imposta = alt => { contenitore.dataset.altezza = alt; contenitore.classList.toggle('scheda-piena', alt === 'pieno'); };
  imposta('meta');
  let y0 = 0, mosso = false;
  maniglia.addEventListener('pointerdown', e => { y0 = e.clientY; mosso = false; });
  maniglia.addEventListener('pointerup', e => {
    const dy = e.clientY - y0;
    if (Math.abs(dy) < 30) return;
    mosso = true;
    imposta(ALT[Math.max(0, Math.min(2, ALT.indexOf(contenitore.dataset.altezza) + (dy < 0 ? 1 : -1)))]);
    adattaVista();
  });
  maniglia.addEventListener('click', () => {
    if (mosso) { mosso = false; return; }
    imposta(ALT[(ALT.indexOf(contenitore.dataset.altezza) + 1) % 3]);
    adattaVista();
  });
  // il pannello conosce anche le sezioni di questa scheda: le registra prima di elencarle
  pref.scrivi(registraVisti(pref.leggi(), sezioni));
  const piede = el('footer', 'scheda-piede');
  // visibile solo in stampa, sempre, anche se la nota legale è nascosta dalle preferenze
  const disclaimer = el('p', 'scheda-disclaimer', DISCLAIMER_STAMPA);
  // Schede (tab) per argomento: l'ordine è la gerarchia delle informazioni, dal luogo cliccato ai dati di contesto.
  const SCHEDE = [['luogo', 'Luogo'], ['strumenti', 'Strumenti urbanistici'], ['mercato', 'Mercato'], ['popolazione', 'Popolazione'], ['terreno', 'Terreno'], ['servizi', 'Servizi su strada'], ['rndt', 'Altri dati (RNDT)']];
  const tabDi = (p, chiave = '') => (p === 100 ? 'rndt' : p === 20 || p === 40 || p === 50 || /^(pai|incendio)[:-]/.test(String(chiave)) ? 'strumenti' : p === 60 ? 'mercato' : p === 70 ? 'popolazione' : p === 80 ? 'terreno' : p === 90 ? 'servizi' : 'luogo');
  const tabs = el('div', 'scheda-tabs');
  const prev = el('button', 'scheda-tabs-freccia', '\u2039');
  const next = el('button', 'scheda-tabs-freccia', '\u203a');
  prev.type = next.type = 'button';
  prev.setAttribute('aria-label', 'Scorri le schede a sinistra');
  next.setAttribute('aria-label', 'Scorri le schede a destra');
  const indice = el('nav', 'scheda-indice');
  indice.setAttribute('role', 'tablist');
  indice.setAttribute('aria-label', 'Argomenti della scheda');
  tabs.append(prev, indice, next);
  const frecce = () => {
    const troppo = indice.scrollWidth > indice.clientWidth + 1;
    prev.hidden = next.hidden = !troppo;
    prev.disabled = indice.scrollLeft <= 0;
    next.disabled = indice.scrollLeft + indice.clientWidth >= indice.scrollWidth - 1;
  };
  prev.addEventListener('click', () => indice.scrollBy({ left: -140, behavior: 'smooth' }));
  next.addEventListener('click', () => indice.scrollBy({ left: 140, behavior: 'smooth' }));
  indice.addEventListener('scroll', frecce);
  indice.addEventListener('wheel', e => {
    if (indice.scrollWidth <= indice.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    indice.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
  const corpo = el('div', 'scheda-corpo');
  let attiva = new URLSearchParams(location.search).get('tab');
  let sunti = new Map(); // riepilogo in testa a certe schede: id -> celle { valore, chiave }
  const mostraTab = id => {
    attiva = id;
    aggiornaUrl(lngLat, id);
    for (const sz of corpo.querySelectorAll('.scheda-sez')) sz.hidden = sz.dataset.tab !== id;
    for (const b of indice.children) {
      b.setAttribute('aria-selected', String(b.dataset.tab === id));
      if (b.dataset.tab === id) indice.scrollTo({ left: Math.max(0, b.offsetLeft - 24), behavior: 'smooth' });
    }
    for (const l of piede.querySelectorAll('.scheda-link')) l.hidden = l.dataset.tab !== id;
    piede.hidden = ![...piede.children].some(c => !c.hidden);
    corpo.querySelector('.scheda-sunto')?.remove();
    const celle = sunti.get(id);
    if (celle) {
      const box = el('div', 'scheda-sunto');
      for (const c of celle) {
        const cella = el('div');
        cella.append(el('b', null, c.valore), el('span', null, c.chiave));
        box.append(cella);
      }
      corpo.prepend(box);
    }
    corpo.scrollTop = 0;
  };
  const aggiorna = () => {
    const visibili = applicaPreferenze(corrente, pref.leggi());
    corpo.replaceChildren(...visibili.sezioni.map(disegnaSezione));
    if (!visibili.sezioni.length) corpo.append(el('p', 'scheda-vuota', 'Tutte le informazioni di questa scheda sono nascoste: apri \u00abPersonalizza\u00bb per mostrarle.'));
    // ogni pulsante di approfondimento resta legato al tab della sua sezione: compare solo lì
    const visti = new Set(); // lo stesso indirizzo (es. più zone OMI) compare una volta sola per tab
    const links = [...corpo.querySelectorAll('.scheda-link')].filter(l => {
      const sz = l.closest('.scheda-sez');
      l.dataset.tab = tabDi(+sz.dataset.peso, sz.dataset.chiave);
      const k = `${l.dataset.tab}|${l.href}`;
      return !visti.has(k) && visti.add(k) || l.remove();
    });
    piede.replaceChildren(...links);
    if (visibili.legale) piede.append(el('p', 'scheda-nota scheda-legale', NOTA_LEGALE));
    piede.hidden = !piede.children.length;
    // riepilogo in testa a Mercato, Popolazione e Terreno: tre valori chiave della prima sezione
    sunti = new Map();
    for (const sez of visibili.sezioni) {
      const id = tabDi(sez.peso, sez.chiave);
      if (!['mercato', 'popolazione', 'terreno'].includes(id) || sunti.has(id)) continue;
      const daAccordion = sez.accordion?.elementi?.filter(x => x.anteprima).slice(0, 3).map(x => ({ valore: x.anteprima, chiave: x.titolo }));
      const celle = daAccordion?.length ? daAccordion
        : sez.gruppi.flatMap(g => g.righe).filter(r => r.valore && r.valore !== 'senza dato' && String(r.valore).length <= 10 && !/codice|^id\b|sezione/i.test(r.etichetta))
          .slice(0, 3).map(r => ({ valore: String(r.valore), chiave: r.etichetta }));
      if (celle.length) sunti.set(id, celle);
    }
    for (const sz of corpo.querySelectorAll('.scheda-sez')) sz.dataset.tab = tabDi(+sz.dataset.peso, sz.dataset.chiave);
    // Strumenti urbanistici: l'edificio (duplicato da Luogo) apre il tab, poi catasto, zonizzazione, vincoli del PRG, PAI e incendi
    const edificio = corpo.querySelector('.scheda-sez[data-peso="30"]');
    if (edificio) {
      const copia = edificio.cloneNode(true);
      copia.dataset.tab = 'strumenti';
      corpo.append(copia);
    }
    const ordine = sz => (sz.dataset.peso === '30' ? 0 : sz.dataset.peso === '20' ? 1 : sz.dataset.peso === '40' ? 2 : sz.dataset.peso === '50' ? 3 : String(sz.dataset.chiave).startsWith('pai:') ? 4 : 5);
    const strumenti = [...corpo.querySelectorAll('.scheda-sez')].filter(sz => sz.dataset.tab === 'strumenti').sort((a, b) => ordine(a) - ordine(b));
    corpo.append(...strumenti);
    if (edificio) corpo.prepend(edificio); // anche in Luogo l'edificio è la prima informazione
    const sezioni = [...corpo.querySelectorAll('.scheda-sez')];
    for (const sz of sezioni) if (sz.dataset.strato) sz.querySelector(':scope > summary').append(creaInterruttoreStrato(sz.dataset.strato));
    for (const t of corpo.querySelectorAll('.scheda-tipo[data-strato]')) t.querySelector(':scope > summary').append(creaInterruttoreStrato(t.dataset.strato));
    const presenti = SCHEDE.filter(([id]) => sezioni.some(sz => sz.dataset.tab === id));
    indice.replaceChildren(...presenti.map(([id, nome]) => {
      const b = el('button', null, nome);
      const n = sezioni.filter(sz => sz.dataset.tab === id).length;
      if (n > 1) b.append(el('span', 'scheda-tab-n', String(n)));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.dataset.tab = id;
      b.addEventListener('click', () => mostraTab(id));
      return b;
    }));
    tabs.hidden = presenti.length < 2;
    if (presenti.length < 2) sezioni.forEach(sz => { sz.hidden = false; });
    else mostraTab(presenti.some(([id]) => id === attiva) ? attiva : presenti[0][0]);
    requestAnimationFrame(frecce);
  };
  const pannelloPref = creaPannelloPreferenze(pref, aggiorna);
  const personalizza = el('button', 'scheda-personalizza');
  personalizza.type = 'button';
  personalizza.title = 'Personalizza le informazioni';
  personalizza.setAttribute('aria-label', 'Personalizza le informazioni della scheda');
  personalizza.setAttribute('aria-expanded', 'false');
  personalizza.innerHTML = ICONA_INGRANAGGIO;
  personalizza.addEventListener('click', () => {
    pannelloPref.hidden = !pannelloPref.hidden;
    personalizza.setAttribute('aria-expanded', String(!pannelloPref.hidden));
  });
  const annuncio = el('p', 'solo-lettori', `Scheda aperta: ${titoloTesto}`);
  annuncio.setAttribute('role', 'status');
  const azioni = el('div', 'scheda-azioni');
  const azione = (classe, titolo, icona, fn) => {
    const b = el('button', 'scheda-azione ' + classe);
    b.type = 'button';
    b.title = titolo;
    b.setAttribute('aria-label', titolo);
    b.innerHTML = icona;
    b.addEventListener('click', () => fn(b));
    return b;
  };
  const copia = azione('scheda-copia', 'Copia indirizzo e riferimenti catastali', ICONA_COPIA, async b => {
    const part = sezioni.find(sz => sz.chiave === 'particella')?.gruppi.flatMap(g => g.righe) ?? [];
    const v = nome => part.find(r => r.etichetta === nome)?.valore;
    const righe = [titoloTesto, `${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`];
    if (v('Foglio') && v('Particella')) righe.push(`Foglio ${v('Foglio')}, particella ${v('Particella')}`);
    await copiaTesto(righe.join('\n'));
    b.innerHTML = ICONA_OK;
    b.title = 'Copiato';
    annuncio.textContent = 'Copiato negli appunti';
    setTimeout(() => { b.innerHTML = ICONA_COPIA; b.title = 'Copia indirizzo e riferimenti catastali'; annuncio.textContent = ''; }, 1600);
  });
  const stampa = azione('scheda-stampa', 'Stampa la scheda', ICONA_STAMPA, () => document.dispatchEvent(new CustomEvent('scheda:stampa')));
  azioni.append(copia, stampa, personalizza, x);
  const testata = el('header', 'scheda-intestazione');
  const riga = el('div', 'scheda-testata');
  riga.append(titolo, azioni);
  testata.append(riga, el('p', 'scheda-coordinate', `${lngLat.lat.toFixed(5)}° N, ${lngLat.lng.toFixed(5)}° E`));
  const testo = testoContesto(contesto);
  if (testo) testata.append(el('p', 'scheda-contesto', testo));
  testata.append(pannelloPref, tabs);

  aggiorna();
  // annuncio breve per i lettori di schermo: la scheda intera non è una regione live
  contenitore.replaceChildren(maniglia, testata, corpo, piede, disclaimer, annuncio);
  contenitore.dataset.punto = `${lngLat.lng},${lngLat.lat}`; // per lo stralcio di mappa in stampa
  contenitore.hidden = false;
  corpo.scrollTop = 0;
  adattaVista(lngLat); // la mappa si centra sul punto nella parte rimasta visibile
  return {
    aggiungi(nuovi) {
      const y = corpo.scrollTop;
      corrente = sezioniConRitardo(corrente, nuovi);
      aggiorna();
      corpo.scrollTop = y; // l'arrivo di una risposta non riporta in cima chi sta leggendo
    },
  };
}

const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };

// Spazio che la scheda toglie alla mappa: a destra su desktop, in basso quando è il foglio basso su mobile
// (a tutto schermo la mappa non si vede: nessun margine).
function paddingScheda(contenitore) {
  if (contenitore.hidden) return ZERO;
  const r = contenitore.getBoundingClientRect();
  if (matchMedia('(max-width: 720px)').matches) {
    return contenitore.classList.contains('scheda-piena') ? ZERO : { ...ZERO, bottom: Math.round((document.getElementById('corpo')?.getBoundingClientRect().bottom ?? innerHeight) - r.top) };
  }
  return { ...ZERO, right: Math.round(r.width) };
}

// Il margine della mappa segue la scheda: così il centro di ogni spostamento (Home, ricerca, zoom su una zona)
// è il centro della parte visibile. `centro` = punto da portare lì (avvicinando lo zoom se serve);
// senza, la vista non si muove.
function adattaVistaMappa(map, contenitore, centro) {
  const tela = map.getCanvas();
  const centroVisivo = map.unproject([tela.clientWidth / 2, tela.clientHeight / 2]);
  const vista = { center: centro ?? centroVisivo, padding: paddingScheda(contenitore), duration: centro ? 600 : 300 };
  if (centro) vista.zoom = Math.max(map.getZoom(), ZOOM_SCHEDA);
  map.easeTo(vista);
}

// Prima il punto esatto; per i layer senza risultato, un riquadro di ±R pixel.
function trovaFeature(map, punto, layers) {
  let trovati = map.queryRenderedFeatures(punto, { layers });
  const mancanti = layers.filter(id => !trovati.some(f => f.layer.id === id));
  if (mancanti.length) {
    const riquadro = [[punto.x - R, punto.y - R], [punto.x + R, punto.y + R]];
    trovati = trovati.concat(map.queryRenderedFeatures(riquadro, { layers: mancanti }));
  }
  return trovati;
}

// ritaglia la mappa visibile attorno al punto cliccato e lo cerchia (il canvas ha la risoluzione del dispositivo)
function stralcioConCerchio(map, punto) {
  const sorgente = map.getCanvas();
  const [lng, lat] = (punto ?? '').split(',').map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return sorgente.toDataURL('image/png');
  const k = sorgente.width / sorgente.clientWidth;
  const p = map.project([lng, lat]);
  const px = p.x * k, py = p.y * k;
  const w = sorgente.width, h = Math.min(sorgente.height, Math.round(w / 2));
  const y0 = Math.max(0, Math.min(sorgente.height - h, Math.round(py - h / 2)));
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const g = out.getContext('2d');
  g.drawImage(sorgente, 0, y0, w, h, 0, 0, w, h);
  const r = h * 0.3, y = py - y0;
  // fuori dalla lente la mappa è attenuata, così il punto risalta
  g.fillStyle = 'rgba(255,255,255,.5)';
  g.beginPath(); g.rect(0, 0, w, h); g.arc(px, y, r, 0, 2 * Math.PI, true); g.fill('evenodd');
  // manico della lente, in basso a destra
  const d = Math.SQRT1_2, m0 = [px + r * d, y + r * d], m1 = [px + r * (1 + 0.75) * d, y + r * (1 + 0.75) * d];
  g.lineCap = 'round';
  for (const [spessore, colore] of [[16 * k, '#fff'], [10 * k, '#d6246e']]) {
    g.lineWidth = spessore; g.strokeStyle = colore;
    g.beginPath(); g.moveTo(...m0); g.lineTo(...m1); g.stroke();
  }
  g.lineWidth = 9 * k; g.strokeStyle = '#fff';
  g.beginPath(); g.arc(px, y, r, 0, 2 * Math.PI); g.stroke();
  g.lineWidth = 5 * k; g.strokeStyle = '#d6246e';
  g.beginPath(); g.arc(px, y, r, 0, 2 * Math.PI); g.stroke();
  g.fillStyle = '#d6246e';
  g.beginPath(); g.arc(px, y, 4 * k, 0, 2 * Math.PI); g.fill();
  return out.toDataURL('image/png');
}

const DISCLAIMER_STAMPA = 'Disclaimer: Il Digital Twin \u00e8 uno strumento per informarsi, studiare e capire la citt\u00e0. Non sostituisce i documenti ufficiali. Catasto, Piano Regolatore e vincoli hanno qui valore puramente informativo e non hanno valore legale. Per una visura o per un certificato di destinazione urbanistica occorre rivolgersi a SISTER o agli uffici competenti. Anche i dati sulla popolazione per singolo edificio sono stime campionarie e vanno letti come indicazioni, non come conteggi esatti.';

export function collegaScheda(map, moduli, contenitore, opzioni = {}) {
  const rndt = opzioni.rndt;
  // stampa: tutte le schede aperte e visibili; dopo, si torna alla scheda attiva
  window.addEventListener('beforeprint', () => {
    for (const sz of contenitore.querySelectorAll('.scheda-sez')) { sz.hidden = false; sz.open = true; }
  });
  window.addEventListener('afterprint', () => {
    contenitore.querySelector('.scheda-stralcio')?.remove();
    contenitore.querySelector('.scheda-indice [aria-selected="true"]')?.click();
  });
  // stralcio della mappa visualizzata: il canvas WebGL si legge solo subito dopo un render
  document.addEventListener('scheda:stampa', () => {
    let fatto = false;
    const stampa = async () => {
      if (fatto) return;
      fatto = true;
      try {
        const img = el('img', 'scheda-stralcio');
        img.alt = 'Stralcio della mappa visualizzata';
        img.src = stralcioConCerchio(map, contenitore.dataset.punto);
        await img.decode(); // senza, la stampa parte prima che l'immagine sia pronta
        contenitore.querySelector('.scheda-intestazione')?.after(img);
      } catch { /* canvas non leggibile: si stampa senza stralcio */ }
      window.print();
    };
    map.once('render', stampa);
    map.triggerRepaint();
    setTimeout(stampa, 1500);
  });
  // link condiviso: riapre la scheda nel punto indicato, dopo il primo caricamento dei dati
  const condiviso = new URLSearchParams(location.search).get('scheda');
  if (condiviso) {
    const [lat, lng] = condiviso.split(',').map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.once('idle', () => setTimeout(() => {
        const lngLat = new maplibregl.LngLat(lng, lat);
        map.fire('click', { point: map.project(lngLat), lngLat });
      }, 800));
    }
  }
  const conScheda = moduli.filter(m => m.scheda);
  // gli strati si accendono anche dal pannello: gli interruttori nella scheda aperta si riallineano
  document.addEventListener('change', e => {
    if (String(e.target.id).startsWith('strato-')) {
      if (!e.target.checked) acceseDaScheda.delete(e.target.id.slice(7)); // spento a mano: non va più spento alla chiusura
      contenitore.querySelectorAll('.scheda-strato').forEach(sincronizzaStrato);
    }
  });
  // le scelte sulle informazioni da mostrare stanno in memoria e, se il browser lo permette, in localStorage
  const archivio = (() => { try { return window.localStorage; } catch { return null; } })();
  let preferenze = leggiPreferenze(archivio);
  const pref = { leggi: () => preferenze, scrivi: p => { preferenze = p; return salvaPreferenze(archivio, p); } };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !contenitore.hidden) contenitore.querySelector('.scheda-x')?.click();
  });
  map.on('click', e => {
    const voci = [];
    const trovatiTutti = [];
    for (const m of conScheda) {
      const layers = m.scheda.layers.filter(id => map.getLayer(id));
      if (!layers.length) continue;
      const trovati = trovaFeature(map, e.point, layers);
      trovatiTutti.push(...trovati);
      voci.push(...m.scheda.voci(trovati, e.lngLat));
    }
    const interrogabili = rndt ? rndt.layerAlPunto(e.lngLat) : [];
    if (interrogabili.length) voci.push(rndt.segnaposto()); // la scheda si apre subito: le risposte dei servizi arrivano dopo
    const adattaVista = centro => adattaVistaMappa(map, contenitore, centro);
    const chiudiScheda = () => { spegniStratiDaScheda(); aggiornaUrl(null); contenitore.hidden = true; contenitore.classList.remove('scheda-piena'); cancellaEvidenza(map); adattaVista(); };
    const dati = unisci(voci);
    if (!dati.sezioni.length) { // clic su un punto vuoto
      chiudiScheda();
      segnala(map.getZoom() < 14 ? 'Nessun dato in questo punto: avvicina lo zoom o accendi uno strato.' : 'Nessun dato in questo punto.');
      return;
    }
    // I layer RNDT si interrogano subito, come i layer nativi (trovaFeature): scheda e evidenza adattano la vista della mappa
    // (con «riduci animazioni» attivo lo spostamento è immediato), e dopo non si saprebbe più cosa c'era sotto il clic.
    const risposte = interrogabili.length ? rndt.interroga(interrogabili, e.lngLat, e.point, map.getZoom()) : null;
    const extra = voci.flatMap(v => v.evidenza ?? []); // luoghi vicini che un layer vuole vedere sulla mappa
    const base = soloCliccato(sceltePerLayer(trovatiTutti, e.lngLat));
    for (const m of conScheda) m.scheda.suEvidenza?.(base); // chi ridisegna l'evidenza dopo il clic (es. percorso di una linea) tiene anche questa
    const scelte = [...base, ...extra];
    evidenzia(map, scelte);
    const scheda = mostra(contenitore, e.lngLat, dati, chiudiScheda, adattaVista, pref);
    if (risposte) {
      const punto = contenitore.dataset.punto;
      risposte.then(nuove => {
        if (contenitore.hidden || contenitore.dataset.punto !== punto) return; // la scheda ora è su un altro punto, o chiusa
        scheda.aggiungi(unisci(nuove));
      });
    }
  });
}

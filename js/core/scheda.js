import { unisci, testoContesto, titoloScheda, separaMancanti, dividiDettaglio, valoreLungo, NOTA_LEGALE } from './scheda-modello.js';
import { svgIcona } from './icone.js';
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

function disegnaSezione(s) {
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
  if (s.link) corpo.push(disegnaLink(s.link));
  if (s.nota) corpo.push(el('p', 'scheda-nota', s.nota));
  for (const f of s.fonte?.split('\n') ?? []) corpo.push(el('p', 'scheda-nota scheda-fonte', f));

  let sezione;
  if (s.collassabile) {
    sezione = el('details', 'scheda-sez');
    sezione.open = s.aperta !== false;
    const sommario = el('summary');
    sommario.append(titolo);
    sezione.append(sommario, ...corpo);
  } else {
    sezione = el('section', 'scheda-sez');
    sezione.append(titolo, ...corpo);
  }
  sezione.dataset.chiave = s.chiave;
  sezione.dataset.titolo = s.titolo;
  return sezione;
}

const ICONA_ESPANDI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
const ICONA_RIDUCI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>';

const ICONA_INGRANAGGIO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';

const ICONA_X = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

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

function mostra(contenitore, lngLat, dati, chiusura, adattaVista, pref) {
  const { contesto, sezioni, legale } = dati;
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
  const imposta = piena => {
    contenitore.classList.toggle('scheda-piena', piena);
    espandi.innerHTML = piena ? ICONA_RIDUCI : ICONA_ESPANDI;
    espandi.title = piena ? 'Riduci la scheda' : 'Schermo intero';
    espandi.setAttribute('aria-label', espandi.title);
    espandi.setAttribute('aria-pressed', String(piena));
  };
  imposta(false);
  espandi.addEventListener('click', () => { imposta(!contenitore.classList.contains('scheda-piena')); adattaVista(); });
  // il pannello conosce anche le sezioni di questa scheda: le registra prima di elencarle
  pref.scrivi(registraVisti(pref.leggi(), sezioni));
  const corpo = el('div', 'scheda-corpo');
  const aggiorna = () => {
    const visibili = applicaPreferenze(dati, pref.leggi());
    corpo.replaceChildren(...visibili.sezioni.map(disegnaSezione));
    if (!visibili.sezioni.length) corpo.append(el('p', 'scheda-vuota', 'Tutte le informazioni di questa scheda sono nascoste: apri «Personalizza» per mostrarle.'));
    if (visibili.legale) corpo.append(el('p', 'scheda-nota scheda-legale', NOTA_LEGALE));
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
  const azioni = el('div', 'scheda-azioni');
  azioni.append(personalizza, espandi, x);
  const testata = el('header', 'scheda-intestazione');
  const riga = el('div', 'scheda-testata');
  riga.append(titolo, azioni);
  testata.append(riga, el('p', 'scheda-coordinate', `${lngLat.lat.toFixed(5)}° N, ${lngLat.lng.toFixed(5)}° E`));
  const testo = testoContesto(contesto);
  if (testo) testata.append(el('p', 'scheda-contesto', testo));
  testata.append(pannelloPref);

  aggiorna();
  // annuncio breve per i lettori di schermo: la scheda intera non è una regione live
  const annuncio = el('p', 'solo-lettori', `Scheda aperta: ${titoloTesto}`);
  annuncio.setAttribute('role', 'status');
  contenitore.replaceChildren(testata, corpo, annuncio);
  contenitore.hidden = false;
  corpo.scrollTop = 0;
  adattaVista(lngLat); // la mappa si centra sul punto nella parte rimasta visibile
}

const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };

// Spazio che la scheda toglie alla mappa: a destra su desktop, in basso quando è il foglio basso su mobile
// (a tutto schermo la mappa non si vede: nessun margine).
function paddingScheda(contenitore) {
  if (contenitore.hidden) return ZERO;
  const r = contenitore.getBoundingClientRect();
  if (matchMedia('(max-width: 720px)').matches) {
    return contenitore.classList.contains('scheda-piena') ? ZERO : { ...ZERO, bottom: Math.round(innerHeight - r.top) };
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

export function collegaScheda(map, moduli, contenitore) {
  const conScheda = moduli.filter(m => m.scheda);
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
    const adattaVista = centro => adattaVistaMappa(map, contenitore, centro);
    const chiudiScheda = () => { contenitore.hidden = true; contenitore.classList.remove('scheda-piena'); cancellaEvidenza(map); adattaVista(); };
    const dati = unisci(voci);
    if (!dati.sezioni.length) { chiudiScheda(); return; } // clic su un punto vuoto
    const extra = voci.flatMap(v => v.evidenza ?? []); // luoghi vicini che un layer vuole vedere sulla mappa
    const base = soloCliccato(sceltePerLayer(trovatiTutti, e.lngLat));
    for (const m of conScheda) m.scheda.suEvidenza?.(base); // chi ridisegna l'evidenza dopo il clic (es. percorso di una linea) tiene anche questa
    const scelte = [...base, ...extra];
    evidenzia(map, scelte);
    mostra(contenitore, e.lngLat, dati, chiudiScheda, adattaVista, pref);
  });
}

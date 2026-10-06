import { svgIcona } from './icone.js';
import { applicaOpacita } from './opacita.js';
import { limitiStrato, zoomMinimoStrato } from './zoom-strato.js';
import { creaPannelloTema } from './pannello-tema.js';
import { ordinaSezioni, leggiAperte, salvaAperta } from './layer-sezioni.js';
import { ordina, mosseMappa, mosseSequenza, applicaMosse, leggiOrdine, salvaOrdine, azzeraOrdine, ordineStrati, mosseVicino, mosseOrdine, leggiOrdineDisegno, salvaOrdineDisegno, azzeraOrdineDisegno } from './riordino.js';

// Il pannello «Ordine layer in mappa» e i gruppi si avvisano a vicenda quando cambia l'ordine degli strati sulla mappa.
const EVENTO_DISEGNO = 'dt:ordine-disegno';
const EVENTO_GRUPPO = 'dt:ordine-gruppo';

const mostrati = new Set();
const DURATA_AVVISO = 8000;

// Avviso non bloccante: ha il pulsante di chiusura e sparisce da solo; lo stesso testo non si impila due volte
// finché è visibile, ma può ricomparire dopo la chiusura.
const errori = new Set();

// Più strati non caricati si riassumono in un solo avviso (la copia non ha tutti i dati locali).
export function segnala(testo) {
  let riassunto = false;
  if (testo.startsWith('Strato non caricato')) {
    errori.add(testo.replace(/^Strato non caricato:\s*/, ''));
    riassunto = true;
    document.querySelector('#avvisi [data-errori] button')?.click();
    testo = errori.size === 1 ? `Strato non caricato: ${[...errori][0]}` : `${errori.size} strati non caricati: dati non raggiungibili`;
  }
  if (mostrati.has(testo)) return;
  mostrati.add(testo);
  const d = document.createElement('div');
  if (riassunto) d.dataset.errori = '1';
  const t = document.createElement('span');
  t.textContent = testo;
  const x = document.createElement('button');
  x.type = 'button';
  x.title = 'Chiudi';
  x.setAttribute('aria-label', 'Chiudi l\'avviso');
  x.innerHTML = svgIcona('chiudi', 14);
  const chiudi = () => { clearTimeout(timer); d.remove(); mostrati.delete(testo); };
  const timer = setTimeout(chiudi, DURATA_AVVISO);
  x.addEventListener('click', chiudi);
  d.append(t, x);
  document.getElementById('avvisi').append(d);
}

function imposta(map, ids, visibile) {
  for (const id of ids) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibile ? 'visible' : 'none');
  }
}

const ETICHETTE = { base: 'Mappe di base', layer: 'Layer', filtri: 'Filtri', popolazione: 'Popolazione', confini: 'Confini', territorio: 'Territorio', edifici: 'Edifici', terreno: 'Rilievo', trasporto: 'Trasporti', pai: 'Piano PAI', monumenti: 'Monumenti', scuole: 'Scuole', uffici: 'Uffici', colonnine: 'Servizi', incendi: 'Incendi', 'isole-calore': 'Isole di calore', sicurezza: 'Sicurezza', miei: 'I miei layer' };

// I soli gruppi che hanno un tab proprio; tutti gli altri sono sezioni del tab «Layer».
const TAB_DIRETTI = new Set(['base', 'rndt', 'miei', 'filtri']);
// Titolo di un gruppo: il `summary` di una sezione, altrimenti l'`h2` del pannello. Barre e campi si inseriscono dopo.
const intestazione = el => el.querySelector(':scope > summary') ?? el.querySelector('h2');

// Totale degli strati accesi (mostrato sul pulsante «Strati» di mobile)
function aggiornaConteggio() {
  const caselle = [...document.querySelectorAll('#pannello input[type=checkbox]:checked:not([data-filtro])')];
  const el = document.getElementById('strati-attivi');
  if (el) el.textContent = String(caselle.length);
  const tabLayer = document.getElementById('btn-gruppo-layer');
  if (tabLayer) {
    const n = document.querySelectorAll('#gruppo-layer input[type=checkbox]:checked:not([data-filtro])').length;
    tabLayer.dataset.attivo = String(n > 0);
    tabLayer.dataset.n = String(n);
  }
  // chip degli strati accesi: si spengono con un clic
  const chip = document.getElementById('strati-chip');
  if (!chip) return;
  const MAX = 4;
  const voci = caselle.slice(0, MAX).map(c => {
    const nome = c.closest('label')?.textContent.replace(/\s+/g, ' ').trim() || c.id;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'strato-chip';
    b.title = `Spegni: ${nome}`;
    b.setAttribute('aria-label', `Spegni lo strato ${nome}`);
    const t = document.createElement('span');
    t.textContent = nome;
    const x = document.createElement('i');
    x.textContent = '\u00d7';
    x.setAttribute('aria-hidden', 'true');
    b.append(t, x);
    b.addEventListener('click', () => { c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    return b;
  });
  if (caselle.length > MAX) {
    const altri = document.createElement('span');
    altri.className = 'strato-chip strato-chip--altri';
    altri.textContent = `+${caselle.length - MAX}`;
    voci.push(altri);
  }
  chip.replaceChildren(...voci);
}

function bottoneGruppo(id, titolo) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'rail-tab';
  b.id = `btn-gruppo-${id}`;
  b.title = titolo;
  b.setAttribute('aria-label', titolo);
  b.setAttribute('aria-expanded', 'false');
  b.setAttribute('aria-controls', `gruppo-${id}`);
  b.innerHTML = `${id === 'rndt' ? '<span class="icona-puzzle" aria-hidden="true"></span>' : svgIcona(id === 'base' ? 'mappa' : id) || svgIcona('info')}<span class="et">${ETICHETTE[id] ?? titolo}</span>`;
  return b;
}

// Interruttore a occhio: la casella resta (accessibilità, id, eventi) ma si vede solo l'icona.
export function occhio() {
  const o = document.createElement('span');
  o.className = 'occhio';
  o.setAttribute('aria-hidden', 'true');
  o.innerHTML = '<svg class="on" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>'
    + '<svg class="off" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.7 10.7 0 0 1 12 19C5.5 19 1.5 12 1.5 12a18.5 18.5 0 0 1 4.6-5.4M9.9 5.2A9.9 9.9 0 0 1 12 5c6.5 0 10.5 7 10.5 7a18.6 18.6 0 0 1-2.2 3.2M1 1l22 22"/></svg>';
  return o;
}

// Cursore «Opacità» sotto lo strato: visibile solo a strato acceso (la casella resta l'interruttore on/off).
export function sliderOpacita(map, strato, cb, stato = { originali: new Map(), valore: 1 }) {
  const { originali } = stato;
  const riga = document.createElement('div');
  riga.className = 'strato-opacita';
  const t = document.createElement('span');
  t.textContent = 'Opacità';
  const r = document.createElement('input');
  r.type = 'range';
  r.min = '0';
  r.max = '1';
  r.step = '0.05';
  r.value = String(stato.valore);
  r.dataset.opacita = strato.id;
  r.setAttribute('aria-label', `Opacità di ${strato.etichetta}`);
  const v = document.createElement('output');
  v.textContent = stato.valore.toFixed(2);
  r.addEventListener('input', () => {
    stato.valore = Number(r.value);
    v.textContent = stato.valore.toFixed(2);
    applicaOpacita(map, strato.layers, Number(r.value), originali);
  });
  const z = document.createElement('button');
  z.type = 'button';
  z.className = 'strato-zoom';
  z.dataset.zoomStrato = strato.id;
  z.title = z.ariaLabel = `Zoom su ${strato.etichetta}`;
  z.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>';
  z.addEventListener('click', async () => {
    const area = map.getMaxBounds()?.toArray(); // area di lavoro: [[o, s], [e, n]]
    const b = await limitiStrato(map, strato.layers, area && [...area[0], ...area[1]]);
    const riquadro = b ? [[b[0], b[1]], [b[2], b[3]]] : area;
    const opzioni = { padding: 60, maxZoom: 17, duration: 600 };
    const minimo = zoomMinimoStrato(map, strato.layers);
    const cam = map.cameraForBounds(riquadro, { padding: opzioni.padding, maxZoom: opzioni.maxZoom });
    // Se l'inquadratura è sotto il minzoom dello strato, lo strato resterebbe invisibile: sale fino al suo zoom minimo.
    if (cam && cam.zoom < minimo) map.easeTo({ center: cam.center, zoom: minimo, duration: opzioni.duration });
    else map.fitBounds(riquadro, opzioni);
  });
  const tema = creaPannelloTema(map, strato, stato);
  riga.append(t, r, v, z, tema.bottone, tema.pannello);
  cb.addEventListener('change', tema.aggiorna);
  const mostra = () => { riga.hidden = !cb.checked; };
  cb.addEventListener('change', mostra);
  mostra();
  return riga;
}

// Blocchi di un gruppo: ogni strato con ciò che lo segue (opacità, filtri, albero) fino allo strato o al titolo di sezione
// successivi. Il titolo di sezione viaggia con lo strato che lo segue, così gli strati si spostano in tutto il gruppo.
function blocchi(gruppo) {
  const r = [];
  let corrente = null;
  let titoli = [];
  for (const n of gruppo.children) {
    if (n.matches('label.strato, .rndt-gruppo-riga')) { // la riga RNDT affianca al label il pulsante «Rimuovi»
      const casella = n.querySelector('input[type=checkbox]');
      r.push(corrente = { riga: n, nodi: [...titoli, n], id: casella?.id.replace(/^strato-/, '') ?? '' });
      titoli = [];
    } else if (n.matches('h3.gruppo-sezione')) { titoli.push(n); corrente = null; } else if (corrente) corrente.nodi.push(n);
  }
  return r;
}
// Parti del blocco che si ripiegano: tutto tranne titolo, riga dello strato e suo cursore di opacità.
const ramo = b => b.nodi.slice(b.nodi.indexOf(b.riga) + 1).filter(n => !n.classList.contains('strato-opacita'));

function bottoneAzione(azione, titolo) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `strato-btn strato-btn--${azione}`;
  b.dataset.azione = azione;
  b.title = titolo;
  b.setAttribute('aria-label', titolo);
  return b;
}

// Albero ripiegabile e strati riordinabili (frecce o trascinamento) di un gruppo del pannello.
// In alto nell'elenco = sopra sulla mappa; l'ordine scelto resta salvato nel browser.
// Con `daElenco` il gruppo si ridisegna a ogni cambio (RNDT): «Ripristina ordine» torna all'ordine dell'elenco.
export function abilitaRiordino(map, gruppo, layersDi, storage, { daElenco = false } = {}) {
  const idGruppo = gruppo.id;
  const iniziali = blocchi(gruppo);
  if (!iniziali.length) return;
  const stackIniziale = () => map.getStyle().layers.map(l => l.id);
  const layersGruppo = () => iniziali.flatMap(b => layersDi.get(b.id) ?? []);
  const originale = (() => { const s = new Set(layersGruppo()); return stackIniziale().filter(id => s.has(id)); })();
  const ordineIniziale = iniziali.map(b => b.id);

  const impostaRamo = (b, chiuso) => {
    for (const n of ramo(b)) n.classList.toggle('albero-chiuso', chiuso);
    b.riga.dataset.albero = chiuso ? 'chiuso' : 'aperto';
    b.riga.querySelector('[data-azione=albero]')?.setAttribute('aria-expanded', String(!chiuso));
  };
  const aggiornaStrumenti = () => {
    const aperti = blocchi(gruppo).some(b => ramo(b).length && b.riga.dataset.albero !== 'chiuso');
    if (tutto) tutto.textContent = aperti ? 'Comprimi tutto' : 'Espandi tutto';
  };
  const aggiornaFrecce = () => {
    const tutti = blocchi(gruppo);
    for (const b of tutti) {
      const i = tutti.indexOf(b);
      b.riga.querySelector('[data-azione=su]').disabled = i === 0;
      b.riga.querySelector('[data-azione=giu]').disabled = i === tutti.length - 1;
      // da solo nel gruppo non c'è nulla da spostare
      for (const a of ['su', 'giu', 'trascina']) b.riga.querySelector(`[data-azione=${a}]`).hidden = tutti.length < 2;
    }
  };
  const salvaEMappa = () => {
    const tutti = blocchi(gruppo);
    salvaOrdine(storage, idGruppo, tutti.map(b => b.id));
    applicaMosse(map, mosseMappa(stackIniziale(), tutti.map(b => layersDi.get(b.id) ?? [])));
    aggiornaFrecce();
    document.dispatchEvent(new CustomEvent(EVENTO_GRUPPO));
  };
  // l'«Ordine layer in mappa» ha cambiato lo stack: gli strati del gruppo si rimettono nell'ordine in cui sono disegnati
  const sincronizza = () => {
    const tutti = blocchi(gruppo);
    if (tutti.length < 2) return;
    const indice = new Map(stackIniziale().map((id, i) => [id, i]));
    const cima = b => Math.max(-1, ...(layersDi.get(b.id) ?? []).filter(id => indice.has(id)).map(id => indice.get(id)));
    if (tutti.some(b => cima(b) < 0)) return;
    const voluto = tutti.map((b, i) => ({ b, i, k: cima(b) })).sort((x, y) => y.k - x.k || x.i - y.i).map(x => x.b);
    if (voluto.every((b, i) => b === tutti[i])) return;
    let dopo = tutti[0].nodi[0].previousElementSibling;
    for (const b of voluto) { dopo.after(...b.nodi); dopo = b.nodi.at(-1); }
    aggiornaFrecce();
  };
  if (!daElenco) document.addEventListener(EVENTO_DISEGNO, sincronizza);
  // sposta il blocco di `verso` posizioni (-1 su, +1 giù); false se non può
  const muovi = (riga, verso) => {
    const tutti = blocchi(gruppo);
    const b = tutti.find(x => x.riga === riga);
    const vicino = tutti[tutti.indexOf(b) + verso];
    if (!vicino) return false;
    if (verso < 0) vicino.nodi[0].before(...b.nodi);
    else vicino.nodi.at(-1).after(...b.nodi);
    return true;
  };

  // controlli su ogni riga strato (la casella a tutta riga resta sotto: i pulsanti stanno sopra)
  for (const b of iniziali) {
    const azioni = document.createElement('span');
    azioni.className = 'strato-azioni';
    const nome = b.riga.textContent.trim();
    const su = bottoneAzione('su', `Sposta su ${nome}`);
    const giu = bottoneAzione('giu', `Sposta giù ${nome}`);
    const maniglia = bottoneAzione('trascina', 'Trascina per spostare');
    maniglia.removeAttribute('aria-label');
    maniglia.setAttribute('aria-hidden', 'true');
    maniglia.tabIndex = -1;
    if (ramo(b).length) {
      const albero = bottoneAzione('albero', 'Apri o chiudi i dati dello strato');
      albero.setAttribute('aria-expanded', 'true');
      albero.addEventListener('click', e => { e.preventDefault(); impostaRamo(b, b.riga.dataset.albero !== 'chiuso'); aggiornaStrumenti(); });
      azioni.append(albero);
    }
    su.addEventListener('click', e => { e.preventDefault(); if (muovi(b.riga, -1)) salvaEMappa(); });
    giu.addEventListener('click', e => { e.preventDefault(); if (muovi(b.riga, 1)) salvaEMappa(); });
    maniglia.addEventListener('pointerdown', e => {
      e.preventDefault();
      const prima = blocchi(gruppo).map(x => x.id).join();
      b.riga.classList.add('trascinato');
      const segui = ev => {
        const meta = x => { const r = x.riga.getBoundingClientRect(); return r.top + r.height / 2; };
        for (let passi = 0; passi < 50; passi++) { // un movimento rapido può scavalcare più strati
          const tutti = blocchi(gruppo);
          const i = tutti.findIndex(x => x.riga === b.riga);
          if (i > 0 && ev.clientY < meta(tutti[i - 1])) muovi(b.riga, -1);
          else if (i < tutti.length - 1 && ev.clientY > meta(tutti[i + 1])) muovi(b.riga, 1);
          else break;
        }
      };
      const fine = () => {
        document.removeEventListener('pointermove', segui);
        document.removeEventListener('pointerup', fine);
        document.removeEventListener('pointercancel', fine);
        b.riga.classList.remove('trascinato');
        if (blocchi(gruppo).map(x => x.id).join() !== prima) salvaEMappa();
      };
      // sul document: spostando i nodi la maniglia si stacca dal DOM e perderebbe i suoi eventi
      document.addEventListener('pointermove', segui);
      document.addEventListener('pointerup', fine);
      document.addEventListener('pointercancel', fine);
    });
    azioni.append(su, giu, maniglia);
    const togli = b.riga.querySelector('.rndt-gruppo-togli');
    if (togli) togli.before(azioni); else b.riga.append(azioni);
  }

  // strumenti del gruppo: comprimi/espandi tutto e, con più strati, ripristino dell'ordine
  const barra = document.createElement('div');
  barra.className = 'strato-strumenti';
  const conRami = iniziali.some(b => ramo(b).length);
  const riordinabile = iniziali.length > 1;
  let tutto = null;
  if (conRami) {
    tutto = document.createElement('button');
    tutto.type = 'button';
    tutto.className = 'strato-strumento';
    tutto.dataset.azione = 'tutto';
    tutto.addEventListener('click', () => {
      const chiudi = blocchi(gruppo).some(b => ramo(b).length && b.riga.dataset.albero !== 'chiuso');
      for (const b of blocchi(gruppo)) if (ramo(b).length) impostaRamo(b, chiudi);
      aggiornaStrumenti();
    });
    barra.append(tutto);
  }
  if (riordinabile) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'strato-strumento';
    reset.dataset.azione = 'ripristina';
    reset.textContent = 'Ripristina ordine';
    reset.addEventListener('click', () => {
      const tutti = blocchi(gruppo);
      const per = new Map(tutti.map(b => [b.id, b]));
      let dopo = tutti[0].nodi[0].previousElementSibling;
      for (const id of ordineIniziale) { dopo.after(...per.get(id).nodi); dopo = per.get(id).nodi.at(-1); }
      azzeraOrdine(storage, idGruppo);
      applicaMosse(map, daElenco ? mosseMappa(stackIniziale(), blocchi(gruppo).map(b => layersDi.get(b.id) ?? [])) : mosseSequenza(stackIniziale(), originale));
      aggiornaFrecce();
      document.dispatchEvent(new CustomEvent(EVENTO_GRUPPO));
    });
    barra.append(reset);
  }
  if (barra.children.length) intestazione(gruppo).after(barra);

  // ordine salvato in una visita precedente
  const salvato = leggiOrdine(storage)[idGruppo];
  if (Array.isArray(salvato) && riordinabile) {
    const tutti = blocchi(gruppo);
    const per = new Map(tutti.map(b => [b.id, b]));
    let dopo = tutti[0].nodi[0].previousElementSibling;
    for (const id of ordina(tutti.map(b => b.id), salvato)) { dopo.after(...per.get(id).nodi); dopo = per.get(id).nodi.at(-1); }
    applicaMosse(map, mosseMappa(stackIniziale(), blocchi(gruppo).map(b => layersDi.get(b.id) ?? [])));
  }
  aggiornaFrecce();
  aggiornaStrumenti();
}

// Sezione «Ordine layer in mappa» del tab Layer: tutti gli strati accesi, di qualsiasi gruppo, in un unico elenco.
// In alto = sopra sulla mappa; frecce e trascinamento lo cambiano, l'ordine resta salvato nel browser.
function creaOrdineDisegno(map, moduli, storage, iniziale) {
  // gli strati dei gruppi dinamici (RNDT, «I miei layer») arrivano a runtime: l'elenco si rilegge a ogni ridisegno
  // (stessa lista e stessa mappa, così chi li ha ricevuti vede sempre quelli aggiornati)
  const strati = [];
  const per = new Map();
  const aggiornaStrati = () => {
    strati.splice(0, strati.length, ...moduli.flatMap(m => m.strati.map(s => ({ id: s.id, etichetta: s.etichetta, layers: s.layers ?? [], da: ETICHETTE[m.gruppo ?? m.id] ?? m.titolo }))));
    per.clear();
    for (const s of strati) per.set(s.id, s);
  };
  aggiornaStrati();
  const stack = () => map.getStyle().layers.map(l => l.id);
  const attivo = id => document.getElementById(`strato-${id}`)?.checked;

  const el = document.createElement('details');
  el.id = 'ordine-disegno';
  el.className = 'layer-sezione ordine-strumento'; // una scheda con l'accento: è uno strumento, non un gruppo di strati
  const sommario = document.createElement('summary');
  const icona = document.createElement('span');
  icona.className = 'ordine-ico';
  icona.innerHTML = svgIcona('ordine', 20);
  const testi = document.createElement('span');
  testi.className = 'ordine-testi';
  const h = document.createElement('h2');
  h.textContent = 'Ordine layer in mappa';
  const sotto = document.createElement('small');
  sotto.className = 'ordine-sotto';
  const conta = document.createElement('span');
  conta.className = 'ordine-conta';
  testi.append(h, sotto);
  sommario.append(icona, testi, conta);
  const elenco = document.createElement('div');
  elenco.className = 'ordine-elenco';
  const nota = document.createElement('p');
  nota.className = 'ordine-nota';
  nota.textContent = 'In alto = sopra sulla mappa. Vale per tutti gli strati accesi, anche di gruppi diversi.';
  const barra = document.createElement('div');
  barra.className = 'strato-strumenti';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'strato-strumento';
  reset.dataset.azione = 'ripristina-disegno';
  reset.textContent = 'Ripristina ordine';
  barra.append(reset);
  el.append(sommario, nota, elenco, barra);

  const righe = () => [...elenco.querySelectorAll(':scope > .ordine-riga')];
  const salva = () => salvaOrdineDisegno(storage, ordineStrati(stack(), strati));
  const aggiornaFrecce = () => {
    const r = righe();
    r.forEach((riga, i) => {
      riga.querySelector('[data-azione=su]').disabled = i === 0;
      riga.querySelector('[data-azione=giu]').disabled = i === r.length - 1;
      for (const a of ['su', 'giu', 'trascina']) riga.querySelector(`[data-azione=${a}]`).hidden = r.length < 2;
    });
  };
  // la testata (contatore e sottotitolo) è sempre aggiornata, anche a scheda chiusa
  const aggiornaTestata = () => {
    aggiornaStrati();
    const n = ordineStrati(stack(), strati).filter(attivo).length;
    conta.textContent = String(n);
    conta.hidden = n === 0;
    sotto.textContent = n < 2 ? 'Accendi almeno due strati per cambiare l’ordine' : 'Metti un layer sopra o sotto un altro';
  };
  const ridisegna = () => {
    aggiornaTestata();
    const ids = ordineStrati(stack(), strati).filter(attivo);
    elenco.replaceChildren(...ids.map(id => riga(per.get(id))));
    nota.hidden = elenco.hidden = !ids.length;
    barra.hidden = !ids.length;
    aggiornaFrecce();
  };
  // la riga appena spostata va subito sopra lo strato che ora la segue (o, se è l'ultima, subito sotto quello che la precede)
  const applica = rigaMossa => {
    const r = righe();
    const i = r.indexOf(rigaMossa);
    const mio = per.get(rigaMossa.dataset.id).layers;
    const mosse = i < r.length - 1
      ? mosseVicino(stack(), mio, per.get(r[i + 1].dataset.id).layers, true)
      : i > 0 ? mosseVicino(stack(), mio, per.get(r[i - 1].dataset.id).layers, false) : [];
    applicaMosse(map, mosse);
    salva();
    aggiornaFrecce();
    document.dispatchEvent(new CustomEvent(EVENTO_DISEGNO));
  };
  const muovi = (r, verso) => {
    const vicina = verso < 0 ? r.previousElementSibling : r.nextElementSibling;
    if (!vicina) return false;
    if (verso < 0) vicina.before(r); else vicina.after(r);
    return true;
  };
  function riga(s) {
    const r = document.createElement('div');
    r.className = 'ordine-riga';
    r.dataset.id = s.id;
    const nome = document.createElement('span');
    nome.className = 'ordine-nome';
    nome.textContent = s.etichetta;
    const da = document.createElement('small');
    da.textContent = s.da;
    nome.append(da);
    const azioni = document.createElement('span');
    azioni.className = 'strato-azioni';
    const su = bottoneAzione('su', `Sposta su ${s.etichetta}`);
    const giu = bottoneAzione('giu', `Sposta giù ${s.etichetta}`);
    const maniglia = bottoneAzione('trascina', 'Trascina per spostare');
    maniglia.removeAttribute('aria-label');
    maniglia.setAttribute('aria-hidden', 'true');
    maniglia.tabIndex = -1;
    su.addEventListener('click', () => { if (muovi(r, -1)) applica(r); });
    giu.addEventListener('click', () => { if (muovi(r, 1)) applica(r); });
    maniglia.addEventListener('pointerdown', e => {
      e.preventDefault();
      const prima = righe().indexOf(r);
      r.classList.add('trascinato');
      const segui = ev => {
        const meta = x => { const b = x.getBoundingClientRect(); return b.top + b.height / 2; };
        for (let passi = 0; passi < 50; passi++) {
          const su_ = r.previousElementSibling;
          const giu_ = r.nextElementSibling;
          if (su_ && ev.clientY < meta(su_)) muovi(r, -1);
          else if (giu_ && ev.clientY > meta(giu_)) muovi(r, 1);
          else break;
        }
      };
      const fine = () => {
        document.removeEventListener('pointermove', segui);
        document.removeEventListener('pointerup', fine);
        document.removeEventListener('pointercancel', fine);
        r.classList.remove('trascinato');
        if (righe().indexOf(r) !== prima) applica(r);
      };
      document.addEventListener('pointermove', segui);
      document.addEventListener('pointerup', fine);
      document.addEventListener('pointercancel', fine);
    });
    azioni.append(su, giu, maniglia);
    r.append(nome, azioni);
    return r;
  }

  reset.addEventListener('click', () => {
    // prima i gruppi tornano al loro ordine, poi lo stack all'ordine di partenza di tutti gli strati
    for (const b of document.querySelectorAll('#pannello [data-azione=ripristina]')) b.click();
    azzeraOrdineDisegno(storage);
    applicaMosse(map, mosseOrdine(stack(), strati, iniziale));
    ridisegna();
    document.dispatchEvent(new CustomEvent(EVENTO_DISEGNO));
  });
  document.addEventListener(EVENTO_GRUPPO, () => { salva(); ridisegna(); });
  el.addEventListener('toggle', () => { if (el.open) ridisegna(); });
  // un layer che si accende, si spegne, arriva o parte (anche dai gruppi dinamici) aggiorna l'elenco se è aperto
  document.addEventListener('change', () => { if (el.open) ridisegna(); else aggiornaTestata(); }, true);
  aggiornaTestata();
  return {
    el,
    ridisegna,
    aggiornaTestata,
    // ordine salvato in una visita precedente
    ripristinaSalvato: () => {
      const salvato = leggiOrdineDisegno(storage);
      if (!salvato) return;
      applicaMosse(map, mosseOrdine(stack(), strati, salvato));
      document.dispatchEvent(new CustomEvent(EVENTO_DISEGNO));
    },
    strati,
  };
}

// Ogni modulo diventa un sotto-pannello a comparsa sotto la barra degli strumenti; ne sta aperto uno solo.
export function costruisciPannello(map, moduli, contenitore, barra) {
  let storage = null;
  try { storage = window.localStorage; } catch { /* storage bloccato: ordine e sezioni valgono per la sessione */ }
  const aperte = leggiAperte(storage);
  const sezioni = [];
  let layer = null;
  let cercando = ''; // testo del «Cerca strato» di Layer: finché c'è, aprire e chiudere le sezioni non va salvato
  const gruppi = [];
  const STRETTO = 1280; // sotto questa larghezza due pannelli da 380px non stanno insieme
  const chiudiGruppi = () => { for (const g of gruppi) if (!g.el.hidden) { g.el.hidden = true; g.bottone.setAttribute('aria-expanded', 'false'); } };
  const ripiegaDestra = () => {
    if (window.innerWidth >= STRETTO) return;
    document.querySelector('#rail-pannelli .rail-tab.attivo')?.click();
  };
  const nuovoTab = (id, titolo) => {
    const el = document.createElement('section');
    el.id = `gruppo-${id}`;
    el.className = 'sotto-pannello';
    el.hidden = true;
    const h = document.createElement('h2');
    h.textContent = titolo;
    el.append(h);
    const bottone = bottoneGruppo(id, titolo);
    bottone.addEventListener('click', () => {
      const apri = el.hidden;
      chiudiGruppi();
      el.hidden = !apri;
      bottone.setAttribute('aria-expanded', String(apri));
      if (apri) ripiegaDestra();
    });
    gruppi.push({ el, bottone });
    barra.append(bottone);
    contenitore.append(el);
    el.bottone = bottone;
    return el;
  };
  // gruppo ordinario: una sezione ripiegabile dentro il pannello «Layer», creato al primo uso
  const nuovaSezione = (id, titolo) => {
    layer ??= nuovoTab('layer', ETICHETTE.layer);
    const el = document.createElement('details');
    el.id = `gruppo-${id}`;
    el.className = 'layer-sezione';
    el.open = aperte.includes(id);
    const sommario = document.createElement('summary');
    const h = document.createElement('h2');
    h.textContent = ETICHETTE[id] ?? titolo;
    sommario.append(h);
    el.append(sommario);
    el.bottone = sommario; // `segna` ci scrive pallino e conteggio, come sul tab di un gruppo
    el.addEventListener('toggle', () => { if (!cercando) salvaAperta(storage, id, el.open); });
    sezioni.push(el);
    layer.append(el);
    return el;
  };
  const aggiungi = (id, titolo) => (TAB_DIRETTI.has(id) ? nuovoTab(id, titolo) : nuovaSezione(id, titolo));

  // in un gruppo condiviso ogni modulo ha il suo titolo, anche quello che ospita gli altri: gli strati si possono spostare
  const perGruppo = new Map();
  for (const m of moduli) perGruppo.set(m.gruppo ?? m.id, (perGruppo.get(m.gruppo ?? m.id) ?? 0) + 1);
  for (const m of moduli) {
    // un modulo con `gruppo` mette i suoi strati in un gruppo già esistente (che deve precederlo in MODULI)
    const gruppo = (m.gruppo && document.getElementById(`gruppo-${m.gruppo}`)) || aggiungi(m.id, m.titolo);
    // `sezione`: titolo sopra gli strati di un modulo che condivide il gruppo con altri
    const titolo = m.sezione ?? (perGruppo.get(m.gruppo ?? m.id) > 1 && m.strati.length ? m.argomento?.titolo ?? m.titolo : null);
    if (titolo) {
      const h = document.createElement('h3');
      h.className = 'gruppo-sezione';
      h.textContent = titolo;
      gruppo.append(h);
    }
    let sezioneStrato = null;
    for (const s of m.strati) {
      // `sezione` su uno strato: sottotitolo che raggruppa gli strati consecutivi (es. Geomorfologia / Idraulica nel PAI)
      if (s.sezione && s.sezione !== sezioneStrato) {
        sezioneStrato = s.sezione;
        const h = document.createElement('h3');
        h.className = 'gruppo-sezione';
        h.textContent = s.sezione;
        gruppo.append(h);
      }
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `strato-${s.id}`;
      cb.checked = s.attivo;
      cb.addEventListener('change', () => {
        imposta(map, s.layers, cb.checked);
        if (s.suCambio) s.suCambio(cb.checked, map);
      });
      label.className = 'strato';
      label.append(cb, occhio(), ' ', s.etichetta);
      gruppo.append(label, sliderOpacita(map, s, cb));
    }
    if (m.pannello) m.pannello(gruppo, map);
    // pallino verde sull'icona se nel gruppo c'è almeno uno strato acceso
    const segna = () => {
      const caselle = [...gruppo.querySelectorAll('input[type=checkbox]:not([data-filtro])')];
      if (caselle.length) {
        const n = caselle.filter(c => c.checked).length;
        gruppo.bottone.dataset.attivo = String(n > 0);
        gruppo.bottone.dataset.n = String(n);
      }
      aggiornaConteggio();
    };
    gruppo.addEventListener('change', segna);
    segna();
  }
  // i filtri della ricerca (zona, trasporto, incidenti, catasto) vivono in un tab proprio, non in un popup sulla mappa
  const filtri = document.getElementById('pannello-filtri');
  if (filtri) {
    nuovoTab('filtri', ETICHETTE.filtri).append(filtri);
    filtri.hidden = false;
  }
  // sezioni in ordine alfabetico (anche per i gruppi che arriveranno)
  if (layer) layer.append(...ordinaSezioni(sezioni.map(el => ({ id: el.id, titolo: el.querySelector('h2').textContent }))).map(id => document.getElementById(id)));
  const contenitori = [...gruppi.map(g => g.el).filter(el => el !== layer), ...sezioni];
  // albero ripiegabile e strati riordinabili
  const layersDi = new Map(moduli.flatMap(m => m.strati.map(s => [s.id, s.layers])));
  const inizialeDisegno = ordineStrati(map.getStyle().layers.map(l => l.id), moduli.flatMap(m => m.strati));
  for (const el of contenitori) abilitaRiordino(map, el, layersDi, storage);
  // ordine di disegno globale: un elenco unico degli strati accesi, sotto «Cerca strato»
  const disegno = layer ? creaOrdineDisegno(map, moduli, storage, inizialeDisegno) : null;
  disegno?.ripristinaSalvato();
  // un solo «Cerca strato» in cima a Layer: filtra gli strati di tutte le sezioni, apre quelle con risultati e nasconde le altre
  if (layer) {
    const campo = document.createElement('input');
    campo.type = 'search';
    campo.className = 'strato-cerca';
    campo.placeholder = 'Cerca strato\u2026';
    campo.setAttribute('aria-label', 'Cerca strato');
    campo.addEventListener('input', () => {
      cercando = campo.value.trim().toLowerCase();
      for (const el of sezioni) {
        let trovati = 0;
        for (const v of el.querySelectorAll(':scope > label.strato')) {
          const nascosta = !!cercando && !v.textContent.toLowerCase().includes(cercando);
          v.hidden = nascosta;
          if (!nascosta) trovati++;
          const o = v.nextElementSibling;
          if (o?.classList.contains('strato-opacita')) o.classList.toggle('filtrata', nascosta);
        }
        el.hidden = !!cercando && !trovati;
        el.open = cercando ? trovati > 0 : leggiAperte(storage).includes(el.id.replace('gruppo-', ''));
      }
    });
    layer.querySelector(':scope > h2').after(campo);
    campo.after(disegno.el);
    campo.addEventListener('input', () => { disegno.el.hidden = !!cercando; });
    contenitore.addEventListener('change', e => { if (e.target.matches?.('label.strato input[type=checkbox]')) { if (disegno.el.open) disegno.ridisegna(); else disegno.aggiornaTestata(); } });
  }
  aggiornaConteggio();
  // Esc ripiega il gruppo aperto; il clic sulla mappa no (come i pannelli di destra)
  document.addEventListener('keydown', e => { if (e.key === 'Escape') chiudiGruppi(); });
  // sotto STRETTO, quando a destra si apre un pannello si ripiega il gruppo a sinistra
  new MutationObserver(() => {
    if (window.innerWidth >= STRETTO) return;
    const aperto = ['scheda', 'rndt-pannello', 'geoimage-pannello'].some(id => { const p = document.getElementById(id); return p && !p.hidden && !p.classList.contains('collassato'); });
    if (aperto) chiudiGruppi();
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
}

// Disattiva uno strato il cui dato non si è caricato: nascosto, casella spenta e non cliccabile.
export function disattivaStrato(map, strato) {
  imposta(map, strato.layers, false);
  const casella = document.getElementById(`strato-${strato.id}`);
  if (!casella) return;
  casella.checked = false;
  casella.disabled = true;
  casella.title = 'Dato non disponibile';
  aggiornaConteggio();
}

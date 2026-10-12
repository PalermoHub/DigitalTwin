import { t } from './i18n.js';
import { segnala } from './pannello.js';
import { eBase } from '../layers/base.js';
import { gruppiStrati, limitaPiani, quote, unisciTerreno, etichettaFeature, layerDaInterrogare, MAX_PIANI,
  varchi, varcoPer, camminaVarco, opacitaDentro, passoOcchio, trasformaMondo, pianiAccesi, ruotaAttorno, passoAvanti, zoomDentro, ZOOM_DENTRO,
  assiDaTasti, sommaAssi, avvicina, versoNord, tastoDiMoto, ASSI } from './strati-3d-modello.js';
import { creaNavigatore, creaGuida } from './strati-3d-navigatore.js';
import { gradoni } from './strati-3d-terreno.js';
import { modelloTooltipDi, disegnaVoceTooltip } from './tooltip.js';

// «Strati in 3D»: i layer accesi, fotografati uno per uno nell'inquadratura corrente, si separano in una pila
// che si gira col mouse o col dito. Un clic su un punto di uno strato apre la scheda di quel punto sopra la scena;
// dall'elenco ogni strato si spegne e si riaccende (solo nella pila: la mappa resta com'è).
// Con «Entra tra gli strati» l'occhio va in un varco tra due piani e guarda in giù, in su e attorno.
// Le immagini vengono dalla mappa stessa (stili, filtri e colori sono quelli dell'app); la scena è CSS 3D.

const PROSPETTIVA = 2600;
// Da dentro la pila l'occhio ha un grandangolo (prospettiva corta, circa 45° per lato) e i piani si allontanano di tanto:
// dal varco il piano vicino si vede per metà circa, e guardando di sbieco lo sguardo resta sui piani.
// Lo zoom da dentro: avvicinando stringe il campo visivo, allontanando l'occhio arretra (vedi zoomDentro).
const ESPLOSO_DENTRO = 6;
const prospettivaDentro = palco => Math.max(420, palco.clientWidth / 2);
// camminando l'occhio sta a questa frazione del varco sopra il piano
const ALTEZZA_PASSO = 0.05;
// velocità a comando pieno: gradi al secondo per girare e inclinare, raddoppi al secondo per lo zoom, px al secondo per
// spostare la pila da fuori, frazioni della pila al secondo per muoversi da dentro e camminando
const VEL = { gira: 75, inclina: 50, zoom: 1.4, pila: 520, dentro: 0.4, cammina: 0.2 };
const GUIDA_VISTA = 'dt-strati3d-guida'; // la guida ai comandi si apre da sola solo la prima volta
const TELEFONO = '(max-width: 720px)';

// attende che la mappa abbia finito di disegnare (con un tetto: un tile lento non blocca la vista)
const inattiva = (map, ms = 5000) => new Promise(r => {
  let fatto = false;
  const fine = () => { if (!fatto) { fatto = true; r(); } };
  map.once('idle', fine);
  map.triggerRepaint();
  setTimeout(fine, ms);
});

// copia il canvas WebGL in un canvas 2D: si legge solo subito dopo un render
const fotografa = (map, scala) => new Promise(r => {
  map.once('render', () => {
    const src = map.getCanvas();
    const c = document.createElement('canvas');
    c.width = Math.round(src.width * scala);
    c.height = Math.round(src.height * scala);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    r(c);
  });
  map.triggerRepaint();
});

// un piano senza pixel (strato fuori inquadratura, layer di servizio) non va nella pila
function vuoto(c) {
  const p = document.createElement('canvas');
  p.width = p.height = 48;
  const ctx = p.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(c, 0, 0, 48, 48);
  const d = ctx.getImageData(0, 0, 48, 48).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return false;
  return true;
}

// Cattura: ogni gruppo da solo, a beccheggio zero e senza rilievo; poi la mappa torna com'era.
async function cattura(map, gruppi, avanzamento) {
  const stile = map.getStyle().layers;
  const prima = new Map(stile.map(l => [l.id, map.getLayoutProperty(l.id, 'visibility') ?? 'visible']));
  const camera = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
  const terreno = map.getTerrain?.();
  const telefono = matchMedia(TELEFONO).matches;
  const lato = Math.max(map.getCanvas().width, map.getCanvas().height);
  const scala = Math.min(1, (telefono ? 1100 : 1700) / lato);
  const piani = [];
  let angoli = null;
  try {
    if (terreno) map.setTerrain(null);
    map.jumpTo({ ...camera, pitch: 0 });
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    angoli = [[0, 0], [w, 0], [w, h], [0, h]].map(p => {
      const m = maplibregl.MercatorCoordinate.fromLngLat(map.unproject(p));
      return [m.x, m.y];
    });
    for (const [i, g] of gruppi.entries()) {
      avanzamento(i + 1, gruppi.length);
      const tieni = new Set(g.layers);
      for (const l of stile) map.setLayoutProperty(l.id, 'visibility', tieni.has(l.id) ? 'visible' : 'none');
      await inattiva(map);
      const c = await fotografa(map, scala);
      if (vuoto(c)) continue;
      // il terreno diventa un plastico a gradoni dal DTM (se non si legge resta piatto)
      const plastico = g.terreno ? await gradoni(map, angoli, c, { maxFette: telefono ? 8 : 12 }).catch(() => null) : null;
      piani.push({ ...g, canvas: c, gradoni: plastico });
    }
  } finally {
    for (const [id, v] of prima) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
    if (terreno) map.setTerrain(terreno);
    map.jumpTo(camera);
  }
  return { piani, angoli, scala, camera, terreno, vista: { ...camera, pitch: 0 } };
}

function titoloPiano(g) {
  if (g.base) return t('strati3d.base');
  if (g.terreno) return t('strati3d.terreno');
  if (g.altri) return t('strati3d.altri');
  const testo = document.getElementById(`strato-${g.id}`)?.closest('label')?.textContent || g.etichetta || g.id;
  return testo.replace(/\s*\([^)]*zoom[^)]*\)/i, '').replace(/\s+/g, ' ').trim(); // «(da zoom 12)» qui non serve
}

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// La scena: si apre «piatta» (identica alla mappa), esplode, si gira; chiudendo si richiude e sfuma sulla mappa vera.
function apriScena(map, { piani, camera, terreno, vista }, alChiudere) {
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const telefono = matchMedia(TELEFONO).matches;
  const radice = el('div', 'strati3d');
  radice.setAttribute('role', 'dialog');
  radice.setAttribute('aria-modal', 'true');
  radice.setAttribute('aria-label', t('strati3d.titolo'));
  const palco = el('div', 'strati3d-palco');
  const mondo = el('div', 'strati3d-mondo');
  palco.append(mondo);
  const testata = el('div', 'strati3d-testata');
  const titolo = el('h2', null, t('strati3d.titolo'));
  const chiudi = el('button', 'strati3d-chiudi', t('strati3d.chiudi'));
  chiudi.type = 'button';
  const beta = el('span', 'strati3d-beta', t('strati3d.beta'));
  beta.title = t('strati3d.beta.tip');
  testata.append(titolo, beta, chiudi);
  const elenco = el('nav', 'strati3d-elenco');
  elenco.setAttribute('aria-label', t('strati3d.elenco'));
  const comandi = el('div', 'strati3d-comandi');
  const etEsplodi = el('label', null, t('strati3d.esplodi'));
  const cursore = el('input');
  Object.assign(cursore, { type: 'range', min: '0', max: '1.6', step: '0.01', value: '1' });
  etEsplodi.append(' ', cursore);
  const gira = el('button', 'strati3d-gira', t('strati3d.gira'));
  gira.type = 'button';
  const alto = el('button', null, t('strati3d.alto'));
  alto.type = 'button';
  const entra = el('button', 'strati3d-entra', t('strati3d.dentro'));
  entra.type = 'button';
  entra.setAttribute('aria-pressed', 'false');
  // comandi della vista da dentro: varco sotto/sopra e sguardo in giù/in su
  const bottone = (classe, testo, tip, svg) => {
    const b = el('button', classe, svg ? null : testo);
    b.type = 'button';
    if (svg) b.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${svg}"/></svg>`;
    b.title = b.ariaLabel = tip ?? testo;
    return b;
  };
  const scendi = bottone('strati3d-varco-giu', null, t('strati3d.varco.giu'), 'M12 5v14M6 13l6 6 6-6');
  const guardaGiu = bottone('strati3d-guarda', t('strati3d.guarda.giu'));
  const guardaSu = bottone('strati3d-guarda', t('strati3d.guarda.su'));
  const sali = bottone('strati3d-varco-su', null, t('strati3d.varco.su'), 'M12 19V5M6 11l6-6 6 6');
  const varcoEt = el('span', 'strati3d-varco');
  varcoEt.setAttribute('aria-live', 'polite');
  const cammina = bottone('strati3d-cammina', t('strati3d.cammina'), t('strati3d.cammina.tip'));
  cammina.setAttribute('aria-pressed', 'false');
  const daDentro = el('span', 'strati3d-dentro');
  daDentro.append(scendi, guardaGiu, guardaSu, sali, cammina, varcoEt);
  etEsplodi.classList.add('solo-fuori');
  alto.classList.add('solo-fuori');
  comandi.append(etEsplodi, gira, alto, entra, daDentro);
  const aiuto = el('p', 'strati3d-aiuto', t('strati3d.aiuto'));
  // navigatore alla Google Earth (bussola, joystick, zoom, inclinazione) e guida ai comandi
  const assiUI = Object.fromEntries(ASSI.map(a => [a, 0]));
  const nav = creaNavigatore({
    assi: assiUI,
    gira: d => giraModello(d),
    nord: () => { giraModello(versoNord(meta.a)); gesto(); },
    centra: () => { Object.assign(meta, { px: 0, py: 0, ex: 0, ey: 0, k: 1 }); gesto(); },
    guida: () => mostraGuida(guida.hidden),
    gesto: () => gesto(),
  });
  const guida = creaGuida(() => mostraGuida(false));
  radice.append(palco, testata, elenco, comandi, nav.radice, aiuto, guida);
  // dentro #corpo, accanto alla scheda: #corpo ha `contain: layout` e fa da contesto, solo così la scheda le sta sopra
  const corpo = map.getContainer().closest('#corpo') || document.body;
  corpo.append(radice);
  document.body.classList.add('strati3d-attiva'); // la scheda del luogo e il suo rail salgono sopra la scena
  // Sotto la scena la mappa resta ferma sull'inquadratura fotografata (dall'alto, senza rilievo): un punto della pila è
  // così un pixel della mappa, per la scheda (che cerca gli oggetti disegnati) e per il tooltip. Alla chiusura torna com'era.
  if (terreno) map.setTerrain(null);
  map.jumpTo(vista);
  let salto = false;
  const tieniFerma = () => {
    if (salto || chiudendo) return;
    salto = true;
    map.jumpTo(vista);
    salto = false;
  };
  map.on('moveend', tieniFerma);

  const cw = piani[0].canvas.width, ch = piani[0].canvas.height, lato = Math.max(cw, ch);
  // la pila nasce sopra la mappa, alla stessa scala: aprendosi sembra che sia la mappa a sollevarsi
  const riquadro = map.getContainer().getBoundingClientRect(), origine = radice.getBoundingClientRect();
  const centro = [riquadro.left - origine.left + riquadro.width / 2, riquadro.top - origine.top + riquadro.height / 2];
  Object.assign(mondo.style, { left: `${centro[0]}px`, top: `${centro[1]}px` });
  palco.style.perspectiveOrigin = `${centro[0]}px ${centro[1]}px`;
  mondo.style.setProperty('--bordo', `${Math.round(Math.max(cw, ch) * 0.03)}px`); // spessore del bordo cliccabile dei piani
  const distanza = quote(2, lato)[1];
  const spento = piani.map(() => false);
  // quota di ogni piano: contano solo quelli accesi, così spegnendone uno la pila si ricompatta
  // il terreno a gradoni ha un'altezza propria (≈1,5× il vero, ma mai più di un passo e mezzo): chi sta sopra si alza di tanto
  const esagera = p => Math.min(1.5 / p.gradoni.metriPx, distanza * 1.5 / Math.max(1, p.gradoni.massima));
  const rilievo = piani.map(p => (p.gradoni ? p.gradoni.massima * esagera(p) : 0));
  const quota = i => piani.slice(0, i).reduce((z, _, j) => z + (spento[j] ? 0 : distanza + rilievo[j]), 0);
  const zz = piani.map((_, i) => quota(i));
  const OCCHIO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const elPiani = piani.map((p, i) => {
    const d = el('div', 'strati3d-piano');
    Object.assign(d.style, { width: `${cw}px`, height: `${ch}px`, left: `${-cw / 2}px`, top: `${-ch / 2}px` });
    if (p.gradoni) {
      const k = esagera(p);
      for (const f of p.gradoni.fette) { f.canvas.className = 'strati3d-img'; f.canvas.dataset.z = f.quota * k; d.append(f.canvas); }
    } else {
      p.canvas.className = 'strati3d-img';
      d.append(p.canvas);
    }
    if (p.base) d.dataset.base = '';
    // bordo cliccabile attorno al piano: sceglie lo strato su cui entrare o camminare (le strisce stanno fuori dal piano,
    // così un clic dentro apre sempre la scheda del punto)
    for (const lato of ['su', 'giu', 'sx', 'dx']) {
      const s = el('span', `strati3d-bordo strati3d-bordo-${lato}`);
      s.ariaHidden = 'true'; // da tastiera lo stesso si fa dall'elenco
      s.dataset.piano = i;
      d.append(s);
    }
    mondo.append(d);
    const nome = titoloPiano(p);
    for (const s of d.querySelectorAll('.strati3d-bordo')) s.title = t('strati3d.bordo', { nome });
    const riga = el('div', 'strati3d-riga');
    const occhio = el('button', 'strati3d-occhio');
    occhio.type = 'button';
    occhio.innerHTML = OCCHIO;
    occhio.setAttribute('aria-pressed', 'true');
    occhio.title = occhio.ariaLabel = t('strati3d.spegni', { nome });
    occhio.addEventListener('click', () => {
      spento[i] = !spento[i];
      occhio.setAttribute('aria-pressed', String(!spento[i]));
      occhio.title = occhio.ariaLabel = t(spento[i] ? 'strati3d.accendi' : 'strati3d.spegni', { nome });
      riga.classList.toggle('spenta', spento[i]);
      // anche sulla mappa sotto (fino alla chiusura): così lo strato spento non dà tooltip né scheda
      for (const id of p.layers) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', spento[i] ? 'none' : 'visible');
      if (spento[i] && meta.att === i) meta.att = -1;
      if (meta.d) {
        const lista = tappe();
        if (!lista.length) vaiDentro(false);
        else if (!lista.includes(meta.v)) meta.v = varcoPer(lista, meta.v);
      }
      aggiornaVarco();
      gesto();
    });
    const b = el('button', 'strati3d-nome');
    b.type = 'button';
    b.innerHTML = '<i></i><b></b>';
    b.querySelector('i').textContent = i + 1;
    b.querySelector('b').textContent = nome;
    b.addEventListener('click', () => {
      if (spento[i]) return;
      if (meta.d) vaiAlPiano(i);
      else meta.att = meta.att === i ? -1 : i;
      gesto();
    });
    riga.append(occhio, b);
    elenco.prepend(riga); // in cima l'ultimo strato, come nella pila
    return { d, b };
  });
  // spillo sul punto cliccato: attraversa la pila, con un pallino su ogni strato
  const spillo = el('div', 'strati3d-spillo');
  spillo.innerHTML = '<i></i><i></i>';
  spillo.hidden = true;
  mondo.append(spillo);
  const punti = elPiani.map(({ d }) => { const pt = el('span', 'strati3d-punto'); pt.hidden = true; d.append(pt); return pt; });
  let puntoPiano = null;

  // camera: `meta` è dove va, `cam` dove si trova; ogni gesto arriva morbido
  const piatto = { a: 0, b: 0, k: riquadro.width / cw, e: 0 };
  // px/py: spostamento a mano (frecce, tasto destro, due dita); dx/dy: centratura nello spazio libero
  // d: da dentro la pila, nel varco v (indice del piano sotto), con l'occhio in ex, ey sul piano
  // c: camminando sul piano v (l'occhio poco sopra), invece che a metà del varco
  const meta = { a: 25, b: 56, k: 1, e: 1, att: -1, px: 0, py: 0, d: false, c: false, v: -1, ex: 0, ey: 0 };
  // da dentro: i varchi tra due piani accesi o, camminando, i piani accesi; altezza dell'occhio (frazione del varco)
  const zoomMin = () => (meta.d ? ZOOM_DENTRO.min : 0.4);
  const tappe = () => (meta.c ? pianiAccesi(spento) : varchi(spento));
  const altezza = () => (meta.c ? ALTEZZA_PASSO : 0.5);
  // da dentro, girare: a metà del varco gira tutto il modello attorno al suo asse; camminando gira la testa
  const giraDentro = delta => { if (meta.c) meta.a += delta; else Object.assign(meta, ruotaAttorno(meta, delta)); };
  const giraModello = delta => { if (meta.d) giraDentro(delta); else meta.a += delta; };
  const cam = { ...piatto, zt: 0, tx: 0, ty: 0, tz: 0, ex: 0, ey: 0, P: PROSPETTIVA };
  // Spazio libero della scena: tolti la scheda (a destra, o il foglio in basso su telefono), l'elenco e la testata.
  // La pila si centra e si adatta lì; elenco, testata e comandi si allineano con le variabili --libero-*.
  const scheda = document.getElementById('scheda');
  const spazio = () => {
    const r = radice.getBoundingClientRect();
    const aperta = scheda && !scheda.hidden && !scheda.classList.contains('collassato');
    const s = aperta ? scheda.getBoundingClientRect() : null;
    // a destra: la scheda aperta o, se si vede, il rail dei pannelli laterali
    const rail = document.getElementById('rail-pannelli')?.getBoundingClientRect();
    const bordo = Math.min(s && !telefono ? s.left : Infinity, rail?.width ? rail.left : Infinity);
    const destra = Number.isFinite(bordo) ? Math.max(260, bordo - r.left) : r.width;
    const basso = s && telefono ? Math.max(160, s.top - r.top) : r.height;
    // l'elenco è una fila di chip sotto la testata: toglie spazio in alto, non di lato
    const x1 = destra;
    const y0 = elenco.getBoundingClientRect().bottom - r.top + 10, y1 = s && telefono ? basso - 8 : r.height - (telefono ? 80 : 70);
    return { aperta, x0: 0, x1, y0, y1, destra: r.width - destra, basso: r.height - basso };
  };
  let girando = !ridotto, ultimoGesto = 0, chiudendo = false, raf = 0;
  const gesto = () => { ultimoGesto = performance.now(); aiuto.classList.add('via'); };
  const adatta = L => Math.min((L.x1 - L.x0) / (lato * 1.5), (L.y1 - L.y0) / (lato * 1.05)); // zoom 1 = la pila entra nello spazio libero

  // ── gesti ──
  const puntatori = new Map();
  let partenza = null, distanza0 = 0, zoom0 = 1, spostaMano = false;
  const medio = () => { const [p1, p2] = [...puntatori.values()]; return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]; };
  let medio0 = null;
  palco.addEventListener('contextmenu', ev => ev.preventDefault()); // il tasto destro sposta la pila
  // inerzia: lasciando un trascinamento ancora in corsa, giro e spostamento continuano e rallentano da soli
  const inerzia = { a: 0, x: 0, y: 0 }, corsa = { a: 0, x: 0, y: 0, t: 0 };
  const traccia = (k, d) => {
    const ora = performance.now(), dt = Math.max(8, ora - corsa.t) / 1000;
    for (const c of ['a', 'x', 'y']) corsa[c] = corsa[c] * 0.6 + (c === k[0] || c === k[1] ? (d[k.indexOf(c)] / dt) * 0.4 : 0);
    corsa.t = ora;
  };
  palco.addEventListener('pointerdown', ev => {
    Object.assign(inerzia, { a: 0, x: 0, y: 0 });
    Object.assign(corsa, { a: 0, x: 0, y: 0, t: performance.now() });
    puntatori.set(ev.pointerId, [ev.clientX, ev.clientY]);
    partenza = { x: ev.clientX, y: ev.clientY, t: performance.now() };
    spostaMano = ev.button === 2 || ev.button === 1 || ev.shiftKey;
    if (puntatori.size === 2) { const [p1, p2] = [...puntatori.values()]; distanza0 = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); zoom0 = meta.k; medio0 = medio(); }
    palco.classList.add('trascina');
    gesto();
  });
  const muovi = ev => {
    if (!puntatori.has(ev.pointerId)) return;
    const [x0, y0] = puntatori.get(ev.pointerId);
    puntatori.set(ev.pointerId, [ev.clientX, ev.clientY]);
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    if (puntatori.size === 1 && spostaMano) { muoviPila(dx, dy); traccia('xy', [dx, dy]); }
    else if (puntatori.size === 1 && meta.d) { giraDentro(-dx * 0.25); traccia('a', [-dx * 0.25]); meta.b = Math.min(180, Math.max(0, meta.b - dy * 0.3)); }
    else if (puntatori.size === 1) { meta.a -= dx * 0.35; traccia('a', [-dx * 0.35]); meta.b = Math.min(82, Math.max(0, meta.b - dy * 0.25)); }
    else if (puntatori.size === 2) {   // due dita: pizzico per lo zoom, il punto medio sposta la pila
      const [p1, p2] = [...puntatori.values()];
      meta.k = Math.min(4, Math.max(zoomMin(), zoom0 * Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) / distanza0));
      const m = medio();
      muoviPila(m[0] - medio0[0], m[1] - medio0[1]);
      medio0 = m;
    }
    gesto();
  };
  const lascia = ev => {
    if (!puntatori.has(ev.pointerId)) return;
    puntatori.delete(ev.pointerId);
    if (puntatori.size) return;
    palco.classList.remove('trascina');
    // solo se il gesto era ancora in movimento al rilascio (non dopo una pausa)
    if (!ridotto && performance.now() - corsa.t < 80) Object.assign(inerzia, { a: corsa.a, x: corsa.x, y: corsa.y });
  };
  window.addEventListener('pointermove', muovi);
  window.addEventListener('pointerup', lascia);
  window.addEventListener('pointercancel', lascia);
  let zoomRotella = { verso: '', t: 0 }; // per il cursore: lente col + o col - mentre si usa la rotella
  palco.addEventListener('wheel', ev => {
    ev.preventDefault();
    meta.k = Math.min(4, Math.max(zoomMin(), meta.k * Math.exp(-ev.deltaY * 0.0015)));
    zoomRotella = { verso: ev.deltaY < 0 ? 'zoom-in' : 'zoom-out', t: performance.now() };
    gesto();
  }, { passive: false });
  // un tocco (non un trascinamento) su uno strato apre la scheda di quel punto, restando nel 3D
  palco.addEventListener('click', ev => {
    if (!partenza || Math.hypot(ev.clientX - partenza.x, ev.clientY - partenza.y) > 6 || performance.now() - partenza.t > 500) return;
    // un clic sul bordo di uno strato: da fuori lo sceglie (un secondo clic ci entra), da dentro ci si porta sopra
    const bordo = ev.target.closest?.('.strati3d-bordo');
    if (bordo) {
      const i = +bordo.dataset.piano;
      if (spento[i]) return;
      if (meta.d) vaiAlPiano(i);
      else if (meta.att === i && varchi(spento).length) vaiDentro(true);
      else meta.att = i;
      gesto();
      return;
    }
    const img = ev.target.closest?.('.strati3d-img');
    if (!img) return;
    puntoPiano = [ev.offsetX, ev.offsetY];
    for (const pt of punti) Object.assign(pt.style, { left: `${puntoPiano[0]}px`, top: `${puntoPiano[1]}px` });
    Object.assign(spillo.style, { left: `${puntoPiano[0] - cw / 2}px`, top: `${puntoPiano[1] - ch / 2}px` });
    const punto = puntoMappa(puntoPiano[0] / cw, puntoPiano[1] / ch);
    // la scheda dell'app, sopra la scena (vedi css), aperta sul tab dello strato toccato
    // gli strati in ordine: quello toccato, poi quelli sotto, poi quelli sopra (le parti vuote di un piano non contano)
    const sotto = elPiani.findIndex(({ d }) => d === img.closest('.strati3d-piano'));
    const ordine = piani.map((_, i) => i).filter(i => !spento[i]).sort((a, b) => (a > sotto) - (b > sotto) || (a > sotto ? a - b : b - a));
    map.fire('click', { point: punto, lngLat: map.unproject(punto), strati: ordine.flatMap(i => piani[i].strati ?? [piani[i].id]) });
    nascondiTip();
    gesto();
  });
  // ── puntatore e tooltip: come sulla mappa 2D, con gli stessi fornitori di tooltip dell'app ──
  const contenitore = map.getContainer();
  const puntoMappa = (u, v) => new maplibregl.Point(u * contenitore.clientWidth, v * contenitore.clientHeight);
  const tip = el('div', 'maplibregl-popup mappa-tooltip strati3d-tooltip'); // i18n-ok: classi CSS (stile del tooltip della mappa)
  const tipCorpo = el('div', 'maplibregl-popup-content');
  tip.append(tipCorpo);
  tip.hidden = true;
  radice.append(tip);
  const nascondiTip = () => { tip.hidden = true; palco.classList.remove('su-oggetto'); };
  // Tutto quello che c'è sotto un punto, strato per strato: lo strato sotto il mouse in cima ed evidenziato, poi gli
  // altri dall'alto. Per ogni oggetto il modello di tooltip dell'app se c'è, altrimenti un'etichetta dalle proprietà.
  const MAX_VOCI = 3;
  function descriviPunto(punto, sotto) {
    const riquadro = [[punto.x - 3, punto.y - 3], [punto.x + 3, punto.y + 3]];
    const sezioni = [];
    piani.forEach((p, i) => {
      if (spento[i] || p.base) return;
      const ids = layerDaInterrogare(p).filter(id => map.getLayer(id));
      if (!ids.length) return;
      const voci = new Map();
      for (const f of map.queryRenderedFeatures(riquadro, { layers: ids })) {
        let v = modelloTooltipDi(f.layer.id)?.(f.properties);
        if (!v?.titolo) {
          const e = etichettaFeature(f.properties);
          v = e && (e.foglio ? { titolo: t('strati3d.particella', e) } : { titolo: e.titolo, sottotitolo: e.sotto });
        }
        if (v?.titolo) voci.set(`${v.titolo}\n${v.sottotitolo ?? ''}`, v);
      }
      if (voci.size) sezioni.push({ i, voci: [...voci.values()] });
    });
    if (!sezioni.length) return null;
    // lo strato «sotto il mouse»: il primo con dati scendendo da quello toccato (le parti vuote di un piano non contano)
    const qui = Math.max(-1, ...sezioni.map(x => x.i).filter(i => i <= sotto));
    sezioni.sort((a, b) => (b.i === qui) - (a.i === qui) || b.i - a.i);
    const corpo = el('div', 'strati3d-tip');
    for (const { i, voci } of sezioni) {
      const sez = el('div', 'strati3d-tip-sez');
      if (i === qui) sez.classList.add('qui');
      const testa = el('div', 'strati3d-tip-testa');
      testa.append(el('i', null, String(i + 1)), el('b', null, titoloPiano(piani[i])));
      sez.append(testa, ...voci.slice(0, MAX_VOCI).map(disegnaVoceTooltip));
      if (voci.length > MAX_VOCI) sez.append(el('div', 'strati-tooltip-altre', t('strati3d.altre', { n: voci.length - MAX_VOCI })));
      corpo.append(sez);
    }
    return corpo;
  }
  let attesaTip = 0;
  palco.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse' || puntatori.size || chiudendo) { nascondiTip(); return; }
    const img = ev.target.closest?.('.strati3d-img');
    if (!img) { nascondiTip(); return; }
    const sotto = elPiani.findIndex(({ d }) => d === img.closest('.strati3d-piano'));
    const { offsetX, offsetY, clientX, clientY } = ev;
    cancelAnimationFrame(attesaTip);
    attesaTip = requestAnimationFrame(() => {
      const punto = puntoMappa(offsetX / cw, offsetY / ch);
      const corpo = descriviPunto(punto, sotto);
      palco.classList.toggle('su-oggetto', !!corpo);
      if (!corpo) { tip.hidden = true; return; }
      tipCorpo.replaceChildren(corpo);
      const r = radice.getBoundingClientRect();
      tip.style.transform = `translate(${clientX - r.left + 14}px, ${clientY - r.top + 16}px)`;
      tip.hidden = false;
    });
  });
  palco.addEventListener('pointerleave', nascondiTip);
  palco.addEventListener('pointerdown', nascondiTip);
  palco.addEventListener('wheel', nascondiTip, { passive: true });
  cursore.addEventListener('input', () => { meta.e = +cursore.value; gesto(); });
  // da fuori si sposta la pila sullo schermo; da dentro si cammina sul piano (quello che c'è sotto il dito lo segue)
  const muoviPila = (x, y) => {
    if (meta.d) {
      // la distanza dal piano lungo lo sguardo: guardando in avanti il terreno inquadrato è più lontano dei piedi
      const h = distanza * altezza() * ESPLOSO_DENTRO / Math.max(0.2, Math.abs(Math.cos(cam.b * Math.PI / 180))) + (cam.P - cam.tz);
      const [wx, wy] = passoOcchio(x, y, cam.a, cam.b, h, cam.P);
      meta.ex = Math.min(cw / 2, Math.max(-cw / 2, meta.ex + wx));
      meta.ey = Math.min(ch / 2, Math.max(-ch / 2, meta.ey + wy));
    } else { meta.px += x; meta.py += y; }
    gesto();
  };
  // ── da dentro la pila ──
  const aggiornaVarco = () => {
    entra.disabled = !varchi(spento).length && !meta.d;
    if (!meta.d) return;
    const lista = tappe();
    const sopra = spento.findIndex((s, j) => j > meta.v && !s);
    if (meta.c) {
      varcoEt.textContent = t('strati3d.sul', { n: meta.v + 1 });
      varcoEt.title = titoloPiano(piani[meta.v]);
    } else {
      varcoEt.textContent = t('strati3d.varco', { sotto: meta.v + 1, sopra: sopra + 1 });
      varcoEt.title = `${titoloPiano(piani[sopra])} / ${titoloPiano(piani[meta.v])}`;
    }
    scendi.title = scendi.ariaLabel = t(meta.c ? 'strati3d.piano.giu' : 'strati3d.varco.giu');
    sali.title = sali.ariaLabel = t(meta.c ? 'strati3d.piano.su' : 'strati3d.varco.su');
    scendi.disabled = meta.v === lista[0];
    sali.disabled = meta.v === lista[lista.length - 1];
  };
  const vaiDentro = dentro => {
    const lista = varchi(spento);
    if (dentro && !lista.length) return;
    meta.d = dentro;
    if (dentro) {
      // si entra sopra lo strato evidenziato o, se non c'è, nel varco più alto: guardando giù si vede tutta la pila
      meta.v = varcoPer(lista, meta.att >= 0 ? meta.att : Infinity);
      Object.assign(meta, { b: 0, k: 1, ex: 0, ey: 0, att: -1 });
      girando = false;
      gira.setAttribute('aria-pressed', 'false');
    } else Object.assign(meta, { b: 56, k: 1, px: 0, py: 0 });
    if (meta.c) vaiCammina(false);
    radice.classList.toggle('dentro', dentro);
    entra.textContent = t(dentro ? 'strati3d.fuori' : 'strati3d.dentro');
    entra.setAttribute('aria-pressed', String(dentro));
    aiuto.textContent = t(dentro ? 'strati3d.aiuto.dentro' : 'strati3d.aiuto');
    aiuto.classList.remove('via');
    ultimoGesto = performance.now();
    aggiornaVarco();
  };
  // da dentro, portarsi sullo strato i: camminando ci si sta sopra, altrimenti nel varco sopra di lui
  const vaiAlPiano = i => { meta.v = meta.c ? i : varcoPer(varchi(spento), i); aggiornaVarco(); };
  const cambiaVarco = passo => { if (meta.d) { meta.v = camminaVarco(tappe(), meta.v, passo); aggiornaVarco(); gesto(); } };
  // camminare sul piano sotto il varco (o tornare a metà del varco sopra il piano su cui si cammina)
  function vaiCammina(si) {
    meta.c = si;
    if (si) meta.b = Math.max(meta.b, 76); // sguardo in avanti, un po' verso terra
    else {
      meta.v = varcoPer(varchi(spento), meta.v);
      if (meta.b > 60 && meta.b < 120) meta.b = 0;
    }
    cammina.setAttribute('aria-pressed', String(si));
    radice.classList.toggle('cammina', si);
    aiuto.textContent = t(si ? 'strati3d.aiuto.cammina' : meta.d ? 'strati3d.aiuto.dentro' : 'strati3d.aiuto');
    aiuto.classList.remove('via');
    ultimoGesto = performance.now();
    aggiornaVarco();
  }
  cammina.addEventListener('click', () => vaiCammina(!meta.c));
  entra.addEventListener('click', () => vaiDentro(!meta.d));
  scendi.addEventListener('click', () => cambiaVarco(-1));
  sali.addEventListener('click', () => cambiaVarco(1));
  guardaGiu.addEventListener('click', () => { meta.b = 0; gesto(); });
  guardaSu.addEventListener('click', () => { meta.b = 180; gesto(); });
  aggiornaVarco();
  gira.setAttribute('aria-pressed', String(girando));
  gira.addEventListener('click', () => { girando = !girando; gira.setAttribute('aria-pressed', String(girando)); });
  alto.addEventListener('click', () => {
    const daAlto = meta.b > 5;
    meta.b = daAlto ? 0 : 56;
    if (daAlto) meta.a = Math.round(meta.a / 360) * 360;
    alto.textContent = daAlto ? t('strati3d.in3d') : t('strati3d.alto');
    gesto();
  });
  // tastiera: i tasti di moto contano finché sono premuti (il moto lo fa il disegno, fotogramma per fotogramma);
  // gli altri sono colpi singoli
  const premuti = new Set(), fisici = new Map(); // fisici: tasto premuto → tasto di moto che conta (per + e - sotto)
  let maiuscolo = false;
  // + e - stanno su tasti diversi secondo la tastiera (sull'italiana non sono Equal e Minus): contano per il carattere
  const codiceDi = ev => (ev.key === '+' ? 'NumpadAdd' : ev.key === '-' ? 'NumpadSubtract' : ev.code);
  const tasti = ev => {
    maiuscolo = ev.shiftKey;
    if (ev.key === 'Escape') { ev.preventDefault(); if (!guida.hidden) mostraGuida(false); else chiudiScena(); return; }
    if (ev.target instanceof HTMLInputElement || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (meta.d && (ev.key === 'PageUp' || ev.key === 'PageDown')) { ev.preventDefault(); cambiaVarco(ev.key === 'PageUp' ? 1 : -1); return; }
    if (ev.key === '?') { mostraGuida(guida.hidden); return; }
    const code = codiceDi(ev);
    if (tastoDiMoto(code)) { ev.preventDefault(); premuti.add(code); fisici.set(ev.code, code); gesto(); }
  };
  const tastiSu = ev => { maiuscolo = ev.shiftKey; premuti.delete(fisici.get(ev.code) ?? ev.code); fisici.delete(ev.code); };
  const lasciaTutto = () => { premuti.clear(); fisici.clear(); maiuscolo = false; for (const a of ASSI) assiUI[a] = 0; };
  document.addEventListener('keyup', tastiSu);
  window.addEventListener('blur', lasciaTutto);
  const mostraGuida = si => {
    guida.hidden = !si;
    if (si) guida.querySelector('button')?.focus();
    else try { localStorage.setItem(GUIDA_VISTA, '1'); } catch { /* senza storage la guida tornerà la prossima volta */ }
  };
  document.addEventListener('keydown', tasti);
  chiudi.addEventListener('click', () => chiudiScena());

  // ── moto continuo: tasti tenuti + navigatore → velocità morbide; poi l'inerzia dei trascinamenti ──
  const vel = Object.fromEntries(ASSI.map(a => [a, 0]));
  const tieniOcchio = () => {
    meta.ex = Math.min(cw / 2, Math.max(-cw / 2, meta.ex));
    meta.ey = Math.min(ch / 2, Math.max(-ch / 2, meta.ey));
  };
  function muoviContinuo(dt, ora) {
    avvicina(vel, sommaAssi(assiDaTasti(premuti, maiuscolo), assiUI), dt, ridotto ? 30 : 7);
    if (vel.gira) giraModello(vel.gira * VEL.gira * dt);
    if (vel.inclina) meta.b = Math.min(meta.d ? 180 : 82, Math.max(0, meta.b + vel.inclina * VEL.inclina * dt));
    if (vel.zoom) meta.k = Math.min(4, Math.max(zoomMin(), meta.k * Math.exp(vel.zoom * VEL.zoom * dt)));
    if (vel.avanti || vel.lato) {
      if (meta.d) {
        const v = lato * (meta.c ? VEL.cammina : VEL.dentro) * dt;
        const [wx, wy] = passoAvanti(cam.a, vel.avanti * v, vel.lato * v);
        meta.ex += wx;
        meta.ey += wy;
        tieniOcchio();
      } else { meta.px -= vel.lato * VEL.pila * dt; meta.py += vel.avanti * VEL.pila * dt; }
    }
    if (ASSI.some(a => vel[a])) { ultimoGesto = ora; aiuto.classList.add('via'); }
    // inerzia dei trascinamenti
    const smorza = Math.exp(-dt * 3.2);
    if (Math.abs(inerzia.a) > 0.5) { giraModello(inerzia.a * dt); inerzia.a *= smorza; } else inerzia.a = 0;
    if (Math.hypot(inerzia.x, inerzia.y) > 4) { muoviPila(inerzia.x * dt, inerzia.y * dt); inerzia.x *= smorza; inerzia.y *= smorza; } else inerzia.x = inerzia.y = 0;
    // cursore secondo quello che fa il mouse adesso
    const zoomando = ora - zoomRotella.t < 350 && zoomRotella.verso;
    const c = puntatori.size ? (spostaMano || puntatori.size > 1 ? 'sposta' : meta.c ? 'guarda' : 'trascina')
      : zoomando || (maiuscolo ? 'sposta' : meta.c ? 'cammina' : 'ruota');
    if (palco.dataset.cursore !== c) palco.dataset.cursore = c;
    nav.orienta(cam.a);
  }

  // ── disegno ──
  let tPrima = performance.now();
  function passo(ora) {
    const dt = Math.min(0.05, (ora - tPrima) / 1000);
    tPrima = ora;
    if (girando && !chiudendo && ora - ultimoGesto > 2500) giraModello(dt * 8);
    if (!chiudendo) muoviContinuo(dt, ora);
    const m = ridotto ? 1 : 1 - Math.exp(-dt * (chiudendo ? 5 : 4));
    const L = spazio();
    radice.style.setProperty('--libero-d', `${L.destra}px`);
    radice.style.setProperty('--libero-b', `${L.basso}px`);
    radice.classList.toggle('con-scheda', L.aperta);
    const cima = Math.max(0, ...piani.map((_, i) => (spento[i] ? 0 : quota(i) + rilievo[i])));
    const dentro = meta.d && !chiudendo;
    let scopo;
    if (chiudendo) scopo = { ...piatto, a: Math.round(cam.a / 360) * 360, zt: 0, tx: 0, ty: 0, tz: 0, ex: 0, ey: 0, P: PROSPETTIVA };
    else if (dentro) {
      // l'occhio a metà del varco, sopra il rilievo del piano sotto
      const e = ESPLOSO_DENTRO, { P, indietro } = zoomDentro(meta.k, prospettivaDentro(palco), lato);
      scopo = { a: meta.a, b: meta.b, k: 1, e, P, tx: 0, ty: 0, tz: P - indietro, ex: meta.ex, ey: meta.ey, zt: (quota(meta.v) + rilievo[meta.v] + distanza * altezza()) * e };
    } else {
      scopo = { ...meta, k: meta.k * adatta(L), zt: (meta.att >= 0 ? quota(meta.att) : cima / 2) * meta.e, tz: 0, ex: 0, ey: 0, P: PROSPETTIVA,
        tx: (L.x0 + L.x1) / 2 - centro[0] + meta.px, ty: (L.y0 + L.y1) / 2 - centro[1] + meta.py };
    }
    for (const k of ['a', 'b', 'k', 'e', 'zt', 'tx', 'ty', 'tz', 'ex', 'ey', 'P']) cam[k] += (scopo[k] - cam[k]) * m;
    palco.style.perspective = `${cam.P}px`;
    mondo.style.transform = trasformaMondo(cam);
    const vetro = Math.min(1, cam.e * 1.5);
    const lontano = cam.P - cam.tz > distanza * ESPLOSO_DENTRO * 0.5; // zoom indietro: l'occhio è uscito dal varco
    elPiani.forEach(({ d, b }, i) => {
      const att = !chiudendo && !dentro && i === meta.att;
      zz[i] += (quota(i) - zz[i]) * m;
      d.style.transform = `translateZ(${zz[i] * cam.e + i * 0.4 + (att ? lato * 0.02 : 0)}px)`;
      const fuoco = dentro ? opacitaDentro(spento, meta.v, i, cam.b, lontano) : meta.att < 0 || chiudendo || att ? 1 : i < meta.att ? 0.25 : 0.1;
      d.style.opacity = spento[i] && !chiudendo ? 0 : fuoco;
      d.style.pointerEvents = spento[i] || !fuoco ? 'none' : ''; // i piani nascosti alle spalle dell'occhio non si toccano
      if (piani[i].gradoni) for (const f of d.children) if (f.dataset.z) f.style.transform = `translateZ(${f.dataset.z * cam.e}px)`;
      punti[i].hidden = !puntoPiano || spento[i];
      d.style.setProperty('--vetro', vetro);
      d.classList.toggle('att', att);
      b.classList.toggle('att', att);
      b.setAttribute('aria-pressed', String(att));
    });
    if (puntoPiano) {
      spillo.hidden = chiudendo;
      spillo.style.height = `${cima * cam.e + lato * 0.08}px`;
    }
    if (chiudendo && Math.abs(cam.e) < 0.02 && Math.abs(cam.b) < 0.5) { finisci(); return; }
    raf = requestAnimationFrame(passo);
  }
  raf = requestAnimationFrame(passo);
  requestAnimationFrame(() => radice.classList.add('aperta'));
  chiudi.focus();
  let guidaVista = null;
  try { guidaVista = localStorage.getItem(GUIDA_VISTA); } catch { /* storage bloccato: la guida si mostra */ }
  if (!guidaVista) setTimeout(() => { if (!chiudendo) mostraGuida(true); }, ridotto ? 0 : 900);

  function chiudiScena() {
    if (chiudendo) return;
    chiudendo = true;
    radice.classList.add('chiude');
    if (ridotto) finisci();
    else setTimeout(finisci, 1400); // un dispositivo lento non resta a metà della chiusura
  }
  let finita = false;
  function finisci() {
    if (finita) return;
    finita = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', muovi);
    window.removeEventListener('pointerup', lascia);
    window.removeEventListener('pointercancel', lascia);
    document.removeEventListener('keydown', tasti);
    document.removeEventListener('keyup', tastiSu);
    window.removeEventListener('blur', lasciaTutto);
    map.off('moveend', tieniFerma);
    piani.forEach((p, i) => { if (spento[i]) for (const id of p.layers) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible'); });
    if (terreno) map.setTerrain(terreno);
    map.jumpTo(camera);
    nascondiTip();
    radice.classList.add('sfuma');
    document.body.classList.remove('strati3d-attiva');
    setTimeout(() => radice.remove(), ridotto ? 0 : 350);
    alChiudere();
  }
}

// Pulsanti (barra degli strumenti e, su telefono, foglio Strati): attivi con almeno uno strato acceso.
export function collegaStrati3d(map, moduli, bottoni) {
  bottoni = bottoni.filter(Boolean);
  if (!bottoni.length) return;
  const strati = moduli.flatMap(m => m.strati ?? []);
  const acceso = id => !!document.getElementById(`strato-${id}`)?.checked;
  const aggiorna = () => {
    const n = document.querySelectorAll('#pannello input[type=checkbox]:checked:not([data-filtro])').length;
    for (const b of bottoni) {
      b.disabled = n === 0;
      b.title = b.ariaLabel = n ? t('html.btn.strati3d') : t('strati3d.nessuno');
    }
  };
  document.addEventListener('change', e => { if (e.target.matches?.('input[type=checkbox]')) aggiorna(); });
  aggiorna();
  let occupato = false;
  const premuto = v => { for (const b of bottoni) b.setAttribute('aria-pressed', String(v)); };
  const apri = async bottone => {
    if (occupato) return;
    occupato = true;
    const velo = el('div', 'strati3d-velo');
    const testo = el('p', null, t('strati3d.prepara', { n: 0, tot: '…' }));
    velo.append(testo);
    velo.setAttribute('role', 'status');
    (map.getContainer().closest('#corpo') || document.body).append(velo);
    try {
      const max = matchMedia(TELEFONO).matches ? MAX_PIANI.telefono : MAX_PIANI.desktop;
      const { piani: gruppi, fuori } = limitaPiani(unisciTerreno(gruppiStrati(map.getStyle().layers, strati, acceso, eBase)), max);
      if (fuori) segnala(t('strati3d.troppi', { n: max }));
      const scena = await cattura(map, gruppi, (n, tot) => { testo.textContent = t('strati3d.prepara', { n, tot }); });
      if (!scena.piani.length) { segnala(t('strati3d.nessuno')); return; }
      premuto(true);
      apriScena(map, scena, () => {
        premuto(false);
        bottone.focus();
      });
    } catch (e) {
      console.warn('strati 3D:', e); // i18n-ok: messaggio solo per la console
      segnala(t('strati3d.errore'));
    } finally {
      velo.remove();
      occupato = false;
    }
  };
  for (const b of bottoni) b.addEventListener('click', () => apri(b));
}

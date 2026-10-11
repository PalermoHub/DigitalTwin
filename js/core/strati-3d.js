import { t } from './i18n.js';
import { segnala } from './pannello.js';
import { eBase } from '../layers/base.js';
import { gruppiStrati, limitaPiani, puntoDaPiano, quote, unisciTerreno, MAX_PIANI } from './strati-3d-modello.js';
import { gradoni } from './strati-3d-terreno.js';

// «Strati in 3D»: i layer accesi, fotografati uno per uno nell'inquadratura corrente, si separano in una pila
// che si gira col mouse o col dito. Un clic su un punto di uno strato apre la scheda di quel punto sopra la scena;
// dall'elenco ogni strato si spegne e si riaccende (solo nella pila: la mappa resta com'è).
// Le immagini vengono dalla mappa stessa (stili, filtri e colori sono quelli dell'app); la scena è CSS 3D.

const PROSPETTIVA = 2600;
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
      const terreno = g.terreno ? await gradoni(map, angoli, c, { maxFette: telefono ? 8 : 12 }).catch(() => null) : null;
      piani.push({ ...g, canvas: c, gradoni: terreno });
    }
  } finally {
    for (const [id, v] of prima) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
    if (terreno) map.setTerrain(terreno);
    map.jumpTo(camera);
  }
  return { piani, angoli, scala };
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
function apriScena(map, { piani, angoli }, alChiudere) {
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
  const gira = el('button', null, t('strati3d.gira'));
  gira.type = 'button';
  const alto = el('button', null, t('strati3d.alto'));
  alto.type = 'button';
  comandi.append(etEsplodi, gira, alto);
  const aiuto = el('p', 'strati3d-aiuto', t('strati3d.aiuto'));
  radice.append(palco, testata, elenco, comandi, aiuto);
  // dentro #corpo, accanto alla scheda: #corpo ha `contain: layout` e fa da contesto, solo così la scheda le sta sopra
  const corpo = map.getContainer().closest('#corpo') || document.body;
  corpo.append(radice);
  document.body.classList.add('strati3d-attiva'); // la scheda del luogo e il suo rail salgono sopra la scena

  const cw = piani[0].canvas.width, ch = piani[0].canvas.height, lato = Math.max(cw, ch);
  // la pila nasce sopra la mappa, alla stessa scala: aprendosi sembra che sia la mappa a sollevarsi
  const riquadro = map.getContainer().getBoundingClientRect(), origine = radice.getBoundingClientRect();
  const centro = [riquadro.left - origine.left + riquadro.width / 2, riquadro.top - origine.top + riquadro.height / 2];
  Object.assign(mondo.style, { left: `${centro[0]}px`, top: `${centro[1]}px` });
  palco.style.perspectiveOrigin = `${centro[0]}px ${centro[1]}px`;
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
    mondo.append(d);
    const nome = titoloPiano(p);
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
      if (spento[i] && meta.att === i) meta.att = -1;
      gesto();
    });
    const b = el('button', 'strati3d-nome');
    b.type = 'button';
    b.innerHTML = '<i></i><b></b>';
    b.querySelector('i').textContent = i + 1;
    b.querySelector('b').textContent = nome;
    b.addEventListener('click', () => { if (!spento[i]) { meta.att = meta.att === i ? -1 : i; gesto(); } });
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
  const meta = { a: 25, b: 56, k: 1, e: 1, att: -1 };
  const cam = { ...piatto, zt: 0, dx: 0, dy: 0 };
  // con la scheda aperta la pila scivola nello spazio libero: a sinistra del pannello, o sopra il foglio su telefono
  const scheda = document.getElementById('scheda');
  const larghezzaLaterale = () => parseFloat(getComputedStyle(document.body).getPropertyValue('--scheda-l')) || 0;
  const laterale0 = larghezzaLaterale();
  const spazioScheda = () => {
    if (!scheda || scheda.hidden || scheda.classList.contains('collassato')) return [0, 0];
    if (telefono) return [0, -scheda.getBoundingClientRect().height / 2];
    return [-(larghezzaLaterale() - laterale0) / 2, 0];
  };
  let girando = !ridotto, ultimoGesto = 0, chiudendo = false, raf = 0;
  const gesto = () => { ultimoGesto = performance.now(); aiuto.classList.add('via'); };
  const adatta = () => {   // zoom 1 = la pila intera entra nello schermo
    const { clientWidth: W, clientHeight: H } = radice;
    return Math.min(W / (lato * 1.25), H / (lato * (telefono ? 1.25 : 1.05)));
  };

  // ── gesti ──
  const puntatori = new Map();
  let partenza = null, distanza0 = 0, zoom0 = 1;
  palco.addEventListener('pointerdown', ev => {
    puntatori.set(ev.pointerId, [ev.clientX, ev.clientY]);
    partenza = { x: ev.clientX, y: ev.clientY, t: performance.now() };
    if (puntatori.size === 2) { const [p1, p2] = [...puntatori.values()]; distanza0 = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); zoom0 = meta.k; }
    palco.classList.add('trascina');
    gesto();
  });
  const muovi = ev => {
    if (!puntatori.has(ev.pointerId)) return;
    const [x0, y0] = puntatori.get(ev.pointerId);
    puntatori.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (puntatori.size === 1) { meta.a -= (ev.clientX - x0) * 0.35; meta.b = Math.min(82, Math.max(0, meta.b - (ev.clientY - y0) * 0.25)); }
    else if (puntatori.size === 2) { const [p1, p2] = [...puntatori.values()]; meta.k = Math.min(4, Math.max(0.4, zoom0 * Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) / distanza0)); }
    gesto();
  };
  const lascia = ev => { puntatori.delete(ev.pointerId); if (!puntatori.size) palco.classList.remove('trascina'); };
  window.addEventListener('pointermove', muovi);
  window.addEventListener('pointerup', lascia);
  window.addEventListener('pointercancel', lascia);
  palco.addEventListener('wheel', ev => { ev.preventDefault(); meta.k = Math.min(4, Math.max(0.4, meta.k * Math.exp(-ev.deltaY * 0.0015))); gesto(); }, { passive: false });
  // un tocco (non un trascinamento) su uno strato apre la scheda di quel punto, restando nel 3D
  palco.addEventListener('click', ev => {
    if (!partenza || Math.hypot(ev.clientX - partenza.x, ev.clientY - partenza.y) > 6 || performance.now() - partenza.t > 500) return;
    const img = ev.target.closest?.('.strati3d-img');
    if (!img) return;
    puntoPiano = [ev.offsetX, ev.offsetY];
    for (const pt of punti) Object.assign(pt.style, { left: `${puntoPiano[0]}px`, top: `${puntoPiano[1]}px` });
    Object.assign(spillo.style, { left: `${puntoPiano[0] - cw / 2}px`, top: `${puntoPiano[1] - ch / 2}px` });
    const [x, y] = puntoDaPiano(angoli, puntoPiano[0] / cw, puntoPiano[1] / ch);
    const lngLat = new maplibregl.MercatorCoordinate(x, y).toLngLat();
    map.fire('click', { point: map.project(lngLat), lngLat }); // la scheda dell'app, sopra la scena (vedi css)
    gesto();
  });
  cursore.addEventListener('input', () => { meta.e = +cursore.value; gesto(); });
  gira.setAttribute('aria-pressed', String(girando));
  gira.addEventListener('click', () => { girando = !girando; gira.setAttribute('aria-pressed', String(girando)); });
  alto.addEventListener('click', () => {
    const daAlto = meta.b > 5;
    meta.b = daAlto ? 0 : 56;
    if (daAlto) meta.a = Math.round(meta.a / 360) * 360;
    alto.textContent = daAlto ? t('strati3d.in3d') : t('strati3d.alto');
    gesto();
  });
  const tasti = ev => {
    if (ev.key === 'Escape') { ev.preventDefault(); chiudiScena(); return; }
    if (ev.target instanceof HTMLInputElement) return;
    const azione = { ArrowLeft: () => { meta.a += 10; }, ArrowRight: () => { meta.a -= 10; },
      ArrowUp: () => { meta.b = Math.min(82, meta.b + 6); }, ArrowDown: () => { meta.b = Math.max(0, meta.b - 6); },
      '+': () => { meta.k = Math.min(4, meta.k * 1.15); }, '-': () => { meta.k = Math.max(0.4, meta.k / 1.15); } }[ev.key];
    if (azione) { azione(); gesto(); }
  };
  document.addEventListener('keydown', tasti);
  chiudi.addEventListener('click', () => chiudiScena());

  // ── disegno ──
  let tPrima = performance.now();
  function passo(ora) {
    const dt = Math.min(0.05, (ora - tPrima) / 1000);
    tPrima = ora;
    if (girando && !chiudendo && ora - ultimoGesto > 2500) meta.a += dt * 8;
    const m = ridotto ? 1 : 1 - Math.exp(-dt * (chiudendo ? 5 : 4));
    const cima = Math.max(0, ...piani.map((_, i) => (spento[i] ? 0 : quota(i) + rilievo[i])));
    const scopo = chiudendo ? { ...piatto, a: Math.round(cam.a / 360) * 360, zt: 0 }
      : { ...meta, k: meta.k * adatta(), zt: (meta.att >= 0 ? quota(meta.att) : cima / 2) * meta.e };
    [scopo.dx, scopo.dy] = chiudendo ? [0, 0] : spazioScheda();
    for (const k of ['a', 'b', 'k', 'e', 'zt', 'dx', 'dy']) cam[k] += (scopo[k] - cam[k]) * m;
    const tr = `translate(${cam.dx}px,${cam.dy}px) scale3d(${cam.k},${cam.k},${cam.k}) rotateX(${cam.b}deg) rotateZ(${cam.a}deg) translateZ(${-cam.zt}px)`;
    mondo.style.transform = tr;
    const vetro = Math.min(1, cam.e * 1.5);
    elPiani.forEach(({ d, b }, i) => {
      const att = !chiudendo && i === meta.att;
      zz[i] += (quota(i) - zz[i]) * m;
      d.style.transform = `translateZ(${zz[i] * cam.e + i * 0.4 + (att ? lato * 0.02 : 0)}px)`;
      const fuoco = meta.att < 0 || chiudendo || att ? 1 : i < meta.att ? 0.25 : 0.1;
      d.style.opacity = spento[i] && !chiudendo ? 0 : fuoco;
      d.style.pointerEvents = spento[i] ? 'none' : '';
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

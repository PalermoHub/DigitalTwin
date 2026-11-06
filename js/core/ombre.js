import { ShadowLayer, RoofShadowLayer } from './ombre-layer.js';
import { posizioneSole, localeInData, orarioIniziale, hhmm, ORA_MIN, ORA_MAX } from './ombre-sole.js';
import { t } from './i18n.js';
import { creaGrafico, serieGiorno } from './ombre-grafico.js';
import { SCENARI, PITCH_VISTA, cameraVista, FOV_DEFAULT, soleSchermo, sfondoCielo, LINEA_CASSARO, riflessoCassaro } from './ombre-scenari.js';

// Ombre del sole sugli edifici 3D: pulsante nella barra del navigatore (strati-3d-navigatore.js) e pannello con data, ora e riproduzione.
// Il layer WebGL (ombre-layer.js) si crea alla prima accensione: i dati (DTM, spigoli e tetti, circa 23 MB) si scaricano solo allora.

const COLORE = [0.04, 0.06, 0.2, 0.5];

function el(tag, classe) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  return e;
}

export function creaOmbre(map, nav) {
  const orario = orarioIniziale();
  let attive = false, layer = null, caricamento = null, timer = null, luceIniziale;

  const pannello = el('div', 'ombre-pannello');
  pannello.hidden = true;
  pannello.setAttribute('role', 'group');
  pannello.ariaLabel = t('ombre.titolo');
  const data = el('input'); data.type = 'date'; data.value = orario.giorno; data.ariaLabel = t('ombre.data');
  const adesso = el('button', 'ombre-adesso'); adesso.type = 'button'; adesso.textContent = t('ombre.adesso');
  const rigaData = el('div', 'ombre-riga'); rigaData.append(data, adesso);
  const play = el('button', 'ombre-play'); play.type = 'button'; play.textContent = '▶'; play.title = play.ariaLabel = t('ombre.play');
  const ora = el('input'); ora.type = 'range'; ora.min = ORA_MIN; ora.max = ORA_MAX; ora.step = 10; ora.value = orario.minuti; ora.ariaLabel = t('ombre.ora');
  const lettura = el('output', 'ombre-ora-testo');
  const rigaOra = el('div', 'ombre-riga'); rigaOra.append(play, ora, lettura);
  const info = el('div', 'ombre-info');
  const etichetta = el('label', 'ombre-rilievo');
  const rilievo = el('input'); rilievo.type = 'checkbox'; rilievo.setAttribute('role', 'switch');
  const testoRilievo = el('span'); testoRilievo.textContent = t('ombre.rilievo');
  etichetta.append(testoRilievo, rilievo); // l'interruttore sta a destra del testo
  const zonaGrafico = el('div', 'ombre-grafico-zona');
  const grafico = creaGrafico(zonaGrafico, m => { ora.value = m; aggiorna(); });
  const zonaVista = el('div', 'ombre-viste');
  const titoloVista = el('p', 'ombre-viste-titolo'); titoloVista.textContent = t('ombre.viste.titolo');
  const bottoniVista = SCENARI.map(sc => {
    const b = el('button'); b.type = 'button'; b.textContent = t(`ombre.vista.${sc.id}`); b.addEventListener('click', () => vai(sc));
    return b;
  });
  const esciVista = el('button', 'ombre-viste-esci'); esciVista.type = 'button'; esciVista.textContent = t('ombre.viste.esci'); esciVista.hidden = true;
  zonaVista.append(titoloVista, ...bottoniVista, esciVista);
  pannello.append(rigaData, rigaOra, info, zonaGrafico, zonaVista, etichetta);
  nav.radice.append(pannello);

  const casella = id => document.getElementById(`strato-${id}`);
  const clicca = (id, acceso) => { const c = casella(id); if (c && c.checked !== acceso) c.click(); };

  // luce di MapLibre sincronizzata al sole: pareti e tetti cambiano tono con l'ora; sole basso = luce calda e fioca
  function illumina(az, el) {
    const alto = Math.max(0, Math.min(1, el / 60));
    const caldo = 1 - Math.min(1, Math.max(0, (el - 3) / 25));
    const mix = (a, b) => Math.round(a + (b - a) * caldo);
    map.setLight({
      anchor: 'map',
      position: [1.5, el > 0 ? az : 180, el > 0 ? 90 - Math.max(el, 4) : 80],
      color: el <= 0 ? '#8fa3c7' : `rgb(255,${mix(250, 190)},${mix(240, 140)})`,
      intensity: el > 0 ? 0.25 + 0.45 * alto : 0.12,
    });
  }

  // La curva dipende solo dal giorno: si ricalcola (circa 0,2 s) quando cambia la data, non a ogni passo dello slider.
  let giornoGrafico = null, attesaGrafico = 0;
  function ridisegnaGrafico() {
    const giorno = data.value || orario.giorno;
    giornoGrafico = data.value;
    clearTimeout(attesaGrafico);
    attesaGrafico = setTimeout(() => grafico.aggiorna(serieGiorno(layer.spigoliBuf, layer.nSpigoli, giorno)), 120);
  }

  // Vista fotografica: camera libera a quota d'occhio, sole disegnato come disco sopra la mappa, cielo dietro l'orizzonte.
  let vista = null, disco = null, salvata = null;
  function ridisegnaVista() {
    if (!vista) return;
    const c = map.getContainer(), w = c.clientWidth, h = c.clientHeight;
    const { az, el } = posizioneSole(localeInData(data.value, Number(ora.value)));
    const cam = { bearing: map.getBearing(), pitch: map.getPitch(), fov: map.getVerticalFieldOfView?.() ?? FOV_DEFAULT, w, h, padding: map.getPadding() };
    const orizzonte = soleSchermo(cam.bearing, 0, cam);
    c.style.background = sfondoCielo(el, orizzonte ? orizzonte.y : h / 2, h);
    const p = el > -1 ? soleSchermo(az, Math.max(el, 0), cam) : null;
    disco.hidden = !p;
    if (p) disco.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }

  function vai(sc) {
    const anno = (data.value || orario.giorno).slice(0, 4);
    data.value = `${anno}-${sc.giorno}`; ora.value = sc.minuti;
    if (!vista) {
      salvata = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch(), fondo: map.getContainer().style.background, maxPitch: map.getMaxPitch(), maxZoom: map.getMaxZoom() };
      disco = el('div', 'ombre-sole-disco'); disco.hidden = true;
      map.getContainer().append(disco);
      map.on('move', ridisegnaVista);
    }
    vista = sc;
    esciVista.hidden = false;
    const cam = cameraVista(sc, map.getContainer().clientHeight);
    map.setMaxPitch(PITCH_VISTA);
    map.setMaxZoom(Math.max(salvata.maxZoom, cam.zoom + 0.1)); // a quota d'occhio serve più zoom del massimo normale
    map.jumpTo(cam);
    aggiorna();
    ridisegnaVista();
  }

  function esciDallaVista() {
    if (!vista) return;
    vista = null;
    map.off('move', ridisegnaVista);
    disco?.remove(); disco = null;
    esciVista.hidden = true;
    map.getContainer().style.background = salvata.fondo;
    map.setMaxPitch(salvata.maxPitch);
    map.setMaxZoom(salvata.maxZoom);
    map.jumpTo({ center: salvata.center, zoom: salvata.zoom, bearing: salvata.bearing, pitch: Math.min(salvata.pitch, salvata.maxPitch) });
  }

  function aggiorna() {
    const minuti = Number(ora.value);
    const { az, el } = posizioneSole(localeInData(data.value || orario.giorno, minuti));
    lettura.textContent = hhmm(minuti);
    grafico.cursore(minuti);
    if (layer?.spigoliBuf && giornoGrafico !== data.value) ridisegnaGrafico();
    info.textContent = el > 0 ? t('ombre.sole', { el: el.toFixed(1), az: az.toFixed(0) }) : t('ombre.notte');
    if (!layer) return;
    layer.setSun(az, el);
    illumina(az, el);
    const k = riflessoCassaro(az, el);
    if (map.getLayer('ombre-riflesso')) {
      map.setPaintProperty('ombre-riflesso', 'line-opacity', k * 0.8);
      map.setPaintProperty('ombre-riflesso-alone', 'line-opacity', k * 0.35);
    }
    ridisegnaVista();
  }

  async function crea() {
    const { urlDati } = await import('./config.js'); // config.js legge `window`: caricato solo qui
    const meta = await (await fetch(urlDati('ombre/dsm_meta.json'))).json();
    const l = new ShadowLayer(meta, {
      dtm: urlDati('ombre/dtm.png'), spigoli: urlDati('ombre/edifici_spigoli.bin.gz'), tetti: urlDati('ombre/edifici_tetti.bin.gz'),
    }, maplibregl.MercatorCoordinate);
    l.setColor(COLORE);
    // le ombre a terra stanno SOTTO gli edifici estrusi, quelle sui tetti subito sopra
    const ids = map.getStyle().layers.map(x => x.id);
    map.addLayer(l, 'edifici-3d');
    map.addLayer(new RoofShadowLayer(l), ids[ids.indexOf('edifici-3d') + 1]);
    // riflesso del sole sul Cassaro: alone largo + nucleo stretto, larghezze in metri (esponenziali con lo zoom)
    const larg = m => ['interpolate', ['exponential', 2], ['zoom'], 10, m * 0.0083, 22, m * 34];
    map.addSource('ombre-riflesso', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: LINEA_CASSARO } } });
    const luce = { 'line-color': '#ffe4a6', 'line-opacity': 0 };
    map.addLayer({ id: 'ombre-riflesso-alone', type: 'line', source: 'ombre-riflesso', layout: { 'line-cap': 'round' }, paint: { ...luce, 'line-width': larg(40), 'line-blur': larg(30) } }, 'edifici-3d');
    map.addLayer({ id: 'ombre-riflesso', type: 'line', source: 'ombre-riflesso', layout: { 'line-cap': 'round' }, paint: { ...luce, 'line-width': larg(12), 'line-blur': larg(5) } }, 'edifici-3d');
    return l;
  }

  function ferma() {
    clearInterval(timer); timer = null;
    play.textContent = '▶';
  }

  async function accendi() {
    attive = true;
    nav.bOmbre.setAttribute('aria-pressed', 'true');
    pannello.hidden = false;
    clicca('edifici3d', true); // senza edifici le ombre non hanno senso
    luceIniziale ??= map.getLight();
    try {
      caricamento ??= crea();
      layer = await caricamento;
      await layer.pronto; // DTM, spigoli e tetti scaricati: serve per il grafico
    } catch (e) {
      console.warn('ombre non disponibili:', e); // i18n-ok
      caricamento = null; spegni(); return;
    }
    if (!attive) return;
    for (const id of ['ombre', 'ombre-tetti', 'ombre-riflesso', 'ombre-riflesso-alone']) map.getLayer(id) && map.setLayoutProperty(id, 'visibility', 'visible');
    aggiorna();
  }

  function spegni() {
    esciDallaVista();
    attive = false;
    ferma();
    nav.bOmbre.setAttribute('aria-pressed', 'false');
    pannello.hidden = true;
    for (const id of ['ombre', 'ombre-tetti', 'ombre-riflesso', 'ombre-riflesso-alone']) map.getLayer(id) && map.setLayoutProperty(id, 'visibility', 'none');
    if (luceIniziale) map.setLight(luceIniziale);
    map.triggerRepaint();
  }

  esciVista.addEventListener('click', esciDallaVista);
  data.addEventListener('input', aggiorna);
  ora.addEventListener('input', aggiorna);
  adesso.addEventListener('click', () => {
    const o = orarioIniziale(new Date());
    data.value = o.giorno; ora.value = o.minuti;
    aggiorna();
  });
  play.addEventListener('click', () => {
    if (timer) { ferma(); return; }
    play.textContent = '⏸';
    timer = setInterval(() => { ora.value = Number(ora.value) >= ORA_MAX ? ORA_MIN : Number(ora.value) + 10; aggiorna(); }, 120);
  });
  // Rilievo 3D: la stessa casella della legenda dei livelli, tenuta allineata nei due sensi
  rilievo.addEventListener('change', () => clicca('rilievo3d', rilievo.checked));
  document.addEventListener('change', ev => {
    if (ev.target?.id === 'strato-rilievo3d') rilievo.checked = ev.target.checked;
  });
  rilievo.checked = !!casella('rilievo3d')?.checked;
  grafico.aggiorna([]);
  aggiorna();

  // Stato condivisibile (link «Condividi»): null a ombre spente; altrimenti data, ora e, se c'è, la vista fotografica.
  const stato = () => (attive ? { d: data.value || orario.giorno, m: Number(ora.value), ...(vista && { v: vista.id }) } : null);
  // Riapplica uno stato letto da un link: accende le ombre, entra nella vista (che imposta data e ora dello scenario) e rimette data e ora del mittente.
  function applica(h) {
    if (!attive) accendi();
    const sc = SCENARI.find(s => s.id === h.v);
    if (sc) vai(sc);
    if (h.d) data.value = h.d;
    if (Number.isFinite(h.m)) ora.value = h.m;
    aggiorna();
  }

  return { attive: () => attive, toggle: () => (attive ? spegni() : accendi()), spegni, stato, applica };
}

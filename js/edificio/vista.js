// Vista «Edificio in 3D» (crociferi.html): l'ex Noviziato dei Crociferi estruso sulla mappa, piano per piano,
// con l'esploso dei livelli. Dati: dati/edificio/crociferi/*.geojson (scripts/edificio/crociferi.py).
import { STILE_BASE } from '../core/config.js';
import { t, caricaDizionari, applicaDom, creaInterruttoreLingua } from '../core/i18n.js';
import { GRUPPI, COLORI_PIANI, altezze, filtroVolumi, filtroNumeri, coloreVolumi, righeScheda, pianiDa, nomePiano,
  prospettiVisibili, stanzeDelClic } from './modello.js';
import { ID_PROSPETTI, creaLayerProspetti } from './prospetti.js';

const DATI = 'dati/edificio/crociferi/';
const $ = id => document.getElementById(id);

const stato = {
  passo: 0,
  piani: [],          // id dei piani accesi
  gruppi: GRUPPI.map(g => g.id),
  pianta: null,       // id del piano in vista pianta, o null
  prospetti: true,    // disegni dei prospetti sulle facciate
  prima: null,        // stato da ripristinare all'uscita dalla pianta
};

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

function escape(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function avvia() {
  await caricaDizionari();
  applicaDom(document);
  $('pannello').querySelector('.bottoni:last-of-type').append(creaInterruttoreLingua(document));
  const [edificio, contesto] = await Promise.all([json(DATI + 'crociferi.geojson'), json(DATI + 'contesto.geojson')]);
  const piani = pianiDa(edificio);
  stato.piani = piani.map(p => p.id);
  const centro = edificio.metadata?.centro ?? [13.37285, 38.11666];
  const rotazione = edificio.metadata?.rotazione ?? 31.5;

  const map = new maplibregl.Map({
    container: 'mappa', style: STILE_BASE, center: centro, zoom: 18.7, pitch: 58,
    // da sud-ovest: si vedono il fronte su via Torremuzza e la facciata lunga, quelle con i prospetti
    bearing: 45 - rotazione, maxPitch: 85, antialias: true, attributionControl: { compact: true },
  });
  // su schermo largo il pannello copre la sinistra: l'edificio va al centro della parte libera
  if (matchMedia('(min-width: 641px)').matches) map.setPadding({ left: 320, top: 0, right: 0, bottom: 0 });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

  map.on('load', () => {
    map.addSource('contesto', { type: 'geojson', data: contesto });
    map.addSource('edificio', { type: 'geojson', data: edificio, generateId: true,
      attribution: t('edificio.attribuzione') });
    map.addLayer({
      id: 'contesto', type: 'fill-extrusion', source: 'contesto',
      paint: { 'fill-extrusion-color': '#d3d6da', 'fill-extrusion-height': ['to-number', ['get', 'h'], 6],
        'fill-extrusion-opacity': 0.3 },
    });
    map.addLayer({
      id: 'edificio-volumi', type: 'fill-extrusion', source: 'edificio',
      paint: { 'fill-extrusion-color': coloreVolumi(), 'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true },
    });
    map.addLayer({
      id: 'edificio-numeri', type: 'symbol', source: 'edificio',
      layout: { visibility: 'none', 'text-field': ['get', 'numero'], 'text-font': ['Noto Sans Bold'], 'text-size': 15,
        'text-allow-overlap': true },
      paint: { 'text-color': '#1f2328', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
    });
    aggiorna(map);
    interazioni(map, edificio);
    // i prospetti sono un di più: se mancano o three.js non si carica, la vista resta quella delle estrusioni
    json(DATI + 'prospetti.json')
      .then(p => creaLayerProspetti(DATI, p, centro))
      .then(layer => { map.addLayer(layer, 'edificio-numeri'); aggiorna(map); })
      .catch(err => console.warn('prospetti non disponibili', err)); // i18n-ok: messaggio solo per la console
  });

  costruisciPannello(map, piani);
}

function aggiorna(map) {
  if (!map.getLayer('edificio-volumi')) return;
  const { base, cima } = altezze(stato.passo);
  map.setPaintProperty('edificio-volumi', 'fill-extrusion-base', base);
  map.setPaintProperty('edificio-volumi', 'fill-extrusion-height', cima);
  map.setFilter('edificio-volumi', filtroVolumi(stato.piani, stato.gruppi));
  map.setFilter('edificio-numeri', filtroNumeri(stato.pianta ? [stato.pianta] : []));
  map.setLayoutProperty('edificio-numeri', 'visibility', stato.pianta ? 'visible' : 'none');
  if (map.getLayer(ID_PROSPETTI)) {
    map.setLayoutProperty(ID_PROSPETTI, 'visibility', prospettiVisibili({ ...stato, acceso: stato.prospetti }) ? 'visible' : 'none');
  }
  $('esploso-valore').value = `${String(stato.passo).replace('.', ',')} m`;
  $('esploso').value = stato.passo;
  for (const el of document.querySelectorAll('#piani input')) el.checked = stato.piani.includes(el.value);
  for (const el of document.querySelectorAll('#gruppi input')) el.checked = stato.gruppi.includes(el.value);
  for (const el of document.querySelectorAll('#piani button')) el.setAttribute('aria-pressed', String(stato.pianta === el.dataset.piano));
  $('pianta').setAttribute('aria-pressed', String(Boolean(stato.pianta)));
}

function costruisciPannello(map, piani) {
  const box = $('piani');
  // dall'alto in basso, come si leggono i piani di un edificio
  for (const p of [...piani].reverse()) {
    const riga = document.createElement('div');
    riga.className = 'voce';
    riga.innerHTML = `<input type="checkbox" id="p-${p.id}" value="${p.id}" checked>`
      + `<span class="tacca" style="background:${COLORI_PIANI[p.id] ?? '#ccc'}"></span>`
      + `<label for="p-${p.id}">${escape(nomePiano(p.id, p.nome))}</label>`
      + (p.id === 'copertura' ? '' : `<button type="button" data-piano="${p.id}" aria-pressed="false" title="${escape(t('edificio.pianta.tip'))}">${escape(t('edificio.pianta'))}</button>`);
    box.append(riga);
  }
  box.addEventListener('change', e => {
    const id = e.target.value;
    stato.piani = e.target.checked ? [...new Set([...stato.piani, id])] : stato.piani.filter(x => x !== id);
    aggiorna(map);
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('button[data-piano]');
    if (!b) return;
    if (stato.pianta === b.dataset.piano) esciPianta(map);
    else entraPianta(map, b.dataset.piano);
  });

  const gr = $('gruppi');
  for (const g of GRUPPI) {
    const riga = document.createElement('div');
    riga.className = 'voce';
    riga.innerHTML = `<input type="checkbox" id="g-${g.id}" value="${g.id}" checked><label for="g-${g.id}">${escape(t(`edificio.gruppo.${g.id}`))}</label>`;
    gr.append(riga);
  }
  gr.addEventListener('change', e => {
    const id = e.target.value;
    stato.gruppi = e.target.checked ? [...new Set([...stato.gruppi, id])] : stato.gruppi.filter(x => x !== id);
    aggiorna(map);
  });

  $('esploso').addEventListener('input', e => { stato.passo = Number(e.target.value); aggiorna(map); });
  $('tutti').addEventListener('click', () => {
    if (stato.pianta) esciPianta(map);
    stato.piani = piani.map(p => p.id);
    stato.gruppi = GRUPPI.map(g => g.id);
    aggiorna(map);
  });
  $('pianta').addEventListener('click', () => {
    if (stato.pianta) esciPianta(map);
    else entraPianta(map, 'primo');
  });
  $('prospetti').addEventListener('change', e => { stato.prospetti = e.target.checked; aggiorna(map); });
  $('contesto').addEventListener('change', e => {
    if (map.getLayer('contesto')) map.setLayoutProperty('contesto', 'visibility', e.target.checked ? 'visible' : 'none');
  });

  let giro = null;
  $('ruota').addEventListener('click', e => {
    const attivo = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(attivo));
    cancelAnimationFrame(giro);
    if (!attivo) return;
    let t0 = performance.now();
    const passo = t => {
      map.setBearing(map.getBearing() + (t - t0) * 0.012);
      t0 = t;
      giro = requestAnimationFrame(passo);
    };
    giro = requestAnimationFrame(passo);
  });

  $('riduci').addEventListener('click', e => {
    const ridotto = $('pannello').classList.toggle('ridotto');
    e.currentTarget.textContent = ridotto ? '+' : '–';
    e.currentTarget.setAttribute('aria-expanded', String(!ridotto));
  });
}

// Vista in pianta: un solo piano, senza esploso e senza coperture, visto dall'alto, con i numeri delle stanze.
function entraPianta(map, piano) {
  if (!stato.pianta) stato.prima = { piani: stato.piani, gruppi: stato.gruppi, passo: stato.passo, pitch: map.getPitch() };
  stato.pianta = piano;
  stato.piani = [piano];
  stato.gruppi = stato.prima.gruppi.filter(g => g !== 'copertura');
  stato.passo = 0;
  map.easeTo({ pitch: 0, duration: 800 });
  aggiorna(map);
}

function esciPianta(map) {
  const p = stato.prima;
  stato.pianta = null;
  if (p) Object.assign(stato, { piani: p.piani, gruppi: p.gruppi, passo: p.passo });
  map.easeTo({ pitch: p?.pitch ?? 62, duration: 800 });
  stato.prima = null;
  aggiorna(map);
}

function interazioni(map, edificio) {
  let evidenziato = null;
  const spegni = () => {
    if (evidenziato != null) map.setFeatureState({ source: 'edificio', id: evidenziato }, { evidenza: false });
    evidenziato = null;
  };
  map.on('mousemove', 'edificio-volumi', e => {
    const f = e.features?.[0];
    if (!f || f.id === evidenziato) return;
    spegni();
    evidenziato = f.id;
    map.setFeatureState({ source: 'edificio', id: f.id }, { evidenza: true });
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'edificio-volumi', () => { spegni(); map.getCanvas().style.cursor = ''; });
  map.on('click', 'edificio-volumi', e => {
    const trovati = e.features ?? [];
    if (!trovati.length) return;
    // il primo è il più vicino all'occhio. Con generateId l'id è l'indice nel GeoJSON: lì la geometria è intera
    // (quella dei tile è ritagliata)
    const scelto = trovati[0];
    const f = edificio.features[scelto.id] ?? scelto;
    const stanze = stanzeDelClic(f, [e.lngLat.lng, e.lngLat.lat], edificio.features);
    const righe = righeScheda(f.properties, stanze).map(([k, v]) => `<tr><td>${escape(k)}</td><td>${escape(v)}</td></tr>`).join('');
    new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
      .setLngLat(e.lngLat).setHTML(`<div class="scheda"><table>${righe}</table></div>`).addTo(map);
  });
}

avvia().catch(err => {
  console.error(err);
  $('nota').textContent = t('edificio.errore', { errore: err.message });
});

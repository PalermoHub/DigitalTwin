// js/rndt/host.js
// Lo «host» che il plugin openrndt-geolibre si aspetta (API di GeoLibre), costruito sulla mappa MapLibre di questa app.
// I servizi esterni passano dal Worker proxy (CORS); i layer aggiunti si ricordano in archivio.js.
import { BBOX_PALERMO, intersezione, vistaPalermo, filtraSuConfine } from './area.js';
import { aggiungi as salvaAggiungi, rimuovi as salvaRimuovi, aggiorna as salvaAggiorna } from './archivio.js';

const COLORI = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#c92a2a', '#0c8599'];
const FINESTRA_DOWNLOAD_MS = 30000;
const SEMBRA_DATI = /getfeature(?!info)|\.geojson|f=geojson|outputformat=[^&]*json/i;
const GET_FEATURE = /request=getfeature(?!info)/i;
const SOLO_CONTEGGIO = /resulttype=hits/i;
const CON_AREA = /[?&](bbox|filter|cql_filter)=/i;

function hash(testo) {
  let h = 5381;
  for (let i = 0; i < testo.length; i++) h = ((h << 5) + h + testo.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// https://host/percorso?query → <proxy>/t/host/percorso?query. Le graffe dei segnaposto ({z}, {bbox-epsg-3857}) restano com'erano.
export function urlProxy(proxy, url) {
  const m = String(url).match(/^https?:\/\/([^/?#]+)([^#]*)/i);
  if (!m) throw new Error(`indirizzo non valido: ${url}`);
  return `${proxy.replace(/\/$/, '')}/t/${m[1]}${m[2] || '/'}`;
}

export function creaHost({ map, proxy, stato: iniziale, scrivi, anelli = () => [], notifica = () => {}, pannello = {}, fetchFn = (...a) => fetch(...a) }) {
  let stato = iniziale;
  const layers = new Map(); // id → { id, tipo, nome, visibile, sorgente, idMappa[], idSorgente, salvato, indisponibile?, errore? }
  const ascoltatori = new Set();
  let ultimoDownload = null; // l'ultimo URL che sembra un download di dati: il plugin dà all'host i dati, non l'URL
  let avvisatoSalvataggio = false;
  let contatore = 0;

  const cambio = () => { for (const f of ascoltatori) f(); };
  const persisti = () => {
    if (scrivi(stato) || avvisatoSalvataggio) return;
    avvisatoSalvataggio = true;
    notifica('Non riesco a salvare i layer RNDT: restano finché la pagina è aperta.');
  };
  const daSalvare = ({ id, tipo, nome, visibile, sorgente }) => ({ id, tipo, nome, visibile, sorgente });

  function registra(rec, { salva = true } = {}) {
    layers.set(rec.id, rec);
    if (salva && rec.salvato) { stato = salvaAggiungi(stato, daSalvare(rec)); persisti(); }
    cambio();
    return rec.id;
  }

  function togliDallaMappa(rec) {
    for (const l of rec.idMappa) if (map.getLayer(l)) map.removeLayer(l);
    if (map.getSource(rec.idSorgente)) map.removeSource(rec.idSorgente);
  }

  function creaWms(nome, opz, salva) {
    if (opz.crs && opz.crs !== 'EPSG:3857') throw new Error(`CRS ${opz.crs} non supportato dalla mappa`);
    const id = `rndt-${hash(`wms|${opz.url}|${opz.layers}`)}`;
    if (layers.has(id)) return id;
    const v13 = String(opz.version).startsWith('1.3');
    const q = new URL(opz.url);
    const imposta = (k, v) => q.searchParams.set(k, v);
    imposta('SERVICE', 'WMS'); imposta('REQUEST', 'GetMap'); imposta('VERSION', opz.version); imposta('LAYERS', opz.layers);
    imposta('STYLES', ''); imposta('FORMAT', opz.format ?? 'image/png'); imposta('TRANSPARENT', String(opz.transparent !== false));
    imposta('WIDTH', '256'); imposta('HEIGHT', '256'); imposta(v13 ? 'CRS' : 'SRS', 'EPSG:3857');
    const bounds = (opz.bounds && intersezione(opz.bounds, BBOX_PALERMO)) || BBOX_PALERMO; // niente tile fuori da Palermo
    map.addSource(id, { type: 'raster', tiles: [`${urlProxy(proxy, q.toString())}&BBOX={bbox-epsg-3857}`], tileSize: 256, bounds });
    map.addLayer({ id, type: 'raster', source: id });
    return registra({ id, tipo: 'wms', nome, visibile: true, sorgente: { ...opz }, idMappa: [id], idSorgente: id, salvato: true }, { salva });
  }

  function creaTile(nome, url, opz = {}, salva) {
    const id = `rndt-${hash(`tile|${url}`)}`;
    if (layers.has(id)) return id;
    map.addSource(id, { type: 'raster', tiles: [urlProxy(proxy, url)], tileSize: 256, attribution: opz.attribution, bounds: BBOX_PALERMO });
    map.addLayer({ id, type: 'raster', source: id });
    return registra({ id, tipo: 'tile', nome, visibile: true, sorgente: { url, attribution: opz.attribution }, idMappa: [id], idSorgente: id, salvato: true }, { salva });
  }

  function creaGeoJson(nome, fc, url, salva) {
    const { fc: dati, filtrato } = filtraSuConfine(fc, anelli());
    if (filtrato && !dati.features.length) throw new Error('nessuna feature dentro il Comune di Palermo');
    const id = `rndt-${hash(url ? `geojson|${url}` : `geojson|${nome}|${contatore++}`)}`;
    if (layers.has(id)) { togliDallaMappa(layers.get(id)); layers.delete(id); }
    const colore = COLORI[parseInt(hash(nome), 36) % COLORI.length];
    map.addSource(id, { type: 'geojson', data: dati });
    const strati = [
      { id: `${id}-fill`, type: 'fill', source: id, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': colore, 'fill-opacity': 0.3 } },
      { id: `${id}-line`, type: 'line', source: id, filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': colore, 'line-width': 2 } },
      { id: `${id}-pt`, type: 'circle', source: id, filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': colore, 'circle-radius': 5, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } },
    ];
    for (const s of strati) map.addLayer(s);
    return registra({
      id, tipo: 'geojson', nome, visibile: true, sorgente: url ? { url } : {}, idMappa: strati.map(s => s.id), idSorgente: id, salvato: Boolean(url),
    }, { salva });
  }

  async function fetchArrayBuffer(url) {
    if (GET_FEATURE.test(url) && !SOLO_CONTEGGIO.test(url) && !CON_AREA.test(url)) {
      throw new Error('download limitato a Palermo: attiva «Only features in the current map view»');
    }
    const risposta = await fetchFn(urlProxy(proxy, url));
    if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
    const buffer = await risposta.arrayBuffer();
    if (SEMBRA_DATI.test(url) && !SOLO_CONTEGGIO.test(url)) ultimoDownload = { url, t: Date.now() };
    return buffer;
  }

  function impostaVisibilita(id, visibile, salva = true) {
    const rec = layers.get(id);
    if (!rec) return;
    for (const l of rec.idMappa) if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', visibile ? 'visible' : 'none');
    rec.visibile = visibile;
    if (salva && rec.salvato) { stato = salvaAggiorna(stato, id, { visibile }); persisti(); }
    cambio();
  }

  map.on('error', e => {
    const rec = e?.sourceId && layers.get(e.sourceId);
    if (!rec || rec.errore) return;
    rec.errore = true; // un solo avviso per layer; non si disattiva (un tile mancante non è un layer rotto)
    notifica(`Layer RNDT con errori di caricamento: ${rec.nome}`);
    cambio();
  });

  return {
    getMap: () => map,
    getViewBounds() {
      const b = map.getBounds();
      return vistaPalermo([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    },
    fitBounds: bbox => map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40, duration: 500 }),
    getLayers: () => [...layers.keys()],
    getDrawnFeatures: () => [],
    getProjectSnapshot: () => ({
      layers: [...layers.values()].map(r => (r.tipo === 'wms'
        ? { id: r.id, type: 'wms', source: { url: r.sorgente.url, layers: r.sorgente.layers } }
        : r.tipo === 'tile' ? { id: r.id, type: 'xyz', source: { tiles: [r.sorgente.url] } } : { id: r.id, type: 'geojson' })),
    }),
    addWmsLayer: (nome, opz) => creaWms(nome, opz, true),
    addTileLayer: (nome, url, opz) => creaTile(nome, url, opz, true),
    addGeoJsonLayer(nome, fc) {
      const recente = ultimoDownload && Date.now() - ultimoDownload.t < FINESTRA_DOWNLOAD_MS ? ultimoDownload.url : null;
      ultimoDownload = null;
      return creaGeoJson(nome, fc, recente, true);
    },
    fetchArrayBuffer,
    exportTextFile(nome, contenuto, opz = {}) {
      const url = URL.createObjectURL(new Blob([contenuto], { type: opz.mimeType ?? 'text/plain' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: nome });
      a.click();
      URL.revokeObjectURL(url);
    },
    openExternalUrl: url => window.open(url, '_blank', 'noopener,noreferrer'),
    activatePlugin: async () => false,
    registerRightPanel: reg => pannello.registra?.(reg) ?? (() => {}),
    registerToolbarMenu: () => () => {}, // il pannello si apre dall'icona della scheda e dalla barra strumenti
    openRightPanel: () => pannello.apri?.(),
    closeRightPanel: () => pannello.chiudi?.(),

    elenco: () => [...layers.values()].map(({ id, tipo, nome, visibile, indisponibile, errore, salvato, sorgente }) => ({
      id, tipo, nome, visibile, indisponibile: Boolean(indisponibile), errore: Boolean(errore), salvato, sorgente,
    })),
    mostra: impostaVisibilita,
    elimina(id) {
      const rec = layers.get(id);
      if (!rec) return;
      togliDallaMappa(rec);
      layers.delete(id);
      stato = salvaRimuovi(stato, id);
      persisti();
      cambio();
    },
    async ripristina() {
      for (const salvato of stato.layers) {
        try {
          let id;
          if (salvato.tipo === 'wms') id = creaWms(salvato.nome, salvato.sorgente, false);
          else if (salvato.tipo === 'tile') id = creaTile(salvato.nome, salvato.sorgente.url, { attribution: salvato.sorgente.attribution }, false);
          else {
            const buffer = await fetchArrayBuffer(salvato.sorgente.url);
            id = creaGeoJson(salvato.nome, JSON.parse(new TextDecoder().decode(buffer)), salvato.sorgente.url, false);
          }
          if (salvato.visibile === false) impostaVisibilita(id, false, false); // l'id è quello ricalcolato: coincide con il salvato salvo archivi vecchi
        } catch {
          layers.set(salvato.id, { ...salvato, idMappa: [], idSorgente: salvato.id, salvato: true, indisponibile: true });
        }
      }
      cambio();
    },
    featureAlPunto(id, punto, r = 4) {
      const presenti = (layers.get(id)?.idMappa ?? []).filter(l => map.getLayer(l));
      if (!presenti.length) return [];
      return map.queryRenderedFeatures([[punto.x - r, punto.y - r], [punto.x + r, punto.y + r]], { layers: presenti });
    },
    suCambio(fn) { ascoltatori.add(fn); return () => ascoltatori.delete(fn); },
  };
}

// js/rndt/host.js
// Lo «host» che il plugin openrndt-geolibre si aspetta (API di GeoLibre), costruito sulla mappa MapLibre di questa app.
// I servizi esterni passano dal Worker proxy (CORS); i layer aggiunti si ricordano in archivio.js.
import { BBOX_PALERMO, intersezione, vistaPalermo, filtraSuConfine } from './area.js';
import { aggiungi as salvaAggiungi, rimuovi as salvaRimuovi, aggiorna as salvaAggiorna } from './archivio.js';
import { t as tr } from '../core/i18n.js';

const COLORI = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#c92a2a', '#0c8599'];
const FINESTRA_DOWNLOAD_MS = 30000;
// Un GeoJSON senza URL si salva coi suoi dati nell'archivio dati (IndexedDB); oltre questo tetto resta solo in sessione
export const TETTO_DATI = 5_000_000;
// Un WFS dell'utente oltre questo numero di feature è troppo grande per il browser
export const TETTO_WFS = 5000;
const SEMBRA_DATI = /getfeature(?!info)|\.geojson|f=geojson|outputformat=[^&]*json/i;
const GET_FEATURE = /request=getfeature(?!info)/i;
const SOLO_CONTEGGIO = /resulttype=hits/i;
const CON_AREA = /[?&](bbox|filter|cql_filter)=/i;

export function hash(testo) {
  let h = 5381;
  for (let i = 0; i < testo.length; i++) h = ((h << 5) + h + testo.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// https://host/percorso?query → <proxy>/t/host/percorso?query. Le graffe dei segnaposto ({z}, {bbox-epsg-3857}) restano com'erano.
export function urlProxy(proxy, url) {
  const m = String(url).match(/^https?:\/\/([^/?#]+)([^#]*)/i);
  if (!m) throw new Error(tr('err.indirizzoNonValidoUrl', { url }));
  return `${proxy.replace(/\/$/, '')}/t/${m[1]}${m[2] || '/'}`;
}

export function creaHost({ map, proxy, stato: iniziale, scrivi, anelli = () => [], notifica = () => {}, pannello = {}, archivioDati = null, prefisso = 'rndt', etichetta = 'RNDT', autorizzazione = () => null, protetto = () => false, riscrivi = url => url, fetchFn = (...a) => fetch(...a) }) {
  let stato = iniziale;
  const layers = new Map(); // id → { id, tipo, nome, visibile, sorgente, idMappa[], idSorgente, salvato, indisponibile?, errore? }
  const ascoltatori = new Set();
  let ultimoDownload = null; // l'ultimo URL che sembra un download di dati: il plugin dà all'host i dati, non l'URL
  let avvisatoSalvataggio = false;
  let contatore = 0;
  const scritture = new Set(); // scritture dei dati in corso: attendi() le aspetta
  const inAttesa = promessa => { scritture.add(promessa); promessa.finally(() => scritture.delete(promessa)); return promessa; };

  const cambio = () => { for (const f of ascoltatori) f(); };
  const persisti = () => {
    if (scrivi(stato) || avvisatoSalvataggio) return;
    avvisatoSalvataggio = true;
    notifica(tr('rndt.salvataggio.layers', { etichetta }));
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

  // Un layer «non disponibile» (servizio protetto non ancora sbloccato) si sostituisce quando il servizio si riaggiunge
  const liberaSeNonDisponibile = id => { if (layers.get(id)?.indisponibile) layers.delete(id); };

  // MapLibre non lancia se rifiuta una sorgente (indirizzo o opzioni non validi): emette un errore e basta. Qui lo si fa emergere.
  function verificaInMappa(id) {
    if (map.getLayer(id)) return;
    if (map.getSource(id)) map.removeSource(id);
    throw new Error(tr('err.mappaNonAccetta'));
  }

  function creaWms(nome, opz, salva) {
    if (opz.crs && opz.crs !== 'EPSG:3857') throw new Error(tr('err.crs', { crs: opz.crs }));
    const id = `${prefisso}-${hash(`wms|${opz.url}|${opz.layers}`)}`;
    liberaSeNonDisponibile(id);
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
    verificaInMappa(id);
    return registra({ id, tipo: 'wms', nome, visibile: true, sorgente: { ...opz }, idMappa: [id], idSorgente: id, salvato: true }, { salva });
  }

  function creaTile(nome, url, opz = {}, salva) {
    const id = `${prefisso}-${hash(`tile|${url}`)}`;
    liberaSeNonDisponibile(id);
    if (layers.has(id)) return id;
    map.addSource(id, { type: 'raster', tiles: [urlProxy(proxy, url)], tileSize: 256, ...(opz.attribution ? { attribution: opz.attribution } : {}), bounds: BBOX_PALERMO });
    map.addLayer({ id, type: 'raster', source: id });
    verificaInMappa(id);
    return registra({ id, tipo: 'tile', nome, visibile: true, sorgente: { url, attribution: opz.attribution }, idMappa: [id], idSorgente: id, salvato: true }, { salva });
  }

  function creaGeoJson(nome, fc, url, salva, idSalvato) {
    const { fc: dati, filtrato } = filtraSuConfine(fc, anelli());
    if (filtrato && !dati.features.length) throw new Error(tr('err.nessunaFeaturePalermo'));
    if (salva && filtrato) {
      const fuori = fc.features.length - dati.features.length;
      if (fuori === 1) notifica(tr('rndt.fuori.uno', { nome, n: fc.features.length }));
      else if (fuori > 1) notifica(tr('rndt.fuori.altri', { nome, fuori, n: fc.features.length }));
    }
    const testo = url ? '' : JSON.stringify(dati);
    const id = idSalvato ?? `${prefisso}-${hash(url ? `geojson|${url}` : `geojson|${nome}|${testo}`)}`;
    if (layers.has(id)) { togliDallaMappa(layers.get(id)); layers.delete(id); }
    const colore = COLORI[parseInt(hash(nome), 36) % COLORI.length];
    map.addSource(id, { type: 'geojson', data: dati });
    const strati = [
      { id: `${id}-fill`, type: 'fill', source: id, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': colore, 'fill-opacity': 0.3 } },
      { id: `${id}-line`, type: 'line', source: id, filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': colore, 'line-width': 2 } },
      { id: `${id}-pt`, type: 'circle', source: id, filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': colore, 'circle-radius': 5, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } },
    ];
    for (const s of strati) map.addLayer(s);
    const rec = { id, tipo: 'geojson', nome, visibile: true, sorgente: url ? { url } : {}, idMappa: strati.map(s => s.id), idSorgente: id, salvato: Boolean(url) };
    if (url) return registra(rec, { salva });
    // senza URL: i dati si salvano a parte, dopo che il layer è in mappa
    rec.sorgente = { dati: true };
    if (!salva) rec.salvato = true; // ripristino: i dati vengono dall'archivio
    else if (testo.length > TETTO_DATI) notifica(tr('rndt.troppoGrande', { nome }));
    else inAttesa(salvaDati(rec, dati));
    return registra(rec, { salva: false });
  }

  // Scrive i dati, poi mette il layer nell'elenco salvato: un layer non entra mai nell'elenco senza i suoi dati
  async function salvaDati(rec, fc) {
    const nonSalvato = () => notifica(tr('rndt.salvataggio.nome', { nome: rec.nome }));
    try {
      if (!archivioDati) throw new Error(tr('err.archivio'));
      await archivioDati.scrivi(rec.id, fc);
    } catch {
      return nonSalvato();
    }
    const togli = () => archivioDati.elimina(rec.id).catch(() => {});
    if (layers.get(rec.id) !== rec) {
      // rimosso nel frattempo: si puliscono i dati solo se nessun altro layer li usa (lo stesso file ricaricato ha lo stesso id)
      if (!layers.has(rec.id)) togli();
      return;
    }
    const nuovo = salvaAggiungi(stato, daSalvare(rec));
    if (!scrivi(nuovo)) { nonSalvato(); return togli(); }
    stato = nuovo;
    rec.salvato = true;
    cambio();
  }

  async function fetchArrayBuffer(url) {
    if (GET_FEATURE.test(url) && !SOLO_CONTEGGIO.test(url) && !CON_AREA.test(url)) {
      throw new Error('download limitato a Palermo: attiva «Only features in the current map view»');
    }
    const auth = autorizzazione(url);
    const daScaricare = urlProxy(proxy, riscrivi(url)); // il token (se c'è) viaggia solo nella richiesta: l'URL del layer resta senza
    const risposta = await (auth ? fetchFn(daScaricare, { headers: { authorization: auth } }) : fetchFn(daScaricare));
    if (risposta.status === 401) throw new Error(tr('err.richiedePassword'));
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
    notifica(tr('rndt.erroriLayer', { etichetta, nome: rec.nome }));
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
    // File dal computer: mai l'URL di un download recente del catalogo
    addFileLayer: (nome, fc) => creaGeoJson(nome, fc, null, true),
    // WFS da un servizio dell'utente: `richiesta` è il GetFeature già completo (con bbox di Palermo). Si salva con l'URL.
    async addWfsLayer(nome, richiesta) {
      const id = `${prefisso}-${hash(`geojson|${richiesta}`)}`;
      liberaSeNonDisponibile(id);
      if (layers.has(id)) return id;
      let fc;
      try { fc = JSON.parse(new TextDecoder().decode(await fetchArrayBuffer(richiesta))); } catch (errore) {
        if (errore instanceof SyntaxError) throw new Error(tr('err.noGeojson'));
        throw errore;
      }
      if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) throw new Error(tr('err.noGeojson'));
      if (fc.exceededTransferLimit) throw new Error(tr('err.troncato'));
      if (fc.features.length > TETTO_WFS) throw new Error(tr('err.piuDi', { n: TETTO_WFS }));
      if (!fc.features.length) throw new Error(tr('err.nessunElementoPalermo'));
      return creaGeoJson(nome, fc, richiesta, true);
    },
    attendi: async () => { while (scritture.size) await Promise.allSettled([...scritture]); },
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

    elenco: () => [...layers.values()].map(({ id, tipo, nome, visibile, indisponibile, errore, salvato, sorgente, idMappa }) => ({
      id, tipo, nome, visibile, indisponibile: Boolean(indisponibile), errore: Boolean(errore), salvato, sorgente, idMappa: [...(idMappa ?? [])],
    })),
    mostra: impostaVisibilita,
    elimina(id) {
      const rec = layers.get(id);
      if (!rec) return;
      togliDallaMappa(rec);
      layers.delete(id);
      if (rec.tipo === 'geojson') archivioDati?.elimina(id).catch(() => {});
      stato = salvaRimuovi(stato, id);
      persisti();
      cambio();
    },
    async ripristina() {
      for (const salvato of stato.layers) {
        try {
          let id;
          const urlSalvato = salvato.sorgente?.url;
          if (urlSalvato && protetto(urlSalvato)) throw new Error('servono utente e password');
          if (salvato.tipo === 'wms') id = creaWms(salvato.nome, salvato.sorgente, false);
          else if (salvato.tipo === 'tile') id = creaTile(salvato.nome, salvato.sorgente.url, { attribution: salvato.sorgente.attribution }, false);
          else if (salvato.sorgente.dati === true) {
            const fc = await archivioDati?.leggi(salvato.id);
            if (!fc) throw new Error(tr('err.datiNonTrovati'));
            id = creaGeoJson(salvato.nome, fc, undefined, false, salvato.id);
          } else if (salvato.sorgente.dati) {
            // vecchio formato: i dati stavano nell'elenco in localStorage; passano all'archivio dati
            id = creaGeoJson(salvato.nome, salvato.sorgente.dati, undefined, false, salvato.id);
            try {
              await archivioDati.scrivi(id, salvato.sorgente.dati);
              stato = salvaAggiorna(stato, id, { sorgente: { dati: true } });
              persisti();
            } catch { /* resta nel vecchio formato: si riprova al prossimo avvio */ }
          }
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

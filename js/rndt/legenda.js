import { urlQuery } from '../aggiungi/arcgis.js';
// Legende dei layer caricati da servizi esterni (RNDT e «miei layer»): moduli puri, senza DOM né rete.
// WMS: richiesta GetLegendGraphic, una immagine per layer. ArcGIS MapServer: endpoint /legend (classi con il loro simbolo).
// Dati vettoriali dell'utente (file, WFS): un quadratino del colore con cui il layer è disegnato. WMTS e XYZ non hanno legenda.

// [{ nome, url }]: una GetLegendGraphic per ogni layer del WMS (la mappa li chiede insieme, la legenda uno per volta)
export function richiesteLegendaWms(sorgente) {
  const nomi = String(sorgente?.layers ?? '').split(',').map(n => n.trim()).filter(Boolean);
  return nomi.map(nome => {
    const q = new URL(sorgente.url);
    for (const k of [...q.searchParams.keys()]) if (/^(service|request|version|layers?|styles|format|transparent|width|height|crs|srs|bbox|sld_version)$/i.test(k)) q.searchParams.delete(k);
    for (const [k, v] of [['SERVICE', 'WMS'], ['REQUEST', 'GetLegendGraphic'], ['VERSION', sorgente.version || '1.3.0'], ['FORMAT', 'image/png'], ['LAYER', nome], ['SLD_VERSION', '1.1.0']]) q.searchParams.set(k, v);
    return { nome, url: q.toString() };
  });
}

// Dall'URL di un layer ArcGIS aggiunto come immagine o come cache a tile: { url, idLayer } della legenda, null se non è un MapServer.
// `idLayer` è null per una cache (mostra tutto il servizio).
export function richiestaLegendaArcgis(urlTile) {
  const m = String(urlTile ?? '').match(/^(https?:\/\/[^?#]*\/MapServer)\/(export|tile)\b([^#]*)/i);
  if (!m) return null;
  const show = /[?&]layers=([^&]*)/i.exec(m[3]);
  const id = show ? /show(?::|%3A)(\d+)/i.exec(decodeURIComponent(show[1]).replace(/^show:/i, 'show:'))?.[1] : null;
  return { url: `${m[1]}/legend?f=json`, idLayer: id == null ? null : Number(id) };
}

// Query di un punto su un layer ArcGIS aggiunto come immagine: l'URL di export dice servizio e layer; il riquadro attorno al punto è di ±4 pixel.
// null se non è un MapServer con un layer solo (una cache a tile non dice quale layer interrogare).
export function urlQueryArcgisPunto(urlTile, [lng, lat], zoom) {
  const m = String(urlTile ?? '').match(/^(https?:\/\/[^?#]*\/MapServer)\/export\b/i);
  const r = richiestaLegendaArcgis(urlTile);
  if (!m || r?.idLayer == null) return null;
  const d = (360 / 256 / 2 ** zoom) * 4;
  return urlQuery(m[1], r.idLayer, [lng - d, lat - d, lng + d, lat + d], 5);
}

// Risposta di /legend → [{ gruppo, etichetta, src }]; `gruppo` (nome del layer ArcGIS) serve solo quando le classi sono di più layer.
export function vociLegendaArcgis(json, idLayer) {
  const voci = [];
  for (const l of json?.layers ?? []) {
    if (idLayer != null && l.layerId !== idLayer) continue;
    for (const c of l.legend ?? []) {
      if (!c.imageData) continue;
      voci.push({ gruppo: l.layerName, etichetta: c.label || '', src: `data:${c.contentType || 'image/png'};base64,${c.imageData}` });
    }
  }
  return voci;
}

// Tipo di un'immagine dai primi byte (PNG, JPEG, GIF): una risposta XML d'errore con stato 200 non lo è
export function tipoImmagine(buffer) {
  const b = new Uint8Array(buffer.slice(0, 4));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  return null;
}

// Quali layer hanno una legenda e di che tipo: 'wms', 'arcgis', 'vettoriale' oppure null
export function tipoLegenda(layer) {
  if (layer.tipo === 'wms') return 'wms';
  if (layer.tipo === 'tile') return richiestaLegendaArcgis(layer.sorgente?.url) ? 'arcgis' : null;
  if (layer.tipo === 'geojson' && layer.colore) return 'vettoriale';
  return null;
}

// Il servizio e il server da cui arriva un layer: { servizio: 'WMS' | 'ArcGIS' | 'WFS' | 'GeoJSON' | null, server }. Un file caricato dal computer
// non ha né l'uno né l'altro (servizio null, server '').
export function origineLayer(layer) {
  const url = String(layer.sorgente?.url ?? '');
  let server = '';
  try { server = new URL(url).host; } catch { /* nessun indirizzo: file dal computer */ }
  if (layer.tipo === 'wms') return { servizio: 'WMS', server };
  if (!server) return { servizio: null, server };
  if (/\/(MapServer|FeatureServer)\b/i.test(url)) return { servizio: 'ArcGIS', server };
  if (/service=wfs/i.test(url)) return { servizio: 'WFS', server };
  return { servizio: 'GeoJSON', server };
}

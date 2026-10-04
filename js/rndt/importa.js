// js/rndt/importa.js
// Dai file GIS dell'utente a una FeatureCollection WGS84. Il modulo non tocca DOM né librerie: KML, GPX, KMZ e Shapefile
// arrivano da `lib` (vedi librerie.js), così si prova in Node. Il tipo di file si decide dall'estensione.

export const ESTENSIONI = ['.geojson', '.json', '.kml', '.kmz', '.gpx', '.zip', '.csv'];

const estensione = nome => (nome.match(/\.[^./\\]+$/)?.[0] ?? '').toLowerCase();
export const nomeLayer = nome => nome.replace(/\.[^./\\]+$/, '');

const GEOMETRIE = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
const CRS_WGS84 = /(CRS84|4326)$/i;

function daGeoJson(o) {
  const crs = o?.crs?.properties?.name;
  if (typeof crs === 'string' && !CRS_WGS84.test(crs)) throw new Error(`il file usa il sistema di coordinate ${crs}, non WGS84`);
  if (o?.type === 'FeatureCollection' && Array.isArray(o.features)) return o;
  if (o?.type === 'Feature') return { type: 'FeatureCollection', features: [o] };
  if (GEOMETRIE.includes(o?.type)) return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: o }] };
  throw new Error('non è un GeoJSON valido');
}

// Il primo punto trovato basta per capire se le coordinate sono gradi o metri
const primaPosizione = c => {
  if (!Array.isArray(c)) return null;
  if (typeof c[0] === 'number') return c;
  for (const x of c) { const p = primaPosizione(x); if (p) return p; }
  return null;
};
const primoPunto = g => (!g ? null : g.type === 'GeometryCollection' ? g.geometries.map(primoPunto).find(Boolean) ?? null : primaPosizione(g.coordinates));

function controllaGradi(fc) {
  for (const f of fc.features) {
    const p = primoPunto(f.geometry);
    if (!p) continue;
    if (Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) {
      throw new Error('le coordinate non sono in gradi (longitudine e latitudine WGS84); se è uno shapefile manca il .prj');
    }
    return;
  }
}

function righeCsv(testo) {
  const t = testo.replace(/^﻿/, '');
  const prima = t.split(/\r?\n/, 1)[0];
  const conta = c => prima.split(c).length - 1;
  const sep = [';', '\t'].reduce((m, c) => (conta(c) > conta(m) ? c : m), ',');
  const righe = [];
  let riga = [];
  let campo = '';
  let tra = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (tra) {
      if (c !== '"') campo += c;
      else if (t[i + 1] === '"') { campo += '"'; i++; } else tra = false;
    } else if (c === '"') tra = true;
    else if (c === sep) { riga.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      riga.push(campo); campo = ''; righe.push(riga); riga = [];
    } else campo += c;
  }
  if (campo !== '' || riga.length) { riga.push(campo); righe.push(riga); }
  return righe.filter(r => r.some(x => x.trim() !== ''));
}

const NOMI_LAT = ['lat', 'latitude', 'latitudine', 'y'];
const NOMI_LON = ['lon', 'lng', 'long', 'longitude', 'longitudine', 'x'];

function daCsv(testo) {
  const [intestazione, ...righe] = righeCsv(testo);
  if (!intestazione) throw new Error('il file è vuoto');
  const nomi = intestazione.map(n => n.trim());
  const cerca = elenco => nomi.findIndex(n => elenco.includes(n.toLowerCase()));
  const iLat = cerca(NOMI_LAT);
  const iLon = cerca(NOMI_LON);
  if (iLat < 0 || iLon < 0) throw new Error('nessuna colonna di latitudine e longitudine (per esempio lat e lon)');
  const numero = v => (String(v ?? '').trim() === '' ? NaN : Number(String(v).trim().replace(',', '.')));
  const features = [];
  let saltate = 0;
  for (const r of righe) {
    const lat = numero(r[iLat]);
    const lon = numero(r[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { saltate++; continue; }
    const properties = {};
    nomi.forEach((n, i) => { if (n && i !== iLat && i !== iLon) properties[n] = r[i] ?? ''; });
    features.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lon, lat] } });
  }
  if (!features.length) throw new Error('nessuna riga con coordinate valide');
  return { fc: { type: 'FeatureCollection', features }, saltate };
}

const unisci = r => (Array.isArray(r) ? { type: 'FeatureCollection', features: r.flatMap(x => x.features) } : r);

export async function importaFile(file, lib) {
  const ext = estensione(file.name);
  const avvisi = [];
  let fc;
  if (ext === '.geojson' || ext === '.json') {
    let o;
    try { o = JSON.parse((await file.text()).replace(/^﻿/, '')); } catch { throw new Error('il file non è un JSON valido'); }
    fc = daGeoJson(o);
  } else if (ext === '.csv') {
    const r = daCsv(await file.text());
    fc = r.fc;
    if (r.saltate) avvisi.push(`${r.saltate} righe senza coordinate valide sono state saltate`);
  } else if (ext === '.kml') fc = await lib.kml(await file.text());
  else if (ext === '.gpx') fc = await lib.gpx(await file.text());
  else if (ext === '.kmz') fc = await lib.kml(await lib.kmz(await file.arrayBuffer()));
  else if (ext === '.zip') fc = unisci(await lib.shp(await file.arrayBuffer()));
  else throw new Error(`formato ${ext || 'senza estensione'} non supportato (accettati: ${ESTENSIONI.join(', ')})`);
  if (!fc?.features?.length) throw new Error('il file non contiene elementi');
  controllaGradi(fc);
  return { nome: nomeLayer(file.name), fc, avvisi };
}

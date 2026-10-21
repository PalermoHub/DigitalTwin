// Simulazione dei mezzi dagli orari programmati (GTFS): nessun DOM, nessuna mappa. Un mezzo si muove a velocità uniforme sul tracciato
// tra due fermate consecutive della sua corsa. Le posizioni sono teoriche (niente ritardi né traffico).
// Gli orari sono minuti dalla mezzanotte del giorno di servizio: oltre 1440 sono corse dopo la mezzanotte.

const M_LAT = 110540;
const M_LNG = 111320;

function giornoPrima(data) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const serviziDelGiorno = new WeakMap(); // servizi -> { data, attivi }: l'insieme si ricalcola solo quando cambia il giorno
function serviziAl(servizi, data) {
  let c = serviziDelGiorno.get(servizi);
  if (c?.data !== data) {
    const attivi = g => new Set(Object.entries(servizi).filter(([, date]) => date.includes(g)).map(([i]) => Number(i)));
    c = { data, oggi: attivi(data), ieri: attivi(giornoPrima(data)) };
    serviziDelGiorno.set(servizi, c);
  }
  return c;
}

// Corse in viaggio al minuto `minuto` del giorno `data`: `m` è il minuto sul giorno di servizio della corsa (+1440 per quelle di ieri).
export function corseAttive({ servizi, corse }, data, minuto) {
  const { oggi, ieri } = serviziAl(servizi, data);
  const attive = [];
  for (const corsa of corse) {
    const prima = corsa.t[0], dopo = corsa.t[corsa.t.length - 1];
    if (oggi.has(corsa.s) && minuto >= prima && minuto <= dopo) attive.push({ corsa, m: minuto });
    else if (ieri.has(corsa.s) && minuto + 1440 >= prima && minuto + 1440 <= dopo) attive.push({ corsa, m: minuto + 1440 });
  }
  return attive;
}

// Tracciati con le distanze cumulate (m) di ogni vertice, per rotta e direzione.
export function preparaRotte(features) {
  const rotte = new Map();
  for (const f of features) {
    const c = f.geometry.coordinates;
    const k = Math.cos(c[0][1] * Math.PI / 180);
    const cum = [0];
    for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + Math.hypot((c[i][0] - c[i - 1][0]) * k * M_LNG, (c[i][1] - c[i - 1][1]) * M_LAT));
    rotte.set(`${f.properties.route_id}|${f.properties.direzione}`, { coord: c, cum, k, proprieta: f.properties, stazioni: new Map() });
  }
  return rotte;
}

// Distanza (m) lungo il tracciato del punto più vicino alla stazione, cercando dal segmento `da` in poi (le stazioni sono in ordine di marcia).
function distanzaSulTracciato(r, punto, da) {
  let migliore = { d2: Infinity, segmento: da, lungo: r.cum[da] };
  for (let i = da; i < r.coord.length - 1; i++) {
    const ax = r.coord[i][0] * r.k * M_LNG, ay = r.coord[i][1] * M_LAT;
    const bx = r.coord[i + 1][0] * r.k * M_LNG, by = r.coord[i + 1][1] * M_LAT;
    const px = punto[0] * r.k * M_LNG, py = punto[1] * M_LAT;
    const lun2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const u = lun2 ? Math.min(1, Math.max(0, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lun2)) : 0;
    const d2 = (px - ax - u * (bx - ax)) ** 2 + (py - ay - u * (by - ay)) ** 2;
    if (d2 < migliore.d2) migliore = { d2, segmento: i, lungo: r.cum[i] + u * Math.sqrt(lun2) };
  }
  return migliore;
}

// Distanze lungo il tracciato di tutte le stazioni di una corsa (in memoria per sequenza).
function distanzeCorsa(r, corsa, stazioni) {
  const chiave = corsa.f.join();
  let d = r.stazioni.get(chiave);
  if (!d) {
    d = [];
    let segmento = 0;
    for (const id of corsa.f) {
      const m = distanzaSulTracciato(r, stazioni.get(id), segmento);
      segmento = m.segmento;
      d.push(Math.max(m.lungo, d[d.length - 1] ?? 0));
    }
    r.stazioni.set(chiave, d);
  }
  return d;
}

function puntoAllaDistanza(r, lungo) {
  let i = 0;
  while (i < r.coord.length - 2 && r.cum[i + 1] < lungo) i++;
  const a = r.coord[i], b = r.coord[i + 1];
  const u = r.cum[i + 1] > r.cum[i] ? Math.min(1, Math.max(0, (lungo - r.cum[i]) / (r.cum[i + 1] - r.cum[i]))) : 0;
  return { lng: a[0] + u * (b[0] - a[0]), lat: a[1] + u * (b[1] - a[1]), bearing: direzione(a, b, r.k), segmento: i };
}

function direzione(a, b, k) {
  return (Math.atan2((b[0] - a[0]) * k, b[1] - a[1]) * 180 / Math.PI + 360) % 360;
}

// Posizione della corsa al minuto `m` (del suo giorno di servizio): { lng, lat, bearing, verso } con `verso` = prossima fermata.
export function posizioneCorsa(corsa, m, rotte, stazioni) {
  const t = corsa.t;
  let i = 0;
  while (i < t.length - 2 && t[i + 1] < m) i++;
  const u = t[i + 1] > t[i] ? Math.min(1, Math.max(0, (m - t[i]) / (t[i + 1] - t[i]))) : 0;
  const r = rotte.get(`${corsa.r}|${corsa.d}`);
  const verso = corsa.f[i + 1];
  if (r) {
    const d = distanzeCorsa(r, corsa, stazioni);
    const lungo = d[i] + u * (d[i + 1] - d[i]);
    return { ...puntoAllaDistanza(r, lungo), verso, lungo };
  }
  const a = stazioni.get(corsa.f[i]), b = stazioni.get(verso);
  return { lng: a[0] + u * (b[0] - a[0]), lat: a[1] + u * (b[1] - a[1]), bearing: direzione(a, b, Math.cos(a[1] * Math.PI / 180)), verso };
}

// Le feature (punti) dei mezzi in viaggio al minuto `minuto` del giorno `data`; `m` può avere i decimali (animazione fluida).
// `tipi`: solo i mezzi di quei tipi di linea (ferrovia, bus, tram); le corse senza tracciato si saltano.
export function mezziAl(dati, features, stazioni, data, minuto, rotte = preparaRotte(features), tipi = null) {
  const mezzi = [];
  for (const { corsa, m } of corseAttive(dati, data, minuto)) {
    const r = rotte.get(`${corsa.r}|${corsa.d}`);
    if (!r || (tipi && !tipi.has(r.proprieta.tipo)) || corsa.f.some(f => !stazioni.has(f))) continue;
    const p = posizioneCorsa(corsa, m, rotte, stazioni);
    mezzi.push({
      type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { colore: r.proprieta.colore ?? '#555555', numero: r.proprieta.numero ?? '', tipo: r.proprieta.tipo, bearing: Math.round(p.bearing), verso: p.verso, rotta: corsa.r, direzione: corsa.d, lungo: Math.round(p.lungo) },
    });
  }
  return mezzi;
}

// Dimensioni reali (m) del mezzo: lunghezza, larghezza, altezza; e lunghezza massima disegnata (un treno 20 volte più lungo uscirebbe dai binari in curva).
export const DIMENSIONI = { ferrovia: [70, 3.2, 4.5], tram: [30, 2.6, 3.6], bus: [12, 2.6, 3.2] };
const LUNGHEZZA_MAX = { ferrovia: 70, tram: 45, bus: 24 };

// Rettangolo orientato come il mezzo, centrato sul punto (per i mezzi senza tracciato).
export function scatola([lng, lat], bearing, lunghezza, larghezza) {
  const k = Math.cos(lat * Math.PI / 180), b = bearing * Math.PI / 180;
  const avanti = [Math.sin(b), Math.cos(b)], lato = [Math.cos(b), -Math.sin(b)];
  const punto = (a, l) => [lng + (avanti[0] * a + lato[0] * l) / (M_LNG * k), lat + (avanti[1] * a + lato[1] * l) / M_LAT];
  const a = lunghezza / 2, l = larghezza / 2;
  return [[punto(a, l), punto(a, -l), punto(-a, -l), punto(-a, l), punto(a, l)]];
}

// Sagoma che segue il tracciato: da `lungo - lunghezza/2` a `lungo + lunghezza/2` (m dall'inizio), larga `larghezza`, con un punto a ogni vertice
// del tracciato: in curva il mezzo si piega con il binario o la strada invece di uscirne.
export function nastro(r, lungo, lunghezza, larghezza) {
  const da = Math.max(0, lungo - lunghezza / 2), a = Math.min(r.cum[r.cum.length - 1], lungo + lunghezza / 2);
  const distanze = [da, ...r.cum.filter(c => c > da && c < a), a];
  const sinistra = [], destra = [];
  for (const d of distanze) {
    const p = puntoAllaDistanza(r, d);
    const b = p.bearing * Math.PI / 180, k = Math.cos(p.lat * Math.PI / 180);
    const dx = Math.cos(b) * larghezza / 2 / (M_LNG * k), dy = -Math.sin(b) * larghezza / 2 / M_LAT;
    sinistra.push([p.lng + dx, p.lat + dy]);
    destra.push([p.lng - dx, p.lat - dy]);
  }
  const anello = [...sinistra, ...destra.reverse()];
  return [[...anello, anello[0]]];
}

// Volumi (poligoni da estrudere) dei mezzi: stesso colore e stesse proprietà del punto, con l'altezza in `altezza`.
// `fattore` ingrandisce larghezza e altezza (fino a 6×); la lunghezza non supera quella reale.
export function volumi(mezzi, fattore = 1, rotte = new Map()) {
  return mezzi.map(f => {
    const tipo = DIMENSIONI[f.properties.tipo] ? f.properties.tipo : 'bus';
    const [lun, lar, alt] = DIMENSIONI[tipo];
    const lunghezza = Math.min(lun * fattore, LUNGHEZZA_MAX[tipo]);
    const larghezza = lar * Math.min(fattore, 6);
    const r = rotte.get(`${f.properties.rotta}|${f.properties.direzione}`);
    const anello = r && f.properties.lungo != null ? nastro(r, f.properties.lungo, lunghezza, larghezza)
      : scatola(f.geometry.coordinates, f.properties.bearing, lunghezza, larghezza);
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: anello }, properties: { ...f.properties, altezza: alt * Math.min(fattore, 6) } };
  });
}

// Fattore di ingrandimento in funzione dello zoom: almeno 2 (tra gli edifici 3D un autobus in scala reale sparisce), fino a `max` da lontano.
export const fattoreZoom = (zoom, max = 20) => Math.min(max, Math.max(2, 2 ** (17 - zoom)));

export const geojsonMezzi = features => ({ type: 'FeatureCollection', features });

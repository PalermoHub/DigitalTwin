import * as sat from '../vendor/satellite.js';

// Calcoli orbitali dei satelliti (SGP4) attorno a Palermo: nessuna rete, solo funzioni pure sugli elementi di CelesTrak (/satelliti).
export const OSSERVATORE = { longitude: sat.degreesToRadians(13.33225), latitude: sat.degreesToRadians(38.14074), height: 0.05 }; // il centro della mappa (core/config.js CENTRO; qui copiato perché config.js legge `window`); altezza in km
export const ELEVAZIONE_MINIMA = 10; // gradi: sotto questa altezza sull'orizzonte il passaggio non conta (case, colline)
export const ELEMENTI_VECCHI_GIORNI = 14; // oltre, l'orbita calcolata si allontana dalla realtà

// Elementi della fonte → satelliti pronti al calcolo; chi ha elementi che SGP4 rifiuta viene scartato
export function creaSatelliti(elenco) {
  const out = [];
  for (const o of elenco ?? []) {
    try {
      const satrec = sat.json2satrec(o);
      if (satrec.error) continue;
      out.push({ id: o.NORAD_CAT_ID, nome: o.OBJECT_NAME, gruppo: o.gruppo ?? '', designazione: o.OBJECT_ID, epoca: Date.parse(`${o.EPOCH}Z`), satrec });
    } catch { /* elementi rotti: il satellite non si disegna */ }
  }
  return out;
}

// Dove si trova il satellite (punto sotto di lui) e quanto è alto; null se il calcolo fallisce (orbita decaduta o elementi troppo vecchi)
export function posizione(s, data) {
  const pv = sat.propagate(s.satrec, data);
  if (!pv?.position || !pv.velocity) return null;
  const g = sat.eciToGeodetic(pv.position, sat.gstime(data));
  const v = pv.velocity;
  return { lng: sat.degreesLong(g.longitude), lat: sat.degreesLat(g.latitude), quotaKm: g.height, velocitaKmS: Math.hypot(v.x, v.y, v.z), eci: pv.position };
}

// Come lo vede un osservatore a Palermo: elevazione e azimut in gradi (azimut da nord, in senso orario) e distanza in km
export function daPalermo(s, data, osservatore = OSSERVATORE) {
  const pv = sat.propagate(s.satrec, data);
  if (!pv?.position) return null;
  const a = sat.ecfToLookAngles(osservatore, sat.eciToEcf(pv.position, sat.gstime(data)));
  return { elevazione: sat.radiansToDegrees(a.elevation), azimut: sat.radiansToDegrees(a.azimuth), distanzaKm: a.rangeSat };
}

// Traccia a terra da `minutiPrima` a `minutiDopo`; si spezza dove attraversa l'antimeridiano (±180°), altrimenti la linea taglierebbe tutta la mappa
export function traccia(s, data, minutiPrima = 45, minutiDopo = 45, passoSecondi = 30) {
  const linee = [];
  let corrente = [];
  let prima = null;
  for (let t = -minutiPrima * 60; t <= minutiDopo * 60; t += passoSecondi) {
    const p = posizione(s, new Date(data.getTime() + t * 1000));
    if (!p) { if (corrente.length > 1) linee.push(corrente); corrente = []; prima = null; continue; }
    if (prima != null && Math.abs(p.lng - prima) > 180) { if (corrente.length > 1) linee.push(corrente); corrente = []; }
    corrente.push([p.lng, p.lat]);
    prima = p.lng;
  }
  if (corrente.length > 1) linee.push(corrente);
  return linee;
}

// Primo passaggio visibile da Palermo (elevazione ≥ ELEVAZIONE_MINIMA) nelle prossime `ore`: inizio, culmine, fine; null se non ce n'è.
// Se il satellite è già sopra l'orizzonte, `inizio` è `data` e `in_corso` è vero.
export function prossimoPassaggio(s, data, ore = 24, passoSecondi = 20) {
  let inizio = null, culmine = null, max = -90;
  for (let t = 0; t <= ore * 3600; t += passoSecondi) {
    const quando = new Date(data.getTime() + t * 1000);
    const v = daPalermo(s, quando);
    const su = v && v.elevazione >= ELEVAZIONE_MINIMA;
    if (su) {
      if (!inizio) inizio = { quando, in_corso: t === 0 };
      if (v.elevazione > max) { max = v.elevazione; culmine = quando; }
    } else if (inizio) {
      return { inizio: inizio.quando, culmine, fine: quando, elevazioneMax: max, in_corso: inizio.in_corso };
    }
  }
  return inizio ? { inizio: inizio.quando, culmine, fine: null, elevazioneMax: max, in_corso: inizio.in_corso } : null;
}

// Elementi più vecchi di ELEMENTI_VECCHI_GIORNI: la posizione è meno affidabile
export const elementiVecchi = (s, data) => data.getTime() - s.epoca > ELEMENTI_VECCHI_GIORNI * 86400000;

// Punto cardinale da un azimut in gradi (N, NE, E…)
export const puntoCardinale = az => ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round((((az % 360) + 360) % 360) / 45) % 8];

// ---- Il cielo di Palermo come un radar sulla mappa
// La mappa è limitata attorno a Palermo e il punto a terra di un satellite è quasi sempre fuori: si disegna invece dove lo si vede nel cielo.
// Centro = Palermo, orizzonte = cerchio di raggio RAGGIO_CIELO_KM, zenit = centro; l'azimut è la direzione (nord in alto), l'elevazione la distanza dal bordo.
export const RAGGIO_CIELO_KM = 6; // il cerchio dell'orizzonte sta intero nella vista iniziale (zoom 12)
const KM_PER_GRADO = 111.32;
const CENTRO = [sat.degreesLong(OSSERVATORE.longitude), sat.degreesLat(OSSERVATORE.latitude)];
export const CENTRO_CIELO = CENTRO;

export function proiezioneCielo(azimut, elevazione, raggioKm = RAGGIO_CIELO_KM) {
  const d = raggioKm * (90 - Math.max(0, Math.min(90, elevazione))) / 90;
  const az = sat.degreesToRadians(azimut);
  return [CENTRO[0] + (d * Math.sin(az)) / (KM_PER_GRADO * Math.cos(sat.degreesToRadians(CENTRO[1]))), CENTRO[1] + (d * Math.cos(az)) / KM_PER_GRADO];
}

// L'arco di un passaggio nel cielo: punti ogni `passoSecondi` dall'inizio alla fine (elevazione ≥ 0, così l'arco arriva fino all'orizzonte)
export function arcoCielo(s, passaggio, passoSecondi = 15) {
  if (!passaggio?.fine) return [];
  const punti = [];
  const da = passaggio.inizio.getTime() - 120000, a = passaggio.fine.getTime() + 120000;
  for (let t = da; t <= a; t += passoSecondi * 1000) {
    const v = daPalermo(s, new Date(t));
    if (v && v.elevazione >= 0) punti.push(proiezioneCielo(v.azimut, v.elevazione));
  }
  return punti;
}

// Un passaggio spiegato a chi guarda il cielo: dove e quando sorge, culmina e tramonta (azimut in gradi, elevazione al culmine)
export function dettaglioPassaggio(s, passaggio) {
  if (!passaggio) return null;
  const punto = quando => {
    const v = quando && daPalermo(s, quando);
    return v ? { quando, azimut: v.azimut, elevazione: v.elevazione } : null;
  };
  const inizio = passaggio.in_corso ? null : punto(passaggio.inizio);
  const fine = punto(passaggio.fine);
  return {
    inCorso: !!passaggio.in_corso, inizio, culmine: punto(passaggio.culmine), fine,
    durataS: passaggio.fine ? Math.round((passaggio.fine - passaggio.inizio) / 1000) : null,
  };
}

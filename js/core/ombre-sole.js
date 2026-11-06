// Posizione del sole a Palermo e ora locale (Europe/Rome), senza librerie: algoritmo NOAA semplificato
// (errore sotto 0,1° nel secolo corrente, più che sufficiente per le ombre).
export const LAT = 38.1367;
export const LON = 13.348;

const RAD = Math.PI / 180;
export const ZH = 1 / Math.cos(38.137 * RAD); // metri Web Mercator per metro vero a Palermo
export const MAX_OMBRA_M = 600;               // lunghezza massima dell'ombra di un edificio (metri Web Mercator)

function ultimaDomenicaUTC(anno, mese /* da 0 */) {
  const d = new Date(Date.UTC(anno, mese + 1, 0, 1)); // ultimo giorno del mese, 01:00 UTC
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getTime();
}

// Scarto di Roma da UTC in minuti: +120 con l'ora legale (dall'ultima domenica di marzo a quella di ottobre, 01:00 UTC).
export function scartoRoma(utcMs) {
  const a = new Date(utcMs).getUTCFullYear();
  return utcMs >= ultimaDomenicaUTC(a, 2) && utcMs < ultimaDomenicaUTC(a, 9) ? 120 : 60;
}

// «2026-06-21» e minuti dalla mezzanotte locale -> Date.
export function localeInData(giorno, minuti) {
  const [a, m, g] = giorno.split('-').map(Number);
  const ingenua = Date.UTC(a, m - 1, g, 0, minuti);
  return new Date(ingenua - scartoRoma(ingenua - 60 * 60000) * 60000);
}

// Data -> { giorno: «AAAA-MM-GG», minuti } nell'ora di Roma.
export function dataInLocale(data) {
  const l = new Date(data.getTime() + scartoRoma(data.getTime()) * 60000);
  const p = n => String(n).padStart(2, '0');
  return { giorno: `${l.getUTCFullYear()}-${p(l.getUTCMonth() + 1)}-${p(l.getUTCDate())}`, minuti: l.getUTCHours() * 60 + l.getUTCMinutes() };
}

export const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// Azimut dal nord (orario) ed elevazione geometrica in gradi.
export function posizioneSole(data, lat = LAT, lon = LON) {
  const g = data.getTime() / 86400000 + 2440587.5 - 2451545.0; // giorni dal J2000
  const L = (280.460 + 0.9856474 * g) % 360;                    // longitudine media
  const M = (357.528 + 0.9856003 * g) * RAD;                    // anomalia media
  const lam = (L + 1.915 * Math.sin(M) + 0.020 * Math.sin(2 * M)) * RAD; // longitudine eclittica
  const eps = (23.439 - 0.0000004 * g) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = (280.46061837 + 360.98564736629 * g) % 360;
  const H = (gmst + lon - ra / RAD) * RAD;                      // angolo orario
  const phi = lat * RAD;
  const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) + Math.PI; // dal nord
  return { az: (az / RAD + 360) % 360, el: el / RAD };
}

// Orario con cui si aprono le ombre: adesso (tra le 5 e le 20, con il sole abbastanza alto da fare ombre leggibili), altrimenti mezzogiorno dello stesso giorno.
export const ORA_MIN = 5 * 60;  // le ombre si mostrano solo dalle 5 alle 20
export const ORA_MAX = 20 * 60;
export function orarioIniziale(adesso = new Date()) {
  const l = dataInLocale(adesso);
  const minuti = Math.round(l.minuti / 10) * 10;
  return minuti >= ORA_MIN && minuti <= ORA_MAX && posizioneSole(adesso).el > 5 ? { giorno: l.giorno, minuti } : { giorno: l.giorno, minuti: 12 * 60 };
}

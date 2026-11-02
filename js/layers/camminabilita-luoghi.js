// Confronto tra i luoghi che Walkably conta intorno a una cella e quelli che abbiamo già nei nostri layer.
// Walkably non dà le coordinate dei luoghi, solo conteggi entro 5 e 10 minuti e il nome del più vicino: qui si contano
// i nostri punti alla stessa distanza (minuti × 80 m, la velocità a piedi dichiarata da Walkably) e si calcola quanti restano fuori.
// Modulo puro (nessun accesso a mappa o DOM): il caricamento dei file passa da una funzione data da chi lo usa.
import { distanzaApprossimataM } from '../core/scheda-util.js';

export const M_PER_MINUTO = 80; // Walkably: «Walks are on the street network at 80 metres a minute»
export const raggioMinuti = minuti => minuti * M_PER_MINUTO;

const CULTURA = new Set(["Gallerie d'Arte e Musei", 'Teatri', 'Biblioteche', 'Zone Archeologiche']);

// Bisogni di Walkably (campo K) e da dove vengono i nostri punti. `bisogno` = i punti stanno nel file compatto di OpenStreetMap
// (scripts/luoghi_osm.py, stesse categorie di Walkably); `filtro` sceglie i punti di un GeoJSON nostro; `chiave(id)` = chiave della card
// del luogo nella scheda (serve per portarci l'utente).
export const SORGENTI = {
  0: [{ id: 'alimentari', file: 'camminabilita/luoghi_osm.json', bisogno: 0, chiave: id => `luogo-osm-${id}`, etichetta: 'Alimentari (OpenStreetMap)' }],
  1: [{ id: 'cibo', file: 'camminabilita/luoghi_osm.json', bisogno: 1, chiave: id => `luogo-osm-${id}`, etichetta: 'Cibo e bevande (OpenStreetMap)' }],
  2: [{ id: 'negozi', file: 'camminabilita/luoghi_osm.json', bisogno: 2, chiave: id => `luogo-osm-${id}`, etichetta: 'Negozi (OpenStreetMap)' }],
  3: [{ id: 'salute', file: 'camminabilita/luoghi_osm.json', bisogno: 3, chiave: id => `luogo-osm-${id}`, etichetta: 'Salute (OpenStreetMap)' }],
  4: [{ id: 'scuole', file: 'scuole/scuole.geojson', chiave: id => id, etichetta: 'Scuole' }],
  5: [{ id: 'parchi', file: 'camminabilita/luoghi_osm.json', bisogno: 5, chiave: id => `luogo-osm-${id}`, etichetta: 'Parchi e giardini (OpenStreetMap)' }],
  6: [{ id: 'cultura', file: 'monumenti/monumenti.geojson', chiave: id => `monumento-${id}`, etichetta: 'Musei, teatri, biblioteche e aree archeologiche', filtro: p => CULTURA.has(p.categoria) }],
  7: [{ id: 'fermate', file: 'trasporto/fermate.geojson', chiave: id => `fermata-${id}`, etichetta: 'Fermate' }],
};

// Percorso a piedi fino al luogo: il link https di Google Maps apre l'app sul telefono e il sito sul computer.
export const urlPercorso = (lon, lat) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;

// «Caffè "Mazzara", S.R.L.» → «caffe mazzara s r l»
export function normalizzaNome(s) {
  if (s == null) return '';
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Walkably scrive «an unnamed park» quando il luogo non ha nome: non è un nome da cercare tra i nostri punti.
export const nomeVero = nome => Boolean(nome) && !/^(an?|the)\s+unnamed\b/i.test(String(nome).trim());

// Stesso luogo: nomi uguali, o uno contenuto nell'altro se il più corto ha almeno 5 lettere (sotto, «Bar» starebbe in ogni bar).
export function nomiCoincidono(a, b) {
  const x = normalizzaNome(a);
  const y = normalizzaNome(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [corto, lungo] = x.length <= y.length ? [x, y] : [y, x];
  return corto.length >= 5 && lungo.includes(corto);
}

// Punti {lon, lat, nome, tipo} di un bisogno dal file compatto di OpenStreetMap ({bisogni: {k: [[lon, lat, nome, tipo], …]}}).
export const puntiDaBisogno = (dati, k) => (dati?.bisogni?.[k] ?? []).map(([lon, lat, nome, tipo], i) => ({ id: `osm-${k}-${i}`, lon, lat, nome, tipo }));

// Punti {lon, lat, nome, tipo} di un GeoJSON, con un filtro opzionale sulle proprietà.
export function puntiDaGeojson(geojson, filtro = null) {
  return (geojson?.features ?? [])
    .filter(f => f.geometry?.type === 'Point' && (!filtro || filtro(f.properties ?? {})))
    .map(f => ({ id: f.properties?.id, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], nome: f.properties?.nome ?? '', tipo: f.properties?.tipo ?? f.properties?.categoria ?? '' }));
}

// Punti entro `raggioM` metri da `centro` [lon, lat], dal più vicino, ciascuno con `distanzaM`.
export function luoghiVicini(punti, centro, raggioM) {
  return (punti ?? [])
    .map(p => ({ ...p, distanzaM: distanzaApprossimataM(centro, [p.lon, p.lat]) }))
    .filter(p => p.distanzaM <= raggioM)
    .sort((a, b) => a.distanzaM - b.distanzaM);
}

// Confronto per un bisogno. `b` = riga di tabellaBisogni (conteggi Walkably, nome del più vicino); `punti` = nostri punti per quel
// bisogno (null = nessun nostro layer). Residuo = quanti luoghi conta Walkably in più dei nostri, mai negativo; con il conteggio
// al tetto (oltre5 / oltre10) il vero numero può essere più alto: il residuo è un minimo e `almeno5` / `almeno10` lo dicono.
export function confrontaBisogno(b, punti, centro) {
  const nostri = punti ? luoghiVicini(punti, centro, raggioMinuti(10)) : null;
  const nostri5 = nostri ? nostri.filter(p => p.distanzaM <= raggioMinuti(5)).length : null;
  const nostri10 = nostri ? nostri.length : null;
  const residuo = (walkably, nostro) => (nostro == null ? null : Math.max(0, walkably - nostro));
  let piuVicino = null;
  if (nomeVero(b.nome)) piuVicino = { nome: b.nome, tipo: b.tipo ?? null, minuti: b.minuti ?? null, nostro: nostri ? nostri.some(p => nomiCoincidono(p.nome, b.nome)) : false };
  return {
    walkably5: b.entro5, walkably10: b.entro10, almeno5: b.oltre5, almeno10: b.oltre10,
    nostri5, nostri10,
    residuo5: residuo(b.entro5, nostri5), residuo10: residuo(b.entro10, nostri10),
    vicini: nostri, piuVicino,
  };
}

// Scarica (una volta sola) i nostri punti per bisogno. `leggi(file)` restituisce il GeoJSON; un file che manca lascia il bisogno senza nostri punti.
let cache = null;
export function caricaLuoghi(leggi) {
  cache ??= (async () => {
    const perFile = new Map();
    const file = f => perFile.get(f) ?? perFile.set(f, Promise.resolve(leggi(f)).catch(() => null)).get(f);
    const risultato = {};
    for (const [k, lista] of Object.entries(SORGENTI)) {
      const gruppi = await Promise.all(lista.map(async s => {
        const gj = await file(s.file);
        return gj ? (s.bisogno != null ? puntiDaBisogno(gj, s.bisogno) : puntiDaGeojson(gj, s.filtro)).map(p => ({ ...p, fonte: s.id, chiave: s.chiave?.(p.id) })) : null;
      }));
      risultato[k] = gruppi.every(g => g === null) ? null : gruppi.flat().filter(Boolean);
    }
    return risultato;
  })();
  return cache;
}
export const azzeraLuoghi = () => { cache = null; };

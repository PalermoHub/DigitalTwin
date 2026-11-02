// Confronto tra i luoghi che Walkably conta intorno a una cella e quelli che abbiamo già nei nostri layer.
// Walkably non dà le coordinate dei luoghi, solo conteggi entro 5 e 10 minuti e il nome del più vicino: qui si contano
// i nostri punti alla stessa distanza (minuti × 80 m, la velocità a piedi dichiarata da Walkably) e si calcola quanti restano fuori.
// Modulo puro (nessun accesso a mappa o DOM): il caricamento dei file passa da una funzione data da chi lo usa.
import { distanzaApprossimataM } from '../core/scheda-util.js';

export const M_PER_MINUTO = 80; // Walkably: «Walks are on the street network at 80 metres a minute»
export const raggioMinuti = minuti => minuti * M_PER_MINUTO;

const CULTURA = new Set(["Gallerie d'Arte e Musei", 'Teatri', 'Biblioteche', 'Zone Archeologiche']);

// Bisogni di Walkably (campo K) collegati a un nostro layer. `filtro` sceglie i punti del file che valgono per quel bisogno.
// Alimentari, cibo e bevande, negozi e salute non hanno ancora un layer nostro: nessun residuo da calcolare (vedi docs/CAMMINABILITA_LUOGHI.md, Fase 2).
export const SORGENTI = {
  4: [{ id: 'scuole', file: 'scuole/scuole.geojson', etichetta: 'Scuole' }],
  // parchi e giardini sempre da OpenStreetMap, come Walkably (scripts/parchi_osm.py)
  5: [{ id: 'parchi', file: 'camminabilita/parchi_osm.geojson', etichetta: 'Parchi e giardini (OpenStreetMap)' }],
  6: [{ id: 'cultura', file: 'monumenti/monumenti.geojson', etichetta: 'Musei, teatri, biblioteche e aree archeologiche', filtro: p => CULTURA.has(p.categoria) }],
  7: [{ id: 'fermate', file: 'trasporto/fermate.geojson', etichetta: 'Fermate' }],
};

// «Caffè "Mazzara", S.R.L.» → «caffe mazzara s r l»
export function normalizzaNome(s) {
  if (s == null) return '';
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Stesso luogo: nomi uguali, o uno contenuto nell'altro se il più corto ha almeno 5 lettere (sotto, «Bar» starebbe in ogni bar).
export function nomiCoincidono(a, b) {
  const x = normalizzaNome(a);
  const y = normalizzaNome(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [corto, lungo] = x.length <= y.length ? [x, y] : [y, x];
  return corto.length >= 5 && lungo.includes(corto);
}

// Punti {lon, lat, nome, tipo} di un GeoJSON, con un filtro opzionale sulle proprietà.
export function puntiDaGeojson(geojson, filtro = null) {
  return (geojson?.features ?? [])
    .filter(f => f.geometry?.type === 'Point' && (!filtro || filtro(f.properties ?? {})))
    .map(f => ({ lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], nome: f.properties?.nome ?? '', tipo: f.properties?.tipo ?? f.properties?.categoria ?? '' }));
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
  if (b.nome) piuVicino = { nome: b.nome, tipo: b.tipo ?? null, minuti: b.minuti ?? null, nostro: nostri ? nostri.some(p => nomiCoincidono(p.nome, b.nome)) : false };
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
        return gj ? puntiDaGeojson(gj, s.filtro).map(p => ({ ...p, fonte: s.id })) : null;
      }));
      risultato[k] = gruppi.every(g => g === null) ? null : gruppi.flat().filter(Boolean);
    }
    return risultato;
  })();
  return cache;
}
export const azzeraLuoghi = () => { cache = null; };

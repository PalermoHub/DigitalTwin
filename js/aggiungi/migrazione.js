// js/aggiungi/migrazione.js
// I file caricati dal computer stavano nel gruppo RNDT (dt:rndt:v1); ora sono di «I miei layer» (dt:miei:v1).
// Si sposta l'elenco; i dati restano in IndexedDB con lo stesso id. Si fa prima di creare gli host.
import { leggi, salva, CHIAVE, CHIAVE_MIEI } from '../rndt/archivio.js';

// un file dal computer è un GeoJSON senza URL: `dati: true` (archivio dati) o, nel vecchio formato, i dati dentro l'elenco
const eFile = l => l.tipo === 'geojson' && Boolean(l.sorgente?.dati);

// Quanti file ha spostato. Una scrittura che fallisce lascia tutto com'era: si riprova al prossimo avvio.
export function migraFileLocali(storage) {
  const rndt = leggi(storage, CHIAVE);
  const spostati = rndt.layers.filter(eFile);
  if (!spostati.length) return 0;
  const miei = leggi(storage, CHIAVE_MIEI);
  const nuovi = { ...miei, layers: [...miei.layers.filter(l => !spostati.some(f => f.id === l.id)), ...spostati] };
  if (!salva(storage, nuovi, CHIAVE_MIEI)) return 0;
  if (!salva(storage, { ...rndt, layers: rndt.layers.filter(l => !eFile(l)) }, CHIAVE)) {
    salva(storage, miei, CHIAVE_MIEI); // indietro: altrimenti il file starebbe in due elenchi
    return 0;
  }
  return spostati.length;
}

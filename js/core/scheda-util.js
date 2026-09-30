// Piccole utilità per i moduli che costruiscono le voci della scheda.

export const primo = (trovati, idLayer) => trovati.find(f => f.layer.id === idLayer) ?? null;

export const tutti = (trovati, idLayer) => trovati.filter(f => f.layer.id === idLayer);

// Il più vicino al punto cliccato tra i punti (geometria Point) di un layer.
export function piuVicino(trovati, idLayer, { lng, lat }) {
  const punti = tutti(trovati, idLayer);
  if (!punti.length) return null;
  const k = Math.cos(lat * Math.PI / 180);
  const d2 = f => ((f.geometry.coordinates[0] - lng) * k) ** 2 + (f.geometry.coordinates[1] - lat) ** 2;
  return punti.reduce((migliore, f) => (d2(f) < d2(migliore) ? f : migliore));
}

export const presente = v => v != null && v !== '' && v !== 'NULL';

// righe {etichetta, valore} solo per i valori presenti
export const righe = coppie =>
  coppie.filter(([, valore]) => presente(valore)).map(([etichetta, valore]) => ({ etichetta, valore: String(valore) }));

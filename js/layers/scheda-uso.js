// «Uso» dell'edificio nella scheda. Nell'edificato molti edifici hanno uso UNK (sconosciuto) anche quando sono
// monumenti, scuole o sedi di seggio: il dato dei nostri strati lo migliora, ma solo nella scheda.
// Si usa il meccanismo delle righe `ripiego` di scheda-modello: UNK pesa 4, un uso vero 0 (non si sostituisce).
const RIPIEGO_UNK = 4;
const USI = { monumento: ['Monumento', 1], scuola: ['Scuola o asilo', 2], seggio: ['Sede elettorale', 3] };

export function rigaUso(occupancy) {
  if (occupancy == null || occupancy === '') return null;
  return occupancy === 'UNK'
    ? { etichetta: 'Uso', valore: occupancy, ripiego: RIPIEGO_UNK }
    : { etichetta: 'Uso', valore: occupancy };
}

// Voce «edificio» da affiancare a quella dell'edificato quando il clic cade sul poligono di un monumento, di una scuola o di un seggio.
export function voceUsoEdificio(tipo) {
  const [valore, ripiego] = USI[tipo];
  return { chiave: 'edificio', peso: 30, titolo: 'Edificio', icona: 'fa-building', gruppi: [{ righe: [{ etichetta: 'Uso', valore, ripiego }] }] };
}

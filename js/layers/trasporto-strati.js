// Strati del pannello Layer per il trasporto pubblico, in due sezioni: RFI (stazioni e linea della ferrovia urbana, feed Trenitalia)
// e AMAT (bus, tram e fermate del feed del Comune). Modulo senza dipendenze dalla mappa: lo usano i test.
// RFI sta sopra AMAT, come sulla mappa (la ferrovia è disegnata sopra bus e tram) e le stazioni sopra la linea: il pannello
// elenca dall'alto verso il basso lo stesso ordine di disegno.
// Mezzi in movimento (simulazione dagli orari): un volume e il numero di linea per ogni mezzo in viaggio; `file` = corse in dati/trasporto/.
export const MEZZI = [
  { id: 'trasporto-mezzi-treni', tipo: 'ferrovia', etichetta: 'Treni in movimento (simulazione)', legenda: 'Treno in viaggio (da orario, non in tempo reale)', sezione: 'RFI', file: 'ferrovia-corse.json' },
  { id: 'trasporto-mezzi-tram', tipo: 'tram', etichetta: 'Tram in movimento (simulazione)', legenda: 'Tram in viaggio (da orario, non in tempo reale)', sezione: 'AMAT', file: 'corse.json' },
  { id: 'trasporto-mezzi-bus', tipo: 'bus', etichetta: 'Autobus in movimento (simulazione)', legenda: 'Autobus in viaggio (da orario, non in tempo reale)', sezione: 'AMAT', file: 'corse.json' },
];
const stratoMezzi = (m, suCambio) => ({ id: m.id, etichetta: m.etichetta, sezione: m.sezione, layers: [m.id, `${m.id}-nome`], attivo: false, suCambio });

export const creaStrati = suCambio => [
  stratoMezzi(MEZZI[0], suCambio),
  { id: 'trasporto-stazioni', etichetta: 'Stazioni metro', sezione: 'RFI', layers: ['trasporto-stazioni', 'trasporto-stazioni-punti'], attivo: false, suCambio },
  { id: 'trasporto-metro', etichetta: 'Linea metro', sezione: 'RFI', layers: ['trasporto-metro', 'trasporto-metro-tratti', 'trasporto-metro-apertura'], attivo: false, suCambio },
  stratoMezzi(MEZZI[1], suCambio),
  stratoMezzi(MEZZI[2], suCambio),
  { id: 'trasporto-bus', etichetta: 'Linee bus', sezione: 'AMAT', layers: ['trasporto-bus'], attivo: false, suCambio },
  { id: 'trasporto-tram', etichetta: 'Linee tram', sezione: 'AMAT', layers: ['trasporto-tram'], attivo: false, suCambio },
  { id: 'trasporto-fermate', etichetta: 'Fermate', sezione: 'AMAT', layers: ['trasporto-fermate'], attivo: false, suCambio },
];

// Strato delle linee di un tipo (bus, tram, ferrovia): serve alla ricerca, al filtro Linea e alle schede.
export const stratoLinea = tipo => (tipo === 'tram' ? 'trasporto-tram' : tipo === 'ferrovia' ? 'trasporto-metro' : 'trasporto-bus');

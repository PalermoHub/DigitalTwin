// Strati del pannello Layer per il trasporto pubblico, in due sezioni: RFI (stazioni e linea della ferrovia urbana, feed Trenitalia)
// e AMAT (bus, tram e fermate del feed del Comune). Modulo senza dipendenze dalla mappa: lo usano i test.
// RFI sta sopra AMAT, come sulla mappa (la ferrovia è disegnata sopra bus e tram) e le stazioni sopra la linea: il pannello
// elenca dall'alto verso il basso lo stesso ordine di disegno.
export const creaStrati = suCambio => [
  { id: 'trasporto-stazioni', etichetta: 'Stazioni metro', sezione: 'RFI', layers: ['trasporto-stazioni'], attivo: false, suCambio },
  { id: 'trasporto-metro', etichetta: 'Linea metro', sezione: 'RFI', layers: ['trasporto-metro', 'trasporto-metro-tratti'], attivo: false, suCambio },
  { id: 'trasporto-bus', etichetta: 'Linee bus', sezione: 'AMAT', layers: ['trasporto-bus'], attivo: false, suCambio },
  { id: 'trasporto-tram', etichetta: 'Linee tram', sezione: 'AMAT', layers: ['trasporto-tram'], attivo: false, suCambio },
  { id: 'trasporto-fermate', etichetta: 'Fermate', sezione: 'AMAT', layers: ['trasporto-fermate'], attivo: false, suCambio },
];

// Strato delle linee di un tipo (bus, tram, ferrovia): serve alla ricerca, al filtro Linea e alle schede.
export const stratoLinea = tipo => (tipo === 'tram' ? 'trasporto-tram' : tipo === 'ferrovia' ? 'trasporto-metro' : 'trasporto-bus');

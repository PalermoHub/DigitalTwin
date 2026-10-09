// Strati del pannello Layer per il trasporto pubblico, in due sezioni: AMAT (bus, tram e fermate del feed del Comune)
// e RFI (linee e stazioni della ferrovia urbana, feed Trenitalia). Modulo senza dipendenze dalla mappa: lo usano i test.
export const creaStrati = suCambio => [
  { id: 'trasporto-bus', etichetta: 'Linee bus', sezione: 'AMAT', layers: ['trasporto-bus'], attivo: false, suCambio },
  { id: 'trasporto-tram', etichetta: 'Linee tram', sezione: 'AMAT', layers: ['trasporto-tram'], attivo: false, suCambio },
  { id: 'trasporto-fermate', etichetta: 'Fermate', sezione: 'AMAT', layers: ['trasporto-fermate'], attivo: false, suCambio },
  { id: 'trasporto-metro', etichetta: 'Linee metro', sezione: 'RFI', layers: ['trasporto-metro'], attivo: false, suCambio },
  { id: 'trasporto-stazioni', etichetta: 'Stazioni', sezione: 'RFI', layers: ['trasporto-stazioni'], attivo: false, suCambio },
];

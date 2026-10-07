// Costanti e piccole funzioni condivise dal pannello degli strati e dal suo riordino.

// Il pannello «Ordine layer in mappa» e i gruppi si avvisano a vicenda quando cambia l'ordine degli strati sulla mappa.
export const EVENTO_DISEGNO = 'dt:ordine-disegno';
export const EVENTO_GRUPPO = 'dt:ordine-gruppo';

export const ETICHETTE = { base: 'Mappe di base', layer: 'Layer', filtri: 'Filtri', popolazione: 'Popolazione', confini: 'Confini', territorio: 'Territorio', edifici: 'Edifici', terreno: 'Rilievo', trasporto: 'Trasporti', pai: 'Piano PAI', monumenti: 'Monumenti', scuole: 'Scuole', uffici: 'Uffici', colonnine: 'Servizi', incendi: 'Incendi', 'isole-calore': 'Isole di calore', sicurezza: 'Sicurezza', miei: 'I miei layer' };

// Titolo di un gruppo: il `summary` di una sezione, altrimenti l'`h2` del pannello. Barre e campi si inseriscono dopo.
export const intestazione = el => el.querySelector(':scope > summary') ?? el.querySelector('h2');

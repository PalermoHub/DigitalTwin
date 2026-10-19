# Selezione in mappa, raggio dei punti vicini e fumetti

## La selezione in mappa dopo un clic

Parole chiave: selezione in mappa, evidenziazione, aree evidenziate, legenda della selezione, edificio, particella, zona PRG, zona OMI, fermata vicina, voci della legenda.

Domande tipiche: Cosa sono le aree colorate che compaiono dopo un clic? Come ne tolgo alcune? Perché a volte vedo solo l'edificio?

Dopo un clic sulla mappa le **aree da cui vengono i dati della scheda** vengono evidenziate. Ogni tipo di cosa evidenziata ha un'**etichetta** (la stessa della scheda) e un **colore**. Le etichette possibili sono: Edificio, Particella catastale, Zona PRG, Netto storico PRG, Centro storico PRG, Vincolo PRG (area), Vincolo PRG (linea), Zona OMI, Numero civico, Immobile comunale, Sezione di censimento, Punto di griglia del terreno (50 m), Monumento, Scuola o asilo, Sede di sezioni elettorali, Sede di uffici comunali, Albero monumentale, Fontanella, Colonnina di ricarica, Distributore di carburante, Fermata, Stazione, Linea, Opera pubblica e altre.

**Cosa viene evidenziato.** Si evidenzia una sola cosa: l'**edificio** se il clic cade su un edificio (per monumenti, scuole e sedi elettorali il poligono dell'edificio abbinato), il **punto** se cade fuori dall'edificato. Se non c'è né l'uno né l'altro (per esempio con solo catasto o PRG acceso) restano evidenziate tutte le aree. La griglia del terreno non conta.

**La legenda «Selezione in mappa».** Compare finché c'è una selezione in mappa. Ha una voce per ogni etichetta con il colore con cui è disegnata (un cerchio o la sagoma dell'icona per i punti, un quadrato per le aree). Come le altre legende fa da **filtro**: un clic su una voce lascia in mappa solo quella, un secondo clic le riaccende tutte. Si toglie la selezione con **Esc** o con il pulsante «Ripristina» accanto alla ricerca (vedi `44-ricerca-e-filtri.md`).

**Icone al posto dei cerchi.** I layer a punti con una loro icona (scuole, sedi elettorali, distributori, colonnine, fontanelle, alberi, monumenti, MEF, PEBA e altri) sono evidenziati con la **sagoma della loro icona**; i layer senza icona (come i civici) restano cerchi. Le fermate vicine sono un disco del colore della fonte con l'icona bianca, per distinguerle dalle fermate di un percorso. Dove due icone si toccano ne resta una, e le fermate vicine hanno la precedenza.

---

## Fumetti al passaggio del mouse (tooltip)

Parole chiave: tooltip, fumetto, passaggio del mouse, dettagli, nascondere i fumetti, un solo fumetto.

Domande tipiche: Come spengo i fumetti? Perché ne vedo uno solo con più sezioni?

Sulla mappa c'è **un solo tooltip**: a ogni movimento del mouse ogni modulo (confini, trasporto, sicurezza stradale, layer con un modello di popup…) dice cosa c'è sotto il cursore e il contenuto di tutti finisce in un unico riquadro, una sezione sotto l'altra, così i fumetti non si sovrappongono mai. Il fumetto mostra il titolo in grassetto (con un pallino colorato se serve), un eventuale badge e il sottotitolo; per i layer con un attributo di legenda compare anche lo stesso simbolo della legenda. Si cerca solo negli strati **accesi**. Un oggetto 3D sopra la mappa (come l'edificio per piani) può nascondere le altre sezioni.

Sulle aree evidenziate dopo un clic il fumetto riporta **il nome del layer e il dato che identifica l'elemento** (per esempio foglio e particella, zona PRG con descrizione, fascia OMI, indirizzo dell'immobile, civico, nome della fermata, sezione censuaria).

Per accendere e spegnere i fumetti ci sono due comandi:
- l'interruttore **«Tooltip sulla mappa»** nel menu «Overlay informativi» (vedi `45-barra-strati-legende-e-ordine.md`);
- il **pulsante a fumetto** nella legenda «Selezione in mappa» (per i soli fumetti delle aree evidenziate): «Dettagli al passaggio del mouse: attivi (clic per nasconderli)» / «Dettagli al passaggio del mouse: nascosti (clic per mostrarli)».

Il fumetto compare anche sopra la pila nella vista «Strati in 3D» (vedi `39-strati-in-3d.md`).

---

## Il raggio dei punti vicini e il cerchio tratteggiato

Parole chiave: raggio, punti vicini, dintorni del clic, metri, cursore del raggio, cerchio tratteggiato, 300 metri, distributori vicini, fermate vicine.

Domande tipiche: Entro quale distanza cerca i punti vicini? Come cambio il raggio? Cos'è il cerchio tratteggiato?

Quando si clicca sulla mappa la scheda mostra anche i **punti vicini** al clic (fermate, distributori, colonnine e gli altri layer a punti). Il **raggio** è uno solo per tutti i layer ed è regolabile dalla legenda: nel box «Selezione in mappa» c'è un cursore con l'etichetta **«Raggio intorno al clic: [n] m»**, da **100 a 500 metri** a passi di 50; all'inizio è **300 metri**. La scelta resta salvata nel browser.

L'interruttore **«Mostra il cerchio in mappa»** (acceso all'inizio) disegna un **cerchio tratteggiato** del raggio attorno al punto cliccato, con un alone chiaro sotto la linea scura in modo che si legga su qualsiasi sfondo. Cambiando il raggio o l'interruttore la scheda aperta si rifà subito e il cerchio si aggiorna in tempo reale.

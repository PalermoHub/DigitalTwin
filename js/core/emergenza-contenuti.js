// Contenuti della pagina «Modalità emergenza» (emergenza.html): una sezione per passo, con la sua schermata.
// Il testo è in italiano e si traduce al render con le voci lbl.* dei dizionari.
export const SEZIONI = [
  {
    id: 'a-cosa-serve',
    titolo: 'A cosa serve',
    paragrafi: [
      'La modalità emergenza serve a una cosa sola: **trovare in fretta**, dal telefono, **l\'area del Piano di emergenza** della Protezione civile più vicina a te e **farti guidare fin lì**. **Si accende da sola** quando sul telefono è acceso lo strato «Piano di emergenza»: l\'app si semplifica e restano solo gli strumenti utili.',
      'Bastano **cinque passi**, qui sotto spiegati uno per uno con la schermata del telefono.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza.webp', alt: 'Le cinque schermate della modalità emergenza in fila: il catalogo con lo strato Piano di emergenza, la mappa con le aree colorate e la barra rossa, l\'area ingrandita, la scheda con il pulsante «Apri nel navigatore» e i numeri utili con la mappa dell\'area.', didascalia: 'Le aree di emergenza in cinque passi, dal telefono.' },
  },
  {
    id: 'accendi-lo-strato',
    titolo: '1. Accendi lo strato',
    paragrafi: [
      'Nel catalogo degli strati cerca **«Piano di emergenza»** e tocca **«Aggiungi alla mappa»**. Sul telefono la **barra in basso diventa rossa** e ha solo sei pulsanti: **«Mappa»**, **«Zoom base»** (riporta la mappa su tutta Palermo), **«GPS»**, **«Condividi»**, **«Talia»** ed **«Esci»**.',
      'Per tornare all\'app completa basta toccare **«Esci»** o **spegnere lo strato**.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-1-catalogo.webp', alt: 'Il catalogo degli strati sul telefono con la scheda «Piano di emergenza (da zoom 11)» e il pulsante «Aggiungi alla mappa».', didascalia: 'Nel catalogo cerca «Piano di emergenza» e tocca «Aggiungi alla mappa».' },
  },
  {
    id: 'premi-gps',
    titolo: '2. Premi «GPS»',
    paragrafi: [
      'Tocca **«GPS»** e **consenti l\'accesso alla posizione**. Sulla mappa compaiono le **aree, colorate per funzione**, e **il punto in cui ti trovi**; la **legenda** in basso a sinistra dice quante sono e a cosa servono.',
      '**Verde**: area di attesa della popolazione, dove ci si raduna subito dopo l\'evento. **Rosso**: area di ricovero e accoglienza, dove si viene alloggiati. **Giallo**: area di ammassamento dei soccorritori. In blu e in viola ci sono gli **ospedali** e i **siti a rischio industriale**.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-2-gps.webp', alt: 'La mappa di Palermo con le aree di emergenza colorate, la legenda con il numero di aree per tipo e la barra rossa in basso con i pulsanti Mappa, Zoom base, GPS, Condividi, Talia ed Esci.', didascalia: 'Compaiono le aree, colorate per funzione, e il punto in cui ti trovi.' },
  },
  {
    id: 'avvicina-la-mappa',
    titolo: '3. Avvicina la mappa',
    paragrafi: [
      'Avvicina la mappa all\'**area che ti sta più vicina**. Il **tratteggio** e il **colore** ti dicono a cosa serve; il nome al centro, per esempio «Palermo-Boccadifalco Airport», ti aiuta a riconoscerla.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-3-zoom.webp', alt: 'La mappa avvicinata su un\'area gialla tratteggiata, l\'area di ammassamento dei soccorritori di Boccadifalco, con la legenda in basso a sinistra.', didascalia: 'Il colore e il tratteggio dicono a cosa serve l\'area.' },
  },
  {
    id: 'tocca-l-area',
    titolo: '4. Tocca l\'area',
    paragrafi: [
      'In questa modalità il tocco non apre il fumetto sulla mappa ma **solo la scheda di quell\'area**, a tutta altezza, senza le altre informazioni del punto. La scheda dice **il tipo di area** e il suo **numero**, la **superficie** e dove si trova (**circoscrizione, quartiere, UPL**).',
      'Il pulsante verde **«Apri nel navigatore»** apre l\'app di navigazione del telefono con il **percorso già impostato** fino all\'area: avvia le indicazioni e **segui la strada**.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-4-scheda.webp', alt: 'La scheda di un\'area di ammassamento dei soccorritori, con numero e superficie, circoscrizione, quartiere e UPL, il pulsante verde «Apri nel navigatore» e i numeri 112, 115, 118, 113 e 1515.', didascalia: 'Nella scheda premi «Apri nel navigatore» e fatti guidare.' },
  },
  {
    id: 'numeri-utili',
    titolo: '5. Numeri utili a un tocco',
    paragrafi: [
      'Scorrendo la scheda trovi i **numeri utili** da chiamare con un tocco: **112** emergenza, **115** Vigili del Fuoco, **118** emergenza sanitaria, **113** Polizia di Stato, **1515** incendi boschivi, **800 840 840** Protezione civile. Più in basso ci sono i **siti ufficiali** e una piccola mappa con l\'area scelta evidenziata in **rosa** rispetto alle altre.',
      'In emergenza **valgono sempre le indicazioni della Protezione civile e delle autorità**.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-5-numeri.webp', alt: 'La parte bassa della scheda con i numeri della Protezione civile, i siti ufficiali e la piccola mappa con l\'area scelta evidenziata in rosa.', didascalia: 'Numeri utili, siti ufficiali e la mappa dell\'area scelta.' },
  },
];

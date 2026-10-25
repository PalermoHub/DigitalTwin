// Contenuti della pagina «Modalità emergenza» (emergenza.html): una sezione per passo, con la sua schermata.
// Il testo è in italiano e si traduce al render con le voci lbl.* dei dizionari.
export const SEZIONI = [
  {
    id: 'a-cosa-serve',
    titolo: 'A cosa serve',
    paragrafi: [
      'La modalità emergenza serve a una cosa sola: **trovare in fretta**, dal telefono, **l\'area del Piano di emergenza** della Protezione civile più vicina a te e **farti guidare fin lì**. Si parte dal pulsante **«Emergenze»** della home; sul telefono, quando lo strato «Piano di emergenza» è acceso, **l\'app si semplifica** e restano solo gli strumenti utili.',
      'Bastano **sei passi**, qui sotto spiegati uno per uno con la schermata del telefono.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza.webp', alt: 'Le sei schermate della modalità emergenza in fila: la home con il pulsante Emergenze, il pannello con il bollettino e lo strato Piano di emergenza, la mappa con le aree colorate e la barra rossa, l\'area ingrandita, la scheda con il pulsante «Apri nel navigatore» e i numeri utili con la mappa dell\'area.', didascalia: 'Le aree di emergenza in sei passi, dal telefono.' },
  },
  {
    id: 'tocca-emergenze',
    titolo: '1. Tocca «Emergenze»',
    paragrafi: [
      'Dalla home tocca il pulsante **«Emergenze»**, in fondo. Qui **arrivano le notifiche dei bollettini della Protezione civile**: quando a Palermo c\'è un\'allerta, **il pulsante diventa rosso** e il sottotitolo dice quale (per esempio «Allerta gialla a Palermo: vedi il bollettino»). Senza allerta resta bianco con il bordo rosso.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-1-emergenze.webp', alt: 'La home sul telefono con il pulsante rosso «Emergenze» in fondo e il sottotitolo «Allerta gialla a Palermo: vedi il bollettino».', didascalia: 'Il pulsante «Emergenze» diventa rosso quando c\'è un\'allerta.' },
  },
  {
    id: 'leggi-il-bollettino',
    titolo: '2. Leggi il bollettino e aggiungi lo strato',
    paragrafi: [
      'Si apre il pannello. In cima trovi il **bollettino**: **il tipo di avviso** per ogni zona (per esempio «Allerta gialla (temporali, rischio idrogeologico)»), la data e l\'ora del bollettino e il link **«Bollettino sul sito della Protezione Civile»**, che apre **direttamente il sito ufficiale** della Protezione civile.',
      'Più in basso c\'è la scheda **«Piano di emergenza»**: tocca **«Aggiungi alla mappa»**. Sul telefono la **barra in basso diventa rossa** e ha solo sei pulsanti: **«Mappa»**, **«Zoom base»** (riporta la mappa su tutta Palermo), **«GPS»**, **«Condividi»**, **«Talia»** ed **«Esci»**. Subito sotto ci sono i **numeri utili** (112 e Protezione civile) a un tocco.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-2-bollettino.webp', alt: 'Il pannello Emergenze: in alto il bollettino con le zone di allerta e il link al sito della Protezione Civile, sotto la scheda «Piano di emergenza (da zoom 11)» con il pulsante «Aggiungi alla mappa» e i numeri utili.', didascalia: 'Leggi il bollettino, apri il link ufficiale e tocca «Aggiungi alla mappa».' },
  },
  {
    id: 'guarda-la-mappa',
    titolo: '3. Guarda la mappa',
    paragrafi: [
      'Sulla mappa compaiono le **aree, colorate per funzione**. Tocca **«GPS»** e **consenti l\'accesso alla posizione** per vedere **il punto in cui ti trovi** e capire quale area ti è più vicina.',
      '**Verde**: area di attesa della popolazione, dove ci si raduna subito dopo l\'evento. **Rosso**: area di ricovero e accoglienza, dove si viene alloggiati. **Giallo**: area di ammassamento dei soccorritori. In blu e in viola ci sono gli **ospedali** e i **siti a rischio industriale**.',
      'Per tornare all\'app completa basta toccare **«Esci»** o **spegnere lo strato**.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-3-mappa.webp', alt: 'La mappa di Palermo con le aree di emergenza colorate e tratteggiate e la barra rossa in basso con i pulsanti Mappa, Zoom base, GPS, Condividi, Talia ed Esci.', didascalia: 'Compaiono le aree, colorate per funzione, e la barra rossa.' },
  },
  {
    id: 'avvicina-la-mappa',
    titolo: '4. Avvicina la mappa',
    paragrafi: [
      'Avvicina la mappa all\'**area che ti sta più vicina**. Il **tratteggio** e il **colore** ti dicono a cosa serve; il nome al centro, per esempio «LICP» (l\'aeroporto di Boccadifalco), ti aiuta a riconoscerla.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-4-zoom.webp', alt: 'La mappa avvicinata su Boccadifalco: un\'area gialla tratteggiata, l\'area di ammassamento dei soccorritori, circondata da aree rosse e blu, con la barra rossa in basso.', didascalia: 'Il colore e il tratteggio dicono a cosa serve l\'area.' },
  },
  {
    id: 'tocca-l-area',
    titolo: '5. Tocca l\'area',
    paragrafi: [
      'In questa modalità il tocco non apre il fumetto sulla mappa ma **solo la scheda di quell\'area**, a tutta altezza, senza le altre informazioni del punto. La scheda dice **il tipo di area** e il suo **numero**, la **superficie** e dove si trova (**circoscrizione, quartiere, UPL**).',
      'Il pulsante verde **«Apri nel navigatore»** apre l\'app di navigazione del telefono con il **percorso già impostato** fino all\'area: avvia le indicazioni e **segui la strada**.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-5-scheda.webp', alt: 'La scheda di un\'area di ammassamento dei soccorritori, con numero e superficie, circoscrizione, quartiere e UPL, il pulsante verde «Apri nel navigatore» e i numeri 112, 115, 118, 113 e 1515.', didascalia: 'Nella scheda premi «Apri nel navigatore» e fatti guidare.' },
  },
  {
    id: 'numeri-utili',
    titolo: '6. Numeri utili a un tocco',
    paragrafi: [
      'Scorrendo la scheda trovi i **numeri utili** da chiamare con un tocco: **112** emergenza, **115** Vigili del Fuoco, **118** emergenza sanitaria, **113** Polizia di Stato, **1515** incendi boschivi, **800 840 840** Protezione civile, **800 404 040** Sala operativa della Regione Siciliana. Più in basso ci sono i **siti ufficiali** e una piccola mappa con l\'area scelta evidenziata in **rosa** rispetto alle altre.',
      'In emergenza **valgono sempre le indicazioni della Protezione civile e delle autorità**.',
    ],
    immagine: { file: 'img/guida/passi/modalita-emergenza-6-numeri.webp', alt: 'La parte bassa della scheda con i numeri della Protezione civile e della Sala operativa regionale, i siti ufficiali e la piccola mappa con l\'area scelta evidenziata in rosa.', didascalia: 'Numeri utili, siti ufficiali e la mappa dell\'area scelta.' },
  },
];

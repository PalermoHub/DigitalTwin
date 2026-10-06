// js/geoimage/guida-contenuti.js
// Testo della guida di Geoimage (tab «Guida Geoimage» del foglio Info), adattato al pannello del Digital Twin.
// Ogni sezione ha un titolo e, a scelta, paragrafi, passi numerati ({ titolo, testo, elenco, immagine }) o un elenco puntato;
// `immagine` ({ file, alt, didascalia }) è uno screenshot di scripts/guida_screenshot_geoimage.py.
export const SEZIONI = [
  {
    id: 'cos-e',
    titolo: 'Cos’è Geoimage',
    paragrafi: [
      'Geoimage ti permette di sovrapporre una mappa storica (o qualsiasi immagine) alla cartografia moderna e di georeferenziarla, cioè di associarle coordinate geografiche reali tramite i Ground Control Points (GCP).',
      'Nel Digital Twin funziona sulla base cartografica di Palermo: apri il tab «Geoimage» nella barra a destra. L’idea e il codice vengono da Geoimage di @gbvitrano (github.com/gbvitrano/Geoimage).',
    ],
  },
  {
    id: 'georeferenziare',
    titolo: 'Come georeferenziare un’immagine',
    passi: [
      {
        titolo: 'Inquadra la zona',
        testo: 'Con la ricerca del Digital Twin (via, civico, quartiere) porta la mappa sull’area che l’immagine rappresenta, così l’immagine si carica già vicina al posto giusto.',
      },
      {
        titolo: 'Carica la mappa storica',
        testo: 'Trascina il file (JPG, PNG, WEBP, BMP) nel riquadro «Carica mappa storica», oppure clicca il riquadro per scegliere il file. L’immagine appare subito al centro della mappa, con le maniglie di posizionamento. Segue la mappa anche se la ruoti o la inclini in 3D.',
        immagine: { file: 'img/guida/passi/geoimage-carica.webp', alt: 'Il pannello Geoimage con la pianta di Palermo del 1891 appena caricata sulla mappa, con le maniglie agli angoli', didascalia: 'La pianta di Palermo del 1891 (Harvard Map Collection) appena caricata: maniglie arancioni, opacità al 70 %.' },
      },
      {
        titolo: 'Posiziona e orienta l’immagine',
        testo: 'Usa le maniglie direttamente sulla mappa:',
        elenco: [
          'Cerchio arancione al centro: trascina per spostare l’intera immagine.',
          'Cerchio con la freccia sopra il lato nord: trascina per ruotare.',
          'Maniglie agli angoli, in due modalità che cambi con il pulsante «Maniglie: scala / deforma»: in modalità scala (quadratini arancioni) ridimensionano l’immagine in proporzione tenendo fermo l’angolo opposto; in modalità deforma (diamanti blu) ogni angolo si muove liberamente, utile per le mappe storiche non rettangolari.',
          'Per spostamenti precisi usa le frecce, la rotazione di 5° e la scala del 10 % nella sezione «Posiziona overlay»; ⌖ inquadra l’immagine, «Blocca» ferma le maniglie e «Reset» riporta tutto alla posizione iniziale.',
          'Annulla e Ripeti (oppure Ctrl+Z e Ctrl+Y; con Maiusc fanno 10 passi) ripercorrono fino a 50 posizioni. La cronologia riparte quando carichi un’altra immagine.',
        ],
      },
      {
        titolo: 'Aggiungi i GCP (due clic per ogni punto)',
        testo: 'Premi «Aggiungi GCP» (oppure il tasto G). Per ogni punto di controllo servono due clic direttamente sulla mappa:',
        elenco: [
          'Passo 1, sull’immagine storica: clicca un punto riconoscibile (un incrocio, un edificio, un monumento). Compare un cerchio arancione che conferma il punto scelto.',
          'Passo 2, sulla mappa di base: clicca lo stesso luogo nella cartografia moderna. Il GCP è aggiunto e il cerchio diventa rosso e numerato.',
          'Usa lo Swipe o lo Spotlight per vedere la base sotto l’immagine e cliccare con precisione al passo 2.',
          'Esc annulla il passo 1 in attesa; premilo ancora per uscire dalla modalità GCP. Finché sei in questa modalità i clic sulla mappa non aprono la scheda dei luoghi.',
          'Aggiungi almeno 3 GCP, meglio se distribuiti agli angoli dell’area coperta dall’immagine.',
        ],
        immagine: { file: 'img/guida/passi/geoimage-gcp.webp', alt: 'Quattro GCP numerati sulla mappa e nella tabella del pannello, con i residui', didascalia: 'Quattro GCP: per ognuno un clic sull’immagine e uno sul luogo reale. La tabella mostra coordinate, pixel e residuo.' },
      },
      {
        titolo: 'Allinea l’immagine ai GCP',
        testo: 'Con 3 o più GCP si abilita «Allinea immagine ai GCP». L’app calcola la trasformazione scelta nel menu «Trasformazione» (affine, da 3 GCP; oppure polinomiale di 2° grado, da 6 GCP) e sposta l’immagine nelle coordinate giuste. Puoi ripetere l’operazione aggiungendo altri GCP.',
        immagine: { file: 'img/guida/passi/geoimage-allinea.webp', alt: 'La pianta del 1891 allineata alla base moderna dopo l’allineamento ai GCP, con l’RMSE nel pannello', didascalia: 'Dopo «Allinea immagine ai GCP» la pianta del 1891 coincide con la base moderna; nel pannello compare l’RMSE.' },
      },
      {
        titolo: 'Controlla l’errore (RMSE)',
        testo: 'Appena i GCP bastano per la trasformazione scelta (3 per l’affine, 6 per la polinomiale) compare l’RMSE, l’errore medio in metri: più è basso, meglio è. Nella tabella ogni GCP ha il suo residuo in metri, colorato rispetto alla media: verde se è nella norma, arancione se è alto, rosso se è molto più alto degli altri. Se l’errore è alto, riposiziona i GCP meno precisi (trascinali sulla mappa) o aggiungine altri.',
      },
      {
        titolo: 'Esporta il risultato',
        testo: 'Dalla sezione «Export» scarichi:',
        elenco: [
          'KMZ: per Google Earth, QGIS e ArcGIS, con l’immagine incorporata.',
          'GeoTIFF: raster con le coordinate incorporate, pronto per QGIS, ArcGIS e GDAL. Scegli sistema di riferimento (WGS 84, UTM 32N o 33N, Web Mercator), ricampionamento, risoluzione massima e compressione LZW.',
          '.points: i GCP per il Georeferenziatore di QGIS.',
          'World file: la trasformazione affine in sei righe (richiede almeno 3 GCP).',
          'GCP GeoJSON: i punti di controllo come dati geografici.',
          'JSON: salva e riapre l’intero progetto («Esporta JSON» e «Importa JSON»); è lo stesso formato di Geoimage.',
        ],
        immagine: { file: 'img/guida/passi/geoimage-esporta.webp', alt: 'La sezione Export del pannello con le impostazioni GeoTIFF aperte', didascalia: 'Export: il pulsante GeoTIFF apre le impostazioni (sistema di riferimento, ricampionamento, risoluzione, compressione).' },
      },
    ],
  },
  {
    id: 'swipe',
    titolo: 'Come usare lo Swipe',
    paragrafi: ['Lo Swipe divide la mappa in due metà con una linea verticale scorrevole: a sinistra vedi l’immagine storica, a destra la sola cartografia di base.'],
    passi: [
      { titolo: 'Attivalo', testo: 'Nella sezione «Confronto visivo» premi «Swipe»: sulla mappa compare la linea con la maniglia centrale.' },
      { titolo: 'Trascina la linea', testo: 'Trascina la maniglia per spostare la divisione tra il 2 % e il 98 % della larghezza della mappa.' },
      { titolo: 'Naviga normalmente', testo: 'Con lo Swipe attivo puoi ancora spostare e ingrandire la mappa: la linea resta ferma e la divisione si aggiorna in tempo reale. Per spostare la mappa tieni il cursore fuori dalla maniglia.' },
      { titolo: 'Disattivalo', testo: 'Premi di nuovo «Swipe». Swipe e Spotlight si escludono: attivarne uno spegne l’altro.' },
    ],
    immagine: { file: 'img/guida/passi/geoimage-swipe.webp', alt: 'Lo Swipe: a sinistra la pianta del 1891, a destra la base moderna', didascalia: 'Swipe: la linea divide la pianta storica (a sinistra) dalla base moderna (a destra).' },
  },
  {
    id: 'spotlight',
    titolo: 'Come usare lo Spotlight',
    paragrafi: ['Lo Spotlight ti aiuta a calibrare la posizione dell’immagine rispetto alla cartografia moderna.'],
    passi: [
      { titolo: 'Attivalo', testo: 'Premi «Spotlight» e muovi il mouse sulla mappa: un cerchio scopre la cartografia di base nascosta sotto l’immagine.' },
      { titolo: 'Regola il raggio', testo: 'Il cursore «Raggio» ingrandisce o riduce il cerchio.' },
      { titolo: 'Inverti l’effetto', testo: 'Il pulsante ⇄ inverte la logica: l’immagine storica si vede solo dentro il cerchio e il resto è nascosto.' },
    ],
    immagine: { file: 'img/guida/passi/geoimage-spotlight.webp', alt: 'Lo Spotlight: un cerchio scopre la base moderna sotto la pianta del 1891', didascalia: 'Spotlight: il cerchio segue il mouse e scopre la base moderna sotto l’immagine.' },
  },
  {
    id: 'suggerimenti',
    titolo: 'Scorciatoie e suggerimenti',
    elenco: [
      'Le scorciatoie funzionano con il pannello Geoimage aperto e il cursore fuori dai campi di testo.',
      'G: attiva o spegne la modalità GCP. Esc: annulla il passo 1 in attesa, poi esce dalla modalità GCP.',
      'Canc o Backspace: rimuove l’ultimo GCP aggiunto.',
      'Ctrl+Z: annulla. Ctrl+Y: ripete. Con Maiusc 10 passi alla volta.',
      'Ctrl+S: salva il progetto nel browser. L: blocca o sblocca le maniglie.',
      'Il progetto si salva da solo nel browser: ricaricando la pagina ritrovi l’immagine dove l’avevi lasciata (se il browser lo permette). «Esporta JSON» ne tiene una copia.',
      'Più GCP aggiungi, e più li distribuisci agli angoli dell’immagine, più precisa è la georeferenziazione.',
    ],
  },
  {
    id: 'differenze',
    titolo: 'Cosa cambia nel Digital Twin',
    elenco: [
      'L’immagine sta sopra tutti gli strati della mappa, per confrontarla con la base: regola l’opacità o usa Swipe e Spotlight per vedere cosa c’è sotto.',
      'Funziona anche con la mappa inclinata (3D) e ruotata.',
      'La base cartografica e la ricerca sono quelle del Digital Twin: non ci sono il selettore della mappa di base né la ricerca dei luoghi di Geoimage.',
      'Le maniglie si vedono solo con il pannello Geoimage aperto; a pannello ripiegato resta solo l’immagine.',
      'Il cambio tra scala e deforma degli angoli si fa con un pulsante, non cliccando sull’immagine (il clic sulla mappa apre la scheda dei luoghi).',
      'Si usa meglio con il mouse. Sul telefono il tab laterale non c’è: apri Geoimage dal pulsante nel pannello Strati e chiudilo con la X in alto a destra del pannello.',
    ],
  },
  {
    id: 'mapwarper',
    titolo: 'Vuoi più precisione?',
    paragrafi: ['Per georeferenziazioni e rettifiche più precise, con trasformazioni polinomiali avanzate e collaborazione online, ti consigliamo MapWarper.'],
    link: { testo: 'mapwarper.net', url: 'https://mapwarper.net/' },
  },
];

# Geoimage: georeferenziare e sovrapporre una mappa storica

## Cos'è Geoimage e come si apre

Parole chiave: Geoimage, mappa storica, georeferenziare, sovrapporre un'immagine, GCP, punti di controllo, opacità, tab Geoimage.

Domande tipiche: Cos'è Geoimage? Come sovrappongo una vecchia mappa alla città di oggi? Quali immagini posso usare?

**Geoimage · mappe storiche** permette di sovrapporre una mappa storica (o qualsiasi immagine) alla cartografia moderna e di **georeferenziarla**, cioè di associarle coordinate geografiche reali tramite i **Ground Control Points (GCP)**. Nel Digital Twin funziona sulla base cartografica di Palermo. L'idea e il codice vengono da Geoimage di @gbvitrano (porting in MapLibre). Si apre dal tab **Geoimage** della barra di destra (da smartphone dal pulsante nel foglio «Strati»/«Aggiungi») e si chiude con «Chiudi Geoimage» (su smartphone con la X in alto a destra del pannello). All'inizio il pannello dice «Carica un'immagine storica per iniziare.» La guida completa è anche nella pagina «Guida Geoimage» del menu.

---

## Caricare e posizionare l'immagine

Parole chiave: carica mappa storica, JPG PNG WEBP BMP, trascina, maniglie, scala, deforma, ruota, blocca, reset, annulla, ripeti.

Domande tipiche: Come carico l'immagine? Cosa fanno le maniglie? Posso annullare uno spostamento?

1. **Inquadra la zona** con la ricerca dell'app (via, civico, quartiere), così l'immagine si carica già vicina al posto giusto.
2. **Carica**: si trascina il file (**JPG, PNG, WEBP, BMP**) nel riquadro **«Carica mappa storica»** oppure si clicca il riquadro per scegliere il file. L'immagine appare al centro della mappa con le maniglie e segue la mappa anche se la si ruota o la si inclina in 3D. Il pannello dice «Immagine caricata. Posizionala con le maniglie sulla mappa, poi aggiungi i GCP (tasto G).»
3. **Posiziona e orienta** con le maniglie sulla mappa: il **cerchio arancione al centro** sposta l'immagine; il **cerchio con la freccia sopra il lato nord** la ruota; le **maniglie agli angoli** hanno due modalità che si cambiano con il pulsante **«Maniglie: scala / deforma»**: in *scala* (quadratini arancioni) ridimensionano in proporzione tenendo fermo l'angolo opposto; in *deforma* (diamanti blu) ogni angolo si muove liberamente, utile per le mappe storiche non rettangolari.
4. Nella sezione **«Posiziona overlay»** ci sono i comandi precisi: frecce per spostare, rotazione di 5° a sinistra e a destra, scala del 10 % in più o in meno, ⌖ per inquadrare l'immagine, **«Blocca (L)»** per fermare le maniglie e **Reset** per riportare tutto alla posizione iniziale.
5. **Annulla** (Ctrl+Z) e **Ripeti** (Ctrl+Y) ripercorrono fino a **50 posizioni**; con Maiusc fanno 10 passi. La cronologia riparte quando si carica un'altra immagine. **«Rimuovi immagine»** toglie l'immagine dalla mappa.

Se si sceglie un file non immagine: «scegli un file immagine (JPG, PNG, WEBP o BMP).»

---

## I punti di controllo (GCP) e l'allineamento

Parole chiave: GCP, aggiungi GCP, passo 1, passo 2, almeno 3 punti, allinea immagine ai GCP, affine, polinomiale, RMSE, residuo, errore in metri.

Domande tipiche: Come si aggiunge un GCP? Quanti ne servono? Cosa vuol dire RMSE?

**Aggiungere un GCP** (pulsante **«Aggiungi GCP (G)»** o tasto G): per ogni punto servono **due clic sulla mappa**.
- **Passo 1**, sull'immagine storica: si clicca un punto riconoscibile (un incrocio, un edificio, un monumento); compare un cerchio arancione.
- **Passo 2**, sulla mappa di base: si clicca lo stesso luogo nella cartografia moderna; il GCP è aggiunto e il cerchio diventa rosso e numerato.
- Lo **Swipe** o lo **Spotlight** aiutano a vedere la base sotto l'immagine per cliccare con precisione.
- **Esc** annulla il passo 1 in attesa; premuto ancora esce dalla modalità GCP. In questa modalità i clic sulla mappa non aprono la scheda dei luoghi.
- Servono **almeno 3 GCP**, meglio se distribuiti agli angoli dell'area coperta dall'immagine. Con meno il pannello dice «[n] GCP: ne servono almeno [min]».
- Una tabella mostra per ogni GCP coordinate, pixel e residuo; **«Rimuovi il GCP [n]»** toglie un punto e **«Cancella tutti i GCP»** li toglie tutti. **Canc** o **Backspace** rimuove l'ultimo aggiunto.

**Allineare.** Con 3 o più GCP si abilita **«Allinea immagine ai GCP»**, che sposta l'immagine nelle coordinate calcolate. Il menu **«Trasformazione»** sceglie il tipo: **Affine (≥3 GCP)** oppure **Polinomiale 2 (≥6 GCP)**. Si può ripetere aggiungendo altri GCP.

**Controllare l'errore (RMSE).** Appena i GCP bastano per la trasformazione scelta compare l'**RMSE**, l'errore medio in **metri**: più è basso, meglio è. Nella tabella ogni GCP ha il suo **residuo in metri**, colorato rispetto alla media: **verde** se è nella norma, **arancione** se è alto, **rosso** se è molto più alto degli altri. Se l'errore è alto si riposizionano i GCP meno precisi (trascinandoli sulla mappa) o se ne aggiungono altri.

---

## Confronto visivo: Swipe e Spotlight

Parole chiave: swipe, spotlight, raggio, inverti, confronto, opacità, linea scorrevole, cerchio.

Domande tipiche: Come confronto la mappa storica con quella di oggi? Come uso lo Spotlight?

Nella sezione **«Confronto visivo»**:
- **Swipe**: divide la mappa con una **linea verticale scorrevole** (a sinistra l'immagine storica, a destra la sola base moderna). Si trascina la maniglia centrale tra il 2 % e il 98 % della larghezza; con lo Swipe attivo si può ancora spostare e ingrandire la mappa tenendo il cursore fuori dalla maniglia.
- **Spotlight**: un **cerchio che segue il mouse** scopre la base moderna sotto l'immagine. Il cursore **«Raggio»** ingrandisce o riduce il cerchio; il pulsante **⇄** inverte l'effetto (l'immagine si vede solo dentro il cerchio).
- Swipe e Spotlight **si escludono**: attivarne uno spegne l'altro. Premendo di nuovo lo stesso pulsante si disattiva.
- Un cursore regola l'**opacità** dell'immagine; l'immagine sta sopra tutti gli strati.

---

## Esportare e salvare il progetto

Parole chiave: esporta, KMZ, GeoTIFF, QGIS, .points, world file, GeoJSON dei GCP, JSON, progetto, salvataggio automatico, MapWarper.

Domande tipiche: Come porto il risultato in QGIS? Il lavoro si salva? Posso riaprirlo?

Nella sezione **Export**:
- **KMZ**: per Google Earth, QGIS e ArcGIS, con l'immagine incorporata.
- **GeoTIFF**: raster con le coordinate incorporate, per QGIS, ArcGIS, GDAL. Il pulsante apre **«Impostazioni GeoTIFF»**: **sistema di riferimento** (WGS 84, UTM 32N o 33N, Web Mercator), **ricampionamento** (Vicino più prossimo o Bilineare 2×2), **risoluzione massima** (lato lungo) e **compressione** (Nessuna oppure **LZW, consigliata**), poi «Esporta GeoTIFF». In EPSG:4326 con l'affine la trasformazione è incorporata senza ricampionamento. Servono almeno il numero di GCP richiesto dalla trasformazione.
- **GCP per QGIS (.points)**: i GCP per il Georeferenziatore di QGIS.
- **World file**: la trasformazione affine in sei righe (servono almeno 3 GCP non allineati).
- **GCP GeoJSON**: i punti di controllo come dati geografici.
- **JSON** («Esporta JSON» e «Importa JSON»): salva e riapre l'intero progetto (immagine, posizione e GCP); è lo stesso formato di Geoimage.

**Salvataggio.** Il progetto si salva **da solo nel browser**: ricaricando la pagina si ritrova l'immagine dove era (se il browser lo permette; con immagini grandi o con l'archivio bloccato Geoimage avvisa e consiglia «Esporta JSON»). **Ctrl+S** salva a mano nel browser («Progetto salvato in questo browser.»).

**Scorciatoie** (con il pannello aperto e il cursore fuori dai campi di testo): **G** modalità GCP; **Esc** annulla il passo 1, poi esce dalla modalità GCP; **Canc/Backspace** rimuove l'ultimo GCP; **Ctrl+Z / Ctrl+Y** annulla e ripete; **Ctrl+S** salva; **L** blocca o sblocca le maniglie.

**Cosa cambia nel Digital Twin rispetto a Geoimage originale**: l'immagine sta sopra tutti gli strati; funziona anche con la mappa inclinata e ruotata; la base cartografica e la ricerca sono quelle del Digital Twin (non c'è il selettore della base né la ricerca dei luoghi di Geoimage); le maniglie si vedono solo con il pannello aperto; il cambio scala/deforma si fa con un pulsante (il clic sulla mappa apre la scheda); si usa meglio con il mouse.

**Più precisione.** Per georeferenziazioni più precise, con trasformazioni polinomiali avanzate e collaborazione online, si consiglia **MapWarper** (mapwarper.net). Le carte storiche già georeferenziate dell'Atlante sono tra le basi della mappa (vedi `47-mappe-di-base-e-storiche.md`).

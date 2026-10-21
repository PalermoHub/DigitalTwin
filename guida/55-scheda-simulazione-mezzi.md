# Simulazione dei mezzi in movimento

## Cos'è la simulazione dei mezzi

Parole chiave: simulazione, mezzi in movimento, treni in movimento, tram in movimento, autobus in movimento, mezzi di trasporto, orari, GTFS, non è tempo reale.

Domande tipiche: Cos'è la simulazione dei mezzi in movimento? Posso vedere i treni, i tram e gli autobus che si muovono? Le posizioni dei mezzi sono in tempo reale? Come funziona la simulazione dei mezzi?

La simulazione mostra sulla mappa i **treni**, i **tram** e gli **autobus** che si muovono lungo le loro linee secondo gli orari programmati (feed GTFS di Trenitalia per la ferrovia urbana e di AMAT per bus e tram). Sono tre strati nel gruppo «Trasporti», uno per tipo di mezzo: **Treni in movimento (simulazione)** nella sezione RFI, **Tram in movimento (simulazione)** e **Autobus in movimento (simulazione)** nella sezione AMAT. Ogni mezzo in viaggio è un piccolo volume nel colore della sua linea, orientato come la marcia, con il numero della linea accanto.

**Non è il tempo reale**: le posizioni sono teoriche, ricavate dagli orari. Non tengono conto di ritardi, traffico o soppressioni, e tra due fermate il mezzo procede a velocità costante. Il tracciato può non coincidere con la strada reale in ogni tratto. Al momento non risultano feed GTFS-Realtime pubblicati per queste linee.

---

## Come attivare la simulazione

Parole chiave: attivare la simulazione, accendere, pulsanti, percorso guidato, Mezzi in movimento 2D, Mezzi in movimento 3D, strati, Accendi.

Domande tipiche: Come attivo la simulazione dei mezzi? Come faccio partire i treni e gli autobus in movimento? Come accendo i mezzi in movimento? Come vedo la simulazione in 3D?

Ci sono due modi. Il primo: sotto questa risposta, i pulsanti «Accendi: …» accendono uno per uno gli strati dei treni, dei tram e degli autobus in movimento (e la linea metro); un secondo clic li spegne. Il secondo: i pulsanti dei percorsi guidati, qui sotto, accendono tutti gli strati insieme e portano la mappa nella zona giusta:

- **Mezzi in movimento (2D)**: treni, tram, autobus e linea metro, con la mappa vista dall'alto.
- **Mezzi in movimento (3D)**: gli stessi mezzi tra gli edifici 3D, con rilievo ed elevazione del terreno, linee del tram e della metro e stazioni, con la mappa inclinata vicino alla stazione centrale.

Alla prima accensione l'app scarica le corse dei mezzi, quindi i mezzi possono comparire dopo qualche istante. Chi parte dalla pagina iniziale trova gli stessi due percorsi nella sezione «Percorsi guidati» e nella card in evidenza (vedi `01-uso-della-mappa.md`).

---

## L'orologio e la velocità della simulazione

Parole chiave: orologio, ora simulata, velocità, ×1, ×10, ×60, accelerare, legenda Simulazione, tempo.

Domande tipiche: Come cambio la velocità della simulazione? A che ora siamo nella simulazione? Come faccio andare più veloci i mezzi? Cosa significano ×10 e ×60?

Con uno strato dei trasporti acceso, nella legenda dei trasporti compare il riquadro «Simulazione», con l'ora simulata e tre pulsanti di velocità: **×1** (tempo normale, il valore di partenza), **×10** e **×60**. L'ora parte da quella attuale e i mezzi si aggiornano ogni secondo. Con ×60 un minuto di simulazione passa in un secondo. Cambiare velocità non fa ripartire dall'inizio: la simulazione prosegue dall'ora raggiunta.

---

## Cosa si vede in 2D e in 3D

Parole chiave: 2D, 3D, mappa inclinata, volumi, rettangoli, ingrandimento, numero della linea, edifici 3D.

Domande tipiche: Perché i mezzi sembrano rettangoli? Come vedo i mezzi in 3D? Perché i mezzi sembrano più grandi da lontano? Come leggo il numero della linea?

Con la mappa vista dall'alto i mezzi sono rettangoli; con la mappa inclinata sono volumi. Da lontano i mezzi vengono ingranditi, altrimenti non si vedrebbero: più ci si avvicina, più tornano alla scala reale (un autobus lungo circa 12 metri, un tram circa 30, un treno circa 70). Il numero accanto al mezzo è quello della linea. Per vederli tra gli edifici si usa il percorso «Mezzi in movimento (3D)», che accende anche gli edifici 3D e il terreno. Per tutto il resto del 3D vedi `39-strati-in-3d.md`.

---

## Avvertenze sulla simulazione

Parole chiave: avvertenze, ritardi, traffico, soppressioni, posizioni teoriche, attendibilità, crediti, ispirata.

Domande tipiche: Posso fidarmi della posizione del mio autobus? La simulazione mostra i ritardi? Posso usarla per sapere quando passa il bus?

No: la simulazione è una visualizzazione dimostrativa degli orari programmati, non un servizio per sapere dove si trova davvero un mezzo né quando passerà. Per le partenze di una fermata o di una linea si usa la scheda (vedi `24-scheda-fermate-e-linee.md` e `34-orari-e-percorsi-del-trasporto.md`). L'avvertenza completa è anche nella pagina Fonti.

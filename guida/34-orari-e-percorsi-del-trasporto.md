# Orari, partenze e percorsi nella scheda del trasporto pubblico

## Il selettore del giorno e la validità degli orari

Parole chiave: selettore del giorno, data, orari validi, fuori validità, feed AMAT, feed Trenitalia, orari non disponibili, in caricamento.

Domande tipiche: Come cambio giorno agli orari? Perché mi mostra una data diversa da oggi? Perché dice «Orari in caricamento…»?

Nelle schede di fermate e linee gli orari si scaricano solo alla prima apertura: finché non arrivano la scheda dice «Orari in caricamento…»; se il caricamento fallisce dice «Orari non disponibili» con il motivo.

Sopra gli orari c'è il campo **«Giorno»**, un selettore di data. Il giorno iniziale è oggi se rientra nel periodo di validità del feed di quella fermata. Altrimenti la scheda mostra il **primo giorno valido** e avvisa: «Gli orari valgono dal [data] al [data]: mostro il primo giorno valido.» Il selettore non permette date fuori dal periodo di validità. Le fermate AMAT (bus e tram) e le stazioni ferroviarie (Trenitalia) hanno feed con periodi diversi: ogni fermata usa quello suo.

---

## La scheda degli orari di una fermata

Parole chiave: prossime partenze, prime partenze del giorno, tutti gli orari del giorno, capolinea di sola arrivo, nessuna corsa, orario dopo mezzanotte (+1).

Domande tipiche: Come vedo le prossime partenze? Perché dice «Capolinea di sola arrivo»? Cosa vuol dire «(+1)» accanto all'ora?

Nella scheda di una fermata, sotto le righe, ci sono gli orari del giorno scelto:
- Se il giorno è **oggi**, il blocco **«Prossime partenze»** elenca le prossime 8 partenze dall'ora attuale. Se non ce ne sono più dice «Nessun'altra partenza oggi.»
- Se il giorno è **un altro**, il blocco si chiama **«Prime partenze del giorno»** e mostra le prime 8.
- Ogni partenza ha il riquadro colorato con il numero della linea, la destinazione («→ [capolinea]») e l'ora.
- Sotto c'è la sezione a scomparsa **«Tutti gli orari del giorno (N)»**: per ogni linea e direzione, tutte le ore in fila.
- Se in quel giorno non ci sono corse, dice «Nessuna corsa in questa data.»

Le ore sono quelle dei feed (orari programmati). Una corsa dopo mezzanotte appartiene al giorno di servizio precedente e ha il segno **(+1)** accanto all'ora (per esempio «00:30 (+1)»). Nel giorno scelto compaiono anche le corse del giorno prima che arrivano dopo la mezzanotte.

Un **capolinea di sola arrivo** lo dice: «Capolinea di sola arrivo: da qui non partono corse. Gli orari sono alla fermata di partenza.» Il feed ha solo le partenze, quindi non è un «nessuna corsa».

Le **stazioni in apertura** non hanno orari: la scheda dice «Stazione in apertura: non è ancora in servizio, quindi non ci sono orari. Compare qui perché è già presente in OpenStreetMap.»

---

## La scheda degli orari di una linea

Parole chiave: corse al giorno, primo passaggio, ultimo passaggio, frequenza media, ogni N minuti, direzioni, linea.

Domande tipiche: Quante corse fa una linea? A che ora passa la prima e l'ultima? Ogni quanto passa?

Aprendo una linea compare, per ogni direzione («[da] → [a]»), un riepilogo del giorno scelto:
- **Corse al giorno**.
- **Primo passaggio al capolinea** e **Ultimo passaggio al capolinea**.
- **Frequenza media**: «ogni N min» (solo se la linea ha più di una corsa).

Il riepilogo è misurato alla prima fermata della linea; se lì in quel giorno non parte nulla (è il capolinea di una variante) si usa la fermata della linea con più partenze. Se non ci sono corse in quel giorno dice «Nessuna corsa in questa data.»

Quando sotto il clic ci sono più linee, la scheda ha un **elenco di linee** a scomparsa: ogni linea ha il riquadro con il numero e il nome; direzioni e orari si costruiscono alla prima apertura. Se la linea è una sola, è già aperta. Aprire una linea (se sono più d'una) la mostra sulla mappa.

---

## Le fermate in sequenza e i cambi

Parole chiave: fermate in sequenza, schema a striscia, cambi, capolinea, Fermate (N), mostra il percorso della linea.

Domande tipiche: Come vedo tutte le fermate di una linea? Cosa sono i riquadri accanto al nome della fermata?

In ogni linea la sezione a scomparsa **«Fermate (N)»** mostra le fermate in sequenza come uno schema a striscia: la linea nel suo colore, un pallino per fermata, i capolinea più grandi e in grassetto. Accanto al nome ci sono i riquadri colorati con il numero delle **altre linee che vi passano** (i cambi).
- Un clic sul **nome** della fermata: «Mostra la fermata sulla mappa e apri la sua scheda».
- Un clic sul **riquadro** di un cambio: «Mostra il percorso della linea [numero]», cioè porta la mappa sulla fermata e disegna il percorso di quella linea («Percorso della linea [numero]»).

---

## Fermate vicine al punto cliccato

Parole chiave: fermate vicine, distanza in metri, fermata più vicina, linee della fermata.

Domande tipiche: Quanto è distante la fermata? Come passo dalla fermata alla sua scheda?

Nella sezione «Trasporto pubblico vicino» ogni fermata ha il **nome** (un pulsante che porta la mappa sulla fermata e apre la sua scheda) e la **distanza in metri** (arrotondata a 10 metri). Sotto ci sono i riquadri delle sue linee: un clic su un riquadro porta alla fermata e mostra anche il percorso di quella linea. Se la stazione è in apertura lo dice: «In apertura: non ancora in servizio».

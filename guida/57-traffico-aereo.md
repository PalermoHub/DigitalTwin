# Traffico aereo: aerei in volo attorno a Palermo

## Il layer «Aerei in volo»

Parole chiave: traffico aereo, aerei, voli, aeroporto, Punta Raisi, PMO, LICJ, adsb.lol, ADS-B, in arrivo, in partenza, in transito, a terra, quota, velocità, rotta.

Domande tipiche: Come vedo gli aerei sopra Palermo? Ogni quanto si aggiornano? Come si capisce se un aereo sta arrivando o partendo? Perché non c'è la destinazione del volo? Dove si trova l'aeroporto?

Il layer **«Aerei in volo»**, nel gruppo **«Traffico aereo»** del pannello Layer, mostra gli aerei entro **100 miglia nautiche (circa 185 km)** dall'aeroporto di Palermo Falcone e Borsellino (Punta Raisi, PMO). Quando si accende compare anche l'**aeroporto**, con il suo nome. Ogni aereo è una sagoma ruotata secondo la sua rotta e colorata per stato:
- **In arrivo** (verde): sotto i 15.000 piedi, entro 60 miglia dall'aeroporto, in discesa.
- **In partenza** (arancione): sotto i 15.000 piedi, entro 60 miglia dall'aeroporto, in salita.
- **In transito** (blu): tutti gli altri aerei, compresi quelli in crociera sopra il Tirreno.
- **A terra** (grigio): fermi sull'aeroporto.

Le caselle dello stato, nel pannello e nella legenda, mostrano o nascondono ogni gruppo.

## Aggiornamento

Parole chiave: aggiornamento, ogni 5 minuti, ricarica, Worker, adsb.lol, ora dei dati, numero di aerei.

Domande tipiche: Ogni quanto si aggiornano gli aerei? Perché non si muovono di continuo? Cosa dice la nota in legenda?

I dati non sono salvati nel sito: arrivano da un servizio (Worker) che interroga **adsb.lol** al massimo **ogni 5 minuti** per tutti gli utenti. Con il layer acceso la mappa si ricarica ogni 5 minuti (solo se la scheda del browser è in primo piano). La nota in legenda dice a che ora sono stati letti i dati e quanti aerei sono in vista. Se il servizio non risponde restano gli ultimi aerei letti.

## Cosa mostrano popup e scheda

Parole chiave: popup, tooltip, matricola, modello, quota, velocità, rotta, velocità verticale, distanza dall'aeroporto, segui il volo.

Domande tipiche: Cosa mostra il popup di un aereo? A che quota vola? Dove posso seguire il volo?

Passando il mouse su un aereo compare il volo e lo stato. Con un clic si apre il fumetto con: **matricola**, **modello**, **quota** (piedi e metri), **velocità** (nodi e km/h), **rotta** in gradi, **velocità verticale** e **distanza dall'aeroporto**. Nella scheda del luogo, se l'aereo è sopra il territorio del Comune, la voce ha anche il link «Segui il volo su adsb.lol».

## Cosa tenere presente

Parole chiave: origine, destinazione, stato dedotto, aerei militari, copertura, licenza, ODbL, limiti.

Domande tipiche: Posso vedere dove va un volo? Sono mostrati tutti gli aerei? Che licenza hanno i dati?

- La fonte **non indica origine e destinazione** dei voli: lo stato «in arrivo» o «in partenza» è **dedotto** da quota, distanza e velocità verticale, quindi è indicativo.
- Gli aerei che non trasmettono ADS-B (alcuni velivoli militari) non compaiono; la copertura a bassa quota dipende dai ricevitori dei volontari.
- Fonte: adsb.lol, rete di ricevitori ADS-B di volontari, licenza ODbL 1.0.

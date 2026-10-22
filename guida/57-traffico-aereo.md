# Traffico aereo: aerei in volo attorno a Palermo

## Il layer «Aerei in volo»

Parole chiave: traffico aereo, aerei, voli, aeroporto, Punta Raisi, PMO, LICJ, adsb.lol, ADS-B, in arrivo, in partenza, in transito, a terra, quota, velocità, rotta.

Domande tipiche: Come vedo gli aerei sopra Palermo? Ogni quanto si aggiornano? Come si capisce se un aereo sta arrivando o partendo? Perché non c'è la destinazione del volo? Dove si trova l'aeroporto?

Il layer **«Aerei in volo»**, nella sezione **«Traffico aereo»** del gruppo **«Trasporti»** del pannello Layer, mostra gli aerei entro **100 miglia nautiche (circa 185 km)** dall'aeroporto di Palermo Falcone e Borsellino (Punta Raisi, PMO). Quando si accende compare anche l'**aeroporto**, con il suo nome. Ogni aereo è una sagoma ruotata secondo la sua rotta e colorata per stato:
- **In arrivo** (verde): sotto i 15.000 piedi, entro 60 miglia dall'aeroporto, in discesa.
- **In partenza** (arancione): sotto i 15.000 piedi, entro 60 miglia dall'aeroporto, in salita.
- **In transito** (blu): tutti gli altri aerei, compresi quelli in crociera sopra il Tirreno.
- **A terra** (grigio): fermi sull'aeroporto.

Le caselle dello stato, nel pannello e nella legenda, mostrano o nascondono ogni gruppo.

## Aggiornamento

Parole chiave: aggiornamento, ogni 5 minuti, ricarica, Worker, adsb.lol, ora dei dati, numero di aerei.

Domande tipiche: Ogni quanto si aggiornano gli aerei? Perché non si muovono di continuo? Cosa dice la nota in legenda?

I dati non sono salvati nel sito: arrivano da un servizio (Worker) che interroga **adsb.lol** al massimo **ogni 5 minuti** per tutti gli utenti. Con il layer acceso la mappa si ricarica ogni 5 minuti (solo se la scheda del browser è in primo piano). La nota in legenda dice a che ora sono stati letti i dati e quanti aerei sono in vista. Se adsb.lol rifiuta le richieste, il servizio ripiega su **OpenSky Network** (stessi aerei, ma senza matricola e modello); se nessuno dei due risponde restano gli ultimi aerei letti.

## Cosa mostrano popup e scheda

Parole chiave: popup, tooltip, matricola, modello, quota, velocità, rotta, velocità verticale, distanza dall'aeroporto, segui il volo.

Domande tipiche: Cosa mostra il popup di un aereo? A che quota vola? Dove posso seguire il volo?

Passando il mouse su un aereo compare il volo e lo stato. Con un clic si apre il fumetto con: **matricola**, **modello**, **quota** (piedi e metri), **velocità** (nodi e km/h), **rotta** in gradi, **velocità verticale** e **distanza dall'aeroporto**. Nella scheda del luogo, se l'aereo è sopra il territorio del Comune, la voce ha anche il link «Segui il volo su adsb.lol».

## Ritardi e orari dei voli di linea

Parole chiave: ritardo, in ritardo, cancellato, orario programmato, orario stimato, gate, arrivi, partenze, tabellone, Gesap, segnale rosso, icona dell'aeroporto.

Domande tipiche: Come vedo se un volo è in ritardo? Quanto è in ritardo? Cosa significa il pallino rosso sull'aeroporto? Come vedo gli arrivi e le partenze di oggi? Posso cliccare sull'aeroporto?

Gli orari di arrivi e partenze vengono dal sito di **Gesap**, la società che gestisce l'aeroporto di Palermo, e si aggiornano al massimo **ogni 5 minuti**.
- **Sull'aereo**: se il nominativo radio dell'aereo corrisponde al numero di un volo di linea (per esempio `RYR4342` è il volo `FR 04342`), la scheda e il popup mostrano **volo di linea e compagnia**, **ritardo** («In orario», «In ritardo di 21 min», «Cancellato»), **provenienza o destinazione**, **orario programmato**, **orario stimato** e **gate**. Se l'abbinamento non è sicuro, o l'aereo non è un volo di linea (privato, cargo, militare), questi dati non compaiono.
- **Sull'aeroporto**: un clic sull'**icona dell'aeroporto** apre il fumetto e la scheda con il riepilogo di oggi (voli in ritardo, cancellati, ritardo medio) e gli elenchi dei **prossimi 8 arrivi e partenze**, ciascuno con orario, città, ritardo e gate. L'aeroporto sta fuori dai confini del Comune, ma il clic funziona comunque. Gli elenchi si vedono anche quando nessun aereo è in vista.
- **Il pallino rosso** sull'icona dell'aeroporto compare quando c'è almeno un volo **cancellato** o in ritardo di **15 minuti o più** tra quelli non ancora conclusi.
- Un volo con meno di 5 minuti di differenza tra orario stimato e programmato è «in orario».

## Cosa tenere presente

Parole chiave: origine, destinazione, stato dedotto, aerei militari, copertura, licenza, ODbL, limiti.

Domande tipiche: Posso vedere dove va un volo? Sono mostrati tutti gli aerei? Che licenza hanno i dati?

- La fonte degli aerei (adsb.lol) **non indica origine e destinazione** dei voli: lo stato «in arrivo» o «in partenza» è **dedotto** da quota, distanza e velocità verticale, quindi è indicativo. La città di provenienza o destinazione si conosce solo per i voli di linea di Palermo riconosciuti da Gesap; per gli aerei in transito su altre rotte non si conoscono né partenza né destinazione.
- Gli aerei che non trasmettono ADS-B (alcuni velivoli militari) non compaiono; la copertura a bassa quota dipende dai ricevitori dei volontari.
- Gli orari e i ritardi vengono da una pagina del sito di Gesap, non da un'API ufficiale: se il sito cambia, i dati possono mancare per un po'.
- Fonti: adsb.lol, rete di ricevitori ADS-B di volontari, licenza ODbL 1.0; Gesap (aeroportodipalermo.it) per orari e ritardi.

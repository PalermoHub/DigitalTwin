# Traffico navale: navi nel golfo di Palermo

## Il layer «Navi»

Parole chiave: traffico navale, navi, AIS, AISStream, porto di Palermo, traghetti, golfo di Palermo, categoria, passeggeri, merci, cisterne, pesca, diporto, MMSI.

Domande tipiche: Come vedo le navi nel golfo di Palermo? Cosa significano i colori delle navi? Da dove vengono i dati?

Il layer **«Navi»**, nella sezione **«Traffico navale»** del gruppo **«Trasporti»** del pannello Layer, mostra le navi che trasmettono il segnale **AIS** nel golfo di Palermo e nelle rotte vicine. Ogni nave è una sagoma ruotata secondo la sua rotta e colorata per categoria: **passeggeri** (traghetti e crociere), **merci**, **cisterne**, **pesca**, **diporto**, **servizio** (rimorchiatori, piloti, soccorso), **militare**, **altro**. Le caselle della categoria, nel pannello e nella legenda, mostrano o nascondono ogni gruppo.

## Aggiornamento e limiti

Parole chiave: aggiornamento, ogni 5 minuti, ultimo segnale, AIS terrestre, copertura, 30 minuti, ricevitori.

Domande tipiche: Ogni quanto si aggiornano le navi? Perché una nave sparisce? Si vedono anche le navi al largo?

I dati non sono salvati nel sito: un servizio (Worker) ascolta **AISStream** ogni 5 minuti e conserva l'ultima posizione di ogni nave vista negli **ultimi 30 minuti**; la mappa si ricarica ogni 2 minuti con il layer acceso. L'AIS è **terrestre**: vicino alla costa la copertura è buona, **al largo no**. Una nave senza segnali per più di 30 minuti sparisce. Le posizioni sono quelle dell'ultimo segnale ricevuto, non una traccia continua.

## Cosa mostrano popup e scheda

Parole chiave: popup, tooltip, nome, categoria, stato, destinazione, velocità, rotta, lunghezza, MMSI, ultimo segnale, MarineTraffic.

Domande tipiche: Cosa mostra il popup di una nave? Dove va questa nave? Come la seguo?

Passando il mouse su una nave compare il nome e la categoria. Con un clic si apre il fumetto con **stato** (in navigazione, all'ancora, ormeggiata…), **destinazione** dichiarata dalla nave, **velocità**, **rotta**, **lunghezza**, **MMSI** e il tempo dall'**ultimo segnale**. Nella scheda del luogo, se la nave è nel territorio del Comune, c'è anche il link «Segui la nave su MarineTraffic».

## Cosa tenere presente

Parole chiave: dati dichiarati, destinazione, nome mancante, navi senza AIS, condizioni d'uso, AISStream, beta.

Domande tipiche: Sono mostrate tutte le navi? I dati sono affidabili? Che condizioni d'uso hanno?

- Destinazione, nome e tipo li **dichiara la nave** con il suo transponder: possono mancare o essere vecchi.
- Le navi senza AIS non compaiono. Il servizio AISStream non dà garanzie di disponibilità e **non indica una licenza dei dati**: le condizioni d'uso sono da verificare.

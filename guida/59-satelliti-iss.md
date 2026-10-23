# Satelliti e ISS: il cielo di Palermo

## Il layer «Satelliti e ISS»

Parole chiave: satelliti, ISS, Stazione Spaziale Internazionale, cielo, radar, orizzonte, passaggio, Tiangong, CelesTrak, traffico spaziale.

Domande tipiche: Come vedo l'ISS sopra Palermo? Cosa mostra il layer dei satelliti? Quando passa la Stazione Spaziale?

Il layer **«Satelliti e ISS»**, nella sezione **«Traffico spaziale»** del gruppo **«Trasporti»** del pannello Layer, disegna il **cielo di Palermo come un radar**: il centro è lo zenit (sopra la testa), il cerchio esterno è l'**orizzonte** e il nord è in alto, con le lettere N, E, S, O. I cerchi tratteggiati intermedi sono i 30° e i 60° di altezza. Sono mostrati solo i satelliti **sopra l'orizzonte**: le **stazioni spaziali** (ISS e Tiangong) e i **più luminosi**. Le caselle del gruppo, nel pannello e nella legenda, mostrano o nascondono ogni insieme.

## Dove si vede il satellite

Parole chiave: posizione, radar, azimut, altezza, punto sotto il satellite, mappa, ISS, prossimo passaggio, arco tratteggiato.

Domande tipiche: Perché il satellite non è dove passa davvero? Cos'è la linea tratteggiata? Dove devo guardare?

Il punto sul radar **non è il punto della Terra** sotto il satellite, che quasi sempre sta fuori dalla mappa: è **dove lo si vede nel cielo**. Più è vicino al centro, più è alto; la direzione è quella in cui guardare (est a destra, nord in alto). La linea tratteggiata arancione è il **prossimo passaggio dell'ISS**. La posizione vera (latitudine e longitudine sotto il satellite) è nella riga **«Sorvola»** della scheda. Con il layer acceso, in basso a sinistra, il riquadro **«Prossimo passaggio dell'ISS»** dice **quando** guardare e **dove**: tra quanto passa, da quale direzione sorge, a che altezza culmina e dove tramonta, con la durata. Per vedere **dove sono davvero** sulla Terra, con il layer acceso compare in basso a sinistra la mini-mappa **«Satelliti nel mondo»**: ogni punto è un satellite, quelli grandi con il bordo bianco sono sopra l'orizzonte di Palermo, la linea tratteggiata arancione è la **traccia a terra dell'ISS** (45 minuti prima e dopo) e il cerchio rosso è Palermo.

## Aggiornamento e limiti

Parole chiave: aggiornamento, ogni secondo, elementi orbitali, SGP4, 2 ore, precisione, visibile a occhio nudo.

Domande tipiche: Ogni quanto si aggiornano le posizioni? Quanto sono precise? Un satellite sopra l'orizzonte si vede a occhio nudo?

Gli **elementi orbitali** arrivano da **CelesTrak** tramite un servizio (Worker) che li rinnova ogni 2 ore; le posizioni le calcola il browser ogni **secondo** (modello SGP4). Con il layer spento non si conservano posizioni: un satellite si muove a circa 7 km al secondo. Un satellite **sopra l'orizzonte non è per forza visibile**: serve che sia notte e che il satellite sia illuminato dal Sole. Se gli elementi hanno più di 14 giorni la scheda lo segnala, perché la posizione diventa meno precisa. Il passaggio è calcolato per un'altezza di almeno 10° sull'orizzonte.

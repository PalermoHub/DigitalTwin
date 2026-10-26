# Terremoti in tempo reale

## Il layer «Terremoti in tempo reale»

Parole chiave: terremoto, sisma, scossa, magnitudo, epicentro, INGV, sismico, tremore, ultime scosse.

Domande tipiche: C'è stato un terremoto oggi? Dove sono state le ultime scosse? Quanto è forte stata l'ultima scossa vicino a Palermo? Come si leggono i cerchi?

Nel pannello Layer, nel gruppo **«Territorio»**, sezione **«Terremoti»**, lo strato **«Terremoti in tempo reale»** mostra i **terremoti** (all'inizio degli ultimi 7 giorni, fino a 30) attorno a Palermo, nella Sicilia e nel Tirreno meridionale (l'area che la mappa permette di vedere), a partire da magnitudo 1. Ogni **cerchio** è un evento: **più è grande, più è forte la magnitudo**. Il **colore** dice da quanto è successo: **rosso** nell'ultima ora, **arancione** nelle ultime 24 ore, **blu** da più di 24 ore. Nella legenda due menu filtrano per **periodo** (24 ore, 7 o 30 giorni) e per **magnitudo minima**. I dati si rinnovano ogni **2 minuti** finché lo strato è acceso.

## I dettagli di una scossa

Parole chiave: clic, profondità, distanza da Palermo, zona, ora, scheda dell'evento.

Domande tipiche: Come vedo la profondità di un terremoto? A quanti chilometri da Palermo è stato? Dove trovo la pagina ufficiale dell'evento?

Con lo strato acceso, un **clic su un cerchio** apre una scheda con **magnitudo**, **ora locale** (e quanto tempo fa), **zona**, **profondità** in chilometri, **distanza da Palermo** e chi ha localizzato l'evento, con il collegamento alla pagina dell'evento sul sito dell'INGV. La scheda si apre anche per eventi lontani dal Comune.

## Fonte e limiti

Parole chiave: INGV, fonte, licenza, aggiornamento, attendibilità, revisione.

Domande tipiche: Da dove vengono i dati? Sono ufficiali? Una magnitudo può cambiare?

I dati vengono dall'**INGV** (Istituto Nazionale di Geofisica e Vulcanologia), dal servizio web FDSN, con licenza CC BY 4.0. Le localizzazioni dei primi minuti sono **automatiche e possono essere riviste**: magnitudo e posizione possono cambiare dopo la verifica dei sismologi. Il layer ha scopo **informativo**: per allerte e indicazioni di sicurezza vale solo la Protezione Civile.

Con un clic su un cerchio la scheda (tab «Luogo») mostra prima **quell'evento**, in evidenza, e sotto **«Gli altri terremoti»**: una card per evento, dal più recente, con gli stessi due filtri.

## I grafici dei terremoti e l'icona «i»

Parole chiave: grafico, icona i, informazioni, spiegazione, barre, magnitudo nel tempo, eventi accumulati, Omori, repliche, mainshock, sciame, sequenza sismica, filtro sulla mappa, slider, istogramma, energia, momento sismico, tempi tra eventi, spazio-tempo, latitudine, migrazione sciami.

Domande tipiche: Cosa significa il grafico dei terremoti? Come si legge il grafico magnitudo nel tempo? Cos'è la legge di Omori? Cosa sono le repliche e la mainshock? Come funziona lo slider del filtro sulla mappa? A cosa serve l'icona i sui grafici dei terremoti?

Ogni grafico dei terremoti ha accanto al titolo un'icona tonda **«i»**: un clic apre un riquadro con tre parti, **«Cosa rappresenta»**, **«Come funziona»** e **«Come leggerlo»**. Si chiude con **«Chiudi»** o con un clic fuori dal riquadro. I grafici sono nove.

- **«Terremoti per giorno, mese o anno»** (scheda, sezione «Terremoti nel tempo»): barre con il numero di eventi per periodo, dati INGV degli ultimi 5 anni da magnitudo 2. Il menu **«Eventi per»** sceglie giorno (30 barre), mese (24) o anno (5). Una barra diventa **rossa** (sciame) quando supera la soglia calcolata dalla mediana più 4 volte lo scarto mediano, mai sotto 6 eventi; le barre rosse consecutive formano una **sequenza** nell'elenco «Sciami e sequenze sismiche».
- **«Magnitudo nel tempo»**: uno stelo per terremoto, alto quanto la magnitudo. La scossa più forte (**mainshock**) è in rosso; gli eventi dopo di lei sono le possibili **repliche**. Un clic su uno stelo apre l'evento.
  Nel popup grande (solo desktop), accanto al grafico ci sono una **minimappa** con gli epicentri e la **scheda dell'evento** scelto con un clic. Sotto i dati dell'evento il blocco **«Nella sequenza»** dice che posto occupa tra gli eventi del grafico (per esempio «108 di 220»), quanto tempo prima o dopo la scossa più forte è avvenuto, il suo posto per magnitudo, la quota di energia rilasciata, le attese dall'evento prima e verso il successivo, quante repliche ci sono state in 24 ore e entro 50 km, una striscia con le profondità di tutta la sequenza (il cerchio grande è l'evento scelto) e i **tre eventi più vicini**, su cui un clic sposta la selezione.
- **«Eventi accumulati nel tempo»**: curva che sale di uno a ogni terremoto. La pendenza è il ritmo dell'attività: piatta = calma, ripida = molti eventi ravvicinati.
- **«Legge di Omori: repliche per giorno»**: repliche contate in giorni interi dopo la mainshock, su assi logaritmici (i giorni senza repliche non si disegnano). La retta tratteggiata è l'adattamento n ∝ t^−p (serve almeno 3 giorni con repliche): se i punti la seguono la sequenza decade in modo regolare; **p** vicino a 1 è un decadimento tipico, più alto = si spegne più in fretta. È una stima, non una previsione.
- **«Eventi per giorno»** (legenda, pannello «Filtro sulla mappa», pulsante «Grafici»): barre degli ultimi 30 giorni e **slider a due maniglie**; l'intervallo scelto filtra mappa, menu ed elenco. «Riproduci» sposta la finestra di un giorno alla volta, «Azzera» torna a tutto il periodo.
- **«Eventi per magnitudo»** (stesso pannello): istogramma a quattro classi (1–2, 2–3, 3–4, 4 o più); un clic su una colonna accende o spegne la classe sulla mappa.
- **«Rilascio cumulativo di energia»**: momento sismico accumulato nel tempo, in percentuale del totale. Ogni terremoto pesa circa 32 volte più del precedente per ogni unità di magnitudo (relazione di Hanks e Kanamori), quindi la curva è dominata dai pochi eventi grandi, a differenza del conteggio. La nota dà la magnitudo equivalente a un unico terremoto e il peso del più forte.
- **«Tempi tra eventi successivi»**: istogramma delle attese tra un evento e il successivo, da meno di un minuto a oltre un anno (in rosso le attese sotto il giorno). Distingue gli sciami (molte attese brevi) dall'attività di fondo; il coefficiente di variazione vale circa 1 se gli eventi arrivano a caso, di più se sono raggruppati.
- **«Diagramma spazio-tempo»**: tempo in orizzontale, latitudine in verticale, un cerchio per evento (più grande = più forte, rosso il più forte). Mostra se uno sciame migra verso nord o sud; è la latitudine, non la distanza lungo una faglia. Un clic apre l'evento.

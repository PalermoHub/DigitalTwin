# Tema dell'interfaccia e colori degli strati

## Il pannello «Tema dell'interfaccia»

Parole chiave: tema, tema dell'interfaccia, cambiare i colori, tema scuro, tema chiaro, personalizzare, temi pronti, tab Tema, barra di destra.

Domande tipiche: Come cambio i colori del sito? Dove si trova il tema scuro? Il mio tema resta salvato? Come torno ai colori originali?

Il pannello **«Tema dell'interfaccia»** si apre dal tab **Tema** della barra di destra (accanto a Scheda, RNDT e Geoimage). Cambia i colori e il testo di **tutta l'applicazione**, non solo della mappa. Ogni scelta ha l'**anteprima immediata**. In alto c'è una riga di stato: «Scegli un tema pronto o regola i colori: l'anteprima è immediata.»; dopo una scelta dice «Tema attivo: [nome]. Resta salvato in questo browser.» oppure «Tema personalizzato attivo; resta salvato in questo browser.»

Il pannello ha quattro sezioni: **Temi pronti**, **Colori**, **Testo** e **File sul computer**. Il pulsante con la luna nella barra degli strumenti è un'altra via: passa dal tema chiaro al tema scuro e, se c'era un tema personalizzato, lo toglie e torna ai colori standard.

---

## Temi pronti

Parole chiave: temi pronti, chiari, scuri, accessibilità, alto contrasto, daltonici, mostra altri, Mare, Bosco, Seppia, Notte blu, Terminale.

Domande tipiche: Quali temi ci sono? C'è un tema per daltonici? C'è un tema ad alto contrasto?

I temi pronti hanno una miniatura e sono divisi in tre gruppi:
- **Chiari**: Chiaro, Mare, Bosco, Seppia, Lavanda, Grigio, Carta, Menta, Rosa antico, Alba.
- **Scuri**: Scuro, Notte blu, Tramonto, Grafite, Oceano, Viola notte, Terminale.
- **Accessibilità**: **Alto contrasto**, **Daltonici: rosso-verde** (per chi confonde il rosso con il verde) e **Daltonici: blu-giallo** (per chi confonde il blu con il giallo). Questi tre sono sempre tutti in vista.

Nei gruppi Chiari e Scuri si vedono i primi quattro temi; il pulsante «Mostra altri [n]» mostra gli altri e «Mostra meno» li richiude. Il tema attivo è segnato; se è tra quelli nascosti il gruppo si apre da solo. Un clic su un tema lo applica subito.

I due temi per daltonici usano una palette pensata per questo scopo e cambiano anche i colori di esito positivo, errore, avvisi, particella cercata e valori nei grafici, che non sono più verde e rosso.

---

## Colori di base e avanzati

Parole chiave: sfondo, testo, accento, link, bordi e linee, esadecimale, contrasto, correggi, colori avanzati, esito positivo, errore e allarme, fondo degli avvisi, particella cercata, valori nei grafici.

Domande tipiche: Come scelgo un colore preciso? Cosa vuol dire l'avviso sul contrasto? A cosa servono i colori avanzati?

La sezione **«Colori»** ha un'anteprima viva (una miniatura dell'interfaccia) e cinque colori di base:
**Sfondo**, **Testo**, **Accento**, **Link** e **Bordi e linee**.

Ogni colore si sceglie con il selettore del browser oppure scrivendo il **codice esadecimale** (con o senza #). Finché il codice non è valido il campo segna l'errore e il tema non cambia.

**Controllo del contrasto.** Per **Testo** e **Link** l'app misura il contrasto con lo sfondo. Se è troppo basso compare l'avviso «Contrasto [n]:1 sullo sfondo: ne servirebbe almeno 4.5:1 per leggere bene.» con il pulsante **«Correggi»**, che porta il colore al più vicino che raggiunge il minimo.

**Colori avanzati** (sezione a scomparsa «Colori avanzati»): colori di stato e di evidenza. Se non li scegli, usano quelli standard del tema chiaro o scuro. Sono cinque:
- **Esito positivo**: messaggi di conferma e interruttori attivi.
- **Errore e allarme**: errori, allarmi e azioni che cancellano.
- **Fondo degli avvisi**: lo sfondo dei banner gialli.
- **Particella cercata**: il contorno della particella catastale cercata.
- **Valori nei grafici**: barre e linee dei grafici nelle schede.

Il pulsante «Ripristina colori avanzati» compare solo se ne hai cambiato qualcuno. Dai cinque colori di base l'app ricava da sola gli altri (sfondi secondari, testo attenuato, bordi, evidenziazione, fumetti).

Se il colore di sfondo scelto è scuro, l'app porta in automatico anche il pulsante chiaro/scuro (logo, mappa di base e intestazione) in accordo con il tema.

---

## Testo: dimensione e carattere

Parole chiave: dimensione del testo, ingrandire il testo, carattere, font, Montserrat, Georgia, Atkinson Hyperlegible, alta leggibilità, spaziatura fissa.

Domande tipiche: Come ingrandisco il testo? Posso cambiare il carattere? C'è un carattere per chi ha difficoltà di lettura?

La sezione **«Testo»** ha:
- **Dimensione del testo**: un cursore da **85 % a 150 %**, a passi del 5 %. Il 100 % è lo standard e il cursore scala tutta l'interfaccia.
- **Carattere**: **Montserrat (standard)**, **Carattere del sistema**, **Con grazie (Georgia)**, **A spaziatura fissa** e **Atkinson Hyperlegible (alta leggibilità)**.
- Un'anteprima («Palermo Digital Twin: 0123456789 — Anteprima del testo»).
- Il pulsante **«Ripristina testo standard»**, attivo solo se qualcosa è diverso dallo standard.

---

## Salvare, caricare e ripristinare il tema

Parole chiave: salva su file, carica da file, file JSON, ripristina colori standard, annulla, altro dispositivo, privacy tema.

Domande tipiche: Il tema viene inviato a qualcuno? Come lo uso su un altro dispositivo? Come lo tolgo? Posso tornare indietro se lo tolgo per sbaglio?

La sezione **«File sul computer»** ha:
- **Salva su file**: salva il tema in un file `.json` sul computer (il nome proposto è `tema-digital-twin.json`; dove il browser lo permette si apre la finestra «Salva con nome»).
- **Carica da file**: legge un tema da un file `.json`. Se il file non è un JSON, non è un tema dell'interfaccia o non contiene colori validi, l'app lo segnala.
- **Ripristina colori standard**: toglie il tema personalizzato e torna ai colori dell'app.

La nota dice: «Il tema si salva in un file sul tuo computer: non viene inviato a nessuno. Puoi ricaricarlo qui o su un altro dispositivo.» Il tema attivo resta anche **salvato nel browser** e si ritrova alla visita successiva; se il browser non può salvare, vale per la sessione.

Dopo aver tolto il tema personalizzato (con «Ripristina colori standard» o con l'interruttore chiaro/scuro) compare per circa otto secondi il pulsante **«Annulla»** per recuperarlo.

---

## Colorare uno strato: riempimento, bordo, spessore

Parole chiave: colori dello strato, tavolozza, riempimento, bordo, spessore, colore per categoria, ripristina, esporta JSON, importa JSON.

Domande tipiche: Come cambio il colore di un layer? Come torno allo stile originale? Come condivido i colori di un layer?

Accanto a ogni strato il pulsante con la **tavolozza** («Colori di [nome strato]») apre un pannellino (compare solo se lo strato ha poligoni, punti o linee). Contiene, quando servono:
- **Riempimento** e **Bordo** (colore); per le linee **Colore linea** e **Spessore** (cursore da 0 a 6, a passi di 0,5).
- **Colori per categoria**: un colore per ogni categoria dello strato; i pallini delle legende seguono il colore scelto.
- **Colora per attributo** (vedi sotto).
- **Ripristina** (torna allo stile originale: «Stile originale ripristinato»), **Esporta JSON** (esporta i temi di tutti gli strati) e **Importa JSON**.

Il tema di ogni strato si salva nel browser. Se il file importato non è valido, l'app lo segnala («File non valido: non è un JSON», «non è un tema di strati» o «Il file non contiene temi validi»).

---

## Colora per attributo: categorie e graduata

Parole chiave: colora per attributo, per categorie, graduata, quantili, intervalli uguali, rampa, ColorBrewer, Crameri, inverti la scala dei colori, rileva valori, campo, classi, legenda del tema.

Domande tipiche: Come coloro gli edifici per densità? Cosa sono quantili e intervalli uguali? Cosa vuol dire «Rileva valori»? Cosa sono le rampe Crameri?

Nel pannellino dei colori la sezione **«Colora per attributo»** colora gli elementi secondo un campo dei dati. Si sceglie:
- **Tipo**: **Nessuno**, **Per categorie** (un colore per ogni valore del campo) o **Graduata (numerico)** (divide un campo numerico in classi).
- **Campo**: il campo dei dati. Il pulsante **«Rileva valori»** legge i valori degli elementi che sono in vista; se non c'è nessun elemento in vista l'app dice di accendere lo strato e inquadrare l'area, poi «Rileva valori».
- Per la graduata: **Metodo** (**Quantili**, stesso numero di elementi per classe, oppure **Intervalli uguali**) e **Classi** (fino a nove; se i valori sono troppo simili per formare classi lo dice).
- **Rampa**: i colori. Gruppi: **ColorBrewer** (Blu, Verde, Arancio, Viola, Rosso-Verde), **Crameri · sequenziali** (Batlow, Acton, Bamako, Bilbao, Davos, Devon, Lajolla, Lapaz, Oslo, Tokyo, Turku) e **Crameri · divergenti** (Bam, Broc, Cork, Roma, Vik), che servono «un valore di riferimento». Le scale di Crameri sono uniformi per percezione e adatte anche al daltonismo.
- **Inverti la scala dei colori**: legge la rampa dal fondo.

Per le categorie, oltre 200 valori distinti l'app suggerisce un altro campo o la graduata. Sulla mappa, in basso a sinistra, compare la **legenda del tema** quando lo strato è acceso; per gli strati con legenda integrata cambiano solo i colori della legenda.

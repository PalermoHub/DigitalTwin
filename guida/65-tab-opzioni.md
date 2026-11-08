# Il tab «Opzioni»

## A cosa serve e come si apre

Parole chiave: opzioni, tab Opzioni, impostazioni, ingranaggio, cruscotto, preferenze, barra a sinistra, salvate nel browser, ripristina predefiniti.

Domande tipiche: Dove sono le impostazioni della mappa? Come apro il tab Opzioni? Le mie scelte restano salvate? Come riporto tutto come all'inizio?

Il tab **«Opzioni»** (icona a **ingranaggio**) sta nella barra verticale a sinistra e raccoglie in un solo posto le impostazioni di come si comporta la mappa. Si apre con un clic sul tab; un secondo clic, oppure Esc, lo ripiega. In cima una riga dice: «Imposta come si comporta la mappa. Le scelte restano salvate in questo browser.» Le scelte durano **finché non si cancellano i dati del browser** (cronologia e dati dei siti); se il browser blocca il salvataggio, valgono solo per la sessione.

Sotto la riga ci sono **tre sezioni** ripiegabili: «Overlay informativi», «Raggio dei dintorni» e «Selezione in mappa». Ognuna ha un'icona, il titolo, una descrizione breve e, a destra, un **riepilogo di stato** (per esempio «2/3», «300 m», «33/33»). Un clic sul titolo la ripiega o la riapre; all'apertura sono tutte aperte. In fondo alle sezioni «Raggio dei dintorni» e «Selezione in mappa» c'è il pulsante **«Ripristina predefiniti»**.

Il tab Opzioni e i comandi che stanno sulla mappa (legenda «Selezione in mappa», Live Zoom, raggio) mostrano **sempre lo stesso stato**: cambiare l'uno aggiorna subito l'altro, senza ricaricare la pagina.

---

## Sezione «Overlay informativi»

Parole chiave: overlay informativi, tooltip sulla mappa, legende sulla mappa, Live Zoom, interruttori, fumetto, zoom automatico, cosa appare sopra la mappa.

Domande tipiche: Come spengo i fumetti? Dove sono finite le legende? Cos'è Live Zoom e come lo spengo? Perché la mappa zooma da sola?

Descrizione: «Cosa appare sopra la mappa». Contiene **tre interruttori**, ognuno con icona, titolo e una riga di spiegazione:

- **«Tooltip sulla mappa»** («Fumetto con i dettagli al passaggio del mouse»). **Acceso all'inizio.** Spento, passando il mouse sulla mappa non compare nessun fumetto (vedi `46-selezione-in-mappa-raggio-e-fumetti.md`).
- **«Legende sulla mappa»** («Legende degli strati accesi nell'angolo della mappa»). **Spento all'inizio.** Acceso, le legende degli strati accesi stanno nell'angolo della mappa; spento, ogni legenda resta solo **sotto il proprio strato** nel pannello Layer, come nei programmi GIS (vedi `45-barra-strati-legende-e-ordine.md`).
- **«Live Zoom»** («La mappa zooma da sola sul punto cliccato»). **Acceso all'inizio.** Acceso, dopo un clic la mappa zooma sul punto e si adatta ai risultati a ogni modifica del filtro; spento, il clic centra soltanto.

Il riepilogo a destra del titolo conta gli interruttori accesi su tre: all'inizio **«2/3»**. Questa sezione non ha il pulsante «Ripristina predefiniti».

---

## Sezione «Raggio dei dintorni»

Parole chiave: raggio dei dintorni, raggio, punti vicini, metri, cursore, cerchio tratteggiato, mostra il cerchio in mappa, area cercata al clic, 300 metri.

Domande tipiche: Come cambio la distanza entro cui la scheda cerca i punti vicini? Come tolgo il cerchio tratteggiato? Qual è il raggio iniziale? Come torno a 300 metri?

Descrizione: «Area cercata al clic». Ha lo **stesso cursore e lo stesso interruttore** del riquadro sulla mappa:

- il cursore **«Raggio intorno al clic: [n] m»** va da **100 a 500 metri** a passi di 50 e parte da **300 metri**; vale per tutti i layer a punti (fermate, distributori, colonnine e gli altri);
- l'interruttore **«Mostra il cerchio in mappa»**, acceso all'inizio, disegna attorno al clic un cerchio tratteggiato di quel raggio.

Cambiando il raggio o il cerchio la scheda aperta si rifà subito. Il riepilogo a destra del titolo mostra il raggio in metri (per esempio «300 m»). **«Ripristina predefiniti»** riporta il raggio a 300 metri e riaccende il cerchio. Per i dettagli sui punti vicini vedi `46-selezione-in-mappa-raggio-e-fumetti.md`.

---

## Sezione «Selezione in mappa»

Parole chiave: selezione in mappa, cosa evidenzia il clic, dettagli al passaggio, tutte le voci, voci evidenziabili, aree evidenziate, spegnere una voce, legenda della selezione, ripristina.

Domande tipiche: Come tolgo l'evidenziazione di una categoria dopo il clic? Come spengo tutte le voci insieme? Cosa sono «Dettagli al passaggio» e «Tutte le voci»? Perché una voce non compare più nella legenda?

Descrizione: «Cosa evidenzia il clic». La sezione ha:

- **«Dettagli al passaggio»** («Fumetto sulle aree evidenziate»): acceso all'inizio; spento, le aree evidenziate dopo un clic non mostrano il fumetto al passaggio del mouse.
- **«Tutte le voci»** («Accende o spegne l'intero elenco»): è acceso quando sono accese tutte le voci; un clic le accende o le spegne tutte insieme.
- **L'elenco delle voci**, una riga per **ogni cosa che il clic può evidenziare** (Edificio, Particella catastale, Zona PRG, Zona OMI, Monumento, Fermata, Opera pubblica e le altre), in **ordine alfabetico**, anche quando non c'è nessuna selezione. Ogni riga ha il suo **simbolo e colore** (la sagoma dell'icona per i layer a punti con icona, un cerchio per gli altri punti, un quadrato per le aree) e un interruttore.
- Una nota: le **voci spente non vengono disegnate in mappa né elencate nella legenda «Selezione in mappa»**.

Il riepilogo a destra del titolo dice quante voci sono accese su quante (all'inizio tutte, per esempio «33/33»). **«Ripristina predefiniti»** riaccende i dettagli al passaggio e tutte le voci. Le stesse voci si accendono e si spengono anche dalle caselle della legenda «Selezione in mappa» sulla mappa: i due comandi sono sincronizzati. Come funziona la selezione dopo un clic: vedi `46-selezione-in-mappa-raggio-e-fumetti.md`.

---

## Valori iniziali e dove restano salvate le scelte

Parole chiave: valori iniziali, predefiniti, impostazioni salvate, localStorage, cancellare i dati del browser, riparto da capo, modalità privata.

Domande tipiche: Quali sono i valori iniziali delle opzioni? Dove vengono salvate le mie scelte? Perché le opzioni tornano ai valori iniziali? Funzionano in navigazione privata?

| Impostazione | Valore iniziale |
|---|---|
| Tooltip sulla mappa | acceso |
| Legende sulla mappa | spento |
| Live Zoom | acceso |
| Raggio dei dintorni | 300 m (da 100 a 500, passi di 50) |
| Mostra il cerchio in mappa | acceso |
| Dettagli al passaggio (selezione) | acceso |
| Voci della selezione | tutte accese |

Le scelte sono salvate **nel browser che stai usando** (non sul server): cambiando browser o dispositivo si riparte dai valori iniziali. Se si cancellano i dati dei siti, o se il browser blocca il salvataggio (per esempio in alcune modalità private), le impostazioni valgono solo per la sessione in corso e al ritorno tornano quelle iniziali.

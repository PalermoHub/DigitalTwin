# Condividi questa vista

## Cosa fa il pulsante «Condividi questa vista»

Parole chiave: condividi, link, condividere la mappa, copia link, WhatsApp, Telegram, Facebook, X, LinkedIn, email, vista condivisa.

Domande tipiche: Come mando a qualcuno la mia vista? Che cosa contiene il link? Posso condividere sui social?

Il pulsante **«Condividi questa vista»** nella barra degli strumenti apre una finestra con il **link alla vista corrente**. Il campo con il link è già selezionato. I comandi:
- **Copia**: copia il link negli appunti. Il pulsante dice «Copiato» per un istante; se il browser non permette la copia diretta dice «Seleziona e copia».
- **Condividi…**: compare solo sui dispositivi il cui browser ha il menu di condivisione nativo.
- Le icone per condividere il link su **WhatsApp, Telegram, Facebook, X, LinkedIn** e per inviarlo per **Email** («Condividi su [rete]»). Il testo proposto è «Palermo Digital Twin: la mia vista della mappa».

Si chiude con la X, con **Esc** o cliccando fuori. Chi apre il link vede la stessa vista.

---

## Cosa contiene il link

Parole chiave: stato condiviso, posizione, zoom, strati accesi, mappa di base, opacità, filtri, tema, link troppo lungo, layer propri non condivisi.

Domande tipiche: Il link conserva i layer accesi? Perché il mio layer non compare per chi riceve il link? Cosa vuol dire «La vista è molto ricca»?

Il link contiene lo **stato visibile** dell'app:
- **posizione, zoom, rotazione e inclinazione** della mappa;
- gli **strati accesi** e la loro **opacità** (se inferiore al massimo);
- la **mappa di base** scelta;
- i **filtri** per circoscrizione, quartiere o UPL, per linea del trasporto e per anno e gravità degli incidenti;
- il **tema chiaro o scuro**;
- alcune preferenze salvate nel browser: i colori scelti per gli strati, l'ordine dei layer e quello di disegno, e i layer aggiunti da catalogo RNDT, «I miei layer» e servizi (vedi sotto).

Chi apre il link vede quello stato riapplicato come se avesse fatto lui i clic. Se il link nomina strati o sfondi che nell'app non esistono più, l'app li ignora.

**Cosa non viaggia nel link.** Dei layer aggiunti dall'utente va solo ciò che il destinatario può riaprire da un **indirizzo pubblico**: non vanno i file caricati dal computer, né i servizi con utente e password o con token, né indirizzi con parametri che sembrano segreti (token, chiave, password, firma). La finestra lo dice: «[n] layer aggiunti da te (file o servizi con credenziali) non sono nel link.»

**Link troppo lungo.** Il link ha una lunghezza massima: se la vista è molto ricca, i colori personalizzati e i layer aggiunti possono essere tolti e la finestra avvisa «La vista è molto ricca: colori personalizzati o layer aggiunti non sono nel link.» Lo stato è compresso (formato `v1z.`, con ripiego in JSON se il browser non sa comprimere). Un link troppo lungo o non valido viene ignorato all'apertura.

---

## Condividere una scheda aperta

Parole chiave: link alla scheda, punto cliccato, scheda condivisa, tab della scheda, parametro scheda.

Domande tipiche: Se condivido il link con la scheda aperta, chi lo riceve la vede? Il tab scelto resta?

Quando si apre la scheda del luogo, l'indirizzo del browser si aggiorna con il punto cliccato e il tab scelto. Aprendo un link che contiene un punto della scheda, l'app, dopo il primo caricamento dei dati, **riapre la scheda in quel punto** (e sul tab indicato).

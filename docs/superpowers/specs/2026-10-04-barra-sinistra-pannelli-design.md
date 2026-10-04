# Barra sinistra a pannelli, come quella di destra

Data: 2026-10-04 · Branch: rndt-catalogo

## Obiettivo
La barra degli strati a sinistra assume lo stesso linguaggio della barra di destra (Scheda, RNDT): ogni gruppo
(Mappa, Popolazione, Confini…) è un tab, e i suoi sotto-menu si aprono dentro un pannello ancorato a tutta altezza,
non in una card flottante. Solo desktop (>720px). Su mobile restano il pulsante «Strati» e il bottom sheet.

Successo: aprendo un tab compare il pannello accanto alla barra con tutto il contenuto che oggi sta nel
`.sotto-pannello`; la mappa, la ricerca e le legende si riposizionano; nessuna funzione degli strati cambia.

## Design

### Barra
- `#barra-strati` (desktop): striscia a tutta altezza larga `--rail-w` (44px), bordo destro, niente card né titolo «Strati».
- Ogni gruppo è un tab con la stessa classe/stile di `.rail-tab`: icona in alto, testo verticale ruotato. Lo stile è condiviso, non copiato.
- Il pallino con il conteggio (`data-attivo`, `data-n`) resta sul tab. Se i tab non entrano in altezza, la barra scorre.

### Pannello
- `#pannello`: `top:0; bottom:0; left:var(--rail-w); width:var(--pannello-w)` (280px: i gruppi hanno liste corte), angoli vivi, ombra laterale, fondo opaco.
- Il `.sotto-pannello` attivo riempie il pannello senza card interna; `h2` come intestazione, corpo scorrevole.
- Contenuto invariato: strati, «Cerca strato», sezioni, filtri (colonnine, uffici, popolazione).
- Un solo gruppo aperto alla volta. Secondo clic sul tab attivo ripiega il pannello. Il clic fuori non chiude più
  (rimuovere il listener `pointerdown` in `js/core/pannello.js`).

### Layout mappa
- `--sx`: `--rail-w` a pannello chiuso, `--rail-w + --pannello-w` con un gruppo aperto, impostato con `body:has(...)`.
- Gli offset fissi (`left:112px` di legende, avviso fisso, chip strati; i 104px dell'area ricerca) diventano `var(--sx) + 12px`.
  Ricerca e barra strumenti si centrano tra `--sx` e `--scheda-l`. I controlli MapLibre in basso a sinistra seguono `--sx`.

### Sinistra e destra insieme
- Sotto 1280px di larghezza aprire un pannello ripiega l'altro; sopra, possono stare aperti insieme.

### Mobile (≤720px)
- Invariato: `body.strati-aperti`, `#apri-strati`, bottom sheet.

## Approccio
Solo CSS e markup, con piccoli ritocchi a `js/core/pannello.js` (niente chiusura al clic fuori, ripiegamento incrociato
sotto 1280px). Riuso di `.rail-tab` e di `--sx`. Scartato: estendere `rail.js` a due lati (logica diversa, pannelli già costruiti).

## Test e documenti
- Aggiornare in `tests/test_viewer.py` i test che puntano ai sotto-pannelli flottanti
  (es. `test_mobile_barra_verticale_a_sinistra_e_desktop_orizzontale`).
- Aggiornare `docs/` e `js/core/guida-contenuti.js`; rigenerare gli screenshot della guida.
- Verifica nel browser limitata se Chrome/Playwright non sono disponibili; restano i test JS e Python.

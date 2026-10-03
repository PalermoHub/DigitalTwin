# Analisi design — Digital Twin Palermo

Data: 2026-10-01

Basata su `css/app.css`, `index.html`, `js/core/scheda.js`, `js/core/pannello.js`, `js/core/palette.js`, su uno screenshot della scheda e su un grep dei colori e degli stili inline nei JS. L'app non è stata aperta nel browser: sovrapposizioni e contrasti sono calcolati dal codice.

## Impressione generale

La base è buona. La barra a pillola, le icone SVG e il selettore di base con miniature sono coerenti. La scheda ha gerarchia leggibile e badge di classe utili. Il problema è che l'app è cresciuta a strati. Ci sono due sistemi di colore, due famiglie di icone e un CSS con regole duplicate. In più, la scheda a due colonne misurata via JS è fragile.

## 1. Uniformità: token e sistema visivo

| Area | Problema | Fix |
|---|---|---|
| **Colori accento** | Due arancioni: `--marca #d9731a` (scheda) e `--arancio #f5a623` (toolbar). Due blu hardcoded: `#2f5fc7` (`.scheda-link`, `.monumento-link`) e `#364fc7`. `--acc #0b5fff` non è usato. | Un solo accento (`--accent`) e un solo blu per i link (`--link`). |
| **Nomi dei token** | `--bordo` / `--bordo-pill`, `--muted` / `--testo2`, `--bg` / `--pill`: stessi ruoli con nomi diversi. Ci sono 3 blocchi `:root`. | Un solo `:root` in cima: `--surface`, `--border`, `--text`, `--text-muted`, `--accent`, `--shadow`, `--r-sm/md/lg`, `--z-*`. |
| **Font size** | 14 valori diversi: 9, 10, 11, 12, 13, 14, 15, 16, 17, 22px più `.7`, `.82`, `.85`, `.86rem`. Mescola px e rem. | Scala di 5 passi: 12 / 13 / 14 / 16 / 18 in `rem`. Niente sotto 11px. |
| **Raggi** | 6, 8, 10, 12, 16, 20, 28, 50%, 999px. | Tre passi (8 / 12 / 999) più il cerchio. |
| **Icone** | Toolbar e ricerca usano SVG inline. La scheda usa Font Awesome 6.0.0 da CDN (`fas fa-…`). Il tasto chiudi della scheda è un `×` di testo, mentre quello dei crediti è SVG. | Tutto SVG inline o sprite. Con questo si elimina Font Awesome (vedi §4). |
| **Etichette toolbar** | `Mappa`, `Popol.`, `Confini`, `Layer`, `Edif.`, `Rilievo`, `Bus`. Alcune sono abbreviate, "Layer" è generico e "Bus" copre anche tram e fermate. | Nomi interi e della stessa categoria: Mappa, Popolazione, Confini, Territorio, Edifici, Rilievo, Trasporti. |
| **Tooltip** | `.confini-tooltip` e `.trasporto-tooltip` sono la stessa regola copiata. | Una classe `.tooltip-mappa`. |
| **Colori nei JS** | `palette.js` dice "ogni colore passa da qui", ma restano esadecimali sparsi in `monumenti.js` (13), `evidenza.js` (20), `territorio.js` (8), `scuole.js` (4) e `trasporto.js` (3). `palette.js` punta a `css/style.css`, che non esiste. | Spostare tutto in `palette.js` e correggere il commento. |
| **Tema scuro** | `color-scheme: light` è forzato, ma `palette.js` ha rampe `dark` e `isDark` in ogni funzione. | Decidere. O si rimuove il codice morto, o si implementa il tema scuro con i token. Consiglio di rimuoverlo, perché la basemap è sempre chiara. |
| **CSS morto o duplicato** | `#scheda` è dichiarata a 300, 330 e 380px. `.scheda-corpo { padding }` compare due volte. Restano `fieldset`, `legend` e `select` globali dalla prima versione. | Pulizia, circa 15% del file. |
| **Valori magici** | `396px` e `756px` (380 + 16, 740 + 16) sono copiati in 4 punti. Ci sono 380 / 740 e `--scheda-l` definita solo su desktop. Le posizioni mobile 64 / 112 / 120 / 128 / 180px sono arbitrarie. z-index 2 / 3 / 4 senza scala. | `--scheda-w`, `--scheda-gap` e `--z-mappa/ui/pannello/foglio`. Le posizioni mobile derivano dalle altezze reali. |

## 2. Usabilità

Legenda gravità: 🔴 critica · 🟡 moderata · 🟢 minore.

| Trovato | Gravità | Fix |
|---|---|---|
| **Sovrapposizioni con la scheda aperta.** La ricerca è larga 42vw e la legenda 260px a sinistra. A 1280px con scheda singola si toccano. Con scheda doppia (540px di mappa visibile) si coprono. | 🔴 | Con scheda aperta, legenda sopra la ricerca o ricerca più stretta. In alternativa legenda collassabile. |
| **Toolbar troppo larga.** Contiene 4 pulsanti, 7 gruppi, slider da 180px e badge, circa 650px o più. Ha `white-space: nowrap` e nessun breakpoint tra 721px e circa 1100px. Con scheda doppia esce dallo schermo. | 🔴 | Nascondere lo slider sotto 1100px. Meglio ancora, spostarlo in un pannello. Il badge ripete già il valore. |
| **Scheda a due colonne calcolata via JS** (`adattaColonne`). Legge `scrollHeight` a ogni click, change e toggle, quindi forza reflow. Il contenuto salta quando si apre un accordion e le colonne si spezzano a metà sezione. | 🔴 | Una colonna sola da 380px con sezioni collassabili (Terreno chiuso di default). Se serve il doppio, usare CSS grid con sezioni assegnate per priorità. Sostituire gli eventi con un `ResizeObserver`. |
| **Titolo generico.** La scheda si chiama "Scheda del luogo" per ogni clic. | 🟡 | Usare il dato principale come `h2`, per esempio "Via Teatro Biondo 3/B". Le coordinate restano come sottotitolo. |
| **Valori lunghi allineati a destra.** "Aree interessate da inondazioni…" e le "Note" si spezzano su 4 righe con testo a bandiera sinistra. | 🟡 | Sopra una certa lunghezza (circa 30 caratteri), etichetta sopra e valore sotto, allineato a sinistra. |
| **Righe "senza dato" ripetute.** Nello screenshot sono tre di fila. | 🟡 | Raggruppare in una riga muted "Dati 2023 non disponibili", oppure `n.d.` attenuato. |
| **Disclaimer ripetuto 3 volte.** Sta sotto Particella, sotto PRG e sotto Vincoli, più il banner fisso in basso. | 🟡 | Un solo avviso in fondo alla scheda e un solo banner globale. |
| **Badge con testo lungo.** "1 Alta costruibilità (slope<5°, elev<100m)" va a capo nel pill. | 🟡 | Nel badge solo "Alta"; la soglia va in una nota piccola o nel `title`. |
| **Mobile.** La scheda occupa 30–35% dell'altezza, troppo poco per questo contenuto. Non c'è maniglia di trascinamento. La barra verticale più il pannello a `left:70px` coprono molta mappa. | 🟡 | Bottom sheet a tre altezze (peek / metà / pieno) con maniglia. |
| **Toast `#avvisi`.** Sta a `bottom:112px`, dove cresce `#pannello-filtri` verso l'alto. Non si chiude e non scompare. Il `Set` impedisce di rivederlo dopo la prima volta. | 🟡 | Auto-hide dopo 6–8s e pulsante di chiusura. Posizionarlo sopra il gruppo ricerca. |
| **Due stati attivo.** Il gruppo ha il pallino verde (`data-attivo`) e il pulsante premuto è arancio. Il pallino è solo colore. | 🟢 | Un solo segnale e un `aria-label`. |
| **Due trigger per le info.** `#apri-crediti` e `#linguetta-info` aprono la stessa cosa. | 🟢 | Tenerne uno. |
| **Ricerca in basso al centro.** Il pattern è insolito rispetto alle mappe, ma coerente con la scelta fatta. | 🟢 | Va bene se resta stabile. I risultati si aprono verso l'alto, correttamente. |

## 3. Accessibilità

- **Contrasto.** Il testo bianco su `#f5a623` ha circa 2:1, sotto il minimo di 4.5:1. Riguarda "Cerca particella", il pulsante premuto della toolbar, il badge zoom, l'icona filtri e i bottoni di `#crediti`. Il chip usa invece testo scuro, quindi c'è incoerenza.
  - Fix: testo `#1a1206` sull'arancio ovunque, oppure arancio scuro `#b45309` con testo bianco.
  - Il resto passa: `--muted`, `--testo2` e il link bianco su `#2f5fc7` stanno sopra 4.5:1.
- **Focus.** Il `:focus-visible` è definito solo per `details` e per il selettore di base. Mancano i pulsanti della toolbar, i bottoni dei risultati e i controlli della scheda. `#cerca-testo` ha `outline:0` e nessun anello sul contenitore.
  - Fix: un `:focus-visible` globale e `#cerca:focus-within`.
- **Dimensioni.** I pulsanti da 32px passano il minimo WCAG 2.2 (24px), ma il mobile merita 44px su tutti. Il tasto `×` è circa 22px. Testi da 9px (`.zoom-ticks`, `.et` mobile) e da 10px (`.scheda-tipo-stato`) sono troppo piccoli.
- **`aria-live="polite"` su tutta `#scheda`.** Lo screen reader legge l'intera scheda a ogni clic. Meglio un `role="status"` breve ("Scheda: Via X 3/B") e focus sull'`h2`.
- **Movimento.** `prefers-reduced-motion` copre solo `#crediti`. Mancano `transition: left/width` e `right`.
- **Dialog.** `#crediti` è un `<dialog>` usato come foglio non modale. Controllare che mostri/nasconda con `show()` e che il focus rientri sul trigger alla chiusura.
- **Legende.** I campioni sono quasi solo colore. La vecchiaia ha una rampa verde→rosso, problematica per il daltonismo. Aggiungere etichette numeriche, e `palette.js` le ha già.

## 4. Prestazioni

- **Font Awesome 6.0.0 completo da CDN** nell'`<head>`, in modo bloccante. Pesa CSS e webfont per usare 8 o 10 icone. L'app non funziona offline e la versione è vecchia. Sostituirlo con SVG inline fa risparmiare circa 100–150KB e una richiesta esterna.
- **`index.html`.** Manca `<link rel="icon">` (i file sono in `img/` ma il browser cerca `/favicon.ico` alla radice). Mancano anche `meta description`, tag Open Graph (c'è `social_card.jpg` inutilizzata) e `theme-color`. Aggiungere `preconnect` agli host dei tile e di PMTiles.
- **Reflow.** `adattaColonne` legge layout a ogni click e toggle (§2). Con una colonna sola il problema sparisce.
- **Click sulla mappa.** Per ogni modulo con scheda si fa `queryRenderedFeatures` due volte (punto e riquadro). Va bene oggi. Se i layer crescono, interrogare una sola volta tutti i layer insieme.
- **Immagini.** `img/` pesa 1.8MB. Controllare `social_card.jpg` e le miniature `basi/`, che dovrebbero essere WebP/AVIF e di circa 112px (2× per 56px).
- **CSS.** Non minificato e con duplicati. È piccolo (341 righe), quindi è un problema di manutenzione più che di peso.

## Cosa funziona bene

- La toolbar a pillola con icone SVG e il passaggio a barra verticale su mobile sono ben pensati.
- Il selettore di base a cerchi con miniatura è chiaro e immediato.
- La scheda ha testata fissa e corpo scorrevole, e i badge di classe 1–5 danno un colore semantico leggibile.
- Chevron, hover e focus sugli accordion mostrano subito cosa si apre.
- `palette.js` ha già un buon principio: colori centralizzati, tratti diversi per livelli di confine (non solo colore).
- La scheda aperta sposta toolbar e ricerca al centro della mappa rimasta.

## Priorità consigliate

1. **Token e pulizia CSS.** Un solo `:root`, un accento, scala di font e raggi, `--scheda-w`. Rimuovere duplicati e codice del tema scuro. Rende tutti i passi successivi più semplici.
2. **Scheda a colonna singola.** Elimina `adattaColonne`, i salti di layout e i reflow. Con titolo reale, valori lunghi impilati, un solo disclaimer, "n.d." raggruppati e Terreno chiuso di default.
3. **Contrasto e focus.** Testo scuro sull'arancio, `:focus-visible` globale, `:focus-within` sulla ricerca, `aria-live` più stretto.
4. **Layout con scheda aperta.** Risolvere sovrapposizione ricerca/legenda e larghezza della toolbar tra 721 e 1100px.
5. **Via Font Awesome.** Icone SVG per tutta l'interfaccia, più favicon, meta e OG nell'`<head>`.
6. **Mobile.** Bottom sheet a più altezze e toast con chiusura automatica.

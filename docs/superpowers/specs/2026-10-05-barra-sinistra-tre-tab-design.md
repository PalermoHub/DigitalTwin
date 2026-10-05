# Barra sinistra a tre tab: Mappe di base, Layer, RNDT

Data: 2026-10-05

## Obiettivo
La barra verticale a sinistra mostra solo tre tab: **Mappe di base**, **Layer**, **RNDT**.
Tutti gli altri gruppi (Popolazione, Confini, Territorio, Edifici, Rilievo, Trasporti, Piano PAI, Monumenti,
Servizi, Incendi, Sicurezza, Scuole, Uffici…) confluiscono dentro il tab Layer come sezioni.

Successo: a sinistra ci sono tre pulsanti; aprendo Layer si vedono tutte le sezioni, ognuna ripiegabile; nessuna
funzione degli strati cambia (accensione, opacità, zoom, riordino, filtri, tema colore, ricerca strato).

## Fuori scopo
- Il pannello RNDT a destra (cerca e carica i dati dal catalogo) e la Scheda a destra restano invariati.
- Il tab RNDT a sinistra è il gruppo con i layer RNDT caricati (`gruppoRndt`): resta un tab a sé.
- Mobile (≤720px): invariato (`#apri-strati`, bottom sheet).

## Design

### Tab
- `base` → tab «Mappe di base» (oggi etichetta «Mappa»), `rndt` → tab «RNDT», nuovo tab «Layer» tra i due.
- Stessa meccanica di oggi: un solo pannello aperto, secondo clic sul tab ripiega, `Esc` ripiega.

### Pannello Layer
- Un `section#gruppo-layer.sotto-pannello` contiene un `<details>` per ogni ex-gruppo, in **ordine alfabetico**.
- Il `<details>` mantiene `id="gruppo-<id>"`; il titolo è un `h2` dentro il `<summary>`, così `abilitaRiordino`,
  «Cerca strato» e i selettori esistenti continuano a trovarlo.
- Le sezioni sono indipendenti (non accordion): se ne possono tenere aperte più insieme. Lo stato aperto/chiuso
  si salva in `localStorage` (try/catch, la pagina funziona anche senza); alla prima apertura sono tutte chiuse.
- Sul `summary` compare il numero di strati accesi della sezione; sul tab Layer, pallino e totale.
  Entrambi derivano da `segna()` in `costruisciPannello`.
- I moduli con `gruppo` (alberi, fontanelle → monumenti; scuole, uffici → colonnine; incendi → territorio) continuano
  a confluire nella sezione indicata.

### Codice
- `js/core/pannello.js`: `aggiungi()` crea un `<details>` dentro `#gruppo-layer` per i gruppi ordinari; solo `base`
  e `rndt` creano un tab proprio. `bottoneGruppo` serve ai tre tab; il conteggio per sezione si legge dal summary.
- `chiudiGruppi`, apertura singola e `ripiegaDestra` si applicano ai tre tab, non alle sezioni.
- `css/app.css`: stile di `summary`/`details` nel pannello, pannello Layer più largo (~320px, da verificare).
- `index.html`: nessun cambio strutturale previsto (i tab nascono in `#barra-gruppi`).

## Test e documenti
- Aggiornare test JS e Python che usano `btn-gruppo-*` / `.sotto-pannello` (`tests/test_viewer.py`, `tests/conftest.py`).
- Nuovi test: tre soli tab; una sezione per ogni ex-gruppo, in ordine alfabetico; sezioni indipendenti; stato
  aperto/chiuso persistito; conteggio sul summary e sul tab.
- Aggiornare `js/core/guida-contenuti.js` e gli screenshot della guida; verifica nel browser se disponibile.

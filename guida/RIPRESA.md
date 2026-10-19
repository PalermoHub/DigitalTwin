# Come riprendere il lavoro sulla guida dettagliata

Questo file serve a chi (persona o Claude) riprende il lavoro in una nuova sessione. Va aggiornato a ogni tappa.

## Obiettivo

Costruire in `guida/` una base di conoscenza **dettagliata e fedele all'app** del Digital Twin di Palermo, da usare per un assistente a domande e risposte (chatbot) del sito. Il chatbot **non** userà API a pagamento: la prima versione sarà una ricerca nel browser sui testi di questi file (vedi «Passo successivo»).

## Stato al 2026-10-19: contenuti completi e Chat bot attivo

La cartella contiene **53 file** (`00`–`51` e questo), circa 34.000 parole, **non committati**. Elenco e contenuto di ogni file: `00-leggimi.md`.

- `00-leggimi.md`: indice.
- `01`: panoramica breve (cos'è, schermata, tabella «Dove trovo cosa», tab della scheda, icone) con rinvii.
- `02`–`07`: panoramiche per tema (territorio, edifici e popolazione, trasporti e sicurezza, servizi e cultura, progetti e patrimonio, fonti/avvertenze/glossario).
- `08`–`33`: una **scheda** per file; `34`–`37`: parti dinamiche e comandi della scheda.
- `38`–`51`: **funzioni dell'app**, una per file: tema e colori degli strati (38), strati in 3D (39), tabella dei dati (40), Street View (41), stampa (42), condividi (43), ricerca e filtri (44), barra strati/legende/ordine (45), selezione in mappa/raggio/fumetti (46), mappe di base e storiche (47), I miei layer (48), catalogo RNDT (49), Geoimage (50), pagine/privacy/lingua/offline (51).

Controlli già fatti (rilanciabili con lo script in fondo): ogni sezione `##` ha «Parole chiave:» e «Domande tipiche:»; ogni file è nell'indice; nessun rinvio a file inesistenti.

## Regole del lavoro (decise con l'utente)

1. **Non inventare nulla.** Si scrive solo ciò che il codice o i testi dell'app (`js/locales/it.json`) dicono. Dove non si sa, si usa una formula neutra o si omette. Non spiegare sigle o formule se il codice non le spiega.
2. **Un file per funzione/scheda**, scritto con una sola chiamata `Write` (file piccoli): le risposte molto lunghe si interrompono («Connection lost»). Se si interrompe, controllare con `ls -l guida/` e riscrivere solo il file mancante.
3. Ogni file ha sezioni `##` autonome, ciascuna con **«Parole chiave:»** e **«Domande tipiche:»** (servono all'indicizzazione).
4. Italiano, con gli accenti. I nomi dei controlli sono quelli dell'interfaccia, tra virgolette «...».
5. Prima di scrivere: `graphify query` per orientarsi, poi i sorgenti, poi le chiavi di `js/locales/it.json` (`grep -n '"prefisso\.' js/locales/it.json`).
6. Aggiornare `00-leggimi.md` a ogni file nuovo.
7. Niente commit finché l'utente non lo chiede.

## Cosa resta da fare

1. **Verifica contro il codice**: `02`–`07` verificati il 2026-10-19 (numeri controllati direttamente nei dati di `dati/`: particelle, linee e fermate GTFS, scuole, seggi, uffici, colonnine, distributori, PNRR, opere, MEF, PEBA, trend). Correzioni fatte: temi PAI (12 temi), seggi (132, non 133), stati delle colonnine, glossario (tolte le espansioni di sigle che l'app non spiega), esportazione della tabella, elenco dei layer con colorazione 3D. Restano **non provati in un browser** i comportamenti descritti da codice e testi dell'app (nessuna prova a video) e i file `38`–`51`, scritti leggendo il codice ma non rivisti riga per riga una seconda volta.
2. **Commit** di `guida/` quando l'utente lo chiede. Coda del messaggio: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Verificare prima che `guida/` non sia in `.gitignore` (non lo è: `git check-ignore guida/x.md` non stampa nulla).
3. **Mantenere la guida allineata** quando l'app cambia (nuovo layer: nuova scheda `NN-scheda-*.md` e riga in `00-leggimi.md`; vedi anche `docs/NUOVO_LAYER.md`).

## Chat bot (fatto il 2026-10-19)

Il tab e l'icona «Chat bot» sono nell'app: pannello destro (`#chatbot-pannello`), pulsante `#btn-chatbot` nella barra strumenti, `#btn-chatbot-m` nel foglio Aggiungi su telefono. Ricerca nel browser, nessuna API.
- **Indice**: `guida/indice.json`, generato da `python3 scripts/guida_indice.py` (170 voci, una per sezione `##`). **Va rigenerato e committato ogni volta che i file di `guida/` cambiano.**
- Codice: `js/core/chat-bot-ricerca.js` (punteggio, anteprima, `blocchiTesto`), `chat-bot-conversazione.js` (stato, senza DOM), `chat-bot.js` (DOM). Testi in `js/locales/*.json` (`chatbot.*`). Documento di progetto e piano: `docs/superpowers/specs/2026-10-19-chat-bot-design.md`, `docs/superpowers/plans/2026-10-19-chat-bot.md` (ignorati da git).
- Test: `tests/js/chat-bot*.test.mjs`, `tests/test_guida_indice.py`. Il test sull'indice reale richiede che ≥97% delle «Domande tipiche» trovi la propria sezione: scrivere le domande con parole della sezione.
- Non fatto: link «Apri il layer» (la guida non dice a quale layer si riferisce ogni sezione); risposte solo in italiano.
- Opzione futura: Cloudflare Workers AI dietro il Worker esistente, con ripiego sulla ricerca.

## Promemoria tecnico

- Repo: `/home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin`, ramo `main`; ultimo commit noto all'inizio del lavoro: `b4ddc15`.
- `docs/` e `dati/*/` sono ignorati da git: per questo la guida sta in `guida/` (radice).
- Il codice ha il grafo `graphify-out/`: `graphify query "<domanda>"` prima di leggere i sorgenti. Qui non si è modificato nessun codice dell'app.
- Test JS: `npm test` (93 test falliscono già per altre ragioni; non c'entrano).

## Script di controllo (da lanciare in `guida/`)

```
python3 - <<'E'
import glob,re
for f in sorted(glob.glob('[0-9][0-9]-*.md')):
    if f.startswith('00-'): continue
    for sez in re.split(r'\n(?=## )', open(f,encoding='utf-8').read()):
        if sez.startswith('## ') and ('Parole chiave:' not in sez or 'Domande tipiche:' not in sez):
            print(f, sez.split('\n',1)[0])
idx=open('00-leggimi.md',encoding='utf-8').read()
for f in sorted(glob.glob('[0-9][0-9]-*.md')):
    if not f.startswith('00-') and f not in idx: print('NON IN INDICE:', f)
E
grep -o '`[0-9][0-9]-[a-z0-9-]*\.md`' [0-9][0-9]-*.md | sed 's/.*`\(.*\)`/\1/' | sort -u | while read f; do [ -f "$f" ] || echo "RINVIO INESISTENTE: $f"; done
```

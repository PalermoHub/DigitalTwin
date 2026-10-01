# Prompt per ripartire (sessione successiva)

Da incollare in una nuova sessione aperta in `DigitalTwin/`.

```
Riprendo il progetto "Digital Twin di Palermo" in /home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin
(repo git, branch main, ultimo commit e1db34e). Rispondi in italiano.

STATO: Fase 0 e Fase 1 sono implementate. Piano: docs/superpowers/plans/2026-09-30-digitaltwin-fase0-1.md
(Task 0–13); spec: docs/superpowers/specs/2026-09-30-digitaltwin-fase0-1-design.md; piano generale e
inventario dati: docs/PIANO_DigitalTwin_Palermo.md. Il ledger delle decisioni è in
.superpowers/sdd/2026-09-30-digitaltwin-fase0-1/progress.md: leggilo per primo (righe "Ruling:" e
"Final: minor (deferred)"). Task 0–12 sono registrati come completi.

COSA RESTA DA FARE (passo finale dell'executing-plans):
1. Task 13: lancia la suite completa, che dura circa 12 minuti e usa la rete:
   cd /home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin
   S=/home/coseerobe/.claude/plugins/cache/claude-plugins-official/superpowers/6.4.1/skills/executing-plans/scripts
   BASE=$(git rev-parse 999d313)
   $S/task-done docs/superpowers/plans/2026-09-30-digitaltwin-fase0-1.md 13 $BASE -- bash -c 'node --test tests/js/*.test.mjs && python3 -m pytest -q && python3 scripts/valida_dati.py'
   (usa python3, non python; in background con timeout lungo). Se un test fallisce, indaga la causa prima di toccare qualcosa.
2. La revisione finale è già stata fatta (0 critici, 5 importanti + 1 promosso, tutti corretti nel commit e1db34e,
   ognuno con un test visto rosso prima). Aggiungi al ledger una riga "Final: fixed ..." per ciascuno
   (ricerca con civici con lettera; avviso valore legale permanente e note nelle schede; errore di caricamento
   dell'anno 2023; indicatori nella scheda della sezione; hash dei file remoti con `valida_dati.py --completo`;
   avviso con il nome dello strato e interruttore disattivato), con il risultato della suite.
3. Chiudi: raccogli in un messaggio tutte le righe "Ruling:" ("Rulings I made") e tutti i "minor (deferred)"
   ("Deferred minors"); poi cancella la cartella .superpowers/sdd/2026-09-30-digitaltwin-fase0-1/ (il registro
   resta nella cronologia git); poi superpowers:finishing-a-development-branch.

REGOLE CHE L'UTENTE HA FISSATO (non violarle):
- Gli stili si RIUSANO dalle app originali (docs/STILI.md), mai inventati. L'interfaccia è sempre chiara.
- Non copiare dati già pubblicati su GitHub: usa i link (dati/MANIFEST.tsv colonna url, dati/catalogo.json).
  I tileset (PRG, terreno, elevazione, griglia) sono voci "tileset" del catalogo. Non copiare i tile raster.
- GTFS escluso per ora (si aggiunge in seguito, feed 2026). Il PRG vigente è il 2004.
- Metodo: TDD, un test visto fallire prima di ogni modifica. Nessun codice prima dell'approvazione per le cose nuove.

PROSSIMI PASSI POSSIBILI DOPO LA CHIUSURA (chiedi all'utente quale):
- Minori rimandati: M1 traceback in valida_dati.py; M2 redirect e CORS dei tileset; M3 glyphs nello stile di
  ripiego; M4 setTerrain senza catalogo; M6 tolleranza ±4 px sui poligoni; M7 colore "senza dato"; M8 Font Awesome
  non offline; M9 pulsante Fonti attivo solo a fine caricamento.
- Pubblicazione su GitHub Pages (dati/ non è in git: i file locali senza link sono ≈ 350 MB).
- Fase 2 del piano: clima e ombre; poi popolazione avanzata, mobilità con GTFS 2026, verde, scenari.
- Uno stile originale per gli immobili comunali (oggi provvisorio) e l'eventuale confronto 2021→2023.
```

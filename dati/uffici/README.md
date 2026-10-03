# Uffici del Comune di Palermo

Fonte: https://www.comune.palermo.it/amministrazione/uffici/ (schede `unita_organizzativa`), estratta il 2026-10-03.

| File | Contenuto |
|---|---|
| `uffici.json` | Gerarchia completa Area → Settore → Unità operativa (responsabili, competenze, sede, contatti, coordinate, `url` della scheda) |
| `uffici.geojson` | Un punto per ufficio (Area, Settore, U.O.), coordinate della sede; proprietà: `livello, nome, area, settore, responsabile, sede, indirizzo, telefoni, email, pec, url` |
| `sedi.geojson` | Un punto per sede (81), con elenco degli uffici ospitati: per marker non sovrapposti |
| `uffici.csv` | Tabella piatta (`;`, UTF-8 BOM) |
| `ELENCO.md` | Elenco leggibile gerarchico |
| `grezzo.json` | Dati grezzi di scraping (rigenerabili) |

Coordinate: lette dalla mappa della pagina «luogo» della sede principale sul sito del Comune (nessun geocoding esterno), validate nel bbox di Palermo.
Uffici senza sede indicata non hanno geometria (assenti da `*.geojson`, presenti in json/csv).

Rigenerare: `python3 scripts/uffici_scrape.py && python3 scripts/uffici_build.py`

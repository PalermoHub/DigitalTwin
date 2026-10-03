# Incendi nel Comune di Palermo

Fonte: Regione Siciliana, Corpo Forestale — [Censimento Incendi (SIF)](https://sifweb.regione.sicilia.it/arcgis/rest/services/Censimento_Incendi/MapServer), un layer per anno (oggi 2007–2025).
Perimetri delle aree percorse dal fuoco. Generato da `scripts/incendi.py` (o dal workflow manuale **Aggiorna incendi**).

| File | Contenuto |
|---|---|
| `incendi_AAAA.geojson` | Incendi dell'anno nel Comune di Palermo, WGS84, campi normalizzati |
| `anni.json` | Per anno: layer del server, numero di incendi, ettari e simbologia del server (colore, bordo, opacità) |
| `incendi.pmtiles` | Tutti gli anni, strato `incendi`, zoom 12–18; ogni feature porta `anno`, `colore`, `bordo`, `opacita` |
| `confine_comunale.geojson` | Confine del Comune, per riconoscere gli incendi di Palermo |

**Filtro Palermo.** Il comune sta in campi diversi a seconda dell'anno: `DESCRIPTION` (2010–2025), `Comune` (2009), codice ISTAT `COM = 082053` (2007–2008). Si tengono solo gli incendi del comune di Palermo, non quelli dei comuni vicini che toccano lo stesso rettangolo.
Il 2024 non ha incendi a Palermo (il layer esiste ma non ne contiene), quindi non compare in legenda. Due incendi del 2022 (ID 28645 e 29038) sono assegnati a Palermo dal server ma cadono appena fuori dal confine: si tengono.

**Unità.** Superfici in ettari. Il server le dà in ettari (2008–2025) o in m² (2007, 2009): convertite.
**Campi.** Dal 2024 il server pubblica molti più campi (durata dell'intervento, costi, feriti…): nei dati più vecchi mancano e non compaiono in scheda.

## Aggiungere un nuovo anno
Ogni anno la Regione aggiunge un layer «Incendi AAAA». Basta avviare a mano il workflow **Aggiorna incendi** (Actions → Aggiorna incendi → Run workflow): scopre i nuovi layer, rigenera i file e fa il commit. Il viewer legge `anni.json` e il PMTiles, quindi il nuovo anno appare da solo in mappa, legenda e scheda. In locale: `python3 scripts/incendi.py` (servono `shapely` e `tippecanoe`).

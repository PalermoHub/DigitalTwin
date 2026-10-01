# Sicurezza stradale (viabilità pericolosa) — design

Data: 2026-10-01 · Stato: da approvare

## Obiettivo

Mostrare nel Digital Twin la viabilità pericolosa di Palermo: tasso di incidenti per km sugli archi stradali, hotspot statistici e incidenti puntuali, con scheda per tratto nel pannello di destra. Fonte: studio `Rete-Stradale 01` (Fase 2 sicurezza, con contesto di Fasi 3–4: pendenza, TWI, rischio PAI).

Successo: tre strati accendibili nel gruppo Mobilità, scheda arco al clic, tooltip, test verdi, `valida_dati` e catalogo aggiornati, nota sui limiti dei dati visibile.

## Perimetro

Dentro: `rete_rischio` (18.736 archi), `hotspot_griglia` (celle 250 m, Gi*), `incidenti_snap` (23.490 punti, 2015–2023).
Fuori: centralità/assi strategici, ZTL, densità di rete, routing, viewer originale di Rete-Stradale.

## Dati

- Origine: `../Rete-Stradale 01/dati/geojson/` (copiati in `dati/mobilita/sicurezza/` come sorgenti; i CSV/GPKG grezzi restano in `dati/mobilita/`).
- `scripts/sicurezza_stradale.py` riduce i campi e genera tre PMTiles con tippecanoe:
  - `archi.pmtiles`: `nome, highway, lunghezza_m, n_incidenti, tasso_km, tasso_affidabile, pendenza_media_pct, accessibilita, Quartiere, Circoscrizione, UPL, rischio_geomorf_label, rischio_idraul_label, priorita_geomorf, priorita_idraul` (scartati `u_node, v_node, osm_id, betweenness`, ecc.).
  - `hotspot.pmtiles`: `n_incidenti, gravita_tot, hotspot_count, hotspot_gravita` (solo celle con hotspot, scarto coldspot/non significative).
  - `incidenti.pmtiles`: `anno` (derivato da `Data`), `Tipologia`, `feriti_n`, `Luogo`, `snap_affidabile`.
- Aggiornare `MANIFEST.tsv`, `catalogo.json`/`docs/catalogo.md`, `dati/README.md`, crediti (fonte incidenti: Comune di Palermo; elaborazione PalermoHub / OpenDataSicilia).
- Qualità: esclusi dal tasso gli archi con `tasso_affidabile = false` (<20 m); incidenti con snap >60 m marcati non affidabili e non mostrati. Nota esplicita su geocoding; il 2019 non è nel dataset pulito (anni presenti: 2015–2018 e 2020–2023).

## Layer (`js/layers/sicurezza.js`)

Registrato in `MODULI` di `js/app.js`, strati spenti di default, legenda nel sotto-pannello del gruppo.

1. **Tasso incidenti/km**: linee in 4 classi di colore (quartili del tasso sugli archi affidabili, calcolati dallo script e salvati nel campo `classe`). Da zoom 12.
2. **Hotspot**: celle 250 m colorate per livello di confidenza (90/95/99%) della statistica sulla gravità pesata; il livello sul conteggio resta nella scheda.
3. **Incidenti**: punti da zoom 14, colore per gravità (M/R/F/C), filtro anno (2015–2018, 2020–2023).
4. **Le 20 strade più pericolose**: archi delle vie con più gravità pesata per km (soglie: via ≥ 3 km e ≥ 30 incidenti; archi senza nome esclusi), campi `via_*` calcolati dallo script, strato rosso scuro sopra il tasso, posto in classifica nel tooltip e nella scheda.
5. **Ricerca e filtri sugli incidenti**: nella barra una riga per via («Via della Libertà — 243 incidenti, 3 mortali (#4 …)», filtra gli incidenti su quella via) e, con «incidente»/«sinistro» (+ gravità, anno, parole del luogo), una riga per incidente; nel pannello Filtri i menu Anno e Gravità (in AND con la via), chip con ✕, e gli incidenti visibili da zoom 12 invece di 14 finché un filtro è attivo. Il menu Anno non sta più nella legenda. Il filtro riguarda solo i punti: tasso/km e hotspot restano su tutti gli anni. Moduli: `js/core/ricerca-incidenti.js` (puro), `js/layers/sicurezza-filtro.js`, `js/layers/sicurezza-ricerca.js`; dati: `vie.json`.
Layer «hit» trasparenti sempre presenti (da zoom 13) per la scheda anche a strato spento, come per trasporto/scuole.

## Scheda (`js/layers/scheda-sicurezza.js`)

Modello puro e testabile, nello stile `scheda-trasporto.js`: voce arco (via, quartiere/UPL, incidenti, tasso/km, pendenza e accessibilità, rischio PAI e priorità), voce hotspot (livello, incidenti, gravità), voce incidente (data, luogo, gravità, feriti). Avviso limiti dati in fondo. Tooltip su strato acceso.

## Errori e casi limite

Archi non affidabili: scheda mostra il conteggio ma «tasso non significativo (tratto <20 m)». Campi nulli: righe omesse. PMTiles non raggiungibile: `segnala` come gli altri layer.

## Test

- JS: modello scheda (arco/hotspot/incidente, caso non affidabile), classi di colore, filtro anno.
- pytest: pipeline (campi ridotti, anno derivato, conteggi coerenti con i sorgenti, soglie quantili), `valida_dati`, viewer (strati presenti, scheda al clic).

## Rischi

- Dimensione PMTiles: attesa ~10–15 MB totali; verificare e, se serve, semplificare con tippecanoe.
- Gi* a griglia può essere letto come causalità: la scheda riporta metodo e limiti.

# Tematizzazione: da dove viene ogni stile

Regola: gli stili **si riusano** dalle app di origine; non si inventano. Questo file dice, per ogni
strato del viewer, da quale file è preso lo stile. Verificato da `tests/test_viewer.py::test_stili_fedeli_alle_app_originali`
e dai test Node (`palette`, `stile-omi`, `indicatori`).

| Strato | Stile | Fonte |
|---|---|---|
| Base cartografica | OpenFreeMap **positron** (con i font dei civici) | `palermohub/pmtiles/js/catasto_script.js`, `style:` |
| PRG zonizzazione, PPE, vincoli areali e lineari | **tile raster** `https://palermohub.github.io/PRG2004/{ZTO,ppe,VA,VL}/{z}/{x}/{y}.png`, z12–19, letti dal link (1,6 GB: non copiati). I poligoni vettoriali di `prg.pmtiles` restano **trasparenti** e servono solo ai dati (scheda) | `catasto_script.js`, `initializeMapLayers` |
| Zone OMI | colori per campo `Zona_OMI` (da `zone_omi.sld`), opacità 0,15, contorno `#232323` 0,5 | `catasto_script.js` (`omiColorMatch`, ~r. 1585–1645). Estratti da `scripts/estrai_stile_omi.mjs` in `js/layers/stile-omi.js` (non ricopiati a mano) |
| Particelle catastali | riempimento `#ffffff` opacità 0,6, contorno `#000` | `catasto_script.js` (layer «Particelle catastali») |
| Numeri civici | simboli di testo `Civico[/Esponente]`, `#c0392b`, alone bianco 1,5, da zoom 14 | `catasto_script.js` (layer «Numeri Civici») |
| Confini (circoscrizioni, quartieri, UPL) | colore, spessore e tratto per livello (`CONFINI_LEVELS`, tema chiaro) | `palermo_popolazione/js/palette.js` → `js/core/palette.js` (copia identica, verificata con hash nel test) |
| Sezioni (contorno) | `sezioniColors().border`, 0,5 | `palette.js` |
| Popolazione per sezione | rampa lineare `densityStops('popolazione')` per la densità e `densityStops('vecchiaia')` per l'indice di vecchiaia, opacità 0,55, neutro `#8a94a8` senza dato | `palermo_popolazione/js/map.js` (`vecchiaiaExpression`), `palette.js`, `topics.js` (formula) |
| Edifici 3D | colore neutro `EDIFICATO_NEUTRAL`, altezza = `altezza`, opacità 0,85 | `palermo_popolazione/js/map.js` |
| Rilievo 3D e ombreggiatura | `terrain-dem` (Terrarium, z8–15), `setTerrain` con esagerazione 1,5; `hillshade` con esagerazione 0,35, colori `HILLSHADE_COLORS`, luce da 180° | `palermo_popolazione/js/map.js` (~r. 115–140, 350) + `palette.js` |
| Elevazione | raster già colorato (schema `tms`, z8–15), opacità 0,7, in cima allo stack quando si accende; legenda = `ELEVATION_STOPS` | `palermo_popolazione/js/map.js` (~r. 141–155, 459), `palette.js` |
| Griglia DTM (scheda «Terreno») | punti a passo 50 m (MVT z8–15, layer `griglia`) letti come cerchi trasparenti da zoom 15; la scheda mostra il più vicino | `palermo_popolazione/js/griglia.js`, `config.js` (`GRIGLIA_TILES_URL`) |
| **Immobili comunali** | **nessuno stile originale trovato**: aspetto provvisorio (viola `#6a3d9a`, 0,5) | — |

## Scheda del luogo (click sulla mappa)

Impianto e formati dalle schede originali: terreno a gruppi (`palermo_popolazione/js/punto.js`: Pendenza, Morfologia,
Rischio versanti con badge di classe 1–5, Indici morfometrici a griglia, Idrologia, Energia e clima, Accessibilità ed
erosione); catasto a schede con icone Font Awesome 6.0.0 (`catasto_script.js`: civico, particella con «Visura su SISTER»,
zonizzazione, quotazioni OMI a fisarmonica per tipologia). Regole: il contesto amministrativo (Circoscrizione · Quartiere · UPL)
sta **una sola volta** nell'intestazione; le voci con la stessa chiave si fondono e le righe identiche non si ripetono
(`js/core/scheda-modello.js`); le parti espandibili hanno chevron, cursore e suggerimento. Interfaccia sempre chiara.

## Non riprodotto (scelte consapevoli)

- Dalla griglia DTM solo 7 indici nella scheda (quota, pendenza, esposizione, geomorfologia, costruibilità, stabilità, TWI); gli altri 26 campi restano nei tile.

- Tema scuro della mappa (positron è chiaro: si usano solo le varianti `light`).
- Modalità «edifici colorati per densità/copertura/dasimetria», punti dasimetrici, zone A/B di confronto.
- Etichette delle zone OMI e delle particelle, evidenziazione gialla della particella selezionata.
- Indicatori senza rampa originale (residenti, quote under 15 / over 74): rimossi.

## Se uno stile originale cambia

`js/core/palette.js` è una copia: il test Node confronta l'hash con l'originale e fallisce se divergono
(ricopiare il file). Per l'OMI rilanciare `node scripts/estrai_stile_omi.mjs`.

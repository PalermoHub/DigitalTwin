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
| **Immobili comunali** | **nessuno stile originale trovato**: aspetto provvisorio (viola `#6a3d9a`, 0,5) | — |

## Non riprodotto (scelte consapevoli)

- Tema scuro della mappa (positron è chiaro: si usano solo le varianti `light`).
- Modalità «edifici colorati per densità/copertura/dasimetria», punti dasimetrici, zone A/B di confronto.
- Etichette delle zone OMI e delle particelle, evidenziazione gialla della particella selezionata.
- Indicatori senza rampa originale (residenti, quote under 15 / over 74): rimossi.

## Se uno stile originale cambia

`js/core/palette.js` è una copia: il test Node confronta l'hash con l'originale e fallisce se divergono
(ricopiare il file). Per l'OMI rilanciare `node scripts/estrai_stile_omi.mjs`.

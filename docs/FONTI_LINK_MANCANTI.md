# Link alle fonti dati: cosa manca

Ricerca fatta il 2026-10-06 sulle pagine delle singole mappe di <https://palermohub.opendatasicilia.it/> (descrizioni delle mappe uMap, pagine GitHub Pages, pagine delle mappe). Il catalogo del hub (`palermo-hub.csv`) riporta solo i *nomi* delle fonti, non i link: i link stanno dentro ogni mappa.

## Fonti senza alcun link trovato

| Fonte nella scheda «Fonti e avvisi» | Cosa è stato cercato | Nota |
|---|---|---|
| Zone OMI (Agenzia delle Entrate) | nessuna mappa del hub la cita | servirebbe la pagina OMI dell'Agenzia delle Entrate |
| Immobili comunali 2024 | la mappa «Immobili da alienare 2023» rimanda solo a Tableau/uMap | manca il dataset del Comune |
| Edifici (unità volumetriche CTC) e popolazione per edificio | il geocatalogo del Comune compare solo come CTC generica | manca la scheda precisa del dataset |
| Asili comunali e sezioni elettorali (Comune, 2017) | la mappa del hub copre solo le scuole MIUR | mancano i dataset del Comune |
| Portale del Turismo del Comune (testi e foto dei monumenti) | la mappa di Petrucci cita solo Google My Maps | manca l'URL del portale |
| Verde urbano | la pagina cita solo comune.palermo.it e OpenCUP | manca il dataset di origine |
| Rete stradale 2015–2023 (incidenti) | il hub rimanda solo a una ricerca su dati.gov.it e al 2022 | mancano i dataset 2015–2021 e 2023 |

## Link del hub trovati ma non più raggiungibili (404 al 2026-10-06)

Il sito del Comune di Palermo è stato riorganizzato: questi indirizzi, presenti nelle mappe del hub, non funzionano più e **non** sono stati inseriti.

- `https://www.comune.palermo.it/opendata.php` e `opendata_dld.php?id=392` (GTFS), `id=394` (incidenti in tempo reale), `id=320t`, `id=321`
- `https://www.comune.palermo.it/amministrazione_trasparente.php?sel=19` (strumenti urbanistici)
- `https://www.comune.palermo.it/postazioni_decentrate.php` (anagrafe)
- `https://www.comune.palermo.it/palermo-informa-dettaglio.php?tp=4&id=41439` (catasto incendi)
- `https://www.amapspa.it/it/azienda/le-fontanelle-di-palermo/` (fontanelle AMAP)
- `https://opendatasicilia.github.io/emergenza-idrica-sicilia/aggiornamenti/2024/04/23/il-dialogo-con-amap-spa/`
- `https://www.sitr.regione.sicilia.it/pai/PAI/Licenza_utilizzo_dati_tematici_PAI.pdf` (licenza dati PAI)
- `https://github.com/coseerobe/palermo_dtm_5m` (sostituito con `https://github.com/palermohub/Palerm-DTM-5m`)

## Licenze

Link inseriti per: CC BY 4.0, CC BY 3.0 IT, IODL 2.0 (scuole MIUR). Le licenze «da verificare» restano senza link perché non è nota la licenza. Le licenze CC BY-SA 4.0 indicate dalle mappe uMap del hub (alberi monumentali, fontanelle) valgono per la *mappa*, non per i dati originali, e quindi non sono state attribuite ai dati.

## Link che rispondono 403 ai controlli automatici

`doi.org`, `zenodo.org`, `usgs.gov`, `medium.com` bloccano gli script ma funzionano da browser.

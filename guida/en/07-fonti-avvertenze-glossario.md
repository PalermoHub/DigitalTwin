# Sources, warnings and glossary

## Data sources

Keywords: sources, where the data comes from, bodies, datasets, licence, license, open data, attribution, credits.

Typical questions: Where does the data come from? Where can I find the sources? Can I reuse the data?

The map uses data published by public bodies and open data projects:
- Comune di Palermo: schools, offices, polling stations, street numbers, municipal properties, accidents, master plan, technical map, tourism portal.
- Regione Siciliana: cadastre (SITR), PAI, fire census.
- ISTAT: census sections, 2011/2021/2023 indicators, 2021 commuting, boundaries.
- Agenzia delle Entrate: OMI zones and cadastre.
- AMAT (bus and tram) and Trenitalia (urban rail): GTFS feeds.
- Ministries and agencies: MEF (properties), MIMIT (fuel), MASAF (monumental trees), Ragioneria generale dello Stato (BDAP-MOP), Italia Domani (PNRR), AgID (IPA).
- Open data projects: OpenDataSicilia and PalermoHub (PEBA, heat islands, trends, safety, historical atlas), OpenStreetMap.

The full list, with date, link to the original data and link to the licence, is on the «Sources and notes» page of the menu (on a smartphone, in the «Menu» tab).

---

## Licences and reuse

Keywords: licence, license, CC BY 4.0, ODbL, IODL, EUPL, reuse, attribution, copyright.

Typical questions: Can I use the data in a publication? How do I cite the source?

- The code is under the EUPL-1.2 licence.
- The data produced by the project is CC BY 4.0; attribution required: «Digital Twin Palermo, PalermoHub».
- Third-party data keeps the licence of its source: most of it is CC BY 4.0 (citing the source); MIMIT fuel prices are IODL 2.0; OpenStreetMap is ODbL (attribution and share-alike); for the Crociferi plans and for some of the Comune's data, the conditions of the rights holder given in `NOTICE.md` in the repository apply.
- Before reusing third-party data it is advisable to check the conditions with the rights holder. The same caution applies to the texts and photos of the monuments.
- Export from the data table is available for all the layers listed; each file states the source and licence of the layer (see `40-tabella-dei-dati-ed-esportazione.md`).

---

## Warnings and legal value

Keywords: disclaimer, legal value, informational, land-use certificate, cadastral extract, errors, reliability, trust.

Typical questions: Can I use this data for a notarial deed? Is the data official? Can I trust it?

Cadastre, zoning and restrictions have **informational value only** and do not replace the land-use certificate (certificato di destinazione urbanistica) or the official cadastral extracts. The master plan is the 2004 general variant: later variants may not be included. Census data are sample estimates, so the values per section are not exact counts. The positions of some layers (municipal properties, works, PNRR, PEBA) come from automatic georeferencing and may be inaccurate. For legal uses, always contact the competent offices. At the bottom of every profile there is the notice: informational data, with no legal value.

---

## Glossary of acronyms

Keywords: acronym, abbreviation, meaning, what is, glossary, what does it stand for.

Typical questions: What does UPL mean? What is the OMI? What are PAI, PEBA, GTFS?

- **UPL**: Unità di primo livello (first-level unit), a subdivision of the Comune finer than the neighbourhood.
- **PRG**: Piano regolatore generale (master plan; here the 2004 variant). **ZTO**: the acronym of the zones of the PRG zoning (the «ZTO» field). **PPE**: Piano Particolareggiato Esecutivo (detailed executive plan) of the historic centre.
- **PAI**: Piano di Assetto Idrogeologico (hydrogeological risk plan) of the Regione Siciliana.
- **OMI**: Osservatorio del Mercato Immobiliare (real estate market observatory) of the Agenzia delle Entrate.
- **SITR**: mapping service of the Regione Siciliana (map.sitr.regione.sicilia.it).
- **PEBA**: Piano di Eliminazione delle Barriere Architettoniche (plan for removing architectural barriers).
- **PNRR**: Piano nazionale di ripresa e resilienza (National Recovery and Resilience Plan). **CUP**: the project code shown in the PNRR and public works profiles, with the link to OpenCUP.
- **BDAP / MOP**: Open BDAP of the Ragioneria generale dello Stato, «Monitoraggio Opere Pubbliche (MOP)» (Public Works Monitoring), the source of the public works.
- **MEF**: Ministero dell'economia e delle finanze (Ministry of Economy and Finance). **MIMIT**: Ministero delle Imprese e del Made in Italy (Ministry of Enterprises and Made in Italy). **MASAF**: Ministero dell'agricoltura, della sovranità alimentare e delle foreste (Ministry of Agriculture, Food Sovereignty and Forests).
- **RNDT**: Repertorio Nazionale dei Dati Territoriali (National Register of Spatial Data). **WMS / WMTS / WFS / XYZ**: types of map and geographic data services.
- **GTFS**: the timetable feeds from which the stops, lines and timetables of buses, trams and urban rail come. **AMAT**: the public transport company (bus and tram). **RFI**: this is the name of the «Metro line» and «Metro stations» sections of the Transport group.
- **LST**: land surface temperature (it is not the air temperature). **DTM**: digital terrain model.
- **GCP**: Ground Control Point, a control point for georeferencing. **RMSE**: root mean square error.
- **ISTAT**: Istituto nazionale di statistica (national statistics institute). **ANNCSU**: Archivio nazionale dei numeri civici e delle strade urbane (national archive of street numbers and urban streets). **AMAP**: AMAP S.p.A., the source of the water districts and drinking fountains.
- **IPA**: Indice delle Pubbliche Amministrazioni (Index of Public Administrations, AgID).

---

## Questions the guide does not answer

Keywords: off topic, I don't know, does not answer, help, support, report an error, report a problem.

Typical questions: Can I ask for a building permit? When does the bus arrive in real time? How do I report an error?

The guide explains how to use the map and what the data contains. It cannot:
- give legal, planning, tax or cadastral advice, or say what can be built;
- give information that the map does not contain, such as vehicle delays;
- answer about Comune services not on the map (taxes, registry office, applications);
- confirm that a single data item is correct: every profile gives its source, to be checked with the rights holder.

In these cases you are invited to consult the original source or the competent offices. To report an error in the data, something that does not work or an idea to improve the site, open an issue on GitHub (a free account is enough): the «Open an issue on GitHub» button is in the «Contribute and report issues» section of the introduction page.

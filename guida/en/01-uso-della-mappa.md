## What the Palermo Digital Twin is

Keywords: digital twin, what is it, what is it for, Open Data Sicilia, interactive map, PalermoHub, free.

Typical questions: What is this site? What is it for? Who made it? How much does it cost?

The Palermo Digital Twin is an interactive map made by Open Data Sicilia. It puts the city's data at everyone's disposal: cadastre, zoning plan, population, buildings, monuments, public transport, road safety, municipal offices and much more. It is meant for reading a place from several points of view: someone looking for a cadastral parcel, someone who wants to understand how a neighbourhood is made, someone studying mobility or services. Every piece of information stays linked to the source it comes from.

With a single click on the map all the layers are queried together and the "place profile" opens. The site is free and works in the browser, on a smartphone too. The code has the EUPL-1.2 licence; the data produced by the project have the CC BY 4.0 licence (attribution: «Digital Twin Palermo, PalermoHub»); third-party data keep the licence of their source (see `07-fonti-avvertenze-glossario.md`). The app is designed and developed by @gbvitrano in collaboration with Claude AI (Anthropic).

---

## How the screen is laid out

Keywords: interface, menu, bar, tabs, panels, where to find, layout, toolbar.

Typical questions: Where are the controls? What is in the menu at the top? What are the side bars?

- **At the top**, next to the logo, the menu with the information pages (see `51-pagine-privacy-lingua-e-offline.md`) and the IT/EN language button.
- **In the centre** the map. The **search** field and the «Reset» button (see `44-ricerca-e-filtri.md`).
- **On the left** the layers bar with five tabs: «Basemap», «Layers», «RNDT», «My layers», «Filters» (see `45-barra-strati-legende-e-ordine.md`).
- **On the right** the panels bar: «Profile» (it opens with a click on the map), «RNDT», «Geoimage», «Theme».
- **At the top right** the toolbar: initial view, data table, 3D view, layers in 3D, RNDT catalogue, full screen, print, share, Street View, light/dark theme.
- **At the bottom** the legends of the layers that are switched on and the footer with the notice about legal value; on the map there is also the zoom slider.
- **On a smartphone** a bar of four tabs at the bottom (Map, Layers, Add, Menu).

---

## Where to find what: list of functions

Keywords: functions, guide to the functions, list, how to, where to find.

Typical questions: How do I...? Which function should I use to...? Where is it explained...?

| To... | See |
|---|---|
| Open the map with a ready-made theme | section «Guided paths» in this file |
| Switch on layers, legends, opacity, order, zoom, use on a smartphone | `45-barra-strati-legende-e-ordine.md` |
| Search addresses, house numbers, places, parcels, accidents, fires; filter by area, line, accidents | `44-ricerca-e-filtri.md` |
| Change the background map; historical maps from 1580–1993 | `47-mappe-di-base-e-storiche.md` |
| Understand the areas highlighted after a click, the radius of nearby points, the pop-ups | `46-selezione-in-mappa-raggio-e-fumetti.md` |
| Read the place profile and its controls | `37-intestazione-e-comandi-della-scheda.md` and the files `08`–`36` (one profile section per file) |
| Timetables, stops, lines | `34-orari-e-percorsi-del-trasporto.md`, `24-scheda-fermate-e-linee.md`, `04-trasporti-e-sicurezza.md` |
| Add your own files and services | `48-i-miei-layer.md` |
| Add data from the national catalogue | `49-catalogo-rndt.md` |
| Watch the videos that explain the app (map, RNDT catalogue, Geoimage) | `53-video-della-guida.md` |
| Overlay and georeference a historical map | `50-geoimage.md` |
| Change the colours and text of the interface; colour a layer | `38-tema-dell-interfaccia.md` |
| See the data in a table and export them | `40-tabella-dei-dati-ed-esportazione.md` |
| 3D view and layers in 3D | `39-strati-in-3d.md` |
| Print | `42-stampa.md` |
| Share a view | `43-condividi.md` |
| See a street with Street View | `41-street-view.md` |
| Privacy, language, offline use, menu pages | `51-pagine-privacy-lingua-e-offline.md` |
| What each layer shows | `02`–`06` (by theme) and the profile sections `08`–`33` |
| Sources, licences, abbreviations | `07-fonti-avvertenze-glossario.md` |

---

## Guided paths: a ready-made theme

Keywords: guided paths, path, theme, ready-made themes, home page, home, «Open the map», layers already on, shortcut.

Typical questions: What are the guided paths? How do I open the map with the right layers already switched on? Which paths are there? Where do I find the guided paths?

The guided paths are on the home page of the site, in the «What you can switch on» section, under the title «Guided paths». A path can also be activated from Talia: below the answer there are the buttons of the paths, and one click switches on the layers of the path (a second click switches them off). Each path is a card with a title, a sentence saying what it is about, the list of the layers it includes and the «Open the map» button. The button opens the map with those layers already switched on, with the legends already active on the map and, for the «Urban planning», «Vehicles on the move (2D)» and «Vehicles on the move (3D)» paths, already centred on the area indicated by the path (the 3D one also tilts it, to 60°). The other paths leave the map in the starting view. Once the map is open, the layers can be switched off, switched on and changed as usual (see `45-barra-strati-legende-e-ordine.md`).

There are thirteen paths:

- **Risks and climate**: Geomorphological hazard, Hydraulic hazard, Coastal erosion hazard, Fires, Heat islands
- **Schools and neighbourhoods**: Municipal schools and nurseries, Polling sections (sites), Neighbourhoods, Population by section
- **Mobility**: Metro line, Bus lines, Stops, Charging points, Fuel stations
- **A city in transformation**: Three-year public works plan 2026-2028, NRRP projects, Public works, Population trend 2011-2023
- **Public works in the pipeline**: Three-year public works plan 2026-2028, Public works, NRRP projects, Neighbourhoods
- **Heritage and greenery**: Monuments, Monumental trees, Public drinking fountains, Former Noviziato dei Crociferi in 3D
- **Urban planning**: Zoning plan 2004: zoning and PPE, Zoning plan 2004: constraints, Cadastre: parcels, OMI zones 2025, House numbers
- **Road safety**: Accident hotspots, The 20 most dangerous streets, Accidents per km on roads, Accidents
- **Who commutes**: Commuting to and from Palermo 2021, Population by section, Metro line, Stops
- **An accessible city**: Architectural barriers, Municipal offices (sites), Stops, Municipal schools and nurseries
- **Public property**: Properties declared to the MEF, Municipal properties, Municipal offices (sites), Cadastre: parcels
- **Vehicles on the move (2D)**: Trains on the move (simulation), Trams on the move (simulation), Buses on the move (simulation), Metro line. Map seen from above: the vehicles run along the lines according to the timetable (not real time)
- **Vehicles on the move (3D)**: 3D buildings, Trains, Trams and Buses on the move (simulation). Tilted map near the central station, with the vehicles among the buildings

The text of the path is available in Italian and in English, according to the language chosen.

The paths are for those who do not know where to start. Those who want to choose the layers one by one use the «Layer catalogue» instead, further down the same page: there each layer has the «Add to the map» button and the bar of the chosen layers opens the map with the selected ones.

---

## Clicking on the map: the place profile

Keywords: click, profile, place, tap, profile tabs, Place, Planning tools, Market, Population, Terrain, Roadside services, NRRP, Works, Other data.

Typical questions: How do I see the data of a point? Which sections does the profile have? Where do I see the parcel or the constraints?

To get to know a place it is enough to click on the map, or tap it on a smartphone: on opening, an invitation reminds you (see `51-pagine-privacy-lingua-e-offline.md`). The point is highlighted (see `46-selezione-in-mappa-raggio-e-fumetti.md`) and the profile opens. A single click queries all the layers together: cadastre, zoning plan constraints, road safety, cultural heritage, public transport and the others that are switched on.

The profile is divided into tabs, which appear only if they have content: **Place**, **Planning tools**, **Market**, **Population**, **Terrain**, **Roadside services**, **NRRP**, **Works**, **Three-year plan**, **Other data (RNDT)**. In particular:
- **Place**: address, building, nearby stops and fuel stations, monuments, schools, offices and more, with district, neighbourhood and UPL in the heading.
- **Planning tools**: building, cadastral parcel with the link to SISTER, zoning and constraints of the zoning plan, PAI constraints and fires.
- **Market**: OMI quotations. **Population**: census section, demographic trend, commuting.
- **Terrain**: the terrain (DTM 5 m) and the heat island. **Roadside services**: charging points and drinking fountains.
- **NRRP**, **Works** and **Three-year plan**: projects, public works and projects of the three-year public works programme. **Other data (RNDT)**: the layers added from the catalogue and from «My layers».

Every section indicates its source. At the bottom of every profile there is the notice that the data are informational and have no legal value (see `07-fonti-avvertenze-glossario.md`). The details of each profile section are in the files `08`–`33`, the dynamic parts in `34`–`36`.

---

## Shapes and icons of the point layers

Keywords: icon, shape, symbol, circle, legend, colour blindness, black and white.

Typical questions: What do the icons mean? Why are some points circles?

On the point layers colour is not the only sign: each layer has its own shape or icon, the same on the map, in the legend and in the box that appears when the mouse passes over it. This way the themes can be told apart even when printing in black and white or when having difficulty seeing colours.
- The MEF properties have the euro icon.
- The architectural barriers (PEBA) have an icon for each group (historic route, city street, square, green area, museum…).
- Schools: mortarboard. Polling sites: ballot in the box. Fuel stations: pump. Charging points: plug. Drinking fountains: drop. Monumental trees: tree.
- The municipal offices have the icon of the building at the centre of the ring: the bigger it is, the more offices it hosts.
- The monuments have an icon for each category (church, colonnade, theatre, house, palace, palette, book, tree, market, ruins, shield, pin).
- Accidents, stops and commuting remain circles.

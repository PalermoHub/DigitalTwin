# Transport and road safety

## Public transport: bus, tram, metro and railway

Keywords: bus, tram, metro, railway, AMAT, RFI, Trenitalia, stops, lines, GTFS, railway link, railway ring.

Typical questions: Which lines pass here? Where are the stops? Which layers are there for transport?

The «Transport» group has five layers: **Bus lines**, **Tram lines** and **Stops** (AMAT section) and **Metro line** and **Metro stations** (RFI section). The data are the GTFS feeds of AMAT (about 71 lines: 67 bus and 4 tram; over 1,600 stops) and of Trenitalia for the urban railway (Passante ferroviario, Anello ferroviario and other services). Two stations (Politeama and Porto) are marked «opening soon».

To open a line, switch on the layers and click on the route or on a stop. In the «Lines» box you choose the line and, in its block, you open «Stops»: they appear in sequence like a strip diagram, with the line in its colour, a dot for each stop and the terminals larger. The coloured boxes next to each stop are the other lines that pass there (interchanges). A click on the box takes the map to the stop and shows the route of that line; a click on the name opens the stop profile with the next departures. An arrival-only terminal says so: no services depart from there and the timetables are at the departure stop.

When you click on the map the profile also shows the nearby stops, within the radius that can be adjusted from the «Selection on the map» legend.

---

## Timetables and feed updates

Keywords: timetables, next departures, expired feed, update, validity, GTFS.

Typical questions: Are the timetables up to date? Why does the map say the feed has expired?

The timetables update by themselves. Every day the site checks the Municipality's open data portal and, when AMAT publishes a new feed, stops, lines and timetables are replaced. The same goes for the urban railway with the Trenitalia GTFS feed (converted from NeTEx by Clément Desouche, CC BY 4.0). If the feed in use has expired, the map says so. The timetables are those of the GTFS feeds. At the time of writing (October 2026) the AMAT feed is valid from 25/08/2026 to 31/10/2026 and the urban railway one from 26/09/2026 to 12/12/2026; the dates change at every update.

---

## Road safety: accidents 2015-2023

Keywords: accidents, road safety, dangerous roads, hotspot, crashes, fatal, Municipal Police, accidents per km.

Typical questions: Which are the most dangerous roads? Where do most accidents happen? How do I filter by year?

The «Road safety» group has four layers:
- **Accidents per km on roads**: accident rate by road section.
- **The 20 most dangerous streets**: the streets with the most weighted severity per km (streets of at least 3 km and 30 accidents).
- **Accident hotspots**: 250 m cells with statistically significant concentration (Getis-Ord Gi*).
- **Accidents** (from zoom 14): the single events, about 23,500, from 2015 to 2023 (2019 is not in the dataset). The filter by year and severity is in the «Filters» tab.

The place profile gives the accident risk of the point («Safety»), the zone of concentrated accidents and, for the most dangerous streets, rank, severity, fatalities and kilometres. Source of the accidents: Municipality of Palermo (Municipal Police); PalermoHub / OpenDataSicilia processing. The data are a statistical analysis, not a technical assessment of how dangerous a road is.

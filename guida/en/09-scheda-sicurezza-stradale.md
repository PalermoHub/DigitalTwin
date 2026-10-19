# Road safety profiles

## «Road segment» profile

Keywords: road segment, arc, accidents per km, rate, slope, accessibility by slope, landslide risk, flood risk, dangerous street.

Typical questions: What does the profile of a street show? What does «accidents per km» mean? Why does it say «not significant»?

When you click on a street with the «Accidents per km on roads» layer (or the 20 most dangerous streets) switched on, the profile has the street name as its title (or «Unnamed street») and the badge «Road segment». Below the title appear the neighbourhood, district and UPL. The groups:

- **One of the most dangerous streets** (only if the street is in the ranking of the 20): position in the ranking (for example «3 of 20»), severity per km of the street, accidents on the street with the kilometres, fatalities on the street.
- **Safety**: «Accidents 2015–2023» (a number, or «No accidents recorded») and «Accidents per km». If the segment is shorter than 20 metres the rate says «not significant (segment < 20 m)», because over a few metres the rate is not reliable.
- **Segment**: length in metres, average slope as a percentage, accessibility by slope.
- **Hydrogeological risk**: landslide risk and landslide priority, flood risk and flood priority, from the PAI. Rows with no risk («no…») are not shown.

At the bottom there is the note on the source. The ranking weights accidents by severity and considers only streets of at least 3 km with 30 accidents; arcs without a name in OpenStreetMap are excluded.

---

## «Accident concentration zone» profile (hotspot)

Keywords: hotspot, accident concentration zone, cell, Getis-Ord, weighted severity, confidence, 250 metres.

Typical questions: What is a hotspot? What does confidence mean? How is severity calculated?

With the «Accident hotspots» layer switched on, clicking a cell opens the «Accident concentration zone» profile (badge «Accident hotspot»), with:
- **Confidence (severity)** and **Confidence (count)**: confidence level as a percentage, calculated on the severity and on the count of accidents.
- **Accidents in the cell**.
- **Weighted severity**.

The note explains the method: 250 m cells, Getis-Ord Gi* statistic (Queen contiguity, 999 permutations). Severity weights fatal accidents 5, those with guarded prognosis 3, those with injuries 1, property damage only 0.2. Only the statistically significant cells appear on the map.

---

## «Accident» profile

Keywords: accident, single accident, severity, fatal, injured, guarded prognosis, property damage only, year.

Typical questions: What does the profile of an accident show? What do the severity colours mean?

With the «Accidents» layer (from zoom 14) clicking a point opens the «Accident» profile, with the place as its title and three rows: **Year**, **Severity** and **Injured**.

Severity has four classes: **Fatal**, **Injured with guarded prognosis**, **With injuries** and **Property damage only**, each with its own colour on the map (from dark red to grey). The accidents are 2015-2023 (2019 is not in the cleaned dataset), snapped to the road network; the filter by year and severity is in the «Filters» tab.

Source: Comune di Palermo (Polizia Municipale), processed by PalermoHub / OpenDataSicilia.

---

## Road safety tooltips

Keywords: tooltip, hover box, mouse hover, accident safety.

Typical questions: What do I see when I hover over a street?

Hovering over a street shows the name (with the position in the ranking, for example «#5 · Via X», if it is among the 20 most dangerous) and the number of accidents with the rate per km, or «No accidents recorded». On a hotspot: «Accident concentration zone» with the accidents. On an accident: place, year, severity and injured. The hover boxes are switched on and off from the «Information overlays» menu.

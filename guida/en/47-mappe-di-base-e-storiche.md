# Basemaps and historical maps

## The «Basemap» tab

Keywords: basemap, background map, change the background, satellite, dark map, OpenStreetMap, Esri, Google, white background, thumbnail, base layer, aerial imagery.

Typical questions: How do I change the background map? How do I see the satellite? Which base is active at the start?

The **Basemap** tab (left-hand bar) chooses the map that lies under the layers. **Only one base is visible at a time**; at the start it is «Light map». Each base has a thumbnail and a name; under the list there is the hint «Select the cartography to use as the base.» The bases are divided into groups, as in the selector of the Historical Atlas:

- **Street maps**: (default: Mapbox light or dark, per theme) Light map (OpenFreeMap), Dark (OpenFreeMap), Bright (OpenFreeMap Bright), Mapbox (custom style) and Mapbox dark (standard Dark style; they swap with the theme), OpenStreetMap (standard), OSM France, OSM Humanitarian, Esri Streets (World Street Map), Google (streets), Esri Dark (Dark Gray Canvas).
- **Aerial imagery**: Satellite (Google), Esri (World Imagery), Hybrid (Google satellite with streets and names).
- **Topographic**: Terrain (Google, relief), OpenTopo (contour lines), Esri Topo (World Topographic Map).
- **Historical maps**: see below.
- **Technical cartography**: CSG 1989 (Municipal Technical Map CSG 2k, 1989/91), CTC 2k (Municipal Technical Map, 2007/09), CTR 10k (Regional Technical Map, 2012/13).
- **Neutral background**: Grey (Esri Light Gray Canvas) and White.

The chosen base is included in the link of «Share this view». The button with the moon switches the light/dark theme and the basemap changes accordingly (see `38-tema-dell-interfaccia.md`). In the «3D layers» view the base always takes the lowest plane.

---

## The historical maps

Keywords: historical maps, old maps, Atlas of historical technical maps, 1580, 1754, 1860, 1877, 1882, 1891, 1893, 1908, 1935, 1941, 1943, 1956, 1962, 1987, 1993, accuracy, georeferenced, Map Warper.

Typical questions: Are there historical maps of Palermo? What does the green, yellow or red dot mean? Up to what zoom can they be seen?

The **«Historical maps»** group (between Topographic and Technical cartography) contains **fifteen maps of Palermo**, from 1580 to 1993, taken from the **Atlas of historical technical maps of Palermo** (OpenDataSicilia), georeferenced on Map Warper. They are chosen like any other base. The years are: 1580, 1754, 1860, 1877, 1882, 1891, 1893, 1908, 1935, 1941, 1943, 1956, 1962, 1987, 1993. Passing the mouse over a map shows the title with the original source and «(overlay accuracy: [high/medium/low])».

**The coloured dot** says how reliable the overlay with today's city is: **green high, yellow medium, red low**. It is an editorial judgement of the atlas: *high* for the aerial photogrammetric surveys (1935, 1956, 1962, 1987, 1993), *medium* for the maps before aerial photogrammetry (1877, 1882, 1891, 1893, 1908, 1941, 1943), *low* for the engravings (1580, 1754, 1860).

**Maximum zoom.** Each map has a maximum zoom (from 16 to 18; the 1893 map goes up to 16).

Above the list a note refers to the Atlas: «Georeferenced maps from the Atlas of historical technical maps (OpenDataSicilia)». The **«Open the Historical Atlas of Palermo»** button opens the complete atlas in a new tab, already positioned on the area (zoom and coordinates) you are looking at; the hint speaks of «overlays, slider comparison and historical postcards».

To **compare** a map with today's city on the map, Geoimage is used (see `50-geoimage.md`). The original sources of the maps (BnF Gallica, Library of Congress, Harvard Map Collection, U.S. Army Map Service, Wisconsin-Milwaukee University, Comune di Palermo) are indicated in the attribution of each map.

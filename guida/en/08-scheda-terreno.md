# Profile «Terrain (DTM 5 m)»

## What the Terrain profile shows

Keywords: terrain profile, DTM, elevation, metres above sea level, 50 m grid, morphological analysis, slope, morphology.

Typical questions: What is in the Terrain profile? Where do these values come from? What elevation is it?

The «Terrain (DTM 5 m)» profile appears in the place profile when you click on the map. The title has as its badge the elevation in metres above sea level (for example «45 m a.s.l.»). It is a collapsible section, open at the start.

The values are not calculated at the exact point clicked: they are those of the **nearest DTM grid point**, with a 50-metre spacing (note at the bottom of the profile). They derive from the 5-metre digital terrain model (HR-DTM-5m, IRPI-CNR, Panza et al. 2026, processed by PalermoHub). At the bottom there is the «Interactive morphological analysis» link to the dedicated PalermoHub page.

The values are divided into groups: Slope, Morphology, Slope risk, Morphometric indices, Hydrology, Energy and climate, Accessibility and erosion. If a value is missing for the point, the profile shows «—», and the Energy and climate and Accessibility and erosion groups appear only if there is data.

---

## Terrain: slope and morphology

Keywords: slope, degrees, percentage, aspect, hillside, landform, terrain shape, geomorphology, north south.

Typical questions: How steep is the terrain? Which way does the slope face? What shape is the terrain?

- **Slope**: in degrees (for example 8.5°) and as a percentage (for example 14.9 %).
- **Morphology**: «Aspect» (which direction the slope faces) and «Landform» (morphological class of the point, as text).


---

## Terrain: slope risk, stability and buildability

Keywords: stability, buildability, slope risk, classes 1-5, landslide, building suitability, unstable ground.

Typical questions: Is the ground stable? Can one build here? What do classes 1 to 5 mean?

The «Slope risk» group has two rows:
- **Stability**: assessment of the slope (text).
- **Buildability**: assessment of how buildable the terrain is (text).

Each row has a class from 1 (best) to 5 (worst), shown with a colour. If the class is not available it is not coloured. For official restrictions there are the PAI layer and the master plan (see the warnings: the data is informational).

---

## Terrain: morphometric indices

Keywords: TRI, TPI, SRI, HS, hillshade, ruggedness, topographic position, indices.

Typical questions: What are TRI and TPI? What does HS mean?

The «Morphometric indices» group shows four values in a grid:
- **TRI**: terrain ruggedness index (how irregular it is).
- **TPI**: topographic position index (position of the point relative to its surroundings).
- **SRI**: another morphometric index calculated from the terrain model.
- **HS**: the shading value (hillshade).


---

## Terrain: hydrology

Keywords: TWI, SPI, flow accumulation, DTW, water table, moisture, runoff, drainage.

Typical questions: What is the TWI? Does water tend to collect here?

The «Hydrology» group reports:
- **TWI, topographic moisture**: moisture index linked to the shape of the terrain.
- **SPI, Stream Power**: erosive capacity of surface runoff.
- **Flow Acc. (log)**: accumulation of runoff upstream of the point (on a logarithmic scale), if available.
- **DTW, water table depth**: in metres, if available.


---

## Terrain: energy and climate

Keywords: SVF, sky view, visible sky, photovoltaic, PV potential, summer shade, winter shade, frost, solar radiation.

Typical questions: Is the point suitable for photovoltaics? How much shade is there in summer and in winter?

The «Energy and climate» group (if there is data) has:
- **SVF, visible sky**: percentage of sky visible from the point.
- **PV potential**: photovoltaic potential as a percentage.
- **Summer shade** and **Winter shade**: percentage of shade cast by the relief.
- **Frost risk**: numerical index calculated by the model.


---

## Terrain: accessibility and erosion

Keywords: Tobler, walking speed, visibility, viewshed, RUSLE, soil erosion, walking.

Typical questions: How fast can one walk here? Is the point very visible? Is there a risk of erosion?

The «Accessibility and erosion» group (if there is data) has:
- **Tobler speed**: estimated walking speed in km/h on the slope of the point (calculated with Tobler's function).
- **Cumulative visibility**: how many of the 6 reference observation points can see the point.
- **RUSLE LS erosion**: topographic factor of the RUSLE soil erosion model.

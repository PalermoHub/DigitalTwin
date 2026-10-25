# Live earthquakes

## The «Live earthquakes» layer

Keywords: earthquake, quake, tremor, magnitude, epicentre, INGV, seismic, latest shocks.

Typical questions: Was there an earthquake today? Where were the latest shocks? How strong was the last quake near Palermo? How do I read the circles?

In the Layers panel, in the **«Territory»** group, **«Earthquakes»** section, the **«Live earthquakes»** layer shows the **earthquakes of the last 7 days** around Palermo, in Sicily and the southern Tyrrhenian Sea (the area the map lets you see), from magnitude 1. Each **circle** is an event: **the bigger it is, the stronger the magnitude**. The **colour** tells how long ago it happened: **red** in the last hour, **orange** in the last 24 hours, **blue** within 7 days. The data is renewed every **2 minutes** while the layer is on.

## The details of a shock

Keywords: click, depth, distance from Palermo, area, time, event page.

Typical questions: How do I see the depth of an earthquake? How many kilometres from Palermo was it? Where is the official event page?

With the layer on, a **click on a circle** opens a card with the **magnitude**, **local time** (and how long ago), **area**, **depth** in kilometres, **distance from Palermo** and who located the event, with a link to the event page on the INGV site. The card also opens for events far from the Municipality.

## Source and limits

Keywords: INGV, source, licence, update, reliability, revision.

Typical questions: Where does the data come from? Is it official? Can a magnitude change?

The data comes from **INGV** (the Italian National Institute of Geophysics and Volcanology), from its FDSN web service, under a CC BY 4.0 licence. Locations in the first minutes are **automatic and may be revised**: magnitude and position can change after the seismologists check them. The layer is **informational**: for alerts and safety instructions only Civil Protection counts.

## The earthquake charts and the «i» icon

Keywords: chart, i icon, information, explanation, bars, magnitude over time, cumulative events, Omori, aftershocks, mainshock, swarm, seismic sequence, map filter, slider, histogram, energy, seismic moment, waiting times, space-time diagram, latitude, swarm migration.

Typical questions: What does the earthquake chart mean? How do I read the magnitude over time chart? What is Omori's law? What are aftershocks and the mainshock? How does the map filter slider work? What is the i icon on the earthquake charts for?

Every earthquake chart has a round **«i»** icon next to its title: a click opens a box with three parts, **«What it shows»**, **«How it works»** and **«How to read it»**. It closes with **«Close»** or with a click outside the box. There are nine charts.

- **«Earthquakes per day, month or year»** (panel, «Earthquakes over time» section): bars with the number of events per period, INGV data for the last 5 years from magnitude 2. The **«Events per»** menu picks day (30 bars), month (24) or year (5). A bar turns **red** (swarm) when it exceeds the threshold computed from the median plus 4 times the median deviation, never under 6 events; consecutive red bars form a **sequence** in the «Swarms and seismic sequences» list.
- **«Magnitude over time»**: one stem per earthquake, as tall as the magnitude. The strongest shock (**mainshock**) is in red; the events after it are the possible **aftershocks**. Clicking a stem opens the event.
- **«Cumulative events over time»**: a curve that goes up by one for every earthquake. The slope is the pace of activity: flat = quiet, steep = many events close together.
- **«Omori's law: aftershocks per day»**: aftershocks counted in whole days after the mainshock, on logarithmic axes (days with no aftershocks are not drawn). The dashed line is the fit n ∝ t^−p (it needs at least 3 days with aftershocks): if the points follow it, the sequence decays regularly; **p** close to 1 is a typical decay, higher = it dies out faster. It is an estimate, not a forecast.
- **«Events per day»** (legend, «Map filter» panel, «Charts» button): bars for the last 30 days and a **two-handle slider**; the chosen range filters the map, the menus and the list. «Play» moves the window one day at a time, «Reset» goes back to the whole period.
- **«Events per magnitude»** (same panel): a four-class histogram (1–2, 2–3, 3–4, 4 or more); clicking a column switches the class on or off on the map.
- **«Cumulative energy release»**: seismic moment accumulated over time, as a percentage of the total. Each earthquake weighs about 32 times more than the one a magnitude unit below (Hanks and Kanamori relation), so the curve is dominated by the few large events, unlike the count. The note gives the magnitude equivalent to a single earthquake and the weight of the strongest.
- **«Time between successive events»**: histogram of the waits between one event and the next, from under a minute to over a year (waits under a day in red). It tells swarms (many short waits) from background activity; the coefficient of variation is about 1 if events arrive at random, higher if clustered.
- **«Space-time diagram»**: time horizontally, latitude vertically, one circle per event (bigger = stronger, the strongest in red). It shows whether a swarm migrates north or south; it is latitude, not distance along a fault. A click opens the event.

# Maritime traffic: ships around Sicily

## The «Ships» layer

Keywords: maritime traffic, ships, AIS, AISStream, port of Palermo, ferries, Sicily, category, passenger, cargo, tankers, fishing, pleasure craft, MMSI.

Typical questions: How do I see the ships around Sicily? What do the ship colours mean? Where do the data come from?

The **«Ships»** layer, in the **«Maritime traffic»** section of the **«Transport»** group of the Layer panel, shows the ships transmitting an **AIS** signal in the southern Tyrrhenian Sea, the Strait of Sicily and along the Sicilian coasts (36° to 39° N, 11.5° to 15.5° E). Each ship is a silhouette rotated to its heading and coloured by category: **passenger** (ferries and cruises), **cargo**, **tankers**, **fishing**, **pleasure craft**, **service** (tugs, pilots, rescue), **military**, **other**. The category checkboxes, in the panel and in the legend, show or hide each group.

## Updates and limits

Keywords: update, every 5 minutes, last signal, terrestrial AIS, coverage, 30 minutes, receivers.

Typical questions: How often are the ships updated? Why does a ship disappear? Are ships offshore shown?

The data are not stored in the site: a service (Worker) listens to **AISStream** every 5 minutes and keeps the last position of every ship seen in the **last 30 minutes**; with the layer on the map reloads every 2 minutes. The AIS is **terrestrial**: the data come from volunteers' AISStream receivers, so coverage **depends on where there are any**. The listening area covers **the whole of Sicily with its minor islands** (from Lampedusa to the Aeolians, from Pantelleria to the Strait of Messina). Today ships show up mostly along the eastern coast of Sicily and off Trapani; **in the Gulf of Palermo signals are few or absent**. A ship with no signal for more than 30 minutes disappears. Positions are those of the last signal received, not a continuous track.

## What the popup and the card show

Keywords: popup, tooltip, name, category, status, destination, speed, heading, length, MMSI, last signal, MarineTraffic.

Typical questions: What does the ship popup show? Where is this ship going? How do I follow it?

Hovering over a ship shows its name and category. A click opens the popup with **status** (under way, at anchor, moored…), the **destination** declared by the ship, **speed**, **heading**, **length**, **MMSI** and the time since the **last signal**. In the place card, if the ship is within the municipality, the entry also has the link «Follow the ship on MarineTraffic».

## Things to keep in mind

Keywords: declared data, destination, missing name, ships without AIS, terms of use, AISStream, beta.

Typical questions: Are all ships shown? Are the data reliable? What terms of use apply?

- Destination, name and type are **declared by the ship** through its transponder: they may be missing or out of date.
- Ships without AIS do not appear. The AISStream service gives no availability guarantee and **does not state a data licence**: the terms of use are to be checked.

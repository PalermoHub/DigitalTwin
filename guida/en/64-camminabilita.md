# Walkability

## The «Walkability» layer

Keywords: walkability, on foot, 15-minute city, pedestrian, score, Walkably, liveable neighbourhood, nearby services, living without a car, hexagons.

Typical questions: How walkable is my neighbourhood? Where is it best to live on foot? How many minutes on foot to reach a pharmacy or a stop? What does the walkability score mean? Why are some areas not coloured?

In the Layers panel, in the **«Territory»** group, **«Walkability»** section, the **«Walkability (from zoom 12)»** layer colours the municipality of Palermo with **hexagonal cells of about 95 m**. Each cell has a **score from 0 to 100**: the higher it is, the more useful places can be reached well **on foot**.

The legend, under the layer, has five classes (from very low, 0–19, to very high, 80–100) and lets you turn them on or off one by one. Cells appear from **zoom 12**. Where there are no streets (sea, hills, countryside) there is no cell.

## How the score is calculated

Keywords: score, Reach, street quality, eight needs, minutes on foot, method, OpenStreetMap, estimate.

Typical questions: How is the score calculated? Which services does it count? Why does my neighbourhood have a low score? Is the data reliable?

The score combines two parts:

- **Reach (60%)**: the **minutes on foot, on real streets**, to the nearest place for **eight daily needs**: groceries, food and drink, shops, health, school, parks, culture and public transport. The second and third nearby places count too;
- **street quality (40%)**: traffic, noise (where a noise map exists), summer shade (an estimate), busy roads nearby and slope.

Scores are **estimates** built on **OpenStreetMap**: a shop or pharmacy missing from the map lowers the score, and a cell can be wrong. The score **does not describe safety, crime or income**. The author also publishes the accuracy checks that failed: the «How the score is calculated (Walkably)» link in the card opens the page.

## The card of a cell

Keywords: walkability card, minutes on foot, nearest place, percentile, playground.

Typical questions: How many minutes to the supermarket? Which is the nearest pharmacy on foot? Is this cell better than how many others?

A click on the map, **even with the layer off**, shows in the **Place** tab the **«Walkability»** section of the clicked cell: **score**, rating, **Reach**, **street quality** and the share of cells in the same area with a lower score. Below, **«On foot from the cell»** lists for each of the eight needs the **minutes on foot** and the **type and name of the nearest place**; if there is nothing within **22 minutes** it says so. The nearest playground is shown too.

## Streets

Keywords: streets, busy street, quiet street, mixed street, street quality, noise, shade, slope, trees, traffic, zoom 15.

Typical questions: Is this street quiet or busy? How can I tell which streets are nicer on foot? How much shade does a street have in summer? What do the dark and light lines mean?

From **zoom 15**, **streets** appear as lines over the cells: **dark and thick** for a **busy street** (quality under 45), **grey** for a **mixed** one (45–74), **light and thin** for a **quiet** one (75 and over). The legend has three entries to turn each class on or off. A click **near a street**, even with the layer off, adds the street section to the **Place** tab: name, type, **quality**, **noise** (where a noise map exists), **summer shade** (an estimate), nearness to busy roads, **slope** and trees per 100 m.

## The «Score by need» chart

Keywords: score by need, bars, eight needs, within 5 minutes, within 10 minutes, reachable places, Reach, street quality, park, playground, i icon.

Typical questions: How many shops or pharmacies do I have within 5 minutes on foot? Which need lowers the score of my area? What does the «+» next to a number mean? How do I read the chart?

At the top of the section, three tiles show the cell's **score**, **Reach** and **street quality**. Below, the **«Score by need»** chart has a bar for each of the eight needs, from 0 to 100, and, under each bar, the **places reachable within 5 and within 10 minutes** on foot. A **«+»** means the count is capped and there are more places. The **«i»** icon next to the title explains how it works. If the cell is on a street network cut off from the main one, or inside a park, the card says so in a note.

## Our places and Walkably's places

Keywords: our data, missing places, comparison with Walkably, groceries, bars, shops, pharmacies, schools, parks, culture, stops, remainder, 80 metres a minute.

Typical questions: Why does Walkably count more places than I see on the map? Which places are missing from our data? How is the comparison made?

Below the bar of **each of the eight needs** the card also shows **our own places**: how many we have within 5 and within 10 minutes on foot, and the **three nearest** with their distance in metres. The **name is clickable**: it takes the map to the place and opens its card. The icon next to the distance opens **walking directions in Google Maps** (in the app, on a phone). For school, culture and public transport they come from our own layers (Schools, Monuments and places, Transport). For **groceries, food and drink, shops, health, parks and gardens** they are the **OpenStreetMap** places of the **"Everyday places"** layer, which uses **the same categories as Walkably**.

If Walkably counts more, the card says **how many more**: they are places we do not have. If **Walkably's count is capped** (often the case in the centre), the card says **"at least N more"**: that is a minimum. If **Walkably's nearest place** has no point of ours with the same name, the card flags it with its name and the minutes on foot; when Walkably does not know the name ("an unnamed park") the comparison by name is skipped.

The comparison is **approximate**. Walkably measures minutes on real streets, we measure straight-line distance at **80 metres a minute** (5 minutes is 400 m, 10 minutes 800 m). Walkably is built on the OpenStreetMap state of 29 October 2026 and our extract is from November, so a few percentage points of difference are normal. A name in OpenStreetMap may differ from ours, so a place we already have can appear as missing. Walkably counts a narrower selection of schools and stops than our layers do, so there we may have more.

## The "Everyday places" layer

Keywords: everyday places, OpenStreetMap, groceries, supermarkets, bars, cafes, restaurants, shops, pharmacies, doctors, hospitals, parks, gardens, playgrounds, shapes and colours.

Typical questions: Where are the pharmacies near me? How do I turn on bars and restaurants? Where do these places come from? Why is a shop missing?

In the **Layers** panel, in the **Walkability** section, there are five layers you turn on one by one, each with **its own shape and colour**: **groceries** (trolley, olive green), **food and drink** (cup, orange), **shops** (bag, purple), **health** (cross, red), **parks and gardens** (tree, green). They are **OpenStreetMap** places in the municipality of Palermo, chosen with the categories of the Walkably README: supermarkets and bakeries are groceries, bars and restaurants are food and drink, banks and post offices count as shops, vets do not count as health and nature reserves do not count as parks. A click on a place, **even with the layer off**, opens a card with its name and type; places within the click radius also appear on the card of the point.

The map may be incomplete: a place missing from OpenStreetMap is missing here too. The data is a November 2026 extract under the **ODbL 1.0** licence, © OpenStreetMap contributors, and is renewed by hand with `scripts/luoghi_osm.py`.

## Coloured buildings

Keywords: walkability, buildings, colour, 3D, hexagons, zoom 15.

Typical questions: Why do the hexagons disappear when I zoom in? How are buildings coloured? Does it work in 3D too?

From zoom 15, with the layer on, **buildings take the colour of the cell** they fall in (the cell containing the building's centre) and the hexagonal grid is no longer shown. The same colour applies to the **3D** volumes. Buildings outside the grid stay uncoloured. The legend checkboxes switch classes on and off on the buildings too.

## Source and licence

Keywords: Walkably, source, licence, ODbL, OpenStreetMap, Raian Pollock, credit, open data.

Typical questions: Where does the walkability data come from? Under which licence can I reuse it? Who built the score?

The data is from **Walkably** (Raian Pollock), release 2026.10-m3 of 29 October 2026, on data **© OpenStreetMap contributors**, under the **ODbL 1.0** licence. The Palermo extract is cut from the official file. The credit appears on the map and on the **«Sources and notes»** page.

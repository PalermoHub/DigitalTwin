# Search and filters

## The search field

Keywords: search, find, search bar, street, street number, address, places, results, no results, marker, house number, look up an address.

Typical questions: What can I search for? How do I search for a street with the street number? How do the results work?

The search field is at the bottom of the map (on a smartphone at the top, under the logo). The search starts when at least **3 characters** (or a number) are typed. The results appear in a list under the field. You choose a result with a click or with **Enter**, which takes the first one. The map flies to the point (zoom 18 unless indicated otherwise), a **marker** appears on the point and the text of the result goes into the field. If the result is a place of a layer that is off, the layer turns on by itself. Clicking outside the bar closes the list. If there is nothing: «No results».

**What can be found**
- **Streets and street numbers**: you write the name of the street, all the words in any order, and if needed the number. With «street + number» the search goes to the exact street number; for a number with a letter (for example 4A) it must be written with the letter. If you write “4” and only 4A, 4B… exist, it proposes them. If the street number does not exist, it goes to the street with the note “civico non trovato” (street number not found). Accents and capital letters are ignored. The street numbers are those of the Municipality of Palermo.
- **Places by name**: schools and nurseries, polling stations (also by section number), monuments, monumental trees, drinking fountains, stops (with the lines), bus and tram lines (by number or name), stations and lines of the urban railway, charging points, fuel stations, municipal offices, municipal properties and MEF properties, PEBA, PNRR projects and public works.
- **Cadastral parcels**: you write “12/345”, “f 12 p 345” or “foglio 12 particella 345”. The result is “Cadastral parcel — sheet [n], parcel [n]”.
- **Neighbourhoods, districts and UPL**: the areas whose name starts with the text appear first.
- **Fires and PAI constraints**: see below.
- **Road accidents and streets**: see below.
- **Guide topics**: the search proposes up to 3 guide topics (Guide, Geoimage guide, RNDT plugin), each with the name of the guide.

**Order of the results**: first the rows about accidents (if “incidente” was written), then the areas that start with the text, the places by name, the streets and street numbers and, at the bottom, the areas that contain the text and the rows about streets with accidents.

If an archive does not load, the search says so («Search unavailable: [reason]», «street-number index unavailable»).

---

## Searching for accidents and dangerous streets

Keywords: accident, crash, fatal accident, accidents on a street, year, severity, dangerous road, road safety, most dangerous streets.

Typical questions: How do I find the accidents on a street? How do I search only for fatal ones? Can I search by year?

- Writing **only the name of a street** shows, at the bottom of the results, a row for streets with accidents, with the number of accidents, the fatal ones and, for the most dangerous, the place in the ranking («#[n] among the most dangerous»). A click sets the accident filter on that street, turns the layer on and frames the road.
- Writing the word **“incidente”** or **“sinistro”** (the Italian words for accident; also in the plural) puts the results about accidents **at the top**: the streets and the single accidents. You can add words for the **severity** (“mortale”, “riservata”, “feriti”, “danni/cose”) and a four-digit **year** (for example “incidente mortale roma 2018”). The other words filter by street name.
- Each single accident is a row «Accident [severity] [year]».

---

## Searching for fires and PAI constraints

Keywords: fires 2023, PAI constraints, search by year, search by theme, fire location, burnt areas, wildfire.

Typical questions: How do I search for the fires of a year? How do I find a PAI constraint?

- **Fires**: writing “incendi” (the Italian word for fires) shows «Fires — all years» with the number of areas burnt by fire and the most recent years (up to three rows). Adding a year (“incendi 2023”) shows the row for that year. A click turns the layer on, filters by year and frames the city (zoom 12). You can also search the **locations** of the fires already loaded in the tiles.
- **PAI constraints**: the search proposes the PAI themes and their classes; a click turns on the corresponding layer.

---

## The «Filters» tab

Keywords: filters, filters panel, district, neighbourhood, UPL, line, year, severity, parcel, sheet, number, filter chips, mask, area filter, cadastre.

Typical questions: How do I limit the map to a neighbourhood? How do I filter a transport line? How do I filter accidents by year?

The **Filters** tab of the left-hand bar (on a smartphone in the «Layers» sheet) gathers four filters. A number on the tab says how many are active; under the search field the **chips** of the filters appear, each with a ✕ to remove it.

1. **Area: district › neighbourhood › UPL.** These are three cascading menus: choosing a level narrows the list of the next level, and choosing a low level also sets its parents. The entries are «— All —» and the areas; the districts have the full name (I · Centro Storico, II · Brancaccio, III · Oreto, IV · Mezzomonreale, V · Noce, VI · Resuttana, VII · Mondello, VIII · Libertà). The map **frames the area** and **lightens everything else** with a mask, for all layers. Removing a level also removes those below it; the level above stays.
2. **Public transport line.** It restricts routes and stops to a single line (and to the stops where it passes). The list has one entry per line (the two directions joined): first the buses, then the trams, then the railway; the numbers in numerical order.
3. **Accidents: year and severity.** «All years» or one of 2015, 2016, 2017, 2018, 2020, 2021, 2022, 2023 (2019 is not in the dataset); the severity is «All», Fatal, Injured with guarded prognosis, With injuries, Property damage only. They combine in AND with the **street** chosen from the search. When a filter is active the accidents layer turns on by itself and the points are visible from zoom 12 (otherwise from zoom 14). Chips: «Accidents [year]», «Accidents [severity]», «Accidents: [street]».
4. **Cadastral parcel: sheet and number.** Two fields and a button. Both are needed («Enter both the sheet and the parcel»), the zoom must be at least 12 («Move closer to the area (zoom 12 or more) and try again») and the parcel is found **only if its tiles are already loaded**: if it does not find it, it says «No parcel found: move the map to the right area and try again». If it finds it, it turns on the cadastre, highlights it, frames it and shows a box «Searched parcel — Sheet [n] · Parcel [n]».

The chosen filters are also included in the link of «Share this view».

---

## Live Zoom: the map follows the filters

Keywords: live zoom, real-time zoom, fit the map, frame the results, follow the filters, switch, overlay.

Typical questions: How do I make the map frame the filter results? What is Live Zoom? Where do I turn it on?

With **Live Zoom** on, every time you change a filter the map **fits to the points that remain**: remove a category from the legend or pick a filter option in a layer's panel and the view moves and zooms onto what is left. Removing the filter takes the map back to the whole layer. It is off at first.

**Where to turn it on.** There are two switches showing the same state (turning one on turns the other on too) and the choice is kept in the browser:
- in the **Layers** tab, in the **Overlay** group, next to «Map tooltips» and «Legends on the map»;
- in the **legend** box on the map, as the first row, above «Radius around the click».

**What it reacts to.** It reacts to the checkboxes and controls of the layer filters, not to turning a layer on. It works for every layer with filters. For vector-tile layers it only counts what is already loaded in the view. If the filter leaves no points, the map stays where it is.

---

## The «Reset» button

Keywords: reset, restore settings, customisations, layer order, initial prompt, undo my changes, default colours.

Typical questions: How do I reset the colours and the order I chose? What does the button next to the search delete?

The button with the circular arrow next to the search has two effects:
- if there is a **selection** on the map (areas highlighted by the click), it removes it, like Esc;
- with the map already clear it asks for confirmation: «Reset colours, panels, layer order and the click prompt to their initial values? Added RNDT layers are kept.» On confirming it deletes from the browser the **colours of the layers**, the **information chosen for the profiles**, the **layer order** and the choice not to show the initial prompt, then reloads the page. The added RNDT catalogue layers are not touched.

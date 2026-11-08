# The «Options» tab

## What it is for and how to open it

Keywords: options, Options tab, settings, gear, control panel, preferences, left-hand bar, saved in the browser, restore defaults.

Typical questions: Where are the map settings? How do I open the Options tab? Are my choices saved? How do I bring everything back to the start?

The **«Options»** tab (**gear** icon) is in the vertical bar on the left and gathers in one place the settings for how the map behaves. It opens with a click on the tab; a second click, or Esc, folds it. At the top a line says: «Set how the map behaves. Your choices are saved in this browser.» The choices last **until the browser data is cleared** (history and site data); if the browser blocks saving, they only hold for the session.

Below the line there are **three** foldable **sections**: «Information overlays», «Radius of the surroundings» and «Selection on the map». Each has an icon, a title, a short description and, on the right, a **status summary** (for example «2/3», «300 m», «33/33»). A click on the title folds or reopens it; at start they are all open. At the bottom of «Radius of the surroundings» and «Selection on the map» there is the **«Restore defaults»** button.

The Options tab and the controls on the map (the «Selection on the map» legend, Live Zoom, the radius) always show **the same state**: changing one updates the other at once, without reloading the page.

---

## «Information overlays» section

Keywords: information overlays, map tooltips, legends on the map, Live Zoom, switches, speech bubble, automatic zoom, what appears over the map.

Typical questions: How do I turn off the speech bubbles? Where did the legends go? What is Live Zoom and how do I turn it off? Why does the map zoom by itself?

Description: «What appears over the map». It has **three switches**, each with an icon, a title and a line of explanation:

- **«Map tooltips»** («Speech bubble with the details when you hover the mouse»). **On at start.** When off, no speech bubble appears when you move the mouse over the map (see `46-selezione-in-mappa-raggio-e-fumetti.md`).
- **«Legends on the map»** («Legends of the active layers in the corner of the map»). **Off at start.** When on, the legends of the active layers stay in the corner of the map; when off, each legend stays only **under its own layer** in the Layers panel, as in GIS programs (see `45-barra-strati-legende-e-ordine.md`).
- **«Live Zoom»** («The map zooms by itself to the clicked point»). **On at start.** When on, after a click the map zooms to the point and adapts to the results at every change of the filter; when off, the click only centres the map.

The summary on the right of the title counts the switches that are on out of three: at start **«2/3»**. This section has no «Restore defaults» button.

---

## «Radius of the surroundings» section

Keywords: radius of the surroundings, radius, nearby points, metres, slider, dashed circle, show the circle on the map, area searched at the click, 300 metres.

Typical questions: How do I change the distance within which the card looks for nearby points? How do I remove the dashed circle? What is the starting radius? How do I go back to 300 metres?

Description: «Area searched on click». It has the **same slider and the same switch** as the box on the map:

- the slider **«Radius around the click: [n] m»** goes from **100 to 500 metres** in steps of 50 and starts at **300 metres**; it applies to all point layers (stops, fuel stations, charging points and the others);
- the **«Show the circle on the map»** switch, on at start, draws a dashed circle of that radius around the click.

Changing the radius or the circle redoes the open card at once. The summary on the right of the title shows the radius in metres (for example «300 m»). **«Restore defaults»** brings the radius back to 300 metres and turns the circle on again. For details on nearby points see `46-selezione-in-mappa-raggio-e-fumetti.md`.

---

## «Selection on the map» section

Keywords: selection on the map, what the click highlights, details on hover, all items, highlightable items, highlighted areas, turn off an item, selection legend, restore.

Typical questions: How do I remove the highlighting of a category after the click? How do I turn off all the items together? What are «Details on hover» and «All items»? Why is an item no longer in the legend?

Description: «What a click highlights». The section has:

- **«Details on hover»** («Speech bubble on the highlighted areas»): on at start; when off, the areas highlighted after a click show no speech bubble when the mouse passes over them.
- **«All items»** («Turns the whole list on or off»): it is on when all the items are on; a click turns them all on or off together.
- **The list of items**, one row for **everything a click can highlight** (Building, Cadastral parcel, PRG zone, OMI zone, Monument, Stop, Public work and the others), in **alphabetical order**, even when there is no selection. Each row has its own **symbol and colour** (the shape of the icon for point layers with an icon, a circle for the other points, a square for areas) and a switch.
- A note: **items that are off are not drawn on the map nor listed in the «Selection on the map» legend**.

The summary on the right of the title says how many items are on out of the total (at start all of them, for example «33/33»). **«Restore defaults»** turns the details on hover and all the items back on. The same items can also be turned on and off from the checkboxes of the «Selection on the map» legend on the map: the two controls are in sync. How the selection works after a click: see `46-selezione-in-mappa-raggio-e-fumetti.md`.

---

## Starting values and where the choices are saved

Keywords: starting values, defaults, saved settings, localStorage, clear browser data, start over, private mode.

Typical questions: What are the starting values of the options? Where are my choices saved? Why do the options go back to the starting values? Do they work in private browsing?

| Setting | Starting value |
|---|---|
| Map tooltips | on |
| Legends on the map | off |
| Live Zoom | on |
| Radius of the surroundings | 300 m (from 100 to 500, steps of 50) |
| Show the circle on the map | on |
| Details on hover (selection) | on |
| Selection items | all on |

The choices are saved **in the browser you are using** (not on the server): switching browser or device you start again from the starting values. If the site data is cleared, or if the browser blocks saving (for example in some private modes), the settings only hold for the current session and the starting ones come back on return.

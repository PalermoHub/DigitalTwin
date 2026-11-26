# Selection on the map, radius of nearby points and tooltips

## The selection on the map after a click

Keywords: selection on the map, highlighting, highlighted areas, selection legend, building, parcel, PRG zone, OMI zone, nearby stop, legend entries, coloured areas.

Typical questions: What are the coloured areas that appear after a click? How do I remove some of them? Why do I sometimes see only the building?

After a click on the map the **areas the data of the profile come from** are highlighted. Each type of highlighted thing has a **label** (the same as in the profile) and a **colour**. The possible labels are: Building, Cadastral parcel, PRG zone, PRG historic net, PRG historic centre, PRG constraint (area), PRG constraint (line), OMI zone, Street number, Municipal property, Census section, Terrain grid point (50 m), Monument, School or nursery, Polling station, Municipal offices, Monumental tree, Drinking fountain, Charging point, Fuel station, Stop, Station, Line, Public work and others.

**What is highlighted.** Only one thing is highlighted: the **building** if the click falls on a building (for monuments, schools and polling stations the polygon of the matching building), the **point** if it falls outside the built-up area. If there is neither (for example with only the cadastre or the PRG on) all the areas stay highlighted. The terrain grid does not count.

**The «Selection on the map» legend.** It appears as long as there is a selection on the map. It has one entry for each label with the colour it is drawn in (a circle or the silhouette of the icon for points, a square for areas). Like the other legends it works as a **filter**: a click on an entry leaves only that one on the map, a second click turns them all on again. The selection is removed with **Esc** or with the «Reset» button next to the search (see `44-ricerca-e-filtri.md`).

**With a mouse: right click to clear.** A **right click** on the map removes the selection: it closes the profile, the crosshair, the highlighted areas and the layer pop-ups. It asks for no confirmation and does not delete your settings (unlike the «Reset» button on a free map). In the 3D view, dragging with the right button rotates and tilts the map; neither dragging nor a long press on a phone clears the selection.

**Icons instead of circles.** The point layers with an icon of their own (schools, polling stations, fuel stations, charging points, drinking fountains, trees, monuments, MEF, PEBA and others) are highlighted with the **silhouette of their icon**; the layers without an icon (such as the street numbers) stay circles. The nearby stops are a disc in the colour of the source with the white icon, to tell them apart from the stops of a route. Where two icons touch, one remains, and the nearby stops take precedence.

---

## The crosshair on the clicked point

Keywords: crosshair, clicked point, map moves after click, point under the mouse, right click, clear the selection.

Typical questions: What is the crosshair on the clicked point? Why does the clicked point stay under the mouse? How do I clear the selection with a right click?

A black **crosshair** with a white halo (four corners and a cross) marks the clicked point. With a mouse, when the profile opens the map moves and (with Live Zoom on) zooms in keeping the clicked point **under the pointer**. If the profile opens over that position, the point moves back into the part of the map still visible. On a phone, and when the point comes from Talia, a shared link or the previous and next arrows of the profile, the map brings it **to the centre**. As the point may be off centre, the dashed circle of nearby points can go partly off screen. A layer pop-up (monument, school, drinking fountain and others) moves the map only if it would otherwise be covered or cut off.

To **clear** it, **right click** the map: the crosshair, the profile, the highlighted areas and the pop-ups disappear.

---

## Tooltips when the mouse passes over

Keywords: tooltip, hover, mouse over, details, hide the tooltips, a single tooltip, hover details, pop-up.

Typical questions: How do I turn off the tooltips? Why do I see only one with several sections?

On the map there is **a single tooltip**: at every movement of the mouse each module (boundaries, transport, road safety, layers with a popup template…) says what is under the cursor and the content of all of them ends up in a single box, one section under the other, so the tooltips never overlap. The tooltip shows the title in bold (with a coloured dot if needed), a possible badge and the subtitle; for layers with a legend attribute the same symbol as the legend also appears. The search is only made in the layers that are **on**. A 3D object above the map (such as the building by floors) can hide the other sections.

On the areas highlighted after a click the tooltip gives **the name of the layer and the datum that identifies the element** (for example sheet and parcel, PRG zone with description, OMI band, address of the property, street number, name of the stop, census section).

To turn the tooltips on and off there are two controls:
- the switch **«Map tooltips»** in the «Information overlays» menu (see `45-barra-strati-legende-e-ordine.md`);
- the **tooltip button** in the «Selection on the map» legend (only for the tooltips of the highlighted areas): «Hover details: on (click to hide them)» / «Hover details: off (click to show them)».

The tooltip also appears above the stack in the «3D layers» view (see `39-strati-in-3d.md`).

---

## The radius of nearby points and the dashed circle

Keywords: radius, nearby points, around the click, metres, radius slider, dashed circle, 300 metres, nearby fuel stations, nearby stops, distance.

Typical questions: Within what distance does it look for nearby points? How do I change the radius? What is the dashed circle?

When you click on the map the profile also shows the **points near** the click (stops, fuel stations, charging points and the other point layers). The **radius** is a single one for all the layers and can be adjusted from the legend: in the «Selection on the map» box there is a slider with the label **«Radius around the click: [n] m»**, from **100 to 500 metres** in steps of 50; at the start it is **300 metres**. The choice stays saved in the browser.

The switch **«Show the circle on the map»** (on at the start) draws a **dashed circle** of the radius around the clicked point, with a light halo under the dark line so that it can be read on any background. Changing the radius or the switch redoes the open profile immediately and the circle updates in real time.

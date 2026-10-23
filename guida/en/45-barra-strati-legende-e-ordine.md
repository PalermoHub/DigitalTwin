# Layers bar, legends and layer order

## The layers bar and its tabs

Keywords: layers bar, Layers tab, Basemap, RNDT, My layers, Filters, groups of layers, sections, turn on a layer, eye, switch, left-hand bar.

Typical questions: How do I turn on a layer? Where do I find the groups? What are the numbers on the Layers tab?

The vertical bar on the left has five tabs: **Basemap**, **Layers**, **RNDT**, **My layers** and **Filters**. Only these have a tab of their own; all the other groups of layers (Boundaries, Buildings, Events, Monuments, PAI plan, Population, Terrain, Roadside services, Road safety, Territory, Transport) are **sections of the Layers tab**. The sections are in **alphabetical order** (ignoring capital letters and accents), including those that arrive later; each one opens and closes with a click on the title and the choice is remembered in the browser. Inside a section the subgroup titles (for example «Charging points» in «Roadside services») are collapsible in their turn; once a title is closed, the layers under it are hidden, and a closed section also hides its subgroups.

Each layer has an **eye switch** (the box is there, but the icon is what you see) to turn it on or off. The Layers tab shows whether there are layers on and how many. A click on the active tab folds the panel; the panel stays open until the tab is pressed again or Esc.

If a layer fails to load, a notice «Layer not loaded: [name]» (or «[n] layers not loaded: data unreachable») appears for a few seconds, which is closed with the X.

---

## The buttons next to a layer

Keywords: move up and down, zoom to, palette, colours, opacity, slider, centre on the layer, transparency, drawing order.

Typical questions: How do I frame the data of a layer? How do I make a layer transparent?

Next to each layer (when needed) there are:
- **Move up / Move down** to change the drawing order.
- **«Zoom to [name]»**: frames the map on the area of the layer's data (the extent of its sources, restricted to the working area).
- **Palette** («Colours of [name]»): see `38-tema-dell-interfaccia.md`.
- **Opacity**: a slider «Opacity of [name]» that **multiplies the original opacity** of all the sub-layers of the layer (fills, lines, points, images, icons and texts). Bringing it back to the maximum restores the original values. The chosen opacity is included in the link of «Share this view».

---

## Search layer and information overlays

Keywords: search layer, filter the list, tooltips on the map, legends on the map, information overlays, find a layer.

Typical questions: How do I find a layer among many? How do I turn off the tooltips? Where did the legends go?

The field **«Search layer…»** filters the list; while the search is in progress nothing stays hidden in closed subgroups, so the layer found can be seen.

Below there is the **«Information overlays»** menu with two switches:
- **«Map tooltips»**: the tooltip with the main data when the mouse passes over.
- **«Legends on the map»**: if on, all the legends stay on the map; if off, each legend moves **under its own layer** in the Layers panel, as in GIS programs.

---

## The legends

Keywords: legend, filter from the legend, collapse, legend entry, only this one, second click, all entries, OMI zones, multiple selection.

Typical questions: How do I filter from the legend? How do I hide the legends? What happens if I click an entry?

The legends are in the box at the bottom left; the **«▾ Collapse»** button folds it and reopens it. A legend appears only when its layer is on. Many legend entries are also **filters**, with a box next to the symbol (all on at the start):
- A click on an entry leaves **only that one** on the map; if it was already the only one on, a second click turns all of them on again. The click does not turn off an entry on its own: to see two or more you first choose “only this one” and then turn on the others.
- In legends with many entries (such as the OMI zones) the filter is **multiple selection**: with everything on, the click on an entry (or on a band) leaves on only those; then each click adds or removes them; if nothing is left, everything goes back on.
- Some entries coincide with a whole layer: the box turns the layer on and off.

The legends of the **theme by attribute**, of the **selection on the map** and of the **external services** always stay on the map. Those of the external services say «Loading legend…» or «Legend not available» or «Layer colour» (for vector layers) / «Uploaded file».

---

## Chips of the active layers and counter

Keywords: chip, active layers, turn off from the chip, layer counter, dot on the tab.

Typical questions: How do I see which layers are on? How do I quickly turn one off?

At the top of the map the **chips** of the layers that are on appear (at most 4, then «+[n]»): a click on a chip turns the layer off («Turn off: [name]»). On a smartphone the number of layers that are on appears on the «Layers» button and a dot on the tab.

---

## Layer order on the map

Keywords: layer order on the map, above, below, drag, reset order, collapse all, expand all, reorder layers, reorder.

Typical questions: How do I bring a layer above another? Can I reorder layers from different groups?

At the top of the Layers tab the card **«Layer order on the map»** lists all the layers that are on, of any group: «Top = above on the map. Applies to all active layers, even from different groups.» At least two layers are needed («Turn on at least two layers to change the order»). Each row has **«Move up [name]»**, **«Move down [name]»** and the handle **«Drag to move»**. «Reset order» brings back the starting order. The chosen order is saved in the browser. It also applies to the RNDT layers and «My layers». Inside each group the layers can also be reordered with arrows and dragging; the fixed section titles (such as AMAT and RFI in transport) do not move and the layers are only reordered inside their own section. There are also **«Collapse all»** / **«Expand all»** for the collapsible data under each layer.

---

## Zoom: badge and slider

Keywords: zoom, zoom slider, zoom level, from zoom 12, minimum zoom, zoom badge.

Typical questions: How do I change the zoom? Why does a layer appear only from a certain zoom?

There is a zoom box with a **number** (the current level) and a **slider** from 12 to 18 in steps of 0.1. Many layers have a minimum level and say so in the name, for example «Cadastre: parcels (from zoom 12)», «Street numbers (from zoom 14)», «Accidents (from zoom 14)»: below that level they cannot be seen.

---

## Right-hand panels and use on a smartphone

Keywords: right-hand bar, rail, profile, RNDT, Geoimage, Theme, bottom tabs, sheet, Map Layers Add Menu, mobile, phone.

Typical questions: How do the right-hand panels alternate? How does the bar work on a phone?

**Right-hand bar.** It has one tab per panel: **Profile**, **RNDT**, **Geoimage**, **Theme**. Only one panel opens at a time; clicking the active tab folds the panel and only the bar remains. When there is no profile open the Profile tab says «Profile: tap the map to open it».

**Smartphone** (up to 720 px). A bar with four tabs at the bottom: **Map** (closes everything), **Layers** (bases, layers, filters), **Add** (My layers, RNDT catalogue, Geoimage) and **Menu** (guides and pages about the project). Only one sheet opens at a time. The pop-up menu closes by touching the map or with Esc. If the window widens beyond 720 px the sheet closes and the interface with side bars returns.

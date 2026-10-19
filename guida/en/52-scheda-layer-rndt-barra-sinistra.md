# Profile: managing the RNDT layers in the left-hand panel

## Where the RNDT catalogue layers are

Keywords: RNDT layers, RNDT tab, left-hand bar, left-hand panel, RNDT group, layers added from the catalogue, Topics, From the RNDT catalogue.

Typical questions: Where do I find the layers I added from the RNDT catalogue? How do I manage the RNDT layers in the left-hand panel? What is in the RNDT tab of the left-hand bar?

The layers added from the **RNDT catalogue** are managed in the **RNDT** tab of the vertical left-hand bar (the other tabs are «Basemap», «Layers», «My layers» and «Filters»). The group is titled **RNDT** and says: «Data added from the RNDT catalogue, also restored from the saved state. They are added from the catalogue button in the toolbar.» The same layers also appear among the **Topics**. If you have not added any, the group says «No RNDT layers: look for one in the catalogue.» At the top of the group there is the **«＋ From the RNDT catalogue»** button, which opens the catalogue in the right-hand bar (same effect as the «RNDT catalogue: add data to the map» button in the toolbar).

---

## The controls of each RNDT layer

Keywords: switch on, switch off, eye, checkbox, opacity, slider, remove, bin, arrows, order, drag, alphabetical, transparency.

Typical questions: How do I switch an RNDT layer on or off? How do I change the transparency of an RNDT layer? How do I remove an RNDT layer? How do I change the order of the RNDT layers?

Each layer of the group is a row with:
- the **checkbox with the eye** to switch the layer on and off on the map (it is the same checkbox that drives the Topics tab);
- the **«Opacity»** slider (from 0 to 1, in steps of 0.05) under the row, to make it more or less transparent; the chosen value stays even if the group is redrawn;
- the bin **«Remove layer [name]»**, which removes the layer from the map and from the list;
- the **arrows** and **dragging** to change the stacking order, as in the other groups (the order is saved in the browser). In addition, the **«Layer order on the map»** card in the Layers tab lists all the layers that are on, including those of RNDT and of «My layers» (see `45-barra-strati-legende-e-ordine.md`).

The layers of the group are always listed in **alphabetical order** by name; the arrows and dragging affect the order on the map, not the list.

---

## Notes next to the name and saving

Keywords: this session only, loading errors, unavailable, saving, reopening, 5 MB, lost layers.

Typical questions: What does «this session only» mean? Why is an RNDT layer «unavailable»? Do the RNDT layers stay when I reopen?

A note in brackets can appear next to the name:
- **«(this session only)»**: the layer could not be saved in the browser and stays while the page is open;
- **«(loading errors)»**: the service gave errors during loading;
- **«(unavailable)»**: the layer is not available; the checkbox is disabled.

The layers are saved by themselves in the browser and come back when it is reopened, on or off as they were. A layer whose address is known is saved with the address; data with no known address are saved in the browser up to 5 MB per layer. The «Reset» button of the filters asks for confirmation and says that «Added RNDT layers are kept».

---

## The counter on the group icon

Keywords: dot, counter, layers on, RNDT icon, chip.

Typical questions: What does the dot on the RNDT tab show? How do I see how many RNDT layers are on?

The icon of the RNDT group shows a dot with the **number of layers that are on** in the group; the dot follows the switching on and off and stays correct even when you remove layers. The RNDT layers that are on also appear among the chips of the active layers at the top of the map.

---

## Querying and reading the RNDT layers that are on

Keywords: Other data (RNDT), profile, legend, tooltip, attributes.

Typical questions: How do I see the attributes of an RNDT layer? Where do I find the legend of an RNDT layer?

With the layer on, a click on the map shows its information in the **«Other data (RNDT)»** tab of the right-hand profile; the legend and the tooltips follow the layer. Details in `49-catalogo-rndt.md`.

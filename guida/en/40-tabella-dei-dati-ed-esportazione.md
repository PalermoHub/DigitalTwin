# Data table and export

## What the data table is and how to open it

Keywords: data table, attribute table, rows, columns, drawer, layer on, features in view, open the table.

Typical questions: Where do I see the data of a layer as a table? Why is the table empty? Which rows does it show?

The **«Data table»** button in the toolbar (on a smartphone, in the «Layers» sheet) opens from the bottom a drawer with the rows of the layers that are on, in the style of an attribute table. Each layer that is on has its own tab. The table reads **only the features loaded in the current view**: as you move or zoom the map it updates (after a short pause from the movement). This is why the app warns «Only the features loaded in view.»

Messages when there is nothing to show:
- «No layer is on: turn one on to see its rows.»
- «No features in view. Turn on a layer from the card and zoom in.»

**Height of the drawer**: it is changed by dragging the handle «Resize the table» (also with the keyboard); the height chosen stays saved in the browser (at the start 280 px). It closes with «Close the table».

---

## Which layers can be seen in the table

Keywords: layers in the table, which layers, list of table layers, added layers, PAI.

Typical questions: Does my layer have a table? Which layers are there?

The table knows these layers: Charging stations, Fuel stations, Schools and nurseries, Municipal offices, Public transport stops, Cadastre: parcels, Road accidents, Districts (circoscrizioni), Neighbourhoods, UPL, AMAP water districts, Census sections, Monuments, Monumental trees, Public drinking fountains, Polling stations, Municipal properties, Accidents per km on roads, The 20 most dangerous roads, Accident hotspots, Bus lines, Tram lines, Wildfires, House numbers, OMI zones 2025, PRG 2004 (zoning, historic centre PPE, area constraints, line constraints), Heat islands, Properties declared to the MEF, PEBA, PNRR, Public works, Commuting to and from Palermo 2021 and Population by section. There are also the **PAI themes** (registered at start-up) and the **layers you added** (file, WFS, ArcGIS, RNDT): for these the source is «Layer you added: source and licence are those of the original file or service».

For each layer the table starts with the **main columns** (for example, for the cadastre, sheet and parcel); the other fields are in the «Columns» menu.

---

## Filtering, sorting and choosing the columns

Keywords: filter the rows, sort, columns, show the column, move column, export the column, header.

Typical questions: How do I search for a text in the table? How do I sort by a column? How do I hide or reorder the columns?

- **«Filter the rows»**: searches the text in all the fields of the row.
- **Sorting**: one click on the header («Sort by [column]»). Numbers are sorted as numbers, text in Italian alphabetical order; empty cells stay at the bottom in both directions.
- **«Columns» menu**: for each column there are the checkbox «Show the column [name]», the checkbox «Export the column [name]» and the arrows ◀ ▶ to move it left or right. Hiding a column also removes it from the exported file; showing it again puts it back; the «Export» checkbox on its own acts only on the export.
- The choices about the columns are saved in the browser **for each layer**.
- When new fields appear as the view moves, they are added at the end.
- Cells with lists (arrays) are shown separated by semicolons.

**Limits**: if there are more than **20,000** rows the table asks you to narrow the view or the selection («More than 20000 rows»). On the page at most **2,000** rows are shown («Showing the first 2000 rows: filter or narrow down to see the others»).

---

## Choosing the rows: selection tools

Keywords: selection, click, box, polygon, area, district, neighbourhood, UPL, back to the view, clear the selection, select all rows, invert.

Typical questions: How do I select only the features inside an area? How do I draw a polygon? How do I add to the selection?

The four **selection tools** are in the bar of the table. When one is active the cursor becomes a crosshair; it is switched off by pressing the button again or with **Esc**.
- **Click**: chooses the feature under the click (tolerance of about 6 pixels).
- **Box**: you drag a rectangle (a drag that is too short is ignored). While dragging, the map does not move.
- **Polygon**: one click for each vertex, a **double click** closes the shape. At least 3 distinct vertices are needed, otherwise it says «At least 3 distinct vertices are needed.»
- **Area**: a click inside a district, a neighbourhood or a UPL; the «Area type» menu chooses which. If there is no area under the click it says «No area under the click: turn on the boundaries and try again.»

Holding down **Ctrl (or Cmd)** during the click, the new choice is **added** to the previous one. With a selection active the table shows only the rows that fall in the areas chosen; **«Back to the view»** returns to the rows visible on the map. On a smartphone the Box and Polygon tools are hidden.

Single rows are ticked with the row checkbox; with **Shift** a range is ticked. There are «Select all rows», **Invert** and «Clear the selection». An announcement for screen readers says how many rows are selected.

---

## Exporting to CSV and GeoJSON

Keywords: export, CSV, GeoJSON, download, rows × columns, exported file, source and licence, approximate geometry, confirmation, file name.

Typical questions: How do I download the data? What does the file contain? Why does the GeoJSON ask for confirmation? Can I export all the layers?

The **«CSV»** and **«GeoJSON»** buttons show how many rows and columns will come out (for example «33 × 15»). The **selected rows** come out; if none is selected, **all the rows of the table** come out. The columns with the «Export» checkbox active come out. The button is off if there are no rows or columns.

**All the layers listed have export enabled**, including those you added. If it were not enabled for a layer the button says «Export is not enabled for this layer yet.» (For third-party layers the licence conditions of the source apply, indicated in the file.)

- **CSV**: the first row has the original names of the fields (not the translated labels, so they stay the same in all languages); comma separator; the last column **«fonte»** (the name is in Italian in the file) gives the source and licence of the layer. The file begins with a marker that lets Excel read accented letters correctly.
- **GeoJSON**: a FeatureCollection with the properties of the columns chosen and the geometry of each row. A `metadata` block gives the layer, the source, whether the geometry is approximate and the date of the export.
- **Simplified geometry**: for some layers the geometry already arrives simplified by the tiles (cadastre, accidents, boundaries and sections, municipal properties, road safety, wildfires, OMI, PRG and constraints, heat islands, population by section, layers you added). The table warns «Geometry simplified by the tiles: use the CSV for exact data.» and, before exporting the GeoJSON, asks «This layer has geometry simplified by the tiles. Export the GeoJSON anyway?» When a feature is cut by the tiles into several pieces, the row still has a single merged geometry.
- **File name**: `[layer]-YYYY-MM-DD.csv` or `.geojson`.

Commuting uses the whole file (not just what is in view) and the CUP link columns of PNRR and public works point to OpenCUP.

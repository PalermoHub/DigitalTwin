# Geoimage: georeferencing and overlaying a historical map

## What Geoimage is and how to open it

Keywords: Geoimage, historical map, georeference, overlay an image, GCP, control points, ground control points, opacity, Geoimage tab, old map.

Typical questions: What is Geoimage? How do I overlay an old map on today's city? Which images can I use?

**Geoimage · historical maps** lets you overlay a historical map (or any image) on modern cartography and **georeference** it, that is, associate real geographic coordinates with it through **Ground Control Points (GCP)**. In the Digital Twin it works on the Palermo basemap. The idea and the code come from Geoimage by @gbvitrano (ported to MapLibre). It opens from the **Geoimage** tab of the right-hand bar (on a smartphone from the button in the «Layers»/«Add» sheet) and closes with «Close Geoimage» (on a smartphone with the X at the top right of the panel). At the start the panel says «Load a historical image to get started.» The complete guide is also on the «Geoimage guide» page of the menu.

---

## Loading and positioning the image

Keywords: load historical map, JPG PNG WEBP BMP, drag, handles, scale, distort, rotate, lock, reset, undo, redo, upload image.

Typical questions: How do I load the image? What do the handles do? Can I undo a move?

1. **Frame the area** with the app's search (street, house number, district), so that the image loads already close to the right place.
2. **Load**: you drag the file (**JPG, PNG, WEBP, BMP**) into the **«Load historical map»** box or you click the box to choose the file. The image appears in the centre of the map with the handles and follows the map even if it is rotated or tilted in 3D. The panel says «Image loaded. Position it with the handles on the map, then add the GCPs (G key).»
3. **Position and orient** with the handles on the map: the **orange circle in the centre** moves the image; the **circle with the arrow above the north side** rotates it; the **handles at the corners** have two modes that are switched with the **«Handles: scale / distort»** button: in *scale* (orange squares) they resize in proportion keeping the opposite corner fixed; in *distort* (blue diamonds) each corner moves freely, useful for historical maps that are not rectangular.
4. In the **«Position overlay»** section there are the precise controls: arrows to move, rotation of 5° left and right, scale 10 % up or down, ⌖ to frame the image, **«Lock (L)»** to freeze the handles and **Reset** to bring everything back to the initial position.
5. **Undo** (Ctrl+Z) and **Redo** (Ctrl+Y) go back and forth through up to **50 positions**; with Shift they take 10 steps. The history starts again when another image is loaded. **«Remove image»** takes the image off the map.

If you choose a file that is not an image: «choose an image file (JPG, PNG, WEBP or BMP).»

---

## Control points (GCP) and alignment

Keywords: GCP, add GCP, step 1, step 2, at least 3 points, align image to the GCPs, affine, polynomial, RMSE, residual, error in metres, georeferencing.

Typical questions: How do I add a GCP? How many are needed? What does RMSE mean?

**Adding a GCP** (button **«Add GCP (G)»** or the G key): for each point you need **two clicks on the map**.
- **Step 1**, on the historical image: you click a recognisable point (a crossroads, a building, a monument); an orange circle appears.
- **Step 2**, on the base map: you click the same place in the modern cartography; the GCP is added and the circle becomes red and numbered.
- **Swipe** or **Spotlight** help you see the base under the image to click precisely.
- **Esc** cancels the pending step 1; pressed again it leaves GCP mode. In this mode clicks on the map do not open the place profile.
- You need **at least 3 GCPs**, preferably spread over the corners of the area covered by the image. With fewer the panel says «[n] GCPs: at least [min] needed».
- A table shows for each GCP its coordinates, pixel and residual; **«Remove GCP [n]»** removes one point and **«Delete all GCPs»** removes them all. **Delete** or **Backspace** removes the last one added.

**Aligning.** With 3 or more GCPs **«Align image to the GCPs»** is enabled, which moves the image to the calculated coordinates. The **«Transformation»** menu chooses the type: **Affine (≥3 GCP)** or **Polynomial 2 (≥6 GCP)**. You can repeat it by adding more GCPs.

**Checking the error (RMSE).** As soon as there are enough GCPs for the chosen transformation the **RMSE** appears, the mean error in **metres**: the lower it is, the better. In the table each GCP has its own **residual in metres**, coloured relative to the average: **green** if it is within the norm, **orange** if it is high, **red** if it is much higher than the others. If the error is high you reposition the least precise GCPs (by dragging them on the map) or add more.

---

## Visual comparison: Swipe and Spotlight

Keywords: swipe, spotlight, radius, invert, comparison, opacity, sliding line, circle, compare maps.

Typical questions: How do I compare the historical map with today's? How do I use Spotlight?

In the **«Visual comparison»** section:
- **Swipe**: splits the map with a **sliding vertical line** (on the left the historical image, on the right the modern base alone). You drag the central handle between 2 % and 98 % of the width; with Swipe on you can still move and zoom the map by keeping the cursor away from the handle.
- **Spotlight**: a **circle that follows the mouse** reveals the modern base under the image. The **«Radius»** slider enlarges or reduces the circle; the **⇄** button inverts the effect (the image is only seen inside the circle).
- Swipe and Spotlight **are mutually exclusive**: turning one on turns the other off. Pressing the same button again turns it off.
- A slider adjusts the **opacity** of the image; the image sits above all the layers.

---

## Exporting and saving the project

Keywords: export, KMZ, GeoTIFF, QGIS, .points, world file, GCP GeoJSON, JSON, project, autosave, MapWarper, save.

Typical questions: How do I bring the result into QGIS? Is the work saved? Can I reopen it?

In the **Export** section:
- **KMZ**: for Google Earth, QGIS and ArcGIS, with the image embedded.
- **GeoTIFF**: a raster with the coordinates embedded, for QGIS, ArcGIS, GDAL. The button opens **«GeoTIFF settings»**: **coordinate reference system** (WGS 84, UTM 32N or 33N, Web Mercator), **resampling** (Nearest neighbour or Bilinear (2×2)), **maximum resolution** (long side) and **compression** (None or **LZW (recommended)**), then «Export GeoTIFF». In EPSG:4326 with the affine transformation is embedded without resampling. At least the number of GCPs required by the transformation is needed.
- **GCP for QGIS (.points)**: the GCPs for the QGIS Georeferencer.
- **World file**: the affine transformation in six lines (at least 3 non-collinear GCPs are needed).
- **GCP GeoJSON**: the control points as geographic data.
- **JSON** («Export JSON» and «Import JSON»): saves and reopens the whole project (image, position and GCPs); it is the same format as Geoimage.

**Saving.** The project is saved **by itself in the browser**: when you reload the page you find the image where it was (if the browser allows it; with large images or with the storage blocked Geoimage warns you and recommends «Export JSON»). **Ctrl+S** saves by hand in the browser («Project saved in this browser.»).

**Shortcuts** (with the panel open and the cursor outside the text fields): **G** GCP mode; **Esc** cancels step 1, then leaves GCP mode; **Delete/Backspace** removes the last GCP; **Ctrl+Z / Ctrl+Y** undo and redo; **Ctrl+S** save; **L** locks or unlocks the handles.

**What changes in the Digital Twin compared with the original Geoimage**: the image sits above all the layers; it also works with the map tilted and rotated; the basemap and the search are those of the Digital Twin (there is no base selector or place search of Geoimage); the handles are only visible with the panel open; switching scale/distort is done with a button (a click on the map opens the profile); it works best with a mouse.

**More precision.** For more precise georeferencing, with advanced polynomial transformations and online collaboration, **MapWarper** (mapwarper.net) is recommended. The already georeferenced historical maps of the Atlas are among the map's bases (see `47-mappe-di-base-e-storiche.md`).

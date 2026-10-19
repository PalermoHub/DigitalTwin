# «My layers»: adding your own data and services

## What the «My layers» tab is

Keywords: My layers, add data, add a service, tree, QGIS Browser, layers on the map, files and services, my own layers, upload.

Typical questions: How do I add my own layer? Where do I see the layers I have added? How does the tree work?

The **My layers** tab (on a smartphone, in the «Add» tab) works like the QGIS Browser. At the top there is a **tree** with a search field (**«Search data sources…»**, which searches by name or address among the saved services) and two branches: **«My data»** (files) and **«Services»**. Below the tree there is **«Layers on the map»**, the list of the layers that were added, each with its checkbox, its opacity and the arrows for the order; if there are none it says «No layers on the map: load a file or add a service from the tree above.» The tree is built only once: open branches and typed text stay even when the group is redrawn.

The description of the group: «Files loaded from your computer and XYZ, WMS and WFS services added by address, also restored from the saved state.»

The layers that were added also appear in the data table (see `40-tabella-dei-dati-ed-esportazione.md`) and in the stack of layers in 3D as «Other layers». Only the ones that can be reopened from a public address go into the «Share this view» link (see `43-condividi.md`).

---

## My data: files from the computer and from a web address

Keywords: load file, GeoJSON, KML, KMZ, GPX, Shapefile, zip, CSV, latitude longitude, Google Sheets, https address, shared sheet, upload a file, formats.

Typical questions: Which formats can I load? How do I load a Google sheet? Why do I only see part of the file?

Formats: **GeoJSON, KML/KMZ, GPX, Shapefile (.zip) and CSV with latitude and longitude**.
- **«Load a file from your computer»**: you choose the file. The app reads it and converts it to GeoJSON in WGS84; if there are errors it shows them («Not loading “[file]”: [reason]»). A Shapefile goes in a zip file that also contains the .prj file; GeoJSON and CSV must be in WGS84.
- **«From a web address (https)»**: you paste an https address («Paste an https address.») and press **Load**. The file is downloaded through the app's proxy. The file is a copy that does not update by itself; maximum 10 MB.
- **Google Sheets sheet**: it must be shared first: «In Share → General access choose “Anyone with the link” with the Viewer role. The sheet becomes a CSV (only the sheet indicated in the link) and must have lat and lon columns. Maximum 10 MB.»

Of each file only the features **inside the municipality of Palermo** are kept. A layer from a file is saved in the browser (up to 5 MB); beyond that, it only lasts while the page is open and next to the name «this session only» appears. The data of the files stay in the browser: they are not sent to anyone.

---

## Services: XYZ, WMS, WMTS, WFS and ArcGIS REST

Keywords: service, XYZ, WMS, WMTS, WFS, ArcGIS REST, MapServer, FeatureServer, capabilities, read the service, data or images, token, user, password, add a WMS.

Typical questions: How do I add a WMS service? What does «Show as» mean? Where do I enter user and password?

The **Services** branch has a sub-branch for each type: **XYZ, WMS, WMTS, WFS and ArcGIS REST**. The **«+»** button («Add a [type] service») opens a form:
- **Name (optional)** («What do you call it»).
- **Service address**: for XYZ an address with `{z}/{x}/{y}`; for ArcGIS REST the address of a MapServer or FeatureServer (with `?token=…` if needed); for the others the address of the service. The app's proxy only accepts **https** addresses.
- **User (if needed)** and **Password (if needed)**: the password stays «only while the page is open».
- For ArcGIS, a **Service token** field.
- **Read the service** («Reading the service…»): reads the list of layers and the choice to be made: you tick the layers and press **«Add selected»** («Choose at least one item.» if nothing is selected). If the service has a tile cache, a single layer with all the levels is added as «Images».
- **Show as**: **«Data (features you can query)»** or **«Images (like a map)»**, when the service allows both.

Some services are not supported: «(not supported: EPSG:3857 required)» and, for WMTS, «(not supported: EPSG:3857 and 256 px tiles required)». Errors appear as «Unable to read the service: [reason]» or «Unable to load: [reason].» At the end: «Added to the map.»

---

## Saved services, padlock and limit

Keywords: saved services, 50 services, padlock, password required, bin, remember the service, token, credentials, limit.

Typical questions: Do the services stay saved? Is the password saved? How many services can I save?

The services that were added stay **saved in the browser** (only the address and the choices, never the data) **up to 50**; beyond the limit the service goes on the map but is not saved («Added to the map. You have reached the limit of [n] saved services: this one will not be saved.»). A click on a saved service puts it back on the map as it was, without reading the capabilities again; the bin removes it from the list.

**Credentials.** User and password are kept **only in memory, for the session**: never in localStorage, IndexedDB or in the address. Of the service the user name is remembered, never the password. When it is reopened the service shows a **padlock** and its layer does not start until the password is entered again («Password for “[user]” required — [url]»); for a service with a token «Token required — [url]» appears. Each site has its own access header and goes through the proxy.

---

## Ready-made lists: orthophotos, Esri bases, the City's historical maps, cultural heritage

Keywords: orthophoto, Regione Siciliana, Esri, Sispi historical maps, SAS 1981, cultural heritage, archaeological sites, archaeological parks, ready to switch on, aerial images, geological maps.

Typical questions: Are there ready-made services? Where do I find the orthophotos?

In the Services branch there are groups of ready-made services: one click puts them on the map (the tiles only start loading then, and only for the area in view).
- **Regione Siciliana - Ortofoto**: aerial images placed **under the data**, with the layers on top. Among the entries: Ortofoto 2022 (20 cm), 2019 (20 cm, AGEA), 2013 (15 cm for Enna, Messina, Palermo, Ragusa, Trapani; 25 cm), 2008 (25 cm).
- **Esri - Basi cartografiche**: Esri street and topographic bases, placed under the data (among the entries Esri Standard and Esri Topo).
- **Comune di Palermo - Carte storiche**: historical maps, surveys and orthophotos of the City (Sispi), for example SAS 1981 (historic centre, roof map), Ortofoto del centro storico 2000, Carta tecnica comunale 1989-91, SAS 1973 (spot-height plan).
- **Regione Siciliana - Beni culturali**: cultural heritage services (SITR) put on the map as **queryable data** over the area of Palermo, for example Beni isolati, Beni paesaggistici (D.Lgs. 42/04), Parchi archeologici (2016), Siti archeologici.

- **ISPRA - Carte geologiche**: geological map 1:50,000 (raster) and the 1:25,000 survey data of the Geological Survey of Italy (CARG): geological units, Quaternary deposits, boundaries, tectonic and structural elements, bedding attitudes, resources and prospecting (quarries, springs, wells, boreholes), put on the map as WMS under the data. The 1:25,000 geomorphology is not included: the service no longer appears to be active.

A few XYZ services, the WMS of the City of Palermo (Sispi) and the ArcGIS REST services of the SITR of the Regione Siciliana are also already loaded, as examples.

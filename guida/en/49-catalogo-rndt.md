# RNDT catalogue

## What the RNDT catalogue is and how to open it

Keywords: RNDT, catalogue, National Register of Territorial Data, openrndt-geolibre plugin, Andrea Borruso, onData, search for data, add data from the catalogue, spatial data catalog.

Typical questions: What is the RNDT catalogue? How do I open it? Who wrote the plugin?

The **«RNDT catalogue: add data to the map»** button (icon of the two layers) in the toolbar at the top right opens the catalogue of the **Repertorio Nazionale dei Dati Territoriali** (National Register of Territorial Data): the list of the geographic data published by bodies all over Italy. The title of the panel is **«RNDT catalogue · Palermo»**. The panel sits alongside the place profile in the right-hand bar (on a smartphone it overlays the bottom sheet) and the **RNDT** tab switches from the catalogue to the profile. While it loads it says «Loading the catalogue…». It is closed with «Close the RNDT catalogue» or with **Esc**: the first Esc closes the catalogue, the second the profile.

The catalogue is based entirely on the **openrndt-geolibre** plugin, conceived and written by **Andrea Borruso (onData)**, MIT licence; in the panel «openrndt-geolibre plugin by …» appears. The project only adapted it (the plugin is loaded only on first use and an Italian translation of it exists). The «RNDT plugin» page of the menu explains how to use it and gives the credit.

---

## Searching and adding data

Keywords: search the catalogue, topic, body, WMS, WFS, Palermo boundary, download, features outside the municipality, find data.

Typical questions: How do I search for a dataset? Why do I only see Palermo? What happens to the data outside the municipality?

You search by **text, topic or body**, always within the **area of Palermo**: «Downloads are always limited to the Palermo area». The plugin's search controls are limited by the app to that area. A **WMS** service is added as a layer of images; a **WFS** service as geographic features that can be queried.

The data that are downloaded are filtered on the municipality of Palermo: the app keeps the whole features that touch the municipality (without cutting them), and warns when it discards some: «“[name]”: [n] features out of [tot] are outside the municipality of Palermo and are not shown.» For files with rows without coordinates it says «[n] rows without valid coordinates were skipped».

Access to the external service goes through a **Worker proxy** of the app: in production the address is fixed (a link with a different proxy cannot send users' data to someone else's proxy).

---

## The «RNDT» group in the layers bar

Keywords: RNDT group, layers added from the catalogue, remove, switch on, this session only, saving, restore.

Typical questions: Where do I find the layers I added from the catalogue? How do I remove them? Do they stay when I reopen?

The layers that were added appear in the **«RNDT»** group (RNDT tab of the left-hand bar) and among the **Topics**. The group explains: «Data added from the RNDT catalogue, also restored from the saved state. They are added from the catalogue button in the toolbar.» and, if it is empty: «No RNDT layers: look for one in the catalogue.» There is the **«＋ From the RNDT catalogue»** button. Each layer has: the **eye** to switch it on and off, the **opacity** slider, the bin **«Remove layer [name]»**, and the arrows for the order (see `45-barra-strati-legende-e-ordine.md`). The layers are in **alphabetical order**; a dot appears with the count of the layers that are on.

The layers are **saved by themselves** in the browser and come back when it is reopened, on or off as they were. A layer whose address is known is saved with the address; data with no known address are saved in the browser up to **5 MB per layer**: beyond that, or if the browser blocks the storage, they last for the session and a notice says so. Next to the name, **«(this session only)»** warns that the layer could not be saved (for example because «“[name]” is too large to be saved»); **«(loading errors)»** and **«(unavailable)»** signal problems.

---

## Querying the RNDT layers: profile, tooltips and legends

Keywords: Other data (RNDT), GetFeatureInfo, attributes, query a WMS, remote tooltip, service legend, GetLegendGraphic, popup, feature information.

Typical questions: How do I see the information of an RNDT layer? Why does the WMS not show me attributes? Where do I find the legend?

- **Profile**: a click on the map queries the RNDT layers (and those of «My layers») that are on. The answers are in the **«Other data (RNDT)»** tab, with a box for each layer and the source indicated («Source: [host] (RNDT catalogue)»). For **WFS** the profile shows the attributes of the clicked feature (you have to click right on the feature); for **WMS** the app asks the service for the information on the point (`GetFeatureInfo`, on a window of ±50 pixels around the click) and reports the answer; for **ArcGIS** it runs a query on the point. If the level is graphic only it says so. The data of external services are for information only.
- **Tooltips**: the **vector** layers that were added show, when the mouse passes over them, the name, the first property with the layer's colour and a couple of lines. For **WMS and image-based ArcGIS** services the request to the server only starts when the mouse stops (otherwise every movement would be a request). The extents of the catalogue data appear in the map's single tooltip, from the smallest to the largest.
- **Legends**: one block for each layer that is on. For WMS it is the service's `GetLegendGraphic` image; for ArcGIS MapServer the classes with their symbol; for vector data a small square of the colour with which they are drawn. XYZ and WMTS have no legend. If the service does not answer it says «Legend not available» and does not retry at every click.

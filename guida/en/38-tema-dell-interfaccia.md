# Interface theme and layer colours

## The «Interface theme» panel

Keywords: theme, interface theme, change the colours, dark theme, light theme, customise, ready-made themes, Theme tab, right-hand bar, colour scheme, appearance.

Typical questions: How do I change the colours of the site? Where is the dark theme? Does my theme stay saved? How do I go back to the original colours?

The **«Interface theme»** panel opens from the **Theme** tab of the right-hand bar (next to Profile, RNDT and Geoimage). It changes the colours and the text of **the whole application**, not just the map. Every choice has an **instant preview**. At the top there is a status line: «Pick a ready-made theme or adjust the colours: the preview is instant.»; after a choice it says «Active theme: [name]. It stays saved in this browser.» or «Custom theme active; it stays saved in this browser.»

The panel has four sections: **Ready-made themes**, **Colours**, **Text** and **File on your computer**. The button with the moon in the toolbar is another route: it switches from the light theme to the dark theme and, if there was a custom theme, removes it and goes back to the standard colours.

---

## Ready-made themes

Keywords: ready-made themes, light, dark, accessibility, high contrast, colour-blind, show more, Sea, Forest, Sepia, Midnight blue, Terminal.

Typical questions: Which themes are there? Is there a theme for colour-blind users? Is there a high-contrast theme?

The ready-made themes have a thumbnail and are divided into three groups:
- **Light**: Light, Sea, Forest, Sepia, Lavender, Grey, Paper, Mint, Dusty rose, Dawn.
- **Dark**: Dark, Midnight blue, Sunset, Graphite, Ocean, Purple night, Terminal.
- **Accessibility**: **High contrast**, **Colour-blind: red-green** (for those who confuse red with green) and **Colour-blind: blue-yellow** (for those who confuse blue with yellow). These three are always all in view.

In the Light and Dark groups the first four themes are shown; the «Show [n] more» button shows the others and «Show fewer» closes them again. The active theme is marked; if it is among the hidden ones the group opens by itself. One click on a theme applies it immediately.

The two colour-blind themes use a palette designed for this purpose and also change the colours for success, error, notices, the searched parcel and the values in charts, which are no longer green and red.

---

## Basic and advanced colours

Keywords: background, text, accent, links, borders and lines, hexadecimal, contrast, fix, advanced colours, success, error and alarm, notice background, searched parcel, chart values.

Typical questions: How do I choose an exact colour? What does the contrast notice mean? What are the advanced colours for?

The **«Colours»** section has a live preview (a thumbnail of the interface) and five basic colours:
**Background**, **Text**, **Accent**, **Links** and **Borders and lines**.

Each colour is chosen with the browser's colour picker or by typing the **hexadecimal code** (with or without #). As long as the code is not valid the field marks the error and the theme does not change.

**Contrast check.** For **Text** and **Links** the app measures the contrast with the background. If it is too low the notice «Contrast [n]:1 on the background: at least 4.5:1 is needed to read comfortably.» appears, with the **«Fix»** button, which brings the colour to the nearest one that reaches the minimum.

**Advanced colours** (collapsible section «Advanced colours»): status and highlight colours. If you do not choose them, they use the standard ones of the light or dark theme. There are five:
- **Success**: confirmation messages and active switches.
- **Error and alarm**: errors, alarms and actions that delete.
- **Notice background**: the background of the yellow banners.
- **Searched parcel**: the outline of the cadastral parcel searched for.
- **Chart values**: bars and lines of the charts in the profiles.

The «Reset advanced colours» button appears only if you have changed any of them. From the five basic colours the app works out the others by itself (secondary backgrounds, muted text, borders, highlighting, speech bubbles).

If the background colour chosen is dark, the app also automatically switches the light/dark button (logo, base map and header) to match the theme.

---

## Text: size and typeface

Keywords: text size, enlarge the text, typeface, font, Montserrat, Georgia, Atkinson Hyperlegible, high legibility, monospace, reading difficulty.

Typical questions: How do I enlarge the text? Can I change the typeface? Is there a typeface for people with reading difficulties?

The **«Text»** section has:
- **Text size**: a slider from **85% to 150%**, in steps of 5%. 100% is the default and the slider scales the whole interface.
- **Typeface**: **Montserrat (default)**, **System font**, **Serif (Georgia)**, **Monospace** and **Atkinson Hyperlegible (high legibility)**.
- A preview («Palermo Digital Twin: 0123456789 — Text preview»).
- The **«Reset standard text»** button, active only if something differs from the default.

---

## Saving, loading and resetting the theme

Keywords: save to file, load from file, JSON file, restore standard colours, undo, another device, theme privacy.

Typical questions: Is the theme sent to anyone? How do I use it on another device? How do I remove it? Can I go back if I remove it by mistake?

The **«File on your computer»** section has:
- **Save to file**: saves the theme to a `.json` file on the computer (the suggested name is `tema-digital-twin.json`; where the browser allows it, a «Save as» window opens).
- **Load from file**: reads a theme from a `.json` file. If the file is not a JSON, is not an interface theme or does not contain valid colours, the app reports it.
- **Restore standard colours**: removes the custom theme and goes back to the colours of the app.

The note says: «The theme is saved to a file on your computer: it is not sent to anyone. You can load it back here or on another device.» The active theme also stays **saved in the browser** and is found again on the next visit; if the browser cannot save it, it holds for the session.

After removing the custom theme (with «Restore standard colours» or with the light/dark switch) the **«Undo»** button appears for about eight seconds to get it back.

---

## Colouring a layer: fill, outline, width

Keywords: layer colours, palette, fill, outline, width, colour by category, reset, export JSON, import JSON.

Typical questions: How do I change the colour of a layer? How do I go back to the original style? How do I share the colours of a layer?

Next to each layer the **palette** button («Colours of [layer name]») opens a small panel (it appears only if the layer has polygons, points or lines). It contains, when needed:
- **Fill** and **Outline** (colour); for lines **Line colour** and **Width** (slider from 0 to 6, in steps of 0.5).
- **Colours by category**: one colour for each category of the layer; the dots in the legends follow the colour chosen.
- **Colour by attribute** (see below).
- **Reset** (goes back to the original style: «Original style restored»), **Export JSON** (exports the themes of all layers) and **Import JSON**.

The theme of each layer is saved in the browser. If the file imported is not valid, the app reports it («Invalid file: not a JSON file», «Invalid file: not a layer theme» or «The file contains no valid themes»).

---

## Colour by attribute: categories and graduated

Keywords: colour by attribute, by category, graduated, quantiles, equal intervals, ramp, ColorBrewer, Crameri, reverse the colour scale, detect values, field, classes, theme legend, choropleth.

Typical questions: How do I colour the buildings by density? What are quantiles and equal intervals? What does «Detect values» mean? What are the Crameri ramps?

In the small colour panel the **«Colour by attribute»** section colours the features according to a field of the data. You choose:
- **Type**: **None**, **By category** (one colour for each value of the field) or **Graduated (numeric)** (divides a numeric field into classes).
- **Field**: the data field. The **«Detect values»** button reads the values of the features that are in view; if no feature is in view the app says to turn on the layer and frame the area, then press «Detect values».
- For the graduated type: **Method** (**Quantiles**, the same number of features per class, or **Equal intervals**) and **Classes** (up to nine; if the values are too similar to form classes it says so).
- **Ramp**: the colours. Groups: **ColorBrewer** (Blue, Green, Orange, Purple, Red–Green), **Crameri · sequential** (Batlow, Acton, Bamako, Bilbao, Davos, Devon, Lajolla, Lapaz, Oslo, Tokyo, Turku) and **Crameri · diverging** (Bam, Broc, Cork, Roma, Vik), which need «a reference value». Crameri's scales are perceptually uniform and also suited to colour blindness.
- **Reverse the colour scale**: reads the ramp from the other end.

For categories, with over 200 distinct values the app suggests another field or the graduated type. On the map, at the bottom left, the **theme legend** appears when the layer is on; for layers with a built-in legend only the colours of the legend change.

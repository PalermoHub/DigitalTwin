# Charts and interactive parts: charging points, heat islands, PEBA

## Charts of the charging points

Keywords: charging points occupied now, charging, total charging points, active, inactive, in use, active real, active estimated, monitorable, gauge, electric vehicle charging.

Typical questions: How many charging points are in use right now? What does «Active (estimated)» mean? Why is the percentage calculated only on some charging points?

Above the list of charging points, in the profile, there are two charts on **all the charging points of the Municipality**.

**«Charging points occupied now»**: a semicircle gauge with the percentage and the number «N charging». The note says: «[N] vehicles charging at this moment ([percentage]% of the [M] charging points where monitoring is possible).» The **monitorable** charging points are the active ones with real-time status; the percentage is calculated only on these.

**«Total charging points»**: the total number and two bars.
- The first divides the charging points into **Active** and **Inactive**.
- The second, «of which active», divides them into **In use** (charging), **Active (real)** (real-time status) and **Active (estimated)** (estimated status only).
- Below, the legend with the numbers and the note: «Not all charging points can be monitored: “in use” is only shown for those with real-time status.»

Hovering over a segment of the bar you read the number and the percentage.

---

## Chart of the trend of the heat islands

Keywords: heat islands chart, trend 2019-2025, city average, quartiles, section, surface temperature, band.

Typical questions: How do I read the heat islands chart? What are the quartiles?

The line chart shows the trend of the summer surface temperature from 2019 to 2025:
- **Section** (solid orange line, with a point for each year): the temperature of the clicked section. Hovering over a point you read «[year]: [value] °C». The years without data leave a gap.
- **City average** (dashed grey line).
- **City quartiles (25th–75th)**: the light grey band around the city average.

Without a clicked section (in the legend of the layer) the chart shows only the city trend. The vertical axis is in degrees °C. The description for screen readers also gives all the values.

---

## Interactive parts of the PEBA profile

Keywords: score bar, issues found, survey photos, photo viewer, save photo, rotate photo, note on data quality, accessibility plan.

Typical questions: How do I see the photos of a survey? Can I save them? What does the bar say?

Below the rows of the PEBA profile there appear, when the data is there:
- **Score bar**: as long as the inaccessibility score (0-100), in the colour of the level. For those who use a screen reader it says «Inaccessibility score [n] out of 100».
- **«Issues found»**: the bulleted list of the issues found.
- **«Survey photos (N)»**: a grid of thumbnails. If a thumbnail is not there, the profile tries the large photo from the PEBA website; if that is missing too, the box disappears.
- **«Note on data quality»**: collapsible section, closed at the start, which warns that profiles, texts and photos were extracted automatically and the coordinates derive from the geocoding of the addresses.

A click on a thumbnail (a normal click, without Ctrl, Shift or Cmd) opens the **«Survey photos» viewer**. The controls of the viewer are: **Previous photo**, **Next photo**, **Rotate left**, **Rotate right**, **Save photo** and **Close**. With Ctrl, Cmd or Shift the thumbnail behaves like a normal browser link to the large photo.

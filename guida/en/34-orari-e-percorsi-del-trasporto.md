# Timetables, departures and routes in the public transport profile

## The day selector and the validity of the timetables

Keywords: day selector, date, valid timetables, outside validity, AMAT feed, Trenitalia feed, timetables unavailable, loading, timetable date.

Typical questions: How do I change the day of the timetables? Why does it show a date different from today? Why does it say «Timetables loading…»?

In the profiles of stops and lines the timetables are downloaded only when first opened: until they arrive the profile says «Timetables loading…»; if the loading fails it says «Timetables unavailable» with the reason.

Above the timetables there is the field **«Day»**, a date selector. The initial day is today if it falls within the validity period of the feed of that stop. Otherwise the profile shows the **first valid day** and warns: «The timetables are valid from [date] to [date]: showing the first valid day.» The selector does not allow dates outside the validity period. The AMAT stops (bus and tram) and the railway stations (Trenitalia) have feeds with different periods: each stop uses its own.

---

## The timetable profile of a stop

Keywords: next departures, first departures of the day, all departures of the day, arrival-only terminus, no trips, time after midnight (+1), bus times, tram times.

Typical questions: How do I see the next departures? Why does it say «Arrival-only terminus»? What does «(+1)» next to the time mean?

In the profile of a stop, below the rows, there are the timetables of the chosen day:
- If the day is **today**, the **«Next departures»** block lists the next 8 departures from the current time. If there are no more it says «No more departures today.»
- If the day is **another one**, the block is called **«First departures of the day»** and shows the first 8.
- Each departure has the coloured box with the line number, the destination («→ [terminus]») and the time.
- Below there is the collapsible section **«All departures of the day (N)»**: for each line and direction, all the times in a row.
- If on that day there are no trips, it says «No trips on this date.»

The times are those of the feeds (scheduled times). A trip after midnight belongs to the previous service day and has the sign **(+1)** next to the time (for example «00:30 (+1)»). On the chosen day the trips of the previous day that arrive after midnight also appear.

An **arrival-only terminus** says so: «Arrival-only terminus: no services depart from here. Timetables are at the departure stop.» The feed has only the departures, so this is not a «no trips».

The **stations that are opening soon** have no timetables: the profile says «Station opening soon: not yet in service, so there are no timetables. It appears here because it is already in OpenStreetMap.»

---

## The timetable profile of a line

Keywords: trips per day, first pass, last pass, average frequency, every N minutes, directions, line.

Typical questions: How many trips does a line make? What time does the first and the last one pass? How often does it run?

When you open a line, for each direction («[from] → [to]»), a summary of the chosen day appears:
- **Trips per day**.
- **First pass at the terminus** and **Last pass at the terminus**.
- **Average frequency**: «every N min» (only if the line has more than one trip).

The summary is measured at the first stop of the line; if nothing departs from there on that day (it is the terminus of a variant) the stop of the line with the most departures is used. If there are no trips on that day it says «No trips on this date.»

When under the click there are several lines, the profile has a collapsible **list of lines**: each line has the box with the number and the name; directions and timetables are built when first opened. If there is only one line, it is already open. Opening a line (if there are several) shows it on the map.

---

## The stops in sequence and the interchanges

Keywords: stops in sequence, strip diagram, interchanges, terminus, Stops (N), show the route of the line.

Typical questions: How do I see all the stops of a line? What are the boxes next to the name of the stop?

In each line the collapsible section **«Stops (N)»** shows the stops in sequence as a strip diagram: the line in its colour, a dot for each stop, the termini larger and in bold. Next to the name there are the coloured boxes with the number of the **other lines that serve it** (the interchanges).
- A click on the **name** of the stop: «Show the stop on the map and open its card».
- A click on the **box** of an interchange: «Show the route of line [number]», that is it takes the map to the stop and draws the route of that line («Route of line [number]»).

---

## Stops near the clicked point

Keywords: nearby stops, distance in metres, nearest stop, lines of the stop.

Typical questions: How far is the stop? How do I go from the stop to its profile?

In the «Nearby public transport» section each stop has the **name** (a button that takes the map to the stop and opens its profile) and the **distance in metres** (rounded to 10 metres). Below there are the boxes of its lines: a click on a box takes you to the stop and also shows the route of that line. If the station is opening soon it says so: «Opening soon: not yet in service».

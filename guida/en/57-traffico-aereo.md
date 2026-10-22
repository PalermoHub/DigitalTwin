# Air traffic: aircraft flying around Palermo

## The «Aircraft in flight» layer

Keywords: air traffic, aircraft, flights, airport, Punta Raisi, PMO, LICJ, adsb.lol, ADS-B, arriving, departing, in transit, on the ground, altitude, speed, heading.

Typical questions: How do I see the aircraft above Palermo? How often are they updated? How can I tell whether an aircraft is arriving or departing? Why is there no destination for the flight? Where is the airport?

The **«Aircraft in flight»** layer, in the **«Air traffic»** section of the **«Transport»** group of the Layer panel, shows the aircraft within **100 nautical miles (about 185 km)** of Palermo Falcone e Borsellino airport (Punta Raisi, PMO). When it is switched on the **airport** also appears, with its name. Each aircraft is a silhouette rotated to its heading and coloured by status:
- **Arriving** (green): below 15,000 feet, within 60 miles of the airport, descending.
- **Departing** (orange): below 15,000 feet, within 60 miles of the airport, climbing.
- **In transit** (blue): all the other aircraft, including those cruising over the Tyrrhenian Sea.
- **On the ground** (grey): standing at the airport.

The status checkboxes, in the panel and in the legend, show or hide each group.

## Updates

Keywords: update, every 5 minutes, refresh, Worker, adsb.lol, time of the data, number of aircraft.

Typical questions: How often are the aircraft updated? Why do they not move continuously? What does the note in the legend say?

The data are not stored in the site: they come from a service (Worker) that queries **adsb.lol** **at most every 5 minutes** for all users. While the layer is on the map reloads every 5 minutes (only when the browser tab is in the foreground). The note in the legend tells the time of the data and how many aircraft are in view. If adsb.lol refuses the requests, the service falls back to **OpenSky Network** (the same aircraft, but without registration and type); if neither answers, the last aircraft read stay on the map.

## What the popup and the card show

Keywords: popup, tooltip, registration, aircraft type, altitude, speed, heading, vertical speed, distance from the airport, follow the flight.

Typical questions: What does the aircraft popup show? How high is an aircraft? Where can I follow the flight?

Hovering over an aircraft shows the flight and its status. A click opens the popup with: **registration**, **aircraft type**, **altitude** (feet and metres), **speed** (knots and km/h), **heading** in degrees, **vertical speed** and **distance from the airport**. In the place card, if the aircraft is over the municipality, the entry also has the link «Follow the flight on adsb.lol».

## Delays and scheduled flights

Keywords: delay, delayed, cancelled, scheduled time, estimated time, gate, arrivals, departures, flight board, Gesap, red dot, airport icon.

Typical questions: How do I see whether a flight is late? How late is it? What does the red dot on the airport mean? How do I see today's arrivals and departures? Can I click on the airport?

Arrival and departure times come from the website of **Gesap**, the company that runs Palermo airport, and are refreshed **at most every 5 minutes**.
- **On the aircraft**: if the aircraft's radio callsign matches a scheduled flight number (for example `RYR4342` is flight `FR 04342`), the card and the popup show the **scheduled flight and airline**, the **delay** («On time», «Delayed by 21 min», «Cancelled»), the **origin or destination**, the **scheduled time**, the **estimated time** and the **gate**. If the match is not certain, or the aircraft is not a scheduled flight (private, cargo, military), these data do not appear.
- **On the airport**: a click on the **airport icon** opens the popup and the card with today's summary (delayed flights, cancelled flights, average delay) and the lists of the **next 8 arrivals and departures**, each with time, city, delay and gate. The airport lies outside the municipal boundary, but the click works anyway. The lists are also available when no aircraft is in view.
- **The red dot** on the airport icon appears when at least one flight is **cancelled** or delayed by **15 minutes or more** among those not yet completed.
- A flight with less than 5 minutes between estimated and scheduled time counts as «on time».

## Things to keep in mind

Keywords: origin, destination, inferred status, military aircraft, coverage, licence, ODbL, limits.

Typical questions: Can I see where a flight is going? Are all aircraft shown? What licence do the data have?

- The aircraft source (adsb.lol) **does not give the origin and destination** of flights: the «arriving» or «departing» status is **inferred** from altitude, distance and vertical speed, so it is indicative. The city of origin or destination is known only for the scheduled Palermo flights that Gesap lists; for aircraft in transit on other routes neither origin nor destination is known.
- Aircraft that do not transmit ADS-B (some military aircraft) do not appear; low-altitude coverage depends on the volunteers' receivers.
- Times and delays come from a page of the Gesap website, not from an official API: if the site changes, the data may be missing for a while.
- Sources: adsb.lol, a network of volunteer ADS-B receivers, ODbL 1.0 licence; Gesap (aeroportodipalermo.it) for times and delays.

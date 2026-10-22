# Air traffic: aircraft flying around Palermo

## The «Aircraft in flight» layer

Keywords: air traffic, aircraft, flights, airport, Punta Raisi, PMO, LICJ, adsb.lol, ADS-B, arriving, departing, in transit, on the ground, altitude, speed, heading.

Typical questions: How do I see the aircraft above Palermo? How often are they updated? How can I tell whether an aircraft is arriving or departing? Why is there no destination for the flight? Where is the airport?

The **«Aircraft in flight»** layer, in the **«Air traffic»** group of the Layer panel, shows the aircraft within **100 nautical miles (about 185 km)** of Palermo Falcone e Borsellino airport (Punta Raisi, PMO). When it is switched on the **airport** also appears, with its name. Each aircraft is a silhouette rotated to its heading and coloured by status:
- **Arriving** (green): below 15,000 feet, within 60 miles of the airport, descending.
- **Departing** (orange): below 15,000 feet, within 60 miles of the airport, climbing.
- **In transit** (blue): all the other aircraft, including those cruising over the Tyrrhenian Sea.
- **On the ground** (grey): standing at the airport.

The status checkboxes, in the panel and in the legend, show or hide each group.

## Updates

Keywords: update, every 5 minutes, refresh, Worker, adsb.lol, time of the data, number of aircraft.

Typical questions: How often are the aircraft updated? Why do they not move continuously? What does the note in the legend say?

The data are not stored in the site: they come from a service (Worker) that queries **adsb.lol** **at most every 5 minutes** for all users. While the layer is on the map reloads every 5 minutes (only when the browser tab is in the foreground). The note in the legend tells the time of the data and how many aircraft are in view. If the service does not answer, the last aircraft read stay on the map.

## What the popup and the card show

Keywords: popup, tooltip, registration, aircraft type, altitude, speed, heading, vertical speed, distance from the airport, follow the flight.

Typical questions: What does the aircraft popup show? How high is an aircraft? Where can I follow the flight?

Hovering over an aircraft shows the flight and its status. A click opens the popup with: **registration**, **aircraft type**, **altitude** (feet and metres), **speed** (knots and km/h), **heading** in degrees, **vertical speed** and **distance from the airport**. In the place card, if the aircraft is over the municipality, the entry also has the link «Follow the flight on adsb.lol».

## Things to keep in mind

Keywords: origin, destination, inferred status, military aircraft, coverage, licence, ODbL, limits.

Typical questions: Can I see where a flight is going? Are all aircraft shown? What licence do the data have?

- The source **does not give the origin and destination** of flights: the «arriving» or «departing» status is **inferred** from altitude, distance and vertical speed, so it is indicative.
- Aircraft that do not transmit ADS-B (some military aircraft) do not appear; low-altitude coverage depends on the volunteers' receivers.
- Source: adsb.lol, a network of volunteer ADS-B receivers, ODbL 1.0 licence.

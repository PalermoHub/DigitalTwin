# Vehicle movement simulation

## What the vehicle simulation is

Keywords: simulation, vehicles on the move, moving trains, moving trams, moving buses, public transport, timetable, GTFS, not real time.

Typical questions: What is the vehicle movement simulation? Can I see trains, trams and buses moving? Are the vehicle positions in real time? How does the vehicle simulation work?

The simulation shows **trains**, **trams** and **buses** moving along their lines on the map according to the scheduled timetables (GTFS feeds from Trenitalia for the urban railway and from AMAT for buses and trams). There are three layers in the «Transport» group, one per vehicle type: **Trains on the move (simulation)** in the RFI section, **Trams on the move (simulation)** and **Buses on the move (simulation)** in the AMAT section. Each vehicle in service is a small volume in the colour of its line, oriented along its direction of travel, with the line number next to it.

**It is not real time**: positions are theoretical, derived from the timetables. They do not account for delays, traffic or cancellations, and between two stops the vehicle moves at constant speed. The route may not match the real road in every stretch. No GTFS-Realtime feeds are currently published for these lines.

---

## How to turn the simulation on

Keywords: turn on the simulation, switch on, buttons, guided route, Vehicles on the move 2D, Vehicles on the move 3D, layers, Turn on.

Typical questions: How do I start the vehicle simulation? How do I make trains and buses move? How do I switch on the moving vehicles? How do I see the simulation in 3D?

There are two ways. First: the «Turn on: …» buttons under this answer switch on the layers for moving trains, trams and buses (and the metro line) one by one; a second click switches them off. Second: the guided-route buttons below switch on all the layers together and take the map to the right area:

- **Vehicles on the move (2D)**: trains, trams, buses and the metro line, with the map seen from above.
- **Vehicles on the move (3D)**: the same vehicles among the 3D buildings, with terrain relief and elevation, tram and metro lines and stations, with the map tilted near the central station.

The first time, the app downloads the vehicle runs, so vehicles may appear after a moment. From the home page you will find the same two routes in the «Guided routes» section and in the featured card (see `01-uso-della-mappa.md`).

---

## The clock and the simulation speed

Keywords: clock, simulated time, speed, ×1, ×10, ×60, speed up, Simulation legend, time.

Typical questions: How do I change the simulation speed? What time is it in the simulation? How do I make the vehicles go faster? What do ×10 and ×60 mean?

With a transport layer on, the transport legend shows the «Simulation» box, with the simulated time and three speed buttons: **×1** (normal time, the default), **×10** and **×60**. The clock starts from the current time and vehicles update every second. At ×60 one simulated minute passes in one second. Changing speed does not restart from the beginning: the simulation continues from the time reached.

---

## What you see in 2D and in 3D

Keywords: 2D, 3D, tilted map, volumes, rectangles, enlargement, line number, 3D buildings.

Typical questions: Why do the vehicles look like rectangles? How do I see the vehicles in 3D? Why do vehicles look bigger from far away? How do I read the line number?

With the map seen from above, vehicles are rectangles; with the map tilted they are volumes. From afar vehicles are enlarged, otherwise they would not be visible: the closer you get, the closer they return to real scale (a bus about 12 metres long, a tram about 30, a train about 70). The number next to the vehicle is the line number. To see them among the buildings use the «Vehicles on the move (3D)» route, which also switches on the 3D buildings and the terrain. For everything else about 3D see `39-strati-in-3d.md`.

---

## Notes on the simulation

Keywords: notes, delays, traffic, cancellations, theoretical positions, reliability, credits, inspired.

Typical questions: Can I trust the position of my bus? Does the simulation show delays? Can I use it to know when the bus comes?

No: the simulation is a demonstration of the scheduled timetables, not a service to know where a vehicle really is or when it will arrive. For the departures of a stop or a line use the card (see `24-scheda-fermate-e-linee.md` and `34-orari-e-percorsi-del-trasporto.md`). The full notice is also on the Sources page.

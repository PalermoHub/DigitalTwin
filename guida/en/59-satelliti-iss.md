# Satellites and ISS: Palermo's sky

## The «Satellites and ISS» layer

Keywords: satellites, ISS, International Space Station, sky, radar, horizon, pass, Tiangong, CelesTrak, space traffic.

Typical questions: How do I see the ISS above Palermo? What does the satellite layer show? When does the Space Station pass?

The **«Satellites and ISS»** layer, in the **«Space traffic»** section of the **«Transport»** group in the Layers panel, draws **Palermo's sky as a radar**: the centre is the zenith (straight overhead), the outer circle is the **horizon** and north is at the top, with the letters N, E, S, O. The dashed circles in between are 30° and 60° elevation. Only satellites **above the horizon** are shown: the **space stations** (ISS and Tiangong) and the **brightest** ones. The group checkboxes, in the panel and in the legend, show or hide each set.

## Where the satellite is

Keywords: position, radar, azimuth, elevation, sub-satellite point, map, ISS, next pass, dashed arc.

Typical questions: Why is the satellite not where it really flies? What is the dashed line? Where do I look?

The dot on the radar is **not the point on Earth** below the satellite, which is almost always off the map: it is **where you see it in the sky**. The closer to the centre, the higher it is; the direction is where to look (east on the right, north at the top). The orange dashed line is the **next ISS pass**. The real position (latitude and longitude below the satellite) is in the **«Flying over»** row of the card. To see **where they really are** on Earth, with the layer on the **«Satellites around the world»** mini-map appears at the bottom left: each dot is a satellite, the large ones with a white edge are above Palermo's horizon, the orange dashed line is the **ISS ground track** (45 minutes before and after) and the red circle is Palermo.

## Updates and limits

Keywords: update, every second, orbital elements, SGP4, 2 hours, accuracy, visible to the naked eye.

Typical questions: How often are positions updated? How accurate are they? Can a satellite above the horizon be seen with the naked eye?

The **orbital elements** come from **CelesTrak** through a service (Worker) that refreshes them every 2 hours; the browser computes positions every **second** (SGP4 model). With the layer off no positions are kept: a satellite moves at about 7 km per second. A satellite **above the horizon is not necessarily visible**: it must be night and the satellite must be lit by the Sun. If the elements are older than 14 days the card says so, because the position becomes less accurate. The pass is computed for at least 10° above the horizon.

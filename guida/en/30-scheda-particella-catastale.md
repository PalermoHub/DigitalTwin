# «Cadastral parcel» profile

## What the parcel profile shows

Keywords: parcel profile, cadastral parcel, sheet, parcel number, extract, SISTER, SPID, Agenzia delle Entrate, cadastral extract, land registry.

Typical questions: How do I find the sheet and parcel of a point? How do I get the extract? Can I get the extract from here?

When you click on the map, in the **«Planning tools»** tab the section **«Cadastral parcel»** appears, with two rows:
- **Sheet**.
- **Parcel**.

When a layer of the **Planning** path is on (zoning plan, constraints, cadastre, OMI zones, house numbers) the section adds the group **«Parcel analysis»**, computed on the buildings drawn on the map:
- **Area** of the parcel.
- **Buildings** inside the parcel, with how many straddle several parcels. A building counts if at least 10% of its footprint falls inside.
- **Covered area (approx.)** and **Coverage ratio**.
- **Building height**: minimum, average (weighted by footprint) and maximum. Buildings without a known height are left out of heights and volume.
- **Volume (estimate)** and **Residents (estimate)**.

Below the rows, for parcels with buildings, there are six **tiles** (buildings, footprint with the average per building, median area, median height, maximum height, main use), two **bar charts** («Parcel: buildings by height» and «Parcel: footprint by height»; classes: up to 3 m, 3–6, 6–12, 12–18, 18–30, over 30, height not available), the ranking of the **five largest buildings** (use, height, area) and the parcel outline: hovering a building in the outline (or focusing it with the keyboard) lights up the same building on the map for as long as the pointer stays over it. Each chart has an «i» icon that explains it. Main use is «n/a» if no building has a recorded use.

These are estimates: buildings (Carta Tecnica Comunale 2006 and global sources) and cadastre (September 2026) do not match to the metre. A parcel without buildings is flagged as «Free lot».

Below there are two links:
- **«Extract on SISTER»**, with the label «Fg.[sheet] · P.[parcel]». It opens SISTER (portal of the Agenzia delle Entrate). The hint says: «Log in to SISTER with SPID — enter Sheet [n] and Parcel [n]». **The extract is not made inside the map**: the link only indicates the sheet and parcel to enter.
- **«Cadastre, zoning plan and constraints on map»**: the PalermoHub map.

The section is marked as informational: it has no legal value. Data: SITR of the Regione Siciliana and Agenzia delle Entrate (parcels, September 2026).

# Share this view

## What the «Share this view» button does

Keywords: share, link, share the map, copy link, WhatsApp, Telegram, Facebook, X, LinkedIn, email, shared view, send the map, URL.

Typical questions: How do I send someone my view? What does the link contain? Can I share on social media?

The **«Share this view»** button in the toolbar opens a window with the **link to the current view**. The field with the link is already selected. The controls:
- **Copy**: copies the link to the clipboard. The button says «Copied» for a moment; if the browser does not allow direct copying it says «Select and copy».
- **Share…**: appears only on devices whose browser has the native share menu.
- The icons to share the link on **WhatsApp, Telegram, Facebook, X, LinkedIn** and to send it by **Email** («Share on [network]»). The suggested text is «Palermo Digital Twin: my map view».

It closes with the X, with **Esc** or by clicking outside. Whoever opens the link sees the same view.

---

## What the link contains

Keywords: shared state, position, zoom, active layers, basemap, opacity, filters, theme, link too long, own layers not shared, custom colours.

Typical questions: Does the link keep the layers that are on? Why does my layer not appear for whoever receives the link? What does «The view is very rich» mean?

The link contains the **visible state** of the app:
- the **position, zoom, rotation and tilt** of the map;
- the **layers that are on** and their **opacity** (if lower than the maximum);
- the chosen **basemap**;
- the **filters** by district, neighbourhood or UPL, by transport line and by year and severity of accidents;
- the **light or dark theme**;
- some preferences saved in the browser: the colours chosen for the layers, the layer order and the drawing order, and the layers added from the RNDT catalogue, «My layers» and services (see below).

Whoever opens the link sees that state applied again as if they had made the clicks themselves. If the link names layers or backgrounds that no longer exist in the app, the app ignores them.

**What does not travel in the link.** Of the layers added by the user, only what the recipient can reopen from a **public address** goes: files uploaded from the computer do not go, nor do services with username and password or with a token, nor addresses with parameters that look secret (token, key, password, signature). The window says so: «[n] layers you added (files or services with credentials) are not in the link.»

**Link too long.** The link has a maximum length: if the view is very rich, custom colours and added layers may be removed and the window warns «The view is very rich: custom colours or added layers are not in the link.» The state is compressed (format `v1z.`, with a fallback to JSON if the browser cannot compress). A link that is too long or not valid is ignored when opened.

---

## Sharing an open profile

Keywords: link to the profile, clicked point, shared profile, profile tab, profile parameter.

Typical questions: If I share the link with the profile open, does whoever receives it see it? Does the chosen tab stay?

When the place profile is opened, the browser address is updated with the clicked point and the chosen tab. When a link that contains a profile point is opened, the app, after the first loading of the data, **reopens the profile at that point** (and on the tab indicated).


---

## Short link

Keywords: short link, shorten, shortlink, palermodigitaltwin.link, long link, expired link, link not found.

Typical questions: Why is the link I share short? Does the short link work forever? What happens if the short link does not open? Why does the link sometimes stay long?

When the share window opens, the app shows the full link straight away and, within moments, **replaces it with a short link** such as `palermodigitaltwin.link/a7Kd9xQ`. Whoever opens it arrives at the same view. The short link holds the same state as the long link: the view stays as it is, only the address changes.

If the short-link service does not answer (no network, local use), the field keeps the **long link**, which works anyway. Short links stay valid for **two years** from when they are created; a wrong or expired code gives «link not found». The short link only leads to pages of this site.

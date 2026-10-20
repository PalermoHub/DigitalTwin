# Information pages, privacy, language and offline use

## The top menu and the information pages

Keywords: menu, pages, Home, Map, Digital Twin, Topics, Guide, Geoimage guide, RNDT plugin, Sources and notes, Privacy, About, Presentation, page index, information pages.

Typical questions: What is in the top menu? How do I close a page? Where do I find the sources and the notes?

The menu is next to the logo and is the same on every page of the site (on a smartphone it is in the «Menu» tab). Its entries are **Home**, **Map**, **Digital Twin**, **General guide** (with **RNDT plugin** and **Geoimage guide** in the drop-down next to it), **Sources and notes** and **About** (with **Presentation** and **Privacy** in the drop-down next to it). The entry of the page you are on is highlighted.

**Home** (`index.html`) is the page where you choose and add the map's layers; the **topic** filter is here. **Map** takes you back to the map.

Digital Twin, Guide, RNDT plugin, Geoimage guide, Sources and notes, About and Privacy are **separate pages** (`digitaltwin.html`, `guida.html`, `plugin.html`, `geoimage.html`, `fonti.html`, `about.html`, `privacy.html`), at **full width**, split into bands, and many have a **side index** («Page index», «Guide index»). To go back to the map, choose **Map** in the menu. From the map, the same entries instead open the information sheets above the map, which close by pressing the entry again or with **Esc**.

- **Digital Twin**: «The city in layers: cadastre, population, buildings, transport, safety and much more.» Sections: «What a Digital Twin means to us, in plain words», «How it is organised», «The sources», «How to use it», «What it is for».
- **Topics**: «What the Digital Twin is about, topic by topic.» A box for each topic, with the description and the list of the layers and the **«Show on the map»** button that switches on the topic's layers and closes the page (off if the layers are not yet available). It is no longer a menu entry: topics are chosen from the Home filter.
- **Guide**: «How to use the map, step by step.» It has two groups, **Features** and **Use cases**, steps with images and video (the video «Palermo Digital Twin: how to use the map with Palermo's open data»).
- **Geoimage guide**: «How to overlay a historical map on the cartography and georeference it.» (see `50-geoimage.md`)
- **RNDT plugin**: explains the RNDT catalogue and gives the credit to Andrea Borruso (see `49-catalogo-rndt.md`), with use cases.
- **Sources and notes**: «Where the data come from and what to keep in mind when using them.» It has the sections **«Data sources»** (one entry per source, with the date, the links to the original data and the licence) and **«Good to know»** (the caveats).
- **Privacy**: see below.
- **About**: «The OpenDataSicilia community, which promotes open data in Sicily.» Sections: What it is, Who we are, Where we are (mailing list, Facebook, Twitter, Telegram, GitHub Discussions), **Contribute and report issues** (the button «Open an issue on GitHub» for errors in the data or ideas), Credits (Development, Tools used). The web app is designed and developed by @gbvitrano in collaboration with Claude AI (Anthropic).

**Presentation.** It is a separate page (`presentazione.html`) with sections such as «Why?», «What you’ll find on the map», «Open data, with sources», «The app tour» (video), «Works on smartphones and tablets too», «All the layers, in 3D» (see `39-strati-in-3d.md`) and «Contribute and report issues».

---

## Prompt at start-up

Keywords: prompt, click the map, don't show again, everything at one point diagram, first start.

Typical questions: What is the «Click the map» message? How do I remove it for good?

When the app opens an information button appears (**«Click the map to discover everything about a point»**) with, on wide screens only, the «Everything at one point» diagram. **It appears at every opening** and disappears at the first click (or tap) on the map. Only **«Don’t show again»** switches it off for good (the choice is saved in the browser). The «Reset» button next to the search switches it on again (see `44-ricerca-e-filtri.md`). It does not appear if the address already opens a profile.

---

## Privacy and consent to statistics

Keywords: privacy, GDPR, cookies, Google Analytics, consent, accept, decline, personal data, data controller, rights.

Typical questions: Does the site collect personal data? What happens if I decline the cookies? What stays on my device? Who is the data controller?

**Consent banner.** The site uses **Google Analytics** (with cookies) to count visits in aggregate form, **only if you accept**: nothing is loaded beforehand. The banner says «We use Google Analytics, with cookies, to count visits in aggregate form. It only starts if you consent; you can change your mind at any time.» with **Privacy notice**, **Decline** and **Accept**. The choice is saved in the browser; if you decline, the `_ga` cookies are deleted. On the Privacy page the **«Manage consent to statistics»** button reopens the choice.

**The Privacy page** (a concise notice under EU Regulation 2016/679 and the ePrivacy directive) says that:
- the map **requires no registration** and does not collect personal data through forms; the data shown (cadastre, population, offices…) are public;
- for statistics Google Analytics (Google Ireland Ltd., EU) is used only with consent; Google may set cookies and process the IP address and device information, with possible transfers outside the EU under the Data Privacy Framework;
- **what stays on the device** is only the theme choice, the app's offline cache (service worker) and, for those who use them, the layers loaded from one's own computer or from a service indicated (IndexedDB): nothing is sent to the controllers;
- **user and password** of protected services are kept only in memory, for the session;
- **external services contacted by the browser**: the OpenFreeMap basemap, the videos on YouTube in «enhanced privacy» mode (only if you press Play) and a proxy on Cloudflare Workers to query the RNDT catalogues; each sees the IP address of whoever connects;
- **rights** (arts. 15–22 GDPR): access, rectification, erasure, restriction, objection; complaints to the Garante per la protezione dei dati personali (the Italian data protection authority);
- **data controller**: OpenDataSicilia, reachable from the GitHub discussions or from the site opendatasicilia.it.

Other external services mentioned elsewhere: the Street View panorama is Google's (see `41-street-view.md`); some basemaps are served by Google, Esri and OpenStreetMap (see `47-mappe-di-base-e-storiche.md`).

---

## Changing language: Italian and English

Keywords: language, English, Italian, IT EN, globe, translated, switch language.

Typical questions: Is there an English version? How do I change language?

The app is in **Italian and English**. In the header there is the button with the globe and the abbreviation of the current language (**IT** or **EN**): a click switches to the other language («Switch to English») and **reloads the page**. At start-up the language is the one saved in the browser, otherwise the browser's language (Italian if it begins with «it», English otherwise). Italian is the base language: where a text is not translated into English it stays in Italian. Diagrams and screenshots with text written in the image have an English variant. The cookie banner is also in both languages.

---

## Offline use and installing as an app

Keywords: offline, no network, install, PWA, service worker, cache, updates, home screen.

Typical questions: Does it work without internet? Can I install it on my phone? Why does the data update?

The app has a **service worker** that makes repeat visits immediate and keeps the **interface available even without a network**:
- the **page** and the **app's data** (data folder: charging points every hour, fuel stations every day, fires, PAI…) are requested from the network first, with the saved copy as a fallback;
- the **static files** (scripts, styles, images, fonts) are served immediately from the copy and updated in the background;
- the **PMTiles files** read in ranges are kept for 24 hours, so they are not downloaded again at every visit;
- everything else (other sites, requests that send data) is left untouched.

So offline you see what has already been opened; the external services (basemaps, orthophotos, Street View, catalogues) need the network.

The site has a **manifest** («Palermo Digital Twin», short name «Palermo DT», standalone full screen, with the icons) that allows it to be installed as an app from the browser.

---

## Footer

Keywords: footer, legal value notice, cursor coordinates, OpenDataSicilia logo, copyright.

Typical questions: What is at the bottom of the page?

The footer has the copyright, the notice **«Cadastre, zoning plan and constraints are informational data, with no legal value»**, the coordinates and the logo of **Open Data Sicilia** (link to the site opendatasicilia.it).

# Mappe di base e mappe storiche

## Il tab «Base cartografica»

Parole chiave: base cartografica, mappa di sfondo, cambiare lo sfondo, satellite, mappa scura, OpenStreetMap, Esri, Google, sfondo bianco, miniatura.

Domande tipiche: Come cambio la mappa di sfondo? Come vedo il satellite? Quale base è attiva all'inizio?

Il tab **Base cartografica** (barra di sinistra) sceglie la mappa che sta sotto gli strati. **Una sola base è visibile alla volta**; all'inizio è «Mappa chiara». Ogni base ha una miniatura e un nome; sotto la lista c'è il suggerimento «Seleziona la cartografia da usare come base.» Le basi sono divise in gruppi, come nel selettore dell'Atlante storico:

- **Mappe stradali**: (base di partenza: Mapbox chiara o scura secondo il tema) Mappa chiara (OpenFreeMap), Scura (OpenFreeMap), Luminosa (OpenFreeMap Bright), Mapbox (stile personale) e Mapbox scura (Dark, stile standard; si alternano col tema), OpenStreetMap (standard), OSM Francia, OSM Umanitaria (Humanitarian), Esri Strade (World Street Map), Google (strade), Esri Scura (Dark Gray Canvas).
- **Immagini aeree**: Satellite (Google), Esri (World Imagery), **Sentinel-2** (immagini Copernicus senza nuvole 2024, a 10 m, di EOX: gratuite solo per usi non commerciali, CC BY-NC-SA 4.0), **NASA ieri** (colori naturali del giorno prima dal satellite VIIRS di NASA GIBS, libere, ma a 250 m per pixel: servono per il contesto, non per la città), Ibrido (satellite di Google con strade e nomi).
- **Topografiche**: Terreno (Google, rilievo), OpenTopo (curve di livello), Esri Topo (World Topographic Map).
- **Mappe storiche**: vedi sotto.
- **Cartografia tecnica**: CSG 1989 (Carta Tecnica Comunale CSG 2k, 1989/91), CTC 2k (Carta Tecnica Comunale, 2007/09), CTR 10k (Carta Tecnica Regionale, 2012/13).
- **Sfondo neutro**: Grigio (Esri Light Gray Canvas) e Bianco.

La base scelta entra nel link di «Condividi». Il pulsante con la luna cambia tema chiaro/scuro e la mappa di base cambia di conseguenza (vedi `38-tema-dell-interfaccia.md`). Nella vista «Strati in 3D» la base occupa sempre il piano più basso.

---

## Le mappe storiche

Parole chiave: mappe storiche, carte antiche, Atlante delle carte tecniche storiche, 1580, 1754, 1860, 1877, 1882, 1891, 1893, 1908, 1935, 1941, 1943, 1956, 1962, 1987, 1993, precisione.

Domande tipiche: Ci sono mappe storiche di Palermo? Cosa vuol dire il pallino verde, giallo o rosso? Fino a che zoom si vedono?

Il gruppo **«Mappe storiche»** (tra Topografiche e Cartografia tecnica) contiene **quindici carte di Palermo**, dal 1580 al 1993, tratte dall'**Atlante delle carte tecniche storiche di Palermo** (OpenDataSicilia), georeferenziate su Map Warper. Si scelgono come qualsiasi altra base. Gli anni sono: 1580, 1754, 1860, 1877, 1882, 1891, 1893, 1908, 1935, 1941, 1943, 1956, 1962, 1987, 1993. Passando il mouse su una carta si legge il titolo con la fonte originale e «(precisione della sovrapposizione: [alta/media/bassa])».

**Il pallino colorato** dice quanto è affidabile la sovrapposizione con la città di oggi: **verde alta, giallo media, rosso bassa**. È un giudizio editoriale dell'atlante: *alta* per i rilievi aerofotogrammetrici (1935, 1956, 1962, 1987, 1993), *media* per le carte precedenti all'aerofotogrammetria (1877, 1882, 1891, 1893, 1908, 1941, 1943), *bassa* per le incisioni (1580, 1754, 1860).

**Zoom massimo.** Ogni carta ha uno zoom massimo (da 16 a 18; la carta del 1893 arriva a 16).

Sopra la lista una nota rimanda all'Atlante: «Mappe georeferenziate dell'Atlante delle carte tecniche storiche (OpenDataSicilia)». Il pulsante **«Apri l'Atlante storico di Palermo»** apre l'atlante completo in una nuova scheda, già posizionato sulla zona (zoom e coordinate) che si sta guardando; il suggerimento parla di «sovrapposizioni, confronto con cursore e cartoline storiche».

Per **confrontare** una carta con la città di oggi sulla mappa si usa Geoimage (vedi `50-geoimage.md`). Le fonti originali delle carte (BnF Gallica, Library of Congress, Harvard Map Collection, U.S. Army Map Service, Wisconsin-Milwaukee University, Comune di Palermo) sono indicate nell'attribuzione di ogni carta.

# YouTube: descrizioni dei tre video

I tre video sono in `consegna/parti/`. Ognuno ha due tracce audio (italiano, English) e due sottotitoli (`.it.srt`, `.en.srt`), e in coda una schermata di chiusura con link e licenza.

| # | File | Durata | Titolo suggerito |
|---|---|---|---|
| 1 | `1-guida-generale.mp4` | 7:37 | Palermo Digital Twin: guida all'app (mappa, strati, ricerca, scheda del luogo) |
| 2 | `2-plugin-catalogo-rndt.mp4` | 3:29 | Palermo Digital Twin: il catalogo nazionale RNDT in mappa (plugin openrndt-geolibre) |
| 3 | `3-geoimage.mp4` | 2:36 | Palermo Digital Twin: Geoimage, la mappa storica sulla Palermo di oggi |

Titoli alternativi: (1) «Come usare Palermo Digital Twin: catasto, PRG e dati aperti di Palermo»; (2) «Dati territoriali ufficiali sulla mappa di Palermo: RNDT»; (3) «Georeferenziare una mappa storica di Palermo con Geoimage».

**Playlist consigliata:** «Palermo Digital Twin — tutorial», in ordine 1, 2, 3. Nella descrizione di ciascun video c'è il rimando agli altri due: dopo la pubblicazione sostituisci `[LINK VIDEO 1]`, `[LINK VIDEO 2]`, `[LINK VIDEO 3]` con gli indirizzi veri.

**Sottotitoli e audio in due lingue:** in YouTube Studio → Sottotitoli carica `NOME.it.srt` (Italiano) e `NOME.en.srt` (English), «Con tempi». Per la voce inglese: Studio → Sottotitoli → Aggiungi lingua → English → «Audio» → carica la traccia inglese (estraibile dal file con `ffmpeg -i NOME.mp4 -map 0:a:1 -c copy audio_en.m4a`). Nell'MP4 la traccia italiana è quella predefinita; i sottotitoli italiani sono anche incisi nell'immagine.

---

## Video 1 — Guida generale

**Titolo:** Palermo Digital Twin: guida all'app (mappa, strati, ricerca, scheda del luogo)

```
Palermo Digital Twin: come usare la mappa con i dati aperti di Palermo.

Catasto, piano regolatore, vincoli, monumenti, trasporto pubblico, sicurezza stradale, isole di calore, rischio idrogeologico (PAI) e molto altro, nello stesso posto. In questa guida generale (circa 7 minuti) facciamo dal vivo, sull'app, i 19 passi della Guida: ricerca, strati, filtri, vista 3D, clic sulla mappa e scheda del luogo, mappe storiche, uso da telefono, Fonti e avvisi.

Gli altri due video della serie:
• Plugin RNDT, il catalogo nazionale dei dati territoriali: [LINK VIDEO 2]
• Geoimage, mappe storiche sulla Palermo di oggi: [LINK VIDEO 3]

CAPITOLI
0:00 Apertura: una mappa con i dati aperti di Palermo
0:34 La Guida: i 19 passi
1:03 Sul telefono: le quattro tab
1:25 Fonti e avvisi
1:50 La barra degli strati
2:13 Ordine dei layer
2:26 Mappe di base e mappe storiche
2:54 I miei layer: aggiungere i propri dati
3:07 Cambiare i colori di uno strato
3:32 Un clic sulla mappa: tutto in un punto
4:07 Cosa si legge nella scheda
4:26 Monumenti
4:47 Uffici comunali
5:05 Rischio idrogeologico (PAI)
5:31 Incendi
5:46 Isole di calore
6:12 Cercare e filtrare
6:36 Strumenti: 3D, tema scuro, stampa
6:57 Avvertenze: dati informativi, senza valore legale
7:17 Link, licenza e come contribuire

LINK
• L'app: https://palermodigitaltwin.opendatasicilia.it/ (reindirizza a https://palermohub.github.io/DigitalTwin/)
• Open Data Sicilia: https://opendatasicilia.it/
• Atlante delle carte tecniche storiche di Palermo: https://palermohub.opendatasicilia.it/index_atlante_iframe.html

AVVISO
Catasto, zonizzazione del piano regolatore e vincoli sono dati informativi, senza valore legale: non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. Le fonti dei dati, le date e le licenze sono nella scheda "Fonti e avvisi" dell'app. Licenza dell'app: CC BY-SA 4.0.

Hai trovato un errore o hai un'idea? Segnalalo e contribuisci: il progetto è aperto.

Audio e sottotitoli anche in inglese (English audio track and subtitles available).

#PalermoDigitalTwin #OpenDataSicilia #OpenData #GIS #Palermo #DatiAperti
```

**English description**
```
Palermo Digital Twin: how to use the map with Palermo's open data.

Land registry, zoning plan, constraints, monuments, public transport, road safety, urban heat islands, hydrogeological risk and much more, all in one place. In this general guide (about 7 minutes) we go through the 19 steps of the in-app Guide live: search, layers, filters, 3D view, click-to-query and the place card, historical maps, phone use, Sources and notices.

Note: land registry, zoning and constraints are informational data with no legal value. App licence: CC BY-SA 4.0. App: https://palermodigitaltwin.opendatasicilia.it/
```

**Tag:** Palermo Digital Twin, Palermo, dati aperti, open data, Open Data Sicilia, mappa interattiva, GIS, catasto, PRG, piano regolatore, tutorial, isole di calore, PAI, rischio idrogeologico, trasporto pubblico, mappe storiche

---

## Video 2 — Plugin RNDT

**Titolo:** Palermo Digital Twin: il catalogo nazionale RNDT in mappa (plugin openrndt-geolibre)

```
Come portare in mappa i dati ufficiali del catalogo nazionale: il Repertorio Nazionale dei Dati Territoriali (RNDT) dentro Palermo Digital Twin.

In circa 3 minuti: cos'è l'RNDT, dove si trova il plugin, come cercare un dato (esempio: zone protette), come aggiungere un servizio WMS o WFS alla mappa, come interrogare i layer con un clic e quali sono i limiti (tetto di 10.000 oggetti nel download WFS, servizi non disponibili, caricamento dei propri file).

Il plugin è openrndt-geolibre, ideato e scritto da Andrea Borruso (onData). Senza il suo lavoro questa funzione non esisterebbe: è stato adattato a Palermo con pochissimi interventi, grazie alla sua ottima architettura. Grazie Andrea!

Gli altri video della serie:
• Guida generale: [LINK VIDEO 1]
• Geoimage, mappe storiche sulla Palermo di oggi: [LINK VIDEO 3]

CAPITOLI
0:00 Il catalogo nazionale: cos'è l'RNDT
0:24 Il plugin di Andrea Borruso (onData)
0:41 Dove si trova e come si cerca
1:23 Scegliere e aggiungere un servizio
2:06 Interrogare i layer RNDT
2:26 Limiti e file personali
3:09 Link, licenza e come contribuire

LINK
• L'app: https://palermodigitaltwin.opendatasicilia.it/
• Plugin RNDT (openrndt-geolibre, Andrea Borruso / onData): https://github.com/ondata/openrndt-geolibre
• Open Data Sicilia: https://opendatasicilia.it/

AVVISO
I dati del catalogo restano di proprietà degli enti che li pubblicano; per usi legali rivolgiti sempre agli uffici competenti. Licenza dell'app: CC BY-SA 4.0.

Audio e sottotitoli anche in inglese (English audio track and subtitles available).

#PalermoDigitalTwin #RNDT #OpenDataSicilia #OpenData #GIS #WMS #WFS #Palermo
```

**English description**
```
How to bring official data from the Italian national catalogue (RNDT, the National Register of Spatial Data) onto the Palermo Digital Twin map.

In about 3 minutes: what the RNDT is, where the plugin lives, how to search (example: protected areas), how to add a WMS or WFS service to the map, how to query the layers with a click, and the limits (10,000-feature cap on WFS download, unavailable services, loading your own files).

The plugin is openrndt-geolibre, conceived and written by Andrea Borruso (onData): https://github.com/ondata/openrndt-geolibre
App: https://palermodigitaltwin.opendatasicilia.it/ · App licence: CC BY-SA 4.0.
```

**Tag:** RNDT, Repertorio Nazionale dei Dati Territoriali, catalogo dati territoriali, WMS, WFS, ArcGIS REST, openrndt-geolibre, Andrea Borruso, onData, Palermo Digital Twin, dati aperti, Open Data Sicilia, GIS, tutorial

---

## Video 3 — Geoimage

**Titolo:** Palermo Digital Twin: Geoimage, la mappa storica sulla Palermo di oggi

```
Come sovrapporre una mappa storica, o qualsiasi immagine, alla cartografia di oggi e georeferenziarla direttamente nel browser, con Geoimage dentro Palermo Digital Twin.

In circa 2 minuti e mezzo, con la pianta di Palermo del 1891 come esempio: caricare l'immagine, posizionarla con le maniglie (sposta, ruota, ridimensiona), aggiungere i punti di controllo (GCP) con due clic per punto, allineare l'immagine, leggere l'errore (RMSE e residuo di ogni punto), confrontare con Swipe e Spotlight, ed esportare (KMZ, GeoTIFF, punti per il georeferenziatore di QGIS, world file, progetto JSON).

Nota: l'immagine usata nel video è una ricostruzione didattica della pianta del 1891 (carta Harvard Map Collection, tessere da MapWarper), posata e ruotata come una scansione non georeferenziata. Per una georeferenziazione più precisa è consigliato MapWarper.

Gli altri video della serie:
• Guida generale: [LINK VIDEO 1]
• Plugin RNDT, il catalogo nazionale: [LINK VIDEO 2]

CAPITOLI
0:00 Geoimage: cos'è
0:16 Primo passo: inquadrare la zona
0:28 Caricare la mappa storica (Palermo 1891)
0:40 Posizionare, ruotare e ridimensionare
0:51 I punti di controllo (GCP)
1:12 Allineare l'immagine ai GCP
1:22 Controllare l'errore (RMSE)
1:39 Swipe e Spotlight
1:54 Esportare il risultato
2:16 Link, licenza e come contribuire

LINK
• L'app: https://palermodigitaltwin.opendatasicilia.it/
• Geoimage (@gbvitrano): https://github.com/gbvitrano/Geoimage
• MapWarper: https://mapwarper.net/
• Atlante delle carte tecniche storiche di Palermo: https://palermohub.opendatasicilia.it/index_atlante_iframe.html
• Open Data Sicilia: https://opendatasicilia.it/

Licenza dell'app: CC BY-SA 4.0.

Hai trovato un errore o hai un'idea? Segnalalo e contribuisci: il progetto è aperto.

Audio e sottotitoli anche in inglese (English audio track and subtitles available).

#PalermoDigitalTwin #Geoimage #Georeferenziazione #MappeStoriche #OpenDataSicilia #GIS #Palermo #QGIS
```

**English description**
```
How to overlay a historical map, or any image, on today's cartography and georeference it right in the browser, with Geoimage inside Palermo Digital Twin.

In about 2.5 minutes, using the 1891 plan of Palermo as the example: load the image, position it with the handles (move, rotate, resize), add ground control points (GCPs) with two clicks each, align the image, read the error (RMSE and per-point residual), compare with Swipe and Spotlight, and export (KMZ, GeoTIFF, points for the QGIS georeferencer, world file, JSON project).

Note: the image in the video is an educational reconstruction of the 1891 plan (Harvard Map Collection, tiles from MapWarper), placed and rotated like an ungeoreferenced scan. For higher accuracy we recommend MapWarper.
Geoimage: https://github.com/gbvitrano/Geoimage · App: https://palermodigitaltwin.opendatasicilia.it/ · App licence: CC BY-SA 4.0.
```

**Tag:** Geoimage, georeferenziazione, georeferenziare mappa storica, mappe storiche, Palermo 1891, GCP, punti di controllo, MapWarper, QGIS, KMZ, GeoTIFF, Palermo Digital Twin, Open Data Sicilia, GIS, tutorial

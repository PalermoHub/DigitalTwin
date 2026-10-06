# Aggiungi layer

Tutto avviene nel gruppo **I miei layer**, il tab sinistro della barra strati (icona «libreria con +»). In cima c'è un albero come il Browser di QGIS; sotto, «Layer in mappa» con i layer aggiunti (casella, opacità, rimozione, ordine). Il catalogo RNDT resta separato, con il suo pannello a destra e il suo gruppo.

```
Cerca sorgenti dati…
▾ I miei dati                      ⬆   ← l'icona apre il selettore dei file
▾ Servizi
   ▸ XYZ (n)                        ＋
   ▸ WMS (n)                        ＋
   ▸ WFS (n)                        ＋
        servizio salvato  🔒        🗑
LAYER IN MAPPA
```

## I miei dati

«Carica file dal computer» (l'icona di caricamento) accetta GeoJSON/JSON, KML, KMZ, GPX, Shapefile in `.zip` (con `.prj`) e CSV con latitudine e longitudine. I GeoJSON e i CSV devono essere in WGS84. Di ogni file restano solo gli elementi dentro il Comune di Palermo. I dati si salvano in IndexedDB (`dt-rndt`), fino a 5 MB per layer; oltre, o se il browser blocca IndexedDB, il layer vale per la sessione e un avviso lo dice.

## Servizi

Il «＋» di un tipo apre un modulo con Nome (facoltativo), Indirizzo, Utente e Password (facoltativi).

- **XYZ**: un indirizzo `https` con `{z}`, `{x}` e `{y}`.
- **WMS**: l'indirizzo del servizio; «Leggi il servizio» mostra i layer da spuntare. Funzionano solo i layer che offrono EPSG:3857 (gli altri compaiono come «non supportato»).
- **WFS**: come il WMS, per tipi di dati. Si scarica solo l'area di Palermo, in GeoJSON (`outputFormat=application/json`), fino a 5.000 elementi: oltre, o se il servizio non produce GeoJSON, il layer non si aggiunge e il pannello dice perché.

Servizi e layer passano dal Worker proxy (solo https, vedi `docs/RNDT.md`). Come per il catalogo, la mappa mostra i tile solo dentro il riquadro di Palermo.

## Utente e password

- Per i servizi protetti con autenticazione **Basic**. Un token nell'indirizzo si incolla nell'indirizzo, come per qualunque servizio.
- **Restano solo in memoria**, finché la pagina è aperta: non si salvano in `localStorage`, IndexedDB o URL. Del servizio salvato si ricorda solo il nome utente.
- Dopo la riapertura un servizio con utente mostra il lucchetto 🔒 e i suoi layer risultano «non disponibili»: un clic sulla riga chiede la password e rimette il servizio in mappa. Con la password sbagliata il lucchetto resta e si può riprovare.
- Le credenziali passano dal nostro Worker, che le inoltra solo al servizio richiesto (mai su un redirect verso un altro host) e non le registra. Il Worker va ripubblicato (`npx wrangler deploy`) perché i servizi protetti funzionino in produzione.

## Salvataggio

- I layer aggiunti si salvano in `localStorage` (`dt:miei:v1`) e tornano alla riapertura dell'app; un servizio non più raggiungibile resta in elenco come «non disponibile».
- I **servizi salvati** (`dt:miei:servizi:v1`) compaiono sotto il loro tipo: un clic li rimette in mappa, il cestino li toglie dall'elenco. Se ne salvano al massimo 50; oltre, il layer entra in mappa ma il servizio non si salva e un avviso lo dice. Il campo di ricerca in cima filtra l'elenco.
- Se `localStorage` è bloccato tutto funziona per la sessione.
- Chi aveva già file caricati nel gruppo RNDT li ritrova in «I miei layer»: all'avvio l'elenco passa da `dt:rndt:v1` a `dt:miei:v1`, i dati restano dove stavano.

## Limiti

- I layer di questo gruppo non si interrogano con il clic sulla mappa (lo fa solo il catalogo RNDT).
- Il piano gratuito del Worker ha 100.000 richieste al giorno: ogni tile ne usa una.
- L'ordine degli assi del `bbox` WFS dalla versione 1.1.0 è quello OGC (lat/lon con `urn:ogc:def:crs:EPSG::4326`); alcuni server lo trattano diversamente: se un WFS con dati a Palermo risponde «nessun elemento», si corregge `urlGetFeature` in `js/aggiungi/servizi.js`.

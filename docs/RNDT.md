# Catalogo RNDT

Il pulsante **RNDT** nella barra strumenti della mappa (icona a nuvola) apre il catalogo RNDT, limitato all'area di Palermo. Il pannello si sovrappone alla scheda del luogo; «‹ Scheda» (o Esc) lo chiude e la scheda riappare.

- Cerca per testo, tema INSPIRE, ente. Aggiungi servizi WMS/WFS/GeoJSON alla mappa.
- I layer aggiunti restano nell'elenco «Layer aggiunti» del pannello e nel gruppo «RNDT» della barra strati (e nella tab Argomenti), e tornano alla riapertura dell'app. I WFS scaricati da un URL noto si salvano con l'URL; i GeoJSON senza URL (file locali) si salvano coi dati già filtrati su Palermo, fino a 1 MB per layer: oltre, valgono per la sessione.
- Il clic sulla mappa interroga i layer RNDT visibili: la tab **Altri dati (RNDT)** della scheda mostra gli attributi. I WMS usano `GetFeatureInfo`, i WFS le feature già in mappa.
- Il download WFS è sempre limitato a Palermo; le feature fuori dal Comune si scartano (sotto 5000 feature).

## Proxy CORS (Cloudflare Worker)

I servizi di terzi non danno CORS: tutto passa da `worker/rndt-proxy.js`. `rndt-proxy.js` è solo il punto d'ingresso (un Worker può esportare solo il gestore); la logica e i test sono in `proxy-core.js`. Rotta `/t/<host>/<percorso>?<query>`; solo https, GET/HEAD, nomi pubblici, max 10 MB, nessuna cache.

Prova in locale (senza pubblicare):

```bash
cd worker
npx wrangler dev --port 8787
```
poi apri l'app da `localhost` con `?rndt-proxy=http://127.0.0.1:8787` (es. `http://localhost:8000/?rndt-proxy=http://127.0.0.1:8787`).

Pubblicazione:

```bash
cd worker
npx wrangler login      # una volta
npx wrangler deploy
```

`wrangler` stampa l'indirizzo (`https://rndt-proxy.<account>.workers.dev`). Scrivilo in `PROXY_PREDEFINITO` di `js/rndt/proxy.js`. In locale (`localhost`) puoi provare un Worker di sviluppo con `?rndt-proxy=http://127.0.0.1:8787`; in produzione il parametro è ignorato. Le origini ammesse sono in `ORIGINI` di `wrangler.toml` (sviluppo locale e `https://gbvitrano.github.io`: correggi se l'origine di produzione è un'altra). I tile WMS passano dal Worker: il piano gratuito ha 100.000 richieste al giorno.

## Limiti noti

- **Non verificato nel browser**: in fase di sviluppo non c'era un Chrome utilizzabile. Le parti che toccano il DOM del plugin (`js/rndt/pannello.js`: selettori `select[name="where"]`, `[name="box"]`, `label.ordt-check`, e la tab RNDT della scheda) hanno test sulle sole funzioni pure. Prima di pubblicare va fatto il giro descritto nel piano (Task 9).
- Il Worker non è ancora pubblicato: `PROXY_PREDEFINITO` in `js/rndt/proxy.js` è un indirizzo ipotizzato da sostituire dopo `wrangler deploy`.
- Servizi solo `http` non sono raggiungibili (il Worker usa sempre `https`).
- Un WMS con CRS diverso da EPSG:3857 viene rifiutato; un WMS senza `GetFeatureInfo` mostra «Servizio non raggiungibile o senza informazioni interrogabili».
- I layer WFS salvano l'URL del download; se il plugin cambia ordine delle chiamate e l'URL non si lega al layer, il layer si salva coi dati (se entra nel tetto di 1 MB) oppure vale solo per la sessione (l'elenco lo segnala).

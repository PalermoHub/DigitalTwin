# Catalogo RNDT

Il pulsante **RNDT** nella barra strumenti della mappa (icona a nuvola) apre il catalogo RNDT, limitato all'area di Palermo. Il pannello si sovrappone alla scheda del luogo; «‹ Scheda» (o Esc) lo chiude e la scheda riappare.

- Cerca per testo, tema INSPIRE, ente. Aggiungi servizi WMS/WFS/GeoJSON alla mappa.
- I layer aggiunti restano nell'elenco «Layer aggiunti» del pannello e tornano alla riapertura dell'app (solo i WFS scaricati da un URL noto; gli altri valgono per la sessione).
- Il clic sulla mappa interroga i layer RNDT visibili: la tab **Altri dati (RNDT)** della scheda mostra gli attributi. I WMS usano `GetFeatureInfo`, i WFS le feature già in mappa.
- Il download WFS è sempre limitato a Palermo; le feature fuori dal Comune si scartano (sotto 5000 feature).

## Proxy CORS (Cloudflare Worker)

I servizi di terzi non danno CORS: tutto passa da `worker/rndt-proxy.js`. Rotta `/t/<host>/<percorso>?<query>`; solo https, GET/HEAD, nomi pubblici, max 10 MB, nessuna cache.

```bash
cd worker
npx wrangler deploy
```

`wrangler` stampa l'indirizzo (`https://rndt-proxy.<account>.workers.dev`). Scrivilo in `PROXY_RNDT` di `js/rndt/index.js`, oppure prova al volo con `?rndt-proxy=<indirizzo>` nell'URL dell'app. Le origini ammesse sono in `ORIGINI` di `wrangler.toml` (sviluppo locale e `https://gbvitrano.github.io`: correggi se l'origine di produzione è un'altra). I tile WMS passano dal Worker: il piano gratuito ha 100.000 richieste al giorno.

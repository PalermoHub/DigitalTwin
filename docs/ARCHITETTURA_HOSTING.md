# Dove mettere codice e dati: GitHub, VPS IONOS o entrambi

Domanda: lasciare il viewer su GitHub Pages e i dati su un VPS IONOS (con PostGIS e API), oppure spostare tutto sul VPS?

## Risposta breve

**Né l'uno né l'altro per intero: tieni il viewer su GitHub Pages, metti i dati statici (PMTiles, JSON compatti) su un sito statico con cache lunga, e usa PostGIS come sorgente di verità e per le sole funzioni davvero dinamiche.** Non servire le mappe da PostGIS a ogni richiesta, salvo dove serve davvero.

Il viewer oggi è un sito statico: nessun server da mantenere, nessun costo, tile precalcolati. È la sua forza. Un'API sopra PostGIS vale la pena solo per ciò che i file statici non sanno fare.

## Stato attuale (misurato, 2026-10-02)

- Avvio: 147 richieste, di cui 52 verso host esterni (`gbvitrano.github.io` 21, `palermohub.github.io` 31), che appartengono ad altri repository.
- I file grossi (`particelle.pmtiles` 40 MB, `buildings_wgs84.pmtiles` 29 MB, `edificato_pop.pmtiles` 20 MB) sono già letti a Range request: il peso non è il problema.
- Il collo di bottiglia reale è la cache dei repo remoti (`max-age=600`) e l'handshake con più host. Vedi `docs/AUDIT_DATI.md`.

## Le opzioni

| | Viewer | Dati | Server da gestire |
|---|---|---|---|
| **A. Com'è ora** | GitHub Pages | repo di altri + file locali | nessuno |
| **B. Dati statici sul VPS** | GitHub Pages | PMTiles e JSON su nginx (VPS), cache lunga | nginx |
| **C. API PostGIS a runtime** | GitHub Pages | tile e query generate da PostGIS (Martin / pg_tileserv / API) | PostGIS + API + sicurezza |
| **D. Tutto sul VPS** | nginx sul VPS | come B o C | tutto |

### A. Com'è ora
- **Pro:** zero costi, zero manutenzione, nessun punto di guasto proprio.
- **Contro:** dipendi da repo altrui (se cambiano o spariscono i file, il viewer si rompe), cache di 10 minuti, nessun controllo sugli header.

### B. Viewer su GitHub, dati statici sul VPScosa d
- **Pro:**
  - Controlli tu `Cache-Control`, compressione e CORS.
  - Elimini la dipendenza dai repo di altri.
  - Nessun database esposto a Internet.
  - Si sposta tutto con un `rsync`.
- **Contro:** un VPS da tenere aggiornato; senza CDN la latenza dipende da dove sta il datacenter. Per utenti a Palermo un VPS europeo va bene.
- **Nota:** è lo stesso risultato di R2/Cloudflare, ma sul VPS che hai già.

### C. API PostGIS a runtime
- **Pro:** query non precalcolabili (selezione per poligono disegnato, filtri sui 23 000 incidenti su più dimensioni, aggregazioni al volo, ricerca testuale su civici), dati sempre aggiornati senza rigenerare file.
- **Contro:**
  - Ogni visitatore carica il tuo server: serve cache davanti (nginx/Cloudflare), altrimenti il VPS regge pochi utenti contemporanei.
  - Sicurezza: API esposta, rate limiting, query parametrizzate, backup del DB.
  - Se il VPS è giù, il viewer non mostra i dati.
  - I tile statici sono quasi sempre più veloci di quelli generati al volo.

### D. Tutto sul VPS
- **Pro:** un solo posto, un solo dominio (niente CORS).
- **Contro:** perdi i vantaggi gratuiti di GitHub Pages (CDN, TLS, deploy da git, disponibilità) e li rifai a mano. Non risolve nulla che B non risolva già.

## Raccomandazione

1. **Subito: opzione B.** Copia sul VPS i PMTiles e i JSON (circa 140 MB tra i file remoti più grossi più quelli locali) e punta `catalogo.json` a quell'host. Un solo dominio per i dati, cache lunga, nome file con versione.
2. **PostGIS come sorgente, non come server di mappe.** Tieni lì i dati puliti e rigenera i PMTiles dal DB con `ogr2ogr` + `tippecanoe` (oggi gli script lavorano da GeoPackage/GeoJSON). Così il DB serve la qualità dei dati, non il carico di rete.
3. **Opzione C solo per funzioni specifiche** che oggi non si possono fare, e solo con cache davanti. Esempi: analisi su poligono disegnato dall'utente, ricerca avanzata sugli incidenti. Una piccola API (FastAPI o pg_featureserv) con 2-3 endpoint, non un tile server generale.
4. **Non spostare il viewer (D)** finché GitHub Pages basta.

Se vuoi un'altra via ancora più semplice: metti **Cloudflare davanti** al VPS (piano gratuito, l'account è già collegato): CDN, brotli, HTTP/3 e protezione da abusi, senza cambiare altro.

## Il server reale (controllo del 2026-10-02)

Controllo non invasivo su `82.165.59.122` (solo richieste pubbliche e test di connessione):

- Il web server è **Apache**, non nginx: la configurazione per i dati va scritta con `mod_headers` (vedi `docs/ISTRUZIONI_SERVER.md`; sotto resta l'esempio nginx come riferimento).
- Sulle porte 80/443 risponde già un altro sito (pagina del 25 aprile 2026, con una Content-Security-Policy `connect-src 'self'`): i dati dell'app vanno su un vhost o un percorso separato, con CORS proprio.
- **La porta 5432 (PostgreSQL) è aperta a Internet**: va chiusa prima di mettere dati o un'API sopra (`listen_addresses = 'localhost'`, `pg_hba.conf`, firewall; per accedere da fuori si usa un tunnel SSH).
- Le porte 22, 80 e 443 sono aperte; la 3000 no.
- **Esiste già un'API HTTPS** su `https://developers.coseerobe.it/api/v1/…` (CORS aperto a `https://gbvitrano.github.io`, cache 1 h) e un'area `/export/` per i download. La pagina `gbvitrano.github.io/ANNCSU/` usa quella: il browser non parla mai con PostgreSQL, quindi la 5432 pubblica non serve al sito e si può chiudere (resta da verificare chi altro si connette).
- Il DB PostGIS contiene i dati **ANNCSU** (civici e stradario) che si offrono in download in GeoParquet e GeoPackage: è la sorgente di un altro servizio e **non va spento**. Il viewer non lo usa a runtime; i download sono file statici che Apache può servire senza toccare il DB.
- Il viewer è su HTTPS: i dati devono avere un dominio con certificato valido, altrimenti il browser blocca il contenuto misto. **Questo requisito è già soddisfatto:** `developers.coseerobe.it` punta a quel server con HTTPS valido.

**Dove pubblicare il viewer (da decidere):** `gbvitrano.github.io`, `palermohub.github.io` oppure `palermohub.opendatasicilia.it`. Non blocca nulla: i percorsi dell'app sono relativi e i link ai dati stanno in `catalogo.json`, quindi basta far accettare al VPS tutte e tre le origini nel CORS (`SetEnvIf Origin`, vedi `docs/ISTRUZIONI_SERVER.md`) e togliere poi quelle inutilizzate. `palermohub.opendatasicilia.it` è un CNAME di `siciliahub.github.io` (GitHub Pages dell'organizzazione `siciliahub`): è lo stesso GitHub Pages, ma con un dominio di OpenDataSicilia. Per pubblicare il viewer lì basta un repository nell'organizzazione `siciliahub` (si raggiunge come `palermohub.opendatasicilia.it/<repo>/`), quindi serve il permesso di scrittura sull'organizzazione, non l'accesso al DNS. Per il CORS conta solo l'origine che vede il browser, cioè `https://palermohub.opendatasicilia.it` (GitHub reindirizza `siciliahub.github.io` al dominio personalizzato: non serve aggiungerla). Vantaggio del dominio custom: l'URL resta uguale anche se un domani l'hosting cambia.

Le istruzioni operative per il Claude che gira sul server (audit in sola lettura, messa in sicurezza, configurazione Apache) sono in `docs/ISTRUZIONI_SERVER.md`.

## Configurazione nginx per i dati statici (opzione B)

```nginx
location /dati/ {
    root /var/www/digitaltwin;
    add_header Access-Control-Allow-Origin "https://<utente>.github.io" always;
    add_header Access-Control-Allow-Headers "Range, If-Match" always;
    add_header Access-Control-Expose-Headers "Content-Range, Content-Length, ETag" always;
    add_header Cache-Control "public, max-age=31536000, immutable";   # file con la versione nel nome
    gzip on;
    gzip_types application/json application/geo+json;
    # i .pmtiles sono già compressi: niente gzip. Accept-Ranges è attivo di default.
}
```

Punti da non sbagliare:
- **Range request**: i PMTiles non funzionano senza `Accept-Ranges` e senza gli header CORS sopra (`Range`, `Content-Range`).
- **Versione nel nome del file** (es. `archi.2026-10.pmtiles`): con `immutable` il browser non rileggerà mai il file, quindi un aggiornamento deve cambiare nome. Aggiorna `catalogo.json`, che invece va servito con cache breve.
- **HTTPS** obbligatorio (il viewer è su HTTPS: contenuto misto bloccato).

## Cosa verificare prima di decidere

- **Piano IONOS:** CPU/RAM, traffico incluso (verifica sul contratto: varia per piano), posizione del datacenter.
- **Quanti utenti contemporanei** ti aspetti: sotto poche decine B regge senza CDN; sopra serve Cloudflare.
- **Licenze:** i dati di `palermohub` e `gbvitrano` che copi sul tuo host vanno ripubblicati rispettando le loro licenze (alcune non sono documentate: vedi `scripts/fonti.py`).
- **Backup** del VPS e del DB se diventano la fonte dei dati.
- **Chi aggiorna i dati**: se serve un flusso periodico (GTFS, incidenti), un cron sul VPS che rigenera i PMTiles è meglio di un'API.

## Quando cambierei idea (verso C o D)

- Servono aggiornamenti in tempo reale (non solo ogni tanto).
- Gli utenti devono salvare dati propri (segnalazioni, annotazioni): serve un database scrivibile e autenticazione.
- I filtri sono così ricchi da non poterli precalcolare nei tile.
- GitHub Pages diventa un limite (traffico oltre le sue soglie d'uso, o necessità di header personalizzati).

# Istruzioni per Claude sul VPS IONOS (82.165.59.122)

Questo file è scritto da Claude (sessione sul PC di sviluppo) per Claude che gira **sul server**. Leggilo tutto prima di eseguire qualunque comando.

## Contesto

- Il server ha Apache (porte 80/443), SSH (22) e PostgreSQL (5432). Dall'esterno risulta anche una **sito già esistente** sulle porte 80/443 (pagina modificata il 25 aprile 2026, con una Content-Security-Policy restrittiva `connect-src 'self'`). **Non toccarlo e non romperlo.**
- Il database PostGIS esiste. L'app che vorremmo servire è il viewer **DigitalTwin Palermo**, un sito statico (MapLibre + PMTiles) che oggi sta su GitHub Pages.
- Dall'esterno è stata verificata una sola cosa grave: **la porta 5432 (PostgreSQL) è raggiungibile da Internet.**

- **Il database PostGIS contiene i dati ANNCSU** (numeri civici e stradario) che l'utente offre in download in formato GeoParquet e GeoPackage. È la sorgente di un altro servizio in uso: **non spegnerlo, non modificarne i dati, non cambiarne lo schema**. Il viewer DigitalTwin non lo interroga: serve solo file statici.

- **Come è usato oggi il DB (verificato dall'esterno, 2026-10-02):** l'unico client noto è la pagina `https://gbvitrano.github.io/ANNCSU/`, che gira nel browser e **non può parlare con PostgreSQL direttamente**. Chiama `https://developers.coseerobe.it/api/v1/…` (risposta con `Server: api`, `Access-Control-Allow-Origin: https://gbvitrano.github.io`, header `Range`/`Prefer`/`Content-Range`: probabilmente un'API tipo PostgREST dietro Apache) e scarica da `/export/geoparquet/` e `/export/gpkg/`. Il dominio `developers.coseerobe.it` punta a questo IP e ha già un **certificato HTTPS valido**. Quindi la porta 5432 pubblica non serve al sito: a connettersi è l'API, che probabilmente sta sullo stesso server.
- Dall'esterno la porta 5432 accetta connessioni TCP (verificato). Non è stato possibile verificare se `pg_hba.conf` le rifiuta all'autenticazione: l'utente crede di aver «bloccato gli indirizzi». Controllalo tu.

## Regole di prudenza (valgono per tutto il documento)

1. **Prima solo lettura.** Fai l'audit della sezione 1 e scrivi il resoconto. Non cambiare nulla finché non l'ha letto l'utente e non ha detto di procedere.
2. **Una modifica alla volta, con conferma.** Prima di ogni modifica dillo all'utente (cosa, perché, come si annulla) e aspetta il sì.
3. **Backup prima di modificare un file di configurazione:** `cp -a file file.bak-$(date +%F)`.
4. **Non chiuderti fuori.** Prima di toccare SSH o il firewall, tieni aperta una seconda sessione e controlla che l'accesso funzioni ancora dopo ogni modifica. Non attivare un firewall senza prima consentire la porta SSH **in uso**.
5. **Non toccare il sito esistente** (DocumentRoot, vhost, certificati attuali). I dati dell'app vanno in un percorso o vhost separato.
6. **Nessun segreto nei file di documentazione** né nei messaggi: password e chiavi non vanno scritte da nessuna parte nel repo.
7. Comandi distruttivi (`rm -r`, `DROP`, `ufw reset`, riavvio del server) solo con conferma esplicita.

## 1. Audit in sola lettura (da fare per primo)

Esegui e riassumi i risultati in un file `~/audit-server-AAAA-MM-GG.md` (senza segreti):

```bash
# sistema
lsb_release -a; uname -r; uptime; df -h; free -h; nproc
# aggiornamenti pendenti
apt list --upgradable 2>/dev/null | head -30; ls /var/run/reboot-required 2>/dev/null
# chi ascolta su quali porte, e su quale indirizzo
sudo ss -tlnp
# firewall
sudo ufw status verbose 2>&1; sudo iptables -S 2>&1 | head -30; sudo nft list ruleset 2>&1 | head -40
# SSH
sudo sshd -T | grep -Ei 'permitrootlogin|passwordauthentication|pubkeyauthentication|port |allowusers'
last -n 15; sudo lastb -n 15 2>/dev/null
# fail2ban e aggiornamenti automatici
systemctl is-active fail2ban unattended-upgrades 2>&1
# PostgreSQL
sudo -u postgres psql -c "show listen_addresses;" -c "show port;" -c "select version();" -c "\du" -c "\l"
sudo grep -vE '^\s*(#|$)' /etc/postgresql/*/main/pg_hba.conf
sudo -u postgres psql -c "select extname, extversion from pg_extension;"   # c'è PostGIS?
# Apache
apache2ctl -S 2>&1 || httpd -S 2>&1          # vhost, DocumentRoot, certificati
apache2ctl -M 2>&1 | grep -E 'headers|rewrite|deflate|http2|ssl|expires'
ls /etc/apache2/sites-enabled /etc/letsencrypt/live 2>&1
# dominio e certificato (serve HTTPS valido: il viewer è su HTTPS)
sudo certbot certificates 2>&1 | head -30
```

Annota in particolare:
- se PostgreSQL ascolta su `0.0.0.0` / `*` o solo su localhost, e cosa dice `pg_hba.conf` (righe `host ... 0.0.0.0/0`);
- se i ruoli del DB hanno password (non stamparle) e se esiste un superutente accessibile da remoto;
- quale **dominio** punta a questo IP (HTTPS con certificato valido è obbligatorio: il viewer è su HTTPS e il browser blocca contenuti HTTP);
- RAM/CPU/disco liberi: i dati dell'app occupano circa 150–500 MB.

## 2. Mettere in sicurezza (dopo conferma dell'utente)

Priorità, dal più urgente:

### 2.0 Backup del database (prima di qualunque modifica)

Prima di toccare PostgreSQL, il firewall o SSH, verifica che esista un backup recente e ripristinabile dei dati ANNCSU. Se non c'è: `sudo -u postgres pg_dump -Fc <database> > /percorso/sicuro/<database>-$(date +%F).dump` (fuori dalla cartella servita da Apache, permessi 600), più uno snapshot del VPS dal pannello IONOS. Verifica che il dump si legga (`pg_restore -l`). Poi imposta un backup giornaliero con rotazione.

### 2.1 PostgreSQL non deve essere raggiungibile da Internet (urgente)

Il servizio resta **attivo**: si limita solo l'ascolto. Prima verifica **chi si connette davvero**: `sudo ss -tnp state established '( sport = :5432 )'` e i log (`log_connections`). Se i soli client sono processi locali (l'API) e nessun IP esterno, imposta `listen_addresses = 'localhost'` e chiudi la 5432 nel firewall: nessun client noto la usa dall'esterno. Se l'API gira su un altro host, restringi ai soli IP di quell'host. Se l'utente usa il DB da fuori (QGIS, altre app su altri server), chiedi chi si collega e da quale IP prima di chiudere, e preferisci un tunnel SSH o una regola `pg_hba.conf` per quei soli IP con `hostssl` e password SCRAM.

1. In `/etc/postgresql/<versione>/main/postgresql.conf`: `listen_addresses = 'localhost'`.
2. In `pg_hba.conf`: togli le regole `host` verso `0.0.0.0/0` e `::/0`. Lascia solo `local` e `127.0.0.1/32`. Se serve un accesso da fuori (es. QGIS dal PC dell'utente), usa un **tunnel SSH** (`ssh -L 5432:localhost:5432 utente@82.165.59.122`) invece di aprire la porta.
3. `sudo systemctl restart postgresql`, poi verifica con `ss -tlnp | grep 5432` (deve mostrare `127.0.0.1:5432`).
4. **Presumi che le credenziali siano già state tentate dall'esterno.** Guarda i log (`/var/log/postgresql/`) per accessi falliti o sospetti e proponi all'utente di **cambiare le password dei ruoli** (senza scriverle da nessuna parte).

### 2.2 Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow <porta-ssh-in-uso>/tcp     # PRIMA di attivare
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

La 5432 resta chiusa. Controlla anche il firewall del pannello IONOS (Cloud Panel → Rete → Firewall): lì va fatta la stessa regola, perché protegge anche se il firewall locale viene disattivato.

### 2.3 SSH

Solo se non già così, **dopo aver verificato che l'accesso con chiave funzioni** (da una seconda sessione):

- `PasswordAuthentication no`, `PermitRootLogin no` (o `prohibit-password`), `PubkeyAuthentication yes`.
- Valuta `AllowUsers` con l'utente reale.
- `sudo sshd -t` prima di ricaricare; poi `sudo systemctl reload ssh` (non `restart`) e prova una nuova connessione prima di chiudere la sessione corrente.

### 2.4 Resto

- `sudo apt update && sudo apt upgrade` (dopo aver visto cosa verrebbe aggiornato; segnala se serve un riavvio e **non riavviare senza conferma**).
- `unattended-upgrades` attivo per gli aggiornamenti di sicurezza.
- `fail2ban` con jail `sshd` (e `apache-auth` se serve).
- Apache: `ServerTokens Prod`, `ServerSignature Off`; `Options -Indexes` sulle cartelle dei dati; nessun listing di directory.
- Backup: dimmi (all'utente) cosa esiste già per il DB e per i file. Se non c'è nulla, proponi `pg_dump` giornaliero con rotazione e uno snapshot del VPS dal pannello IONOS.

## 3. Servire i dati dell'app (solo se l'utente conferma)

Scopo: ospitare i file statici dell'app (PMTiles, JSON) con cache lunga e CORS corretto. Il viewer resta su GitHub Pages; vedi `docs/ARCHITETTURA_HOSTING.md`.

### 3.0 Procedura passo per passo (percorsi da verificare con l'audit)

I percorsi sono quelli standard di Debian/Ubuntu: **conferma con l'audit** (`apache2ctl -S`, `ls /etc/apache2`) prima di usarli.

1. **Cartella dei dati, fuori dal DocumentRoot del sito esistente** (tipicamente `/var/www/html`): `/var/www/digitaltwin-dati/`. Non mettere i dati dentro la cartella del sito attuale e non usare `/home/...` (spesso non leggibile da Apache).
   ```bash
   sudo mkdir -p /var/www/digitaltwin-dati
   sudo chown <utente-deploy>:www-data /var/www/digitaltwin-dati
   sudo chmod 755 /var/www/digitaltwin-dati        # file 644, cartelle 755: Apache (www-data) deve poterli leggere
   ```
2. **Copia dei file** dal PC (vedi `docs/FILE_DA_SPOSTARE_SUL_VPS.md`): `rsync -av dati/<percorso> <utente-deploy>@82.165.59.122:/var/www/digitaltwin-dati/`, mantenendo i percorsi relativi (`mobilita/sicurezza/…`, `civici-omi/civici/…`).
3. **Moduli Apache da attivare:** `headers` (CORS e cache, **obbligatorio**), `deflate` (compressione dei JSON), `http2` (se l'MPM è `event`; molto utile con tanti file piccoli) e `expires` (facoltativo).
   ```bash
   sudo a2enmod headers deflate http2
   ```
4. **Configurazione in un file a parte**, non dentro i vhost esistenti: `/etc/apache2/conf-available/digitaltwin-dati.conf`, con l'`Alias` e il blocco `<Directory>` della sezione 3.2:
   ```apache
   Alias /dati/ /var/www/digitaltwin-dati/
   # …poi il blocco <Directory /var/www/digitaltwin-dati> della sezione 3.2
   ```
   Poi `sudo a2enconf digitaltwin-dati`. Così si disattiva con `a2disconf` senza toccare il resto.
5. **Attenzione al vhost di `developers.coseerobe.it`:** l'API risponde con un'intestazione `Server: api`, quindi probabilmente c'è un `ProxyPass` che inoltra `/api/` e `/export/`. Controlla che nessun `ProxyPass /` (catch-all) intercetti `/dati/`; se c'è, aggiungi **prima** `ProxyPass /dati/ !`. In alternativa usa un vhost dedicato.
6. **Prova prima di ricaricare:**
   ```bash
   sudo apache2ctl configtest          # deve dire "Syntax OK"
   sudo systemctl reload apache2       # reload, non restart: il sito esistente non si interrompe
   ```
7. **Verifica dall'esterno** (comandi della sezione 3.2): codice 206 sui Range, header CORS per le origini ammesse, nessun header per le altre, `Cache-Control` corretto.
8. **Il firewall non richiede modifiche:** si usa la 443 già aperta. Non aprire altre porte.
9. **Se serve un certificato nuovo** (vhost o sottodominio diverso): `sudo certbot --apache -d <nome>`. Con `developers.coseerobe.it` il certificato c'è già.

### 3.1 Dove

Vhost HTTPS separato (es. `dati.<dominio>`) oppure un percorso sotto `developers.coseerobe.it` (dominio e certificato esistono già) oppure una cartella `/dati/` fuori dal DocumentRoot del sito esistente, ad esempio `/var/www/digitaltwin-dati/`. Non mescolare con il sito attuale. Serve un **certificato valido** (Let's Encrypt via `certbot`) per il nome usato.

### 3.2 Apache

Moduli: `a2enmod headers expires deflate http2` (se `http2` non è già attivo e il MPM è compatibile: `event`).

```apache
<Directory /var/www/digitaltwin-dati>
    Options -Indexes
    Require all granted

    # CORS: il viewer può stare su una di queste tre origini (non ancora deciso). L'origine non include il percorso.
    # Apache non accetta più valori in Allow-Origin: si rimanda l'origine della richiesta solo se è nell'elenco.
    SetEnvIf Origin "^https://(gbvitrano\.github\.io|palermohub\.github\.io|palermohub\.opendatasicilia\.it)$" CORS_ORIGINE=$0
    Header always set Access-Control-Allow-Origin "%{CORS_ORIGINE}e" env=CORS_ORIGINE
    Header always merge Vary Origin
    Header always set Access-Control-Allow-Methods "GET, HEAD, OPTIONS"
    Header always set Access-Control-Allow-Headers "Range, If-Match"
    Header always set Access-Control-Expose-Headers "Content-Range, Content-Length, ETag, Accept-Ranges"

    # I PMTiles sono già compressi e si leggono a Range: niente gzip, Accept-Ranges attivo (default di Apache)
    <FilesMatch "\.pmtiles$">
        SetEnv no-gzip 1
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    # JSON/GeoJSON: compressione, cache lunga (i file hanno la versione nel nome)
    AddOutputFilterByType DEFLATE application/json application/geo+json
    <FilesMatch "\.(json|geojson)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    # il catalogo cambia a ogni aggiornamento: cache breve
    <Files "catalogo.json">
        Header set Cache-Control "public, max-age=300, must-revalidate"
    </Files>
</Directory>
```

Quando l'origine sarà decisa, si può togliere dall'elenco quella che non si usa. Per provare il viewer in locale contro il VPS si può aggiungere temporaneamente `http://localhost:8000` (poi toglierla).

Verifica (dal server o dal PC):

```bash
curl -sI https://<host>/<percorso>/archi.pmtiles | grep -iE 'accept-ranges|access-control|cache-control|content-length'
for o in https://gbvitrano.github.io https://palermohub.github.io https://palermohub.opendatasicilia.it https://sito-non-ammesso.example; do
  echo "$o ->" $(curl -sI -H "Origin: $o" https://<host>/<percorso>/archi.pmtiles | grep -i '^access-control-allow-origin' || echo 'nessun header CORS')
done   # le prime tre devono rimandare l'origine, l'ultima nessun header
curl -s -r 0-99 -o /dev/null -w "%{http_code}\n" https://<host>/<percorso>/archi.pmtiles   # deve essere 206
```

### 3.3 Cosa caricare

I file arrivano dal PC di sviluppo con `rsync`/`scp` sotto un utente dedicato **senza shell di login** o con chiave limitata. Contenuto, dalla cartella `dati/` del repo:

- `mobilita/sicurezza/*.pmtiles`, `monumenti/monumenti_edifici.pmtiles`;
- `popolazione/sezioni_indicatori{,_2023}.compatto.json`, `civici-omi/civici_vie.json`, `civici-omi/civici/*.json`, `trasporto/orari.json`;
- `monumenti/*.geojson`, `scuole/`, `trasporto/*.geojson`, `monumenti/foto/` (53 MB);
- eventualmente le copie dei PMTiles oggi remoti (`particelle`, `buildings_wgs84`, `edificato_pop`, …), **controllando la licenza** di ciascuno (vedi `scripts/fonti.py`).

Dopo il caricamento l'utente aggiorna `catalogo.json` (campo `url`) per puntare a questo host. **Non modificare i file dell'app**: lo fa l'utente dal PC.

### 3.4 I download ANNCSU (GeoParquet e GeoPackage)

Sono file statici già pronti: servili con Apache come gli altri dati (stesse regole di Range, `-Indexes`, niente gzip su `.parquet` e `.gpkg`). Copia le intestazioni CORS già in uso dall'API (`Access-Control-Allow-Origin`, `Allow-Methods GET, HEAD, OPTIONS`, `Expose-Headers Content-Range`). Per i file grandi lasciati in download: `Header set Content-Disposition` solo se serve forzare il salvataggio, e valuta `Cache-Control` più breve (es. un giorno) se si aggiornano. Un GeoParquet con Range attivo si può leggere da remoto anche con DuckDB senza scaricarlo per intero.
Verifica che il rigeneratore di questi file (script o cron che esporta dal DB) usi un **ruolo di sola lettura**.

## 4. PostGIS come sorgente dei dati (opzionale, secondo passo)

Il DB c'è già e ha i dati ANNCSU: si può usare per generare i file statici di questa app, non per servire le mappe a ogni richiesta:

- Ruolo con **sola lettura** per l'esportazione (`GRANT SELECT`), niente superutente nell'app.
- Rigenera i PMTiles con `ogr2ogr` + `tippecanoe` da una query PostGIS, in un cron o a mano.
- Un'API (FastAPI o `pg_featureserv`) va considerata **solo** per funzioni che i file statici non coprono (analisi su poligono disegnato, filtri complessi). In quel caso: ascolta solo su `127.0.0.1`, esposta da Apache come reverse proxy con HTTPS, query parametrizzate, rate limiting (`mod_ratelimit`/`mod_evasive` o fail2ban), utente DB di sola lettura e cache davanti. Non va esposta senza che l'utente l'abbia approvata.

## 5. Cosa riportare all'utente alla fine

- Il file di audit (sezione 1) e un elenco puntuale delle modifiche fatte, con il comando per annullare ciascuna.
- Lo stato finale di `ss -tlnp` (la 5432 solo su localhost), `ufw status verbose` e `sshd -T` sulle opzioni chiave.
- Se è emerso qualcosa di sospetto nei log (accessi falliti al DB, tentativi su SSH), segnalalo con le righe pertinenti **senza** riportare password o dati personali.
- Cosa resta da decidere (dominio, certificato, backup, API sì/no) e conferma che il servizio PostgreSQL e i suoi dati sono rimasti intatti.

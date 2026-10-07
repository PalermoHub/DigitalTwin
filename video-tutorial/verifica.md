# Controllo finale e «Da verificare»

## Controlli eseguiti sul video finito

| Controllo | Esito |
|---|---|
| Durata | **13:29** (limite 15:00; target 13:30–14:30) |
| Formato | MP4, H.264 (High, yuv420p), 1920×1080, 30 fps; audio AAC stereo 48 kHz |
| Loudness | −16,2 LUFS integrati, picco −1,5 dBFS, LRA 6,0 LU (conforme alle linee guida per il web) |
| Parole di voce | 1.724 (tetto 2.100), circa 147 parole al minuto effettive |
| Voce e scene | nessuna voce supera la fine della propria scena (controllo automatico sui log) |
| Sincronia voce/azioni | ogni azione è agganciata a un punto della voce (`sync(frazione)`); le scene con preparazione lenta fanno partire la voce a scena pronta; le parti senza voce (preparazione e code) sono compresse 3× e 2,5× |
| Sottotitoli | 217 righe, Montserrat, sincronizzate frase per frase con la voce; file `consegna/sottotitoli.srt` |
| Verifica visiva | fotogrammi esaminati su tutte le scene (apertura, 19 passi della Guida, RNDT, Geoimage, chiusura) |
| Informazioni a schermo | prese solo da ciò che l'app mostra: testi live delle quattro sezioni letti dal sito pubblicato (`verifica/live-*.txt`) e provati dal vivo |
| Menzione dell'autore del plugin | una sola volta a voce, all'inizio della presentazione del plugin (scena `3-merito`); compare anche nel credito mostrato dall'app e nella schermata finale |

**Cosa non ho potuto controllare:** non posso ascoltare l'audio. Pronuncia delle sigle e dei nomi propri (per esempio «erre enne di ti», «Borruso», «Crameri») e naturalezza della voce vanno verificate all'ascolto. La sincronia l'ho controllata sui tempi registrati e sui fotogrammi, non a orecchio.

## Differenze rispetto alla richiesta iniziale

1. **Voce**: sintesi locale Piper `it_IT-paola-medium` (italiano femminile), perché non avevo chiavi Azure o ElevenLabs. È più meccanica di Elsa o di una voce ElevenLabs. Le tracce sono per scena (`audio/*.wav`, non nel repository): con una chiave si rigenerano con `genera_voce.py` senza rifare il resto. La velocità non è «1.0» del motore: a 1.0 questa voce legge a 212 parole al minuto, quindi l'ho rallentata fino a circa 150.
2. **Testo della Guida**: l'**ordine** dei 19 passi è rispettato; il **testo** è riassunto e parafrasato per rientrare nei tempi, non letto parola per parola.
3. **Tempi delle sezioni**: il video è più compatto delle fasce chieste. Plugin RNDT inizia a 7:17 (fascia 8:00), Geoimage a 10:27 (fascia 11:30), chiusura a 12:53 (fascia 14:00); il totale è 13:29.
4. **Montaggio**: ffmpeg con script Python (non Remotion). Musica di sottofondo sintetizzata da zero (nessun brano di terzi), abbassata sotto la voce.
5. **Geoimage**: la scansione originale della pianta del 1891 (Harvard Map Collection) non era raggiungibile da qui. Ho ricostruito l'immagine dalle tessere della stessa carta su MapWarper e l'ho ruotata e posata su carta, come una scansione non georeferenziata. Lo si può dichiarare in descrizione.
6. **Vista 3D**: la Guida non la descrive, ma il pulsante «3D» c'è e il brief la chiedeva: la mostro con una frase nella scena degli strumenti.
7. **Schermata finale**: quella che hai fornito, con i sottotitoli spostati in alto per non coprire il piè di pagina.

## Da verificare

1. **Indirizzo finale**: `palermodigitaltwin.opendatasicilia.it` compare nella schermata finale e a voce. Da qui non risponde (errore del proxy), quindi non ho potuto controllare il reindirizzamento: deve essere attivo quando il video esce. Le riprese sono fatte su `palermohub.github.io/DigitalTwin`.
2. **Licenza**: il piè di pagina dell'app dice **CC BY-SA 4.0** (e la voce lo ripete «come indicato nell'app»), ma `README.md` e GitHub dichiarano codice sotto **EUPL-1.2** e dati e documentazione sotto **CC BY 4.0**. Va deciso quale dicitura è quella giusta.
3. **Scheda «Plugin RNDT» dell'app**: dice di premere l'icona del catalogo «accanto all'ingranaggio», ma l'icona dei due layer è nella barra strumenti in alto a destra (come mostra il video). Il testo dell'app va corretto.
4. **Guida**: dice che «Monumenti» è nel gruppo «Territorio», ma nell'app è un gruppo a sé. Nel video lo apro dal gruppo vero.
5. **Geoimage da telefono**: la Guida generale parla del tab «Aggiungi»; la Guida Geoimage dice «pulsante nel pannello Strati». I due testi non coincidono; nel video non mostro Geoimage da telefono.
6. **Servizi del catalogo RNDT**: il WFS della Regione Siciliana risponde «not JSON» e il WMS del Ministero risponde 502. Non so se dipenda dalla rete da cui ho registrato o dai servizi. Nel video uso il servizio ArcGIS REST della Regione (Riserve regionali) con «Add features». Se i WFS funzionano da una rete normale, la scena si può rifare con un WFS.
7. **Interfaccia del plugin in inglese**: Search, Type, Where, Settings… non è tradotta. Il video lo dice a voce; se la traducete va rigirata la scena.
8. **Difetto estetico noto**: nei primi secondi della scena Geoimage resta visibile il layer delle Riserve regionali aggiunto nella sezione precedente (il pulsante cestino non lo ha rimosso). Si risolve rifacendo la ripresa con una pulizia più decisa (circa 25 minuti).
9. **Video già incorporato nella Guida**: la scheda «Guida» contiene un video YouTube (`Mzj1xk1l2QM`). Quando pubblichi questo, va aggiornato l'ID in `js/core/guida.js`.
10. **Numeri dichiarati a voce** (copiati dal testo dell'app, non ricontrollati sulle fonti originali): 19 passi, 15 carte storiche dal 1580 al 1993, formati A4–A0, tetto di 10.000 oggetti per il WFS, incendi dal 2007, isole di calore 2019–2025.
11. **Telefono nel video**: è un'anteprima da 390 px di larghezza dell'app dentro una cornice, non un dispositivo reale; il layout è quello vero da telefono.
12. **Fonti con «licenza da verificare» o «condizioni d'uso da verificare»**: sono voci già presenti nella scheda «Fonti e avvisi» dell'app, non del video; conviene risolverle prima di dire che i dati sono «tutti aperti».
13. **File**: nel repository c'è solo la copia compressa del video (89 MB, `consegna/`). Il master a piena qualità (292 MB) sta fuori dal repository.

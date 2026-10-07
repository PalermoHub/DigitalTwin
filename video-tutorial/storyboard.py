"""Fonte unica del video: copione, voce, sottotitoli e azioni derivano tutti da qui.

Ogni scena ha:
  id      identificativo (usato dal registratore e dai file audio)
  sez     sezione (1..5)
  vista   cosa si vede a schermo (colonna del copione)
  azioni  azioni da compiere nell'app (colonna della shot list)
  testo   testo parlato E sottotitolo, scritto in modo leggibile (sigle normali)
  extra   secondi di respiro dopo la voce (la scena dura voce + extra, mai meno di min)
La pronuncia per il TTS si ricava da `testo` con la tabella PRON: i sottotitoli
mostrano le sigle vere, la voce legge «erre enne di ti».
"""
import re

SEZIONI = {
    1: dict(titolo="Apertura", slot=("0:00", "0:45"), lower=None),
    2: dict(titolo="Guida generale della webapp", slot=("0:45", "8:00"), lower="La mappa · Guida"),
    3: dict(titolo="Plugin RNDT", slot=("8:00", "11:30"), lower="Plugin RNDT · catalogo nazionale dei dati"),
    4: dict(titolo="Geoimage", slot=("11:30", "14:00"), lower="Geoimage · mappe storiche sulla città di oggi"),
    5: dict(titolo="Chiusura", slot=("14:00", "14:30"), lower=None),
}

# Pronuncia per il TTS italiano (applicata solo alla voce, non ai sottotitoli).
PRON = [
    (r"palermodigitaltwin\.opendatasicilia\.it", "palermo digital twin, punto, open data sicilia, punto, it"),
    (r"openrndt-geolibre", "open erre enne di ti geo libre"),
    (r"onData", "on data"),
    (r"RNDT", "erre enne di ti"),
    (r"PRG", "pi erre gi"),
    (r"PAI", "pi a i"),
    (r"WMS", "doppia vu emme esse"),
    (r"WFS", "doppia vu effe esse"),
    (r"GCP", "gi ci pi"),
    (r"RMSE", "erre emme esse e"),
    (r"GeoJSON", "geo gèison"),
    (r"GeoTIFF", "geo tiff"),
    (r"KMZ", "cappa emme zeta"),
    (r"QGIS", "cu gis"),
    (r"JSON", "gèison"),
    (r"XYZ", "ics i zeta"),
    (r"ArcGIS", "arc gis"),
    (r"CSV", "ci esse vu"),
    (r"KML", "cappa emme elle"),
    (r"GPX", "gi pi ics"),
    (r"UPL", "u pi elle"),
    (r"3D", "tre di"),
    (r"CC BY-SA 4\.0", "ci ci bai ess a, quattro punto zero"),
    (r"\bA4\b", "a quattro"),
    (r"\bA0\b", "a zero"),
    (r"\b1580\b", "millecinquecentoottanta"),
    (r"\b1891\b", "milleottocentonovantuno"),
    (r"\b1993\b", "millenovecentonovantatré"),
    (r"\b2007\b", "duemilasette"),
    (r"\b2019\b", "duemiladiciannove"),
    (r"\b2025\b", "duemilaventicinque"),
    (r"\b19\b", "diciannove"),
    (r"\b15\b", "quindici"),
    (r"\b10\.000\b", "diecimila"),
    (r"\bMapWarper\b", "map warper"),
    (r"\bLandsat\b", "land sat"),
    (r"\bAMAT\b", "amat"),
    (r"\bESC\b|\bEsc\b", "escape"),
]

def per_voce(testo: str) -> str:
    out = testo
    for pat, rep in PRON:
        out = re.sub(pat, rep, out)
    return out

S = []
def scena(**k):
    k.setdefault("extra", 1.0)
    S.append(k)

# ───────────────────────── 1 · APERTURA (0:00–0:45) ─────────────────────────
scena(id="1-titolo", sez=1,
      vista="Schermo scuro. Il logo (versione scura) si compone con un'animazione, poi il titolo «Palermo Digital Twin · tutorial» e il sottotitolo «Una mappa con i dati aperti di Palermo».",
      azioni=["Pagina locale di apertura (titolo.html): animazione del logo, titolo, promessa. Nessuna interazione con l'app."],
      testo="Ciao, e benvenuto nel Digital Twin di Palermo. Una mappa con i dati aperti della città: catasto, piano regolatore, monumenti, trasporti e molto altro, tutti nello stesso posto.",
      extra=1.5)
scena(id="1-indice", sez=1,
      vista="Dissolvenza sulla mappa viva. Quattro tappe compaiono una alla volta, con il tempo: La mappa, Plugin RNDT, Geoimage, Dove trovarci.",
      azioni=["Apri l'app; accetta/rifiuta il banner cookie prima di registrare (non deve comparire a video).", "Sovrapponi la lista animata delle quattro tappe."],
      testo="In questo video vediamo quattro cose. Primo: come usare la mappa, dalla ricerca di un luogo alla scheda con tutti i dati. Secondo: il plugin che porta in mappa il catalogo nazionale dei dati. Terzo: Geoimage, per sovrapporre le mappe storiche alla Palermo di oggi. Quarto: dove trovare tutto, e come dare una mano.",
      extra=1.0)

# ───────────────────── 2 · GUIDA (0:45–8:00), ordine della Guida ─────────────────────
scena(id="2-guida", sez=2,
      vista="Menu in alto: clic su «Guida». Si apre la pagina con l'indice dei 19 passi; scorrimento lento sull'indice, poi chiusura (Esc) e ritorno alla mappa.",
      azioni=["Clic su «Guida» nel menu in alto.", "Zoom sull'indice a destra (19 voci).", "Esc per chiudere."],
      testo="Tutto parte dalla Guida, nel menu in alto. Ha 19 passi: li facciamo davvero, uno alla volta, sulla mappa.")
scena(id="2-cos-e", sez=2,
      vista="Vista iniziale su Palermo. Cerchi animati su: logo e menu, barra degli strati a sinistra, ricerca in basso, avviso sul valore legale a piè di pagina.",
      azioni=["Home: zoom 12 sul centro.", "Evidenzia in sequenza: menu in alto, rail sinistro, campo di ricerca, piè di pagina."],
      testo="Questa è la vista iniziale: il centro di Palermo. In alto il logo e il menu con le guide. A sinistra la barra degli strati. In basso la ricerca. E a piè di pagina un avviso che ti anticipo: catasto, piano regolatore e vincoli sono dati informativi, senza valore legale.")
scena(id="2-telefono", sez=2,
      vista="Una cornice di telefono entra a destra con la registrazione da smartphone: si toccano in ordine le quattro tab in basso (Mappa, Strati, Aggiungi, Menu); poi un tocco sulla mappa fa salire la scheda dal basso.",
      azioni=["Registrazione separata a 390×844 (touch).", "Tocca: Mappa → Strati → Aggiungi → Menu.", "Tocca la mappa: la scheda sale dal basso."],
      testo="Sul telefono i comandi cambiano. In basso hai quattro tab: Mappa, Strati, Aggiungi e Menu. Strati apre mappe di base, layer e filtri. Aggiungi riunisce i tuoi layer, il catalogo nazionale e Geoimage. Menu apre le guide. Per conoscere un luogo, tocchi la mappa e la scheda sale dal basso.",
      extra=1.5)
scena(id="2-dati", sez=2,
      vista="Menu → «Fonti e avvisi». Si vedono in alto i quattro avvisi (evidenziati), poi lo scorrimento sull'elenco delle fonti: data, link al dato, licenza.",
      azioni=["Clic su «Fonti e avvisi».", "Evidenzia il primo avviso (valore legale).", "Scorri l'elenco delle fonti; zoom su una voce con licenza.", "Esc."],
      testo="I dati arrivano da enti pubblici e da progetti di dati aperti: il Comune di Palermo, l'azienda del trasporto pubblico, il catasto, il piano regolatore, il censimento e OpenStreetMap. L'elenco è in Fonti e avvisi: per ogni fonte trovi la data, il link al dato originale e la licenza. In cima ci sono gli avvisi: catasto, piano regolatore e vincoli non hanno valore legale.")
scena(id="2-strati", sez=2,
      vista="Zoom su via Maqueda. Tab «Layer» a sinistra: si aprono i gruppi in ordine alfabetico; si apre «Territorio» e si accende il catasto, poi gli edifici. Le etichette in alto e la legenda in basso si evidenziano.",
      azioni=["Centra la mappa su via Maqueda, zoom 16.", "Clic sul tab «Layer».", "Apri il gruppo «Territorio»; spunta «Catasto».", "Evidenzia l'etichetta in alto e la legenda in basso.", "Spunta «Edificato»."],
      testo="Gli strati sono i temi che si sovrappongono alla mappa. Apri il tab Layer: i gruppi sono in ordine alfabetico. Apri Territorio e accendi il catasto con la casella. Compare in alto come etichetta, e la legenda in basso ne spiega i colori. Puoi accenderne più d'uno e confrontarli: ad esempio edifici e catasto.")
scena(id="2-ordine", sez=2,
      vista="In cima al tab Layer, la scheda arancione «Ordine layer in mappa» con gli strati accesi; una freccia sposta un layer più in alto e la mappa cambia.",
      azioni=["Apri «Ordine layer in mappa».", "Clic sulla freccia «su» di uno strato.", "Mostra l'effetto sulla mappa."],
      testo="Con più strati accesi, la scheda arancione Ordine layer in mappa li elenca tutti. In alto vuol dire sopra, sulla mappa. Li sposti con le frecce o trascinandoli, e l'ordine viene ricordato.")
scena(id="2-storiche", sez=2,
      vista="Tab «Base cartografica»: si provano mappa stradale, aerea, scura. Scorrimento fino a «Mappe storiche»: si sceglie la carta del 1891 e si vede il pallino colorato di precisione. Ritorno alla base chiara.",
      azioni=["Clic sul tab «Base cartografica».", "Seleziona una base aerea, poi una scura, poi torna a quella chiara.", "Scorri fino a «Mappe storiche».", "Seleziona la carta 1891; evidenzia il pallino di precisione.", "Ripristina la base chiara."],
      testo="Il tab Base cartografica cambia la mappa che sta sotto gli strati: stradale, aerea, topografica. In fondo ci sono le mappe storiche: 15 carte di Palermo, dal 1580 al 1993. Il pallino colorato dice quanto la carta si sovrappone bene alla città di oggi. Qui, Palermo nel 1891.")
scena(id="2-miei-layer", sez=2,
      vista="Tab «I miei layer»: si aprono «I miei dati» e il ramo «Servizi» con i tipi XYZ, WMS, WMTS, WFS, ArcGIS REST. Nessun file viene caricato.",
      azioni=["Clic sul tab «I miei layer».", "Evidenzia «I miei dati» e il campo «Da indirizzo web».", "Apri il ramo «Servizi» e mostra i tipi."],
      testo="Nel tab I miei layer aggiungi i tuoi dati: un file dal computer, un indirizzo web, oppure un servizio di mappe. Funziona come il Browser di QGIS. I servizi restano salvati nel tuo browser.")
scena(id="2-colori", sez=2,
      vista="Accanto a «Edificato» il pulsante tavolozza: si apre il pannello colori, «Colora per attributo» con campo densità di popolazione, tipo «Graduata», rampa dall'elenco; gli edifici si colorano e compare la legenda del tema.",
      azioni=["Accendi «Edificato» (gruppo Edifici), zoom 15 sul centro.", "Clic sulla tavolozza.", "«Colora per attributo» → campo densità di popolazione → «Graduata».", "Apri l'elenco delle rampe e scegli una rampa Crameri."],
      testo="Il pulsante con la tavolozza apre il pannello dei colori. Con Colora per attributo scegli un campo dei dati e la mappa si colora di conseguenza. Qui gli edifici, per densità di popolazione. La rampa si sceglie da un elenco con l'anteprima, comprese le scale scientifiche di Fabio Crameri, leggibili anche con il daltonismo.")
scena(id="2-clic", sez=2,
      vista="Clic su un punto di via Maqueda: il punto si evidenzia, la scheda si apre a destra, in basso la legenda «Selezione in mappa». Il mouse passa su un'area: compare il fumetto con il nome del layer.",
      azioni=["Chiudi il tema colori («Ripristina»).", "Clic sulla mappa in via Maqueda (13.3586, 38.1203), zoom 17.", "Clic su una voce della legenda «Selezione in mappa» (solo quella), poi di nuovo (tutte).", "Passa il mouse su un'area evidenziata."],
      testo="Per conoscere un luogo basta fare clic sulla mappa. Il punto viene evidenziato e si apre la scheda del luogo. Le aree evidenziate hanno una legenda con un colore per ogni voce: un clic su una voce lascia in mappa solo quella. Passando con il mouse compare un fumetto con il nome del layer.")
scena(id="2-tutto", sez=2,
      vista="La scheda a schermo intero sul lato: cinque riquadri evidenziati in sequenza che escono dal punto (catasto, vincoli, sicurezza, cultura, trasporti).",
      azioni=["Scorri la scheda dall'alto.", "Evidenzia in ordine: particella catastale, zonizzazione PRG, rischio incidenti, bene culturale, fermata."],
      testo="Ed è qui la forza della mappa: un solo clic interroga insieme catasto, vincoli del piano regolatore, sicurezza stradale, beni culturali e trasporto pubblico. La scheda mette in fila tutto ciò che si sovrappone in quel punto.")
scena(id="2-scheda", sez=2,
      vista="Le linguette della scheda (Luogo, Strumenti urbanistici, Mercato, Popolazione): si passa da una all'altra; in «Strumenti urbanistici» si evidenziano particella, foglio, numero e il link alla visura.",
      azioni=["Clic sulle linguette: Luogo → Strumenti urbanistici → Mercato → Popolazione.", "In «Strumenti urbanistici» evidenzia foglio, particella, link visura."],
      testo="La scheda è divisa in sezioni, che scegli dalle linguette in alto. Luogo riassume indirizzo, quartiere, monumenti, rischio di incidenti e fermate vicine. Strumenti urbanistici parte dall'edificio, poi mostra la particella, con foglio e numero, e il collegamento alla visura. Ogni sezione indica la fonte.")
scena(id="2-monumenti", sez=2,
      vista="Strato «Monumenti» acceso; zoom sul Teatro Massimo; clic: la scheda mostra foto, descrizione, categoria e il link al Portale del Turismo.",
      azioni=["Layer → Territorio → spunta «Monumenti».", "Vola sul Teatro Massimo (13.3572, 38.1202), zoom 16,5.", "Clic sul monumento.", "Evidenzia foto e link al Portale del Turismo."],
      testo="Lo strato Monumenti mostra chiese, palazzi, fontane e teatri. Un clic sul Teatro Massimo apre la sua scheda: foto, descrizione, categoria, e il collegamento al Portale del Turismo del Comune di Palermo, da cui arrivano i testi.")
scena(id="2-uffici", sez=2,
      vista="Strato «Uffici comunali (sedi)»: clic su Palazzo Palagonia; la scheda elenca aree e uffici con responsabili e contatti.",
      azioni=["Spegni Monumenti, accendi «Uffici comunali (sedi)».", "Vola su Palazzo Palagonia (13.3700, 38.1167), zoom 16,5.", "Clic sulla sede; apri «Uffici e responsabili»."],
      testo="Lo strato Uffici comunali mostra dove sono gli uffici del Comune, raggruppati per sede. La scheda di Palazzo Palagonia elenca aree e uffici, con responsabili e contatti, quando sono pubblicati.")
scena(id="2-pai", sez=2,
      vista="Gruppo «Piano PAI»: si accende «Pericolosità idraulica»; clic su un'area; nella scheda, «Strumenti urbanistici», il riquadro «Vincoli PAI» con la classe più grave.",
      azioni=["Layer → «Piano PAI» → spunta «Pericolosità idraulica».", "Vola su (13.40, 38.08), zoom 13.", "Clic su un'area colorata.", "Scheda → «Strumenti urbanistici» → evidenzia «Vincoli PAI»."],
      testo="Il gruppo Piano PAI riporta il Piano di assetto idrogeologico della Regione Siciliana: pericolosità e rischio idraulico e geomorfologico. Un clic su un'area apre la scheda, con il riquadro Vincoli PAI e la classe più grave. Sono dati informativi: per usi legali vale la cartografia ufficiale.")
scena(id="2-incendi", sez=2,
      vista="Strato «Incendi»: aree colorate per anno; clic su un incendio del 2023: la scheda riporta data, località, superfici.",
      azioni=["Spegni PAI, accendi «Incendi».", "Vola su (13.33, 38.10), zoom 12.", "Clic su un'area bruciata del 2023."],
      testo="Lo strato Incendi mostra le aree percorse dal fuoco dal 2007, anno per anno: il colore indica l'anno. La scheda riporta data, località e superfici bruciate.")
scena(id="2-calore", sez=2,
      vista="Strato «Isole di calore»: sezioni di censimento colorate per temperatura. Nella legenda si cambia il metodo di classificazione e si vede il grafico 2019–2025. Un clic apre la scheda «Isola di calore».",
      azioni=["Spegni Incendi, accendi «Isole di calore» (Territorio), zoom 13.", "Nella legenda: cambia metodo di classificazione e numero di classi.", "Evidenzia il grafico dell'andamento.", "Clic su una sezione: scheda «Isola di calore»."],
      testo="Le isole di calore mostrano la temperatura della superficie in estate, ricavata dai satelliti Landsat, per ogni sezione di censimento. Nella legenda scegli il metodo di classificazione e il numero di classi, e vedi l'andamento dal 2019 al 2025. Attenzione: è la temperatura della superficie, non quella dell'aria.")
scena(id="2-filtri", sez=2,
      vista="Tab «Filtri»: si sceglie una circoscrizione; nel campo di ricerca si digita «Maqueda»; compare l'elenco; clic su un risultato: la mappa vola sul posto e si apre la scheda.",
      azioni=["Spegni gli strati accesi (pulsante Ripristina o caselle).", "Clic sul tab «Filtri»; scegli una circoscrizione.", "Digita «Maqueda» nel campo di ricerca in basso.", "Clic sul primo risultato."],
      testo="Per cercare, scrivi nel campo in basso una via, un civico, un quartiere o una particella. Il tab Filtri limita la ricerca a una circoscrizione, un quartiere o una zona, oppure ti fa trovare una particella da foglio e numero. Per esempio: scegli una circoscrizione e scrivi Maqueda. Un clic sul risultato porta la mappa sul posto.")
scena(id="2-strumenti", sez=2,
      vista="Barra strumenti in alto a destra: casa, tasto 3D (la mappa si inclina), schermo intero, luna (tema scuro), stampante con il menu formato/orientamento/scala.",
      azioni=["Clic su 3D: inclinazione, poi di nuovo per tornare piatta.", "Clic sulla luna: tema scuro, poi torna chiaro.", "Clic sulla stampante: si apre il menu; mostra formato, orientamento, scala; chiudi senza stampare."],
      testo="Gli strumenti in alto a destra. La casa riporta alla vista iniziale. Il pulsante 3D inclina la mappa. Poi lo schermo intero e la luna, per il tema scuro. La stampante prepara un foglio con la mappa, le legende e le fonti: scegli formato, da A4 ad A0, orientamento e scala.")
scena(id="2-avvertenze", sez=2,
      vista="Di nuovo la scheda del luogo, sezione «Strumenti urbanistici», con in fondo l'avviso «dato informativo, senza valore legale»; evidenziato anche l'avviso a piè di pagina.",
      azioni=["Clic su via Maqueda; scheda → «Strumenti urbanistici» → scorri in fondo.", "Evidenzia l'avviso nella scheda e quello nel piè di pagina."],
      testo="Un'ultima avvertenza, importante. Catasto, zonizzazione e vincoli hanno valore solo informativo: non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. I dati del censimento sono stime. Per usi legali, rivolgiti sempre agli uffici competenti.")

# ───────────────────── 3 · PLUGIN RNDT (8:00–11:30) ─────────────────────
scena(id="3-cose", sez=3,
      vista="Cartello di sezione «Plugin RNDT». Sulla mappa, il pulsante RNDT lampeggia. Una definizione animata: «RNDT = Repertorio Nazionale dei Dati Territoriali», con l'immagine di una biblioteca di mappe.",
      azioni=["Stacco di sezione (lower third «Plugin RNDT»).", "Mappa in vista iniziale, nessuna interazione."],
      testo="Passiamo al catalogo nazionale. Prima, due frasi su cos'è. L'RNDT, il Repertorio Nazionale dei Dati Territoriali, è il catalogo ufficiale italiano dei dati geografici: raccoglie le schede di migliaia di mappe pubblicate da Comuni, Regioni, ministeri e altri enti. È come una biblioteca: ti dice che cosa esiste, chi l'ha prodotto e dove consultarlo.")
scena(id="3-merito", sez=3,
      vista="Si apre il pannello «Catalogo RNDT · Palermo». Zoom sulla riga in alto: «Plugin openrndt-geolibre di Andrea Borruso (onData)».",
      azioni=["Clic su «Catalogo RNDT» (icona dei due layer, barra strumenti in alto a destra).", "Zoom e callout sulla riga del credito in cima al pannello."],
      testo="Dentro questa mappa, il catalogo è il plugin openrndt-geolibre, ideato e scritto da Andrea Borruso di onData. Senza il suo lavoro questa funzione non esisterebbe: è stato adattato a Palermo con pochissimi interventi, grazie alla sua ottima architettura.")
scena(id="3-dove", sez=3,
      vista="Callout sul pulsante nella barra strumenti, poi sul pannello sul lato destro e sui tab «Scheda» e «RNDT» della barra verticale. Si ricorda che l'interfaccia è in inglese.",
      azioni=["Evidenzia il pulsante RNDT nella barra strumenti.", "Evidenzia i tab «Scheda» e «RNDT» nella barra verticale a destra.", "Esc chiude il pannello; riapri con il pulsante."],
      testo="Lo trovi nella barra degli strumenti in alto a destra: è l'icona con i due layer. Il pannello si apre sul lato destro, e i tab Scheda e RNDT ti fanno passare dall'uno all'altro. Con Esc lo chiudi. L'interfaccia del plugin è in inglese: sono poche parole, non spaventarti.")
scena(id="3-cerca", sez=3,
      vista="Nel campo di ricerca si scrive «frane» e si preme «Search». Si evidenziano i filtri: Type (All/Data/Services), Where, Available as (WMS, WFS, ArcGIS REST), Advanced filters.",
      azioni=["Clic nel campo «Search titles, abstracts, keywords…».", "Digita «frane» e premi «Search».", "Evidenzia Type, Where, Available as, Advanced filters (apri e richiudi)."],
      testo="Scrivi cosa cerchi, per esempio frane, e premi Search. La ricerca è sempre limitata all'area di Palermo. Puoi filtrare per tipo, dati o servizi, e per formato: WMS, WFS o ArcGIS REST. Nei filtri avanzati ci sono tema, ente e date.")
scena(id="3-risultato", sez=3,
      vista="L'elenco dei risultati; clic su uno: scheda con titolo, descrizione, ente responsabile e servizi disponibili. Si evidenziano i pulsanti WMS e WFS.",
      azioni=["Clic su un risultato pertinente (PAI / frane).", "Evidenzia titolo, ente, servizi.", "Evidenzia i pulsanti WMS e WFS."],
      testo="Scegli un risultato: si apre la scheda, con titolo, descrizione, ente responsabile e servizi disponibili. Poi scegli il servizio. Il WMS è un livello di immagini da sovrapporre; il WFS porta i dati veri, con le informazioni sugli oggetti, scaricati come GeoJSON.")
scena(id="3-aggiungi", sez=3,
      vista="Si aggiunge il servizio WFS: l'area PAI da frana compare sulla mappa. Il tab «RNDT» della barra a sinistra mostra il layer nel gruppo, con occhio, cursore opacità e cestino.",
      azioni=["Clic sul pulsante per aggiungere il servizio.", "Attendi il caricamento del layer sulla mappa.", "Apri il tab «RNDT» a sinistra: evidenzia occhio, opacità, cestino."],
      testo="Ecco il nuovo strato sulla mappa. Lo ritrovi nel gruppo RNDT della barra degli strati: con l'occhio lo accendi e lo spegni, con il cestino lo rimuovi. Si ricorda da solo: riapri la mappa e lo ritrovi lì.")
scena(id="3-interroga", sez=3,
      vista="Clic su un'area del layer: la scheda si apre sulla linguetta «Altri dati (RNDT)» con il riquadro del layer e la classe di pericolosità.",
      azioni=["Vola sull'area e zooma finché l'elemento è cliccabile.", "Clic proprio sull'elemento.", "Scheda → linguetta «Altri dati (RNDT)»; evidenzia classe e fonte."],
      testo="Un clic sulla mappa interroga anche questi layer. Le risposte arrivano nella linguetta Altri dati RNDT della scheda, con un riquadro per ogni layer. Qui, la classe di pericolosità di un'area da frana. Bisogna cliccare proprio sull'elemento.")
scena(id="3-limiti", sez=3,
      vista="Testo animato a schermo con due promemoria: «WFS: massimo 10.000 oggetti → per strati densi, meglio il WMS» e «Servizio non raggiungibile → resta in elenco come “non disponibile”».",
      azioni=["Mappa ferma con il layer acceso; cartello animato con i due promemoria."],
      testo="Due cose da sapere. Il download WFS ha un tetto di 10.000 oggetti: per strati molto densi, come le particelle catastali, meglio il WMS. E se un servizio non risponde, resta in elenco come non disponibile, senza essere cancellato.")
scena(id="3-file", sez=3,
      vista="Tab «I miei layer»: evidenziata l'icona di caricamento accanto a «I miei dati»; elenco dei formati accettati a schermo.",
      azioni=["Clic sul tab «I miei layer».", "Evidenzia l'icona di caricamento e «Carica file dal computer» (senza caricare nulla)."],
      testo="E i tuoi file? Si caricano da I miei layer: GeoJSON, KML, GPX, Shapefile in zip, CSV con latitudine e longitudine. Di ogni file restano solo gli elementi dentro il Comune di Palermo.")
scena(id="3-sintesi", sez=3,
      vista="Quattro icone in fila: cerca, scegli, aggiungi, clicca. Sullo sfondo la mappa con il layer RNDT.",
      azioni=["Stacco grafico di riepilogo; nessuna interazione."],
      testo="In breve: cerchi, scegli, aggiungi, clicchi. Quattro passi per portare in mappa i dati ufficiali che riguardano Palermo.",
      extra=1.5)

# ───────────────────── 4 · GEOIMAGE (11:30–14:00) ─────────────────────
scena(id="4-cose", sez=4,
      vista="Cartello di sezione «Geoimage». Apertura del pannello dal tab «Geoimage» della barra a destra. Callout sul riquadro «Carica mappa storica».",
      azioni=["Lower third «Geoimage».", "Clic sul tab «Geoimage» nella barra verticale a destra."],
      testo="Ultima funzione: Geoimage. Ti permette di sovrapporre una mappa storica, o qualsiasi immagine, alla cartografia moderna, e di georeferenziarla: cioè darle coordinate geografiche reali, usando i punti di controllo, i GCP.")
scena(id="4-inquadra", sez=4,
      vista="Nel campo di ricerca si scrive «Teatro Massimo»: la mappa si porta sull'area che l'immagine rappresenta.",
      azioni=["Cerca «Teatro Massimo» (o via Maqueda) e scegli il risultato; zoom 15."],
      testo="Primo passo: inquadra la zona con la ricerca, così l'immagine si carica già vicina al posto giusto.")
scena(id="4-carica", sez=4,
      vista="Il file della pianta del 1891 viene trascinato nel riquadro «Carica mappa storica»; l'immagine appare al centro, con le maniglie arancioni.",
      azioni=["Carica il file (pianta_1891_demo.png) nel riquadro «Carica mappa storica» (trascinamento).", "Evidenzia le maniglie."],
      testo="Trascina il file nel riquadro Carica mappa storica, oppure cliccalo. Qui una pianta di Palermo del 1891: appare subito al centro della mappa, con le maniglie di posizionamento.")
scena(id="4-posiziona", sez=4,
      vista="Si trascina il cerchio centrale (sposta), il cerchio con la freccia (ruota), un angolo (scala); si passa a «deforma» con il pulsante «Maniglie: scala / deforma»; si regola l'opacità.",
      azioni=["Trascina il cerchio centrale.", "Trascina il cerchio con la freccia sopra il lato nord.", "Trascina un angolo in modalità scala; clic su «Maniglie: scala / deforma»; trascina un angolo in modalità deforma.", "Abbassa l'opacità."],
      testo="Con le maniglie la sposti, la ruoti e la ridimensioni. Gli angoli hanno due modalità, scala e deforma, utile per le carte che non sono rettangolari.")
scena(id="4-gcp", sez=4,
      vista="Modalità GCP: per ciascun punto, un clic sull'immagine storica (cerchio arancione) e uno sullo stesso luogo nella mappa di base (il cerchio diventa rosso e numerato). Quattro punti agli angoli.",
      azioni=["Clic su «Aggiungi GCP» (o tasto G).", "Per 4 punti (Teatro Massimo, Quattro Canti, Porta Nuova, Stazione Centrale): clic sul punto dell'immagine, poi sul punto della base.", "Attiva Spotlight un istante per scegliere con precisione il secondo clic."],
      testo="Ora i punti di controllo. Premi Aggiungi GCP. Per ogni punto servono due clic: il primo su un luogo riconoscibile dell'immagine storica, un incrocio, un edificio, un monumento. Il secondo sullo stesso luogo nella mappa moderna. Ne servono almeno tre, meglio se agli angoli.",
      extra=2.0)
scena(id="4-allinea", sez=4,
      vista="Clic su «Allinea immagine ai GCP»: l'immagine scorre e si sovrappone alla città di oggi.",
      azioni=["Clic su «Allinea immagine ai GCP» (trasformazione affine)."],
      testo="Con tre punti puoi premere Allinea immagine ai GCP: l'app calcola la trasformazione e sposta l'immagine al posto giusto.")
scena(id="4-rmse", sez=4,
      vista="Zoom sul pannello: valore dell'RMSE e tabella dei GCP con i residui colorati (verde, arancione, rosso).",
      azioni=["Zoom sul valore RMSE e sulla tabella dei residui.", "Trascina un GCP impreciso per ridurre l'errore (se serve)."],
      testo="Controlla l'errore. L'RMSE è l'errore medio in metri: più è basso, meglio è. Nella tabella ogni punto ha il suo residuo: verde se è nella norma, rosso se è molto più alto. Se è alto, sposta i punti meno precisi o aggiungine altri.")
scena(id="4-confronto", sez=4,
      vista="Swipe: la linea verticale scorre, a sinistra la carta storica e a destra la base moderna. Poi Spotlight: il cerchio segue il mouse e scopre la base sotto l'immagine.",
      azioni=["Clic su «Swipe»: trascina la maniglia da sinistra a destra.", "Clic su «Swipe» per spegnere; clic su «Spotlight»: muovi il mouse in cerchio; regola «Raggio»."],
      testo="Per verificare, usa lo Swipe: una linea divide la mappa, a sinistra la carta storica, a destra la base di oggi. Oppure lo Spotlight: un cerchio che segue il mouse scopre la base sotto l'immagine.")
scena(id="4-esporta", sez=4,
      vista="Sezione «Export»: si vedono KMZ, GeoTIFF, .points, World file, GCP GeoJSON, JSON. Un clic su GeoTIFF apre le impostazioni (sistema di riferimento, ricampionamento, risoluzione, compressione).",
      azioni=["Scorri fino a «Export».", "Clic su «GeoTIFF»: mostra le impostazioni; chiudi senza scaricare."],
      testo="Quando sei soddisfatto, esporta: KMZ per Google Earth e QGIS, GeoTIFF con le coordinate incorporate, i punti per il georeferenziatore di QGIS, il world file, oppure il progetto in JSON.")
scena(id="4-chiusura", sez=4,
      vista="Callout sul salvataggio automatico e testo «Più precisione? MapWarper».",
      azioni=["Cartello animato con i due promemoria."],
      testo="Il progetto si salva da solo nel browser. E se vuoi più precisione, ti consigliamo MapWarper.",
      extra=1.5)

# ───────────────────── 5 · CHIUSURA (14:00–14:30) ─────────────────────
scena(id="5-riepilogo", sez=5,
      vista="Zoom indietro sulla mappa di Palermo. Tre punti numerati compaiono a schermo, uno per frase.",
      azioni=["Home; cartelli animati 1-2-3."],
      testo="Riassumiamo in tre punti. Uno: un clic ti dice tutto di un luogo, con la fonte. Due: il catalogo nazionale porta in mappa i dati ufficiali. Tre: Geoimage confronta la Palermo di oggi con quella di ieri.")
scena(id="5-saluti", sez=5,
      vista="Schermata finale fornita (assets/chiusura.png): «Grazie per l'attenzione», indirizzo palermodigitaltwin.opendatasicilia.it, Open Data Sicilia, crediti. Dissolvenza in entrata.",
      azioni=["Dissolvenza sulla schermata finale e tienila fino alla fine."],
      testo="Trovi l'app su palermodigitaltwin.opendatasicilia.it. La licenza è CC BY-SA 4.0, come indicato nell'app, e il progetto è di Open Data Sicilia. Trovi un errore, o hai un'idea? Segnalalo e contribuisci.",
      extra=3.0)

def conteggio():
    tot = {}
    for s in S:
        tot[s["sez"]] = tot.get(s["sez"], 0) + len(s["testo"].split())
    return tot

if __name__ == "__main__":
    c = conteggio()
    for k, v in c.items():
        print(f"sezione {k}: {v} parole")
    print("totale", sum(c.values()))

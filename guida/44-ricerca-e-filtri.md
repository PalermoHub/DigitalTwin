# Ricerca e filtri

## Il campo di ricerca

Parole chiave: ricerca, cercare, barra di ricerca, via, civico, indirizzo, luoghi, risultati, nessun risultato, marcatore.

Domande tipiche: Cosa posso cercare? Come cerco una via con il numero civico? Come funzionano i risultati?

Il campo di ricerca è in basso sulla mappa (da smartphone in alto, sotto il logo). La ricerca parte quando si scrivono almeno **3 caratteri** (o un numero). I risultati compaiono in un elenco sotto il campo. Si sceglie un risultato con un clic oppure con **Invio**, che prende il primo. La mappa vola sul punto (zoom 18 se non indicato altrimenti), sul punto compare un **marcatore** e il testo del risultato entra nel campo. Se il risultato è un luogo di uno strato spento, lo strato si accende da solo. Cliccando fuori dalla barra l'elenco si chiude. Se non c'è niente: «Nessun risultato».

**Che cosa si trova**
- **Vie e numeri civici**: si scrive il nome della via, tutte le parole in qualsiasi ordine, e se serve il numero. Con «via + numero» la ricerca porta al civico esatto; per un numero con lettera (per esempio 4A) va scritto con la lettera. Se si scrive «4» e esistono solo 4A, 4B… li propone. Se il civico non c'è, porta alla via con la nota «civico non trovato». Si ignorano gli accenti e le maiuscole. I civici sono quelli del Comune di Palermo.
- **Luoghi per nome**: scuole e asili, sedi elettorali (anche per numero di sezione), monumenti, alberi monumentali, fontanelle, fermate (con le linee), linee di bus e tram (per numero o nome), stazioni e linee della ferrovia urbana, colonnine di ricarica, distributori di carburante, sedi degli uffici comunali, immobili comunali e immobili MEF, PEBA, progetti PNRR e opere pubbliche.
- **Particelle catastali**: si scrive «12/345», «f 12 p 345» oppure «foglio 12 particella 345». Il risultato è «Particella catastale — foglio [n], particella [n]».
- **Quartieri, circoscrizioni e UPL**: le zone il cui nome inizia con il testo compaiono per prime.
- **Incendi e vincoli PAI**: vedi sotto.
- **Incidenti stradali e vie**: vedi sotto.
- **Argomenti delle guide**: la ricerca propone fino a 3 argomenti delle guide (Guida, Guida Geoimage, Plugin RNDT), ciascuno con il nome della guida.

**Ordine dei risultati**: prima le righe sugli incidenti (se si è scritto «incidente»), poi le zone che iniziano con il testo, i luoghi per nome, le vie e i civici e, in fondo, le zone che contengono il testo e le righe sulle vie con incidenti.

Se un archivio non si carica la ricerca lo dice («Ricerca non disponibile: [motivo]», «indice civici non disponibile»).

---

## Cercare incidenti e vie pericolose

Parole chiave: incidente, sinistro, incidente mortale, incidenti su una via, anno, gravità, strada pericolosa.

Domande tipiche: Come trovo gli incidenti di una via? Come cerco solo i mortali? Posso cercare per anno?

- Scrivendo **solo il nome di una via** compare, in fondo ai risultati, una riga per le vie con incidenti, con il numero di incidenti, i mortali e, per le più pericolose, il posto in classifica («#[n] tra le più pericolose»). Un clic imposta il filtro degli incidenti su quella via, accende lo strato e inquadra la strada.
- Scrivendo la parola **«incidente»** o **«sinistro»** (anche al plurale) i risultati sugli incidenti vanno **in cima**: le vie e i singoli incidenti. Si possono aggiungere parole per la **gravità** («mortale», «riservata», «feriti», «danni/cose») e un **anno** a quattro cifre (per esempio «incidente mortale roma 2018»). Le altre parole filtrano per nome di via.
- Ogni singolo incidente è una riga «Incidente [gravità] [anno]».

---

## Cercare incendi e vincoli PAI

Parole chiave: incendi 2023, vincoli PAI, ricerca per anno, ricerca per tema, località incendio.

Domande tipiche: Come cerco gli incendi di un anno? Come trovo un vincolo PAI?

- **Incendi**: scrivendo «incendi» compare «Incendi — tutti gli anni» con il numero di aree percorse dal fuoco e gli anni più recenti (fino a tre righe). Aggiungendo un anno («incendi 2023») compare la riga di quell'anno. Un clic accende lo strato, filtra per anno e inquadra la città (zoom 12). Si possono cercare anche le **località** degli incendi già caricate nei tile.
- **Vincoli PAI**: la ricerca propone i temi PAI e le loro classi; un clic accende lo strato corrispondente.

---

## Il tab «Filtri»

Parole chiave: filtri, pannello filtri, circoscrizione, quartiere, UPL, linea, anno, gravità, particella, foglio, numero, chip dei filtri, maschera.

Domande tipiche: Come limito la mappa a un quartiere? Come filtro una linea del trasporto? Come filtro gli incidenti per anno?

Il tab **Filtri** della barra a sinistra (da smartphone nel foglio «Strati») raccoglie quattro filtri. Un numero sul tab dice quanti sono attivi; sotto il campo di ricerca compaiono i **chip** dei filtri, ciascuno con una ✕ per toglierlo.

1. **Zona: circoscrizione › quartiere › UPL.** Sono tre menu a scalare: scegliere un livello restringe l'elenco del livello successivo, e scegliere un livello basso imposta anche i suoi genitori. Le voci sono «— Tutte —» e le zone; le circoscrizioni hanno il nome per esteso (I · Centro Storico, II · Brancaccio, III · Oreto, IV · Mezzomonreale, V · Noce, VI · Resuttana, VII · Mondello, VIII · Libertà). La mappa **inquadra la zona** e **schiarisce tutto il resto** con una maschera, per tutti gli strati. Togliendo un livello si tolgono anche quelli sotto; il livello sopra resta.
2. **Linea del trasporto pubblico.** Restringe tracciati e fermate a una sola linea (e alle fermate dove passa). L'elenco ha una voce per linea (le due direzioni unite): prima i bus, poi i tram, poi la ferrovia; i numeri in ordine numerico.
3. **Incidenti: anno e gravità.** «Tutti gli anni» oppure uno tra 2015, 2016, 2017, 2018, 2020, 2021, 2022, 2023 (il 2019 non è nel dataset); la gravità è «Tutte», Mortale, Feriti con prognosi riservata, Con feriti, Solo danni a cose. Si combinano in AND con la **via** scelta dalla ricerca. Quando un filtro è attivo lo strato degli incidenti si accende da solo e i punti si vedono già da zoom 12 (altrimenti da zoom 14). Chip: «Incidenti [anno]», «Incidenti [gravità]», «Incidenti: [via]».
4. **Particella catastale: foglio e numero.** Due campi e un pulsante. Servono entrambi («Inserire sia il foglio che la particella»), lo zoom deve essere almeno 12 («Avvicinati alla zona (zoom 12 o più) e riprova») e la particella si trova **solo se i suoi tile sono già caricati**: se non la trova dice «Nessuna particella trovata: sposta la mappa sulla zona giusta e riprova». Se la trova accende il catasto, la evidenzia, inquadra e mostra un riquadro «Particella cercata — Foglio [n] · Particella [n]».

I filtri scelti entrano anche nel link di «Condividi».

---

## Il pulsante «Ripristina»

Parole chiave: ripristina, reset, ripristino impostazioni, personalizzazioni, ordine degli strati, invito all'avvio.

Domande tipiche: Come azzero i colori e l'ordine che ho scelto? Cosa cancella il pulsante accanto alla ricerca?

Il pulsante con la freccia circolare accanto alla ricerca ha due effetti:
- se in mappa c'è una **selezione** (aree evidenziate del clic), la toglie, come Esc;
- a mappa già libera chiede conferma: «Ripristinare colori, schede, ordine degli strati e invito ai valori iniziali? I layer RNDT aggiunti restano.» Confermando cancella dal browser i **colori degli strati**, le **informazioni scelte per le schede**, l'**ordine degli strati** e la scelta di non mostrare l'invito iniziale, poi ricarica la pagina. I layer del catalogo RNDT aggiunti non si toccano.

# Schede della sicurezza stradale

## Scheda «Tratto stradale»

Parole chiave: tratto stradale, arco, incidenti per km, tasso, pendenza, accessibilità per pendenza, rischio frane, rischio alluvioni, via pericolosa.

Domande tipiche: Cosa mostra la scheda di una strada? Cosa significa «incidenti per km»? Perché dice «non significativo»?

Cliccando su una strada con lo strato «Incidenti per km sulle strade» (o le 20 strade più pericolose) acceso, la scheda ha come titolo il nome della strada (o «Strada senza nome») e il badge «Tratto stradale». Sotto il titolo compaiono quartiere, circoscrizione e UPL. I gruppi:

- **Via tra le più pericolose** (solo se la via è nella classifica delle 20): posto in classifica (per esempio «3 su 20»), gravità per km della via, incidenti sulla via con i chilometri, mortali sulla via.
- **Sicurezza**: «Incidenti 2015–2023» (numero, oppure «nessun incidente registrato») e «Incidenti per km». Se il tratto è più corto di 20 metri il tasso dice «non significativo (tratto < 20 m)», perché su pochi metri il tasso non è affidabile.
- **Tratto**: lunghezza in metri, pendenza media in percentuale, accessibilità per pendenza.
- **Rischio idrogeologico**: rischio frane e priorità frane, rischio alluvioni e priorità alluvioni, dal PAI. Le righe senza rischio («nessun…») non vengono mostrate.

In fondo c'è la nota sulla fonte. La classifica pesa gli incidenti per gravità e considera solo vie di almeno 3 km con 30 incidenti; archi senza nome in OpenStreetMap esclusi.

---

## Scheda «Zona a incidenti concentrati» (hotspot)

Parole chiave: hotspot, zona a incidenti concentrati, cella, Getis-Ord, gravità pesata, confidenza, 250 metri.

Domande tipiche: Cos'è un hotspot? Cosa vuol dire confidenza? Come si calcola la gravità?

Con lo strato «Hotspot degli incidenti» acceso, il clic su una cella apre la scheda «Zona a incidenti concentrati» (badge «Hotspot incidenti»), con:
- **Confidenza (gravità)** e **Confidenza (conteggio)**: livello di confidenza in percentuale, calcolato sulla gravità e sul conteggio degli incidenti.
- **Incidenti nella cella**.
- **Gravità pesata**.

La nota spiega il metodo: celle di 250 m, statistica Getis-Ord Gi* (contiguità Queen, 999 permutazioni). La gravità pesa gli incidenti mortali 5, con prognosi riservata 3, con feriti 1, solo danni a cose 0,2. Sulla mappa compaiono solo le celle statisticamente significative.

---

## Scheda «Incidente»

Parole chiave: incidente, singolo incidente, gravità, mortale, feriti, prognosi riservata, solo danni a cose, anno.

Domande tipiche: Cosa mostra la scheda di un incidente? Cosa significano i colori della gravità?

Con lo strato «Incidenti» (da zoom 14) il clic su un punto apre la scheda «Incidente», con il luogo come titolo e tre righe: **Anno**, **Gravità** e **Feriti**.

La gravità ha quattro classi: **Mortale**, **Feriti con prognosi riservata**, **Con feriti** e **Solo danni a cose**, ciascuna con il suo colore in mappa (dal rosso scuro al grigio). Gli incidenti sono 2015-2023 (il 2019 non è nel dataset pulito), agganciati alla rete stradale; il filtro per anno e gravità sta nel tab «Filtri».

Fonte: Comune di Palermo (Polizia Municipale), elaborazione PalermoHub / OpenDataSicilia.

---

## Tooltip della sicurezza stradale

Parole chiave: tooltip, fumetto, passaggio del mouse, incidenti sicurezza.

Domande tipiche: Cosa vedo passando il mouse su una strada?

Passando il mouse su una strada compare il nome (con il posto in classifica, per esempio «#5 · Via X», se è tra le 20 più pericolose) e il numero di incidenti con il tasso per km, oppure «Nessun incidente registrato». Su un hotspot: «Zona a incidenti concentrati» con gli incidenti. Su un incidente: luogo, anno, gravità e feriti. I fumetti si accendono e si spengono dal menu «Overlay informativi».

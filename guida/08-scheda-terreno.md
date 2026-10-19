# Scheda «Terreno (DTM 5 m)»

## Cosa mostra la scheda Terreno

Parole chiave: scheda terreno, DTM, quota, metri sul livello del mare, griglia 50 m, analisi morfologica, pendenza, morfologia.

Domande tipiche: Cosa c'è nella scheda Terreno? Da dove vengono questi valori? A che quota sono?

La scheda «Terreno (DTM 5 m)» compare nella scheda del luogo quando si clicca sulla mappa. Il titolo ha come badge la quota in metri sul livello del mare (per esempio «45 m s.l.m.»). È una sezione comprimibile, aperta all'inizio.

I valori non sono calcolati sul punto esatto cliccato: sono quelli del **punto della griglia DTM più vicino**, con passo di 50 metri (nota in fondo alla scheda). Derivano dal modello digitale del terreno a 5 metri (HR-DTM-5m, IRPI-CNR, Panza et al. 2026, elaborazione PalermoHub). In fondo c'è il link «Analisi morfologica interattiva» alla pagina di PalermoHub dedicata.

I valori sono divisi in gruppi: Pendenza, Morfologia, Rischio versanti, Indici morfometrici, Idrologia, Energia e clima, Accessibilità ed erosione. Se per il punto un valore manca, la scheda mostra «—», e i gruppi Energia e clima e Accessibilità ed erosione compaiono solo se ci sono dati.

---

## Terreno: pendenza e morfologia

Parole chiave: pendenza, gradi, percentuale, esposizione, versante, forma del terreno, geomorfologia, nord sud.

Domande tipiche: Quanto è ripido il terreno? Verso dove è esposto il versante? Che forma ha il terreno?

- **Pendenza**: in gradi (per esempio 8,5°) e in percentuale (per esempio 14,9 %).
- **Morfologia**: «Esposizione» (verso quale direzione guarda il versante) e «Forma terreno» (classe morfologica del punto, in testo).


---

## Terreno: rischio versanti, stabilità e costruibilità

Parole chiave: stabilità, costruibilità, rischio versanti, classi 1-5, frana, edificabilità, terreno instabile.

Domande tipiche: Il terreno è stabile? Si può costruire qui? Cosa vogliono dire le classi da 1 a 5?

Il gruppo «Rischio versanti» ha due righe:
- **Stabilità**: giudizio sul versante (testo).
- **Costruibilità**: giudizio sulla costruibilità del terreno (testo).

Ogni riga ha una classe da 1 (migliore) a 5 (peggiore), mostrata con un colore. Se la classe non è disponibile non viene colorata. Per i vincoli ufficiali ci sono lo strato PAI e il piano regolatore (vedi avvertenze: i dati sono informativi).

---

## Terreno: indici morfometrici

Parole chiave: TRI, TPI, SRI, HS, hillshade, rugosità, posizione topografica, indici.

Domande tipiche: Cosa sono TRI e TPI? Cosa significa HS?

Il gruppo «Indici morfometrici» mostra quattro valori in griglia:
- **TRI**: indice di rugosità del terreno (quanto è irregolare).
- **TPI**: indice di posizione topografica (posizione del punto rispetto all'intorno).
- **SRI**: altro indice morfometrico calcolato dal modello del terreno.
- **HS**: valore dell'ombreggiatura (hillshade).


---

## Terreno: idrologia

Parole chiave: TWI, SPI, flow accumulation, DTW, falda, umidità, ruscellamento, deflusso.

Domande tipiche: Cos'è il TWI? L'acqua tende ad accumularsi qui?

Il gruppo «Idrologia» riporta:
- **TWI, umidità topografica**: indice di umidità legato alla forma del terreno.
- **SPI, Stream Power**: capacità erosiva del deflusso superficiale.
- **Flow Acc. (log)**: accumulo del deflusso a monte del punto (in scala logaritmica), se disponibile.
- **DTW, profondità falda**: in metri, se disponibile.


---

## Terreno: energia e clima

Parole chiave: SVF, cielo visibile, fotovoltaico, potenziale FV, ombra estiva, ombra invernale, gelata, irraggiamento.

Domande tipiche: Il punto è adatto al fotovoltaico? Quanta ombra c'è d'estate e d'inverno?

Il gruppo «Energia e clima» (se ci sono dati) ha:
- **SVF, cielo visibile**: percentuale di cielo visibile dal punto.
- **Potenziale FV**: potenziale fotovoltaico in percentuale.
- **Ombra estiva** e **Ombra invernale**: percentuale di ombra proiettata dal rilievo.
- **Rischio gelata**: indice numerico calcolato dal modello.


---

## Terreno: accessibilità ed erosione

Parole chiave: Tobler, velocità a piedi, visibilità, viewshed, RUSLE, erosione del suolo, camminare.

Domande tipiche: Quanto è veloce camminare qui? Il punto è molto visibile? C'è rischio di erosione?

Il gruppo «Accessibilità ed erosione» (se ci sono dati) ha:
- **Velocità Tobler**: velocità di camminata stimata in km/h sulla pendenza del punto (calcolata con la funzione di Tobler).
- **Visibilità cumulativa**: quanti punti di osservazione di riferimento, su 6, vedono il punto.
- **Erosione RUSLE LS**: fattore topografico del modello di erosione del suolo RUSLE.


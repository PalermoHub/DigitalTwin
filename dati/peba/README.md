# PEBA – Piano di Eliminazione delle Barriere Architettoniche (Palermo)

209 schede del rilievo del Comune di Palermo (Delibera di Giunta Comunale n. 272 del 18/07/2026): sedi amministrative, scuole, asili,
aree verdi, vie, percorsi storici e UNESCO, piazze, musei. Ogni scheda ha livello di accessibilità, punteggio di inaccessibilità,
rilevanza, classe di priorità, costo stimato, criticità riscontrate, foto del sopralluogo e scheda PDF.

- Fonte: repo [palermohub/peba](https://github.com/palermohub/peba) e sito <https://palermohub.github.io/peba/>; elaborazione OpenDataSicilia e PalermoHub. Info sul piano: <https://palermohub.opendatasicilia.it/peba.html>.
- Licenza: CC BY 4.0 (vedi `LICENSE` del repo PEBA).
- `peba.geojson`: una feature per `Codice`. Edifici (`forma: edificio`) e aree verdi (`forma: area_verde`) sono poligoni; vie, percorsi, piazze e il resto (`forma: punto`) sono punti.
  Campi: `codice, nome, indirizzo, gruppo, categoria, contesto, elemento, circoscrizione, quartiere, upl, punteggio, livello, rilevanza,
  non_valutabile, criticita, n_foto, costo, classe, media_circ, pdf, pdf_byte, forma`.
- `foto/<Codice>/NN_thumb.jpg`: solo le miniature. Foto grandi (`img/foto/<Codice>/NN.jpg`) e PDF (`dati/pdf/`) restano su palermohub.github.io/peba.
- Rigenerazione: `python3 scripts/peba.py --sorgente <cartella del repo peba>`.
- Nota: schede, testi e foto sono stati estratti in automatico dai PDF originali; le coordinate derivano dalla geocodifica degli indirizzi.
  Possono esserci errori, campi mancanti o posizionamenti imprecisi.

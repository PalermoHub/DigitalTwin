# Immobili dichiarati al MEF (Comune di Palermo)

Anno del censimento: **2023**. Generato il 2026-10-10 da `scripts/mef_immobili.py` (workflow «Aggiorna MEF»).

- Beni: 8006 · in edifici: 6964 (in 1259 edifici) · in terreni: 498 (484 particelle) · punti: 544 {'senza-edificio': 372, 'strada': 138, 'terreno': 7, 'comune': 27}
- Localizzazione: {'catasto': 4924, 'immobili-comunali': 528, 'posizione': 2427, 'scuole': 82, 'uffici': 17, 'monumenti': 9, 'seggi': 19} · verifica: {'concorde': 5074, 'non verificabile': 2427, 'corretto': 505} (beni corretti rispetto alla posizione MEF: 505)
- Beni scartati perché senza posizione utilizzabile: 0

Fonti: Ministero dell'economia e delle finanze, Dipartimento del Tesoro, Censimento degli immobili pubblici (open data, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)); poligoni degli edifici: Comune di Palermo, unità volumetriche CTC; particelle: SITR Regione Siciliana e Agenzia delle Entrate; immobili comunali: Comune di Palermo.

La posizione di ogni bene è verificata con il catasto (foglio e particella), poi con i layer già mappati (immobili comunali, scuole, seggi, uffici, monumenti), poi con la posizione dichiarata. Gli edifici portano l'elenco dei beni (`beni`, JSON).

Come si ottiene il layer, passo per passo: `come-si-ottiene.mmd` (diagramma Mermaid con i numeri di questa esecuzione).

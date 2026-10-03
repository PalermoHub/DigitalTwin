# Vincoli PAI nel Comune di Palermo

Fonte: Regione Siciliana, Autorità di Bacino — [Piano di Assetto Idrogeologico (PAI), SITR](https://map.sitr.regione.sicilia.it/gis/rest/services/pai), un servizio MapServer per tema.
Generato da `scripts/pai.py` (o dal workflow manuale **Aggiorna PAI**).

| File | Contenuto |
|---|---|
| `<tema>.geojson` | Elementi di Palermo di un tema, WGS84, campi con nome breve (`cls_<tema>`, `col_<tema>`, `bor_<tema>` = classe e colori del server) |
| `pai.json` | Manifest: per tema i campi (con etichetta italiana), le classi con la simbologia del server e il numero di elementi |
| `pai.pmtiles` | Tutti i temi, uno strato per dataset, zoom 12–18 |
| `confine_comunale.geojson` | Confine del Comune, per riconoscere gli elementi di Palermo |

## Temi

| Gruppo | Tema (strato in mappa) | Servizio del server |
|---|---|---|
| Idraulica | Pericolosità idraulica, Rischio idraulico, Siti di attenzione idraulica | `PAI_Idraulica_Pericolosita`, `_Rischio`, `_SitiAttenzione` |
| Idraulica | Esondazioni (manovra di scarico, collasso) | `PAI_Idraulica_Esondazioni` — oggi nessun elemento a Palermo |
| Geomorfologia | Pericolosità, Rischio, Siti di attenzione | `PAI_Geomorfologia_Pericolosita`, `_Rischio`, `_SitiAttenzione` |
| Geomorfologia | Dissesti per attività / per tipologia (stessi dati, due simbologie) | `PAI_Geomorfologia_Dissesti` (layer 1 e 0) |
| Geomorfologia | Fascia di rispetto P3 e P4 | `PAI_Geomorfologia_FasciaRispettoP3P4` — oggi nessun elemento a Palermo |
| Erosione costiera | Pericolosità, Rischio | `PAI_Erosione_Costa_Pericolosita`, `_Rischio` |

I temi senza elementi a Palermo restano nel manifest (con `n: 0`) ma non hanno strato in mappa: se il server li popola, basta rilanciare l'aggiornamento.
`PAI_Erosione_Costa_Pericolosita_Rischio` rimette insieme i due precedenti e non si scarica.

## Come si sceglie «Palermo»
Si interroga il server col rettangolo del comune (WGS84, a pagine da 1000) e si tiene l'elemento se il campo comune (`COMUNE`, `Altri_comu`…) dice Palermo oppure, quando il campo manca o è vuoto, se la geometria entra nel confine comunale ristretto di ~60 m (il confine ha +50 m di tolleranza: gli elementi dei comuni vicini lo sfiorano soltanto). Le geometrie non vengono ritagliate.

## Simbologia
Colori, bordi e spessori sono quelli del renderer del server; i dissesti per tipologia usano i retini PNG del server (neri su trasparente). Due scelte nostre: i riempimenti sono al 65% di opacità (sul server sono pieni) per lasciare vedere base ed edifici, e valori senza simbolo sul server (es. pericolosità geomorfologica `0`, 13 elementi) non si disegnano ma compaiono in scheda come «Altro (0)». Il refuso «2.» del server è letto come «2».

## Aggiornare i dati
Actions → **Aggiorna PAI** → Run workflow: scarica, rigenera i file e fa il commit (o lascia solo l'artefatto se si toglie la spunta). Un servizio nuovo sul server compare come «attenzione» nel log: va aggiunto a `DATASETS` in `scripts/pai.py`. In locale: `python3 scripts/pai.py` (servono `shapely` e `tippecanoe`).

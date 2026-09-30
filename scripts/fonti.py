"""Fonte, data e licenza dei file usati dal viewer (chiave = percorso in dati/).

La licenza è indicata solo dove è documentata nei progetti di origine;
altrove resta assente e va verificata prima di ogni ripubblicazione.
"""

FONTI = {
    "catasto/particelle.pmtiles": {
        "fonte": "S.I.T.R. Regione Siciliana e Agenzia delle Entrate — particelle catastali",
        "data": "2026-09",
    },
    "prg-vincoli/prg.pmtiles": {
        "fonte": "Comune di Palermo — Variante generale al PRG 2004: zonizzazione e vincoli",
        "data": "2004",
    },
    "civici-omi/civici_0226.pmtiles": {
        "fonte": "Comune di Palermo — numeri civici",
        "data": "2026-02",
    },
    "civici-omi/civici_index.json": {
        "fonte": "Comune di Palermo — numeri civici (indice per la ricerca)",
        "data": "2026-02",
    },
    "civici-omi/Zone_OMI_2025_II.pmtiles": {
        "fonte": "Agenzia delle Entrate — Osservatorio del Mercato Immobiliare, zone OMI",
        "data": "2025-S2",
    },
    "civici-omi/immobili_comunali_2024.pmtiles": {
        "fonte": "Comune di Palermo — immobili comunali",
        "data": "2024",
    },
    "edifici/edificato_pop.pmtiles": {
        "fonte": "Comune di Palermo — unità volumetriche CTC; popolazione per edificio: stima",
        "data": "2026",
    },
    "popolazione/geo_sezioni_2021.pmtiles": {
        "fonte": "ISTAT — sezioni di censimento 2021",
        "data": "2021",
    },
    "popolazione/sezioni_indicatori.json": {
        "fonte": "ISTAT — Censimento permanente della popolazione e delle abitazioni 2021",
        "data": "2021",
    },
    "popolazione/sezioni_indicatori_2023.json": {
        "fonte": "ISTAT — Censimento permanente 2023 (stime campionarie), via Cruscotto Statistico Comunale",
        "data": "2023",
        "licenza": "CC BY 4.0",
    },
    "popolazione/confini_amministrativi.pmtiles": {
        "fonte": "ISTAT / Comune di Palermo — circoscrizioni, quartieri, UPL",
        "data": "2021",
    },
}


# Tileset pubblicati (cartelle z/x/y): non si copiano, si leggono dal link.
# `esempio` è un tile che deve esistere: serve al controllo di raggiungibilità.
_PRG = "https://palermohub.github.io/PRG2004/"
_POP = "https://gbvitrano.github.io/palermo_popolazione/data/"
_ATTRIB_PRG = "Comune di Palermo — Variante generale al PRG 2004, rielaborazione di OpenDataSicilia (vestizione raster)"
_ATTRIB_DTM = "HR-DTM-5m, IRPI-CNR (Panza et al., 2026), elaborazione PalermoHub"

TILESET = {
    "prg-zto": {"url": _PRG + "ZTO/{z}/{x}/{y}.png", "esempio": _PRG + "ZTO/14/8794/6306.png",
                "fonte": _ATTRIB_PRG + ": zonizzazione", "data": "2004"},
    "prg-ppe": {"url": _PRG + "ppe/{z}/{x}/{y}.png", "esempio": _PRG + "ppe/14/8800/6312.png",
                "fonte": _ATTRIB_PRG + ": PPE", "data": "2004"},
    "prg-va": {"url": _PRG + "VA/{z}/{x}/{y}.png", "esempio": _PRG + "VA/14/8794/6306.png",
               "fonte": _ATTRIB_PRG + ": vincoli areali", "data": "2004"},
    "prg-vl": {"url": _PRG + "VL/{z}/{x}/{y}.png", "esempio": _PRG + "VL/14/8794/6306.png",
               "fonte": _ATTRIB_PRG + ": vincoli lineari", "data": "2004"},
    "terrain-dem": {"url": _POP + "terrain/{z}/{x}/{y}.png", "esempio": _POP + "terrain/tilejson.json",
                    "fonte": _ATTRIB_DTM + ": rilievo 3D (codifica Terrarium)", "data": "2026",
                    "licenza": "CC BY 4.0"},
    "elevazione": {"url": _POP + "elevazione/{z}/{x}/{y}.png", "esempio": _POP + "elevazione/14/8802/10069.png",
                   "fonte": _ATTRIB_DTM + ": raster di elevazione", "data": "2026", "licenza": "CC BY 4.0"},
    "griglia": {"url": _POP + "griglia_pbf/{z}/{x}/{y}.pbf", "esempio": _POP + "griglia_pbf/metadata.json",
                "fonte": _ATTRIB_DTM + ": griglia di punti a passo 50 m con indici morfologici", "data": "2026",
                "licenza": "CC BY 4.0"},
}

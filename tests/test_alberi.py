import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import alberi  # noqa: E402


def test_gradi_dms():
    assert alberi.gradi("38° 7' 58,02''") == 38.132783
    assert alberi.gradi("13° 07' 27''") == 13.124167
    assert alberi.gradi("boh") is None


def test_numero_insieme_prende_il_massimo():
    assert alberi.numero("291") == 291
    assert alberi.numero("20,0 (max)") == 20
    assert alberi.numero("150 (med)\n160 (max)") == 160
    assert alberi.numero("14,5") == 14.5


def test_criteri():
    assert alberi.criteri("a) eta` e/o dimensioni\nd) rarita` botanica") == ["età e/o dimensioni", "rarità botanica"]


def test_solo_palermo_e_coordinate_valide():
    riga = {"COMUNE": "Palermo", "ID SCHEDA": "01/G273/PA/19", "LATITUDINE SU GIS": "38° 7' 58,02''", "LONGITUDINE SU GIS": "13° 20' 44,44''",
            "SPECIE NOME VOLGARE": "Fico", "SPECIE NOME SCIENTIFICO": "Insieme omogeneo di Ficus L.", "LOCALITÀ": "Via X",
            "ALTITUDINE (m s.l.m.)": 25, "CIRCONFERENZA FUSTO (cm)": "291", "ALTEZZA (m)": "14,5",
            "CRITERI DI MONUMENTALITÀ": "g) valore storico, culturale, religioso", "PROPOSTA DICHIARAZIONE NOTEVOLE INTERESSE PUBBLICO": "si`"}
    altro = {**riga, "COMUNE": "Noto"}
    fuori = {**riga, "LATITUDINE SU GIS": "37° 0' 0''"}
    feats = alberi.costruisci(pd.DataFrame([riga, altro, fuori]))
    assert len(feats) == 1
    p = feats[0]["properties"]
    assert p["id"] == "albero-01" and p["insieme"] and p["specie"] == "Ficus L." and p["dichiarato"]

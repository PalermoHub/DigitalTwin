import pytest

import colonnine as c

PUNTO = {"id_evse": "IT*DUF*EP0001*2", "stato": "Attivo", "stato_raw": "AVAILABLE", "real_time": True, "cpo": "DUFERCO MOBILITY SRL",
         "indirizzo": "Via Libertà 10", "citta": "Palermo", "cap": "90143", "lat": 38.13, "lon": 13.35, "potenza_w": 22000,
         "corrente": "AC", "standard_connettore": "IEC_62196_T2", "n_connettori": 2, "open_24h7": True}


def snap(*punti):
    return {"generated_at": "2026-10-04T06:38:16+00:00", "points": list(punti)}


def test_tiene_solo_palermo_anche_con_spazi_e_maiuscole():
    altro = {**PUNTO, "id_evse": "X", "citta": "Bagheria"}
    spazi = {**PUNTO, "id_evse": "Y", "citta": " PALERMO "}
    fc = c.estrai(snap(PUNTO, altro, spazi))
    assert [f["properties"]["id"] for f in fc["features"]] == ["IT*DUF*EP0001*2", "Y"]


def test_proprieta_normalizzate():
    f = c.estrai(snap(PUNTO))["features"][0]
    assert f["geometry"] == {"type": "Point", "coordinates": [13.35, 38.13]}
    assert f["properties"] == {
        "id": "IT*DUF*EP0001*2", "stato": "Disponibile", "operatore": "DUFERCO MOBILITY SRL", "indirizzo": "Via Libertà 10", "cap": "90143",
        "potenza_kw": 22, "corrente": "AC", "connettore": "Tipo 2", "n_connettori": 2, "h24": True, "tempo_reale": True,
    }


@pytest.mark.parametrize("raw,attivo,atteso", [
    ("AVAILABLE", "Attivo", "Disponibile"), ("CHARGING", "Attivo", "In ricarica"),
    ("OUTOFORDER", "Non Attivo", "Non attiva"), ("INOPERATIVE", "Non Attivo", "Non attiva"), ("", "Non Attivo", "Non attiva"),
    ("RESERVED", "Attivo", "Disponibile"),
])
def test_stato_in_tre_classi(raw, attivo, atteso):
    assert c.stato({"stato_raw": raw, "stato": attivo}) == atteso


def test_connettore_sconosciuto_resta_com_e():
    p = {**PUNTO, "standard_connettore": "STRANO"}
    assert c.estrai(snap(p))["features"][0]["properties"]["connettore"] == "STRANO"


def test_aggiornato_e_fonte_nel_geojson():
    fc = c.estrai(snap(PUNTO))
    assert fc["aggiornato"] == "2026-10-04T06:38:16+00:00"
    assert "GSE" in fc["fonte"]


def test_senza_coordinate_scartato():
    assert c.estrai(snap({**PUNTO, "lat": None}))["features"] == []


def test_verifica_rifiuta_pochi_punti_e_punti_fuori_comune():
    fc = c.estrai(snap(PUNTO))
    with pytest.raises(ValueError, match="pochi"):
        c.verifica(fc, minimo=100)
    lontano = c.estrai(snap({**PUNTO, "lat": 37.5, "lon": 15.0}))
    with pytest.raises(ValueError, match="fuori"):
        c.verifica(lontano, minimo=1)
    c.verifica(fc, minimo=1)

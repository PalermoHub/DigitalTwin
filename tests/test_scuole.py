import json

import pytest
from shapely.geometry import box

import scuole as s

PLESSO = {"ID": "202", "TIPO": "Plesso", "DENOMINAZIONE": "Smith", "CATEGORIA": "", "VIA_TIPO": "VIA",
          "VIA_DENOMINAZIONE": "SMITH ADAMO", "CIVICO": "17", "BARRATO": "", "SEDE_TIPO": "Sede",
          "SEDE_DENOMINAZIONE": "Sciacca", "SEDE_CATEGORIA": "IC", "SEDE_VIA_TIPO": "VIA",
          "SEDE_VIA_DENOMINAZIONE": "DE GOBBIS FRANCESCO", "SEDE_CIVICO": "13", "SEDE_BARRATO": "",
          "QUARTIERE": "PALLAVICINO"}


def test_indirizzo_con_barrato():
    assert s.indirizzo("VIA", "DELL'ALLODOLA", "36", "A") == "Via Dell'Allodola 36/A"
    assert s.indirizzo("VIA", "SMITH ADAMO", "17", "") == "Via Smith Adamo 17"


def test_scuola_plesso_con_sede():
    d = s.scuola(PLESSO, 13.3, 38.1, 7)
    assert d["id"] == "scuola-7" and d["tipo"] == "Plesso scolastico"
    assert d["categoria"] == "Istituto comprensivo"  # presa dalla sede quando il plesso non ha la sua
    assert d["sede"] == "Sciacca" and d["sede_indirizzo"] == "Via De Gobbis Francesco 13"
    assert d["quartiere"] == "Pallavicino"


def test_scuola_asilo_senza_sede():
    d = s.scuola({"ID": "5", "TIPO": "Asilo Nido", "DENOMINAZIONE": "Allodola", "VIA_TIPO": "VIA",
                  "VIA_DENOMINAZIONE": "DELL'ALLODOLA", "CIVICO": "36", "QUARTIERE": "VILLAGRAZIA-FALSOMIELE",
                  "CATEGORIA": None}, 13.35, 38.08, 2)
    assert d["tipo"] == "Asilo nido" and "sede" not in d and d["categoria"] == ""


def test_seggio_sezioni_ripulite():
    d = s.seggio({"name": "Circolo X", "indirizzo": "Corso Calatafimi, 241", "circoscrizione": "4",
                  "sezioni": "247*, 248, 2 73"}, 13.3, 38.1, 1)
    assert d["sezioni"] == "247*, 248, 273" and d["n_sezioni"] == 3
    assert d["id"] == "seggio-1" and d["circoscrizione"] == "4"


def test_chiave_indirizzo_ignora_ordine_e_punteggiatura():
    assert s.chiave_indirizzo("Via Schifani Vito, 3") == s.chiave_indirizzo("Via Vito Schifani 3")
    assert s.chiave_indirizzo("Via Giotto, 41") != s.chiave_indirizzo("Via Giotto, 4")


def test_unisci_seggi_nella_scuola_giusta():
    plesso = s.scuola(PLESSO, 0, 0, 1)
    sede = {**plesso, "id": "scuola-2", "nome": "Sciacca", "tipo": "Sede dell'istituto"}
    altro = s.seggio({"name": "Chiesa", "indirizzo": "Via Roma, 1", "circoscrizione": "1", "sezioni": "1"}, 0, 0, 2)
    seggio = s.seggio({"name": "Istituto SCIACCA", "indirizzo": "Via Smith Adamo, 17", "circoscrizione": "2",
                       "sezioni": "10, 11"}, 0, 0, 1)
    scuole, rimasti = s.unisci_seggi([plesso, sede], [seggio, altro])
    assert [x["id"] for x in rimasti] == ["seggio-2"]
    assert sede["seggio_sezioni"] == "10, 11" and sede["seggio_n_sezioni"] == 2
    assert "seggio_nome" not in plesso


def test_feature_poligono_minimo():
    luogo = s.scuola(PLESSO, 0.5, 0.5, 1)
    f = s.costruisci_feature(luogo, box(0, 0, 1, 1), "contenuto")
    assert set(f["properties"]) == {"id", "nome", "tipo", "abbinamento"}
    assert f["geometry"]["type"] == "Polygon"
    assert s.costruisci_feature(luogo, None, "nessuno")["geometry"]["type"] == "Point"


@pytest.mark.parametrize("nome,n_min", [("scuole", 250), ("seggi", 40)])
def test_geojson_generati_coerenti(nome, n_min):
    punti_f, poli_f = s.OUT / f"{nome}.geojson", s.OUT / f"{nome}_edifici.geojson"
    if not punti_f.exists() or not poli_f.exists():
        pytest.skip("dati/scuole non generati")
    punti = json.loads(punti_f.read_text(encoding="utf-8"))["features"]
    poli = json.loads(poli_f.read_text(encoding="utf-8"))["features"]
    ids = {f["properties"]["id"] for f in punti}
    assert len(punti) >= n_min and len(ids) == len(punti)
    assert {f["properties"]["id"] for f in poli} <= ids
    assert len(poli) >= len(punti) * 0.6  # la gran parte dei punti cade su un edificio


def test_seggio_spazio_tra_cifre_cifre_spezzate_o_unite_secondo_il_numero():
    d = s.seggio({"name": "X", "indirizzo": "Via Y", "circoscrizione": "4", "sezioni": "2 73, 227, 570 593"}, 0, 0, 1)
    assert d["sezioni"] == "273, 227, 570, 593" and d["n_sezioni"] == 4

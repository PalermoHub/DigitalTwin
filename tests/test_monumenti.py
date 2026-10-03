import json

import pytest
from shapely.geometry import Point, box, mapping

import monumenti as m

ELENCO = """
<article class="badge">
  <div class="img-wrap"><img src="https://turismo.comune.palermo.it/js/server/uploads/luoghi/213x104/_1.jpg" alt="Torre di San Nicolo'"/></div>
  <h2>Torre di San Nicolo&#39; all&#39;Albergheria</h2>
  <div class="div100"><p>La Torre campanaria, slanciata &ograve; costruzione.</p>
</div>
  <div class="info"><a href="palermo-welcome-luogo-dettaglio.php?tp=68&amp;det=17&amp;id=123" class="a-btn">Maggiori info</a></div>
</article>
<article class="badge">
  <h2>Senza foto</h2>
  <div class="div100"><p></p></div>
  <div class="info"><a href="palermo-welcome-luogo-dettaglio.php?tp=68&amp;det=17&amp;id=7" class="a-btn">Maggiori info</a></div>
</article>
"""

DETTAGLIO = '<meta content="38.1116487;13.3598161" name="geo.position"><meta property="og:latitude" content="38.1116487">'


def test_parse_elenco_estrae_campi():
    luoghi = m.parse_elenco(ELENCO, 17)
    assert len(luoghi) == 2
    a = luoghi[0]
    assert a["id"] == "17-123"
    assert a["nome"] == "Torre di San Nicolo' all'Albergheria"
    assert a["descrizione"] == "La Torre campanaria, slanciata ò costruzione."
    assert a["foto_url"].endswith("/213x104/_1.jpg")
    assert a["url"] == "https://turismo.comune.palermo.it/palermo-welcome-luogo-dettaglio.php?tp=68&det=17&id=123"
    assert luoghi[1]["foto_url"] is None


def test_parse_coordinate():
    assert m.parse_coordinate(DETTAGLIO) == (13.3598161, 38.1116487)
    assert m.parse_coordinate("<html></html>") is None


def test_parse_coordinate_fuori_palermo_scartate():
    assert m.parse_coordinate('<meta content="0;0" name="geo.position">') is None


EDIFICI = [  # (geometria, altezza)
    (box(0, 0, 0.0002, 0.0002), 10.0),
    (box(0.0010, 0, 0.0012, 0.0002), 20.0),
]


def test_abbina_contenuto():
    g, tipo = m.abbina_edificio(Point(0.0001, 0.0001), EDIFICI)
    assert tipo == "contenuto" and g.equals(EDIFICI[0][0])


def test_abbina_vicino_entro_soglia():
    # ~11 m a est del primo edificio (0.0001 gradi di lon a lat 0 ≈ 11 m)
    g, tipo = m.abbina_edificio(Point(0.0003, 0.0001), EDIFICI, soglia_m=15)
    assert tipo == "vicino" and g.equals(EDIFICI[0][0])


def test_abbina_nessuno_oltre_soglia():
    assert m.abbina_edificio(Point(0.0006, 0.0001), EDIFICI, soglia_m=15) == (None, "nessuno")


def test_costruisci_feature_con_e_senza_poligono():
    luogo = {"id": "17-1", "nome": "A", "categoria": "Monumenti", "descrizione": "d", "foto": "foto/17-1.jpg",
             "url": "u", "lon": 0.0001, "lat": 0.0001}
    f = m.costruisci_feature(luogo, EDIFICI[0][0], "contenuto")
    assert f["geometry"]["type"] == "Polygon"
    assert f["properties"]["abbinamento"] == "contenuto"
    assert set(f["properties"]) == {"id", "nome", "categoria", "abbinamento"}  # i dettagli stanno sul punto
    f2 = m.costruisci_feature(luogo, None, "nessuno")
    assert f2["geometry"]["type"] == "Point"
    assert f2["properties"]["abbinamento"] == "nessuno" and f2["properties"]["lon"] == 0.0001
    json.dumps(f2)


def test_nel_comune_separa_i_luoghi_fuori_confine():
    confine = box(13.0, 38.0, 13.5, 38.2)
    dentro, fuori = m.nel_comune([{"nome": "A", "lon": 13.3, "lat": 38.1}, {"nome": "B", "lon": 13.29, "lat": 37.9}], confine)
    assert [l["nome"] for l in dentro] == ["A"] and [l["nome"] for l in fuori] == ["B"]


def test_geojson_dati_coerenti():
    """Se i dati sono stati generati: punti con i dettagli (clusterizzabili) e poligoni minimi in un file a parte."""
    pytest.importorskip("pyogrio")
    punti_f, edifici_f = m.OUT / "monumenti.geojson", m.OUT / "monumenti_edifici.geojson"
    if not punti_f.exists() or not edifici_f.exists():
        pytest.skip("dati/monumenti non generati")
    punti = json.loads(punti_f.read_text(encoding="utf-8"))["features"]
    edifici = json.loads(edifici_f.read_text(encoding="utf-8"))["features"]
    if m.CONFINE.exists():  # nessun monumento fuori dal comune (Monreale, Bagheria, Villabate...)
        confine = m.shape(json.loads(m.CONFINE.read_text(encoding="utf-8"))["features"][0]["geometry"])
        assert all(confine.contains(Point(*f["geometry"]["coordinates"])) for f in punti)
    assert len(punti) >= 4000 and {f["geometry"]["type"] for f in punti} == {"Point"}
    assert {f["geometry"]["type"] for f in edifici} <= {"Polygon", "MultiPolygon"}
    ids = {f["properties"]["id"] for f in punti}
    assert len(ids) == len(punti) and {f["properties"]["id"] for f in edifici} <= ids
    for f in punti:
        p = f["properties"]
        assert p["url"] is None or p["url"].startswith("https://turismo.comune.palermo.it/")
        assert p["fonte"] and p["categoria"]
        assert p["foto"] is None or p["foto"].startswith("https://") or (m.OUT / p["foto"]).exists()
    assert all(set(f["properties"]) == {"id", "nome", "categoria", "abbinamento"} for f in edifici)


# ---------- correzione delle coordinate ----------

def test_nome_rigido():
    assert not m.stesso_nome("Ex Real Fonderia Oretea", "ex chiesa di Sant'Alessandro dei Carcerati")
    assert m.stesso_nome("Cattedrale", "Cattedrale")
    assert m.stesso_nome("Chiesa di San Cataldo", "Chiesa di San Cataldo (Palermo)")
    assert m.stesso_nome("Palazzo Sclafani", "Palazzo Affronti") is False
    assert m.stesso_nome("Chiesa di Santa Maria (detta la Gancia)", "Chiesa di Santa Maria")


L = {"id": "1", "nome": "X", "lon": 13.3500, "lat": 38.1100}
VICINO = (13.3501, 38.1100)    # ~9 m
LONTANO = (13.3530, 38.1100)   # ~260 m


def test_tiene_portale_se_coerente():
    assert m.scegli_coordinate(L, osm=VICINO, civico=None, condivisa=False) is None
    assert m.scegli_coordinate(L, osm=None, civico=None, condivisa=False) is None


def test_condivisa_usa_osm_poi_civico():
    c = m.scegli_coordinate(L, osm=LONTANO, civico=None, condivisa=True)
    assert c["fonte"] == "osm" and (c["lon"], c["lat"]) == LONTANO
    c = m.scegli_coordinate(L, osm=LONTANO, civico=(13.3531, 38.1100), condivisa=True)
    assert c["fonte"] == "civico"


def test_lontano_da_entrambe_si_corregge_con_civico():
    c = m.scegli_coordinate(L, osm=LONTANO, civico=(13.3531, 38.1100), condivisa=False)
    assert c["fonte"] == "civico"


def test_lontano_solo_da_osm_non_basta():
    # OSM discorda ma il civico conferma il portale: si tiene il portale
    assert m.scegli_coordinate(L, osm=LONTANO, civico=VICINO, condivisa=False) is None


def test_senza_coordinate_si_usa_quel_che_c_e():
    s = {**L, "lon": None, "lat": None}
    assert m.scegli_coordinate(s, osm=None, civico=VICINO, condivisa=False)["fonte"] == "civico"
    assert m.scegli_coordinate(s, osm=LONTANO, civico=None, condivisa=False)["fonte"] == "osm"
    assert m.scegli_coordinate(s, osm=None, civico=None, condivisa=False) is None


# ---------- porte e archi: piu' edifici (i piloni) ----------

PILONI = [(box(0, 0, 0.00004, 0.00004), 20.0), (box(0.00010, 0, 0.00014, 0.00004), 20.0),
          (box(0.0008, 0, 0.0010, 0.0002), 10.0)]  # terzo: lontano


def test_porta_prende_tutti_gli_edifici_vicini():
    geoms, tipo = m.abbina_edifici(Point(0.00007, 0.00002), PILONI, "Porta Felice")
    assert tipo == "vicino" and len(geoms) == 2


def test_nome_non_porta_prende_solo_il_piu_vicino():
    geoms, tipo = m.abbina_edifici(Point(0.00007, 0.00002), PILONI, "Fontana Pretoria")
    assert tipo == "vicino" and len(geoms) == 1


def test_porta_senza_vicini_stretti_ricade_sul_piu_vicino():
    geoms, tipo = m.abbina_edifici(Point(0.00056, 0.00002), PILONI, "Porta Nuova", soglia_m=40)
    assert len(geoms) == 1 or geoms == []


def test_nessuno_e_contenuto():
    assert m.abbina_edifici(Point(0.005, 0.005), PILONI, "Porta X") == ([], "nessuno")
    geoms, tipo = m.abbina_edifici(Point(0.00002, 0.00002), PILONI, "Porta X")
    assert tipo == "contenuto" and len(geoms) >= 1

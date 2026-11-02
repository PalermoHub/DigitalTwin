"""Prove di scripts/luoghi_osm.py: filtri sui luoghi (veterinari, accessi privati, fuori comune), tipo OSM, soglie."""
import importlib.util
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("luoghi_osm", RADICE / "scripts" / "luoghi_osm.py")
L = importlib.util.module_from_spec(spec)
spec.loader.exec_module(L)

ANELLO = [[(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)]]


def nodo(i, x, y, **tag):
    return {"type": "node", "id": i, "lon": x, "lat": y, "tags": tag}


def test_dentro_e_fuori_dal_confine():
    out = L.luoghi({"elements": [nodo(1, 5, 5, shop="bakery", name="Forno"), nodo(2, 50, 5, shop="bakery")]}, ANELLO)
    assert [p[2] for p in out] == ["Forno"]


def test_veterinari_e_accessi_privati_esclusi():
    el = [nodo(1, 1, 1, amenity="veterinary"), nodo(2, 2, 2, healthcare="veterinary"), nodo(3, 3, 3, leisure="garden", access="private"),
          nodo(4, 4, 4, amenity="pharmacy", name="Farmacia")]
    assert [p[2] for p in L.luoghi({"elements": el}, ANELLO)] == ["Farmacia"]


def test_poligoni_usano_il_centro_e_un_luogo_conta_una_volta():
    poligono = {"type": "way", "id": 9, "center": {"lon": 5, "lat": 5}, "tags": {"leisure": "park"}}
    out = L.luoghi({"elements": [poligono, poligono]}, ANELLO)
    assert len(out) == 1 and out[0][:2] == [5, 5] and out[0][3] == "park"


def test_tipo_osm_e_il_valore_del_tag_come_il_kd_di_walkably():
    assert L.tipo_osm({"shop": "supermarket"}) == "supermarket"
    assert L.tipo_osm({"amenity": "pharmacy"}) == "pharmacy"
    assert L.tipo_osm({"healthcare": "physiotherapist"}) == "physiotherapist"
    assert L.tipo_osm({"shop": "yes", "amenity": "bar"}) == "bar"


def test_i_bisogni_ricalcano_il_readme_di_walkably():
    assert sorted(L.BISOGNI) == [0, 1, 2, 3, 5]
    assert "nature_reserve" not in L.query(5)  # le riserve naturali non contano come parchi
    assert "playground" in L.query(5)
    assert "post_office" in L.query(2) and "bank" in L.query(2)
    assert "pharmacy" in L.query(3)
    assert "supermarket" in L.query(0) and "marketplace" in L.query(0)


def test_dentro_poligono():
    assert L.dentro(5, 5, ANELLO[0]) and not L.dentro(15, 5, ANELLO[0])

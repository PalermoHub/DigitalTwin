import json

import pytest

import sicurezza_stradale as s


def _arco(i, tasso, n, affidabile=True, **extra):
    props = {"arco_id": i, "nome": f"Via {i}", "highway": "tertiary", "lunghezza_m": 100.0, "n_incidenti": n,
             "tasso_km": tasso, "tasso_affidabile": affidabile, "u_node": 1, "v_node": 2, "osm_id": "9",
             "betweenness_edge": 0.1, "pendenza_media_pct": 2.0, "accessibilita": "agevole", "Quartiere": "Libertà",
             "Circoscrizione": "VIII", "UPL": "Vittorio Veneto", "rischio_geomorf_label": None,
             "rischio_idraul_label": None, "priorita_geomorf": "nessun rischio PAI",
             "priorita_idraul": "nessun rischio idraulico", **extra}
    return {"type": "Feature", "properties": props, "geometry": {"type": "LineString", "coordinates": [[13.3, 38.1], [13.31, 38.1]]}}


def _fc(*feature):
    return {"type": "FeatureCollection", "features": list(feature)}


def test_archi_scarta_campi_tecnici_e_classifica_a_quartili():
    fc = _fc(*[_arco(i, t, 2) for i, t in enumerate([10, 20, 30, 40, 50, 60, 70, 80])])
    out = s.ridotti_archi(fc)
    p = out["features"][0]["properties"]
    assert "u_node" not in p and "osm_id" not in p and "betweenness_edge" not in p
    assert [f["properties"]["classe"] for f in out["features"]] == [0, 0, 1, 1, 2, 2, 3, 3]


def test_archi_non_affidabili_o_senza_incidenti_non_hanno_classe():
    fc = _fc(_arco(0, 500.0, 1, affidabile=False), _arco(1, 0.0, 0), _arco(2, 5.0, 1), _arco(3, 9.0, 1))
    classi = [f["properties"].get("classe") for f in s.ridotti_archi(fc)["features"]]
    assert classi[0] is None and classi[1] is None
    assert classi[2] is not None and classi[3] is not None


def _cella(i, etichetta):
    return {"type": "Feature", "properties": {"cell_id": i, "n_incidenti": 4, "gravita_tot": 3.0, "hotspot_count": etichetta,
                                              "hotspot_gravita": etichetta, "gi_z_count": 2.0},
            "geometry": {"type": "Polygon", "coordinates": [[[13.3, 38.1], [13.31, 38.1], [13.31, 38.11], [13.3, 38.1]]]}}


def test_hotspot_tiene_solo_le_celle_significative_con_livello():
    fc = _fc(_cella(0, "hotspot 99%"), _cella(1, "coldspot 99%"), _cella(2, "non significativo"), _cella(3, "hotspot 90%"))
    out = s.ridotti_hotspot(fc)["features"]
    assert [f["properties"]["cell_id"] for f in out] == [0, 3]
    assert [f["properties"]["livello_gravita"] for f in out] == [99, 90]
    assert "gi_z_count" not in out[0]["properties"]


def _inc(data, aff=True, tip="F"):
    return {"type": "Feature", "properties": {"Data": data, "Luogo": "VIA X", "Tipologia": tip, "feriti_n": 1, "gravita": 1.0,
                                              "dist_snap_m": 2.0, "snap_affidabile": aff, "arco_id": 7},
            "geometry": {"type": "Point", "coordinates": [13.3, 38.1]}}


def test_incidenti_anno_derivato_e_snap_non_affidabili_esclusi():
    out = s.ridotti_incidenti(_fc(_inc("01/01/2015"), _inc("31/12/2023", tip="M"), _inc("05/05/2020", aff=False)))["features"]
    assert [f["properties"]["anno"] for f in out] == [2015, 2023]
    assert set(out[0]["properties"]) == {"anno", "Tipologia", "feriti_n", "Luogo", "arco_id"}


def test_incidenti_data_malformata_non_rompe_e_scarta_il_punto():
    assert s.ridotti_incidenti(_fc(_inc("boh"), _inc("01/02/2016")))["features"][0]["properties"]["anno"] == 2016


def test_scrivi_produce_tre_pmtiles(tmp_path):
    src = tmp_path / "src"
    src.mkdir()
    (src / "rete_rischio.geojson").write_text(json.dumps(_fc(_arco(0, 10, 1), _arco(1, 20, 2))))
    (src / "hotspot_griglia.geojson").write_text(json.dumps(_fc(_cella(0, "hotspot 95%"))))
    (src / "incidenti_snap.geojson").write_text(json.dumps(_fc(_inc("01/01/2015"))))
    out = tmp_path / "out"
    n = s.scrivi(src, out)
    assert n == {"archi": 2, "hotspot": 1, "incidenti": 1}
    for nome in ("archi", "hotspot", "incidenti"):
        assert (out / f"{nome}.pmtiles").stat().st_size > 0

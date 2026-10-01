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


def _arco_via(i, nome, lunghezza_m=1000.0):
    f = _arco(i, 10, 1)
    f["properties"]["nome"] = nome
    f["properties"]["lunghezza_m"] = lunghezza_m
    if nome is None:
        del f["properties"]["nome"]
    return f


def _inc_su(arco_id, tip="F", aff=True):
    f = _inc("01/01/2016", aff=aff, tip=tip)
    f["properties"]["arco_id"] = arco_id
    return f


def test_classifica_vie_per_gravita_al_km_con_soglie_e_senza_nome():
    archi = _fc(_arco_via(0, "Via A", 2000), _arco_via(1, "Via A", 2000),   # 4 km
                _arco_via(2, "Via B", 4000),                                # 4 km
                _arco_via(3, "Via C", 500),                                 # troppo corta
                _arco_via(4, None, 5000))                                   # senza nome
    inc = _fc(*[_inc_su(0, "M")] * 2, *[_inc_su(1)] * 10,                  # A: 12 inc, gravità 20
              *[_inc_su(2)] * 12,                                           # B: 12 inc, gravità 12
              *[_inc_su(3, "M")] * 12, *[_inc_su(4, "M")] * 12)
    c = s.classifica_vie(archi, inc, top=20, min_km=3, min_incidenti=10)
    assert list(c) == ["Via A", "Via B"]                       # C <3 km e senza nome esclusi; A prima di B
    assert c["Via A"] == {"rango": 1, "gravita_km": 5.0, "mortali": 2, "incidenti": 12, "km": 4.0}
    assert c["Via B"]["rango"] == 2 and c["Via B"]["gravita_km"] == 3.0


def test_classifica_vie_ignora_incidenti_non_affidabili_e_rispetta_top():
    archi = _fc(*[_arco_via(i, f"Via {i}", 4000) for i in range(3)])
    inc = _fc(*[_inc_su(0)] * 12, *[_inc_su(1)] * 11, *[_inc_su(2)] * 30)
    inc["features"] += [_inc_su(2, aff=False)] * 50
    c = s.classifica_vie(archi, inc, top=2, min_km=3, min_incidenti=10)
    assert list(c) == ["Via 2", "Via 0"]
    assert c["Via 2"]["incidenti"] == 30


def test_classifica_vie_vuota_se_nessuna_via_supera_le_soglie():
    assert s.classifica_vie(_fc(_arco_via(0, "Via A", 1000)), _fc(_inc_su(0)), min_km=3, min_incidenti=10) == {}


def test_archi_delle_vie_in_classifica_hanno_rango_e_dati_della_via():
    fc = _fc(_arco_via(0, "Via A", 4000), _arco_via(1, "Via Z", 4000))
    cl = {"Via A": {"rango": 1, "gravita_km": 5.0, "mortali": 2, "incidenti": 12, "km": 4.0}}
    a, z = [f["properties"] for f in s.ridotti_archi(fc, cl)["features"]]
    assert (a["via_rango"], a["via_gravita_km"], a["via_mortali"], a["via_incidenti"], a["via_km"]) == (1, 5.0, 2, 12, 4.0)
    assert "via_rango" not in z


def test_scrivi_marca_gli_archi_delle_vie_pericolose(tmp_path):
    src = tmp_path / "src"
    src.mkdir()
    archi = _fc(_arco_via(0, "Via A", 4000), _arco_via(1, "Via B", 4000))
    (src / "rete_rischio.geojson").write_text(json.dumps(archi))
    (src / "hotspot_griglia.geojson").write_text(json.dumps(_fc(_cella(0, "hotspot 95%"))))
    (src / "incidenti_snap.geojson").write_text(json.dumps(_fc(*[_inc_su(0, "M")] * 40, *[_inc_su(1)] * 3)))
    out = tmp_path / "out"
    s.scrivi(src, out)
    ridotti = json.loads((out / "archi.geojson").read_text())["features"]
    assert [f["properties"].get("via_rango") for f in ridotti] == [1, None]


def test_incidenti_portano_il_nome_della_via_dall_arco():
    archi = _fc(_arco_via(0, "Via A"), _arco_via(1, None))
    out = s.ridotti_incidenti(_fc(_inc_su(0), _inc_su(1), _inc_su(99)), archi)["features"]
    assert [f["properties"].get("via") for f in out] == ["Via A", None, None]


def _arco_in(i, nome, lunghezza_m, coords):
    f = _arco_via(i, nome, lunghezza_m)
    f["geometry"] = {"type": "LineString", "coordinates": coords}
    return f


def test_vie_una_riga_per_via_con_conteggi_punto_e_riquadro():
    archi = _fc(_arco_in(0, "Via A", 1000, [[13.30, 38.10], [13.31, 38.11]]),
                _arco_in(1, "Via A", 1000, [[13.31, 38.11], [13.32, 38.12]]),
                _arco_in(2, "Via B", 500, [[13.40, 38.20], [13.41, 38.20]]),
                _arco_in(3, None, 500, [[13.5, 38.3], [13.51, 38.3]]))
    inc = _fc(_inc_su(0, "M"), _inc_su(1), _inc_su(1), _inc_su(2, aff=False), _inc_su(3))
    vie = s.vie(archi, inc, {"Via A": {"rango": 1, "gravita_km": 7.5}})
    assert [v["nome"] for v in vie] == ["Via A", "Via B"]            # senza nome escluse, ordine per nome
    a, b = vie
    assert (a["incidenti"], a["mortali"], a["km"]) == (3, 1, 2.0)
    assert a["rango"] == 1 and a["gravita_km"] == 7.5
    assert a["bbox"] == [13.30, 38.10, 13.32, 38.12]
    assert 13.30 <= a["lon"] <= 13.32 and 38.10 <= a["lat"] <= 38.12
    assert b["incidenti"] == 0 and "rango" not in b                   # l'incidente non affidabile non conta


def test_scrivi_produce_vie_json(tmp_path):
    src = tmp_path / "src"
    src.mkdir()
    (src / "rete_rischio.geojson").write_text(json.dumps(_fc(_arco_in(0, "Via A", 4000, [[13.3, 38.1], [13.31, 38.1]]))))
    (src / "hotspot_griglia.geojson").write_text(json.dumps(_fc(_cella(0, "hotspot 95%"))))
    (src / "incidenti_snap.geojson").write_text(json.dumps(_fc(_inc_su(0))))
    out = tmp_path / "out"
    s.scrivi(src, out)
    vie = json.loads((out / "vie.json").read_text())
    assert vie[0]["nome"] == "Via A" and vie[0]["incidenti"] == 1

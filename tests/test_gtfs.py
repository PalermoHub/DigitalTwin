import csv
import json
from pathlib import Path

import pytest

import gtfs as g

ROOT = Path(__file__).resolve().parents[1]


def _scrivi(src, nome, intestazione, righe):
    with open(src / f"{nome}.txt", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(intestazione)
        w.writerows(righe)


@pytest.fixture
def feed(tmp_path):
    """Feed minimo: due linee (bus 100 a due direzioni, TRAM1), 4 fermate, due servizi, una corsa dopo la mezzanotte."""
    _scrivi(tmp_path, "stops", ["stop_id", "stop_name", "stop_lat", "stop_lon", "location_type", "parent_station", "wheelchair_boarding"], [
        ["S1", "PIAZZA INDIPENDENZA", "38.1", "13.3", "0", "", "1"],
        ["S2", "VIA ROMA", "38.11", "13.31", "0", "", "2"],
        ["S3", "STAZIONE CENTRALE", "38.12", "13.32", "0", "", ""],
        ["S4", "FERMATA ORFANA", "38.13", "13.33", "0", "", ""],
    ])
    _scrivi(tmp_path, "routes", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type", "route_url", "route_color", "route_text_color"], [
        ["100", "AMAT", "100", "JOHN LENNON - ORETO", "3", "", "7B263E", "FFFFFF"],
        ["TRAM1", "AMAT", "TRAM1", "LINEA 1", "0", "", "4F3881", "FFFFFF"],
    ])
    _scrivi(tmp_path, "trips", ["route_id", "service_id", "trip_id", "trip_headsign", "direction_id", "shape_id", "wheelchair_accessible", "bikes_allowed"], [
        ["100", "A", "t1", "", "0", "SH1", "", ""],
        ["100", "A", "t2", "", "0", "SH1", "", ""],
        ["100", "B", "t3", "", "1", "SH2", "", ""],
        ["TRAM1", "A", "t4", "", "0", "SH1", "", ""],
    ])
    _scrivi(tmp_path, "shapes", ["shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"], [
        ["SH1", "38.12", "13.32", "3"], ["SH1", "38.1", "13.3", "1"], ["SH1", "38.11", "13.31", "2"],
        ["SH2", "38.12", "13.32", "1"], ["SH2", "38.1", "13.3", "2"],
    ])
    _scrivi(tmp_path, "stop_times", ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"], [
        ["t1", "07:00:00", "07:00:00", "S1", "1"], ["t1", "07:10:00", "07:10:00", "S2", "2"], ["t1", "07:20:00", "07:20:00", "S3", "3"],
        ["t2", "25:30:00", "25:30:00", "S1", "1"], ["t2", "25:40:00", "25:40:00", "S2", "2"], ["t2", "25:50:00", "25:50:00", "S3", "3"],
        ["t3", "08:00:00", "08:00:00", "S3", "1"], ["t3", "08:10:00", "08:10:00", "S2", "2"], ["t3", "08:20:00", "08:20:00", "S1", "3"],
        ["t4", "09:00:00", "09:00:00", "S1", "1"], ["t4", "09:10:00", "09:10:00", "S3", "2"],
    ])
    _scrivi(tmp_path, "calendar_dates", ["service_id", "date", "exception_type"], [
        ["A", "20260825", "1"], ["A", "20260826", "1"], ["A", "20260827", "1"], ["A", "20260827", "2"],
        ["B", "20260825", "1"],
    ])
    _scrivi(tmp_path, "feed_info", ["feed_publisher_name", "feed_start_date", "feed_end_date"], [["AMAT", "20260825", "20261031"]])
    return tmp_path


def test_minuti_anche_oltre_mezzanotte():
    assert g.minuti("07:15:00") == 435
    assert g.minuti("25:30:00") == 1530


def test_servizi_aggiunge_e_toglie_date(feed):
    assert g.servizi(feed) == {"A": ["2026-08-25", "2026-08-26"], "B": ["2026-08-25"]}


def test_fermate_nome_linee_accessibilita_e_validita(feed):
    fermate, _, _ = g.costruisci(feed)
    assert fermate["validita"] == {"da": "2026-08-25", "a": "2026-10-31"}
    p = {f["properties"]["id"]: f["properties"] for f in fermate["features"]}
    assert p["S1"]["nome"] == "Piazza Indipendenza"
    assert p["S1"]["linee"] == ["100", "TRAM1"]
    assert (p["S1"]["accessibile"], p["S2"]["accessibile"], p["S3"]["accessibile"]) == ("Sì", "No", "")
    assert p["S4"]["linee"] == []  # fermata senza corse: resta, senza linee
    assert (p["S1"]["lon"], p["S1"]["lat"]) == (13.3, 38.1)


def test_linee_una_per_direzione_con_tracciato_ordinato(feed):
    _, linee, _ = g.costruisci(feed)
    per_id = {f["properties"]["id"]: f for f in linee["features"]}
    assert sorted(per_id) == ["linea-100-0", "linea-100-1", "linea-TRAM1-0"]
    f = per_id["linea-100-0"]
    assert f["geometry"]["coordinates"] == [[13.3, 38.1], [13.31, 38.11], [13.32, 38.12]]  # ordinati per sequenza
    p = f["properties"]
    assert (p["numero"], p["nome"], p["colore"], p["tipo"], p["direzione"]) == ("100", "John Lennon - Oreto", "#7B263E", "bus", 0)
    assert (p["da"], p["a"]) == ("Piazza Indipendenza", "Stazione Centrale")  # capolinea dalla prima e ultima fermata
    assert p["fermate"] == ["S1", "S2", "S3"]
    assert per_id["linea-TRAM1-0"]["properties"]["tipo"] == "tram"


def test_orari_per_fermata_senza_ultima_fermata_e_con_corse_oltre_mezzanotte(feed):
    _, _, orari = g.costruisci(feed)
    assert orari["validita"] == {"da": "2026-08-25", "a": "2026-10-31"}
    assert orari["servizi"] == {"0": ["2026-08-25", "2026-08-26"], "1": ["2026-08-25"]}
    assert orari["fermate"]["S1"]["100"] == [{"d": 0, "s": 0, "t": [420, 1530]}]  # t3 finisce qui: non è una partenza
    assert orari["fermate"]["S1"]["TRAM1"] == [{"d": 0, "s": 0, "t": [540]}]
    assert orari["fermate"]["S3"]["100"] == [{"d": 1, "s": 1, "t": [480]}]
    assert "S4" not in orari["fermate"]


def test_scrivi_produce_i_tre_file(feed, tmp_path):
    out = tmp_path / "out"
    g.scrivi(g.costruisci(feed), out)
    assert json.loads((out / "fermate.geojson").read_text(encoding="utf-8"))["validita"]["a"] == "2026-10-31"
    assert len(json.loads((out / "linee.geojson").read_text(encoding="utf-8"))["features"]) == 3
    assert "fermate" in json.loads((out / "orari.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def reale():
    if not (ROOT / "dati" / "gtfs" / "stop_times.txt").exists():
        pytest.skip("dati/gtfs assente")
    return g.costruisci()


def test_feed_reale_coerente(reale):
    fermate, linee, orari = reale
    ids = {f["properties"]["id"] for f in fermate["features"]}
    assert len(ids) == 1668
    route = {f["properties"]["route_id"] for f in linee["features"]}
    assert len(route) == 71
    tipi = {f["properties"]["route_id"]: f["properties"]["tipo"] for f in linee["features"]}
    assert sum(t == "tram" for t in tipi.values()) == 4 and sum(t == "bus" for t in tipi.values()) == 67
    assert set(orari["fermate"]) <= ids  # nessun orario per una fermata sconosciuta
    for f in linee["features"]:
        assert set(f["properties"]["fermate"]) <= ids and len(f["geometry"]["coordinates"]) >= 2
    servizi_usati = {g_["s"] for rotte in orari["fermate"].values() for gruppi in rotte.values() for g_ in gruppi}
    assert {str(s) for s in servizi_usati} <= set(orari["servizi"])
    assert max(t for rotte in orari["fermate"].values() for gruppi in rotte.values() for g_ in gruppi for t in g_["t"]) > 1440
    assert orari["validita"] == {"da": "2026-08-25", "a": "2026-10-31"}


def test_direzione_dalla_forma_del_tracciato_se_il_feed_la_etichetta_male(feed):
    """Il feed AMAT a volte dà direction_id 0 anche alle corse di ritorno: la direzione si ricava dal verso del tracciato."""
    righe = list(csv.reader(open(feed / "trips.txt", encoding="utf-8")))
    righe.append(["100", "A", "t5", "", "0", "SH2", "", ""])  # SH2 è l'inverso di SH1, ma il feed dice direzione 0
    with open(feed / "trips.txt", "w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerows(righe)
    soste = list(csv.reader(open(feed / "stop_times.txt", encoding="utf-8")))
    soste += [["t5", "10:00:00", "10:00:00", "S3", "1"], ["t5", "10:10:00", "10:10:00", "S2", "2"], ["t5", "10:20:00", "10:20:00", "S1", "3"]]
    with open(feed / "stop_times.txt", "w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerows(soste)
    _, linee, orari = g.costruisci(feed)
    assert sorted(f["properties"]["id"] for f in linee["features"]) == ["linea-100-0", "linea-100-1", "linea-TRAM1-0"]
    ritorno = {f["properties"]["id"]: f["properties"] for f in linee["features"]}["linea-100-1"]
    assert (ritorno["da"], ritorno["a"]) == ("Stazione Centrale", "Piazza Indipendenza")
    # a S3 (capolinea del ritorno) le partenze delle 08:00 (servizio B) e delle 10:00 (servizio A) sono entrambe della direzione 1
    assert orari["fermate"]["S3"]["100"] == [{"d": 1, "s": 0, "t": [600]}, {"d": 1, "s": 1, "t": [480]}]

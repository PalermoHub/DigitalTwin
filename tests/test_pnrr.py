import csv
import json

import pnrr as m

HEAD_LOC = ["Codice Univoco Submisura", "Descrizione Submisura", "CUP", "Codice Locale Progetto", "Regione", "Descrizione Regione",
            "Provincia", "Descrizione Provincia", "Comune", "Descrizione Comune", "Indirizzo", "CAP", "Percentuale di Localizzazione", "Data di Estrazione"]


def riga_loc(cup, comune="053", provincia="082", regione="019", indirizzo="", cap="90100"):
    return {"Codice Univoco Submisura": "M4C1I3.3", "Descrizione Submisura": "Scuole", "CUP": cup, "Codice Locale Progetto": "PRJ",
            "Regione": regione, "Descrizione Regione": "SICILIA", "Provincia": provincia, "Descrizione Provincia": "PALERMO",
            "Comune": comune, "Descrizione Comune": "X", "Indirizzo": indirizzo, "CAP": cap, "Percentuale di Localizzazione": "100,00",
            "Data di Estrazione": "13/06/2026"}


def scrivi_csv(percorso, righe, campi):
    with open(percorso, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, campi, delimiter=";")
        w.writeheader()
        w.writerows(righe)


def civici_finti(tmp_path):
    """Un indice con via Gino Marinuzzi (civici 3 e 5A) nel file scelto dall'hash, e Via Roma senza civici nell'elenco."""
    d = tmp_path / "civici-omi"
    (d / "civici").mkdir(parents=True)
    vie = {"VIA GINO MARINUZZI": [13.35, 38.12], "VIA ROMA": [13.36, 38.11], "VIA LONTANA": [10.0, 45.0]}
    (d / "civici_vie.json").write_text(json.dumps(vie), encoding="utf-8")
    per_file = {}
    # formato compatto: [civici, lon in micro-gradi a differenze, lat idem]
    dati = {"VIA GINO MARINUZZI": [["3", "5A"], [13350000, 100], [38120000, -50]], "VIA ROMA": [["1"], [13360000], [38110000]],
            "VIA LONTANA": [["1"], [10000000], [45000000]]}
    for via, voce in dati.items():
        per_file.setdefault(m.chiave_sezione(via), {})[via] = voce
    for chiave in {m.chiave_sezione(v) for v in dati}:
        (d / "civici" / f"{chiave}.json").write_text(json.dumps(per_file.get(chiave, {})), encoding="utf-8")
    return m.Civici(d)


def test_chiave_sezione_come_in_js():
    assert m.chiave_sezione("VIA ROMA") == m.chiave_sezione("VIA ROMA")
    assert len(m.chiave_sezione("VIA ROMA")) == 2 and 0 <= int(m.chiave_sezione("VIA ROMA")) < 32


def test_normalizza_toglie_accenti_e_punteggiatura():
    assert m.normalizza("Via dell'Università, 5") == "VIA DELL'UNIVERSITA 5"


def test_separa_indirizzo_formati_reali():
    assert m.separa_indirizzo("Via Gino Marinuzzi, 3") == ("VIA GINO MARINUZZI", "3")
    assert m.separa_indirizzo("Via Tacito,34") == ("VIA TACITO", "34")
    assert m.separa_indirizzo("Via MONTE SAN CALOGERO 20") == ("VIA MONTE SAN CALOGERO", "20")
    assert m.separa_indirizzo("Piazza Giangiacomo Ciaccio Montalto N.3") == ("PIAZZA GIANGIACOMO CIACCIO MONTALTO", "3")
    assert m.separa_indirizzo("Via Messina Marine N.811") == ("VIA MESSINA MARINE", "811")
    assert m.separa_indirizzo("Via Barisano Da Trani, 7 - 9") == ("VIA BARISANO DA TRANI", "7")
    assert m.separa_indirizzo("Via Santocanale") == ("VIA SANTOCANALE", "")
    assert m.separa_indirizzo("") == ("", "")


def test_separa_indirizzo_toglie_il_nome_dell_edificio_davanti():
    assert m.separa_indirizzo("Palazzo D' Orleans - Piazza Indipendenza 21") == ("PIAZZA INDIPENDENZA", "21")
    assert m.separa_indirizzo("Piazza Pretoria, 1 - Palazzo Delle Aquile") == ("PIAZZA PRETORIA", "1")


def test_posizione_civico_esatto_e_variante_con_lettera(tmp_path):
    c = civici_finti(tmp_path)
    lon, lat, prec, via = c.posizione("Via Gino Marinuzzi, 3")
    assert (lon, lat, prec, via) == (13.35, 38.12, "civico", "VIA GINO MARINUZZI")
    # «5» non esiste ma esiste «5A»
    assert c.posizione("Via Gino Marinuzzi 5")[2] == "civico"


def test_posizione_senza_civico_o_civico_assente_usa_la_via(tmp_path):
    c = civici_finti(tmp_path)
    assert c.posizione("Via Gino Marinuzzi")[2] == "via"
    assert c.posizione("Via Gino Marinuzzi 99")[2] == "via"


def test_posizione_via_sconosciuta_o_fuori_citta(tmp_path):
    c = civici_finti(tmp_path)
    assert c.posizione("Via Inesistente 3") is None
    assert c.posizione("Via Lontana 1") is None
    assert c.posizione("") is None


def test_localizzazioni_tiene_solo_palermo_e_marca_i_multi_comune(tmp_path):
    f = tmp_path / "loc.csv"
    scrivi_csv(f, [riga_loc("A"), riga_loc("B"), riga_loc("B", comune="001"), riga_loc("C", comune="001"), riga_loc("D", provincia="081")],
               HEAD_LOC)
    loc = m.localizzazioni(f)
    assert set(loc) == {"A", "B"}
    assert loc["A"]["solo"] is True
    assert loc["B"]["solo"] is False


def test_numero_formati():
    assert m.numero("500000") == 500000
    assert m.numero("1234,56") == 1234.56
    assert m.numero("1.234,5") == 1234.5
    assert m.numero("") is None
    assert m.numero("abc") is None


def test_costruisci_unisce_progetti_e_posizioni(tmp_path):
    civici = civici_finti(tmp_path)
    loc = {
        "A": {"righe": [riga_loc("A", indirizzo="Via Gino Marinuzzi, 3")], "solo": True},
        "B": {"righe": [riga_loc("B")], "solo": True},
        "C": {"righe": [riga_loc("C", indirizzo="Via Sconosciuta 1")], "solo": True},
        "D": {"righe": [riga_loc("D", indirizzo="Via Roma 1")], "solo": False},
    }
    progetti = {"A": {"Titolo Progetto": "LAVORI DI PROVA", "Missione": "M4", "Finanziamento PNRR": "1000", "Finanziamento Totale": "1200"}}
    elenco, feature, cont = m.costruisci(loc, progetti, civici)
    assert [p["cup"] for p in elenco] == ["A", "B", "C"]          # D è anche altrove: fuori
    assert len(feature) == 1 and feature[0]["properties"]["cup"] == "A"
    assert feature[0]["geometry"]["coordinates"] == [13.35, 38.12]
    assert feature[0]["properties"]["missione"] == "M4" and feature[0]["properties"]["pnrr"] == 1000
    assert "lon" not in feature[0]["properties"]
    assert cont["posizione_civico"] == 1 and cont["senza_indirizzo"] == 1 and cont["indirizzo_non_trovato"] == 1
    assert cont["con_dati_progetto"] == 1 and cont["senza_dati_progetto"] == 2
    assert elenco[1]["con_dati_progetto"] is False and elenco[1]["precisione"] is None


def test_costruisci_preferisce_il_civico_alla_via(tmp_path):
    civici = civici_finti(tmp_path)
    righe = [riga_loc("A", indirizzo="Via Roma"), riga_loc("A", indirizzo="Via Gino Marinuzzi, 3")]
    _, feature, cont = m.costruisci({"A": {"righe": righe, "solo": True}}, {}, civici)
    assert feature[0]["properties"]["precisione"] == "civico" and cont["posizione_civico"] == 1


def test_sintesi_lunga_viene_accorciata():
    p = m.proprieta("A", [riga_loc("A")], {"Sintesi Progetto": "parola " * 300})
    assert len(p["sintesi"]) <= m.MAX_SINTESI + 1 and p["sintesi"].endswith("…")


def test_scrivi_produce_i_cinque_file(tmp_path):
    civici = civici_finti(tmp_path)
    loc = {"A": {"righe": [riga_loc("A", indirizzo="Via Gino Marinuzzi, 3")], "solo": True}}
    elenco, feature, cont = m.costruisci(loc, {"A": {"Missione": "M1", "Finanziamento PNRR": "50"}}, civici)
    r = m.scrivi(tmp_path / "out", elenco, feature, cont, "13/06/2026", [])
    assert r["cup"] == 1 and r["su_mappa"] == 1 and r["importo_pnrr_eur"] == 50
    for nome in ("pnrr.geojson", "pnrr_palermo.csv", "sintesi.json", "riepilogo.json", "README.md"):
        assert (tmp_path / "out" / nome).exists()
    gj = json.loads((tmp_path / "out" / "pnrr.geojson").read_text(encoding="utf-8"))
    assert gj["estrazione"] == "13/06/2026" and len(gj["features"]) == 1
    righe = list(csv.DictReader(open(tmp_path / "out" / "pnrr_palermo.csv", encoding="utf-8")))
    assert righe[0]["cup"] == "A" and righe[0]["precisione"] == "civico"


def test_sintesi_aggrega_tutti_i_progetti_anche_senza_posizione():
    elenco = [
        {"missione": "M4", "stato": "Concluso", "pnrr": 100, "totale": 120, "fine_prevista": "30/06/2025", "settore": "S1", "attuatore": "A"},
        {"missione": "M4", "stato": "In Corso", "pnrr": 50, "totale": 50, "fine_prevista": "01/01/2026", "settore": "S1", "attuatore": "A"},
        {"missione": "M1", "stato": "In Corso", "pnrr": None, "totale": None, "fine_prevista": None, "settore": None, "attuatore": "B"},
    ]
    s = m.sintesi(elenco, 1, "13/06/2026")
    assert s["n"] == 3 and s["su_mappa"] == 1 and s["pnrr"] == 150 and s["totale"] == 170
    assert [g["voce"] for g in s["per_missione"]] == ["M1", "M4"]
    assert next(g for g in s["per_missione"] if g["voce"] == "M4") == {"voce": "M4", "n": 2, "pnrr": 150}
    assert {g["voce"]: g["n"] for g in s["per_stato"]} == {"In Corso": 2, "Concluso": 1}
    assert [g["voce"] for g in s["per_anno_fine"]] == ["2025", "2026"] and s["senza_data_fine"] == 1
    assert s["per_settore"][0]["voce"] == "S1" and {g["voce"] for g in s["per_settore"]} == {"S1", "n.d."}
    assert s["per_attuatore"][0] == {"voce": "A", "n": 2, "pnrr": 150, "n_mappa": 0}


def test_sintesi_limita_settori_e_attuatori():
    elenco = [{"missione": "M1", "stato": "Concluso", "pnrr": 1, "settore": f"S{i}", "attuatore": f"A{i}"} for i in range(20)]
    s = m.sintesi(elenco, 0, None)
    assert len(s["per_settore"]) == m.TOP_SETTORI and len(s["per_attuatore"]) == m.TOP_ATTUATORI


def test_sedi_scuole_solo_istituti_statali_di_palermo(tmp_path):
    f = tmp_path / "ipa.txt"
    righe = [("111", "Palermo", m.TIPO_SCUOLE, "Via Imera, 32"), ("222", "Palermo", "Università", "Piazza Marina 61"),
             ("333", "Catania", m.TIPO_SCUOLE, "Via Etnea 1"), ("", "Palermo", m.TIPO_SCUOLE, "Via X 1")]
    f.write_text("cod_amm\tComune\ttipologia_istat\tIndirizzo\tcf\n" + "".join(f"A\t{c}\t{t}\t{i}\t{cf}\n" for cf, c, t, i in righe), encoding="utf-8")
    assert m.sedi_scuole(f) == {"111": "Via Imera, 32"}


def test_layer_scuole_chiave_via_e_civico(tmp_path):
    f = tmp_path / "scuole.geojson"
    feat = lambda nome, ind, lon, lat: {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": {"nome": nome, "indirizzo": ind}}
    f.write_text(json.dumps({"type": "FeatureCollection", "features": [feat("Colozza", "Via Imera 32", 13.3, 38.1), feat("Senza civico", "Via Roma", 13.3, 38.1)]}), encoding="utf-8")
    s = m.layer_scuole(f)
    assert s == {("VIA IMERA", "32"): (13.3, 38.1, "Colozza")}
    assert m.layer_scuole(tmp_path / "manca.geojson") == {}


def test_progetto_senza_indirizzo_va_sulla_sede_della_scuola(tmp_path):
    civici = civici_finti(tmp_path)
    loc = {"A": {"righe": [riga_loc("A")], "solo": True}, "B": {"righe": [riga_loc("B")], "solo": True}, "C": {"righe": [riga_loc("C")], "solo": True}}
    progetti = {c: {"Codice Fiscale Soggetto Attuatore": cf, "Soggetto Attuatore": "SCUOLA"} for c, cf in (("A", "111"), ("B", "222"), ("C", "999"))}
    sedi = {"111": "Via Gino Marinuzzi, 3", "222": "Via Roma 1"}
    scuole = {("VIA ROMA", "1"): (13.361, 38.111, "Scuola Roma")}
    elenco, feature, cont = m.costruisci(loc, progetti, civici, sedi, scuole)
    per_cup = {f["properties"]["cup"]: f for f in feature}
    assert set(per_cup) == {"A", "B"}                                   # C: attuatore non è una scuola nota
    assert per_cup["A"]["properties"]["precisione"] == "sede" and per_cup["A"]["geometry"]["coordinates"] == [13.35, 38.12]
    assert per_cup["B"]["properties"]["scuola"] == "Scuola Roma" and per_cup["B"]["geometry"]["coordinates"] == [13.361, 38.111]
    assert "scuola" not in per_cup["A"]["properties"] and "cf_attuatore" not in per_cup["A"]["properties"]
    assert cont["posizione_sede"] == 2 and cont["sede_da_layer_scuole"] == 1 and cont["senza_indirizzo"] == 1


def test_un_indirizzo_proprio_vince_sulla_sede(tmp_path):
    civici = civici_finti(tmp_path)
    loc = {"A": {"righe": [riga_loc("A", indirizzo="Via Gino Marinuzzi, 3")], "solo": True}}
    progetti = {"A": {"Codice Fiscale Soggetto Attuatore": "111"}}
    _, feature, cont = m.costruisci(loc, progetti, civici, {"111": "Via Roma 1"}, {})
    assert feature[0]["properties"]["precisione"] == "civico" and "posizione_sede" not in cont


def test_separa_indirizzo_toglie_cap_e_citta():
    assert m.separa_indirizzo("VIA PAPA SERGIO I N. 5 - 90142 PALERMO") == ("VIA PAPA SERGIO I", "5")
    assert m.separa_indirizzo("VIA G. LA LOGGIA N 5, PALERMO") == ("VIA G LA LOGGIA", "5")
    assert m.separa_indirizzo("Via Roma 1, 90133 Palermo") == ("VIA ROMA", "1")


def test_indirizzo_da_sintesi_prende_la_parte_di_mezzo():
    assert m.indirizzo_da_sintesi("ASILO NIDO*VIA LAUDICINA*COSTRUZIONE") == "VIA LAUDICINA"
    assert m.indirizzo_da_sintesi("solo testo senza asterischi") is None
    assert m.indirizzo_da_sintesi("a**c") is None
    assert m.indirizzo_da_sintesi("a*" + "x" * 100 + "*c") is None
    assert m.indirizzo_da_sintesi(None) is None


def test_posizione_ignora_il_tipo_di_strada_ma_non_le_ambiguita(tmp_path):
    c = civici_finti(tmp_path)
    assert c.posizione("Viale Gino Marinuzzi 3")[3] == "VIA GINO MARINUZZI"      # tipo diverso
    assert c.posizione("Via Largo Gino Marinuzzi")[3] == "VIA GINO MARINUZZI"    # doppio tipo
    assert c.posizione("Gino Marinuzzi, 3")[2] == "civico"                       # tipo mancante
    assert m.senza_tipo("VIALE XXVII MAGGIO") == ["27", "MAGGIO"]


def test_ambiguita_tra_vie_lontane_non_si_posiziona(tmp_path):
    d = tmp_path / "civici-omi"
    (d / "civici").mkdir(parents=True)
    vie = {"VIA NORD DEL FANTE": [13.30, 38.20], "VIALE SUD DEL FANTE": [13.40, 38.05]}
    (d / "civici_vie.json").write_text(json.dumps(vie), encoding="utf-8")
    for n in range(m.SEZIONI_CIVICI):
        (d / "civici" / f"{n:02d}.json").write_text("{}", encoding="utf-8")
    assert m.Civici(d).posizione("Largo del Fante 3") is None


def test_indirizzo_della_descrizione_vince_sulla_sede_ma_non_su_quello_della_localizzazione(tmp_path):
    civici = civici_finti(tmp_path)
    loc = {"A": {"righe": [riga_loc("A")], "solo": True}, "B": {"righe": [riga_loc("B", indirizzo="Via Roma 1")], "solo": True}}
    progetti = {c: {"Sintesi Progetto": "LAVORI*VIA GINO MARINUZZI, 3*FINE", "Codice Fiscale Soggetto Attuatore": "111"} for c in "AB"}
    _, feature, cont = m.costruisci(loc, progetti, civici, {"111": "Via Roma 1"}, {})
    a, b = (next(f for f in feature if f["properties"]["cup"] == c)["properties"] for c in "AB")
    assert a["precisione"] == "civico" and a["indirizzo"] == "VIA GINO MARINUZZI, 3" and a["indirizzo_da"] == "descrizione"
    assert b["indirizzo"] == "Via Roma 1" and "indirizzo_da" not in b                # la localizzazione ha la precedenza
    assert cont["posizione_da_descrizione"] == 1 and "posizione_sede" not in cont


def test_sintesi_conta_per_ogni_soggetto_i_progetti_in_mappa():
    elenco = [{"attuatore": "A", "precisione": "civico", "missione": "M1", "stato": "Concluso"},
              {"attuatore": "A", "precisione": None, "missione": "M1", "stato": "Concluso"},
              {"attuatore": "B", "precisione": "sede", "missione": "M1", "stato": "Concluso"}]
    s = m.sintesi(elenco, 2, None)
    assert {g["voce"]: (g["n"], g["n_mappa"]) for g in s["per_attuatore"]} == {"A": (2, 1), "B": (1, 1)}


def test_titolo_completo_usa_la_sintesi_solo_se_ricomincia_uguale():
    troncato = "Animatore digitale: formazione del perso"
    assert m.titolo_completo(troncato, "Animatore digitale: formazione del personale*VIA ROMA 1*altro") == "Animatore digitale: formazione del personale"
    assert m.titolo_completo(troncato, "SETTORE CITTADINANZA SOLIDALE*VIA GARIBALDI, 26*altro") == troncato
    assert m.titolo_completo("Titolo", "Titolo") == "Titolo"
    assert m.titolo_completo(None, "x*y*z") is None
    assert m.proprieta("A", [riga_loc("A")], {"Titolo Progetto": troncato, "Sintesi Progetto": "Animatore digitale: formazione del personale*V*x"})["titolo"] == "Animatore digitale: formazione del personale"

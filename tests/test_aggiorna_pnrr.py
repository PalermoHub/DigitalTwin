from datetime import date

import aggiorna_pnrr as a

INTESTAZIONE = "\ufeffCodice Univoco Submisura;CUP;Data di Estrazione\n"


def test_data_da_testo():
    assert a.data_da_testo("13/06/2026") == date(2026, 6, 13)
    assert a.data_da_testo(" 01/01/2027 ") == date(2027, 1, 1)
    assert a.data_da_testo("2026-06-13") is None
    assert a.data_da_testo("") is None and a.data_da_testo(None) is None


def test_data_dall_inizio_del_file_anche_se_l_ultima_riga_e_tagliata():
    inizio = INTESTAZIONE + "M1;A;13/06/2026\nM1;B;13/06/2026\nM1;C;13/0"
    assert a.data_da_intestazione(inizio) == date(2026, 6, 13)


def test_data_non_leggibile_ferma_con_un_messaggio():
    for inizio in ("", INTESTAZIONE, "a;b\n1;2\n", INTESTAZIONE + "M1;A;ieri\n"):
        try:
            a.data_da_intestazione(inizio)
        except a.Fermo as e:
            assert "data di estrazione" in str(e)
        else:
            raise AssertionError(inizio)


def test_ce_di_nuovo_solo_se_la_data_del_sito_e_successiva():
    assert a.ce_di_nuovo(date(2026, 9, 1), date(2026, 6, 13))
    assert not a.ce_di_nuovo(date(2026, 6, 13), date(2026, 6, 13))
    assert not a.ce_di_nuovo(date(2026, 5, 1), date(2026, 6, 13))


PRIMA = {"estrazione": "13/06/2026", "cup": 2633, "su_mappa": 1284, "file_progetti_mancanti": []}


def test_numeri_simili_non_sono_anomalie():
    assert a.anomalie(PRIMA, {**PRIMA, "estrazione": "13/09/2026", "cup": 2700, "su_mappa": 1300}) == []


def test_anomalie_file_mancanti_e_conteggi_molto_diversi():
    m = a.anomalie(PRIMA, {**PRIMA, "file_progetti_mancanti": ["PNRR_Progetti_M2.csv"], "cup": 1000, "su_mappa": 400})
    assert len(m) == 3
    assert "PNRR_Progetti_M2.csv" in m[0] and "2633 → 1000" in m[1] and "1284 → 400" in m[2]


def test_anomalia_data_all_indietro():
    m = a.anomalie(PRIMA, {**PRIMA, "estrazione": "01/01/2026"})
    assert len(m) == 1 and "tornata indietro" in m[0]


def test_la_soglia_e_regolabile():
    dopo = {**PRIMA, "cup": 2900}
    assert a.anomalie(PRIMA, dopo) == []
    assert len(a.anomalie(PRIMA, dopo, tolleranza=0.05)) == 1


def test_messaggio_di_commit_riporta_la_data():
    assert a.messaggio_commit({"estrazione": "13/09/2026"}) == "dati: aggiornamento progetti PNRR (estrazione del 13/09/2026)"

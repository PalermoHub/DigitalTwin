import json
import subprocess
import sys
from pathlib import Path

import compatta_dati as c

ROOT = Path(__file__).resolve().parent.parent


def _decodifica_js(funzione, dato):
    """Passa `dato` per il decodificatore JS di js/core/compatto.js e restituisce il risultato."""
    codice = f"import {{ {funzione} }} from '{ROOT / 'js/core/compatto.js'}'; console.log(JSON.stringify({funzione}(JSON.parse(process.argv[1]))));"
    r = subprocess.run(["node", "--input-type=module", "-e", codice, json.dumps(dato)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def test_orari_andata_e_ritorno():
    orari = {"validita": {"da": "x", "a": "y"}, "servizi": {"0": ["2026-09-01"]},
             "fermate": {"S1": {"100": [{"d": 0, "s": 0, "t": [420, 420, 1530]}, {"d": 1, "s": 1, "t": [600]}]}}}
    assert _decodifica_js("decodificaOrari", c.codifica_orari(orari)) == orari


def test_orari_non_crescenti_rifiutati():
    import pytest
    with pytest.raises(AssertionError):
        c.codifica_orari({"fermate": {"S": {"1": [{"d": 0, "s": 0, "t": [500, 400]}]}}})


VIE = ["ARCO SCIARA", "VIA ROMA", "VIA DELLA LIBERTÀ", "PIAZZA POLITEAMA", "ARCO BONDI'", "VIA 4 NOVEMBRE"]


def test_chiave_sezione_uguale_in_python_e_js():
    codice = f"import {{ chiaveSezione }} from '{ROOT / 'js/core/compatto.js'}'; console.log(JSON.stringify(JSON.parse(process.argv[1]).map(chiaveSezione)));"
    r = subprocess.run(["node", "--input-type=module", "-e", codice, json.dumps(VIE)], capture_output=True, text=True, check=True)
    assert json.loads(r.stdout) == [c.chiave_sezione(v) for v in VIE]
    assert len({c.chiave_sezione(v) for v in VIE}) > 1  # le vie non finiscono tutte nello stesso file


def test_civici_andata_e_ritorno():
    indice = {"ARCO SCIARA": {"1A": [13.3551, 38.145718], "1": [13.355197, 38.145634], "2": [13.355049, 38.14581]}, "VIA X": {"7": [13.3, 38.1]}}
    vie, sezioni = c.codifica_civici(indice)
    # il primo punto è quello che il JS vedrebbe come primo valore: i civici numerici vengono prima di «1A»
    assert vie["ARCO SCIARA"] == [13.355197, 38.145634] and vie["VIA X"] == [13.3, 38.1]
    ricomposto = {}
    for chiave, vie_sezione in sezioni.items():
        assert all(c.chiave_sezione(via) == chiave for via in vie_sezione)
        ricomposto.update(_decodifica_js("decodificaCivici", vie_sezione))
    assert ricomposto == indice


def test_popolazione_solo_campi_usati_e_null_dove_mancano():
    codificato = c.codifica_popolazione([{"SEZ21_ID": 1, "P1": 5, "extra": 9}, {"SEZ21_ID": 2}])
    assert set(codificato) == set(c.CAMPI_POPOLAZIONE)
    assert codificato["P1"] == [5, None] and codificato["SEZ21_ID"] == [1, 2]
    assert _decodifica_js("daColonne", codificato)[1]["P1"] is None

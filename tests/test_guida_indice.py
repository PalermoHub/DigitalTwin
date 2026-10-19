import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
from guida_indice import costruisci_indice  # noqa: E402

FILE = """# Scheda X

## Prima sezione

Parole chiave: uno, due.

Domande tipiche: Cos'è A? Dove sta B?

Corpo della prima.

---

## Seconda sezione

Parole chiave: tre.

Domande tipiche: Perché C?

- elenco uno
- elenco due

---

## Senza metadati

Solo testo.
"""


def cartella(tmp_path):
    (tmp_path / '08-x.md').write_text(FILE, encoding='utf-8')
    (tmp_path / '00-leggimi.md').write_text('# Indice\n\n## Sez\n\nParole chiave: a.\n\nDomande tipiche: B?\n\nTesto.\n', encoding='utf-8')
    (tmp_path / 'RIPRESA.md').write_text('# Ripresa\n', encoding='utf-8')
    return tmp_path


def test_una_voce_per_sezione(tmp_path):
    voci = costruisci_indice(cartella(tmp_path))
    assert [v['id'] for v in voci] == ['08-x#1', '08-x#2']
    assert voci[0]['file'] == '08-x.md'
    assert voci[0]['titolo'] == 'Prima sezione'
    assert voci[0]['parole'] == 'uno, due.'


def test_domande_divise_sui_punti_interrogativi(tmp_path):
    voci = costruisci_indice(cartella(tmp_path))
    assert voci[0]['domande'] == ["Cos'è A?", 'Dove sta B?']


def test_testo_senza_metadati_e_separatori(tmp_path):
    voci = costruisci_indice(cartella(tmp_path))
    for v in voci:
        assert 'Parole chiave:' not in v['testo']
        assert 'Domande tipiche:' not in v['testo']
        assert '---' not in v['testo']
    assert voci[0]['testo'] == 'Corpo della prima.'
    assert voci[1]['testo'] == '- elenco uno\n- elenco due'


def test_esclude_indice_e_ripresa(tmp_path):
    voci = costruisci_indice(cartella(tmp_path))
    assert all(v['file'] == '08-x.md' for v in voci)


def test_sezione_senza_metadati_e_ignorata(tmp_path):
    voci = costruisci_indice(cartella(tmp_path))
    assert 'Senza metadati' not in [v['titolo'] for v in voci]


def test_indice_reale_serializzabile():
    cartella_reale = Path(__file__).resolve().parent.parent / 'guida'
    voci = costruisci_indice(cartella_reale)
    assert len(voci) >= 150
    json.dumps(voci, ensure_ascii=False)

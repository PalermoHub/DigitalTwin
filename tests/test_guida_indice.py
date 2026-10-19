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


def test_strati_dalla_sezione_poi_dal_file_poi_vuoti(tmp_path):
    cartella(tmp_path)
    (tmp_path / 'collegamenti.json').write_text(json.dumps({'08-x#2': ['bus'], '08-x.md': ['catasto', 'prg']}), encoding='utf-8')
    voci = costruisci_indice(tmp_path)
    assert voci[0]['strati'] == ['catasto', 'prg']   # nessuna riga per la sezione: vale quella del file
    assert voci[1]['strati'] == ['bus']              # la sezione ha la sua riga


def test_senza_collegamenti_strati_vuoti(tmp_path):
    assert all(v['strati'] == [] for v in costruisci_indice(cartella(tmp_path)))


def test_collegamenti_reali_puntano_a_sezioni_o_file_esistenti():
    cartella_reale = Path(__file__).resolve().parent.parent / 'guida'
    chiavi = json.loads((cartella_reale / 'collegamenti.json').read_text(encoding='utf-8'))
    esistenti = {v['id'] for v in costruisci_indice(cartella_reale)} | {p.name for p in cartella_reale.glob('*.md')}
    assert [k for k in chiavi if k not in esistenti] == []


def test_pannelli_da_aprire_dall_indice_reale():
    radice = Path(__file__).resolve().parent.parent
    voci = {v['id']: v for v in costruisci_indice(radice / 'guida')}
    assert voci['49-catalogo-rndt#1']['pannelli'] == ['sinistra:rndt', 'destra:rndt']
    assert voci['52-scheda-layer-rndt-barra-sinistra#1']['pannelli'] == ['sinistra:rndt', 'destra:rndt']
    assert voci['02-territorio-e-urbanistica#1']['pannelli'] == []

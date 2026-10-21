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


def test_pulsanti_dei_percorsi_solo_sulla_sezione_dei_percorsi():
    radice = Path(__file__).resolve().parent.parent
    voci = {v['id']: v for v in costruisci_indice(radice / 'guida')}
    con_percorsi = [i for i, v in voci.items() if v['percorsi']]
    assert con_percorsi == ['01-uso-della-mappa#4', '55-scheda-simulazione-mezzi#2']
    assert voci['01-uso-della-mappa#4']['titolo'].startswith('Percorsi guidati')


FILE_EN = """# Sheet X

## First section

Keywords: one, two.

Typical questions: What is A? Where is B?

Body of the first.

---

## Second section

Keywords: three.

Typical questions: Why C?

Body of the second.
"""


def cartella_en(tmp_path, file_en=FILE_EN):
    cartella(tmp_path)
    (tmp_path / 'collegamenti.json').write_text(json.dumps({'08-x#1': ['strato-a']}), encoding='utf-8')
    if file_en is not None:
        (tmp_path / 'en').mkdir()
        (tmp_path / 'en' / '08-x.md').write_text(file_en, encoding='utf-8')
    return tmp_path


def test_indice_en_usa_gli_stessi_id_e_collegamenti(tmp_path):
    c = cartella_en(tmp_path)
    en, it = costruisci_indice(c, 'en'), costruisci_indice(c)
    assert [v['id'] for v in en] == [v['id'] for v in it]
    assert en[0]['titolo'] == 'First section'
    assert en[0]['strati'] == it[0]['strati'] == ['strato-a']


def test_indice_en_legge_keywords_e_typical_questions(tmp_path):
    voce = costruisci_indice(cartella_en(tmp_path), 'en')[0]
    assert voce['parole'] == 'one, two.'
    assert voce['domande'] == ['What is A?', 'Where is B?']
    assert 'Keywords:' not in voce['testo'] and 'Typical questions:' not in voce['testo']


def test_indice_en_sezione_mancante_cade_sull_italiano(tmp_path):
    uno = FILE_EN.split('---')[0].strip() + '\n'
    voci = costruisci_indice(cartella_en(tmp_path, uno), 'en')
    assert [v['id'] for v in voci] == ['08-x#1', '08-x#2']
    assert voci[0]['titolo'] == 'First section'
    assert voci[1]['titolo'] == 'Seconda sezione'


def test_indice_en_file_mancante_cade_sull_italiano(tmp_path):
    voci = costruisci_indice(cartella_en(tmp_path, None), 'en')
    assert [v['titolo'] for v in voci] == ['Prima sezione', 'Seconda sezione']


def test_indice_it_ignora_la_cartella_en(tmp_path):
    voci = costruisci_indice(cartella_en(tmp_path))
    assert [v['titolo'] for v in voci] == ['Prima sezione', 'Seconda sezione']

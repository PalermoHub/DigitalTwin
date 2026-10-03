import subprocess
from pathlib import Path

import pytest

from guida_carosello import SLIDES, html_slide

ROOT = Path(__file__).resolve().parents[1]


def test_slide_con_testo_breve_e_immagine_esistente():
    assert len(SLIDES) == 11
    for s in SLIDES:
        assert s["titolo"].strip() and len(s["titolo"]) <= 40
        assert s["testo"].strip() and len(s["testo"]) <= 200
        if s.get("immagine"):
            assert (ROOT / s["immagine"]).exists(), s["immagine"]


def test_html_contiene_titolo_numerazione_e_non_testo_non_escapato():
    h = html_slide({"titolo": "A & B <i>", "testo": "t", "immagine": None}, 2, 11)
    assert "A &amp; B &lt;i&gt;" in h and "2 / 11" in h


@pytest.mark.parametrize("n", range(1, 12))
def test_png_1080x1350(n):
    f = ROOT / "social" / "carosello" / f"{n:02d}.png"
    assert f.exists(), "manca: esegui scripts/guida_carosello.py"
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True).stdout.strip()
    assert out == "1080,1350"


def test_il_link_della_webapp_compare_in_ogni_slide_e_in_chiusura():
    link = "palermodigitaltwin.opendatasicilia.it"
    assert "palermodigditaltwin" not in html_slide(SLIDES[0], 1, 11)  # il refuso non deve tornare
    for i, s in enumerate(SLIDES, 1):
        assert link in html_slide(s, i, len(SLIDES)), s["titolo"]
    assert html_slide(SLIDES[-1], 11, 11).count(link) == 1  # in chiusura una volta sola, in evidenza

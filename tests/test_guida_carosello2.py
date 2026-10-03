import subprocess
from pathlib import Path

import pytest

import guida_carosello2 as c

ROOT = Path(__file__).resolve().parents[1]
NUMERI = {"strati": "37", "monumenti": "4.039", "uffici": "605", "sedi": "81"}


def test_testi_brevi_per_stare_in_due_righe_senza_toccare_il_piede():
    for s in c.SLIDES:
        assert len(s["testo"]) <= 78, s["testo"]


@pytest.mark.parametrize("i", range(len(c.SLIDES)))
def test_html_senza_segnaposto_con_il_link_e_la_numerazione(i):
    h = c.html_slide(c.SLIDES[i], i + 1, len(c.SLIDES), NUMERI)
    assert "{" not in h.split("</style>")[1], "segnaposto non sostituito"
    assert c.LINK in h and f"{i + 1:02d} / {len(c.SLIDES):02d}" in h
    assert "palermodigditaltwin" not in h


def test_la_cornice_resta_sempre_piena_di_immagine():
    for s in c.SLIDES:
        if not s.get("immagine"):
            continue
        w, h, sx, sy = c._crop(s)
        assert sx <= 0 and sy <= 0, s["id"]
        assert sx + w >= c.CARD_W - 1 and sy + h >= c.CARD_H - 1, s["id"]


def test_le_annotazioni_cadono_dentro_la_cornice():
    for s in c.SLIDES:
        if not s.get("crop"):
            continue
        w, h, sx, sy = c._crop(s)
        for a in s["ann"]:
            x, y = sx + a["x"] / c.IMG_W * w, sy + a["y"] / c.IMG_H * h
            if 30 < x < c.CARD_W - 30 and 30 < y < c.CARD_H - 30:
                assert a["t"] in c._annotazioni(s)


@pytest.mark.parametrize("n", range(1, len(c.SLIDES) + 1))
def test_png_1080x1350(n):
    f = ROOT / "social" / "carosello-2" / f"{n:02d}.png"
    assert f.exists(), "manca: esegui scripts/guida_carosello2.py"
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)],
                         capture_output=True, text=True, check=True).stdout.strip()
    assert out == "1080,1350"


def test_il_link_della_chiusura_sta_nella_slide():
    h = c.html_slide(c.SLIDES[-1], len(c.SLIDES), len(c.SLIDES), NUMERI)
    import re
    corpo = int(re.search(r"\.fin \.link\{[^}]*font-size:(\d+)px", h).group(1))
    assert len(c.LINK) * corpo * 0.58 < c.L - 128  # larghezza stimata di un carattere in grassetto


def test_in_chiusura_il_link_compare_una_sola_volta_in_evidenza():
    h = c.html_slide(c.SLIDES[-1], len(c.SLIDES), len(c.SLIDES), NUMERI)
    assert h.count(c.LINK) == 1

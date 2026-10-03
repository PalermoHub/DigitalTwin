import subprocess
from pathlib import Path
import pytest
from guida_carosello4 import SLIDES, html_slide, LINK, L, A

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "social" / "carosello-4"
N = len(SLIDES)


def test_undici_slide_con_testi_e_immagini():
    assert N == 11
    for s in SLIDES:
        assert s["categoria"].strip()
        assert s["titolo"].strip()
        assert s["desc"].strip()
        assert s["hud1"].strip() and s["hud2"].strip()
        assert len(s["stat1"]) == 2 and len(s["stat2"]) == 2 and len(s["stat3"]) == 2


@pytest.mark.parametrize("n", range(1, N + 1))
def test_png_1080x1350_carosello4(n):
    f = OUT / f"{n:02d}.png"
    assert f.exists(), f"manca: {f}"
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True
    ).stdout.strip()
    assert out == f"{L},{A}"


def test_link_e_logo_presenti():
    h = html_slide(SLIDES[0], 1, N, "data:image/png;base64,AAA")
    assert LINK in h
    assert "DIGITAL TWIN PALERMO" in h

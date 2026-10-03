import subprocess
from pathlib import Path

import pytest

from guida_screenshot import passi

ROOT = Path(__file__).resolve().parents[1]


def test_passi_letti_da_javascript():
    p = passi()
    assert [x["id"] for x in p][:3] == ["cos-e", "dati", "strati"]


@pytest.mark.parametrize("p", passi(), ids=lambda p: p["id"])
def test_immagine_esiste_ed_e_1280x720(p):
    f = ROOT / p["immagine"]["file"]
    assert f.exists(), f"manca {f}; esegui scripts/guida_screenshot.py"
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    assert out == "1280,720"

import subprocess
from pathlib import Path

import pytest

import guida_carosello2 as v2
import guida_carosello3 as c

ROOT = Path(__file__).resolve().parents[1]
NUMERI = {"strati": "37", "monumenti": "4.039", "uffici": "605", "sedi": "81"}
N = len(v2.SLIDES)


def test_ogni_slide_ha_uno_sfondo_valido():
    assert len(c.SFONDI) == N
    for eroe, zoom, px, py in c.SFONDI:
        assert eroe in c.HEROES and 1.0 <= zoom <= 1.5 and 0 <= px <= 100 and 0 <= py <= 100


def test_le_vedute_sono_dentro_palermo_e_inclinate():
    for lon, lat, zoom, pitch, bearing in c.HEROES.values():
        assert 13.2 < lon < 13.5 and 38.0 < lat < 38.3 and 12 <= zoom <= 17 and 40 <= pitch <= 70


@pytest.mark.parametrize("i", range(N))
def test_html_senza_segnaposto_con_link_credito_osm_e_numerazione(i):
    h = c.html_slide(v2.SLIDES[i], i + 1, N, NUMERI, c.SFONDI[i])
    assert "{" not in h.split("</style>")[1], "segnaposto non sostituito"
    assert f"{i + 1:02d} / {N:02d}" in h and "OpenStreetMap" in h  # credito della base cartografica obbligatorio
    assert "palermodigditaltwin" not in h


def test_in_chiusura_il_link_e_in_evidenza_una_sola_volta():
    h = c.html_slide(v2.SLIDES[-1], N, N, NUMERI, c.SFONDI[-1])
    assert h.count(c.LINK) == 1


def test_la_cornice_piu_piccola_resta_piena():
    for s in v2.SLIDES:
        if not s.get("crop"):
            continue
        w, h, sx, sy = v2._crop(s, c.CARD_W, c.CARD_H)
        assert sx <= 0 and sy <= 0 and sx + w >= c.CARD_W - 1 and sy + h >= c.CARD_H - 1, s["id"]


@pytest.mark.parametrize("n", range(1, N + 1))
def test_png_1080x1350(n):
    f = ROOT / "social" / "carosello-3" / f"{n:02d}.png"
    assert f.exists(), "manca: esegui scripts/guida_carosello3.py"
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)],
                         capture_output=True, text=True, check=True).stdout.strip()
    assert out == "1080,1350"

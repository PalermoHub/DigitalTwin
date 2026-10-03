import re
import subprocess
from pathlib import Path

import pytest

from guida_screenshot import passi
from guida_video import formatta_vtt

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


MEDIA = ROOT / "media" / "guida"


def test_formatta_vtt_una_cue_per_passo_con_tempi_cumulativi():
    vtt = formatta_vtt([2.0, 3.5], ["Uno.", "Due."])
    assert vtt.startswith("WEBVTT\n")
    assert "00:00:00.000 --> 00:00:02.000\nUno." in vtt
    assert "00:00:02.000 --> 00:00:05.500\nDue." in vtt


def _durata(f):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True).stdout)


@pytest.mark.parametrize("nome", ["guida.mp4", "guida.mp3", "guida.vtt"])
def test_media_esistono(nome):
    assert (MEDIA / nome).stat().st_size > 1000, f"manca media/guida/{nome}: esegui scripts/guida_video.py"


def test_video_e_audio_hanno_la_stessa_durata_della_somma_dei_passi():
    vtt = (MEDIA / "guida.vtt").read_text(encoding="utf-8")
    fine = re.findall(r"--> (\d+):(\d+):(\d+)\.(\d+)", vtt)
    h, m, s, ms = map(int, fine[-1])
    totale = h * 3600 + m * 60 + s + ms / 1000
    assert len(fine) == len(passi())
    assert abs(_durata(MEDIA / "guida.mp4") - totale) < 1.0
    assert abs(_durata(MEDIA / "guida.mp3") - totale) < 1.0


def test_video_e_1280x720_h264_aac():
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", str(MEDIA / "guida.mp4")],
        capture_output=True, text=True, check=True).stdout.split()
    assert "h264,1280,720" in out and any(r.startswith("aac") for r in out)

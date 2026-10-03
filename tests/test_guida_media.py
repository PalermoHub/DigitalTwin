import re
import shutil
import subprocess
from pathlib import Path

import pytest

from guida_screenshot import passi
from guida_video import bitrate_video, cue_per_frase, formatta_vtt

ROOT = Path(__file__).resolve().parents[1]

# senza node o ffprobe questi test si saltano: passi() gira a livello di modulo e un errore interromperebbe tutta la suite
STRUMENTI = bool(shutil.which("node") and shutil.which("ffprobe"))
pytestmark = pytest.mark.skipif(not STRUMENTI, reason="servono node e ffprobe")
PASSI = passi() if STRUMENTI else []


def test_passi_letti_da_javascript():
    p = PASSI
    assert [x["id"] for x in p][:3] == ["cos-e", "dati", "strati"]


@pytest.mark.parametrize("p", PASSI, ids=lambda p: p["id"])
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
    assert len(fine) >= len(PASSI)
    assert all(len(c) <= 260 for c in re.findall(r"-->.*\n(.+)", vtt)), "cue troppo lunga per un sottotitolo"
    assert abs(_durata(MEDIA / "guida.mp4") - totale) < 1.0
    assert abs(_durata(MEDIA / "guida.mp3") - totale) < 1.0


def test_video_e_1280x720_h264_aac():
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", str(MEDIA / "guida.mp4")],
        capture_output=True, text=True, check=True).stdout.split()
    assert "h264,1280,720" in out and any(r.startswith("aac") for r in out)


def test_versione_whatsapp_sotto_i_nove_mega_con_la_stessa_durata():
    f = MEDIA / "guida-whatsapp.mp4"
    assert f.exists(), "manca: esegui scripts/guida_video.py --whatsapp"
    assert f.stat().st_size < 9 * 1024 * 1024
    assert f.stat().st_size > 4 * 1024 * 1024  # non tagliare la qualità più del necessario
    assert abs(_durata(f) - _durata(MEDIA / "guida.mp4")) < 1.0


def test_cue_per_frase_dividono_la_durata_in_proporzione():
    c = cue_per_frase("Una frase breve. Una frase molto più lunga della prima.", 10.0)
    assert [t for _, t in c] == ["Una frase breve.", "Una frase molto più lunga della prima."]
    assert abs(sum(d for d, _ in c) - 10.0) < 1e-9 and c[0][0] < c[1][0]


def test_bitrate_whatsapp_proporzionale_e_con_errore_se_il_video_e_troppo_lungo():
    assert 250_000 < bitrate_video(173.0, 8.5) < 450_000
    with pytest.raises(ValueError, match="troppo lungo"):
        bitrate_video(3000.0, 8.5)

#!/usr/bin/env python3
"""Immagini della pagina di presentazione (img/landing/): schermata dell'app in tema chiaro e scuro e locandina del video.

Uso: python scripts/landing_immagini.py [--solo-piccole]

Con --solo-piccole rifà solo le versioni a 640 px (per srcset sui telefoni) dalle immagini già presenti, senza aprire l'app.

Richiede rete (base cartografica OpenFreeMap), Chromium di Playwright, Pillow e ffmpeg.
"""
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from guida_screenshot import ROOT, _avvia_server, controlla_requisiti  # noqa: E402

DESTINAZIONE = ROOT / "img" / "landing"
LUOGO = "38.11162,13.34856"  # via Imera: la scheda del luogo aperta
VISTA = {"width": 1440, "height": 900}
LARGHEZZA_HERO = 1440


def _schermata(browser, url, scuro):
    ctx = browser.new_context(viewport=VISTA, device_scale_factor=1)
    ctx.add_init_script(
        "try { localStorage.setItem('dt.invito.no', '1'); %s } catch (e) {}" % ("localStorage.setItem('dt-tema', 'scuro');" if scuro else "")
    )
    page = ctx.new_page()
    page.goto(f"{url}/index.html?scheda={LUOGO}")
    page.wait_for_function("window.dt && window.dt.pronto === true", timeout=90000)
    page.wait_for_selector("#scheda:not([hidden])", timeout=60000)
    page.wait_for_timeout(6000)  # tile della base
    png = page.screenshot()
    ctx.close()
    return png


def _webp(immagine, destinazione, qualita=82):
    from PIL import Image  # noqa: F401

    buf = io.BytesIO()
    immagine.save(buf, "PNG")
    destinazione.parent.mkdir(parents=True, exist_ok=True)
    import subprocess

    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "pipe:0", "-quality", str(qualita), str(destinazione)], input=buf.getvalue(), check=True)
    print(f"scritto {destinazione.relative_to(ROOT)} ({destinazione.stat().st_size // 1024} KB)")


PICCOLE = {  # nome della versione piccola: file di partenza
    "scheda": "img/guida/passi/scheda.webp",
    "isole-calore": "img/guida/passi/isole-calore.webp",
    "mappe-storiche": "img/guida/passi/mappe-storiche.webp",
    "monumenti": "img/guida/passi/monumenti.webp",
    "pai": "img/guida/passi/pai.webp",
    "telefono": "img/guida/passi/telefono.webp",
}


def piccole():
    """Versioni a 640 px (e 720 px per l'intestazione) per i telefoni: stesse immagini, meno byte."""
    import subprocess

    lavori = [(ROOT / src, DESTINAZIONE / f"{nome}-640.webp", 640) for nome, src in PICCOLE.items()]
    lavori += [(DESTINAZIONE / f"hero-{t}.webp", DESTINAZIONE / f"hero-{t}-720.webp", 720) for t in ("chiaro", "scuro")]
    for src, dst, larghezza in lavori:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", f"scale={larghezza}:-1", "-quality", "80", str(dst)], check=True)
        print(f"scritto {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} KB)")


def main():
    controlla_requisiti()
    if "--solo-piccole" in sys.argv:
        piccole()
        return
    from PIL import Image
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--disable-gpu"])
            for scuro, nome in ((False, "hero-chiaro.webp"), (True, "hero-scuro.webp")):
                img = Image.open(io.BytesIO(_schermata(browser, url, scuro))).convert("RGB")
                _webp(img.resize((LARGHEZZA_HERO, round(LARGHEZZA_HERO * VISTA["height"] / VISTA["width"])), Image.LANCZOS), DESTINAZIONE / nome)
            browser.close()
    finally:
        proc.kill()
    locandina = Image.open(ROOT / "media" / "guida" / "miniatura.png").convert("RGB")
    _webp(locandina.resize((960, 540), Image.LANCZOS), DESTINAZIONE / "video-locandina.webp", 80)
    piccole()


if __name__ == "__main__":
    main()

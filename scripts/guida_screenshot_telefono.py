#!/usr/bin/env python3
"""Immagine del passo «Sul telefono» della guida (img/guida/passi/telefono.webp), dall'app reale a 390 px.

Uso: python scripts/guida_screenshot_telefono.py

Tre schermate affiancate: la mappa con la barra dei tab, il foglio «Aggiungi» e il menù a comparsa.
Richiede rete (base cartografica OpenFreeMap), Chromium di Playwright, Pillow e ffmpeg.
Il passo è «statico»: non fa parte del video né dei caroselli (che andrebbero rigenerati con la voce).
"""
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from guida_screenshot import ROOT, _avvia_server, _salva_webp, controlla_requisiti  # noqa: E402

TELEFONO = {"width": 390, "height": 844}
TELA = (1280, 720)
SFONDO = (238, 241, 244)
ALTEZZA_TELEFONO = 640  # su 720 di tela
RAGGIO = 26
SPAZIO = 56


def _schermate(browser, url):
    ctx = browser.new_context(viewport=TELEFONO, device_scale_factor=2, has_touch=True, is_mobile=True)
    ctx.add_init_script("try { localStorage.setItem('dt.invito.no', '1'); } catch (e) {}")  # niente invito «Clicca sulla mappa»
    page = ctx.new_page()
    page.goto(url)
    page.wait_for_function("window.dt && window.dt.pronto === true", timeout=90000)
    page.wait_for_timeout(3500)  # tile della base
    scatti = [page.screenshot()]
    page.evaluate("document.querySelector('#barra-tab [data-tab=aggiungi]').click()")
    page.wait_for_timeout(600)
    scatti.append(page.screenshot())
    page.evaluate("document.querySelector('#barra-tab [data-tab=info]').click()")
    page.wait_for_timeout(600)
    scatti.append(page.screenshot())
    ctx.close()
    return scatti


def _compone(scatti):
    from PIL import Image, ImageDraw, ImageFilter

    larghezza = round(ALTEZZA_TELEFONO * TELEFONO["width"] / TELEFONO["height"])
    totale = len(scatti) * larghezza + (len(scatti) - 1) * SPAZIO
    x0 = (TELA[0] - totale) // 2
    y0 = (TELA[1] - ALTEZZA_TELEFONO) // 2
    tela = Image.new("RGB", TELA, SFONDO)
    ombra = Image.new("RGBA", TELA, (0, 0, 0, 0))
    d = ImageDraw.Draw(ombra)
    for i in range(len(scatti)):
        x = x0 + i * (larghezza + SPAZIO)
        d.rounded_rectangle((x, y0 + 8, x + larghezza, y0 + ALTEZZA_TELEFONO + 8), RAGGIO, fill=(20, 30, 45, 70))
    tela.paste(Image.alpha_composite(tela.convert("RGBA"), ombra.filter(ImageFilter.GaussianBlur(14))).convert("RGB"))
    for i, png in enumerate(scatti):
        img = Image.open(io.BytesIO(png)).convert("RGB").resize((larghezza, ALTEZZA_TELEFONO), Image.LANCZOS)
        maschera = Image.new("L", img.size, 0)
        ImageDraw.Draw(maschera).rounded_rectangle((0, 0, *img.size), RAGGIO, fill=255)
        x = x0 + i * (larghezza + SPAZIO)
        tela.paste(img, (x, y0), maschera)
        ImageDraw.Draw(tela).rounded_rectangle((x, y0, x + larghezza - 1, y0 + ALTEZZA_TELEFONO - 1), RAGGIO, outline=(205, 212, 222), width=2)
    buf = io.BytesIO()
    tela.save(buf, "PNG")
    return buf.getvalue()


def main():
    controlla_requisiti()
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            png = _compone(_schermate(browser, url + "/index.html"))
            browser.close()
    finally:
        proc.kill()
    destinazione = ROOT / "img" / "guida" / "passi" / "telefono.webp"
    _salva_webp(png, destinazione)
    print(f"scritto {destinazione.relative_to(ROOT)} ({destinazione.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

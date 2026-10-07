#!/usr/bin/env python3
"""Genera la social card dell'app (img/social-card.jpg, 1200x630) dall'app reale.

Uso: python scripts/social_card.py

Stile della miniatura del video (media/guida/miniatura.png): sfondo scuro sfumato a sinistra, «DIGITAL TWIN» bianco,
«PALERMO» arancione con la barretta, schermata dell'app in cornice arancione, «OPEN DATA SICILIA». Lo sfondo è la mappa vera
(densità di popolazione sugli edifici di Palermo); la schermata in cornice è l'app aperta con la scheda di un luogo.
Richiede rete (base cartografica OpenFreeMap), Chromium di Playwright e Pillow.
Il testo è lo stesso della descrizione della pagina (og:description in index.html): se cambia uno, cambia anche l'altro.
"""
import base64
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from guida_screenshot import ROOT, _avvia_server, controlla_requisiti  # noqa: E402

LARGHEZZA, ALTEZZA = 1200, 630
ARANCIONE = "#f5a623"
TESTO = "Catasto, PRG, popolazione, edifici, rilievo, trasporto pubblico e tanti altri dati su una sola mappa."
FIRMA = "OPEN DATA SICILIA"
STRATI_SFONDO = ["edificato", "coropletico"]
CENTRO, ZOOM = [13.3380, 38.1157], 13.4
LUOGO = "38.11162,13.34856"  # via Imera: la scheda del luogo nella schermata in cornice

# Nasconde l'interfaccia dell'app: resta solo la mappa a tutto schermo
SOLO_MAPPA = """
#pannello, #legende-box, #barra-strati, #area-ricerca, #barra-strumenti, #zoom-box, #strati-chip, #rail-pannelli, .invito-clic, .invito-mai,
#avvisi, #app-header, #app-footer, #apri-strati, #barra-tab, #scheda { display: none !important; }
body { display: block !important; }
#corpo { position: fixed !important; inset: 0 !important; }
#mappa { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; }
"""

OVERLAY = """
<div style="position:fixed;z-index:9998;inset:0;background:linear-gradient(90deg,rgba(14,20,31,.95) 0%,rgba(14,20,31,.86) 36%,rgba(14,20,31,.34) 66%,rgba(14,20,31,0) 100%)"></div>
<div style="position:fixed;z-index:9999;inset:0;font-family:'Montserrat',sans-serif">
  <div style="position:absolute;left:58px;top:46px;line-height:1">
    <div style="font-size:82px;font-weight:700;color:#fff;letter-spacing:-.01em;white-space:nowrap">DIGITAL TWIN</div>
    <div style="margin-top:6px;font-size:104px;font-weight:700;color:@ARANCIONE@;letter-spacing:-.01em">PALERMO</div>
    <div style="margin-top:22px;width:150px;height:8px;background:@ARANCIONE@"></div>
  </div>
  <p style="position:absolute;left:58px;top:318px;width:560px;margin:0;font-size:27px;line-height:1.38;font-weight:500;color:#fff">@TESTO@</p>
  <div style="position:absolute;left:58px;bottom:38px;font-size:27px;font-weight:700;letter-spacing:.02em;color:@ARANCIONE@">@FIRMA@</div>
  <img src="@SCHERMATA@" alt="" style="position:absolute;right:44px;bottom:74px;width:468px;height:auto;border:6px solid @ARANCIONE@;box-shadow:0 10px 36px rgba(0,0,0,.45);display:block">
</div>
"""


def _prepara(page):
    page.wait_for_function("window.dt && window.dt.pronto === true", timeout=90000)


def _schermata_app(browser, url):
    """L'app com'è, con la scheda di un luogo aperta: serve come immagine in cornice."""
    ctx = browser.new_context(viewport={"width": 1350, "height": 860}, device_scale_factor=1)
    ctx.add_init_script("try { localStorage.setItem('dt.invito.no', '1'); } catch (e) {}")
    page = ctx.new_page()
    page.goto(f"{url}/index.html?scheda={LUOGO}")
    _prepara(page)
    page.wait_for_selector("#scheda:not([hidden])", timeout=60000)
    page.wait_for_timeout(5000)
    png = page.screenshot()
    ctx.close()
    return png


def _fondale(browser, url, schermata_png):
    ctx = browser.new_context(viewport={"width": LARGHEZZA, "height": ALTEZZA}, device_scale_factor=2)
    ctx.add_init_script("try { localStorage.setItem('dt.invito.no', '1'); } catch (e) {}")
    page = ctx.new_page()
    page.goto(url + "/index.html")
    _prepara(page)
    page.add_style_tag(content=SOLO_MAPPA)
    page.evaluate(
        """([voluti, centro, zoom]) => {
            for (const cb of document.querySelectorAll('input[id^="strato-"]')) {
                const acceso = voluti.includes(cb.id.slice(7));
                if (cb.checked !== acceso) { cb.checked = acceso; cb.dispatchEvent(new Event('change', { bubbles: true })); }
            }
            window.dt.map.resize();
            window.dt.map.jumpTo({ center: centro, zoom });
        }""",
        [STRATI_SFONDO, CENTRO, ZOOM],
    )
    schermata = "data:image/png;base64," + base64.b64encode(schermata_png).decode()
    html = OVERLAY.replace("@ARANCIONE@", ARANCIONE).replace("@TESTO@", TESTO).replace("@FIRMA@", FIRMA).replace("@SCHERMATA@", schermata)
    page.evaluate("html => document.body.insertAdjacentHTML('beforeend', html)", html)
    page.wait_for_timeout(6000)  # tile della base e dati degli strati
    png = page.screenshot()
    ctx.close()
    return png


def main():
    controlla_requisiti()
    from PIL import Image
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--disable-gpu"])
            png = _fondale(browser, url, _schermata_app(browser, url))
            browser.close()
    finally:
        proc.kill()
    img = Image.open(io.BytesIO(png)).convert("RGB").resize((LARGHEZZA, ALTEZZA), Image.LANCZOS)
    destinazione = ROOT / "img" / "social-card.jpg"
    img.save(destinazione, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"scritto {destinazione.relative_to(ROOT)} ({destinazione.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

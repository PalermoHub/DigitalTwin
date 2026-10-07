#!/usr/bin/env python3
"""Genera la social card dell'app (img/social-card.jpg, 1200x630) dall'app reale.

Uso: python scripts/social_card.py

La mappa è quella vera (densità di popolazione sugli edifici, a Palermo), il pannello a sinistra porta logo e testo.
Richiede rete (base cartografica OpenFreeMap), Chromium di Playwright e Pillow.
Il testo è lo stesso della descrizione della pagina (og:description in index.html): se cambia uno, cambia anche l'altro.
"""
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from guida_screenshot import ROOT, _avvia_server, controlla_requisiti  # noqa: E402

LARGHEZZA, ALTEZZA = 1200, 630
PANNELLO = 500  # larghezza del pannello bianco a sinistra
STRATI = ["edificato", "coropletico"]
CENTRO, ZOOM = [13.3615, 38.1157], 13.5
TITOLO = "Palermo su una sola mappa"
TESTO = "Catasto, PRG, popolazione, edifici e trasporto pubblico, da dati aperti."
FIRMA = "by OpenDataSicilia"

# Nasconde l'interfaccia dell'app: resta solo la mappa a tutto schermo
SOLO_MAPPA = """
#pannello, #legende-box, #barra-strati, #area-ricerca, #barra-strumenti, #zoom-box, #strati-chip, #rail-pannelli, .invito-clic, .invito-mai,
#avvisi, #app-header, #app-footer, #apri-strati, #barra-tab, #scheda { display: none !important; }
body { display: block !important; }
#corpo { position: fixed !important; inset: 0 !important; }
#mappa { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; }
"""

OVERLAY = f"""
<div id="card-pannello" style="position:fixed;z-index:9999;left:0;top:0;bottom:0;width:{PANNELLO}px;box-sizing:border-box;padding:56px 52px 40px;
  display:flex;flex-direction:column;justify-content:space-between;background:#fff;box-shadow:12px 0 40px rgba(20,30,45,.22);font-family:'Montserrat',sans-serif;color:#1c2128">
  <img src="img/logo-palermo-digital-twin.svg" alt="" style="width:300px;height:auto;display:block">
  <div>
    <h1 style="margin:0 0 18px;font-size:46px;line-height:1.08;font-weight:700;letter-spacing:-.01em">{TITOLO}</h1>
    <p style="margin:0;font-size:22px;line-height:1.4;font-weight:500;color:#4a5563;max-width:390px">{TESTO}</p>
  </div>
  <div style="display:flex;align-items:center;gap:14px">
    <span style="display:block;width:44px;height:5px;border-radius:3px;background:#e8a838"></span>
    <span style="font-size:20px;font-weight:600;color:#1c2128">{FIRMA}</span>
  </div>
</div>
"""


def main():
    controlla_requisiti()
    from PIL import Image
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--disable-gpu"])
            ctx = browser.new_context(viewport={"width": LARGHEZZA, "height": ALTEZZA}, device_scale_factor=2)
            ctx.add_init_script("try { localStorage.setItem('dt.invito.no', '1'); } catch (e) {}")
            page = ctx.new_page()
            page.goto(url + "/index.html")
            page.wait_for_function("window.dt && window.dt.pronto === true", timeout=90000)
            page.add_style_tag(content=SOLO_MAPPA)
            page.evaluate(
                """([voluti, centro, zoom, padding]) => {
                    for (const cb of document.querySelectorAll('input[id^="strato-"]')) {
                        const acceso = voluti.includes(cb.id.slice(7));
                        if (cb.checked !== acceso) { cb.checked = acceso; cb.dispatchEvent(new Event('change', { bubbles: true })); }
                    }
                    window.dt.map.resize();
                    window.dt.map.jumpTo({ center: centro, zoom, padding: { left: padding, top: 0, right: 0, bottom: 0 } });
                }""",
                [STRATI, CENTRO, ZOOM, PANNELLO],
            )
            page.evaluate("html => document.body.insertAdjacentHTML('beforeend', html)", OVERLAY)
            page.wait_for_timeout(6000)  # tile della base e dati degli strati
            png = page.screenshot()
            browser.close()
    finally:
        proc.kill()
    img = Image.open(io.BytesIO(png)).convert("RGB").resize((LARGHEZZA, ALTEZZA), Image.LANCZOS)
    destinazione = ROOT / "img" / "social-card.jpg"
    img.save(destinazione, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"scritto {destinazione.relative_to(ROOT)} ({destinazione.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

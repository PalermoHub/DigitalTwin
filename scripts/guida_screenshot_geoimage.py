#!/usr/bin/env python3
"""Screenshot dei passi di Geoimage nella guida (img/guida/passi/geoimage-*.webp), dall'app reale.

Uso: python scripts/guida_screenshot_geoimage.py [--solo <id>] [--png <cartella>]

Richiede rete (base cartografica e tile dell'Atlante storico) e Chromium di Playwright; avvia da sola il server dell'app.
La «mappa storica» di esempio è la «Nuova pianta di Palermo» del 1891 (C. Clausen, Harvard Map Collection, via Atlante
storico OpenDataSicilia, CC BY 4.0): si cattura dal canvas, si ruota di qualche grado e si ricarica come file, così il
GCP del passo 2 ha una verità nota (la vista da cui nasce l'immagine).
"""
import argparse
import io
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from guida_screenshot import ROOT, VIEWPORT, _avvia_server, _imposta_strati, _salva_webp  # noqa: E402

CENTRO = [13.3605, 38.1190]  # via Maqueda / Quattro Canti: la pianta del 1891 qui è fitta di dettagli
ZOOM = 15.4
ANGOLO = 7  # gradi di rotazione dell'immagine rispetto al nord: l'allineamento ai GCP li dovrà correggere
CARTA = (232, 220, 196)
# quattro punti ben distribuiti dell'immagine originale (pixel del canvas): diventano i GCP
PUNTI = [(300, 220), (720, 220), (300, 440), (720, 440)]  # a sinistra del pannello, quando la vista è quella d'origine


def _apri(browser, url):
    page = browser.new_page(viewport=VIEWPORT)
    page.add_init_script("try { localStorage.setItem('dt.invito.no', '1'); } catch (e) {}")  # niente invito «Clicca sulla mappa»
    page.goto(url)
    page.wait_for_function("window.dt && window.dt.pronto === true", timeout=90000)
    page.evaluate("document.getElementById('crediti')?.open && document.getElementById('crediti').close()")
    page.add_style_tag(content="#avvisi { display: none }")  # gli avvisi «strato non caricato» dipendono dai dati locali, non dalla guida
    _imposta_strati(page, [])  # la mappa storica e la base, senza strati tematici che sporcano l'immagine
    page.wait_for_timeout(500)
    return page


def _crea_immagine(browser, url):
    """Cattura la pianta del 1891 dal canvas, la ruota e restituisce (png, [(px, py, lng, lat)] dei punti noti)."""
    from PIL import Image

    page = _apri(browser, url)
    page.evaluate(
        """([c, z]) => {
          const m = window.dt.map;
          for (const l of m.getStyle().layers) m.setLayoutProperty(l.id, 'visibility', l.id === 'base-st-1891' ? 'visible' : 'none');
          m.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 });
        }""",
        [CENTRO, ZOOM],
    )
    page.wait_for_function("window.dt.map.loaded()", timeout=60000)
    page.wait_for_timeout(2500)
    dati = page.evaluate(
        """async () => {
          const m = window.dt.map;
          const url = await new Promise(ok => { m.once('render', () => ok(m.getCanvas().toDataURL('image/png'))); m.triggerRepaint(); });
          return url;
        }"""
    )
    geo = page.evaluate(
        "pts => pts.map(([x, y]) => { const p = window.dt.map.unproject([x, y]); return [p.lng, p.lat]; })",
        [list(p) for p in PUNTI],
    )
    page.close()
    import base64

    orig = Image.open(io.BytesIO(base64.b64decode(dati.split(",", 1)[1]))).convert("RGB")
    larg, alt = orig.size
    ruotata = orig.rotate(ANGOLO, expand=True, resample=Image.BICUBIC, fillcolor=CARTA)
    t = math.radians(ANGOLO)
    punti = []
    for (x, y), (lng, lat) in zip(PUNTI, geo):
        dx, dy = x - larg / 2, y - alt / 2
        px = dx * math.cos(t) + dy * math.sin(t) + ruotata.width / 2
        py = -dx * math.sin(t) + dy * math.cos(t) + ruotata.height / 2
        punti.append((round(px), round(py), lng, lat))
    buf = io.BytesIO()
    ruotata.save(buf, "PNG")
    return buf.getvalue(), punti


def _carica(browser, url, png):
    page = _apri(browser, url)
    page.click("#rail-pannelli [data-pannello=geoimage]")
    page.wait_for_selector("#geoimage-pannello:not([hidden]):not(.collassato)")
    page.evaluate("([c, z]) => window.dt.map.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 })", [CENTRO, ZOOM])
    page.set_input_files("#gi-file", files=[{"name": "palermo-1891.png", "mimeType": "image/png", "buffer": png}])
    page.wait_for_selector(".gi-overlay:not([hidden]) .gi-immagine[src]")
    page.wait_for_selector(".gi-angolo")
    page.wait_for_function("!window.dt.map.isMoving()")
    page.wait_for_timeout(2000)
    return page


def _schermo(page, px, py):
    """Posizione sullo schermo del pixel (px, py) dell'immagine caricata (la mappa sta a pitch 0: la trasformazione è affine)."""
    return page.evaluate(
        """([px, py]) => {
          const g = window.dt.geoimage.stato, m = window.dt.map, r = m.getCanvas().getBoundingClientRect();
          const [no, ne, so] = [0, 1, 2].map(i => m.project([g.angoli[i].lng, g.angoli[i].lat]));
          const u = px / g.immagine.larghezza, v = py / g.immagine.altezza;
          return [r.left + no.x + u * (ne.x - no.x) + v * (so.x - no.x), r.top + no.y + u * (ne.y - no.y) + v * (so.y - no.y)];
        }""",
        [px, py],
    )


def _aggiungi_gcp(page, punti):
    # la base si guarda dalla vista d'origine dell'immagine: lì i luoghi dei GCP cadono nel punto in cui li abbiamo misurati
    page.evaluate("([c, z]) => window.dt.map.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 })", [CENTRO, ZOOM])
    page.wait_for_timeout(1500)
    page.keyboard.press("g")
    for px, py, lng, lat in punti:
        sx, sy = _schermo(page, px, py)
        page.mouse.click(sx, sy)  # passo 1: sull'immagine
        page.wait_for_timeout(250)
        x, y = page.evaluate(
            "([lng, lat]) => { const p = window.dt.map.project([lng, lat]), r = window.dt.map.getCanvas().getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }",
            [lng, lat],
        )
        page.mouse.click(x, y)  # passo 2: stesso luogo sulla base
        page.wait_for_timeout(250)


def _vedi(page, selettore):
    page.locator(selettore).scroll_into_view_if_needed()
    page.wait_for_timeout(500)


# I passi si susseguono sulla stessa pagina, come farebbe chi usa Geoimage: ognuno parte da dove ha lasciato il precedente.
def carica(page, punti):
    pass  # l'immagine è appena stata caricata: maniglie e pannello iniziale


def gcp(page, punti):
    _aggiungi_gcp(page, punti)
    page.keyboard.press("Escape")  # esce dalla modalità GCP
    _vedi(page, "#gi-allinea")


def allinea(page, punti):
    page.click("#gi-allinea")
    page.wait_for_function("!window.dt.map.isMoving()")
    page.wait_for_timeout(1500)
    _vedi(page, "#gi-rmse")


def swipe(page, punti):
    page.click("#gi-swipe")
    page.wait_for_timeout(800)
    _vedi(page, "#gi-swipe")


def spotlight(page, punti):
    page.click("#gi-swipe")  # Swipe e Spotlight si escludono, ma si spegne comunque lo Swipe prima di cambiare
    page.click("#gi-spotlight")
    page.mouse.move(430, 390)
    page.mouse.move(440, 380)
    page.wait_for_timeout(800)
    _vedi(page, "#gi-spotlight")


def esporta(page, punti):
    page.click("#gi-spotlight")
    page.click("#gi-geotiff")
    page.wait_for_selector("#gi-gtiff:not([hidden])")
    _vedi(page, "#gi-gtiff-vai")


PASSI = {"geoimage-carica": carica, "geoimage-gcp": gcp, "geoimage-allinea": allinea,
         "geoimage-swipe": swipe, "geoimage-spotlight": spotlight, "geoimage-esporta": esporta}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo")
    ap.add_argument("--png", help="salva anche i PNG a piena risoluzione in questa cartella (per controllarli a occhio)")
    args = ap.parse_args(argv)
    if args.solo not in (None, *PASSI):
        sys.exit(f"passo sconosciuto: {args.solo}")
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            immagine, punti = _crea_immagine(browser, url + "/index.html")
            page = _carica(browser, url + "/index.html", immagine)
            for id_, passo in PASSI.items():  # --solo ferma la corsa al passo voluto: i precedenti servono a portare lì la pagina
                passo(page, punti)
                png = page.screenshot()
                if args.png:
                    Path(args.png).mkdir(parents=True, exist_ok=True)
                    (Path(args.png) / f"{id_}.png").write_bytes(png)
                _salva_webp(png, ROOT / "img" / "guida" / "passi" / f"{id_}.webp")
                print("ok", id_, flush=True)
                if id_ == args.solo:
                    break
            browser.close()
    finally:
        proc.kill()


if __name__ == "__main__":
    main()

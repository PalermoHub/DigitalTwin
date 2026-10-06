#!/usr/bin/env python3
"""Screenshot dei passi RNDT della guida (img/guida/passi/rndt-*.webp), dall'app reale.

Uso: python scripts/guida_screenshot_rndt.py [--solo <id>] [--png <cartella>]

Richiede rete (catalogo RNDT e base cartografica), Chromium di Playwright e due server già in esecuzione:
  - l'app:        python scripts/serve.py 8000
  - il proxy:     cd worker && npx wrangler dev --port 8787   (vedi docs/RNDT.md)
Il passo «rndt-catalogo» dipende dal catalogo online: se il catalogo cambia, cambia anche l'immagine.
"""
import argparse
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from guida_screenshot import ROOT, VIEWPORT, _salva_webp  # noqa: E402

APP = "http://127.0.0.1:8000"
PROXY = "http://127.0.0.1:8787"
URL = f"{APP}/index.html?rndt-proxy={PROXY.replace(':', '%3A').replace('/', '%2F')}"
MONTE = [13.30, 38.10]  # le colline a ovest di Palermo (Monte Cuccio, Boccadifalco): qui ci sono aree PAI da frana


def _raggiungibile(url):
    try:
        urllib.request.urlopen(url, timeout=3)
        return True
    except Exception as e:  # un 4xx/5xx del proxy senza percorso vale comunque «è acceso»
        return hasattr(e, "code")


def _apri(browser):
    page = browser.new_page(viewport=VIEWPORT)
    page.add_init_script("try { localStorage.setItem('dt.invito.no', '1'); } catch (e) {}")  # niente invito «Clicca sulla mappa»
    page.goto(URL)
    page.wait_for_function("window.dt && window.dt.pronto === true", timeout=90000)
    return page


def _vai(page, centro, zoom):
    page.evaluate("([c, z]) => window.dt.map.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 })", [centro, zoom])
    page.wait_for_timeout(1500)


def _aggiungi_pai(page):
    """Aggiunge dal catalogo il WFS «PAI Frane» (elementi interrogabili) e richiude il catalogo.
    I file del computer stanno nell'albero «I miei layer», che la scheda non interroga: per il gruppo RNDT e per la scheda serve un layer del catalogo."""
    catalogo(page)
    page.locator("#rndt-pannello .ordt-result-title").nth(1).click()  # «Aree a pericolosità da frana PAI - Dataset»
    page.get_by_role("button", name="Add features").first.click()
    page.wait_for_function("document.querySelectorAll('#gruppo-rndt input[type=checkbox]').length > 0", timeout=60000)
    page.wait_for_function("window.dt.map.getStyle().layers.some(l => /^rndt-.*-fill$/.test(l.id))", timeout=30000)
    page.click("#rndt-pannello .pannello-chiudi")
    page.wait_for_timeout(1500)


def _punto_pai(page):
    """Un punto dello schermo dentro un'area PAI visibile, al centro della mappa."""
    return page.evaluate(
        """() => {
          const m = window.dt.map, r = m.getCanvas().getBoundingClientRect();
          const id = m.getStyle().layers.find(l => /^rndt-.*-fill$/.test(l.id)).id;
          const c = { x: r.width / 2, y: r.height / 2 };
          const fs = m.queryRenderedFeatures(undefined, { layers: [id] });
          if (!fs.length) return null;
          let best = null, d = 1e9;
          for (let x = 40; x < r.width - 40; x += 20) for (let y = 40; y < r.height - 40; y += 20) {
            const dd = Math.hypot(x - c.x, y - c.y);
            if (dd < d && m.queryRenderedFeatures([x, y], { layers: [id] }).length) { d = dd; best = [r.left + x, r.top + y]; }
          }
          return best;
        }"""
    )


def catalogo(page):
    page.click("#btn-rndt")
    campo = page.get_by_placeholder("Search titles, abstracts, keywords")
    campo.fill("idrogeologico")
    campo.press("Enter")
    page.wait_for_selector("#rndt-pannello .ordt-result", timeout=45000)
    page.wait_for_timeout(1500)


def gruppo(page):
    _aggiungi_pai(page)
    _vai(page, MONTE, 12.5)
    page.click("#btn-gruppo-rndt")
    page.wait_for_timeout(800)


def info(page):
    _aggiungi_pai(page)
    _vai(page, MONTE, 13.5)
    punto = _punto_pai(page)
    if not punto:
        raise SystemExit("nessuna area PAI visibile: cambia MONTE/zoom")
    page.mouse.click(*punto)
    # la linguetta ha un contatore ("Altri dati (RNDT)6"): come in guida_screenshot.py si cerca con una regex sul testo intero
    page.locator("#scheda").get_by_text(re.compile(r"^Altri dati \(RNDT\)\d*$")).first.click(timeout=30000)
    page.wait_for_function("!document.querySelector('#scheda')?.innerText.includes('Interrogazione dei servizi in corso')", timeout=30000)
    page.wait_for_timeout(1200)


PASSI = {"rndt-catalogo": catalogo, "rndt-gruppo": gruppo, "rndt-info": info}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo")
    ap.add_argument("--png", help="salva anche i PNG a piena risoluzione in questa cartella (per controllarli a occhio)")
    args = ap.parse_args(argv)
    for nome, url in (("app", APP + "/"), ("proxy", PROXY + "/")):
        if not _raggiungibile(url):
            sys.exit(f"{nome} non raggiungibile su {url}: vedi l'intestazione di questo file")
    elenco = [i for i in PASSI if args.solo in (None, i)]
    if not elenco:
        sys.exit(f"passo sconosciuto: {args.solo}")
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for id_ in elenco:
            page = _apri(browser)
            PASSI[id_](page)
            png = page.screenshot()
            if args.png:
                Path(args.png).mkdir(parents=True, exist_ok=True)
                (Path(args.png) / f"{id_}.png").write_bytes(png)
            _salva_webp(png, ROOT / "img" / "guida" / "passi" / f"{id_}.webp")
            print("ok", id_)
            page.close()
        browser.close()


if __name__ == "__main__":
    main()

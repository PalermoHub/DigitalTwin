#!/usr/bin/env python3
"""Rigenera gli screenshot della guida (img/guida/passi/<id>.webp) dall'app reale.

Uso: python scripts/guida_screenshot.py [--solo <id>]
Richiede rete (base cartografica OpenFreeMap) e Chromium di Playwright.
"""
import argparse
import json
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWPORT = {"width": 1280, "height": 720}


def controlla_requisiti():
    for exe in ("node", "ffmpeg"):
        if not shutil.which(exe):
            sys.exit(f"manca {exe}: installalo (node serve a leggere i contenuti della guida, ffmpeg a creare i WebP)")
    try:
        import playwright  # noqa: F401
    except ImportError:
        sys.exit("manca playwright: python3 -m pip install playwright && python3 -m playwright install chromium")


def passi():
    out = subprocess.run(
        ["node", "-e", "import('./js/core/guida-contenuti.js').then(m=>console.log(JSON.stringify(m.PASSI)))"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout
    # i passi «statici» (RNDT) hanno immagini proprie (guida_screenshot_rndt.py) e non entrano né qui né nel video
    return [p for p in json.loads(out) if not p.get("statico")]


def _avvia_server():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        porta = s.getsockname()[1]
    proc = subprocess.Popen([sys.executable, str(ROOT / "scripts" / "serve.py"), str(porta)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    url = f"http://127.0.0.1:{porta}"
    for _ in range(50):
        try:
            urllib.request.urlopen(url + "/", timeout=0.5)
            return proc, url
        except Exception:
            time.sleep(0.1)
    proc.kill()
    raise RuntimeError("server non partito")


def _imposta_strati(page, voluti):
    page.evaluate(
        """voluti => {
            for (const cb of document.querySelectorAll('input[id^="strato-"]')) {
                const id = cb.id.slice(7), v = voluti.includes(id);
                if (cb.checked !== v && !cb.disabled) { cb.checked = v; cb.dispatchEvent(new Event('change', { bubbles: true })); }
            }
        }""",
        voluti,
    )


def _punto_su(page, layer, filtro):
    """Coordinate dello schermo di un punto della mappa dove il layer ha un elemento con le proprietà `filtro`."""
    return page.evaluate(
        """([layer, filtro]) => {
            const m = window.dt.map, r = m.getCanvas().getBoundingClientRect();
            for (let y = 80; y < r.height - 80; y += 24)
                for (let x = 120; x < r.width - 380; x += 24) {
                    const hit = m.queryRenderedFeatures([x, y], { layers: [layer] })
                        .find(f => Object.entries(filtro).every(([k, v]) => f.properties[k] === v));
                    if (hit) return [r.left + x, r.top + y];
                }
            return null;
        }""",
        [layer, filtro],
    )


def _macro_ordine(page):
    page.locator("#pannello summary").filter(has_text="Ordine layer in mappa").first.click()
    page.wait_for_timeout(500)


def _macro_storiche(page):
    # porta in vista «Mappe storiche» e accende una carta
    page.locator("#pannello h3").filter(has_text="Mappe storiche").first.evaluate("e => e.scrollIntoView({ block: 'start' })")
    page.locator("#pannello .base-griglia button, #pannello .base-griglia label").filter(has_text="1891").first.click()
    page.wait_for_timeout(2500)


def _macro_colori(page):
    # Edificato colorato per densità di popolazione con una scala Crameri
    page.evaluate("""() => document.querySelector("button[aria-label^='Colori di Edificato']").click()""")
    page.wait_for_timeout(500)
    sel = page.locator(".tema-riga select:visible")
    sel.nth(0).select_option("dens_pop_ha")
    sel.nth(1).select_option("graduata")
    page.wait_for_timeout(300)
    page.locator(".rampa-scelta:visible").first.click()  # la rampa è un elenco personalizzato
    page.locator(".rampa-elenco:visible [role=option]").filter(has_text="Batlow").first.click()
    page.wait_for_timeout(1500)
    page.evaluate("document.querySelector('.tema-riga select:not([hidden])') && document.querySelector('#pannello').scrollTo(0, 120)")


def _macro_stampa(page):
    page.click("#btn-stampa")
    page.wait_for_selector("#stampa-menu:not([hidden])")


MACRO = {"ordine": _macro_ordine, "storiche": _macro_storiche, "colori": _macro_colori, "stampa": _macro_stampa}


def _prepara(page, scena):
    page.evaluate("document.getElementById('crediti')?.open && document.getElementById('crediti').close()")
    page.evaluate("document.querySelector('.invito-clic')?.remove()")  # l'invito d'avvio copre la mappa
    _imposta_strati(page, scena["strati"])
    lon, lat = scena["centro"]
    page.evaluate("([c, z]) => window.dt.map.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 })", [[lon, lat], scena["zoom"]])
    page.wait_for_function("window.dt.map.loaded()", timeout=30000)
    if "rail" in scena:  # apre un tab della barra verticale a sinistra
        page.click("#" + scena["rail"])
        page.wait_for_timeout(600)
    if "gruppo" in scena:  # apre un gruppo del tab Layer e lo porta in cima al pannello
        s = page.locator("#pannello summary").filter(has_text=re.compile(rf"^\s*{scena['gruppo']}")).first
        s.click()
        s.evaluate("e => e.scrollIntoView({ block: 'start' })")
        page.wait_for_timeout(300)
    if "macro" in scena:
        MACRO[scena["macro"]](page)
    if "clicSu" in scena:
        page.wait_for_timeout(4000)  # tile del layer
        c = scena["clicSu"]
        punto = _punto_su(page, c["layer"], c.get("filtro", {}))
        if punto is None:
            raise RuntimeError(f"nessun elemento di {c['layer']} {c.get('filtro')} in vista")
        page.mouse.click(*punto)
        page.wait_for_selector("#scheda:not([hidden])", timeout=15000)
        if "schedaTab" in scena:
            page.locator("#scheda").get_by_text(re.compile(rf"^{scena['schedaTab']}\d*$")).first.click()
    if "clic" in scena:
        x, y = page.evaluate(
            """([lon, lat]) => { const m = window.dt.map, p = m.project([lon, lat]), r = m.getCanvas().getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }""",
            scena["clic"],
        )
        page.mouse.click(x, y)
        page.wait_for_selector("#scheda:not([hidden])", timeout=15000)
        if "schedaTab" in scena:
            page.locator("#scheda").get_by_text(re.compile(rf"^{scena['schedaTab']}\s*\d*$")).first.click()
    if "schedaApri" in scena:  # apre un blocco comprimibile della scheda (il clic lo porta anche in vista)
        page.locator("#scheda").get_by_text(re.compile(scena["schedaApri"], re.I)).first.click()
        page.wait_for_timeout(300)
    if "ricerca" in scena:
        r = scena["ricerca"]
        if r.get("apriFiltri"):
            page.click("#cerca-filtri")
            page.wait_for_selector("#pannello-filtri:not([hidden])")
        if "circ" in r:
            page.select_option("#f-circ", index=r["circ"])
        page.fill("#cerca-testo", r["testo"])
        page.wait_for_selector("#cerca-risultati:not([hidden])", timeout=15000)
        page.wait_for_timeout(2500)
        page.evaluate("document.getElementById('cerca-risultati').scrollTop = 0")
    if scena.get("ritaglio") == "#crediti":
        page.click('#menu-info [data-scheda="fonti"]')
        page.wait_for_selector("#crediti[open]")
    page.wait_for_timeout(1200)  # fine animazioni e tile


def _salva_webp(png, destinazione):
    destinazione.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", "pipe:0", "-vf", "scale=1280:720", "-quality", "82", str(destinazione)],
        input=png, check=True,
    )


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo")
    ap.add_argument("--scala", type=float, default=1, help="device scale factor; con --dest per sorgenti ad alta risoluzione")
    ap.add_argument("--dest", help="cartella dove salvare <id>.png a piena risoluzione (invece dei WebP della guida)")
    args = ap.parse_args(argv)
    controlla_requisiti()
    elenco = [p for p in passi() if args.solo in (None, p["id"])]
    if not elenco:
        sys.exit(f"passo sconosciuto: {args.solo}")
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for p in elenco:
                ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=args.scala)
                page = ctx.new_page()
                page.goto(url + "/index.html")
                page.wait_for_function("window.dt && window.dt.pronto === true", timeout=60000)
                _prepara(page, p["scena"])
                png = page.screenshot()
                if args.dest:
                    dest = Path(args.dest)
                    dest.mkdir(parents=True, exist_ok=True)
                    (dest / f"{p['id']}.png").write_bytes(png)
                else:
                    _salva_webp(png, ROOT / p["immagine"]["file"])
                print("ok", p["id"])
                ctx.close()
            browser.close()
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()

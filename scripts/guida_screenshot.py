#!/usr/bin/env python3
"""Rigenera gli screenshot della guida (img/guida/passi/<id>.webp) dall'app reale.

Uso: python scripts/guida_screenshot.py [--solo <id>]
Richiede rete (base cartografica OpenFreeMap) e Chromium di Playwright.
"""
import argparse
import json
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWPORT = {"width": 1280, "height": 720}


def passi():
    out = subprocess.run(
        ["node", "-e", "import('./js/core/guida-contenuti.js').then(m=>console.log(JSON.stringify(m.PASSI)))"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


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


def _prepara(page, scena):
    page.evaluate("document.getElementById('crediti')?.open && document.getElementById('crediti').close()")
    _imposta_strati(page, scena["strati"])
    lon, lat = scena["centro"]
    page.evaluate("([c, z]) => window.dt.map.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 })", [[lon, lat], scena["zoom"]])
    page.wait_for_function("window.dt.map.loaded()", timeout=30000)
    if "gruppo" in scena:  # apre un gruppo della barra strati
        page.locator("#barra-gruppi").get_by_text(scena["gruppo"], exact=True).first.click()
    if "clic" in scena:
        x, y = page.evaluate(
            """([lon, lat]) => { const m = window.dt.map, p = m.project([lon, lat]), r = m.getCanvas().getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }""",
            scena["clic"],
        )
        page.mouse.click(x, y)
        page.wait_for_selector("#scheda:not([hidden])", timeout=15000)
        if "schedaTab" in scena:
            page.locator("#scheda").get_by_text(scena["schedaTab"], exact=True).first.click()
    if "ricerca" in scena:
        r = scena["ricerca"]
        if r.get("apriFiltri"):
            page.click("#cerca-filtri")
            page.wait_for_selector("#pannello-filtri:not([hidden])")
        if "circ" in r:
            page.select_option("#f-circ", index=r["circ"])
        page.fill("#cerca-testo", r["testo"])
        page.wait_for_selector("#cerca-risultati:not([hidden])", timeout=15000)
    if scena.get("ritaglio") == "#crediti":
        page.click("#apri-crediti")
        page.wait_for_selector("#crediti[open]")
        page.click("#tab-fonti")
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
    args = ap.parse_args(argv)
    elenco = [p for p in passi() if args.solo in (None, p["id"])]
    if not elenco:
        sys.exit(f"passo sconosciuto: {args.solo}")
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for p in elenco:
                ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=1)
                page = ctx.new_page()
                page.goto(url + "/index.html")
                page.wait_for_function("window.dt && window.dt.pronto === true", timeout=60000)
                _prepara(page, p["scena"])
                png = page.screenshot()
                _salva_webp(png, ROOT / p["immagine"]["file"])
                print("ok", p["id"])
                ctx.close()
            browser.close()
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()

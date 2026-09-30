import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def _porta_libera():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def server():
    porta = _porta_libera()
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "scripts" / "serve.py"), str(porta)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    url = f"http://127.0.0.1:{porta}"
    for _ in range(50):
        try:
            urllib.request.urlopen(url + "/", timeout=0.5)
            break
        except Exception:
            time.sleep(0.1)
    else:
        proc.kill()
        raise RuntimeError("server non partito")
    yield url
    proc.terminate()
    proc.wait(timeout=5)

import struct
import zlib


def _png_1x1():
    """PNG 1x1 grigio valido, con CRC corretti (un PNG malformato fa fallire le tile in modo intermittente)."""
    def blocco(tipo, dati):
        crc = zlib.crc32(tipo + dati) & 0xFFFFFFFF
        return struct.pack(">I", len(dati)) + tipo + dati + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 0, 0, 0, 0)  # 1x1, 8 bit, scala di grigi
    idat = zlib.compress(b"\x00\x80")  # filtro 0 + un pixel grigio
    return b"\x89PNG\r\n\x1a\n" + blocco(b"IHDR", ihdr) + blocco(b"IDAT", idat) + blocco(b"IEND", b"")


PNG_1X1 = _png_1x1()


class Pagina:
    def __init__(self, page, errori):
        self.page = page
        self.errori = errori

    def attendi_pronto(self):
        self.page.wait_for_function("window.dt && window.dt.pronto === true", timeout=60000)

    def js(self, espressione):
        return self.page.evaluate(espressione)

    def vai(self, lon, lat, zoom):
        """Sposta la mappa e attende che abbia finito di caricare i tile."""
        self.page.evaluate(
            """([lon, lat, zoom]) => new Promise(r => {
                const m = window.dt.map;
                m.once('idle', r);
                m.jumpTo({ center: [lon, lat], zoom });
            })""",
            [lon, lat, zoom],
        )

    def punto_in(self, sorgente, strato, layer_hit):
        """Coordinate di un punto che la mappa, così com'è, riconosce dentro `layer_hit`.

        Prende i vertici medi delle feature già caricate di `sorgente/strato` e tiene il primo
        punto per cui queryRenderedFeatures restituisce davvero `layer_hit`.
        """
        return self.js(
            f"""() => {{
                const m = window.dt.map;
                const feats = m.querySourceFeatures('{sorgente}', {{ sourceLayer: '{strato}' }});
                for (const f of feats.slice(0, 200)) {{
                    const g = f.geometry;
                    const anello = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates[0][0];
                    const n = anello.length - 1;
                    const c = anello.slice(0, n).reduce((a, q) => [a[0] + q[0] / n, a[1] + q[1] / n], [0, 0]);
                    const hit = m.queryRenderedFeatures(m.project(c), {{ layers: ['{layer_hit}'] }});
                    if (hit.length) return c;
                }}
                return null;
            }}"""
        )

    def clic(self, lon, lat):
        x, y = self.js(
            f"""(() => {{
                const m = window.dt.map, p = m.project([{lon}, {lat}]);
                const r = m.getCanvas().getBoundingClientRect();
                return [r.left + p.x, r.top + p.y];
            }})()"""
        )
        self.page.mouse.click(x, y)


@pytest.fixture(scope="session")
def _browser():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        yield browser
        browser.close()


@pytest.fixture
def apri(server, _browser):
    """apri(blocca=None) -> Pagina. `blocca` è un pattern di URL da far fallire."""
    contesti = []

    def _apri(blocca=None):
        ctx = _browser.new_context(viewport={"width": 1280, "height": 800})
        contesti.append(ctx)
        page = ctx.new_page()
        errori = []
        page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errori.append(str(e)))
        page.route(
            "https://tile.openstreetmap.org/**",
            lambda r: r.fulfill(status=200, content_type="image/png", body=PNG_1X1),
        )
        if blocca:
            page.route(blocca, lambda r: r.abort())
        page.goto(server + "/index.html")
        return Pagina(page, errori)

    yield _apri
    for c in contesti:
        c.close()

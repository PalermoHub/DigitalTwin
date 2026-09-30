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

import base64

PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=="
)


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

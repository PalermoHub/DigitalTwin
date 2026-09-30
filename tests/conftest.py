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

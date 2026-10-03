import pytest

import guida_screenshot as g


def test_requisiti_mancanti_danno_un_messaggio_chiaro_non_un_traceback(monkeypatch):
    monkeypatch.setattr(g.shutil, "which", lambda n: None if n == "node" else "/usr/bin/" + n)
    with pytest.raises(SystemExit) as e:
        g.controlla_requisiti()
    assert "node" in str(e.value)

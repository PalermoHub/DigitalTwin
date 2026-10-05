"""Geoimage nel pannello di destra: tab, caricamento dell'immagine, maniglie, GCP, confronto, persistenza ed export."""
import struct
import zlib

import pytest


def _png(larghezza=400, altezza=300):
    """PNG RGB con un gradiente, valido (CRC corretti)."""
    def blocco(tipo, dati):
        return struct.pack(">I", len(dati)) + tipo + dati + struct.pack(">I", zlib.crc32(tipo + dati) & 0xFFFFFFFF)

    righe = b"".join(
        b"\x00" + b"".join(bytes((x * 255 // larghezza, y * 255 // altezza, 128)) for x in range(larghezza))
        for y in range(altezza)
    )
    ihdr = struct.pack(">IIBBBBB", larghezza, altezza, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + blocco(b"IHDR", ihdr) + blocco(b"IDAT", zlib.compress(righe)) + blocco(b"IEND", b"")


def _apri_geoimage(v):
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.click("#rail-pannelli [data-pannello=geoimage]")
    v.page.wait_for_selector("#geoimage-pannello:not([hidden]):not(.collassato)")


def _carica(v, nome="storica.png"):
    v.page.set_input_files("#gi-file", files=[{"name": nome, "mimeType": "image/png", "buffer": _png()}])
    v.page.wait_for_selector(".gi-overlay:not([hidden]) .gi-immagine[src]")
    v.page.wait_for_selector(".gi-angolo")
    v.page.wait_for_function("!window.dt.map.isMoving()")  # la mappa ha finito di inquadrare l'immagine


def _angoli(v):
    """Centri delle 4 maniglie angolari sullo schermo: NO, NE, SO, SE."""
    return v.js("""[...document.querySelectorAll('.gi-angolo')].map(e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })""")


def _punto(angoli, u, w):
    (nx, ny), (ex, ey), (sx, sy) = angoli[0], angoli[1], angoli[2]
    return nx + u * (ex - nx) + w * (sx - nx), ny + u * (ey - ny) + w * (sy - ny)


def test_il_tab_geoimage_apre_il_pannello_e_ripiega_gli_altri(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    assert v.page.is_visible("#rail-pannelli [data-pannello=geoimage]")
    v.page.click("#rail-pannelli [data-pannello=geoimage]")
    assert v.page.is_visible("#geoimage-pannello")
    assert v.page.is_visible("#gi-zona")
    assert not v.page.is_visible("#gi-swipe"), "le sezioni di confronto compaiono solo con un'immagine"
    v.js("document.getElementById('btn-rndt').click()")
    v.page.wait_for_selector("#rndt-pannello:not([hidden]):not(.collassato)", timeout=15000)
    assert v.js("document.getElementById('geoimage-pannello').classList.contains('collassato')")
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_caricare_un_immagine_la_mostra_con_le_maniglie(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    assert v.js("document.querySelector('.gi-immagine').style.transform").startswith("matrix3d(")
    assert v.page.locator(".gi-maniglia").count() == 6  # 4 angoli, centro, rotazione
    assert v.page.is_visible("#gi-swipe")
    assert v.page.inner_text("#gi-info") == "400×300 px"
    v.js("(() => { const r = document.getElementById('gi-opacita'); r.value = 30; r.dispatchEvent(new Event('input')); })()")
    assert v.js("document.querySelector('.gi-overlay').style.opacity") == "0.3"
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_pannello_ripiegato_toglie_le_maniglie_e_riaperto_le_rimette(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#rail-pannelli [data-pannello=geoimage]")  # ripiega
    assert v.page.locator(".gi-maniglia").count() == 0
    assert v.page.is_visible(".gi-overlay"), "l'immagine resta sulla mappa"
    v.page.click("#rail-pannelli [data-pannello=geoimage]")
    assert v.page.locator(".gi-maniglia").count() == 6


def test_file_non_immagine_si_rifiuta_con_un_avviso(apri):
    v = apri()
    _apri_geoimage(v)
    v.page.set_input_files("#gi-file", files=[{"name": "note.txt", "mimeType": "text/plain", "buffer": b"ciao"}])
    v.page.wait_for_selector("#avvisi", state="attached")
    v.page.wait_for_timeout(300)
    assert not v.page.is_visible(".gi-overlay")
    assert "immagine" in v.page.inner_text("#avvisi").lower()


def test_con_la_mappa_inclinata_e_ruotata_l_immagine_segue_in_prospettiva(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.js("window.dt.map.jumpTo({ pitch: 50, bearing: 20 })")
    v.page.wait_for_function("document.querySelector('.gi-immagine').style.transform.startsWith('matrix3d(')")
    m = v.js("document.querySelector('.gi-immagine').style.transform.slice(9, -1).split(',').map(Number)")
    assert abs(m[3]) > 0 or abs(m[7]) > 0, "con il pitch la matrice ha una componente prospettica"
    assert not any("geoimage" in e.lower() or "matrix" in e.lower() for e in v.errori), v.errori


def test_trascinare_il_centro_sposta_l_immagine(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    prima = _angoli(v)
    cx, cy = v.js("(() => { const r = document.querySelector('.gi-centro').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
    v.page.mouse.move(cx, cy)
    v.page.mouse.down()
    v.page.mouse.move(cx + 60, cy + 40, steps=8)
    v.page.mouse.up()
    dopo = _angoli(v)
    assert abs((dopo[0][0] - prima[0][0]) - 60) < 3 and abs((dopo[0][1] - prima[0][1]) - 40) < 3
    assert v.js("!document.getElementById('gi-annulla').disabled")
    v.page.click("#gi-annulla")
    tornato = _angoli(v)
    assert abs(tornato[0][0] - prima[0][0]) < 2


def test_swipe_e_spotlight_ritagliano_l_immagine(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#gi-swipe")
    assert "50%" in v.js("document.querySelector('.gi-overlay').style.clipPath")
    assert v.page.is_visible(".gi-divisore")
    v.page.click("#gi-spotlight")
    assert not v.page.is_visible(".gi-divisore"), "Swipe e Spotlight si escludono"
    v.page.mouse.move(500, 400)
    v.page.mouse.move(520, 410)
    assert v.js("document.querySelector('.gi-overlay').style.clipPath").startswith("path(")
    v.page.click("#gi-inverti")
    v.page.mouse.move(540, 420)
    assert v.js("document.querySelector('.gi-overlay').style.clipPath").startswith("circle(")


def _tre_gcp(v):
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    for u, w in [(0.25, 0.25), (0.75, 0.3), (0.5, 0.75)]:
        x, y = _punto(angoli, u, w)
        v.page.mouse.click(x, y)
        v.page.mouse.click(x + 10, y + 5)
    v.page.click("#gi-gcp-modo")


def test_gcp_due_clic_per_punto_senza_aprire_la_scheda_e_allinea(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    for u, w, dx, dy in [(0.25, 0.25, 30, 20), (0.75, 0.3, 30, 20), (0.5, 0.75, 30, 20)]:
        x, y = _punto(angoli, u, w)
        v.page.mouse.click(x, y)              # passo 1: sull'immagine
        v.page.mouse.click(x + dx, y + dy)    # passo 2: sulla mappa
    assert v.page.locator(".gi-gcp:not(.gi-gcp-attesa)").count() == 3
    assert v.page.locator("#gi-gcp-corpo tr").count() == 3
    assert v.js("document.getElementById('scheda').hidden"), "in modalità GCP il clic non apre la Scheda"
    assert v.js("!document.getElementById('gi-allinea').disabled")
    assert v.page.is_visible("#gi-rmse")
    prima = v.js("window.dt.geoimage.stato.angoli[0]")
    v.page.click("#gi-allinea")
    dopo = v.js("window.dt.geoimage.stato.angoli[0]")
    assert abs(dopo["lat"] - prima["lat"]) > 1e-6 or abs(dopo["lng"] - prima["lng"]) > 1e-6, "l'immagine si è spostata sulle coordinate dei GCP"
    v.page.click("#gi-gcp-modo")  # esce: i clic tornano normali
    assert v.js("document.getElementById('gi-gcp-modo').getAttribute('aria-pressed')") == "false"
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_con_pochi_gcp_o_poly2_senza_abbastanza_punti_allinea_resta_spento(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    for u, w in [(0.25, 0.25), (0.75, 0.3)]:
        x, y = _punto(angoli, u, w)
        v.page.mouse.click(x, y)
        v.page.mouse.click(x + 10, y + 5)
    assert v.js("document.getElementById('gi-allinea').disabled")
    assert not v.page.is_visible("#gi-rmse")
    assert "ne servono almeno 3" in v.page.inner_text("#gi-gcp-conteggio")
    x, y = _punto(angoli, 0.5, 0.75)
    v.page.mouse.click(x, y)
    v.page.mouse.click(x + 10, y + 5)
    assert v.js("!document.getElementById('gi-allinea').disabled")
    v.page.select_option("#gi-tipo", "poly2")
    assert v.js("document.getElementById('gi-allinea').disabled"), "la poly2 vuole almeno 6 GCP"
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_una_nuova_immagine_spegne_swipe_e_modalita_gcp_e_azzera_i_gcp(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    x, y = _punto(angoli, 0.3, 0.3)
    v.page.mouse.click(x, y)
    v.page.mouse.click(x + 10, y + 5)
    v.page.click("#gi-swipe")
    assert v.page.locator(".gi-gcp:not(.gi-gcp-attesa)").count() == 1
    _carica(v, "seconda.png")
    assert v.js("document.getElementById('gi-gcp-modo').getAttribute('aria-pressed')") == "false"
    assert v.js("document.getElementById('gi-swipe').getAttribute('aria-pressed')") == "false"
    assert v.js("document.querySelector('.gi-overlay').style.clipPath") == ""
    assert v.page.locator(".gi-gcp").count() == 0
    assert v.page.locator("#gi-gcp-corpo tr").count() == 0


def test_chiudere_il_pannello_in_modalita_gcp_restituisce_i_clic_alla_mappa(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#gi-gcp-modo")
    v.page.click("#rail-pannelli [data-pannello=geoimage]")  # ripiega il pannello
    assert v.js("document.getElementById('gi-gcp-modo').getAttribute('aria-pressed')") == "false"
    assert v.js("window.dt.map.getCanvas().style.cursor") == ""

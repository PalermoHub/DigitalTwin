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


def test_il_progetto_si_ricorda_dopo_il_ricaricamento(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.wait_for_timeout(800)  # salvataggio ritardato e scrittura in IndexedDB
    v.page.reload()
    v.attendi_pronto()
    v.page.wait_for_selector(".gi-overlay:not([hidden]) .gi-immagine[src]", timeout=15000)
    assert v.js("document.querySelector('.gi-immagine').style.transform").startswith("matrix3d(")


def test_rimuovere_l_immagine_pulisce_mappa_e_memoria(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#gi-rimuovi")
    assert not v.page.is_visible(".gi-overlay")
    assert v.page.locator(".gi-maniglia").count() == 0
    assert not v.page.is_visible("#gi-swipe")
    assert v.js("localStorage.getItem('dt:geoimage:v1')") is None


def _compressione(tiff):
    """Valore del tag Compression (259) nel primo IFD di un TIFF little-endian."""
    ifd = struct.unpack_from("<I", tiff, 4)[0]
    for i in range(struct.unpack_from("<H", tiff, ifd)[0]):
        tag, tipo, n, valore = struct.unpack_from("<HHII", tiff, ifd + 2 + i * 12)
        if tag == 259:
            return valore & 0xFFFF
    return None


def _controlla_con_gdal(percorso, larghezza, altezza, epsg):
    """Il file si apre con GDAL, ha il sistema di riferimento giusto, i pixel decodificati e un'estensione plausibile (Palermo)."""
    gdal = pytest.importorskip("osgeo.gdal")
    ds = gdal.Open(str(percorso))
    assert ds is not None
    assert ds.GetMetadata("IMAGE_STRUCTURE").get("COMPRESSION") == "LZW"
    if larghezza:
        assert (ds.RasterXSize, ds.RasterYSize) == (larghezza, altezza)
    srs = ds.GetSpatialRef()
    assert f"{srs.GetAuthorityName(None)}:{srs.GetAuthorityCode(None)}" == epsg
    banda = ds.GetRasterBand(1).ReadAsArray()
    assert banda.min() != banda.max(), "i pixel si decodificano (il gradiente non è piatto)"
    gt = ds.GetGeoTransform()
    if epsg == "EPSG:4326":
        assert 13.0 < gt[0] < 13.7 and 37.9 < gt[3] < 38.4


def test_export_qgis_kmz_world_file_geojson_e_geotiff(apri, tmp_path):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    _tre_gcp(v)
    for selettore in ["#gi-qgis", "#gi-kmz", "#gi-mondo", "#gi-geojson"]:
        assert v.js(f"!document.querySelector('{selettore}').disabled"), selettore
    with v.page.expect_download() as d:
        v.page.click("#gi-qgis")
    assert d.value.suggested_filename == "gcp_qgis.points"
    assert open(d.value.path()).read().startswith("mapX,mapY,sourceX,sourceY,enable\n")
    with v.page.expect_download() as d:
        v.page.click("#gi-kmz")
    assert d.value.suggested_filename == "storica_georef.kmz"
    assert open(d.value.path(), "rb").read(2) == b"PK"
    with v.page.expect_download() as d:
        v.page.click("#gi-mondo")
    assert d.value.suggested_filename == "storica.pgw"
    with v.page.expect_download() as d:
        v.page.click("#gi-geojson")
    assert d.value.suggested_filename == "storica_gcp.geojson"
    v.page.click("#gi-geotiff")
    assert v.page.is_visible("#gi-gtiff")
    with v.page.expect_download(timeout=30000) as d:
        v.page.click("#gi-gtiff-vai")
    assert d.value.suggested_filename == "storica_georef_EPSG4326.tif"
    dati = open(d.value.path(), "rb").read()
    assert dati[:4] == b"II*\x00"
    assert _compressione(dati) == 5, "compressione LZW come richiesto"
    _controlla_con_gdal(d.value.path(), 400, 300, "EPSG:4326")
    v.page.click("#gi-geotiff")
    v.page.select_option("#gi-gtiff-sr", "32633")
    with v.page.expect_download(timeout=30000) as d:
        v.page.click("#gi-gtiff-vai")
    assert d.value.suggested_filename == "storica_georef_EPSG32633.tif"
    _controlla_con_gdal(d.value.path(), None, None, "EPSG:32633")
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_il_foglio_info_ha_il_tab_guida_geoimage(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.click("#apri-crediti")
    v.page.click("#tab-geoimage")
    assert v.page.is_visible("#tabpanel-geoimage")
    assert "Come georeferenziare" in v.page.inner_text("#tabpanel-geoimage")
    assert "Cosa cambia nel Digital Twin" in v.page.inner_text("#tabpanel-geoimage")
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_se_l_immagine_non_si_salva_i_parametri_vecchi_o_nuovi_non_restano_accoppiati_male(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.wait_for_timeout(700)
    assert v.js("localStorage.getItem('dt:geoimage:v1')") is not None
    # da qui IndexedDB rifiuta le scritture (quota piena, storage in errore)
    v.js("(() => { IDBObjectStore.prototype.put = function () { throw new DOMException('quota', 'QuotaExceededError'); }; })()")
    _carica(v, "seconda.png")
    v.page.wait_for_timeout(900)
    assert v.js("localStorage.getItem('dt:geoimage:v1')") is None, "senza l'immagine nuova non si tengono parametri che la descrivono"
    assert "Esporta JSON" in v.page.inner_text("#avvisi")


def test_il_ripristino_in_corso_non_sovrascrive_una_scelta_dell_utente(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.wait_for_timeout(800)
    nome = v.js("""(async () => {
        const r = window.dt.geoimage.ripristina();      // riparte il ripristino asincrono…
        document.getElementById('gi-rimuovi').click();  // …e l'utente toglie l'immagine
        await r;
        return window.dt.geoimage.stato.immagine?.nome ?? null;
    })()""")
    assert nome is None, "il ripristino non fa riapparire l'immagine che l'utente ha appena tolto"


def test_esc_che_annulla_il_gcp_non_arriva_agli_altri_gestori(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.js("window.__esc = 0; document.addEventListener('keydown', e => { if (e.key === 'Escape') window.__esc++; })")
    v.page.click("#gi-gcp-modo")
    v.page.keyboard.press("Escape")  # esce dalla modalità GCP
    assert v.js("document.getElementById('gi-gcp-modo').getAttribute('aria-pressed')") == "false"
    assert v.js("window.__esc") == 0, "Esc consumato da Geoimage: la Scheda e i gruppi non si chiudono"
    v.page.keyboard.press("Escape")  # ora Geoimage non ha nulla da annullare: Esc passa agli altri
    assert v.js("window.__esc") == 1


def test_ripiegando_il_pannello_swipe_e_spotlight_si_spengono(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#gi-swipe")
    assert "50%" in v.js("document.querySelector('.gi-overlay').style.clipPath")
    v.page.click("#rail-pannelli [data-pannello=geoimage]")  # ripiega
    assert v.js("document.querySelector('.gi-overlay').style.clipPath") == ""
    assert not v.page.is_visible(".gi-divisore")
    v.page.click("#rail-pannelli [data-pannello=geoimage]")  # riapre
    assert v.js("document.getElementById('gi-swipe').getAttribute('aria-pressed')") == "false"

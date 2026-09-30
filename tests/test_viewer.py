def test_carica_senza_errori(apri):
    v = apri()
    v.attendi_pronto()
    assert v.errori == []
    assert v.js("window.dt.map.getLayer('osm') !== undefined")


def test_strato_non_caricabile_mostra_avviso_e_il_viewer_resta_vivo(apri):
    v = apri(blocca="**/dati/catasto/**")
    v.attendi_pronto()
    # Il catasto viene aggiunto nel Task 6: qui verifichiamo il meccanismo generale
    # forzando il caricamento di una sorgente bloccata.
    v.js(
        """() => window.dt.map.addSource('prova-catasto',
            { type: 'vector', url: 'pmtiles://' + new URL('dati/catasto/particelle.pmtiles', document.baseURI).href })"""
    )
    v.page.wait_for_function(
        "document.getElementById('avvisi').textContent.includes('prova-catasto')", timeout=30000
    )
    assert v.js("window.dt.pronto") is True
    assert v.js("window.dt.map.getLayer('osm') !== undefined")


def test_crediti_mostrano_fonti_e_avvisi(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")  # il dialog si apre dopo il fetch del catalogo
    testo = v.page.inner_text("#crediti")
    assert "valore legale" in testo
    assert "stime campionarie" in testo
    assert "ISTAT" in testo
    assert "S.I.T.R." in testo


def test_base_cartografica_irraggiungibile_non_blocca_il_viewer(apri):
    v = apri(blocca="https://tile.openstreetmap.org/**")
    v.attendi_pronto()
    assert v.js("window.dt.pronto") is True
    assert v.js("window.dt.map.getLayer('osm') !== undefined")

"""Layer «Trend della popolazione» nel browser: acceso mostra aree e frecce, la legenda cambia livello, il clic apre la scheda col grafico."""
import os


def _errori(v):
    return [e for e in v.errori if not e.startswith("Failed to load resource")]


def _accendi(v):
    v.page.wait_for_selector("#strato-trend-popolazione", state="attached")
    v.mostra("#strato-trend-popolazione")
    v.page.check("#strato-trend-popolazione")
    v.page.wait_for_function("window.dt.map.querySourceFeatures('trend-popolazione').length > 0", timeout=30000)


CONTA = "[...new Set(window.dt.map.querySourceFeatures('trend-popolazione', {filter: ['all', ['==', ['get', 'tipo'], 'area'], ['==', ['get', 'livello'], '%s']]}).map(f => f.properties.nome))].length"


def test_il_layer_si_accende_con_aree_e_legenda(apri):
    v = apri()
    _accendi(v)
    assert v.js(CONTA % "upl") == 55
    assert v.js(CONTA % "quartiere") == 25
    assert v.js(CONTA % "circoscrizione") == 8
    assert v.js("window.dt.map.getLayoutProperty('trend-popolazione-fill', 'visibility')") == "visible"
    v.page.wait_for_function("window.dt.map.hasImage('trend-var-27.26') && window.dt.map.hasImage('trend-var--4.62')", timeout=30000)  # etichette ▲/▼ della variazione
    assert _errori(v) == []


def test_la_legenda_cambia_il_livello(apri):
    v = apri()
    _accendi(v)
    v.js("document.querySelector('.lg-trend-popolazione')?.closest('details.legenda-in-pannello')?.setAttribute('open', '')")
    v.js("document.getElementById('dt-consenso')?.remove()")
    v.page.click(".lg-trend-popolazione .trend-livello >> nth=2")  # circoscrizione
    filtro = v.js("JSON.stringify(window.dt.map.getFilter('trend-popolazione-fill'))")
    assert "circoscrizione" in filtro and "upl" not in filtro
    if os.environ.get("TREND_SCREENSHOT"):
        v.page.wait_for_timeout(1500)
        v.page.screenshot(path=os.environ["TREND_SCREENSHOT"])


def test_clic_apre_la_scheda_nel_tab_popolazione_con_il_grafico(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.3617, 38.1157, 14)  # Palermo centro
    v.page.wait_for_function("window.dt.map.querySourceFeatures('trend-popolazione').length > 0", timeout=30000)
    v.clic(13.3617, 38.1157)
    v.page.wait_for_selector(".scheda-sez[data-chiave='trend-popolazione']", state="attached", timeout=15000)
    assert v.js("document.querySelector(\".scheda-sez[data-chiave='trend-popolazione']\").dataset.tab") == "popolazione"
    v.page.click("button[role=tab][data-tab=popolazione]")
    v.page.wait_for_selector(".scheda-sez[data-chiave='trend-popolazione'] svg.trend-grafico", timeout=10000)
    # sul grafico: l'anno e il valore di ognuno dei 5 punti (2011, 2021, 2023, 2030, 2035)
    assert v.js("document.querySelectorAll(\".scheda-sez[data-chiave='trend-popolazione'] svg.trend-grafico text\").length") == 3 * 10
    # i tre livelli nel punto, indipendenti dal livello scelto nella legenda
    assert v.js("document.querySelectorAll(\".scheda-sez[data-chiave='trend-popolazione'] .trend-livello-dettaglio\").length") == 3
    assert "Circoscrizione" in v.js("document.querySelector(\".scheda-sez[data-chiave='trend-popolazione']\").innerText")
    assert _errori(v) == []
    if os.environ.get("TREND_SCREENSHOT"):
        v.js("document.querySelector(\".scheda-sez[data-chiave='trend-popolazione'] svg.trend-grafico\").scrollIntoView()")
        v.page.screenshot(path=os.environ["TREND_SCREENSHOT"].replace(".png", "_scheda.png"))


def test_interruttore_variazione_trend_charts(apri):
    v = apri()
    _accendi(v)
    v.js("document.getElementById('dt-consenso')?.remove()")
    v.page.wait_for_function("window.dt.map.getSource('trend-grafici')._data.features?.length > 0", timeout=30000)
    # 88 aree × 5 elementi per il livello iniziale; i filtri scelgono i Trend Charts del livello scelto
    assert v.js("window.dt.map.getSource('trend-grafici')._data.features.length") == (55 + 25 + 8) * 5
    # modo «Variazione»: un'etichetta ▲/▼ per ogni valore, con l'immagine pronta
    assert v.js("window.dt.map.hasImage('trend-var-27.26')")  # Tribunali o Kalsa +27,3%
    prima = v.js("JSON.stringify(window.dt.map.getFilter('trend-grafico-linea'))")
    assert '"upl"' not in prima  # con le frecce i Trend Charts non selezionano nulla
    v.page.click(".lg-trend-popolazione .trend-livello >> text=Trend Charts")
    dopo = v.js("JSON.stringify(window.dt.map.getFilter('trend-grafico-linea'))")
    assert '"upl"' in dopo and '"linea"' in dopo
    assert '"upl"' not in v.js("JSON.stringify(window.dt.map.getFilter('trend-popolazione-frecce'))")
    v.page.click(".lg-trend-popolazione .trend-livello >> text=Quartiere")
    assert '"quartiere"' in v.js("JSON.stringify(window.dt.map.getFilter('trend-grafico-linea'))")
    # i layer dei Trend Charts fanno parte dello strato: restano visibili finché lo strato è acceso
    assert v.js("window.dt.map.getLayoutProperty('trend-grafico-linea', 'visibility')") == "visible"
    v.page.click(".lg-trend-popolazione .trend-livello >> text=Variazione")
    assert '"quartiere"' not in v.js("JSON.stringify(window.dt.map.getFilter('trend-grafico-linea'))")
    assert _errori(v) == []
    if os.environ.get("TREND_SCREENSHOT"):
        v.page.click(".lg-trend-popolazione .trend-livello >> text=UPL")
        for z in (12, 13.5, 15):
            v.vai(13.3617, 38.1157, z)
            v.page.wait_for_timeout(2500)
            v.page.screenshot(path=os.environ["TREND_SCREENSHOT"].replace(".png", f"_z{z}.png"))

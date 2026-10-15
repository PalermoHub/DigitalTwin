"""Layer «Progetti PNRR» nel browser: si accende, ha i punti, la legenda filtra e il clic apre la scheda."""
import json

from conftest import ROOT


def _errori(v):
    """Errori di script; i 404 delle immagini delle legende PRG (img/prg/va-26.png, va-27.png) mancano già da prima e non c'entrano."""
    return [e for e in v.errori if not e.startswith("Failed to load resource")]


def _apri_legenda(v):
    """Con più di 6 voci la legenda nel pannello Layer parte ripiegata: la si apre."""
    v.js("document.querySelector('.lg-pnrr')?.closest('details.legenda-in-pannello')?.setAttribute('open', '')")


def _punti():
    return json.loads((ROOT / "dati" / "pnrr" / "pnrr.geojson").read_text(encoding="utf-8"))["features"]


def test_strato_pnrr_si_accende_con_legenda_e_punti(apri):
    v = apri()
    v.attendi_pronto()
    assert _errori(v) == []
    v.mostra("#strato-pnrr")
    assert v.js("window.dt.map.getLayoutProperty('pnrr-punti', 'visibility')") == "none"
    v.page.check("#strato-pnrr")
    assert v.js("window.dt.map.getLayoutProperty('pnrr-punti', 'visibility')") == "visible"
    v.page.wait_for_function("window.dt.map.querySourceFeatures('pnrr').length > 0", timeout=30000)
    _apri_legenda(v)
    assert v.page.is_visible(".lg-pnrr")
    assert len(v.page.query_selector_all(".lg-pnrr input[type=checkbox]")) == 7


def test_legenda_pnrr_filtra_per_missione(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-pnrr")
    v.page.check("#strato-pnrr")
    assert v.js("window.dt.map.getFilter('pnrr-punti') ?? null") is None
    _apri_legenda(v)
    v.page.click(".lg-pnrr label.monumenti-cat:nth-of-type(4)")   # M4: il clic isola la missione
    filtro = v.js("window.dt.map.getFilter('pnrr-punti')")
    assert filtro[0] == "in" and filtro[2][1] == ["M4"]


def test_clic_su_un_progetto_apre_la_scheda(apri):
    v = apri()
    v.attendi_pronto()
    primo = next(f for f in _punti() if f["properties"].get("precisione") == "civico")
    lon, lat = primo["geometry"]["coordinates"]
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.querySourceFeatures('pnrr').length > 0", timeout=30000)
    v.clic(lon, lat)
    # la scheda sta nella tab PNRR (nascosta finché non la si sceglie): si cerca la sezione, non il testo visibile
    v.page.wait_for_selector(f".scheda-sez[data-chiave='pnrr-{primo['properties']['cup']}']", state="attached", timeout=15000)
    assert _errori(v) == []


def test_tab_pnrr_ha_progetto_e_grafici(apri):
    v = apri()
    v.attendi_pronto()
    primo = next(f for f in _punti() if f["properties"].get("precisione") == "civico")
    lon, lat = primo["geometry"]["coordinates"]
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.querySourceFeatures('pnrr').length > 0", timeout=30000)
    v.clic(lon, lat)
    v.page.wait_for_selector("button[role=tab][data-tab=pnrr]", timeout=15000)
    v.page.click("button[role=tab][data-tab=pnrr]")
    # progetto cliccato e sintesi sono nella tab PNRR, non più in Luogo
    sez = v.js("[...document.querySelectorAll('.scheda-sez')].filter(s => !s.hidden).map(s => s.dataset.chiave)")
    assert f"pnrr-{primo['properties']['cup']}" in sez and "pnrr-sintesi" in sez
    assert not v.js("[...document.querySelectorAll('.scheda-sez')].some(s => s.dataset.tab === 'luogo' && String(s.dataset.chiave).startsWith('pnrr'))")
    # i grafici: tre riquadri e le barre per missione, stato, anno, settore, attuatore
    sintesi = ".scheda-sez[data-chiave='pnrr-sintesi']"
    assert v.page.locator(f"{sintesi} .pend-riquadro").count() == 3
    assert v.page.locator(f"{sintesi} .pend-classifica").count() == 5
    # fonti e link: catalogo di Italia Domani, localizzazione, Cruscotto Italia e il CSV completo
    href = v.js("[...document.querySelectorAll('.scheda-link')].filter(a => !a.hidden).map(a => a.href)")
    assert any("italiadomani.gov.it" in h for h in href) and any("cruscotto-italia.dati.gov.it" in h for h in href)
    assert any(h.endswith("pnrr_palermo.csv") for h in href)
    assert _errori(v) == []

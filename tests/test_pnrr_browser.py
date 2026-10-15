"""Layer «Progetti PNRR» nel browser: marker per luogo, legenda che filtra, clic che apre la scheda, soggetti attuatori come filtri."""
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


def _accendi(v):
    v.mostra("#strato-pnrr")
    v.page.check("#strato-pnrr")
    v.page.wait_for_function("window.dt.map.querySourceFeatures('pnrr').length > 0", timeout=30000)
    _apri_legenda(v)


# progetti rappresentati dai marker, contati per luogo (querySourceFeatures può restituire lo stesso elemento più volte)
SOMMA_MARKER = "[...new Map(window.dt.map.querySourceFeatures('pnrr').map(f => [f.properties.id, f.properties.n])).values()].reduce((s, n) => s + n, 0)"


def _marker(v):
    return v.js("[...new Map(window.dt.map.querySourceFeatures('pnrr').map(f => [f.properties.id, f.properties.n])).entries()]")


def _attendi_progetti(v, n):
    v.page.wait_for_function(f"{SOMMA_MARKER} === {n}", timeout=15000)


def _filtro_hit(v):
    return json.dumps(v.js("window.dt.map.getFilter('pnrr-hit') ?? null"))


def test_strato_pnrr_si_accende_con_legenda_e_marker_per_luogo(apri):
    v = apri()
    v.attendi_pronto()
    assert _errori(v) == []
    v.mostra("#strato-pnrr")
    assert v.js("window.dt.map.getLayoutProperty('pnrr-punti', 'visibility')") == "none"
    _accendi(v)
    assert v.js("window.dt.map.getLayoutProperty('pnrr-punti', 'visibility')") == "visible"
    assert v.page.is_visible(".lg-pnrr")
    assert len(v.page.query_selector_all(".lg-pnrr input[type=checkbox]")) == 8        # 7 missioni + sede delle scuole
    assert len(v.page.query_selector_all(".lg-pnrr input[type=radio]")) == 9           # Tutti + 8 soggetti
    assert v.page.locator(".lg-pnrr select option").count() > 1                        # gli altri soggetti
    # un marker per luogo (stessa posizione = un solo marker) e il numero conta tutti i progetti
    luoghi = {tuple(f["geometry"]["coordinates"]) for f in _punti()}
    _attendi_progetti(v, len(_punti()))
    marker = dict(_marker(v))
    assert len(marker) <= len(luoghi) and len(marker) < len(_punti())


def test_legenda_pnrr_filtra_per_missione(apri):
    v = apri()
    v.attendi_pronto()
    _accendi(v)
    assert _filtro_hit(v) == "null"
    v.page.click(".lg-pnrr label.monumenti-cat:nth-of-type(4)")   # M4: il clic isola la missione
    assert '"in"' in _filtro_hit(v) and '["M4"]' in _filtro_hit(v)
    _attendi_progetti(v, sum(1 for f in _punti() if f["properties"]["missione"] == "M4"))


def test_legenda_pnrr_filtro_sede_delle_scuole(apri):
    v = apri()
    v.attendi_pronto()
    _accendi(v)
    sede = sum(1 for f in _punti() if f["properties"]["precisione"] == "sede")
    assert sede > 0
    v.page.locator(".lg-pnrr label.monumenti-cat").nth(7).click()      # toglie i progetti sulla sede dell'istituto
    assert "sede" in _filtro_hit(v)
    _attendi_progetti(v, len(_punti()) - sede)
    v.page.locator(".lg-pnrr label.monumenti-cat").nth(7).click()
    assert _filtro_hit(v) == "null"
    _attendi_progetti(v, len(_punti()))


def test_legenda_pnrr_soggetto_attuatore_filtra_i_progetti(apri):
    v = apri()
    v.attendi_pronto()
    _accendi(v)
    comune = sum(1 for f in _punti() if f["properties"].get("attuatore") == "COMUNE DI PALERMO")
    v.page.locator(".lg-pnrr label.monumenti-cat", has_text="Comune di Palermo").click()
    assert "COMUNE DI PALERMO" in _filtro_hit(v)
    _attendi_progetti(v, comune)
    # dal menu degli altri soggetti
    altro = v.page.locator(".lg-pnrr select option").nth(1).get_attribute("value")
    v.page.select_option(".lg-pnrr select", altro)
    assert altro in _filtro_hit(v) and "COMUNE DI PALERMO" not in _filtro_hit(v)
    assert v.page.locator(".lg-pnrr input[type=radio]:checked").count() == 0          # il soggetto non è tra i principali
    v.page.locator(".lg-pnrr label.monumenti-cat", has_text="Tutti i soggetti").click()
    assert _filtro_hit(v) == "null"
    assert _errori(v) == []


def test_clic_su_un_progetto_apre_la_scheda(apri):
    v = apri()
    v.attendi_pronto()
    primo = next(f for f in _punti() if f["properties"].get("precisione") == "civico")
    lon, lat = primo["geometry"]["coordinates"]
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.querySourceFeatures('pnrr-hit-src').length > 0", timeout=30000)
    v.clic(lon, lat)
    # la scheda sta nella tab PNRR (nascosta finché non la si sceglie): si cerca la sezione, non il testo visibile
    v.page.wait_for_selector(f".scheda-sez[data-chiave='pnrr-{primo['properties']['cup']}']", state="attached", timeout=15000)
    assert _errori(v) == []


def _apri_scheda_pnrr(v, progetto):
    lon, lat = progetto["geometry"]["coordinates"]
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.querySourceFeatures('pnrr-hit-src').length > 0", timeout=30000)
    v.clic(lon, lat)
    v.page.wait_for_selector("button[role=tab][data-tab=pnrr]", timeout=15000)
    v.page.click("button[role=tab][data-tab=pnrr]")


def test_tab_pnrr_ha_progetto_e_grafici(apri):
    v = apri()
    v.attendi_pronto()
    primo = next(f for f in _punti() if f["properties"].get("precisione") == "civico")
    _apri_scheda_pnrr(v, primo)
    # progetto cliccato e sintesi sono nella tab PNRR, non più in Luogo
    sez = v.js("[...document.querySelectorAll('.scheda-sez')].filter(s => !s.hidden).map(s => s.dataset.chiave)")
    assert f"pnrr-{primo['properties']['cup']}" in sez and "pnrr-sintesi" in sez
    assert not v.js("[...document.querySelectorAll('.scheda-sez')].some(s => s.dataset.tab === 'luogo' && String(s.dataset.chiave).startsWith('pnrr'))")
    # i grafici: tre riquadri e le barre per missione, stato, anno, settore, attuatore
    sintesi = ".scheda-sez[data-chiave='pnrr-sintesi']"
    assert v.page.locator(f"{sintesi} .pend-riquadro").count() == 3
    assert v.page.locator(f"{sintesi} .pend-classifica").count() == 5
    assert v.page.locator(f"{sintesi} .pend-classifica").nth(4).locator("button.scheda-filtro").count() == 10    # i soggetti attuatori
    # fonti e link: catalogo di Italia Domani, localizzazione, Cruscotto Italia e il CSV completo
    href = v.js("[...document.querySelectorAll('.scheda-link')].filter(a => !a.hidden).map(a => a.href)")
    assert any("italiadomani.gov.it" in h for h in href) and any("cruscotto-italia.dati.gov.it" in h for h in href)
    assert any(h.endswith("pnrr_palermo.csv") for h in href)
    assert _errori(v) == []


def test_soggetto_attuatore_della_scheda_e_un_filtro(apri):
    v = apri()
    v.attendi_pronto()
    primo = next(f for f in _punti() if f["properties"].get("precisione") == "civico" and f["properties"].get("attuatore"))
    attuatore = primo["properties"]["attuatore"]
    _apri_scheda_pnrr(v, primo)
    assert v.js("document.getElementById('strato-pnrr').checked") is False
    riga = v.page.locator(f".scheda-sez[data-chiave='pnrr-{primo['properties']['cup']}'] .scheda-riga", has_text="Soggetto attuatore")
    riga.locator("button.scheda-filtro").click()
    # lo strato si accende e la mappa mostra solo i progetti del soggetto
    assert v.js("document.getElementById('strato-pnrr').checked") is True
    assert attuatore in _filtro_hit(v)
    n = sum(1 for f in _punti() if f["properties"].get("attuatore") == attuatore)
    _attendi_progetti(v, n)
    # un secondo clic toglie il filtro
    riga.locator("button.scheda-filtro").click()
    assert _filtro_hit(v) == "null"
    # anche le barre del grafico dei soggetti filtrano
    v.page.locator(".scheda-sez[data-chiave='pnrr-sintesi'] .pend-classifica").nth(4).locator("button.scheda-filtro").first.click()
    assert _filtro_hit(v) != "null"
    assert _errori(v) == []


def test_clic_sul_marker_elenca_i_progetti_del_luogo(apri):
    """Il numero al centro dell'anello non basta: il popup dice quali sono i progetti, e la scheda li ha tutti."""
    import collections
    per_luogo = collections.defaultdict(list)
    for f in _punti():
        per_luogo[tuple(f["geometry"]["coordinates"])].append(f["properties"])
    (lon, lat), progetti = next((k, v) for k, v in per_luogo.items() if 3 <= len(v) <= 20)
    v = apri()
    v.attendi_pronto()
    v.vai(lon, lat, 17)
    _accendi(v)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({ layers: ['pnrr-punti'] }).length > 0", timeout=20000)   # le icone sono disegnate
    v.clic(lon, lat)
    v.page.wait_for_selector(".pnrr-popup-elenco li", timeout=15000)
    assert v.page.locator(".pnrr-popup-elenco li").count() == len(progetti)
    assert v.page.locator(".pnrr-popup h3").inner_text().startswith(str(len(progetti)))
    # ogni voce porta la missione e un nome
    assert all(t.strip() for t in v.page.locator(".pnrr-popup-elenco li").all_inner_texts())
    # e il pallino col colore della missione, ben visibile (non solo dentro la legenda)
    pallini = v.js("[...document.querySelectorAll('.pnrr-popup-elenco li i')].map(i => { const s = getComputedStyle(i); return [s.width, s.backgroundColor]; })")
    assert len(pallini) == len(progetti) and all(w == "10px" and c not in ("rgba(0, 0, 0, 0)", "transparent") for w, c in pallini)
    # la scheda di destra ha una sezione per ogni progetto del luogo
    v.page.wait_for_selector("button[role=tab][data-tab=pnrr]", timeout=15000)
    assert v.page.locator(".scheda-sez[data-tab=pnrr][data-chiave^='pnrr-']:not([data-chiave='pnrr-sintesi'])").count() >= len(progetti)
    assert _errori(v) == []

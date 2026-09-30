import json

from conftest import ROOT

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


POP = ROOT / "dati" / "popolazione"


def _righe(nome):
    return json.loads((POP / nome).read_text(encoding="utf-8"))


def _n_residenti(righe):
    return sum(1 for r in righe if r.get("P1") not in (None, ""))


def test_popolazione_2021_poi_2023(apri):
    v = apri()
    v.attendi_pronto()
    s = v.js("window.dt.moduli.popolazione.stato()")
    assert s["anno"] == 2021 and s["indicatore"] == "residenti"
    assert s["nValori"] == _n_residenti(_righe("sezioni_indicatori.json"))

    v.js("window.dt.moduli.popolazione.imposta({anno: 2023})")
    v.page.wait_for_function(
        "window.dt.moduli.popolazione.stato().anno === 2023 && window.dt.moduli.popolazione.stato().nValori > 0"
    )
    s = v.js("window.dt.moduli.popolazione.stato()")
    assert s["nValori"] == _n_residenti(_righe("sezioni_indicatori_2023.json"))


def test_sezione_2021_senza_dato_2023_resta_senza_valore(apri):
    r21, r23 = _righe("sezioni_indicatori.json"), _righe("sezioni_indicatori_2023.json")
    ids23 = {r["SEZ21_ID"] for r in r23}
    solo21 = next(r["SEZ21_ID"] for r in r21 if r["SEZ21_ID"] not in ids23 and r.get("P1"))
    v = apri()
    v.attendi_pronto()
    stato21 = v.js(
        f"window.dt.map.getFeatureState({{source:'sezioni', sourceLayer:'sezioni', id:{solo21}}})"
    )
    assert stato21.get("v") is not None  # nel 2021 ha un valore
    v.js("window.dt.moduli.popolazione.imposta({anno: 2023})")
    v.page.wait_for_function("window.dt.moduli.popolazione.stato().anno === 2023")
    v.page.wait_for_function(
        f"window.dt.map.getFeatureState({{source:'sezioni', sourceLayer:'sezioni', id:{solo21}}}).v === undefined"
    )


def test_cambi_rapidi_finiscono_nell_ultimo_stato(apri):
    v = apri()
    v.attendi_pronto()
    v.js(
        """() => { const p = window.dt.moduli.popolazione;
            p.imposta({anno: 2023}); p.imposta({anno: 2021, indicatore: 'densita'}); }"""
    )
    r21 = _righe("sezioni_indicatori.json")
    atteso = sum(1 for r in r21 if r.get("P1") not in (None, "") and (r.get("Area") or 0) > 0)
    v.page.wait_for_function(
        f"(() => {{ const s = window.dt.moduli.popolazione.stato();"
        f" return s.anno === 2021 && s.indicatore === 'densita' && s.nValori === {atteso}; }})()",
        timeout=30000,
    )


def test_strati_iniziali_e_attivabili(apri):
    v = apri()
    v.attendi_pronto()
    strati = v.js(
        "Object.values(window.dt.moduli).flatMap(m => m.strati.map(s => ({id: s.id, layers: s.layers, attivo: s.attivo})))"
    )
    assert {"circoscrizioni", "quartieri", "upl", "sezioni", "coropletico"} <= {s["id"] for s in strati}
    for s in strati:
        for layer in s["layers"]:
            assert v.js(f"window.dt.map.getLayer('{layer}') !== undefined"), layer
        visibile = v.js(
            f"window.dt.map.getLayoutProperty('{s['layers'][0]}', 'visibility') !== 'none'"
        )
        assert visibile == s["attivo"], s["id"]
        v.page.set_checked(f"#strato-{s['id']}", not s["attivo"])
        nuova = v.js(
            f"window.dt.map.getLayoutProperty('{s['layers'][0]}', 'visibility') !== 'none'"
        )
        assert nuova == (not s["attivo"]), s["id"]


def test_territorio_strati_e_sorgenti(apri):
    v = apri()
    v.attendi_pronto()
    for sorgente in ["catasto", "prg", "omi", "immobili", "civici"]:
        assert v.js(f"window.dt.map.getSource('{sorgente}') !== undefined"), sorgente
    for layer in ["catasto", "prg-zto", "prg-va", "prg-vl", "omi", "immobili", "civici",
                  "catasto-hit", "prg-zto-hit", "prg-va-hit", "omi-hit", "immobili-hit"]:
        assert v.js(f"window.dt.map.getLayer('{layer}') !== undefined"), layer
    assert v.js("window.dt.map.getLayer('catasto').minzoom") == 15


def test_catasto_carica_particelle_a_zoom_17(apri):
    v = apri()
    v.attendi_pronto()
    v.page.check("#strato-catasto")
    v.vai(13.3568, 38.1204, 17)  # piazza Verdi, Teatro Massimo
    n = v.js(
        "window.dt.map.querySourceFeatures('catasto', {sourceLayer: 'particelle'}).length"
    )
    assert n > 0


def test_prg_carica_zonizzazione_a_zoom_15(apri):
    v = apri()
    v.attendi_pronto()
    v.page.check("#strato-prg")
    v.vai(13.3568, 38.1204, 15)
    n = v.js("window.dt.map.querySourceFeatures('prg', {sourceLayer: 'zto'}).length")
    assert n > 0


def test_edifici_3d_inclinano_la_mappa_e_hanno_altezza(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getSource('edificato') !== undefined")
    v.page.check("#strato-edifici3d")
    v.page.wait_for_function("window.dt.map.getPitch() > 40")
    assert v.js("window.dt.map.getLayoutProperty('edifici-3d', 'visibility')") == "visible"
    v.vai(13.3568, 38.1204, 16)
    feats = v.js(
        "window.dt.map.querySourceFeatures('edificato', {sourceLayer: 'edificato'})"
        ".slice(0, 50).map(f => f.properties.altezza)"
    )
    assert len(feats) > 0
    assert any(isinstance(a, (int, float)) and a > 0 for a in feats)
    v.page.uncheck("#strato-edifici3d")
    v.page.wait_for_function("window.dt.map.getPitch() < 5")

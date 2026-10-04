import json
from pathlib import Path

import pytest

from conftest import ROOT
from valida_dati import leggi_json

def test_carica_senza_errori(apri):
    v = apri()
    v.attendi_pronto()
    assert v.errori == []
    assert v.js("window.dt.map.getLayer('sfondo') !== undefined")


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
    assert v.js("window.dt.map.getLayer('sfondo') !== undefined")


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
    assert "HR-DTM-5m" in testo and "CC BY 4.0" in testo
    assert "OpenStreetMap" in testo


def test_base_cartografica_irraggiungibile_non_blocca_il_viewer(apri):
    v = apri(blocca="https://tiles.openfreemap.org/styles/positron")
    v.attendi_pronto()
    v.page.wait_for_function(
        "document.getElementById('avvisi').textContent.includes('Base cartografica non disponibile')",
        timeout=30000,
    )
    assert v.js("window.dt.pronto") is True
    # i nostri strati sono stati aggiunti comunque, sullo sfondo di ripiego
    assert v.js("window.dt.map.getLayer('pop-fill') !== undefined")
    assert v.js("window.dt.map.getLayer('sfondo') !== undefined")


def _righe(nome):
    # copia locale se c'è, altrimenti dal link registrato nel manifesto (con cache in .cache/)
    return leggi_json(f"popolazione/{nome}")


SOTTO_15 = ["P30", "P31", "P32", "P67", "P68", "P69"]
SOPRA_64 = ["P43", "P44", "P45", "P80", "P81", "P82"]


def _n_validi(righe, indicatore):
    """Quante sezioni hanno un valore per l'indicatore (stessa regola dell'app originale)."""
    if indicatore == "densita":
        return sum(1 for r in righe if r.get("P1") not in (None, "") and (r.get("Area") or 0) > 0)
    num = lambda r, campi: sum(r[c] for c in campi if isinstance(r.get(c), (int, float)))
    return sum(1 for r in righe if num(r, SOTTO_15) > 0)


def test_popolazione_2021_poi_2023(apri):
    v = apri()
    v.attendi_pronto()
    s = v.js("window.dt.moduli.popolazione.stato()")
    assert s["anno"] == 2021 and s["indicatore"] == "densita"
    assert s["nValori"] == _n_validi(_righe("sezioni_indicatori.json"), "densita")

    v.js("window.dt.moduli.popolazione.imposta({anno: 2023})")
    v.page.wait_for_function(
        "window.dt.moduli.popolazione.stato().anno === 2023 && window.dt.moduli.popolazione.stato().nValori > 0"
    )
    s = v.js("window.dt.moduli.popolazione.stato()")
    assert s["nValori"] == _n_validi(_righe("sezioni_indicatori_2023.json"), "densita")


def test_sezione_2021_senza_dato_2023_resta_senza_valore(apri):
    r21, r23 = _righe("sezioni_indicatori.json"), _righe("sezioni_indicatori_2023.json")
    ids23 = {r["SEZ21_ID"] for r in r23}
    solo21 = next(r["SEZ21_ID"] for r in r21
                  if r["SEZ21_ID"] not in ids23 and r.get("P1") and r.get("Area"))
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
            p.imposta({anno: 2023}); p.imposta({anno: 2021, indicatore: 'vecchiaia'}); }"""
    )
    atteso = _n_validi(_righe("sezioni_indicatori.json"), "vecchiaia")
    v.page.wait_for_function(
        f"(() => {{ const s = window.dt.moduli.popolazione.stato();"
        f" return s.anno === 2021 && s.indicatore === 'vecchiaia' && s.nValori === {atteso}; }})()",
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
        v.mostra(f"#strato-{s['id']}")
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
    for layer in ["catasto", "prg-zto", "prg-ppe", "prg-va", "prg-vl", "omi", "omi-line", "immobili", "civici",
                  "catasto-hit", "prg-zto-hit", "prg-ns-hit", "prg-cs-hit", "prg-va-hit", "omi-hit",
                  "immobili-hit"]:
        assert v.js(f"window.dt.map.getLayer('{layer}') !== undefined"), layer
    assert v.js("window.dt.map.getLayer('catasto').minzoom") == 12


def test_stili_fedeli_alle_app_originali(apri):
    v = apri()
    v.attendi_pronto()
    r = v.js(
        """async () => {
            const pal = await import('./js/core/palette.js');
            const omi = await import('./js/layers/stile-omi.js');
            const m = window.dt.map, J = JSON.stringify;
            const tiles = id => m.getSource(id).tiles[0];
            return {
                omi: J(m.getPaintProperty('omi', 'fill-color')) === J(omi.STILE_OMI),
                omiOpacita: m.getPaintProperty('omi', 'fill-opacity'),
                omiContorno: [m.getPaintProperty('omi-line', 'line-color'), m.getPaintProperty('omi-line', 'line-width')],
                circoscrizioni: m.getPaintProperty('confini-circoscrizioni', 'line-color') === pal.confiniStyle('circoscrizioni', false).color,
                upl: J(m.getPaintProperty('confini-upl', 'line-dasharray')) === J(pal.confiniStyle('upl', false).dash),
                edifici: m.getPaintProperty('edifici-3d', 'fill-extrusion-color') === pal.EDIFICATO_NEUTRAL,
                rampaDensita: J(m.getPaintProperty('pop-fill', 'fill-color')).includes(J(pal.densityStops('popolazione', false).flat()).slice(1, -1)),
                catasto: [m.getPaintProperty('catasto', 'fill-color'), m.getPaintProperty('catasto', 'fill-opacity'), m.getPaintProperty('catasto', 'fill-outline-color')],
                civici: [m.getLayer('civici').type, m.getPaintProperty('civici', 'text-color'), m.getPaintProperty('civici', 'text-halo-color')],
                raster: ['prg-zto', 'prg-ppe', 'prg-va', 'prg-vl'].map(id => m.getLayer(id).type),
                tile: [tiles('prg-zto-r'), tiles('prg-ppe-r'), tiles('prg-va-r'), tiles('prg-vl-r')],
                hitTrasparenti: ['catasto-hit', 'prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit', 'prg-va-hit', 'omi-hit', 'immobili-hit', 'pop-hit', 'edifici-hit']
                    .every(id => m.getPaintProperty(id, 'fill-opacity') === 0),
            };
        }"""
    )
    assert r["omi"] is True
    assert r["omiOpacita"] == 0.15
    assert r["omiContorno"] == ["#232323", 0.5]
    assert r["circoscrizioni"] and r["upl"] and r["edifici"] and r["rampaDensita"]
    assert r["catasto"] == ["#ffffff", 0.6, "#000"]
    assert r["civici"] == ["symbol", "#c0392b", "#ffffff"]
    # vestizione PRG/PPE/vincoli = tile raster pubblicati; i poligoni vettoriali restano trasparenti
    assert r["raster"] == ["raster"] * 4
    base = "https://palermohub.github.io/PRG2004/"
    assert r["tile"] == [f"{base}{n}/{{z}}/{{x}}/{{y}}.png" for n in ("ZTO", "ppe", "VA", "VL")]
    assert r["hitTrasparenti"] is True


def test_catasto_carica_particelle_a_zoom_17(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-catasto")
    v.page.check("#strato-catasto")
    v.vai(13.3568, 38.1204, 17)  # piazza Verdi, Teatro Massimo
    n = v.js(
        "window.dt.map.querySourceFeatures('catasto', {sourceLayer: 'particelle'}).length"
    )
    assert n > 0


def test_prg_carica_zonizzazione_a_zoom_15(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-prg")
    v.page.check("#strato-prg")
    v.vai(13.3568, 38.1204, 15)
    n = v.js("window.dt.map.querySourceFeatures('prg', {sourceLayer: 'zto'}).length")
    assert n > 0


def test_edifici_3d_inclinano_la_mappa_e_hanno_altezza(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getSource('edificato') !== undefined")
    v.mostra("#strato-edifici3d")
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
    v.mostra("#strato-edifici3d")
    v.page.uncheck("#strato-edifici3d")
    v.page.wait_for_function("window.dt.map.getPitch() < 5")


def _scheda_su(v, sorgente, strato, layer_hit, zoom, centro=(13.3568, 38.1204)):
    """Porta la mappa al centro, sceglie un punto davvero dentro `layer_hit` e clicca."""
    v.vai(*centro, zoom)
    punto = v.punto_in(sorgente, strato, layer_hit)
    assert punto is not None, f"nessuna feature di {sorgente}/{strato} interrogabile"
    v.vai(punto[0], punto[1], zoom)
    v.clic(punto[0], punto[1])
    v.page.wait_for_selector("#scheda:not([hidden])")
    return v.page.inner_text("#scheda")


def test_scheda_su_una_particella(apri):
    v = apri()
    v.attendi_pronto()
    testo = _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    assert "Particella catastale" in testo
    assert "Foglio" in testo
    assert "Sezione di censimento" in testo


def test_scheda_zona_prg(apri):
    v = apri()
    v.attendi_pronto()
    testo = _scheda_su(v, "prg", "zto", "prg-zto-hit", 15)
    assert "Zonizzazione (PRG 2004)" in testo


def test_scheda_netto_storico(apri):
    v = apri()
    v.attendi_pronto()
    testo = _scheda_su(v, "prg", "ns", "prg-ns-hit", 15)
    assert "Netto storico" in testo


def test_scheda_centro_storico_non_resta_senza_prg(apri):
    v = apri()
    v.attendi_pronto()
    # piazza Verdi ricade nel perimetro del centro storico, non in una zona di `zto`
    testo = _scheda_su(v, "prg", "cs", "prg-cs-hit", 15)
    assert "Centro storico" in testo
    assert "PPE" in testo  # come nell'app originale: il layer `cs` è il piano urbanistico PPE


def test_scheda_clic_su_vuoto_chiude(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.30, 38.30, 9)  # mare a nord, zoom sotto la copertura dei tile
    v.clic(13.30, 38.30)
    v.page.wait_for_selector("#scheda", state="hidden")
    assert v.errori == []


def test_scheda_una_colonna_a_tutta_altezza_con_corpo_scorrevole(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.3568, 38.1204, 15)
    v.clic(13.3568, 38.1204)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert v.page.locator("#scheda .scheda-chiudi").count() == 0
    # pannello a tutta altezza e di larghezza fissa (--scheda-w): mai due colonne
    misure = v.page.evaluate("[document.querySelector('#scheda').offsetHeight, innerHeight, document.querySelector('#scheda').offsetWidth]")
    assert misure[0] == misure[1]
    assert misure[2] == 380
    # contenuto più alto dello schermo: la larghezza non cambia, scorre il corpo
    v.page.evaluate("""() => {
      const c = document.querySelector('#scheda .scheda-corpo');
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('section'); s.className = 'scheda-sez';
        s.style.height = '300px'; s.textContent = 'sezione ' + i; c.append(s);
      }
    }""")
    dopo = v.page.evaluate("""() => {
      const c = document.querySelector('#scheda .scheda-corpo');
      return [document.querySelector('#scheda').offsetWidth, c.scrollHeight > c.clientHeight, getComputedStyle(c).overflowY];
    }""")
    assert dopo == [380, True, "auto"]
    assert v.page.locator("#scheda.scheda-doppia").count() == 0


def test_scheda_titolo_indirizzo_avviso_legale_una_volta_sola(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    titolo = v.page.inner_text("#scheda .scheda-intestazione h2")
    assert titolo != "" and titolo == titolo.strip()
    # l'avviso «senza valore legale» compare una sola volta, in fondo alla scheda
    assert v.page.locator("#scheda .scheda-legale").count() == 1
    assert v.page.inner_text("#scheda").count("senza valore legale") == 1
    # la scheda non è una regione live: solo l'annuncio breve
    assert v.page.get_attribute("#scheda", "aria-live") is None
    assert "Scheda aperta" in v.page.inner_text("#scheda [role=status]")


def test_scheda_mobile_scorre_e_si_apre_a_tutto_schermo(apri):
    v = apri()
    v.page.set_viewport_size({"width": 390, "height": 760})
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    # foglio basso: il corpo scorre dentro il foglio, il pulsante «Schermo intero» è visibile
    foglio = v.page.evaluate("""() => {
      const s = document.querySelector('#scheda'), c = s.querySelector('.scheda-corpo');
      return { alto: s.offsetHeight, vh: innerHeight, scorre: c.scrollHeight > c.clientHeight, overflow: getComputedStyle(c).overflowY };
    }""")
    assert foglio["alto"] < foglio["vh"] * 0.6
    assert foglio["scorre"] and foglio["overflow"] == "auto"
    v.page.evaluate("document.querySelector('#scheda .scheda-corpo').scrollTop = 120")
    assert v.page.evaluate("document.querySelector('#scheda .scheda-corpo').scrollTop") > 0
    v.page.click("#scheda .scheda-espandi")
    assert v.page.evaluate("[document.querySelector('#scheda').offsetHeight, innerHeight]") == [760, 760]
    assert v.page.get_attribute("#scheda .scheda-espandi", "aria-pressed") == "true"
    v.page.click("#scheda .scheda-espandi")
    assert v.page.evaluate("document.querySelector('#scheda').offsetHeight") < 760
    # chiusa e riaperta, riparte come foglio basso
    v.page.click("#scheda .scheda-espandi")
    v.page.click("#scheda .scheda-x")
    v.page.wait_for_selector("#scheda", state="hidden")
    assert v.page.evaluate("document.querySelector('#scheda').classList.contains('scheda-piena')") is False


def _attendi_fermo(v):
    v.page.wait_for_function("!window.dt.map.isMoving()", timeout=10000)


def test_scheda_aperta_la_mappa_si_centra_nella_parte_visibile_e_home_pure(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    _attendi_fermo(v)
    # il margine destro della mappa è la larghezza della scheda: il centro è al centro della parte visibile
    assert v.js("window.dt.map.getPadding().right") == 380
    scheda_x = v.js("document.querySelector('#scheda').getBoundingClientRect().left")
    centro_x = v.js("window.dt.map.project(window.dt.map.getCenter()).x")
    assert abs(centro_x - scheda_x / 2) <= 2
    # Home porta la vista iniziale al centro della parte visibile, non della finestra
    v.page.click("#btn-home")
    v.page.wait_for_function("window.dt.map.isMoving()", timeout=5000)
    _attendi_fermo(v)
    x_home = v.js("window.dt.map.project([13.33225, 38.14074]).x")
    assert abs(x_home - scheda_x / 2) <= 2
    # chiusa la scheda il margine torna a zero e la vista non salta
    prima = v.js("window.dt.map.unproject([innerWidth / 2, innerHeight / 2]).lng")
    v.page.click("#scheda .scheda-x")
    v.page.wait_for_selector("#scheda", state="hidden")
    _attendi_fermo(v)
    assert v.js("window.dt.map.getPadding().right") == 0
    dopo = v.js("window.dt.map.getCenter().lng")
    assert abs(dopo - prima) < 1e-4


def test_clic_sulla_mappa_avvicina_lo_zoom_e_centra_il_punto(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.3568, 38.1204, 17)
    punto = v.punto_in("catasto", "particelle", "catasto-hit")
    assert punto is not None
    v.vai(punto[0], punto[1], 15.5)  # abbastanza lontano da dover avvicinare
    v.clic(punto[0], punto[1])
    v.page.wait_for_selector("#scheda:not([hidden])")
    _attendi_fermo(v)
    assert v.js("window.dt.map.getZoom()") >= 16.5
    # il punto cliccato è al centro della parte visibile (la scheda occupa 380px a destra)
    x, y = v.js(f"(() => {{ const p = window.dt.map.project([{punto[0]}, {punto[1]}]); return [p.x, p.y]; }})()")
    assert abs(x - (1280 - 380) / 2) <= 3 and abs(y - 400) <= 3
    # già vicini: lo zoom non si allontana
    v.vai(punto[0], punto[1], 18)
    v.clic(punto[0], punto[1])
    _attendi_fermo(v)
    assert v.js("window.dt.map.getZoom()") >= 18


def test_scheda_mobile_la_mappa_si_centra_sopra_il_foglio_basso(apri):
    v = apri()
    v.page.set_viewport_size({"width": 390, "height": 760})
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    _attendi_fermo(v)
    foglio_top = v.js("document.querySelector('#scheda').getBoundingClientRect().top")
    assert abs(v.js("window.dt.map.getPadding().bottom") - (760 - foglio_top)) <= 2
    v.page.click("#scheda .scheda-espandi")  # a tutto schermo: nessun margine
    _attendi_fermo(v)
    assert v.js("window.dt.map.getPadding().bottom") == 0


def test_scheda_si_chiude(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.3568, 38.1204, 15)
    v.clic(13.3568, 38.1204)
    v.page.wait_for_selector("#scheda:not([hidden])")
    v.page.click("#scheda .scheda-x")
    v.page.wait_for_selector("#scheda", state="hidden")


def test_senza_catalogo_il_viewer_resta_vivo_e_avvisa(apri):
    v = apri(blocca="**/dati/catalogo.json")
    v.attendi_pronto()
    v.page.wait_for_function(
        "document.getElementById('avvisi').textContent.includes('Catalogo dati non disponibile')",
        timeout=30000,
    )
    assert v.js("window.dt.pronto") is True
    # senza catalogo non si conoscono gli URL dei tileset: i raster PRG non vengono aggiunti
    assert v.js("window.dt.map.getLayer('prg-zto') === undefined")
    assert v.js("window.dt.map.getLayer('pop-fill') !== undefined")


def test_le_sorgenti_remote_arrivano_dal_catalogo(apri):
    v = apri()
    v.attendi_pronto()
    url = v.js("window.dt.map.getSource('catasto').url")
    assert url == "pmtiles://https://palermohub.github.io/PRG2004/particelle/particelle.pmtiles"


def test_terreno_sorgenti_e_layer_come_nell_app_originale(apri):
    v = apri()
    v.attendi_pronto()
    r = v.js(
        """async () => {
            const pal = await import('./js/core/palette.js');
            const m = window.dt.map, s = id => m.getSource(id), p = (l, k) => m.getPaintProperty(l, k);
            return {
                dem: [s('terrain-dem').type, s('terrain-dem').encoding, s('terrain-dem').minzoom, s('terrain-dem').maxzoom, s('terrain-dem').tiles[0]],
                elev: [s('elevazione').type, s('elevazione').scheme, s('elevazione').minzoom, s('elevazione').maxzoom, s('elevazione').tiles[0]],
                griglia: [s('griglia').type, s('griglia').minzoom, s('griglia').maxzoom, s('griglia').tiles[0]],
                ombra: [m.getLayer('hillshade-layer').type, p('hillshade-layer', 'hillshade-exaggeration'),
                        p('hillshade-layer', 'hillshade-shadow-color') === pal.HILLSHADE_COLORS.shadow,
                        p('hillshade-layer', 'hillshade-highlight-color') === pal.HILLSHADE_COLORS.highlight,
                        p('hillshade-layer', 'hillshade-accent-color') === pal.HILLSHADE_COLORS.accent,
                        p('hillshade-layer', 'hillshade-illumination-direction'), p('hillshade-layer', 'hillshade-illumination-anchor')],
                opacitaElevazione: p('elevazione-raster', 'raster-opacity'),
                grigliaTrasparente: p('griglia-hit', 'circle-opacity'),
            };
        }"""
    )
    base = "https://gbvitrano.github.io/palermo_popolazione/data/"
    assert r["dem"] == ["raster-dem", "terrarium", 8, 15, base + "terrain/{z}/{x}/{y}.png"]
    assert r["elev"] == ["raster", "tms", 8, 15, base + "elevazione/{z}/{x}/{y}.png"]
    assert r["griglia"] == ["vector", 8, 15, base + "griglia_pbf/{z}/{x}/{y}.pbf"]
    assert r["ombra"] == ["hillshade", 0.35, True, True, True, 180, "map"]
    assert r["opacitaElevazione"] == 0.7
    assert r["grigliaTrasparente"] == 0


def test_rilievo_3d_attiva_terreno_e_ombreggiatura(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getTerrain()") is None
    v.mostra("#strato-rilievo3d")
    v.page.check("#strato-rilievo3d")
    v.page.wait_for_function("window.dt.map.getTerrain() !== null && window.dt.map.getPitch() > 40")
    t = v.js("window.dt.map.getTerrain()")
    assert t["source"] == "terrain-dem" and t["exaggeration"] == 1.5
    assert v.js("window.dt.map.getLayoutProperty('hillshade-layer', 'visibility')") == "visible"
    v.mostra("#strato-rilievo3d")
    v.page.uncheck("#strato-rilievo3d")
    v.page.wait_for_function("window.dt.map.getTerrain() === null && window.dt.map.getPitch() < 5")
    assert v.js("window.dt.map.getLayoutProperty('hillshade-layer', 'visibility')") == "none"


def test_elevazione_mostra_raster_e_legenda(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getLayoutProperty('elevazione-raster', 'visibility')") == "none"
    assert not v.page.is_visible(".legenda-elevazione")
    v.mostra("#strato-elevazione")
    v.page.check("#strato-elevazione")
    assert v.js("window.dt.map.getLayoutProperty('elevazione-raster', 'visibility')") == "visible"
    assert v.page.is_visible(".legenda-elevazione")
    assert "0 – 50 m" in v.page.inner_text(".legenda-elevazione")
    # come nell'app originale, il raster sale in cima quando si accende
    ordine = v.js("window.dt.map.getStyle().layers.map(l => l.id)")
    assert ordine[-1] == "elevazione-raster"


def test_scheda_terreno_sceglie_il_punto_di_griglia_piu_vicino(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.3568, 38.1204, 15)
    coppia = v.js(
        """() => {
            const m = window.dt.map;
            const pt = f => ({ lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], quota: f.properties.quota, pendenza: f.properties.slope_deg });
            const px = p => m.project([p.lon, p.lat]);
            // solo punti nell'area centrale: ai bordi ci sono il pannello, la ricerca e la scheda
            const centrale = p => { const q = px(p); return q.x > 400 && q.x < 900 && q.y > 150 && q.y < 650; };
            const punti = m.querySourceFeatures('griglia', { sourceLayer: 'griglia' }).map(pt).filter(centrale);
            for (const a of punti.slice(0, 400)) {
                for (const b of punti) {
                    const d = Math.hypot(px(a).x - px(b).x, px(a).y - px(b).y);
                    if (d > 22 && d < 30 && Math.abs(a.pendenza - b.pendenza) > 0.5 && a.quota < 900 && b.quota < 900) return { a, b };
                }
            }
            return null;
        }"""
    )
    assert coppia is not None, "nessuna coppia di punti di griglia adatta nei tile caricati"
    a, b = coppia["a"], coppia["b"]
    # clic al 45% del segmento A→B (~27 px tra i punti): i cerchi di A e B si sovrappongono, ma A è più vicino
    lon = a["lon"] + 0.45 * (b["lon"] - a["lon"])
    lat = a["lat"] + 0.45 * (b["lat"] - a["lat"])
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    testo = v.page.text_content("#scheda")  # Terreno è chiuso di default: text_content include anche il contenuto nascosto
    assert "Terreno (DTM 5 m)" in testo
    gradi_a, gradi_b = f"{a['pendenza']:.1f}°", f"{b['pendenza']:.1f}°"
    assert gradi_a in testo
    assert gradi_b not in testo
    assert f"{round(a['quota'])} m s.l.m." in testo


def _civico_reale(con_lettera=False):
    indice = leggi_json("civici-omi/civici_index.json")  # dal link, con cache
    for via, civici in indice.items():
        for civico, (lon, lat) in civici.items():
            if civico.isdigit() != con_lettera:
                return via, civico, lon, lat
    raise AssertionError("nessun civico adatto nell'indice")


def _cerca_e_vai(v, testo, lon, lat):
    v.page.fill("#cerca-testo", testo)
    v.page.wait_for_selector("#cerca-risultati button")
    v.page.press("#cerca-testo", "Enter")
    v.page.wait_for_function(
        f"!window.dt.map.isMoving() && Math.abs(window.dt.map.getCenter().lng - {lon}) < 1e-3"
        f" && Math.abs(window.dt.map.getCenter().lat - {lat}) < 1e-3",
        timeout=30000,
    )
    assert v.js("window.dt.map.getZoom()") > 17


def test_ricerca_porta_la_mappa_sul_civico(apri):
    via, civico, lon, lat = _civico_reale()
    v = apri()
    v.attendi_pronto()
    _cerca_e_vai(v, f"{via.lower()} {civico}", lon, lat)


def test_ricerca_trova_i_civici_con_lettera(apri):
    # il 21% dei civici reali ha la lettera («4A»): scritti come «4A», «4/A» o «4 A»
    via, civico, lon, lat = _civico_reale(con_lettera=True)
    numero, lettera = civico[:-1], civico[-1]
    v = apri()
    v.attendi_pronto()
    _cerca_e_vai(v, f"{via.lower()} {numero}/{lettera.lower()}", lon, lat)
    assert civico in v.page.input_value("#cerca-testo")


@pytest.mark.parametrize("file, strato", [
    ("scuole/scuole.geojson", "scuole"),
    ("scuole/seggi.geojson", "seggi"),
    ("monumenti/monumenti.geojson", "monumenti"),
])
def test_ricerca_trova_scuole_seggi_e_monumenti_e_accende_lo_strato(apri, file, strato):
    props = json.load(open(ROOT / "dati" / file))["features"][0]["properties"]
    v = apri()
    v.attendi_pronto()
    assert not v.js(f"document.getElementById('strato-{strato}').checked")
    _cerca_e_vai(v, props["nome"].lower(), props["lon"], props["lat"])
    assert v.js(f"document.getElementById('strato-{strato}').checked")


def test_ricerca_per_numero_di_sezione_elettorale(apri):
    seggio = json.load(open(ROOT / "dati" / "scuole" / "seggi.geojson"))["features"][0]["properties"]
    numero = seggio["sezioni"].split(",")[0].strip().rstrip("*")
    v = apri()
    v.attendi_pronto()
    _cerca_e_vai(v, numero, seggio["lon"], seggio["lat"])
    assert f"Sezione {numero}" in v.page.input_value("#cerca-testo")


def test_ricerca_civico_inesistente_lo_dice_e_nessun_risultato_e_esplicito(apri):
    via, civico, lon, lat = _civico_reale()
    v = apri()
    v.attendi_pronto()
    v.page.fill("#cerca-testo", f"{via.lower()} 99999")
    v.page.wait_for_selector("#cerca-risultati button")
    assert "civico 99999 non trovato" in v.page.inner_text("#cerca-risultati")
    v.page.fill("#cerca-testo", "xyzxyzxyz")
    v.page.wait_for_selector("#cerca-risultati .cerca-vuoto")
    assert "Nessun risultato" in v.page.inner_text("#cerca-risultati")
    assert v.page.locator("#cerca-risultati button").count() == 0


def test_ricerca_input_scomodi_non_rompono_nulla(apri):
    v = apri()
    v.attendi_pronto()
    for testo in ["", "   ", "100", "xyzxyzxyz", "via"]:
        v.page.fill("#cerca-testo", testo)
        v.page.wait_for_timeout(200)
    assert v.errori == []
    assert v.js("window.dt.pronto") is True


def _sezioni_scheda(v):
    return v.js(
        """() => [...document.querySelectorAll('#scheda .scheda-sez')].map(s => ({
            chiave: s.dataset.chiave, titolo: s.dataset.titolo,
            etichette: [...s.querySelectorAll('.scheda-gruppo .scheda-riga .scheda-et')].map(e => e.textContent),
        }))"""
    )


def test_scheda_e_strutturata_e_non_ripete_le_informazioni(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    sezioni = _sezioni_scheda(v)
    chiavi = [s["chiave"] for s in sezioni]
    # ordine fisso: dal luogo al territorio
    peso = {"indirizzo": 10, "particella": 20, "edificio": 30, "zonizzazione": 40, "vincoli": 50,
            "immobile": 55, "sezione": 70, "terreno": 80}
    note = [c for c in chiavi if c in peso or c.startswith("omi-")]  # monumenti, scuole… hanno chiavi proprie
    assert note == sorted(note, key=lambda c: 60 if c.startswith("omi-") else peso[c])
    assert "particella" in chiavi and "sezione" in chiavi
    # nessuna etichetta ripetuta dentro una sezione
    for s in sezioni:
        assert len(s["etichette"]) == len(set(s["etichette"])), s
    testo = v.page.inner_text("#scheda")
    # il contesto amministrativo compare una sola volta, nell'intestazione
    assert testo.count("Circoscrizione") == 1
    assert v.page.locator("#scheda .scheda-contesto").count() == 1
    assert "Circoscrizione" in v.page.inner_text("#scheda .scheda-contesto")
    # «Sezione» non si ripete: titolo una volta, nessuna riga con quella etichetta
    assert testo.count("Sezione di censimento") == 1
    assert all("Sezione" not in s["etichette"] for s in sezioni)


def test_scheda_particella_ha_il_link_a_sister(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    link = v.page.locator("#scheda .scheda-sez[data-chiave='particella'] a.scheda-link")
    assert link.count() == 1
    assert link.get_attribute("href") == "https://sister3.agenziaentrate.gov.it/"
    assert "Visura su SISTER" in link.inner_text()
    assert link.get_attribute("rel") == "noopener noreferrer"
    assert "Fg." in link.inner_text() and "P." in link.inner_text()


def test_scheda_quotazioni_omi_a_fisarmonica(apri):
    v = apri()
    v.attendi_pronto()
    testo = _scheda_su(v, "omi", "Zone_OMI_2025_II", "omi-hit", 15)
    assert "Quotazioni OMI" in testo
    assert "Zona " in testo and "Fascia" in testo
    assert "Tipo prevalente:" in testo
    assert "Fonte: Agenzia delle Entrate" in testo
    assert v.page.locator("#scheda details.scheda-tipo").count() >= 1


def test_scheda_indirizzo_dal_civico_piu_vicino(apri):
    v = apri()
    v.attendi_pronto()
    testo = _scheda_su(v, "civici", "civici_wgs84", "civici-hit", 17)
    sezioni = _sezioni_scheda(v)
    indirizzo = next(s for s in sezioni if s["chiave"] == "indirizzo")
    assert indirizzo["etichette"] == ["Via", "Civico"]
    assert "Indirizzo" in testo


def test_scheda_vincoli(apri):
    v = apri()
    v.attendi_pronto()
    testo = _scheda_su(v, "prg", "va", "prg-va-hit", 15)
    assert "Vincoli" in testo
    assert "vincolo areale" in testo.lower()  # i sottotitoli sono in maiuscoletto via CSS


def test_scheda_terreno_ha_i_gruppi_dell_app_originale(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "griglia", "griglia", "griglia-hit", 15)
    terreno = v.page.locator("#scheda .scheda-sez[data-chiave='terreno']")
    assert terreno.evaluate("e => e.open") is False  # di default chiuso: la scheda parte dalle informazioni essenziali
    terreno.locator("summary").click()
    titoli = terreno.locator("h4").all_text_contents()
    assert titoli[:4] == ["Pendenza", "Morfologia", "Rischio versanti", "Indici morfometrici"]
    assert terreno.locator(".scheda-badge").count() >= 1  # classi di stabilità/costruibilità
    assert terreno.locator(".scheda-griglia .scheda-cella").count() == 4


def _rgb(colore):
    import re
    r, g, b = (int(x) for x in re.findall(r"\d+", colore)[:3])
    return r, g, b


def _luminanza(rgb):
    def canale(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (canale(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contrasto(a, b):
    la, lb = sorted((_luminanza(_rgb(a)), _luminanza(_rgb(b))), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def test_pannello_e_scheda_hanno_sfondo_chiaro_e_testo_a_contrasto_anche_con_sistema_scuro(apri):
    v = apri()
    v.page.emulate_media(color_scheme="dark")  # il sistema dell'utente è in tema scuro
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    colori = v.js(
        """() => Object.fromEntries(['gruppo-base', 'scheda', 'cerca'].map(id => {
            const s = getComputedStyle(document.getElementById(id));
            return [id, { bg: s.backgroundColor, fg: s.color }];
        }))"""
    )
    for nome, c in colori.items():
        assert _luminanza(_rgb(c["bg"])) > 0.8, f"{nome}: sfondo non chiaro {c['bg']}"
        assert _contrasto(c["fg"], c["bg"]) >= 7, f"{nome}: contrasto insufficiente {c}"
    # anche le etichette secondarie della scheda restano leggibili (almeno AA, 4.5)
    sfondo = colori["scheda"]["bg"]
    secondario = v.js("getComputedStyle(document.querySelector('#scheda .scheda-coordinate')).color")
    assert _contrasto(secondario, sfondo) >= 4.5


def test_le_sezioni_hanno_icone_svg_inline_senza_librerie_esterne(apri):
    v = apri()
    v.attendi_pronto()
    # nessuna libreria di icone esterna: solo SVG inline
    assert v.js("document.querySelector('link[href*=\"font-awesome\"]')") is None
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    icona = lambda chiave: v.js(
        f"document.querySelector('#scheda .scheda-sez[data-chiave=\"{chiave}\"] h3 .scheda-icona')?.dataset.icona"
    )
    assert icona("particella") == "particella"
    assert icona("sezione") == "persone"
    assert icona("terreno") == "rilievo"
    assert v.js("document.querySelector('#scheda .scheda-sez[data-chiave=\"particella\"] a.scheda-link .scheda-icona')?.dataset.icona") == "esterno"
    # le icone sono vere SVG, decorative: nascoste alle tecnologie assistive
    assert v.js("document.querySelectorAll('#scheda .scheda-sez h3 .scheda-icona svg[aria-hidden=true] path').length") >= 3


def test_icone_delle_altre_sezioni(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "omi", "Zone_OMI_2025_II", "omi-hit", 15)
    nome = lambda sel: v.js(f"document.querySelector('{sel}')?.dataset.icona")
    assert nome("#scheda .scheda-sez[data-chiave^=\"omi-\"] h3 .scheda-icona") == "euro"
    assert nome("#scheda .scheda-acc > summary .scheda-icona") == "casa"
    v2 = apri()
    v2.attendi_pronto()
    _scheda_su(v2, "civici", "civici_wgs84", "civici-hit", 17)
    assert v2.js("document.querySelector('#scheda .scheda-sez[data-chiave=\"indirizzo\"] h3 .scheda-icona')?.dataset.icona") == "indirizzo"
    v3 = apri()
    v3.attendi_pronto()
    _scheda_su(v3, "prg", "va", "prg-va-hit", 15)
    assert v3.js("document.querySelector('#scheda .scheda-sez[data-chiave=\"vincoli\"] h3 .scheda-icona')?.dataset.icona") == "vincolo"


def test_le_parti_espandibili_si_riconoscono_come_cliccabili(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "omi", "Zone_OMI_2025_II", "omi-hit", 15)
    stile = lambda sel: v.js(
        f"""() => {{ const e = document.querySelector('{sel}');
            const s = getComputedStyle(e), b = getComputedStyle(e, '::before');
            return {{ cursore: s.cursor, marcatore: s.listStyleType, contenuto: b.content, trasformazione: b.transform }}; }}"""
    )
    for sel in ("#scheda .scheda-acc > summary", "#scheda .scheda-tipo > summary"):
        r = stile(sel)
        assert r["cursore"] == "pointer", sel
        assert r["marcatore"] == "none", sel  # niente triangolino nativo: c'è il nostro chevron
        assert "▸" in r["contenuto"], sel
        assert r["trasformazione"] == "none", sel  # chiuso: chevron a destra
    # aperto, il chevron ruota verso il basso e compare il suggerimento
    v.page.click("#scheda .scheda-acc > summary")
    assert "Seleziona una tipologia" in v.page.inner_text("#scheda")
    v.page.click("#scheda .scheda-tipo > summary")
    assert stile("#scheda .scheda-tipo > summary")["trasformazione"] != "none"
    assert stile("#scheda .scheda-tipo > summary")["contenuto"].count("▸") == 1


def test_avviso_sul_valore_legale_e_sempre_visibile(apri):
    v = apri()
    v.attendi_pronto()
    avviso = v.page.locator(".avviso-fisso")
    assert avviso.is_visible()
    assert "senza valore legale" in avviso.inner_text()


def test_le_schede_di_catasto_prg_e_vincoli_hanno_l_avviso_legale_una_volta_sola(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    assert v.page.locator("#scheda .scheda-legale").count() == 1
    assert "valore legale" in v.page.locator("#scheda .scheda-legale").inner_text()
    assert v.page.locator("#scheda .scheda-sez .scheda-nota", has_text="valore legale").count() == 0
    _scheda_su(v, "prg", "zto", "prg-zto-hit", 15)
    assert "valore legale" in v.page.locator("#scheda .scheda-legale").inner_text()
    # la nota specifica del PRG resta nella sua sezione
    assert "Variante generale 2004" in v.page.locator("#scheda .scheda-sez[data-chiave='zonizzazione'] .scheda-nota").inner_text()
    _scheda_su(v, "prg", "va", "prg-va-hit", 15)
    assert v.page.locator("#scheda .scheda-legale").count() == 1


def test_avvisi_sopra_la_ricerca_si_chiudono_e_spariscono(apri):
    v = apri()
    v.attendi_pronto()
    v.page.evaluate("import('./js/core/pannello.js').then(m => m.segnala('prova avviso'))")
    v.page.wait_for_selector("#avvisi div")
    # sta dentro l'area di ricerca (non copre i filtri) e ha il suo pulsante di chiusura
    assert v.page.locator("#area-ricerca #avvisi").count() == 1
    v.page.click("#avvisi button")
    assert v.page.locator("#avvisi div").count() == 0
    # dopo la chiusura lo stesso testo può ricomparire
    v.page.evaluate("import('./js/core/pannello.js').then(m => m.segnala('prova avviso'))")
    v.page.wait_for_selector("#avvisi div")


def test_la_pagina_non_scorre_e_la_ricerca_resta_in_vista(apri):
    v = apri()
    for w, h in [(1032, 1376), (1440, 960), (768, 1024)]:  # iPad Pro 13", Surface Pro, tablet in verticale
        v.page.set_viewport_size({"width": w, "height": h})
        v.attendi_pronto()
        r = v.page.evaluate("""() => {
          const b = document.querySelector('#cerca').getBoundingClientRect();
          return { overflow: getComputedStyle(document.documentElement).overflow, scorre: document.documentElement.scrollHeight > innerHeight,
                   inVista: b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth };
        }""")
        assert r == {"overflow": "hidden", "scorre": False, "inVista": True}, (w, h, r)


def test_con_scheda_aperta_toolbar_ricerca_e_legenda_non_si_sovrappongono(apri):
    v = apri()
    v.page.set_viewport_size({"width": 1100, "height": 800})
    v.attendi_pronto()
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    r = v.page.evaluate("""() => {
      const rc = s => document.querySelector(s).getBoundingClientRect();
      const mappaVisibile = rc('#scheda').left;
      const barra = rc('#barra-strumenti'), ricerca = rc('#cerca'), legenda = rc('#legende');
      const sovrap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return { barraDentro: barra.right <= mappaVisibile + 1 && barra.left >= -1, ricercaDentro: ricerca.right <= mappaVisibile + 1,
               legendaRicerca: legenda.height > 0 && sovrap(legenda, ricerca) };
    }""")
    assert r["barraDentro"] and r["ricercaDentro"]
    assert not r["legendaRicerca"]


def test_la_legenda_dichiara_che_il_2023_e_una_stima(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-coropletico")
    v.page.check("#strato-coropletico")  # il censimento parte spento
    assert v.page.locator(".legenda .nota-stime").count() == 0  # 2021: dato censuario
    v.mostra("#pop-anno")
    v.page.select_option("#pop-anno", "2023")
    v.page.wait_for_selector(".legenda .nota-stime")
    assert "stime campionarie" in v.page.inner_text(".legenda .nota-stime")
    v.mostra("#pop-anno")
    v.page.select_option("#pop-anno", "2021")
    v.page.wait_for_function("document.querySelectorAll('.legenda .nota-stime').length === 0")


def test_se_il_2023_non_si_carica_resta_il_2021_e_lo_dice(apri):
    v = apri(blocca="**/sezioni_indicatori_2023.compatto.json")
    v.attendi_pronto()
    prima = v.js("window.dt.moduli.popolazione.stato()")
    assert prima["anno"] == 2021 and prima["nValori"] > 0
    v.mostra("#pop-anno")
    v.page.select_option("#pop-anno", "2023")
    v.page.wait_for_function(
        "document.getElementById('avvisi').textContent.includes('Popolazione 2023 non disponibile')", timeout=30000
    )
    # il menu, lo stato e la mappa dicono tutti la stessa cosa: si è rimasti sul 2021
    assert v.page.input_value("#pop-anno") == "2021"
    assert v.js("window.dt.moduli.popolazione.stato()") == prima
    assert "stime campionarie" not in v.page.inner_text("#pannello")


def test_la_scheda_della_sezione_mostra_gli_indicatori_dell_anno_attivo(apri):
    v = apri()
    v.attendi_pronto()
    # il 2023 si scarica in background: la scheda non deve dipendere da cosa si è cliccato prima
    v.page.wait_for_function("window.dt.moduli.popolazione.stato().anniDisponibili.length === 2", timeout=60000)
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    etichette = v.page.locator("#scheda .scheda-sez[data-chiave='sezione'] .scheda-et").all_text_contents()
    assert "Densità 2021 (ab/ha)" in etichette
    assert "Indice di vecchiaia 2021" in etichette
    assert "Residenti 2023 (stima)" in etichette  # valore o «senza dato», ma sempre presente
    v.mostra("#pop-anno")
    v.page.select_option("#pop-anno", "2023")
    v.page.wait_for_function("window.dt.moduli.popolazione.stato().anno === 2023")
    v.page.locator("#scheda .scheda-x").click()
    v.clic(*v.js("(() => { const c = window.dt.map.getCenter(); return [c.lng, c.lat]; })()"))
    v.page.wait_for_selector("#scheda:not([hidden])")
    etichette = v.page.locator("#scheda .scheda-sez[data-chiave='sezione'] .scheda-et").all_text_contents()
    assert "Densità 2023 (ab/ha)" in etichette
    assert "Indice di vecchiaia 2023" in etichette


def test_se_un_pmtiles_non_si_carica_l_avviso_nomina_lo_strato_e_lo_disattiva(apri):
    # blocco il vero file del catasto (non una sorgente di prova)
    v = apri(blocca="**/PRG2004/particelle/particelle.pmtiles")
    v.attendi_pronto()
    v.page.wait_for_function(
        "document.getElementById('avvisi').textContent.includes('Catasto: particelle')", timeout=30000
    )
    avviso = v.page.inner_text("#avvisi")
    assert "Strato non caricato: Catasto: particelle" in avviso
    assert "catasto" not in avviso.replace("Catasto", "")  # niente id tecnico della sorgente
    casella = v.page.locator("#strato-catasto")
    assert casella.is_disabled() and not casella.is_checked()
    # gli altri strati restano utilizzabili
    assert v.page.locator("#strato-prg").is_enabled()
    v.mostra("#strato-prg")
    v.page.check("#strato-prg")
    assert v.js("window.dt.map.getLayoutProperty('prg-zto', 'visibility')") == "visible"


def test_catasto_ha_etichette_foglio_particella(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getLayer('catasto-etichette').type") == "symbol"
    v.mostra("#strato-catasto")
    v.page.check("#strato-catasto")
    assert v.js("window.dt.map.getLayoutProperty('catasto-etichette', 'visibility')") == "visible"


def test_basi_cartografiche_alternative(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#base-satellite")
    v.page.check("#base-satellite")
    assert v.js("window.dt.map.getLayoutProperty('base-satellite', 'visibility')") == "visible"
    assert v.js("window.dt.map.getLayoutProperty('base-bianco', 'visibility')") == "none"
    v.mostra("#base-bianco")
    v.page.check("#base-bianco")
    assert v.js("window.dt.map.getLayoutProperty('base-satellite', 'visibility')") == "none"
    assert v.js("window.dt.map.getLayoutProperty('base-bianco', 'visibility')") == "visible"


def test_ricerca_foglio_particella(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-catasto")
    v.page.check("#strato-catasto")
    v.vai(13.3568, 38.1204, 17)
    prop = v.js(
        "(() => { const f = window.dt.map.querySourceFeatures('catasto', {sourceLayer: 'particelle'})[0].properties;"
        " return [String(f.Foglio), String(f.Paricella)]; })()"
    )
    assert v.js("document.getElementById('pannello-filtri').hidden")
    v.page.click("#cerca-filtri")
    v.page.fill("#cerca-foglio", prop[0])
    v.page.fill("#cerca-numero", prop[1])
    v.page.click("#cerca-particella-vai")
    v.page.wait_for_selector(".maplibregl-popup")
    assert "Foglio" in v.page.inner_text(".maplibregl-popup")
    v.page.fill("#cerca-numero", "99999999")
    v.page.click("#cerca-particella-vai")
    assert "Nessuna particella" in v.page.inner_text("#cerca-particella-esito")


def test_tooltip_confini_sui_poligoni(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.3568, 38.1204, 13)
    v.page.wait_for_timeout(1500)
    v.page.mouse.move(*v.js("(() => { const p = window.dt.map.project([13.3568, 38.1204]); return [p.x, p.y]; })()"))
    v.page.wait_for_selector(".mappa-tooltip .confini-tooltip", timeout=10000)
    assert "Circoscrizione" in v.page.inner_text(".mappa-tooltip")


def test_barra_ricerca_riconosce_il_riferimento_catastale(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-catasto")
    v.page.check("#strato-catasto")
    v.vai(13.3568, 38.1204, 17)
    prop = v.js(
        "(() => { const f = window.dt.map.querySourceFeatures('catasto', {sourceLayer: 'particelle'})[0].properties;"
        " return [String(f.Foglio), String(f.Paricella)]; })()"
    )
    v.page.fill("#cerca-testo", f"foglio {prop[0]} particella {prop[1]}")
    v.page.wait_for_selector("#cerca-risultati button")
    assert "Particella catastale" in v.page.inner_text("#cerca-risultati")
    v.page.press("#cerca-testo", "Enter")
    v.page.wait_for_selector(".maplibregl-popup")
    assert f"Foglio {prop[0]}" in v.page.inner_text(".maplibregl-popup")


def test_barra_strumenti_zoom_home_e_schermo_intero(apri):
    v = apri()
    v.attendi_pronto()
    v.js("window.dt.map.jumpTo({zoom: 15})")
    assert float(v.js("document.getElementById('zoom-slider').value")) == 15
    assert v.page.inner_text("#zoom-badge") == "15"
    v.page.eval_on_selector("#zoom-slider", "e => { e.value = 17; e.dispatchEvent(new Event('input')); }")
    assert abs(v.js("window.dt.map.getZoom()") - 17) < 0.01
    v.page.click("#btn-home")
    v.page.wait_for_function("Math.abs(window.dt.map.getZoom() - 12) < 0.05")
    assert v.page.locator("#btn-fs").count() == 1


def test_default_2d_senza_rotazione_con_edificato_e_senza_censimento(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getPitch()") == 0 and v.js("window.dt.map.getBearing()") == 0
    assert not v.js("window.dt.map.dragRotate.isEnabled()")
    assert not v.js("window.dt.map.touchPitch.isEnabled()")
    assert v.js("window.dt.map.getLayoutProperty('edifici-2d', 'visibility') !== 'none'")
    assert v.js("window.dt.map.getLayoutProperty('pop-fill', 'visibility')") == "none"
    assert v.js("document.getElementById('strato-edificato').checked")
    assert not v.js("document.getElementById('strato-coropletico').checked")


def test_pulsante_3d_abilita_inclinazione_e_torna_in_2d(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#btn-3d")
    v.page.wait_for_function("window.dt.map.getPitch() > 50")
    assert v.js("window.dt.map.dragRotate.isEnabled()")
    assert v.js("window.dt.map.getLayoutProperty('edifici-3d', 'visibility')") == "visible"
    assert v.page.get_attribute("#btn-3d", "aria-pressed") == "true"
    v.page.click("#btn-3d")
    v.page.wait_for_function("window.dt.map.getPitch() < 1")
    assert not v.js("window.dt.map.dragRotate.isEnabled()")
    assert v.page.get_attribute("#btn-3d", "aria-pressed") == "false"


def test_filtri_zona_a_scalare(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#cerca-filtri")
    n_circ = v.js("document.getElementById('f-circ').options.length")
    n_upl_tutte = v.js("document.getElementById('f-upl').options.length")
    assert n_circ == 9  # 8 circoscrizioni + «Tutte»
    v.page.select_option("#f-circ", "II")
    n_quart = v.js("document.getElementById('f-quart').options.length")
    assert 1 < n_quart < 26
    assert v.js("document.getElementById('f-upl').options.length") < n_upl_tutte
    quart = v.js("document.getElementById('f-quart').options[1].value")
    v.page.select_option("#f-quart", quart)
    upl = v.js("document.getElementById('f-upl').options[1].value")
    v.page.select_option("#f-upl", upl)
    assert v.js("window.dt.map.getLayoutProperty('filtro-maschera', 'visibility')") == "visible"
    assert v.page.locator(".chip-zona").count() == 3
    # togliere il quartiere azzera anche l'UPL e lascia la circoscrizione
    v.page.locator(".chip-zona button").nth(1).click()
    assert v.page.locator(".chip-zona").count() == 1
    assert v.js("document.getElementById('f-circ').value") == "II"
    v.page.locator(".chip-zona button").nth(0).click()
    assert v.js("window.dt.map.getLayoutProperty('filtro-maschera', 'visibility')") == "none"


def test_ricerca_trova_le_zone(apri):
    v = apri()
    v.attendi_pronto()
    v.page.fill("#cerca-testo", "settecannoli")
    v.page.wait_for_selector("#cerca-risultati button")
    assert "Quartiere" in v.page.inner_text("#cerca-risultati") or "UPL" in v.page.inner_text("#cerca-risultati")
    v.page.press("#cerca-testo", "Enter")
    assert v.page.locator(".chip-zona").count() >= 1


def test_vista_ed_estensione_come_catasto_app_e_catasto_da_zoom_12(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getLayer('catasto').minzoom") == 12
    assert v.js("window.dt.map.getMaxBounds().toArray()") == [[13.1, 37.9785], [13.55, 38.2919]]
    assert v.js("document.getElementById('zoom-slider').min") == "12"
    assert v.js("document.getElementById('zoom-slider').max") == "18"


def test_ricerca_numeri_romani_selezionano_la_circoscrizione(apri):
    v = apri()
    v.attendi_pronto()
    for romano in ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]:
        v.page.fill("#cerca-testo", romano.lower())
        v.page.wait_for_selector("#cerca-risultati button")
        assert "Circoscrizione" in v.page.locator("#cerca-risultati button").first.inner_text()
        v.page.press("#cerca-testo", "Enter")
        assert v.js("document.getElementById('f-circ').value") == romano


def test_strati_stanno_in_sotto_pannelli_della_barra_e_si_apre_uno_solo(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("!document.getElementById('pannello').querySelector('.sotto-pannello:not([hidden])')")
    v.page.click("#btn-gruppo-base")
    assert v.page.is_visible("#gruppo-base")
    v.page.click("#btn-gruppo-edifici")
    assert v.page.is_visible("#gruppo-edifici")
    assert not v.page.is_visible("#gruppo-base")
    v.page.click("#btn-gruppo-edifici")
    assert not v.page.is_visible("#gruppo-edifici")


def test_carta_tecnica_2k_tra_le_cartografie_di_base(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getSource('ctr-r').tiles[0]") == "https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png"
    v.mostra("#base-ctr")
    v.page.check("#base-ctr")
    assert v.js("window.dt.map.getLayoutProperty('base-ctr', 'visibility')") == "visible"
    assert v.js("window.dt.map.getLayoutProperty('base-satellite', 'visibility')") == "none"
    v.page.check("#base-satellite")
    assert v.js("window.dt.map.getLayoutProperty('base-ctr', 'visibility')") == "none"


def test_pulsante_info_nella_barra_apre_il_modale_dal_basso(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("!!document.querySelector('#barra-strumenti #apri-crediti')")
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    v.page.wait_for_timeout(500)  # fine animazione di salita
    r = v.js("(() => { const b = document.getElementById('crediti').getBoundingClientRect(); return { fondo: b.bottom, alt: innerHeight }; })()")
    assert abs(r["fondo"] - r["alt"]) < 2  # ancorato al bordo inferiore


def test_modale_info_ha_i_tab_fonti_guida_credits(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    assert v.js("[...document.querySelectorAll('#crediti [role=tab]')].map(t => t.textContent)") == ["Fonti e avvisi", "Argomenti", "Guida", "Plugin RNDT", "Credits"]
    assert v.page.is_visible("#tabpanel-fonti") and not v.page.is_visible("#tabpanel-guida")
    v.page.click("#tab-guida")
    assert v.page.is_visible("#tabpanel-guida") and not v.page.is_visible("#tabpanel-fonti")
    v.page.click("#tab-credits")
    assert "provvisorio" in v.page.inner_text("#tabpanel-credits")


def test_tab_guida_mostra_i_passi_con_le_immagini(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    v.page.click("#tab-guida")
    assert "provvisorio" not in v.page.inner_text("#tabpanel-guida")
    assert v.js("document.querySelectorAll('#tabpanel-guida .guida-passo').length") == 11
    v.page.wait_for_function("document.querySelector('#tabpanel-guida video').duration > 10", timeout=15000)
    assert v.js("document.querySelector('#tabpanel-guida video track').track.mode") in ("showing", "hidden", "disabled")
    assert v.js("document.querySelector('#tabpanel-guida audio source').getAttribute('src')") == "media/guida/guida.mp3"
    v.js("document.querySelectorAll('#tabpanel-guida img').forEach(i => i.loading = 'eager')")
    v.page.wait_for_function("[...document.querySelectorAll('#tabpanel-guida img')].every(i => i.complete && i.naturalWidth > 0)", timeout=15000)
    # l'indice porta al passo
    v.page.click("#tabpanel-guida .guida-indice a[href='#guida-filtri']")
    v.page.wait_for_timeout(400)
    assert v.js("document.getElementById('guida-filtri').getBoundingClientRect().top < innerHeight")


def test_tab_guida_non_causa_scroll_orizzontale_su_mobile(apri):
    v = apri()
    v.page.set_viewport_size({"width": 390, "height": 800})
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    v.page.click("#tab-guida")
    assert v.js("(() => { const c = document.querySelector('#crediti .tab-corpo'); return c.scrollWidth <= c.clientWidth + 1; })()")


def test_tab_argomenti_accende_gli_strati_e_resta_aperta(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    v.page.click("#tab-argomenti")
    assert v.page.is_visible("#tabpanel-argomenti")
    assert "Edifici" in v.page.inner_text("#tabpanel-argomenti")
    # lo strato spento si accende dalla tab: casella del pannello e visibilita in mappa allineate
    assert not v.js("document.getElementById('strato-edifici3d').checked")
    v.page.check("#tabpanel-argomenti input[data-strato=edifici3d]")
    assert v.js("document.getElementById('strato-edifici3d').checked")
    assert v.js("window.dt.map.getLayoutProperty('edifici-3d', 'visibility')") == "visible"
    assert v.page.is_visible("#crediti[open]")  # il foglio resta aperto
    # lo spegnimento dal pannello si riflette nella tab alla riapertura della tab
    v.js("(() => { const c = document.getElementById('strato-edifici3d'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); })()")
    v.page.click("#tab-fonti")
    v.page.click("#tab-argomenti")
    assert not v.js("document.querySelector('#tabpanel-argomenti input[data-strato=edifici3d]').checked")


def test_foglio_info_linguetta_in_cima_e_sincronia_con_la_scheda(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#linguetta-info")
    v.page.wait_for_selector("#crediti[open]")
    assert not v.page.is_visible("#linguetta-info")
    # testo lungo: compare "In cima" dopo lo scroll e riporta su
    v.js("document.querySelector('#crediti .tab-corpo').insertAdjacentHTML('beforeend', '<div style=\"height:2000px\"></div>')")
    assert not v.page.is_visible("#crediti .in-cima")
    v.js("(() => { const c = document.querySelector('#crediti .tab-corpo'); c.scrollTop = 500; })()")
    v.page.wait_for_selector("#crediti .in-cima", state="visible")
    v.page.click("#crediti .in-cima")
    v.page.wait_for_function("document.querySelector('#crediti .tab-corpo').scrollTop === 0")
    # con la scheda di destra aperta il foglio si ferma prima di lei
    larghezza = v.js("innerWidth")
    prima = v.js("document.getElementById('crediti').getBoundingClientRect().right")
    v.js("document.getElementById('scheda').hidden = false")
    v.page.wait_for_function(f"document.getElementById('crediti').getBoundingClientRect().right <= {larghezza - 340}")
    # la linguetta del foglio e Esc lo chiudono
    v.page.click("#crediti .crediti-linguetta")
    assert not v.js("document.getElementById('crediti').open")
    v.page.wait_for_selector("#linguetta-info", state="visible")  # l'evento close è asincrono
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    assert not v.page.locator("#crediti .crediti-chiudi").count()  # niente pulsante in fondo
    v.page.click("#crediti .crediti-x")  # la X nell'header chiude
    assert not v.js("document.getElementById('crediti').open")
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    v.page.keyboard.press("Escape")
    assert not v.js("document.getElementById('crediti').open")


def test_mobile_barra_verticale_a_sinistra_e_desktop_orizzontale(apri):
    v = apri()
    v.attendi_pronto()
    d = v.js("(() => { const r = document.getElementById('barra-strumenti').getBoundingClientRect(); return { w: r.width, h: r.height }; })()")
    assert d["w"] > d["h"]  # desktop: pillola orizzontale
    assert not v.page.is_visible("#barra-strumenti .et")
    v.page.set_viewport_size({"width": 390, "height": 760})
    v.page.wait_for_timeout(300)
    r = v.js("(() => { const r = document.getElementById('barra-strumenti').getBoundingClientRect(); return { x: r.x, w: r.width, h: r.height, r: r.right }; })()")
    assert r["h"] > r["w"] and r["x"] < 12 and r["r"] < 80
    assert not v.page.is_visible("#zoom-slider")
    assert v.page.is_visible("#btn-gruppo-base .et")
    assert v.js("document.documentElement.scrollWidth <= innerWidth")
    v.page.click("#btn-gruppo-edifici")
    p = v.js("(() => { const r = document.getElementById('gruppo-edifici').getBoundingClientRect(); return r.left; })()")
    assert p >= r["r"]  # il sotto-pannello si apre accanto alla barra
    assert v.js("document.getElementById('btn-gruppo-edifici').dataset.attivo") == "true"
    assert v.js("document.getElementById('btn-gruppo-terreno').dataset.attivo") == "false"


def test_cartografie_di_base_come_cerchi_con_miniatura_e_icona_barra_che_segue(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("document.querySelectorAll('#gruppo-base .base-cerchio').length") == 4
    assert v.js("[...document.querySelectorAll('#gruppo-base h3')].map(h => h.textContent)") == ["Basi moderne", "Cartografia tecnica", "Sfondo neutro"]
    v.page.click("#btn-gruppo-base")
    v.page.click("#gruppo-base label[title^='Carta Tecnica']")  # si sceglie cliccando il cerchio
    assert v.js("window.dt.map.getLayoutProperty('base-ctr', 'visibility')") == "visible"
    assert "ctr.jpg" in v.js("getComputedStyle(document.getElementById('btn-gruppo-base')).getPropertyValue('--miniatura')")
    assert v.js("document.getElementById('base-ctr').checked")


def test_edificato_si_vede_gia_a_zoom_12(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getLayer('edifici-2d').minzoom") == 12
    assert v.js("window.dt.map.getLayer('edifici-hit').minzoom") == 12


def test_layer_ha_l_icona_dei_livelli_e_il_bianco_sta_dopo_la_carta_tecnica(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("document.querySelector('#btn-gruppo-territorio .et').textContent") == "Layer"
    assert v.js("document.querySelector('#gruppo-territorio h2').textContent") == "Layer"
    assert v.js("[...document.querySelectorAll('#gruppo-base input')].map(i => i.id)") == ["base-positron", "base-satellite", "base-ctr", "base-bianco"]


def _primo_luogo(nome):
    """Punto e nome del primo luogo di dati/scuole/<nome>.geojson che ha anche un poligono abbinato."""
    base = Path(__file__).resolve().parents[1] / "dati" / "scuole"
    punti = json.loads((base / f"{nome}.geojson").read_text(encoding="utf-8"))["features"]
    con_poligono = {f["properties"]["id"] for f in json.loads((base / f"{nome}_edifici.geojson").read_text(encoding="utf-8"))["features"]}
    f = next(f for f in punti if f["properties"]["id"] in con_poligono)
    return f["geometry"]["coordinates"], f["properties"]["nome"]


@pytest.mark.parametrize("nome,strato", [("scuole", "scuole"), ("seggi", "seggi")])
def test_scheda_scuole_e_seggi_anche_a_strato_spento(apri, nome, strato):
    """Il pannello di destra mostra i dati del luogo anche se lo strato è spento (layer trasparenti sempre presenti)."""
    v = apri()
    v.mostra("#strato-" + strato)
    assert not v.page.is_checked("#strato-" + strato)
    (lon, lat), titolo = _primo_luogo(nome)
    v.vai(lon, lat, 17)
    v.page.wait_for_function(f"window.dt.map.queryRenderedFeatures({{layers: ['{nome}-hit-punti']}}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert titolo.lower() in v.page.inner_text("#scheda").lower()
    assert v.js(f"window.dt.map.getLayoutProperty('{nome}-poli', 'visibility')") == "none"


def test_strato_scuole_mostra_i_poligoni(apri):
    v = apri()
    v.mostra("#strato-scuole")
    v.page.check("#strato-scuole")
    (lon, lat), _ = _primo_luogo("scuole")
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['scuole-poli']}).length > 0")
    assert not any("scuole" in e for e in v.errori)


def _dati_trasporto():
    """Genera dati/trasporto/ se manca (come per scuole e monumenti: non sta in git); salta se non c'è il feed."""
    cartella = ROOT / "dati" / "trasporto"
    if not (cartella / "orari.json").exists():
        if not (ROOT / "dati" / "gtfs" / "stop_times.txt").exists():
            pytest.skip("dati/gtfs assente")
        import gtfs
        gtfs.scrivi(gtfs.costruisci())
    return cartella


def _fermata_con_orari():
    """Coordinate, nome e id della prima fermata che ha orari."""
    base = _dati_trasporto()
    con_orari = set(json.loads((base / "orari.json").read_text(encoding="utf-8"))["fermate"])
    for f in json.loads((base / "fermate.geojson").read_text(encoding="utf-8"))["features"]:
        if f["properties"]["id"] in con_orari:
            return f["geometry"]["coordinates"], f["properties"]
    raise AssertionError("nessuna fermata con orari")


def test_trasporto_voci_del_pannello_sempre_visibili_anche_spente(apri):
    _dati_trasporto()
    v = apri()
    v.mostra("#strato-trasporto-bus")
    for strato in ("trasporto-bus", "trasporto-tram", "trasporto-fermate"):
        assert v.page.is_visible(f"#strato-{strato}")
        assert not v.page.is_checked(f"#strato-{strato}")
    assert not v.page.is_visible("#legende .legenda-trasporto")  # la legenda sulla mappa compare solo a strato acceso
    v.page.check("#strato-trasporto-tram")
    assert v.page.is_visible("#legende .legenda-trasporto >> text=Linea tram")
    assert not v.page.is_checked("#legende label:has-text('Linea bus') input")  # la riga c'è, sfumata, e riaccende lo strato
    assert v.page.is_checked("#legende label:has-text('Linea tram') input")
    v.page.uncheck("#strato-trasporto-tram")
    assert not v.page.is_visible("#legende .legenda-trasporto")
    assert v.js("window.dt.map.getLayoutProperty('trasporto-fermate', 'visibility')") == "none"


def test_trasporto_accendere_gli_strati_mostra_linee_e_fermate(apri):
    (lon, lat), _ = _fermata_con_orari()
    v = apri()
    v.mostra("#strato-trasporto-fermate")
    for strato in ("trasporto-bus", "trasporto-tram", "trasporto-fermate"):
        v.page.check(f"#strato-{strato}")
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-fermate']}).length > 0")
    assert not any("trasporto" in e.lower() for e in v.errori)


def test_trasporto_scheda_fermata_anche_a_strato_spento(apri):
    (lon, lat), p = _fermata_con_orari()
    v = apri()
    v.mostra("#strato-trasporto-fermate")
    assert not v.page.is_checked("#strato-trasporto-fermate")
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-fermate']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert p["nome"].lower() in v.page.inner_text("#scheda").lower()
    v.page.wait_for_selector("#scheda .trasporto-orari input[type=date]")  # orari scaricati e selettore del giorno disegnato
    assert v.page.locator("#scheda .trasporto-orari input[type=date]").first.input_value()  # più input se c'è anche una linea: basta il primo
    assert v.js("window.dt.map.getLayoutProperty('trasporto-fermate', 'visibility')") == "none"


def test_trasporto_clic_su_un_punto_qualsiasi_elenca_le_fermate_vicine_e_il_nome_zooma(apri):
    (lon, lat), p = _fermata_con_orari()
    v = apri()
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-fermate']}).length > 0")
    v.clic(lon, lat + 0.00045)  # ~50 m dalla fermata
    v.page.wait_for_selector("#scheda:not([hidden])")
    sez = v.page.locator("#scheda [data-chiave='trasportovicino']")
    assert sez.count() == 1
    assert "Trasporto pubblico vicino" in sez.inner_text() and " m" in sez.inner_text()
    assert v.js("window.dt.map.getSource('scheda-evidenza')._data.features.length") >= 1  # fermate vicine sulla mappa
    v.page.click("#scheda [data-chiave='trasportovicino'] .trasporto-vicina-nome >> nth=0")
    v.page.wait_for_function("window.dt.map.getZoom() >= 17.4")


def test_trasporto_clic_su_linea_mostra_percorso_intero_e_fermate(apri):
    (lon, lat), p = _fermata_con_orari()
    v = apri()
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-fermate']}).length > 0")
    v.clic(lon, lat + 0.00045)
    v.page.wait_for_selector("#scheda [data-chiave='trasportovicino'] .trasporto-chip-bottone")
    v.page.click("#scheda [data-chiave='trasportovicino'] .trasporto-chip-bottone >> nth=0")
    tipi = v.js("(() => { const f = window.dt.map.getSource('scheda-evidenza')._data.features; return [f.some(x => x.geometry.type === 'LineString'), f.some(x => x.geometry.type === 'Point')]; })()")
    assert tipi == [True, True]  # tracciato e fermate della linea
    # il luogo selezionato (edificio) resta evidenziato insieme al percorso
    assert v.js("window.dt.map.getSource('scheda-evidenza')._data.features.some(x => x.geometry.type === 'Polygon' || x.geometry.type === 'MultiPolygon')")
    # il punto cliccato resta in mappa e dentro l'inquadratura
    v.page.wait_for_timeout(900)
    assert v.js("window.dt.map.getSource('scheda-evidenza')._data.features.some(x => Math.abs(x.geometry.coordinates[1] - %f) < 1e-4)" % (lat + 0.00045))
    assert v.js("window.dt.map.getBounds().contains([%f, %f])" % (lon, lat + 0.00045))


def test_trasporto_clic_su_strada_con_molte_linee_una_sola_voce_e_orari_solo_all_apertura(apri):
    base = _dati_trasporto()
    linee = json.loads((base / "linee.geojson").read_text(encoding="utf-8"))["features"]
    lon, lat = linee[0]["properties"]["lon"], linee[0]["properties"]["lat"]
    v = apri()
    v.vai(lon, lat, 16)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-linee']}).length > 0")
    richieste = []
    v.page.on("request", lambda r: richieste.append(r.url) if r.url.endswith("orari.json") else None)
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert v.page.locator("#scheda [data-chiave='linee']").count() == 1  # una sola sezione «Linee», non una per tracciato
    if v.page.locator("#scheda [data-chiave='linee'] details.trasporto-linea").count() > 1:
        assert richieste == []  # più linee: chiuse, nessun download degli orari finché non se ne apre una
        v.page.click("#scheda [data-chiave='linee'] details.trasporto-linea >> nth=0 >> summary")
        v.page.wait_for_selector("#scheda [data-chiave='linee'] .trasporto-orari")


def test_trasporto_orari_non_scaricabili_lo_dicono_e_il_viewer_resta_vivo(apri):
    (lon, lat), _ = _fermata_con_orari()
    v = apri(blocca="**/dati/trasporto/orari.json")
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-fermate']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda .trasporto-orari")
    v.page.wait_for_function("document.querySelector('#scheda .trasporto-orari').textContent.includes('Orari non disponibili')")
    assert v.js("window.dt.pronto") is True


def test_ricerca_trova_fermata_e_linea_e_accende_lo_strato(apri):
    base = _dati_trasporto()
    fermata = json.loads((base / "fermate.geojson").read_text(encoding="utf-8"))["features"][0]["properties"]
    v = apri()
    v.attendi_pronto()
    assert not v.js("document.getElementById('strato-trasporto-fermate').checked")
    _cerca_e_vai(v, fermata["nome"].lower(), fermata["lon"], fermata["lat"])
    assert v.js("document.getElementById('strato-trasporto-fermate').checked")

    # una linea tram, se c'è: lo strato da accendere dipende dal tipo e il test deve poterlo distinguere
    linee = [f["properties"] for f in json.loads((base / "linee.geojson").read_text(encoding="utf-8"))["features"]]
    linea = next((p for p in linee if p["tipo"] == "tram"), linee[0])
    strato, altro = ("trasporto-tram", "trasporto-bus") if linea["tipo"] == "tram" else ("trasporto-bus", "trasporto-tram")
    v.page.fill("#cerca-testo", f"linea {linea['numero']} {linea['nome']}".lower())  # nome completo: il primo risultato è questa linea (o l'altra sua direzione)
    v.page.wait_for_selector("#cerca-risultati button")
    assert f"Linea {linea['numero']}" in v.page.inner_text("#cerca-risultati button >> nth=0")
    v.page.click("#cerca-risultati button >> nth=0")
    assert v.js(f"document.getElementById('strato-{strato}').checked")
    assert not v.js(f"document.getElementById('strato-{altro}').checked")


def _muovi_su(v, lon, lat):
    x, y = v.js(
        f"""(() => {{
            const m = window.dt.map, p = m.project([{lon}, {lat}]);
            const r = m.getCanvas().getBoundingClientRect();
            return [r.left + p.x, r.top + p.y];
        }})()"""
    )
    v.page.mouse.move(x - 30, y - 30)  # un movimento prima, perché MapLibre riceva mousemove sul punto
    v.page.mouse.move(x, y)


def test_trasporto_tooltip_su_fermata_e_su_linea_solo_a_strato_acceso(apri):
    (lon, lat), p = _fermata_con_orari()
    v = apri()
    v.mostra("#strato-trasporto-fermate")
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-fermate']}).length > 0")
    _muovi_su(v, lon, lat)
    assert not v.page.locator(".mappa-tooltip .trasporto-tooltip-corpo").count()  # strato spento: nessun tooltip del trasporto
    v.page.check("#strato-trasporto-fermate")
    _muovi_su(v, lon, lat)
    v.page.wait_for_selector(".mappa-tooltip")
    assert p["nome"].lower() in v.page.inner_text(".mappa-tooltip").lower()

    linea = json.loads((_dati_trasporto() / "linee.geojson").read_text(encoding="utf-8"))["features"][0]["properties"]
    v.page.uncheck("#strato-trasporto-fermate")
    v.page.check("#strato-trasporto-tram" if linea["tipo"] == "tram" else "#strato-trasporto-bus")
    v.vai(linea["lon"], linea["lat"], 16)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-linee']}).length > 0")
    _muovi_su(v, linea["lon"], linea["lat"])
    v.page.wait_for_selector(".mappa-tooltip .trasporto-chip")
    testo = v.page.inner_text(".mappa-tooltip")
    # su una strada con molte linee il tooltip ne elenca al massimo 4 e conta le altre
    assert linea["numero"] in testo or "altre" in testo
    assert v.page.locator(".mappa-tooltip .trasporto-chip").count() <= 4


def test_scheda_edificio_uno_unk_diventa_scuola_se_il_clic_cade_sul_poligono_della_scuola(apri):
    """Uso «UNK» dell'edificato: dove l'edificio coincide con un poligono di scuola, la scheda dice «Scuola o asilo»."""
    from shapely.geometry import shape
    poligoni = json.loads((ROOT / "dati" / "scuole" / "scuole_edifici.geojson").read_text(encoding="utf-8"))["features"]
    v = apri()
    v.attendi_pronto()
    trovato = None
    for f in poligoni[:60]:
        p = shape(f["geometry"]).representative_point()
        v.vai(p.x, p.y, 17)
        occupancy = v.js(
            f"""(() => {{ const m = window.dt.map, q = m.queryRenderedFeatures(m.project([{p.x}, {p.y}]), {{ layers: ['edifici-hit'] }});
                return q.length ? q[0].properties.occupancy : null; }})()"""
        )
        if occupancy == "UNK":
            trovato = (p.x, p.y)
            break
    if trovato is None:
        pytest.skip("nessuna scuola su un edificio con uso UNK tra le prime 60")
    v.clic(*trovato)
    v.page.wait_for_selector("#scheda:not([hidden])")
    righe = v.page.locator("#scheda .scheda-riga", has_text="Uso").all_inner_texts()
    assert any("Scuola o asilo" in r for r in righe), righe
    assert not any("UNK" in r for r in righe)


def test_filtro_linea_mostra_solo_quella_linea_e_le_sue_fermate_e_si_toglie_col_chip(apri):
    base = _dati_trasporto()
    linee = [f["properties"] for f in json.loads((base / "linee.geojson").read_text(encoding="utf-8"))["features"]]
    scelta = next(p for p in linee if p["tipo"] == "bus")
    v = apri()
    v.attendi_pronto()
    v.page.click("#cerca-filtri")
    assert v.page.is_visible("#f-linea")
    assert not v.page.is_checked("#strato-trasporto-bus")
    v.page.select_option("#f-linea", scelta["route_id"])
    v.page.wait_for_selector("#filtri-linea-chips .chip-zona")
    assert f"Linea {scelta['numero']}" in v.page.inner_text("#filtri-linea-chips")
    assert v.page.is_checked("#strato-trasporto-bus") and v.page.is_checked("#strato-trasporto-fermate")  # si accendono da soli
    v.page.wait_for_function("!window.dt.map.isMoving()")
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-fermate']}).length > 0")
    # tutte le fermate disegnate sono di quella linea (le proprietà array arrivano come testo JSON)
    fuori = v.js(
        f"""window.dt.map.queryRenderedFeatures({{layers: ['trasporto-hit-fermate']}})
            .filter(f => !JSON.parse(f.properties.linee).includes({json.dumps(scelta['numero'])})).length"""
    )
    assert fuori == 0
    assert v.js("window.dt.map.getFilter('trasporto-hit-linee')") == ["==", ["get", "route_id"], scelta["route_id"]]

    v.page.click("#filtri-linea-chips .chip-zona button")
    assert not v.page.is_visible("#filtri-linea-chips")
    assert v.page.input_value("#f-linea") == ""
    assert v.js("window.dt.map.getFilter('trasporto-hit-linee')") in (None, [])
    assert v.js("window.dt.map.getFilter('trasporto-bus')") == ["==", ["get", "tipo"], "bus"]


def test_trasporto_non_cancella_il_cursore_mano_di_scuole_e_monumenti(apri):
    """Il tooltip del trasporto resettava il cursore a ogni mousemove, anche con i suoi strati spenti."""
    v = apri()
    v.mostra("#strato-scuole")
    v.page.check("#strato-scuole")
    (lon, lat), _ = _primo_luogo("scuole")
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['scuole-punti']}).length > 0")
    _muovi_su(v, lon, lat)
    v.page.wait_for_function("window.dt.map.getCanvas().style.cursor === 'pointer'", timeout=5000)


def _dati_sicurezza():
    """Genera dati/mobilita/sicurezza/*.pmtiles se mancano; salta se non ci sono i sorgenti dello studio."""
    cartella = ROOT / "dati" / "mobilita" / "sicurezza"
    if not (cartella / "archi.pmtiles").exists():
        if not (cartella / "rete_rischio.geojson").exists():
            pytest.skip("dati/mobilita/sicurezza assenti")
        import sicurezza_stradale
        sicurezza_stradale.scrivi()
    return cartella


def _arco_con_incidenti():
    """Punto medio e proprietà di un arco con tasso affidabile e almeno un incidente (da archi.geojson ridotto)."""
    base = _dati_sicurezza()
    for f in json.loads((base / "archi.geojson").read_text(encoding="utf-8"))["features"]:
        if "classe" in f["properties"]:
            c = f["geometry"]["coordinates"]
            return c[len(c) // 2], f["properties"]
    raise AssertionError("nessun arco con tasso")


def test_sicurezza_strati_presenti_e_spenti_di_default(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-archi")
    for strato in ("sicurezza-archi", "sicurezza-hotspot", "sicurezza-incidenti"):
        assert v.page.is_visible(f"#strato-{strato}"), strato
        assert not v.page.is_checked(f"#strato-{strato}"), strato
        assert v.js(f"window.dt.map.getLayoutProperty('{strato}', 'visibility')") == "none", strato
    assert not v.page.is_visible("#legende .legenda-sicurezza")  # legenda sulla mappa solo a strato acceso
    v.page.check("#strato-sicurezza-pericolose")
    assert v.page.is_visible("#legende .legenda-sicurezza")
    v.page.check("#strato-sicurezza-incidenti")
    assert v.page.is_visible("#legende .legenda-sicurezza >> text=Incidenti (da zoom 14)")
    v.page.uncheck("#strato-sicurezza-pericolose")
    v.page.uncheck("#strato-sicurezza-incidenti")
    assert not v.page.is_visible("#legende .legenda-sicurezza")


def test_sicurezza_accendere_archi_li_disegna(apri):
    (lon, lat), _ = _arco_con_incidenti()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-archi")
    v.page.check("#strato-sicurezza-archi")
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['sicurezza-archi']}).length > 0")
    assert not any("sicurezza" in e.lower() for e in v.errori)


def test_sicurezza_scheda_arco_anche_a_strato_spento(apri):
    (lon, lat), p = _arco_con_incidenti()
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getLayoutProperty('sicurezza-archi', 'visibility')") == "none"
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['sicurezza-hit-archi']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    testo = v.page.inner_text("#scheda")
    assert "Tratto stradale" in testo
    assert "Incidenti 2015–2023" in testo
    assert "2019" in testo  # nota sui limiti dei dati


def test_sicurezza_filtri_anno_e_gravita_nel_pannello_filtri(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    assert v.js("document.querySelector('#gruppo-sicurezza #sicurezza-anno')") is None  # il menu non sta più nella legenda
    v.page.click("#cerca-filtri")
    assert v.page.is_visible("#sicurezza-anno") and v.page.is_visible("#sicurezza-gravita")
    assert v.js("[...document.querySelectorAll('#sicurezza-anno option')].map(o => o.value)") == [
        "", "2015", "2016", "2017", "2018", "2020", "2021", "2022", "2023"]
    assert not v.page.is_checked("#strato-sicurezza-incidenti")
    assert v.js("window.dt.map.getLayer('sicurezza-incidenti').minzoom") == 14
    v.page.select_option("#sicurezza-anno", "2018")
    assert v.js("window.dt.map.getFilter('sicurezza-incidenti')") == ["==", ["get", "anno"], 2018]
    assert v.page.is_checked("#strato-sicurezza-incidenti")  # si accende da solo
    assert v.js("window.dt.map.getLayer('sicurezza-incidenti').minzoom") == 12  # con un filtro attivo si vede da più lontano
    v.page.select_option("#sicurezza-gravita", "M")
    assert v.js("window.dt.map.getFilter('sicurezza-hit-incidenti')") == [
        "all", ["==", ["get", "anno"], 2018], ["==", ["get", "Tipologia"], "M"]]
    assert "Incidenti 2018" in v.page.inner_text("#filtri-incidenti-chips")
    v.page.click("#filtri-incidenti-chips .chip-zona:first-child button")  # toglie l'anno, resta la gravità
    assert v.js("window.dt.map.getFilter('sicurezza-incidenti')") == ["==", ["get", "Tipologia"], "M"]
    assert v.page.input_value("#sicurezza-anno") == ""
    v.page.click("#filtri-incidenti-chips .chip-zona button")
    assert v.js("window.dt.map.getFilter('sicurezza-incidenti')") is None
    assert v.js("window.dt.map.getLayer('sicurezza-incidenti').minzoom") == 14
    assert v.page.is_hidden("#filtri-incidenti-chips")


def test_sicurezza_ricerca_per_via_filtra_gli_incidenti_su_quella_via(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.page.fill("#cerca-testo", "della libertà")
    v.page.wait_for_selector("#cerca-risultati button:has-text('incidenti')")
    risultati = v.page.inner_text("#cerca-risultati")
    assert "Via della Libertà" in risultati and "tra le più pericolose" in risultati
    v.page.click("#cerca-risultati button:has-text('tra le più pericolose')")
    assert v.js("window.dt.map.getFilter('sicurezza-incidenti')") == ["==", ["get", "via"], "Via della Libertà"]
    assert v.page.is_checked("#strato-sicurezza-incidenti")
    assert "Incidenti: Via della Libertà" in v.page.inner_text("#filtri-incidenti-chips")
    v.page.wait_for_function("!window.dt.map.isMoving()")
    assert v.js("window.dt.map.getZoom()") >= 14


def test_sicurezza_ricerca_incidente_con_parola_chiave_elenca_i_singoli_eventi(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.page.fill("#cerca-testo", "incidente mortale 2018")
    v.page.wait_for_selector("#cerca-risultati button:has-text('Incidente mortale 2018')")
    assert v.page.locator("#cerca-risultati button:has-text('Incidente mortale 2018')").count() >= 1
    v.page.locator("#cerca-risultati button:has-text('Incidente mortale 2018')").first.click()
    assert v.page.is_checked("#strato-sicurezza-incidenti")
    v.page.wait_for_function("!window.dt.map.isMoving()")
    assert v.js("window.dt.map.getZoom()") >= 17


def test_sicurezza_ricerca_senza_parola_chiave_non_mostra_singoli_incidenti(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.page.fill("#cerca-testo", "mortale 2018")
    v.page.wait_for_selector("#cerca-risultati li")
    assert "Incidente mortale" not in v.page.inner_text("#cerca-risultati")


def _arco_della_via_in_classifica(rango=1):
    """Punto medio e proprietà di un arco della via al posto `rango` della classifica (da archi.geojson ridotto)."""
    base = _dati_sicurezza()
    for f in json.loads((base / "archi.geojson").read_text(encoding="utf-8"))["features"]:
        if f["properties"].get("via_rango") == rango:
            c = f["geometry"]["coordinates"]
            return c[len(c) // 2], f["properties"]
    raise AssertionError("classifica vuota: rilanciare scripts/sicurezza_stradale.py")


def test_sicurezza_strato_strade_pericolose_spento_e_filtrato_sulle_vie_in_classifica(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-pericolose")
    assert v.page.is_visible("#strato-sicurezza-pericolose")
    assert not v.page.is_checked("#strato-sicurezza-pericolose")
    assert v.js("window.dt.map.getLayoutProperty('sicurezza-pericolose', 'visibility')") == "none"
    assert v.js("JSON.stringify(window.dt.map.getFilter('sicurezza-pericolose'))") == '["has","via_rango"]'


def test_desktop_barra_sinistra_a_tab_e_pannello_ancorato(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.wait_for_timeout(300)
    b = v.js("(() => { const r = document.getElementById('barra-strati').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()")
    assert b["x"] == 0 and b["y"] == 0 and b["w"] == 44 and b["h"] == 800
    assert v.js("document.getElementById('btn-gruppo-base').classList.contains('rail-tab')")
    v.page.click("#btn-gruppo-edifici")
    p = v.js("(() => { const r = document.getElementById('pannello').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()")
    assert p["x"] == 44 and p["y"] == 0 and p["h"] == 800 and p["w"] == 280
    assert v.js("(() => { const d = document.createElement('div'); d.style.width = 'var(--sx)'; document.body.append(d); const w = d.getBoundingClientRect().width; d.remove(); return w; })()") == 324
    v.page.click("#btn-gruppo-edifici")
    assert v.js("(() => { const d = document.createElement('div'); d.style.width = 'var(--sx)'; document.body.append(d); const w = d.getBoundingClientRect().width; d.remove(); return w; })()") == 44


def test_desktop_barra_destra_mostra_sempre_tutti_i_tab(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    assert v.page.is_visible("#rail-pannelli [data-pannello=scheda]")
    assert v.page.is_visible("#rail-pannelli [data-pannello=rndt]")
    assert v.js("document.querySelector('#rail-pannelli [data-pannello=scheda]').getAttribute('aria-disabled')") == "true"  # senza scheda è spento


def test_desktop_pannello_sinistro_non_si_chiude_con_clic_sulla_mappa(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.click("#btn-gruppo-edifici")
    v.page.mouse.click(1000, 500)
    assert v.page.is_visible("#gruppo-edifici")
    v.page.keyboard.press("Escape")
    assert not v.page.is_visible("#gruppo-edifici")


def test_desktop_sotto_1280_aprire_un_pannello_ripiega_l_altro(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1200, "height": 800})
    v.js("document.getElementById('btn-rndt').click()")
    v.page.wait_for_selector("#rndt-pannello:not([hidden]):not(.collassato)", timeout=15000)
    v.page.click("#btn-gruppo-edifici")
    assert v.page.is_visible("#gruppo-edifici")
    assert v.js("document.getElementById('rndt-pannello').classList.contains('collassato')")
    v.page.click("#rail-pannelli [data-pannello=rndt]")
    assert not v.page.is_visible("#gruppo-edifici")


def test_sicurezza_strade_pericolose_accese_si_disegnano_e_la_scheda_mostra_la_classifica(apri):
    (lon, lat), p = _arco_della_via_in_classifica(1)
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-pericolose")
    v.page.check("#strato-sicurezza-pericolose")
    v.page.click("#btn-gruppo-sicurezza")  # il pannello aperto copre il centro della mappa: si chiude prima del clic
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['sicurezza-pericolose']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    testo = v.page.inner_text("#scheda")
    assert "1° su 20" in testo
    assert p["nome"] in testo
    assert not any("sicurezza" in e.lower() for e in v.errori)


def _apri_scheda_arco(v):
    (lon, lat), _ = _arco_con_incidenti()
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['sicurezza-hit-archi']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden]) .scheda-sez")


def test_scheda_personalizza_nasconde_una_riga_e_la_scelta_resta_dopo_la_ricarica(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    _apri_scheda_arco(v)
    assert "Pendenza media" in v.page.inner_text("#scheda")
    assert v.page.is_hidden("#scheda .scheda-pref")
    v.page.click("#scheda .scheda-personalizza")
    assert v.page.is_visible("#scheda .scheda-pref")
    v.page.uncheck("#scheda .scheda-pref input[data-riga='arco/Pendenza media']")
    testo = v.page.inner_text("#scheda .scheda-corpo")
    assert "Pendenza media" not in testo and "Incidenti 2015–2023" in testo
    assert v.page.is_visible("#scheda .scheda-pref")  # il pannello resta aperto mentre si sceglie
    v.page.reload()
    v.attendi_pronto()
    _apri_scheda_arco(v)
    assert "Pendenza media" not in v.page.inner_text("#scheda .scheda-corpo")
    v.page.click("#scheda .scheda-personalizza")
    assert v.page.is_enabled("#scheda .scheda-pref-tutto")
    v.page.click("#scheda .scheda-pref-tutto")
    assert "Pendenza media" in v.page.inner_text("#scheda .scheda-corpo")
    assert v.page.is_disabled("#scheda .scheda-pref-tutto")  # niente più da mostrare


def test_scheda_personalizza_nascondere_una_sezione_e_tutte_non_chiude_la_scheda(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    _apri_scheda_arco(v)
    v.page.click("#scheda .scheda-personalizza")
    v.page.uncheck("#scheda .scheda-pref input[data-sezione='arco']")
    assert v.page.is_disabled("#scheda .scheda-pref input[data-riga='arco/Pendenza media']")  # le righe seguono la sezione
    assert "Tratto stradale" not in v.page.inner_text("#scheda .scheda-corpo")
    v.page.click("#scheda .scheda-pref-niente")
    assert v.page.is_visible("#scheda")  # la scheda resta aperta
    assert "nascoste" in v.page.inner_text("#scheda .scheda-corpo").lower()
    v.page.click("#scheda .scheda-pref-tutto")
    assert "Tratto stradale" in v.page.inner_text("#scheda .scheda-corpo")


def test_scheda_senza_localstorage_funziona_lo_stesso(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.js("""() => {
        Storage.prototype.getItem = () => { throw new Error('bloccato'); };
        Storage.prototype.setItem = () => { throw new Error('bloccato'); };
    }""")
    _apri_scheda_arco(v)
    v.page.click("#scheda .scheda-personalizza")
    v.page.uncheck("#scheda .scheda-pref input[data-riga='arco/Pendenza media']")
    assert "Pendenza media" not in v.page.inner_text("#scheda .scheda-corpo")  # vale finché la pagina resta aperta
    assert "Non riesco a salvare" in v.page.inner_text("#scheda .scheda-pref")  # l'utente sa che non è permanente
    assert not any("bloccato" in e for e in v.errori)


def test_scheda_personalizza_seleziona_e_deseleziona_tutto(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    _apri_scheda_arco(v)
    v.page.click("#scheda .scheda-personalizza")
    sezioni = "#scheda .scheda-pref input[data-sezione]"
    assert v.page.locator(sezioni).count() >= 2
    assert v.page.is_disabled("#scheda .scheda-pref-tutto")  # all'inizio è già tutto visibile
    assert v.page.is_enabled("#scheda .scheda-pref-niente")
    v.page.uncheck("#scheda .scheda-pref input[data-riga='arco/Pendenza media']")
    v.page.click("#scheda .scheda-pref-niente")
    assert v.page.locator(f"{sezioni}:checked").count() == 0
    assert v.page.is_disabled("#scheda .scheda-pref-niente")  # niente più da nascondere
    assert v.page.is_enabled("#scheda .scheda-pref-tutto")
    assert v.page.locator("#scheda .scheda-corpo .scheda-sez").count() == 0
    v.page.check("#scheda .scheda-pref input[data-sezione='arco']")  # si riaccende una sola sezione
    assert v.page.locator("#scheda .scheda-corpo .scheda-sez").count() == 1
    assert v.page.is_enabled("#scheda .scheda-pref-niente")
    v.page.click("#scheda .scheda-pref-tutto")  # seleziona tutto: sezioni e righe, anche quella nascosta a mano
    assert v.page.locator(f"{sezioni}:not(:checked)").count() == 0
    assert v.page.locator("#scheda .scheda-pref input[data-riga]:not(:checked)").count() == 0
    assert "Pendenza media" in v.page.inner_text("#scheda .scheda-corpo")
    v.page.reload()
    v.attendi_pronto()
    _apri_scheda_arco(v)
    assert "Pendenza media" in v.page.inner_text("#scheda .scheda-corpo")  # anche «tutto» è permanente


def test_omi_legenda_sulla_mappa_solo_a_strato_acceso(apri):
    v = apri()
    v.attendi_pronto()
    assert not v.page.is_visible("#legende .legenda-omi")
    v.mostra("#strato-omi")
    v.page.check("#strato-omi")
    assert v.page.is_visible("#legende .legenda-omi >> text=Semicentrale")
    v.page.uncheck("#strato-omi")
    assert not v.page.is_visible("#legende .legenda-omi")


def _legenda_filtro(v, strato, voce, layer):
    """Accende lo strato, clicca la voce di legenda (seleziona solo quella) e restituisce il filtro del layer; un secondo clic riaccende tutto."""
    v.mostra(f"#strato-{strato}")
    v.page.check(f"#strato-{strato}")
    v.page.click(f"#legende label:has-text('{voce}')")
    spento = v.js(f"window.dt.map.getFilter('{layer}')")
    v.page.click(f"#legende label:has-text('{voce}')")
    assert v.js(f"window.dt.map.getFilter('{layer}')") != spento
    return spento


def test_legende_omi_ogni_fascia_filtra_le_zone(apri):
    v = apri()
    v.attendi_pronto()
    f = _legenda_filtro(v, "omi", "Semicentrale", "omi")
    assert f[0] == "in" and f[2][1] and all(c.startswith("C") for c in f[2][1])


def test_legende_sicurezza_tasso_hotspot_e_gravita(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    f = _legenda_filtro(v, "sicurezza-archi", "Tasso alto", "sicurezza-archi")
    assert f[0] == "all" and f[2][2][1] == [3]
    f = _legenda_filtro(v, "sicurezza-hotspot", "95%", "sicurezza-hotspot")
    assert f[2][1] == [95]
    f = _legenda_filtro(v, "sicurezza-incidenti", "Mortale", "sicurezza-incidenti")
    assert f[2][1] == ["M"]
    # la gravità della legenda non cambia lo zoom minimo del filtro del pannello
    assert v.js("window.dt.map.getLayer('sicurezza-incidenti').minzoom") == 14


def test_legende_trasporto_voce_spegne_lo_strato(apri):
    _dati_trasporto()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-trasporto-bus")
    v.page.check("#strato-trasporto-bus")
    v.page.check("#strato-trasporto-tram")
    v.page.click("#legende label:has-text('Linea tram')")
    assert not v.page.is_checked("#strato-trasporto-tram")
    assert v.js("window.dt.map.getLayoutProperty('trasporto-tram', 'visibility')") == "none"
    assert v.page.is_visible("#legende .legenda-trasporto")  # il bus è ancora acceso


def test_legende_scuole_tipo_filtra_i_punti(apri):
    v = apri()
    v.attendi_pronto()
    f = _legenda_filtro(v, "scuole", "Asilo nido", "scuole-punti")
    assert f[0] == "in" and f[2][1] == ["Asilo nido"]


def test_legende_popolazione_classe_spenta_diventa_trasparente(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-coropletico")
    v.page.check("#strato-coropletico")
    prima = v.js("JSON.stringify(window.dt.map.getPaintProperty('pop-fill', 'fill-color'))")
    v.page.click("#legende label:has-text('senza dato')")  # solo «senza dato»: tutte le altre classi trasparenti
    dopo = v.js("JSON.stringify(window.dt.map.getPaintProperty('pop-fill', 'fill-color'))")
    assert dopo.count("rgba(0, 0, 0, 0)") >= 4 and "rgba(0, 0, 0, 0)" not in prima
    v.page.click("#legende label:has-text('senza dato')")  # secondo clic sull'unica voce accesa: tutte di nuovo
    assert "rgba(0, 0, 0, 0)" not in v.js("JSON.stringify(window.dt.map.getPaintProperty('pop-fill', 'fill-color'))")
    v.page.wait_for_timeout(500)
    assert not any("expression" in e.lower() for e in v.errori), v.errori


def test_tooltip_unico_con_sezioni_impilate(apri):
    """Confini e sicurezza sotto lo stesso cursore: un solo riquadro con due sezioni, mai due popup sovrapposti."""
    (lon, lat), _ = _arco_con_incidenti()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-archi")
    v.page.check("#strato-sicurezza-archi")
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['sicurezza-hit-archi']}).length > 0")
    _muovi_su(v, lon, lat)
    v.page.wait_for_selector(".mappa-tooltip .sicurezza-tooltip-corpo", timeout=10000)
    assert v.page.locator(".maplibregl-popup").count() == 1
    assert v.page.locator(".mappa-tooltip .mappa-tooltip-sezione").count() >= 1


def test_legenda_catasto_etichette_e_particella_cercata(apri):
    v = apri()
    v.attendi_pronto()
    assert not v.page.is_visible("#legende .legenda-catasto")
    v.mostra("#strato-catasto")
    v.page.check("#strato-catasto")
    assert v.page.is_visible("#legende .legenda-catasto >> text=Catasto")
    v.page.click("#legende label:has-text('Foglio e particella')")
    assert v.js("window.dt.map.getLayoutProperty('catasto-etichette', 'visibility')") == "none"
    v.page.click("#legende label:has-text('Foglio e particella')")
    assert v.js("window.dt.map.getLayoutProperty('catasto-etichette', 'visibility')") == "visible"
    v.page.click("#legende label:has-text('Particella (da zoom 12)')")  # la particella è lo strato stesso
    assert not v.page.is_checked("#strato-catasto")
    assert not v.page.is_visible("#legende .legenda-catasto")


def _sede_uffici(piccola=False):
    feats = json.loads((ROOT / "dati" / "uffici" / "sedi.geojson").read_text(encoding="utf-8"))["features"]
    f = min(feats, key=lambda f: f["properties"]["n_uffici"]) if piccola else max(feats, key=lambda f: f["properties"]["n_uffici"])
    return f["geometry"]["coordinates"], f["properties"]


def test_strato_uffici_popup_breve(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-uffici")
    v.page.check("#strato-uffici")
    (lon, lat), p = _sede_uffici()  # la sede con più uffici: il popup deve restare corto
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['uffici-punti']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector(".uffici-popup")
    assert p["nome"] in v.page.inner_text(".uffici-popup")
    assert v.page.locator(".uffici-popup p").count() <= 9
    assert v.page.locator(".uffici-popup a").count() == 0
    assert not any("uffici" in e for e in v.errori)


def test_scheda_uffici_anche_a_strato_spento(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-uffici")
    assert not v.page.is_checked("#strato-uffici")
    (lon, lat), p = _sede_uffici(piccola=True)
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['uffici-hit']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden]) [data-chiave^='uffici-']")
    sez = v.page.locator("#scheda [data-chiave^='uffici-']").first
    assert "Uffici comunali" in sez.inner_text()
    assert sez.locator("a[href^='https://www.comune.palermo.it/']").count() >= 1
    assert v.js("window.dt.map.getLayoutProperty('uffici-punti', 'visibility')") == "none"


def test_preferenze_scheda_elenca_gli_uffici_comunali_anche_mai_visti(apri):
    v = apri()
    v.attendi_pronto()
    v.page.evaluate("localStorage.removeItem('dt.scheda.nascosti')")
    (lon, lat), _ = _sede_uffici()
    v.vai(13.3568, 38.1204, 17)  # una scheda qualsiasi, senza uffici
    v.clic(13.3568, 38.1204)
    v.page.wait_for_selector("#scheda:not([hidden]) .scheda-sez")
    v.page.click("#scheda .scheda-personalizza")
    assert v.page.locator("#scheda .scheda-pref input[data-sezione='uffici']").count() == 1
    assert v.page.locator("#scheda .scheda-pref input[data-riga='uffici/Indirizzo']").count() == 1


def test_legenda_uffici_filtra_per_area_con_selezione_singola(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-uffici")
    v.page.check("#strato-uffici")
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['uffici-punti']}).length > 0")
    assert v.page.is_visible("#legende .legenda-uffici")
    tutte = v.js("window.dt.map.getSource('uffici')._data.features.length")
    caselle = v.page.locator("#legende .legenda-uffici input[type=checkbox]")
    n = caselle.count()
    assert n >= 20
    v.page.click("#legende .legenda-uffici label:has-text('Area della Polizia municipale')")
    v.page.wait_for_function(f"window.dt.map.getSource('uffici')._data.features.length < {tutte}")
    assert sum(caselle.nth(i).is_checked() for i in range(n)) == 1  # solo quella
    v.page.click("#legende .legenda-uffici label:has-text('Area della Polizia municipale')")
    v.page.wait_for_function(f"window.dt.map.getSource('uffici')._data.features.length == {tutte}")
    assert all(caselle.nth(i).is_checked() for i in range(n))


def _incendio(anno=2023):
    """Un incendio di Palermo e un punto sicuramente dentro il suo perimetro (il più grande dell'anno: resta visibile a zoom 15)."""
    shapely_geometry = pytest.importorskip("shapely.geometry")
    feats = json.loads((ROOT / "dati" / "incedi" / f"incendi_{anno}.geojson").read_text(encoding="utf-8"))["features"]
    f = max(feats, key=lambda f: f["properties"].get("sup_ha", 0))
    p = shapely_geometry.shape(f["geometry"]).representative_point()
    return (p.x, p.y), f["properties"]


def test_strato_incendi_popup_e_legenda_per_anno(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-incendi")
    assert not v.page.is_checked("#strato-incendi")
    assert not v.page.is_visible("#legende .legenda-incendi")
    v.page.check("#strato-incendi")
    (lon, lat), p = _incendio()
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['incendi-fill']}).length > 0")
    assert v.page.is_visible("#legende .legenda-incendi")
    anni = json.loads((ROOT / "dati" / "incedi" / "anni.json").read_text(encoding="utf-8"))["anni"]
    assert v.page.locator("#legende .legenda-incendi input[type=checkbox]").count() == sum(1 for a in anni if a["n"])
    v.clic(lon, lat)
    v.page.wait_for_selector(".incendi-popup")
    assert p["localita"] in v.page.inner_text(".incendi-popup")
    assert not any("incendi" in e for e in v.errori)


def test_legenda_incendi_filtra_per_anno(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-incendi")
    v.page.check("#strato-incendi")
    v.page.click("#legende .legenda-incendi label:has-text('2023')")  # solo il 2023
    assert v.js("window.dt.map.getFilter('incendi-fill')") == ["in", ["get", "anno"], ["literal", [2023]]]
    assert v.js("window.dt.map.getFilter('incendi-bordo')") == ["in", ["get", "anno"], ["literal", [2023]]]
    v.page.click("#legende .legenda-incendi label:has-text('2023')")  # di nuovo tutti
    assert v.js("window.dt.map.getFilter('incendi-fill')") is None


def test_scheda_incendi_anche_a_strato_spento(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-incendi")
    assert not v.page.is_checked("#strato-incendi")
    (lon, lat), p = _incendio()
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['incendi-hit']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden]) [data-chiave^='incendio-']")
    sez = v.page.locator("#scheda [data-chiave^='incendio-']").first
    # più incendi sovrapposti: una sola sezione a fisarmonica; uno solo: sezione completa
    assert "Incendio 2023" in sez.inner_text() or "incendi sovrapposti" in sez.inner_text()
    assert v.js("window.dt.map.getLayoutProperty('incendi-fill', 'visibility')") == "none"


def _pai(dataset="idraulica_pericolosita"):
    """Un elemento del PAI di Palermo e un punto sicuramente dentro il suo perimetro (il più grande: resta visibile a zoom 15)."""
    shapely_geometry = pytest.importorskip("shapely.geometry")
    sorgente = ROOT / "lavoro" / "pai" / f"{dataset}.geojson"
    if not sorgente.exists():
        pytest.skip("dati di lavoro PAI non scaricati (python3 scripts/pai.py)")
    feats = json.loads(sorgente.read_text(encoding="utf-8"))["features"]
    f = max(feats, key=lambda f: f["properties"].get("sup_ha", 0))
    p = shapely_geometry.shape(f["geometry"]).representative_point()
    return (p.x, p.y), f["properties"]


def test_strato_pai_popup_e_legenda(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-idraulica_pericolosita")
    assert not v.page.is_checked("#strato-idraulica_pericolosita")
    assert not v.page.is_visible("#legende .legenda-pai")
    v.page.check("#strato-idraulica_pericolosita")
    (lon, lat), p = _pai()
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['pai-idraulica_pericolosita-fill']}).length > 0")
    assert v.page.is_visible("#legende .legenda-pai")
    assert "Pericolosità idraulica" in v.page.inner_text("#legende .legenda-pai")
    v.clic(lon, lat)
    v.page.wait_for_selector(".pai-popup")
    assert p["cls_idraulica_pericolosita"] in v.page.inner_text(".pai-popup")
    assert not any("pai" in e.lower() for e in v.errori)


def test_legenda_pai_filtra_per_classe(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-idraulica_pericolosita")
    v.page.check("#strato-idraulica_pericolosita")
    v.page.click("#legende .legenda-pai label:has-text('P4')")  # solo P4
    assert v.js("window.dt.map.getFilter('pai-idraulica_pericolosita-fill')") == ["in", ["get", "cls_idraulica_pericolosita"], ["literal", ["P4"]]]
    v.page.click("#legende .legenda-pai label:has-text('P4')")  # di nuovo tutte
    assert v.js("window.dt.map.getFilter('pai-idraulica_pericolosita-fill')") is None


def test_scheda_pai_anche_a_strato_spento(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-idraulica_pericolosita")
    assert not v.page.is_checked("#strato-idraulica_pericolosita")
    (lon, lat), p = _pai()
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['pai-idraulica_pericolosita-hit']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden]) [data-chiave^='pai:']")
    sez = v.page.locator("#scheda [data-chiave^='pai:']").first
    # più vincoli sovrapposti: una sola sezione a fisarmonica; uno solo: sezione completa
    assert "Pericolosità idraulica" in sez.inner_text() or "vincoli sovrapposti" in sez.inner_text()
    assert v.js("window.dt.map.getLayoutProperty('pai-idraulica_pericolosita-fill', 'visibility')") == "none"


def test_pai_dissesti_per_tipologia_usano_i_retini_del_server(apri):
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-dissesti_tipologia")
    v.page.check("#strato-dissesti_tipologia")
    (lon, lat), _ = _pai("dissesti")
    v.vai(lon, lat, 16)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['pai-dissesti_tipologia-fill']}).length > 0")
    assert v.js("window.dt.map.hasImage('pai-dissesti_tipologia-0')")
    assert not any("pai" in e.lower() for e in v.errori)

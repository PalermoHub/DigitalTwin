import json

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
    assert v.js("window.dt.map.getLayer('catasto').minzoom") == 15


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
    assert "Zona PRG 2004" in testo


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


def test_scheda_fuori_copertura_non_resta_vuota(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.30, 38.30, 9)  # mare a nord, zoom sotto la copertura dei tile
    v.clic(13.30, 38.30)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert "Nessun dato in questo punto" in v.page.inner_text("#scheda")
    assert v.errori == []


def test_scheda_si_chiude(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.30, 38.30, 9)
    v.clic(13.30, 38.30)
    v.page.wait_for_selector("#scheda:not([hidden])")
    v.page.click("#scheda button")
    v.page.wait_for_selector("#scheda", state="hidden")


def test_senza_catalogo_il_viewer_resta_vivo_e_avvisa(apri):
    v = apri(blocca="**/dati/catalogo.json")
    v.attendi_pronto()
    v.page.wait_for_function(
        "document.getElementById('avvisi').textContent.includes('Catalogo dati non disponibile')",
        timeout=30000,
    )
    assert v.js("window.dt.pronto") is True


def test_le_sorgenti_remote_arrivano_dal_catalogo(apri):
    v = apri()
    v.attendi_pronto()
    url = v.js("window.dt.map.getSource('catasto').url")
    assert url == "pmtiles://https://palermohub.github.io/PRG2004/particelle/particelle.pmtiles"

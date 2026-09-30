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
    v.page.click("#scheda .scheda-chiudi")
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
    v.page.check("#strato-rilievo3d")
    v.page.wait_for_function("window.dt.map.getTerrain() !== null && window.dt.map.getPitch() > 40")
    t = v.js("window.dt.map.getTerrain()")
    assert t["source"] == "terrain-dem" and t["exaggeration"] == 1.5
    assert v.js("window.dt.map.getLayoutProperty('hillshade-layer', 'visibility')") == "visible"
    v.page.uncheck("#strato-rilievo3d")
    v.page.wait_for_function("window.dt.map.getTerrain() === null && window.dt.map.getPitch() < 5")
    assert v.js("window.dt.map.getLayoutProperty('hillshade-layer', 'visibility')") == "none"


def test_elevazione_mostra_raster_e_legenda(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getLayoutProperty('elevazione-raster', 'visibility')") == "none"
    assert not v.page.is_visible(".legenda-elevazione")
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
    testo = v.page.inner_text("#scheda")
    assert "Terreno (DTM 5 m)" in testo
    gradi_a, gradi_b = f"{a['pendenza']:.1f}°", f"{b['pendenza']:.1f}°"
    assert gradi_a in testo
    assert gradi_b not in testo
    assert f"{round(a['quota'])} m s.l.m." in testo


def _via_reale():
    indice = leggi_json("civici-omi/civici_index.json")  # dal link, con cache
    via = "VIA MAQUEDA" if "VIA MAQUEDA" in indice else next(iter(indice))
    civico, (lon, lat) = next(iter(indice[via].items()))
    return via, civico, lon, lat


def test_ricerca_porta_la_mappa_sul_civico(apri):
    via, civico, lon, lat = _via_reale()
    v = apri()
    v.attendi_pronto()
    v.page.fill("#cerca-testo", f"{via.lower()} {civico}")
    v.page.wait_for_selector("#cerca-risultati button")
    v.page.press("#cerca-testo", "Enter")
    v.page.wait_for_function(
        f"!window.dt.map.isMoving() && Math.abs(window.dt.map.getCenter().lng - {lon}) < 1e-3"
        f" && Math.abs(window.dt.map.getCenter().lat - {lat}) < 1e-3",
        timeout=30000,
    )
    assert v.js("window.dt.map.getZoom()") > 17


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
    assert chiavi == sorted(chiavi, key=lambda c: 60 if c.startswith("omi-") else peso[c])
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
    v.vai(13.30, 38.30, 9)
    v.clic(13.30, 38.30)
    v.page.wait_for_selector("#scheda:not([hidden])")
    colori = v.js(
        """() => Object.fromEntries(['pannello', 'scheda', 'cerca'].map(id => {
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


def test_le_sezioni_hanno_le_icone_font_awesome_dell_app_originale(apri):
    v = apri()
    v.attendi_pronto()
    # stessa libreria dell'app originale (Font Awesome 6.0.0 da cdnjs)
    href = v.js("document.querySelector('link[href*=\"font-awesome\"]')?.href")
    assert href == "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
    _scheda_su(v, "catasto", "particelle", "catasto-hit", 17)
    icona = lambda chiave: v.js(
        f"document.querySelector('#scheda .scheda-sez[data-chiave=\"{chiave}\"] h3 i.fas')?.className"
    )
    assert "fa-table-cells" in icona("particella")
    assert "fa-users" in icona("sezione")
    assert "fa-mountain" in icona("terreno")
    assert v.js("document.querySelector('#scheda .scheda-sez[data-chiave=\"particella\"] a.scheda-link i.fas')?.className").count("fa-external-link-alt") == 1
    # le icone sono decorative: nascoste alle tecnologie assistive
    assert v.js("document.querySelector('#scheda .scheda-sez h3 i.fas').getAttribute('aria-hidden')") == "true"


def test_icone_delle_altre_sezioni(apri):
    v = apri()
    v.attendi_pronto()
    _scheda_su(v, "omi", "Zone_OMI_2025_II", "omi-hit", 15)
    classe = lambda sel: v.js(f"document.querySelector('{sel}')?.className")
    assert "fa-euro-sign" in classe("#scheda .scheda-sez[data-chiave^=\"omi-\"] h3 i.fas")
    assert "fa-home" in classe("#scheda .scheda-acc > summary i.fas")
    v2 = apri()
    v2.attendi_pronto()
    _scheda_su(v2, "civici", "civici_wgs84", "civici-hit", 17)
    assert "fa-map-marker-alt" in v2.js("document.querySelector('#scheda .scheda-sez[data-chiave=\"indirizzo\"] h3 i.fas')?.className")
    v3 = apri()
    v3.attendi_pronto()
    _scheda_su(v3, "prg", "va", "prg-va-hit", 15)
    assert "fa-shield-alt" in v3.js("document.querySelector('#scheda .scheda-sez[data-chiave=\"vincoli\"] h3 i.fas')?.className")


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

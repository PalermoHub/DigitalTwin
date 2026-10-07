"""Scene della sezione 3 (Plugin RNDT)."""
import re, time
from scenes_base import *

CAMPO = '#rndt-pannello input[type="search"], #rndt-pannello input[type="text"]'
TITOLO_SERVIZIO = "Parchi e Riserve - Servizio di Consultazione (WMS)"
MONTE_PELLEGRINO = (13.3560, 38.1690)


def btn(r, testo, root="#rndt-pannello"):
    return r.pg.locator(f"{root} button, {root} a", has_text=testo).first


def apri_pannello(r):
    if r.pg.locator("#rndt-pannello").is_hidden():
        r.click("#btn-rndt", after=1.2)


def rndt_layer_id(r):
    return r.pg.evaluate("()=>window.dt.map.getStyle().layers.map(l=>l.id).find(i=>/^rndt-.*-fill$/.test(i))")


@sc("3-cose")
def _(r):
    r.chip(1)
    r.card("Sezione 2", "Plugin RNDT", "Il catalogo nazionale dei dati territoriali", hold=2.8, durante=lambda: pulisci(r))
    r.lower("Plugin RNDT", "Il catalogo nazionale dei dati territoriali")
    r.sync(0.22)
    r.ring("#btn-rndt", "Catalogo RNDT", pos="below", hold=2.0)
    r.sync(0.42)
    r.big("<b>RNDT</b><br>Repertorio Nazionale<br>dei Dati Territoriali<br><span style='font-size:22px;opacity:.8'>il catalogo ufficiale dei dati geografici italiani</span>", wait=False)
    r.sync(0.78)
    r.big("<b>Una biblioteca di mappe</b><br>cosa esiste · chi l'ha prodotto · dove consultarlo", wait=False)
    r.sync(1.0)
    r.big_off()


@sc("3-merito")
def _(r):
    r.sync(0.05)
    r.click("#btn-rndt", after=1.5)
    r.sync(0.30)
    rc = r.find_rect("*", "andrea borruso", "#rndt-pannello")
    if rc:
        r.zoom_box(rc, 1.7)
        r.ring(rc, "Andrea Borruso · onData", pos="below", hold=4.0)
        r.zoom_out()


@sc("3-dove")
def _(r):
    apri_pannello(r)
    r.sync(0.06)
    r.ring("#btn-rndt", "Barra strumenti", pos="below", hold=1.8)
    r.sync(0.30)
    a = r.pg.locator('button.rail-tab[data-pannello="scheda"]').bounding_box()
    b = r.pg.locator('button.rail-tab[data-pannello="rndt"]').bounding_box()
    if a and b:
        r.ring([a["x"], a["y"], a["width"], b["y"] + b["height"] - a["y"]], "Scheda ⇄ RNDT", pos="left", hold=2.0)
    r.sync(0.58)
    r.key("Escape")
    r.pause(1.3)
    r.click("#btn-rndt", after=1.3)
    r.sync(0.80)
    r.ring([1497, 70, 380, 120], "Interfaccia in inglese", pos="left", hold=2.0)


@sc("3-cerca")
def _(r):
    apri_pannello(r)
    r.sync(0.04)
    r.type(CAMPO, "zone protette")
    r.pause(0.4)
    r.click(btn(r, "Search"), after=0.5)
    try:
        r.pg.get_by_text(re.compile(r"1-\d+ of \d+")).first.wait_for(timeout=25000)
    except Exception:
        r.warn.append("3-cerca: risultati RNDT non arrivati")
    r.shot("risultati")
    r.sync(0.34)
    rc = r.find_rect("*", "box 13.1", "#rndt-pannello")
    if rc:
        r.ring(rc, "Sempre entro l'area di Palermo", pos="below", hold=2.0)
    r.sync(0.52)
    if r.click(btn(r, "Edit filters"), after=1.0):
        for txt, lab in (("services", "Dati o servizi"), ("available as", "WMS · WFS · ArcGIS REST")):
            rc = r.find_rect("*", txt, "#rndt-pannello")
            if rc:
                r.ring(rc, lab, pos="left", hold=1.6)
        r.sync(0.82)
        rc = r.find_rect("*", "advanced filters", "#rndt-pannello")
        if rc:
            r.ring(rc, "Tema · ente · date", pos="left", hold=1.8)
        r.shot("filtri")
        r.click(btn(r, "Search"), after=0.6)
        try:
            r.pg.get_by_text(re.compile(r"1-\d+ of \d+")).first.wait_for(timeout=25000)
        except Exception:
            pass


@sc("3-risultato")
def _(r):
    r.sync(0.04)
    r.click(r.pg.get_by_text(TITOLO_SERVIZIO).first, after=1.8)
    r.shot("scheda-risultato")
    r.sync(0.16)
    rc = r.find_rect("*", "regione siciliana", "#rndt-pannello")
    if rc:
        r.ring(rc, "Ente responsabile", pos="left", hold=1.6)
    r.sync(0.34)
    r.click(btn(r, "Open"), after=1.5)
    r.sync(0.46)
    r.click(r.pg.locator('#rndt-pannello label:has-text("Riserve Regionali")'), after=0.9)
    r.shot("layer-spuntato")
    r.sync(0.66)
    r.ring(btn(r, "Add to map"), "Come immagine", pos="left", hold=1.8)
    r.sync(0.82)
    r.ring(btn(r, "Add features"), "Gli elementi veri", pos="left", hold=1.8)


@sc("3-aggiungi")
def _(r):
    r.sync(0.02)
    r.click(btn(r, "Add features"), after=0.5)
    try:
        r.pg.get_by_text(re.compile(r"Added \d+ features")).first.wait_for(timeout=30000)
    except Exception:
        r.warn.append("3-aggiungi: nessuna conferma «Added N features»")
    r.pause(1.0)
    r.shot("riserve")
    r.sync(0.30)
    r.ring("#strati-chip", "Layer aggiunto", pos="below", hold=1.6)
    r.sync(0.48)
    r.click("#btn-gruppo-rndt", after=1.0)
    r.sync(0.62)
    rc = r.find_rect("*", "riserve regionali", "#pannello")
    if rc:
        r.ring([rc[0] - 4, rc[1] - 4, 300, 70], "Occhio · opacità · cestino", pos="right", hold=2.4)
    r.shot("gruppo")


@sc("3-interroga")
def _(r):
    r.key("Escape") if False else None
    lid = rndt_layer_id(r)
    r.sync(0.04)
    r.fly(*MONTE_PELLEGRINO, 13, ms=2400)
    p = r.feature_px(lid, near=MONTE_PELLEGRINO) if lid else None
    if p:
        r.click_xy(p["x"], p["y"], 1.0, 2.5)
    else:
        r.warn.append("3-interroga: nessuna riserva da cliccare")
    r.sync(0.34)
    r.click_text("Altri dati", css="button, [role=tab], span", root="#scheda", after=1.2)
    r.shot("altri-dati")
    r.sync(0.55)
    rc = r.find_rect("*", "denominazione", "#scheda")
    if rc:
        r.zoom_box(rc, 1.5)
        r.ring(rc, "Denominazione · tipologia · gestore", pos="left", hold=2.6)
        r.zoom_out()
    r.sync(0.85)
    rc = r.find_rect("*", "fonte", "#scheda")
    if rc:
        r.ring(rc, "La fonte", pos="left", hold=1.4)


@sc("3-limiti")
def _(r):
    r.sync(0.10)
    r.big("<b>WFS · massimo 10.000 oggetti</b><br>per strati molto densi<br>(come le particelle catastali)<br>meglio il WMS", wait=False)
    r.sync(0.58)
    r.big("<b>Servizio non raggiungibile?</b><br>resta in elenco come<br><b>«non disponibile»</b><br>senza essere cancellato", wait=False)
    r.sync(0.98)
    r.big_off()


@sc("3-file")
def _(r):
    r.sync(0.05)
    r.click("#btn-gruppo-miei", after=1.0)
    r.sync(0.25)
    rc = r.find_rect("*", "i miei dati", "#pannello")
    if rc:
        r.ring(rc, "I miei dati", pos="right", hold=1.6)
    r.sync(0.50)
    ok = r.pg.evaluate("""()=>{const b=[...document.querySelectorAll('#pannello button')].find(b=>b.offsetParent!==null&&/carica|upload/i.test((b.title||'')+(b.getAttribute('aria-label')||'')));
        if(!b)return null;const r=b.getBoundingClientRect();return [r.left,r.top,r.width,r.height]}""")
    if ok:
        r.ring(ok, "Carica file dal computer", pos="right", hold=2.2)
    else:
        r.warn.append("3-file: icona di caricamento non trovata")
    r.sync(0.78)
    r.big("<b>GeoJSON · KML · GPX</b><br>Shapefile in zip · CSV<br><span style='font-size:22px;opacity:.8'>restano solo gli elementi nel Comune di Palermo</span>", wait=False)
    r.sync(1.0)
    r.big_off()


@sc("3-sintesi")
def _(r):
    voci = ["<b>1</b> &nbsp;Cerca", "<b>2</b> &nbsp;Scegli", "<b>3</b> &nbsp;Aggiungi", "<b>4</b> &nbsp;Clicca"]
    acc = ""
    for frac, v in zip((0.18, 0.38, 0.58, 0.78), voci):
        r.sync(frac)
        acc += f"<div style='margin:10px 0'>{v}</div>"
        r.big(acc, wait=False)
    r.sync(1.0)
    r.big_off()

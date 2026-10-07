"""Scene delle sezioni 1 e 2 (Apertura e Guida)."""
import re, time
from scenes_base import *

TELEFONO_JS = """(url)=>{
  const scrim=document.createElement('div');scrim.id='v-scrim';
  scrim.style.cssText='position:fixed;inset:0;background:rgba(21,23,27,.80);z-index:2147482990;opacity:0;transition:opacity .5s;pointer-events:none';
  scrim.innerHTML=`<div style="position:absolute;left:120px;top:250px;color:#fff;font-family:Montserrat,sans-serif">
    <div style="font-size:30px;font-weight:700;color:#f5a623;letter-spacing:4px">DA TELEFONO</div>
    <div id="v-tabs" style="font-size:78px;font-weight:800;line-height:1.18;margin-top:14px">
      <div data-t="mappa">Mappa</div><div data-t="strati">Strati</div><div data-t="aggiungi">Aggiungi</div><div data-t="info">Menu</div></div></div>`;
  scrim.querySelectorAll('#v-tabs div').forEach(d=>d.style.cssText='opacity:.35;transition:all .3s');
  document.documentElement.appendChild(scrim);
  const ph=document.createElement('div');ph.id='v-phone';
  ph.style.cssText='position:fixed;left:1080px;top:70px;width:390px;height:844px;border:14px solid #0b0c0e;border-radius:58px;background:#000;overflow:hidden;z-index:2147482995;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 3px #3a3d44;transform:translateX(900px);transition:transform .7s cubic-bezier(.2,.9,.25,1)';
  const f=document.createElement('iframe');f.src=url;f.width=390;f.height=844;f.style.cssText='border:0;display:block;background:#fff';
  ph.appendChild(f);document.documentElement.appendChild(ph);}"""
TELEFONO_SU = "()=>{document.getElementById('v-scrim').style.opacity=1;document.getElementById('v-phone').style.transform='none'}"
TELEFONO_GIU = "()=>{document.getElementById('v-scrim').style.opacity=0;document.getElementById('v-phone').style.transform='translateX(900px)';setTimeout(()=>{document.getElementById('v-scrim')?.remove();document.getElementById('v-phone')?.remove()},900)}"


def evid_tab(r, nome):
    r.pg.evaluate("(n)=>document.querySelectorAll('#v-tabs div').forEach(d=>{const on=d.dataset.t===n;d.style.opacity=on?1:.35;d.style.color=on?'#f5a623':'#fff';d.style.transform=on?'translateX(18px)':'none'})", nome)


def tab_layer(r):
    """Porta in primo piano il tab «Layer» (apre il pannello o ci torna da un altro tab)."""
    if r.pg.locator("#btn-gruppo-layer").get_attribute("aria-expanded") != "true":
        r.click("#btn-gruppo-layer")
    r.pg.locator("#pannello").evaluate("e=>e.scrollTo(0,0)")


def pannello_base(r):
    if r.pg.locator("#pannello").is_hidden():
        r.click("#btn-gruppo-layer")


def prep(r, sid):
    """Stato minimo per eseguire una scena da sola (usato con SOLO=...)."""
    r.pg.keyboard.press("Escape")


# ═══════════ 1 · APERTURA ═══════════
@sc("1-indice")
def _(r):
    r.jump(*CENTRO, 12)
    voci = ["<b>1</b> &nbsp;La mappa", "<b>2</b> &nbsp;Plugin RNDT", "<b>3</b> &nbsp;Geoimage", "<b>4</b> &nbsp;Dove trovarci e come contribuire"]
    acc = ""
    for frac, v in zip((0.14, 0.40, 0.60, 0.80), voci):
        r.sync(frac)
        acc += f"<div style='margin:12px 0'>{v}</div>"
        r.big(acc, wait=False)
    r.sync(1.0)
    r.big_off()


# ═══════════ 2 · GUIDA ═══════════
@sc("2-guida")
def _(r):
    r.chip(0)
    r.lower("La mappa", "Guida generale della webapp")
    # il telefono si carica ora, nascosto, per essere pronto tra due scene
    r.pg.evaluate(TELEFONO_JS, URL)
    r.sync(0.25)
    r.click('#menu-info button[data-scheda="guida"]')
    r.pause(1.0)
    r.zoom_box(".guida-indice", 1.45)
    r.ring(".guida-indice", "19 passi", pos="left", hold=2.6)
    r.sync(0.97)
    r.zoom_out()
    r.key("Escape")
    r.pause(0.5)


@sc("2-cos-e")
def _(r):
    r.jump(*CENTRO, 12)
    r.sync(0.12)
    r.ring("#app-logo", "Logo e menu", pos="below", hold=0.2, wait=False)
    r.ring("#menu-info", None, hold=1.8)
    r.sync(0.34)
    b0, b1 = r.pg.locator("#btn-gruppo-base").bounding_box(), r.pg.locator("#btn-gruppo-filtri").bounding_box()
    r.ring([b0["x"], b0["y"], b0["width"], b1["y"] + b1["height"] - b0["y"]], "Strati", pos="right", hold=1.8)
    r.sync(0.55)
    r.ring("#cerca", "Ricerca", pos="above", hold=1.6)
    r.sync(0.76)
    r.zoom_box([0, 980, 1000, 100], 1.6)
    r.ring(".piede-avviso", "Senza valore legale", pos="above", hold=2.4)
    r.zoom_out()


@sc("2-telefono")
def _(r):
    fr = r.pg.query_selector("#v-phone iframe").content_frame()
    fr.evaluate("()=>{window.dt.map.jumpTo({center:[13.3586,38.1203],zoom:16})}")
    r.pg.evaluate(TELEFONO_SU)
    r.sync(0.14)
    bb = fr.locator("#barra-tab").bounding_box()
    r.ring([bb["x"], bb["y"], bb["width"], bb["height"]], "Quattro tab", pos="left", hold=1.8)
    for frac, tab in ((0.34, "strati"), (0.52, "aggiungi"), (0.66, "info"), (0.76, "mappa")):
        r.sync(frac)
        evid_tab(r, tab)
        r.click(fr.locator(f'#barra-tab button[data-tab="{tab}"]'), move=0.8, after=0.9)
    r.sync(0.86)
    evid_tab(r, "")
    bm = r.pg.locator("#v-phone").bounding_box()
    r.click_xy(bm["x"] + 195, bm["y"] + 330, 0.8, 1.5)
    r.pause(1.0)
    r.pg.evaluate(TELEFONO_GIU)
    r.pause(0.9)


@sc("2-dati")
def _(r):
    r.sync(0.04)
    r.click('#menu-info button[data-scheda="fonti"]')
    r.pause(1.0)
    r.sync(0.55)
    rc = r.find_rect("li", "non hanno valore legale", "#crediti")
    if rc:
        r.zoom_box(rc, 1.5)
        r.ring(rc, "Avviso", pos="below", hold=2.2)
        r.zoom_out()
    r.sync(0.8)
    r.pg.mouse.move(960, 600)
    for _ in range(6):
        r.pg.mouse.wheel(0, 260)
        r.pause(0.25)
    rc = r.find_rect("li", "Cruscotto Statistico", "#crediti")
    if rc:
        r.ring(rc, "Data · fonte · licenza", pos="above", hold=1.6)
    r.sync(0.98)
    r.key("Escape")
    r.pause(0.4)


@sc("2-strati")
def _(r):
    r.jump(*MAQUEDA, 16)
    r.layers_off(keep=("circoscrizioni", "edificato"))
    r.sync(0.17)
    tab_layer(r)
    r.sync(0.30)
    r.ring("#pannello", "Gruppi in ordine alfabetico", pos="right", hold=1.5)
    r.sync(0.37)
    r.group("Territorio")
    r.sync(0.50)
    r.layer("catasto")
    r.pause(1.2)
    r.sync(0.58)
    r.ring("#strati-chip", "Etichette degli strati accesi", pos="below", hold=1.6)
    r.sync(0.68)
    r.ring("#legende-box", "Legenda", pos="right", hold=1.8)
    r.sync(0.82)
    r.ring("#strati-chip", "Edificato + Catasto", pos="below", hold=1.8)


@sc("2-ordine")
def _(r):
    tab_layer(r)
    r.sync(0.10)
    r.click_text("Ordine layer in mappa", css="h2, h3, h4, strong, span, div, button, summary")
    r.pause(1.0)
    r.sync(0.30)
    r.ring("#pannello", "In alto = sopra sulla mappa", pos="right", hold=1.8)
    r.sync(0.55)
    r.click(r.pg.locator('#pannello button[title^="Sposta su Edificato"]'), move=0.8, after=1.5)
    r.sync(0.9)


@sc("2-storiche")
def _(r):
    r.jump(*CENTRO, 14)
    r.sync(0.05)
    r.click("#btn-gruppo-base")
    r.sync(0.14)
    import re
    for nome, frac in (("Satellite", 0.20), ("Scura", 0.30), ("Mappa chiara", 0.38)):
        r.sync(frac)
        r.click(r.pg.locator("#pannello label.base-scelta", has_text=re.compile(rf"^{nome}$")), after=1.0)
    r.sync(0.50)
    loc = r.pg.locator("#pannello label.base-scelta", has_text=re.compile(r"^1891$"))
    loc.first.scroll_into_view_if_needed()
    r.pause(0.6)
    r.sync(0.68)
    r.click(loc, after=2.2)
    r.sync(0.82)
    r.ring(loc.first, "Pallino = precisione della sovrapposizione", pos="right", hold=2.4)
    r.click(r.pg.locator("#pannello label.base-scelta", has_text=re.compile(r"^Mappa chiara$")), after=0.5)


@sc("2-miei-layer")
def _(r):
    r.click("#btn-gruppo-miei")
    r.pause(0.8)
    r.sync(0.25)
    rc = r.find_rect("*", "I miei dati", "#pannello")
    if rc:
        r.ring(rc, "I miei dati", pos="right", hold=1.8)
    r.sync(0.55)
    rc = r.find_rect("*", "Servizi", "#pannello")
    if rc:
        r.ring(rc, "Servizi", pos="right", hold=2.0)


@sc("2-colori")
def _(r):
    r.jump(*CENTRO, 15)
    r.layers_off(keep=("circoscrizioni", "edificato"))
    tab_layer(r)
    r.sync(0.08)
    if not r.pg.locator('button.strato-tema-btn[title^="Colori di Edificato"]').first.is_visible():
        r.group("Edifici")
    r.sync(0.20)
    r.click('button.strato-tema-btn[title^="Colori di Edificato"]')
    r.pause(0.8)
    r.zoom_box("#pannello", 1.25)
    r.sync(0.38)
    r.scegli(r.pg.locator("#pannello select:visible").nth(0), "dens_pop_ha")
    r.sync(0.52)
    r.scegli(r.pg.locator("#pannello select:visible").nth(1), "graduata")
    r.pause(1.2)
    sel = r.pg.locator("#pannello select:visible").nth(3) if r.pg.locator("#pannello select:visible").count() > 3 else None
    if sel is not None:
        ops = sel.evaluate("s=>[...s.options].map(o=>o.text)")
        gia = [o for o in ops if "batlow" in o.lower()]
        if gia:
            r.scegli(sel, label=gia[0])
        else:
            r.warn.append("2-colori: rampa Batlow non trovata nel menu " + str(ops[:12]))
    r.pause(1.2)
    r.shot("graduata")
    r.sync(0.74)
    r.ring("#legende-box", "Legenda del tema", pos="right", hold=1.8)
    r.zoom_out()


@sc("2-clic")
def _(r):
    # chiude il pannello dei temi e riporta i colori originali
    r.click(r.pg.locator("#pannello button", has_text=re.compile(r"^Ripristina$")), after=0.5)
    r.layers_off(keep=("circoscrizioni", "edificato"))
    r.jump(*MAQUEDA, 17)
    r.sync(0.10)
    r.map_click(*MAQUEDA, after=2.5)
    r.sync(0.40)
    r.ring("#scheda", "Scheda del luogo", pos="left", hold=1.6)
    r.sync(0.55)
    r.ring("#legende-box", "Selezione in mappa", pos="right", hold=1.8)
    r.sync(0.66)
    r.click_text("Monumento", css="label, li, button, div, span", root="#legende-box", after=1.2)
    r.click_text("Monumento", css="label, li, button, div, span", root="#legende-box", after=0.8)
    r.sync(0.84)
    p = r.px(*MAQUEDA)
    r.move(p["x"] + 40, p["y"] + 55, 0.9)
    r.pause(1.4)
    r.shot("fumetto")


@sc("2-tutto")
def _(r):
    r.sync(0.06)
    r.zoom_box("#scheda", 1.3)
    r.click_text("Strumenti urbanistici", css="button, [role=tab], span", root="#scheda", after=0.8)
    r.sync(0.20)
    rc = r.find_rect("*", "particella", "#scheda")
    if rc:
        r.ring(rc, "Catasto e vincoli", pos="left", hold=2.0)
    r.sync(0.52)
    r.click_text("Luogo", css="button, [role=tab], span", root="#scheda", after=0.8)
    for frac, txt, lab in ((0.60, "zona a incidenti", "Sicurezza"), (0.74, "francescane", "Cultura"), (0.88, "trasporto pubblico vicino", "Trasporti")):
        r.sync(frac)
        rc = r.find_rect("*", txt, "#scheda")
        if rc:
            r.ring(rc, lab, pos="left", hold=1.5)
    r.zoom_out()


@sc("2-scheda")
def _(r):
    r.sync(0.05)
    for frac, tab in ((0.12, "Luogo"), (0.28, "Strumenti urbanistici"), (0.52, "Mercato"), (0.60, "Popolazione")):
        r.sync(frac)
        r.click_text(tab, css="button, [role=tab], span", root="#scheda", after=0.9)
        if tab == "Strumenti urbanistici":
            rc = r.find_rect("*", "foglio", "#scheda")
            if rc:
                r.ring(rc, "Particella · foglio · numero", pos="left", hold=1.8)
            rc = r.find_rect("a, button", "visura", "#scheda")
            if rc:
                r.ring(rc, "Link alla visura", pos="left", hold=1.5)
    r.sync(0.90)
    rc = r.find_rect("*", "fonte", "#scheda")
    if rc:
        r.ring(rc, "La fonte", pos="left", hold=1.2)


def vai_a_strato(r, gruppo, strato, centro, zoom):
    r.key("Escape")
    r.layers_off(keep=("circoscrizioni", "edificato"))
    tab_layer(r)
    if not r.pg.locator(f"label.strato:has(input#strato-{strato})").first.is_visible():
        r.group(gruppo)
    r.layer(strato)
    r.fly(*centro, zoom, ms=2400)


@sc("2-monumenti")
def _(r):
    r.sync(0.04)
    vai_a_strato(r, "Monumenti", "monumenti", TEATRO, 16.5)
    r.sync(0.45)
    r.map_click(*TEATRO, after=2.5)
    r.sync(0.68)
    rc = r.find_rect("img", None, "#scheda")
    if rc:
        r.zoom_box(rc, 1.4)
        r.ring(rc, "Foto e descrizione", pos="left", hold=1.8)
    r.sync(0.86)
    rc = r.find_rect("a", "portale", "#scheda") or r.find_rect("a", "turismo", "#scheda")
    if rc:
        r.ring(rc, "Portale del Turismo", pos="left", hold=1.8)
    r.zoom_out()


@sc("2-uffici")
def _(r):
    r.sync(0.04)
    vai_a_strato(r, "Servizi", "uffici", PALAGONIA, 16.5)
    r.sync(0.45)
    p = r.feature_px("uffici-hit", near=PALAGONIA)
    if p:
        r.click_xy(p["x"], p["y"], 0.9, 2.5)
    else:
        r.map_click(*PALAGONIA, after=2.5)
    r.sync(0.62)
    r.click_text("Uffici e responsabili", css="button, summary, h3, div, span", root="#scheda", after=1.0)
    r.shot("uffici")


@sc("2-pai")
def _(r):
    r.sync(0.04)
    vai_a_strato(r, "Piano PAI", "idraulica_pericolosita", (13.40, 38.08), 14)
    r.pause(1.5)
    r.sync(0.50)
    p = r.feature_px("pai-idraulica_pericolosita-hit")
    if p:
        r.click_xy(p["x"], p["y"], 1.0, 2.5)
        r.sync(0.66)
        r.click_text("Strumenti urbanistici", css="button, [role=tab], span", root="#scheda", after=0.9)
        rc = r.find_rect("*", "vincoli pai", "#scheda")
        if rc:
            r.zoom_box(rc, 1.4)
            r.ring(rc, "Vincoli PAI · classe più grave", pos="left", hold=2.2)
            r.zoom_out()
    else:
        r.warn.append("2-pai: nessuna area PAI visibile da cliccare")
    r.shot("pai")


@sc("2-incendi")
def _(r):
    r.sync(0.04)
    vai_a_strato(r, "Territorio", "incendi", (13.33, 38.10), 12)
    r.pause(1.5)
    r.sync(0.45)
    p = r.feature_px("incendi-hit", ["==", ["get", "anno"], 2023]) or r.feature_px("incendi-hit")
    if p:
        r.click_xy(p["x"], p["y"], 1.0, 2.5)
    else:
        r.warn.append("2-incendi: nessun incendio visibile da cliccare")
    r.shot("incendi")


@sc("2-calore")
def _(r):
    r.sync(0.04)
    vai_a_strato(r, "Territorio", "isole-calore", CENTRO, 13)
    r.pause(2.0)
    r.sync(0.35)
    r.zoom_box("#legende-box", 1.5)
    r.ring("#legende-box", "Metodo e classi", pos="right", hold=2.2)
    r.sync(0.62)
    r.shot("calore-legenda")
    r.zoom_out()
    r.sync(0.78)
    p = r.px(*CENTRO)
    r.click_xy(p["x"] + 30, p["y"] + 20, 0.9, 2.2)
    r.shot("calore-scheda")


@sc("2-filtri")
def _(r):
    r.key("Escape")
    r.layers_off(keep=("circoscrizioni", "edificato"))
    r.jump(*CENTRO, 13)
    r.sync(0.12)
    r.click("#btn-gruppo-filtri")
    r.pause(0.8)
    r.sync(0.32)
    r.scegli(r.pg.locator("#f-circ"), label="I · Centro Storico") if False else r.scegli(r.pg.locator("#f-circ"), index=1)
    r.sync(0.52)
    r.type("#cerca-testo", "Maqueda")
    r.pause(1.2)
    r.shot("risultati")
    r.sync(0.80)
    r.click("#cerca-risultati li", after=3.0)


@sc("2-strumenti")
def _(r):
    r.key("Escape")
    r.sync(0.06)
    r.ring("#btn-home", "Vista iniziale", pos="below", hold=1.6)
    r.sync(0.24)
    r.click("#btn-3d", after=3.0)
    r.shot("3d")
    r.click("#btn-3d", after=1.5)
    r.sync(0.48)
    r.ring("#btn-fs", "Schermo intero", pos="below", hold=1.2)
    r.click("#btn-tema", after=2.0)
    r.click("#btn-tema", after=1.0)
    r.sync(0.70)
    r.click("#btn-stampa", after=1.0)
    r.zoom_box("#stampa-menu", 1.5)
    r.ring("#stampa-menu", "Formato · orientamento · scala", pos="below", hold=2.4)
    r.zoom_out()
    r.key("Escape")
    r.click("#btn-stampa", after=0.3) if r.pg.locator("#stampa-menu").is_visible() else None


@sc("2-avvertenze")
def _(r):
    r.jump(*MAQUEDA, 17)
    r.sync(0.10)
    r.map_click(*MAQUEDA, after=2.5)
    r.click_text("Strumenti urbanistici", css="button, [role=tab], span", root="#scheda", after=0.9)
    r.sync(0.35)
    rc = r.find_rect("*", "valore legale", "#scheda")
    if rc:
        r.zoom_box(rc, 1.5)
        r.ring(rc, "Dato informativo", pos="left", hold=2.2)
        r.zoom_out()
    r.sync(0.70)
    r.ring(".piede-avviso", "Senza valore legale", pos="above", hold=2.4)
    r.shot("avvertenze")

#!/usr/bin/env python3
"""Video «tour» del Digital Twin: un browser guidato come farebbe una persona, con una voce che spiega cosa succede.

Tre parti, nell'ordine: guida generale (stessi passi del tab «Guida»), catalogo RNDT, Geoimage.
Non tocca i file di `media/guida/`: scrive in `media/tour/` (tour_app.mp4, tour_app.vtt, tour_app.txt).

Uso:
    python scripts/video_tour.py                  # video completo (circa 10 minuti)
    python scripts/video_tour.py --prova          # solo il browser, senza video né voce: per controllare le azioni
    python scripts/video_tour.py --solo-voce      # genera solo le voci e stampa la durata totale della narrazione
    python scripts/video_tour.py --voce it-IT-ElsaNeural

Richiede:
  * ffmpeg/ffprobe e Playwright con Chromium;
  * edge-tts (`pip install edge-tts`): voce neurale italiana, più naturale di Piper. Il testo della narrazione
    (la guida pubblica) viene inviato al servizio vocale di Microsoft; l'audio resta in ~/.cache/dt-tour;
  * l'app servita su http://localhost:8000 (`python scripts/serve.py 8000`);
  * per la parte RNDT, il Worker in locale (`cd worker && npx wrangler dev --port 8787`): il Worker non è ancora pubblicato.
"""
import argparse
import asyncio
import hashlib
import io
import json
import math
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from guida_screenshot_geoimage import _crea_immagine  # noqa: E402  (cattura la pianta del 1891 e i punti noti per i GCP)

ROOT = Path(__file__).resolve().parents[1]
USCITA = ROOT / "media" / "tour"
CACHE_VOCE = Path.home() / ".cache" / "dt-tour"
APP = "http://localhost:8000"
PROXY = "http://localhost:8787"
VIEWPORT = {"width": 1600, "height": 900}
VOCE = "it-IT-IsabellaNeural"
CENTRO = [13.3615, 38.1157]
PUNTO_CLIC = [13.3586, 38.1203]  # via Maqueda
TEATRO = [13.3571944, 38.1201711]
PALAGONIA = [13.370036, 38.1167363]
ARGS_BROWSER = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]

# ---------------------------------------------------------------------------------------------------------------------
# Pronuncia: le sigle si leggono di fila, come parole (non lettera per lettera).
# ---------------------------------------------------------------------------------------------------------------------
PRONUNCIA = [
    (r"\bPAI\b", "Pài"),
    (r"\bWMS\b", "vuemmèsse"),
    (r"\bWFS\b", "vuefèsse"),
    (r"\bRNDT\b", "errennedìti"),
    (r"\bGCP\b", "gicipì"),
    (r"\bKMZ\b", "cappaemmezzèta"),
    (r"\bGoogle Earth\b", "Gùgol Ert"),
    (r"\bQGIS\b", "chiugìs"),
    (r"\bArcGIS\b", "arcgìs"),
    (r"\bGeoTIFF\b", "geotìf"),
    (r"\bGeoimage\b", "Geoìmidj"),
    (r"\bDigital Twin\b", "Dìgital Tuìn"),
    (r"\bopenrndt-geolibre\b", "open errennedìti geolàibre"),
    (r"\bBorruso\b", "Borrùso"),
    (r"\bMapWarper\b", "Map Uòrper"),
    (r"\b3D\b", "tre di"),
    (r"\bUPL\b", "Upl"),
    (r"\bOpenStreetMap\b", "Open Strit Map"),
    (r"\bonData\b", "on Dèita"),
]


def per_la_voce(testo):
    for modello, sostituto in PRONUNCIA:
        testo = re.sub(modello, sostituto, testo)
    return testo


# ---------------------------------------------------------------------------------------------------------------------
# Gesti «umani»: cursore visibile, movimenti curvi e con accelerazione, clic con un attimo di pausa.
# ---------------------------------------------------------------------------------------------------------------------
CURSORE_JS = """
(() => {
  const crea = () => {
    if (document.getElementById('cursore-tour')) return;
    const c = document.createElement('div');
    c.id = 'cursore-tour';
    c.style.cssText = 'position:fixed;left:-50px;top:-50px;z-index:2147483647;pointer-events:none;width:30px;height:30px;margin:-3px 0 0 -4px';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 2l0 17 4.6-4.2 3 6.7 3-1.4-3-6.6 6.4-.4z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.documentElement.append(c);
    window.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    window.addEventListener('mousedown', e => {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${e.clientX - 18}px;top:${e.clientY - 18}px;width:36px;height:36px;border-radius:50%;border:3px solid #f5a623;z-index:2147483646;pointer-events:none`;
      document.documentElement.append(r);
      r.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 520, easing: 'ease-out' }).onfinish = () => r.remove();
    }, true);
  };
  if (document.documentElement) crea(); else document.addEventListener('DOMContentLoaded', crea);
  // cartello di capitolo: scivola dentro in alto a sinistra, resta qualche secondo ed esce
  window.__capitolo = (testo, parte) => {
    const c = document.createElement('div');
    const aperti = ['scheda', 'rndt-pannello', 'geoimage-pannello'].map(id => document.getElementById(id)).filter(e => e && !e.hidden && e.getBoundingClientRect().width > 50);
    const sinistra = aperti.length ? Math.min(...aperti.map(e => e.getBoundingClientRect().left)) : window.innerWidth - 44;
    c.style.cssText = 'position:fixed;right:' + (window.innerWidth - sinistra + 16) + 'px;top:150px;z-index:2147483645;pointer-events:none;display:flex;align-items:center;gap:10px;padding:10px 18px 10px 14px;border-radius:999px;background:#1b1f24;color:#fff;font:600 17px Montserrat,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);border:2px solid #f5a623';
    c.innerHTML = `<span style="background:#f5a623;color:#1a1206;border-radius:999px;padding:3px 10px;font-size:13px;font-weight:700">${parte}</span><span>${testo}</span>`;
    document.documentElement.append(c);
    c.animate([{ transform: 'translateX(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    setTimeout(() => c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(30px)' }], { duration: 450, fill: 'forwards' }).onfinish = () => c.remove(), 3600);
  };
})();
"""


class Umano:
    def __init__(self, page, veloce=False):
        self.page = page
        self.pos = (VIEWPORT["width"] * 0.6, VIEWPORT["height"] * 0.55)
        self.veloce = veloce  # --prova: niente pause teatrali
        self.base = time.monotonic()  # istante di creazione della pagina (main lo aggiorna): origine dei tempi degli zoom
        self.zooms = []  # (inizio, fine, cx, cy, fattore) in secondi dall'origine e pixel del video: li applica ffmpeg in montaggio

    def dettaglio(self, selettore=None, xy=None, fattore=1.7, tieni=3.5):
        """Effetto zoom (applicato in montaggio) su un dettaglio, senza fermare l'azione: parte ora e dura `tieni` secondi."""
        try:
            x, y = xy if xy else self.centro(selettore)
        except Exception:
            return
        t = time.monotonic() - self.base
        self.zooms.append((t, t + tieni, x, y, fattore))

    def capitolo(self, testo, parte="Guida"):
        self.page.evaluate("([t, p]) => window.__capitolo && window.__capitolo(t, p)", [testo, parte])

    def pausa(self, s):
        time.sleep(0.05 if self.veloce else s)

    def muovi(self, x, y, durata=None):
        x0, y0 = self.pos
        d = math.hypot(x - x0, y - y0)
        durata = durata if durata is not None else min(0.9, 0.3 + d / 1800)
        if self.veloce:
            self.page.mouse.move(x, y)
            self.pos = (x, y)
            return
        passi = max(10, int(durata * 45))
        nx, ny = (-(y - y0) / (d or 1), (x - x0) / (d or 1))  # normale al percorso: dà una piccola curva
        arco = min(26, d * 0.05)
        for i in range(1, passi + 1):
            t = i / passi
            e = t * t * (3 - 2 * t)
            curva = math.sin(math.pi * t) * arco
            self.page.mouse.move(x0 + (x - x0) * e + nx * curva, y0 + (y - y0) * e + ny * curva)
            time.sleep(durata / passi)
        self.pos = (x, y)

    def centro(self, selettore, dentro=None, timeout=10000):
        loc = self.page.locator(selettore).first
        loc.evaluate("e => { for (let x = e; x; x = x.parentElement) if (x.tagName === 'DETAILS') x.open = true; }", timeout=timeout)  # sezioni chiuse: si aprono
        loc.scroll_into_view_if_needed(timeout=timeout)
        box = loc.bounding_box(timeout=timeout)
        return box["x"] + box["width"] * (0.5 if dentro is None else dentro[0]), box["y"] + box["height"] * (0.5 if dentro is None else dentro[1])

    def punta(self, selettore, dentro=None, timeout=10000):
        x, y = self.centro(selettore, dentro, timeout)
        self.muovi(x, y)
        return x, y

    def clic(self, selettore=None, xy=None, dentro=None, attesa=0.5):
        x, y = self.punta(selettore, dentro) if selettore else xy
        if xy:
            self.muovi(*xy)
        self.pausa(0.1)
        self.page.mouse.down()
        self.pausa(0.05)
        self.page.mouse.up()
        self.pausa(attesa)

    def trascina(self, da, a, durata=0.7):
        self.muovi(*da)
        self.page.mouse.down()
        self.pausa(0.05)
        self.muovi(*a, durata=durata)
        self.page.mouse.up()
        self.pausa(0.2)

    def scrivi(self, selettore, testo, ritmo=0.06):
        self.clic(selettore)
        for c in testo:
            self.page.keyboard.type(c)
            self.pausa(ritmo)
        self.pausa(0.3)

    def scorri(self, selettore, dy, passi=10, x_y=None):
        """Rotella del mouse su un elemento, a piccoli scatti."""
        x, y = self.centro(selettore)
        self.muovi(*(x_y or (x, y)))
        for _ in range(passi):
            self.page.mouse.wheel(0, dy / passi)
            self.pausa(0.04)
        self.pausa(0.3)


# ---------------------------------------------------------------------------------------------------------------------
# Azioni sull'app (tutte con il mouse, come farebbe chi la usa)
# ---------------------------------------------------------------------------------------------------------------------
def schermo(page, lng, lat):
    return page.evaluate(
        "([a, b]) => { const p = window.dt.map.project([a, b]), r = window.dt.map.getCanvas().getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }",
        [lng, lat],
    )


def vai(page, centro, zoom, durata=0):
    page.evaluate(
        "([c, z, d]) => new Promise(ok => { const m = window.dt.map; if (d) { m.once('moveend', () => ok()); m.flyTo({ center: c, zoom: z, duration: d }); } else { m.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 }); ok(); } })",
        [centro, zoom, durata])
    page.wait_for_timeout(1500)


def apri_gruppo_layer(page, titolo):
    page.evaluate(
        "t => { for (const d of document.querySelectorAll('details.layer-sezione')) { const s = d.querySelector('summary'); if (s && s.textContent.trim().startsWith(t)) d.open = true; } }",
        titolo,
    )


def tab_barra(u, nome):
    """Clic sul tab della barra a sinistra, se il suo pannello non è già aperto (un secondo clic lo chiuderebbe)."""
    if u.page.locator(f"#gruppo-{nome}").is_hidden():
        u.clic(f"#btn-gruppo-{nome}", attesa=0.7)


def accendi(u, strato, gruppo=None, acceso=True):
    """Accende/spegne uno strato con il clic sulla sua riga. Il gruppo chiuso si apre con un clic sul titolo; le sezioni annidate si aprono da sole."""
    page = u.page
    if page.locator(f"#strato-{strato}").is_checked() == acceso:
        return
    esterno_chiuso = page.evaluate(
        "id => { let e = document.getElementById('strato-' + id), ultimo = null; while (e) { if (e.tagName === 'DETAILS') ultimo = e; e = e.parentElement; } return ultimo ? !ultimo.open : false; }", strato)
    if esterno_chiuso:
        u.clic(f"details.layer-sezione:has(#strato-{strato}) > summary", attesa=0.4)
    page.evaluate("id => { let e = document.getElementById('strato-' + id); while (e) { if (e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } }", strato)
    u.clic(f"label.strato:has(#strato-{strato}), label.sotto-voce:has(#strato-{strato})", dentro=(0.35, 0.5), attesa=0.7)


def clic_mappa(u, lng, lat):
    x, y = schermo(u.page, lng, lat)
    u.clic(xy=(x, y), attesa=1.2)


def spegni_strati(page, tranne=("strato-edificato", "strato-circoscrizioni")):
    """Spegne tutti gli strati accesi (tranne quelli di base), per ripartire da una mappa pulita."""
    page.evaluate(
        "t => { for (const c of document.querySelectorAll('#pannello input[id^=strato-]:checked')) if (!t.includes(c.id)) { c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); } }",
        list(tranne))


def chiudi_scheda(u):
    """Chiude scheda e fumetto del monumento (se aperti), con il mouse."""
    if u.page.locator("#scheda:not([hidden]) .scheda-x").count():
        u.clic("#scheda .scheda-x", attesa=0.6)
    if u.page.locator(".maplibregl-popup-close-button").count():
        u.clic(".maplibregl-popup-close-button", attesa=0.5)


def chiudi_info(u):
    u.page.evaluate("document.getElementById('crediti')?.open && document.getElementById('crediti').close()")


def apri_menu(u, scheda):
    u.clic(f"#menu-info button[data-scheda={scheda}]", attesa=1.0)


# ---------------------------------------------------------------------------------------------------------------------
# La sceneggiatura: ogni «battuta» ha il testo detto e, se serve, ciò che si fa mentre lo si dice.
# ---------------------------------------------------------------------------------------------------------------------
def battute(ctx):
    """Restituisce [(testo, azione|None)]: ogni battuta è una frase breve che accompagna UN gesto, così voce e schermo coincidono.
    L'azione parte insieme alla voce; se è più corta della frase, il cursore resta sull'elemento di cui si parla."""
    u, page = ctx["u"], ctx["page"]
    B = []

    def d(testo, fai=None):
        B.append((testo, fai))

    def punta_su(selettori, sosta=1.0):
        """Il cursore passa da un elemento all'altro, fermandosi un momento su ciascuno (mentre la voce li nomina)."""
        for sel in selettori:
            try:
                u.punta(sel, timeout=2500)
            except Exception:
                continue
            u.pausa(sosta)

    # ======================= PARTE 1 · GUIDA GENERALE ======================================================================
    def intro():
        u.capitolo("Il tour del Digital Twin", "Inizio")
        u.dettaglio("#app-logo", fattore=1.6, tieni=4.5)
        u.punta("#app-logo")

    d("Ciao! In dieci minuti ti porto a fare il giro completo del Digital Twin di Palermo, la mappa interattiva di Open Data Sicilia.", intro)

    d("Vedrai la guida generale, il catalogo nazionale dei dati e Geoimage, per le mappe storiche.",
      lambda: punta_su(["#menu-info button[data-scheda=guida]", "#menu-info button[data-scheda=plugin]", "#menu-info button[data-scheda=geoimage]"], 1.0))

    d("Si parte! Questo invito ti ricorda di fare clic sulla mappa: per ora lo chiudo con Non mostrare più.",
      lambda: (u.pausa(1.0), u.clic("button:has-text('Non mostrare più')", attesa=0.8)))

    def menu():
        u.capitolo("Il menu e la mappa", "Guida")
        u.dettaglio("#menu-info", fattore=1.6, tieni=4.0)
        punta_su(["#menu-info button[data-scheda=mappa]", "#menu-info button[data-scheda=fonti]"], 0.8)

    d("In alto c'è il menu, con tutte le schede.", menu)

    def disposizione():
        u.muovi(22, 250)
        u.pausa(0.9)
        u.muovi(640, 400)
        u.pausa(0.9)
        u.muovi(1500, 320)

    d("La mappa sta al centro, la barra degli strati è a sinistra e la scheda del luogo si aprirà a destra.", disposizione)

    def vista3d():
        u.clic("#btn-3d", attesa=0.3)
        page.evaluate("() => { window.dt.map.easeTo({ pitch: 62, bearing: -28, zoom: 14, duration: 3500 }); }")
        u.pausa(4.0)
        page.evaluate("() => { window.dt.map.easeTo({ pitch: 0, bearing: 0, zoom: 12, duration: 2200 }); }")
        u.pausa(2.3)
        u.clic("#btn-3d", attesa=0.3)

    d("Con il pulsante tre di inclino la mappa e vedo la città in prospettiva. Poi la riporto dritta.", vista3d)

    def fonti():
        u.capitolo("Da dove arrivano i dati", "Guida")
        apri_menu(u, "fonti")

    d("I dati arrivano da enti pubblici e da progetti di dati aperti, e l'elenco completo è nella scheda Fonti e avvisi.", fonti)

    d("Per ogni fonte trovi il link al dato originale e la licenza.", lambda: u.scorri("#crediti .tab-corpo", 1100, x_y=(800, 450)))

    def strati1():
        u.capitolo("La barra degli strati", "Guida")
        chiudi_info(u)
        vai(page, PUNTO_CLIC, 16, durata=2500)

    d("Passiamo agli strati. Mi avvicino a via Maqueda.", strati1)

    d("A sinistra la barra ha cinque schede: base cartografica, layer, catalogo nazionale, i miei layer e filtri.",
      lambda: punta_su(["#btn-gruppo-base", "#btn-gruppo-layer", "#btn-gruppo-rndt", "#btn-gruppo-miei", "#btn-gruppo-filtri"], 1.0))

    d("Apro la scheda layer: i temi sono raggruppati in sezioni.", lambda: tab_barra(u, "layer"))

    d("Apro il gruppo Territorio e accendo il catasto.", lambda: accendi(u, "catasto", gruppo="Territorio"))

    def legenda():
        u.dettaglio("#legende-box", fattore=1.7, tieni=4.5)
        u.punta("#legende-box")

    d("Sulla mappa compaiono le particelle catastali, e in basso a sinistra la legenda spiega i colori.", legenda)

    def ordine1():
        u.capitolo("Layer sopra o sotto", "Guida")
        accendi(u, "monumenti", gruppo="Monumenti")

    d("Se accendi più strati puoi decidere quale sta sopra. Accendo anche i monumenti.", ordine1)

    d("In cima al pannello c'è la scheda arancione Ordine layer in mappa: la apro.",
      lambda: u.clic("details.layer-sezione.ordine-strumento > summary", attesa=0.6))

    def ordine2():
        u.dettaglio("details.ordine-strumento", fattore=1.6, tieni=4.0)
        u.punta("details.ordine-strumento")

    d("L'elenco mostra tutti gli strati accesi: in alto vuol dire sopra, sulla mappa.", ordine2)

    def ordine3():
        if page.locator("details.ordine-strumento .strato-btn--giu:not([disabled])").count():
            u.clic("details.ordine-strumento .strato-btn--giu:not([disabled])", attesa=1.0)

    d("Con le frecce sposto uno strato di un posto, oppure lo trascino con la maniglia. Vale anche per i layer che aggiungi tu.", ordine3)

    def storiche1():
        u.capitolo("Mappe di base e storiche", "Guida")
        page.evaluate("document.querySelector('details.ordine-strumento')?.removeAttribute('open')")
        accendi(u, "monumenti", gruppo="Monumenti", acceso=False)
        accendi(u, "catasto", gruppo="Territorio", acceso=False)
        vai(page, CENTRO, 14, durata=2000)
        tab_barra(u, "base")

    d("Spengo questi due strati e apro la scheda base cartografica.", storiche1)

    d("Qui scelgo la mappa che sta sotto gli strati: stradale, aerea o topografica.",
      lambda: punta_su([".base-scelta:has-text('Mappa chiara')", ".base-scelta:has-text('Satellite')", ".base-scelta:has-text('OpenTopo')"], 1.1))

    d("Scorrendo in fondo trovi le mappe storiche: quindici carte di Palermo, dal millecinquecentoottanta al millenovecentonovantatré.",
      lambda: u.scorri("#pannello", 1400, x_y=(180, 420)))

    d("Scelgo quella del milleottocentonovantuno.", lambda: (u.clic(".base-scelta:has-text('1891')", attesa=0.8), u.pausa(2.0)))

    def storica_vista():
        u.dettaglio(".base-scelta:has-text('1891')", fattore=2.0, tieni=5.0)
        u.punta(".base-scelta:has-text('1891')")

    d("Ecco la Palermo di fine Ottocento. Il pallino colorato dice quanto la carta si sovrappone bene alla città di oggi: verde vuol dire molto bene.", storica_vista)

    d("Torno alla mappa chiara.", lambda: u.clic(".base-scelta:has-text('Mappa chiara')", attesa=1.0))

    def tema1():
        u.capitolo("Tema chiaro e scuro", "Guida")
        u.clic("#btn-tema", attesa=1.8)

    d("Con il pulsante con la luna, in alto, passo al tema scuro.", tema1)

    d("E poi torno al tema chiaro.", lambda: u.clic("#btn-tema", attesa=1.0))

    def miei1():
        u.capitolo("I miei layer", "Guida")
        tab_barra(u, "miei")

    d("Nella scheda I miei layer aggiungi i tuoi dati.", miei1)

    def miei2():
        u.dettaglio("#gruppo-miei", fattore=1.5, tieni=6.0)
        u.punta("#gruppo-miei")

    d("Puoi caricare un file dal computer o da un indirizzo web, oppure collegare un servizio di mappe come WMS, WFS o ArcGIS.", miei2)


    def colori1():
        u.capitolo("Cambiare i colori", "Guida")
        vai(page, CENTRO, 15, durata=2000)
        tab_barra(u, "layer")
        accendi(u, "edificato", gruppo="Edifici", acceso=True)
        u.clic("button[aria-label^='Colori di Edificato']", attesa=0.8)

    d("Ogni strato si può colorare. Torno su layer e premo la tavolozza accanto agli edifici.", colori1)

    def colori2():
        u.dettaglio(".strato-tema:visible", fattore=1.6, tieni=6.5)
        punta_su([".strato-tema:visible >> text=Riempimento", ".strato-tema:visible >> text=Bordo", ".strato-tema:visible >> text=Colora per attributo"], 1.0)

    d("Si apre il pannello dei colori: riempimento, bordo, e colora per attributo.", colori2)

    def colori3():
        sel = ".strato-tema:visible select"
        u.punta(f"{sel} >> nth=0")
        u.pausa(0.5)
        opzioni = page.locator(f"{sel} >> nth=0").locator("option").all_inner_texts()
        scelta = next((o for o in opzioni if re.search("popolaz|resident|densit", o, re.I)), opzioni[1] if len(opzioni) > 1 else opzioni[0])
        page.locator(f"{sel} >> nth=0").select_option(label=scelta)
        u.pausa(1.0)

    d("Scelgo un campo dei dati, per esempio la popolazione...", colori3)

    def colori4():
        sel = ".strato-tema:visible select"
        u.punta(f"{sel} >> nth=1")
        page.locator(f"{sel} >> nth=1").select_option(index=1)
        u.pausa(2.5)
        u.clic(".strato-tema:visible button:has-text('Ripristina')", attesa=0.8)

    d("...e la mappa si colora in base ai dati, per categorie o in classi. La rampa si sceglie da un elenco, anche con colori adatti a chi è daltonico.", colori4)

    def clic1():
        u.capitolo("Un clic, tutte le informazioni", "Guida")
        u.clic("button[aria-label^='Colori di Edificato']", attesa=0.4)
        vai(page, PUNTO_CLIC, 17, durata=2200)
        clic_mappa(u, *PUNTO_CLIC)

    d("Ora il cuore della mappa: per conoscere un luogo basta fare clic. Provo in via Maqueda.", clic1)

    def clic2():
        u.dettaglio("#scheda", fattore=1.4, tieni=3.5)
        u.punta("#scheda .scheda-intestazione")

    d("Il punto viene evidenziato e a destra si apre la scheda del luogo.", clic2)

    def clic3():
        u.dettaglio("#legende-box", fattore=1.7, tieni=5.5)
        u.punta("#legende-box")

    d("In basso a sinistra, la legenda Selezione in mappa ha un colore per ogni voce: con un clic su una voce resta in mappa solo quella.", clic3)

    def scheda1():
        u.dettaglio("#scheda .scheda-indice", fattore=1.8, tieni=8.0)
        u.clic("#scheda .scheda-indice button >> nth=0", attesa=0.5)

    d("La scheda ha le sue linguette. Luogo riassume indirizzo e quartiere.", scheda1)

    d("Strumenti urbanistici mostra l'edificio, il foglio e la particella catastale.",
      lambda: u.clic("#scheda .scheda-indice button >> nth=1", attesa=0.8))

    def scheda3():
        for i in (2, 3):
            if page.locator("#scheda .scheda-indice button").count() > i:
                u.clic(f"#scheda .scheda-indice button >> nth={i}", attesa=1.0)

    d("E poi ci sono il mercato, la popolazione e altro ancora.", scheda3)

    d("Un solo clic interroga insieme catasto, vincoli, sicurezza, beni culturali e trasporti, e ogni sezione indica la fonte.",
      lambda: u.scorri("#scheda .scheda-corpo", 500))

    def monumenti1():
        u.capitolo("Monumenti", "Guida")
        chiudi_scheda(u)
        vai(page, TEATRO, 17, durata=2200)
        accendi(u, "monumenti", gruppo="Monumenti")

    d("Lo strato Monumenti raccoglie i luoghi di interesse storico. Mi sposto al Teatro Massimo e accendo lo strato.", monumenti1)

    def monumenti2():
        clic_mappa(u, *TEATRO)
        u.pausa(1.0)
        u.dettaglio("#scheda .scheda-corpo", fattore=1.5, tieni=4.0)

    d("Un clic sul teatro apre la scheda con il nome, la foto e la descrizione.", monumenti2)

    def uffici1():
        u.capitolo("Uffici comunali", "Guida")
        chiudi_scheda(u)
        accendi(u, "monumenti", gruppo="Monumenti", acceso=False)
        vai(page, PALAGONIA, 16, durata=2200)

    d("Gli uffici comunali sono raggruppati per area. Spengo i monumenti e vado a Palazzo Palagonia, sede comunale.", uffici1)

    def uffici2():
        accendi(u, "uffici", gruppo="Servizi")
        u.pausa(1.5)

    d("Accendo gli uffici: ogni punto è una sede, con un colore per area, e un clic mostra l'indirizzo e gli uffici ospitati.", uffici2)

    def pai1():
        u.capitolo("Rischio idrogeologico (PAI)", "Guida")
        accendi(u, "uffici", gruppo="Servizi", acceso=False)
        vai(page, [13.3320, 38.1530], 13, durata=2500)

    d("Il Piano di assetto idrogeologico, il PAI, mostra le aree a pericolosità e a rischio. Spengo gli uffici e mi sposto sulla costa a nord.", pai1)

    def pai2():
        tab_barra(u, "layer")
        accendi(u, "idraulica_pericolosita", gruppo="Piano PAI")
        u.pausa(1.5)

    d("Accendo la pericolosità idraulica: le zone si colorano in base al livello.", pai2)

    def incendi():
        u.capitolo("Incendi", "Guida")
        accendi(u, "idraulica_pericolosita", gruppo="Piano PAI", acceso=False)
        vai(page, [13.3600, 38.1200], 12, durata=2000)
        accendi(u, "incendi", gruppo="Territorio")
        u.pausa(1.0)

    d("Lo strato Incendi raccoglie le aree percorse dal fuoco dal duemilasette a oggi, con un cursore per scegliere l'anno.", incendi)

    def isole1():
        u.capitolo("Isole di calore", "Guida")
        accendi(u, "incendi", gruppo="Territorio", acceso=False)
        accendi(u, "isole-calore", gruppo="Territorio")
        u.dettaglio("#legende-box", fattore=1.5, tieni=4.0)
        u.punta("#legende-box")

    d("Le isole di calore mostrano dove la città scalda di più d'estate, sezione per sezione.", isole1)


    def ricerca1():
        u.capitolo("Cercare un luogo", "Guida")
        accendi(u, "isole-calore", gruppo="Territorio", acceso=False)
        vai(page, CENTRO, 12, durata=1800)
        u.scrivi("#cerca-testo", "via Maqueda", ritmo=0.08)

    d("Per trovare un posto c'è la ricerca in basso: scrivo via Maqueda.", ricerca1)

    def ricerca2():
        page.wait_for_selector("#cerca-risultati li", timeout=15000)
        u.pausa(0.5)
        u.clic("#cerca-risultati li >> nth=0", attesa=2.0)

    d("Scelgo il primo risultato e la mappa mi porta lì. Funziona anche con civici, quartieri, foglio e particella catastale.", ricerca2)

    def filtri1():
        u.capitolo("Filtrare per zona", "Guida")
        chiudi_scheda(u)
        u.clic("#cerca-filtri", attesa=1.0)
        punta_su(["#f-circ", "#f-quart", "#f-upl"], 0.9)

    d("Con il pulsante dei filtri scegli la zona: circoscrizione, quartiere o unità di primo livello.", filtri1)

    d("Puoi filtrare anche per linea del trasporto pubblico o per anno degli incidenti.",
      lambda: punta_su(["#f-linea", "#sicurezza-anno"], 1.2))

    def stampa():
        u.capitolo("Stampare la mappa", "Guida")
        u.clic("#cerca-filtri", attesa=0.4)
        u.clic("#btn-stampa", attesa=0.6)
        punta_su(["#stampa-formato", "#stampa-scala"], 1.0)

    d("Infine puoi stampare la mappa: scegli il formato e la scala, e ottieni un foglio con legenda e fonti.", stampa)

    def avvertenze():
        u.clic("#btn-stampa", attesa=0.4)
        u.dettaglio(".piede-avviso", fattore=1.8, tieni=7.0)
        u.punta(".piede-avviso")

    d("Ultima cosa, importante: catasto, piano regolatore e vincoli sono dati informativi, senza valore legale. Per usi legali servono la visura e il certificato di destinazione urbanistica.", avvertenze)

    # ======================= PARTE 2 · CATALOGO RNDT =======================================================================
    def plugin1():
        u.capitolo("Il catalogo nazionale", "Parte 2 · RNDT")
        chiudi_scheda(u)
        spegni_strati(page)
        u.clic("#menu-info button[data-scheda=plugin]", attesa=1.0)

    d("Passiamo al catalogo nazionale dei dati territoriali, l'RNDT.", plugin1)

    d("Funziona grazie al plugin openrndt-geolibre di Andrea Borruso: senza il suo lavoro non esisterebbe, io l'ho solo adattato a questo progetto.",
      lambda: u.scorri("#crediti .tab-corpo", 700, x_y=(640, 420)))

    def rndt_apri():
        chiudi_info(u)
        u.clic("#btn-rndt", attesa=1.2)

    d("Lo apro con il pulsante a forma di livelli, nella barra degli strumenti.", rndt_apri)

    d("A destra compare il pannello del catalogo.", lambda: (u.dettaglio("#rndt-pannello", fattore=1.4, tieni=3.0), u.punta("#rndt-pannello .ordt-input")))

    def rndt_cerca1():
        u.capitolo("Cercare un dato", "RNDT")
        u.scrivi("#rndt-pannello .ordt-input", "mareografica", ritmo=0.07)
        page.keyboard.press("Enter")

    d("Scrivo una parola chiave, per esempio mareografica, e premo invio.", rndt_cerca1)

    def rndt_cerca2():
        page.wait_for_selector("#rndt-pannello .ordt-result", timeout=45000)
        u.dettaglio("#rndt-pannello .ordt-result >> nth=0", fattore=1.7, tieni=6.0)
        u.punta("#rndt-pannello .ordt-result >> nth=0")

    d("Il catalogo cerca tra migliaia di dati pubblicati dalle amministrazioni italiane: per ogni risultato vedi il titolo, il tipo, chi lo pubblica e la data.", rndt_cerca2)

    d("I risultati si possono anche ordinare e filtrare per area.", lambda: u.scorri("#rndt-pannello", 400, x_y=(1000, 400)))

    d("Scelgo la Rete mareografica nazionale: le stazioni che misurano il livello del mare.",
      lambda: u.clic("#rndt-pannello .ordt-result-title:has-text('Rete Mareografica') >> nth=0", attesa=1.0))

    def rndt_aggiungi():
        u.dettaglio("#rndt-pannello button:has-text('Add features')", fattore=1.9, tieni=3.5)
        u.clic("#rndt-pannello button:has-text('Add features')", attesa=0.5)

    d("Lo aggiungo alla mappa con il pulsante Add features.", rndt_aggiungi)

    d("Il catalogo si collega al servizio originale, in questo caso un servizio WFS, e scarica gli elementi.", lambda: u.pausa(2.0))

    d("Lo stesso dato può essere pubblicato in modi diversi: con un WMS ottieni solo il disegno, con un WFS ricevi gli elementi veri, con le loro informazioni, e puoi anche colorarli.")

    d("Per ogni servizio puoi anche aprirlo o copiarne l'indirizzo, per usarlo in QGIS o in un altro programma.",
      lambda: u.punta("#rndt-pannello >> text=Copy URL"))

    def rndt_attendi():
        page.wait_for_function("window.dt.map.getStyle().layers.some(l => l.id.startsWith('rndt-'))", timeout=90000)
        u.pausa(0.5)

    d("Molti server non si lasciano interrogare direttamente da una pagina web, così le richieste passano da un piccolo proxy. Qualche secondo di attesa è normale, soprattutto con dati grandi.", rndt_attendi)

    def rndt_gruppo():
        u.capitolo("Il layer in mappa", "RNDT")
        u.clic("#rndt-pannello .pannello-chiudi", attesa=0.6)
        tab_barra(u, "rndt")

    d("Ora il layer è in mappa. Nella scheda RNDT, a sinistra, trovi l'elenco dei layer aggiunti.", rndt_gruppo)

    d("Puoi accenderli e spegnerli, regolare la trasparenza, centrare la mappa, cambiare i colori o toglierli.",
      lambda: (u.dettaglio("#gruppo-rndt", fattore=1.6, tieni=5.0), u.punta("#gruppo-rndt")))

    def rndt_info():
        c = page.evaluate("""([cx, cy]) => { const m = window.dt.map; let best = null, bd = 1e9;
            for (const l of m.getStyle().layers.filter(l => l.id.startsWith('rndt-') && l.source)) {
              for (const f of m.querySourceFeatures(l.source)) { const c = f.geometry.coordinates.flat(3); const d = (c[0] - cx) ** 2 + (c[1] - cy) ** 2; if (d < bd) { bd = d; best = [c[0], c[1]]; } } }
            return best; }""", CENTRO) or PUNTO_CLIC
        vai(page, c, 15, durata=2200)
        clic_mappa(u, *c)

    d("E se faccio clic su un punto coperto da un layer del catalogo, la scheda del luogo mostra anche le informazioni di quel dato, nella sezione Altri dati.", rndt_info)

    def rndt_togli():
        tab_barra(u, "rndt")
        page.evaluate("document.querySelectorAll('.rndt-gruppo-togli').forEach(b => b.click())")
        u.pausa(0.6)

    d("Quando un layer non serve più, lo tolgo con il cestino.", rndt_togli)

    # ======================= PARTE 3 · GEOIMAGE ============================================================================
    def geo_apri():
        u.capitolo("Mappe storiche sulla mappa", "Parte 3 · Geoimage")
        chiudi_scheda(u)  # una scheda aperta rimasta dalla parte RNDT farebbe perdere il primo clic dei GCP
        for nome in page.evaluate("[...document.querySelectorAll('.sotto-pannello')].filter(g => !g.hidden).map(g => g.id.replace('gruppo-', ''))"):
            u.clic(f"#btn-gruppo-{nome}", attesa=0.5)  # il pannello a sinistra coprirebbe i punti da cliccare sulla mappa
        if page.locator("#rndt-pannello:not([hidden]) .pannello-chiudi").count():
            u.clic("#rndt-pannello .pannello-chiudi", attesa=0.4)
        page.evaluate("document.querySelectorAll('.rndt-gruppo-togli').forEach(b => b.click())")
        # il layer pesante del catalogo non deve rallentare Geoimage: si attende che sia davvero sparito dalla mappa
        page.wait_for_function("!window.dt.map.getStyle().layers.some(l => l.id.startsWith('rndt-'))", timeout=60000)
        page.evaluate("document.getElementById('rndt-pannello').hidden = true")
        u.pausa(0.5)
        spegni_strati(page)
        vai(page, ctx["centro_geo"], 13)

    d("Ultima tappa: Geoimage. Serve a sovrapporre una mappa storica, o qualsiasi immagine, alla cartografia di oggi.", geo_apri)

    d("Lo trovi nella barra a destra: apro il tab Geoimage.", lambda: u.clic("#rail-pannelli [data-pannello=geoimage]", attesa=1.2))

    def geo_inquadra():
        page.evaluate("([c, z]) => new Promise(ok => { const m = window.dt.map; m.once('moveend', () => ok()); m.flyTo({ center: c, zoom: z, duration: 3000 }); })", [ctx["centro_geo"], ctx["zoom_geo"]])

    d("Prima inquadro la zona che l'immagine rappresenta, così si carica già vicina al posto giusto: qui siamo tra via Maqueda e i Quattro Canti.", geo_inquadra)

    def geo_zona():
        u.dettaglio("#gi-zona", fattore=1.8, tieni=5.0)
        u.punta("#gi-zona")
        u.pausa(1.5)

    d("Poi carico la mappa storica: trascino un file nel riquadro, oppure ci clicco e lo scelgo dal computer.", geo_zona)

    def geo_carica():
        page.set_input_files("#gi-file", files=[{"name": "palermo-1891.png", "mimeType": "image/png", "buffer": ctx["png"]}])
        page.wait_for_selector(".gi-overlay:not([hidden]) .gi-immagine[src]", timeout=30000)
        page.wait_for_selector(".gi-angolo", timeout=30000)
        u.pausa(1.0)

    d("Io uso una pianta di Palermo del milleottocentonovantuno: appare subito al centro, con le maniglie per posizionarla.", geo_carica)

    def geo_centro():
        b = page.locator(".gi-centro").first.bounding_box()
        cx, cy = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
        u.trascina((cx, cy), (cx - 40, cy + 25))

    d("Il cerchio arancione al centro sposta tutta l'immagine.", geo_centro)

    def geo_ruota():
        r = page.locator(".gi-rota").first.bounding_box()
        rx, ry = r["x"] + r["width"] / 2, r["y"] + r["height"] / 2
        u.trascina((rx, ry), (rx + 22, ry + 3))

    d("Quello con la freccia, sopra il lato nord, la ruota.", geo_ruota)

    def geo_angoli():
        punta_su([".gi-angolo >> nth=0", "#gi-su", "#gi-ruota-dx", "#gi-piu"], 0.8)

    d("Le maniglie agli angoli la ridimensionano. Per gli spostamenti precisi ci sono anche le frecce e i pulsanti di rotazione e di scala nel pannello.", geo_angoli)

    def geo_swipe1():
        u.clic("#gi-swipe", attesa=1.0)
        div = page.locator(".gi-divisore-maniglia").first
        if div.count():
            b = div.bounding_box()
            u.trascina((b["x"] + b["width"] / 2, b["y"] + b["height"] / 2), (b["x"] + b["width"] / 2 - 220, b["y"] + b["height"] / 2), durata=0.9)

    d("Con lo Swipe una tendina divide lo schermo: da una parte la mappa storica, dall'altra la città di oggi.", geo_swipe1)

    def geo_swipe2():
        div = page.locator(".gi-divisore-maniglia").first
        if div.count():
            b = div.bounding_box()
            u.trascina((b["x"] + b["width"] / 2, b["y"] + b["height"] / 2), (b["x"] + b["width"] / 2 + 440, b["y"] + b["height"] / 2), durata=1.3)
        u.clic("#gi-swipe", attesa=0.4)

    d("Trascinandola confronti le due epoche.", geo_swipe2)


    def geo_gcp1():
        u.capitolo("Punti di controllo (GCP)", "Geoimage")
        u.clic("#gi-gcp-modo", attesa=0.8)

    d("Per allinearla bene servono i punti di controllo, i GCP. Premo Aggiungi GCP.", geo_gcp1)

    def coppia(i):
        def f():
            px, py, lng, lat = ctx["punti"][i]
            sx, sy = page.evaluate(
                """([px, py]) => { const g = window.dt.geoimage.stato, m = window.dt.map, r = m.getCanvas().getBoundingClientRect();
                const [no, ne, so] = [0, 1, 2].map(i => m.project([g.angoli[i].lng, g.angoli[i].lat]));
                const u = px / g.immagine.larghezza, v = py / g.immagine.altezza;
                return [r.left + no.x + u * (ne.x - no.x) + v * (so.x - no.x), r.top + no.y + u * (ne.y - no.y) + v * (so.y - no.y)]; }""",
                [px, py])
            u.clic(xy=(sx, sy), attesa=0.8)
            x, y = schermo(page, lng, lat)
            u.clic(xy=(x, y), attesa=0.8)
            n = page.evaluate('window.dt.geoimage.stato.gcp.length')
            print(f"      GCP {n}")
            if n < i + 1:  # diagnosi: il punto non è stato registrato
                page.screenshot(path=str(USCITA / f"_gcp_{i + 1}.png"))
                print("      stato:", page.evaluate("document.getElementById('gi-stato')?.textContent.slice(0, 120)"))
        return f

    d("Primo punto: clicco su un luogo riconoscibile della mappa storica, e poi sullo stesso luogo nella mappa di oggi.", coppia(0))
    d("Secondo punto: un altro luogo, ben lontano dal primo.", coppia(1))
    d("E un terzo: ne servono almeno tre, meglio se agli angoli.", coppia(2))

    def geo_allinea():
        u.capitolo("Allineare l'immagine", "Geoimage")
        n = page.evaluate("window.dt.geoimage.stato.gcp.length")
        if n < 3:
            raise RuntimeError(f"servono almeno 3 GCP, ce ne sono {n}")
        u.punta("#gi-tipo")
        u.pausa(0.5)
        u.clic("#gi-allinea", attesa=2.5)

    d("Ora premo Allinea immagine ai GCP: l'app calcola la trasformazione e sposta l'immagine al posto giusto.", geo_allinea)

    d("Guarda: la pianta del milleottocentonovantuno ora combacia con le strade di oggi.", lambda: u.pausa(1.0))

    def geo_errore():
        u.scorri("#geoimage-pannello .gi-corpo", 300, x_y=(1000, 400))
        u.dettaglio("#geoimage-pannello .gi-tabella", fattore=1.8, tieni=6.0)
        u.punta("#geoimage-pannello .gi-tabella")

    d("Nel pannello compare l'errore medio, in metri: più è basso, meglio è. Ogni punto ha il suo residuo, così vedi subito quelli messi male.", geo_errore)

    def geo_export1():
        u.capitolo("Esportare il risultato", "Geoimage")
        u.scorri("#geoimage-pannello .gi-corpo", 900, x_y=(1000, 400))
        u.dettaglio("#gi-kmz", fattore=1.7, tieni=6.0)
        punta_su(["#gi-kmz", "#gi-geotiff", "#gi-qgis"], 1.0)

    d("Alla fine esporti il risultato: un file KMZ per Google Earth, un GeoTIFF, oppure i punti per QGIS.", geo_export1)

    d("Il progetto resta anche nel browser, e al prossimo accesso lo ritrovi.", lambda: u.punta("#gi-json-esporta"))

    def chiusura():
        u.clic("#geoimage-pannello .pannello-chiudi", attesa=0.6)
        u.muovi(800, 450)

    d("E con questo il giro è finito. Il testo completo è nelle schede Guida e Guida Geoimage. Se hai suggerimenti, scrivici. Grazie per essere arrivato fin qui, e buona esplorazione!", chiusura)
    return B


# ---------------------------------------------------------------------------------------------------------------------
# Voce, video, montaggio
# ---------------------------------------------------------------------------------------------------------------------
def durata_file(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True, check=True).stdout
    return float(out.strip())


async def _sintetizza(testi, voce, rate):
    import edge_tts

    CACHE_VOCE.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    percorsi = []

    async def una(t):
        chiave = hashlib.sha1(f"{voce}|{rate}|{t}".encode()).hexdigest()[:16]
        p = CACHE_VOCE / f"{chiave}.mp3"
        percorsi.append(p)
        if p.exists() and p.stat().st_size > 1000:
            return
        async with sem:
            for tentativo in range(4):
                try:
                    await edge_tts.Communicate(t, voce, rate=rate).save(str(p))
                    return
                except Exception:
                    await asyncio.sleep(1.5 * (tentativo + 1))
            raise RuntimeError(f"voce non generata: {t[:50]}")

    await asyncio.gather(*(una(t) for t in testi))
    return [CACHE_VOCE / f"{hashlib.sha1(f'{voce}|{rate}|{t}'.encode()).hexdigest()[:16]}.mp3" for t in testi]


def filtro_zoom(zooms, scarto, W, H, rampa=0.7):
    """Filtro ffmpeg: zoom fluido (smoothstep) sui dettagli, centrato sul punto indicato. Gli zoom che si sovrapporrebbero vengono accorciati."""
    eventi = []
    for t0, t1, cx, cy, z in sorted(zooms):
        t0, t1 = t0 + scarto, t1 + scarto
        if eventi and t0 < eventi[-1][1] + rampa:  # niente sovrapposizioni
            eventi[-1][1] = max(eventi[-1][0] + 1.0, t0 - rampa)
            if t0 < eventi[-1][1] + rampa:
                continue
        eventi.append([t0, t1, cx, cy, z])
    if not eventi:
        return "null"

    def S(u):
        c = f"clip({u},0,1)"
        return f"({c}*{c}*(3-2*{c}))"

    env = [f"({S(f'(t-{t0:.3f})/{rampa}')}-{S(f'(t-{t1:.3f})/{rampa}')})" for t0, t1, *_ in eventi]
    Z = "(1" + "".join(f"+{(z - 1):.3f}*{e}" for (t0, t1, cx, cy, z), e in zip(eventi, env)) + ")"
    peso = "(" + "+".join(env) + ")"
    cxs = "(" + "+".join(f"{cx:.1f}*{e}" for (t0, t1, cx, cy, z), e in zip(eventi, env)) + f"+{W / 2}*(1-{peso}))"
    cys = "(" + "+".join(f"{cy:.1f}*{e}" for (t0, t1, cx, cy, z), e in zip(eventi, env)) + f"+{H / 2}*(1-{peso}))"
    return (f"scale=w='{W}*{Z}':h='{H}*{Z}':eval=frame:flags=bicubic,"
            f"crop={W}:{H}:x='clip({cxs}*{Z}-{W / 2},0,{W}*{Z}-{W})':y='clip({cys}*{Z}-{H / 2},0,{H}*{Z}-{H})'")


def vtt_tempo(s):
    h, r = divmod(s, 3600)
    m, r = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{r:06.3f}"


def spezza(testo, larghezza=46):
    righe, corrente = [], ""
    for parola in testo.split():
        if len(corrente) + len(parola) + 1 > larghezza and corrente:
            righe.append(corrente)
            corrente = parola
        else:
            corrente = f"{corrente} {parola}".strip()
    return righe + [corrente]


def sottotitoli(inizi, durate, testi):
    """VTT: ogni battuta è divisa in frasi, ognuna visibile per una parte della durata proporzionale alla sua lunghezza."""
    out = ["WEBVTT", ""]
    for t0, dur, testo in zip(inizi, durate, testi):
        frasi = [f.strip() for f in re.split(r"(?<=[.!?:])\s+", testo) if f.strip()]
        peso = sum(len(f) for f in frasi) or 1
        t = t0
        for f in frasi:
            d = dur * len(f) / peso
            out += [f"{vtt_tempo(t)} --> {vtt_tempo(t + d)}", "\n".join(spezza(f)), ""]
            t += d
    return "\n".join(out)


def raggiungibile(url):
    try:
        urllib.request.urlopen(url, timeout=3)
        return True
    except urllib.error.HTTPError:
        return True  # il Worker risponde 403 senza origine: c'è
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--voce", default=VOCE)
    ap.add_argument("--velocita", default="+0%", help="velocità della voce (edge-tts rate), «normale» = +0%%")
    ap.add_argument("--prova", action="store_true", help="solo il browser, senza video né voce, con pause ridotte")
    ap.add_argument("--solo-voce", action="store_true", help="genera le voci e stampa la durata totale")
    ap.add_argument("--nome", default="tour_app")
    ap.add_argument("--rimonta", action="store_true", help="rifà solo il montaggio dai tempi salvati in media/tour/_tempi.json (niente registrazione)")
    ap.add_argument("--velocizza", type=float, default=3.0, help="fattore di accelerazione dei tratti in cui la voce ha già finito (1 = nessuno)")
    ap.add_argument("--da", type=int, default=1, help="con --prova: salta le azioni delle battute precedenti (numerate da 1)")
    ap.add_argument("--lento", action="store_true", help="con --prova: pause vere, come nella registrazione")
    args = ap.parse_args()

    from playwright.sync_api import sync_playwright

    if args.rimonta:
        monta(json.loads((USCITA / "_tempi.json").read_text(encoding="utf-8")), USCITA / "_grezzo.webm", args.nome, args.velocizza)
        return

    for url, cosa in ((APP + "/index.html", "l'app (python scripts/serve.py 8000)"), (PROXY + "/", "il Worker RNDT (cd worker && npx wrangler dev --port 8787)")):
        if not raggiungibile(url):
            sys.exit(f"Non raggiungo {cosa}")

    USCITA.mkdir(parents=True, exist_ok=True)
    narrazione = None
    audio = durate = None
    if not args.prova:
        # i testi servono prima del browser per conoscere le durate: una battuta finta basta a estrarli
        class _F:
            def __getattr__(self, n):
                return lambda *a, **k: None

        testi = [t for t, _ in battute({"u": _F(), "page": _F(), "centro_geo": None, "zoom_geo": None, "png": b"", "punti": []})]
        parlati = [per_la_voce(t) for t in testi]
        print(f"{len(testi)} battute, {sum(len(t.split()) for t in testi)} parole: genero la voce ({args.voce})…")
        audio = asyncio.run(_sintetizza(parlati, args.voce, args.velocita))
        durate = [durata_file(p) for p in audio]
        print(f"narrazione: {sum(durate) / 60:.1f} minuti")
        narrazione = testi
        if args.solo_voce:
            return

    with sync_playwright() as p:
        browser = p.chromium.launch(args=ARGS_BROWSER)
        # la pianta del 1891 si cattura prima, fuori dalla registrazione
        print("preparo l'immagine storica di Geoimage…")
        png, punti = _crea_immagine(browser, APP)
        ctx_video = browser.new_context(
            viewport=VIEWPORT, device_scale_factor=1, locale="it-IT",
            **({} if args.prova else {"record_video_dir": str(USCITA / "_tmp"), "record_video_size": VIEWPORT}),
        )
        page = ctx_video.new_page()
        t_creata = time.monotonic()
        page.add_init_script(CURSORE_JS)
        page.on("pageerror", lambda e: print("  [errore pagina]", e))
        page.goto(f"{APP}/index.html?rndt-proxy={PROXY}")
        page.wait_for_function("window.dt && window.dt.pronto === true", timeout=120000)
        page.add_style_tag(content="#avvisi { display: none }")
        u = Umano(page, veloce=args.prova and not args.lento)
        u.base = t_creata
        ctx = {"u": u, "page": page, "png": png, "punti": punti, "centro_geo": [13.3605, 38.1190], "zoom_geo": 15.4}
        scena = battute(ctx)
        if narrazione is None:
            narrazione = [t for t, _ in scena]
        inizi = []
        t_inizio = time.monotonic()
        for i, (testo, fai) in enumerate(scena):
            t0 = time.monotonic()
            inizi.append(t0 - t_creata)
            print(f"[{i + 1:02d}/{len(scena)}] {testo[:70]}…")
            if fai and i + 1 >= args.da:
                try:
                    fai()
                except Exception as e:  # una battuta fallita non ferma il tour: si va avanti e si segnala
                    print(f"   !! azione non riuscita: {str(e).splitlines()[0][:150]}")
                    page.screenshot(path=str(USCITA / f"_errore_{i + 1:02d}.png"))
            if durate:
                resto = durate[i] + 0.15 - (time.monotonic() - t0)
                if resto > 0:
                    time.sleep(resto)
                print(f"       durata {time.monotonic() - t0:5.1f} s (voce {durate[i]:.1f} s)")
        t_fine = time.monotonic()
        time.sleep(1.5)
        video = page.video
        ctx_video.close()
        browser.close()
        if args.prova:
            print(f"prova finita in {t_fine - t_inizio:.0f} s")
            return
        grezzo = Path(video.path())

    # --- tempi salvati: servono a rimontare senza rifare la registrazione (--rimonta) -----------------------------------
    d_video = durata_file(grezzo)
    d_py = (t_fine - t_creata) + 1.5
    scarto = max(0.0, d_video - d_py)
    print(f"video grezzo {d_video:.1f} s, sceneggiatura {d_py:.1f} s, scarto di partenza {scarto:.2f} s")
    stabile = USCITA / "_grezzo.webm"
    stabile.write_bytes(grezzo.read_bytes())
    tempi = {"inizi": [t + scarto for t in inizi], "durate": durate, "testi": narrazione, "audio": [str(a) for a in audio],
             "zooms": [list(z) for z in u.zooms], "scarto": scarto, "d_video": d_video}
    (USCITA / "_tempi.json").write_text(json.dumps(tempi), encoding="utf-8")
    monta(tempi, stabile, args.nome, args.velocizza)


def monta(tempi, grezzo, nome, velocizza=3.0):
    """Montaggio: zoom sui dettagli, tratti «solo gesti» (dopo la voce) accelerati, voce posizionata battuta per battuta, sottotitoli."""
    inizi, durate, testi, audio = tempi["inizi"], tempi["durate"], tempi["testi"], tempi["audio"]
    d_video = tempi["d_video"]
    W, H = VIEWPORT["width"], VIEWPORT["height"]
    zoom = filtro_zoom([tuple(z) for z in tempi["zooms"]], tempi["scarto"], W, H)
    # segmenti del video grezzo: (inizio, fine, fattore). Dopo la frase il cursore può ancora lavorare: quel tratto va più veloce.
    seg, nuovi = [], []  # nuovi[i] = istante della battuta i nel video montato
    t_nuovo = 0.0
    if inizi[0] > 0.05:
        seg.append((0.0, inizi[0], 1.0))
        t_nuovo += inizi[0]
    finale = ROOT / "media" / "guida" / "schermata-finale.png"
    for i, t0 in enumerate(inizi):
        fine = inizi[i + 1] if i + 1 < len(inizi) else d_video
        if i == len(inizi) - 1 and finale.exists():
            # i saluti si dicono sulla schermata finale: del video resta solo il gesto di chiusura
            seg.append((t0, min(fine, t0 + 1.8), 1.0))
            t_nuovo += min(fine, t0 + 1.8) - t0
            nuovi.append(t_nuovo)
            durata_img = durate[i] + 1.8
            t_nuovo += durata_img
            break
        parlato = min(fine, t0 + durate[i] + 0.15)
        nuovi.append(t_nuovo)
        seg.append((t0, parlato, 1.0))
        t_nuovo += parlato - t0
        extra = fine - parlato
        if extra > 1.2 and velocizza > 1:
            lunghezza_nuova = max(0.6, extra / velocizza)
            seg.append((parlato, fine, extra / lunghezza_nuova))
            t_nuovo += lunghezza_nuova
        elif extra > 0.02:
            seg.append((parlato, fine, 1.0))
            t_nuovo += extra
    n = len(seg)
    filtri = [f"[0:v]{zoom},split={n}" + "".join(f"[z{k}]" for k in range(n))]
    for k, (a, b, f) in enumerate(seg):
        filtri.append(f"[z{k}]trim=start={a:.3f}:end={b:.3f},setpts=(PTS-STARTPTS)/{f:.4f}[s{k}]")
    if finale.exists():
        k_img = len(audio) + 1  # l'immagine è l'ultimo ingresso, dopo il video e le voci
        filtri.append("".join(f"[s{k}]" for k in range(n)) + f"concat=n={n}:v=1:a=0,format=yuv420p,fps=25[vc]")
        filtri.append(f"[{k_img}:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,fps=25,fade=t=in:st=0:d=0.6[img]")
        filtri.append("[vc][img]concat=n=2:v=1:a=0[v]")
    else:
        filtri.append("".join(f"[s{k}]" for k in range(n)) + f"concat=n={n}:v=1:a=0[v]")
    filtri += [f"[{i + 1}:a]adelay={int(t * 1000)}|{int(t * 1000)},apad[a{i}]" for i, t in enumerate(nuovi)]
    filtri.append("".join(f"[a{i}]" for i in range(len(audio))) + f"amix=inputs={len(audio)}:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5[a]")
    script = USCITA / "_filtri.txt"
    script.write_text(";\n".join(filtri), encoding="utf-8")
    out = USCITA / f"{nome}.mp4"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(grezzo)]
    for a in audio:
        cmd += ["-i", str(a)]
    if finale.exists():
        cmd += ["-loop", "1", "-t", f"{durata_img:.2f}", "-i", str(finale)]
    cmd += ["-filter_complex_script", str(script), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-maxrate", "2200k",
            "-bufsize", "4400k", "-pix_fmt", "yuv420p", "-r", "25", "-c:a", "aac", "-b:a", "160k", "-t", f"{t_nuovo + 0.5:.2f}", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)
    (USCITA / f"{nome}.vtt").write_text(sottotitoli(nuovi, durate, testi), encoding="utf-8")
    (USCITA / f"{nome}.txt").write_text("\n\n".join(testi) + "\n", encoding="utf-8")
    print(f"fatto: {out} ({durata_file(out) / 60:.1f} minuti)")

if __name__ == "__main__":
    main()

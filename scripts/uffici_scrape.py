"""Scarica gli uffici del Comune di Palermo (elenco + schede) in dati/uffici/grezzo.json.

Uso: python3 scripts/uffici_scrape.py
Cache HTML in .cache_uffici/ (git-ignore) per poter rilanciare senza riscaricare.
"""
import hashlib
import html
import json
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE = "https://www.comune.palermo.it"
ELENCO = BASE + "/amministrazione/uffici/"
OUT = Path(__file__).resolve().parent.parent / "dati" / "uffici"
CACHE = OUT / ".cache"
UA = {"User-Agent": "Mozilla/5.0 (DigitalTwinPalermo research)"}


def get(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (hashlib.md5(url.encode()).hexdigest() + ".html")
    if f.exists():
        return f.read_text(encoding="utf8")
    for tent in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=40) as r:
                t = r.read().decode("utf8", "ignore")
            f.write_text(t, encoding="utf8")
            time.sleep(0.2)
            return t
        except Exception as e:  # noqa: BLE001
            print("retry", url, e, file=sys.stderr)
            time.sleep(2 * (tent + 1))
    return ""


def testo(s):
    s = re.sub(r"<br\s*/?>|</p>|</div>|</li>", "\n", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s).replace("\xa0", " ")
    return "\n".join(re.sub(r"[ \t]+", " ", l).strip() for l in s.split("\n") if l.strip())


def sezione(t, sid):
    m = re.search(r'<section id="%s".*?</section>' % sid, t, re.S)
    return m.group(0) if m else ""


def elenco_link():
    visti = {}
    p = 1
    while True:
        url = ELENCO if p == 1 else f"{ELENCO}?paged={p}"
        t = get(url)
        trovati = re.findall(r'href="(https://www\.comune\.palermo\.it/amministrazione/unita_organizzativa/[^"]+)"', t)
        nuovi = [u for u in dict.fromkeys(trovati) if u not in visti]
        # le sezioni "Contenuti correlati" ripetono gli stessi link in ogni pagina: li filtra il set
        if not nuovi:
            break
        for u in nuovi:
            visti[u] = p
        p += 1
        if p > 40:
            break
    return list(visti)


def parse(url):
    t = get(url)
    d = {"url": url}
    m = re.search(r"<h1[^>]*>(.*?)</h1>", t, re.S)
    d["nome"] = testo(m.group(1)) if m else ""
    d["competenze"] = testo(sezione(t, "competenze").split("</h3>", 1)[-1])
    d["tipologia"] = testo(sezione(t, "tipo-uo").split("</h3>", 1)[-1])
    a = sezione(t, "area")
    d["dipende_da"] = [{"nome": testo(n), "url": u} for u, n in re.findall(r'<a[^>]*href="([^"]+)"[^>]*data-element="service-area"[^>]*>(.*?)</a>', a, re.S)]
    r = sezione(t, "responsabile")
    d["responsabili"] = []
    for blocco in re.findall(r'<h4><a[^>]*href="([^"]+)"[^>]*>(.*?)</a></h4>(.*?)</div>', r, re.S):
        d["responsabili"].append({"nome": testo(blocco[1]), "url": blocco[0], "ruolo": testo(blocco[2])})
    p = sezione(t, "persone")
    d["persone"] = [{"nome": testo(n), "url": u} for u, n in re.findall(r'<a[^>]*href="(https://www\.comune\.palermo\.it/persona_pubblica/[^"]+)"[^>]*>(.*?)</a>', p, re.S)]
    s = sezione(t, "sede-principale")
    sedi = []
    for u, n, rest in re.findall(r'<h6>\s*<a href="([^"]+)">(.*?)</a>\s*</h6>(.*?)</div>', s, re.S):
        sedi.append({"nome": testo(n), "url": u, "indirizzo": testo(rest)})
    d["sedi"] = sedi
    c = sezione(t, "contatti")
    d["contatti"] = []
    for h, corpo in re.findall(r"<h6>(.*?)</h6>\s*<div class=\"card-text\">(.*?)</div>\s*</div>", c, re.S):
        tx = testo(corpo)
        d["contatti"].append({
            "titolo": testo(h),
            "indirizzo": next((l.split(":", 1)[1].strip() for l in tx.split("\n") if l.lower().startswith("indirizzo")), ""),
            "telefoni": re.findall(r"T:\s*([\d +/.-]+)", tx),
            "email": re.findall(r"mailto:([^\"]+)", corpo),
            "testo": tx,
        })
    # altri tipi di contatto (telefono/mail fuori dal blocco standard)
    m = re.search(r"Pagina aggiornata il:.*?>(\d\d/\d\d/\d{4})<", t, re.S)
    d["aggiornata"] = m.group(1) if m else ""
    return d


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    links = elenco_link()
    print(len(links), "schede")
    with ThreadPoolExecutor(6) as ex:
        voci = list(ex.map(parse, links))
    (OUT / "grezzo.json").write_text(json.dumps(voci, ensure_ascii=False, indent=1), encoding="utf8")
    print("scritto", len(voci))

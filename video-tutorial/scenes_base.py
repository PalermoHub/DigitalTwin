"""Base condivisa delle scene: registro, costanti, percorsi."""
import json, os, sys, time, re
import storyboard as sb
import rec_lib
from rec_lib import Rec, URL, K, FAST, HERE

OUT = os.path.join(HERE, "out")
os.makedirs(f"{OUT}/shots", exist_ok=True)
DUR = json.load(open(os.path.join(HERE, "audio/durate.json")))
EXTRA = {s["id"]: s["extra"] for s in sb.S}
ORDINE = [s["id"] for s in sb.S]

MAQUEDA = (13.3586, 38.1203)
CENTRO = (13.3615, 38.1157)
TEATRO = (13.3571944, 38.1201711)
PALAGONIA = (13.370036, 38.1167363)

SCENE = {}
def sc(sid):
    def deco(f):
        SCENE[sid] = f
        return f
    return deco

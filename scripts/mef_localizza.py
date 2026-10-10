"""Localizzazione dei beni MEF a tre livelli: catasto, layer già mappati, posizione."""
import hashlib
from dataclasses import dataclass

from shapely.ops import unary_union
from shapely.strtree import STRtree

from mef_catasto import indirizzi_compatibili, indirizzo_normalizzato, particelle_da_identificativo
from mef_geo import SOGLIA_M, aggancia_uno, in_metri, punto_m

RAGGIO_LAYER = 60.0       # immobili comunali, scuole, seggi, uffici: indirizzo compatibile entro 60 m
RAGGIO_MONUMENTI = 30.0   # monumenti (senza indirizzo): solo tipologie culturali, entro 30 m
SOGLIA_DENTRO = 0.5       # un edificio è «dentro» una particella se almeno metà della sua area la copre
CULTURALI = ("museo", "biblioteca", "teatro", "culto", "monument", "castell", "archeolog")


@dataclass
class Loc:
    chiave: str            # identifica il poligono: e<id>, t<foglio>-<part>[+…], x<fonte>-<id>, i<fid>
    geom: object           # geometria WGS84 (None per i punti)
    forma: str             # edificio | terreno | punto
    fonte: str             # catasto | immobili-comunali | scuole | seggi | uffici | monumenti | posizione
    verifica: str          # concorde | corretto | non verificabile
    motivo: str | None = None   # solo per i punti: terreno, strada, comune, senza-edificio


@dataclass
class Rif:
    fonte: str
    id: str
    punto: object          # Point WGS84
    indirizzo: str = ""
    poligono: object = None   # geometria WGS84 o None


def _albero(geometrie):
    return STRtree(geometrie) if geometrie else None


class Contesto:
    """Tutte le fonti, già in metri locali e con gli alberi spaziali pronti."""

    def __init__(self, edifici_wgs: dict, particelle_wgs: dict, immobili: list, riferimenti: list):
        self.edifici_wgs = edifici_wgs
        self.ids = list(edifici_wgs)
        self.pos = {i: k for k, i in enumerate(self.ids)}
        self.geoms = [in_metri(edifici_wgs[i]) for i in self.ids]
        self.albero = _albero(self.geoms)
        self.particelle_wgs = particelle_wgs
        self.particelle_m = {k: in_metri(g) for k, g in particelle_wgs.items()}
        per_chiave = {}
        for im in immobili:
            if im["chiave"]:
                per_chiave.setdefault(im["chiave"], []).append(im["geom"])
        self.immobili_wgs = {k: unary_union(v) for k, v in per_chiave.items()}
        self.immobili_m = {k: in_metri(g) for k, g in self.immobili_wgs.items()}
        self.immobili = [{**im, "geom_m": in_metri(im["geom"])} for im in immobili if im.get("indirizzo")]
        self.albero_imm = _albero([im["geom_m"] for im in self.immobili])
        self.compendi = {}
        self.compendi_edifici = {}   # chiave del compendio -> edifici nel gruppo, uguali per tutti i beni
        self.riferimenti = [(r, punto_m(r.punto.x, r.punto.y), in_metri(r.poligono) if r.poligono is not None else None)
                            for r in riferimenti]
        self.albero_rif = _albero([gm if gm is not None else pm for _, pm, gm in self.riferimenti])


# --- aiuti ------------------------------------------------------------------

def _edifici_nell_area(ctx: Contesto, area_m) -> list:
    """[(id, area)] degli edifici coperti per almeno SOGLIA_DENTRO dall'area."""
    if ctx.albero is None:
        return []
    out = []
    for k in ctx.albero.query(area_m, predicate="intersects"):
        g = ctx.geoms[int(k)]
        if g.area > 0 and g.intersection(area_m).area / g.area >= SOGLIA_DENTRO:
            out.append((ctx.ids[int(k)], g.area))
    return out


def _piu_grande(candidati):
    return max(candidati, key=lambda c: c[1])[0] if candidati else None


def _edificio_vicino(ctx: Contesto, p, raggio: float = SOGLIA_M):
    """Id dell'edificio più grande che contiene il punto o ne dista al più `raggio`."""
    if ctx.albero is None:
        return None
    return _piu_grande([(ctx.ids[int(k)], ctx.geoms[int(k)].area) for k in ctx.albero.query(p.buffer(raggio), predicate="intersects")])


def _verifica(poligono_m, p) -> str:
    """«concorde» se il punto MEF non contraddice l'area che ha determinato la localizzazione (entro SOGLIA_M)."""
    return "concorde" if poligono_m.distance(p) <= SOGLIA_M else "corretto"


def _chiave_terreno(chiavi) -> str:
    return "t" + "+".join(f"{f}-{p}" for f, p in sorted(chiavi))


MAX_COMPENDIO_M2 = 250_000.0   # oltre, un «compendio» è quasi certamente un accorpamento improprio: si tiene la sola area dichiarata


def _compendio(ctx: Contesto, area_m, area_wgs):
    """Il bene può essere una parte di un immobile comunale più esteso (più particelle e più edifici).

    Parte dagli immobili comunali che coprono almeno metà dell'area dichiarata e aggiunge quelli contigui con lo
    stesso indirizzo. Ritorna (area in metri, area WGS84, id del compendio, gruppo in metri) oppure
    (area_m, area_wgs, None, None)."""
    if ctx.albero_imm is None:
        return area_m, area_wgs, None, None
    imm = ctx.immobili
    semi = [int(k) for k in ctx.albero_imm.query(area_m, predicate="intersects")
            if imm[int(k)]["geom_m"].intersection(area_m).area >= 0.5 * area_m.area]
    if not semi:
        return area_m, area_wgs, None, None
    chiave = tuple(sorted(semi))
    if chiave not in ctx.compendi:   # molti beni cadono nello stesso compendio: si calcola una volta
        gruppo, coda = set(semi), list(semi)
        while coda:
            k = coda.pop()
            via = indirizzo_normalizzato(imm[k]["indirizzo"])
            if not via[0]:
                continue
            for j in ctx.albero_imm.query(imm[k]["geom_m"].buffer(1.0), predicate="intersects"):
                j = int(j)
                if j not in gruppo and indirizzo_normalizzato(imm[j]["indirizzo"]) == via:
                    gruppo.add(j)
                    coda.append(j)
        ctx.compendi[chiave] = (unary_union([imm[k]["geom_m"] for k in gruppo]), unary_union([imm[k]["geom"] for k in gruppo]),
                                min(imm[k]["id"] for k in gruppo))
    gruppo_m, gruppo_wgs, id_compendio = ctx.compendi[chiave]
    unione_m = gruppo_m if gruppo_m.covers(area_m) else gruppo_m.union(area_m)
    if unione_m.area > MAX_COMPENDIO_M2:
        return area_m, area_wgs, None, None
    return unione_m, (gruppo_wgs if unione_m is gruppo_m else gruppo_wgs.union(area_wgs)), (id_compendio, chiave), gruppo_m


def _da_area(b: dict, ctx: Contesto, area_m, area_wgs, chiave_terreno: str, fonte: str, compendio: bool = False):
    """Terreno: l'area stessa. Fabbricato: l'edificio più grande dentro l'area (None se non ce ne sono).
    Con `compendio` l'area si estende all'immobile comunale che la contiene: il terreno prende tutte le sue
    particelle, il fabbricato tutti gli edifici (un edificio può essere fatto di più poligoni)."""
    p = punto_m(b["lon"], b["lat"])
    esteso = gruppo_m = None
    if compendio:
        area_m, area_wgs, esteso, gruppo_m = _compendio(ctx, area_m, area_wgs)
    if b["natura"] == "Terreno":
        if esteso is None:
            chiave = chiave_terreno
        elif area_m is gruppo_m:
            chiave = f"i{esteso[0]}"
        else:   # l'area dichiarata esce dal gruppo: stessa chiave solo se è la stessa area
            chiave = f"i{esteso[0]}-" + hashlib.md5(chiave_terreno.encode()).hexdigest()[:6]
        return Loc(chiave, area_wgs, "terreno", fonte, _verifica(area_m, p))
    if esteso is not None:   # gli edifici del compendio sono gli stessi per tutti i beni che vi cadono
        if esteso[1] not in ctx.compendi_edifici:
            ctx.compendi_edifici[esteso[1]] = _edifici_nell_area(ctx, gruppo_m)
        dentro = ctx.compendi_edifici[esteso[1]] or _edifici_nell_area(ctx, area_m)
    else:
        dentro = _edifici_nell_area(ctx, area_m)
    if not dentro:
        return None
    if esteso is not None and len(dentro) > 1:
        ids = sorted(i for i, _ in dentro)
        geom = unary_union([ctx.edifici_wgs[i] for i in ids])
        return Loc(f"m{ids[0]}+{len(ids)}", geom, "edificio", fonte, _verifica(area_m, p))
    i = _piu_grande(dentro)
    return Loc(f"e{i}", ctx.edifici_wgs[i], "edificio", fonte, _verifica(area_m, p))


def _livello_chiavi(b: dict, ctx: Contesto, in_m: dict, in_wgs: dict, fonte: str):
    chiavi = [k for k in particelle_da_identificativo(b.get("catastale", ""), b["natura"]) if k in in_m]
    if not chiavi:
        return None
    return _da_area(b, ctx, unary_union([in_m[k] for k in chiavi]), unary_union([in_wgs[k] for k in chiavi]),
                    _chiave_terreno(chiavi), fonte, compendio=True)


# --- livello 1: catasto ----------------------------------------------------

def livello_catasto(b: dict, ctx: Contesto):
    return _livello_chiavi(b, ctx, ctx.particelle_m, ctx.particelle_wgs, "catasto")


# --- livello 2: layer già mappati ------------------------------------------

def tipologia_culturale(tipologia: str) -> bool:
    t = (tipologia or "").lower()
    return any(parola in t for parola in CULTURALI)


def livello_immobili(b: dict, ctx: Contesto):
    """Immobili comunali: stessa particella (chiave) oppure indirizzo compatibile entro 60 m."""
    loc = _livello_chiavi(b, ctx, ctx.immobili_m, ctx.immobili_wgs, "immobili-comunali")
    if loc or ctx.albero_imm is None:
        return loc
    p = punto_m(b["lon"], b["lat"])
    vicini = sorted((ctx.immobili[int(k)]["geom_m"].distance(p), int(k))
                    for k in ctx.albero_imm.query(p.buffer(RAGGIO_LAYER), predicate="intersects"))
    for _, k in vicini:
        im = ctx.immobili[k]
        if not indirizzi_compatibili(b.get("indirizzo", ""), im["indirizzo"]):
            continue
        loc = _da_area(b, ctx, im["geom_m"], im["geom"], f"o{im['id']}", "immobili-comunali", compendio=True)
        if loc:
            return loc
    return None


def _poligono_riferimento(b: dict, ctx: Contesto, p, k: int):
    r, pm, gm = ctx.riferimenti[k]
    if gm is not None:   # scuole e seggi: la parte più grande del loro poligono
        parti_m = list(gm.geoms) if hasattr(gm, "geoms") else [gm]
        parti_w = list(r.poligono.geoms) if hasattr(r.poligono, "geoms") else [r.poligono]
        j = max(range(len(parti_m)), key=lambda n: parti_m[n].area)
        return Loc(f"x{r.fonte}-{r.id}", parti_w[j], "edificio", r.fonte, _verifica(gm, p))
    i = _edificio_vicino(ctx, pm)   # uffici e monumenti: solo il punto, poi l'edificio più grande lì vicino
    if i is None:
        return None
    return Loc(f"e{i}", ctx.edifici_wgs[i], "edificio", r.fonte, _verifica(ctx.geoms[ctx.pos[i]], p))


def livello_riferimenti(b: dict, ctx: Contesto):
    """Scuole, seggi, uffici (indirizzo compatibile entro 60 m) e monumenti (tipologia culturale entro 30 m)."""
    if ctx.albero_rif is None:
        return None
    p = punto_m(b["lon"], b["lat"])
    candidati = []
    for k in ctx.albero_rif.query(p.buffer(RAGGIO_LAYER), predicate="intersects"):
        r, pm, gm = ctx.riferimenti[int(k)]
        d = p.distance(gm if gm is not None else pm)
        if r.fonte == "monumenti":
            if d > RAGGIO_MONUMENTI or not tipologia_culturale(b.get("tipologia", "")):
                continue
        elif d > RAGGIO_LAYER or not indirizzi_compatibili(b.get("indirizzo", ""), r.indirizzo):
            continue
        candidati.append((d, int(k)))
    for _, k in sorted(candidati):
        loc = _poligono_riferimento(b, ctx, p, k)
        if loc:
            return loc
    return None


# --- livello 3: posizione e orchestrazione ----------------------------------

def livello_posizione(b: dict, ctx: Contesto) -> Loc:
    """Come nella prima versione: il poligono che contiene il punto, o il più vicino entro 15 m; altrimenti un punto."""
    i, motivo = aggancia_uno(b, ctx.ids, ctx.geoms, ctx.albero)
    if i is None:
        return Loc("", None, "punto", "posizione", "non verificabile", motivo)
    return Loc(f"e{i}", ctx.edifici_wgs[i], "edificio", "posizione", "non verificabile")


LIVELLI = (livello_catasto, livello_immobili, livello_riferimenti, livello_posizione)


def localizza(b: dict, ctx: Contesto) -> Loc:
    for livello in LIVELLI:
        loc = livello(b, ctx)
        if loc:
            return loc
    raise AssertionError("livello_posizione risponde sempre")


def localizza_tutti(beni, ctx: Contesto) -> dict:
    return {b["id"]: localizza(b, ctx) for b in beni}

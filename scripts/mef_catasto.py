"""Identificativo catastale e indirizzi dei beni MEF (funzioni pure, senza geometria)."""
import re
import unicodedata

COMUNE = "G273"

_TIPI = {"via", "viale", "piazza", "piazzale", "piazzetta", "corso", "largo", "vicolo", "salita", "discesa", "strada",
         "contrada", "lungomare", "traversa", "cortile", "passaggio", "vle", "c"}
_ARTICOLI = {"di", "del", "della", "dei", "delle", "dell", "degli", "d", "la", "le", "il", "lo", "l", "e", "dello", "dallo", "da", "dal"}
_ALTRE = {"palermo", "pa", "italia", "snc", "sn", "s"}
_STOP = _TIPI | _ARTICOLI | _ALTRE


def chiave(foglio, particella) -> tuple[str, str] | None:
    """(foglio, particella) come stringhe senza zeri iniziali; None se manca una delle due."""
    f, p = str(foglio or "").strip().lstrip("0"), str(particella or "").strip().lstrip("0")
    return (f, p) if f and p else None


def particelle_da_identificativo(testo, natura: str, comune: str = COMUNE) -> list:
    """Particelle di un «Identificativo catastale» MEF.

    Fabbricati: comune:sez:sezurb:FOGLIO:PARTICELLA:den:sub (indici 3 e 4).
    Terreni:    comune:sez:FOGLIO:PARTICELLA (indici 2 e 3).
    Più particelle sono separate da «;»; i subalterni della stessa particella contano una volta.
    """
    i, j = (2, 3) if natura == "Terreno" else (3, 4)
    out = []
    for blocco in (testo or "").split(";"):
        campi = blocco.strip().split(":")
        if len(campi) <= j or campi[0].strip() != comune:
            continue
        k = chiave(campi[i], campi[j])
        if k and k not in out:
            out.append(k)
    return out


def indirizzo_normalizzato(testo) -> tuple[frozenset, str]:
    """(parole significative della via, civico). Civico «» se assente."""
    s = unicodedata.normalize("NFD", (testo or "").replace("’", "'")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b\d{5}\b", " ", s)           # CAP
    s = re.sub(r"[.,;'`]", " ", s)
    via, civico = [], ""
    for w in s.split():
        if re.match(r"\d", w):
            civico = re.match(r"\d+", w).group()
            break
        if w not in _STOP:
            via.append(w)
    return frozenset(via), civico


def indirizzi_compatibili(a, b) -> bool:
    """Stessa via (una può contenere l'altra: «Via Garibaldi» ~ «Via Giuseppe Garibaldi») e stesso civico se ci sono entrambi."""
    va, ca = indirizzo_normalizzato(a)
    vb, cb = indirizzo_normalizzato(b)
    if not va or not vb or not (va <= vb or vb <= va):
        return False
    return not (ca and cb) or ca == cb

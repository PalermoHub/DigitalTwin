"""Ex Noviziato dei Crociferi (Foro Umberto I 14 / Cortile Crociferi): dal DWG delle piante al modello 3D georeferenziato.

  python3 scripts/edificio/crociferi.py                 legge dati/edificio/Noviziato*.dwg con dwgread (LibreDWG)
  python3 scripts/edificio/crociferi.py --json F.json   legge il JSON già esportato con `dwgread -O JSON -o F.json F.dwg`
  python3 scripts/edificio/crociferi.py --glb DEST.glb  scrive anche il modello come mesh GLB (non pubblicato: resta fuori da git)

Scrive in dati/edificio/crociferi/
  crociferi.geojson  muri, aperture, solai, stanze, coperture e cupola per piano (WGS84, quote in metri da terra)
  contesto.geojson   le unità volumetriche CTC attorno, senza quelle del Noviziato (per estruderle grigie nella vista)
  prospetti.json     le facciate: spigoli (lon, lat), altezza e immagine prospetti/<lato>.webp (le linee del prospetto)

Come funziona
1. Le sei tavole del DWG (terra, ammezzato, primo, secondo, terzo, copertura) stanno affiancate nello spazio modello:
   ogni piano si ritaglia con la sua cornice (CORNICI, in centimetri disegno).
2. Le murature sono i retini del layer «murature retini». Ogni piano si allinea al primo per correlazione delle murature
   rasterizzate (traslazione e piccola rotazione).
3. Il primo piano si porta in UTM 33N facendo coincidere il vano ottagonale della cupola con l'ottagono delle unità
   volumetriche CTC del Comune (ctc_riferimento.geojson) e cercando la rotazione che meglio ricalca i loro bordi;
   la scala resta quella del rilievo (1 unità = 1 cm).
4. Stanze = impronta del piano meno le murature con i varchi chiusi; i varchi diventano architravi (e davanzali se
   danno sull'esterno). Dei testi restano solo i numeri delle stanze: nomi del personale, scrivanie e destinazioni no.
5. Le quote non sono nel DWG: le proporzioni vengono dalla sezione img/sezione.jpg (cupola e ala sud), che i prospetti
   confermano entro il 2-3%; la scala assoluta è fissata dalla gronda CTC, 21,6 m sopra la strada, con il pavimento del
   piano terra ~1,2 m sopra la strada (dalla sezione): 0,068 m/px. Le altre stime della scala (larghezze delle stanze
   e dell'edificio sulla pianta, prospetti) danno gronde tra 20,1 e 22,8 m: le quote assolute valgono ±1 m circa.
6. Facciate: i prospetti (img/nov_crocif_01-03) in scala con la pianta, solo le linee, sul filo esterno dei muri.
"""
import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from pyproj import Transformer
from scipy.optimize import minimize
from scipy.signal import fftconvolve
from shapely import affinity, make_valid, set_precision
from shapely.geometry import Point, Polygon, shape
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dwg_json import DisegnoDWG  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'dati' / 'edificio'
OUT = SRC / 'crociferi'

# Cornici delle tavole nello spazio modello (cm): xmin, ymin, xmax, ymax
CORNICI = {
    'terra': (8000, 14100, 14800, 18200),
    'ammezzato': (1000, 9700, 7600, 13900),
    'primo': (8000, 9700, 14800, 13900),
    'secondo': (1000, 5300, 7600, 9500),
    'terzo': (8000, 5300, 14800, 9500),
}
RIFERIMENTO = 'primo'

# Quote (m dal pavimento del piano terra) dalla sezione img/sezione.jpg a 0,068 m/px; tra parentesi la riga di pixel
# (pavimento del piano terra a 528, strada a 545). quota = piano di calpestio, cielo = estradosso del solaio sopra
PIANI = [
    {'id': 'terra', 'nome': 'Piano terra', 'livello': 0, 'quota': 0.0, 'cielo': 6.3},
    {'id': 'ammezzato', 'nome': 'Ammezzato', 'livello': 1, 'quota': 2.8, 'cielo': 6.3},     # 487
    {'id': 'primo', 'nome': 'Piano primo', 'livello': 2, 'quota': 6.3, 'cielo': 11.8},      # 436
    {'id': 'secondo', 'nome': 'Piano secondo', 'livello': 3, 'quota': 11.8, 'cielo': 17.3}, # 355
    {'id': 'terzo', 'nome': 'Piano terzo', 'livello': 4, 'quota': 17.3, 'cielo': 20.4},     # 274, soffitto 228
]
# gronda (228), colmo (183), muro esterno del tamburo (200), estradosso della cupola (117), cima della lanterna (62)
COPERTURA = {'id': 'copertura', 'nome': 'Copertura', 'livello': 5, 'gronda': 20.4, 'colmo': 23.5,
             'tamburo': 22.3, 'cupola': 27.9, 'lanterna': 31.7}
# Prospetti (img/) applicati come texture alle facce esterne nel GLB: riquadro in pixel della facciata (x sinistra-destra,
# y cima-terra) e lato della pianta. Le estremità dei lati sono i fili esterni del piano di riferimento (cm disegno).
# La scala verticale è la stessa dell'orizzontale (larghezza in pianta / larghezza in pixel); il bianco è trasparente.
FILI = {'ovest': 10178, 'est': 14236, 'sud': 10174, 'nord': 13120}
FACCIATE = [
    {'lato': 'sud', 'img': 'nov_crocif_02.jpg', 'x': (15, 690), 'y': (236, 593)},     # lungo, 9 campate
    {'lato': 'ovest', 'img': 'nov_crocif_01.JPG', 'x': (35, 495), 'y': (190, 570)},   # su via Torremuzza, fronte della chiesa
    {'lato': 'est', 'img': 'nov_crocif_03.jpg', 'x': (68, 552), 'y': (205, 530)},     # con i balconi, sul giardino
]
RISOLUZIONE = 3  # pixel della texture per pixel del prospetto
SOLAIO = 0.30          # spessore dei solai (m)
MURO_GIARDINO = 3.0    # altezza dei muri di recinzione fuori dalle unità CTC (m)
CHIUSURA = 75          # semiampiezza (cm) con cui si chiudono i varchi delle murature
STANZA_MIN = 1.0       # m²: sotto, il pezzo è un residuo della chiusura

LAYER_MURI = 'murature retini'
# i numeri piccoli stanno al centro della stanza; i grandi (spostati di ~2,5 m) servono solo dove mancano i piccoli
LAYER_NUMERI = ('testi numero stanza', 'testi numero stanza grande')
LAYER_AREE = 'retini e perimetri aree'  # perimetri disegnati delle stanze assegnate: dove ci sono, valgono più delle facce
LAYER_LUOGHI = 'testi'  # usato solo per riconoscere la chiesa (che sopra il piano terra è un vuoto), non esportato
CHIESA = 'Chiesa Di S. Mattia'  # etichetta nel DWG
NOME_CHIESA = 'Ex Chiesa di San Mattia dei Crociferi'  # il corpo della chiesa al piano terra: aula, servizi, magazzini

UTM = Transformer.from_crs(32633, 4326, always_xy=True)
A_UTM = Transformer.from_crs(4326, 32633, always_xy=True)


def leggi_disegno(args):
    if args.json:
        return DisegnoDWG(args.json)
    dwg = next(SRC.glob('Noviziato*.dwg'))
    exe = shutil.which('dwgread')
    if not exe:
        sys.exit('Serve dwgread (LibreDWG ≥ 0.13) nel PATH, oppure --json con l\'export già fatto.')
    with tempfile.TemporaryDirectory() as t:
        out = Path(t) / 'disegno.json'
        subprocess.run([exe, '-O', 'JSON', '-o', str(out), str(dwg)], check=True, capture_output=True)
        return DisegnoDWG(out)


def dentro(anelli, c):
    return all(a[:, 0].min() >= c[0] and a[:, 0].max() <= c[2] and a[:, 1].min() >= c[1] and a[:, 1].max() <= c[3]
               for a in anelli)


def poligono_retino(anelli):
    """Anelli di un retino -> poligono con regola pari-dispari (i fori sono anelli interni)."""
    g = Polygon()
    for a in anelli:
        g = g.symmetric_difference(Polygon(a).buffer(0))
    return g


def poligoni(g):
    if g.is_empty:
        return []
    return [p for p in getattr(g, 'geoms', [g]) if p.geom_type == 'Polygon' and not p.is_empty]


# --- allineamento dei piani al piano di riferimento -----------------------------------------------------------------

def _raster(geom, org, n, passo):
    im = Image.new('L', (n, n), 0)
    dr = ImageDraw.Draw(im)
    for p in poligoni(geom):
        dr.polygon([((x - org[0]) / passo, (n - 1) - (y - org[1]) / passo) for x, y in p.exterior.coords], fill=1)
        for r in p.interiors:
            dr.polygon([((x - org[0]) / passo, (n - 1) - (y - org[1]) / passo) for x, y in r.coords], fill=0)
    return np.asarray(im, float)


def allinea(muri, rif, passo=10.0):
    """Rotazione (gradi, attorno al baricentro) e traslazione che portano `muri` su `rif`: correlazione dei raster."""
    cr = np.array(rif.centroid.coords[0])
    cm = np.array(muri.centroid.coords[0])
    lato = max(rif.bounds[2] - rif.bounds[0], rif.bounds[3] - rif.bounds[1]) + 1000
    n = int(lato / passo)
    org = cr - lato / 2
    R = _raster(rif, org, n, passo)
    meglio = None
    for ang in np.arange(-3, 3.01, 0.25):
        m = affinity.translate(affinity.rotate(muri, ang, origin=tuple(cm)), *(cr - cm))
        cc = fftconvolve(R, _raster(m, org, n, passo)[::-1, ::-1], mode='same')
        i = np.unravel_index(cc.argmax(), cc.shape)
        if meglio is None or cc[i] > meglio[0]:
            meglio = (cc[i], ang, i)
    _, ang, (iy, ix) = meglio
    dx, dy = (ix - n // 2) * passo, -(iy - n // 2) * passo
    t = cr - cm + np.array([dx, dy])
    return lambda g: affinity.translate(affinity.rotate(g, ang, origin=tuple(cm)), *t), ang, t


# --- georeferenziazione ---------------------------------------------------------------------------------------------

def carica_ctc():
    g = json.load(open(OUT / 'ctc_riferimento.geojson'))
    out = []
    for f in g['features']:
        p = shape(f['geometry'])
        out.append((affinity_utm(p), f['properties']))
    return out


def affinity_utm(p):
    return Polygon([A_UTM.transform(x, y) for x, y in p.exterior.coords])


def georeferenzia(impronta, ottagono, ctc):
    """Similitudine (scala 1:100 fissa, cm -> m) dal piano di riferimento a UTM 33N."""
    ott_ctc = min((q for q, p in ctc if 8 <= len(q.exterior.coords) <= 10 and 100 < q.area < 300),
                  key=lambda q: abs(q.area - ottagono.area / 1e4))
    O = np.array(ott_ctc.centroid.coords[0])
    o = np.array(ottagono.centroid.coords[0])
    Q = [q for q, _ in ctc]
    tutte = unary_union(Q)

    def porta(g, tx, ty, th):
        g = affinity.translate(g, -o[0], -o[1])
        g = affinity.scale(g, 0.01, 0.01, origin=(0, 0))
        g = affinity.rotate(g, th, origin=(0, 0))
        return affinity.translate(g, O[0] + tx, O[1] + ty)

    def scarto(F):
        # ogni unità CTC dovrebbe stare tutta dentro o tutta fuori dall'impronta; l'impronta tutta sopra il CTC
        s = sum(min(a, q.area - a) for q in Q for a in [q.intersection(F).area])
        return s + F.difference(tutte).area

    th0 = min(range(0, 360, 2), key=lambda th: scarto(porta(impronta, 0, 0, th)))
    r = minimize(lambda x: scarto(porta(impronta, *x)), [0, 0, th0], method='Nelder-Mead',
                 options={'xatol': 1e-3, 'fatol': 1e-2,
                          'initial_simplex': [[0, 0, th0], [1, 0, th0], [0, 1, th0], [0, 0, th0 + 2]]})
    tx, ty, th = r.x
    print(f'georeferenziazione: rotazione {th:.2f}°, scarto dal CTC {r.fun:.1f} m² su {impronta.area / 1e4:.0f} m²')
    return lambda g: porta(g, tx, ty, th), th


# --- geometrie per piano --------------------------------------------------------------------------------------------

def chiudi(g, r):
    return g.buffer(r, join_style=2).buffer(-r, join_style=2)


def impronta_di(muri, aree=Polygon(), r=300):
    # 3 m: le grandi aperture sul vuoto della chiesa lasciano rientranze che una chiusura più stretta non riempie
    c = chiudi(unary_union([muri, aree]), r)
    return unary_union([Polygon(p.exterior) for p in poligoni(c)])


def piano(ents, pid):
    c = CORNICI[pid]
    muri = unary_union([poligono_retino(a) for l, k, a in ents if l == LAYER_MURI and k == 'retino' and dentro(a, c)])
    numeri = []
    for layer in LAYER_NUMERI:
        numeri = [(Point(d[0], d[1]), d[2].strip()) for l, k, d in ents
                  if k == 'testo' and l == layer and c[0] < d[0] < c[2] and c[1] < d[1] < c[3] and d[2].strip()]
        if numeri:
            break
    aree = unary_union([poligono_retino(a) for l, k, a in ents if l == LAYER_AREE and k == 'retino' and dentro(a, c)])
    luoghi = [(Point(d[0], d[1]), d[2].strip()) for l, k, d in ents
              if k == 'testo' and l == LAYER_LUOGHI and c[0] < d[0] < c[2] and c[1] < d[1] < c[3]]
    return muri.buffer(0), numeri, luoghi, aree.buffer(0)


def stanze_e_varchi(muri, impronta, aree=Polygon()):
    chiusi = chiudi(muri, CHIUSURA).intersection(impronta)
    disegnate = poligoni(aree.intersection(impronta).difference(muri))
    resto = impronta.difference(chiusi).difference(aree.buffer(20))
    facce = [p for p in disegnate + poligoni(resto) if p.area / 1e4 >= STANZA_MIN]
    varchi = [p for p in poligoni(chiusi.difference(muri)) if 0.05 < p.area / 1e4 < 6]
    return facce, varchi


def corpo_chiesa(impronta, aula, esterni):
    """Il corpo della chiesa al piano terra: l'impronta meno gli spazi scoperti (il passaggio del Cortile Crociferi e il
    giardino) si divide in corpi separati; quello che contiene l'aula è la chiesa con servizi e piccoli magazzini."""
    corpi = poligoni(impronta.difference(unary_union(esterni).buffer(0.6, join_style=2)))
    corpo = max(corpi, key=lambda c: c.intersection(aula).area)
    # le fasce sottili (il muro lungo il lato nord del giardino) non uniscono alla chiesa i vani oltre il giardino
    pezzi = poligoni(corpo.buffer(-1.5, join_style=2).buffer(1.5, join_style=2))
    return max(pezzi, key=lambda c: c.intersection(aula).area).buffer(0.5, join_style=2)


def assegna_numeri(facce, numeri):
    """Ogni numero va alla faccia che lo contiene; se cade su un muro, alla faccia più vicina (entro 1,5 m) ancora senza numero."""
    out = [[] for _ in facce]
    sospesi = []
    for pt, n in numeri:
        i = next((i for i, f in enumerate(facce) if f.contains(pt)), None)
        if i is None:
            sospesi.append((pt, n))
        elif n not in out[i]:
            out[i].append(n)
    for pt, n in sospesi:
        vicine = sorted((bool(out[i]), f.distance(pt), i) for i, f in enumerate(facce) if f.distance(pt) < 1.5)
        if vicine and n not in out[vicine[0][2]]:
            out[vicine[0][2]].append(n)
    return [sorted(x, key=lambda s: (len(s), s)) for x in out]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--json', help='export JSON di dwgread già pronto')
    ap.add_argument('--glb', help='scrive anche il modello GLB in questo percorso (metri, origine al centro della cupola, '
                    'asse Y in alto); il sito non lo pubblica')
    args = ap.parse_args()

    ents = list(leggi_disegno(args).entita())
    dati = {p['id']: piano(ents, p['id']) for p in PIANI}

    # allineamento al piano di riferimento
    rif = dati[RIFERIMENTO][0]
    porta_rif = {}
    for p in PIANI:
        if p['id'] == RIFERIMENTO:
            porta_rif[p['id']] = lambda g: g
            continue
        f, ang, t = allinea(dati[p['id']][0], rif)
        porta_rif[p['id']] = f
        print(f'{p["id"]}: rotazione {ang:+.2f}°, traslazione {t[0]:.0f}, {t[1]:.0f} cm')

    # il vano della cupola: il foro più grande nelle murature del terzo piano
    terzo = porta_rif['terzo'](dati['terzo'][0])
    ottagono = max((Polygon(r) for p in poligoni(terzo) for r in p.interiors), key=lambda p: p.area)

    ctc = carica_ctc()
    porta_utm, rot = georeferenzia(impronta_di(rif, r=150), ottagono, ctc)
    # griglia al millimetro: evita intersezioni quasi coincidenti tra muri, varchi e sagoma CTC

    def a_utm(g):
        g = porta_utm(g)
        return g if g.geom_type == 'Point' else set_precision(make_valid(g).buffer(0), 0.001)
    sagoma = set_precision(unary_union([q for q, _ in ctc]).buffer(0.5), 0.001)

    feats = []

    def aggiungi(g, **props):
        for p in poligoni(g):
            ext = [UTM.transform(x, y) for x, y in p.exterior.coords]
            ints = [[UTM.transform(x, y) for x, y in r.coords] for r in p.interiors]
            geom = {'type': 'Polygon', 'coordinates': [[[round(x, 7), round(y, 7)] for x, y in r] for r in [ext, *ints]]}
            feats.append({'type': 'Feature', 'properties': {k: v for k, v in props.items() if v is not None}, 'geometry': geom})

    # ingombri in UTM
    piani_utm = {}
    for p in PIANI:
        muri, numeri, luoghi, aree = dati[p['id']]
        f = lambda g, pid=p['id']: a_utm(porta_rif[pid](g))
        muri_u = f(muri)
        impronta_u = impronta_di(porta_rif[p['id']](muri), porta_rif[p['id']](aree))
        piani_utm[p['id']] = {
            'muri': muri_u, 'impronta': a_utm(impronta_u), 'impronta_cm': impronta_u, 'muri_cm': porta_rif[p['id']](muri),
            'numeri': [(f(pt), n) for pt, n in numeri], 'luoghi': [(f(pt), n) for pt, n in luoghi],
            'aree_cm': porta_rif[p['id']](aree),
        }

    # la chiesa: la faccia del piano terra con la sua etichetta; sopra il piano terra è un vuoto
    t = piani_utm['terra']
    facce_terra, _ = stanze_e_varchi(t['muri_cm'], t['impronta_cm'])
    facce_terra = [a_utm(x) for x in facce_terra]
    pt_chiesa = next(pt for pt, n in t['luoghi'] if n == CHIESA)
    chiesa = min(facce_terra, key=lambda x: x.distance(pt_chiesa))
    ammezzato = piani_utm['ammezzato']['impronta']

    for p in PIANI:
        u = piani_utm[p['id']]
        q, cielo, liv = p['quota'], p['cielo'], p['livello']
        base = dict(piano=p['id'], nome_piano=p['nome'], livello=liv)
        facce, varchi = stanze_e_varchi(u['muri_cm'], u['impronta_cm'], u['aree_cm'])
        facce = [a_utm(x) for x in facce]
        varchi = [a_utm(x) for x in varchi]
        esterno = u['impronta'].exterior

        numeri = u['numeri']
        num_di = assegna_numeri(facce, numeri)
        vuoti, stanze, esterni = [], [], []
        for i, fc in enumerate(facce):
            fuori = fc.difference(sagoma).area / fc.area > 0.5
            if p['id'] != 'terra' and not num_di[i] and fc.intersection(chiesa).area / fc.area > 0.5:
                vuoti.append(fc)
            elif fuori:
                esterni.append(fc)
                aggiungi(fc, **base, tipo='esterno', quota=q, h=q + 0.05)
            else:
                stanze.append((fc, num_di[i]))

        # solaio di calpestio: impronta meno i vuoti (e meno il giardino)
        solaio = u['impronta'].intersection(sagoma).difference(unary_union(vuoti) if vuoti else Polygon())
        aggiungi(solaio, **base, tipo='solaio', quota=round(q - SOLAIO, 2), h=q)

        # cielo del piano: sotto l'ammezzato il piano terra si ferma alla sua quota
        def cielo_di(g):
            if p['id'] == 'terra' and g.intersection(ammezzato).area / max(g.area, 1e-9) > 0.5:
                return PIANI[1]['quota'] - SOLAIO
            return cielo - (SOLAIO if p['id'] != 'terzo' else 0)

        for m in poligoni(u['muri']):
            dentro_ctc = m.intersection(sagoma).area / m.area > 0.5
            top = cielo_di(m) if dentro_ctc else q + MURO_GIARDINO
            aggiungi(m, **base, tipo='muro', quota=q, h=round(top, 2))

        for v in varchi:
            if v.intersection(sagoma).area / v.area < 0.5:
                continue
            top = cielo_di(v)
            alt = top - q
            arch = q + min(3.0, 0.6 * alt) if alt > 4 else q + min(2.4, 0.75 * alt)
            aggiungi(v, **base, tipo='architrave', quota=round(arch, 2), h=round(top, 2))
            if v.buffer(0.3).intersects(esterno):
                aggiungi(v, **base, tipo='davanzale', quota=q, h=round(q + 0.9, 2))

 
        corpo = corpo_chiesa(u['impronta'].intersection(sagoma), chiesa, esterni) if p['id'] == 'terra' else None
        for fc, nn in stanze:
            nome = NOME_CHIESA if p['id'] == 'terra' and fc.intersection(corpo).area / fc.area > 0.5 else None
            aggiungi(fc, **base, tipo='stanza', nome=nome, numero=', '.join(nn) or None, area=round(fc.area, 1),
                     quota=q, h=round(q + 0.06, 2))
        for fc in vuoti:
            aggiungi(fc, **base, tipo='vuoto', quota=q, h=q)

        # etichette dei numeri di stanza (punti, un solo punto per numero)
        visti = set()
        for pt, n in numeri:
            if n in visti:
                continue
            visti.add(n)
            x, y = UTM.transform(pt.x, pt.y)
            feats.append({'type': 'Feature', 'properties': {**base, 'tipo': 'numero', 'numero': n, 'quota': q},
                          'geometry': {'type': 'Point', 'coordinates': [round(x, 7), round(y, 7)]}})

    # copertura: falde a gradoni dalla gronda al colmo, senza il vano della cupola; tamburo, calotta e lanterna
    c = COPERTURA
    base = dict(piano=c['id'], nome_piano=c['nome'], livello=c['livello'])
    tetto = piani_utm['terzo']['impronta'].intersection(sagoma)
    ott = a_utm(ottagono)
    tamburo = ott.buffer(0.8, join_style=2)  # il foro è il vano interno: il tamburo ha il muro attorno
    aggiungi(tetto, **base, tipo='solaio', quota=c['gronda'] - SOLAIO, h=c['gronda'])
    passi = 8
    meta = max(1.0, _profondita(tetto))
    for i in range(passi):
        anello = tetto.buffer(-meta * i / passi, join_style=2)
        if anello.is_empty:
            break
        z0 = c['gronda'] + (c['colmo'] - c['gronda']) * i / passi
        z1 = c['gronda'] + (c['colmo'] - c['gronda']) * (i + 1) / passi
        aggiungi(anello.difference(tamburo), **base, tipo='tetto', quota=round(z0, 2), h=round(z1, 2))
    aggiungi(tamburo.difference(ott.buffer(-0.6, join_style=2)), **base, tipo='tamburo', quota=c['gronda'], h=c['tamburo'])
    r0 = math.sqrt(tamburo.area / math.pi)
    calotta = c['cupola'] - c['tamburo']
    passi = 10
    for i in range(passi):
        a0, a1 = math.pi / 2 * i / passi, math.pi / 2 * (i + 1) / passi
        rr = r0 * math.cos(a0)
        anello = ott.centroid.buffer(rr, quad_segs=2)  # ottagono regolare
        anello = affinity.rotate(anello, rot + 22.5, origin=ott.centroid)
        aggiungi(anello, **base, tipo='cupola', quota=round(c['tamburo'] + calotta * math.sin(a0), 2),
                 h=round(c['tamburo'] + calotta * math.sin(a1), 2))
    lanterna = affinity.rotate(ott.centroid.buffer(r0 * 0.22, quad_segs=2), rot + 22.5, origin=ott.centroid)
    aggiungi(lanterna, **base, tipo='lanterna', quota=round(c['cupola'] - 0.4, 2), h=c['lanterna'])

    OUT.mkdir(parents=True, exist_ok=True)
    meta = {
        'nome': 'Ex Noviziato dei Crociferi',
        'indirizzo': 'Foro Umberto I 14 / Cortile Crociferi, Palermo',
        'fonte': 'Piante DWG «Noviziato planimetrie complete e PLT», Comune di Palermo - Settore Centro Storico',
        'georeferenziazione': 'piante allineate alle unità volumetriche CTC del Comune di Palermo (cupola e bordi)',
        'quote': 'proporzioni dalla sezione, scala dalla gronda CTC (21,6 m dalla strada); m dal pavimento del piano terra, ±1 m',
        'piani': [{k: p[k] for k in ('id', 'nome', 'livello', 'quota', 'cielo')} for p in PIANI]
                 + [{'id': c['id'], 'nome': c['nome'], 'livello': c['livello'], 'quota': c['gronda'], 'cielo': c['lanterna']}],
        'centro': list(UTM.transform(*ott.centroid.coords[0])),
        'rotazione': round(rot, 2),
    }
    fc = {'type': 'FeatureCollection', 'metadata': meta, 'features': feats}
    (OUT / 'crociferi.geojson').write_text(json.dumps(fc, ensure_ascii=False, separators=(',', ':')))
    print(f'{len(feats)} oggetti -> {OUT / "crociferi.geojson"}')
    impronta = piani_utm['terra']['impronta'].union(piani_utm['primo']['impronta'])
    contesto = []
    for q, pr in ctc:
        if q.intersection(impronta).area / q.area > 0.3:
            continue
        ext = [[round(x, 7), round(y, 7)] for x, y in (UTM.transform(*xy) for xy in q.exterior.coords)]
        contesto.append({'type': 'Feature', 'properties': {'h': pr.get('height')}, 'geometry': {'type': 'Polygon', 'coordinates': [ext]}})
    (OUT / 'contesto.geojson').write_text(json.dumps({'type': 'FeatureCollection', 'features': contesto}, separators=(',', ':')))
    prospetti = facciate(porta_utm)
    (OUT / 'prospetti').mkdir(exist_ok=True)
    elenco = []
    for f in prospetti:
        # WebP con trasparenza per il web (un decimo del PNG); il GLB tiene il PNG, che glTF accetta senza estensioni
        f['img'].save(OUT / 'prospetti' / f'{f["lato"]}.webp', quality=82, method=6)
        elenco.append({'lato': f['lato'], 'immagine': f'prospetti/{f["lato"]}.webp', 'altezza': round(f['alto'], 2),
                       'da': [round(v, 7) for v in UTM.transform(*f['a'])], 'a': [round(v, 7) for v in UTM.transform(*f['b'])]})
    (OUT / 'prospetti.json').write_text(json.dumps(elenco, indent=1))
    if args.glb:
        scrivi_glb(feats, ott.centroid, Path(args.glb), prospetti)


def _profondita(g):
    """Metà della larghezza minima del rettangolo che contiene g (m): fin dove arrivano le falde."""
    r = g.minimum_rotated_rectangle
    xs = list(r.exterior.coords)
    lati = sorted(math.dist(xs[i], xs[i + 1]) for i in range(4))
    return lati[0] / 2


COLORI = {'muro': (226, 214, 190), 'architrave': (226, 214, 190), 'davanzale': (226, 214, 190), 'solaio': (170, 170, 170),
          'stanza': (240, 236, 228), 'esterno': (140, 180, 120), 'tetto': (176, 92, 64), 'tamburo': (226, 214, 190),
          'cupola': (196, 112, 80), 'lanterna': (226, 214, 190)}


def texture_facciata(f):
    """RGBA della facciata: le linee del prospetto, con il bianco trasparente."""
    (x0, x1), (y0, y1) = f['x'], f['y']
    W, H = (x1 - x0) * RISOLUZIONE, (y1 - y0) * RISOLUZIONE
    g = np.asarray(Image.open(SRC / 'img' / f['img']).convert('L').crop((x0, y0, x1, y1)).resize((W, H), Image.BICUBIC))
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., :3] = 40
    rgba[..., 3] = np.clip((215 - g.astype(int)) * 4, 0, 255)
    return rgba


def facciate(porta_utm):
    """Per ogni prospetto: estremità sinistra e destra (UTM, viste da fuori), altezza (m) e immagine RGBA delle sole linee."""
    W, E, S, N = FILI['ovest'], FILI['est'], FILI['sud'], FILI['nord']
    estremi = {'sud': ((W, S), (E, S)), 'ovest': ((W, N), (W, S)), 'est': ((E, S), (E, N)), 'nord': ((E, N), (W, N))}
    out = []
    for f in FACCIATE:
        a, b = (np.array(porta_utm(Point(*p)).coords[0]) for p in estremi[f['lato']])
        lungo = np.linalg.norm(b - a)
        (x0, x1), (y0, y1) = f['x'], f['y']
        alto = lungo * (y1 - y0) / (x1 - x0)
        rgba = texture_facciata(f)
        # fuori dal filo di 5 cm, perché le linee non si mescolino con la faccia del muro
        n = np.array([(b - a)[1], -(b - a)[0]]) / lungo
        out.append({'lato': f['lato'], 'a': a + n * 0.05, 'b': b + n * 0.05, 'alto': alto, 'img': Image.fromarray(rgba, 'RGBA')})
        print(f"prospetto {f['lato']}: {lungo:.1f} m x {alto:.1f} m")
    return out


def scrivi_glb(feats, centro, percorso, prospetti=()):
    import trimesh
    cx, cy = centro.x, centro.y
    scena = trimesh.Scene()
    # una mesh per piano e tipo, con un materiale per tipo: meno nodi e colori uguali in ogni visualizzatore glTF
    gruppi = {}
    for f in feats:
        p = f['properties']
        if f['geometry']['type'] != 'Polygon' or p['tipo'] == 'vuoto' or p['h'] - p['quota'] <= 0:
            continue
        anelli = [[(x - cx, y - cy) for x, y in (A_UTM.transform(*xy) for xy in r)] for r in f['geometry']['coordinates']]
        for pp in poligoni(Polygon(anelli[0], anelli[1:]).buffer(0)):
            m = trimesh.creation.extrude_polygon(pp, p['h'] - p['quota'])
            m.apply_translation([0, 0, p['quota']])
            gruppi.setdefault((p['piano'], p['tipo']), []).append(m)
    for (piano, tipo), ms in gruppi.items():
        m = trimesh.util.concatenate(ms)
        r, g, b = COLORI.get(tipo, (200, 200, 200))
        mat = trimesh.visual.material.PBRMaterial(name=tipo, baseColorFactor=[r / 255, g / 255, b / 255, 1.0],
                                                  metallicFactor=0, roughnessFactor=0.9)
        m.visual = trimesh.visual.TextureVisuals(material=mat)
        scena.add_geometry(m, node_name=f'{piano}_{tipo}', geom_name=f'{piano}_{tipo}')
    for f in prospetti:
        a, b = f['a'] - (cx, cy), f['b'] - (cx, cy)
        v = np.array([[*a, 0], [*b, 0], [*b, f['alto']], [*a, f['alto']]])
        uv = np.array([[0, 0], [1, 0], [1, 1], [0, 1]])
        # nel GLB la texture a metà risoluzione: il file resta leggero
        tex = f['img'].resize((f['img'].width // 2, f['img'].height // 2), Image.LANCZOS)
        mat = trimesh.visual.material.PBRMaterial(baseColorTexture=tex, alphaMode='MASK', alphaCutoff=0.35,
                                                  doubleSided=True, metallicFactor=0, roughnessFactor=1)
        m = trimesh.Trimesh(v, [[0, 1, 2], [0, 2, 3]], visual=trimesh.visual.TextureVisuals(uv=uv, material=mat), process=False)
        scena.add_geometry(m, node_name=f'prospetto_{f["lato"]}', geom_name=f'prospetto_{f["lato"]}')
    # Z in alto -> Y in alto (glTF)
    scena.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
    percorso.write_bytes(scena.export(file_type='glb'))
    print(f'modello 3D -> {percorso}')


if __name__ == '__main__':
    main()

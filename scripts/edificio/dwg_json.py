"""Lettore del JSON che LibreDWG produce da un DWG (`dwgread -O JSON`): appiattisce lo spazio modello in geometrie.

Il DXF di LibreDWG per questo file è malformato (ezdxf non lo apre), il JSON invece è completo: qui si risolvono
i blocchi (INSERT annidati, con scala, rotazione e punto base) e si restituiscono in coordinate disegno
- 'linea': array Nx2 (LINE, LWPOLYLINE e POLYLINE con i bulge, ARC, CIRCLE);
- 'retino': lista di anelli Nx2 di un HATCH (bordi a polilinea o a segmenti, archi compresi);
- 'testo': (x, y, testo, altezza, rotazione) di TEXT e MTEXT.
Un'entità sul layer '0' dentro un blocco prende il layer dell'INSERT, come in AutoCAD.
"""
import json
import math

import numpy as np


def _h(x):
    return x[-1] if isinstance(x, list) else x


def arco(cx, cy, r, a0, a1, ccw=True):
    if not ccw:
        a0, a1 = -a1, -a0
    if a1 < a0:
        a1 += 2 * math.pi
    n = max(4, int((a1 - a0) / (math.pi / 18)) + 1)
    t = np.linspace(a0, a1, n)
    pts = np.c_[cx + r * np.cos(t), cy + r * np.sin(t)]
    if not ccw:
        pts[:, 1] = 2 * cy - pts[:, 1]
    return pts


def con_bulge(pts, bulges, chiusa):
    """Polilinea con bulge (archi tra vertici) -> punti densi."""
    pts = [np.array(p[:2], float) for p in pts]
    if not pts:
        return np.zeros((0, 2))
    out = []
    n = len(pts)
    for i in range(n if chiusa else n - 1):
        p0, p1 = pts[i], pts[(i + 1) % n]
        b = bulges[i] if bulges and i < len(bulges) else 0
        out.append(p0)
        d = np.linalg.norm(p1 - p0)
        if abs(b) > 1e-9 and d > 1e-12:
            th = 4 * math.atan(b)
            r = d / (2 * math.sin(th / 2))
            nrm = np.array([-(p1 - p0)[1], (p1 - p0)[0]]) / d
            c = (p0 + p1) / 2 + nrm * r * math.cos(th / 2)
            a0 = math.atan2(p0[1] - c[1], p0[0] - c[0])
            k = max(3, int(abs(th) / (math.pi / 18)))
            for j in range(1, k):
                a = a0 + th * j / k
                out.append(c + abs(r) * np.array([math.cos(a), math.sin(a)]))
    out.append(pts[0] if chiusa else pts[-1])
    return np.array(out)


class DisegnoDWG:
    def __init__(self, percorso):
        j = json.load(open(percorso))
        self.header = j['HEADER']
        oggetti = j['OBJECTS']
        self.layers = {_h(o['handle']): o['name'] for o in oggetti if o.get('object') == 'LAYER'}
        self.blocchi = {_h(o['handle']): {'nome': o.get('name') or '', 'base': o.get('base_pt', [0, 0, 0]), 'ent': []}
                        for o in oggetti if o.get('object') == 'BLOCK_HEADER'}
        self.ms = next(k for k, b in self.blocchi.items() if b['nome'].upper() == '*MODEL_SPACE')
        self.vertici = {}
        for o in oggetti:
            t = o.get('entity')
            if not t:
                continue
            if t == 'VERTEX_2D':
                self.vertici.setdefault(_h(o.get('ownerhandle', [0])), []).append(o)
                continue
            if t in ('BLOCK', 'ENDBLK', 'SEQEND'):
                continue
            # entmode: 2 spazio modello, 1 spazio carta (scartato), 0 dentro un blocco (owner = BLOCK_HEADER)
            if o.get('entmode') == 2:
                own = self.ms
            elif o.get('entmode') == 1:
                continue
            else:
                own = _h(o.get('ownerhandle', [0]))
            if own in self.blocchi:
                self.blocchi[own]['ent'].append(o)

    def _layer(self, e):
        return self.layers.get(_h(e.get('layer', [0])), '?')

    def _anelli_retino(self, e):
        anelli = []
        for p in e.get('paths', []):
            if 'polyline_paths' in p:
                pts = [q['point'] for q in p['polyline_paths']]
                bl = [q.get('bulge', 0) for q in p['polyline_paths']]
                a = con_bulge(pts, bl, True)
            else:
                pezzi = []
                for s in p.get('segs', []):
                    ct = s.get('curve_type')
                    if ct == 1:
                        pezzi.append(np.array([s['first_endpoint'][:2], s['second_endpoint'][:2]], float))
                    elif ct == 2:
                        c = s['center']
                        pezzi.append(arco(c[0], c[1], s['radius'], s['start_angle'], s['end_angle'], bool(s.get('is_ccw', 1))))
                if not pezzi:
                    continue
                a = np.vstack(pezzi)
            if len(a) >= 3:
                anelli.append(a)
        return anelli

    def entita(self, blocco=None, M=np.eye(3), layer_padre=None, prof=0):
        """Genera (layer, tipo, dati) in coordinate dello spazio modello."""
        blocco = self.ms if blocco is None else blocco
        scala = math.sqrt(abs(np.linalg.det(M[:2, :2])))

        def tr(P):
            P = np.asarray(P, float)[:, :2]
            return (np.c_[P, np.ones(len(P))] @ M.T)[:, :2]

        for e in self.blocchi[blocco]['ent']:
            lay = self._layer(e)
            if lay == '0' and layer_padre:
                lay = layer_padre
            t = e['entity']
            g = None
            if t == 'LINE':
                g = tr([e['start'], e['end']])
            elif t == 'LWPOLYLINE':
                chiusa = bool(e.get('flag', 0) & 512) or bool(e.get('flag', 0) & 1)
                g = tr(con_bulge(e['points'], e.get('bulges'), chiusa))
            elif t == 'POLYLINE_2D':
                vs = self.vertici.get(_h(e['handle']), [])
                if vs:
                    g = tr(con_bulge([v['point'] for v in vs], [v.get('bulge', 0) for v in vs], bool(e.get('flag', 0) & 1)))
            elif t == 'ARC':
                c = e['center']
                g = tr(arco(c[0], c[1], e['radius'], e['start_angle'], e['end_angle']))
            elif t == 'CIRCLE':
                c = e['center']
                g = tr(arco(c[0], c[1], e['radius'], 0, 2 * math.pi))
            elif t in ('TEXT', 'MTEXT'):
                p = e.get('ins_pt') or [0, 0]
                q = tr([p])[0]
                yield lay, 'testo', (q[0], q[1], e.get('text_value') or e.get('text') or '', e.get('height', 0) * scala, e.get('rotation', 0))
                continue
            elif t == 'HATCH':
                anelli = [tr(a) for a in self._anelli_retino(e)]
                if anelli:
                    yield lay, 'retino', anelli
                continue
            elif t == 'INSERT':
                bh = _h(e.get('block_header', [0]))
                if bh not in self.blocchi or prof > 8:
                    continue
                ip, sc, rot = e['ins_pt'], e.get('scale', [1, 1, 1]), e.get('rotation', 0)
                base = self.blocchi[bh]['base']
                c, s = math.cos(rot), math.sin(rot)
                T = np.array([[c * sc[0], -s * sc[1], ip[0]], [s * sc[0], c * sc[1], ip[1]], [0, 0, 1]])
                B = np.array([[1, 0, -base[0]], [0, 1, -base[1]], [0, 0, 1]])
                yield from self.entita(bh, M @ T @ B, lay, prof + 1)
                continue
            if g is not None and len(g) >= 2:
                yield lay, 'linea', g

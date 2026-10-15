"""Variazione di popolazione 2011 -> 2021 -> 2023 per UPL, quartiere, circoscrizione.

Le sezioni 2011 (ISTAT, confini diversi dal 2021) vengono ripartite sulle aree 2021 per
sovrapposizione geometrica: ogni sezione cede la popolazione in proporzione all'area che cade
in ciascuna UPL. Il 2021 e il 2023 si sommano direttamente sulle sezioni 2021.

Uso:  python3 scripts/trend_demografico.py --lavoro DIR --geo2021 geo_sezioni_2021.geojson --out dati/popolazione
DIR contiene gli estratti ISTAT: x2011/R19_11_WGS84/*.shp, xcpa/Sezioni di Censimento/R19_*.csv,
x21/Palermo_indicatori_2021_sezioni.xlsx, x23/Comuni_2023/Palermo_2023_sezioni.xlsx.
"""
import argparse
import json
import math
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, box

PRO_COM = 82053
# date di riferimento in anni decimali: censimento 2011 (9 ottobre), permanente 2021 e 2023 (31 dicembre)
T11, T21, T23 = 2011.77, 2021.99, 2023.99
ORIZZONTI = [2030, 2035]
PROPORZIONE_GRAFICO = 0.5  # altezza / larghezza del riquadro del mini-grafico (lo stesso valore è in js/layers/trend-geometria.js)
LIVELLI = {'upl': 'UPL', 'quartiere': 'Quartiere', 'circoscrizione': 'Circoscrizione'}


def carica_2011(lavoro):
    g = gpd.read_file(lavoro / 'x2011/R19_11_WGS84/R19_11_WGS84.shp')
    g = g[g.PRO_COM == PRO_COM][['SEZ2011', 'geometry']]
    c = pd.read_csv(lavoro / 'xcpa/Sezioni di Censimento/R19_indicatori_2011_sezioni.csv',
                    sep=';', low_memory=False, encoding='latin-1')
    c = c[c.PROCOM == PRO_COM][['SEZ2011', 'P1']]
    return g.merge(c, on='SEZ2011', how='inner')


def ripartisci(sez11, aree, campo):
    """Popolazione 2011 per area 2021, in proporzione alla sovrapposizione. Ritorna (serie, non_assegnata)."""
    sez = sez11.copy()
    sez['area_sez'] = sez.geometry.area
    inter = gpd.overlay(sez, aree[[campo, 'geometry']], how='intersection', keep_geom_type=True)
    inter['quota'] = inter.geometry.area / inter['area_sez']
    inter['pop'] = inter['P1'] * inter['quota']
    per_area = inter.groupby(campo)['pop'].sum()
    return per_area, sez['P1'].sum() - per_area.sum()


def proiezione(p11, p21, p23, orizzonti):
    """Proiezione semplice a tasso annuo composto, ancorata al valore 2023.

    Tre tassi: 'lungo' (2011→2021), 'breve' (2021→2023), 'ols' (retta sul logaritmo dei tre punti).
    Il valore centrale usa 'ols'; la fascia va dal minimo al massimo dei tre scenari.
    Non è un modello demografico: serve a dare un ordine di grandezza, non una previsione.
    """
    if min(p11, p21, p23) <= 0:
        return None
    t = [T11, T21, T23]
    y = [math.log(p11), math.log(p21), math.log(p23)]
    mt, my = sum(t) / 3, sum(y) / 3
    pendenza = sum((a - mt) * (b - my) for a, b in zip(t, y)) / sum((a - mt) ** 2 for a in t)
    tassi = {
        'lungo': (p21 / p11) ** (1 / (T21 - T11)) - 1,
        'breve': (p23 / p21) ** (1 / (T23 - T21)) - 1,
        'ols': math.exp(pendenza) - 1,
    }
    out = {'tassi': tassi}
    for anno in orizzonti:
        dt = anno + 0.99 - T23
        valori = {k: p23 * (1 + r) ** dt for k, r in tassi.items()}
        out[str(anno)] = {'centrale': valori['ols'], 'min': min(valori.values()), 'max': max(valori.values())}
    return out


def riquadro_interno(poly, proporzione=PROPORZIONE_GRAFICO, passi=14):
    """Il riquadro più largo (rapporto altezza/larghezza fisso, lati paralleli agli assi) che sta dentro il poligono.

    Prova molti centri su una griglia e per ciascuno cerca per bisezione la larghezza massima; ritorna (x, y, larghezza) nello
    stesso sistema del poligono (metri). Così ogni grafico sta nella propria area e non può sovrapporsi a quelle vicine.
    """
    x0, y0, x1, y1 = poly.bounds
    centri = [poly.representative_point()]
    for i in range(1, passi):
        for j in range(1, passi):
            c = Point(x0 + (x1 - x0) * i / passi, y0 + (y1 - y0) * j / passi)
            if poly.contains(c):
                centri.append(c)
    migliore = (centri[0].x, centri[0].y, 0.0)
    for c in centri:
        basso, alto = 0.0, min(x1 - x0, (y1 - y0) / proporzione)
        for _ in range(14):
            w = (basso + alto) / 2
            h = w * proporzione
            if poly.contains(box(c.x - w / 2, c.y - h / 2, c.x + w / 2, c.y + h / 2)):
                basso = w
            else:
                alto = w
        if basso > migliore[2]:
            migliore = (c.x, c.y, basso)
    return migliore


def geometrie(livello, aree, righe):
    """Poligoni (semplificati) e un punto interno per ogni area, con i numeri del trend, in WGS84."""
    rec = []
    for r in righe:
        if r['nome'] not in aree.index:
            continue
        poly = aree.loc[r['nome'], 'geometry'].simplify(4)
        props = {'livello': livello, 'nome': r['nome'], 'p11': round(r['p11']), 'p21': round(r['p21']), 'p23': round(r['p23']),
                 'var1121': r['var_11_21_pct'], 'var2123': r.get('var_21_23_pct')}
        if 'tassi' in r:
            props['tasso'] = r['tassi']['ols']
            for anno in ORIZZONTI:
                for k, v in r[f'p{anno}'].items():
                    props[f'p{anno}_{k}'] = v
        gx, gy, gw = riquadro_interno(poly)
        rec.append({**props, 'tipo': 'area', 'geometry': poly})
        rec.append({**props, 'tipo': 'punto', 'geometry': poly.representative_point(), 'gxy': (gx, gy), 'gw': round(gw, 1)})
    gdf = gpd.GeoDataFrame(rec, crs=aree.crs)
    # centro del riquadro del mini-grafico, in gradi (il punto è nel sistema metrico fino a qui)
    centri = gpd.GeoSeries([Point(*c) if isinstance(c, tuple) else None for c in gdf['gxy']], crs=aree.crs).to_crs(4326)
    gdf = gdf.drop(columns='gxy').to_crs(4326)
    gdf['gx'] = centri.x.round(6)
    gdf['gy'] = centri.y.round(6)
    return gdf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lavoro', type=Path, required=True)
    ap.add_argument('--geo2021', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    a = ap.parse_args()

    s11 = carica_2011(a.lavoro)
    g21 = gpd.read_file(a.geo2021)
    x21 = pd.read_excel(a.lavoro / 'x21/Palermo_indicatori_2021_sezioni.xlsx', 'Palermo_2021')[['SEZ21_ID', 'P1']]
    x23 = pd.read_excel(a.lavoro / 'x23/Comuni_2023/Palermo_2023_sezioni.xlsx', 'Palermo_2023_sezioni')[['SEZ21_ID', 'P1']]
    g21 = g21[['SEZ21_ID', 'Circoscrizione', 'Quartiere', 'UPL', 'geometry']]
    g21 = g21.merge(x21.rename(columns={'P1': 'p21'}), on='SEZ21_ID', how='left') \
             .merge(x23.rename(columns={'P1': 'p23'}), on='SEZ21_ID', how='left')

    out = {}
    geo = []
    for chiave, campo in LIVELLI.items():
        aree = g21.dissolve(campo).reset_index()
        p11, persa = ripartisci(s11, aree, campo)
        t = pd.DataFrame({
            'p11': p11,
            'p21': g21.groupby(campo).p21.sum(),
            'p23': g21.groupby(campo).p23.sum(),
        }).fillna(0)
        t['var_11_21_pct'] = (t.p21 / t.p11 - 1) * 100
        t['var_21_23_pct'] = (t.p23 / t.p21.where(t.p21 > 0) - 1) * 100
        righe = []
        for nome, r in t.iterrows():
            rec = {'nome': nome, **{k: round(float(v), 2) for k, v in r.items()}}
            pr = proiezione(r.p11, r.p21, r.p23, ORIZZONTI)
            if pr:
                rec['tassi'] = {k: round(v * 100, 3) for k, v in pr['tassi'].items()}
                for anno in ORIZZONTI:
                    rec[f'p{anno}'] = {k: round(v) for k, v in pr[str(anno)].items()}
            righe.append(rec)
        out[chiave] = righe
        geo.append(geometrie(chiave, aree.set_index(campo), righe))
        print(f'{chiave}: {len(t)} aree, 2011 {t.p11.sum():.0f} (non assegnati {persa:.0f}), '
              f'2021 {t.p21.sum():.0f}, 2023 {t.p23.sum():.0f}')
    a.out.mkdir(parents=True, exist_ok=True)
    (a.out / 'trend_livelli.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
    tutte = pd.concat(geo, ignore_index=True)
    tutte.to_file(a.out / 'trend.geojson', driver='GeoJSON', COORDINATE_PRECISION=6)
    print(f"trend.geojson: {len(tutte)} elementi ({(a.out / 'trend.geojson').stat().st_size // 1024} KB)")


if __name__ == '__main__':
    main()

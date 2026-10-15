import math

import trend_demografico as m


def test_popolazione_costante_resta_costante():
    r = m.proiezione(1000, 1000, 1000, [2030])
    assert r['tassi']['ols'] == 0
    assert r['2030']['centrale'] == 1000
    assert r['2030']['min'] == r['2030']['max'] == 1000


def test_calo_costante_prosegue_e_la_fascia_contiene_il_centrale():
    # -1% l'anno su 2011-2021 e 2021-2023
    p21 = 1000 * 0.99 ** (m.T21 - m.T11)
    p23 = p21 * 0.99 ** (m.T23 - m.T21)
    r = m.proiezione(1000, p21, p23, [2030])
    assert math.isclose(r['tassi']['lungo'], -0.01, abs_tol=1e-6)
    assert math.isclose(r['tassi']['ols'], -0.01, abs_tol=1e-4)
    p30 = r['2030']
    assert p30['min'] <= p30['centrale'] <= p30['max']
    assert p30['centrale'] < p23


def test_fascia_tra_tasso_lungo_e_corto():
    # cresce nel lungo periodo, cala nel breve: la fascia deve coprire entrambi i casi
    r = m.proiezione(1000, 1100, 1080, [2035])
    f = r['2035']
    assert f['min'] < 1080 < f['max']


def test_senza_dati_non_proietta():
    assert m.proiezione(0, 100, 100, [2030]) is None
    assert m.proiezione(100, 0, 0, [2030]) is None

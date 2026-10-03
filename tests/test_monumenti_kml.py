import monumenti_kml as k


def test_classifica_per_nome():
    c = k.classifica
    assert c("Chiesa di San Cataldo") == "Chiese ed Oratori"
    assert c("Oratorio del Rosario") == "Chiese ed Oratori"
    assert c("Teatro Massimo") == "Teatri"
    assert c("Museo Pitrè") == "Gallerie d'Arte e Musei"
    assert c("Biblioteca Comunale") == "Biblioteche"
    assert c("Mercato del Capo") == "Mercati storici"
    assert c("Necropoli Punica") == "Zone Archeologiche"
    assert c("Giardino Inglese") == "Giardini e Spazi verdi"
    assert c("Villino Florio") == "Dimore e Ville storiche"
    assert c("Palazzo Butera") == "Palazzi"
    assert c("Fontana Pretoria") == "Monumenti"
    assert c("Segnaletica Ricovero II° Guerra Mondiale") == "Rifugi e memoria bellica"
    assert c("Casamatta") == "Rifugi e memoria bellica"
    assert c("Qualcosa di strano") == "Altri luoghi"
    # la parola specifica vince su «villa» in coda
    assert c("Chiesa di San Gioacchino a Villa Casaurra") == "Chiese ed Oratori"


DESC = ('<img src="https://mymaps.usercontent.google.com/hostedimage/m/*/ABC?authuser=0&amp;fife=s16383" height="200" width="auto" />'
        '<br><br>Ignazio Marabitti<br>Le due acquasantiere &#8211; commissionate nel 1793.<br><img src="https://lh3.googleusercontent.com/umsh/x" />')


def test_testo_e_foto():
    testo, foto = k.testo_foto(DESC)
    assert testo == "Ignazio Marabitti Le due acquasantiere – commissionate nel 1793."
    assert foto == "https://mymaps.usercontent.google.com/hostedimage/m/*/ABC?authuser=0&fife=s" + str(k.FOTO_LATO)  # solo le immagini ridimensionabili


def test_testo_troncato_a_parola():
    testo, _ = k.testo_foto("<p>" + "parola " * 200 + "</p>", max_car=100)
    assert len(testo) <= 101 and testo.endswith("…")


def test_senza_immagini_ne_testo():
    assert k.testo_foto("") == (None, None)
    assert k.testo_foto(None) == (None, None)


def P(id, nome, lon, lat, **kw):
    return {"id": id, "nome": nome, "lon": lon, "lat": lat, **kw}


def test_abbinamento_uno_a_uno_e_per_distanza():
    portale = [P("p1", "Chiesa di San Giovanni degli Eremiti", 13.3550, 38.1093),
               P("p2", "Chiesa di San Giovanni dei Lebbrosi", 13.3700, 38.0950)]
    kml = [P("k1", "Chiesa di San Giovanni", 13.3700, 38.0951),
           P("k2", "Chiesa di San Giovanni degli Eremiti", 13.3551, 38.1094)]
    ab = k.abbina_portale(portale, kml)
    assert ab["p1"]["id"] == "k2"            # nome esatto
    assert ab["p2"]["id"] == "k1"            # generico ma vicino e libero


def test_nessun_abbinamento_se_lontano():
    ab = k.abbina_portale([P("p", "Chiesa di San Cataldo", 13.36, 38.11)], [P("k", "Chiesa di San Cataldo", 13.45, 38.11)])
    assert ab == {}


def test_deduplica_extra():
    portale = [P("p", "Chiesa del Gesù o di Casa Professa", 13.3605, 38.1125)]
    extra = [
        P("a", "Cupola della Chiesa del Gesù Casa Professa", 13.36052, 38.11251),   # parte dello stesso monumento
        P("b", "Fontanella", 13.3500, 38.1200, foto=None, descrizione=None),
        P("c", "Fontanella", 13.35001, 38.12001, foto="x", descrizione="d"),         # stesso nome, vicino: tiene il piu' ricco
        P("d", "Fontanella", 13.3600, 38.1300),                                      # stesso nome ma lontano: e' un altro
    ]
    out = k.deduplica(extra, portale)
    assert sorted(o["id"] for o in out) == ["c", "d"]


def test_abbinamento_parole_distintive():
    portale = [P("p1", "Chiesa di Santa Maria dei Miracoli", 13.3600, 38.1100),
               P("p2", "Chiesa di San Giovanni dei Lebbrosi", 13.3700, 38.0950)]
    kml = [P("k1", "Chiesa Santa Maria dei Miracoli", 13.36005, 38.11001),       # solo «di» di differenza
           P("k2", "Parrocchia San Giovanni dei Lebbrosi", 13.37020, 38.09520)]  # altra parola di tipo
    ab = k.abbina_portale(portale, kml)
    assert ab["p1"]["id"] == "k1" and ab["p2"]["id"] == "k2"


def test_preferisce_lo_stesso_tipo():
    portale = [P("p", "Chiesa di San Domenico", 13.3640, 38.1180)]
    kml = [P("oratorio", "Oratorio della Congregazione San Domenico", 13.36401, 38.11801),   # piu' vicino
           P("chiesa", "Chiesa di San Domenico", 13.36410, 38.11810)]                      # nome esatto
    assert k.abbina_portale(portale, kml)["p"]["id"] == "chiesa"


def test_distintive_diverse_non_abbinano():
    portale = [P("p", "Chiesa di San Giovanni degli Eremiti", 13.3550, 38.1093)]
    kml = [P("k", "Chiesa del Monastero di San Giorgio in Kemonia", 13.35502, 38.10931)]
    assert k.abbina_portale(portale, kml) == {}


def test_classifica_nuove_parole():
    assert k.classifica("Casa Professa") == "Palazzi"
    assert k.classifica("Batteria Costiera") == "Rifugi e memoria bellica"

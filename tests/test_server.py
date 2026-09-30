import urllib.request


def test_server_risponde_a_range_con_206(server):
    req = urllib.request.Request(
        server + "/dati/catasto/particelle.pmtiles", headers={"Range": "bytes=0-6"}
    )
    with urllib.request.urlopen(req) as r:
        assert r.status == 206
        assert r.read() == b"PMTiles"
        assert r.headers["Access-Control-Allow-Origin"] == "*"

"""Genera guida/indice.json: una voce per ogni sezione «##» dei file di guida/, per il Chat bot.

I layer da accendere per ogni sezione stanno in guida/collegamenti.json (chiave: id della sezione o nome del file).
Le pagine di guida dell'app da aprire («scheda:sezione», es. «guida:tema-interfaccia») stanno in guida/rinvii.json, con le stesse chiavi.
I tab da aprire («sinistra:<id>» barra degli strati, «destra:<id>» barra dei pannelli) stanno in guida/pannelli.json, con le stesse chiavi.

Le sezioni che mostrano i pulsanti dei percorsi guidati (js/core/home-percorsi.json) sono elencate in guida/percorsi.json (id delle sezioni).

Uso: python3 scripts/guida_indice.py   (da rilanciare quando la guida cambia)
"""
import json
import re
import sys
from pathlib import Path

ESCLUSI = {'00-leggimi.md', 'RIPRESA.md', 'glossario-en.md'}
# Indicatori delle righe di metadati, per lingua.
MARCATORI = {
    'it': (re.compile(r'^Parole chiave:\s*(.+)$', re.M), re.compile(r'^Domande tipiche:\s*(.+)$', re.M)),
    'en': (re.compile(r'^Keywords:\s*(.+)$', re.M), re.compile(r'^Typical questions:\s*(.+)$', re.M)),
}
RE_SEPARATORE = re.compile(r'^---\s*$', re.M)


def _domande(riga):
    return [d.strip() for d in re.findall(r'[^?]+\?', riga) if d.strip()]


def _voci(sorgente, cartella, lingua):
    """Voci dei file «.md» di `sorgente`; strati/guide/pannelli/percorsi si leggono sempre da `cartella`."""
    re_parole, re_domande = MARCATORI[lingua]
    collegamenti = {}
    percorso_coll = Path(cartella) / 'collegamenti.json'
    if percorso_coll.exists():
        collegamenti = json.loads(percorso_coll.read_text(encoding='utf-8'))
    percorsi = []
    percorso_percorsi = Path(cartella) / 'percorsi.json'
    if percorso_percorsi.exists():
        percorsi = json.loads(percorso_percorsi.read_text(encoding='utf-8'))
    rinvii = {}
    percorso_rinvii = Path(cartella) / 'rinvii.json'
    if percorso_rinvii.exists():
        rinvii = json.loads(percorso_rinvii.read_text(encoding='utf-8'))
    pannelli = {}
    percorso_pannelli = Path(cartella) / 'pannelli.json'
    if percorso_pannelli.exists():
        pannelli = json.loads(percorso_pannelli.read_text(encoding='utf-8'))
    voci = []
    for percorso in sorted(Path(sorgente).glob('*.md')):
        if percorso.name in ESCLUSI:
            continue
        sezioni = re.split(r'\n(?=## )', percorso.read_text(encoding='utf-8'))
        n = 0
        for sezione in sezioni:
            if not sezione.startswith('## '):
                continue
            parole, domande = re_parole.search(sezione), re_domande.search(sezione)
            if not parole or not domande:
                continue
            n += 1
            titolo, _, corpo = sezione.partition('\n')
            corpo = re_domande.sub('', re_parole.sub('', corpo))
            corpo = RE_SEPARATORE.sub('', corpo)
            id_voce = f'{percorso.stem}#{n}'
            voci.append({
                'id': id_voce,
                'file': percorso.name,
                'titolo': titolo[3:].strip(),
                'parole': parole.group(1).strip(),
                'domande': _domande(domande.group(1)),
                'testo': re.sub(r'\n{3,}', '\n\n', corpo).strip(),
                'strati': collegamenti.get(id_voce, collegamenti.get(percorso.name, [])),
                'guide': rinvii.get(id_voce, rinvii.get(percorso.name, [])),
                'pannelli': pannelli.get(id_voce, pannelli.get(percorso.name, [])),
                'percorsi': id_voce in percorsi,
            })
    return voci


def costruisci_indice(cartella, lingua='it'):
    """Indice della guida. Con `lingua='en'` le voci vengono da `cartella/en/`, con gli stessi id
    dell'italiano; dove manca la controparte inglese (file o sezione) resta la voce italiana."""
    italiano = _voci(cartella, cartella, 'it')
    if lingua == 'it':
        return italiano
    inglese = {}
    cartella_en = Path(cartella) / lingua
    if cartella_en.is_dir():
        inglese = {v['id']: v for v in _voci(cartella_en, cartella, lingua)}
    return [inglese.get(v['id'], v) for v in italiano]


def main():
    radice = Path(__file__).resolve().parent.parent
    for lingua, nome in (('it', 'indice.json'), ('en', 'indice.en.json')):
        voci = costruisci_indice(radice / 'guida', lingua)
        destinazione = radice / 'guida' / nome
        destinazione.write_text(json.dumps(voci, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(f'{len(voci)} voci in {destinazione} ({destinazione.stat().st_size // 1024} KB)')
    return 0


if __name__ == '__main__':
    sys.exit(main())

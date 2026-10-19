"""Genera guida/indice.json: una voce per ogni sezione «##» dei file di guida/, per il Chat bot.

Uso: python3 scripts/guida_indice.py   (da rilanciare quando la guida cambia)
"""
import json
import re
import sys
from pathlib import Path

ESCLUSI = {'00-leggimi.md', 'RIPRESA.md'}
RE_PAROLE = re.compile(r'^Parole chiave:\s*(.+)$', re.M)
RE_DOMANDE = re.compile(r'^Domande tipiche:\s*(.+)$', re.M)
RE_SEPARATORE = re.compile(r'^---\s*$', re.M)


def _domande(riga):
    return [d.strip() for d in re.findall(r'[^?]+\?', riga) if d.strip()]


def costruisci_indice(cartella):
    voci = []
    for percorso in sorted(Path(cartella).glob('*.md')):
        if percorso.name in ESCLUSI:
            continue
        sezioni = re.split(r'\n(?=## )', percorso.read_text(encoding='utf-8'))
        n = 0
        for sezione in sezioni:
            if not sezione.startswith('## '):
                continue
            parole, domande = RE_PAROLE.search(sezione), RE_DOMANDE.search(sezione)
            if not parole or not domande:
                continue
            n += 1
            titolo, _, corpo = sezione.partition('\n')
            corpo = RE_DOMANDE.sub('', RE_PAROLE.sub('', corpo))
            corpo = RE_SEPARATORE.sub('', corpo)
            voci.append({
                'id': f'{percorso.stem}#{n}',
                'file': percorso.name,
                'titolo': titolo[3:].strip(),
                'parole': parole.group(1).strip(),
                'domande': _domande(domande.group(1)),
                'testo': re.sub(r'\n{3,}', '\n\n', corpo).strip(),
            })
    return voci


def main():
    radice = Path(__file__).resolve().parent.parent
    voci = costruisci_indice(radice / 'guida')
    destinazione = radice / 'guida' / 'indice.json'
    destinazione.write_text(json.dumps(voci, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(voci)} voci in {destinazione} ({destinazione.stat().st_size // 1024} KB)')
    return 0


if __name__ == '__main__':
    sys.exit(main())

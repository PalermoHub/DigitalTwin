# Rigenerare il video sul proprio computer

Il video finale (MP4, 13:29) nasce da questa cartella: uno storyboard (`storyboard.py`) da cui derivano voce, sottotitoli e registrazione dell'app, uno script Playwright che esegue la sessione nell'app e la registra, e un montaggio con ffmpeg. Questa guida lo rigenera da zero.

**Tempo**: circa 45 minuti (voce 4 min, musica 1, immagine demo 2, registrazione 15, montaggio 7–10). **Spazio**: circa 3 GB. **Rete**: serve, perché l'app, i tile delle mappe storiche e il catalogo RNDT sono servizi live.

> Il risultato non sarà identico bit per bit: tempi di rete e caricamenti variano. Alla fine della registrazione leggi sempre l'elenco `avvisi:` (testi non trovati o azioni oltre la voce).

## 1. Prerequisiti

- **Python 3.11 o più recente**.
- **ffmpeg** con libx264 e libass (le build normali li hanno): Windows `winget install Gyan.FFmpeg`; macOS `brew install ffmpeg`; Linux `sudo apt install ffmpeg`. Controlla con `ffmpeg -version`.
- **Git**.

## 2. Preparazione

```bash
git clone https://github.com/PalermoHub/DigitalTwin.git
cd DigitalTwin
git checkout claude/laughing-mendel-9uc7o5
cd video-tutorial
```

Ambiente Python e Chromium di Playwright:

```powershell
# Windows (PowerShell)
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
```

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
```

Voce italiana (Piper, `it_IT-paola-medium`): scarica i due file nella cartella `voci/` (creala se manca).

```bash
mkdir -p voci
curl -L -o voci/it_IT-paola-medium.onnx      https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/it_IT-paola-medium.onnx
curl -L -o voci/it_IT-paola-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/it_IT-paola-medium.onnx.json
```

(In PowerShell usa `curl.exe` al posto di `curl`, e `mkdir voci` senza `-p`.)

## 3. Materiali (si fanno una volta)

```bash
python prepara_font.py        # font dei sottotitoli (Montserrat), da quelli dell'app
python genera_voce.py         # voce: audio/*.wav, durate.json e frasi.json (circa 4 minuti)
python musica.py 15.5         # musica di sottofondo sintetizzata, audio/musica.wav (circa 1 minuto)
python build_demo_image.py    # pianta del 1891 per Geoimage, dalle tessere MapWarper (circa 2 minuti)
```

## 4. Registrazione

```bash
python registra_intro.py      # apertura animata, circa 15 secondi
python registra.py            # sessione nell'app, circa 15 minuti
```

Durante la registrazione il browser è invisibile. Lascia il computer tranquillo: un carico alto riduce il frame rate. A fine corsa guarda `avvisi:`: righe come «non trovato …» o «ECCEZIONE …» indicano una scena da rivedere (di solito l'app è cambiata). «azioni oltre la voce di N s» è normale: il montaggio comprime quei tempi.

## 5. Montaggio e controllo

```bash
python montaggio.py           # esporta out/palermo-digital-twin-tutorial.mp4 (7–10 minuti)
python controllo_finale.py    # durata, formato, loudness, fotogrammi in out/controllo/
python genera_youtube.py      # descrizione, capitoli e sottotitoli SRT in consegna/
python genera_copione.py      # copione.md e shotlist.md con i timecode reali
```

Per provare solo i primi secondi prima del montaggio completo: macOS/Linux `ANTEPRIMA=60 python montaggio.py`; PowerShell `$env:ANTEPRIMA=60; python montaggio.py` (scrive `out/anteprima.mp4`).

## Se qualcosa non va

- **«lampo di calibrazione non trovato»**: il video grezzo `out/main.webm` non è completo. Rifai `registra.py`.
- **Il sottotitolo ha un altro font**: manca `assets/fonts`; rilancia `python prepara_font.py`.
- **Chromium non parte**: indica un browser già installato con la variabile `CHROMIUM_PATH` (percorso dell'eseguibile di Chrome o Chromium).
- **Prova rapida di una sola scena** (macOS/Linux): `FAST=0.3 SHOTS=1 SOLO=2-strati,2-ordine python registra.py`; gli screenshot finiscono in `out/shots/`. Non produce video.
- **Voce diversa** (Azure `it-IT-ElsaNeural`, ElevenLabs…): sostituisci `genera_voce.py` con uno script che scriva `audio/<id-scena>.wav` per ogni scena e rigeneri `audio/durate.json` (secondi per scena) e `audio/frasi.json` (inizio, durata e testo di ogni frase, per i sottotitoli): formato identico a quello prodotto ora. Il resto della catena non cambia.

## Dove cambiare le cose

| Cosa | File |
|---|---|
| Testo della voce, sottotitoli, ordine delle scene | `storyboard.py` |
| Azioni nell'app (clic, ricerche, strati) | `scenes_s12.py` (apertura e Guida), `scenes_s3.py` (plugin RNDT), `scenes_s4.py` (Geoimage e riepilogo) |
| Cursore, evidenziazioni, lower third | `overlay.js`, `rec_lib.py` |
| Montaggio (zoom, accelerazione dei tempi morti, mix audio, sottotitoli) | `montaggio.py` |
| Schermata finale | `assets/chiusura.png` |
| Apertura animata | `titolo.html` |
| Esito del controllo e «Da verificare» | `verifica.md` |

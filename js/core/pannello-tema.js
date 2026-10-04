// Pannellino «Colori» di uno strato: colore di riempimento e bordo dei poligoni, spessore delle linee dello strato.
// Il tema si salva nel browser e si scambia come file JSON (vedi tema.js).
import { svgIcona } from './icone.js';
import { partiStrato, applicaTema, validaTema, comeEsadecimale, leggiTemi, salvaTemi, esportaTemi, importaTemi } from './tema.js';

const registro = new Map(); // id strato → { ricarica(): rilegge il tema salvato e lo applica }

function storageBrowser() {
  try { return window.localStorage; } catch { return null; }
}

function campoColore(testo, nome) {
  const riga = document.createElement('label');
  riga.className = 'tema-riga';
  const t = document.createElement('span');
  t.textContent = testo;
  const i = document.createElement('input');
  i.type = 'color';
  i.dataset.tema = nome;
  riga.append(t, i);
  return { riga, input: i };
}

// Restituisce { bottone, pannello }: l'host li mette dove vuole; il bottone si nasconde se lo strato non ha poligoni.
export function creaPannelloTema(map, strato, stato) {
  const originali = stato.temaOriginali ??= new Map();
  const storage = storageBrowser();
  let parti = stato.parti ?? { riempimenti: [], uniformi: [], categorie: [], linee: [] };
  let tema = null;

  const bottone = document.createElement('button');
  bottone.type = 'button';
  bottone.className = 'strato-zoom strato-tema-btn';
  bottone.dataset.temaStrato = strato.id;
  bottone.title = bottone.ariaLabel = `Colori di ${strato.etichetta}`;
  bottone.setAttribute('aria-expanded', 'false');
  bottone.innerHTML = svgIcona('tavolozza', 14);
  bottone.hidden = true;

  const pannello = document.createElement('div');
  pannello.className = 'strato-tema';
  pannello.hidden = true;
  const riempimento = campoColore('Riempimento', 'riempimento');
  const bordo = campoColore('Bordo', 'bordo');
  const rigaSpessore = document.createElement('label');
  rigaSpessore.className = 'tema-riga';
  const ts = document.createElement('span');
  ts.textContent = 'Spessore';
  const spessore = document.createElement('input');
  spessore.type = 'range';
  spessore.min = '0';
  spessore.max = '6';
  spessore.step = '0.5';
  spessore.dataset.tema = 'spessore';
  const vs = document.createElement('output');
  rigaSpessore.append(ts, spessore, vs);
  const categorie = document.createElement('div');
  categorie.className = 'tema-categorie';
  categorie.hidden = true;
  const azioni = document.createElement('div');
  azioni.className = 'tema-azioni';
  const bottoneAz = (testo, azione) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'strato-strumento';
    b.dataset.azione = azione;
    b.textContent = testo;
    return b;
  };
  const reset = bottoneAz('Ripristina', 'tema-ripristina');
  const esporta = bottoneAz('Esporta JSON', 'tema-esporta');
  const importa = bottoneAz('Importa JSON', 'tema-importa');
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = '.json,application/json';
  file.hidden = true;
  const msg = document.createElement('p');
  msg.className = 'tema-msg';
  msg.setAttribute('role', 'status');
  azioni.append(reset, esporta, importa, file);
  pannello.append(riempimento.riga, bordo.riga, rigaSpessore, categorie, azioni, msg);

  // categorie del colore (valore → colore originale), senza ripetizioni tra i layer dello strato
  const vociCategorie = () => [...new Map(parti.categorie.flatMap(c => c.voci)).entries()];
  const campiCategorie = new Map();
  const costruisciCategorie = () => {
    const voci = vociCategorie();
    categorie.hidden = !voci.length;
    if (!voci.length || categorie.dataset.pronta) return;
    categorie.dataset.pronta = '1';
    const titolo = document.createElement('strong');
    titolo.textContent = 'Colori per categoria';
    categorie.append(titolo);
    for (const [nome] of voci) {
      const c = campoColore(nome, 'categoria');
      c.input.dataset.categoria = nome;
      c.input.addEventListener('input', () => {
        tema = validaTema({ ...(tema ?? {}), categorie: { ...(tema?.categorie ?? {}), [nome]: c.input.value } });
        applica();
        salva();
      });
      campiCategorie.set(nome, c.input);
      categorie.append(c.riga);
    }
  };
  // pallini della legenda e del menu che portano data-tema-cat="idStrato|categoria": seguono il colore scelto
  const aggiornaPallini = () => {
    const originale = new Map(vociCategorie());
    for (const p of document.querySelectorAll(`[data-tema-cat^="${CSS.escape(strato.id)}|"]`)) {
      const nome = p.dataset.temaCat.slice(strato.id.length + 1);
      p.style.background = tema?.categorie?.[nome] ?? originale.get(nome) ?? '';
    }
  };

  // valori mostrati: quelli del tema, altrimenti quelli correnti della mappa
  const mostraValori = () => {
    const f = parti.riempimenti[0];
    const u = parti.uniformi[0];
    riempimento.riga.hidden = !u;
    if (u) riempimento.input.value = tema?.riempimento ?? comeEsadecimale(originali.get(`${u}|fill-color`) ?? map.getPaintProperty(u, 'fill-color'));
    bordo.input.value = tema?.bordo ?? comeEsadecimale(originali.get(`${f}|fill-outline-color`) ?? map.getPaintProperty(f, 'fill-outline-color'), u ? riempimento.input.value : '#444444');
    const l = parti.linee[0];
    const w = tema?.spessore ?? originali.get(`${l}|line-width`) ?? (l && map.getPaintProperty(l, 'line-width'));
    spessore.value = String(typeof w === 'number' ? w : 1);
    vs.textContent = Number(spessore.value).toFixed(1);
    rigaSpessore.hidden = !parti.linee.length;
    costruisciCategorie();
    const orig = new Map(vociCategorie());
    for (const [nome, input] of campiCategorie) input.value = tema?.categorie?.[nome] ?? comeEsadecimale(orig.get(nome));
    aggiornaPallini();
  };

  const salva = () => {
    const temi = leggiTemi(storage);
    if (tema) temi[strato.id] = tema; else delete temi[strato.id];
    salvaTemi(storage, temi);
  };
  const applica = () => { applicaTema(map, parti, tema, originali); mostraValori(); };

  // I layer possono comparire dopo la costruzione del pannello: si rivaluta a ogni accensione e al primo idle.
  const aggiorna = () => {
    if (!parti.riempimenti.length) {
      parti = partiStrato(map, strato.layers);
      if (parti.riempimenti.length) stato.parti = parti; // si ricorda: con opacità 0 un riempimento sembrerebbe di sola selezione
    }
    bottone.hidden = !parti.riempimenti.length;
    if (parti.riempimenti.length) { tema = leggiTemi(storage)[strato.id] ?? null; applica(); }
  };

  // un campo entra nel tema solo se l'utente lo tocca: gli altri restano quelli originali
  for (const [campo, el] of [['riempimento', riempimento.input], ['bordo', bordo.input], ['spessore', spessore]]) {
    el.addEventListener('input', () => {
      const nuovo = { ...(tema ?? {}) };
      nuovo[campo] = campo === 'spessore' ? Number(el.value) : el.value;
      tema = validaTema(nuovo);
      applica();
      salva();
    });
  }

  reset.addEventListener('click', () => { tema = null; applica(); salva(); msg.textContent = 'Stile originale ripristinato'; });
  esporta.addEventListener('click', () => {
    const blob = new Blob([esportaTemi(leggiTemi(storage))], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'temi-strati.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    msg.textContent = 'Esportati i temi di tutti gli strati';
  });
  importa.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files[0];
    file.value = '';
    if (!f) return;
    try {
      const temi = importaTemi(await f.text());
      salvaTemi(storage, { ...leggiTemi(storage), ...temi });
      for (const r of registro.values()) r.ricarica();
      msg.textContent = `Importati ${Object.keys(temi).length} temi`;
    } catch (e) { msg.textContent = e.message; }
  });

  bottone.addEventListener('click', () => {
    pannello.hidden = !pannello.hidden;
    bottone.setAttribute('aria-expanded', String(!pannello.hidden));
    if (!pannello.hidden) mostraValori();
  });

  registro.set(strato.id, { ricarica: aggiorna });
  aggiorna();
  if (typeof map.once === 'function') map.once('idle', aggiorna);
  return { bottone, pannello, aggiorna };
}

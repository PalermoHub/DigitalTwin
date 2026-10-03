// Voci di legenda che fanno da filtro: una casella accanto al simbolo, sempre accesa all'inizio.
// Le legende stanno in #legende e compaiono solo a strato acceso; stile e struttura sono quelli di monumenti.
// Stato delle caselle di un gruppo dopo il clic sulla voce `k`: la voce diventa l'unica accesa; se era già l'unica accesa
// si torna a tutte accese. (Il clic non spegne una voce: per vederne due o più si usa «solo questa» e poi le altre.)
export function dopoClic(stati, k) {
  const soloQuesta = stati[k] && stati.every((acceso, i) => i === k || !acceso);
  return stati.map((_, i) => (soloQuesta ? true : i === k));
}

// Righe di filtro dello stesso gruppo (stesso contenitore) della riga data.
const gruppoDi = riga => [...(riga.parentElement?.children ?? [])].filter(r => r._filtro?.esclusivo);

// `esclusivo` = la voce fa parte di un gruppo di categorie in cui il clic seleziona solo quella; con false (o da sola nel
// gruppo) la casella accende e spegne la voce.
export function voceFiltro(simbolo, testo, suCambio, attiva = true, esclusivo = true) {
  const riga = document.createElement('label');
  riga.className = 'monumenti-cat';
  const casella = document.createElement('input');
  casella.type = 'checkbox';
  casella.checked = attiva;
  riga._filtro = { casella, suCambio, esclusivo };
  casella.addEventListener('change', () => {
    const gruppo = gruppoDi(riga);
    if (!esclusivo || gruppo.length < 2) return suCambio(casella.checked);
    const k = gruppo.indexOf(riga);
    const prima = gruppo.map((r, i) => (i === k ? !casella.checked : r._filtro.casella.checked));
    const dopo = dopoClic(prima, k);
    gruppo.forEach((r, i) => {
      const cambiato = r._filtro.casella.checked !== dopo[i];
      r._filtro.casella.checked = dopo[i];
      if (cambiato) r._filtro.suCambio(dopo[i]);
    });
  });
  riga.append(casella, simbolo, testo);
  return riga;
}

// Voce che coincide con un intero strato: la casella accende e spegne lo strato del pannello (e ne segue lo stato).
export function voceStrato(simbolo, testo, idStrato) {
  const strato = () => document.getElementById(`strato-${idStrato}`);
  const riga = voceFiltro(simbolo, testo, acceso => {
    const s = strato();
    if (s && s.checked !== acceso) { s.checked = acceso; s.dispatchEvent(new Event('change', { bubbles: true })); }
  }, Boolean(strato()?.checked), false);
  const casella = riga.querySelector('input');
  strato()?.addEventListener('change', e => { casella.checked = e.target.checked; });
  return riga;
}

// Filtro MapLibre «valore tra quelli attivi»; null se sono tutti attivi (nessun filtro).
export function filtroInsieme(espressione, attivi, totale) {
  return attivi.size >= totale ? null : ['in', espressione, ['literal', [...attivi]]];
}

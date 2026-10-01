// Preferenze dell'utente sulla scheda del luogo: quali sezioni e quali righe nascondere. Logica pura: il pannello sta in scheda.js,
// il browser (localStorage) arriva come parametro. Le sezioni si identificano per «tipo» (la chiave senza l'id: `arco-77` → `arco`),
// le righe per tipo ed etichetta (`arco/Pendenza media`): le etichette come «Quartiere» ricorrono in più sezioni.
export const CHIAVE_STORAGE = 'dt.scheda.nascosti';
const MAX_RIGHE_PER_TIPO = 60;

// Titolo fisso per i tipi il cui titolo cambia da luogo a luogo (il nome della via, della fermata, della scuola…)
const TITOLI_TIPO = {
  arco: 'Tratto stradale', hotspot: 'Hotspot incidenti', incidente: 'Incidente', fermata: 'Fermata', linee: 'Linee del trasporto',
  monumento: 'Monumento', scuola: 'Scuola o asilo', seggio: 'Sede elettorale', omi: 'Quotazioni OMI',
};

export const tipoSezione = s => s.tipo ?? String(s.chiave).replace(/[-:].*$/s, '');
const titoloTipo = s => TITOLI_TIPO[tipoSezione(s)] ?? s.titolo;
export const chiaveRiga = (tipo, etichetta) => `${tipo}/${etichetta}`;

const vuote = () => ({ nascoste: { sezioni: [], righe: [] }, visti: {} });
export const nessunaPreferenza = p => !p.nascoste.sezioni.length && !p.nascoste.righe.length;

const haContenuto = s =>
  s.gruppi.some(g => g.righe.length || g.griglia?.length) || s.accordion?.elementi?.length > 0 || s.link || s.testo || s.immagine || s.sempre;

// La scheda senza ciò che l'utente ha nascosto. Una sezione senza più righe né altro contenuto sparisce; il contesto non si tocca.
export function applicaPreferenze(dati, preferenze) {
  if (nessunaPreferenza(preferenze)) return dati;
  const sezioniNascoste = new Set(preferenze.nascoste.sezioni);
  const righeNascoste = new Set(preferenze.nascoste.righe);
  const sezioni = dati.sezioni
    .filter(s => !sezioniNascoste.has(tipoSezione(s)))
    .map(s => {
      const tipo = tipoSezione(s);
      const gruppi = s.gruppi
        .map(g => ({ ...g, righe: g.righe.filter(r => !righeNascoste.has(chiaveRiga(tipo, r.etichetta))) }))
        .filter(g => g.righe.length || g.griglia?.length);
      return { ...s, gruppi };
    })
    .filter(haContenuto);
  return { ...dati, sezioni, legale: dati.legale && sezioni.length > 0 };
}

// Ricorda i tipi e le righe incontrati nelle schede, per poterli elencare nel pannello anche quando non sono nella scheda aperta.
export function registraVisti(preferenze, sezioni) {
  const visti = { ...preferenze.visti };
  for (const s of sezioni) {
    const tipo = tipoSezione(s);
    const righe = [...(visti[tipo]?.righe ?? [])];
    for (const r of s.gruppi.flatMap(g => g.righe)) if (!righe.includes(r.etichetta) && righe.length < MAX_RIGHE_PER_TIPO) righe.push(r.etichetta);
    visti[tipo] = { titolo: titoloTipo(s), righe };
  }
  return { ...preferenze, visti };
}

export function elencoPannello(preferenze) {
  const sezioniNascoste = new Set(preferenze.nascoste.sezioni);
  const righeNascoste = new Set(preferenze.nascoste.righe);
  return Object.entries(preferenze.visti)
    .map(([tipo, v]) => ({
      tipo, titolo: v.titolo, visibile: !sezioniNascoste.has(tipo),
      righe: v.righe.map(etichetta => ({ etichetta, visibile: !righeNascoste.has(chiaveRiga(tipo, etichetta)) })),
    }))
    .sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'));
}

const senza = (elenco, valore) => elenco.filter(x => x !== valore);
const con = (elenco, valore) => (elenco.includes(valore) ? elenco : [...elenco, valore]);

export function commutaSezione(preferenze, tipo, visibile) {
  const { sezioni } = preferenze.nascoste;
  return { ...preferenze, nascoste: { ...preferenze.nascoste, sezioni: visibile ? senza(sezioni, tipo) : con(sezioni, tipo) } };
}

export function commutaRiga(preferenze, tipo, etichetta, visibile) {
  const chiave = chiaveRiga(tipo, etichetta);
  const { righe } = preferenze.nascoste;
  return { ...preferenze, nascoste: { ...preferenze.nascoste, righe: visibile ? senza(righe, chiave) : con(righe, chiave) } };
}

export const azzera = preferenze => ({ ...preferenze, nascoste: { sezioni: [], righe: [] } });

// `storage` = window.localStorage o null: se manca, è bloccato o contiene dati non validi la scheda funziona lo stesso, senza memoria.
export function leggiPreferenze(storage) {
  try {
    const grezzo = JSON.parse(storage?.getItem(CHIAVE_STORAGE) ?? 'null');
    if (!grezzo || typeof grezzo !== 'object') return vuote();
    const testi = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
    const visti = {};
    if (grezzo.visti && typeof grezzo.visti === 'object' && !Array.isArray(grezzo.visti)) {
      for (const [tipo, v] of Object.entries(grezzo.visti)) {
        if (v && typeof v.titolo === 'string') visti[tipo] = { titolo: v.titolo, righe: testi(v.righe).slice(0, MAX_RIGHE_PER_TIPO) };
      }
    }
    return { nascoste: { sezioni: testi(grezzo.nascoste?.sezioni), righe: testi(grezzo.nascoste?.righe) }, visti };
  } catch {
    return vuote();
  }
}

export function salvaPreferenze(storage, preferenze) {
  try {
    storage.setItem(CHIAVE_STORAGE, JSON.stringify(preferenze));
    return true;
  } catch {
    return false;
  }
}

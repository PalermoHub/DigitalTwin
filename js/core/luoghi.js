import { normalizza } from './indirizzi.js';

// Luoghi cercabili per nome: sorgente e strato da accendere quando si sceglie il risultato (`strato`: nome o funzione sulle proprietà;
// `zoom`: opzionale, altrimenti la ricerca zooma a 18; `numero`: funzione, per cercare una linea dal solo numero o sigla).
// L'ordine è anche quello di parità: scuole, sezioni elettorali, monumenti, fermate, linee, sedi, uffici.
export const FONTI = [
  { file: 'scuole/scuole.geojson', strato: 'scuole', nota: p => p.tipo, campi: p => [p.nome, p.indirizzo], sezioni: p => p.seggio_sezioni },
  { file: 'scuole/seggi.geojson', strato: 'seggi', nota: () => 'Sezioni elettorali', campi: p => [p.nome, p.indirizzo], sezioni: p => p.sezioni },
  { file: 'monumenti/monumenti.geojson', strato: 'monumenti', nota: p => p.categoria, campi: p => [p.nome] },
  { file: 'alberi_monumentali/alberi.geojson', strato: 'alberi', zoom: 18, nota: p => `Albero monumentale, ${p.localita}`, campi: p => [p.nome, p.specie, p.localita] },
  { file: 'fontanelle/fontanelle.geojson', strato: 'fontanelle', zoom: 18, nota: () => 'Fontanella', campi: p => ['Fontanella', p.indirizzo] },
  { file: 'trasporto/fermate.geojson', strato: 'trasporto-fermate', nota: p => `Fermata${p.linee.length ? `, linee ${p.linee.join(', ')}` : ''}`, campi: p => [p.nome] },
  // le linee si trovano per numero o nome; lo strato da accendere è bus o tram
  { file: 'trasporto/linee.geojson', strato: p => (p.tipo === 'tram' ? 'trasporto-tram' : 'trasporto-bus'), zoom: 14, numero: p => p.numero,
    nota: p => `${p.tipo === 'tram' ? 'Tram' : 'Bus'}, ${p.da} → ${p.a}`, campi: p => [`Linea ${p.numero} ${p.nome}`] },
  { file: 'colonnine/colonnine.geojson', strato: 'colonnine', zoom: 17, nota: p => `Colonnina ${p.stato.toLowerCase()}, ${p.potenza_kw} kW`, campi: p => [p.operatore, p.indirizzo] },
  // sedi degli uffici (es. «Polo Tecnico»), prima degli uffici che ospitano
  { file: 'uffici/sedi.geojson', strato: 'uffici', zoom: 17, nota: p => `Sede comunale, ${p.n_uffici} uffici`, campi: p => [p.nome, p.indirizzo] },
  // uffici comunali: per nome, sede o responsabile; le coordinate stanno nella geometria
  { file: 'uffici/uffici.geojson', strato: 'uffici', nota: p => [p.area, p.sede].filter(Boolean).join(' · '), campi: p => [p.nome, p.sede, p.indirizzo, p.responsabile] },
];

// features GeoJSON → voci con testo normalizzato (una sola volta, non a ogni tasto)
export function preparaLuoghi(fonti) {
  return fonti.flatMap(({ strato, zoom, numero, nota, campi, sezioni, features }, ordine) => features.map(f => {
    const p = { lon: f.geometry?.coordinates?.[0], lat: f.geometry?.coordinates?.[1], ...f.properties };
    const [nome, ...altri] = campi(p);
    return {
      etichetta: nome, nota: nota(p), strato: typeof strato === 'function' ? strato(p) : strato, zoom, numero: numero ? normalizza(String(numero(p))) : '', ordine, lon: p.lon, lat: p.lat,
      // «247*, 248» → numeri; le sezioni stanno nelle sedi di seggio e nelle scuole che le ospitano
      sezioni: (sezioni?.(p) ?? '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean),
      norm: normalizza(nome ?? ''), extra: normalizza(altri.filter(Boolean).join(' ')), extraOrig: altri.filter(Boolean).join(' '),
    };
  })).filter(v => v.norm && Number.isFinite(v.lon) && Number.isFinite(v.lat));
}

// Voci che contengono tutte le parole digitate (nel nome, o nell'indirizzo per scuole e sedi di seggio);
// prima quelle il cui nome inizia con il testo, poi quelle col nome più corto.
export function cercaLuoghi(voci, testo, max = 6) {
  const q = normalizza(testo);
  const risultato = (v, prefisso) => ({ etichetta: v.etichetta, nota: v.nota, strato: v.strato, zoom: v.zoom, lon: v.lon, lat: v.lat, prefisso });
  // «100», «N1»: la linea con quel numero (una sola voce per linea: le due direzioni hanno la stessa etichetta); vale anche sotto i 3 caratteri
  const viste = new Set();
  const linee = voci.filter(v => v.numero && v.numero === q && !viste.has(v.etichetta) && viste.add(v.etichetta)).map(v => risultato(v, true));
  // «248», «sez 248», «sezione 248»: la sede in cui vota quella sezione (i numeri vanno da 1 a circa 600)
  const sez = q.match(/^(?:(?:SEZ(?:IONE)?|SEGGIO) )?(\d{1,4})$/);
  if (sez) {
    const n = String(+sez[1]);
    const sedi = voci.filter(v => v.sezioni.includes(n)).slice(0, max)
      .map(v => ({ etichetta: `Sezione ${n} — ${v.etichetta}`, nota: v.extra ? `Sede elettorale, ${v.extraOrig}` : 'Sede elettorale', strato: v.strato, lon: v.lon, lat: v.lat, prefisso: true }));
    // un numero può essere sia una sezione sia una linea («100»): compaiono entrambe; senza nessuna delle due si cerca nel testo
    if (sedi.length || linee.length) return [...sedi, ...linee].slice(0, max);
  }
  const token = q.split(' ').filter(Boolean);
  if (q.length < 3) return linee;
  return voci
    .map(v => {
      const nome = token.every(t => v.norm.includes(t));
      const altrove = !nome && token.every(t => (v.norm + ' ' + v.extra).includes(t));
      return (nome || altrove) ? { v, prefisso: nome && v.norm.startsWith(q), nome } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.prefisso - a.prefisso || b.nome - a.nome || a.v.norm.length - b.v.norm.length || a.v.ordine - b.v.ordine)
    .slice(0, max)
    .map(({ v, prefisso }) => risultato(v, prefisso));
}

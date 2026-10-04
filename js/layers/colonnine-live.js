// Stato dal vivo delle colonnine: il file in dati/colonnine/ è il ripiego (aggiornato ogni ora da un workflow), lo snapshot della
// serie storica di PalermoHub/evcharginglogsicilia (raw.githubusercontent.com, CORS aperto) lo aggiorna all'apertura della mappa.
export const SNAPSHOT_URL = 'https://raw.githubusercontent.com/PalermoHub/evcharginglogsicilia/main/docs/evcharging_snapshot.json';

// Stesse tre classi di scripts/colonnine.py.
export function statoPunto(p) {
  if (p.stato !== 'Attivo') return 'Non attiva';
  return p.stato_raw === 'CHARGING' ? 'In ricarica' : 'Disponibile';
}

// Aggiorna in `dettagli` (id → proprietà) lo stato dei punti presenti nello snapshot; i punti assenti restano come sono.
// Restituisce { aggiornato, cambiati } oppure null se lo snapshot non è utilizzabile.
export function applicaSnapshot(dettagli, snapshot) {
  const punti = snapshot?.points;
  if (!Array.isArray(punti) || !punti.length) return null;
  let cambiati = 0;
  for (const s of punti) {
    const p = dettagli.get(s.id_evse);
    if (!p) continue;
    const stato = statoPunto(s);
    if (p.stato !== stato) { p.stato = stato; cambiati++; }
    p.tempo_reale = Boolean(s.real_time);
  }
  return { aggiornato: snapshot.generated_at ?? '', cambiati };
}

export function descriviAggiornamento(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function scaricaSnapshot(fetcher = fetch) {
  const r = await fetcher(SNAPSHOT_URL, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`snapshot colonnine: HTTP ${r.status}`);
  return r.json();
}

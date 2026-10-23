// Mini-mappa del mondo dei satelliti (nella legenda del layer): posizione reale di ogni satellite sulla Terra, traccia a terra dell'ISS e Palermo.
// Proiezione equirettangolare su un canvas; le terre emerse sono un Path2D (Natural Earth 1:110m, caricato solo alla prima accensione).

export const LARGHEZZA = 280;
const RAPPORTO = 2; // il mondo è largo il doppio dell'altezza
const COLORE_MARE = '#dbe7f0';
const COLORE_TERRA = '#f4f1e8';
const COLORE_CONTORNO = '#9aa5b1';
const COLORE_PALERMO = '#e03131';
const COLORE_TRACCIA = '#e8590c';

// Longitudine/latitudine → pixel del canvas
export const proietta = (lng, lat, larghezza = LARGHEZZA) => [((lng + 180) / 360) * larghezza, ((90 - lat) / 180) * (larghezza / RAPPORTO)];

let terre = null;
async function caricaTerre() {
  if (!terre) terre = import('./satelliti-mondo-terre.js').then(m => new Path2D(m.TERRE)).catch(() => null);
  return terre;
}

// `colori`: gruppo → colore. Restituisce { elemento, disegna(stato) }; `stato` = { satelliti: [{ lng, lat, gruppo, sopra, iss }], traccia: [[[lng, lat], …], …], palermo: [lng, lat] }.
export function creaMondo(colori) {
  const canvas = document.createElement('canvas');
  canvas.className = 'satelliti-mondo';
  canvas.setAttribute('role', 'img');
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  canvas.width = LARGHEZZA * dpr;
  canvas.height = (LARGHEZZA / RAPPORTO) * dpr;
  canvas.style.cssText = `width:100%;max-width:${LARGHEZZA}px;height:auto;aspect-ratio:${RAPPORTO}/1;display:block;border-radius:6px`;
  const g = canvas.getContext('2d');
  let ultimo = null;

  async function disegna(stato) {
    ultimo = stato;
    const terra = await caricaTerre();
    if (ultimo !== stato || !g) return; // un disegno più recente ha preso il posto di questo
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = COLORE_MARE;
    g.fillRect(0, 0, LARGHEZZA, LARGHEZZA / RAPPORTO);
    if (terra) {
      g.save();
      g.scale(LARGHEZZA / 360, LARGHEZZA / RAPPORTO / 180);
      g.fillStyle = COLORE_TERRA;
      g.strokeStyle = COLORE_CONTORNO;
      g.lineWidth = 0.4;
      g.fill(terra);
      g.stroke(terra);
      g.restore();
    }
    g.strokeStyle = 'rgba(0,0,0,.12)'; // equatore e meridiano di Greenwich
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(0, LARGHEZZA / RAPPORTO / 2); g.lineTo(LARGHEZZA, LARGHEZZA / RAPPORTO / 2);
    g.moveTo(LARGHEZZA / 2, 0); g.lineTo(LARGHEZZA / 2, LARGHEZZA / RAPPORTO);
    g.stroke();
    g.strokeStyle = COLORE_TRACCIA;
    g.lineWidth = 1.5;
    g.setLineDash([3, 2]);
    for (const linea of stato.traccia ?? []) {
      g.beginPath();
      linea.forEach(([lng, lat], i) => { const [x, y] = proietta(lng, lat); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    }
    g.setLineDash([]);
    // prima quelli sotto l'orizzonte (piccoli), poi quelli sopra Palermo (più grandi, col bordo bianco), per ultima l'ISS
    const ordinati = [...(stato.satelliti ?? [])].sort((a, b) => (a.iss ? 1 : 0) - (b.iss ? 1 : 0) || (a.sopra ? 1 : 0) - (b.sopra ? 1 : 0));
    for (const s of ordinati) {
      const [x, y] = proietta(s.lng, s.lat);
      g.fillStyle = colori[s.gruppo] ?? '#1971c2';
      g.beginPath();
      g.arc(x, y, s.iss ? 4 : s.sopra ? 3 : 1.6, 0, 2 * Math.PI);
      g.fill();
      if (s.sopra || s.iss) { g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); }
      if (s.iss) { g.fillStyle = '#212529'; g.font = 'bold 10px sans-serif'; g.fillText('ISS', x + 6, y - 5); }
    }
    if (stato.palermo) { // Palermo: pallino rosso con anello
      const [x, y] = proietta(...stato.palermo);
      g.strokeStyle = COLORE_PALERMO; g.lineWidth = 1.2;
      g.beginPath(); g.arc(x, y, 5, 0, 2 * Math.PI); g.stroke();
      g.fillStyle = COLORE_PALERMO;
      g.beginPath(); g.arc(x, y, 2, 0, 2 * Math.PI); g.fill();
    }
  }
  return { elemento: canvas, disegna };
}

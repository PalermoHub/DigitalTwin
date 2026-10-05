// js/geoimage/trasformazioni.js
// Georeferenziazione dai GCP: trasformazione affine (≥3 punti) o polinomiale di 2° grado (≥6), residui e RMSE.
// Un GCP è { px, py, lat, lng }: pixel dell'immagine e posizione sulla mappa. Portata da Geoimage (app.js, «Affine» e «Polynomial 2»).

export const TIPI = ['poly1', 'poly2'];
export const minimoGcp = tipo => (tipo === 'poly2' ? 6 : 3);

// Eliminazione di Gauss con pivot parziale; null se il sistema è singolare
export function risolvi(M, b) {
  const n = b.length;
  const A = M.map((riga, i) => [...riga, b[i]]);
  for (let col = 0; col < n; col++) {
    let mx = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[mx][col])) mx = r;
    [A[col], A[mx]] = [A[mx], A[col]];
    if (Math.abs(A[col][col]) < 1e-12) return null;
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      for (let k = col; k <= n; k++) A[r][k] -= f * A[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = A[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= A[i][j] * x[j];
    x[i] /= A[i][i];
  }
  return x;
}

// Minimi quadrati con le equazioni normali AᵗA·x = Aᵗb
function minimiQuadrati(A, b) {
  const n = A.length, m = A[0].length;
  const AtA = Array.from({ length: m }, () => new Array(m).fill(0));
  const Atb = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) AtA[i][j] += A[k][i] * A[k][j];
    for (let k = 0; k < n; k++) Atb[i] += A[k][i] * b[k];
  }
  return risolvi(AtA, Atb);
}

// lng = a·px + b·py + c, lat = d·px + e·py + f
export function calcolaAffine(gcp) {
  if (gcp.length < 3) return null;
  const A = gcp.map(g => [g.px, g.py, 1]);
  const l = minimiQuadrati(A, gcp.map(g => g.lng));
  const t = minimiQuadrati(A, gcp.map(g => g.lat));
  if (!l || !t) return null;
  return { a: l[0], b: l[1], c: l[2], d: t[0], e: t[1], f: t[2] };
}

// lng = a0 + a1·px + a2·py + a3·px² + a4·px·py + a5·py² (idem lat)
export function calcolaPoly2(gcp) {
  if (gcp.length < 6) return null;
  const A = gcp.map(g => [1, g.px, g.py, g.px * g.px, g.px * g.py, g.py * g.py]);
  const cLng = minimiQuadrati(A, gcp.map(g => g.lng));
  const cLat = minimiQuadrati(A, gcp.map(g => g.lat));
  if (!cLng || !cLat) return null;
  return { order: 2, cLng, cLat };
}

export const calcolaTrasformazione = (tipo, gcp) => (tipo === 'poly2' ? calcolaPoly2(gcp) : calcolaAffine(gcp));

export function applica(t, px, py) {
  if (t.order === 2) {
    const v = [1, px, py, px * px, px * py, py * py];
    return { lng: t.cLng.reduce((s, c, i) => s + c * v[i], 0), lat: t.cLat.reduce((s, c, i) => s + c * v[i], 0) };
  }
  return { lng: t.a * px + t.b * py + t.c, lat: t.d * px + t.e * py + t.f };
}

function inversaAffine(t, lng, lat) {
  const det = t.a * t.e - t.b * t.d;
  if (Math.abs(det) < 1e-15) return null;
  const dl = lng - t.c, db = lat - t.f;
  return { px: (t.e * dl - t.b * db) / det, py: (-t.d * dl + t.a * db) / det };
}

// Inversa di poly2 con Newton-Raphson, partendo dalla parte lineare
function inversaPoly2(t, lng, lat) {
  const lineare = { a: t.cLng[1], b: t.cLng[2], c: t.cLng[0], d: t.cLat[1], e: t.cLat[2], f: t.cLat[0] };
  const inizio = inversaAffine(lineare, lng, lat);
  let px = inizio ? inizio.px : 0, py = inizio ? inizio.py : 0;
  for (let i = 0; i < 50; i++) {
    const g = applica(t, px, py);
    const dl = g.lng - lng, db = g.lat - lat;
    if (Math.abs(dl) < 1e-11 && Math.abs(db) < 1e-11) break;
    const J00 = t.cLng[1] + 2 * t.cLng[3] * px + t.cLng[4] * py;
    const J01 = t.cLng[2] + t.cLng[4] * px + 2 * t.cLng[5] * py;
    const J10 = t.cLat[1] + 2 * t.cLat[3] * px + t.cLat[4] * py;
    const J11 = t.cLat[2] + t.cLat[4] * px + 2 * t.cLat[5] * py;
    const det = J00 * J11 - J01 * J10;
    if (Math.abs(det) < 1e-15) break;
    px -= (J11 * dl - J01 * db) / det;
    py -= (-J10 * dl + J00 * db) / det;
  }
  return { px, py };
}

export const inversa = (t, lng, lat) => (t.order === 2 ? inversaPoly2(t, lng, lat) : inversaAffine(t, lng, lat));

// Errore di ogni GCP in metri
export function residui(t, gcp) {
  return gcp.map(g => {
    const p = applica(t, g.px, g.py);
    const dLat = (p.lat - g.lat) * 111320;
    const dLng = (p.lng - g.lng) * 111320 * Math.cos(g.lat * Math.PI / 180);
    return Math.hypot(dLat, dLng);
  });
}

export const rmse = res => Math.sqrt(res.reduce((s, r) => s + r * r, 0) / res.length);

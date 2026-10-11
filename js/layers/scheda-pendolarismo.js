// Modello puro del pendolarismo per lavoro da e verso Palermo (ISTAT, Censimento permanente 2021): totali, classifiche,
// scheda e tooltip. Il disegno (riquadri, barre) sta in scheda-pendolarismo-dom.js e arriva da `voce.dinamico`.
import { localeIntl, t, tl } from '../core/i18n.js';

export const FONTE = 'ISTAT, Censimento permanente della popolazione e delle abitazioni 2021, matrice di pendolarismo per lavoro (CC BY 4.0); mappa originale di PalermoHub';
export const NOTA = 'Dati al 31 dicembre 2021, in piena pandemia: gli spostamenti possono riflettere il lavoro agile. I comuni sono rappresentati dal centroide e l\'arco non è il percorso reale.';
export const SITO = 'https://palermohub.github.io/Pendolarismo_2021/';
export const COLORE_ENTRATA = '#3d7fff';
export const COLORE_USCITA = '#ff4400';
export const COLORE_PALERMO = '#7c3aed';
export const MAX_CLASSIFICA = 25; // come l'app originale: i primi 25 collegamenti...
export const QUOTA_MINIMA = 1; // ...se pesano almeno l'1% del totale della direzione

const num = v => Number(v).toLocaleString(localeIntl());
export const conSegno = n => `${n >= 0 ? '+' : '−'}${num(Math.abs(n))}`;
export const quota = (n, totale) => (totale > 0 ? Math.round((n / totale) * 1000) / 10 : 0);
export const percentuale = q => `${Number(q).toLocaleString(localeIntl(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const comuni = nodi => nodi.filter(n => n.tipo === 'comune');

// Palermo è il nodo `palermo`; gli altri sono i comuni collegati. Quote: vive qui = interni/(interni+uscita),
// lavora altrove = uscita/(interni+uscita), posti coperti da pendolari = entrata/(interni+entrata).
export function riepilogo(nodi) {
  const interni = nodi.find(n => n.tipo === 'palermo')?.interni ?? 0;
  const uscita = comuni(nodi).reduce((s, c) => s + c.uscita, 0);
  const entrata = comuni(nodi).reduce((s, c) => s + c.entrata, 0);
  const residenti = interni + uscita;
  const posti = interni + entrata;
  return {
    interni, uscita, entrata, saldo: entrata - uscita, residenti, posti,
    quotaViveQui: quota(interni, residenti), quotaAltrove: quota(uscita, residenti), quotaPostiDaFuori: (posti > 0 ? (entrata / posti) * 100 : 0),
  };
}

// Comuni con più pendolari nella direzione data, con la quota sul totale della direzione.
export function classifica(nodi, direzione, { tutti = false } = {}) {
  const totale = comuni(nodi).reduce((s, c) => s + c[direzione], 0);
  const ordinati = comuni(nodi).filter(c => c[direzione] > 0).sort((a, b) => b[direzione] - a[direzione])
    .map(c => ({ codice: c.codice, nome: c.nome, valore: c[direzione], quota: quota(c[direzione], totale) }));
  return tutti ? ordinati : ordinati.filter(d => d.quota >= QUOTA_MINIMA).slice(0, MAX_CLASSIFICA);
}

// Gli scarti più grandi tra entrata e uscita (positivo = polo di lavoro verso Palermo), dal saldo più alto al più basso.
export function saldoPerComune(nodi, n = 10) {
  return comuni(nodi).filter(c => c.saldo !== 0)
    .sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo)).slice(0, n)
    .sort((a, b) => b.saldo - a.saldo)
    .map(c => ({ codice: c.codice, nome: c.nome, saldo: c.saldo }));
}

// La scheda di destra; `dinamico` costruisce riquadri e barre (vedi scheda-pendolarismo-dom.js). Se si è cliccato un
// comune, in testa compare un gruppo con i suoi numeri.
export function voceScheda(nodi, dinamico, cliccato) {
  const gruppi = cliccato?.tipo === 'comune'
    ? [{ titolo: cliccato.nome, righe: [
      { etichetta: 'Entrata (lavorano a Palermo)', valore: num(cliccato.entrata) },
      { etichetta: 'Uscita (residenti di Palermo)', valore: num(cliccato.uscita) },
      { etichetta: 'Saldo (entrata − uscita)', valore: conSegno(cliccato.saldo) },
    ] }]
    : [];
  return {
    chiave: 'pendolarismo', peso: 70, strato: 'pendolarismo', titolo: 'Pendolarismo per lavoro', icona: 'treno',
    badge: '2021', gruppi, dinamico: () => dinamico(nodi),
    link: [{ testo: 'Apri la mappa originale', icona: 'esterno', url: SITO }],
    nota: NOTA, fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloTooltipPendolarismo(p) {
  if (p.tipo === 'palermo') return { titolo: p.nome, pallino: COLORE_PALERMO, badge: { testo: tl('Vivono e lavorano qui') + ` ${num(p.interni)}`, colore: COLORE_PALERMO } };
  const colore = p.saldo >= 0 ? COLORE_ENTRATA : COLORE_USCITA;
  return { titolo: p.nome, pallino: colore, badge: { testo: `${tl('Saldo')} ${conSegno(p.saldo)}`, colore } };
}

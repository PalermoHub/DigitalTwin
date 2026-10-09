import { chiaveLuogo } from '../core/scheda-modello.js';
import { t, tl } from '../core/i18n.js';

// Modello puro del monumento: stessi campi per la voce della scheda di destra e per il popup sulla mappa.
// `risolvi` trasforma il percorso relativo della foto (dentro dati/monumenti/) in URL; le foto già assolute
// (luoghi della Mappa monumentale, ospitate altrove) restano come sono.

const FONTE_COMUNE = 'Portale del Turismo — Comune di Palermo';
// Beni che la descrizione dà per scomparsi ma di cui resta qualcosa (id): niente avviso. Per ora nessuno.
const ANCORA_PRESENTI = new Set();
// Solo l'inizio della descrizione conta: «Fonderia Di Maggio 1887 non esistente» parla della fonderia che ha fuso la
// fontanella (che c'è), e «Scalone scomparso nel 1830» è storia di un edificio che oggi esiste.
const SCOMPARSO = /^\s*(non\s+(più\s+)?esistente|demolit[aoie]|abbattut[aoie]|distrutt[aoie])\b/i;

export function beneScomparso(p) {
  return !ANCORA_PRESENTI.has(p.id) && SCOMPARSO.test(p.descrizione ?? '');
}

export const idScomparsi = lista => lista.filter(beneScomparso).map(p => p.id);

// Filtro dei poligoni: solo le categorie accese, e mai l'edificio di oggi di un bene non più presente (il poligono
// abbinato per posizione è un altro edificio: il Teatro Massimo non deve rispondere «Chiesa delle Teatine»).
export function filtroEdifici(categorie, scomparsi) {
  const accese = ['in', ['get', 'categoria'], ['literal', categorie]];
  return scomparsi.length ? ['all', accese, ['!', ['in', ['get', 'id'], ['literal', scomparsi]]]] : accese;
}

// Se la descrizione è solo la frase «non più esistente» l'avviso la sostituisce; se aggiunge il motivo la conserva.
const soloFrase = d => /^\s*non\s+(più\s+)?esistente\s*[.!]?\s*$/i.test(d);

const urlFoto = (rel, risolvi) => (/^https?:/.test(rel) ? rel : risolvi(rel));

export function voceMonumento(p, risolvi) {
  const voce = {
    chiave: `monumento-${p.id}`,
    peso: 5,
    strato: 'monumenti',
    luogo: chiaveLuogo(p.nome),
    titolo: p.nome,
    icona: 'monumento',
    badge: p.categoria,
    gruppi: [],
    fonte: t('layer.fonte', { fonte: tl(p.fonte ?? FONTE_COMUNE) }),
  };
  if (p.url) voce.link = { testo: 'Vai al sito del Comune', url: p.url, icona: 'esterno', suggerimento: 'Portale del Turismo del Comune di Palermo' };
  if (p.foto) voce.immagine = { url: urlFoto(p.foto, risolvi), alt: p.nome };
  if (p.descrizione && !(beneScomparso(p) && soloFrase(p.descrizione))) voce.testo = p.descrizione;
  if (beneScomparso(p)) voce.avviso = { etichetta: t('monumento.scomparso.etichetta'), testo: t('monumento.scomparso.avviso') };
  return voce;
}

export function modelloPopup(p, risolvi) {
  return {
    titolo: p.nome,
    categoria: p.categoria,
    foto: p.foto ? urlFoto(p.foto, risolvi) : null,
    descrizione: (beneScomparso(p) && soloFrase(p.descrizione)) ? null : (p.descrizione || null),
    url: p.url || null,
    fonte: p.fonte ?? FONTE_COMUNE,
    scomparso: beneScomparso(p),
  };
}

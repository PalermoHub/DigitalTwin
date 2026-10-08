// «Condividi»: crea il link con la vista corrente e lo offre per copia, menu nativo e reti social.
// All'apertura di un link condiviso la vista viene riapplicata da app.js (vedi condivisione-stato.js).
import { codifica, decodifica, costruisciLink, PARAMETRO } from './condivisione-codec.js';
import { RETI, TESTO_CONDIVISIONE } from './condivisione-reti.js';
import { installaOverlay } from './condivisione-storage.js';
import { raccogli, applica } from './condivisione-stato.js';
import { svgIcona } from './icone.js';
import { t as tr } from './i18n.js';

const ICONA_X = svgIcona('chiudi', 16);

// Va chiamata prima di costruire i pannelli: se la pagina arriva da un link condiviso, installa l'overlay del
// localStorage con le preferenze del mittente. Senza `?v=` non cambia nulla.
export async function preparaCondivisione(finestra) {
  const grezzo = new URLSearchParams(finestra.location.search).get(PARAMETRO);
  if (!grezzo) return { stato: null, invalido: false };
  const stato = await decodifica(grezzo);
  if (!stato) return { stato: null, invalido: true };
  const iniziali = Object.fromEntries(Object.entries(stato.s ?? {}).map(([k, v]) => [k, JSON.stringify(v)]));
  installaOverlay(finestra, iniziali);
  return { stato, invalido: false };
}

async function copia(testo) {
  try { await navigator.clipboard.writeText(testo); return true; } catch { /* senza permesso si ripiega sulla selezione */ }
  const t = document.createElement('textarea');
  t.value = testo;
  document.body.append(t);
  t.select();
  const ok = document.execCommand('copy');
  t.remove();
  return ok;
}

const el = (tag, props = {}, ...figli) => { const e = Object.assign(document.createElement(tag), props); e.append(...figli); return e; };

export function collegaCondivisione(map, bottone, { storage }) {
  const campo = el('input', { type: 'text', readOnly: true });
  campo.setAttribute('aria-label', tr('condividi.link'));
  const copiaBtn = el('button', { type: 'button', textContent: tr('condividi.copia') });
  const nativo = navigator.share ? el('button', { type: 'button', textContent: tr('condividi.nativo') }) : null;
  const reti = el('div', { className: 'condividi-reti' });
  const nota = el('p', { className: 'condividi-nota', hidden: true });
  nota.setAttribute('role', 'status');
  const chiudiBtn = el('button', { type: 'button', className: 'condividi-chiudi', title: tr('comune.chiudi'), innerHTML: ICONA_X });
  chiudiBtn.setAttribute('aria-label', tr('comune.chiudi'));
  const menu = el('div', { id: 'condividi-menu', hidden: true },
    el('div', { className: 'condividi-testa' }, el('h2', { textContent: tr('html.btn.condividi') }), chiudiBtn), el('div', { className: 'condividi-link' }, campo, copiaBtn), ...(nativo ? [nativo] : []), reti, nota);
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', tr('html.btn.condividi'));
  document.body.append(menu);

  async function link() {
    const { stato, scartati } = raccogli(document, map, storage);
    const { testo, troncato } = await codifica(stato);
    return { link: costruisciLink(location.href, testo), troncato, scartati };
  }

  const chiudi = () => { menu.hidden = true; bottone.setAttribute('aria-expanded', 'false'); };
  async function apri() {
    const r = await link();
    campo.value = r.link;
    reti.replaceChildren(...RETI.map(rete => {
      const a = el('a', { className: 'condividi-rete', href: rete.url(r.link, TESTO_CONDIVISIONE), target: '_blank', rel: 'noopener noreferrer', title: tr('condividi.su', { rete: rete.nome }), innerHTML: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="${rete.icona}"/></svg>` });
      a.setAttribute('aria-label', tr('condividi.su', { rete: rete.nome }));
      return a;
    }));
    const avvisi = [];
    if (r.scartati) avvisi.push(tr('condividi.scartati', { n: r.scartati }));
    if (r.troncato) avvisi.push(tr('condividi.troncato'));
    nota.textContent = avvisi.join(' ');
    nota.hidden = !avvisi.length;
    menu.hidden = false;
    bottone.setAttribute('aria-expanded', 'true');
    campo.focus();
    campo.select();
  }

  bottone.addEventListener('click', () => (menu.hidden ? apri() : chiudi()));
  chiudiBtn.addEventListener('click', () => { chiudi(); bottone.focus(); });
  copiaBtn.addEventListener('click', async () => {
    copiaBtn.textContent = (await copia(campo.value)) ? tr('scheda.copiato') : tr('condividi.selezionaECopia');
    setTimeout(() => { copiaBtn.textContent = tr('condividi.copia'); }, 1800);
  });
  nativo?.addEventListener('click', () => navigator.share({ title: TESTO_CONDIVISIONE, url: campo.value }).catch(() => { /* annullata dall'utente */ }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { chiudi(); bottone.focus(); } });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !bottone.contains(e.target)) chiudi(); });

  return { stato: () => raccogli(document, map, storage), applica: s => applica(s, document, map), link };
}

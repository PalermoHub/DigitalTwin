// Finestra «Condividi»: campo con il link, copia, menu nativo e reti social. Sta qui perché la usano sia la mappa
// (link con la vista corrente) sia le pagine statiche (link alla pagina); chi la usa passa solo come ottenere il link.
import { RETI, TESTO_CONDIVISIONE } from './condivisione-reti.js';
import { accorcia } from './condivisione-corto.js';
import { svgIcona } from './icone.js';
import { t as tr } from './i18n.js';

const ICONA_X = svgIcona('chiudi', 16);

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

// `ottieniLink` risponde { link, troncato?, scartati? }; con `corto` il link lungo viene sostituito, se il Worker risponde, da quello corto.
export function collegaMenuCondivisione(bottone, ottieniLink, { corto = true, chiaveLink = 'condividi.link', chiaveTitolo = 'html.btn.condividi' } = {}) {
  const campo = el('input', { type: 'text', readOnly: true });
  campo.setAttribute('aria-label', tr(chiaveLink));
  const copiaBtn = el('button', { type: 'button', textContent: tr('condividi.copia') });
  const nativo = navigator.share ? el('button', { type: 'button', textContent: tr('condividi.nativo') }) : null;
  const reti = el('div', { className: 'condividi-reti' });
  const nota = el('p', { className: 'condividi-nota', hidden: true });
  nota.setAttribute('role', 'status');
  const chiudiBtn = el('button', { type: 'button', className: 'condividi-chiudi', title: tr('comune.chiudi'), innerHTML: ICONA_X });
  chiudiBtn.setAttribute('aria-label', tr('comune.chiudi'));
  const menu = el('div', { id: 'condividi-menu', hidden: true },
    el('div', { className: 'condividi-testa' }, el('h2', { textContent: tr(chiaveTitolo) }), chiudiBtn), el('div', { className: 'condividi-link' }, campo, copiaBtn), ...(nativo ? [nativo] : []), reti, nota);
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', tr(chiaveTitolo));
  document.body.append(menu);

  const chiudi = () => { menu.hidden = true; bottone.setAttribute('aria-expanded', 'false'); };
  function mostra(indirizzo) {
    campo.value = indirizzo;
    reti.replaceChildren(...RETI.map(rete => {
      const a = el('a', { className: 'condividi-rete', href: rete.url(indirizzo, TESTO_CONDIVISIONE), target: '_blank', rel: 'noopener noreferrer', title: tr('condividi.su', { rete: rete.nome }), innerHTML: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="${rete.icona}"/></svg>` });
      a.setAttribute('aria-label', tr('condividi.su', { rete: rete.nome }));
      return a;
    }));
  }

  async function apri() {
    const r = await ottieniLink();
    mostra(r.link);
    const avvisi = [];
    if (r.scartati) avvisi.push(tr('condividi.scartati', { n: r.scartati }));
    if (r.troncato) avvisi.push(tr('condividi.troncato'));
    nota.textContent = avvisi.join(' ');
    nota.hidden = !avvisi.length;
    menu.hidden = false;
    bottone.setAttribute('aria-expanded', 'true');
    campo.focus();
    campo.select();
    // il link lungo è già pronto e copiabile; se il Worker risponde in fretta lo si sostituisce con quello corto
    if (!corto) return;
    const breve = await accorcia(r.link);
    if (breve && !menu.hidden && campo.value === r.link) { mostra(breve); campo.select(); }
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
}

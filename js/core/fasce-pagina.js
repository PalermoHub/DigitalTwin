// Impagina i nodi di una scheda informativa a fasce, come la home (sfondi alternati, titolo h2 per fascia).
// Il primo h2 e la frase introduttiva aprono la pagina (h1). Un h2 con classe è un gruppo:
//  - di norma una fascia con le schede come h3;
//  - con `etichette`, il nome del gruppo è un'etichetta sopra il titolo e ogni scheda ha la sua fascia.
// Ogni scheda fuori da un gruppo diventa una fascia con il suo titolo h2. Con `indice` si aggiunge l'indice
// delle fasce (fisso a destra sugli schermi larghi, sotto l'introduzione su quelli stretti), come nella Guida.
export function impaginaFasce(nodi, corpo, { indice = false, etichette = false } = {}) {
  let conta = 0;
  const fascia = (classe = '') => {
    const f = document.createElement('section');
    f.className = `fascia home-perche ${conta++ % 2 ? 'fascia--alt' : ''} ${classe}`.replace(/\s+/g, ' ').trim();
    const dentro = document.createElement('div');
    dentro.className = 'fascia-in';
    f.append(dentro);
    return { f, dentro };
  };
  const intro = fascia('home-intro');
  const voci = []; // per l'indice: { gruppo } oppure { titolo, fascia }
  let gruppo = null;
  let etichetta = null;
  const nuovaScheda = n => {
    const f = fascia();
    const h3 = n.querySelector('h3');
    const h2 = document.createElement('h2');
    h2.textContent = h3.textContent;
    h3.replaceWith(h2);
    if (etichetta) {
      const k = document.createElement('p');
      k.className = 'guida-kicker';
      k.textContent = etichetta;
      f.dentro.append(k);
    }
    f.dentro.append(n); // la scheda resta nella fascia: le regole di `.info-blocco` (figure alla larghezza della colonna) valgono ancora
    f.f.id = n.id || `fascia-${conta}`;
    n.removeAttribute('id'); // l'indirizzo è quello della fascia
    corpo.append(f.f);
    voci.push({ titolo: h2.textContent, fascia: f.f });
  };
  for (const n of nodi) {
    if (!n.nodeType) continue; // i {gruppo} dell'indice del modale non servono qui
    if (n.tagName === 'H2' && !n.className) { const h1 = document.createElement('h1'); h1.textContent = n.textContent; intro.dentro.append(h1); }
    else if (n.className === 'pagina-intro') intro.dentro.append(n);
    else if (n.tagName === 'H2' && etichette) { etichetta = n.textContent; voci.push({ gruppo: etichetta }); }
    else if (n.tagName === 'H2') { gruppo = fascia(); n.removeAttribute('class'); gruppo.dentro.append(n); corpo.append(gruppo.f); }
    else if (gruppo) gruppo.dentro.append(n);
    else nuovaScheda(n);
  }
  corpo.prepend(intro.f);
  if (!indice) return;
  const nav = document.createElement('nav');
  nav.className = 'guida-indice';
  const ol = document.createElement('ol');
  for (const { titolo, fascia: f, gruppo: g } of voci) {
    const li = document.createElement('li');
    if (g) { li.className = 'guida-indice-gruppo'; li.textContent = g; ol.append(li); continue; }
    const a = document.createElement('a');
    a.href = `#${f.id}`;
    a.textContent = titolo;
    a.addEventListener('click', e => { e.preventDefault(); f.scrollIntoView({ block: 'start' }); });
    li.append(a);
    ol.append(li);
  }
  nav.append(ol);
  intro.dentro.append(nav);
  corpo.classList.add('pagina-guida');
}

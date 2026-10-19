// Impagina i nodi di una scheda informativa a fasce, come la home (sfondi alternati, titolo h2 per fascia).
// Il primo h2 e la frase introduttiva aprono la pagina (h1); un h2 con classe è un gruppo (una fascia con le schede come h3);
// ogni scheda fuori da un gruppo diventa una fascia con il suo titolo h2.
export function impaginaFasce(nodi, corpo) {
  let conta = 0;
  const fascia = (id, classe = '') => {
    const f = document.createElement('section');
    f.className = `fascia home-perche ${conta++ % 2 ? 'fascia--alt' : ''} ${classe}`.replace(/\s+/g, ' ').trim();
    if (id) f.id = id;
    const dentro = document.createElement('div');
    dentro.className = 'fascia-in';
    f.append(dentro);
    return { f, dentro };
  };
  let gruppo = null;
  const intro = fascia(null, 'home-intro');
  for (const n of nodi) {
    if (n.tagName === 'H2' && !n.className) { const h1 = document.createElement('h1'); h1.textContent = n.textContent; intro.dentro.append(h1); }
    else if (n.className === 'pagina-intro') { intro.dentro.append(n); }
    else if (n.tagName === 'H2') { gruppo = fascia(null); n.removeAttribute('class'); gruppo.dentro.append(n); corpo.append(gruppo.f); }
    else if (gruppo) { gruppo.dentro.append(n); }
    else {
      const f = fascia(null);
      const h3 = n.querySelector('h3');
      const h2 = document.createElement('h2');
      h2.textContent = h3.textContent;
      h3.replaceWith(h2);
      f.dentro.append(...n.childNodes);
      corpo.append(f.f);
    }
  }
  corpo.prepend(intro.f);
}

// Script classico (non modulo) in fondo al corpo di ogni pagina: rimette subito il menu della testata e i testi del piede
// salvati all'ultima visita, così al cambio pagina non restano vuoti finché i dizionari e i moduli non sono arrivati.
// Poi i moduli rifanno tutto come prima (e quando serve aggiornano la copia). Senza copia o con lingua diversa non fa nulla.
(function () {
  try {
    var CHIAVE = 'dt-testata';
    var lingua = localStorage.getItem('dt-lingua') || '';
    var nav = document.getElementById('menu-info');
    var copy = document.getElementById('piede-copyright');
    var avviso = document.querySelector('#app-footer .piede-avviso');
    var vuoto = function (el) { return !el || !el.firstChild; };
    var copia = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
    if (copia && copia.l === lingua) {
      if (vuoto(nav) && copia.menu && nav) {
        nav.innerHTML = copia.menu;
        var pagina = location.pathname.split('/').pop() || 'index.html';
        nav.querySelectorAll('[aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
        var voce = nav.querySelector('a[href="' + pagina + '"]');
        if (voce) voce.setAttribute('aria-current', 'page');
      }
      if (vuoto(copy) && copia.copy && copy) copy.innerHTML = copia.copy;
      if (avviso && copia.avviso) avviso.innerHTML = copia.avviso;
    }
    // a pagina finita si ricorda lo stato definitivo (il menu solo dalle pagine statiche: nella mappa le voci sono pulsanti)
    window.addEventListener('load', function () {
      setTimeout(function () {
        try {
          var nuova = { l: localStorage.getItem('dt-lingua') || '', menu: '', copy: copy ? copy.innerHTML : '', avviso: avviso ? avviso.innerHTML : '' };
          if (nav && nav.children.length > 3 && !nav.querySelector('button[data-scheda]')) nuova.menu = nav.innerHTML;
          else if (copia && copia.l === nuova.l) nuova.menu = copia.menu || '';
          if (nuova.copy) localStorage.setItem(CHIAVE, JSON.stringify(nuova));
        } catch (e) { /* storage non disponibile */ }
      }, 1200);
    });
  } catch (e) { /* storage non disponibile: la testata si riempie come sempre */ }
})();

// Consenso a Google Analytics (GDPR + ePrivacy): lo script di Google si carica solo dopo «Accetta».
// Script classico, condiviso da index.html e presentazione.html. La scelta sta in localStorage ('dt-consenso').
(function () {
  var ID = 'G-JFYEGEZ41L', CHIAVE = 'dt-consenso', banner = null;
  var leggi = function () { try { return localStorage.getItem(CHIAVE); } catch (e) { return null; } };
  var scrivi = function (v) { try { localStorage.setItem(CHIAVE, v); } catch (e) { /* storage non disponibile: la scelta vale per questa pagina */ } };

  function avviaAnalytics() {
    if (window.gtag) return;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }

  function fermaAnalytics() {
    window['ga-disable-' + ID] = true;
    var domini = [location.hostname, '.' + location.hostname];
    document.cookie.split(';').forEach(function (c) {
      var nome = c.split('=')[0].trim();
      if (nome !== '_ga' && nome.indexOf('_ga_') !== 0) return;
      domini.forEach(function (d) { document.cookie = nome + '=; Max-Age=0; path=/; domain=' + d; });
      document.cookie = nome + '=; Max-Age=0; path=/';
    });
  }

  function scegli(v) {
    scrivi(v);
    if (banner) { banner.remove(); banner = null; }
    if (v === 'si') avviaAnalytics(); else fermaAnalytics();
  }

  function mostra() {
    if (banner) return;
    var css = document.createElement('style');
    css.textContent = '#dt-consenso{position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;z-index:2147483000;padding:16px 18px;border-radius:12px;'
      + 'background:#fff;color:#1b1f24;border:1px solid #cfd4da;box-shadow:0 8px 28px rgba(0,0,0,.25);font:14px/1.45 Montserrat,system-ui,sans-serif}'
      + ':root[data-tema="scuro"] #dt-consenso{background:#1c2128;color:#e6e9ed;border-color:#3a4450}'
      + '#dt-consenso p{margin:0 0 12px}#dt-consenso a{color:inherit;text-decoration:underline}'
      + '#dt-consenso div{display:flex;gap:10px;flex-wrap:wrap}'
      + '#dt-consenso button{flex:1 1 140px;min-height:44px;padding:8px 14px;border-radius:8px;border:2px solid #b45309;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}'
      + '#dt-consenso button:focus-visible{outline:3px solid #f5a623;outline-offset:2px}';
    banner = document.createElement('div');
    banner.id = 'dt-consenso';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consenso ai cookie statistici');
    banner.innerHTML = '<p>Usiamo Google Analytics, con cookie, per contare le visite in forma aggregata. '
      + 'Parte solo se acconsenti; puoi cambiare idea in ogni momento. '
      + '<a href="' + (document.querySelector('#menu-info') ? '#privacy' : 'index.html#privacy') + '">Informativa privacy</a>.</p>'
      + '<div><button type="button" data-v="no">Rifiuta</button><button type="button" data-v="si">Accetta</button></div>';
    banner.addEventListener('click', function (e) { var v = e.target.dataset && e.target.dataset.v; if (v) scegli(v); });
    document.head.appendChild(css);
    document.body.appendChild(banner);
  }

  window.dtConsenso = { riapri: mostra, stato: leggi };
  var v = leggi();
  if (v === 'si') avviaAnalytics();
  else if (v !== 'no') document.addEventListener('DOMContentLoaded', mostra);
})();

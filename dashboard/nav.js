/* ════════════════════════════════════════════════════════════
   Papaya Juice — Navigation unifiée + fond animé (nav.js)
   Inclure sur chaque page :  <script src="/dashboard/nav.js" defer></script>
   • Fond : halo orange animé (cohérent partout)
   • Nav  : MASQUÉE par défaut → bouton « Menu » l'ouvre, « Masquer » la ferme
   • commandes-live : pas de nav (fond animé seulement)
   ════════════════════════════════════════════════════════════ */
(function () {
  function init() {
    if (document.getElementById('pnav-root') || document.getElementById('pnav-glow')) return;

    var glowOnly = /commandes-live/.test(location.pathname);

    var LINKS = [
      ['/dashboard',                       'Tableau de bord', '\u25A6'],
      ['/dashboard/commandes-live',        'Commandes Live',  '\uD83D\uDD14'],
      ['/dashboard/admin',                 'Produits',        '\uD83E\uDDFE'],
      ['/dashboard/categories',            'Catégories',      '\uD83D\uDDC2'],
      ['/dashboard/extras',                'Extras',          '\u2795'],
      ['/dashboard/stock',                 'Stock',           '\uD83D\uDCE6'],
      ['/dashboard/recettes',              'Recettes',        '\uD83D\uDCD6'],
      ['/dashboard/personnel',             'Personnel',       '\uD83D\uDC65'],
      ['/dashboard/rapport-commandes',     'Rapports',        '\uD83D\uDCCA'],
      ['/dashboard/reclamations',          'Réclamations',    '\u26A0'],
      ['/dashboard/qr-tables',             'QR Tables',       '\uD83D\uDD33'],
      ['/dashboard/historique-clotures',   'Clôtures',        '\uD83D\uDCC1'],
      ['/dashboard/parametres-impression', 'Impression',      '\uD83D\uDDA8']
    ];
    var path = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/dashboard';

    var css = ''
      + '@keyframes pnavGlow{0%{transform:translate3d(-12vw,-9vh,0) scale(1);opacity:.5}'
      + '33%{transform:translate3d(10vw,7vh,0) scale(1.35);opacity:.85}'
      + '66%{transform:translate3d(-7vw,12vh,0) scale(1.12);opacity:.6}'
      + '100%{transform:translate3d(-12vw,-9vh,0) scale(1);opacity:.5}}'
      + '#pnav-glow{position:fixed;top:50%;left:50%;width:74vw;height:74vw;margin:-37vw 0 0 -37vw;'
      + 'background:radial-gradient(circle,rgba(226,112,26,.20) 0%,rgba(226,112,26,.07) 32%,transparent 60%);'
      + 'pointer-events:none;z-index:-1;animation:pnavGlow 22s ease-in-out infinite}'
      + '@media(prefers-reduced-motion:reduce){#pnav-glow{animation:none}}'
      + '.pnav-fab{position:fixed;top:14px;left:14px;z-index:1100;display:inline-flex;align-items:center;gap:7px;'
      + 'background:rgba(9,20,14,.9);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);'
      + 'border:1px solid rgba(226,112,26,.32);color:#E9F4EE;font:600 13px Inter,system-ui,sans-serif;'
      + 'padding:9px 14px;border-radius:12px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:.18s}'
      + '.pnav-fab:hover{border-color:rgba(226,112,26,.65);background:rgba(14,28,20,.95)}'
      + '.pnav-root.open .pnav-fab{opacity:0;pointer-events:none}'
      + '.pnav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);'
      + 'z-index:1190;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}'
      + '.pnav-root.open .pnav-backdrop{opacity:1;visibility:visible}'
      + '.pnav-drawer{position:fixed;top:0;left:0;height:100%;width:280px;max-width:84vw;z-index:1200;'
      + 'background:rgba(8,18,13,.97);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);'
      + 'border-right:1px solid rgba(226,112,26,.2);transform:translateX(-106%);'
      + 'transition:transform .33s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;'
      + 'padding:14px;box-shadow:14px 0 44px rgba(0,0,0,.5);font-family:Inter,system-ui,sans-serif}'
      + '.pnav-root.open .pnav-drawer{transform:none}'
      + '.pnav-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:4px 4px 10px;border-bottom:1px solid rgba(255,255,255,.07)}'
      + '.pnav-brand{display:flex;align-items:center;gap:9px;color:#E9F4EE;font-weight:800;font-size:15px;text-decoration:none}'
      + '.pnav-brand img{width:28px;height:28px;border-radius:50%;object-fit:cover}'
      + '.pnav-close{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);'
      + 'color:#cdd9d2;font:600 12px Inter;cursor:pointer;padding:7px 10px;border-radius:9px}'
      + '.pnav-close:hover{background:rgba(255,255,255,.1);color:#fff}'
      + '.pnav-list{display:flex;flex-direction:column;gap:2px;overflow-y:auto;flex:1;margin:4px 0}'
      + '.pnav-link{display:flex;align-items:center;gap:11px;text-decoration:none;color:#9fb3a8;'
      + 'font-weight:600;font-size:14px;padding:11px 12px;border-radius:10px;transition:background .15s,color .15s}'
      + '.pnav-link .i{font-size:16px;width:22px;text-align:center;line-height:1}'
      + '.pnav-link:hover{background:rgba(255,255,255,.06);color:#E9F4EE}'
      + '.pnav-link.active{background:rgba(226,112,26,.18);color:#f3a45f}'
      + '.pnav-logout{margin-top:6px;display:flex;align-items:center;justify-content:center;gap:9px;'
      + 'background:rgba(226,72,52,.12);border:1px solid rgba(226,72,52,.32);color:#ff9c8c;'
      + 'font-weight:600;font-size:14px;padding:12px;border-radius:10px;cursor:pointer;font-family:inherit}'
      + '.pnav-logout:hover{background:#e24834;color:#fff}'
      + '[dir=rtl] .pnav-fab{left:auto;right:14px}'
      + '[dir=rtl] .pnav-drawer{left:auto;right:0;transform:translateX(106%);border-right:0;border-left:1px solid rgba(226,112,26,.2)}'
      + '[dir=rtl] .pnav-root.open .pnav-drawer{transform:none}';
    var st = document.createElement('style');
    st.id = 'pnav-style';
    st.textContent = css;
    document.head.appendChild(st);

    var glow = document.createElement('div');
    glow.id = 'pnav-glow';
    document.body.appendChild(glow);

    document.querySelectorAll('body > header, body > nav, .topbar, .navbar')
      .forEach(function (el) { if (el.id !== 'pnav-glow' && !el.closest('#pnav-root')) el.remove(); });

    if (glowOnly) return;

    var linksHtml = LINKS.map(function (l) {
      var route = l[0];
      var active = (path === route) || (route !== '/dashboard' && path.indexOf(route) === 0);
      return '<a class="pnav-link' + (active ? ' active' : '') + '" href="' + route + '">'
           + '<span class="i">' + l[2] + '</span><span>' + l[1] + '</span></a>';
    }).join('');

    var logoutJs =
      "if(window.API&&API.Auth&&API.Auth.logout){API.Auth.logout();return;}"
      + "var b=location.hostname==='localhost'?'http://localhost:3000/api':'https://api.papayajuice.xyz/api';"
      + "var t=localStorage.getItem('papaya_token');"
      + "try{if(t)fetch(b+'/auth/logout',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t}});}catch(e){}"
      + "localStorage.removeItem('papaya_token');localStorage.removeItem('papaya_user');sessionStorage.clear();location.href='/dashboard';";

    var root = document.createElement('div');
    root.id = 'pnav-root';
    root.className = 'pnav-root topbar';
    root.innerHTML =
        '<button class="pnav-fab" type="button" aria-label="Menu">\u2630 Menu</button>'
      + '<div class="pnav-backdrop"></div>'
      + '<aside class="pnav-drawer">'
      +   '<div class="pnav-head">'
      +     '<a class="pnav-brand" href="/dashboard"><img src="/logo.png" alt="" onerror="this.style.display=\'none\'"><span>Papaya Juice</span></a>'
      +     '<button class="pnav-close" type="button">\u2715 Masquer</button>'
      +   '</div>'
      +   '<nav class="pnav-list">' + linksHtml + '</nav>'
      +   '<button class="pnav-logout" type="button" onclick="(function(){' + logoutJs + '})()">\u23CF Déconnexion</button>'
      + '</aside>';
    document.body.appendChild(root);

    function open()  { root.classList.add('open'); }
    function close() { root.classList.remove('open'); }
    root.querySelector('.pnav-fab').addEventListener('click', open);
    root.querySelector('.pnav-close').addEventListener('click', close);
    root.querySelector('.pnav-backdrop').addEventListener('click', close);
    root.querySelectorAll('.pnav-link').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

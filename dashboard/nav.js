/* ════════════════════════════════════════════════════════════
   Papaya Juice — Barre de navigation unifiée (nav.js)
   À inclure sur chaque page dashboard :
     <script src="/dashboard/nav.js" defer></script>
   Elle supprime l'ancienne nav, injecte une nav cohérente,
   gère le menu hamburger (mobile) et surligne la page active.
   ════════════════════════════════════════════════════════════ */
(function () {
  function init() {
    if (document.querySelector('header.pnav')) return; // éviter double-injection

    // ── Liens (route, libellé, icône) ──
    var LINKS = [
      ['/dashboard',                       'Tableau de bord', '▦'],
      ['/dashboard/commandes-live',        'Commandes Live',  '🛎'],
      ['/dashboard/admin',                 'Produits',        '🧾'],
      ['/dashboard/categories',            'Catégories',      '🗂'],
      ['/dashboard/extras',                'Extras',          '➕'],
      ['/dashboard/stock',                 'Stock',           '📦'],
      ['/dashboard/recettes',              'Recettes',        '📖'],
      ['/dashboard/personnel',             'Personnel',       '👥'],
      ['/dashboard/rapport-commandes',     'Rapports',        '📊'],
      ['/dashboard/reclamations',          'Réclamations',    '⚠'],
      ['/dashboard/qr-tables',             'QR Tables',       '🔳'],
      ['/dashboard/historique-clotures',   'Clôtures',        '📁'],
      ['/dashboard/parametres-impression', 'Impression',      '🖨']
    ];

    var path = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/dashboard';

    // ── CSS (auto-contenu) ──
    var css = ''
      + '.pnav{position:sticky;top:0;z-index:1000;display:flex;align-items:center;gap:14px;'
      + 'padding:9px 18px;background:rgba(9,20,14,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);'
      + 'border-bottom:1px solid rgba(226,112,26,.20);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}'
      + '.pnav-brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#E9F4EE;font-weight:800;font-size:15px;white-space:nowrap;flex-shrink:0}'
      + '.pnav-brand img{width:30px;height:30px;border-radius:50%;object-fit:cover}'
      + '.pnav-links{display:flex;align-items:center;gap:4px;flex:1;flex-wrap:wrap}'
      + '.pnav-link{display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#9fb3a8;'
      + 'font-size:13px;font-weight:600;padding:7px 11px;border-radius:9px;white-space:nowrap;transition:background .18s,color .18s}'
      + '.pnav-link .pnav-ico{font-size:14px;line-height:1}'
      + '.pnav-link:hover{background:rgba(255,255,255,.06);color:#E9F4EE}'
      + '.pnav-link.active{background:rgba(226,112,26,.18);color:#f3a45f}'
      + '.pnav-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex-shrink:0}'
      + '.pnav-logout{background:rgba(226,72,52,.12);border:1px solid rgba(226,72,52,.34);color:#ff9c8c;'
      + 'padding:8px 13px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;transition:.18s}'
      + '.pnav-logout:hover{background:#e24834;color:#fff}'
      + '.pnav-burger{display:none;flex-direction:column;gap:4px;background:none;border:0;cursor:pointer;padding:8px}'
      + '.pnav-burger span{width:22px;height:2.5px;background:#E9F4EE;border-radius:2px;transition:.25s}'
      + '.pnav.open .pnav-burger span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}'
      + '.pnav.open .pnav-burger span:nth-child(2){opacity:0}'
      + '.pnav.open .pnav-burger span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}'
      + '@media(max-width:980px){'
      +   '.pnav{flex-wrap:wrap;gap:10px}'
      +   '.pnav-burger{display:flex;margin-left:auto;order:1}'
      +   '.pnav-actions{order:2;margin-left:0}'
      +   '.pnav-links{display:none;order:3;flex-basis:100%;flex-direction:column;align-items:stretch;gap:2px;padding:6px 0 4px;'
      +     'border-top:1px solid rgba(255,255,255,.07);margin-top:4px}'
      +   '.pnav.open .pnav-links{display:flex}'
      +   '.pnav-link{padding:12px 12px;font-size:14.5px}'
      + '}'
      + '[dir=rtl] .pnav-actions{margin-left:0;margin-right:auto}'
      + '[dir=rtl] .pnav-burger{margin-left:0;margin-right:auto}';
    var st = document.createElement('style');
    st.id = 'pnav-style';
    st.textContent = css;
    document.head.appendChild(st);

    // ── Supprimer les anciennes barres ──
    document.querySelectorAll('body > header, body > nav, .topbar, .navbar, header.topbar')
      .forEach(function (el) { if (!el.classList.contains('pnav')) el.remove(); });

    // ── Construire les liens ──
    var linksHtml = LINKS.map(function (l) {
      var route = l[0];
      var active = (path === route) ||
                   (route !== '/dashboard' && path.indexOf(route) === 0);
      return '<a class="pnav-link' + (active ? ' active' : '') + '" href="' + route + '">'
           + '<span class="pnav-ico">' + l[2] + '</span><span>' + l[1] + '</span></a>';
    }).join('');

    // ── Logout (enregistre le pointage via backend, puis nettoie) ──
    var logoutJs =
      "if(window.API&&API.Auth&&API.Auth.logout){API.Auth.logout();return;}"
      + "var b=location.hostname==='localhost'?'http://localhost:3000/api':'https://api.papayajuice.xyz/api';"
      + "var t=localStorage.getItem('papaya_token');"
      + "try{if(t)fetch(b+'/auth/logout',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t}});}catch(e){}"
      + "localStorage.removeItem('papaya_token');localStorage.removeItem('papaya_user');sessionStorage.clear();location.href='/dashboard';";

    // ── Injecter la nav ──
    var header = document.createElement('header');
    header.className = 'pnav topbar'; // 'topbar' gardé pour compat i18n (switcher)
    header.innerHTML =
        '<a class="pnav-brand" href="/dashboard">'
      +   '<img src="/logo.png" alt="" onerror="this.style.display=\'none\'">'
      +   '<span>Papaya Juice</span>'
      + '</a>'
      + '<button class="pnav-burger" aria-label="Menu" type="button"><span></span><span></span><span></span></button>'
      + '<nav class="pnav-links">' + linksHtml + '</nav>'
      + '<div class="pnav-actions">'
      +   '<button class="pnav-logout" type="button" onclick="(function(){' + logoutJs + '})()">⎋ Déconnexion</button>'
      + '</div>';
    document.body.insertBefore(header, document.body.firstChild);

    // ── Hamburger ──
    var burger = header.querySelector('.pnav-burger');
    burger.addEventListener('click', function () { header.classList.toggle('open'); });
    header.querySelectorAll('.pnav-link').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('open'); });
    });

    // amener le lien actif dans la vue (desktop, si défilement horizontal)
    var act = header.querySelector('.pnav-link.active');
    if (act && act.scrollIntoView) { try { act.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) {} }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

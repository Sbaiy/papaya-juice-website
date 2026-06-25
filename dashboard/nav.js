/* ════════════════════════════════════════════════════════════════════════
   Papaya Juice — Navigation unifiée + fond animé  (nav.js)
   Inclure sur CHAQUE page (y compris dashboard.html) :
     <script src="/dashboard/nav.js" defer></script>

   Source unique pour, sur toutes les pages du dashboard :
     • le FOND  : vert sombre + halos orange foncé qui dérivent en continu
     • la NAV   : bouton « Menu » (haut-gauche) → tiroir latéral
   • /dashboard (accueil) : fond seulement (garde ses propres onglets)
   • commandes-live        : fond seulement (pas de tiroir)

   Correctif clé : la racine n'utilise plus la classe « topbar » (collision
   avec le .topbar { backdrop-filter } de chaque page qui cassait la position
   du bouton). Tout est désormais préfixé « pnav- » et isolé du CSS des pages.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  function init() {
    if (document.getElementById('pnav-root') || document.getElementById('pnav-bg')) return;

    var glowOnly = /commandes-live/.test(location.pathname);
    var mainPath = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/dashboard';
    var isMainDash = (mainPath === '/dashboard');  /* page d'accueil : garde sa propre nav, fond seulement */

    /* ── Icônes SVG (style ligne unifié) ──────────────────────────────── */
    var ICONS = {
      dash:    '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
      live:    '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
      qr:      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3M20 14v.01M14 17v.01M14 20h3M17 20h.01M20 17v3"/>',
      products:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
      cats:    '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
      extras:  '<circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/>',
      stock:   '<path d="M20 8.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5"/><path d="M2 4.5h20v4H2z"/><path d="M9.5 12.5h5"/>',
      recipes: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
      staff:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.5"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.3a4 4 0 0 1 0 7.4"/>',
      reports: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12.5" y="7" width="3" height="10" rx="1"/><rect x="18" y="13" width="3" height="4" rx="1"/>',
      claims:  '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
      closings:'<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      print:   '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
      logout:  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
      close:   '<path d="M18 6 6 18M6 6l12 12"/>'
    };

    /* ── Navigation groupée ────────────────────────────────────────────── */
    var PINNED = ['/dashboard', 'Tableau de bord', 'dash'];
    var GROUPS = [
      ['Opérations', [
        ['/dashboard/commandes-live',        'Commandes Live', 'live'],
        ['/dashboard/qr-tables',             'QR Tables',      'qr']
      ]],
      ['Catalogue', [
        ['/dashboard/admin',                 'Produits',       'products'],
        ['/dashboard/categories',            'Catégories',     'cats'],
        ['/dashboard/extras',                'Extras',         'extras'],
        ['/dashboard/stock',                 'Stock',          'stock'],
        ['/dashboard/recettes',              'Recettes',       'recipes']
      ]],
      ['Gestion', [
        ['/dashboard/personnel',             'Personnel',      'staff'],
        ['/dashboard/rapport-commandes',     'Rapports',       'reports'],
        ['/dashboard/reclamations',          'Réclamations',   'claims'],
        ['/dashboard/historique-clotures',   'Clôtures',       'closings']
      ]],
      ['Système', [
        ['/dashboard/parametres-impression', 'Impression',     'print']
      ]]
    ];

    var path = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/dashboard';
    function isActive(route) {
      return (path === route) || (route !== '/dashboard' && path.indexOf(route) === 0);
    }

    /* ── Styles (entièrement isolés, préfixe pnav-) ────────────────────── */
    var css = `
:root{
  --pnav-accent:#f97316; --pnav-accent-2:#ea6a0a;
  --pnav-accent-soft:rgba(249,115,22,.16); --pnav-accent-ring:rgba(249,115,22,.34);
  --pnav-ink:#EAF5EE; --pnav-muted:#9DB3A8; --pnav-dim:#6F8579;
}

/* ─── Fond UNIFIÉ animé — vert sombre + halos orange foncé en mouvement ───
   Couche fixe derrière tout le contenu. Deux halos dérivent en continu pour
   un effet d'ambiance vivant. On neutralise le ::before propre à la page pour
   garantir un rendu identique partout. */
#pnav-bg{
  position:fixed; inset:0; z-index:-1; pointer-events:none; overflow:hidden;
  background:
    radial-gradient(ellipse 120% 90% at 50% 0%, #1b2e1e 0%, transparent 58%),
    #0d1c13;
}
#pnav-bg::before, #pnav-bg::after{
  content:''; position:absolute; border-radius:50%; pointer-events:none; will-change:transform;
}
#pnav-bg::before{
  width:80vw; height:80vw; left:6%; top:-2%;
  background:radial-gradient(circle, rgba(194,65,12,.24) 0%, rgba(154,52,18,.11) 38%, transparent 62%);
  animation:pnavDrift1 28s ease-in-out infinite;
}
#pnav-bg::after{
  width:64vw; height:64vw; right:2%; bottom:-6%;
  background:radial-gradient(circle, rgba(180,83,9,.21) 0%, rgba(124,45,18,.09) 40%, transparent 60%);
  animation:pnavDrift2 37s ease-in-out infinite;
}
@keyframes pnavDrift1{
  0%  {transform:translate(-12%,-8%) scale(1)}
  33% {transform:translate(14%,12%)  scale(1.28)}
  66% {transform:translate(5%,-10%)  scale(1.12)}
  100%{transform:translate(-12%,-8%) scale(1)}
}
@keyframes pnavDrift2{
  0%  {transform:translate(10%,8%)   scale(1.10)}
  50% {transform:translate(-14%,-10%) scale(1.40)}
  100%{transform:translate(10%,8%)   scale(1.10)}
}
body::before{ background:none !important; }
@media print{ #pnav-bg, #pnav-root{ display:none !important; } }
@media(prefers-reduced-motion:reduce){ #pnav-bg::before, #pnav-bg::after{ animation:none } }

/* ─── Bouton flottant « Menu » (verrouillé en haut-gauche) ─── */
.pnav-fab{
  position:fixed !important;
  top:calc(14px + env(safe-area-inset-top,0px)) !important;
  left:calc(14px + env(safe-area-inset-left,0px)) !important;
  right:auto !important; bottom:auto !important;
  z-index:1100; margin:0;
  display:inline-flex; align-items:center; gap:10px;
  padding:9px 15px 9px 12px;
  font:700 13px/1 'Plus Jakarta Sans',Inter,system-ui,sans-serif; letter-spacing:.01em;
  color:var(--pnav-ink); cursor:pointer;
  background:linear-gradient(180deg, rgba(16,30,22,.92), rgba(9,19,14,.94));
  -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.10); border-radius:13px;
  box-shadow:0 10px 26px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05);
  transition:transform .16s ease, border-color .18s, box-shadow .18s, background .18s, opacity .2s;
}
.pnav-fab:hover{ transform:translateY(-1px); border-color:var(--pnav-accent-ring);
  box-shadow:0 14px 32px rgba(0,0,0,.5), 0 0 0 3px var(--pnav-accent-soft); }
.pnav-fab:active{ transform:translateY(0); }
.pnav-fab:focus-visible{ outline:none; border-color:var(--pnav-accent); box-shadow:0 0 0 3px var(--pnav-accent-ring); }
.pnav-fab-ico{ display:flex; flex-direction:column; justify-content:center; gap:3px; width:16px; }
.pnav-fab-ico span{ display:block; height:2px; border-radius:2px; background:var(--pnav-accent);
  box-shadow:0 0 6px rgba(249,115,22,.55); transition:width .25s ease; }
.pnav-fab-ico span:nth-child(1){ width:16px } .pnav-fab-ico span:nth-child(2){ width:11px } .pnav-fab-ico span:nth-child(3){ width:14px }
.pnav-fab:hover .pnav-fab-ico span{ width:16px }
.pnav-root.open .pnav-fab{ opacity:0; pointer-events:none; transform:scale(.9); }

/* ─── Voile + tiroir ─── */
.pnav-backdrop{
  position:fixed; inset:0; z-index:1190; background:rgba(3,8,5,.55);
  -webkit-backdrop-filter:blur(3px); backdrop-filter:blur(3px);
  opacity:0; visibility:hidden; transition:opacity .3s, visibility .3s;
}
.pnav-root.open .pnav-backdrop{ opacity:1; visibility:visible; }

.pnav-drawer{
  position:fixed; top:0; left:0; height:100%; width:298px; max-width:87vw; z-index:1200;
  display:flex; flex-direction:column; padding:18px 14px 14px;
  font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;
  color:var(--pnav-ink);
  background:linear-gradient(180deg, rgba(18,33,24,.99) 0%, rgba(10,19,13,.995) 100%);
  -webkit-backdrop-filter:blur(22px); backdrop-filter:blur(22px);
  border-right:1px solid rgba(255,255,255,.06);
  box-shadow:30px 0 70px rgba(0,0,0,.55);
  transform:translateX(-104%); transition:transform .36s cubic-bezier(.4,0,.2,1);
}
.pnav-root.open .pnav-drawer{ transform:none; }

/* En-tête */
.pnav-head{ display:flex; align-items:center; gap:12px; padding:2px 4px 16px; margin-bottom:6px;
  border-bottom:1px solid rgba(255,255,255,.06); }
.pnav-brand{ display:flex; align-items:center; gap:12px; text-decoration:none; min-width:0; flex:1; }
.pnav-brand img{ width:42px; height:42px; border-radius:12px; object-fit:cover; flex-shrink:0;
  border:1px solid rgba(226,112,26,.45); box-shadow:0 6px 18px rgba(0,0,0,.45); }
.pnav-brand-txt{ display:flex; flex-direction:column; min-width:0; }
.pnav-brand-name{ font-size:15.5px; font-weight:800; letter-spacing:-.01em; color:var(--pnav-ink); line-height:1.15; }
.pnav-brand-sub{ font-size:10px; font-weight:800; color:var(--pnav-accent); letter-spacing:.16em; text-transform:uppercase; margin-top:3px; }
.pnav-close{ display:grid; place-items:center; width:34px; height:34px; flex-shrink:0;
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px;
  color:var(--pnav-muted); cursor:pointer; transition:.16s; }
.pnav-close svg{ width:16px; height:16px; }
.pnav-close:hover{ background:rgba(226,72,52,.16); border-color:rgba(226,72,52,.4); color:#ff9c8c; }
.pnav-close:focus-visible{ outline:none; box-shadow:0 0 0 3px var(--pnav-accent-ring); }

/* Liste */
.pnav-list{ display:flex; flex-direction:column; gap:2px; overflow-y:auto; flex:1; padding:4px 2px; margin:2px 0;
  scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.13) transparent; }
.pnav-list::-webkit-scrollbar{ width:6px } .pnav-list::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.13); border-radius:6px }
.pnav-group-title{ font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase;
  color:var(--pnav-dim); padding:16px 12px 7px; }

.pnav-link{ position:relative; display:flex; align-items:center; gap:12px; text-decoration:none;
  color:var(--pnav-muted); font-weight:600; font-size:14px; padding:6px 10px 6px 6px; border-radius:13px;
  transition:background .16s, color .16s; }
.pnav-ic{ width:35px; height:35px; flex-shrink:0; display:grid; place-items:center; border-radius:11px;
  background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.06); color:var(--pnav-muted);
  transition:background .16s, color .16s, border-color .16s, box-shadow .16s; }
.pnav-ic svg{ width:18px; height:18px; }
.pnav-link:hover{ background:rgba(255,255,255,.04); color:var(--pnav-ink); }
.pnav-link:hover .pnav-ic{ color:var(--pnav-ink); background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.12); }
.pnav-link:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--pnav-accent-ring); }
.pnav-link.active{ background:rgba(226,112,26,.10); color:#f7b06d; font-weight:700; }
.pnav-link.active .pnav-ic{ background:linear-gradient(180deg,#f5933f,#e2701a); border-color:transparent;
  color:#1a0e04; box-shadow:0 6px 16px -4px rgba(226,112,26,.6); }

/* Pied */
.pnav-foot{ padding-top:12px; margin-top:4px; border-top:1px solid rgba(255,255,255,.06); }
.pnav-logout{ width:100%; display:flex; align-items:center; justify-content:center; gap:9px;
  background:rgba(226,72,52,.10); border:1px solid rgba(226,72,52,.28); color:#ff9c8c;
  font-family:inherit; font-weight:700; font-size:13.5px; padding:12px; border-radius:13px; cursor:pointer; transition:.16s; }
.pnav-logout svg{ width:17px; height:17px; }
.pnav-logout:hover{ background:#e24834; border-color:#e24834; color:#fff; box-shadow:0 10px 24px -6px rgba(226,72,52,.5); }
.pnav-logout:focus-visible{ outline:none; box-shadow:0 0 0 3px rgba(226,72,52,.4); }

/* ─── RTL ─── */
[dir=rtl] .pnav-fab{ left:auto !important; right:calc(14px + env(safe-area-inset-right,0px)) !important; padding:9px 12px 9px 15px; }
[dir=rtl] .pnav-drawer{ left:auto; right:0; transform:translateX(104%);
  border-right:0; border-left:1px solid rgba(255,255,255,.06); box-shadow:-30px 0 70px rgba(0,0,0,.55); }
[dir=rtl] .pnav-root.open .pnav-drawer{ transform:none; }
[dir=rtl] .pnav-link{ padding:6px 6px 6px 10px; }

@media(prefers-reduced-motion:reduce){
  .pnav-fab,.pnav-link,.pnav-drawer,.pnav-backdrop{ transition:none }
}
`;
    var st = document.createElement('style');
    st.id = 'pnav-style';
    st.textContent = css;
    document.head.appendChild(st);

    /* ── Fond unifié (toujours injecté, sur TOUTES les pages) ── */
    var bg = document.createElement('div');
    bg.id = 'pnav-bg';
    document.body.insertBefore(bg, document.body.firstChild);

    /* Page d'accueil (/dashboard) : elle a sa propre navigation (onglets).
       On lui applique uniquement le fond, sans toucher à sa barre. */
    if (isMainDash) return;

    /* Retire les barres de navigation propres aux pages (remplacées ici) */
    document.querySelectorAll('body > header, body > nav, .topbar, .navbar')
      .forEach(function (el) {
        if (el.id === 'pnav-bg') return;
        if (el.closest('#pnav-root')) return;
        el.remove();
      });

    if (glowOnly) return;

    /* ── Construction du tiroir ── */
    function svg(key) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" '
           + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[key] || '') + '</svg>';
    }
    function linkHtml(l) {
      return '<a class="pnav-link' + (isActive(l[0]) ? ' active' : '') + '" href="' + l[0] + '">'
           + '<span class="pnav-ic">' + svg(l[2]) + '</span>'
           + '<span class="pnav-tx">' + l[1] + '</span></a>';
    }
    var listHtml = linkHtml(PINNED);
    GROUPS.forEach(function (g) {
      listHtml += '<div class="pnav-group-title">' + g[0] + '</div>';
      listHtml += g[1].map(linkHtml).join('');
    });

    var logoutJs =
      "if(window.API&&API.Auth&&API.Auth.logout){API.Auth.logout();return;}"
      + "var b=location.hostname==='localhost'?'http://localhost:3000/api':'https://api.papayajuice.xyz/api';"
      + "var t=localStorage.getItem('papaya_token');"
      + "try{if(t)fetch(b+'/auth/logout',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t}});}catch(e){}"
      + "localStorage.removeItem('papaya_token');localStorage.removeItem('papaya_user');sessionStorage.clear();location.href='/dashboard';";

    var root = document.createElement('div');
    root.id = 'pnav-root';
    root.className = 'pnav-root';
    root.innerHTML =
        '<button class="pnav-fab" type="button" aria-label="Ouvrir le menu" aria-expanded="false">'
      +   '<span class="pnav-fab-ico" aria-hidden="true"><span></span><span></span><span></span></span>'
      +   '<span class="pnav-fab-label">Menu</span>'
      + '</button>'
      + '<div class="pnav-backdrop"></div>'
      + '<aside class="pnav-drawer" role="dialog" aria-label="Navigation" aria-modal="true">'
      +   '<div class="pnav-head">'
      +     '<a class="pnav-brand" href="/dashboard">'
      +       '<img src="/logo.png" alt="" onerror="this.style.display=\'none\'">'
      +       '<span class="pnav-brand-txt"><span class="pnav-brand-name">Papaya Juice</span>'
      +       '<span class="pnav-brand-sub">Tableau de bord</span></span>'
      +     '</a>'
      +     '<button class="pnav-close" type="button" aria-label="Fermer le menu">' + svg('close') + '</button>'
      +   '</div>'
      +   '<nav class="pnav-list">' + listHtml + '</nav>'
      +   '<div class="pnav-foot">'
      +     '<button class="pnav-logout" type="button" onclick="(function(){' + logoutJs + '})()">' + svg('logout') + '<span>Déconnexion</span></button>'
      +   '</div>'
      + '</aside>';
    document.body.appendChild(root);

    var fab = root.querySelector('.pnav-fab');
    function open()  { root.classList.add('open');  fab.setAttribute('aria-expanded', 'true'); }
    function close() { root.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); }
    fab.addEventListener('click', open);
    root.querySelector('.pnav-close').addEventListener('click', close);
    root.querySelector('.pnav-backdrop').addEventListener('click', close);
    root.querySelectorAll('.pnav-link').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

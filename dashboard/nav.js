/* ════════════════════════════════════════════════════════════════════════
   Papaya Juice — Navigation unifiée + fond du tableau de bord  (nav.js)
   Inclure sur chaque page :  <script src="/dashboard/nav.js" defer></script>

   Ce fichier est LA source unique pour, sur toutes les pages du dashboard :
     • le FOND  : réplique exacte de dashboard.html (#1b2e1e + halos orange)
     • la NAV   : bouton « Menu » (haut-gauche) → tiroir latéral
   commandes-live : fond seulement (pas de tiroir).

   Correctif clé : la racine n'utilise plus la classe « topbar » (collision
   avec le .topbar { backdrop-filter } de chaque page qui cassait la position
   du bouton). Tout est désormais préfixé « pnav- » et isolé du CSS des pages.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  function init() {
    if (document.getElementById('pnav-root') || document.getElementById('pnav-bg')) return;

    var glowOnly = /commandes-live/.test(location.pathname);

    /* ── Navigation, groupée pour un rendu « pro » ─────────────────────── */
    var PINNED = ['/dashboard', 'Tableau de bord', '\u25A6'];
    var GROUPS = [
      ['Opérations', [
        ['/dashboard/commandes-live',        'Commandes Live', '\uD83D\uDD14'],
        ['/dashboard/qr-tables',             'QR Tables',      '\uD83D\uDD33']
      ]],
      ['Catalogue', [
        ['/dashboard/admin',                 'Produits',       '\uD83E\uDDFE'],
        ['/dashboard/categories',            'Catégories',     '\uD83D\uDDC2'],
        ['/dashboard/extras',                'Extras',         '\u2795'],
        ['/dashboard/stock',                 'Stock',          '\uD83D\uDCE6'],
        ['/dashboard/recettes',              'Recettes',       '\uD83D\uDCD6']
      ]],
      ['Gestion', [
        ['/dashboard/personnel',             'Personnel',      '\uD83D\uDC65'],
        ['/dashboard/rapport-commandes',     'Rapports',       '\uD83D\uDCCA'],
        ['/dashboard/reclamations',          'Réclamations',   '\u26A0'],
        ['/dashboard/historique-clotures',   'Clôtures',       '\uD83D\uDCC1']
      ]],
      ['Système', [
        ['/dashboard/parametres-impression', 'Impression',     '\uD83D\uDDA8']
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

/* ─── Fond UNIFIÉ — réplique exacte du tableau de bord (dashboard.html) ───
   Couche fixe derrière tout le contenu : couvre le fond propre de la page,
   puis on neutralise le ::before de la page pour éviter tout doublon/écart. */
#pnav-bg{
  position:fixed; inset:0; z-index:-1; pointer-events:none;
  background-color:#1b2e1e;
  background-image:
    radial-gradient(ellipse 55% 40% at 15% 85%, rgba(249,115,22,.08) 0%, transparent 70%),
    radial-gradient(ellipse 45% 35% at 85% 15%, rgba(249,115,22,.06) 0%, transparent 65%);
}
body::before{ background:none !important; }
@media print{ #pnav-bg, #pnav-root{ display:none !important; } }

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
  position:fixed; top:0; left:0; height:100%; width:290px; max-width:86vw; z-index:1200;
  display:flex; flex-direction:column; padding:16px 14px 14px;
  font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;
  color:var(--pnav-ink);
  background:linear-gradient(180deg, rgba(13,25,18,.985), rgba(8,16,11,.99));
  -webkit-backdrop-filter:blur(20px); backdrop-filter:blur(20px);
  border-right:1px solid rgba(249,115,22,.16);
  box-shadow:24px 0 60px rgba(0,0,0,.55);
  transform:translateX(-104%); transition:transform .34s cubic-bezier(.4,0,.2,1);
}
.pnav-root.open .pnav-drawer{ transform:none; }

.pnav-head{ display:flex; align-items:center; justify-content:space-between; gap:10px;
  padding:4px 6px 14px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,.07); }
.pnav-brand{ display:flex; align-items:center; gap:11px; text-decoration:none; min-width:0; }
.pnav-brand img{ width:38px; height:38px; border-radius:11px; object-fit:cover;
  border:1px solid rgba(249,115,22,.4); box-shadow:0 4px 14px rgba(0,0,0,.4); flex-shrink:0; }
.pnav-brand-txt{ display:flex; flex-direction:column; min-width:0; }
.pnav-brand-name{ font-size:15px; font-weight:800; letter-spacing:.01em; color:var(--pnav-ink); line-height:1.15; }
.pnav-brand-sub{ font-size:11px; font-weight:600; color:var(--pnav-accent); letter-spacing:.04em; text-transform:uppercase; }
.pnav-close{ display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; flex-shrink:0;
  background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:10px;
  color:var(--pnav-muted); font-size:15px; cursor:pointer; transition:.16s; }
.pnav-close:hover{ background:rgba(226,72,52,.16); border-color:rgba(226,72,52,.4); color:#ff9c8c; }
.pnav-close:focus-visible{ outline:none; box-shadow:0 0 0 3px var(--pnav-accent-ring); }

.pnav-list{ display:flex; flex-direction:column; gap:1px; overflow-y:auto; flex:1; padding:2px; margin:2px 0;
  scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.14) transparent; }
.pnav-list::-webkit-scrollbar{ width:6px } .pnav-list::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.14); border-radius:6px }
.pnav-group-title{ font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
  color:var(--pnav-dim); padding:14px 12px 6px; }

.pnav-link{ position:relative; display:flex; align-items:center; gap:12px; text-decoration:none;
  color:var(--pnav-muted); font-weight:600; font-size:14px; padding:10px 12px; border-radius:11px;
  transition:background .15s, color .15s, padding-left .15s; }
.pnav-link .i{ font-size:16px; width:22px; text-align:center; line-height:1; filter:grayscale(.25); transition:filter .15s; }
.pnav-link:hover{ background:rgba(255,255,255,.055); color:var(--pnav-ink); padding-left:15px; }
.pnav-link:hover .i{ filter:none; }
.pnav-link:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--pnav-accent-ring); }
.pnav-link.active{ background:var(--pnav-accent-soft); color:#f6ad6d; font-weight:700;
  box-shadow:inset 3px 0 0 var(--pnav-accent); }
.pnav-link.active .i{ filter:none; }

.pnav-foot{ padding-top:10px; margin-top:6px; border-top:1px solid rgba(255,255,255,.07); }
.pnav-logout{ width:100%; display:flex; align-items:center; justify-content:center; gap:9px;
  background:rgba(226,72,52,.12); border:1px solid rgba(226,72,52,.30); color:#ff9c8c;
  font-family:inherit; font-weight:700; font-size:14px; padding:12px; border-radius:11px; cursor:pointer; transition:.16s; }
.pnav-logout:hover{ background:#e24834; border-color:#e24834; color:#fff; box-shadow:0 8px 22px rgba(226,72,52,.35); }
.pnav-logout:focus-visible{ outline:none; box-shadow:0 0 0 3px rgba(226,72,52,.4); }

/* ─── RTL ─── */
[dir=rtl] .pnav-fab{ left:auto !important; right:calc(14px + env(safe-area-inset-right,0px)) !important; padding:9px 12px 9px 15px; }
[dir=rtl] .pnav-drawer{ left:auto; right:0; transform:translateX(104%);
  border-right:0; border-left:1px solid rgba(249,115,22,.16); box-shadow:-24px 0 60px rgba(0,0,0,.55); }
[dir=rtl] .pnav-root.open .pnav-drawer{ transform:none; }
[dir=rtl] .pnav-link.active{ box-shadow:inset -3px 0 0 var(--pnav-accent); }
[dir=rtl] .pnav-link:hover{ padding-left:12px; padding-right:15px; }

@media(prefers-reduced-motion:reduce){
  .pnav-fab,.pnav-link,.pnav-drawer,.pnav-backdrop{ transition:none }
}
`;
    var st = document.createElement('style');
    st.id = 'pnav-style';
    st.textContent = css;
    document.head.appendChild(st);

    /* ── Fond unifié (toujours injecté, même sur commandes-live) ── */
    var bg = document.createElement('div');
    bg.id = 'pnav-bg';
    document.body.insertBefore(bg, document.body.firstChild);

    /* Retire les barres de navigation propres aux pages (remplacées ici) */
    document.querySelectorAll('body > header, body > nav, .topbar, .navbar')
      .forEach(function (el) {
        if (el.id === 'pnav-bg') return;
        if (el.closest('#pnav-root')) return;
        el.remove();
      });

    if (glowOnly) return;

    /* ── Construction du tiroir ── */
    function linkHtml(l) {
      return '<a class="pnav-link' + (isActive(l[0]) ? ' active' : '') + '" href="' + l[0] + '">'
           + '<span class="i">' + l[2] + '</span><span>' + l[1] + '</span></a>';
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
      +     '<button class="pnav-close" type="button" aria-label="Fermer le menu">\u2715</button>'
      +   '</div>'
      +   '<nav class="pnav-list">' + listHtml + '</nav>'
      +   '<div class="pnav-foot">'
      +     '<button class="pnav-logout" type="button" onclick="(function(){' + logoutJs + '})()">\u23CF Déconnexion</button>'
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

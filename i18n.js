/* ════════════════════════════════════════════════════════════════
   Papaya i18n — تعدد اللغات (FR / AR / EN) — نسخة 2
   • زر اللغة داخل الـ nav (نفس design عبر متغيرات الموقع)
   • العربية RTL صحيح (الترجمة كاملة → الترتيب مزيان)
   • كيسجّل الاختيار ف localStorage → كيبقى ف الصفحات
   • القاموس = النص الفرنسي (الأصل). كنزيدو صفحة بصفحة.
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DICT = {
    ar: {
      // ── commun / nav ──
      "← Retour": "← رجوع", "← Tableau de bord": "← لوحة التحكم",
      "Dashboard": "لوحة التحكم", "Tableau de bord": "لوحة التحكم",
      "— Sélectionner —": "— اختر —", "Chargement…": "جاري التحميل…", "Chargement...": "جاري التحميل...",
      "Imprimer": "طباعة", "Annuler": "إلغاء", "Confirmer": "تأكيد", "Fermer": "إغلاق",
      // ── Paramètres Impression ──
      "Paramètres Impression – Papaya Juice": "إعدادات الطباعة – Papaya Juice",
      "🖨️ Paramètres Impression": "🖨️ إعدادات الطباعة",
      "Imprimantes locales — connectées au PC du kiosk": "الطابعات المحلية — متصلة بحاسوب الكشك",
      "🖨️ Imprimantes du PC": "🖨️ طابعات الحاسوب",
      "🔄 Scanner les imprimantes": "🔄 فحص الطابعات",
      "🍳 Imprimante Cuisine": "🍳 طابعة المطبخ",
      "🧾 Imprimante Addition": "🧾 طابعة الفاتورة",
      "🧪 Test Cuisine": "🧪 اختبار المطبخ",
      "🧪 Test Addition": "🧪 اختبار الفاتورة",
      "☁️ PrintNode (Cloud)": "☁️ PrintNode (السحابة)",
      "Kayخدّem fach kayn WiFi — local houwa l-fallback fach t9ta3": "كيخدم فاش كاين WiFi — المحلي هو البديل فاش كيتقطع",
      "🔑 Clé API PrintNode": "🔑 مفتاح API ديال PrintNode",
      "🔄 Charger imprimantes PrintNode": "🔄 تحميل طابعات PrintNode",
      "🍳 Cuisine (PrintNode)": "🍳 المطبخ (PrintNode)",
      "🧾 Addition (PrintNode)": "🧾 الفاتورة (PrintNode)",
      "🧮 Clôture (PrintNode)": "🧮 الإغلاق (PrintNode)",
      "💾 Enregistrer la configuration": "💾 حفظ الإعدادات",
      // ── Historique Clôtures ──
      "Historique Clôtures — Papaya Juice": "سجل الإغلاقات — Papaya Juice",
      "Historique des": "سجل", "Clôtures": "الإغلاقات",
      "Toutes les clôtures de caisse enregistrées": "جميع إغلاقات الصندوق المسجّلة",
      "Total clôtures": "مجموع الإغلاقات", "Revenu total": "إجمالي المداخيل",
      "Commandes total": "مجموع الطلبات", "Commandes": "الطلبات",
      "🧑‍💼 Serveur / Caissier": "🧑‍💼 النادل / الصرّاف", "Tous les serveurs": "جميع النوادل",
      "📅 Date": "📅 التاريخ", "✕ Réinitialiser": "✕ إعادة تعيين",
      "commandes": "طلب",
    },
    en: {
      "← Retour": "← Back", "← Tableau de bord": "← Dashboard",
      "Dashboard": "Dashboard", "Tableau de bord": "Dashboard",
      "— Sélectionner —": "— Select —", "Chargement…": "Loading…", "Chargement...": "Loading...",
      "Imprimer": "Print", "Annuler": "Cancel", "Confirmer": "Confirm", "Fermer": "Close",
      "Paramètres Impression – Papaya Juice": "Print Settings – Papaya Juice",
      "🖨️ Paramètres Impression": "🖨️ Print Settings",
      "Imprimantes locales — connectées au PC du kiosk": "Local printers — connected to the kiosk PC",
      "🖨️ Imprimantes du PC": "🖨️ PC Printers",
      "🔄 Scanner les imprimantes": "🔄 Scan printers",
      "🍳 Imprimante Cuisine": "🍳 Kitchen Printer",
      "🧾 Imprimante Addition": "🧾 Receipt Printer",
      "🧪 Test Cuisine": "🧪 Test Kitchen",
      "🧪 Test Addition": "🧪 Test Receipt",
      "☁️ PrintNode (Cloud)": "☁️ PrintNode (Cloud)",
      "Kayخدّem fach kayn WiFi — local houwa l-fallback fach t9ta3": "Works when WiFi is on — local is the fallback when it drops",
      "🔑 Clé API PrintNode": "🔑 PrintNode API Key",
      "🔄 Charger imprimantes PrintNode": "🔄 Load PrintNode printers",
      "🍳 Cuisine (PrintNode)": "🍳 Kitchen (PrintNode)",
      "🧾 Addition (PrintNode)": "🧾 Receipt (PrintNode)",
      "🧮 Clôture (PrintNode)": "🧮 Closing (PrintNode)",
      "💾 Enregistrer la configuration": "💾 Save configuration",
      "Historique Clôtures — Papaya Juice": "Closings History — Papaya Juice",
      "Historique des": "History of", "Clôtures": "Closings",
      "Toutes les clôtures de caisse enregistrées": "All recorded cash closings",
      "Total clôtures": "Total closings", "Revenu total": "Total revenue",
      "Commandes total": "Total orders", "Commandes": "Orders",
      "🧑‍💼 Serveur / Caissier": "🧑‍💼 Waiter / Cashier", "Tous les serveurs": "All waiters",
      "📅 Date": "📅 Date", "✕ Réinitialiser": "✕ Reset",
      "commandes": "orders",
    }
  };

  const LANGS = [
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];
  const STORE_KEY = 'papaya_lang';
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'OPTION']);
  let current = localStorage.getItem(STORE_KEY) || 'fr';
  const originals = new WeakMap();

  function orig(node) {
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    return originals.get(node);
  }
  function tr(fr, lang) {
    if (lang === 'fr' || fr == null) return fr;
    const table = DICT[lang] || {};
    const key = fr.trim();
    return (table[key] != null) ? fr.replace(key, table[key]) : fr;
  }
  function walk(root, lang) {
    if (root.nodeType === 3) { root.nodeValue = tr(orig(root), lang); return; }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (n.parentNode && SKIP.has(n.parentNode.nodeName)) return NodeFilter.FILTER_REJECT;
        if (n.parentNode && n.parentNode.closest && n.parentNode.closest('#papaya-lang')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const ns = []; while (tw.nextNode()) ns.push(tw.currentNode);
    ns.forEach(n => { n.nodeValue = tr(orig(n), lang); });
    (root.querySelectorAll ? root.querySelectorAll('[placeholder],[title]') : []).forEach(el => {
      ['placeholder', 'title'].forEach(a => {
        if (!el.hasAttribute(a)) return;
        const k = '__o_' + a; if (el[k] == null) el[k] = el.getAttribute(a);
        el.setAttribute(a, tr(el[k], lang));
      });
    });
  }
  function applyLang(lang) {
    current = lang;
    localStorage.setItem(STORE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    walk(document.body, lang);
    updateBtn();
  }

  // ── Switcher dans la nav (même design via variables du site) ──
  let btnEl, menuEl;
  function buildSwitcher() {
    const nav = document.querySelector('.topbar') || document.querySelector('header.topbar')
             || document.querySelector('nav') || document.querySelector('header');

    const wrap = document.createElement('div');
    wrap.id = 'papaya-lang';
    wrap.innerHTML = `<button id="pl-btn" type="button" aria-label="Langue"></button><div id="pl-menu" role="menu"></div>`;

    const style = document.createElement('style');
    style.textContent = `
      #papaya-lang{position:relative;display:inline-flex;align-items:center;font-family:inherit;flex:0 0 auto}
      #pl-btn{display:flex;align-items:center;gap:7px;background:var(--glass,rgba(255,255,255,.08));color:var(--text,#fff);
        border:1px solid var(--border,rgba(255,255,255,.18));border-radius:999px;padding:7px 13px;font-size:14px;
        font-weight:700;cursor:pointer;line-height:1;white-space:nowrap;-webkit-backdrop-filter:var(--blur,blur(8px));backdrop-filter:var(--blur,blur(8px))}
      #pl-btn:hover{border-color:var(--border-hov,var(--orange,#f59e0b))}
      #pl-menu{position:absolute;inset-inline-end:0;top:calc(100% + 8px);background:var(--glass,#1c2620);
        border:1px solid var(--border,rgba(255,255,255,.18));border-radius:14px;box-shadow:0 14px 34px rgba(0,0,0,.4);
        padding:6px;min-width:172px;display:none;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);z-index:9999}
      #pl-menu.open{display:block}
      #pl-menu button{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-radius:9px;
        padding:10px 12px;font-size:14px;color:var(--text,#fff);cursor:pointer;text-align:start;font-family:inherit}
      #pl-menu button:hover{background:var(--glass-hov,rgba(255,255,255,.08))}
      #pl-menu button.active{color:var(--orange,#f59e0b);font-weight:800}
      #pl-menu button span:first-child{font-size:17px}
    `;
    document.head.appendChild(style);

    if (nav) {
      nav.style.display = nav.style.display || 'flex';
      nav.style.alignItems = 'center';
      nav.style.gap = nav.style.gap || '10px';
      const kids = Array.from(nav.children);
      if (kids.length) {
        nav.style.justifyContent = 'flex-start';
        kids[kids.length - 1].style.marginInlineStart = 'auto'; // pousse le dernier groupe à droite
      }
      nav.appendChild(wrap);
    } else {
      wrap.style.position = 'fixed';
      wrap.style.top = '14px';
      wrap.style.insetInlineEnd = '14px';
      wrap.style.zIndex = '99999';
      document.body.appendChild(wrap);
    }

    btnEl = wrap.querySelector('#pl-btn');
    menuEl = wrap.querySelector('#pl-menu');
    menuEl.innerHTML = LANGS.map(l => `<button data-lang="${l.code}"><span>${l.flag}</span><span>${l.label}</span></button>`).join('');
    btnEl.addEventListener('click', e => { e.stopPropagation(); menuEl.classList.toggle('open'); });
    menuEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { applyLang(b.dataset.lang); menuEl.classList.remove('open'); }));
    document.addEventListener('click', () => menuEl.classList.remove('open'));
  }
  function updateBtn() {
    if (!btnEl) return;
    const l = LANGS.find(x => x.code === current) || LANGS[2];
    btnEl.innerHTML = `<span>${l.flag}</span><span>${l.code.toUpperCase()}</span>`;
    menuEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.lang === current));
  }

  function init() {
    buildSwitcher();
    applyLang(current);
    new MutationObserver(muts => {
      if (current === 'fr') return;
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.id !== 'papaya-lang' && !(n.closest && n.closest('#papaya-lang'))) walk(n, current);
        else if (n.nodeType === 3) n.nodeValue = tr(orig(n), current);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.papayaSetLang = applyLang;
})();

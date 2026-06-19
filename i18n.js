/* ════════════════════════════════════════════════════════════════
   Papaya i18n — نظام تعدد اللغات (FR / AR / EN)
   • Switcher عائم فوق على اليمين (بحال الصورة)
   • كيسجّل الاختيار ف localStorage → كيبقى ف الصفحات كلهم
   • العربية RTL أوتوماتيك
   • كيترجم النصوص حسب القاموس (FR = الأصل) + المحتوى الديناميكي (MutationObserver)

   الاستعمال: زيد هاد السطر ف كل صفحة (قبل </body>):
     <script src="/i18n.js"></script>
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── القاموس: المفتاح = النص الفرنسي (الأصل). fr = الافتراضي ──
  const DICT = {
    ar: {
      // Navigation / commun
      "Dashboard": "لوحة التحكم", "Tableau de bord": "لوحة التحكم", "Admin": "المدير",
      "Menu": "القائمة", "Caisse": "الصندوق", "Stock": "المخزون", "Catégories": "التصنيفات",
      "Extras": "الإضافات", "Recettes": "الوصفات", "Personnel": "الموظفين",
      "Réclamations": "الشكايات", "Commandes": "الطلبات", "Commandes Live": "الطلبات المباشرة",
      "Plats": "الأطباق", "Statut": "الحالة", "Actions": "الإجراءات", "Date": "التاريخ",
      "Rôle": "الدور", "Employé": "الموظف", "Serveur": "النادل", "Table": "الطاولة",
      "Total": "المجموع", "Total:": "المجموع:", "Total commandes": "مجموع الطلبات",
      "Revenu total": "إجمالي المداخيل", "Depuis le début": "منذ البداية",
      "Propriétaire": "المالك", "Home": "الرئيسية", "Our": "ديالنا",
      // Boutons / actions
      "Annuler": "إلغاء", "Confirmer": "تأكيد", "Fermer": "إغلاق", "Enregistrer": "حفظ",
      "Enregistrer la configuration": "حفظ الإعدادات", "Modifier": "تعديل", "Supprimer": "حذف",
      "Ajouter": "إضافة", "Imprimer": "طباعة", "Envoyer": "إرسال",
      "Envoyer la commande": "إرسال الطلب", "Confirmer l'ajout": "تأكيد الإضافة",
      "🔄 Actualiser": "🔄 تحديث", "🚪 Déconnexion": "🚪 تسجيل الخروج",
      "🔊 Activer le son": "🔊 تفعيل الصوت", "— Sélectionner —": "— اختر —",
      // Statuts
      "En attente": "في الانتظار", "💰 Paiement": "💰 الدفع", "⚡ En Préparation": "⚡ قيد التحضير",
      "En cours": "قيد التنفيذ", "En préparation": "قيد التحضير", "Prêtes": "جاهزة",
      "✔️ Prêt": "✔️ جاهز", "✓ Terminé": "✓ منتهي", "Terminées": "منتهية", "Terminé": "منتهي",
      "🚫 Annulé": "🚫 ملغى", "Annulé": "ملغى", "Nouvelle commande": "طلب جديد",
      "Libre": "فارغة", "Occupée": "مشغولة", "Vides:": "فارغة:", "Occupées:": "مشغولة:",
      // Divers
      "Chargement…": "جاري التحميل…", "Loading…": "جاري التحميل…", "Comptoir": "الكاونتر",
      "🪑 Plan des tables": "🪑 مخطط الطاولات", "🔔 Cliquez pour activer les notifications sonores": "🔔 اضغط لتفعيل التنبيهات الصوتية",
      "Masquer les commandes terminées et payées": "إخفاء الطلبات المنتهية والمدفوعة",
      "Vérifier les tables vides": "التحقق من الطاولات الفارغة",
      // Impression (réglages)
      "Cuisine": "المطبخ", "Addition": "الفاتورة", "Clôture": "الإغلاق", "Clôtures": "الإغلاقات",
      "Total clôtures": "مجموع الإغلاقات", "🧪 Test Cuisine": "🧪 اختبار المطبخ", "🧪 Test Addition": "🧪 اختبار الفاتورة",
      "Clé API PrintNode": "مفتاح API PrintNode", "🔄 Charger imprimantes PrintNode": "🔄 تحميل طابعات PrintNode",
    },
    en: {
      "Dashboard": "Dashboard", "Tableau de bord": "Dashboard", "Admin": "Admin",
      "Menu": "Menu", "Caisse": "Cashier", "Stock": "Stock", "Catégories": "Categories",
      "Extras": "Extras", "Recettes": "Recipes", "Personnel": "Staff",
      "Réclamations": "Complaints", "Commandes": "Orders", "Commandes Live": "Live Orders",
      "Plats": "Dishes", "Statut": "Status", "Actions": "Actions", "Date": "Date",
      "Rôle": "Role", "Employé": "Employee", "Serveur": "Waiter", "Table": "Table",
      "Total": "Total", "Total:": "Total:", "Total commandes": "Total orders",
      "Revenu total": "Total revenue", "Depuis le début": "Since the beginning",
      "Propriétaire": "Owner", "Home": "Home", "Our": "Our",
      "Annuler": "Cancel", "Confirmer": "Confirm", "Fermer": "Close", "Enregistrer": "Save",
      "Enregistrer la configuration": "Save configuration", "Modifier": "Edit", "Supprimer": "Delete",
      "Ajouter": "Add", "Imprimer": "Print", "Envoyer": "Send",
      "Envoyer la commande": "Send order", "Confirmer l'ajout": "Confirm addition",
      "🔄 Actualiser": "🔄 Refresh", "🚪 Déconnexion": "🚪 Logout",
      "🔊 Activer le son": "🔊 Enable sound", "— Sélectionner —": "— Select —",
      "En attente": "Pending", "💰 Paiement": "💰 Payment", "⚡ En Préparation": "⚡ Preparing",
      "En cours": "In progress", "En préparation": "Preparing", "Prêtes": "Ready",
      "✔️ Prêt": "✔️ Ready", "✓ Terminé": "✓ Done", "Terminées": "Completed", "Terminé": "Done",
      "🚫 Annulé": "🚫 Cancelled", "Annulé": "Cancelled", "Nouvelle commande": "New order",
      "Libre": "Free", "Occupée": "Occupied", "Vides:": "Free:", "Occupées:": "Occupied:",
      "Chargement…": "Loading…", "Loading…": "Loading…", "Comptoir": "Counter",
      "🪑 Plan des tables": "🪑 Table layout", "🔔 Cliquez pour activer les notifications sonores": "🔔 Click to enable sound notifications",
      "Masquer les commandes terminées et payées": "Hide completed and paid orders",
      "Vérifier les tables vides": "Check empty tables",
      "Cuisine": "Kitchen", "Addition": "Receipt", "Clôture": "Closing", "Clôtures": "Closings",
      "Total clôtures": "Total closings", "🧪 Test Cuisine": "🧪 Test Kitchen", "🧪 Test Addition": "🧪 Test Receipt",
      "Clé API PrintNode": "PrintNode API Key", "🔄 Charger imprimantes PrintNode": "🔄 Load PrintNode printers",
    }
  };

  const LANGS = [
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];
  const STORE_KEY = 'papaya_lang';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);

  let current = localStorage.getItem(STORE_KEY) || 'fr';
  const originals = new WeakMap();   // node → texte FR d'origine

  function getOriginal(node) {
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    return originals.get(node);
  }

  function translateText(fr, lang) {
    if (lang === 'fr') return fr;
    const table = DICT[lang] || {};
    const key = fr.trim();
    if (table[key] != null) {
      // garder les espaces autour
      return fr.replace(key, table[key]);
    }
    return fr; // pas de traduction → on laisse le FR
  }

  function walk(root, lang) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (n.parentNode && SKIP_TAGS.has(n.parentNode.nodeName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (tw.nextNode()) nodes.push(tw.currentNode);
    nodes.forEach(n => {
      const fr = getOriginal(n);
      n.nodeValue = translateText(fr, lang);
    });
    // attributs placeholder + title
    root.querySelectorAll('[placeholder],[title]').forEach(el => {
      ['placeholder', 'title'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const dataKey = '__orig_' + attr;
        if (el[dataKey] == null) el[dataKey] = el.getAttribute(attr);
        el.setAttribute(attr, translateText(el[dataKey], lang));
      });
    });
  }

  function applyLang(lang) {
    current = lang;
    localStorage.setItem(STORE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    walk(document.body, lang);
    updateButton();
  }

  // ── Switcher UI ──
  let btnEl, menuEl;
  function buildSwitcher() {
    const wrap = document.createElement('div');
    wrap.id = 'papaya-lang';
    wrap.innerHTML = `
      <button id="papaya-lang-btn" type="button" aria-label="Langue"></button>
      <div id="papaya-lang-menu" role="menu"></div>`;
    document.body.appendChild(wrap);

    const style = document.createElement('style');
    style.textContent = `
      #papaya-lang{position:fixed;top:14px;inset-inline-end:14px;z-index:99999;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
      #papaya-lang-btn{display:flex;align-items:center;gap:7px;background:#fff;color:#1a1a1a;border:1px solid #e3e3e3;border-radius:999px;padding:7px 12px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.12)}
      #papaya-lang-btn:hover{background:#f7f7f7}
      #papaya-lang-menu{position:absolute;inset-inline-end:0;margin-top:8px;background:#fff;border:1px solid #ececec;border-radius:14px;box-shadow:0 12px 34px rgba(0,0,0,.16);padding:6px;min-width:170px;display:none}
      #papaya-lang-menu.open{display:block}
      #papaya-lang-menu button{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-radius:9px;padding:9px 12px;font-size:14px;color:#222;cursor:pointer;text-align:start}
      #papaya-lang-menu button:hover{background:#f3f4f6}
      #papaya-lang-menu button.active{color:#16a34a;font-weight:700}
      [dir="rtl"] #papaya-lang-menu button{text-align:right}
    `;
    document.head.appendChild(style);

    btnEl = wrap.querySelector('#papaya-lang-btn');
    menuEl = wrap.querySelector('#papaya-lang-menu');
    menuEl.innerHTML = LANGS.map(l =>
      `<button data-lang="${l.code}"><span>${l.flag}</span><span>${l.label}</span></button>`).join('');

    btnEl.addEventListener('click', e => { e.stopPropagation(); menuEl.classList.toggle('open'); });
    menuEl.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => { applyLang(b.dataset.lang); menuEl.classList.remove('open'); });
    });
    document.addEventListener('click', () => menuEl.classList.remove('open'));
  }

  function updateButton() {
    if (!btnEl) return;
    const l = LANGS.find(x => x.code === current) || LANGS[2];
    btnEl.innerHTML = `<span>${l.flag}</span><span>${l.code.toUpperCase()}</span>`;
    menuEl.querySelectorAll('button').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === current));
  }

  // ── Init ──
  function init() {
    buildSwitcher();
    applyLang(current);
    // Re-traduire le contenu ajouté dynamiquement (toasts, listes, etc.)
    const mo = new MutationObserver(muts => {
      if (current === 'fr') return;
      for (const m of muts) {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1 && n.id !== 'papaya-lang') walk(n, current);
          else if (n.nodeType === 3) { const fr = getOriginal(n); n.nodeValue = translateText(fr, current); }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // exposer pour debug
  window.papayaSetLang = applyLang;
})();

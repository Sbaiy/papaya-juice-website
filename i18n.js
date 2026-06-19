/* ════════════════════════════════════════════════════════════════
   Papaya i18n — FR / AR / EN  (نسخة كاملة)
   • كيدبّر الصفحات الفرنسية و الإنجليزية بجوج
   • زر اللغة داخل الـ nav (نفس design) — RTL للعربية
   • القاموس = [fr, ar, en] لكل عبارة. الـ index كيطابق أي لغة.
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // [fr, ar, en]  — الإيموجي كيتسالى. النصوص-بيانات (أثمنة، عناوين، علامة) ماشي هنا.
  const P = [
    ["← Retour","← رجوع","← Back"],["← Tableau de bord","← لوحة التحكم","← Dashboard"],
    ["Retour","رجوع","Back"],["Dashboard","لوحة التحكم","Dashboard"],["Tableau de bord","لوحة التحكم","Dashboard"],
    ["Menu","القائمة","Menu"],["Admin","المدير","Admin"],["Stock","المخزون","Stock"],
    ["Catégories","التصنيفات","Categories"],["Extras","الإضافات","Extras"],["Recettes","الوصفات","Recipes"],
    ["Personnel","الموظفين","Staff"],["Réclamations","الشكايات","Complaints"],["Réclamation","شكاية","Complaint"],
    ["Commandes","الطلبات","Orders"],["Commandes Live","الطلبات المباشرة","Live Orders"],["Live","مباشر","Live"],
    ["Caisse","الصندوق","Cashier"],["Kiosk","الكشك","Kiosk"],["Point de vente","نقطة البيع","Point of sale"],
    ["Rapport","تقرير","Report"],["Historique","السجل","History"],["Paramètres","الإعدادات","Settings"],
    ["Impression","الطباعة","Printing"],["Notifications","الإشعارات","Notifications"],
    ["Propriétaire","المالك","Owner"],["Papaya Owner","مالك Papaya","Papaya Owner"],
    ["Annuler","إلغاء","Cancel"],["Cancel","إلغاء","Cancel"],["Confirmer","تأكيد","Confirm"],
    ["Fermer","إغلاق","Close"],["Enregistrer","حفظ","Save"],["Modifier","تعديل","Edit"],
    ["Supprimer","حذف","Delete"],["Ajouter","إضافة","Add"],["Imprimer","طباعة","Print"],
    ["Valider","تأكيد","Validate"],["Changer","تغيير","Change"],["Vider","تفريغ","Empty"],
    ["Actualiser","تحديث","Refresh"],["Générer","توليد","Generate"],["Activer","تفعيل","Activate"],
    ["Exporter CSV","تصدير CSV","Export CSV"],["Télécharger (PNG)","تحميل (PNG)","Download (PNG)"],
    ["Se connecter","تسجيل الدخول","Sign in"],["Plus","المزيد","More"],["Tout","الكل","All"],
    ["Voir tout →","عرض الكل →","View all →"],["Masquer","إخفاء","Hide"],["Détails","التفاصيل","Details"],
    ["Réinitialiser","إعادة تعيين","Reset"],["Reset","إعادة تعيين","Reset"],["Reset global","إعادة تعيين شاملة","Global reset"],
    ["OK","موافق","OK"],["Upload","رفع","Upload"],["Find","بحث","Find"],["Rechercher","بحث","Search"],
    ["— Sélectionner —","— اختر —","— Select —"],
    ["En attente","في الانتظار","Pending"],["En cours","قيد التنفيذ","In progress"],
    ["En préparation","قيد التحضير","Preparing"],["Prêt","جاهز","Ready"],["Prêtes","جاهزة","Ready"],
    ["Prêt à servir","جاهز للتقديم","Ready to serve"],["Terminé","منتهي","Done"],["Terminées","منتهية","Completed"],
    ["Done","منتهي","Done"],["Annulé","ملغى","Cancelled"],["Payé","مدفوع","Paid"],["Payée","مدفوعة","Paid"],
    ["Livré","تم التسليم","Delivered"],["Nouvelle commande","طلب جديد","New order"],
    ["Libre","فارغة","Free"],["Occupée","مشغولة","Occupied"],["En ligne","متصل","Online"],
    ["Temps réel","الوقت الحقيقي","Real time"],["Rupture","نفاد","Out of stock"],["Stock faible","مخزون منخفض","Low stock"],
    ["Statut","الحالة","Status"],["Actions","الإجراءات","Actions"],["Date","التاريخ","Date"],
    ["Date & Heure","التاريخ والساعة","Date & Time"],["Employé","الموظف","Employee"],["Employés","الموظفون","Employees"],
    ["Rôle","الدور","Role"],["Serveur","النادل","Waiter"],["Caissier","الصرّاف","Cashier"],
    ["Comptable","المحاسب","Accountant"],["Cuisinier","الطبّاخ","Cook"],["Gérant","المدير","Manager"],["Manager","المدير","Manager"],
    ["Table","الطاولة","Table"],["Total","المجموع","Total"],["Total:","المجموع:","Total:"],["TOTAL","المجموع","TOTAL"],
    ["Sous-total","المجموع الفرعي","Subtotal"],["Total commande","مجموع الطلب","Order total"],
    ["Total commandes","مجموع الطلبات","Total orders"],["Commandes total","مجموع الطلبات","Total orders"],
    ["Total des commandes","مجموع الطلبات","Total orders"],["Total table","مجموع الطاولة","Table total"],
    ["Total clôtures","مجموع الإغلاقات","Total closings"],["Total des catégories","مجموع التصنيفات","Total categories"],
    ["Revenu total","إجمالي المداخيل","Total revenue"],["Revenus du jour","مداخيل اليوم","Today's revenue"],
    ["Chiffre d'affaires","رقم المعاملات","Turnover"],["Montant","المبلغ","Amount"],["Montant (DH)","المبلغ (د.ه)","Amount (DH)"],
    ["Quantité *","الكمية *","Quantity *"],["Qté","الكمية","Qty"],["Article","المادة","Item"],["Articles","المواد","Items"],
    ["Type","النوع","Type"],["Type *","النوع *","Type *"],["Source","المصدر","Source"],["Note","ملاحظة","Note"],
    ["Nom","الاسم","Name"],["Nom complet","الاسم الكامل","Full name"],["Email","البريد الإلكتروني","Email"],
    ["Mot de passe","كلمة السر","Password"],["Désignation","التسمية","Designation"],["Désignation *","التسمية *","Designation *"],
    ["Unité","الوحدة","Unit"],["Valeur","القيمة","Value"],["Période","الفترة","Period"],["ID","المعرّف","ID"],
    ["Avance","سُلفة","Advance"],["Ajustement","تعديل","Adjustment"],["Entrée","دخول","In"],["Sortie","خروج","Out"],
    ["Aujourd'hui","اليوم","Today"],["Hier","البارح","Yesterday"],["Hebdomadaire","أسبوعي","Weekly"],
    ["Mensuel","شهري","Monthly"],["Journalier","يومي","Daily"],["Ce mois","هاد الشهر","This month"],["Mois dernier","الشهر الفائت","Last month"],
    ["7 derniers jours","آخر 7 أيام","Last 7 days"],["Depuis le début","منذ البداية","Since the beginning"],["Avant","قبل","Before"],["Après","بعد","After"],["De","من","From"],
    ["Tous les serveurs","جميع النوادل","All waiters"],["Tous les statuts","جميع الحالات","All statuses"],
    ["Tous les produits","جميع المنتجات","All products"],["Tous les types","جميع الأنواع","All types"],
    ["Toutes les sources","جميع المصادر","All sources"],["Tous les articles","جميع المواد","All items"],
    ["Toutes","الكل","All"],["Sélectionner un employé","اختر موظفاً","Select an employee"],
    ["Sélectionner une période","اختر فترة","Select a period"],
    ["Chargement…","جاري التحميل…","Loading…"],["Chargement...","جاري التحميل...","Loading..."],["Loading…","جاري التحميل…","Loading…"],["Loading...","جاري التحميل...","Loading..."],
    ["Cette action est irréversible.","هذا الإجراء لا رجعة فيه.","This action is irreversible."],
    ["Identifiants incorrects","معطيات الدخول غير صحيحة","Incorrect credentials"],
    ["Mise à jour automatique","تحديث تلقائي","Auto update"],["💡 Cette page se met à jour automatiquement","💡 هذه الصفحة تتحدّث تلقائياً","💡 This page updates automatically"],
    ["Aucun mouvement pour le moment.","لا توجد حركات حالياً.","No movements yet."],
    ["Voulez-vous vraiment vous déconnecter ?","واش متأكد بغيتي تخرج؟","Do you really want to log out?"],
    ["Oui, déconnecter","نعم، خروج","Yes, log out"],["Oui, Clôturer","نعم، إغلاق","Yes, close"],
    ["✔️ Prêt","✔️ جاهز","✔️ Ready"],["🚫 Annulé","🚫 ملغى","🚫 Cancelled"],["⚡ En Préparation","⚡ قيد التحضير","⚡ Preparing"],
    ["⚡ En préparation","⚡ قيد التحضير","⚡ Preparing"],["✓ Terminé","✓ منتهي","✓ Done"],["💰 Paiement","💰 الدفع","💰 Payment"],
    ["✅ Payée","✅ مدفوعة","✅ Paid"],["✅ Livré","✅ تم التسليم","✅ Delivered"],["⏳ En attente","⏳ في الانتظار","⏳ Pending"],
    ["○ En préparation","○ قيد التحضير","○ Preparing"],["○ Prêt à servir","○ جاهز للتقديم","○ Ready to serve"],
    ["⚠️ Faible","⚠️ منخفض","⚠️ Low"],["🔴 Rupture","🔴 نفاد","🔴 Out of stock"],["📋 Tout","📋 الكل","📋 All"],
    ["🔄 Actualiser","🔄 تحديث","🔄 Refresh"],["🚪 Déconnexion","🚪 تسجيل الخروج","🚪 Logout"],["🔊 Activer le son","🔊 تفعيل الصوت","🔊 Enable sound"],
    ["🪑 Plan des tables","🪑 مخطط الطاولات","🪑 Table layout"],["🛒 Ajouter au panier","🛒 أضف إلى السلة","🛒 Add to cart"],
    ["Ajouter au panier","أضف إلى السلة","Add to cart"],["Panier","السلة","Cart"],["Panier vide","السلة فارغة","Empty cart"],
    ["🚀 Envoyer la commande","🚀 إرسال الطلب","🚀 Send order"],["Envoyer la commande","إرسال الطلب","Send order"],
    ["✅ Confirmer","✅ تأكيد","✅ Confirm"],["✅ Confirmer la commande","✅ تأكيد الطلب","✅ Confirm order"],["Confirmer la commande","تأكيد الطلب","Confirm order"],
    ["✕ Fermer","✕ إغلاق","✕ Close"],["✕ Retirer","✕ إزالة","✕ Remove"],["✕ Réinitialiser","✕ إعادة تعيين","✕ Reset"],
    ["📩 Envoyer","📩 إرسال","📩 Send"],["📤 Sortie","📤 خروج","📤 Out"],["📥 Entrée","📥 دخول","📥 In"],
    ["➕ Ajout sur commande","➕ إضافة على الطلب","➕ Add to order"],
    ["Gestion du stock","تدبير المخزون","Stock management"],["Contrôle de stock","مراقبة المخزون","Stock control"],
    ["Stock actuel","المخزون الحالي","Current stock"],["Stock initial","المخزون الأولي","Initial stock"],
    ["Seuil d'alerte (stock faible)","عتبة التنبيه (مخزون منخفض)","Alert threshold (low stock)"],
    ["Mouvement stock","حركة المخزون","Stock movement"],["Mouvements affichés","الحركات المعروضة","Movements shown"],
    ["Historique des mouvements","سجل الحركات","Movements history"],["Articles suivis","المواد المتتبَّعة","Tracked items"],
    ["Articles critiques (faible + rupture)","المواد الحرجة (منخفض + نفاد)","Critical items (low + out)"],
    ["Valeur stock (achat)","قيمة المخزون (شراء)","Stock value (purchase)"],["Prix achat / unité","سعر الشراء / وحدة","Purchase price / unit"],
    ["Prix achat/u","سعر الشراء/و","Purchase/u"],["Entrée / Sortie / Reset","دخول / خروج / إعادة","In / Out / Reset"],["🔄 Reset (nouveau stock)","🔄 إعادة (مخزون جديد)","🔄 Reset (new stock)"],
    ["Gestion du Personnel","تدبير الموظفين","Staff management"],["Gérer le personnel","تدبير الموظفين","Manage staff"],
    ["Ajouter un employé","إضافة موظف","Add employee"],["Salaires du personnel","رواتب الموظفين","Staff salaries"],
    ["Ajouter salaire","إضافة راتب","Add salary"],["Heures travaillées — semaine en cours","ساعات العمل — الأسبوع الحالي","Worked hours — current week"],
    ["Code PIN","رمز PIN","PIN code"],["🔐 Code PIN","🔐 رمز PIN","🔐 PIN code"],
    ["Gérer les catégories","تدبير التصنيفات","Manage categories"],["Ajouter une catégorie","إضافة تصنيف","Add category"],
    ["Image de la catégorie","صورة التصنيف","Category image"],["Supprimer la catégorie ?","حذف التصنيف؟","Delete category?"],
    ["Aperçu du menu","معاينة القائمة","Menu preview"],["Plats actifs","الأطباق النشطة","Active dishes"],["Plats","الأطباق","Dishes"],
    ["Gérer les plats","تدبير الأطباق","Manage dishes"],["Ingrédients par produit","المكونات حسب المنتج","Ingredients per product"],
    ["Clôtures","الإغلاقات","Closings"],["Historique des","سجل","History of"],["Historique clôtures","سجل الإغلاقات","Closings history"],
    ["Toutes les clôtures de caisse enregistrées","جميع إغلاقات الصندوق المسجّلة","All recorded cash closings"],
    ["🔒 Clôture","🔒 إغلاق","🔒 Closing"],["🔒 Clôture de Caisse","🔒 إغلاق الصندوق","🔒 Cash closing"],
    ["Voulez-vous vraiment clôturer la caisse pour aujourd'hui ? Un ticket récapitulatif sera imprimé.","واش متأكد بغيتي تسد الصندوق ديال اليوم؟ غادي تطبع تذكرة ملخّص.","Do you really want to close the cash register for today? A summary ticket will be printed."],
    ["🖨️ Paramètres Impression","🖨️ إعدادات الطباعة","🖨️ Print Settings"],["Imprimantes locales — connectées au PC du kiosk","الطابعات المحلية — متصلة بحاسوب الكشك","Local printers — connected to the kiosk PC"],
    ["🖨️ Imprimantes du PC","🖨️ طابعات الحاسوب","🖨️ PC Printers"],["🔄 Scanner les imprimantes","🔄 فحص الطابعات","🔄 Scan printers"],
    ["🍳 Imprimante Cuisine","🍳 طابعة المطبخ","🍳 Kitchen Printer"],["🧾 Imprimante Addition","🧾 طابعة الفاتورة","🧾 Receipt Printer"],
    ["🧪 Test Cuisine","🧪 اختبار المطبخ","🧪 Test Kitchen"],["🧪 Test Addition","🧪 اختبار الفاتورة","🧪 Test Receipt"],
    ["🔑 Clé API PrintNode","🔑 مفتاح API ديال PrintNode","🔑 PrintNode API Key"],["🔄 Charger imprimantes PrintNode","🔄 تحميل طابعات PrintNode","🔄 Load PrintNode printers"],
    ["🍳 Cuisine (PrintNode)","🍳 المطبخ (PrintNode)","🍳 Kitchen (PrintNode)"],["🧾 Addition (PrintNode)","🧾 الفاتورة (PrintNode)","🧾 Receipt (PrintNode)"],
    ["🧮 Clôture (PrintNode)","🧮 الإغلاق (PrintNode)","🧮 Closing (PrintNode)"],["💾 Enregistrer la configuration","💾 حفظ الإعدادات","💾 Save configuration"],
    ["🖨️ Imprimer + Commandes","🖨️ طباعة + الطلبات","🖨️ Print + Orders"],
    ["Changer le statut de la commande","تغيير حالة الطلب","Change order status"],["Chargement des commandes…","جاري تحميل الطلبات…","Loading orders…"],
    ["Liste des commandes","لائحة الطلبات","Orders list"],["Numéro de commande","رقم الطلب","Order number"],["Commande","طلب","Order"],
    ["Suivi de commande","تتبّع الطلب","Order tracking"],["État de la commande","حالة الطلب","Order status"],
    ["Marquer comme payé","تحديد كمدفوع","Mark as paid"],["Masquer les commandes terminées et payées","إخفاء الطلبات المنتهية والمدفوعة","Hide completed and paid orders"],
    ["Vérifier les tables vides","التحقق من الطاولات الفارغة","Check empty tables"],
    ["🔔 Cliquez pour activer les notifications sonores","🔔 اضغط لتفعيل التنبيهات الصوتية","🔔 Click to enable sound notifications"],
    ["🔔 Commandes en attente","🔔 طلبات في الانتظار","🔔 Pending orders"],["📋 Historique des commandes","📋 سجل الطلبات","📋 Orders history"],
    ["À emporter","للأخذ","Takeaway"],["Comptoir","الكاونتر","Counter"],["🪑 Table","🪑 طاولة","🪑 Table"],
    ["Commande confirmée","تم تأكيد الطلب","Order confirmed"],["Commande confirmée !","تم تأكيد الطلب!","Order confirmed!"],
    ["Merci! Votre commande est en cours de préparation","شكراً! طلبك قيد التحضير","Thank you! Your order is being prepared"],
    ["La cuisine prépare votre commande avec soin","المطبخ كيحضّر طلبك بعناية","The kitchen is preparing your order with care"],
    ["Votre commande est en route!","طلبك في الطريق!","Your order is on the way!"],["Votre commande a été servie. Bon appétit!","تم تقديم طلبك. بالصحة والراحة!","Your order has been served. Enjoy!"],
    ["❌ Votre commande a été annulée.","❌ تم إلغاء طلبك.","❌ Your order has been cancelled."],["Vérifiez votre commande avant d'envoyer","تحقّق من طلبك قبل الإرسال","Check your order before sending"],
    ["Codes QR par table","رموز QR حسب الطاولة","QR codes per table"],["Code QR","رمز QR","QR code"],
    ["Un QR code unique pour chaque table de votre restaurant","رمز QR فريد لكل طاولة في مطعمك","A unique QR code for each table in your restaurant"],
    ["Notre menu","قائمتنا","Our Menu"],["Voir le menu","عرض القائمة","View Menu"],["À propos","معلومات عنا","About"],
    ["Accueil","الرئيسية","Home"],["Histoire","قصتنا","Story"],["Contact","اتصل بنا","Contact"],["Localisation","الموقع","Location"],
    ["Ajouter à la commande","أضف إلى الطلب","Add to Order"],["Jus naturel","عصير طبيعي","Natural Juice"],
    ["Boissons","المشروبات","Drinks"],["Petits-déjeuners","الفطور","Breakfasts"],["Crêpes et pancakes","كريب وبانكيك","Crepes and Pancakes"],
    ["Jeux","الألعاب","Games"],["Bienvenue à","مرحباً بكم في","Welcome to"],
    // ── dashboard / accueil ──
    ["du restaurant","ديال المطعم","of the restaurant"],
    ["Bienvenue à Papaya Juice!","مرحباً بكم في Papaya Juice!","Welcome to Papaya Juice!"],
    ["Connectez-vous pour accéder au tableau de bord","سجّل الدخول للوصول إلى لوحة التحكم","Sign in to access the dashboard"],
    ["Commandes du jour","طلبات اليوم","Today's orders"],["Aperçu du menu","نظرة على القائمة","Menu overview"],
    ["Total des catégories","مجموع التصنيفات","Total categories"],["Plats actifs","الأطباق النشطة","Active dishes"],
    ["Cuisine","المطبخ","Kitchen"],["Fidélité","الولاء","Loyalty"],["Code QR","رمز QR","QR code"],
    ["sur","من","of"],
    // ── notifications ──
    ["Notifications","الإشعارات","Notifications"],["Tout marquer comme lu","تحديد الكل كمقروء","Mark all as read"],
    ["Rupture de stock","نفاد المخزون","Out of stock"],["Stock faible","مخزون منخفض","Low stock"],
    ["est en rupture","نافد","is out of stock"],["restant","متبقّي","remaining"],["seuil","الحد","threshold"],
    ["Aucune notification","لا توجد إشعارات","No notifications"],
    // ── titres / prefixes split ──
    ["Gérer les","تدبير","Manage"],["Gestion du","تدبير","Management of"],
    // ── catégories (form) ──
    ["Ajouter, modifier et organiser les catégories du menu","إضافة، تعديل وتنظيم تصنيفات القائمة","Add, edit and organize menu categories"],
    ["Nom (Français)","الاسم (فرنسية)","Name (French)"],["Nom (English)","الاسم (إنجليزية)","Name (English)"],
    ["Nombre max d'articles","أقصى عدد للمواد","Max number of items"],["🔗 URL","🔗 رابط","🔗 URL"],
    ["+ Ajouter","+ إضافة","+ Add"],["IMAGE","صورة","IMAGE"],
    ["NOM (FR)","الاسم (FR)","NAME (FR)"],["NOM (EN)","الاسم (EN)","NAME (EN)"],["NOM (AR)","الاسم (AR)","NAME (AR)"],
    ["MAX ARTICLES","أقصى عدد","MAX ITEMS"],["Ex: Boissons Chaudes","مثال: مشروبات ساخنة","E.g. Hot Drinks"],
    ["E.g. Hot Drinks","مثال: مشروبات ساخنة","E.g. Hot Drinks"],["Rechercher...","بحث...","Search..."],
    ["∞ (illimité)","∞ (غير محدود)","∞ (unlimited)"],
    // ── menu client + admin ──
    ["Loading menu…","جاري تحميل القائمة…","Loading menu…"],["Total commande","مجموع الطلب","Order total"],
    ["Détecté depuis le QR code","تم الكشف من رمز QR","Detected from QR code"],
    ["🪑 Numéro de table (optionnel)","🪑 رقم الطاولة (اختياري)","🪑 Table number (optional)"],
    ["📝 Note / Remarque (optionnel)","📝 ملاحظة (اختياري)","📝 Note (optional)"],
    ["💬 Réclamation","💬 شكاية","💬 Complaint"],
    ["Votre avis nous aide à améliorer notre service","رأيك كيساعدنا نحسّنو الخدمة","Your feedback helps us improve our service"],
    ["Nom (optionnel)","الاسم (اختياري)","Name (optional)"],
    ["Photos (optionnel · max 3)","صور (اختياري · 3 كحد أقصى)","Photos (optional · max 3)"],
    ["Appuyer pour ajouter","اضغط للإضافة","Tap to add"],
    ["Menu Management","تدبير القائمة","Menu Management"],["+ Add New Item","+ إضافة عنصر جديد","+ Add New Item"],
    ["Sélectionner une catégorie","اختر تصنيفاً","Select a category"],["+ Add Item","+ إضافة عنصر","+ Add Item"],
    ["Item Name (e.g. Coca-Cola)","اسم العنصر (مثلا Coca-Cola)","Item Name (e.g. Coca-Cola)"],
    ["Short Description (Optional)","وصف قصير (اختياري)","Short Description (Optional)"],
    ["Prix Table / Normal (DH)","ثمن الطاولة / عادي (د.ه)","Table / Normal Price (DH)"],
    ["Prix Kiosk (DH)","ثمن الكشك (د.ه)","Kiosk Price (DH)"],
    ["CATEGORY","التصنيف","CATEGORY"],["NAME","الاسم","NAME"],["DESCRIPTION","الوصف","DESCRIPTION"],
    ["PRIX TABLE","ثمن الطاولة","TABLE PRICE"],["PRIX KIOSK","ثمن الكشك","KIOSK PRICE"],
    ["AVAIL.","متوفّر","AVAIL."],["EXTRAS","الإضافات","EXTRAS"],["CATÉGORIE","التصنيف","CATEGORY"],
    // ── qr-tables ──
    ["QR Codes","رموز QR","QR Codes"],["Unique QR code for each table","رمز QR فريد لكل طاولة","Unique QR code for each table"],
    ["Chaque table aura son propre code QR unique","كل طاولة غادي يكون عندها رمز QR خاص بيها","Each table will have its own unique QR code"],
    // ── personnel ──
    ["Ajoutez et gérez le personnel : gérant, serveurs, cuisiniers, caissiers, comptables","أضف ودبّر الموظفين: مدير، نوادل، طباخين، صرّافين، محاسبين","Add and manage staff: manager, waiters, cooks, cashiers, accountants"],
    ["Chaque salaire ajoute automatiquement une dépense catégorie SALARY.","كل راتب كيزيد تلقائياً مصروف من تصنيف SALARY.","Each salary automatically adds a SALARY category expense."],
    ["Lun","الإثنين","Mon"],["Mar","الثلاثاء","Tue"],["Mer","الأربعاء","Wed"],["Jeu","الخميس","Thu"],
    ["Ven","الجمعة","Fri"],["Sam","السبت","Sat"],["Dim","الأحد","Sun"],
    ["Salaire","راتب","Salary"],["Salaires","الرواتب","Salaries"],["Dépense","مصروف","Expense"],["Dépenses","المصاريف","Expenses"],
  ];

  const LANGS = [{c:'ar',l:'العربية',f:'🇲🇦'},{c:'en',l:'English',f:'🇬🇧'},{c:'fr',l:'Français',f:'🇫🇷'}];
  const STORE = 'papaya_lang';
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','OPTION']);

  const IDX = {};
  P.forEach(function(a){ var o={fr:a[0],ar:a[1],en:a[2]}; [a[0],a[1],a[2]].forEach(function(v){ if(v && IDX[v]==null) IDX[v]=o; }); });

  let cur = localStorage.getItem(STORE) || 'fr';
  const orig = new WeakMap();
  function O(n){ if(!orig.has(n)) orig.set(n,n.nodeValue); return orig.get(n); }
  function T(txt,lang){ if(txt==null) return txt; var e=IDX[txt.trim()]; return e? txt.replace(txt.trim(), e[lang]) : txt; }

  function walk(root,lang){
    if(root.nodeType===3){ root.nodeValue=T(O(root),lang); return; }
    var tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      if(!n.nodeValue||!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if(n.parentNode&&SKIP.has(n.parentNode.nodeName)) return NodeFilter.FILTER_REJECT;
      if(n.parentNode&&n.parentNode.closest&&n.parentNode.closest('#papaya-lang')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var ns=[]; while(tw.nextNode()) ns.push(tw.currentNode);
    ns.forEach(function(n){ n.nodeValue=T(O(n),lang); });
    (root.querySelectorAll?root.querySelectorAll('[placeholder],[title]'):[]).forEach(function(el){
      ['placeholder','title'].forEach(function(a){ if(!el.hasAttribute(a)) return; var k='__o_'+a; if(el[k]==null) el[k]=el.getAttribute(a); el.setAttribute(a,T(el[k],lang)); });
    });
  }
  function apply(lang){
    cur=lang; localStorage.setItem(STORE,lang);
    document.documentElement.lang=lang;
    // ما كنقلبوش التخطيط كامل لـ RTL (كيسبّب تداخل الأيقونات + قلب الوقت).
    // كنخلّيو التخطيط ثابت — العربية كتبان مزيان بفضل bidi ديال المتصفّح.
    document.documentElement.dir='ltr';
    walk(document.body,lang); upd();
  }

  let btn,menu;
  function build(){
    var nav=document.querySelector('.topbar')||document.querySelector('header.topbar')||document.querySelector('.glass-header')||document.querySelector('.main-header')||document.querySelector('nav')||document.querySelector('header');
    var w=document.createElement('div'); w.id='papaya-lang';
    w.innerHTML='<button id="pl-btn" type="button" aria-label="Langue"></button><div id="pl-menu" role="menu"></div>';
    var s=document.createElement('style'); s.textContent=`
      #papaya-lang{position:relative;display:inline-flex;align-items:center;font-family:inherit;flex:0 0 auto}
      #pl-btn{display:flex;align-items:center;gap:7px;background:var(--glass,rgba(255,255,255,.08));color:var(--text,#fff);border:1px solid var(--border,rgba(255,255,255,.18));border-radius:999px;padding:7px 13px;font-size:14px;font-weight:700;cursor:pointer;line-height:1;white-space:nowrap;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
      #pl-btn:hover{border-color:var(--orange,#f59e0b)}
      #pl-menu{position:absolute;inset-inline-end:0;top:calc(100% + 8px);background:var(--glass,#1c2620);border:1px solid var(--border,rgba(255,255,255,.18));border-radius:14px;box-shadow:0 14px 34px rgba(0,0,0,.4);padding:6px;min-width:172px;display:none;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);z-index:99999}
      #pl-menu.open{display:block}
      #pl-menu button{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-radius:9px;padding:10px 12px;font-size:14px;color:var(--text,#fff);cursor:pointer;text-align:start;font-family:inherit}
      #pl-menu button:hover{background:var(--glass-hov,rgba(255,255,255,.08))}
      #pl-menu button.active{color:var(--orange,#f59e0b);font-weight:800}
      #pl-menu button span:first-child{font-size:17px}`;
    document.head.appendChild(s);
    if(nav){
      nav.style.alignItems='center'; if(!nav.style.gap) nav.style.gap='10px';
      var k=Array.from(nav.children); if(k.length){ nav.style.justifyContent='flex-start'; k[k.length-1].style.marginInlineStart='auto'; }
      nav.appendChild(w);
    } else { w.style.position='fixed'; w.style.top='14px'; w.style.insetInlineEnd='14px'; w.style.zIndex='99999'; document.body.appendChild(w); }
    btn=w.querySelector('#pl-btn'); menu=w.querySelector('#pl-menu');
    menu.innerHTML=LANGS.map(function(x){return '<button data-lang="'+x.c+'"><span>'+x.f+'</span><span>'+x.l+'</span></button>';}).join('');
    btn.addEventListener('click',function(e){e.stopPropagation();menu.classList.toggle('open');});
    menu.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){apply(b.dataset.lang);menu.classList.remove('open');});});
    document.addEventListener('click',function(){menu.classList.remove('open');});
  }
  function upd(){ if(!btn) return; var l=LANGS.find(function(x){return x.c===cur;})||LANGS[2]; btn.innerHTML='<span>'+l.f+'</span><span>'+l.c.toUpperCase()+'</span>'; menu.querySelectorAll('button').forEach(function(b){b.classList.toggle('active',b.dataset.lang===cur);}); }

  function init(){
    build(); apply(cur);
    new MutationObserver(function(ms){ if(cur==='fr') return; ms.forEach(function(m){m.addedNodes.forEach(function(n){
      if(n.nodeType===1&&n.id!=='papaya-lang'&&!(n.closest&&n.closest('#papaya-lang'))) walk(n,cur);
      else if(n.nodeType===3) n.nodeValue=T(O(n),cur);
    });}); }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.papayaSetLang=apply;
})();

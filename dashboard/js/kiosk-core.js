// === Papaya Kiosk · kiosk-core.js ===
// Coeur du kiosk — produits, panier, tickets, impression, PIN/auth, realtime, offline

const BACKEND_URL = 'https://papaya-juice-backend-production.up.railway.app';
const SECRET_PIN  = '1234';

// ── Supabase Realtime (lecture seule — writes via backend) ──
const SUPABASE_URL = "https://rlwshuurruvtnqwgbjkl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3NodXVycnV2dG5xd2diamtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzkzMjAsImV4cCI6MjA5NDg1NTMyMH0.PV4EpbydpLTS36OVyaqy9qANWRec7B9F-emlaS0qqRw";
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Broadcast channel — يبعت ويسمع إشارات بدون ما يقرا من DB
const _broadcastChannel = _supabase.channel("papaya-broadcast");
let _broadcastReady = false;
// subscribe() يتسمى بعد .on() في _nopStartPolling
async function _broadcastOrder(event, orderData) {
  // استنى subscribe إلا مازال ما وقعش
  if (!_broadcastReady) await new Promise(r => setTimeout(r, 1000));
  try { await _broadcastChannel.send({ type: "broadcast", event, payload: orderData }); }
  catch(e) { console.warn("Broadcast failed:", e); }
}
let pendingAction = '';

let allProducts = [];
let terrasseMode = false; // true = prix kiosk actif

// Helper: retourne le prix kiosk (terrasse) si terrasseMode actif, sinon prix normal
function getKioskPrice(product) {
    if (terrasseMode && product.price_kiosk != null && product.price_kiosk !== '') {
        return parseFloat(product.price_kiosk);
    }
    return parseFloat(product.price) || 0;
}
let _productExtrasCache = {}; // productId -> groups[] (loaded once at startup)
let filteredProducts = [];
let currentCategory = '';
let searchQuery = '';
let cart = [];
let _localOrderCounter = parseInt(localStorage.getItem('papaya_order_counter') || '0');
let _modifMode = null; // null = normal | { orderId, orderNumber, tableNumber } = mode ajout sur commande existante
let categoryMap = {};
let categoriesOrder = []; // ordered list from API

if (sessionStorage.getItem('papaya_auth') !== '1' && !localStorage.getItem('papaya_token')) {
    window.location.replace('/dashboard');
}

function updateClock() {
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    document.getElementById('clock').textContent =
        `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
updateClock();
setInterval(updateClock, 30000);

// ── PIN MODAL (cloture uniquement) ──
function openPinModal(action) {
    pendingAction = action;
    document.getElementById('pinInput').value = '';
    document.getElementById('pinModal').style.display = 'flex';
    // Enregistrer l'heure de login UNIQUEMENT à l'ouverture (pas lors d'une clôture)
    if (action !== 'cloture') {
        localStorage.setItem('papaya_kiosk_login_time', new Date().toISOString());
    }
}
function _syncPinDots() {
    const len = document.getElementById('pinInput').value.length;
    document.querySelectorAll('.pin-dot').forEach((d, i) => {
        d.classList.toggle('filled', i < len);
    });
}
function addPin(num) {
    const input = document.getElementById('pinInput');
    if (input.value.length < 4) { input.value += num; _syncPinDots(); }
}
function clearPin() { document.getElementById('pinInput').value = ''; _syncPinDots(); }
function checkPin() {
    const input = document.getElementById('pinInput');
    if (input.value === SECRET_PIN) {
        document.getElementById('pinModal').style.display = 'none';
        if (pendingAction === 'cloture') {
            validerCloture();
        }
    } else {
        input.value = '';
        showToast('❌ Code PIN incorrect');
    }
}

// ── LOGOUT CONFIRM ──
function openLogoutConfirm() {
    document.getElementById('logoutModal').style.display = 'flex';
}
function doLogout() {
    document.getElementById('logoutModal').style.display = 'none';
    if (typeof API !== 'undefined') API.Auth.logout();
    else { sessionStorage.clear(); location.href = '/dashboard'; }
}

// ── CLOTURE MODAL ──
function openClotureModal()  { document.getElementById('clotureModal').style.display = 'flex'; }
function closeClotureModal() { document.getElementById('clotureModal').style.display = 'none'; }

// ── PRODUCTS ──
async function loadProducts() {
    try {
        const [data, cats] = await Promise.all([
            API.menu.getAll(),
            API.menu.getCategories()
        ]);
        allProducts = data || [];
        categoriesOrder = (cats || []).map(c => c.name_fr || c.name_en || c.name_ar).filter(Boolean);
        categoriesData = {};
        (cats || []).forEach(c => { const name = c.name_fr || c.name_en || c.name_ar; if (name) categoriesData[name] = c; });
        categoryMap = {};
        if (!window.categoriesData) window.categoriesData = {};
        allProducts.forEach(p => { categoryMap[p.category] = (categoryMap[p.category] || 0) + 1; });
        document.getElementById('count-all')?.textContent && (document.getElementById('count-all').textContent = allProducts.length);
        buildCategoryNav();
        filteredProducts = allProducts;
        renderProducts();

        // ── Preload ALL extras in background (no lag on click) ──
        _productExtrasCache = {};
        allProducts.forEach(async p => {
            try {
                const r = await fetch(API_BASE + `/extras/product/${p.id}`);
                if (r.ok) {
                    const groups = await r.json();
                    _productExtrasCache[p.id] = groups || [];
                } else {
                    _productExtrasCache[p.id] = [];
                }
            } catch(e) { _productExtrasCache[p.id] = []; }
        });

        // ── Preload ALL product images into browser memory cache ──
        // Toutes les images sont chargées en arrière-plan une seule fois.
        // Après ça, changer de catégorie = zéro lag (images déjà en RAM).
        const _imgCache = {};
        let _loaded = 0, _total = allProducts.filter(p => p.image).length;
        allProducts.forEach(p => {
            if (!p.image || _imgCache[p.image]) return;
            p.image = p.image.replace('/upload/', '/upload/q_auto,f_auto/');
            const img = new Image();
            img.onload = img.onerror = () => {
                _loaded++;
                if (_loaded === _total) {
                    document.getElementById('sectionSub').textContent =
                        filteredProducts.length + ' produit' + (filteredProducts.length !== 1 ? 's' : '') + ' · ✓ images prêtes';
                }
            };
            _imgCache[p.image] = img;
            img.src = p.image;   // déclenche le téléchargement maintenant
        });

        // Pré-cacher aussi dans le Service Worker (persistance entre sessions)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            allProducts.forEach(p => {
                if (p.image) navigator.serviceWorker.controller.postMessage({ type: 'CACHE_IMAGE', url: p.image });
            });
        }
    } catch(err) {
        document.getElementById('productsGrid').innerHTML = `<div class="state-msg"><div class="state-icon">⚠️</div><div class="state-title">Impossible de charger les produits</div><div class="state-sub">${err.message}</div></div>`;
        document.getElementById('sectionSub').textContent = 'Erreur de connexion';
    }
}

const CATEGORY_ICONS = {'Boissons Chaudes':'☕','Café':'☕','Jus Nature':'🥤','Jus':'🍊','Restaurant':'🍽️','Petits Déjeuners':'🥐','Déjeuner':'🥗','Dîner':'🍴','Desserts':'🍰','Snacks':'🥨','Sandwichs':'🥪','Pizzas':'🍕','Burgers':'🍔','Salades':'🥗','Boissons Froides':'🧊','Smoothies':'🫙','Milkshakes':'🥛'};
function getCatIcon(cat) { return CATEGORY_ICONS[cat] || '🍴'; }
function getCatImg(cat) {
    const data = (window.categoriesData || {})[cat];
    if (data && data.image) return `<img src="${data.image.replace("/upload/", "/upload/q_auto,f_auto/")}" style="width:22px;height:22px;border-radius:5px;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML='<span>${getCatIcon(cat)}</span>'">`;
    return `<span class="nav-emoji">${getCatIcon(cat)}</span>`;
}

function buildCategoryNav() {
    const nav = document.getElementById('categoryNav');
    const firstItem = nav.querySelector('.nav-item-all');
    nav.innerHTML = '';
    nav.appendChild(firstItem);
    const sortedCats = Object.keys(categoryMap).sort((a, b) => {
        const ia = categoriesOrder.indexOf(a);
        const ib = categoriesOrder.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });
    sortedCats.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'nav-item'; item.dataset.cat = cat;
        item.onclick = () => filterCategory(item, cat);
        const data = (window.categoriesData || {})[cat];
        const hasImg = data && data.image;
        item.innerHTML = hasImg
            ? `<img class="cat-card-img" src="${data.image.replace("/upload/", "/upload/q_auto,f_auto/")}" alt="${cat}" onerror="this.style.display='none'">
               <div class="cat-card-overlay"></div>
               <div class="cat-card-label">${cat}</div>`
            : `<div class="cat-card-emoji">${getCatIcon(cat)}</div>
               <div class="cat-card-overlay" style="background:linear-gradient(to top,rgba(0,0,0,0.6) 40%,transparent 100%);"></div>
               <div class="cat-card-label">${cat}</div>`;
        nav.appendChild(item);
    });
}

function filterCategory(el, cat) {
    currentCategory = cat;
    document.querySelectorAll('.nav-item, .nav-item-all').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('sectionTitle').textContent = cat || 'Tous les produits';
    applyFilters();
}
function filterSearch(q) { searchQuery = q.toLowerCase().trim(); applyFilters(); }
function applyFilters() {
    filteredProducts = allProducts.filter(p => {
        const matchCat = !currentCategory || p.category === currentCategory;
        const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery) || (p.description||'').toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
    });
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const sub = document.getElementById('sectionSub');
    sub.textContent = `${filteredProducts.length} produit${filteredProducts.length !== 1 ? 's' : ''}`;
    if (!filteredProducts.length) {
        grid.innerHTML = `<div class="state-msg"><div class="state-icon">🔍</div><div class="state-title">Aucun produit trouvé</div><div class="state-sub">Essayez une autre recherche ou catégorie</div></div>`;
        return;
    }
    grid.innerHTML = filteredProducts.map(p => {
        const imgHtml = p.image ? `<img src="${p.image.replace("/upload/", "/upload/q_auto,f_auto/")}" alt="${p.title}" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
        const placeholderStyle = p.image ? 'display:none' : '';
        const unavailable = p.disponible === false;
        return `<div class="product-card${unavailable?' unavailable':''}" onclick="${unavailable?'':` addToCart(${p.id})`}">
            <div class="product-img-area">${imgHtml}<div class="product-placeholder" style="${placeholderStyle}">${getCatIcon(p.category)}</div>${unavailable?'<div class="badge-unavailable">Indisponible</div>':''}</div>
            <div class="product-body"><div class="product-cat">${p.category}</div><div class="product-name">${p.title}</div><div class="product-desc">${p.description||''}</div>
            <div class="product-footer"><div class="product-price">${getKioskPrice(p).toFixed(2)} DH</div><button class="btn-add">+</button></div></div></div>`;
    }).join('');
}

// ── CART ──
function addToCart(productId) {
    // FIX: ila l modal dyal extras déjà 7el, khassna nbloquiw click jdid —
    // bla hadshi _eselProduct kayt-overwrite w l produit l khta yzad b ghalt (bug "haja akhra" f ticket)
    const eselModal = document.getElementById('extrasSelModal');
    if (eselModal && eselModal.classList.contains('open')) return;

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    // Use preloaded cache — zero lag
    const groups = _productExtrasCache[productId];
    if (groups === undefined) {
        // Cache not ready yet (rare), fallback to direct add
        _addToCartDirect(product, []);
        return;
    }
    if (groups.length > 0) {
        openExtrasSelectionModal(product, groups);
        return;
    }
    _addToCartDirect(product, []);
}
function _addToCartDirect(product, selectedExtras) {
    const existing = cart.find(i => i.product.id === product.id && JSON.stringify(i.extras||[]) === JSON.stringify(selectedExtras));
    if (existing && !selectedExtras.length) { existing.qty++; }
    else { cart.push({ product, qty: 1, extras: selectedExtras }); }
    renderCart();
}
function changeQty(productId, delta) {
    const idx = cart.findIndex(i => i.product.id === productId);
    if (idx === -1) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    renderCart();
}
function changePrice(productId, delta) {
    const idx = cart.findIndex(i => i.product.id === productId);
    if (idx < 0) return;
    const originalPrice = getKioskPrice(cart[idx].product);
    const current = parseFloat(cart[idx].customPrice ?? originalPrice);
    const newPrice = parseFloat((current + delta).toFixed(2));
    cart[idx].customPrice = Math.max(originalPrice, newPrice);
    renderCart();
}
function removeItem(productId) { cart = cart.filter(i => i.product.id !== productId); renderCart(); }
function clearCart() { _modifMode = null; cart = []; const sel = document.getElementById("tableSelect"); if (sel) sel.value = ""; renderProducts(); renderCart(); }

// Toggle Terrasse — bascule entre prix kiosk et prix normal
function toggleTerrasse() {
    terrasseMode = !terrasseMode;
    const btn = document.getElementById('btnTerrasse');
    if (btn) {
        btn.classList.toggle('active', terrasseMode);
        btn.textContent = terrasseMode ? '↓' : '↑';
    }
    cart.forEach(item => { delete item.customPrice; });
    renderProducts();
    renderCart();
}

// Quand on change de type de table, reset les customPrices pour recalculer avec le bon tarif
function onTableTypeChange() {
    renderCart(); // ما نمسحش الأثمنة اليدوية (customPrice) ملي تبدّل الطاولة
}

// Click sur le prix dans le cart → input éditable
function editCartPrice(productId) {
    const span = document.getElementById('price-display-' + productId);
    if (!span || span.querySelector('input')) return;
    const idx = cart.findIndex(i => i.product.id === productId);
    if (idx < 0) return;
    const basePrice = getKioskPrice(cart[idx].product);
    const current = parseFloat(cart[idx].customPrice ?? basePrice);
    span.style.borderBottom = 'none';
    span.innerHTML = `<input id="cprice-${productId}" type="number" step="0.5" value="${current.toFixed(2)}" style="width:62px;font-size:12px;font-weight:700;color:var(--orange);background:var(--card-hover);border:1px solid var(--orange);border-radius:6px;padding:2px 4px;text-align:center;outline:none;" onclick="event.stopPropagation()">`;
    const inp = document.getElementById('cprice-' + productId);
    inp.focus(); inp.select();
    function save() {
        const val = parseFloat(inp.value);
        if (!isNaN(val) && val >= 0) {
            cart[idx].customPrice = val;
        }
        renderCart();
    }
    inp.addEventListener('blur', save);
    inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') inp.blur();
        if (e.key === 'Escape') { cart[idx].customPrice = current; renderCart(); }
    });
}

function renderCart() {
    const totalQty = cart.reduce((s,i) => s+i.qty, 0);
    const badge = document.getElementById('cartBadge');
    badge.textContent = totalQty;
    badge.classList.toggle('show', totalQty > 0);
    const empty = document.getElementById('cartEmpty');
    const items = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    const btnOrder = document.getElementById('btnOrder');
    const btnClearHeader = document.getElementById('btnClearHeader'); if (!cart.length) { empty.style.display='flex'; items.style.display='none'; summary.style.display='none'; btnOrder.disabled=true; btnClearHeader.style.display='none'; return; } btnClearHeader.style.display='inline-block';
    empty.style.display='none'; items.style.display='block'; summary.style.display='block'; btnOrder.disabled=false;
    items.innerHTML = cart.map(({product:p, qty}) => {
        const imgEl = p.image ? `<img class="cart-item-img" src="${p.image.replace("/upload/", "/upload/q_auto,f_auto/")}" alt="${p.title}" loading="lazy" decoding="async" onerror="this.style.display='none'">` : `<div class="cart-item-img-placeholder">${getCatIcon(p.category)}</div>`;
        const cartItem = cart.find(i => i.product.id === p.id);
        const extrasPrice = (cartItem?.extras || []).reduce((s, e) => s + (e.priceAdd || 0), 0);
        const basePrice = parseFloat(cartItem?.customPrice ?? getKioskPrice(p)) || 0;
        const displayPrice = (basePrice + extrasPrice).toFixed(2);
        const extrasHtml = (cartItem?.extras || []).length > 0
          ? `<div style="font-size:10.5px;color:rgba(255,255,255,0.4);margin-top:2px;line-height:1.4;">${(cartItem.extras||[]).map(e=>`+ ${e.optionName}`).join(', ')}</div>`
          : '';
        return `<div class="cart-item">${imgEl}<div class="cart-item-info"><div class="cart-item-name">${p.title}</div>${extrasHtml}<div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;"><div style="display:flex;align-items:center;gap:6px;"><button class="qty-btn" onclick="changeQty(${p.id},-1)">−</button><span class="qty-val" style="font-size:13px;font-weight:700;min-width:20px;text-align:center;">${qty}</span><button class="qty-btn" onclick="changeQty(${p.id},1)">+</button></div><div style="display:flex;align-items:center;gap:6px;"><button class="qty-btn" onclick="changePrice(${p.id},-1)" ${parseFloat(cartItem?.customPrice ?? getKioskPrice(p)) <= getKioskPrice(p) ? "disabled style='opacity:0.3;cursor:not-allowed'" : ""}>−</button><span id="price-display-${p.id}" onclick="editCartPrice(${p.id})" style="font-size:12px;font-weight:700;color:var(--orange);min-width:60px;text-align:center;cursor:pointer;border-bottom:1px dashed var(--orange);padding-bottom:1px;" title="Cliquer pour modifier">${displayPrice} DH</span><button class="qty-btn" onclick="changePrice(${p.id},1)">+</button></div></div></div><button class="cart-item-remove" onclick="removeItem(${p.id})">✕</button></div>`;
    }).join('');
    const sub = cart.reduce((s,i) => {
        const extrasPrice = (i.extras||[]).reduce((ea, e) => ea + (e.priceAdd || 0), 0);
        return s + (parseFloat(i.customPrice ?? getKioskPrice(i.product)) + extrasPrice) * i.qty;
    }, 0);
    document.getElementById('subtotal').textContent = sub.toFixed(2)+' DH';
    document.getElementById('total').textContent = sub.toFixed(2)+' DH';
    // Mode ajout — mettre à jour le banner et le bouton
    const banner = document.getElementById('modifBanner');
    if (_modifMode) {
        // FIX: yakhd orderNumber (ticket_number) machi orderId (ID Supabase)
        document.getElementById('modifBannerText').textContent = `➕ Ajout #${_modifMode.orderNumber||'?'} — Table ${_modifMode.tableNumber||'?'}`;
        banner.style.display = 'flex';
        btnOrder.textContent = 'Confirmer l\'ajout';
        btnOrder.style.background = 'var(--orange)';
    } else {
        banner.style.display = 'none';
        btnOrder.textContent = 'Envoyer la commande';
        btnOrder.style.background = '';
    }
}

// ── PRINT ──

// Ticket cuisine avec prix
function generateKitchenTicket(cartItems, table, orderId=null) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const dateStr = now.toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric'});
    const ticketNum = orderId ? String(orderId).padStart(4,'0') : String(now.getTime()).slice(-4);
    const tableDisplay = table === 'emporter' ? 'À Emporter' : table === 'comptoir' ? 'Comptoir' : table === 'terrasse' ? '☀️ Terrasse' : `Table N° ${table.replace('T','')}`;
    const W = 48;
    const sep  = '='.repeat(W);
    const sep2 = '-'.repeat(W);
    const center = (txt) => ' '.repeat(Math.max(0, Math.floor((W - txt.length) / 2))) + txt;

    // Ligne article: prefix '>> ' + qty + nom + prix collé à droite — total = W exact
    const PREFIX = '  >> ';
    const itemLine = (qty, name, price) => {
        const qtyStr   = `${qty}x`;
        const priceStr = `${price} DH`;
        const maxName  = W - PREFIX.length - qtyStr.length - 1 - priceStr.length - 1;
        const nameStr  = name.substring(0, maxName).padEnd(maxName, ' ');
        return `${PREFIX}${qtyStr} ${nameStr} ${priceStr}`;
    };

    let lines = [
        '',
        center('*** BON DE CUISINE ***'),
        sep,
        `Cmd : #${ticketNum}`,
        `Date: ${dateStr}  ${timeStr}`,
        tableDisplay,
        sep2,
        ''
    ];

    let total = 0;
    cartItems.forEach(i => {
        const unitPrice = parseFloat(i.customPrice ?? getKioskPrice(i.product)) || 0;
        const lineTotal = unitPrice * i.qty;
        const exSum = (i.extras||[]).reduce((a,e)=>a+(parseFloat(e.priceAdd)||0),0) * i.qty;
        total += lineTotal + exSum; // total inclut les extras (la ligne reste au prix de base)
        lines.push(itemLine(i.qty, i.product.title, lineTotal.toFixed(2)));
        // Print extras below the item
        if (i.extras && i.extras.length > 0) {
            i.extras.forEach(e => {
                const extLine = `     + ${e.optionName}${e.priceAdd > 0 ? ` (+${e.priceAdd.toFixed(2)} DH)` : ''}`;
                lines.push(extLine);
            });
        }
    });

    lines.push('');
    lines.push(sep2);
    const totalStr = `TOTAL: ${total.toFixed(2)} DH`;
    lines.push(' '.repeat(W - totalStr.length) + totalStr);
    lines.push(sep);
    lines.push('');
    return lines.join('\n');
}

function generateTextTicket(cartItems, table, total, orderId=null) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric'});
    const timeStr = now.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const userName = document.getElementById('userName').textContent || 'Kiosk';
    const ticketNum = orderId ? String(orderId).padStart(4,'0') : String(now.getTime()).slice(-4);

    const W = 48; // largeur ticket = 48 caractères
    const sep1 = '-'.repeat(W);
    const sep2 = '='.repeat(W);
    const ESC = '\x1B', GS = '\x1D';

    // Header centré
    const center = (txt) => {
        const pad = Math.max(0, Math.floor((W - txt.length) / 2));
        return ' '.repeat(pad) + txt;
    };

    // Bar du haut: table/mode (gauche) + numéro ticket (droite), en reverse vidéo
    const barLeft = table === 'comptoir' ? 'COMPTOIR'
        : table === 'emporter' ? 'À EMPORTER'
        : table === 'terrasse' ? 'TERRASSE'
        : `TABLE N°${table.replace('T','')}`;
    const barRight = `#${ticketNum}`;
    const barPad   = Math.max(1, W - barLeft.length - barRight.length);
    const barLine  = barLeft + ' '.repeat(barPad) + barRight;

    // Ligne article: qty + nom + prix collé à droite
    const itemLine = (qty, name, price) => {
        const qtyStr   = `${qty}x`;
        const priceStr = `${price} DH`;
        const maxName  = W - qtyStr.length - 1 - priceStr.length - 1;
        const nameStr  = name.substring(0, maxName).padEnd(maxName, ' ');
        return `${qtyStr} ${nameStr} ${priceStr}`;
    };

    let itemsRows = '';
    cartItems.forEach(i => {
        const unitPrice = parseFloat(i.customPrice ?? getKioskPrice(i.product)) || 0;
        const price = (unitPrice * i.qty).toFixed(2);
        itemsRows += itemLine(i.qty, i.product.title, price) + '\n';
        // Print extras below the item
        if (i.extras && i.extras.length > 0) {
            i.extras.forEach(e => {
                itemsRows += `     + ${e.optionName}${e.priceAdd > 0 ? ` (+${e.priceAdd.toFixed(2)} DH)` : ''}\n`;
            });
        }
    });

    // Total — gros caractères (double largeur, comme le titre)
    const totalLabel = 'TOTAL';
    const totalStr    = `${total} DH`;
    const totalPad    = Math.max(1, Math.floor(W/2) - totalLabel.length - totalStr.length);
    const totalLine   = ESC + '\x21\x30' + totalLabel + ' '.repeat(totalPad) + totalStr + ESC + '\x21\x00';

    // En-tête colonne aligné
    const qteHeader   = 'Qte';
    const totalHeader = 'Total';
    const artHeader   = 'Article'.padEnd(W - qteHeader.length - 1 - totalHeader.length - 1, ' ');
    const headerLine  = `${qteHeader} ${artHeader} ${totalHeader}`;

    // Générer le texte brut directement (pour ESC/POS propre)
    const plainTicket = [
        // Bar reverse vidéo: fond noir / texte blanc (nécessite support GS B sur l'imprimante)
        GS + '\x42\x01' + barLine + GS + '\x42\x00',
        '',
        // ESC/POS double-width+bold pour le titre (suivi d'un saut de ligne)
        ESC + '\x21\x30' + (()=>{ const t='PAPAYA JUICE'; const pad=Math.max(0,Math.floor((Math.floor(W/2)-t.length)/2)); return ' '.repeat(pad)+t; })() + ESC + '\x21\x00\n',
        center("L'excellence du Gout"),
        sep1,
        `Date: ${dateStr} - ${timeStr}`,
        `Serveur: ${userName}`,
        sep1,
        headerLine,
        '',
        itemsRows.trimEnd(),
        sep1,
        totalLine,
        sep2,
        center('Merci de votre visite !'),
        center('A bientot !'),
        '',
    ].join('\n');

    // Retourner en format HTML (pour fallback browser print) ET stocker le texte brut
    return `<pre style="font-family:'Courier New',monospace;font-size:10px;line-height:1.6;white-space:pre;">${plainTicket}</pre>`;
}
    

// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
//  PRINT SYSTEM — Local uniquement
//  Cuisine + Addition → imprimantes Windows installées sur le PC
//  via node print-server.js (localhost:3001)
// ════════════════════════════════════════════════════════

let _usbSerialPort = null;

// ── Encode text → ESC/POS base64 + uint8 ──
function _encodeEscPos(content) {
    let text = content;
    if (!content.includes('\n') || content.trim().startsWith('<')) {
        const tmp = document.createElement('pre');
        tmp.style.cssText = 'position:absolute;left:-9999px;white-space:pre-wrap;';
        tmp.innerHTML = content;
        document.body.appendChild(tmp);
        text = tmp.innerText || tmp.textContent || '';
        document.body.removeChild(tmp);
    }
    const ESC = '\x1B', GS = '\x1D';
    const ticket = ESC + '@' + ESC + 'a\x00' + text + ESC + 'd\x03' + GS + 'V\x41\x03';
    const bytes = [];
    for (let i = 0; i < ticket.length; i++) bytes.push(ticket.charCodeAt(i) & 0xFF);
    const uint8 = new Uint8Array(bytes);
    let bin = '';
    uint8.forEach(b => bin += String.fromCharCode(b));
    return { uint8, base64: btoa(bin) };
}

// ── Print local générique — par nom d'imprimante Windows (RAW) ──
async function _printLocal(content, printerName, queueId = null, orderId = null) {
    if (!printerName) throw new Error('Imprimante non configurée');
    const { base64 } = _encodeEscPos(content);
    const body = { content_base64: base64, printer_name: printerName };
    if (queueId)  body.queue_id  = queueId;
    if (orderId)  body.order_id  = String(orderId);
    const res = await fetch('http://localhost:3001/print/usb', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error('Print erreur ' + res.status);
}

// ── Addition → imprimante Windows configurée ──
async function _printUSB(content, orderId = null) {
    const cfg = JSON.parse(localStorage.getItem('papaya_print_config') || '{}');
    await _printLocal(content, cfg.usbPrinterName, null, orderId);
}

// ── Cuisine → imprimante Windows configurée ──
async function _printKitchen(content, orderId = null) {
    const cfg = JSON.parse(localStorage.getItem('papaya_print_config') || '{}');
    await _printLocal(content, cfg.kitchenPrinterName, null, orderId);
}

// ── Clôture (local) → imprimante Clôture dédiée, sinon retombe sur l'Addition ──
async function _printClotureLocal(content) {
    const cfg = JSON.parse(localStorage.getItem('papaya_print_config') || '{}');
    await _printLocal(content, cfg.cloturePrinterName || cfg.usbPrinterName);
}

// ════════════════════════════════════════════════════════
//  ANTI-DOUBLE (dedup) — cross-tab via localStorage
//  Nefs ticket (محتوى+نوع) → ما يطبعش مرتين ف نافذة قصيرة.
//  Nafida 6s: kتقتل l-doubles l-automatiques (li كيوقعو ف <2s)،
//  walakin kتسمح b reprint manuel (li l-cashier kيديرو b3d ما يشوف l-ticket).
// ════════════════════════════════════════════════════════
const _PRINT_DEDUP_MS = 6000;
function _hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return (h >>> 0).toString(36);
}
function _printDedupCheck(key) {
    const now = Date.now();
    let map = {};
    try { map = JSON.parse(localStorage.getItem('_printDedup') || '{}'); } catch (e) {}
    for (const k in map) if (now - map[k] > 60000) delete map[k]; // nettoyage
    if (map[key] && (now - map[key]) < _PRINT_DEDUP_MS) return false; // déjà imprimé récemment
    map[key] = now;
    try { localStorage.setItem('_printDedup', JSON.stringify(map)); } catch (e) {}
    return true;
}

// ── Wrapper principal — LOCAL UNIQUEMENT (localhost:3001) ──
//   • Anti-double: dedup 3la contenu ticket → ZERO double
//   • File d'attente localStorage si print-server occupé → retry auto 10s
async function printViaPrintNode(content, type = 'kitchen', orderId = null) {
    // Anti-double — zid orderId f key bach kol order 3ndu dedup unique
    const dedupKey = type + ':' + (orderId ? orderId + ':' : '') + _hashStr(content);
    if (!_printDedupCheck(dedupKey)) {
        console.warn('Double-print bloqué (dedup):', dedupKey);
        return;
    }

    // LOCAL uniquement
    try {
        if (type === 'cash')         { await _printUSB(content, orderId); }
        else if (type === 'cloture') { await _printClotureLocal(content); }
        else                         { await _printKitchen(content, orderId); }
        return; // ✅ imprimé
    } catch (eLocal) {
        console.warn('Print local KO → queue:', eLocal.message);
    }

    // File d'attente localStorage — retry auto kol 10s
    const { base64 } = _encodeEscPos(content);
    const cfg = JSON.parse(localStorage.getItem('papaya_print_config') || '{}');
    let printerName, queueKey;
    if (type === 'cash') {
        printerName = cfg.usbPrinterName;
        queueKey = '_pq_cash';
    } else if (type === 'cloture') {
        printerName = cfg.cloturePrinterName || cfg.usbPrinterName;
        queueKey = '_pq_cloture';
    } else {
        printerName = cfg.kitchenPrinterName;
        queueKey = '_pq';
    }
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    queue.push({ base64, printerName, ts: Date.now() });
    localStorage.setItem(queueKey, JSON.stringify(queue));
    if (!_syncInterval) _startSyncPolling();
}

// ── Flush queues cuisine + addition + cloture (retry auto kol 10s) ──
async function _flushPrintJobs() {
    for (const queueKey of ['_pq', '_pq_cash', '_pq_cloture']) {
        const jobs = JSON.parse(localStorage.getItem(queueKey) || '[]');
        if (!jobs.length) continue;
        const remaining = [];
        for (const job of jobs) {
            try {
                const res = await fetch('http://localhost:3001/print/usb', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content_base64: job.base64, printer_name: job.printerName }),
                    signal: AbortSignal.timeout(6000)
                });
                if (!res.ok) remaining.push(job);
            } catch(e) { remaining.push(job); }
        }
        localStorage.setItem(queueKey, JSON.stringify(remaining));
    }
}

// ── Retry automatique dyal tous les tickets qui ont échoué ──
setInterval(() => {
    const has = ['_pq','_pq_cash','_pq_cloture'].some(k => JSON.parse(localStorage.getItem(k)||'[]').length);
    if (has) _flushPrintJobs();
}, 10000);

// ── Popup confirmation commande — f cart sidebar ──
function _showOrderConfirmPopup(orderNum) {
    const old = document.getElementById('_orderConfirmOverlay');
    if (old) old.remove();

    // Cherche l-cart sidebar
    const cartSidebar = document.querySelector('.cart-sidebar') || document.querySelector('aside');
    if (!cartSidebar) return;

    const popup = document.createElement('div');
    popup.id = '_orderConfirmOverlay';
    popup.style.cssText = [
        'position:absolute', 'inset:0', 'z-index:100',
        'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center',
        'background:var(--cart-bg, #161b22)',
        'padding:24px'
    ].join(';');

    popup.innerHTML = `
      <div style="width:68px;height:68px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px;flex-shrink:0;">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#e6edf3;margin-bottom:6px;text-align:center;">Commande confirmée !</div>
      <div style="font-size:13px;color:#7d8590;margin-bottom:12px;">Numéro de commande</div>
      <div style="font-size:42px;font-weight:800;color:var(--orange,#f97316);margin-bottom:12px;">#${orderNum}</div>
      <div style="font-size:13px;color:#7d8590;margin-bottom:6px;text-align:center;">Votre commande sera préparée bientôt</div>
      <div style="font-size:12px;color:#4a5568;margin-bottom:28px;">Nouvelle commande dans quelques secondes…</div>
      <button id="_confirmPopupBtn" style="width:100%;padding:14px 16px;background:#21262d;border:1px solid #30363d;border-radius:12px;color:#4a5568;font-size:14px;font-weight:600;cursor:not-allowed;display:flex;align-items:center;justify-content:center;gap:10px;font-family:'Syne',sans-serif;">
        <span style="font-size:18px;line-height:1;">+</span> Nouvelle commande maintenant
      </button>`;

    // Position relative sur le parent
    const prevPosition = cartSidebar.style.position;
    cartSidebar.style.position = 'relative';
    cartSidebar.appendChild(popup);

    // Enabled b3d 1.5s
    setTimeout(() => {
        const btn = document.getElementById('_confirmPopupBtn');
        if (!btn) return;
        btn.style.cursor = 'pointer';
        btn.style.color = '#e6edf3';
        btn.style.background = '#21262d';
        btn.style.borderColor = 'var(--orange,#f97316)';
        btn.onclick = () => {
            popup.remove();
            cartSidebar.style.position = prevPosition;
        };
    }, 1500);

    // Auto-ferme b3d 8s
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
            cartSidebar.style.position = prevPosition;
        }
    }, 8000);
}

// ── SUBMIT ORDER ──

// ── ORDER CONFIRM POPUP — supprimé (code mort: jamais affiché/utilisé) ──

let _submitBusy = false; // FIX double-click guard
async function submitOrder() {
    if (!cart.length) return;
    if (_submitBusy) return; // double-click — ignore
    _submitBusy = true;

    // ── MODE AJOUT SUR COMMANDE EXISTANTE ──
    if (_modifMode) {
        // 🔒 SNAPSHOT الهدف + الـ articles فاش كتدوس → ما يتبدّلوش وسط الطريق
        const modifTarget = _modifMode;                 // الطلب المستهدف (مقفول)
        const cartSnapshot = cart.map(({product,qty,customPrice,extras}) => ({ product, qty, customPrice, extras }));
        const btnOrder = document.getElementById('btnOrder');
        btnOrder.disabled = true; btnOrder.textContent = 'Envoi…';
        try {
            const newItems = cartSnapshot.map(({product,qty,customPrice,extras}) => ({
                id: product.id, title: product.title,
                price: parseFloat(customPrice ?? getKioskPrice(product)), qty,
                category: product.category || '',
                extras: extras || []
            }));
            const token = localStorage.getItem('papaya_token');

            // 1. Ajouter les articles
            const addRes = await fetch(BACKEND_URL + '/api/orders/' + modifTarget.orderId + '/add-items', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ items: newItems })
            });
            if (!addRes.ok) { const e = await addRes.json(); throw new Error(e.error || 'Erreur serveur'); }
            const updatedOrder = await addRes.json();

            // 2. Imprimer IMMÉDIATEMENT (bla tntsna step status — zero retard)
            //    FIX TICKET#: yakhd orderNumber (ticket_number) machi orderId (ID Supabase)
            const tableVal = modifTarget.tableNumber || 'Comptoir';
            const ticketId = modifTarget.orderNumber || String(modifTarget.orderId).slice(-4).padStart(4,'0');
            const newCartItems = newItems.map(i => ({
                product: { title: i.title, price: parseFloat(i.price||0), category: i.category||'' },
                qty: i.qty || 1,
                customPrice: parseFloat(i.price||0),
                extras: i.extras || []
            }));
            // ticket cuisine — newItems ghir + ticketId sahi
            const kitchenTicket = generateKitchenTicket(newCartItems, tableVal, ticketId);
            printViaPrintNode(kitchenTicket, 'kitchen').catch(e => console.warn('Kitchen print:', e));
            // addition — bl updatedOrder li ja mn backend (total sahi)
            _printAdditionTicket({ ...updatedOrder, ticket_number: modifTarget.orderNumber }, newItems)
                .catch(e => console.warn('Addition print:', e));

            // ✅ نجح → نخرجو mن mode ajout 9بل أي حاجة أخرى (باش الطلب الجاي ما يتلصقش)
            cancelModifMode();

            // 3. Mettre en préparation (fire & forget — machi await bach ma ykon retard)
            fetch(BACKEND_URL + '/api/orders/' + modifTarget.orderId + '/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ status: 'preparing' })
            }).then(r => r.ok ? r.json() : updatedOrder)
              .then(finalOrder => _broadcastOrder('update_order', { ...finalOrder, status: 'en_preparation', new_items: newItems }))
              .catch(() => _broadcastOrder('update_order', { ...updatedOrder, status: 'en_preparation', new_items: newItems }));

            // 4. Mettre à jour histAllOrders si ouvert
            const idx = histAllOrders.findIndex(x => x.id === updatedOrder.id);
            if (idx !== -1) histAllOrders[idx] = { ...histAllOrders[idx], ...updatedOrder, status: 'preparing' };
            _histUpdateUI && _histUpdateUI();

            showToast('✅ Commande modifiée + en préparation !');
        } catch(err) {
            // ❌ فشل → نخرجو mن mode ajout (باش الطلب الجاي ما يتلصقش بالقديم)
            //    الـ articles كنخليوهم ف الـ panier → الكاسير يعاود يدوس "Envoyer" = طلب جديد نظيف.
            _modifMode = null;
            renderCart(); // button kayرجع "Envoyer la commande" (الـ articles باقيين)
            showToast('❌ Échec ajout. Articles gardés — clique "Envoyer" pour les envoyer en nouvelle commande.');
            btnOrder.disabled = false;
        } finally {
            _submitBusy = false; // reset guard
        }
        return;
    }

    // ── MODE NORMAL — nouvelle commande ──
    const tableVal = document.getElementById('tableSelect').value || (terrasseMode ? 'terrasse' : 'Comptoir');
    const btnOrder = document.getElementById('btnOrder');
    try {
        // ── Snapshot SYNCHRONE = source EXACTE du ticket (= ce que le caissier voit dans le panier) ──
        const cartSnapshot = cart.map(({product,qty,customPrice,extras}) => ({ product, qty, customPrice, extras }));
        _localOrderCounter++;
        localStorage.setItem('papaya_order_counter', _localOrderCounter);
        const localId = _localOrderCounter;

        // Total calculé localement (base + extras) — pas besoin du backend pour le prix
        const finalTotalNum = cartSnapshot.reduce((s,i) => {
            const ex = (i.extras||[]).reduce((a,e)=>a+(parseFloat(e.priceAdd)||0),0);
            return s + (parseFloat(i.customPrice ?? getKioskPrice(i.product)) + ex) * i.qty;
        }, 0);
        const finalTotal = finalTotalNum.toFixed(2);

        // ⚡️ IMPRESSION IMMÉDIATE depuis le panier (local d'abord) — AVANT le backend
        //    → ticket khroj <0.5s · contenu = panier EXACT (zéro divergence) · zéro double (dedup)
        const kitchenTicket  = generateKitchenTicket(cartSnapshot, tableVal, localId);
        const additionTicket = generateTextTicket(cartSnapshot, tableVal, finalTotal, localId);
        printViaPrintNode(kitchenTicket, 'kitchen', localId).catch(e => console.warn('Kitchen print:', e));
        printViaPrintNode(additionTicket, 'cash', localId).catch(e => console.warn('Cash print:', e));

        // UI libérée tout de suite (le caissier peut enchaîner la commande suivante)
        clearCart();
        btnOrder.textContent = 'Envoyer la commande';
        btnOrder.disabled = false;
        _submitBusy = false;

        // ── Popup confirmation ──
        _showOrderConfirmPopup(localId);

        const orderPayload = {
            table_number: tableVal,
            items: cartSnapshot.map(({product,qty,customPrice,extras}) => ({id:product.id,title:product.title,price:parseFloat(customPrice??getKioskPrice(product)),qty,category:product.category||'',extras:extras||[]})),
            total: finalTotalNum,
            status: 'pending',
            source: 'kiosk',
            ticket_number: localId,
            serveur: document.getElementById('userName').textContent.trim() || 'Kiosk'
        };

        // ── Backend en arrière-plan : stockage + realtime SEULEMENT (n'imprime jamais) ──
        (async () => {
            try {
                const createdOrder = await API.orders.create(orderPayload);
                if (createdOrder) _broadcastOrder('new_order', { ...createdOrder, status: 'en_preparation' });
            } catch(e) {
                // backend injoignable → commande en file (tickets déjà sortis en local)
                _oqPush(orderPayload, true); // printed:true → JAMAIS de réimpression au retour du WiFi
                _isOffline = true;
                _showOfflineBanner();
                _startSyncPolling();
            }
        })();
    } catch(err) {
        showToast('❌ Erreur: ' + err.message);
        btnOrder.disabled = false;
        _submitBusy = false;
        btnOrder.textContent = 'Envoyer la commande';
    }
}

// ── HISTORIQUE MODAL ──
let histAllOrders = [];
let histCurrentFilter = '';
const HIST_STATUS_LABELS = {
    pending:{label:'En attente',icon:'🕐'}, paid:{label:'Payé',icon:'💰'},
    preparing:{label:'En préparation',icon:'🍳'}, ready:{label:'Prêt',icon:'✅'},
    done:{label:'Terminé',icon:'✔️'}, cancelled:{label:'Annulé',icon:'✕'},
    en_attente:{label:'En attente',icon:'🕐'}, paiement:{label:'Payé',icon:'💰'},
    en_preparation:{label:'En préparation',icon:'🍳'}, pret:{label:'Prêt',icon:'✅'},
    termine:{label:'Terminé',icon:'✔️'}, annule:{label:'Annulé',icon:'✕'},
};

function getStatusClass(status) {
    const map = {pending:'pending',en_attente:'pending',paid:'paid',paiement:'paid',preparing:'preparing',en_preparation:'preparing',ready:'ready',pret:'ready',done:'done',termine:'done',cancelled:'cancelled',annule:'cancelled'};
    return map[status] || 'pending';
}

let historiqueRefreshInterval = null;
let _histRealtimeChannel = null;

function _histNormalizeOrders(orders) {
    const STATUS_NORM = {en_attente:'pending',paiement:'paid',en_preparation:'preparing',pret:'ready',termine:'done',delivered:'done',annule:'cancelled','annulé':'cancelled','canceled':'cancelled'};
    const loginTime = localStorage.getItem('papaya_kiosk_login_time');
    orders.forEach(o => {
        o.status = STATUS_NORM[o.status] || o.status;
        if (o.status && o.status.toLowerCase().includes('annul')) o.status = 'cancelled';
    });
    const filtered = loginTime ? orders.filter(o => new Date(o.created_at) >= new Date(loginTime)) : orders;
    filtered.sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
    return filtered;
}

function _histUpdateUI() {
    const counts = {};
    histAllOrders.forEach(o => { counts[o.status] = (counts[o.status]||0)+1; });
    const allBadge = document.getElementById('hist-count-all');
    if (allBadge) allBadge.textContent = histAllOrders.length;
    ['pending','paid','preparing','ready','done','cancelled'].forEach(s => {
        const el = document.getElementById('hist-count-'+s);
        if (el) el.textContent = counts[s] ? counts[s] : '';
    });
    document.getElementById('hist-subtitle').textContent = histAllOrders.length + ' commande' + (histAllOrders.length!==1?'s':'') + " aujourd'hui";
    const listEl = document.getElementById('hist-list');
    if (listEl) { const scrollTop = listEl.scrollTop; renderHistOrders(); listEl.scrollTop = scrollTop; }
}

function openHistoriqueModal() {
    document.getElementById('historiqueModal').style.display = 'flex';
    histCurrentFilter = '';
    document.querySelectorAll('#historiqueModal .hist-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.status === '');
    });
    loadHistoriqueOrders();

    // Broadcast pour le modal historique — بدل postgres_changes
    if (_histRealtimeChannel) return;
    _histRealtimeChannel = true; // flag باش ما يتخلقش مرتين
    const STATUS_NORM = {en_attente:'pending',paiement:'paid',en_preparation:'preparing',pret:'ready',termine:'done',delivered:'done',annule:'cancelled','annulé':'cancelled','canceled':'cancelled'};
    _broadcastChannel
      .on('broadcast', { event: 'new_order' }, ({ payload }) => {
          const o = { ...payload };
          o.status = STATUS_NORM[o.status] || o.status;
          if (o.status && o.status.toLowerCase().includes('annul')) o.status = 'cancelled';
          histAllOrders = [o, ...histAllOrders];
          _histUpdateUI();
      })
      .on('broadcast', { event: 'update_order' }, ({ payload }) => {
          const o = { ...payload };
          o.status = STATUS_NORM[o.status] || o.status;
          if (o.status && o.status.toLowerCase().includes('annul')) o.status = 'cancelled';
          const idx = histAllOrders.findIndex(x => x.id === o.id);
          if (idx !== -1) histAllOrders[idx] = o;
          _histUpdateUI();
      });
}

function closeHistoriqueModal() {
    document.getElementById('historiqueModal').style.display = 'none';
    // Garder le channel actif pour ne pas reconnecter à chaque ouverture
}

async function loadHistoriqueOrders() {
    const listEl = document.getElementById('hist-list');
    if (!histAllOrders.length) {
        listEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">Chargement…</div>';
    }

    // ── Toujours afficher les orders offline en attente ──
    const offlineQueue = _oqLoad();
    const offlineFakeHist = offlineQueue.map((item, i) => ({
        id: 'offline-' + i,
        table_number: item.payload.table_number,
        items: item.payload.items,
        total: item.payload.total,
        status: 'pending',
        created_at: new Date(item.ts || Date.now()).toISOString(),
        _offline: true // flag pour affichage
    }));

    try {
        const token = localStorage.getItem('papaya_token');
        const res = await fetch(BACKEND_URL + '/api/orders', { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Erreur serveur ' + res.status);
        const newOrdersRes = await res.json();
        const newOrders = Array.isArray(newOrdersRes) ? newOrdersRes : (newOrdersRes.data || []);
        // Merge avec les orders déjà reçus via Realtime (éviter doublons)
        const fetchedNorm = _histNormalizeOrders(newOrders);
        const realtimeOnly = histAllOrders.filter(r => !fetchedNorm.find(f => f.id === r.id) && !String(r.id).startsWith('offline-'));
        histAllOrders = _histNormalizeOrders([...fetchedNorm, ...realtimeOnly, ...offlineFakeHist]);
        _histUpdateUI();
    } catch(e) {
        // Offline → afficher au moins les orders locaux
        const existing = histAllOrders.filter(r => !String(r.id).startsWith('offline-'));
        histAllOrders = _histNormalizeOrders([...existing, ...offlineFakeHist]);
        _histUpdateUI();
        if (!histAllOrders.length) listEl.innerHTML = `<div style="text-align:center;padding:40px;color:#f87171;">❌ ${e.message}</div>`;
    }
}

function histFilterStatus(btn, status) {
    histCurrentFilter = status;
    document.querySelectorAll('#historiqueModal .hist-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderHistOrders();
}

function renderHistOrders() {
    const filtered = histCurrentFilter ? histAllOrders.filter(o => o.status===histCurrentFilter) : histAllOrders;
    const list = document.getElementById('hist-list');
    if (!filtered.length) { list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">Aucune commande</div>'; document.getElementById('hist-footer-info').innerHTML = ''; return; }
    const totalAmt = filtered.reduce((s,o) => s+parseFloat(o.total||0), 0);
    document.getElementById('hist-footer-info').innerHTML = `<b>${filtered.length}</b> commande${filtered.length!==1?'s':''} &nbsp;·&nbsp; <span style="color:#3fb950;font-weight:700">${totalAmt.toFixed(2)} DH</span>`;
    list.innerHTML = filtered.map(o => {
        const st = HIST_STATUS_LABELS[o.status] || {label:o.status, icon:'❓'};
        const stClass = getStatusClass(o.status);
        const rawItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        const items = rawItems.map(i=>`${i.qty}x ${i.title}`).join(', ');
        const time = o.created_at ? new Date(o.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '';
        const payment = o.payment_method ? `<span style="font-size:11px;color:var(--muted);">${o.payment_method}</span>` : '';
        // FIX: yachri ticket_number (counter local 1,2,3...) idha mawjoud, wla ID backend
        const idShort = o.ticket_number
            ? String(o.ticket_number).padStart(4,'0')
            : String(o.id||'');
        const orderJson = encodeURIComponent(JSON.stringify(o));
        const caissierName = o.caissier || o.serveur || o.created_by || '';
        const caissierBadge = caissierName ? `<span style="font-size:11px;color:var(--muted);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:2px 8px;display:inline-flex;align-items:center;gap:4px;">👤 ${caissierName}</span>` : '';
        const offlineBadge = o._offline ? `<span style="font-size:11px;font-weight:700;background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.4);color:#fb923c;border-radius:20px;padding:2px 8px;">📵 Non sync</span>` : '';
        return `<div class="hist-order">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">
              <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;">#${idShort}</span>
              <span class="hist-status ${stClass}">${st.icon} ${st.label}</span>${caissierBadge}${offlineBadge}${payment}
            </div>
            <div style="font-size:11px;color:var(--muted);">${time?`<span>${time}</span>`:''} ${o.table_number?`&nbsp;·&nbsp; <b style="color:var(--text)">${o.table_number==='terrasse'?'☀️ Terrasse':'Table '+o.table_number}</b>`:''} ${items?`&nbsp;·&nbsp; ${items}`:''}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-right:8px;">
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--orange);">${parseFloat(o.total||0).toFixed(2)}</div>
            <div style="font-size:10px;color:var(--muted);">DH</div>
          </div>
${o.status === 'preparing' ? `<button onclick="updateOrderStatusFromKiosk('${o.id}', 'ready')"
            style="padding:6px 14px;border-radius:8px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#4ade80;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;font-family:'DM Sans',sans-serif;">✅ Prêt</button>` : ''}
${o.status === 'ready' ? `<button onclick="updateOrderStatusFromKiosk('${o.id}', 'done')"
            style="padding:6px 14px;border-radius:8px;background:rgba(100,116,139,0.15);border:1px solid rgba(100,116,139,0.3);color:#94a3b8;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;font-family:'DM Sans',sans-serif;">🏁 Terminer</button>` : ''}
${(o.status !== 'cancelled' && o.status !== 'annule' && o.status !== 'annulé') ? `<button onclick="openModifierModal('${orderJson}')" title="Ajouter des articles"
            style="width:36px;height:36px;border-radius:8px;background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.3);color:#fb923c;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:4px;">➕</button>` : ''}
${o.status === 'done' || o.status === 'termine' ? `<button onclick="printAdditionOrder('${orderJson}')" title="Imprimer addition"
            style="width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#60a5fa;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:4px;">🧾</button>` : ''}
        </div>`;
    }).join('');
}

// ── MODIFIER COMMANDE ──
let _modifAllProducts = null; // gardé pour compatibilité

function cancelModifMode() {
    _modifMode = null;
    cart = [];
    // renderCart() كيرجع بكري ملي الـ panier خاوي → خاصنا نرجّعو هادو هنا مباشرة:
    const sel = document.getElementById('tableSelect');
    if (sel) sel.value = '';                                  // رجّع الطاولة لـ — Sélectionner —
    const banner = document.getElementById('modifBanner');
    if (banner) banner.style.display = 'none';               // خبّي بانر "Ajout #… — Table …"
    const btnOrder = document.getElementById('btnOrder');
    if (btnOrder) { btnOrder.textContent = 'Envoyer la commande'; btnOrder.style.background = ''; }
    renderCart();
    // Si le modal historique est ouvert, le garder — sinon rien
}

async function openModifierModal(encodedOrder) {
    const o = JSON.parse(decodeURIComponent(encodedOrder));
    const idShort = o.ticket_number
        ? String(o.ticket_number).padStart(4,'0')
        : String(o.id||'');

    // Activer le mode ajout
    _modifMode = {
        orderId: o.id,
        orderNumber: idShort,
        tableNumber: o.table_number || 'Comptoir'
    };
    cart = [];

    // Fermer le modal historique pour laisser place au kiosk
    closeHistoriqueModal();

    // Mettre à jour le tableSelect pour matcher la table de la commande
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect && o.table_number) {
        // Chercher l'option qui correspond
        for (const opt of tableSelect.options) {
            if (opt.value === o.table_number || opt.value === String(o.table_number)) {
                tableSelect.value = opt.value;
                break;
            }
        }
    }

    renderCart();
    showToast(`📋 Mode ajout — Commande #${idShort}`);
}

// Imprimer addition (ticket caisse) pour les nouveaux articles
async function _printAdditionTicket(order, newItems) {
    const cfg = JSON.parse(localStorage.getItem('papaya_print_config')||'{}');
    if (!cfg.usbPrinterName) return;
    try {
        // Récupérer tous les items (anciens + nouveaux)
        const existingItems = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
        // Construire cartItems format compatible avec generateTextTicket
        const allCartItems = existingItems.map(i => ({
            product: { title: i.title || i.name || '', price: parseFloat(i.price || 0), category: i.category || '' },
            qty: i.qty || i.quantity || 1,
            customPrice: parseFloat(i.price || 0)
        }));
        const tableVal = order.table_number || 'comptoir';
        const total = parseFloat(order.total || 0).toFixed(2);
        // Générer le ticket avec le même format que le ticket original
        // mais avec header ADDITION
        // FIX: yakhd ticket_number (counter local) machi ID Supabase
        const ticketContent = generateAdditionTicket(allCartItems, tableVal, total, order.ticket_number || order.id, newItems);
        await printViaPrintNode(ticketContent, 'cash');
    } catch(e) { console.warn('Impression addition:', e.message); }
}

function generateAdditionTicket(cartItems, table, total, orderId, newItems) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric'});
    const timeStr = now.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const userName = document.getElementById('userName').textContent || 'Kiosk';
    // FIX: ticket_number (1,2,3...) machi ID Supabase (94, 750...)
    const ticketNum = orderId ? String(orderId).padStart(4,'0') : String(now.getTime()).slice(-4);
    const supplement = newItems.reduce((s,i) => { const ex=(i.extras||[]).reduce((a,e)=>a+(parseFloat(e.priceAdd)||0),0); return s + (parseFloat(i.price||0)+ex)*(i.qty||1); }, 0).toFixed(2);

    const W = 48;
    const sep1 = '-'.repeat(W);
    const sep2 = '='.repeat(W);
    const ESC = '\x1B', GS = '\x1D';

    const center = (txt) => {
        const pad = Math.max(0, Math.floor((W - txt.length) / 2));
        return ' '.repeat(pad) + txt;
    };

    // Bar du haut: table/mode (gauche) + numéro ticket (droite), en reverse vidéo
    const barLeft = table === 'comptoir' ? 'COMPTOIR'
        : table === 'emporter' ? 'À EMPORTER'
        : table === 'terrasse' ? 'TERRASSE'
        : `TABLE N°${table.replace('T','')}`;
    const barRight = `#${ticketNum}`;
    const barPad   = Math.max(1, W - barLeft.length - barRight.length);
    const barLine  = barLeft + ' '.repeat(barPad) + barRight;

    const itemLine = (qty, name, price, isNew) => {
        const qtyStr   = `${qty}x`;
        const priceStr = `${price} DH`;
        const marker   = isNew ? '+' : ' ';
        const maxName  = W - qtyStr.length - 1 - priceStr.length - 1 - 1;
        const nameStr  = name.substring(0, maxName).padEnd(maxName, ' ');
        return `${marker}${qtyStr} ${nameStr} ${priceStr}`;
    };

    const newTitles = newItems.map(i => (i.title||i.name||'').toLowerCase());
    let itemsRows = '';
    cartItems.forEach(i => {
        const unitPrice = parseFloat(i.customPrice ?? getKioskPrice(i.product)) || 0;
        const price = (unitPrice * i.qty).toFixed(2);
        const isNew = newTitles.includes((i.product.title||'').toLowerCase());
        itemsRows += itemLine(i.qty, i.product.title, price, isNew) + '\n';
    });

    // Total — gros caractères (double largeur, comme le ticket principal)
    const totalLabel = 'TOTAL';
    const totalStr    = `${total} DH`;
    const totalPad    = Math.max(1, Math.floor(W/2) - totalLabel.length - totalStr.length);
    const totalLine   = ESC + '\x21\x30' + totalLabel + ' '.repeat(totalPad) + totalStr + ESC + '\x21\x00';

    const suppLabel  = 'SUPPLEMENT:';
    const suppStr    = `${supplement} DH`;
    const suppPad    = Math.max(1, W - suppLabel.length - suppStr.length);
    const suppLine   = suppLabel + ' '.repeat(suppPad) + suppStr;

    const qteHeader   = 'Qte';
    const totalHeader = 'Total';
    const artHeader   = 'Article'.padEnd(W - qteHeader.length - 2 - totalHeader.length - 1, ' ');
    const headerLine  = ` ${qteHeader} ${artHeader} ${totalHeader}`;

    const plainTicket = [
        // Bar reverse vidéo: fond noir / texte blanc (nécessite support GS B sur l'imprimante)
        GS + '\x42\x01' + barLine + GS + '\x42\x00',
        '',
        ESC + '\x21\x30' + (()=>{ const t='PAPAYA JUICE'; const pad=Math.max(0,Math.floor((Math.floor(W/2)-t.length)/2)); return ' '.repeat(pad)+t; })() + ESC + '\x21\x00\n',
        center('AJOUT ARTICLES'),
        sep1,
        `Date: ${dateStr} - ${timeStr}`,
        `Serveur: ${userName}`,
        sep1,
        headerLine,
        '',
        itemsRows.trimEnd(),
        sep1,
        suppLine,
        sep2,
        totalLine,
        sep2,
        center('Merci de votre visite !'),
        center('A bientot !'),
        '',
    ].join('\n');

    return `<pre style="font-family:'Courier New',monospace;font-size:10px;line-height:1.6;white-space:pre;">${plainTicket}</pre>`;
}

// Imprimer addition complète depuis historique (tous les articles)
async function printAdditionOrder(encodedOrder) {
    const o = JSON.parse(decodeURIComponent(encodedOrder));
    try {
        const idShort = o.ticket_number ? String(o.ticket_number).padStart(4,'0') : String(o.id||'');
        const now = new Date().toLocaleString('fr-FR');
        const W = 48;
        const ESC = '\x1B', GS = '\x1D';
        const sep = '-'.repeat(W) + '\n';
        const itemLine = (qty, name, price) => {
            const qtyStr  = `${qty}x`;
            const maxName = W - qtyStr.length - 1 - price.length - 1;
            const nameStr = name.substring(0, maxName).padEnd(maxName, ' ');
            return `${qtyStr} ${nameStr} ${price}`;
        };
        const tbl = o.table_number || '';
        const barLeft = tbl === 'comptoir' ? 'COMPTOIR'
            : tbl === 'emporter' ? 'À EMPORTER'
            : tbl === 'terrasse' ? 'TERRASSE'
            : tbl ? `TABLE N°${String(tbl).replace('T','')}` : 'TABLE ?';
        const barRight = `#${idShort}`;
        const barPad   = Math.max(1, W - barLeft.length - barRight.length);
        let ticket = GS + '\x42\x01' + barLeft + ' '.repeat(barPad) + barRight + GS + '\x42\x00' + '\n\n';
        ticket += ESC + '\x21\x30' + (()=>{ const t='PAPAYA JUICE'; const pad=Math.max(0,Math.floor((Math.floor(W/2)-t.length)/2)); return ' '.repeat(pad)+t; })() + ESC + '\x21\x00\n';
        ticket += `${' '.repeat(Math.max(0,Math.floor((W-8)/2)))}ADDITION\n${sep}`;
        ticket += `${now}\n${sep}`;
        const allItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        allItems.forEach(i => {
            const price = (parseFloat(i.price||0)*(i.qty||1)).toFixed(2).padStart(8,' ');
            ticket += itemLine(i.qty||1, i.title||i.name||'', price) + '\n';
        });
        const totalLabel = 'TOTAL';
        const totalStr    = `${parseFloat(o.total||0).toFixed(2)} DH`;
        const totalPad    = Math.max(1, Math.floor(W/2) - totalLabel.length - totalStr.length);
        ticket += `${sep}` + ESC + '\x21\x30' + totalLabel + ' '.repeat(totalPad) + totalStr + ESC + '\x21\x00' + '\n';
        await _printUSB(ticket);
        showToast('✅ Addition imprimée !');
    } catch(e) { showToast('❌ Erreur impression: '+e.message); }
}

async function reprintOrder(encodedOrder) {
    const o = JSON.parse(decodeURIComponent(encodedOrder));
    try {
        const now = new Date(o.created_at||Date.now()).toLocaleString('fr-FR');
        const W = 48;
        const ESC = '\x1B', GS = '\x1D';
        const sep = '-'.repeat(W) + '\n';
        const itemLine = (qty, name, price) => {
            const qtyStr  = `${qty}x`;
            const maxName = W - qtyStr.length - 1 - price.length - 1;
            const nameStr = name.substring(0, maxName).padEnd(maxName, ' ');
            return `${qtyStr} ${nameStr} ${price}`;
        };
        const idShort = o.ticket_number ? String(o.ticket_number).padStart(4,'0') : String(o.id||'');
        const tbl = o.table_number || '';
        const barLeft = tbl === 'comptoir' ? 'COMPTOIR'
            : tbl === 'emporter' ? 'À EMPORTER'
            : tbl === 'terrasse' ? 'TERRASSE'
            : tbl ? `TABLE N°${String(tbl).replace('T','')}` : 'TABLE ?';
        const barRight = `#${idShort}`;
        const barPad   = Math.max(1, W - barLeft.length - barRight.length);
        let ticket = GS + '\x42\x01' + barLeft + ' '.repeat(barPad) + barRight + GS + '\x42\x00' + '\n\n';
        ticket += ESC + '\x21\x30' + (()=>{ const t='PAPAYA JUICE'; const pad=Math.max(0,Math.floor((Math.floor(W/2)-t.length)/2)); return ' '.repeat(pad)+t; })() + ESC + '\x21\x00\n';
        ticket += `${' '.repeat(Math.max(0,Math.floor((W-13)/2)))}RÉIMPRESSION\n${sep}`;
        ticket += `${now}\n${sep}`;
        const reimpItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        reimpItems.forEach(i => {
            const price = (parseFloat(i.price||0)*(i.qty||1)).toFixed(2).padStart(8,' ');
            ticket += itemLine(i.qty||1, i.title||i.name||'', price) + '\n';
        });
        const totalLabel = 'TOTAL';
        const totalStr    = `${parseFloat(o.total||0).toFixed(2)} DH`;
        const totalPad    = Math.max(1, Math.floor(W/2) - totalLabel.length - totalStr.length);
        ticket += `${sep}` + ESC + '\x21\x30' + totalLabel + ' '.repeat(totalPad) + totalStr + ESC + '\x21\x00' + '\n';
        await _printUSB(ticket);
        showToast('✅ Ticket réimprimé !');
    } catch(e) { showToast('❌ Erreur impression: '+e.message); }
}

// ── CLOTURE ──
async function validerCloture() {
    try {
        let totalJournee=0, nbrCommandes=0, clotureOrders=[];
        try {
            const token = localStorage.getItem('papaya_token');
            // ── Fetch TOUTES les commandes sans limite ──
            const res = await fetch(BACKEND_URL+'/api/orders', { headers: { 'Authorization': 'Bearer ' + token } });
            const allOrders = res.ok ? (await res.json().then(r => Array.isArray(r) ? r : (r.data || []))) : [];

            // ── Ajouter les commandes offline en attente de sync ──
            const offlineQueue = _oqLoad();
            const offlineFake = offlineQueue.map((item, i) => ({
                id: 'offline-' + i,
                table_number: item.payload.table_number,
                items: item.payload.items,
                total: item.payload.total,
                status: 'pending',
                created_at: new Date(item.ts || Date.now()).toISOString(),
                source: 'kiosk-offline'
            }));
            const allOrdersWithOffline = [...allOrders, ...offlineFake];

            if (allOrdersWithOffline.length > 0) {
                const loginTime = localStorage.getItem('papaya_kiosk_login_time');
                const STATUS_CANCELLED = new Set(['cancelled', 'annulé', 'annule', 'canceled']);
                // Compter TOUT sauf les annulées (en_attente inclus)
                clotureOrders = loginTime
                    ? allOrdersWithOffline.filter(o => new Date(o.created_at) >= new Date(loginTime) && !STATUS_CANCELLED.has(o.status))
                    : allOrdersWithOffline.filter(o => !STATUS_CANCELLED.has(o.status));
                nbrCommandes = clotureOrders.length;
                totalJournee = clotureOrders.reduce((s,o) => s+parseFloat(o.total||0), 0);
            }
        } catch(e) {}
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR');
        const timeStr = now.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        const userName = document.getElementById('userName').textContent || 'Serveur';
        const sep  = '------------------------------------------------\n';
        const sep2 = '================================================\n';

        // ── Grouper tous les articles par catégorie ──
        const categoryMap = {};
        // Build a lookup map from allProducts for category fallback
        const productCatLookup = {};
        (allProducts || []).forEach(p => { if (p.id) productCatLookup[p.id] = p.category || ''; });

        clotureOrders.forEach(o => {
            const items = typeof o.items === 'string' ? JSON.parse(o.items||'[]') : (o.items||[]);
            items.forEach(item => {
                // Use stored category, fallback to allProducts lookup, then 'AUTRES'
                const rawCat = item.category || item.categorie || productCatLookup[item.id] || 'AUTRES';
                const cat = rawCat.trim() ? rawCat.toUpperCase() : 'AUTRES';
                const name = (item.title || item.name || '').toUpperCase();
                const qty  = parseInt(item.qty || item.quantity || 1);
                const exSum = (item.extras || []).reduce((e, x) => e + (parseFloat(x.priceAdd) || 0), 0);
                const price = (parseFloat(item.price || item.prix || 0) + exSum) * qty;
                if (!categoryMap[cat]) categoryMap[cat] = {};
                if (!categoryMap[cat][name]) categoryMap[cat][name] = { qty: 0, total: 0 };
                categoryMap[cat][name].qty   += qty;
                categoryMap[cat][name].total += price;
            });
        });

        // ── Header style CLOTURE GLOBALE ──
        const pad = (str, len) => String(str).padEnd(len);
        const padL = (str, len) => String(str).padStart(len);

        let ticketZ = '\n';
        ticketZ += '   CLOTURE GLOBALE\n';
        ticketZ += sep2;
        ticketZ += `N CLOTURE : __CLOTURE_ID__\n`;
        const loginTime = localStorage.getItem('papaya_kiosk_login_time');
        const deStr = loginTime
            ? new Date(loginTime).toLocaleString('fr-FR').replace(',','')
            : dateStr + ' 00:00:00';
        ticketZ += `DE        : ${deStr}\n`;
        ticketZ += `A         : ${dateStr} ${timeStr}\n`;
        ticketZ += sep;

        // W=48: Article=34, Qte=4, space=1, TOTAL=9 => 48 chars exact
        const C_ART = 34, C_QTY = 4, C_TOT = 9;
        const artLine = (name, qty, total) =>
            pad(name, C_ART) + padL(String(qty), C_QTY) + ' ' + padL(String(total), C_TOT);

        ticketZ += artLine('Article', 'Qte', 'TOTAL_NET') + '\n';
        ticketZ += sep;

        let grandTotal = 0;

        // ── Catégories et articles ──
        Object.keys(categoryMap).sort().forEach(cat => {
            ticketZ += `${cat}\n`;
            let catTotal = 0;
            let catQty   = 0;
            Object.keys(categoryMap[cat]).sort().forEach(name => {
                const { qty, total } = categoryMap[cat][name];
                const shortName = '  ' + name.substring(0, C_ART - 2);
                ticketZ += artLine(shortName, qty, total.toFixed(0)) + '\n';
                catTotal += total;
                catQty   += qty;
            });
            ticketZ += artLine('* TOTAL FAMILLE *', '*'+catQty+'*', '*'+catTotal.toFixed(0)+'*') + '\n';
            ticketZ += sep;
            grandTotal += catTotal;
        });

        ticketZ += sep2;
        ticketZ += `TOTAL NET: ${padL(grandTotal.toFixed(2) + ' DH', 37)}\n`;
        ticketZ += sep2;
        ticketZ += `ESPECES : ${padL(grandTotal.toFixed(2) + ' DH', 38)}\n`;
        ticketZ += sep;
        ticketZ += `CAISSIER : ${userName}\n`;
        ticketZ += sep;
        ticketZ += `SUR PLACE : ${padL(grandTotal.toFixed(2) + ' DH', 36)}\n`;
        ticketZ += sep;

        // ── Enregistrer la clôture en DB d'abord pour obtenir l'ID réel ──
        let realClotureId = null;
        try {
            const token = localStorage.getItem('papaya_token');
            const saveRes = await fetch(BACKEND_URL + '/api/clotures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ caissier: userName, nbr_commandes: nbrCommandes, total: grandTotal.toFixed(2), items_snapshot: categoryMap })
            });
            if (saveRes.ok) {
                const saved = await saveRes.json();
                realClotureId = saved.id != null ? saved.id : null;
            }
        } catch(e) { console.warn('Cloture non sauvegardée:', e); }

        // Remplacer le placeholder par l'ID réel (fallback: timestamp si échec réseau)
        const fallbackId = Math.floor(Date.now() / 1000) % 10000;
        ticketZ = ticketZ.replace('__CLOTURE_ID__', realClotureId !== null ? realClotureId : fallbackId);

        await printViaPrintNode(ticketZ, 'cloture');
        localStorage.setItem('papaya_cloture_time', new Date().toISOString());
        localStorage.removeItem('papaya_kiosk_login_time');
        // FIX: reset counter bach awal ticket b3d cloture yb9a #0001
        _localOrderCounter = 0;
        localStorage.setItem('papaya_order_counter', '0');
        showToast('✅ Clôture réussie ! Déconnexion...');
        setTimeout(() => { if(typeof API!=='undefined') API.Auth.logout(); else { sessionStorage.clear(); location.href='/dashboard'; } }, 2000);
    } catch(err) { showToast('❌ Erreur clôture: '+err.message); }
}

// ════════════════════════════════════════
//  NEW ORDER POPUP — polling depuis menu
// ════════════════════════════════════════
let _nopSeenIds = new Set(JSON.parse(localStorage.getItem('nop_seen_ids') || '[]'));
let _nopPendingOrders = JSON.parse(localStorage.getItem('nop_pending_orders') || '[]');  // orders à afficher dans le popup courant
let _nopInterval = null;

// Statuts qui viennent du menu (menu.html insère en status 'paiement')
// 'paiement'/'paid' = menu.html direct supabase | 'pending' = backend API
const NOP_TRIGGER_STATUSES = new Set(['paiement', 'paid', 'pending']);

function _nopSavePending() {
    localStorage.setItem('nop_pending_orders', JSON.stringify(_nopPendingOrders));
}

function _nopSaveSeen() {
    // Limit: khli ghir 200 IDs l-lakhrin bach localStorage maytmlach
    const arr = [..._nopSeenIds];
    if (arr.length > 300) {
        const trimmed = arr.slice(arr.length - 300);
        _nopSeenIds = new Set(trimmed);
    }
    localStorage.setItem('nop_seen_ids', JSON.stringify([..._nopSeenIds]));
}

async function _nopPollOrders() {
    try {
        const token = localStorage.getItem('papaya_token');
        const res = await fetch(BACKEND_URL + '/api/orders', {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        if (!res.ok) return;
        const ordersRes = await res.json();
        const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes.data || []);

        // Filtrer : statut 'paiement' ou 'paid', pas encore vus, créés aujourd'hui
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        // Nettoyer les ids anciens (pas aujourd'hui) pour eviter accumulation
        orders.filter(o => o.created_at && new Date(o.created_at) < todayStart)
              .forEach(o => _nopSeenIds.delete(String(o.id)));
        _nopSaveSeen();
        const newOnes = orders.filter(o => {
            const statusMatch = NOP_TRIGGER_STATUSES.has(o.status);
            const notSeen    = !_nopSeenIds.has(String(o.id));
            const today      = o.created_at ? new Date(o.created_at) >= todayStart : true;
            // Exclure les commandes du kiosk lui-même (source='kiosk') — elles sont déjà traitées
            const notKiosk   = (o.source || '').toLowerCase() !== 'kiosk';
            return statusMatch && notSeen && today && notKiosk;
        });

        // Auto-fermer les commandes annulées depuis commandes-live
        const cancelledStatuses = new Set(['cancelled', 'annulé', 'annule']);
        const cancelledIds = new Set(
            orders.filter(o => cancelledStatuses.has(o.status)).map(o => String(o.id))
        );
        const wasPending = _nopPendingOrders.length;
        _nopPendingOrders.filter(o => cancelledIds.has(String(o.id))).forEach(o => {
            dismissSingleOrderFromPopup(o.id);
        });

        if (!newOnes.length) return;

        // Marquer comme vus immédiatement pour éviter double popup
        newOnes.forEach(o => _nopSeenIds.add(String(o.id)));
        _nopSaveSeen();

        // Empiler dans pending et (ré)afficher le popup
        _nopPendingOrders = [..._nopPendingOrders, ...newOnes];
        _nopSavePending();
        _nopShowPopup();
    } catch(e) { /* silencieux */ }
}

function _nopShowPopup() {
    if (!_nopPendingOrders.length) return;

    const popup    = document.getElementById('newOrderPopup');
    const body     = document.getElementById('nopBody');
    const badge    = document.getElementById('nopBadge');
    const subtitle = document.getElementById('nopSubtitle');

    badge.textContent = _nopPendingOrders.length;
    const n = _nopPendingOrders.length;
    subtitle.textContent = n === 1
        ? 'Reçue depuis le menu en ligne'
        : `${n} commandes reçues depuis le menu en ligne`;

    body.innerHTML = _nopPendingOrders.map(o => {
        const rawItems = (typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []));
        const items = rawItems.map(i => {
            let line = `${i.qty}× ${i.title}`;
            if (i.extras && i.extras.length > 0) {
                const extStr = i.extras.map(e => `+ ${e.optionName}`).join(', ');
                line += ` <span style="font-size:11px;color:rgba(255,255,255,0.45);"> (${extStr})</span>`;
            }
            return line;
        }).join('<br>');
        // FIX: ticket_number (counter local) machi ID Supabase
        const idShort = o.ticket_number
            ? String(o.ticket_number).padStart(4,'0')
            : String(o.id || '');
        const tableDisplay = !o.table_number ? 'Sans table'
            : o.table_number === 'emporter' ? 'À Emporter'
            : o.table_number === 'comptoir' ? 'Comptoir'
            : o.table_number === 'terrasse' ? '☀️ Terrasse'
            : `Table ${o.table_number.replace('T','')}`;
        const total = parseFloat(o.total || 0).toFixed(2);
        return `<div class="nop-order" id="nop-order-${o.id}">
            <div class="nop-order-top">
                <span class="nop-order-id">#${idShort}</span>
                <span class="nop-order-table">🪑 ${tableDisplay}</span>
                <span class="nop-order-total">${total} DH</span>
            </div>
            <div class="nop-order-items">${items || '—'}</div>
            <div class="nop-order-actions">
                <button class="nop-btn-print-single" data-order-id="${o.id}">✅ Confirmer</button>
                <button class="nop-btn-cancel-single" data-order-id="${o.id}">✕ Annuler</button>
            </div>
        </div>`;
    }).join('');

    // Attacher les events après injection HTML
    setTimeout(() => {
        _nopPendingOrders.forEach(o => {
            const printBtn = document.querySelector(`#nop-order-${o.id} .nop-btn-print-single`);
            const cancelBtn = document.querySelector(`#nop-order-${o.id} .nop-btn-cancel-single`);
            if (printBtn) printBtn.addEventListener('click', () => printSingleOrder(o));
            if (cancelBtn) cancelBtn.addEventListener('click', () => dismissSingleOrder(o.id));
        });
    }, 0);

    popup.classList.add('show');

    // Son mjihed (alarme en boucle) — s'arrête sur n'importe quel bouton
    _nopStartSound();
}

// ── Son alarme kiosk ──────────────────────────────────────────────────────
let _nopSoundInterval = null;
let _nopSoundTimeout  = null;

function _nopPlayBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.16, 0.32].forEach(delay => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(960, ctx.currentTime + delay);
            osc.frequency.setValueAtTime(720, ctx.currentTime + delay + 0.07);
            gain.gain.setValueAtTime(0.45, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.13);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.13);
        });
    } catch(e) { /* AudioContext non dispo */ }
}

function _nopStartSound() {
    if (_nopSoundInterval) return; // déjà en cours
    _nopPlayBeep();
    _nopSoundInterval = setInterval(_nopPlayBeep, 2000);
    _nopSoundTimeout  = setTimeout(_nopStopSound, 60000);
}

function _nopStopSound() {
    if (_nopSoundInterval) { clearInterval(_nopSoundInterval); _nopSoundInterval = null; }
    if (_nopSoundTimeout)  { clearTimeout(_nopSoundTimeout);  _nopSoundTimeout  = null; }
}
// ─────────────────────────────────────────────────────────────────────────

function dismissNewOrderPopup() {
    _nopStopSound();
    // Garder _nopPendingOrders pour pouvoir rouvrir
    document.getElementById('newOrderPopup').classList.remove('show');
    updateNopMenuBtn();
}

function updateNopMenuBtn() {
    const btn = document.getElementById('nopReopenBtn');
    if (!btn) return;
    const n = _nopPendingOrders.length;
    if (n > 0) {
        btn.style.display = 'flex';
        btn.querySelector('.nop-reopen-count').textContent = n;
    } else {
        btn.style.display = 'none';
    }
}

async function printSingleOrder(o) {
    try {
        const rawItems = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []);
        const cartLike = rawItems.map(i => ({ product: { title: i.title, price: parseFloat(i.price || 0), category: i.category || '' }, qty: i.qty }));
        const tableVal = o.table_number || 'comptoir';
        const total = parseFloat(o.total || 0).toFixed(2);
        // Imprimer ticket cuisine + addition
        const ticketId = o.ticket_number ? String(o.ticket_number).padStart(4,'0') : o.id;
        const kitchenTkt = generateKitchenTicket(cartLike, tableVal, ticketId);
        const additionTkt = generateTextTicket(cartLike, tableVal, total, ticketId);
        await printViaPrintNode(kitchenTkt, 'kitchen');
        await printViaPrintNode(additionTkt, 'cash');
        // Mettre status en_preparation
        try {
            const token = localStorage.getItem('papaya_token');
            await fetch(BACKEND_URL + '/api/orders/' + o.id + '/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ status: 'preparing' })
            });
        } catch(e2) { console.warn('Status update failed:', e2); }
        dismissSingleOrderFromPopup(o.id);
    } catch(e) {
        showToast('❌ Erreur impression: ' + e.message);
    }
}

function dismissSingleOrderFromPopup(orderId) {
    _nopStopSound();
    _nopPendingOrders = _nopPendingOrders.filter(o => o.id !== orderId);
    _nopSavePending();
    const el = document.getElementById('nop-order-' + orderId);
    if (el) el.remove();
    const badge = document.getElementById('nopBadge');
    const subtitle = document.getElementById('nopSubtitle');
    const n = _nopPendingOrders.length;
    if (badge) badge.textContent = n;
    if (subtitle) subtitle.textContent = n === 1 ? "Reçue depuis le menu en ligne" : `${n} commandes reçues depuis le menu en ligne`;
    if (!n) document.getElementById('newOrderPopup').classList.remove('show');
    updateNopMenuBtn();
}

async function dismissSingleOrder(orderId) {
    _nopStopSound();
    try {
        const token = localStorage.getItem('papaya_token');
        await fetch(BACKEND_URL + '/api/orders/' + orderId + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ status: 'cancelled' })
        });
        showToast('✅ Commande annulée');
    } catch(e) {
        showToast("❌ Erreur annulation: " + e.message);
    }
    _nopPendingOrders = _nopPendingOrders.filter(o => o.id !== orderId);
    _nopSavePending();
    const el = document.getElementById('nop-order-' + orderId);
    if (el) el.remove();
    const badge = document.getElementById('nopBadge');
    const subtitle = document.getElementById('nopSubtitle');
    const n = _nopPendingOrders.length;
    if (badge) badge.textContent = n;
    if (subtitle) subtitle.textContent = n === 1 ? "Reçue depuis le menu en ligne" : `${n} commandes reçues depuis le menu en ligne`;
    if (!n) document.getElementById('newOrderPopup').classList.remove('show');
}

async function printAndDismissNewOrders() {
    const orders = [..._nopPendingOrders];
    dismissNewOrderPopup();

    for (const o of orders) {
        try {
            const rawItems = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []);
            // Convertir au format attendu par generateTextTicket
            const cartLike = rawItems.map(i => ({ product: { title: i.title, price: parseFloat(i.price || 0), category: i.category || '' }, qty: i.qty }));
            const tableVal = o.table_number || 'comptoir';
            const total = parseFloat(o.total || 0).toFixed(2);
            const ticketId = o.ticket_number ? String(o.ticket_number).padStart(4,'0') : o.id;
            // BON DE CUISINE → cuisine
            const kitchenTkt = generateKitchenTicket(cartLike, tableVal, ticketId);
            await printViaPrintNode(kitchenTkt, 'kitchen');
            // ADDITION → caisse
            const additionTkt = generateTextTicket(cartLike, tableVal, total, ticketId);
            await printViaPrintNode(additionTkt, 'cash');
        } catch(e) {
            console.warn('Erreur impression commande', o.id, e);
        }
    }
    showToast(`✅ ${orders.length} ticket${orders.length > 1 ? 's' : ''} envoyé${orders.length > 1 ? 's' : ''} à l'impression`);
}

async function updateOrderStatusFromKiosk(orderId, newStatus) {
    try {
        const token = localStorage.getItem('papaya_token');
        const STATUS_TO_API = { 'ready': 'ready', 'done': 'delivered' };
        const apiStatus = STATUS_TO_API[newStatus] || newStatus;
        const res = await fetch(BACKEND_URL + '/api/orders/' + orderId + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ status: apiStatus })
        });
        if (!res.ok) { showToast('❌ Erreur mise à jour'); return; }
        const updated = await res.json();
        await _broadcastOrder('update_order', updated);
        showToast(newStatus === 'ready' ? '✅ Commande marquée Prête !' : '✔️ Commande Terminée !');
        // Re-fetch fresh data from API — single source of truth
        await loadHistoriqueOrders();
    } catch(e) {
        showToast('❌ Erreur: ' + e.message);
    }
}

function _nopStartPolling() {
    // Fetch initial pour charger les commandes en attente déjà présentes
    _nopPollOrders();

    // ── Realtime : écouter les nouveaux INSERT (status paiement/paid) ──
    if (_nopInterval) return; // déjà démarré
    _nopInterval = true; // flag pour éviter double init

    // نسمع broadcast — .on() خاصو يجي قبل .subscribe()
    _broadcastChannel
      .on('broadcast', { event: 'new_order' }, _nopOnNewOrder)
      .on('broadcast', { event: 'update_order' }, _nopOnUpdateOrder)
      .subscribe((status) => {
          if (status === 'SUBSCRIBED') _broadcastReady = true;
      });
}

function _nopOnNewOrder({ payload }) {
    const o = payload;
    if (!NOP_TRIGGER_STATUSES.has(o.status)) return;
    // Exclure les commandes du kiosk lui-même
    if ((o.source || '').toLowerCase() === 'kiosk') return;
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    if (o.created_at && new Date(o.created_at) < todayStart) return;
    if (_nopSeenIds.has(String(o.id))) return;
    _nopSeenIds.add(String(o.id));
    _nopSaveSeen();
    _nopPendingOrders = [..._nopPendingOrders, o];
    _nopSavePending();
    _nopShowPopup();
}

function _nopOnUpdateOrder({ payload }) {
    const o = payload;
    const cancelledStatuses = new Set(['cancelled', 'annulé', 'annule']);
    if (cancelledStatuses.has(o.status)) dismissSingleOrderFromPopup(o.id);
}

// ── TOAST ──
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
}

// ══════════════════════════════════════════════════════
// OFFLINE QUEUE + WIFI RECONNECT
// ══════════════════════════════════════════════════════
const OQ_KEY = 'papaya_offline_queue';
let _isOffline = false;

// ── Banner offline/online ──
function _showOfflineBanner() {
    const b = document.getElementById('offlineBanner');
    if (!b) return;
    const q = _oqLoad();
    const count = q.length;
    b.innerHTML = `📵 Hors ligne — ${count} commande${count>1?'s':''} sauvegardée${count>1?'s':''} · tickets en attente`;
    b.style.background = '#b45309';
    b.style.display = 'flex';
}

function _showOnlineBanner(count) {
    let b = document.getElementById('offlineBanner');
    if (!b) return;
    b.innerHTML = '✅ Connexion rétablie — ' + count + ' commande(s) synchronisée(s)';
    b.style.background = '#16a34a';
    b.style.display = 'flex';
    setTimeout(() => { b.style.display = 'none'; }, 4000);
}

function _hideOfflineBanner() {
    const b = document.getElementById('offlineBanner');
    if (b) b.style.display = 'none';
}

// ── Queue helpers ──
function _oqLoad() {
    try { return JSON.parse(localStorage.getItem(OQ_KEY) || '[]'); } catch(e) { return []; }
}
function _oqSave(q) { localStorage.setItem(OQ_KEY, JSON.stringify(q)); }
function _oqPush(payload, alreadyPrinted = false) {
    const q = _oqLoad();
    q.push({ payload, ts: Date.now(), printed: alreadyPrinted });
    _oqSave(q);
}

// ── Flush queue ملي كيرجع wifi ──
let _oqFlushBusy = false;
async function _oqFlush() {
    if (_oqFlushBusy) return 0; // déjà en cours — évite double-envoi
    _oqFlushBusy = true;
    const q = _oqLoad();
    if (!q.length) { _oqFlushBusy = false; return 0; }
    const remaining = [];
    const synced = [];
    try {
    for (const item of q) {
        try {
            const created = await API.orders.create(item.payload);
            const orderId = created?.id;
            if (orderId) {
                const token = localStorage.getItem('papaya_token');
                try {
                    const r = await fetch(BACKEND_URL + '/api/orders/' + orderId + '/status', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ status: 'preparing' })
                    });
                    const updated = r.ok ? await r.json() : created;
                    synced.push({ ...updated, status: 'preparing' });
                    // Broadcast après resubscribe (katji baad) — pas de await ici
                    _broadcastOrder('new_order', { ...updated, status: 'en_preparation' }).catch(() => {});
                } catch(e) {
                    synced.push({ ...created, status: 'preparing' });
                    _broadcastOrder('new_order', { ...created, status: 'en_preparation' }).catch(() => {});
                }
                // ── Tickets: mli printed:true → tickets khrejou offline déjà ──
                // Mandirou print mra thanya — _flushPrintJobs (kitchen) kayretry b rasso
                // mli local print server yrja3 disponible.
            }
        } catch(e) {
            remaining.push(item);
        }
    }
    _oqSave(remaining);

    // ── Mettre à jour histAllOrders directement (sans dépendre du broadcast) ──
    if (synced.length) {
        const STATUS_NORM = {en_attente:'pending',paiement:'paid',en_preparation:'preparing',pret:'ready',termine:'done',delivered:'done',annule:'cancelled','annulé':'cancelled','canceled':'cancelled'};
        synced.forEach(o => {
            o.status = STATUS_NORM[o.status] || o.status;
            if (!histAllOrders.find(x => x.id === o.id)) {
                histAllOrders = [o, ...histAllOrders];
            }
        });
        if (typeof _histUpdateUI === 'function') _histUpdateUI();
    }

    return q.length - remaining.length; // عدد اللي تبعتوا بنجاح
    } finally {
        _oqFlushBusy = false; // toujours libérer le lock
    }
}

// ── Resubscribe channel ──
// ── Rebuild broadcast channel avec ses listeners (sans polling) ──
async function _resubscribeBroadcast() {
    _broadcastReady = false;
    try { await _supabase.removeChannel(_broadcastChannel); } catch(e) {}
    // Recréer le channel et réattacher les listeners
    const ch = _supabase.channel('papaya-broadcast');
    ch.on('broadcast', { event: 'new_order' }, _nopOnNewOrder)
      .on('broadcast', { event: 'update_order' }, _nopOnUpdateOrder)
      .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
              _broadcastReady = true;
              // Copier les méthodes du nouveau channel sur la référence globale
              Object.assign(_broadcastChannel, ch);
          }
      });
}

// ── Offline event ──
window.addEventListener('offline', () => {
    _isOffline = true;
    _broadcastReady = false;
    _showOfflineBanner();
});

// ── Sync retry — démarre seulement quand kayen orders offline ──
let _syncInterval = null;
let _syncBusy = false;

function _startSyncPolling() {
    if (_syncInterval) return; // déjà actif
    _syncInterval = setInterval(async () => {
        const q = _oqLoad();
        if (!q.length) {
            // Queue vide → stop polling
            clearInterval(_syncInterval);
            _syncInterval = null;
            return;
        }
        if (_syncBusy) return;
        try {
            _syncBusy = true;
            const res = await fetch(BACKEND_URL + '/api/menu/categories', {
                method: 'HEAD', signal: AbortSignal.timeout(3000)
            });
            if (!res.ok && res.status !== 405) { _syncBusy = false; return; }
            // Wifi rj3 ✅ — mra wa7da ghir (machi kol 5s)
            if (_isOffline) {
                _isOffline = false;
                await _resubscribeBroadcast();
                // FIX kiosk mode: 'online' event ma kayfiresh → _nopPollOrders mra wa7da
                await _nopPollOrders();
            }
            const sent = await _oqFlush();
            // _flushPrintJobs hoqnaha — tickets dyal offline deja khrejou via local print server
            if (sent > 0) _showOnlineBanner(sent);
            _syncBusy = false;
        } catch(e) { _syncBusy = false; }
    }, 5000);
}

// ── Online event ──
window.addEventListener('online', async () => {
    _isOffline = false;

    // 1. Reconstruire le channel broadcast EN PREMIER (pour que _oqFlush puisse broadcaster)
    await _resubscribeBroadcast();

    // 2. Envoyer les commandes sauvegardées offline
    const sent = await _oqFlush();
    // Clear print queue — tickets deja khrejou via local (makhsshoumch ytb3atou mra thanya)
    localStorage.removeItem('_pq');

    if (sent > 0) { _showOnlineBanner(sent); }

    // 3. Récupérer les commandes manquées pendant l'offline
    //    et retirer leurs IDs de seenIds pour qu'elles apparaissent dans le popup
    try {
        const token = localStorage.getItem('papaya_token');
        const res = await fetch(BACKEND_URL + '/api/orders', {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        if (res.ok) {
            const ordersRes = await res.json();
            const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes.data || []);
            orders
                .filter(o => NOP_TRIGGER_STATUSES.has(o.status))
                .forEach(o => _nopSeenIds.delete(String(o.id)));
            _nopSaveSeen();
        }
    } catch(e) { /* silencieux */ }

    // 4. Afficher le popup pour les commandes manquées
    await _nopPollOrders();

    // 5. Rafraîchir le historique si des commandes offline ont été synchronisées
    if (sent > 0) {
        try { await loadHistoriqueOrders(); } catch(e) {}
    }

    // 6. Banner de confirmation
    _showOnlineBanner(sent);
});

// ── Fallback visibility ──
let _kioskLastVisible = Date.now();
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        const away = Date.now() - _kioskLastVisible;
        if (away > 30000) {
            if (_oqLoad().length) await _oqFlush();
            // Nettoyer les seenIds pour les commandes encore en statut déclencheur
            try {
                const token = localStorage.getItem('papaya_token');
                const res = await fetch(BACKEND_URL + '/api/orders', {
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
                });
                if (res.ok) {
                    const ordersRes = await res.json();
                    const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes.data || []);
                    const stillTrigger = new Set(
                        orders.filter(o => NOP_TRIGGER_STATUSES.has(o.status)).map(o => String(o.id))
                    );
                    stillTrigger.forEach(id => _nopSeenIds.delete(id));
                    _nopSaveSeen();
                }
            } catch(e) {}
            await _nopPollOrders();
            if (!_broadcastReady) await _resubscribeBroadcast();
        }
        if (away > 30000 && document.getElementById('historiqueModal').style.display !== 'none') loadHistoriqueOrders();
    } else {
        _kioskLastVisible = Date.now();
    }
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pinModal').style.display = 'flex';
    // Enregistrer l'heure de login uniquement si pas déjà enregistrée (évite de perdre l'heure au refresh)
    if (!localStorage.getItem('papaya_kiosk_login_time')) {
        localStorage.setItem('papaya_kiosk_login_time', new Date().toISOString());
    }
    // Reprendre sync si orders offline restants d'une session précédente
    if (_oqLoad().length > 0) _startSyncPolling();

    if (typeof API === 'undefined') {
        window.API = {
            menu: { getAll: async () => { const r=await fetch(BACKEND_URL+'/api/menu/products'); if(!r.ok) throw new Error('Erreur serveur'); return r.json(); } },
            orders: { create: async (order) => { const r=await fetch(BACKEND_URL+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)}); if(!r.ok) throw new Error('Erreur envoi'); return r.json(); } },
            Auth: { getUser: ()=>JSON.parse(localStorage.getItem('papaya_user')||sessionStorage.getItem('papaya_user')||'null'), logout:()=>{localStorage.removeItem('papaya_token');localStorage.removeItem('papaya_user');sessionStorage.clear();location.href='/dashboard';} }
        };
    }
    loadProducts();
    _nopStartPolling();
    // تحميل عدد الطاولات من Supabase
    (async () => {
        try {
            const client = _supabase || window.supabase?.createClient(
                'https://rlwshuurruvtnqwgbjkl.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3NodXVycnV2dG5xd2diamtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzkzMjAsImV4cCI6MjA5NDg1NTMyMH0.PV4EpbydpLTS36OVyaqy9qANWRec7B9F-emlaS0qqRw'
            );
            const { data } = await client.from('settings').select('value').eq('key', 'table_count').single();
            const n = data ? parseInt(data.value) : 20;
            const sel = document.getElementById('tableSelect');
            // حذف الطاولات القديمة بشكل صحيح (من الآخر للأول)
            for (let i = sel.options.length - 1; i >= 0; i--) {
                if (sel.options[i].value.startsWith('T')) sel.remove(i);
            }
            for (let i = 1; i <= n; i++) {
                const opt = document.createElement('option');
                opt.value = 'T' + i;
                opt.textContent = 'Table ' + i;
                sel.appendChild(opt);
            }
        } catch(e) { console.warn('table_count load failed:', e); }
    })();
    // Remonter le popup si commandes en attente après refresh
    if (_nopPendingOrders.length > 0) { setTimeout(_nopShowPopup, 800); }

    const _user = API.Auth.getUser();
    if (_user) {
        document.getElementById('userName').textContent = _user.name || _user.fullname || _user.username || '';
        document.getElementById('userRole').textContent = _user.role || 'Serveur';
        const initials = (_user.name || _user.fullname || _user.username || '?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        document.getElementById('userInitial').textContent = initials;
    }
});

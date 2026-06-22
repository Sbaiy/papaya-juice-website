// === Papaya Kiosk · tables.js ===
// Plan des tables / détail table / encaissement

const PLAN_OCCUPIED_STATUSES = new Set(['pending','en_attente','preparing','en_preparation','ready','pret']);

async function openPlanTablesModal() {
    document.getElementById('planTablesModal').style.display = 'flex';
    await renderPlanTables();
}

function closePlanTablesModal() {
    document.getElementById('planTablesModal').style.display = 'none';
}

async function renderPlanTables() {
    const grid = document.getElementById('planTablesGrid');
    const subtitle = document.getElementById('planTablesSubtitle');
    const footer = document.getElementById('planTablesFooter');
    grid.innerHTML = '<div style="color:var(--muted);font-size:13px;grid-column:1/-1;text-align:center;padding:30px 0;">Chargement…</div>';

    try {
        // 1. Nombre de tables
        const { data: settingData } = await _supabase
            .from('settings').select('value').eq('key','table_count').single();
        const tableCount = settingData ? parseInt(settingData.value) : 20;

        // 2. Commandes actives
        const token = localStorage.getItem('papaya_token');
        const res = await fetch(BACKEND_URL + '/api/orders', {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        const ordersRes = res.ok ? await res.json() : {};
        const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes.data || []);

        // 3. Tables occupées = celles qui ont au moins une commande active
        const occupiedTables = new Set();
        const tableOrders = {};
        orders.forEach(o => {
            if (PLAN_OCCUPIED_STATUSES.has(o.status) && o.table_number && o.table_number.startsWith('T')) {
                occupiedTables.add(o.table_number);
                if (!tableOrders[o.table_number]) tableOrders[o.table_number] = [];
                tableOrders[o.table_number].push(o);
            }
        });

        const occupiedCount = occupiedTables.size;
        subtitle.textContent = occupiedCount + ' table(s) occupée(s)';
        footer.textContent = occupiedCount + ' table(s) occupée(s)';

        // 4. Render grille
        grid.innerHTML = '';
        for (let i = 1; i <= tableCount; i++) {
            const tKey = 'T' + i;
            const isOccupied = occupiedTables.has(tKey);
            const card = document.createElement('button');
            card.style.cssText = `
                padding: 0;
                width: 100%;
                aspect-ratio: 1;
                border-radius: 16px;
                border: 1px solid ${isOccupied ? 'rgba(251,113,133,0.3)' : 'rgba(134,239,172,0.2)'};
                background: ${isOccupied
                    ? 'rgba(190,18,60,0.18)'
                    : 'rgba(22,163,74,0.15)'};
                box-shadow: ${isOccupied
                    ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.1)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.08)'};
                color: ${isOccupied ? '#fda4af' : '#86efac'};
                cursor: pointer;
                display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
                transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
                font-family: 'DM Sans', sans-serif;
            `;
            card.innerHTML = `
                <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;line-height:1;letter-spacing:-0.5px;">${i}</span>
                <span style="font-size:7px;font-weight:700;letter-spacing:0.1em;opacity:0.75;text-transform:uppercase;">${isOccupied ? 'Occupée' : 'Libre'}</span>
            `;
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.06) translateY(-2px)';
                card.style.background = isOccupied ? 'rgba(190,18,60,0.28)' : 'rgba(22,163,74,0.26)';
                card.style.boxShadow = isOccupied
                    ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 20px rgba(190,18,60,0.25)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 18px rgba(22,163,74,0.2)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1) translateY(0)';
                card.style.background = isOccupied ? 'rgba(190,18,60,0.18)' : 'rgba(22,163,74,0.15)';
                card.style.boxShadow = isOccupied
                    ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.1)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.08)';
            });
            card.addEventListener('click', () => {
                if (isOccupied && tableOrders[tKey]) {
                    // Show detail popup for occupied table
                    openTableDetailPopup(tKey, tableOrders[tKey], occupiedCount);
                } else {
                    // Libre → sélectionner la table + fermer
                    const sel = document.getElementById('tableSelect');
                    if (sel) {
                        for (const opt of sel.options) {
                            if (opt.value === tKey) { sel.value = tKey; break; }
                        }
                    }
                    closePlanTablesModal();
                }
            });
            grid.appendChild(card);
        }
    } catch(e) {
        grid.innerHTML = `<div style="color:#f87171;font-size:13px;grid-column:1/-1;text-align:center;padding:30px 0;">❌ Erreur: ${e.message}</div>`;
        subtitle.textContent = 'Erreur de chargement';
    }
}

// ── TABLE DETAIL POPUP ──
function openTableDetailPopup(tKey, orders, occupiedCount) {
    const tableNum = tKey.replace('T','');
    const popup = document.getElementById('tableDetailPopup');
    document.getElementById('tdTitle').textContent = 'Table ' + tableNum + ' — Addition';

    const totalOrders = orders.length;
    document.getElementById('tdSubtitle').textContent = totalOrders + ' commande' + (totalOrders > 1 ? 's' : '') + ' · Total: ' + formatTdPrice(orders.reduce((s,o) => s + (parseFloat(o.total)||0), 0));
    document.getElementById('tdOccupied').textContent = occupiedCount + ' table(s) occupée(s)';

    // Render orders
    const list = document.getElementById('tdOrdersList');
    list.innerHTML = '';
    let grandTotal = 0;
    orders.forEach(order => {
        const total = parseFloat(order.total) || 0;
        grandTotal += total;
        const isPaid = order.status === 'paid' || order.status === 'payé';
        const statusLabel = isPaid ? 'Payé' : 'Non payé';
        const statusColor = isPaid ? '#3fb950' : '#f59e0b';
        const statusBg = isPaid ? 'rgba(63,185,80,0.15)' : 'rgba(245,158,11,0.15)';

        // Build items list — parse JSON string if needed
        let itemsHtml = '';
        let rawItems = order.items || order.cart || [];
        if (typeof rawItems === 'string') {
            try { rawItems = JSON.parse(rawItems); } catch(e) { rawItems = []; }
        }
        if (Array.isArray(rawItems)) {
            rawItems.forEach(it => {
                const qty = it.quantity || it.qty || 1;
                const name = it.name || it.title || it.product_name || it.label || '';
                if (name) itemsHtml += `<div style="font-size:13px;color:var(--orange-light);margin-bottom:2px;">${qty}× ${name}</div>`;
            });
        }

        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 14px;
            padding: 14px 16px;
        `;
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--text);">#${order.ticket_number ? String(order.ticket_number).padStart(4,'0') : String(order.id||'')}</span>
            </div>
            <div style="margin-bottom:10px;">${itemsHtml || '<span style="color:var(--muted);font-size:12px;">Aucun article</span>'}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--orange);">${formatTdPrice(total)}</span>
                ${!isPaid ? `<button onclick="encaisserOrder('${order.id}', this)" style="background:var(--green);color:#fff;border:none;padding:6px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:12px;cursor:pointer;">Encaisser</button>` : ''}
            </div>
        `;
        list.appendChild(card);
    });

    document.getElementById('tdTotal').textContent = formatTdPrice(grandTotal);

    // Store current table for "Ajouter une commande"
    popup._currentTable = tKey;
    popup._currentOrders = orders;
    popup.style.display = 'flex';
}

function closeTableDetailPopup() {
    document.getElementById('tableDetailPopup').style.display = 'none';
}

function tdGoBack() {
    closeTableDetailPopup();
    // planTablesModal is still open behind
}

function tdAddOrder() {
    const popup = document.getElementById('tableDetailPopup');
    const orders = popup._currentOrders || [];

    if (orders.length === 1) {
        // Un seul ordre → mode ajout direct
        const encoded = encodeURIComponent(JSON.stringify(orders[0]));
        closeTableDetailPopup();
        closePlanTablesModal();
        openModifierModal(encoded);
    } else if (orders.length > 1) {
        // Plusieurs ordres → choisir lequel modifier
        openTdOrderPicker(orders);
    } else {
        // Aucun ordre (ne devrait pas arriver) → sélectionner table + fermer
        const tKey = popup._currentTable;
        const sel = document.getElementById('tableSelect');
        if (sel && tKey) {
            for (const opt of sel.options) {
                if (opt.value === tKey) { sel.value = tKey; break; }
            }
        }
        closeTableDetailPopup();
        closePlanTablesModal();
    }
}

function openTdOrderPicker(orders) {
    // Show a small overlay inside the popup to pick which order to add to
    const existing = document.getElementById('tdOrderPickerOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'tdOrderPickerOverlay';
    overlay.style.cssText = `
        position:absolute; inset:0; border-radius:20px;
        background:rgba(13,17,23,0.82);
        backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        gap:10px; padding:24px; z-index:10;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-family:"Syne",sans-serif;font-weight:700;font-size:16px;color:#e6edf3;margin-bottom:4px;text-align:center;';
    title.textContent = 'Ajouter à quelle commande ?';
    overlay.appendChild(title);

    orders.forEach(order => {
        const idShort = '#' + (order.ticket_number ? String(order.ticket_number).padStart(4,'0') : String(order.id||''));
        const items = order.items || order.cart || [];
        const preview = Array.isArray(items) ? items.slice(0,2).map(i=>(i.name||i.title||'')).join(', ') : '';
        const total = parseFloat(order.total||0).toFixed(2) + ' DH';

        const btn = document.createElement('button');
        btn.style.cssText = `
            width:100%; padding:12px 16px; border-radius:12px;
            background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
            color:#e6edf3; cursor:pointer; text-align:left;
            display:flex; justify-content:space-between; align-items:center; gap:12px;
            font-family:'DM Sans',sans-serif; transition:background 0.15s;
        `;
        btn.onmouseenter = () => btn.style.background = 'rgba(255,140,0,0.12)';
        btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.06)';
        btn.innerHTML = `
            <div>
                <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;">${idShort}</div>
                <div style="font-size:11px;color:#7d8590;margin-top:2px;">${preview || 'Voir commande'}</div>
            </div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;color:#ff8c00;font-size:14px;white-space:nowrap;">${total}</div>
        `;
        btn.addEventListener('click', () => {
            const encoded = encodeURIComponent(JSON.stringify(order));
            closeTableDetailPopup();
            closePlanTablesModal();
            openModifierModal(encoded);
        });
        overlay.appendChild(btn);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
        margin-top:6px; padding:9px 22px; border-radius:10px;
        background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
        color:#7d8590; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px;
    `;
    cancelBtn.textContent = 'Annuler';
    cancelBtn.onclick = () => overlay.remove();
    overlay.appendChild(cancelBtn);

    // Attach to popup box
    const popupBox = document.getElementById('tableDetailPopup').firstElementChild;
    popupBox.style.position = 'relative';
    popupBox.appendChild(overlay);
}

function formatTdPrice(v) {
    return parseFloat(v || 0).toFixed(2) + ' DH';
}

async function encaisserOrder(orderId, btn) {
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    try {
        await updateOrderStatusFromKiosk(orderId, "done");
        showToast("✅ Commande encaissée !");

        // Re-fetch fresh data from API
        const popup = document.getElementById("tableDetailPopup");
        const tKey = popup._currentTable;
        if (!tKey) return;

        const token = localStorage.getItem("papaya_token");
        const res = await fetch(BACKEND_URL + "/api/orders", {
            headers: token ? { "Authorization": "Bearer " + token } : {}
        });
        const ordersRes = res.ok ? await res.json() : {};
        const allOrders = Array.isArray(ordersRes) ? ordersRes : (ordersRes.data || []);

        const occupiedTables = new Set();
        const tableOrders = {};
        allOrders.forEach(o => {
            if (PLAN_OCCUPIED_STATUSES.has(o.status) && o.table_number && o.table_number.startsWith("T")) {
                occupiedTables.add(o.table_number);
                if (!tableOrders[o.table_number]) tableOrders[o.table_number] = [];
                tableOrders[o.table_number].push(o);
            }
        });

        if (occupiedTables.has(tKey) && tableOrders[tKey]) {
            openTableDetailPopup(tKey, tableOrders[tKey], occupiedTables.size);
        } else {
            closeTableDetailPopup();
            await renderPlanTables();
        }
    } catch(e) {
        if (btn) { btn.disabled = false; btn.textContent = "Encaisser"; }
        showToast("❌ Erreur encaissement");
    }
}

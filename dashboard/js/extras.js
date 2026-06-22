// === Papaya Kiosk · extras.js ===
// Modal de sélection des extras

// ── EXTRAS SELECTION STATE ──
let _eselProduct = null;
let _eselGroups = [];
// selections: { [groupId]: { [optionId]: qty } }
let _eselSelections = {};

function openExtrasSelectionModal(product, groups) {
  _eselProduct = product;
  _eselGroups = groups.filter(g => (g.extras_options || []).some(o => o.is_available !== false));
  _eselSelections = {};
  // Pre-init selections
  _eselGroups.forEach(g => { _eselSelections[g.id] = {}; });

  document.getElementById('eselProductName').textContent = product.title;
  document.getElementById('eselProductPrice').textContent = Number(product.price).toFixed(2) + ' DH';
  // Hide skip button if any group is mandatory
  const hasMandatory = _eselGroups.some(g => g.is_mandatory);
  const skipBtn = document.getElementById('eselSkipBtn');
  if (skipBtn) skipBtn.style.display = hasMandatory ? 'none' : 'block';
  renderExtrasSelection();
  document.getElementById('extrasSelModal').classList.add('open');
}

function closeExtrasSelModal() {
  document.getElementById('extrasSelModal').classList.remove('open');
  _eselProduct = null;
}

function renderExtrasSelection() {
  const body = document.getElementById('eselBody');
  body.innerHTML = _eselGroups.map(g => {
    const options = (g.extras_options || []).filter(o => o.is_available !== false);
    const maxSel = g.max_selections || 1;
    const isMultipleQty = g.allow_multiple;
    const isSingleChoice = maxSel === 1;
    const groupSel = _eselSelections[g.id] || {};

    const optHtml = options.map(opt => {
      const qty = groupSel[opt.id] || 0;
      const isSelected = qty > 0;
      const priceLabel = parseFloat(opt.price_add) > 0 ? `+${parseFloat(opt.price_add).toFixed(2)} DH` : 'Free';
      const priceClass = parseFloat(opt.price_add) > 0 ? '' : ' free';
      const indicator = isSingleChoice
        ? `<div class="esel-radio"></div>`
        : `<div class="esel-check"><svg class="esel-check-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>`;
      const qtyControl = (isMultipleQty && isSelected)
        ? `<div class="esel-qty-wrap" onclick="event.stopPropagation()">
            <button class="esel-qty-btn" onclick="changeExtraQty(${g.id},${opt.id},-1)">−</button>
            <span class="esel-qty-val">${qty}</span>
            <button class="esel-qty-btn" onclick="changeExtraQty(${g.id},${opt.id},1)">+</button>
          </div>`
        : '';
      return `<div class="esel-option${isSelected?' selected':''}" onclick="toggleExtraOption(${g.id},${opt.id},${maxSel},${isMultipleQty})">
        ${indicator}
        <span class="esel-opt-name">${escHtmlKiosk(opt.name)}</span>
        ${qtyControl}
        <span class="esel-opt-price${priceClass}">${priceLabel}</span>
      </div>`;
    }).join('');

    return `<div class="esel-group">
      <div class="esel-group-title">
        ${escHtmlKiosk(g.name)}
        ${g.is_mandatory ? `<span class="esel-req-badge">Required</span>` : `<span class="esel-opt-badge">Optional</span>`}
      </div>
      ${maxSel > 1 ? `<div class="esel-max-hint">Choose up to ${maxSel} option${maxSel!==1?'s':''}</div>` : ''}
      ${optHtml}
    </div>`;
  }).join('');

  updateExtrasTotal();
}

function toggleExtraOption(groupId, optionId, maxSel, allowMultiple) {
  const groupSel = _eselSelections[groupId] = _eselSelections[groupId] || {};
  const currentQty = groupSel[optionId] || 0;

  if (maxSel === 1) {
    // Radio-style: deselect others
    if (currentQty > 0) { delete groupSel[optionId]; }
    else {
      Object.keys(groupSel).forEach(k => delete groupSel[k]);
      groupSel[optionId] = 1;
    }
  } else {
    // Checkbox-style
    if (currentQty > 0) { delete groupSel[optionId]; }
    else {
      const selectedCount = Object.keys(groupSel).length;
      if (selectedCount >= maxSel) return; // max reached
      groupSel[optionId] = 1;
    }
  }
  renderExtrasSelection();
}

function changeExtraQty(groupId, optionId, delta) {
  const groupSel = _eselSelections[groupId] = _eselSelections[groupId] || {};
  const current = groupSel[optionId] || 0;
  const newVal = current + delta;
  if (newVal <= 0) delete groupSel[optionId];
  else groupSel[optionId] = newVal;
  renderExtrasSelection();
}

function updateExtrasTotal() {
  if (!_eselProduct) return;
  let extrasTotal = 0;
  _eselGroups.forEach(g => {
    const groupSel = _eselSelections[g.id] || {};
    (g.extras_options || []).forEach(opt => {
      const qty = groupSel[opt.id] || 0;
      if (qty > 0) extrasTotal += parseFloat(opt.price_add || 0) * qty;
    });
  });
  const total = parseFloat(_eselProduct.price) + extrasTotal;
  document.getElementById('eselTotal').textContent = total.toFixed(2) + ' DH';

  // Disable add button if mandatory groups not satisfied
  const allSatisfied = _eselGroups.every(g => {
    if (!g.is_mandatory) return true;
    const groupSel = _eselSelections[g.id] || {};
    return Object.keys(groupSel).length > 0;
  });
  const btn = document.getElementById('eselAddBtn');
  btn.disabled = !allSatisfied;
  btn.textContent = allSatisfied ? 'Add to Order' : 'Please select required options';
}

function confirmExtrasAndAdd() {
  if (!_eselProduct) return;
  // Build extras summary
  const selectedExtras = [];
  _eselGroups.forEach(g => {
    const groupSel = _eselSelections[g.id] || {};
    (g.extras_options || []).forEach(opt => {
      const qty = groupSel[opt.id] || 0;
      if (qty > 0) {
        for (let i = 0; i < qty; i++) {
          selectedExtras.push({ groupName: g.name, optionName: opt.name, priceAdd: parseFloat(opt.price_add || 0) });
        }
      }
    });
  });
  const productToAdd = _eselProduct; // save before closing
  document.getElementById('extrasSelModal').classList.remove('open');
  _eselProduct = null;
  _addToCartDirect(productToAdd, selectedExtras);
}

function skipExtrasAndAdd() {
  if (!_eselProduct) return;
  const productToAdd = _eselProduct;
  document.getElementById('extrasSelModal').classList.remove('open');
  _eselProduct = null;
  _addToCartDirect(productToAdd, []);
}

function escHtmlKiosk(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

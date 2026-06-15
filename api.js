/**
 * ╔══════════════════════════════════════════╗
 * ║   Papaya Juice — API Helper              ║
 * ║   كل calls للـ backend من هنا           ║
 * ╚══════════════════════════════════════════╝
 *
 * Usage:
 *   <script src="api.js"></script>
 *   const products = await API.menu.getAll();
 */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://api.papayajuice.xyz/api';

// ── Token helpers ──
const Auth = {
  getToken: () => localStorage.getItem('papaya_token'),
  setToken: (t) => localStorage.setItem('papaya_token', t),
  removeToken: () => localStorage.removeItem('papaya_token'),
  getUser: () => JSON.parse(localStorage.getItem('papaya_user') || 'null'),
  setUser: (u) => localStorage.setItem('papaya_user', JSON.stringify(u)),
  isLoggedIn: () => !!localStorage.getItem('papaya_token'),
  logout: () => {
    localStorage.removeItem('papaya_token');
    localStorage.removeItem('papaya_user');
    sessionStorage.clear();
    location.href = '/dashboard';
  }
};

// ── Core fetch wrapper ──
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) { Auth.removeToken(); }
    throw new Error(json.error || `Erreur ${res.status}`);
  }
  return json;
}

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
const AuthAPI = {
  /**
   * Login — returns { token, user, redirect? }
   */
  login: async (username, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    return data;
  },

  me: () => apiFetch('/auth/me'),
};

// ════════════════════════════════════════
//  MENU
// ════════════════════════════════════════
const MenuAPI = {
  getAll: (category) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiFetch(`/menu/products${q}`);
  },
  getById: (id) => apiFetch(`/menu/products/${id}`),
  getCategories: () => apiFetch('/menu/categories'),
  getCategoryById: (id) => apiFetch(`/menu/categories/${id}`),
  createCategory: (cat) => apiFetch('/menu/categories', {
    method: 'POST',
    body: JSON.stringify(cat)
  }),
  updateCategory: (id, updates) => apiFetch(`/menu/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteCategory: (id) => apiFetch(`/menu/categories/${id}`, { method: 'DELETE' }),
  reorderCategories: (ids) => apiFetch('/menu/categories/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids })
  }),

  create: (product) => apiFetch('/menu/products', {
    method: 'POST',
    body: JSON.stringify(product)
  }),
  update: (id, updates) => apiFetch(`/menu/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  reorder: (ids) => apiFetch('/menu/products/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids })
  }),
  delete: (id) => apiFetch(`/menu/products/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════
const OrdersAPI = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/orders${q ? '?' + q : ''}`);
  },
  getStats: () => apiFetch('/orders/stats'),
  getById: (id) => apiFetch(`/orders/${id}`),

  create: (order) => apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  }),
  updateStatus: (id, status) => apiFetch(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  delete: (id) => apiFetch(`/orders/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════
//  PERSONNEL
// ════════════════════════════════════════
const PersonnelAPI = {
  getAll: () => apiFetch('/personnel'),
  getById: (id) => apiFetch(`/personnel/${id}`),

  create: (emp) => apiFetch('/personnel', {
    method: 'POST',
    body: JSON.stringify(emp)
  }),
  update: (id, updates) => apiFetch(`/personnel/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  delete: (id) => apiFetch(`/personnel/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════
//  STOCK
// ════════════════════════════════════════
const StockAPI = {
  getDesignations: () => apiFetch('/stock/designations'),
  createDesignation: (d) => apiFetch('/stock/designations', {
    method: 'POST', body: JSON.stringify(d)
  }),
  updateDesignation: (id, updates) => apiFetch(`/stock/designations/${id}`, {
    method: 'PUT', body: JSON.stringify(updates)
  }),
  deleteDesignation: (id) => apiFetch(`/stock/designations/${id}`, { method: 'DELETE' }),
  resetGlobal: () => apiFetch('/stock/designations/reset-global', { method: 'POST' }),

  getMouvements: (limit) => apiFetch(`/stock/mouvements${limit ? '?limit=' + limit : ''}`),
  createMouvement: (m) => apiFetch('/stock/mouvements', {
    method: 'POST', body: JSON.stringify(m)
  }),
};

// ════════════════════════════════════════
//  RECETTES
// ════════════════════════════════════════
const RecettesAPI = {
  getAll: (productId) => apiFetch(`/recettes${productId ? '?product_id=' + productId : ''}`),
  create: (r) => apiFetch('/recettes', { method: 'POST', body: JSON.stringify(r) }),
  delete: (id) => apiFetch(`/recettes/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════
//  RECLAMATIONS
// ════════════════════════════════════════
const ReclamationsAPI = {
  // GET : auth requis (dashboard). Query optionnel { days, limit }
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/reclamations${q ? '?' + q : ''}`);
  },
  // POST : public (client depuis le menu)
  create: (r) => apiFetch('/reclamations', { method: 'POST', body: JSON.stringify(r) }),
  update: (id, updates) => apiFetch(`/reclamations/${id}`, {
    method: 'PUT', body: JSON.stringify(updates)
  }),
  delete: (id) => apiFetch(`/reclamations/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════
//  Global export
// ════════════════════════════════════════
window.API = {
  base: API_BASE,
  Auth,
  auth: AuthAPI,
  menu: MenuAPI,
  orders: OrdersAPI,
  personnel: PersonnelAPI,
  stock: StockAPI,
  recettes: RecettesAPI,
  reclamations: ReclamationsAPI,
};

console.log('🍹 Papaya Juice API helper chargé — backend:', API_BASE);

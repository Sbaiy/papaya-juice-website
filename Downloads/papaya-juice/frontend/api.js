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

const API_BASE = 'http://localhost:3000/api';

// ── Token helpers ──
const Auth = {
  getToken: () => sessionStorage.getItem('papaya_token'),
  setToken: (t) => sessionStorage.setItem('papaya_token', t),
  removeToken: () => sessionStorage.removeItem('papaya_token'),
  getUser: () => JSON.parse(sessionStorage.getItem('papaya_user') || 'null'),
  setUser: (u) => sessionStorage.setItem('papaya_user', JSON.stringify(u)),
  isLoggedIn: () => !!sessionStorage.getItem('papaya_token'),
  logout: () => {
    sessionStorage.removeItem('papaya_token');
    sessionStorage.removeItem('papaya_user');
    location.reload();
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
//  Global export
// ════════════════════════════════════════
window.API = {
  base: API_BASE,
  Auth,
  auth: AuthAPI,
  menu: MenuAPI,
  orders: OrdersAPI,
  personnel: PersonnelAPI,
};

console.log('🍹 Papaya Juice API helper chargé — backend:', API_BASE);

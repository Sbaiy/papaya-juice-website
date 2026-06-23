// === Papaya Kiosk · api.js ===
// API layer — apiFetch + Auth/Menu/Orders/Personnel

/**
 * ╔══════════════════════════════════════════╗
 * ║   Papaya Juice — API Helper              ║
 * ╚══════════════════════════════════════════╝
 */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://papaya-juice-backend-production.up.railway.app/api';

const Auth = {
  getToken: () => localStorage.getItem('papaya_token'),
  setToken: (t) => localStorage.setItem('papaya_token', t),
  removeToken: () => localStorage.removeItem('papaya_token'),
  getUser: () => JSON.parse(localStorage.getItem('papaya_user') || 'null'),
  setUser: (u) => localStorage.setItem('papaya_user', JSON.stringify(u)),
  isLoggedIn: () => !!localStorage.getItem('papaya_token'),
  logout: async () => {
    const token = localStorage.getItem('papaya_token') || sessionStorage.getItem('papaya_token');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
    } catch(e) { console.warn('Pointage logout échoué:', e); }
    localStorage.removeItem('papaya_token');
    localStorage.removeItem('papaya_user');
    sessionStorage.clear();
    location.href = '/dashboard';
  }
};

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

const AuthAPI = {
  login: async (username, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, longLived: true })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    return data;
  },
  me: () => apiFetch('/auth/me'),
};

const MenuAPI = {
  getAll: (category) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiFetch(`/menu/products${q}`);
  },
  getById: (id) => apiFetch(`/menu/products/${id}`),
  getCategories: () => apiFetch('/menu/categories'),
  create: (product) => apiFetch('/menu/products', { method: 'POST', body: JSON.stringify(product) }),
  update: (id, updates) => apiFetch(`/menu/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  reorder: (ids) => apiFetch('/menu/products/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
  delete: (id) => apiFetch(`/menu/products/${id}`, { method: 'DELETE' }),
};

const OrdersAPI = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/orders${q ? '?' + q : ''}`);
  },
  getStats: () => apiFetch('/orders/stats'),
  getById: (id) => apiFetch(`/orders/${id}`),
  create: (order) => apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateStatus: (id, status) => apiFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id) => apiFetch(`/orders/${id}`, { method: 'DELETE' }),
};

const PersonnelAPI = {
  getAll: () => apiFetch('/personnel'),
  getById: (id) => apiFetch(`/personnel/${id}`),
  create: (emp) => apiFetch('/personnel', { method: 'POST', body: JSON.stringify(emp) }),
  update: (id, updates) => apiFetch(`/personnel/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  delete: (id) => apiFetch(`/personnel/${id}`, { method: 'DELETE' }),
};

window.API = {
  base: API_BASE,
  Auth,
  auth: AuthAPI,
  menu: MenuAPI,
  orders: OrdersAPI,
  personnel: PersonnelAPI,
};

console.log('🍹 Papaya Juice API helper chargé — backend:', API_BASE);

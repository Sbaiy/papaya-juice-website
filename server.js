require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// ══════════════════════════════════════════════════
//  Supabase client (partagé entre les routes)
// ══════════════════════════════════════════════════
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
module.exports.supabase = supabase; // ← Export pour les routes qui en ont besoin

// ══════════════════════════════════════════════════
//  Express app
// ══════════════════════════════════════════════════
const app = express();

// ── Middlewares ──
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
].filter(Boolean);

// ── Security headers ──
app.use(helmet());

// ── Rate limiting sur login ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/\.(vercel\.app|railway\.app|netlify\.app)$/.test(origin)) return callback(null, true);
    callback(new Error('CORS bloqué: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ──
app.use((req, res, next) => {
  const ts = new Date().toLocaleTimeString('fr-FR');
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ══════════════════════════════════════════════════
//  API Routes
// ══════════════════════════════════════════════════
const authRoutes      = require('./routes/auth');
const menuRoutes      = require('./routes/menu');
const ordersRoutes    = require('./routes/orders');
const personnelRoutes = require('./routes/personnel');
const cloturesRoutes  = require('./routes/clotures');
const salariesRoutes  = require('./routes/salaries');

app.use('/api/auth',      authRoutes);
app.use('/api/menu',      menuRoutes);
app.use('/api/orders',    ordersRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/clotures',  cloturesRoutes);
app.use('/api/salaries',  salariesRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'Papaya Juice Backend',
    version: '1.0.1',
    time: new Date().toISOString()
  });
});

// ══════════════════════════════════════════════════
//  Frontend Routes (local dev)
// ══════════════════════════════════════════════════
app.get('/dashboard/kiosk', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/kiosk.html'));
});
app.get('/dashboard/commandes-live', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/commandes-live.html'));
});
app.get('/dashboard/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});
app.get('/dashboard/personnel', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/personnel.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// ── 404 fallback ──
app.use((req, res) => {
  res.status(404).json({ error: `Route introuvable: ${req.method} ${req.path}` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ══════════════════════════════════════════════════
//  Start server
// ══════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('🍹 ═══════════════════════════════════════');
  console.log('   Papaya Juice Backend — Démarré !');
  console.log(`   http://localhost:${PORT}/api/health`);
  console.log('   ─────────────────────────────────────');
  console.log('   Routes disponibles:');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/menu/products');
  console.log('   GET    /api/menu/categories');
  console.log('   GET    /api/orders');
  console.log('   POST   /api/orders');
  console.log('   GET    /api/orders/stats');
  console.log('   GET    /api/personnel');
  console.log('   GET    /dashboard/kiosk');
  console.log('🍹 ═══════════════════════════════════════');
  console.log('');
});

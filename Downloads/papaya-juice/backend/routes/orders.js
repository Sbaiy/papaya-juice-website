const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../server');

// ═══════════════════════════════════════
//  GET /api/orders
//  Query params: ?status=pending|preparing|ready|delivered&date=2026-05-26
// ═══════════════════════════════════════
router.get('/', requireAuth, async (req, res) => {
  const { status, date, limit = 50 } = req.query;

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (status) query = query.eq('status', status);
  if (date)   query = query.gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  GET /api/orders/stats
//  Statistiques du dashboard
// ═══════════════════════════════════════
router.get('/stats', requireAuth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Commandes aujourd'hui
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, total, status')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    // Commandes en attente
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id')
      .in('status', ['pending', 'preparing']);

    // Total produits actifs
    const { count: totalItems } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: activeItems } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('disponible', true);

    const revenue = todayOrders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;

    res.json({
      todayOrders: todayOrders?.length || 0,
      todayRevenue: revenue.toFixed(2),
      pendingOrders: pendingOrders?.length || 0,
      totalItems: totalItems || 0,
      activeItems: activeItems || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════
//  GET /api/orders/:id
// ═══════════════════════════════════════
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(data);
});

// ═══════════════════════════════════════
//  POST /api/orders
//  Créer une nouvelle commande (public — client)
//  Body: { items: [{id, title, price, qty}], table_number, total }
// ═══════════════════════════════════════
router.post('/', async (req, res) => {
  const { items, table_number, total, note } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'items est requis' });
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([{
      items,
      table_number: table_number || null,
      total: total || 0,
      note: note || '',
      status: 'pending',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ═══════════════════════════════════════
//  PUT /api/orders/:id/status  (auth requis)
//  Body: { status: 'pending' | 'preparing' | 'ready' | 'delivered' }
// ═══════════════════════════════════════
router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status invalide. Valeurs acceptées: ${validStatuses.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  DELETE /api/orders/:id  (auth requis)
// ═══════════════════════════════════════
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;

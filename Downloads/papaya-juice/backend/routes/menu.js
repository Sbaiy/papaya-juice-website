const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../server');

// ═══════════════════════════════════════
//  GET /api/menu/products
//  Retourne tous les produits (public)
// ═══════════════════════════════════════
router.get('/products', async (req, res) => {
  const { category } = req.query;
  let query = supabase.from('products').select('*').order('sort_order', { ascending: true });
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  GET /api/menu/products/:id
// ═══════════════════════════════════════
router.get('/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(data);
});

// ═══════════════════════════════════════
//  POST /api/menu/products  (admin requis)
//  Body: { title, description, price, category, image, disponible }
// ═══════════════════════════════════════
router.post('/products', requireAuth, async (req, res) => {
  const { title, description, price, category, image } = req.body;
  if (!title || !price || !category) {
    return res.status(400).json({ error: 'title, price et category sont requis' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{ title, description: description || '-', price, category, image: image || '', disponible: true }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ═══════════════════════════════════════
//  PUT /api/menu/products/:id  (admin requis)
// ═══════════════════════════════════════
router.put('/products/:id', requireAuth, async (req, res) => {
  const allowedFields = ['title', 'description', 'price', 'category', 'image', 'disponible', 'sort_order'];
  const updates = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  PUT /api/menu/products/reorder  (admin requis)
//  Body: { ids: [1, 3, 2, 5, ...] }
// ═══════════════════════════════════════
router.put('/products/reorder', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids doit être un tableau' });

  const updates = ids.map((id, index) =>
    supabase.from('products').update({ sort_order: index }).eq('id', id)
  );
  await Promise.all(updates);
  res.json({ success: true });
});

// ═══════════════════════════════════════
//  DELETE /api/menu/products/:id  (admin requis)
// ═══════════════════════════════════════
router.delete('/products/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Produit supprimé' });
});

// ═══════════════════════════════════════
//  GET /api/menu/categories  (public)
// ═══════════════════════════════════════
router.get('/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  // Retourner les catégories uniques
  const unique = [...new Set(data.map(r => r.category))].filter(Boolean);
  res.json(unique);
});

module.exports = router;

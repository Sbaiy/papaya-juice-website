const express = require('express');
const router = express.Router();
const { requireAuth, requireOwner } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ═══════════════════════════════════════
//  GET /api/menu/products
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
//  PUT /api/menu/products/reorder  ⚠️ DOIT être avant /:id
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
//  GET /api/menu/products/:id
// ═══════════════════════════════════════
router.get('/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(data);
});

// ═══════════════════════════════════════
//  POST /api/menu/products
// ═══════════════════════════════════════
router.post('/products', requireAuth, async (req, res) => {
  const { title, description, price, category, image } = req.body;
  if (!title || !price || !category)
    return res.status(400).json({ error: 'title, price et category sont requis' });

  const { data, error } = await supabase
    .from('products')
    .insert([{ title, description: description || '-', price, category, image: image || '', disponible: true }])
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ═══════════════════════════════════════
//  PUT /api/menu/products/:id
// ═══════════════════════════════════════
router.put('/products/:id', requireAuth, async (req, res) => {
  const allowedFields = ['title', 'description', 'price', 'category', 'image', 'disponible', 'sort_order'];
  const updates = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const { data, error } = await supabase
    .from('products').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  DELETE /api/menu/products/:id
// ═══════════════════════════════════════
router.delete('/products/:id', requireOwner, async (req, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Produit supprimé' });
});

// ══════════════════════════════════════════════
//  CATEGORIES — CRUD complet
// ══════════════════════════════════════════════

// GET /api/menu/categories  (public)
router.get('/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/menu/categories/reorder  ⚠️ DOIT être avant /:id
router.put('/categories/reorder', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids doit être un tableau' });
  const updates = ids.map((id, index) =>
    supabase.from('categories').update({ sort_order: index }).eq('id', id)
  );
  await Promise.all(updates);
  res.json({ success: true });
});

// GET /api/menu/categories/:id
router.get('/categories/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('categories').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Catégorie introuvable' });
  res.json(data);
});

// POST /api/menu/categories  (auth requis)
router.post('/categories', requireAuth, async (req, res) => {
  const { name_fr, name_en, name_ar, image, max_items, sort_order } = req.body;
  if (!name_fr && !name_en)
    return res.status(400).json({ error: 'name_fr ou name_en est requis' });

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name_fr, name_en, name_ar, image: image || null, max_items: max_items || null, sort_order: sort_order || 0 }])
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/menu/categories/:id  (auth requis)
router.put('/categories/:id', requireAuth, async (req, res) => {
  const allowed = ['name_fr', 'name_en', 'name_ar', 'image', 'max_items', 'sort_order'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const { data, error } = await supabase
    .from('categories').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/menu/categories/:id  (auth requis)
router.delete('/categories/:id', requireOwner, async (req, res) => {
  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Catégorie supprimée' });
});

module.exports = router;

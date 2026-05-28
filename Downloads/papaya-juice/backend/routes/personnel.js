const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../server');

// ═══════════════════════════════════════
//  GET /api/personnel
// ═══════════════════════════════════════
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('personnel')
    .select('id, name, role, email, active, created_at')  // ⚠️ password exclu
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  GET /api/personnel/:id
// ═══════════════════════════════════════
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('personnel')
    .select('id, name, role, email, active, created_at')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Employé introuvable' });
  res.json(data);
});

// ═══════════════════════════════════════
//  POST /api/personnel  (auth requis)
//  Body: { name, role, email, password }
// ═══════════════════════════════════════
router.post('/', requireAuth, async (req, res) => {
  const { name, role, email, password } = req.body;

  if (!name || !role || !password) {
    return res.status(400).json({ error: 'name, role et password sont requis' });
  }

  // Vérifier email unique si fourni
  if (email) {
    const { data: existing } = await supabase
      .from('personnel')
      .select('id')
      .eq('email', email)
      .limit(1);
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
  }

  const { data, error } = await supabase
    .from('personnel')
    .insert([{ name, role, email: email || null, password, active: true }])
    .select('id, name, role, email, active, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ═══════════════════════════════════════
//  PUT /api/personnel/:id  (auth requis)
// ═══════════════════════════════════════
router.put('/:id', requireAuth, async (req, res) => {
  const allowedFields = ['name', 'role', 'email', 'password', 'active'];
  const updates = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  }

  const { data, error } = await supabase
    .from('personnel')
    .update(updates)
    .eq('id', req.params.id)
    .select('id, name, role, email, active, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  DELETE /api/personnel/:id  (auth requis)
// ═══════════════════════════════════════
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('personnel').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Employé supprimé' });
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/clotures
 */
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('clotures')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * POST /api/clotures
 * Body: { caissier, nbr_commandes, total }
 */
router.post('/', requireAuth, async (req, res) => {
  const { caissier, nbr_commandes, total } = req.body;
  if (!caissier || nbr_commandes === undefined || total === undefined) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  const { data, error } = await supabase
    .from('clotures')
    .insert([{ caissier, nbr_commandes, total }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ═══════════════════════════════════════
//  GET /api/salaries
// ═══════════════════════════════════════
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('salaries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ═══════════════════════════════════════
//  POST /api/salaries
//  Body: { employee_id, employee_name, amount, period, date, note, paid }
// ═══════════════════════════════════════
router.post('/', requireAuth, async (req, res) => {
  const { employee_id, employee_name, amount, period, date, note, paid } = req.body;
  if (!employee_id || !amount) {
    return res.status(400).json({ error: 'employee_id et amount sont requis' });
  }
  const { data, error } = await supabase
    .from('salaries')
    .insert([{ employee_id, employee_name, amount: parseFloat(amount), period, date: date || null, note, paid: !!paid }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ═══════════════════════════════════════
//  DELETE /api/salaries/:id
// ═══════════════════════════════════════
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('salaries').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;

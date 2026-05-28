const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { supabase } = require('../server');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, user: { name, role } }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
  }

  // ── Vérification propriétaire ──
  const adminUser = process.env.ADMIN_USER || 'sbaiy';
  const adminPass = process.env.ADMIN_PASS || '2030';

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign(
      { id: 'owner', name: 'Papaya Owner', role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    return res.json({
      token,
      user: { name: 'Papaya Owner', role: 'Propriétaire' }
    });
  }

  // ── Vérification personnel ──
  const { data, error } = await supabase
    .from('personnel')
    .select('*')
    .eq('active', true)
    .or(`email.eq.${username},name.eq.${username}`)
    .eq('password', password)
    .limit(1);

  if (error || !data || data.length === 0) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const emp = data[0];
  const token = jwt.sign(
    { id: emp.id, name: emp.name, role: emp.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({
    token,
    user: { name: emp.name, role: emp.role },
    redirect: emp.role?.toLowerCase() === 'cuisinier' ? '/commandes-live.html' : null
  });
});

/**
 * GET /api/auth/me
 * Returns current user info from token
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non connecté' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    res.json({ user: { id: decoded.id, name: decoded.name, role: decoded.role } });
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
});

module.exports = router;

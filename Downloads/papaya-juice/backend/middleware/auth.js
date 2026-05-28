const jwt = require('jsonwebtoken');

/**
 * Middleware: verifies JWT token in Authorization header
 * Usage: router.get('/protected', requireAuth, handler)
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expiré ou invalide' });
  }
}

/**
 * Middleware: only owner/manager can access
 */
function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Accès refusé — propriétaire requis' });
  }
  next();
}

module.exports = { requireAuth, requireOwner };

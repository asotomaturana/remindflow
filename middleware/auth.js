/**
 * RemindFlow — Middleware de autenticación v3.4.0
 *
 * Acepta dos métodos:
 *  1. Header X-API-Key: <clave>          — acceso programático / scripts
 *  2. Header Authorization: Bearer <jwt> — frontend con login
 */

const { verifyToken } = require('../routes/auth');

function requireAuth(req, res, next) {
  // Método 1: API Key (compatible con versiones anteriores)
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.API_SECRET_KEY) {
    req.authMethod = 'apikey';
    return next();
  }

  // Método 2: JWT Bearer token
  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.authMethod = 'jwt';
      req.user = payload;
      return next();
    }
    return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
  }

  return res.status(401).json({ error: 'No autorizado. Inicia sesión o incluye X-API-Key.' });
}

const requireApiKey = requireAuth;
module.exports = { requireAuth, requireApiKey };

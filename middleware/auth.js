/**
 * RemindFlow — Middleware de autenticación v3.5.0
 *
 * CAMBIOS v3.5.0 (fix H-03):
 *   - Diferencia mensaje de error entre token inválido y token expirado
 */

const { verifyToken } = require('../routes/auth');

function requireAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.API_SECRET_KEY) {
    req.authMethod = 'apikey';
    return next();
  }

  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.authMethod = 'jwt';
      req.user = payload;
      return next();
    }

    try {
      const [header, body, sig] = token.split('.');
      if (header && body && sig) {
        const decoded   = JSON.parse(Buffer.from(body, 'base64url').toString());
        const isExpired = decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp;
        if (isExpired) {
          return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
        }
      }
    } catch {}

    return res.status(401).json({ error: 'Token inválido.' });
  }

  return res.status(401).json({ error: 'No autorizado. Inicia sesión o incluye X-API-Key.' });
}

const requireApiKey = requireAuth;
module.exports = { requireAuth, requireApiKey };
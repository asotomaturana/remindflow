/**
 * RemindFlow — Rutas de autenticación v3.4.0
 *
 * Login con usuario + contraseña definidos en .env
 * Devuelve un JWT de sesión firmado con JWT_SECRET
 * El frontend lo guarda en localStorage y lo envía en cada request
 * como header Authorization: Bearer <token>
 */

const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');

/** Genera un token simple firmado con HMAC-SHA256 */
function signToken(payload) {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body    = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const sig     = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret')
                        .update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret')
                           .update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    // Token válido por 8 horas
    if (Date.now() - payload.iat > 8 * 60 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const validUser = process.env.APP_USERNAME || 'admin';
  const validPass = process.env.APP_PASSWORD || 'remindflow2026';

  if (username !== validUser || password !== validPass) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = signToken({ username, role: 'admin' });
  res.json({ token, username, expiresIn: '8h' });
});

// POST /auth/logout (el frontend simplemente elimina el token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada' });
});

// GET /auth/me — verificar token activo
router.get('/me', (req, res) => {
  const auth  = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado' });
  res.json({ username: payload.username, role: payload.role });
});

module.exports = { router, verifyToken };

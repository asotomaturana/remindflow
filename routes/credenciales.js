/**
 * RemindFlow — Ruta: Credenciales de Redes Sociales v4.1.0
 * Almacena usuario + contraseña de cada red social por cliente.
 * Las contraseñas se cifran con AES-256-GCM antes de guardar en memoria.
 * Para ver contraseñas, el admin debe reautenticarse con su contraseña de aplicación.
 */

const express = require('express');
const router  = express.Router();
const { encrypt, decrypt } = require('../services/cipher');
const { randomUUID } = require('crypto');
const { addAudit }   = require('../store');
const crypto = require('crypto');

// Almacén en memoria — en producción: tabla `social_credentials` en PostgreSQL
let credenciales = [];

function uid()  { return randomUUID(); }
function now()  { return new Date().toISOString(); }

// ── GET /api/credenciales?clientId=xxx ───────────────────────
// Devuelve credenciales SIN contraseñas (solo usuario + plataforma)
router.get('/', (req, res) => {
  const { clientId } = req.query;
  let list = credenciales;
  if (clientId) list = list.filter(c => c.clientId === clientId);
  // Nunca exponer el campo encryptedPassword en el listado
  const safe = list.map(({ encryptedPassword, ...rest }) => rest);
  res.json(safe);
});

// ── POST /api/credenciales ───────────────────────────────────
// Crear credencial nueva
router.post('/', (req, res) => {
  const { clientId, platform, username, password, notes } = req.body;
  if (!clientId || !platform || !username || !password) {
    return res.status(400).json({ error: 'clientId, platform, username y password son requeridos' });
  }
  // Verificar que no exista ya una credencial para ese cliente + plataforma
  const exists = credenciales.find(c => c.clientId === clientId && c.platform === platform);
  if (exists) {
    return res.status(409).json({ error: `Ya existe una credencial para ${platform} en este cliente. Usa PUT para actualizarla.` });
  }
  let encryptedPassword;
  try {
    encryptedPassword = encrypt(password);
  } catch (e) {
    return res.status(500).json({ error: 'Error de cifrado: ' + e.message });
  }
  const cred = {
    id: uid(),
    clientId,
    platform,         // 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'otro'
    username,
    encryptedPassword,
    notes: notes || '',
    createdAt: now(),
    updatedAt: now(),
  };
  credenciales.push(cred);
  addAudit({ entity: 'credencial', entityId: cred.id, clientId, action: 'created', detail: `Credencial ${platform} creada para cliente ${clientId}` });
  const { encryptedPassword: _, ...safe } = cred;
  res.status(201).json(safe);
});

// ── PUT /api/credenciales/:id ────────────────────────────────
// Actualizar credencial
router.put('/:id', (req, res) => {
  const i = credenciales.findIndex(c => c.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Credencial no encontrada' });
  const { username, password, notes } = req.body;
  if (username) credenciales[i].username = username;
  if (notes !== undefined) credenciales[i].notes = notes;
  if (password) {
    try {
      credenciales[i].encryptedPassword = encrypt(password);
    } catch (e) {
      return res.status(500).json({ error: 'Error de cifrado: ' + e.message });
    }
  }
  credenciales[i].updatedAt = now();
  addAudit({ entity: 'credencial', entityId: req.params.id, clientId: credenciales[i].clientId, action: 'updated', detail: `Credencial ${credenciales[i].platform} actualizada` });
  const { encryptedPassword: _, ...safe } = credenciales[i];
  res.json(safe);
});

// ── DELETE /api/credenciales/:id ─────────────────────────────
router.delete('/:id', (req, res) => {
  const prev = credenciales.length;
  credenciales = credenciales.filter(c => c.id !== req.params.id);
  if (credenciales.length === prev) return res.status(404).json({ error: 'Credencial no encontrada' });
  addAudit({ entity: 'credencial', entityId: req.params.id, action: 'deleted', detail: 'Credencial eliminada' });
  res.json({ ok: true });
});

// ── POST /api/credenciales/:id/reveal ────────────────────────
// Revelar contraseña — requiere contraseña del admin para autorizar
router.post('/:id/reveal', (req, res) => {
  const { adminPassword } = req.body;
  if (!adminPassword) return res.status(400).json({ error: 'adminPassword requerido' });

  // Verificar contraseña del admin
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return res.status(500).json({ error: 'APP_PASSWORD no configurado en el servidor' });
  // Comparación segura para evitar timing attacks
  const inputHash = crypto.createHash('sha256').update(adminPassword).digest('hex');
  const validHash = crypto.createHash('sha256').update(appPassword).digest('hex');
  if (inputHash !== validHash) {
    addAudit({ entity: 'credencial', entityId: req.params.id, action: 'reveal_denied', detail: 'Intento de revelar contraseña con credenciales incorrectas' });
    return res.status(403).json({ error: 'Contraseña de admin incorrecta' });
  }

  const cred = credenciales.find(c => c.id === req.params.id);
  if (!cred) return res.status(404).json({ error: 'Credencial no encontrada' });

  let plainPassword;
  try {
    plainPassword = decrypt(cred.encryptedPassword);
  } catch (e) {
    return res.status(500).json({ error: 'Error al descifrar: ' + e.message });
  }
  addAudit({ entity: 'credencial', entityId: cred.id, clientId: cred.clientId, action: 'revealed', detail: `Contraseña de ${cred.platform} revelada por admin` });
  res.json({ password: plainPassword });
});

module.exports = router;

/**
 * RemindFlow — Ruta: Accesos de Redes Sociales v4.2.0
 *
 * Rediseño desde v4.1.0 (fix H-06):
 * - Eliminado almacenamiento de contraseñas
 * - Eliminado endpoint /reveal
 * - Reemplazado por gestor de tipo de acceso (colaborador, administrador, etc)
 * - El community manager documenta qué nivel de acceso tiene, sin almacenar credenciales
 */

const express = require('express');
const router  = express.Router();
const { randomUUID } = require('crypto');
const { addAudit } = require('../store');

// Almacén en memoria — pendiente migrar a SQLite (deuda técnica)
let accesos = [];

const VALID_PLATFORMS    = ['instagram','facebook','tiktok','whatsapp','youtube','otro'];
const VALID_ACCESS_TYPES = ['colaborador','administrador','acceso_delegado','otro'];

function uid() { return randomUUID(); }
function now() { return new Date().toISOString(); }

// GET /api/credenciales?clientId=xxx
router.get('/', (req, res) => {
  const { clientId } = req.query;
  let list = accesos;
  if (clientId) list = list.filter(a => a.clientId === clientId);
  res.json(list);
});

// POST /api/credenciales
router.post('/', (req, res) => {
  const { clientId, platform, username, accessType, notes } = req.body;

  if (!clientId || !platform || !accessType) {
    return res.status(400).json({ error: 'clientId, platform y accessType son requeridos' });
  }
  if (!VALID_PLATFORMS.includes(platform)) {
    return res.status(400).json({ error: `platform inválido. Valores: ${VALID_PLATFORMS.join(', ')}` });
  }
  if (!VALID_ACCESS_TYPES.includes(accessType)) {
    return res.status(400).json({ error: `accessType inválido. Valores: ${VALID_ACCESS_TYPES.join(', ')}` });
  }

  const exists = accesos.find(a => a.clientId === clientId && a.platform === platform);
  if (exists) {
    return res.status(409).json({ error: `Ya existe un registro de acceso para ${platform} en este cliente.` });
  }

  const acceso = {
    id:         uid(),
    clientId,
    platform,
    username:   username   || null,
    accessType,
    notes:      notes      || '',
    createdAt:  now(),
    updatedAt:  now(),
  };

  accesos.push(acceso);
  addAudit({
    entity: 'credencial', entityId: acceso.id, clientId,
    action: 'created',
    detail: `Acceso ${platform} (${accessType}) registrado`,
  });

  res.status(201).json(acceso);
});

// PUT /api/credenciales/:id
router.put('/:id', (req, res) => {
  const i = accesos.findIndex(a => a.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Registro no encontrado' });

  const { username, accessType, notes } = req.body;
  if (accessType && !VALID_ACCESS_TYPES.includes(accessType)) {
    return res.status(400).json({ error: `accessType inválido. Valores: ${VALID_ACCESS_TYPES.join(', ')}` });
  }

  if (username   !== undefined) accesos[i].username   = username;
  if (accessType !== undefined) accesos[i].accessType = accessType;
  if (notes      !== undefined) accesos[i].notes      = notes;
  accesos[i].updatedAt = now();

  addAudit({
    entity: 'credencial', entityId: req.params.id,
    clientId: accesos[i].clientId, action: 'updated',
    detail: `Acceso ${accesos[i].platform} actualizado`,
  });

  res.json(accesos[i]);
});

// DELETE /api/credenciales/:id
router.delete('/:id', (req, res) => {
  const prev = accesos.length;
  accesos = accesos.filter(a => a.id !== req.params.id);
  if (accesos.length === prev) return res.status(404).json({ error: 'Registro no encontrado' });
  addAudit({
    entity: 'credencial', entityId: req.params.id,
    action: 'deleted', detail: 'Registro de acceso eliminado',
  });
  res.json({ ok: true });
});

// NOTA: endpoint /reveal eliminado intencionalmente en v4.2.0
// El módulo rediseñado no almacena contraseñas

module.exports = router;
const express = require('express');
const router  = express.Router();
const store   = require('../store');

const VALID_STATUSES = ['agreed','reminded','replied','inprod','delivered','published','overdue'];

router.get('/', (req, res) => {
  let items = store.getContenido(req.query.clientId || null);
  if (req.query.status)   items = items.filter(c => c.status === req.query.status);
  if (req.query.platform) items = items.filter(c => c.platform === req.query.platform);
  const now = new Date();
  items = items.map(c => {
    if (c.due && new Date(c.due) < now && !['delivered','published'].includes(c.status)) {
      return store.updateContenido(c.id, { status: 'overdue' });
    }
    return c;
  });
  res.json(items.slice().reverse());
});

router.get('/:id', (req, res) => {
  const c = store.getContenidoItem(req.params.id);
  if (!c) return res.status(404).json({ error: 'Pieza de contenido no encontrada' });
  // Enrich with related respuestas and materiales
  const respuestas = store.getRespuestas({ contenidoId: c.id });
  const materiales = store.getMateriales({ contenidoId: c.id });
  res.json({ ...c, respuestas, materiales });
});

router.post('/', (req, res) => {
  const { clientId, name, type } = req.body;
  if (!clientId || !name || !type) return res.status(400).json({ error: 'Se requieren clientId, name y type' });
  if (!store.getClient(clientId)) return res.status(404).json({ error: 'Cliente no encontrado' });
  const { platform='', status='agreed', due=null, description='', reply='' } = req.body;
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  res.status(201).json(store.createContenido({ clientId, name, type, platform, status, due, description, reply }));
});

router.put('/:id', (req, res) => {
  if (req.body.status && !VALID_STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Status inválido' });
  const c = store.updateContenido(req.params.id, req.body);
  if (!c) return res.status(404).json({ error: 'Pieza de contenido no encontrada' });
  res.json(c);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) return res.status(400).json({ error: `Status inválido` });
  const c = store.updateContenido(req.params.id, { status });
  if (!c) return res.status(404).json({ error: 'Pieza de contenido no encontrada' });
  res.json(c);
});

router.patch('/:id/reply', (req, res) => {
  const { reply, channel, receivedAt } = req.body;
  if (!reply) return res.status(400).json({ error: 'Se requiere reply' });
  const c = store.updateContenido(req.params.id, { reply, status: 'replied' });
  if (!c) return res.status(404).json({ error: 'Pieza de contenido no encontrada' });
  // Also create a respuesta record
  store.addRespuesta({
    clientId:    c.clientId,
    contenidoId: c.id,
    channel:     channel || 'manual',
    receivedAt:  receivedAt || new Date().toISOString(),
    content:     reply,
    autoCapture: false,
  });
  res.json(c);
});

router.delete('/:id', (req, res) => {
  if (!store.deleteContenido(req.params.id)) return res.status(404).json({ error: 'Pieza de contenido no encontrada' });
  res.json({ message: 'Pieza eliminada' });
});

module.exports = router;

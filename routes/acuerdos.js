const express = require('express');
const router  = express.Router();
const store   = require('../data/store');

// GET /api/acuerdos  (opcional ?clientId=)
router.get('/', (req, res) => {
  res.json(store.getAcuerdos(req.query.clientId || null));
});

// GET /api/acuerdos/:id
router.get('/:id', (req, res) => {
  const a = store.getAcuerdo(req.params.id);
  if (!a) return res.status(404).json({ error: 'Acuerdo no encontrado' });
  res.json(a);
});

// POST /api/acuerdos
router.post('/', (req, res) => {
  const { clientId, platform } = req.body;
  if (!clientId || !platform) return res.status(400).json({ error: 'Se requieren clientId y platform' });
  if (!store.getClient(clientId)) return res.status(404).json({ error: 'Cliente no encontrado' });

  const {
    daily = 0, weekly = 0, monthly = 0,
    contentTypes = '', startDate = null, endDate = null, notes = '',
  } = req.body;

  res.status(201).json(store.createAcuerdo({
    clientId, platform, daily, weekly, monthly,
    contentTypes, startDate, endDate, notes,
  }));
});

// PUT /api/acuerdos/:id
router.put('/:id', (req, res) => {
  const a = store.updateAcuerdo(req.params.id, req.body);
  if (!a) return res.status(404).json({ error: 'Acuerdo no encontrado' });
  res.json(a);
});

// DELETE /api/acuerdos/:id
router.delete('/:id', (req, res) => {
  const deleted = store.deleteAcuerdo(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Acuerdo no encontrado' });
  res.json({ message: 'Acuerdo eliminado' });
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const store   = require('../data/store');

const SOCIAL_FIELDS = [
  'waPhone','waAccount','waNotes',
  'igAccount','igLink','igPhone','igNotes',
  'fbAccount','fbLink','fbPhone','fbNotes',
  'ttAccount','ttLink','ttPhone','ttNotes',
];

function pickClientFields(body) {
  const allowed = ['name','email','notes', ...SOCIAL_FIELDS];
  return Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
}

// GET /api/clients
router.get('/', (req, res) => res.json(store.getClients()));

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const c = store.getClient(req.params.id);
  if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(c);
});

// POST /api/clients
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Se requieren name y email' });
  const data = pickClientFields(req.body);
  res.status(201).json(store.createClient(data));
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const data = pickClientFields(req.body);
  const c = store.updateClient(req.params.id, data);
  if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(c);
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const deleted = store.deleteClient(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json({ message: 'Cliente eliminado' });
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const store   = require('../data/store');

// GET /api/tasks  (opcional ?clientId=)
router.get('/', (req, res) => {
  let tasks = store.getTasks();
  // Auto-marca vencidas
  const now = new Date();
  tasks = tasks.map(t => {
    if (t.status === 'pending' && new Date(t.due) < now) {
      return store.updateTask(t.id, { status: 'overdue' });
    }
    return t;
  });
  if (req.query.clientId) tasks = tasks.filter(t => t.clientId === req.query.clientId);
  res.json(tasks);
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const t = store.getTask(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(t);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { clientId, type, due } = req.body;
  if (!clientId || !type || !due) return res.status(400).json({ error: 'Se requieren clientId, type y due' });
  if (!store.getClient(clientId)) return res.status(404).json({ error: 'Cliente no encontrado' });
  const { contentType = '', contentName = '', platform = '' } = req.body;
  res.status(201).json(store.createTask({ clientId, type, due, contentType, contentName, platform }));
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const t = store.updateTask(req.params.id, req.body);
  if (!t) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(t);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const deleted = store.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json({ message: 'Tarea eliminada' });
});

module.exports = router;

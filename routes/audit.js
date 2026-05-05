const express = require('express');
const router  = express.Router();
const store   = require('../store');

// GET /api/audit  (?clientId= &entity= &action= &from= &to= &limit=)
router.get('/', (req, res) => {
  const { clientId, entity, action, from, to, limit = 200 } = req.query;
  const log = store.getAuditLog({ clientId, entity, action, from, to });
  res.json(log.slice(0, Number(limit)));
});

// GET /api/audit/entities — lista de entidades disponibles para filtrar
router.get('/entities', (req, res) => {
  res.json(['client','task','message','scheduled','acuerdo','contenido','propuesta','respuesta','material','system']);
});

// GET /api/audit/actions — lista de acciones disponibles para filtrar
router.get('/actions', (req, res) => {
  res.json(['created','updated','deleted','sent','scheduled','cancelled','status_change','reply_received','uploaded','startup']);
});

module.exports = router;

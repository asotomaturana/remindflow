const express = require('express');
const router  = express.Router();
const store   = require('../store');

const VALID_STATUSES = ['draft','sent','in_review','approved','rejected','cancelled'];

// GET /api/propuestas  (?clientId=)
router.get('/', (req, res) => {
  res.json(store.getPropuestas(req.query.clientId || null));
});

// GET /api/propuestas/:id
router.get('/:id', (req, res) => {
  const p = store.getPropuesta(req.params.id);
  if (!p) return res.status(404).json({ error: 'Propuesta no encontrada' });
  res.json(p);
});

// POST /api/propuestas
router.post('/', (req, res) => {
  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: 'Se requiere clientId' });
  if (!store.getClient(clientId)) return res.status(404).json({ error: 'Cliente no encontrado' });

  const {
    plan = '',
    monthlyValue = 0,
    currency = 'CLP',
    services = [],
    platforms = [],
    contentQtyDaily = 0,
    contentQtyWeekly = 0,
    contentQtyMonthly = 0,
    contentTypes = [],
    sentDate = null,
    reviewDate = null,
    approvalDate = null,
    startDate = null,
    contractMonths = 3,
    additionalConditions = '',
    comments = '',
    internalNotes = '',
    preparedBy = '',
  } = req.body;

  res.status(201).json(store.createPropuesta({
    clientId, plan, monthlyValue, currency, services, platforms,
    contentQtyDaily, contentQtyWeekly, contentQtyMonthly, contentTypes,
    sentDate, reviewDate, approvalDate, startDate,
    contractMonths, additionalConditions, comments, internalNotes, preparedBy,
  }));
});

// POST /api/propuestas/import-excel — import from parsed Excel JSON
router.post('/import-excel', (req, res) => {
  const rows = req.body.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de filas (rows)' });
  }

  const created = [];
  const errors  = [];

  for (const row of rows) {
    const clientId = row.clientId || row.cliente_id;
    if (!clientId || !store.getClient(clientId)) {
      errors.push({ row, error: 'clientId no válido o no encontrado' });
      continue;
    }
    try {
      const p = store.createPropuesta({
        clientId,
        plan:                 row.plan                 || '',
        monthlyValue:         Number(row.valor_mensual || row.monthlyValue || 0),
        currency:             row.moneda               || row.currency || 'CLP',
        contentQtyDaily:      Number(row.cantidad_diaria   || row.contentQtyDaily   || 0),
        contentQtyWeekly:     Number(row.cantidad_semanal  || row.contentQtyWeekly  || 0),
        contentQtyMonthly:    Number(row.cantidad_mensual  || row.contentQtyMonthly || 0),
        sentDate:             row.fecha_envio          || row.sentDate     || null,
        reviewDate:           row.fecha_revision       || row.reviewDate   || null,
        approvalDate:         row.fecha_aprobacion     || row.approvalDate || null,
        startDate:            row.fecha_inicio         || row.startDate    || null,
        contractMonths:       Number(row.meses_contrato || row.contractMonths || 3),
        additionalConditions: row.condiciones          || row.additionalConditions || '',
        comments:             row.comentarios          || row.comments     || '',
        internalNotes:        row.notas_internas       || row.internalNotes || '',
        platforms:            row.plataformas          ? String(row.plataformas).split(',').map(s => s.trim()) : [],
        contentTypes:         row.tipos_contenido      ? String(row.tipos_contenido).split(',').map(s => s.trim()) : [],
        importedFromExcel:    true,
      });
      created.push(p);
    } catch (err) {
      errors.push({ row, error: err.message });
    }
  }

  res.status(201).json({ created: created.length, errors, propuestas: created });
});

// PUT /api/propuestas/:id
router.put('/:id', (req, res) => {
  const p = store.updatePropuesta(req.params.id, req.body);
  if (!p) return res.status(404).json({ error: 'Propuesta no encontrada' });
  res.json(p);
});

// PATCH /api/propuestas/:id/status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
  }
  const updates = { status };
  if (status === 'sent'      && !req.body.keepDate) updates.sentDate     = new Date().toISOString().split('T')[0];
  if (status === 'approved'  && !req.body.keepDate) updates.approvalDate = new Date().toISOString().split('T')[0];
  const p = store.updatePropuesta(req.params.id, updates);
  if (!p) return res.status(404).json({ error: 'Propuesta no encontrada' });
  res.json(p);
});

// DELETE /api/propuestas/:id
router.delete('/:id', (req, res) => {
  if (!store.deletePropuesta(req.params.id)) return res.status(404).json({ error: 'Propuesta no encontrada' });
  res.json({ message: 'Propuesta eliminada' });
});

module.exports = router;

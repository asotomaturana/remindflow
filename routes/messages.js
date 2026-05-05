const express = require('express');
const router  = express.Router();
const { sendEmail }    = require('../services/gmail');
const { sendWhatsApp } = require('../services/whatsapp');
const store = require('../store');

// ── Envío inmediato Gmail ────────────────────────────────────
router.post('/gmail', async (req, res) => {
  const { clientId, to, subject, body, contentType, contentName, platform, contenidoId } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'Se requieren subject y body' });

  let recipient = to, clientName = 'Desconocido';
  if (clientId) {
    const client = store.getClient(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    recipient  = client.email;
    clientName = client.name;
  }
  if (!recipient) return res.status(400).json({ error: 'Se requiere clientId o to' });

  try {
    const result = await sendEmail({ to: recipient, subject, body });
    const h = store.addHistory({
      channel: 'gmail', clientId: clientId || null, clientName,
      to: recipient, subject, preview: body.substring(0, 80),
      contentType: contentType || null, contentName: contentName || null,
      platform: platform || null, contenidoId: contenidoId || null,
      messageId: result.messageId, status: 'sent',
    });
    // Auto-update pieza status to 'reminded'
    if (contenidoId) {
      const p = store.getContenidoItem(contenidoId);
      if (p && p.status === 'agreed') store.updateContenido(contenidoId, { status: 'reminded' });
    }
    res.json({ success: true, messageId: result.messageId, historyId: h.id });
  } catch (err) {
    console.error('[Gmail]', err.message);
    res.status(500).json({ error: 'Error al enviar email', detail: err.message });
  }
});

// ── Envío inmediato WhatsApp ─────────────────────────────────
router.post('/whatsapp', async (req, res) => {
  const { clientId, to, body, contentType, contentName, platform, contenidoId } = req.body;
  if (!body) return res.status(400).json({ error: 'Se requiere body' });

  let recipient = to, clientName = 'Desconocido';
  if (clientId) {
    const client = store.getClient(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    recipient  = client.waPhone || client.phone;
    clientName = client.name;
  }
  if (!recipient) return res.status(400).json({ error: 'Se requiere clientId o to' });

  try {
    const result = await sendWhatsApp({ to: recipient, body });
    const h = store.addHistory({
      channel: 'whatsapp', clientId: clientId || null, clientName,
      to: recipient, preview: body.substring(0, 80),
      contentType: contentType || null, contentName: contentName || null,
      platform: platform || null, contenidoId: contenidoId || null,
      sid: result.sid, status: result.status,
    });
    if (contenidoId) {
      const p = store.getContenidoItem(contenidoId);
      if (p && p.status === 'agreed') store.updateContenido(contenidoId, { status: 'reminded' });
    }
    res.json({ success: true, sid: result.sid, status: result.status, historyId: h.id });
  } catch (err) {
    console.error('[WhatsApp]', err.message);
    res.status(500).json({ error: 'Error al enviar WhatsApp', detail: err.message });
  }
});

// ── Historial ────────────────────────────────────────────────
router.get('/history', (req, res) => {
  let h = store.getHistory().slice().reverse();
  if (req.query.clientId) h = h.filter(m => m.clientId === req.query.clientId);
  if (req.query.channel)  h = h.filter(m => m.channel  === req.query.channel);
  if (req.query.contenidoId) h = h.filter(m => m.contenidoId === req.query.contenidoId);
  res.json(h);
});

// PUT /api/messages/history/:id/reply
router.put('/history/:id/reply', (req, res) => {
  const { repliedAt, replyContent, replyChannel } = req.body;
  if (!repliedAt) return res.status(400).json({ error: 'Se requiere repliedAt' });
  const msg = store.updateHistory(req.params.id, { replied: true, repliedAt, replyContent: replyContent || '', replyChannel: replyChannel || 'manual' });
  if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });
  // Create respuesta record
  store.addRespuesta({
    clientId:    msg.clientId,
    messageId:   msg.id,
    contenidoId: msg.contenidoId || null,
    channel:     replyChannel || 'manual',
    receivedAt:  new Date(repliedAt).toISOString ? new Date().toISOString() : new Date().toISOString(),
    content:     replyContent || '',
    autoCapture: false,
  });
  res.json(msg);
});

// ── Programados ──────────────────────────────────────────────
router.post('/schedule', (req, res) => {
  const { channel, clientId, to, subject, body, scheduledAt, recurrence, contentType, contentName, platform, contenidoId } = req.body;
  if (!channel || !body || !scheduledAt) return res.status(400).json({ error: 'Se requieren channel, body y scheduledAt' });
  if (!['gmail','whatsapp'].includes(channel)) return res.status(400).json({ error: 'channel debe ser gmail o whatsapp' });
  if (new Date(scheduledAt) <= new Date()) return res.status(400).json({ error: 'scheduledAt debe ser en el futuro' });

  let recipient = to, clientName = 'Desconocido';
  if (clientId) {
    const client = store.getClient(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    recipient  = channel === 'gmail' ? client.email : (client.waPhone || client.phone);
    clientName = client.name;
  }
  if (!recipient) return res.status(400).json({ error: 'Se requiere clientId o to' });

  const msg = store.addScheduledMessage({
    channel, clientId: clientId || null, clientName,
    to: recipient, subject: subject || null, body, scheduledAt,
    recurrence: recurrence || null,
    contentType: contentType || null, contentName: contentName || null,
    platform: platform || null, contenidoId: contenidoId || null,
  });
  res.status(201).json({ success: true, scheduledMessage: msg });
});

router.get('/schedule', (req, res) => {
  let s = store.getScheduledMessages();
  if (req.query.clientId) s = s.filter(m => m.clientId === req.query.clientId);
  res.json(s);
});

router.delete('/schedule/:id', (req, res) => {
  const msg = store.getScheduledMessages().find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Mensaje programado no encontrado' });
  if (msg.status !== 'scheduled') return res.status(400).json({ error: 'Solo se pueden cancelar mensajes en estado scheduled' });
  store.updateScheduledMessage(req.params.id, { status: 'cancelled' });
  res.json({ message: 'Mensaje programado cancelado' });
});

module.exports = router;

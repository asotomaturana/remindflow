const express = require('express');
const router  = express.Router();
const store   = require('../store');

// GET /api/respuestas  (?clientId= &contenidoId= &messageId=)
router.get('/', (req, res) => {
  const { clientId, contenidoId, messageId } = req.query;
  res.json(store.getRespuestas({ clientId, contenidoId, messageId }));
});

// POST /api/respuestas — registrar respuesta (manual o automática)
router.post('/', (req, res) => {
  const { clientId, content } = req.body;
  if (!clientId || !content) {
    return res.status(400).json({ error: 'Se requieren clientId y content' });
  }
  if (!store.getClient(clientId)) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  const r = store.addRespuesta({
    clientId,
    messageId:   req.body.messageId   || null,
    contenidoId: req.body.contenidoId || null,
    acuerdoId:   req.body.acuerdoId   || null,
    channel:     req.body.channel     || 'manual',
    receivedAt:  req.body.receivedAt  || new Date().toISOString(),
    content,
    senderPhone: req.body.senderPhone || null,
    senderEmail: req.body.senderEmail || null,
    autoCapture: req.body.autoCapture || false,
    raw:         req.body.raw         || null,
  });

  // If linked to a message in history, mark it as replied
  if (req.body.messageId) {
    const receivedAt = new Date(r.receivedAt).toLocaleString('es-CL', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    store.updateHistory(req.body.messageId, {
      replied: true,
      repliedAt: receivedAt,
      replyContent: content,
      replyChannel: req.body.channel || 'manual',
    });
  }

  // If linked to a contenido piece, update its status to 'replied'
  if (req.body.contenidoId) {
    const pieza = store.getContenidoItem(req.body.contenidoId);
    if (pieza && pieza.status === 'reminded') {
      store.updateContenido(req.body.contenidoId, { status: 'replied', reply: content });
    }
  }

  res.status(201).json(r);
});

// POST /api/respuestas/webhook-twilio — captura automática desde Twilio webhook
// Configura en console.twilio.com → Messaging → Sandbox → When a message comes in
router.post('/webhook-twilio', express.urlencoded({ extended: false }), (req, res) => {
  const from    = req.body.From || '';
  const body    = req.body.Body || '';
  const msgSid  = req.body.MessageSid || '';

  if (!from || !body) {
    return res.status(200).send('<Response></Response>');
  }

  // Normalize phone: remove whatsapp: prefix
  const phone = from.replace('whatsapp:', '');

  // Find client by phone
  const client = store.getClients().find(c =>
    c.waPhone && c.waPhone.replace(/\s/g,'') === phone.replace(/\s/g,'')
  );

  if (client) {
    // Find most recent unanswered message to this client
    const lastMsg = store.getHistory()
      .filter(h => h.clientId === client.id && h.channel === 'whatsapp' && !h.replied)
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    store.addRespuesta({
      clientId:    client.id,
      messageId:   lastMsg?.id || null,
      contenidoId: lastMsg?.contenidoId || null,
      channel:     'whatsapp',
      receivedAt:  new Date().toISOString(),
      content:     body,
      senderPhone: phone,
      autoCapture: true,
      raw:         JSON.stringify(req.body),
    });

    if (lastMsg) {
      store.updateHistory(lastMsg.id, {
        replied:      true,
        repliedAt:    new Date().toLocaleString('es-CL', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }),
        replyContent: body,
        replyChannel: 'whatsapp',
      });
    }
  }

  // Always respond with empty TwiML so Twilio doesn't retry
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
});

module.exports = router;

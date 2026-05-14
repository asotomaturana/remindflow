const express = require('express');
const router  = express.Router();
const store   = require('../store');
const twilio  = require('twilio');

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

  if (req.body.messageId) {
    const receivedAt = new Date(r.receivedAt).toLocaleString('es-CL', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    store.updateHistory(req.body.messageId, {
      replied:      true,
      repliedAt:    receivedAt,
      replyContent: content,
      replyChannel: req.body.channel || 'manual',
    });
  }

  if (req.body.contenidoId) {
    const pieza = store.getContenidoItem(req.body.contenidoId);
    if (pieza && pieza.status === 'reminded') {
      store.updateContenido(req.body.contenidoId, { status: 'replied', reply: content });
    }
  }

  res.status(201).json(r);
});

// ── Middleware de validación de firma Twilio ──────────────────
function validateTwilioSignature(req, res, next) {
  const twilioSignature = req.headers['x-twilio-signature'];
  const authToken       = process.env.TWILIO_AUTH_TOKEN;

  // Si no hay firma o no hay authToken configurado — rechazar
  if (!twilioSignature || !authToken) {
    console.warn('[Webhook] Petición rechazada — falta firma o authToken');
    return res.status(403).send('Forbidden');
  }

  // URL pública del webhook — Railway usa proxy inverso
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL ||
    `https://${req.headers.host}${req.originalUrl}`;

  const isValid = twilio.validateRequest(
    authToken,
    twilioSignature,
    webhookUrl,
    req.body
  );

  if (!isValid) {
    console.warn('[Webhook] Firma Twilio inválida — petición rechazada desde:', req.ip);
    return res.status(403).send('Forbidden');
  }

  next();
}

// POST /webhooks/twilio/webhook-twilio — con validación de firma
router.post(
  '/webhook-twilio',
  express.urlencoded({ extended: false }),
  validateTwilioSignature,
  (req, res) => {
    const from   = req.body.From || '';
    const body   = req.body.Body || '';
    const msgSid = req.body.MessageSid || '';

    if (!from || !body) {
      return res.status(200).send('<Response></Response>');
    }

    const phone  = from.replace('whatsapp:', '');
    const client = store.getClients().find(c =>
      c.waPhone && c.waPhone.replace(/\s/g,'') === phone.replace(/\s/g,'')
    );

    if (client) {
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

    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
);

module.exports = router;
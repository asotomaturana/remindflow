const cron = require('node-cron');
const { sendEmail } = require('./gmail');
const { sendWhatsApp } = require('./whatsapp');
const store = require('../store');

// Revisa cada minuto si hay mensajes programados listos para enviar
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const pending = store.getScheduledMessages().filter(m => {
    return m.status === 'scheduled' && new Date(m.scheduledAt) <= now;
  });

  for (const msg of pending) {
    try {
      if (msg.channel === 'gmail') {
        await sendEmail({
          to: msg.to,
          subject: msg.subject,
          body: msg.body,
        });
      } else if (msg.channel === 'whatsapp') {
        await sendWhatsApp({
          to: msg.to,
          body: msg.body,
        });
      }

      store.updateScheduledMessage(msg.id, { status: 'sent', sentAt: new Date().toISOString() });
      console.log(`[Scheduler] ✓ Mensaje ${msg.id} enviado por ${msg.channel} a ${msg.to}`);
    } catch (err) {
      store.updateScheduledMessage(msg.id, { status: 'failed', error: err.message });
      console.error(`[Scheduler] ✗ Error enviando ${msg.id}:`, err.message);
    }
  }
});

console.log('[Scheduler] Motor de envíos programados iniciado (revisa cada minuto)');

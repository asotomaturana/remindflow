const cron = require('node-cron');
const { sendEmail }    = require('./gmail');
const { sendWhatsApp } = require('./whatsapp');
const store = require('../store');

const MAX_RETRIES_FAST  = 3;
const MAX_RETRIES_SLOW  = 3;
const MAX_RETRIES_TOTAL = MAX_RETRIES_FAST + MAX_RETRIES_SLOW; // 6 intentos máximo
const DELAY_FAST_MS     = 5  * 60 * 1000; // 5 minutos
const DELAY_SLOW_MS     = 20 * 60 * 1000; // 20 minutos

cron.schedule('* * * * *', async () => {
  const now = new Date();

  // Mensajes nuevos pendientes
  const pending = store.getScheduledMessages().filter(m =>
    m.status === 'scheduled' && new Date(m.scheduledAt) <= now
  );

  // Mensajes fallidos con reintentos pendientes
  const retryable = store.getScheduledMessages().filter(m =>
    m.status === 'failed' &&
    (m.retryCount || 0) < MAX_RETRIES_TOTAL &&
    m.nextRetryAt &&
    new Date(m.nextRetryAt) <= now
  );

  for (const msg of [...pending, ...retryable]) {
    try {
      if (msg.channel === 'gmail') {
        await sendEmail({ to: msg.to, subject: msg.subject, body: msg.body });
      } else if (msg.channel === 'whatsapp') {
        await sendWhatsApp({ to: msg.to, body: msg.body });
      }

      store.updateScheduledMessage(msg.id, {
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      console.log(`[Scheduler] ✓ Mensaje ${msg.id} enviado por ${msg.channel} a ${msg.to}`);

    } catch (err) {
      const retryCount = (msg.retryCount || 0) + 1;
      const isFinal    = retryCount >= MAX_RETRIES_TOTAL;

      // Determinar delay según fase
      const delay       = retryCount <= MAX_RETRIES_FAST ? DELAY_FAST_MS : DELAY_SLOW_MS;
      const nextRetryAt = isFinal ? null : new Date(Date.now() + delay).toISOString();

      store.updateScheduledMessage(msg.id, {
        status:      isFinal ? 'failed_permanent' : 'failed',
        lastError:   err.message,
        retryCount,
        nextRetryAt,
      });

      console.error(
        `[Scheduler] ✗ Mensaje ${msg.id} — intento ${retryCount}/${MAX_RETRIES_TOTAL} — ${err.message}`
      );

      if (isFinal) {
        console.error(`[Scheduler] ✗ Mensaje ${msg.id} agotó todos los reintentos — failed_permanent`);
      }
    }
  }
});

console.log('[Scheduler] Motor de envíos programados iniciado (revisa cada minuto) — backoff 3x5min + 3x20min');
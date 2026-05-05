/**
 * RemindFlow — Servicio WhatsApp via Twilio v3.3.0
 *
 * Sandbox (desarrollo/un cliente):
 *   El destinatario debe enviar "join <palabra>" al +14155238886
 *   una sola vez. Luego puede recibir mensajes sin restricciones.
 *
 * Producción (sin restricciones):
 *   Solicitar WhatsApp Business API en console.twilio.com
 *   (~1-2 semanas de aprobación por Meta).
 */

const twilio = require('twilio');

let client = null;

function getClient() {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return client;
}

/**
 * Envía un mensaje de WhatsApp vía Twilio.
 * @param {string} to   - Número con código país, ej: +56912345678
 * @param {string} body - Texto del mensaje
 */
async function sendWhatsApp({ to, body }) {
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const message = await getClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   toFormatted,
    body,
  });

  return { sid: message.sid, status: message.status };
}

async function verifyCredentials() {
  try {
    await getClient().api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    return true;
  } catch {
    return false;
  }
}

module.exports = { sendWhatsApp, verifyCredentials };

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Envía un email por Gmail.
 * @param {string} to       - Email destinatario
 * @param {string} subject  - Asunto
 * @param {string} body     - Cuerpo en texto plano
 * @param {string} [html]   - Cuerpo en HTML (opcional)
 */
async function sendEmail({ to, subject, body, html }) {
  const from = `"${process.env.GMAIL_FROM_NAME || 'RemindFlow'}" <${process.env.GMAIL_USER}>`;

  const info = await getTransporter().sendMail({
    from,
    to,
    subject,
    text: body,
    html: html || buildHtmlEmail(subject, body),
  });

  return { messageId: info.messageId, accepted: info.accepted };
}

/** Genera un HTML bonito y simple para el email */
function buildHtmlEmail(subject, body) {
  const lines = body.replace(/\n/g, '<br>');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 12px; max-width: 560px; margin: 0 auto; padding: 36px; }
    .brand { font-size: 13px; font-weight: 700; color: #7c6ff7; letter-spacing: 0.08em; margin-bottom: 24px; }
    h2 { font-size: 20px; color: #111; margin: 0 0 16px; }
    .body { font-size: 15px; color: #444; line-height: 1.7; }
    .footer { font-size: 12px; color: #aaa; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">REMINDFLOW</div>
    <h2>${subject}</h2>
    <div class="body">${lines}</div>
    <div class="footer">Este mensaje fue enviado automáticamente por RemindFlow.</div>
  </div>
</body>
</html>`;
}

async function verifyConnection() {
  try {
    await getTransporter().verify();
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { sendEmail, verifyConnection };

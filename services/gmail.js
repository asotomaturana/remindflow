const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, subject, body, html }) {
  const msg = {
    to,
    from: {
      email: process.env.GMAIL_USER,
      name:  process.env.GMAIL_FROM_NAME || 'RemindFlow',
    },
    subject,
    text: body,
    html: html || buildHtmlEmail(subject, body),
  };

  const [response] = await sgMail.send(msg);
  return {
    messageId: response.headers['x-message-id'] || 'sendgrid',
    accepted:  [to],
  };
}

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
    // SendGrid no tiene un método verify() como Nodemailer
    // Verificamos que la API Key esté configurada
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY no configurada');
    }
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { sendEmail, verifyConnection };
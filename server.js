require('dotenv').config();


const { logStartup } = require('./store');

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const { requireAuth }   = require('./middleware/auth');
const { router: authRouter } = require('./routes/auth');

const clientsRouter    = require('./routes/clients');
const tasksRouter      = require('./routes/tasks');
const messagesRouter   = require('./routes/messages');
const acuerdosRouter   = require('./routes/acuerdos');
const contenidoRouter  = require('./routes/contenido');
const propuestasRouter = require('./routes/propuestas');
const auditRouter      = require('./routes/audit');
const respuestasRouter = require('./routes/respuestas');
const materialesRouter    = require('./routes/materiales');
const credencialesRouter  = require('./routes/credenciales');
const estadisticasRouter    = require('./routes/estadisticas');
const publicacionesRouter   = require('./routes/publicaciones');

require('./services/scheduler');

const app  = express();

// Railway (y cualquier plataforma con proxy inverso) requiere esta config
// para que express-rate-limit pueda identificar IPs correctamente
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Serve uploaded files statically (for admin access)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// helmet activa protecciones HTTP por defecto.
// CSP deshabilitado porque el frontend usa inline JS (onclick, scripts en index.html).
// TODO (v-future): migrar onclick a event listeners y reactivar CSP — ver todo.md
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'"],
      scriptSrcAttr:  ["'unsafe-inline'"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc:         ["'self'", "data:", "https:"],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com", "https:", "data:"],
      objectSrc:      ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60*1000, max: 120, message: { error: 'Demasiadas peticiones.' } }));

// ── Serve frontend ────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.3.0', timestamp: new Date().toISOString() }));

// ── Auth (sin protección) ────────────────────────────────────
app.use('/auth', authRouter);

// ── Twilio webhook (sin auth — Twilio no envía tokens) ───────
app.use('/webhooks/twilio', require('./routes/respuestas'));

// ── Rutas protegidas ─────────────────────────────────────────
app.use('/api', requireAuth);
app.use('/api/clients',    clientsRouter);
app.use('/api/tasks',      tasksRouter);
app.use('/api/messages',   messagesRouter);
app.use('/api/acuerdos',   acuerdosRouter);
app.use('/api/contenido',  contenidoRouter);
app.use('/api/propuestas', propuestasRouter);
app.use('/api/audit',      auditRouter);
app.use('/api/respuestas', respuestasRouter);
app.use('/api/materiales',    materialesRouter);
app.use('/api/credenciales',  credencialesRouter);
app.use('/api/estadisticas',  estadisticasRouter);
app.use('/api/publicaciones', publicacionesRouter);

// ── Status + Summary ─────────────────────────────────────────
app.get('/api/status', async (req, res) => {
  const { verifyConnection }  = require('./services/gmail');
  const { verifyCredentials } = require('./services/whatsapp');
  const [gmailOk, twilioOk]   = await Promise.all([verifyConnection(), verifyCredentials()]);
  res.json({
    version: '4.3.0',
    gmail:  gmailOk  ? 'conectado' : 'error — revisa GMAIL_USER y GMAIL_APP_PASSWORD',
    twilio: twilioOk ? 'conectado' : 'error — revisa TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/summary', (req, res) => {
  const store = require('./store');
  const history = store.getHistory();
  res.json({
    totalClients:      store.getClients().length,
    totalMessages:     history.length,
    repliedMessages:   history.filter(h => h.replied).length,
    activeAcuerdos:    store.getAcuerdos().length,
    totalContenido:    store.getContenido().length,
    pendingContenido:  store.getContenido().filter(c => !['delivered','published'].includes(c.status)).length,
    scheduledPending:  store.getScheduledMessages().filter(m => m.status === 'scheduled').length,
    totalPropuestas:   store.getPropuestas().length,
    propuestasPending: store.getPropuestas().filter(p => p.status === 'draft' || p.status === 'sent').length,
    totalRespuestas:   store.getRespuestas({}).length,
    totalMateriales:   store.getMateriales({}).length,
    auditEvents:         store.getAuditLog({}).length,
    totalPublicaciones:  store.getPublicaciones({}).length,
  });
});

app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` }));
app.use((err, req, res, _next) => { console.error('[Error]', err.message); res.status(500).json({ error: err.message || 'Error interno' }); });

app.listen(PORT, () => {
  logStartup();
  console.log(`
╔══════════════════════════════════════════════════════╗
║  RemindFlow Backend v4.3.0 — Puerto ${PORT}           ║
╠══════════════════════════════════════════════════════╣
║  POST /auth/login  · GET /auth/me  · POST /auth/logout ║
║  POST /webhooks/twilio/webhook-twilio                ║
║  GET  /api/audit                                     ║
║  GET|POST        /api/propuestas                     ║
║  POST            /api/propuestas/import-excel        ║
║  GET|POST        /api/respuestas                     ║
║  GET|POST        /api/materiales                     ║
║  POST            /api/materiales/upload              ║
║  GET             /api/materiales/tree                ║
║  GET|POST|PUT|DELETE /api/credenciales               ║  ← NEW v4.1
║  POST            /api/credenciales/:id/reveal        ║  ← NEW v4.1
║  GET|POST|PUT|DELETE /api/estadisticas               ║  ← NEW v4.1
║  GET             /api/estadisticas/resumen           ║  ← NEW v4.1
╚══════════════════════════════════════════════════════╝
  `);
});

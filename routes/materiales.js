const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const store   = require('../store');

// ── Storage config ───────────────────────────────────────────
// Folder structure: uploads/<clientId>/<year>/<month>/<filename>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const clientId = req.body.clientId || req.query.clientId || 'unknown';
    const now      = new Date();
    const year     = now.getFullYear().toString();
    const month    = String(now.getMonth() + 1).padStart(2, '0');
    const dir      = path.join(__dirname, '..', 'uploads', clientId, year, month);
    fs.mkdirSync(dir, { recursive: true });
    req._uploadDir = dir;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ts    = Date.now();
    const clean = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${clean}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|gif|mp4|mov|avi|mkv|webm|pdf|heic|heif|webp/i;
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error(`Tipo de archivo no permitido: ${ext}`));
  },
});

// GET /api/materiales  (?clientId= &contenidoId=)
router.get('/', (req, res) => {
  res.json(store.getMateriales(req.query));
});

// GET /api/materiales/tree — folder tree for admin view
router.get('/tree', (req, res) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) return res.json({ tree: [] });

  function buildTree(dir, depth = 0) {
    if (depth > 4) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).map(entry => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(uploadsDir, fullPath);
      if (entry.isDirectory()) {
        return { type: 'dir', name: entry.name, path: relativePath, children: buildTree(fullPath, depth + 1) };
      }
      const stat = fs.statSync(fullPath);
      return { type: 'file', name: entry.name, path: relativePath, size: stat.size, mtime: stat.mtime };
    });
  }

  const clients = store.getClients().reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {});
  res.json({ tree: buildTree(uploadsDir), clients });
});

// POST /api/materiales/upload — single or multiple file upload
router.post('/upload', upload.array('files', 20), async (req, res) => {
  const { clientId, contenidoId, acuerdoId, notes } = req.body;
  if (!clientId) return res.status(400).json({ error: 'Se requiere clientId' });
  if (!store.getClient(clientId)) return res.status(404).json({ error: 'Cliente no encontrado' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No se subieron archivos' });

  const saved = req.files.map(file => store.addMaterial({
    clientId, contenidoId: contenidoId || null, acuerdoId: acuerdoId || null,
    filename:     file.filename,
    originalName: file.originalname,
    mimetype:     file.mimetype,
    size:         file.size,
    path:         file.path,
    notes:        notes || '',
    uploadedBy:   'admin',
  }));

  // Auto-update contenido status to 'replied' if linked
  if (contenidoId) {
    const pieza = store.getContenidoItem(contenidoId);
    if (pieza && ['agreed','reminded'].includes(pieza.status)) {
      store.updateContenido(contenidoId, { status: 'inprod' });
    }
  }

  res.status(201).json({ uploaded: saved.length, materiales: saved });
});

// DELETE /api/materiales/:id
router.delete('/:id', (req, res) => {
  const m = store.getMateriales({}).find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Material no encontrado' });
  // Remove file from disk
  try { if (fs.existsSync(m.path)) fs.unlinkSync(m.path); } catch {}
  store.deleteMaterial(req.params.id);
  res.json({ message: 'Material eliminado' });
});

// GET /api/materiales/file/:id — serve the actual file
router.get('/file/:id', (req, res) => {
  const m = store.getMateriales({}).find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Material no encontrado' });
  if (!fs.existsSync(m.path)) return res.status(404).json({ error: 'Archivo no encontrado en disco' });
  res.download(m.path, m.originalName);
});

module.exports = router;

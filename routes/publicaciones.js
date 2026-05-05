/**
 * RemindFlow — Ruta: Publicaciones v4.2.0
 *
 * Registro de contenido ya publicado en redes sociales.
 * Diferencia con otros módulos:
 *   - materiales:  archivos crudos enviados por el cliente (pre-producción)
 *   - contenido:   pipeline de producción (agreed → published)
 *   - publicaciones: log permanente de lo que ya salió al aire (post-publicación)
 *
 * Campos clave: contentType, platform, publishedAt, url, caption, tags
 * Preparado para Fase 3 (Meta Graph API): campo igMediaId y source='meta_api'
 *
 * Endpoints:
 *   GET    /api/publicaciones              — lista con filtros
 *   GET    /api/publicaciones/resumen      — conteo por plataforma y tipo
 *   GET    /api/publicaciones/:id          — detalle individual
 *   POST   /api/publicaciones              — registrar nueva publicación
 *   PUT    /api/publicaciones/:id          — actualizar
 *   DELETE /api/publicaciones/:id          — eliminar
 */

const express = require('express');
const router  = express.Router();
const store   = require('../data/store');

// ── GET /api/publicaciones ───────────────────────────────────
// Filtros: clientId, platform, contentType, from (ISO date), to (ISO date)
router.get('/', (req, res) => {
  const { clientId, platform, contentType, from, to } = req.query;
  const list = store.getPublicaciones({ clientId, platform, contentType, from, to });
  res.json(list);
});

// ── GET /api/publicaciones/resumen ───────────────────────────
// Conteo de publicaciones agrupadas por plataforma y tipo de contenido.
// Útil para dashboard y reportes rápidos.
// Query param opcional: clientId
router.get('/resumen', (req, res) => {
  const { clientId } = req.query;
  const list = store.getPublicaciones({ clientId });

  // Totales por plataforma
  const porPlataforma = {};
  // Totales por tipo de contenido
  const porTipo = {};
  // Totales por mes (YYYY-MM)
  const porMes = {};

  for (const p of list) {
    // Por plataforma
    porPlataforma[p.platform] = (porPlataforma[p.platform] || 0) + 1;
    // Por tipo
    porTipo[p.contentType] = (porTipo[p.contentType] || 0) + 1;
    // Por mes
    const mes = p.publishedAt.substring(0, 7); // 'YYYY-MM'
    porMes[mes] = (porMes[mes] || 0) + 1;
  }

  res.json({
    clientId:      clientId || null,
    total:         list.length,
    porPlataforma,
    porTipo,
    porMes,
    ultimaPublicacion: list[0] || null,
  });
});

// ── GET /api/publicaciones/:id ───────────────────────────────
router.get('/:id', (req, res) => {
  const p = store.getPublicacion(req.params.id);
  if (!p) return res.status(404).json({ error: 'Publicación no encontrada' });

  // Enriquecer con datos del cliente y pieza de contenido vinculada (si existe)
  const client  = store.getClient(p.clientId);
  const pieza   = p.contenidoId ? store.getContenidoItem(p.contenidoId) : null;

  res.json({ ...p, clientName: client?.name || null, contenido: pieza || null });
});

// ── POST /api/publicaciones ──────────────────────────────────
// Body requerido: clientId, contentType, platform, publishedAt
// Body opcional:  contenidoId, url, caption, notes, tags[], igMediaId, source
router.post('/', (req, res) => {
  const { clientId, contentType, platform, publishedAt } = req.body;

  if (!clientId)    return res.status(400).json({ error: 'clientId es requerido' });
  if (!contentType) return res.status(400).json({ error: 'contentType es requerido' });
  if (!platform)    return res.status(400).json({ error: 'platform es requerido' });
  if (!publishedAt) return res.status(400).json({ error: 'publishedAt es requerido (ISO datetime)' });

  if (!store.getClient(clientId)) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  // Si se pasa contenidoId, verificar que exista
  if (req.body.contenidoId && !store.getContenidoItem(req.body.contenidoId)) {
    return res.status(404).json({ error: 'Pieza de contenido no encontrada' });
  }

  try {
    const p = store.createPublicacion(req.body);

    // Side-effect: si viene contenidoId y la pieza no está en 'published', actualizarla
    if (req.body.contenidoId) {
      const pieza = store.getContenidoItem(req.body.contenidoId);
      if (pieza && pieza.status !== 'published') {
        store.updateContenido(req.body.contenidoId, { status: 'published' });
      }
    }

    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT /api/publicaciones/:id ───────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const p = store.updatePublicacion(req.params.id, req.body);
    if (!p) return res.status(404).json({ error: 'Publicación no encontrada' });
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/publicaciones/:id ────────────────────────────
router.delete('/:id', (req, res) => {
  const deleted = store.deletePublicacion(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Publicación no encontrada' });
  res.json({ ok: true, message: 'Publicación eliminada' });
});

module.exports = router;

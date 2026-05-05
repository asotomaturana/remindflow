/**
 * RemindFlow — Ruta: Estadísticas de Redes Sociales v4.1.0
 *
 * Dashboard manual: el admin ingresa las métricas periódicamente.
 * Métricas cubiertas (basadas en estándar Hootsuite/Sprout Social):
 *   - Seguidores totales + nuevos seguidores del período
 *   - Alcance (reach) e impresiones
 *   - Likes, comentarios, guardados, compartidos
 *   - Vistas (para Reels/videos)
 *   - Tasa de engagement (calculada automáticamente)
 *   - Publicaciones del período
 *
 * Estructura preparada para conectar Meta Graph API en el futuro:
 * cada registro tiene campo `source`: 'manual' | 'meta_api' | 'tiktok_api'
 */

const express = require('express');
const router  = express.Router();
const { addAudit, getClient } = require('../store');
const { randomUUID } = require('crypto');

let estadisticas = [];

function uid() { return randomUUID(); }
function now() { return new Date().toISOString(); }

/**
 * Calcula tasa de engagement estándar:
 * (likes + comentarios + guardados + compartidos) / seguidores * 100
 */
function calcEngagement(data) {
  const interactions = (data.likes || 0) + (data.comments || 0) + (data.saves || 0) + (data.shares || 0);
  if (!data.followers || data.followers === 0) return 0;
  return parseFloat(((interactions / data.followers) * 100).toFixed(2));
}

// ── GET /api/estadisticas ────────────────────────────────────
// Filtros: clientId, platform, from (fecha ISO), to (fecha ISO)
router.get('/', (req, res) => {
  const { clientId, platform, from, to } = req.query;
  let list = estadisticas;
  if (clientId) list = list.filter(e => e.clientId === clientId);
  if (platform) list = list.filter(e => e.platform === platform);
  if (from)     list = list.filter(e => e.periodStart >= from);
  if (to)       list = list.filter(e => e.periodEnd   <= to);
  // Ordenar más reciente primero
  list = list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// ── GET /api/estadisticas/resumen?clientId=xxx ───────────────
// Resumen consolidado del período más reciente por plataforma
router.get('/resumen', (req, res) => {
  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: 'clientId requerido' });
  const clientStats = estadisticas.filter(e => e.clientId === clientId);
  const platforms   = [...new Set(clientStats.map(e => e.platform))];
  const resumen     = platforms.map(platform => {
    const registros = clientStats
      .filter(e => e.platform === platform)
      .sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd));
    const latest = registros[0] || null;
    const prev   = registros[1] || null;
    const deltaFollowers = latest && prev ? (latest.followers - prev.followers) : null;
    return {
      platform,
      latest,
      totalRegistros: registros.length,
      deltaFollowers,
      trend: deltaFollowers === null ? null : (deltaFollowers >= 0 ? 'up' : 'down'),
    };
  });
  res.json({ clientId, resumen });
});

// ── POST /api/estadisticas ───────────────────────────────────
// Registrar métricas para un período
router.post('/', (req, res) => {
  const {
    clientId, platform, periodStart, periodEnd,
    followers, newFollowers, reach, impressions,
    likes, comments, saves, shares, views,
    posts, source, notes,
  } = req.body;

  if (!clientId || !platform || !periodStart || !periodEnd) {
    return res.status(400).json({ error: 'clientId, platform, periodStart y periodEnd son requeridos' });
  }

  const PLATFORMS_VALIDAS = ['instagram', 'facebook', 'tiktok', 'whatsapp', 'youtube', 'otro'];
  if (!PLATFORMS_VALIDAS.includes(platform)) {
    return res.status(400).json({ error: `platform debe ser uno de: ${PLATFORMS_VALIDAS.join(', ')}` });
  }

  const engagementRate = calcEngagement({ followers, likes, comments, saves, shares });

  const stat = {
    id:            uid(),
    clientId,
    platform,
    periodStart,   // ISO date: '2026-03-01'
    periodEnd,     // ISO date: '2026-03-31'
    // Audiencia
    followers:     followers     || 0,
    newFollowers:  newFollowers  || 0,
    // Alcance
    reach:         reach         || 0,
    impressions:   impressions   || 0,
    // Interacciones
    likes:         likes         || 0,
    comments:      comments      || 0,
    saves:         saves         || 0,
    shares:        shares        || 0,
    views:         views         || 0,   // Reels / videos
    // Contenido
    posts:         posts         || 0,
    // Calculados
    engagementRate,
    // Metadata
    source:        source        || 'manual',   // 'manual' | 'meta_api' | 'tiktok_api'
    notes:         notes         || '',
    createdAt:     now(),
    updatedAt:     now(),
  };

  estadisticas.push(stat);

  const client = getClient(clientId);
  addAudit({
    entity: 'estadistica', entityId: stat.id, clientId,
    action: 'created',
    detail: `Estadísticas ${platform} registradas para ${client?.name || clientId}: ${periodStart} → ${periodEnd} | ${followers} seguidores | ER: ${engagementRate}%`,
  });

  res.status(201).json(stat);
});

// ── PUT /api/estadisticas/:id ────────────────────────────────
// Corregir un registro ya ingresado
router.put('/:id', (req, res) => {
  const i = estadisticas.findIndex(e => e.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Registro no encontrado' });

  estadisticas[i] = { ...estadisticas[i], ...req.body, updatedAt: now() };
  // Recalcular engagement si se actualizaron métricas relevantes
  estadisticas[i].engagementRate = calcEngagement(estadisticas[i]);

  addAudit({ entity: 'estadistica', entityId: req.params.id, clientId: estadisticas[i].clientId, action: 'updated', detail: `Estadísticas ${estadisticas[i].platform} actualizadas` });
  res.json(estadisticas[i]);
});

// ── DELETE /api/estadisticas/:id ─────────────────────────────
router.delete('/:id', (req, res) => {
  const prev = estadisticas.length;
  estadisticas = estadisticas.filter(e => e.id !== req.params.id);
  if (estadisticas.length === prev) return res.status(404).json({ error: 'Registro no encontrado' });
  addAudit({ entity: 'estadistica', entityId: req.params.id, action: 'deleted', detail: 'Registro de estadísticas eliminado' });
  res.json({ ok: true });
});

module.exports = router;

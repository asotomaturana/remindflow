/**
 * RemindFlow — data/migrate.js v4.3.0
 *
 * Crea todas las tablas SQLite si no existen (idempotente).
 * Se ejecuta automáticamente al iniciar el servidor (llamado desde server.js).
 *
 * Diferencias vs schema.sql (PostgreSQL):
 *   - UUID → TEXT (SQLite no tiene tipo UUID nativo)
 *   - gen_random_uuid() → se genera en JS con crypto.randomUUID()
 *   - TIMESTAMPTZ → TEXT (ISO 8601)
 *   - TEXT[] → TEXT (JSON.stringify/parse en la capa store)
 *   - JSONB → TEXT (JSON.stringify/parse en la capa store)
 *   - CREATE EXTENSION → omitido
 *   - DECIMAL → REAL
 *
 * Para agregar columnas nuevas en el futuro: agregar un bloque
 * "ALTER TABLE ... ADD COLUMN IF NOT EXISTS ..." al final de runMigrations().
 */

const { getDb } = require('../services/db');

function runMigrations() {
  const db = getDb();

  // Ejecutar todas las creaciones en una transacción atómica
  db.transaction(() => {

    // ── clients ─────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        email       TEXT NOT NULL,
        notes       TEXT,
        wa_phone    TEXT,
        wa_account  TEXT,
        wa_notes    TEXT,
        ig_account  TEXT,
        ig_link     TEXT,
        ig_phone    TEXT,
        ig_notes    TEXT,
        fb_account  TEXT,
        fb_link     TEXT,
        fb_phone    TEXT,
        fb_notes    TEXT,
        tt_account  TEXT,
        tt_link     TEXT,
        tt_phone    TEXT,
        tt_notes    TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
    `);

    // ── tasks ────────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           TEXT PRIMARY KEY,
        client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        type         TEXT NOT NULL,
        content_type TEXT,
        content_name TEXT,
        platform     TEXT,
        due          TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','sent','overdue')),
        created_at   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
    `);

    // ── history ──────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id            TEXT PRIMARY KEY,
        channel       TEXT NOT NULL CHECK (channel IN ('gmail','whatsapp')),
        client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name   TEXT,
        to_address    TEXT NOT NULL,
        subject       TEXT,
        preview       TEXT,
        content_type  TEXT,
        content_name  TEXT,
        platform      TEXT,
        contenido_id  TEXT,
        message_id    TEXT,
        sid           TEXT,
        status        TEXT NOT NULL DEFAULT 'sent',
        replied       INTEGER NOT NULL DEFAULT 0,
        replied_at    TEXT,
        reply_content TEXT,
        reply_channel TEXT,
        created_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_history_client    ON history(client_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_history_contenido ON history(contenido_id);
    `);

    // ── scheduled ────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled (
        id            TEXT PRIMARY KEY,
        channel       TEXT NOT NULL CHECK (channel IN ('gmail','whatsapp')),
        client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name   TEXT,
        to_address    TEXT NOT NULL,
        subject       TEXT,
        body          TEXT NOT NULL,
        scheduled_at  TEXT NOT NULL,
        recurrence    TEXT,
        content_type  TEXT,
        content_name  TEXT,
        platform      TEXT,
        contenido_id  TEXT,
        status        TEXT NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled','sent','failed','cancelled')),
        sent_at       TEXT,
        created_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled(status, scheduled_at);
    `);

    // ── acuerdos ─────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS acuerdos (
        id            TEXT PRIMARY KEY,
        client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        platform      TEXT NOT NULL,
        daily         INTEGER NOT NULL DEFAULT 0,
        weekly        INTEGER NOT NULL DEFAULT 0,
        monthly       INTEGER NOT NULL DEFAULT 0,
        content_types TEXT,
        start_date    TEXT,
        end_date      TEXT,
        notes         TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_acuerdos_client ON acuerdos(client_id);
    `);

    // ── contenido ────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS contenido (
        id          TEXT PRIMARY KEY,
        client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        name        TEXT NOT NULL,
        type        TEXT NOT NULL,
        platform    TEXT,
        status      TEXT NOT NULL DEFAULT 'agreed'
                      CHECK (status IN ('agreed','reminded','replied','inprod','delivered','published','overdue')),
        due         TEXT,
        description TEXT,
        reply       TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_contenido_client ON contenido(client_id, status);
    `);

    // ── propuestas ───────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS propuestas (
        id                    TEXT PRIMARY KEY,
        client_id             TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        plan                  TEXT,
        monthly_value         REAL NOT NULL DEFAULT 0,
        currency              TEXT NOT NULL DEFAULT 'CLP',
        contract_months       INTEGER NOT NULL DEFAULT 3,
        content_qty_daily     INTEGER NOT NULL DEFAULT 0,
        content_qty_weekly    INTEGER NOT NULL DEFAULT 0,
        content_qty_monthly   INTEGER NOT NULL DEFAULT 0,
        platforms             TEXT,
        content_types         TEXT,
        status                TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','sent','in_review','approved','rejected','cancelled')),
        sent_date             TEXT,
        review_date           TEXT,
        approval_date         TEXT,
        start_date            TEXT,
        additional_conditions TEXT,
        comments              TEXT,
        internal_notes        TEXT,
        prepared_by           TEXT,
        imported_from_excel   INTEGER NOT NULL DEFAULT 0,
        created_at            TEXT NOT NULL,
        updated_at            TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_propuestas_client ON propuestas(client_id);
    `);

    // ── audit_log ────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id           TEXT PRIMARY KEY,
        timestamp    TEXT NOT NULL,
        entity       TEXT NOT NULL,
        entity_id    TEXT,
        client_id    TEXT REFERENCES clients(id) ON DELETE SET NULL,
        action       TEXT NOT NULL,
        detail       TEXT NOT NULL,
        channel      TEXT,
        content_type TEXT,
        content_name TEXT,
        user         TEXT NOT NULL DEFAULT 'system'
      );
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_client    ON audit_log(client_id, timestamp DESC);
    `);

    // ── respuestas_cliente ───────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS respuestas_cliente (
        id           TEXT PRIMARY KEY,
        client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        message_id   TEXT REFERENCES history(id) ON DELETE SET NULL,
        contenido_id TEXT REFERENCES contenido(id) ON DELETE SET NULL,
        acuerdo_id   TEXT REFERENCES acuerdos(id) ON DELETE SET NULL,
        channel      TEXT NOT NULL,
        received_at  TEXT NOT NULL,
        content      TEXT NOT NULL,
        sender_phone TEXT,
        sender_email TEXT,
        auto_capture INTEGER NOT NULL DEFAULT 0,
        raw          TEXT,
        created_at   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_respuestas_client    ON respuestas_cliente(client_id, received_at DESC);
      CREATE INDEX IF NOT EXISTS idx_respuestas_contenido ON respuestas_cliente(contenido_id);
    `);

    // ── materiales ───────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS materiales (
        id            TEXT PRIMARY KEY,
        client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        contenido_id  TEXT REFERENCES contenido(id) ON DELETE SET NULL,
        acuerdo_id    TEXT REFERENCES acuerdos(id) ON DELETE SET NULL,
        filename      TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mimetype      TEXT NOT NULL,
        size          INTEGER NOT NULL,
        path          TEXT NOT NULL,
        uploaded_at   TEXT NOT NULL,
        uploaded_by   TEXT NOT NULL DEFAULT 'admin',
        notes         TEXT,
        created_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_materiales_client    ON materiales(client_id);
      CREATE INDEX IF NOT EXISTS idx_materiales_contenido ON materiales(contenido_id);
    `);

    // ── publicaciones ────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS publicaciones (
        id            TEXT PRIMARY KEY,
        client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        contenido_id  TEXT REFERENCES contenido(id) ON DELETE SET NULL,
        content_type  TEXT NOT NULL
                        CHECK (content_type IN ('reel','post','story','carrusel','video','otro')),
        platform      TEXT NOT NULL
                        CHECK (platform IN ('instagram','facebook','tiktok','youtube','otro')),
        published_at  TEXT NOT NULL,
        url           TEXT,
        caption       TEXT,
        notes         TEXT,
        tags          TEXT,
        ig_media_id   TEXT,
        source        TEXT NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('manual','meta_api')),
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_publicaciones_client   ON publicaciones(client_id, published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_platform ON publicaciones(platform, published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_type     ON publicaciones(content_type);
    `);

  })(); // ejecutar transacción inmediatamente

  console.log('[DB] Migraciones completadas — todas las tablas verificadas');
}

module.exports = { runMigrations };

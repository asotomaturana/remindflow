-- ============================================================
-- RemindFlow v4.0.0 — Schema SQL
-- Compatible con PostgreSQL y SQLite (ver comentarios)
-- Sotoro Management · 2026
-- ============================================================

-- PostgreSQL: habilitar extensión UUID
-- Para SQLite: omitir esta línea y usar TEXT en lugar de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── clients ─────────────────────────────────────────────────
CREATE TABLE clients (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(200) NOT NULL,
  email        VARCHAR(200) NOT NULL,
  notes        TEXT,
  -- WhatsApp
  wa_phone     VARCHAR(30),
  wa_account   VARCHAR(100),
  wa_notes     TEXT,
  -- Instagram
  ig_account   VARCHAR(100),
  ig_link      VARCHAR(300),
  ig_phone     VARCHAR(30),
  ig_notes     TEXT,
  -- Facebook
  fb_account   VARCHAR(100),
  fb_link      VARCHAR(300),
  fb_phone     VARCHAR(30),
  fb_notes     TEXT,
  -- TikTok
  tt_account   VARCHAR(100),
  tt_link      VARCHAR(300),
  tt_phone     VARCHAR(30),
  tt_notes     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── propuestas ───────────────────────────────────────────────
CREATE TABLE propuestas (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  plan                  VARCHAR(200),
  monthly_value         DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency              VARCHAR(10)  NOT NULL DEFAULT 'CLP',
  contract_months       INTEGER      NOT NULL DEFAULT 3,
  content_qty_daily     INTEGER      NOT NULL DEFAULT 0,
  content_qty_weekly    INTEGER      NOT NULL DEFAULT 0,
  content_qty_monthly   INTEGER      NOT NULL DEFAULT 0,
  platforms             TEXT[],              -- En SQLite: TEXT (JSON array)
  content_types         TEXT[],              -- En SQLite: TEXT (JSON array)
  status                VARCHAR(20)  NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','sent','in_review','approved','rejected','cancelled')),
  sent_date             DATE,
  review_date           DATE,
  approval_date         DATE,
  start_date            DATE,
  additional_conditions TEXT,
  comments              TEXT,
  internal_notes        TEXT,
  prepared_by           VARCHAR(100),
  imported_from_excel   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── acuerdos ─────────────────────────────────────────────────
CREATE TABLE acuerdos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  platform      VARCHAR(50) NOT NULL,
  daily         INTEGER     NOT NULL DEFAULT 0,
  weekly        INTEGER     NOT NULL DEFAULT 0,
  monthly       INTEGER     NOT NULL DEFAULT 0,
  content_types VARCHAR(200),
  start_date    DATE,
  end_date      DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── contenido ────────────────────────────────────────────────
CREATE TABLE contenido (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  name        VARCHAR(200) NOT NULL,
  type        VARCHAR(50)  NOT NULL,
  platform    VARCHAR(50),
  status      VARCHAR(20)  NOT NULL DEFAULT 'agreed'
                CHECK (status IN ('agreed','reminded','replied','inprod','delivered','published','overdue')),
  due         DATE,
  description TEXT,
  reply       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── history ──────────────────────────────────────────────────
CREATE TABLE history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel       VARCHAR(20) NOT NULL CHECK (channel IN ('gmail','whatsapp')),
  client_id     UUID        REFERENCES clients(id) ON DELETE SET NULL,
  client_name   VARCHAR(200),
  to_address    VARCHAR(200) NOT NULL,
  subject       VARCHAR(500),
  preview       TEXT,
  content_type  VARCHAR(50),
  content_name  VARCHAR(200),
  platform      VARCHAR(50),
  contenido_id  UUID        REFERENCES contenido(id) ON DELETE SET NULL,
  message_id    VARCHAR(200),
  sid           VARCHAR(100),
  status        VARCHAR(20) NOT NULL DEFAULT 'sent',
  replied       BOOLEAN     NOT NULL DEFAULT FALSE,
  replied_at    VARCHAR(50),
  reply_content TEXT,
  reply_channel VARCHAR(20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── scheduled ────────────────────────────────────────────────
CREATE TABLE scheduled (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel       VARCHAR(20) NOT NULL CHECK (channel IN ('gmail','whatsapp')),
  client_id     UUID        REFERENCES clients(id) ON DELETE SET NULL,
  client_name   VARCHAR(200),
  to_address    VARCHAR(200) NOT NULL,
  subject       VARCHAR(500),
  body          TEXT        NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  recurrence    JSONB,                   -- En SQLite: TEXT
  content_type  VARCHAR(50),
  content_name  VARCHAR(200),
  platform      VARCHAR(50),
  contenido_id  UUID        REFERENCES contenido(id) ON DELETE SET NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','sent','failed','cancelled')),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── audit_log ────────────────────────────────────────────────
-- Tabla de solo lectura. NUNCA modificar ni eliminar registros.
CREATE TABLE audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity       VARCHAR(50) NOT NULL,
  entity_id    UUID,
  client_id    UUID        REFERENCES clients(id) ON DELETE SET NULL,
  action       VARCHAR(50) NOT NULL,
  detail       TEXT        NOT NULL,
  channel      VARCHAR(20),
  content_type VARCHAR(50),
  content_name VARCHAR(200),
  "user"       VARCHAR(100) NOT NULL DEFAULT 'system'
);

-- ── respuestas_cliente ───────────────────────────────────────
CREATE TABLE respuestas_cliente (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  message_id   UUID        REFERENCES history(id) ON DELETE SET NULL,
  contenido_id UUID        REFERENCES contenido(id) ON DELETE SET NULL,
  acuerdo_id   UUID        REFERENCES acuerdos(id) ON DELETE SET NULL,
  channel      VARCHAR(20) NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL,
  content      TEXT        NOT NULL,
  sender_phone VARCHAR(30),
  sender_email VARCHAR(200),
  auto_capture BOOLEAN     NOT NULL DEFAULT FALSE,
  raw          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── materiales ───────────────────────────────────────────────
CREATE TABLE materiales (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  contenido_id  UUID        REFERENCES contenido(id) ON DELETE SET NULL,
  acuerdo_id    UUID        REFERENCES acuerdos(id) ON DELETE SET NULL,
  filename      VARCHAR(300) NOT NULL,
  original_name VARCHAR(300) NOT NULL,
  mimetype      VARCHAR(100) NOT NULL,
  size          BIGINT       NOT NULL,
  path          TEXT         NOT NULL,
  uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  uploaded_by   VARCHAR(50)  NOT NULL DEFAULT 'admin',
  notes         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── tasks ────────────────────────────────────────────────────
CREATE TABLE tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  type         VARCHAR(100) NOT NULL,
  content_type VARCHAR(50),
  content_name VARCHAR(200),
  platform     VARCHAR(50),
  due          TIMESTAMPTZ  NOT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','overdue')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Índices recomendados ──────────────────────────────────────
CREATE INDEX idx_propuestas_client    ON propuestas (client_id);
CREATE INDEX idx_acuerdos_client      ON acuerdos (client_id);
CREATE INDEX idx_contenido_client     ON contenido (client_id, status);
CREATE INDEX idx_history_client       ON history (client_id, created_at DESC);
CREATE INDEX idx_history_contenido    ON history (contenido_id);
CREATE INDEX idx_scheduled_status     ON scheduled (status, scheduled_at);
CREATE INDEX idx_audit_timestamp      ON audit_log (timestamp DESC);
CREATE INDEX idx_audit_client         ON audit_log (client_id, timestamp DESC);
CREATE INDEX idx_respuestas_client    ON respuestas_cliente (client_id, received_at DESC);
CREATE INDEX idx_respuestas_contenido ON respuestas_cliente (contenido_id);
CREATE INDEX idx_materiales_client    ON materiales (client_id);
CREATE INDEX idx_materiales_contenido ON materiales (contenido_id);

-- ── publicaciones (NEW v4.2) ──────────────────────────────────
-- Registro permanente de contenido ya publicado en redes sociales.
-- Independiente de `materiales` (archivos crudos) y `contenido` (pipeline).
-- Campo igMediaId preparado para Meta Graph API (Fase 3).
CREATE TABLE publicaciones (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID         NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  contenido_id  UUID         REFERENCES contenido(id) ON DELETE SET NULL,
  content_type  VARCHAR(20)  NOT NULL
                  CHECK (content_type IN ('reel','post','story','carrusel','video','otro')),
  platform      VARCHAR(20)  NOT NULL
                  CHECK (platform IN ('instagram','facebook','tiktok','youtube','otro')),
  published_at  TIMESTAMPTZ  NOT NULL,
  url           VARCHAR(500),
  caption       TEXT,
  notes         TEXT,
  tags          TEXT[],                  -- En SQLite: TEXT (JSON array)
  ig_media_id   VARCHAR(100),            -- Para futura integración Meta Graph API
  source        VARCHAR(20)  NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','meta_api')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices para publicaciones
CREATE INDEX idx_publicaciones_client   ON publicaciones (client_id, published_at DESC);
CREATE INDEX idx_publicaciones_platform ON publicaciones (platform, published_at DESC);
CREATE INDEX idx_publicaciones_type     ON publicaciones (content_type);
CREATE INDEX idx_publicaciones_contenido ON publicaciones (contenido_id);

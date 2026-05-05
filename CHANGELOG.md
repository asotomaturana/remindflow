# RemindFlow — Changelog

---

## v4.1.0 — 2026-04-19

### Resumen
Versión de corrección crítica + dos nuevos módulos: credenciales de redes sociales
con cifrado AES-256-GCM y dashboard manual de estadísticas por plataforma.

### Bug corregido

**Login falla en segundo intento (crítico)**
- Causa raíz: `loadCfg()` estaba definida en el código pero nunca se llamaba al inicio.
  Al recargar la página, `CFG.url` quedaba vacío y `doLogin()` lanzaba
  "Primero configura la URL del servidor" antes de intentar el fetch.
- Fix: `loadCfg()` ahora se llama al inicio del bloque `(async () => {...})()`
  antes de `checkActiveSession()`.
- Archivo modificado: `index.html` línea 2219.

### Módulos nuevos

**Credenciales de redes sociales (AES-256-GCM)**
- Almacena usuario + contraseña de cada red social por cliente
- Cifrado AES-256-GCM con IV aleatorio por registro y authTag de integridad
- Módulo `crypto` nativo de Node.js — sin dependencias externas
- Para ver contraseñas: botón "Mostrar" protegido por contraseña del admin
- El admin reautentica con `POST /api/credenciales/:id/reveal` + `adminPassword`
- Comparación segura anti timing-attack (SHA-256 hash comparison)
- Audit log en cada operación, incluyendo intentos fallidos de reveal
- Variable de entorno nueva: `CIPHER_SECRET`
- Archivo nuevo: `services/cipher.js`, `routes/credenciales.js`

**Dashboard de estadísticas de redes sociales**
- Ingreso manual de métricas por período y plataforma
- Métricas estándar basadas en Hootsuite/Sprout Social:
  seguidores, nuevos seguidores, alcance, impresiones, likes,
  comentarios, guardados, compartidos, vistas (Reels), publicaciones del período
- Tasa de engagement calculada automáticamente en backend
- Endpoint `/api/estadisticas/resumen` con delta de seguidores período a período
- Campo `source`: preparado para conectar Meta Graph API / TikTok API en el futuro
- Plataformas: instagram, facebook, tiktok, whatsapp, youtube, otro
- Archivo nuevo: `routes/estadisticas.js`

### Backend — Cambios

- `server.js`: 2 nuevas rutas registradas (`/api/credenciales`, `/api/estadisticas`), versión bumpeada a 4.1.0
- `services/cipher.js`: servicio AES-256-GCM con encrypt/decrypt
- `routes/credenciales.js`: CRUD + endpoint reveal protegido por contraseña admin
- `routes/estadisticas.js`: CRUD + resumen por plataforma + cálculo de engagement
- `.env.example`: variable `CIPHER_SECRET` documentada con instrucciones de generación
- `index.html`: fix crítico de login (loadCfg al inicio)

### Notas de despliegue

- Agregar `CIPHER_SECRET` en las variables de entorno de Railway antes de reiniciar
- Generar con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Sin `CIPHER_SECRET`, las rutas de credenciales lanzarán error 500

---

## v4.0.0 — 2026-04-17

### Resumen
Versión mayor con 5 nuevos módulos integrados transversalmente al sistema existente.
IDs UUID en todas las entidades. Log de auditoría completo. Propuestas con formulario
y carga desde Excel. Respuestas automáticas via webhook Twilio. Estructura de carpetas
para materiales audiovisuales. Documentación de modelo de base de datos.

### Módulos nuevos

**Propuestas de servicio**
- Formulario completo: plan, valor mensual, moneda, duración del contrato
- Fechas: envío de propuesta, revisión, aprobación, puesta en marcha
- Cantidades acordadas: diaria, semanal, mensual
- Plataformas y tipos de contenido incluidos
- Condiciones adicionales, comentarios y notas internas (solo admin)
- Importación desde Excel/CSV vía `POST /api/propuestas/import-excel`
- Estados: draft → sent → in_review → approved → rejected | cancelled
- Selector de estado rápido desde la lista

**Log de auditoría**
- Registra automáticamente cada acción del ciclo de vida del sistema
- Entidades auditadas: client, propuesta, acuerdo, contenido, message, scheduled, respuesta, material, system
- Acciones registradas: created, updated, deleted, sent, scheduled, cancelled, status_change, reply_received, uploaded, startup
- Filtros por cliente, entidad, acción y rango de fechas
- Tabla de solo lectura — nunca se modifica ni elimina
- Visible en sección "Auditoría" del frontend (solo admin)

**Respuestas del cliente**
- Registro manual de respuestas (WhatsApp, Gmail, teléfono, presencial, otro)
- Webhook Twilio para captura automática (`POST /webhooks/twilio/webhook-twilio`)
- Asociación a mensaje de historial, pieza de contenido y acuerdo
- Al registrar una respuesta asociada a una pieza, actualiza su estado a "replied"
- Filtros por cliente y canal en el frontend

**Materiales audiovisuales**
- Subida de archivos (imágenes, videos, PDF) hasta 200MB por archivo
- Estructura de carpetas: `uploads/{clientId}/{year}/{month}/{timestamp}_{filename}`
- Vista de árbol de carpetas para el administrador
- Asociación a pieza de contenido y acuerdo
- Al subir material asociado a pieza en estado "agreed" o "reminded", la pasa a "inprod"
- Descarga directa de archivos desde el frontend

**Modelo de base de datos**
- UUIDs en todas las entidades (antes usaban IDs secuenciales)
- Documentación completa: 10 tablas, campos, tipos, restricciones, relaciones
- Schema SQL completo en `schema.sql` (PostgreSQL, compatible con SQLite)
- Documento DOCX y PDF: remindflow_db_model

### Backend — Cambios

- `data/store.js`: reescrito con UUID, 4 nuevos modelos (propuestas, audit_log, respuestas_cliente, materiales), audit automático en cada operación
- `server.js`: 4 nuevas rutas registradas, webhook Twilio sin auth, servicio de archivos estáticos `/uploads`
- `routes/propuestas.js`: CRUD + import-excel + patch/status
- `routes/audit.js`: GET con filtros, endpoints de metadata
- `routes/respuestas.js`: CRUD + webhook Twilio automático
- `routes/materiales.js`: upload multifichero con multer, tree view, download, delete
- `routes/contenido.js`: enriquecido con respuestas y materiales en GET /:id, auto-audit
- `routes/messages.js`: links a contenidoId, auto-update estado a "reminded", audit completo
- `package.json`: agrega `multer ^1.4.5-lts.1`
- `schema.sql`: script SQL completo para migrar a PostgreSQL

### Frontend — Cambios

- Sección "Propuestas": formulario completo, lista con cambio de estado rápido, importar Excel
- Sección "Materiales": subida de archivos, árbol de carpetas, filtro por cliente, descarga
- Sección "Respuestas": lista con filtros, formulario de registro manual
- Sección "Auditoría": log con filtros por cliente, entidad y acción
- Menú lateral: 4 nuevos ítems (Propuestas, Materiales, Respuestas, Auditoría)
- `populateSelects()` extendido para los nuevos selectores
- `ST()` extendido para manejar los nuevos tabs

### Documentos generados/actualizados

- `remindflow_db_model.docx/pdf`: modelo completo de base de datos
- `schema.sql`: script DDL para PostgreSQL/SQLite
- `CHANGELOG.md`: actualizado

---

## v3.4.0 — 2026-04-13
Login usuario+contraseña con JWT. Sesión de 8 horas. routes/auth.js.

## v3.3.0 — 2026-04-12
Reversión a Twilio sandbox.

## v3.2.0 — 2026-04-12
WhatsApp via Wassenger. Revertido en v3.3.

## v3.1.0 — 2026-04-12
Estabilización. Primera entrega en ZIP.

## v3.0.0 — 2026-04-11
Perfiles sociales, acuerdos, contenido, detalle por cliente, dashboard.

## v2.0.0 — 2026-04-11
Edición de clientes, tipo/nombre de contenido, periodicidad, calendario.

## v1.0.0 — 2026-04-11
Primera versión funcional.

---

## [4.2.0] — 2026-05-04

### Added
- **Módulo Publicaciones** (`routes/publicaciones.js`): registro permanente de contenido ya publicado en redes sociales.
  - Campos: `clientId`, `contenidoId` (opcional), `contentType`, `platform`, `publishedAt`, `url`, `caption`, `notes`, `tags[]`, `igMediaId`, `source`
  - `contentType`: reel | post | story | carrusel | video | otro
  - `platform`: instagram | facebook | tiktok | youtube | otro
  - Endpoints: `GET /api/publicaciones`, `GET /api/publicaciones/resumen`, `GET /api/publicaciones/:id`, `POST`, `PUT`, `DELETE`
  - Resumen agrupa por plataforma, tipo de contenido y mes (YYYY-MM)
  - Side-effect: si se vincula a un `contenidoId`, actualiza su status a `published` automáticamente
  - Campo `igMediaId` y `source: 'meta_api'` preparados para integración Meta Graph API (Fase 3)
- **store.js**: funciones `getPublicaciones`, `getPublicacion`, `createPublicacion`, `updatePublicacion`, `deletePublicacion`
- **store.js**: constantes exportadas `VALID_CONTENT_TYPES` y `VALID_PLATFORMS`
- **schema.sql**: tabla `publicaciones` con índices para queries por cliente, plataforma, tipo y contenido
- **server.js**: registra `publicacionesRouter` en `/api/publicaciones`
- **server.js**: `/api/summary` incluye `totalPublicaciones`
- Versión bumped de 4.1.0 → 4.2.0

### Architecture note
- `materiales`: archivos crudos recibidos del cliente (pre-producción)
- `contenido`: pipeline de producción (agreed → published)
- `publicaciones`: log post-publicación con fecha, plataforma, tipo, URL y caption

### Pending (Fase 2 & 3)
- Persistencia real con SQLite/PostgreSQL (datos se pierden en reinicio)
- Integración Meta Graph API para pull automático de métricas por post (`igMediaId`)
- UI en index.html para el módulo de publicaciones

---

## [4.3.0] — 2026-05-04

### Changed (Breaking — requiere npm install)
- **Persistencia completa con SQLite** (`better-sqlite3 ^9.4.3`)
  - Los datos ya NO se pierden al reiniciar el servidor
  - Todas las entidades migradas: clients, tasks, history, scheduled, acuerdos, contenido, propuestas, audit_log, respuestas_cliente, materiales, publicaciones
  - `data/store.js` reescrito completamente — API pública sin cambios (ninguna ruta se modificó)

### Added
- **`services/db.js`**: singleton de conexión SQLite
  - WAL mode activado (mejor rendimiento + seguridad ante crashes)
  - `foreign_keys = ON` (integridad referencial)
  - Cierre limpio en SIGINT/SIGTERM
  - `DB_PATH` configurable por variable de entorno (default: `./data/remindflow.db`)
- **`data/migrate.js`**: creación idempotente de tablas al iniciar
  - `CREATE TABLE IF NOT EXISTS` — seguro de ejecutar N veces
  - Incluye todos los índices de rendimiento
- **`server.js`**: llama `runMigrations()` y `logStartup()` al arrancar
- **`package.json`**: `better-sqlite3 ^9.4.3` agregado como dependencia
- **`.env.example`**: variable `DB_PATH` documentada
- **`.gitignore`**: excluye `*.db`, `*.db-shm`, `*.db-wal`

### Railway — configuración requerida
Para que los datos persistan entre deploys en Railway:
1. Railway Dashboard → proyecto → Settings → Volumes
2. Crear Volume: Mount Path = `/app/data`
3. Agregar variable de entorno: `DB_PATH=/app/data/remindflow.db`
4. Redeploy

### Differences vs schema.sql (PostgreSQL)
| PostgreSQL     | SQLite (este archivo)         |
|----------------|-------------------------------|
| UUID           | TEXT (crypto.randomUUID())    |
| TIMESTAMPTZ    | TEXT (ISO 8601)               |
| TEXT[]         | TEXT (JSON.stringify)         |
| JSONB          | TEXT (JSON.stringify)         |
| BOOLEAN        | INTEGER (0/1)                 |
| DECIMAL        | REAL                          |

### Pending
- UI en index.html para módulo de publicaciones
- Meta Graph API (Fase 3)

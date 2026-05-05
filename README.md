# RemindFlow v4.1.0

Sistema de gestión para community managers — Sotoro Management.

## Novedades v4.1
- **Bug fix crítico**: login fallaba en el segundo intento (loadCfg no se llamaba al inicio)
- Módulo de credenciales de redes sociales con cifrado AES-256-GCM
- Dashboard manual de estadísticas por plataforma (preparado para Meta API)

## Novedades v4.0
- Módulo de Propuestas de servicio con importación desde Excel/CSV
- Log de auditoría completo de todas las acciones del sistema
- Registro automático de respuestas de clientes via webhook Twilio
- Gestión de materiales audiovisuales con estructura de carpetas
- UUIDs en todas las entidades del sistema

## Estructura del proyecto

```
remindflow_v40/
├── index.html              ← Frontend completo (bug fix login)
├── server.js               ← Backend Express v4.1
├── schema.sql              ← DDL para PostgreSQL/SQLite
├── package.json
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── README.md
├── uploads/                ← Materiales de clientes (se crea automáticamente)
│   └── {clientId}/
│       └── {year}/{month}/{timestamp}_{filename}
├── data/store.js           ← Store en memoria con UUID
├── middleware/auth.js      ← JWT + API Key
├── routes/
│   ├── auth.js             ← Login/logout/me
│   ├── clients.js
│   ├── tasks.js
│   ├── messages.js
│   ├── acuerdos.js
│   ├── contenido.js
│   ├── propuestas.js       ← Propuestas + import-excel
│   ├── audit.js            ← Log de auditoría
│   ├── respuestas.js       ← Respuestas + webhook Twilio
│   ├── materiales.js       ← Subida y gestión de archivos
│   ├── credenciales.js     ← NEW v4.1: credenciales cifradas AES-256
│   └── estadisticas.js     ← NEW v4.1: dashboard de métricas sociales
└── services/
    ├── gmail.js
    ├── whatsapp.js
    ├── scheduler.js
    └── cipher.js           ← NEW v4.1: servicio AES-256-GCM
```

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm start
```

## Variables de entorno (.env)

```env
PORT=3000
APP_USERNAME=admin
APP_PASSWORD=tu_contraseña
JWT_SECRET=texto_largo_aleatorio
CIPHER_SECRET=genera_con_comando_abajo
GMAIL_USER=sotoroadmin@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_FROM_NAME=Sotoro Management
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
API_SECRET_KEY=clave_opcional
```

Generar CIPHER_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Credenciales de redes sociales (AES-256-GCM)

- Las contraseñas se cifran con AES-256-GCM antes de almacenarse en memoria
- Nunca se exponen en el listado de credenciales
- Para revelar: botón "Mostrar" en el frontend → requiere contraseña de admin
- Cada intento de reveal queda registrado en el log de auditoría

## Dashboard de estadísticas

Métricas por plataforma y período: seguidores totales, nuevos seguidores, alcance,
impresiones, likes, comentarios, guardados, compartidos, vistas (Reels/video),
publicaciones del período. Tasa de engagement calculada automáticamente.

Campo `source: 'manual'` — preparado para cambiar a `'meta_api'` cuando el acceso
a Meta Graph API esté aprobado.

## API v4.1 — Rutas nuevas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | /api/credenciales | Credenciales de RRSS (sin passwords) |
| PUT/DELETE | /api/credenciales/:id | Actualizar/eliminar credencial |
| POST | /api/credenciales/:id/reveal | Revelar contraseña (requiere adminPassword) |
| GET/POST | /api/estadisticas | Estadísticas de RRSS |
| GET | /api/estadisticas/resumen | Resumen por plataforma (último período) |
| PUT/DELETE | /api/estadisticas/:id | Corregir/eliminar registro |

## Webhook Twilio

En console.twilio.com → Messaging → Sandbox → "When a message comes in":
- URL: `https://tu-servidor.railway.app/webhooks/twilio/webhook-twilio`
- Method: `POST`

## Migrar a PostgreSQL

```bash
createdb remindflow
psql remindflow < schema.sql
npm install pg
# Reemplazar funciones de store.js por queries SQL
```

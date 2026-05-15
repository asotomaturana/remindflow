# RemindFlow v4.3.1
## Casos de Prueba Formales — QA API Testing

**Fecha:** 14 mayo 2026
**Autor:** Alejandro Soto Maturana — Rol: QA
**Base:** remindflow_qa_handoff_v1.md
**Ambiente:** Produccion — https://remindflow-production.up.railway.app
**Estado:** BORRADOR — pendiente de aprobacion

---

## Cobertura planificada

| Hallazgo | Casos totales | Automatizables | Manuales |
|---|---|---|---|
| H-03 JWT | 5 | 4 | 1 |
| H-01 Gmail | 5 | 4 | 1 |
| H-04 Webhook | 3 | 2 | 1 |
| H-06 Credenciales | 6 | 6 | 0 |
| H-05 CSP | 4 | 3 | 1 |
| H-08 Scheduler | 5 | 3 | 2 |
| **TOTAL** | **28** | **22** | **6** |

---

## H-03 — JWT sin expiración estándar RFC 7519

### Contexto
El token JWT generado por POST /auth/login no tenia campo exp y el campo iat estaba en milisegundos. Fix aplicado en commit 9277c19. Los tokens ahora expiran en 8 horas.

### Precondicion general
Sistema desplegado en produccion. Credenciales validas: username y password del administrador.

| ID | Nombre del caso | Precondicion | Datos de entrada | Resultado esperado | Tipo | Automatizable |
|---|---|---|---|---|---|---|
| H03-TC01 | Login devuelve token con campo iat en segundos | Usuario no autenticado | POST /auth/login con credenciales validas | Response 200. Campo iat del JWT decodificado tiene exactamente 10 digitos | Positivo | Si |
| H03-TC02 | Login devuelve token con campo exp igual a iat + 28800 | Usuario no autenticado | POST /auth/login con credenciales validas | Response 200. Campo exp del JWT decodificado igual a iat + 28800 (8 horas en segundos) | Positivo | Si |
| H03-TC03 | Token con formato invalido devuelve 401 con mensaje correcto | Usuario no autenticado | GET /api/clients con Authorization: Bearer tokenbasura123 | Response 401. Body: { "error": "Token invalido." } | Negativo | Si |
| H03-TC04 | GET /auth/me con token valido devuelve datos del usuario | Usuario autenticado con token valido | GET /auth/me con Authorization: Bearer {{token}} | Response 200. Body contiene campos username y role | Positivo | Si |
| H03-TC05 | Verificacion visual del token en jwt.io | Usuario autenticado | Decodificar token en jwt.io | Signature valida. Campo exp presente y correcto. Diferencia exp - iat = 28800 | Positivo | No — Manual |

### Notas
- H03-TC01 y H03-TC02 requieren decodificar el payload del JWT en Base64 dentro del script de Postman
- H03-TC03 verifica ademas que el mensaje diferencia token invalido de token expirado (fix de mensaje SEC-003)
- H03-TC05 es verificacion visual complementaria — no reemplaza los tests automatizados

---

## H-01 — Gmail no enviaba mensajes

### Contexto
Gmail fallaba por credenciales vencidas, singleton sin manejo de errores y bloqueo SMTP de Railway. Fix aplicado en commits 5370340, 50f860e, 5c60ce8. Se reemplazo Nodemailer por SendGrid API.

### Precondicion general
Sistema autenticado. SendGrid configurado con sender verificado alejandrosotomaturana@gmail.com. Token valido en {{token}}.

| ID | Nombre del caso | Precondicion | Datos de entrada | Resultado esperado | Tipo | Automatizable |
|---|---|---|---|---|---|---|
| H01-TC01 | POST /api/messages/gmail devuelve 200 con messageId | Usuario autenticado | POST /api/messages/gmail con to, subject y body validos | Response 200. Body contiene success: true, messageId y historyId como strings | Positivo | Si |
| H01-TC02 | Email llega fisicamente a la bandeja | H01-TC01 ejecutado exitosamente | Revisar bandeja de alejandrosotomaturana@gmail.com | Email recibido en menos de 60 segundos con subject correcto | Positivo | No — Manual |
| H01-TC03 | Registro aparece en auditoria tras envio | H01-TC01 ejecutado exitosamente | GET /api/audit?entity=message&action=sent | Response 200. Array contiene registro del mensaje enviado | Positivo | Si |
| H01-TC04 | POST sin subject devuelve 400 | Usuario autenticado | POST /api/messages/gmail sin campo subject | Response 400. Body contiene campo error como string | Negativo | Si |
| H01-TC05 | POST sin clientId ni to devuelve 400 | Usuario autenticado | POST /api/messages/gmail sin clientId y sin to | Response 400. Body contiene campo error como string | Negativo | Si |

### Notas
- H01-TC02 es manual — no hay forma de verificar recepcion fisica desde Postman
- H01-TC03 depende de que exista endpoint GET /api/audit — verificar antes de implementar
- Deuda tecnica B-GMAIL-01: cuando se migre a Gmail OAuth2, estos tests deberan actualizarse

---

## H-04 — Webhook Twilio sin validacion de firma

### Contexto
El endpoint POST /webhooks/twilio/webhook-twilio era publico. Fix aplicado en commit 4753ef5. Ahora valida header X-Twilio-Signature usando el SDK de Twilio.

### Precondicion general
Sistema desplegado. Endpoint accesible sin autenticacion JWT (es un webhook publico con validacion propia).

### Nota tecnica importante
Este endpoint usa Content-Type: application/x-www-form-urlencoded, no JSON. Los datos van en formato de formulario, no en body JSON.

| ID | Nombre del caso | Precondicion | Datos de entrada | Resultado esperado | Tipo | Automatizable |
|---|---|---|---|---|---|---|
| H04-TC01 | POST sin header X-Twilio-Signature devuelve 403 | Ninguna | POST /webhooks/twilio/webhook-twilio sin header X-Twilio-Signature. Body form-urlencoded con From, Body, MessageSid | Response 403 Forbidden | Negativo / Seguridad | Si |
| H04-TC02 | POST con firma incorrecta devuelve 403 | Ninguna | POST /webhooks/twilio/webhook-twilio con X-Twilio-Signature: firma_invalida_123 | Response 403 Forbidden | Negativo / Seguridad | Si |
| H04-TC03 | Peticion legitima de Twilio es procesada | H-02 resuelto — sandbox activa | Enviar mensaje WhatsApp real al numero de sandbox | Respuesta registrada en sistema. Response de Twilio procesado correctamente | Positivo | No — Manual |

### Notas
- H04-TC01 y H04-TC02 son ejecutables siempre — no dependen de Twilio
- H04-TC03 depende de H-02 (sandbox activa) — coordinar con operaciones antes de ejecutar
- Content-Type debe ser application/x-www-form-urlencoded, no application/json

---

## H-06 — Modulo Credenciales almacenaba contrasenas

### Contexto
Rediseno completo del modulo. Campo password eliminado. Endpoint /reveal eliminado. Campo accessType agregado. Fix aplicado en commits 5e1ea7c, 301c6fc.

### Precondicion general
Usuario autenticado. clientId valido disponible en {{clienteId}}.

### Valores validos
- platform: instagram, facebook, tiktok, whatsapp, youtube, otro
- accessType: colaborador, administrador, acceso_delegado, otro

| ID | Nombre del caso | Precondicion | Datos de entrada | Resultado esperado | Tipo | Automatizable |
|---|---|---|---|---|---|---|
| H06-TC01 | POST con accessType valido devuelve 201 sin campo password | Usuario autenticado | POST /api/credenciales con clientId valido, platform: instagram, accessType: colaborador, username: @test | Response 201. Body NO contiene campo password ni encryptedPassword | Positivo | Si |
| H06-TC02 | POST con password en body ignora el campo | Usuario autenticado | POST /api/credenciales con todos los campos validos MAS password: "test123" | Response 201. Body NO contiene campo password | Seguridad | Si |
| H06-TC03 | Endpoint reveal devuelve 404 | Usuario autenticado | POST /api/credenciales/cualquier-id/reveal con body { adminPassword: "test" } | Response 404 | Seguridad | Si |
| H06-TC04 | POST con platform invalido devuelve 400 | Usuario autenticado | POST /api/credenciales con platform: instagram_invalido, accessType: colaborador | Response 400 con mensaje descriptivo | Negativo | Si |
| H06-TC05 | POST sin accessType devuelve 400 | Usuario autenticado | POST /api/credenciales con clientId y platform validos, sin accessType | Response 400. Body: { "error": "clientId, platform y accessType son requeridos" } | Negativo | Si |
| H06-TC06 | GET /api/credenciales retorna lista sin campos de contrasena | Usuario autenticado | GET /api/credenciales | Response 200. Array sin campos password ni encryptedPassword en ningun elemento | Seguridad | Si |

### Notas
- H06-TC02 y H06-TC03 son casos de seguridad criticos — verifican que el rediseno elimino los vectores de exposicion
- H06-TC06 verifica que datos anteriores tampoco exponen contrasenas

---

## H-05 — Helmet CSP deshabilitado

### Contexto
CSP estaba completamente deshabilitado. Fix Fase 1 aplicado en commit 621f532. CSP basico activado con frame-ancestors none y object-src none.

### Precondicion general
Ninguna — los headers HTTP son publicos y no requieren autenticacion.

### Nota tecnica importante
Estos tests verifican headers HTTP de la respuesta, no el body. Se usa pm.response.headers.get() en lugar de pm.response.json().

| ID | Nombre del caso | Precondicion | Datos de entrada | Resultado esperado | Tipo | Automatizable |
|---|---|---|---|---|---|---|
| H05-TC01 | GET /health incluye header Content-Security-Policy | Ninguna | GET /health sin headers adicionales | Response 200. Header Content-Security-Policy presente en la respuesta | Positivo | Si |
| H05-TC02 | CSP incluye frame-ancestors none | H05-TC01 pasado | GET /health | Header Content-Security-Policy contiene el valor frame-ancestors 'none' | Positivo | Si |
| H05-TC03 | CSP incluye object-src none | H05-TC01 pasado | GET /health | Header Content-Security-Policy contiene el valor object-src 'none' | Positivo | Si |
| H05-TC04 | UI funciona correctamente con CSP activo | CSP habilitado en produccion | Login, navegacion y envio de mensajes en la UI | Sin errores de consola relacionados con CSP. Funcionalidad completa operativa | Positivo | No — Playwright |

### Notas
- H05-TC04 es responsabilidad del chat QA UI (Playwright), no de este chat
- Fase 2 del fix (refactorizacion index.html + CSP estricto) aun pendiente — estos tests deberan actualizarse cuando se implemente

---

## H-08 — Mensajes fallidos sin reintento automatico

### Contexto
Scheduler no reintentaba mensajes fallidos. Fix aplicado en commits 72dcc53, 1c06ec4. Backoff escalonado implementado. Tres campos nuevos en response: retryCount, lastError, nextRetryAt.

### Precondicion general
Usuario autenticado. Al menos un mensaje programado existente en el sistema.

### Estados posibles
scheduled, sent, failed, failed_permanent, cancelled

| ID | Nombre del caso | Precondicion | Datos de entrada | Resultado esperado | Tipo | Automatizable |
|---|---|---|---|---|---|---|
| H08-TC01 | GET /api/messages/schedule incluye campo retryCount | Al menos un mensaje programado | GET /api/messages/schedule | Response 200. Cada mensaje del array incluye campo retryCount como numero | Positivo | Si |
| H08-TC02 | GET /api/messages/schedule incluye campo lastError | Al menos un mensaje programado | GET /api/messages/schedule | Response 200. Cada mensaje incluye campo lastError (string o null) | Positivo | Si |
| H08-TC03 | GET /api/messages/schedule incluye campo nextRetryAt | Al menos un mensaje programado | GET /api/messages/schedule | Response 200. Cada mensaje incluye campo nextRetryAt (string o null) | Positivo | Si |
| H08-TC04 | Mensaje que falla 6 veces queda en failed_permanent | Ambiente con credenciales invalidas configuradas temporalmente | Esperar ciclo completo de 6 reintentos (~75 minutos) | Status del mensaje: failed_permanent | Negativo | No — Simulacion |
| H08-TC05 | Mensaje que falla 1 vez y luego funciona queda en sent | Ambiente con fallo controlado en primer intento | Restaurar credenciales en segundo intento | Status del mensaje: sent. retryCount: 1 | Positivo | No — Simulacion |

### Notas
- H08-TC01, H08-TC02, H08-TC03 son verificaciones de contrato — verifican que los campos nuevos existen en el response
- H08-TC04 y H08-TC05 requieren simulacion de condiciones de fallo — no ejecutables en produccion sin riesgo. Recomendacion: ejecutar en ambiente local con credenciales invalidas temporalmente
- El documento de handoff confirma esta limitacion

---

## Resumen de automatizacion

| Categoria | Cantidad |
|---|---|
| Casos totalmente automatizables con Postman | 22 |
| Casos manuales (verificacion fisica) | 4 |
| Casos Playwright (UI) | 1 |
| Casos que requieren simulacion de fallos | 2 |
| Casos mixtos (automatizado + manual) | 1 |
| **Total** | **28** |

---

## Pendientes antes de implementar

- Verificar que existe endpoint GET /api/audit (requerido por H01-TC03)
- Confirmar credenciales de administrador validas para autenticacion
- Coordinar con operaciones activacion de sandbox Twilio para H04-TC03
- Definir clientId de produccion a usar en H06 (disponible: 500538de-181d-4027-b419-d71349006d34)

---

*BORRADOR — pendiente de revision y aprobacion de cobertura y alcance*
*RemindFlow v4.3.1 — Alejandro Soto Maturana — QA — 14 mayo 2026*

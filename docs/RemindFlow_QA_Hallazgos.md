# RemindFlow v4.3.0
## Registro de Hallazgos QA — API Testing

*Alejandro Soto Maturana — Mayo 2026*
*Sesiones de API Testing con Postman sobre ambiente de produccion (Railway)*

---

## Resumen Ejecutivo

Documento que registra los hallazgos identificados durante las sesiones de API Testing sobre RemindFlow v4.3.0. Los tests se ejecutaron contra el ambiente de produccion en Railway usando Postman.

Se identificaron 7 hallazgos: 2 de seguridad y 5 de calidad de datos. Ninguno bloquea la operacion actual del sistema dado que es monousuario, pero deben resolverse antes de cualquier expansion de usuarios o exposicion publica ampliada.

---

## Tabla de Hallazgos

| ID | Tipo | Severidad | Titulo | Sesion |
|---|---|---|---|---|
| SEC-001 | Seguridad | Alta | JWT sin campo exp — token sin expiracion real | Sesion 1 |
| SEC-002 | Seguridad | Media | Inconsistencia entre expiresIn declarado y expiracion real | Sesion 1 |
| SEC-003 | Seguridad | Baja | Mensaje de error incorrecto para token invalido | Sesion 3 |
| DAT-001 | Calidad de Datos | Media | Endpoint POST /api/clients no valida duplicados | Sesion 2 |
| DAT-002 | Calidad de Datos | Baja | Datos de prueba en base de datos de produccion | Sesion 2 |
| DAT-003 | Calidad de Datos | Media | Restriccion de clave foranea no manejada correctamente | Sesion 5 |
| DAT-004 | Calidad de Datos | Baja | Orden de eliminacion no documentado | Sesion 5 |
| DAT-005 | Calidad de Datos | Media | Ausencia de endpoint para eliminacion en cascada | Sesion 5 |

---

## Hallazgos Detallados

### SEC-001 — JWT sin campo exp — token sin expiracion real

| Campo | Detalle |
|---|---|
| Tipo | Seguridad |
| Severidad | Alta |
| Sesion | Sesion 1 |
| Endpoint | POST /auth/login |

**Descripcion:**
El endpoint POST /auth/login devuelve un token JWT que no contiene el campo exp (expiration). El campo iat esta en milisegundos en lugar de segundos, violando el estandar RFC 7519. El response body declara expiresIn: 8h pero el token nunca expira realmente.

**Impacto:**
Un token comprometido nunca invalida. Si las credenciales de un usuario son robadas, el atacante tiene acceso indefinido al sistema.

**Recomendacion:**
Agregar campo exp al JWT con expiracion de 8 horas. Corregir iat a segundos (Date.now() / 1000).

---

### SEC-002 — Inconsistencia entre expiresIn declarado y expiracion real

| Campo | Detalle |
|---|---|
| Tipo | Seguridad |
| Severidad | Media |
| Sesion | Sesion 1 |
| Endpoint | POST /auth/login |

**Descripcion:**
El response de login declara expiresIn: 8h, lo que genera una expectativa falsa en cualquier cliente que consuma la API. El token en realidad no expira nunca.

**Impacto:**
Cualquier sistema o desarrollador que integre la API asumira que el token muere en 8 horas y disenara su logica en base a eso. El comportamiento real es distinto.

**Recomendacion:**
Sincronizar el campo expiresIn con la expiracion real del token, o eliminarlo si no se implementa expiracion.

---

### SEC-003 — Mensaje de error incorrecto para token invalido

| Campo | Detalle |
|---|---|
| Tipo | Seguridad |
| Severidad | Baja |
| Sesion | Sesion 3 |
| Endpoint | POST /api/clients |

**Descripcion:**
El servidor devuelve "Token expirado. Inicia sesion nuevamente." cuando recibe un token con formato completamente invalido (texto basura). Son situaciones distintas — un token expirado era valido pero vencio, un token invalido nunca fue valido. Ademas es contradictorio con SEC-001 — los tokens de RemindFlow nunca expiran realmente, pero el servidor usa "token expirado" como mensaje generico de error de autenticacion.

**Impacto:**
Confunde al consumidor de la API — el mensaje sugiere que debe renovar el token cuando en realidad el token es invalido desde el origen.

**Recomendacion:**
Diferenciar los mensajes: "Token invalido" para tokens mal formados, "Token expirado" para tokens con exp vencido (cuando se implemente expiracion real).

---

### DAT-001 — Endpoint POST /api/clients no valida duplicados

| Campo | Detalle |
|---|---|
| Tipo | Calidad de Datos |
| Severidad | Media |
| Sesion | Sesion 2 |
| Endpoint | POST /api/clients |

**Descripcion:**
El servidor permite crear multiples clientes con el mismo nombre, email y telefono sin ninguna validacion de unicidad. Se confirmo creando dos registros identicos durante las pruebas.

**Impacto:**
La base de datos puede acumular registros duplicados, contaminando los datos de produccion. En un sistema de un solo usuario esto es especialmente grave porque no hay proceso de deduplicacion.

**Recomendacion:**
Agregar validacion de unicidad por email antes del INSERT. Devolver 409 Conflict si ya existe un cliente con ese email.

---

### DAT-002 — Datos de prueba en base de datos de produccion

| Campo | Detalle |
|---|---|
| Tipo | Calidad de Datos |
| Severidad | Baja |
| Sesion | Sesion 2 |
| Endpoint | Multiples |

**Descripcion:**
Durante las sesiones de testing se crearon registros de prueba directamente en el ambiente de produccion (Railway). No existe ambiente de QA separado para RemindFlow.

**Impacto:**
Los datos de prueba conviven con datos reales del cliente, generando ruido en reportes y conteos.

**Recomendacion:**
Implementar limpieza post-test ejecutando DELETE al final de cada sesion. A futuro, considerar un ambiente de staging separado.

---

### DAT-003 — Restriccion de clave foranea no manejada correctamente

| Campo | Detalle |
|---|---|
| Tipo | Calidad de Datos |
| Severidad | Media |
| Sesion | Sesion 5 |
| Endpoint | DELETE /api/clients/:id |

**Descripcion:**
El servidor devuelve 500 con mensaje tecnico "FOREIGN KEY constraint failed" cuando se intenta eliminar un cliente que tiene entidades dependientes (tareas, mensajes, etc.). Es un error interno de base de datos expuesto directamente al consumidor de la API.

**Impacto:**
El consumidor recibe un error 500 sin informacion util sobre como resolver el problema. El mensaje tecnico expone detalles internos de la implementacion.

**Recomendacion:**
Capturar el error de clave foranea y devolver 409 Conflict con un mensaje claro: "No se puede eliminar el cliente — tiene entidades dependientes asociadas."

---

### DAT-004 — Orden de eliminacion no documentado

| Campo | Detalle |
|---|---|
| Tipo | Calidad de Datos |
| Severidad | Baja |
| Sesion | Sesion 5 |
| Endpoint | DELETE /api/clients/:id |

**Descripcion:**
La API no documenta que las entidades dependientes deben eliminarse antes que el cliente padre. Un consumidor descubre esta restriccion solo cuando recibe el error 500.

**Impacto:**
Mala experiencia de integracion — el desarrollador debe descubrir por prueba y error el orden correcto de eliminacion.

**Recomendacion:**
Documentar explicitamente en el Swagger el orden de eliminacion requerido. Idealmente implementar DAT-005.

---

### DAT-005 — Ausencia de endpoint para eliminacion en cascada

| Campo | Detalle |
|---|---|
| Tipo | Calidad de Datos |
| Severidad | Media |
| Sesion | Sesion 5 |
| Endpoint | DELETE /api/clients/:id |

**Descripcion:**
La API no ofrece un mecanismo para eliminar un cliente junto con todas sus entidades dependientes en una sola operacion. El consumidor debe conocer y eliminar manualmente cada entidad en el orden correcto antes de poder eliminar el cliente. Esto obliga a usar requests ad-hoc fuera de la coleccion oficial.

**Impacto:**
Proceso de limpieza manual propenso a errores. En un contexto de testing automatizado con Newman, imposibilita la limpieza automatica de datos de prueba.

**Recomendacion:**
Implementar DELETE /api/clients/:id?cascade=true que elimine el cliente y todas sus dependencias en una transaccion atomica. O al menos que el error 409 liste que entidades dependientes existen.

---

## Areas Pendientes de Testing

- Casos negativos de Tareas: POST sin token, POST con campos vacios, GET tarea inexistente
- Cobertura de Mensajes: GET, POST email, POST WhatsApp
- Security testing: exposicion de datos sensibles en responses
- Security testing: autorizacion por rol (403)
- Validacion de entidades adicionales: acuerdos, contenido, estadisticas

---

### DAT-006 — Swagger documenta endpoint que no existe en produccion

| Campo | Detalle |
|---|---|
| Tipo | Calidad de Datos |
| Severidad | Media |
| Sesion | Sesion adicional |
| Endpoint | PATCH /api/tasks/:id/status |

**Descripcion:**
El Swagger de RemindFlow documenta el endpoint PATCH /api/tasks/:id/status para cambiar el status de una tarea. Al ejecutarlo contra produccion, el servidor devuelve 404 con mensaje "Ruta no encontrada". El endpoint no existe en la implementacion actual.

**Impacto:**
Inconsistencia entre documentacion y realidad. Un desarrollador que integre la API basandose en el Swagger intentara usar ese endpoint y fallara. Ademas genera desconfianza en la documentacion — si un endpoint falta, pueden faltar otros.

**Recomendacion:**
Eliminar el endpoint del Swagger o implementarlo en el servidor. La documentacion debe reflejar exactamente lo que existe en produccion.

---

*Documento vivo — se actualiza con cada sesion de practica.*
*RemindFlow v4.3.0 — Alejandro Soto Maturana — Mayo 2026*

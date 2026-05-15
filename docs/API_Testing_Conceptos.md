# Glosario de API Testing
## Conceptos Fundamentales para QA Engineers

*Alejandro Soto Maturana — Mayo 2026*
*Elaborado durante sesiones de práctica con Postman sobre RemindFlow v4.3.0*

---

## Bloque 1 — Fundamentos de APIs

### 1. API / API (Application Programming Interface)

**En español:** Interfaz de Programación de Aplicaciones

Una API es un contrato que define cómo dos sistemas pueden comunicarse entre sí. No importa en qué lenguaje está escrito cada sistema — la API es el punto de encuentro.

**Analogía:** como el menú de un restaurante. El menú define qué puedes pedir, en qué formato pedirlo, y qué recibirás a cambio. Tú no necesitas saber cómo funciona la cocina — solo necesitas saber usar el menú.

**Ejemplo en RemindFlow:**
El frontend (navegador) le pide al backend (servidor) la lista de clientes a través de la API. No importa que uno sea JavaScript en el navegador y el otro Node.js en Railway — la API define cómo se comunican.

---

### 2. REST / REST (Representational State Transfer)

**En español:** Transferencia de Estado Representacional

REST es un estilo de arquitectura para construir APIs. Una API REST usa HTTP como protocolo y sigue estas reglas:

- Cada recurso tiene su propia URL (ej: `/api/clients`, `/api/tasks`)
- Las operaciones se expresan con métodos HTTP (GET, POST, PUT, DELETE)
- Las respuestas son stateless — cada request contiene toda la información necesaria, el servidor no recuerda requests anteriores
- Las respuestas generalmente son en formato JSON

RemindFlow es una API REST.

---

### 3. Endpoint / Endpoint

**En español:** Punto de acceso, punto final

Un endpoint es una URL específica de la API que representa un recurso o una acción. Es la dirección exacta a la que envías un request.

**Ejemplos en RemindFlow:**
```
POST  /auth/login          → autenticación
GET   /api/clients         → lista de clientes
POST  /api/clients         → crear cliente
GET   /api/clients/:id     → obtener un cliente específico
PUT   /api/clients/:id     → actualizar un cliente
GET   /health              → estado del servidor
```

---

### 4. Request y Response / Petición y Respuesta

**Request (Petición):** lo que el cliente envía al servidor. Contiene:
- Método HTTP (GET, POST, etc.)
- URL del endpoint
- Headers (cabeceras)
- Body (cuerpo) — opcional según el método

**Response (Respuesta):** lo que el servidor devuelve. Contiene:
- Status code (código de estado)
- Headers de respuesta
- Body con los datos (generalmente JSON)

---

### 5. Métodos HTTP / HTTP Methods

Los métodos HTTP definen qué tipo de operación quieres realizar sobre un recurso.

| Método | Para qué sirve | Status esperado | ¿Tiene Body? |
|--------|---------------|-----------------|--------------|
| **GET** | Obtener datos — no modifica nada | 200 OK | No |
| **POST** | Crear un recurso nuevo | 201 Created | Sí |
| **PUT** | Reemplazar un recurso completo | 200 OK | Sí |
| **PATCH** | Modificar campos específicos de un recurso | 200 OK | Sí |
| **DELETE** | Eliminar un recurso | 200 o 204 | No |

**Diferencia entre PUT y PATCH:**
- PUT reemplaza el recurso completo — si no envías un campo, se borra
- PATCH modifica solo los campos que envías — el resto queda igual

RemindFlow usa PUT para actualizar clientes.

---

### 6. Status Codes / Códigos de Estado HTTP

El servidor siempre responde con un código de 3 dígitos que indica el resultado de la operación.

| Código | Nombre | Qué significa |
|--------|--------|---------------|
| **200** | OK | Operación exitosa — usado en GET y PUT |
| **201** | Created | Recurso creado exitosamente — usado en POST |
| **400** | Bad Request | El request tiene errores — datos mal formados o campos faltantes |
| **401** | Unauthorized | No autenticado — falta token o el token es inválido |
| **403** | Forbidden | Autenticado pero sin permisos — el token existe pero el rol no alcanza |
| **404** | Not Found | El recurso no existe — id inexistente |
| **409** | Conflict | Conflicto — por ejemplo, crear un recurso duplicado |
| **500** | Internal Server Error | Error en el servidor — bug en el backend |

**Diferencia clave entre 401 y 403:**
- 401: no sé quién eres → autentícate
- 403: sé quién eres pero no tienes permiso → acceso denegado

---

### 7. Body vs Header / Cuerpo vs Cabecera

**Header (Cabecera):**
Metadata del request — información sobre *cómo* debe procesarse, no sobre *qué* se procesa. El token de autenticación va aquí porque es una credencial, no un dato del negocio.

```
Authorization: Bearer eyJhbGci...
Content-Type: application/json
```

**Body (Cuerpo):**
El contenido del request — los datos del negocio que envías para crear o modificar algo.

```json
{
    "name": "Cliente Test",
    "email": "test@gmail.com",
    "waPhone": "+56912345678"
}
```

**Regla:** el token JWT siempre va en el header `Authorization` como Bearer Token — nunca en el body.

---

### 8. UUID / UUID (Universally Unique Identifier)

**En español:** Identificador Único Universal

Un UUID es un identificador generado automáticamente que garantiza unicidad global. Se ve así:

```
d18752ef-f2ad-4185-a38e-e72cd7429bbc
```

32 caracteres hexadecimales divididos en 5 grupos por guiones. La probabilidad de que dos UUIDs sean iguales es prácticamente cero, incluso si los generan sistemas distintos al mismo tiempo.

RemindFlow usa UUIDs como `id` de cada entidad: clientes, tareas, mensajes.

---

### 9. Response Time / Tiempo de Respuesta

El tiempo que tarda el servidor en responder desde que recibe el request hasta que devuelve el response. Se mide en milisegundos (ms).

**Estándar mínimo:** menos de 2000ms (2 segundos) para operaciones normales.

En Postman se accede con:
```javascript
pm.expect(pm.response.responseTime).to.be.below(2000);
```

El response time es una métrica básica de performance. Si un endpoint tarda consistentemente más de 2 segundos, es una señal de problema en el servidor o la base de datos.

---

## Bloque 2 — Conceptos de API Testing

### 10. Contrato de API / API Contract

Una API es un contrato entre sistemas. Ese contrato define:
- Qué endpoints existen
- Qué datos acepta cada uno (formato, campos obligatorios)
- Qué devuelve en cada caso (status code, estructura del response)
- Cómo se comporta ante inputs inválidos

**Testear una API es validar que ese contrato se cumple.** Si el contrato dice que POST /api/clients devuelve 201 con el objeto creado, el test verifica exactamente eso.

**Frase para entrevista:**
> *"En API testing valido el contrato — status code correcto, estructura de datos esperada, comportamiento ante inputs inválidos."*

---

### 11. Casos positivos vs Casos negativos / Happy Path vs Negative Cases

**Caso positivo (Happy Path):** el flujo que debería funcionar — datos válidos, token correcto, recurso existente.

**Caso negativo:** todo lo que no debería funcionar — sin token, token inválido, datos faltantes, recurso inexistente.

Un QA profesional siempre cubre ambos. Los casos negativos son igual de importantes que los positivos — a veces más, porque revelan cómo el sistema maneja los errores.

**Ejemplos de casos negativos sobre /api/clients:**
- POST sin token → 401 esperado
- POST con token inválido → 401 esperado
- POST con campos obligatorios vacíos → 400 esperado
- GET de cliente inexistente → 404 esperado

---

### 12. Datos de prueba en producción / Test Data in Production

Riesgo: cuando ejecutas tests que crean, modifican o eliminan datos directamente en el ambiente de producción, esos datos conviven con los datos reales.

**Problema identificado en RemindFlow:** no existe ambiente de staging separado. Los tests de la Sesión 2 crearon clientes de prueba en la base de datos real.

**Mitigación:** ejecutar DELETE al final de cada sesión para limpiar los registros creados durante el testing.

**Solución ideal a futuro:** ambiente de staging separado con datos de prueba propios.

---

## Bloque 3 — Postman

### 13. Environment / Variables de Entorno

Un environment en Postman es un conjunto de variables que definen la configuración de un ambiente específico. Permiten separar la configuración del comportamiento.

**Principio clave:** los requests no cambian — solo cambia el ambiente donde se ejecutan.

```
RemindFlow Producción → base_url = https://remindflow-production.up.railway.app
RemindFlow Local      → base_url = http://localhost:3000
```

Con un clic cambias de ambiente sin tocar ningún request.

**Frase para entrevista:**
> *"Uso variables de entorno para separar la configuración del comportamiento. Los requests no cambian — solo cambia el ambiente donde se ejecutan."*

---

### 14. `{{variable}}` — Sintaxis de Variables / Variable Syntax

En Postman, `{{nombre}}` es la sintaxis para referenciar una variable de entorno. Postman reemplaza el placeholder por el valor real antes de enviar el request.

```
URL:    {{base_url}}/api/clients
Header: Bearer {{token}}
```

Cuando la variable está resuelta correctamente, aparece en **naranja** en Postman. Si aparece como texto plano sin color, la variable está vacía o el environment no está activo.

---

### 15. Assertion / Test (Post-response Script)

Un assertion es una verificación automática que Postman ejecuta después de recibir el response. Se escribe en JavaScript en la pestaña **Post-response**.

Si la condición se cumple → test en verde.
Si no se cumple → test en rojo.

**Estructura básica:**
```javascript
pm.test("Nombre del test", function() {
    // verificación aquí
});
```

Sin assertions, Postman solo muestra el response — tú lo lees con los ojos. Con assertions, Postman verifica solo. Esa es la diferencia entre *usar Postman* y *hacer API testing profesional*.

---

### 16. Pre-request Script / Script Pre-petición

Script JavaScript que Postman ejecuta **antes** de enviar el request. Sirve para preparar datos — verificar que una variable existe, generar un valor dinámico, o renovar un token automáticamente.

```javascript
const token = pm.environment.get("token");
if (!token) {
    console.log("Sin token — ejecuta login primero");
}
```

---

### 17. Post-response Script / Script Post-respuesta

Script JavaScript que Postman ejecuta **después** de recibir el response. Aquí van los assertions y las acciones sobre variables.

Antes se llamaba pestaña **Tests**. En versiones recientes de Postman se llama **Post-response**.

---

### 18. Bearer Token / Token de Portador

Mecanismo estándar para enviar credenciales de autenticación en una API REST. El token JWT se incluye en el header `Authorization` con el prefijo `Bearer`.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
```

El servidor lee este header primero, antes de procesar el body. Si el token no está o es inválido, rechaza el request con 401 sin mirar el body.

**Por qué va en el header y no en el body:** el token es metadata de autenticación, no un dato del negocio.

---

### 19. Request Chaining / Encadenamiento de Requests

Patrón donde la respuesta de un request se convierte en la entrada del siguiente. Elimina la necesidad de copiar y pegar datos manualmente entre requests.

**Ejemplo en RemindFlow:**
```
POST /api/clients  →  guarda clienteId  →  GET /api/clients/{{clienteId}}
                                        →  PUT /api/clients/{{clienteId}}
                                        →  assertions validan {{clienteId}}
```

El POST guarda el id generado como variable de entorno. Los requests siguientes lo consumen automáticamente.

**Frase para entrevista:**
> *"Uso encadenamiento de requests en Postman — el POST guarda el id generado como variable de entorno, y los requests siguientes lo consumen automáticamente sin intervención manual."*

---

### 20. `pm.environment.set` y `pm.environment.get`

**`pm.environment.set("nombre", valor)`**
Guarda un valor en el environment activo. Se ejecuta en el Post-response script después de recibir el response.

```javascript
pm.environment.set("token", json.token);      // guarda el token del login
pm.environment.set("clienteId", json.id);     // guarda el id del cliente creado
```

**`pm.environment.get("nombre")`**
Recupera un valor del environment activo. Se usa en assertions para comparar.

```javascript
pm.expect(json.id).to.equal(pm.environment.get("clienteId"));
```

---

### 22. Casos positivos vs Casos negativos / Happy Path vs Negative Cases

**Caso positivo (Happy Path):** el flujo que debería funcionar — datos válidos, token correcto, recurso existente.

**Caso negativo:** todo lo que no debería funcionar — sin token, token inválido, datos faltantes, recurso inexistente.

Un QA profesional siempre cubre ambos. Los casos negativos son donde principalmente habitan los defectos — es donde los desarrolladores generalmente no colocan el foco.

En APIs, los casos negativos son simultáneamente testing funcional y security testing. Un servidor que no maneja correctamente los errores puede exponer stack traces, rutas internas o estructura de la base de datos.

---

### 23. Testear comportamiento, no redacción / Test Behaviour, Not Wording

Los assertions deben validar status codes y estructura del response — no el texto exacto de los mensajes de error.

**Incorrecto:**
```javascript
pm.expect(json.error).to.equal("No autorizado. Inicia sesión o incluye X-API-Key.");
```

**Correcto:**
```javascript
pm.expect(json.error).to.be.a('string');
```

El texto de un mensaje puede cambiar sin que el comportamiento cambie. Si el test está acoplado al texto, falla por razones irrelevantes.

---

### 24. Pre-request Script a nivel de colección / Collection-level Pre-request Script

Script que se ejecuta automáticamente antes de cada request de la colección. Resuelve el problema de la dependencia manual del login.

Sin pre-request script: el usuario debe recordar ejecutar el login antes de cada sesión. Si lo olvida, todos los requests fallan con 401.

Con pre-request script: la colección verifica automáticamente si el token existe antes de cada request. La colección se vuelve autosuficiente.

```javascript
const token = pm.environment.get("token");
if (!token) {
    console.log("Sin token — se requiere ejecutar login primero");
}
```

---

### 21. `pm.response.json()`

Convierte el response body de texto plano a un objeto JavaScript. Necesario para acceder a los campos individuales del JSON.

```javascript
const json = pm.response.json();
// Ahora puedes acceder a:
json.token      // el token JWT
json.id         // el id del recurso
json.name       // el nombre
json.expiresIn  // el tiempo de expiración declarado
```

Sin esta conversión, el response es solo texto y no puedes acceder a campos individuales.

---

## Referencia rápida — Frases para entrevista

| Concepto | Frase |
|----------|-------|
| API Testing | *"En API testing valido el contrato — status code correcto, estructura de datos esperada, comportamiento ante inputs inválidos."* |
| POST vs GET | *"En un POST espero 201, no 200 — son distintos y ambos válidos según contexto."* |
| Persistencia | *"Siempre hago un GET después del POST para confirmar que el dato se persistió correctamente."* |
| Variables de entorno | *"Uso variables de entorno para separar la configuración del comportamiento. Los requests no cambian — solo cambia el ambiente."* |
| Bearer Token | *"El token JWT se envía en el header Authorization como Bearer Token — es metadata de autenticación, no un dato del negocio."* |
| Encadenamiento | *"Uso encadenamiento de requests — el POST guarda el id generado como variable, y los requests siguientes lo consumen automáticamente."* |
| Casos negativos | *"Los casos negativos son donde principalmente habitan los defectos — es donde los desarrolladores generalmente no colocan el foco."* |
| Assertions | *"Mis assertions validan comportamiento, no redaccion — status codes y estructura del response, no el texto exacto de los mensajes."* |
| Collection Runner / Newman | *"Mis colecciones de Postman se pueden ejecutar con Newman desde linea de comandos, lo que permite integrarlas en un pipeline CI/CD — cada deploy valida automaticamente que la API cumple su contrato."* |
| Coleccion autonoma | *"Mis colecciones estan disenadas para ejecutarse de forma autonoma — crean los datos que necesitan, los validan, y los limpian al terminar."* |

### 26. Collection Runner / Ejecutor de Colecciones

Herramienta de Postman que ejecuta todos los requests seleccionados en orden automatico, con sus assertions, sin intervencion manual.

Permite simular lo que haria Newman en un pipeline CI/CD — verificar que toda la coleccion funciona de principio a fin en una sola ejecucion.

**Configuracion basica:**
- Seleccionar los requests a ejecutar y su orden
- Definir numero de iteraciones
- Desactivar "Stop run if an error occurs" para ver el reporte completo

**Por que importa:** una coleccion que pasa el Collection Runner demuestra que el flujo completo funciona — no solo requests individuales.

---

### 27. CI/CD (Continuous Integration / Continuous Delivery)

**En español:** Integracion Continua / Entrega Continua

Practica de desarrollo donde cada vez que un desarrollador sube codigo al repositorio, el sistema ejecuta automaticamente una serie de pasos de validacion sin intervencion manual.

**Flujo tipico:**
```
Desarrollador sube codigo a GitHub
        ↓
CI/CD se activa automaticamente
        ↓
Compila el codigo
        ↓
Ejecuta tests unitarios
        ↓
Ejecuta tests de API con Newman
        ↓
Ejecuta tests E2E con Playwright
        ↓
Si todo pasa → despliega a produccion
Si algo falla → notifica al equipo y bloquea el deploy
```

**Herramientas mas comunes:**

| Herramienta | Uso principal |
|---|---|
| GitHub Actions | Directamente en GitHub — la mas comun hoy |
| Azure DevOps | Microsoft — muy usado en banca y enterprise |
| Jenkins | On-premise — legacy pero muy presente |
| GitLab CI | Alternativa a GitHub |

RemindFlow ya usa GitHub Actions para Playwright. Newman es el siguiente paso natural para integrar la coleccion Postman al pipeline.

**Frase para entrevista:**
> *"Mis colecciones de Postman se pueden ejecutar con Newman desde linea de comandos, lo que permite integrarlas en un pipeline CI/CD — cada deploy valida automaticamente que la API cumple su contrato."*

---

### 28. Newman / Newman

Version de linea de comandos de Postman. Permite ejecutar colecciones fuera de la interfaz grafica, desde una terminal o un pipeline CI/CD.

```bash
newman run RemindFlow_API.postman_collection.json \
  -e RemindFlow_Produccion.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

En un pipeline CI/CD, ese comando se ejecuta automaticamente en cada deploy. Si algun assertion falla, el pipeline se detiene y el codigo no llega a produccion.

**Por que importa para el portafolio:** poder decir que tus colecciones son ejecutables con Newman demuestra madurez tecnica — no solo sabes usar Postman, sabes integrarlo en un flujo de entrega continua.

---

### 29. Verificacion de persistencia negativa / Negative Persistence Verification

Patron de testing que verifica que un recurso eliminado efectivamente no existe.

Despues de ejecutar un DELETE, se ejecuta un GET por el mismo id esperando un 404. Si el GET devuelve 200, el DELETE fallo silenciosamente.

```
DELETE /api/clients/{{clienteId}}  →  200 esperado
GET    /api/clients/{{clienteId}}  →  404 esperado ← verificacion de persistencia negativa
```

Sin esta verificacion, un DELETE que aparentemente funciona podria estar fallando sin que nadie lo note.

### 30. Cobertura de API / API Coverage

Principio QA estandar: todo endpoint de una API debe tener cobertura de tests, no solo los que parecen mas importantes.

La pregunta que un QA Senior debe responder siempre es:
> *"¿Que pasa si este endpoint falla en produccion? ¿Lo detectamos antes que el cliente?"*

Si la respuesta es no — necesita tests.

---

### 31. Flujos de multiples pasos / Multi-step Flows

Flujos donde una operacion de negocio requiere varios requests en secuencia. Cada request depende del resultado del anterior.

**Ejemplo en firma electronica (ESign):**
```
POST iniciar firma
        ↓
POST validar identidad  (usa el id de la firma)
        ↓
POST firmar documento   (usa el id de validacion)
        ↓
GET confirmar firma     (verifica el estado final)
```

Esto es encadenamiento de requests avanzado — el mismo principio que clienteId en RemindFlow, pero con mas pasos y logica de negocio compleja.

**Por que importa:** empresas como ESign Latam tienen negocios 100% API-driven donde todos sus productos se consumen via API. Un QA debe entender y testear flujos completos, no endpoints aislados.

---

### 32. Entorno regulado / Regulated Environment

Entorno donde la empresa tiene certificaciones de calidad y seguridad que imponen requisitos formales al proceso QA.

**Certificaciones relevantes:**
- **ISO 9001** — gestion de calidad. Los procesos deben estar documentados y ser trazables
- **ISO 27001** — seguridad de la informacion. Los datos sensibles deben estar protegidos y auditados

**Implicaciones para QA:**
- Los hallazgos deben documentarse formalmente
- Los tests deben ser trazables a requisitos
- La seguridad de la API es tan importante como la funcionalidad
- Similar a banca — los errores tienen impacto regulatorio real

---

### 33. IA aplicada a QA / AI applied to QA

Uso de herramientas de inteligencia artificial para potenciar el trabajo del QA — no para reemplazar el criterio profesional, sino para acelerar y mejorar la cobertura.

**Casos de uso concretos:**
- Generar assertions de Postman a partir de documentacion de API
- Identificar casos borde que el analisis manual podria omitir
- Documentar hallazgos de seguridad automaticamente
- Analizar logs y detectar anomalias
- Generar casos de prueba negativos desde especificaciones

**Frase para entrevista:**
> *"Uso IA para generar assertions desde documentacion de API, identificar casos borde que se escapan del analisis manual, y documentar hallazgos de seguridad automaticamente — no para reemplazar el criterio QA, sino para acelerar."*

---

---

### 34. PATCH vs PUT — Diferencia practica

**PUT — reemplazo completo**
Envias el recurso completo. Lo que no envias se borra o resetea. Equivale a un UPDATE de todos los campos de la tabla.

**PATCH — modificacion parcial**
Envias solo los campos que quieres cambiar. Lo que no envias queda intacto. Equivale a un UPDATE de uno o mas campos especificos.

**Regla de oro:**
- PUT = UPDATE de todos los campos de la tabla
- PATCH = UPDATE de uno o mas campos especificos

---

### 35. Bearer Token — Como funciona

Bearer es un esquema de autenticacion estandar de HTTP. Significa "portador" — quien porta el token tiene acceso.

El servidor lee el header Authorization antes de procesar cualquier otra cosa:
- Token ausente → 401
- Token invalido → 401
- Token valido → procesa el request

**Regla 26 — La palabra Bearer es parte del estandar, no decoracion**
Sin el prefijo `Bearer ` el servidor no reconoce el token. El espacio entre Bearer y el token es obligatorio.

---

### 36. JSON (JavaScript Object Notation)

Formato estandar para intercambio de datos en APIs REST. Texto plano estructurado en pares clave-valor. En Postman: Body → raw → JSON.

---

### 37. Lectura de Swagger para construir requests

Proceso para construir un request en Postman a partir de documentacion Swagger:

1. **Metodo HTTP** — primera palabra del endpoint
2. **URL** — `{{base_url}}` + path, reemplazando `{id}` por `{{variableId}}`
3. **Headers** — si requiere autenticacion: `Authorization: Bearer {{token}}`
4. **Body** — campos requeridos, tipos y valores validos
5. **Casos de prueba** — caso positivo por cada valor valido + casos negativos: campo faltante, valor invalido, sin token, id inexistente

---

### 25. Nomenclatura de requests / Request Naming Convention

Convencion definida para la coleccion RemindFlow API v4.3:

```
METODO + Descripcion de la accion
```

**Reglas:**
- Siempre el metodo HTTP primero en mayusculas: GET, POST, PUT, DELETE
- Sin acentos ni caracteres especiales — pueden causar problemas de encoding al exportar como JSON y ejecutar con Newman en Linux
- Descripcion clara y especifica de la accion

**Ejemplos correctos:**
```
GET Listar Clientes
POST Crear Cliente
GET Obtener Cliente por ID
PUT Actualizar Cliente
POST Sin Token
POST Token Invalido
POST Campos Vacios
GET Cliente Inexistente
```

**Por que importa:** en una coleccion de 20+ requests, un nombre claro permite entender el proposito del request sin abrirlo. Facilita el mantenimiento, la revision en code review, y la lectura de reportes de Newman.

---

## Bloque 5 — Reglas y principios QA

Reglas identificadas durante las sesiones de practica. Cada una resume un principio que aplica en el trabajo diario y en entrevistas.

### Regla 1 — Separacion de configuracion y comportamiento
Usa variables de entorno para separar la configuracion del comportamiento. Los requests no cambian — solo cambia el ambiente donde se ejecutan.

### Regla 2 — Token independiente por ambiente
El token debe estar en ambos environments pero con valor vacio inicialmente. Cada ambiente maneja su propio token de forma independiente — el de Produccion no contamina el de Local.

### Regla 3 — Separar verificacion de accion en scripts
Lo ideal es separar el pm.expect del pm.environment.set — uno verifica, el otro actua. Mezclarlos en el mismo pm.test no es del todo correcto aunque funcione.

### Regla 4 — 201 para creacion, 200 para consulta
En un POST espero 201, no 200 — son distintos y ambos validos segun contexto. 201 significa que se creo un recurso nuevo. 200 significa que la operacion fue exitosa pero no necesariamente creo algo.

### Regla 5 — Verificar persistencia despues de un POST
Siempre hacer un GET despues del POST para confirmar que el dato se persistio correctamente en la base de datos.

### Regla 6 — El id no debe cambiar en un PUT
El id es la identidad del registro. Si cambia en un PUT, el sistema pierde la referencia — cualquier entidad asociada queda huerfana apuntando a un id que ya no existe.

### Regla 7 — GET por id devuelve objeto, no array
GET /recurso devuelve array. GET /recurso/:id devuelve objeto unico. Si devuelve array, hay un bug en el backend.

### Regla 8 — Testear comportamiento, no redaccion
Los assertions validan status codes y estructura del response, no el texto exacto de los mensajes de error. El texto puede cambiar sin que el comportamiento cambie.

### Regla 9 — 401 vs 403
- 401: no se quien eres → autenticate
- 403: se quien eres pero no tienes permiso → acceso denegado

### Regla 10 — Separar casos negativos distintos
Sin token y token invalido son dos vectores distintos — el servidor los detecta con logica diferente. Se testean por separado.

### Regla 11 — UUID valido para testear 404
Usar UUID con formato valido pero inexistente para testear 404. Texto basura podria devolver 400 antes de buscar en la base de datos, mezclando dos casos distintos en un solo request.

### Regla 12 — Coleccion autosuficiente
Una coleccion profesional no depende de que el usuario recuerde ejecutar el login. El pre-request script verifica automaticamente si el token existe antes de cada request.

### Regla 13 — Verificacion de persistencia negativa
Despues de un DELETE, ejecutar un GET esperando 404. Si devuelve 200, el DELETE fallo silenciosamente sin que nadie lo note.

### Regla 14 — Sin acentos en nombres tecnicos
Evitar acentos y caracteres especiales en nombres de requests y archivos — pueden causar problemas de encoding al exportar como JSON y ejecutar con Newman en Linux.

### Regla 15 — Nomenclatura de requests
METODO + Descripcion sin acentos. El metodo HTTP siempre primero en mayusculas. Ejemplo: GET Listar Clientes, POST Crear Cliente, DELETE Eliminar Cliente.

### Regla 16 — Valores de estado vs mensajes descriptivos
- Valores de estado predefinidos como "ok" → validar exacto con .to.equal()
- Mensajes descriptivos para humanos → validar solo que existe con .to.be.a('string')

### Regla 17 — Token JWT en header, nunca en body
El token JWT siempre va en el header Authorization como Bearer Token. Es metadata de autenticacion, no un dato del negocio. El servidor lee el header primero — si el token no esta o es invalido, rechaza el request con 401 sin mirar el body.

### Regla 18 — Validar el dato relevante, no el formato completo
En fechas y timestamps, valida la parte que importa con `.to.include()` en lugar del valor completo con `.to.equal()`. El formato puede variar sin que el dato cambie.

```javascript
// Fragil — falla si cambia el formato de hora o timezone
pm.expect(json.due).to.equal("2026-07-01T10:00:00.000Z");

// Correcto — valida lo que importa
pm.expect(json.due).to.include("2026-07-01");
```
El token JWT siempre va en el header Authorization como Bearer Token. Es metadata de autenticacion, no un dato del negocio.

### Regla 19 — Eliminar hijos antes que el padre
En APIs con relaciones entre entidades, siempre eliminar las entidades dependientes antes que la entidad padre. El orden incorrecto genera error 500 por restriccion de clave foranea.

```
DELETE Eliminar Tarea    →  primero (hijo)
DELETE Eliminar Cliente  →  segundo (padre)
```

### Regla 20 — Un 500 con mensaje tecnico es un hallazgo
Si el servidor devuelve 500 con un mensaje interno como "FOREIGN KEY constraint failed", es un hallazgo de calidad. El servidor deberia capturar ese error y devolver 409 Conflict con un mensaje claro para el consumidor de la API.

### Regla 21 — La coleccion exportada a GitHub es portafolio
Una coleccion de Postman publicada en GitHub demuestra trabajo real. Cualquier reclutador o gerente tecnico puede importarla y ejecutarla. Es evidencia concreta, no solo una declaracion en el CV.

### Regla 22 — Initial Value vs Current Value en Postman
El Initial Value se exporta y se comparte con el equipo o con Newman. El Current Value es local y privado — no se exporta. Para que Newman funcione correctamente, el Initial Value debe estar configurado con el valor real.

### Regla 23 — El login debe ser el primer request en ejecutarse
En una coleccion automatizada con Newman, el request de autenticacion debe ejecutarse antes que cualquier request protegido. Si el login esta en el medio o al final, todos los requests anteriores fallan con 401.

### Regla 24 — Analisis de fallos en Newman: primero el orden, luego el bug
Cuando un test falla en Newman por un status code inesperado, la primera pregunta es: ¿el request depende de un estado que todavia no se creo, o que ya se destruyo? El 80% de los fallos en colecciones automatizadas son problemas de orden, no bugs reales.

### Regla 25 — La carpeta Limpieza va siempre al final
Los requests de limpieza (DELETE de entidades padre e hijo) deben estar en una carpeta dedicada al final de la coleccion. Esto garantiza que los datos de prueba se eliminan despues de todas las validaciones, no antes.

---

*Documento vivo — se actualiza con cada sesion de practica.*
*RemindFlow v4.3.0 — Alejandro Soto Maturana — Mayo 2026*

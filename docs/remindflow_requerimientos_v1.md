RemindFlow — Documento de Requerimientos
Versión: 1.0
Fecha: 13 mayo 2026
Autor: Alejandro Soto Maturana
Estado: Baseline oficial

1. Descripción del sistema
RemindFlow es un CRM especializado para community managers. Permite gestionar clientes, documentar acuerdos de contenido, hacer seguimiento de cada pieza desde que se acuerda hasta que se publica, enviar recordatorios automáticos por email y WhatsApp, y mantener un historial completo de toda la actividad.
Usuario: Un único administrador (el community manager).
Clientes del negocio: No acceden al sistema. Solo reciben comunicaciones por email o WhatsApp.
Problema que resuelve: Sin RemindFlow, todos los recordatorios y el seguimiento de contenido se hacen de forma manual, dependiendo completamente de la memoria del community manager.

2. Modelo de datos central
La jerarquía central del sistema es:
Propuesta (contrato comercial)
└── Acuerdo de contenido (único por propuesta)
    └── Piezas de contenido (unidades de trabajo)
        └── Publicaciones (evidencia de publicación)
Relaciones clave

Una Propuesta pertenece a un Cliente y contiene un único Acuerdo de contenido.
Un Acuerdo define el total mensual de publicaciones y su distribución semanal.
Una Pieza de contenido pertenece a un Acuerdo y representa un material específico a producir y publicar.
Una Publicación pertenece a una Pieza de contenido y registra la evidencia de que fue publicada. Una misma pieza puede originar múltiples publicaciones (ej. un video publicado como Reel y como Historia).


3. Requerimientos por módulo

3.1 Clientes
Descripción: Registro de los clientes que contratan el servicio de community management.
Campos obligatorios:

Nombre / Empresa
Email principal
Al menos un canal de contacto configurado (WhatsApp o email)

Campos opcionales:

Notas generales
WhatsApp: número con código de país, nombre en WA, notas WA
Instagram: usuario (@), link del perfil, teléfono vinculado, notas IG
Facebook: nombre de página, link del perfil, teléfono vinculado, notas FB
TikTok: usuario (@), link del perfil, teléfono vinculado, notas TT

Reglas de negocio:

No se puede guardar un cliente sin al menos un canal de contacto configurado (WhatsApp o email). Sin canal de contacto el sistema no puede enviar recordatorios.
YouTube no es una plataforma soportada y no debe aparecer en ningún dropdown del sistema.

Operaciones disponibles: Crear, editar, eliminar.
Estado: Operativo.

3.2 Propuestas
Descripción: Contrato comercial entre el community manager y el cliente. Define el valor económico, duración y condiciones generales del servicio.
Campos obligatorios:

Cliente
Nombre del plan / propuesta
Valor mensual (CLP)
Duración del contrato (meses)

Campos opcionales:

Moneda
Plataformas incluidas (Instagram, Facebook, TikTok — sin YouTube)
Tipos de contenido incluidos (Foto, Video, Reel, Historia, Texto)
Fecha de envío de propuesta
Fecha de revisión
Fecha de aprobación
Fecha de puesta en marcha
Condiciones adicionales
Comentarios
Notas internas (solo visibles para el administrador)

Reglas de negocio:

Una propuesta contiene un único Acuerdo de contenido.
El costo del servicio debe quedar registrado en la Propuesta — no en el Acuerdo.
YouTube no debe aparecer en el selector de plataformas.

Estado: Operativo con inconsistencias — ver sección 4.

3.3 Acuerdos de contenido
Descripción: Define el detalle operacional del servicio contratado — cuántas publicaciones, de qué tipo y con qué frecuencia. Es una subentidad de la Propuesta.
Campos obligatorios:

Propuesta asociada
Total de publicaciones mensuales (debe ser mayor a cero)
Distribución semanal (publicaciones por semana)

Campos opcionales:

Tipos de contenido acordados (Foto, Video, Reel, Historia, Texto)
Notas del acuerdo

Reglas de negocio:

El total mensual debe ser mayor a cero. Un acuerdo con cero publicaciones no es un acuerdo válido.
La distribución semanal debe ser coherente con el total mensual: frecuencia semanal × 4 no debe superar el total mensual. El sistema debe validar esto y bloquear el guardado si hay inconsistencia.
Un acuerdo pertenece a una única Propuesta.
Los campos de cantidad diaria y semanal independientes se eliminan — solo existe total mensual y distribución semanal.

Estado: Operativo con inconsistencias — ver sección 4.

3.4 Piezas de contenido
Descripción: Unidad de trabajo real. Representa un material específico (foto, video, reel, etc.) que el cliente provee y que el community manager gestiona hasta su publicación.
Campos obligatorios:

Acuerdo asociado
Nombre del contenido
Tipo de contenido
Estado

Campos opcionales:

Red social destino
Fecha compromiso
Descripción / notas (hashtags, referencias, notas de producción)
Respuesta del cliente

Tipos de contenido válidos:
TipoDescripciónFotoImagen estática para publicación en feedVideoVideo de formato largo para feedReelVideo corto vertical, formato Reel de Instagram/TikTokHistoriaContenido efímero — desaparece en 24 horasTextoPublicación solo de textoOtroFormato no clasificado en las categorías anteriores
Estados válidos y su significado:
EstadoSignificadoAcordadoLa pieza fue acordada con el cliente pero aún no se ha producidoRecordatorio enviadoSe envió un recordatorio al cliente solicitando el materialCliente respondióEl cliente confirmó o envió una respuestaEn producciónEl material fue recibido y está siendo editado o preparadoEntregadoEl contenido fue entregado al cliente para revisiónPublicadoEl contenido fue publicado en la red social correspondiente
Reglas de negocio:

Una pieza siempre pertenece a un Acuerdo. No pueden existir piezas huérfanas.
Una misma pieza puede originar múltiples Publicaciones (ej. el mismo video publicado como Reel y como Historia).
El material físico (video, foto) no se almacena en el sistema. Solo se registra metadata: nombre, tipo, fecha de recepción, descripción breve y nota de ubicación del archivo real (ej. OneDrive, WhatsApp).
YouTube no debe aparecer en el selector de red social.

Estado: Operativo con inconsistencias — ver sección 4.

3.5 Publicaciones
Descripción: Registro de evidencia de que una pieza de contenido fue efectivamente publicada en una red social.
Campos obligatorios:

Cliente
Plataforma
Tipo de contenido
Fecha y hora de publicación
Pieza de contenido vinculada

Campos opcionales:

URL del post
Caption / copy del post
Notas internas

Reglas de negocio:

Toda publicación debe estar vinculada a una Pieza de contenido. No pueden existir publicaciones huérfanas.
Una misma Pieza de contenido puede tener múltiples Publicaciones asociadas.
YouTube no debe aparecer en el selector de plataforma.

Estado: Operativo con inconsistencias — ver sección 4.

3.6 Mensajes (Recordatorios)
Descripción: Módulo para enviar recordatorios al cliente por Gmail o WhatsApp, de forma inmediata o programada, con opción de repetición.
Canales disponibles: Gmail, WhatsApp (Twilio).
Campos obligatorios:

Cliente destinatario
Canal (Gmail o WhatsApp)
Mensaje
Fecha y hora de envío (para envíos programados)

Campos opcionales:

Tipo de contenido asociado
Nombre del contenido
Red social destino
Repetición (Sin repetir, Diario, Lun-Vie, Fin de semana, Semanal, Personalizado)

Plantillas disponibles:

Crear contenido
Enviar contenido
Descripción
Aprobación
Seguimiento

Reglas de negocio:

El uso real actual es solo para recordatorios del tipo "necesito el material de esta semana". Las demás plantillas están disponibles pero no tienen uso activo.
El mensaje es genérico por cliente y tipo de contenido — no se asocia a una pieza específica porque al momento del recordatorio el material aún no existe.
Los envíos programados son procesados por el scheduler cada 60 segundos.
El sistema no reintenta mensajes fallidos automáticamente. Un mensaje en estado 'failed' permanece así hasta intervención manual.
El rate limiter del sistema es de 120 peticiones por minuto por IP — suites de pruebas intensivas pueden alcanzar este límite.

Vistas disponibles:

Enviar: formulario de envío inmediato o programado
Programados: cola de mensajes pendientes con indicador de repetición
Historial: registro de mensajes enviados con opción de registrar respuesta manual
Calendario: vista temporal de todos los envíos

Estado: Parcialmente operativo — ver hallazgos técnicos sección 6.

3.7 Respuestas de clientes
Descripción: Registro manual de respuestas recibidas de los clientes por cualquier canal externo (WhatsApp, email, teléfono).
Campos obligatorios:

Cliente
Canal de respuesta
Fecha y hora de la respuesta
Contenido de la respuesta

Campos opcionales:

Pieza de contenido asociada

Reglas de negocio:

Las respuestas se registran manualmente por el community manager — no existe captura automática de respuestas entrantes en esta versión.
Una respuesta puede vincularse a una pieza de contenido específica para mantener trazabilidad del flujo de validación.

Estado: Operativo — desconectado lógicamente del flujo principal (ver sección 4).

3.8 Materiales audiovisuales
Descripción: Registro de metadata de los materiales enviados por los clientes.
Campos:

Cliente
Nombre del material
Tipo (imagen, video, PDF, otro)
Fecha de recepción
Descripción breve
Nota de ubicación del archivo real (OneDrive, WhatsApp, etc.)
Pieza de contenido asociada

Reglas de negocio:

El sistema NO almacena archivos físicos. Solo registra metadata.
El archivo real vive en un storage externo (OneDrive u otro) organizado por cliente.
La asociación a una pieza de contenido es obligatoria.

Estado: Rediseño pendiente — módulo actual suspendido.
Backlog futuro: Integración con OneDrive o Google Drive via API.

3.9 Credenciales de redes sociales
Descripción: Registro del tipo de acceso que el community manager tiene a las cuentas de redes sociales de cada cliente.
Campos:

Cliente
Plataforma
Tipo de acceso (Colaborador, Administrador, Acceso delegado, Otro)
Usuario / correo asociado
Notas (ej. "2FA activado", "acceso vía Business Manager")

Reglas de negocio:

El módulo NO almacena contraseñas bajo ninguna circunstancia.
El acceso real a las cuentas se gestiona directamente desde cada plataforma — el cliente agrega al community manager como colaborador o administrador.
En el futuro, la autenticación para publicación automática se hará via OAuth (Meta Graph API) — nunca con contraseñas almacenadas.

Estado: Rediseño pendiente — módulo actual (con campo contraseña) debe ser reemplazado.

3.10 Estadísticas
Descripción: Registro de métricas de rendimiento de las redes sociales de los clientes por período.
Campos:

Cliente
Plataforma
Período (fecha inicio — fecha fin)
Audiencia: seguidores totales, nuevos seguidores
Alcance: reach, impresiones
Interacciones: likes, comentarios, guardados, compartidos, vistas (reels/video), publicaciones del período
Notas opcionales

Estado — Fase 1 (actual): Registro manual — el community manager ingresa los datos manualmente.
Estado — Fase 2 (backlog): Integración automática con APIs de cada plataforma.

3.11 Dashboard
Descripción: Vista de control operacional diaria. Muestra el estado general del sistema de un vistazo.
Indicadores:

Clientes activos
Mensajes enviados
Respuestas
Contenido pendiente
Acuerdos activos
Envíos programados
Publicaciones del mes

Secciones:

Clientes con acuerdo activo
Contenido pendiente de entrega
Mensajes recientes
Última publicación registrada

Estado: Operativo.

3.12 Seguimiento general
Descripción: Vista consolidada del estado de todos los clientes y sus flujos de contenido.
Información por cliente:

Nombre y acuerdo activo
Mensajes enviados
Respuestas recibidas
Entregas (completadas / total acordado)
Acceso a detalle por cliente

Estado: Operativo.

3.13 Auditoría
Descripción: Log completo de todas las acciones realizadas en el sistema.
Información por registro:

Fecha y hora
Acción realizada
Entidad afectada
Cliente asociado
ID del registro

Filtros disponibles: Por cliente, por entidad, por tipo de acción.
Estado: Operativo.

4. Inconsistencias identificadas
Estas son inconsistencias del modelo actual que requieren corrección antes de poder usar el sistema de forma confiable.
#MóduloInconsistenciaImpactoI-01Propuestas / AcuerdosSon entidades paralelas e independientes sin relación padre-hijoNo hay forma de saber si lo acordado comercialmente coincide con lo que se está produciendoI-02AcuerdosCampos diario, semanal y mensual pueden ser contradictorios o todos en ceroLos recordatorios automáticos basados en acuerdo no son confiablesI-03ClientesSe puede guardar un cliente sin ningún canal de contactoEl scheduler falla silenciosamente al intentar enviar recordatoriosI-04PublicacionesLa vinculación a pieza de contenido es opcionalPérdida de trazabilidad del flujo completoI-05MaterialesLa vinculación a pieza de contenido es opcionalPérdida de trazabilidad del material recibidoI-06RespuestasNo están conectadas al flujo principal de piezas de contenidoEl registro de respuestas no actualiza el estado de la pieza asociadaI-07GeneralYouTube aparece en dropdowns de plataforma en múltiples módulosPlataforma no soportada genera confusión y datos incorrectosI-08SeguimientoMuestra el mismo cliente duplicado por tener acuerdos en distintas redesConsecuencia directa de I-01

5. Backlog de funcionalidades futuras
#FuncionalidadPrioridadDependenciaB-01Integración Meta Graph API — publicación automática en Instagram/FacebookAltaConfirmación del clienteB-02Integración OneDrive/Google Drive para almacenamiento de materialesMediaNingunaB-03Sistema multi-usuario con roles (administrador / viewer)MediaCrecimiento a más de un usuarioB-04Búsqueda en listas de clientes y publicacionesBajaNingunaB-05CI/CD con GitHub ActionsMediaNingunaB-06Estadísticas Fase 2 — integración automática con APIs de plataformasMediaB-01B-07Portal de validación de captions para clientesBajaCrecimiento a más de un clienteB-08Notificación automática al cliente cuando la publicación está listaBajaNingunaB-09Rediseño módulo Materiales con integración DriveMediaB-02

6. Hallazgos técnicos
Estos son bugs, riesgos y deuda técnica identificados durante el levantamiento.
#HallazgoSeveridadEstadoH-01Gmail no envía mensajes — el botón se queda pegado y no registra el intento en el log de auditoríaCríticaSin resolverH-02WhatsApp (Twilio sandbox) inactivo — requiere reactivación de la sandboxAltaSin resolverH-03JWT sin expiración — el token generado por /auth/login no tiene campo exp y el iat está en milisegundos en lugar de segundos. El token nunca expiraAltaSin resolverH-04Webhook Twilio sin validación de firma criptográfica — cualquier actor externo puede enviar peticiones falsas al endpointAltaSin resolverH-05Helmet CSP deshabilitado — deuda técnica conocida. El frontend usa JavaScript inlineMediaDeuda técnica aceptada temporalmenteH-06Módulo Credenciales almacena contraseñas de terceros — riesgo legal y de seguridadAltaRediseño pendiente (ver sección 3.9)H-07Registro tipo "task" en log de auditoría sin módulo visible en UI — posible código huérfano de versión anteriorBajaA investigarH-08Mensajes fallidos no tienen reintento automático — quedan en estado 'failed' indefinidamenteMediaDecisión de negocio pendiente

7. Decisiones de negocio cerradas
Registro de decisiones tomadas durante la sesión de levantamiento.
#TemaDecisiónD-01Frecuencia del acuerdoTotal mensual con distribución semanal. Validación: frecuencia semanal × 4 no puede superar total mensualD-02Campos obligatorios — ClientesAl menos un canal de contacto (WhatsApp o email) es obligatorioD-03Campos obligatorios — AcuerdosTotal mensual debe ser mayor a ceroD-04Campos obligatorios — PublicacionesPieza de contenido vinculada es obligatoriaD-05Módulo CredencialesRediseño como gestor de accesos — sin almacenamiento de contraseñasD-06Módulo MaterialesSolo metadata en esta versión — sin archivos físicosD-07Tipos de contenidoSe mantienen todos (Foto, Video, Reel, Historia, Texto, Otro) con definiciones clarasD-08Publicaciones múltiples por piezaUna pieza puede originar múltiples publicaciones de distintos tipos/plataformasD-09YouTubeEliminado de todos los dropdowns del sistemaD-10Flujo de validación de captionsExterno por WhatsApp en esta versión — el resultado se registra manualmente en Respuestas

RemindFlow v4.3.0 — Documento de Requerimientos v1.0 — Mayo 2026
Alejandro Soto Maturana

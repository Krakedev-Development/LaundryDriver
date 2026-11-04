# Revisión de lógica de negocio de LaundryDriver

LaundryDriver implementa un recorrido móvil entendible para el chofer: ejecutar una parada asignada, recoger, entregar custodia en planta y, cuando aplica, entregar al cliente. Sus reglas se ejecutan dentro del dispositivo y son útiles para prototipar la experiencia; requieren una autoridad compartida antes de operar con pedidos reales.

## Reglas que sí están implementadas

- La aplicación solo admite sesión `DRIVER`; filtra pedidos por `assignedDriverId`.
- Las transiciones del chofer verifican estado esperado, asignación y disponibilidad (`BREAK`/`OFFLINE` bloquean acciones).
- El conteo de recogida debe ser entero positivo y requiere marcar la revisión en la pantalla.
- La entrega a cliente requiere estado de llegada y nombre del receptor; la UI exige además casilla de confirmación.
- El inicio de entrega comprueba que el pedido tenga estado `PAGADO`.
- El precio por peso se calcula localmente a partir de libras, precio por libra, extras, promoción y descuento de membresía disponible en el catálogo móvil.
- La modalidad solo puede ser `HOME_HOME` o `HOME_STORE`; la recogida inicial siempre es domiciliaria.
- El estado, timeline, contador, mensajes y constancias se guardan en el almacén local propio de LaundryDriver.

## Hallazgos y decisiones pendientes

### 1. Custodia y código

`consume` valida el código únicamente si se proporciona. Los formularios permiten dejarlo vacío; entonces se consume la transferencia activa de todos modos. Además, el token QR y el código de respaldo se almacenan en el mismo estado editable en el dispositivo. Esto sirve para recorrer el prototipo, pero no prueba que la otra parte mostró un código.

**Definir:** si el escaneo/código será obligatorio en cada transferencia, qué actores autentican cada lado, cómo funciona sin conexión, cómo se evita repetición y qué datos quedan firmados en el servidor. Separar códigos de demostración de credenciales de custodia reales.

### 2. Autoridad de estado y concurrencia

El cliente local decide la transición y guarda snapshots completos en AsyncStorage. No existe control de versiones remoto, exclusión de dos dispositivos ni conciliación de cambios. El `DRIVER` local es una restricción de la UI/dominio empaquetado, no una frontera de seguridad frente a alguien que controla el dispositivo.

**Definir:** API transaccional como autoridad, control de versión/idempotencia, caducidad de sesión, sincronización offline y resolución de conflictos antes de activar operaciones reales.

### 3. Aprobación de precio y pago

La planta demo puede registrar peso y total, pero el chofer no puede aprobar cambios de precio ni registrar cobros desde la billetera. Para peso calculado, el flujo espera que el cliente confirme y pague por un canal externo no conectado. El importe calculado no se comunica a una aplicación cliente mediante backend.

**Definir:** quién registra peso certificado, cómo se notifica y aprueba un ajuste, tiempo máximo de respuesta, política de rechazo y qué ocurre con las prendas ya recogidas. Confirmar en servidor el pago y el precio vigente antes del despacho.

### 4. Simulador de planta accesible desde detalle

Las acciones están rotuladas como demo, pero `advancePlantOperation` modifica el mismo pedido operativo y puede llevarlo hasta asignación de entrega o completar el retiro en sede. Es una herramienta de recorrido, no una transición confirmada por el equipo de planta.

**Definir:** mantenerla solo en builds/demo o reemplazarla con eventos autenticados de planta. El estado de preparación debe provenir de la fuente responsable del proceso.

### 5. Disponibilidad y despacho

El estado de disponibilidad se cambia localmente y no comunica turnos ni recibe asignaciones. El guard de acciones bloquea pausa y desconectado, pero admite `ON_SERVICE` y `AVAILABLE`; la coherencia del estado depende del orden de acciones locales. “Siguiente servicio” toma el primer resultado, no ordena por horario, ETA o prioridad.

**Definir:** reglas para aceptar/rechazar asignación, pausa durante servicio, reasignación, horario y capacidad. Ordenar paradas por una agenda fiable y explicar qué pedido es realmente el siguiente.

### 6. Servicios asignados en etapas de planta

La visibilidad general sí incluye los pedidos asignados, pero los selectores de las pestañas muestran como activos solo estados de recogida y entrega, y como historial solo estados terminales. Un pedido en `AT_FACILITY`, `WEIGHING`, `IN_PROCESS`, `QUALITY_CONTROL` o `READY_FOR_PICKUP` no aparece en esas listas. Si la app se cierra cuando el pedido está en una de esas etapas, el chofer no tiene una entrada normal para volver a su detalle.

**Definir:** si el chofer necesita seguimiento de esos pedidos, exponerlos en una sección de “En planta / esperando” de solo lectura y dejar claro qué rol debe ejecutar la siguiente tarea. Si no necesita consultarlos, asegurar que el recorrido regrese a una pantalla accesible sin ocultar constancias relevantes.

### 7. Evidencia, receptor y privacidad

La recogida guarda cantidad, notas y foto opcional; entrega guarda nombre, relación, notas y foto opcional. No hay firma, verificación de documento, carga remota, política de retención ni tratamiento para foto fallida. Un nombre escrito no autentica al receptor.

**Definir:** evidencia mínima por tipo de servicio, autorización de terceros, consentimiento, minimización de datos, cifrado, retención, eliminación y proceso de entrega fallida.

### 8. Excepciones operativas

El modelo incluye estados de incidencia, pero en LaundryDriver no hay flujo visible para registrar o resolver recogida fallida, cliente ausente, diferencia, daño, pérdida o devolución. Tampoco se observa reprogramación desde la app. Los errores de transición detienen la acción, sin ofrecer un procedimiento de contingencia.

**Definir:** resultados y responsables por excepción, reintentos, reprogramación, custodia mientras se resuelve, comunicación y criterio de cierre. Incluir una opción de soporte que conserve contexto y evidencias.

### 9. Fechas, medición y reportes personales

La semilla usa fechas relativas/localizadas y el dominio normaliza agenda con zona `America/Guayaquil`. El historial calcula “hoy/semana” con `Date.now()` sobre timestamps almacenados; los ejemplos tipo “Hoy 14:15” no son timestamps ISO, por lo que no producen una fecha parseable para esos filtros. El contador de entregas es local y no una métrica conciliada.

**Definir:** guardar timestamps de servidor en UTC, mostrar zona operativa declarada y derivar el historial/contador desde eventos canónicos. Revisar filtros con fechas de semilla y cambios de zona horaria.

## Prioridades sugeridas

1. Definir backend y autoridad de cada transición, con controles de asignación e idempotencia.
2. Acordar custodia verificable y manejo offline; hacer explícito cuándo el código es obligatorio.
3. Cerrar precio, aprobación y pago antes de habilitar despachos por peso.
4. Separar eventos de planta de las herramientas demo.
5. Resolver visibilidad de pedidos mientras están en planta.
6. Diseñar excepciones y protocolos de evidencia del chofer.
7. Alinear agenda, disponibilidad, ruta siguiente e historial con datos de servidor.

## Límites de lectura

Esta revisión evalúa la implementación fuente de LaundryDriver y sus pruebas disponibles, no valida servicios externos ni operación legal/contable. No se ejecutaron pruebas o compilaciones para esta tarea; el análisis fue estático y no modificó código funcional.

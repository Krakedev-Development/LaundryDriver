# Flujos de LaundryDriver

Esta guía describe el comportamiento que está implementado en la app móvil de chofer. El dominio y el almacenamiento son locales; por tanto, las acciones descritas no se sincronizan con LaundryWeb, LaundryApp, una planta ni un backend.

## Acceso y navegación

La app presenta el login de chofer y el acceso rápido **Chofer demo**. El acceso con correo y contraseña compara localmente el hash SHA-256 con una cuenta `DRIVER` provisionada en la semilla. No hay registro, alta administrativa conectada, recuperación de contraseña ni sesión remota. Una cuenta marcada con contraseña temporal queda obligada a cambiarla antes de ver la ruta. La contraseña nueva también se guarda como hash local.

Tras iniciar sesión, la navegación inferior ofrece **Mi ruta**, **Mis servicios**, **Historial** y **Mi cuenta**. Las pantallas de detalle, mapa, confirmación y chat se abren desde el pedido. Los pedidos visibles son los que tienen `assignedDriverId` igual al chofer de la sesión.

## Mi ruta y disponibilidad

Mi ruta presenta el estado operativo y las órdenes activas de recogida o entrega. Permite cambiar entre disponible, en servicio, pausa y desconectado. Las acciones de operación bloquean los dos últimos estados (`BREAK` y `OFFLINE`); la pantalla no recibe asignaciones nuevas del servidor. La tarjeta de siguiente servicio toma el primer pedido que devuelve el estado local, sin ordenar explícitamente por hora o distancia.

Mis servicios separa servicios activos de próximos mediante los estados del pedido, y busca por identificador, cliente y direcciones. Historial muestra pedidos terminales asignados al chofer y ofrece filtros de hoy, semana y todos.

## Recogida a domicilio

El recorrido implementado permite iniciar el trayecto, marcar llegada, confirmar cantidad y observaciones, y después ir a planta y registrar la llegada. La confirmación requiere cantidad entera positiva y la casilla de revisión de prendas. La foto es opcional. El código puede introducirse o escanearse, pero el repositorio también acepta confirmar sin código; el QR no es un requisito efectivo del dominio.

Al confirmar se registra el conteo, observaciones, URI de evidencia y fecha, se consume la transferencia `CUSTOMER_TO_DRIVER` y se crea la transferencia `DRIVER_TO_FACILITY`. Al llegar a planta, esta última queda consumida y el tramo de recogida se cierra. La app no captura firma ni confirma que el receptor físico corresponda a una identidad verificada.

## Planta y entrega

El detalle muestra **Herramientas de planta · Demo** para avanzar etapas localmente: ingreso a lavado o inicio de pesaje, control de calidad, prendas listas y asignación simulada de entrega. Para pedidos por peso, el flujo permite registrar libras, calcular importes y descuentos locales y dejar el pago pendiente. Si el peso ya está calculado, la app pide esperar a la confirmación de pago del cliente, que aquí no está conectada.

En modalidad domicilio completo, el chofer puede iniciar entrega solo con el pedido pagado, marcar llegada, registrar nombre, relación, notas y foto opcional, y confirmar con una casilla. Se consume `DRIVER_TO_CUSTOMER`, se completa el tramo de salida, se incrementa el contador local y el pedido pasa a `DELIVERED`.

En modalidad **Pick up** (`HOME_STORE`), el chofer recoge en domicilio y termina su participación al entregar a planta. La etapa de retiro en sede se simula con herramientas de planta; no se crea una entrega domiciliaria.

## Mapa, navegación y conversación

El mapa nativo dibuja una línea entre coordenadas estáticas de origen y destino. En web muestra un esquema SVG. La posición del chofer de la semilla no se actualiza con GPS. Los botones externos abren Google Maps o Waze con coordenadas para que esos servicios calculen el trayecto real. El chat guarda mensajes en la conversación local del pedido; no los entrega a cliente ni a operaciones.

## Perfil y cierre de sesión

Perfil muestra ficha, vehículo, sede, zona y un contador local de entregas. Cerrar sesión elimina la sesión guardada y devuelve al login; los pedidos y cambios locales permanecen.

## Límites del MVP

| Área | Implementado | Mock o pendiente |
| --- | --- | --- |
| Acceso | Validación local por rol y cambio de contraseña | Provisión de cuentas, servidor de autenticación, recuperación y revocación |
| Servicios | Consulta local de pedidos asignados, filtros y detalle | API de asignaciones, sincronización y actualizaciones concurrentes |
| Recogida y entrega | Transiciones, conteo, receptor, notas y custodia local | Exigir código en dominio, identidad del receptor, firma y registro remoto |
| Evidencias | Cámara o biblioteca del dispositivo; copia local en dispositivo | Subida, acceso compartido, retención y respaldo remoto |
| Planta | Simulador claramente rotulado para completar el recorrido | Integración con planta, calidad, peso, aprobación del cliente y pago |
| Ubicación | Coordenadas de semilla y mapa estático; apertura de apps externas | GPS en vivo, permisos/seguimiento en segundo plano, rutas y ETA |
| Mensajes y avisos | Estructuras locales; eventos de pedido agregan avisos locales | Push, SMS, correo, chat en tiempo real y confirmación de lectura |
| Persistencia | AsyncStorage con clave propia y cola de guardado | Base de datos remota, respaldo, cifrado gestionado y sincronización |

## Referencias de código

- Navegación y roles: `src/navigation/AppNavigation.tsx`, `src/navigation/routes.ts`.
- Repositorio y operaciones: `src/domain/repository.ts`, `src/domain/operations/`.
- Persistencia y migración: `src/store/AppProvider.tsx`, `src/store/persistence.ts`, `src/domain/fulfillmentPolicy.ts`.
- Confirmaciones: `src/features/driver/model/` y `src/screens/driver/`.
- Cámara, fotos y mapas: `src/components/QrScanner.tsx`, `src/services/media.ts`, `src/components/RouteMap*`.
- Separación por rol: [ROLE_SPLIT.md](ROLE_SPLIT.md).

# Propuesta de organización de módulos de LaundryDriver

LaundryDriver ya separa navegación, pantallas, features, dominio, operaciones y persistencia. La siguiente evolución debería conservar el foco del chofer y hacer visibles las dependencias con servicio de asignaciones, custodia y planta cuando esas integraciones existan.

## Organización actual

| Área | Responsabilidad actual |
| --- | --- |
| `src/navigation` | Rutas, tabs y composición del flujo auth/contraseña/chofer |
| `src/screens` | Pantallas de acceso, ruta, servicios, historial, perfil, mapa y chat |
| `src/features/driver` | Hooks de confirmación y componentes de tareas del chofer |
| `src/domain` | Modelos, selectores, semilla, política de modalidad y reglas |
| `src/domain/operations` | Transiciones, custodia, timeline, notificaciones y herramientas de planta |
| `src/store` | Contexto de app, transacciones y AsyncStorage |
| `src/components` | Componentes de presentación, overlays, cámara, fotos y mapas |
| `packages/mobile-auth` | Contrato local versionado de autenticación por audiencia |

El dominio evita depender de React Native; `AppProvider` conecta acciones con persistencia. La clase de repositorio hereda en cadena las operaciones (`PlantOperations` → `DeliveryOperations` → `PickupOperations` → `DriverHandoffs` → `DriverEvents` → `DriverContext`), lo que concentra el acceso y crea acoplamiento entre etapas.

## Propuesta funcional

### 1. Mantener cuatro áreas de trabajo

- **Ruta:** disponibilidad, paradas activas y próxima acción.
- **Servicios:** asignados activos y próximos, con detalle común.
- **Historial:** pedidos terminales y constancias.
- **Perfil:** datos laborales, vehículo y cierre de sesión.

Estas áreas corresponden a tareas distintas. El mapa, chat y confirmación deben seguir abriéndose desde un servicio para preservar su contexto.

### 2. Convertir el detalle en contexto de acción

El detalle existente reúne resumen, destino, prendas, acción, constancias y bloque de planta demo. Puede evolucionar a una vista consistente con:

1. resumen, modalidad, estado y siguiente acción;
2. destino y agenda del tramo;
3. prendas, conteo y observaciones;
4. custodia y códigos activos;
5. evidencia y timeline;
6. chat y ayuda para excepción.

Las acciones del chofer deben ser únicas por etapa. Las operaciones de planta deben migrar a una interfaz o aplicación de planta y el detalle del chofer solo debe mostrar su estado recibido.

### 3. Aislar integraciones detrás de puertos

Introducir interfaces de dominio/aplicación para `AssignmentRepository`, `OrderRepository`, `HandoffService`, `DriverLocationService`, `EvidenceStorage` y `MessageService`. La implementación actual puede mantenerse como adaptador demo/local; un adaptador remoto futuro usará la misma política de negocio y errores tipados.

La UI no debería fabricar estados de custodia ni decidir el actor de la transferencia. El servidor debe autorizar una transición con identidad, versión del pedido y clave de idempotencia.

### 4. Dividir reglas por caso de uso

En lugar de una jerarquía que acumula funciones, separar casos como `StartPickup`, `ConfirmPickup`, `ArriveAtFacility`, `StartDelivery` y `ConfirmDelivery`. Extraer validación de modalidad, pago y custodia en políticas sin dependencias de UI. Definir explícitamente qué casos de uso solo viven en fixtures de demo.

Conservar `models` como contratos del dominio. Evitar duplicar mutaciones de pedido dentro de hooks o pantallas; esos módulos deben adaptar formularios y mostrar resultados del caso de uso.

### 5. Separar datos demo y datos persistidos

Mover semilla y escenarios a `src/demo`, con perfiles identificables por build. Mantener el adaptador AsyncStorage para previsualización offline, pero versionar migraciones y validar datos desconocidos con resultado recuperable. En producción, no persistir fotos como base64 dentro del snapshot del pedido; usar almacenamiento de evidencias y referencias controladas.

La clave actual `laundry.driver-mvp.v1` identifica bien el ámbito local. Al agregar backend, definir caché por cuenta, borrado al cerrar sesión cuando aplique y política de datos personales del cliente en el dispositivo.

## Estructura objetivo ilustrativa

```text
src/
  app/                 # proveedores y composición raíz
  navigation/          # rutas y tabs
  features/
    route/             # disponibilidad, lista de paradas y orden
    services/          # búsqueda y detalle
    pickup/             # caso de uso y captura de recogida
    delivery/           # caso de uso y captura de entrega
    history/
    profile/
    chat/
  domain/
    orders/             # modelos y políticas puras
    custody/            # transferencias y reglas de código
  data/
    demo/               # semilla, fixtures, simulador de planta
    local/              # adaptador AsyncStorage y migraciones
    remote/             # futuro backend
    media/              # selección y carga de evidencia
  shared/ui/            # componentes sin reglas de negocio
```

## Orden recomendado

1. Resolver en backend las transiciones críticas y la autenticación de chofer.
2. Separar explícitamente las acciones demo de las acciones de producción.
3. Definir contrato de asignación, custodia, pago y actualización de etapas de planta.
4. Crear puertos/adaptadores sin cambiar el diseño de las pantallas.
5. Extraer casos de uso y tipar resultados de reglas para manejar errores y reintentos.
6. Mejorar orden de ruta, excepciones y evidencia con criterios operativos acordados.

Esta organización es una propuesta. La división actual puede seguir sirviendo al MVP local; cualquier refactor debe preservar las modalidades `HOME_HOME` y `HOME_STORE`, los guardas actuales y la compatibilidad de las migraciones.

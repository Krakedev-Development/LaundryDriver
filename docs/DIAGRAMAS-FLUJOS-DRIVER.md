# Diagramas de flujos y relaciones de LaundryDriver

Las flechas describen lógica presente en el código móvil. Las etapas de planta, mensajes y persistencia son locales; los diagramas no representan integración entre aplicaciones.

## 1. Componentes y datos

```mermaid
flowchart LR
    UI[React Native: pantallas y componentes] --> STORE[AppProvider: estado y transacciones]
    STORE --> REPO[LaundryRepository]
    REPO --> OPS[Operaciones de chofer y simulador de planta]
    REPO --> DOMAIN[Modelos, selectores y reglas]
    STORE --> PERSIST[PersistenceQueue]
    PERSIST --> ASYNC[AsyncStorage: laundry.driver-mvp.v1]
    MEDIA[Cámara y biblioteca] --> FILES[Archivos locales del dispositivo]
    UI --> MAP[Mapa nativo / esquema web]
    UI --> EXTERNAL[Google Maps o Waze]
    WEB[Servicio backend pendiente] -. sin conexión .-> REPO
```

## 2. Acceso y selección de flujo

```mermaid
flowchart TD
    A[Abrir app] --> B[Leer AsyncStorage y migrar modalidad]
    B --> C{Sesión local DRIVER}
    C -->|No| D[Login / Chofer demo]
    D --> E[Validar cuenta y hash locales]
    E -->|Válido| F{Contraseña temporal}
    E -->|Inválido| D
    C -->|Sí| F
    F -->|Sí| G[Cambiar contraseña local]
    F -->|No| H[Mi ruta]
    G --> H
    H --> I[Servicios / Historial / Perfil]
    I --> J[Cerrar sesión]
    J --> D
```

## 3. Recogida, transferencia y planta

```mermaid
flowchart TD
    A[PICKUP_ASSIGNED] --> B[Iniciar recogida]
    B --> C[HEADING_TO_PICKUP]
    C --> D[Marcar llegada]
    D --> E[ARRIVED_FOR_PICKUP]
    E --> F[Revisar prendas, conteo, notas, foto opcional y código opcional]
    F --> G[Consumir CUSTOMER_TO_DRIVER local]
    G --> H[PICKED_UP; crear DRIVER_TO_FACILITY]
    H --> I[Iniciar traslado]
    I --> J[HEADING_TO_FACILITY]
    J --> K[Marcar llegada a planta]
    K --> L[AT_FACILITY; consumir DRIVER_TO_FACILITY]
    L --> M{Herramienta de planta demo}
    M -->|Tarifa por peso| N[Registrar libras y calcular total local]
    M -->|Tarifa fija| O[Iniciar proceso local]
    N --> P[Pago pendiente; cliente debe confirmar fuera de esta app]
    P --> Q[Procesamiento / calidad demo]
    O --> Q
    Q --> R{Modalidad}
    R -->|HOME_HOME| S[READY_FOR_DELIVERY]
    R -->|HOME_STORE| T[READY_FOR_PICKUP]
```

## 4. Entrega a domicilio y retiro en sede

```mermaid
flowchart TD
    A[READY_FOR_DELIVERY] --> B[Asignación demo del chofer]
    B --> C[DELIVERY_ASSIGNED]
    C --> D{Pedido pagado}
    D -->|No| E[Rechazar inicio]
    D -->|Sí| F[Iniciar entrega; activar/consumir custodia local]
    F --> G[OUT_FOR_DELIVERY]
    G --> H[Marcar llegada]
    H --> I[ARRIVED_FOR_DELIVERY]
    I --> J[Nombre, relación, nota, foto opcional, código opcional y casilla]
    J --> K[Consumir DRIVER_TO_CUSTOMER local]
    K --> L[DELIVERED; completar tramo y contador local]
    M[READY_FOR_PICKUP] --> N[Simular retiro en sede]
    N --> O[Consumir FACILITY_TO_CUSTOMER sin lector/código obligatorio]
    O --> P[COMPLETED]
```

## 5. Visibilidad y filtros

```mermaid
flowchart LR
    A[Estado local] --> B[visibleOrders]
    B --> C{Sesión DRIVER}
    C -->|No| D[Lista vacía]
    C -->|Sí| E[Filtrar assignedDriverId = sesión]
    E --> F[Servicios activos o próximos por estado]
    E --> G[Historial de estados terminales]
    E --> H[Mi ruta: recogidas y entregas en curso]
    F --> I[Detalle de servicio]
    G --> I
    H --> I
    I --> J[Mapa / chat / confirmación]
```

## 6. Datos y efectos

```mermaid
flowchart TD
    A[Acción de UI] --> B[transact clona estado]
    B --> C[refreshSchedule]
    C --> D[LaundryRepository ejecuta regla]
    D --> E{Acción válida}
    E -->|No| F[Error de UI; no persiste mutación]
    E -->|Sí| G[Estado y evento de timeline locales]
    G --> H[Notificación local en estado]
    G --> I[Guardar snapshot en cola AsyncStorage]
    I --> J[Al reabrir: validar forma, filtrar cuentas y migrar modalidad]
    K[Foto] --> L[URI/base64 local]
    L --> I
```

La migración conserva como legado los ingresos antiguos de cliente en sede y transforma los pedidos abiertos a recogida domiciliaria. La transferencia histórica puede permanecer registrada, pero ya no se ofrece como modalidad nueva.

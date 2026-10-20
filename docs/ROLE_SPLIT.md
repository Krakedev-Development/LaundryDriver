# Separación del MVP móvil por rol

## Aplicaciones

| Responsabilidad | LaundryApp | LaundryDriver |
| --- | --- | --- |
| Login y validación de contraseña | Contrato compartido, solo CLIENT | Contrato compartido, solo DRIVER |
| Registro y KYC | Conservados | Sin rutas, pantallas ni operaciones |
| Creación de choferes | Sin alta de choferes | Cuentas provisionadas por administración; sin registro público |
| Solicitudes y pagos del cliente | Conservados | Consulta operativa y comprobación del estado de pago |
| Billetera, beneficios y datos de facturación | Conservados | No incluidos |
| Ruta, disponibilidad y confirmaciones de chofer | Retirados | Migrados completos |
| Seguimiento y chat | Vista del cliente | Vista del chofer |

No se cambian las modalidades, reglas de pago, códigos de transferencia, estados, estilos ni comportamiento del servicio.

## Matriz de pantallas de chofer

| Ruta conservada | Archivo en LaundryDriver | Función |
| --- | --- | --- |
| Login | `src/screens/auth/LoginScreen.tsx` | Misma presentación del login, adaptador exclusivo de chofer |
| DriverChangePassword | `src/screens/auth/PasswordScreen.tsx` | Cambio obligatorio de contraseña temporal antes de operar |
| DriverRoute | `src/screens/driver/DriverRouteScreen.tsx` | Disponibilidad, siguiente servicio y avance de ruta |
| DriverServices | `src/screens/driver/DriverServicesScreen.tsx` | Solicitudes asignadas y filtros |
| DriverHistory | `src/screens/driver/DriverHistoryScreen.tsx` | Servicios finalizados y navegación al detalle |
| DriverProfile | `src/screens/driver/DriverProfileScreen.tsx` | Nombre, correo, vehículo, sede, zona y entregas completadas |
| DriverServiceDetail | `src/screens/driver/DriverServiceDetailScreen.tsx` | Resumen, prendas, dirección, acciones y constancias |
| DriverMap | `src/screens/DriverMapScreen.tsx` | Posición/destino, Google Maps, Waze y acceso al chat |
| DriverPickupConfirm | `src/screens/driver/DriverPickupConfirmScreen.tsx` | Conteo, evidencia, observaciones y confirmación de recogida |
| DriverDeliveryConfirm | `src/screens/driver/DriverDeliveryConfirmScreen.tsx` | Destinatario, relación, evidencia y confirmación de entrega |
| Chat | `src/screens/ChatScreen.tsx` | Mensajes locales con identidad de chofer |

La navegación inferior conserva Mi ruta, Servicios, Historial y Perfil. Mantiene el estado de los filtros al cambiar de pestaña, las animaciones, el header con logo y los retornos de las confirmaciones. El registro de clientes no se monta en este árbol de navegación.

## Código operativo

Los hooks y componentes de `src/features/driver`, selectores de `src/entities/order/model/driverOrderSelectors.ts`, presentaciones, mapas, escáner y servicios de evidencia se trasladan con sus dependencias utilizadas.

`src/domain/repository.ts` expone solo autenticación, contraseña, disponibilidad, chat y operaciones del chofer. Los módulos de `src/domain/operations` conservan las implementaciones de recogida, entrega, eventos y transferencias de custodia. La simulación de planta mantiene el pesaje, lavado, control de calidad y preparación para domicilio o retiro en sede.

Los modelos del chofer incluyen contactos del cliente y datos operativos de las solicitudes; no incluyen su identidad documental, saldo, métodos de pago o canjes. El dominio no depende de React Native, Expo o almacenamiento. `src/store/persistence.ts` conserva la cola de guardado y usa un espacio independiente.

## Compatibilidad del cliente

LaundryApp mantiene su identificador de aplicación y la clave `laundry.native-migration.v1`. Al cargar datos anteriores, elimina las credenciales y banderas privadas de chofer y cierra una sesión antigua de ese rol. Conserva clientes, solicitudes, saldos, puntos, comprobantes, métodos de pago, mensajes y la información de contacto del chofer usada en seguimiento. No restablece los datos de la demo como parte de esta migración.

## Login compartido

Ambos repositorios contienen `packages/mobile-auth` como dependencia npm local, con el mismo contrato `authenticateSession`. La audiencia es explícita en cada repositorio. El formulario, la presentación y el hash de contraseña son equivalentes; cada adaptador ofrece únicamente su acceso demo y LaundryApp añade el registro.

`scripts/check-shared-login.cjs` comprueba esos archivos al disponer de ambos checkouts. No se requiere un directorio compartido fuera del repositorio ni acceso al otro proyecto para instalar o ejecutar una app.

## Límites locales

No hay backend, sesión compartida entre aplicaciones ni sincronización con LaundryWeb. Los datos operativos previos guardados en el contenedor de LaundryApp no se copian automáticamente al contenedor nuevo de LaundryDriver. Sus constancias siguen conservadas en LaundryApp; LaundryDriver inicia su escenario local independiente con el mismo catálogo y los mismos casos de chofer. Tampoco se trasladan archivos privados de evidencias entre contenedores.

La provisión administrativa y los cambios externos de planta/pago se representan con los fixtures y herramientas explícitas del prototipo. Esta separación no incorpora facultades de cliente al chofer para sustituir esa futura integración.

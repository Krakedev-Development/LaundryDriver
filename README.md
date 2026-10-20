# LaundryDriver

App exclusiva para choferes, con React Native 0.86.3, Expo SDK 57, TypeScript y npm. Mantiene las pantallas, el diseño, las reglas y los recorridos de chofer trasladados desde LaundryApp. LaundryApp queda destinada a clientes.

## Ejecutar

Requiere Node.js 22.13 o superior y npm.

```powershell
cd C:\LaundryCleanFresh\LaundryDriver
npm.cmd ci
npm.cmd start
```

`npm start` abre Expo en el puerto 8082 para poder ejecutar LaundryApp simultáneamente en el 8081. También puedes usar `npx.cmd expo start --port 8082`, `npm.cmd run android`, `npm.cmd run ios` o `npm.cmd run web`. Se conserva el flujo administrado de Expo; no se incluyen proyectos generados de Android Studio o Xcode.

La aplicación tiene identidad propia: `com.laundrycleanfresh.driver` y esquema `laundrydriver`. Conserva los logos oficiales. Para mapas en una compilación Android propia, configura `GOOGLE_MAPS_ANDROID_API_KEY` siguiendo `.env.example`; no se copian credenciales de LaundryApp.

## Acceso

La cuenta demo de chofer es `carlos.mendoza@laundryfresh.com`, contraseña `123456`. Hay un único acceso rápido «Chofer demo». No existe registro público, creación de clientes ni cambio de rol. La cuenta de chofer corresponde al alta administrativa; si tiene contraseña temporal, debe cambiarla antes de acceder a su ruta.

El MVP utiliza una cuenta preconfigurada que representa esa provisión administrativa. La creación realizada en LaundryWeb todavía no se sincroniza con esta app: no se agregó backend ni transporte entre aplicaciones.

El login utiliza el contrato local `@laundry/mobile-auth`, en `packages/mobile-auth`, y la misma presentación que LaundryApp. Cada repositorio incluye su copia versionada para instalarse de manera independiente. La autenticación recibe explícitamente el rol permitido y rechaza credenciales del otro rol. `npm.cmd run check:shared-login` verifica la igualdad cuando ambos repositorios están presentes.

## Recorridos conservados

- Mi ruta: disponibilidad, siguiente servicio y acciones según su estado.
- Servicios: búsqueda, filtros, detalle, prendas, dirección, contacto y constancias.
- Recogida: conteo, observaciones, evidencia, código de transferencia y confirmación.
- Traslado y entrega en planta, con sus transferencias de custodia.
- Entrega al cliente: destinatario, relación, confirmación, observaciones y evidencia.
- Mapa, enlaces a Google Maps/Waze y chat local del servicio.
- Historial, vehículo, sede, zona, entregas completadas y cierre de sesión.

Se mantienen únicamente domicilio completo (`HOME_HOME`) y pick up (`HOME_STORE`: recogida en domicilio y retiro en sede). Pick up no genera una entrega domiciliaria del chofer. Las herramientas de planta continúan siendo simulaciones explícitas del MVP; el chofer no cobra desde la billetera del cliente ni confirma sus ajustes de precio.

Los datos operativos se guardan localmente con la clave `laundry.driver-mvp.v1`, independiente del almacenamiento del cliente. Incluyen las solicitudes asignadas, contactos necesarios, custodia, mensajes y disponibilidad. No se trasladan el registro/KYC del cliente, su billetera, métodos de pago o beneficios. Las fotos capturadas o seleccionadas conservan el servicio de persistencia existente.

La [matriz de separación](docs/ROLE_SPLIT.md) detalla el destino de cada pantalla y los límites del MVP.

## Verificar

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run check:shared-login
npm.cmd run export:android
npm.cmd run export:web
npm.cmd run test:ui
```

Las pruebas de interfaz utilizan el export web y Microsoft Edge. El servidor de previsualización usa `http://127.0.0.1:8098`. Los artefactos, dependencias, cachés, credenciales y proyectos nativos generados quedan excluidos por `.gitignore`.

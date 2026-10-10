# Ritmo — Organizador Personal

Ritmo es un organizador personal para manejar tareas, hábitos, eventos y finanzas (ingresos y gastos), con un dashboard que busca resumir el día y permitir al usuario organizarse. Está formado por una API REST (backend) y una aplicación web en React (frontend).

## Contenido

- [Módulos y funciones](#módulos-y-funciones)
- [Tecnologías y estructura del repositorio](#tecnologías-y-estructura-del-repositorio)
  - [Herramientas del backend](#herramientas-del-backend)
  - [Cómo está organizado el backend](#cómo-está-organizado-el-backend)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Autenticación (JWT)](#autenticación-jwt)
- [Endpoints](#endpoints)
- [Usuarios](#usuarios)
- [Dashboard y hábitos](#dashboard-y-hábitos)
- [Categorías](#categorías)
- [Finanzas](#finanzas)
- [Pruebas con Postman](#pruebas-con-postman)
- [Requerimientos](#requerimientos)
  - [Cómo evolucionó el módulo de finanzas](#cómo-evolucionó-el-módulo-de-finanzas)
- [Seguridad](#seguridad)
- [Estado actual](#estado-actual)

## Módulos y funciones

- Crear una cuenta, iniciar sesión y recuperar la contraseña.
- Organizar tareas con prioridad, categoría y repetición.
- Llevar hábitos con seguimiento diario.
- Programar eventos y marcarlos como realizados.
- Registrar ingresos y gastos, clasificarlos por categoría, ver el resumen del mes y manejar pagos que se repiten.
- Organizar todo con categorías predeterminadas o creadas por la propia persona.
- Ver un dashboard con el progreso del día.

| Módulo | Qué permite | Ruta de la API |
|---|---|---|
| Cuenta y usuarios | Registro, inicio de sesión, recuperación de contraseña y roles (usuario y soporte) | `/api/auth`, `/api/users` |
| Tareas | Crear, consultar, actualizar, completar y eliminar tareas, con prioridad, estado, categoría y repetición | `/api/tasks` |
| Hábitos | Crear y editar hábitos, marcar su cumplimiento por día y guardar una hora de recordatorio | `/api/habits` |
| Eventos | Programar eventos, consultarlos, marcarlos como realizados y repetirlos | `/api/events` |
| Finanzas | Registrar ingresos y gastos, clasificarlos por categoría, ver el resumen del mes y manejar pagos recurrentes | `/api/expenses` |
| Categorías | Clasificar la información de finanzas, tareas, hábitos y eventos, con categorías predeterminadas o propias | `/api/categories` |
| Dashboard | Ver el resumen del día: progreso de tareas y hábitos, agenda del día con filtros y recordatorios de pagos | `/api/dashboard` |
| Calendario | Marca en el mes los días con tareas, eventos y recordatorios de pago. Ver el detalle de cada día al hacer clic está en desarrollo | Usa `/api/tasks`, `/api/events` y `/api/expenses/recurrences/reminders` |

## Tecnologías y estructura del repositorio

| Carpeta | Qué es | Tecnologías |
|---|---|---|
| `Ritmo - Backend/` | La API, que guarda y entrega los datos | Node.js, Express, MySQL, JWT |
| `ritmo-frontend/` | La interfaz que usa la persona | React, Vite, Axios |
| `docs/` | Documentación de la API y colección de Postman | — |

### Herramientas del backend

| Herramienta | Para qué se usa |
|---|---|
| Node.js y Express | Ejecutar el servidor y crear las rutas |
| MySQL y mysql2/promise | Base de datos y su conexión |
| bcrypt | Cifrar las contraseñas antes de guardarlas |
| jsonwebtoken | Crear y verificar los tokens del inicio de sesión |
| cors | Permitir que el frontend (`http://localhost:5173`) llame a la API |
| dotenv | Leer las variables del archivo `.env` |
| nodemon | Reiniciar el servidor cuando cambia el código |

### Cómo está organizado el backend

El código está separado en capas para que cada archivo haga una sola cosa. Cada petición pasa en este orden:

```text
Route → Validator → Controller → Service → Repository → MySQL
```

| Capa | Qué hace |
|---|---|
| Route | Define la ruta y el método HTTP (por ejemplo `POST /api/tasks`) |
| Validator | Revisa que los datos que llegan estén completos y bien escritos |
| Controller | Recibe la petición y devuelve la respuesta |
| Service | Tiene las reglas de negocio (por ejemplo, "el correo no se puede repetir") |
| Repository | Hace las consultas SQL |

También hay **middlewares**, funciones que se ejecutan antes del controlador y pueden dejar pasar o frenar la petición:

- `auth.middleware.js`: revisa el token JWT.
- `role.middleware.js`: revisa el rol del usuario o si el recurso le pertenece.
- `error.middleware.js`: atrapa los errores y responde siempre con el formato `{ "message": "..." }`.

Estructura de carpetas del backend:

```text
Ritmo - Backend/
  .env.example
  package.json
  database/
    migrations/             ← cambios a la base de datos (ver "Base de datos")
  src/
    app.js                  ← registra las rutas y los middlewares
    server.js               ← revisa el .env, conecta a MySQL y arranca el servidor
    config/
      mysql.js              ← pool de conexiones a MySQL
    middlewares/
      auth.middleware.js
      error.middleware.js
      role.middleware.js
    modules/
      auth/        users/        tasks/        habits/
      events/      expenses/     categories/   dashboard/
        (cada módulo tiene: routes, validator, controller, service, repository e index)
    utils/
      recurrence.js         ← calcula la siguiente fecha de algo que se repite
```

## Requisitos

- Node.js `^20.19.0` o `>=22.12.0`. El backend funciona desde Node 18, pero Vite (frontend) pide esta versión.
- MySQL 8 o compatible (phpMyAdmin sirve para verla y administrarla).
- Una base de datos creada (por ejemplo `ritmo_organizadorpersonal`).

## Instalación y ejecución

Se necesitan **dos terminales**, una para cada parte.

```bash
git clone https://github.com/caritto226-hash/Ritmo---Backend.git
cd Ritmo---Backend
```

### 1. Backend (terminal 1)

```bash
cd "Ritmo - Backend"
npm install
```

1. Copiar `.env.example` como `.env` y cambiar los valores por los propios (ver la tabla de abajo).
2. Preparar la base de datos (ver [Base de datos y migraciones](#base-de-datos-y-migraciones)).
3. Iniciar el servidor:

   ```bash
   npm run dev      # modo desarrollo, se reinicia solo
   npm start        # modo normal
   ```

La API queda en `http://localhost:3000`. Para comprobar que funciona, abrir `http://localhost:3000/health`; debe responder `{ "status": "ok" }`. Esa ruta está fuera de `/api`; todas las demás empiezan por `/api`.

**Variables de entorno.** Son datos de configuración que no van dentro del código, como la contraseña de la base de datos. Se guardan en `.env`, que **no se sube a GitHub**; en el repositorio solo está `.env.example`.

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ritmo_organizadorpersonal

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
```

| Variable | Para qué sirve | ¿Obligatoria? |
|---|---|---|
| `PORT` | Puerto del servidor | No (usa `3000`) |
| `DB_HOST` | Dirección de MySQL | Sí |
| `DB_PORT` | Puerto de MySQL | No (usa `3306`) |
| `DB_USER` | Usuario de MySQL | Sí |
| `DB_PASSWORD` | Contraseña de MySQL | Sí |
| `DB_NAME` | Nombre de la base de datos | Sí |
| `JWT_SECRET` | Clave secreta para firmar los tokens; debe ser larga y difícil de adivinar | Sí, sin ella el login responde con error 500 |
| `JWT_EXPIRES_IN` | Cuánto dura un token, por ejemplo `1h` | Recomendada |

Si falta `DB_HOST`, `DB_USER`, `DB_PASSWORD` o `DB_NAME`, el servidor no arranca y muestra `Faltan variables de entorno: ...`.

> `npm test` todavía **no tiene pruebas automatizadas**. Por ahora la API se prueba con Postman (ver [Pruebas con Postman](#pruebas-con-postman)).

### 2. Frontend (terminal 2)

```bash
cd ritmo-frontend
npm install
```

1. Copiar `.env.example` como `.env`. Trae `VITE_API_URL=http://localhost:3000/api`, que es la dirección de la API.
2. Iniciar el frontend:

   ```bash
   npm run dev
   ```

El frontend abre en `http://localhost:5173`, el único origen que el backend acepta por CORS, así que el backend debe estar corriendo al mismo tiempo. Se inicia sesión con un usuario existente. Por ahora no hay pantalla de registro: los usuarios se crean con `POST /api/users` desde Postman.

## Base de datos y migraciones

### Esquema base (pendiente de incluir en el repositorio)

Las tablas principales (`users`, `roles`, `tasks`, `habits`, `events`, `expenses` y `password_reset_tokens`) se crearon directamente en MySQL - phpMyAdmin. **Todavía no hay un script en el repositorio para crearlas.** Para generarlo:

1. En MySQL - phpMyAdmin, seleccionar la base `ritmo_organizadorpersonal` y entrar a **Exportar**.
2. Elegir el método **Personalizado** y marcar solo la **estructura** de las tablas, sin datos.
3. En la tabla `roles` sí incluir los datos, porque la API necesita los roles `1` (usuario) y `2` (soporte).
4. Guardar el archivo como `Ritmo - Backend/database/schema.sql`.

> Si la base desde donde se exporta ya tiene aplicadas las migraciones, ese `schema.sql` ya trae esos cambios. En ese caso **no** hay que volver a correrlas.

### Migraciones

Una **migración** es un archivo `.sql` que cambia la estructura de la base de datos (por ejemplo, agrega una tabla o una columna) sin borrar los datos existentes. Están en `Ritmo - Backend/database/migrations/`.

**Hay que correrlas en este orden.** Si se ordenan por nombre falla, porque `add_task_habit_categories` necesita que la tabla `categories` ya exista.

| Orden | Archivo | Qué hace |
|---|---|---|
| 1 | `20261007_create_habit_completions.sql` | Crea la tabla donde se guarda qué día se cumplió cada hábito |
| 2 | `20261007_create_categories_and_migrate_expenses.sql` | Crea `categories`, pasa las categorías de texto de los gastos a la tabla nueva y borra la columna vieja `expenses.category` |
| 3 | `20261007_add_task_habit_categories.sql` | Agrega `description` a categorías y `category_id` a tareas y hábitos |
| 4 | `20261007_create_expense_recurrences.sql` | Crea las tablas de pagos e ingresos recurrentes |
| 5 | `20261008_add_category_recurrence_and_activity_reminders.sql` | Agrega `is_recurring` a categorías, recurrencia a tareas y eventos, categoría a eventos y `reminder_time` a hábitos |

Cada una se puede correr desde la terminal (pide la contraseña) o con la pestaña **Importar** de phpMyAdmin:

```sh
mysql --host=DB_HOST --user=DB_USER --password DB_NAME < "Ritmo - Backend/database/migrations/20261007_create_habit_completions.sql"
```

Importante:

- **Hacer una copia de seguridad antes**, sobre todo antes de la migración 2, porque borra una columna.
- Solo la migración 1 se puede repetir sin problema (usa `CREATE TABLE IF NOT EXISTS`). Las demás fallan si se corren dos veces.

## Autenticación (JWT)

Un **JWT** (JSON Web Token) es un texto firmado que la API entrega al iniciar sesión. Funciona como un pase: guarda el `id`, el `correo` y el rol (`idRol`) de la persona, y vence según `JWT_EXPIRES_IN`.

1. Se inicia sesión con `POST /api/auth/login` y se recibe `{ "token": "..." }`.
2. En las rutas privadas se envía ese token en el header:

   ```http
   Authorization: Bearer <token>
   ```

3. Si no se envía, la API responde `401`. Si se envía pero no hay permiso, responde `403`.

| idRol | Rol |
|---|---|
| 1 | Usuario |
| 2 | Soporte |

## Endpoints

Un **endpoint** es una dirección de la API que realiza una acción; por ejemplo, `POST /api/tasks` crea una tarea. La lista completa, con los datos que recibe cada uno y sus respuestas, está en [`docs/api.endpoints.md`](docs/api.endpoints.md).

| Módulo | Ruta base | ¿Necesita token? |
|---|---|---|
| Auth | `/api/auth` | No |
| Usuarios | `/api/users` | El registro no; todo lo demás sí |
| Tareas | `/api/tasks` | Sí |
| Hábitos | `/api/habits` | Sí |
| Eventos | `/api/events` | Sí |
| Finanzas | `/api/expenses` | Sí |
| Categorías | `/api/categories` | Sí |
| Dashboard | `/api/dashboard` | Sí |

Cada persona solo puede ver y cambiar **sus propios** datos. Si pide algo de otra persona, la API responde `404`, igual que si no existiera. Al eliminar algo se hace un **soft delete** (borrado lógico): la fila no se borra de MySQL, solo se llena `deleted_at` con la fecha, y desde ahí la API la ignora.

## Usuarios

### Registro

```http
POST /api/users
```

```json
{
  "nombre": "Ana García",
  "correo": "ana@ejemplo.com",
  "password": "123456",
  "idRol": 1
}
```

- El registro es público, pero **solo se permite `idRol: 1`**. Las cuentas de soporte se asignan directamente en la base de datos.
- El correo no puede estar registrado antes.
- La contraseña debe tener mínimo 6 caracteres. Se guarda cifrada con bcrypt y nunca se devuelve.
- La respuesta es `{ id, name, email, roleId }`.

| Código | Cuándo pasa |
|---|---|
| 201 | Usuario creado |
| 400 | Falta un dato o está mal escrito |
| 403 | Se intentó registrar con un rol distinto de 1 |
| 404 | El rol no existe |
| 409 | El correo ya está registrado |

### Rutas protegidas

| Ruta | Quién puede usarla |
|---|---|
| `GET /api/users` | Solo soporte |
| `GET /api/users/:id` | El mismo usuario o soporte |
| `PUT /api/users/:id` | El mismo usuario o soporte. Un usuario normal no puede cambiarse el rol |
| `PATCH /api/users/:id/status` | Solo soporte |
| `DELETE /api/users/:id` | El mismo usuario o soporte |

## Dashboard y hábitos

El dashboard está pensado para que la persona, al entrar, vea de forma rápida lo que tiene pendiente para el día. La **agenda del día** se puede filtrar por módulo y por categoría (por ejemplo, ver solo reuniones y gastos), y esa preferencia se guarda en el navegador. También se pueden acomodar los widgets según lo que cada persona prefiera. Están en desarrollo el **calendario con detalle por día** y un **mensaje motivacional personalizable**, donde la persona anote sus propias frases y se muestren de forma rotativa.

El endpoint del dashboard devuelve el nombre del usuario, un resumen de las tareas y hábitos del día y lo que viene próximo. Para saber qué día es "hoy" usa la zona horaria `America/Bogota`.

Por ahora los hábitos se manejan de forma diaria; el campo `frequency` es texto libre. Está pendiente permitir recordatorios repetidos durante el día (por ejemplo, tomar agua cada 2 o 3 horas).

Los hábitos se marcan por día. Al completar un hábito se guarda una fila en `habit_completions` con la fecha de hoy. Si vuelve a `pendiente`, solo se borra el registro de hoy; los días anteriores no cambian. También se puede guardar una hora de recordatorio (`reminderTime`) si la categoría tiene `isRecurring` activado; por ahora la hora solo se guarda, **todavía no se envían notificaciones**.

## Categorías

Las categorías permiten clasificar la información. Se crearon para facilitar la gestión de las finanzas (por ejemplo, separar gastos fijos de gastos variables), y después se extendieron a tareas, hábitos y eventos. Cada persona puede usar las categorías predeterminadas o **crear, editar y desactivar las suyas**.

Cada usuario tiene sus propias categorías por módulo (`finance`, `tasks`, `habits`, `events`). La primera vez que pide `GET /api/categories?module=...`, la API le crea unas predeterminadas para `finance`, `tasks` y `habits`. `events` no tiene predeterminadas.

| Módulo | Categoría | Descripción inicial |
|---|---|---|
| `finance` | Ingresos, Gastos fijos, Gastos variables, Gastos Hormiga, Cuentas por cobrar | — |
| `tasks` | Top 3 del día | Innegociables del día |
| `tasks` | Secundarias | Puede reprogramarse |
| `tasks` | Mantenimiento | Tareas mecánicas o repetitivas |
| `habits` | Salud y bienestar | Hábitos para cuidar la salud física y emocional |
| `habits` | Crecimiento | Hábitos de aprendizaje y desarrollo personal |
| `habits` | Administrativo | Gestiones y organización personal |

Cada categoría tiene icono, color hexadecimal (`#RRGGBB`), una descripción opcional de hasta 250 caracteres e `isRecurring`, que permite que las tareas, eventos y movimientos de esa categoría se repitan. Borrar una categoría solo la desactiva; los registros que la usan se conservan.

## Finanzas

Este módulo nació como un registro de gastos y creció hasta cubrir también los ingresos (ver [Cómo evolucionó el módulo de finanzas](#cómo-evolucionó-el-módulo-de-finanzas)). Los ingresos y gastos se guardan en la misma tabla `expenses`:

- `amount` positivo = ingreso; negativo = gasto. No puede ser 0 y acepta máximo 2 decimales.
- `categoryId` es obligatorio y debe ser una categoría del módulo `finance` del usuario.
- `expense_date` y `notes` son opcionales (sin fecha, usa la de hoy).
- En la interfaz los montos se escriben en pesos enteros, porque en COP los decimales casi no se usan. La API acepta hasta 2 decimales.
- `GET /api/expenses/summary` devuelve `income`, `expenses` y `balance` del mes actual.

```json
{
  "concept": "Supermercado",
  "categoryId": 12,
  "amount": -150.50,
  "expense_date": "2026-09-21",
  "notes": "Compra mensual"
}
```

### Pagos e ingresos recurrentes

Se crean con `POST /api/expenses/recurrences`, usando una categoría con `isRecurring: true` y una frecuencia (`daily`, `weekly`, `monthly` o `yearly`).

- La API deja un recordatorio pendiente que sigue vencido hasta que se confirma o se cancela.
- Al confirmarlo (`PATCH /api/expenses/recurrences/occurrences/:occurrenceId/confirm`) se registra el movimiento y se crea el siguiente recordatorio. Se puede enviar `paidDate` (`YYYY-MM-DD`); si no, usa hoy.
- Al cancelar (`DELETE /api/expenses/recurrences/:id?scope=future|all`): `future` detiene las fechas futuras; `all` elimina la recurrencia y sus recordatorios pendientes. En ambos casos los movimientos ya confirmados se conservan.

### Tareas y eventos que se repiten

Si la categoría tiene `isRecurring`, una tarea o un evento puede tener `recurrenceFrequency` (`daily`, `weekly`, `monthly` o `yearly`). La siguiente tarea se crea cuando la actual se marca como `completada`, y el siguiente evento cuando el actual se marca como `realizado`. Si no se completa, queda vencida; no se crean copias solas.

## Pruebas con Postman

La colección está en [`docs/postman/ritmo.postman_collection.json`](docs/postman/ritmo.postman_collection.json).

1. En Postman: **Import** y seleccionar el archivo.
2. Revisar que la variable `baseUrl` sea `http://localhost:3000`.
3. Con el backend corriendo, abrir la colección y usar **Run collection** (Collection Runner).

**Cómo está armada:**

- Cuatro carpetas: Usuarios y autenticación, Tareas, Finanzas y Seguridad.
- Cubre el registro, el correo duplicado (`409`), el inicio de sesión, crear, actualizar y eliminar una tarea, un error de validación (`400`), un gasto con categoría, la ruta sin token (`401`) y el acceso sin permiso (`403`).
- Al iniciar sesión, el token se guarda solo en la variable `{{token}}`, y todas las peticiones privadas lo usan.
- Cada ejecución crea un usuario nuevo con un correo distinto, para no chocar con datos anteriores.
- Cada petición tiene tests que revisan el código de respuesta y el mensaje.
- La prueba de acceso sin permiso (`403`) usa un usuario normal. Las pruebas de una cuenta de soporte no están en el Runner, porque esa cuenta se crea directamente en la base de datos.

## Requerimientos

Ritmo se construyó a partir de los requisitos funcionales (RF), los requisitos no funcionales (RNF), los casos de uso (CU) y las historias de usuario (HU) del documento del proyecto. Esta sección resume cómo los cubre la aplicación y qué mejoras se hicieron después.

### Requisitos funcionales

| ID | Requisito | Dónde se cumple | Estado |
|---|---|---|---|
| RF-01 | Registro de usuarios mediante formulario | API: `POST /api/users` | API completa; la pantalla de registro está pendiente |
| RF-02 | Inicio de sesión con correo y contraseña | API: `POST /api/auth/login`; pantalla de login | Completo |
| RF-03 | Validar los campos obligatorios | Validators de cada módulo (respuesta `400`) | Completo |
| RF-04 | Mostrar mensajes de error cuando hay campos inválidos | Middleware de errores (`{ "message": "..." }`) y mensajes en las pantallas | Completo |
| RF-05 | Dashboard principal con resumen de actividades | API: `GET /api/dashboard`; pantalla del dashboard | Completo |
| RF-06 | Visualizar tareas pendientes | API: `GET /api/tasks` (devuelve las tareas con su estado) | Completo |
| RF-07 | Visualizar hábitos registrados | API: `/api/habits` | Completo |
| RF-08 | Registrar gastos personales | API: `/api/expenses` y `/api/categories` | Completo, ampliado a finanzas |
| RF-09 | Visualizar eventos programados | API: `/api/events` | Completo |
| RF-10 | Navegación entre secciones principales | Frontend | Completo |
| RF-11 | Adaptarse a diferentes tamaños de pantalla | Frontend (diseño responsive) | Completo |

### Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Diseño responsive para móviles, tablets y escritorio |
| RNF-02 | Consistencia visual en todas las pantallas |
| RNF-03 | Principios de accesibilidad web |
| RNF-04 | Formularios con retroalimentación al usuario *(completar el texto según el documento del proyecto)* |

Estos requisitos corresponden sobre todo al frontend. En la API se cumplen además dos criterios técnicos: el JWT se valida en cada ruta privada y las consultas a MySQL usan parámetros.

### Mejoras sobre el planteamiento inicial

Además de lo planteado en el documento, durante el desarrollo se agregó:

- **Finanzas con categorías:** los gastos pasaron a ser ingresos y gastos clasificados por categoría (detalle en la siguiente sección).
- **Categorías propias** en finanzas, tareas, hábitos y eventos.
- **Pagos recurrentes** con recordatorios que se confirman o se cancelan.
- **Tareas y eventos que se repiten** (diario, semanal, mensual o anual).
- **Seguimiento diario de hábitos:** cada hábito se marca por día, sin afectar los días anteriores, y puede guardar una hora de recordatorio.
- **Dashboard personalizable:** progreso del día, agenda con filtros por módulo y categoría, widgets que la persona acomoda y calendario con los días que tienen compromisos.
- **Roles:** usuario y soporte, con rutas de administración solo para soporte.
- **Recuperación de contraseña** con token.

### Cómo evolucionó el módulo de finanzas

El requisito inicial (RF-08, HU-16 a HU-18) planteaba solo el **registro de gastos personales**, con concepto, valor, categoría y fecha, donde la categoría era un texto dentro del gasto.

Al desarrollar el módulo se vio que ese enfoque era limitado: la persona necesita también registrar sus **ingresos** y poder **clasificar** sus movimientos para entender en qué se le va el dinero. Por eso se hicieron estos ajustes:

- Se creó una **tabla de categorías** (`categories`) y cada movimiento se asocia a una categoría con `categoryId`. La migración 2 pasó las categorías de texto de los gastos a esa tabla y eliminó la columna vieja `expenses.category`.
- El módulo pasó de "gastos" a **finanzas**: ingresos y gastos en la misma tabla, diferenciados por el signo del valor (positivo = ingreso, negativo = gasto).
- Cada persona recibe **categorías predeterminadas** para clasificar sus movimientos (Ingresos, Gastos fijos, Gastos variables, Gastos hormiga y Cuentas por cobrar) y también puede **crear sus propias categorías**, con nombre, ícono y color.
- Los movimientos se pueden **filtrar por categoría** (`GET /api/expenses?categoryId=`), y `GET /api/expenses/summary` entrega el resumen del mes (ingresos, gastos y balance).
- Se agregaron los **pagos recurrentes**, para cosas que se repiten, como el arriendo.

Como consecuencia, la regla "el valor debe ser mayor que cero" del caso de uso original (CU-07) cambió: ahora el valor **no puede ser 0**, y su signo indica si es ingreso o gasto.

El mismo sistema de categorías se reutiliza en **tareas, hábitos y eventos**, para que la persona organice todo con el mismo criterio.

## Seguridad

- Las contraseñas se guardan cifradas con bcrypt, nunca en texto plano.
- Las consultas SQL usan parámetros (`?`), que evitan la inyección SQL.
- Los archivos `.env` del backend y del frontend están en `.gitignore`. En GitHub solo están los `.env.example`.
- La recuperación de contraseña (`/api/auth/forgot-password`) devuelve el token en la respuesta **solo para poder probarla en Postman**. En una versión de producción ese token debería llegar por correo.

## Estado actual

| Estado | Qué |
|---|---|
| ✅ | Arquitectura por capas, conexión a MySQL y manejo de errores centralizado |
| ✅ | Registro de usuarios (solo rol usuario) e inicio de sesión con JWT |
| ✅ | Roles usuario y soporte; rutas de usuarios protegidas por token, dueño o rol |
| ✅ | Recuperación de contraseña con token (sin envío de correo) |
| ✅ | Tareas: CRUD, estados, prioridad, categoría y repetición |
| ✅ | Hábitos: CRUD y seguimiento por día |
| ✅ | Eventos: CRUD, marcar como realizado y repetición |
| ✅ | Finanzas: ingresos y gastos, resumen del mes y pagos recurrentes |
| ✅ | Categorías por módulo |
| ✅ | Dashboard con el resumen del día |
| ✅ | Frontend en React que consume la API (login, dashboard, tareas, hábitos, eventos, finanzas y categorías) |
| ✅ | Colección de Postman en `docs/postman/` |
| ❌ | Calendario con detalle del día al hacer clic (en desarrollo) |
| ❌ | Mensaje motivacional personalizable en el dashboard (en desarrollo) |
| ❌ | Hábitos con recordatorios repetidos durante el día (por ejemplo, cada 2 o 3 horas) |
| ❌ | Pruebas automatizadas (`npm test` todavía no tiene pruebas) |
| ❌ | Script del esquema base de la base de datos en el repositorio |
| ❌ | Pantallas de registro, recuperación de contraseña y administración de usuarios en el frontend |
| ❌ | Envío de correos y notificaciones (los recordatorios solo se guardan y se muestran dentro de la app) |
| ❌ | Una categoría desactivada no deja crear otra con el mismo nombre |
| ❌ | El login todavía no revisa el campo `status`: un usuario desactivado (pero no eliminado) puede iniciar sesión |

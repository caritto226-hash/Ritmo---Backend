# Ritmo Backend

Backend para la aplicación de organización personal **Ritmo**, desarrollado con Node.js, Express y MySQL. La API sigue una arquitectura modular y una separación clara por capas para mantener el código mantenible y escalable.

## Descripción

Ritmo es una solución para gestionar:

- Usuarios
- Tareas
- Hábitos
- Eventos
- Gastos personales

El proyecto está pensado para seguir una estructura por módulos, con la idea de crecer de forma ordenada sin mezclar responsabilidades.

## Stack principal

- Node.js
- Express
- CommonJS
- MySQL
- mysql2/promise
- bcrypt
- dotenv
- nodemon

## Arquitectura

Cada módulo sigue el flujo:

- Route
- Validator
- Controller
- Service
- Repository
- MySQL

Esto ayuda a separar:

- validación de entrada
- control de la petición HTTP
- lógica de negocio
- acceso a datos

## Estructura del proyecto

```text
src/
  app.js
  server.js
  config/
    mysql.js
  middlewares/
    error.middleware.js
  modules/
    users/
      index.js
      users.routes.js
      users.validator.js
      users.controller.js
      users.service.js
      users.repository.js
    expenses/
      index.js
      expenses.routes.js
      expenses.validator.js
      expenses.controller.js
      expenses.service.js
      expenses.repository.js
  utils/
```

## Requisitos previos

- Node.js 18 o superior
- MySQL 8 o compatible
- Base de datos creada localmente o en un servidor accesible
- Variables de entorno configuradas

## Instalación

1. Clona el repositorio.
2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` basado en `.env.example`.

## Variables de entorno

Ejemplo de configuración:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ritmo_db
DB_PORT=3306
```

## Ejecutar la aplicación

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

La API estará disponible en:

```text
http://localhost:3000
```

## Health check

```http
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

## Dashboard y seguimiento diario de hábitos

El dashboard devuelve el nombre del usuario autenticado, un resumen de tareas y hábitos del día y los elementos próximos. El cálculo diario utiliza la zona horaria `America/Bogota`.

Los hábitos se completan por día y por usuario. Su estado no se guarda como un cambio permanente en el hábito: cada marca de completado se almacena en `habit_completions`, asociada a la fecha local de Bogotá. Al consultar un hábito, `status` indica su estado para el día actual. Cambiarlo a `pendiente` elimina únicamente el registro de esa fecha. Las categorías incluyen `isRecurring`; en hábitos, esta opción permite guardar una hora de recordatorio adicional (`reminderTime`) sin sustituir la frecuencia existente.

### Requisito de base de datos

Antes de iniciar una versión del backend que incluya el seguimiento diario, aplica la migración una vez en la base de datos indicada por `DB_NAME`:

```sh
mysql --host=DB_HOST --user=DB_USER --password DB_NAME < database/migrations/20261007_create_habit_completions.sql
```

Sustituye `DB_HOST`, `DB_USER` y `DB_NAME` por los valores de tu entorno. El cliente solicitará la contraseña de forma interactiva. En Windows, el comando puede ejecutarse desde PowerShell o CMD si `mysql` está instalado y disponible en `PATH`.

La migración utiliza `CREATE TABLE IF NOT EXISTS`, por lo que puede ejecutarse de nuevo sin recrear la tabla ni eliminar sus registros. Asegúrate de aplicarla en la misma base de datos a la que se conecta la instancia del backend.

### Verificación de la API

La ruta `GET /health` comprueba que el servidor esté disponible. Para las rutas autenticadas, primero obtén un JWT con `POST /api/auth/login` y envíalo como:

```http
Authorization: Bearer <token>
```

Pruebas de lectura recomendadas en Postman:

| Método | Ruta | Resultado esperado |
|---|---|---|
| GET | `/api/habits` | `200`; lista de hábitos con el estado correspondiente a hoy |
| GET | `/api/dashboard` | `200`; incluye `user`, `todayRitmo` y `upcoming` |
| GET | `/api/tasks` | `200`; lista de tareas del usuario autenticado |
| GET | `/api/events` | `200`; lista de eventos del usuario autenticado |
| GET | `/api/expenses` | `200`; lista de movimientos financieros del usuario autenticado |
| GET | `/api/expenses/summary` | `200`; resumen mensual con `income`, `expenses` y `balance` |
| GET | `/api/categories?module=tasks` | `200`; lista categorías y crea las predeterminadas lazy |

También se deben comprobar las respuestas de autenticación y validación: una ruta privada sin token responde `401`, una operación no permitida por rol responde `403` y un cuerpo inválido responde `400`. Las pruebas de creación, actualización, cambio de estado y eliminación escriben datos; ejecútalas solo en una base de pruebas o usando registros de prueba controlados.

## Historia de usuario para el manual

**HU-01 — Consultar mi progreso diario y registrar mis hábitos**

Como persona usuaria de Ritmo, quiero ver mi nombre, el progreso de mis tareas y hábitos del día y mis hábitos pendientes en el dashboard, y poder marcar cada hábito como completado, para hacer seguimiento de mi rutina diaria sin afectar el cumplimiento de otros días.

### Criterios de aceptación

1. El dashboard presenta el nombre de la persona autenticada.
2. El resumen diario muestra los conteos completados y totales de tareas y hábitos, además del total pendiente y el porcentaje de progreso.
3. El estado diario de los hábitos se calcula con la fecha de `America/Bogota`.
4. Marcar un hábito como completado registra el cumplimiento para la persona, el hábito y la fecha actuales.
5. Desmarcarlo elimina solo el cumplimiento de la fecha actual; no altera fechas anteriores.
6. Las consultas de hábitos y del dashboard reflejan el estado diario almacenado.
7. Cada persona solo consulta y modifica sus propios hábitos y datos.

### Requerimientos funcionales

- **RF-01:** La API debe proporcionar el nombre del usuario autenticado para personalizar el saludo del dashboard.
- **RF-02:** La API debe calcular el progreso diario combinando tareas correspondientes al día actual y hábitos activos del usuario.
- **RF-03:** La API debe exponer el desglose de tareas y hábitos, junto con los conteos totales, completados y pendientes.
- **RF-04:** El estado de cumplimiento de un hábito debe almacenarse por usuario, hábito y fecha, usando la zona horaria `America/Bogota`.
- **RF-05:** Las consultas de hábitos deben devolver `pendiente` o `completado` según exista un registro para la fecha actual.
- **RF-06:** Cambiar un hábito a `pendiente` debe retirar únicamente el registro de cumplimiento del día actual.
- **RF-07:** Las operaciones de lectura y modificación deben limitarse a los recursos de la persona autenticada.
- **RF-08:** El dashboard debe reunir hábitos pendientes y elementos próximos disponibles para ese usuario.

### Requerimientos no funcionales y de despliegue

- **RNF-01:** La API debe validar el JWT y centralizar las respuestas de error HTTP.
- **RNF-02:** Las consultas a MySQL deben parametrizar los valores de entrada.
- **RD-01:** La tabla `habit_completions` debe existir antes de utilizar las rutas de hábitos o dashboard de esta versión.
- **RD-02:** Aplicar `database/migrations/20261007_create_habit_completions.sql` en cada base de datos de entorno antes de desplegar el backend actualizado.

## Categorías de tareas y hábitos

El endpoint autenticado `GET /api/categories?module=X` crea las categorías predeterminadas al primer acceso de cada usuario a `tasks` o `habits`. Las categorías incluyen icono, color hexadecimal y una descripción opcional editable de hasta 250 caracteres. El CRUD de categorías permite crear, editar y desactivar categorías propias.

| Módulo | Categoría | Descripción inicial |
|---|---|---|
| `tasks` | Top 3 del día | Innegociables del día |
| `tasks` | Secundarias | Puede reprogramarse |
| `tasks` | Mantenimiento | Tareas mecánicas o repetitivas |
| `habits` | Salud y bienestar | Hábitos para cuidar la salud física y emocional |
| `habits` | Crecimiento | Hábitos de aprendizaje y desarrollo personal |
| `habits` | Administrativo | Gestiones y organización personal |

Tareas y hábitos aceptan `categoryId` opcional al crear o actualizar. La respuesta incluye el identificador y el objeto `category` con nombre, descripción, icono y color. Los registros históricos no se clasifican automáticamente y conservan `categoryId: null`.

Antes de desplegar esta ampliación, aplicar `database/migrations/20261007_add_task_habit_categories.sql` en la base correspondiente. Esta migración agrega `categories.description` y relaciones nullable desde `tasks` y `habits`; no modifica ni reclasifica sus registros existentes.

## Módulo de gastos

El módulo de gastos permite crear, consultar, actualizar y eliminar gastos personales. Todas sus rutas requieren un token JWT válido y cada operación se ejecuta usando el `user_id` del usuario autenticado.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/expenses` | Crear un gasto |
| GET | `/api/expenses` | Listar los gastos del usuario autenticado; permite filtro por `categoryId` |
| GET | `/api/expenses/:id` | Consultar un gasto propio por ID |
| PUT | `/api/expenses/:id` | Actualizar uno o varios campos del gasto |
| DELETE | `/api/expenses/:id` | Eliminar un gasto mediante soft delete |
| POST | `/api/expenses/recurrences` | Programar un pago o ingreso recurrente |
| GET | `/api/expenses/recurrences/reminders` | Listar recordatorios pendientes, vencidos y próximos |
| PATCH | `/api/expenses/recurrences/occurrences/:occurrenceId/confirm` | Confirmar pago/recepción y registrar el movimiento |
| DELETE | `/api/expenses/recurrences/:id?scope=future\|all` | Detener fechas futuras o eliminar recordatorios de la recurrencia |

Todas las rutas requieren el header `Authorization: Bearer <token>`.

### Crear un gasto

```http
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json
```

Body de ejemplo:

```json
{
  "concept": "Supermercado",
  "categoryId": 12,
  "amount": 150.50,
  "expense_date": "2026-09-21",
  "notes": "Compra mensual"
}
```

### Reglas de validación

- `concept` es obligatorio, debe ser texto y admite hasta 100 caracteres.
- `categoryId` es obligatorio y debe identificar una categoría activa del módulo `finance` perteneciente al usuario autenticado.
- `amount` es obligatorio, debe ser distinto de cero y tener como máximo dos decimales (positivo para ingresos, negativo para gastos).
- `expense_date` es opcional y debe usar el formato `YYYY-MM-DD` cuando se envía. Si se omite, se utiliza la fecha actual.
- `notes` es opcional y debe ser texto cuando se envía.

### Ownership y eliminación

Cada gasto pertenece a un usuario mediante `user_id`. El usuario autenticado solo puede consultar, actualizar o eliminar sus propios gastos. Si el gasto no existe, pertenece a otra cuenta o fue eliminado, la API responde con `404` genérico.

La eliminación utiliza soft delete: se registra la fecha en `deleted_at` y el gasto deja de aparecer en los listados y consultas normales. El módulo no incluye un endpoint de cambio de estado porque la tabla `expenses` no tiene un campo `status`.

### Pagos e ingresos recurrentes

Una recurrencia se crea explícitamente desde Finanzas y admite las frecuencias `daily`, `weekly`, `monthly` y `yearly`. `startDate` define la primera fecha programada; mensual/anual conserva el día inicial y usa el último día disponible del período cuando ese día no existe. La API mantiene un solo recordatorio pendiente por recurrencia, que permanece vencido hasta confirmarse o cancelarse.

```http
POST /api/expenses/recurrences
Authorization: ******
Content-Type: application/json
```

```json
{
  "concept": "Arriendo",
  "categoryId": 12,
  "amount": -850000,
  "frequency": "monthly",
  "startDate": "2026-10-07",
  "notes": "Pago del arriendo"
}
```

Al confirmar una ocurrencia se puede enviar `paidDate` (`YYYY-MM-DD`); si se omite, se usa la fecha actual de `America/Bogota`. El movimiento conserva la fecha prevista en `scheduledDate` y registra `expenseDate` con la fecha real de pago/recepción. Un monto positivo representa ingreso y uno negativo representa gasto. La siguiente ocurrencia se crea en la misma transacción que el movimiento confirmado, evitando duplicados.

Cancelar con `scope=future` detiene nuevas fechas y conserva movimientos históricos y recordatorios vencidos no atendidos. `scope=all` elimina la recurrencia y sus recordatorios pendientes; los movimientos históricos confirmados se conservan. Ambas operaciones son por usuario autenticado.

Antes de desplegar esta funcionalidad, aplica una vez `database/migrations/20261007_create_expense_recurrences.sql` en la misma base de datos configurada en `DB_NAME`. Haz una copia de seguridad antes de alterar el esquema.

### Tabla `expenses`

La tabla utiliza las siguientes columnas:

```text
id, user_id, category_id, recurrence_id, concept, amount,
expense_date, scheduled_date, notes, deleted_at, created_at
```

Las respuestas incluyen `categoryId` y un objeto `category` con el nombre, icono y color. `GET /api/expenses?categoryId=12` filtra por categoría. Antes de iniciar esta versión, aplica `database/migrations/20261007_create_categories_and_migrate_expenses.sql`; importa las etiquetas anteriores a categorías por usuario y elimina la columna de texto `category` después de validar la asociación de todos los gastos. Haz una copia de seguridad de la base de datos antes de ejecutar la migración.

Las categorías pueden habilitar `isRecurring` para mostrar las opciones de repetición en finanzas, tareas y eventos. Las tareas y eventos recurrentes avanzan al siguiente periodo solo cuando la ocurrencia actual se completa; si continúa pendiente, permanece vencida. Aplica `database/migrations/20261008_add_category_recurrence_and_activity_reminders.sql` después de las migraciones de categorías y relaciones task/habit. La recurrencia usa las frecuencias `daily`, `weekly`, `monthly` y `yearly`, y conserva el día inicial para periodos con distinta longitud.

## Módulo de usuarios

Actualmente el módulo base de usuarios ya está implementado.

### Crear usuario

```http
POST /api/users
```

Body de ejemplo:

```json
{
  "nombre": "Ana García",
  "correo": "ana@ejemplo.com",
  "password": "123456",
  "idRol": 1
}
```

### Reglas de negocio:

El correo no debe existir previamente.
El rol debe existir.
La contraseña se cifra con bcrypt antes de guardarse.
La contraseña nunca se devuelve en la respuesta.

### Respuestas:

Código	Motivo	Capa donde se detiene
- 201	Usuario creado exitosamente	—
- 400	Datos inválidos (nombre, correo, contraseña o rol mal formados)	Validator
- 404	El rol indicado no existe	Service
- 409	El correo ya está registrado	Service
- 500	Error interno del servidor	—

### Pruebas

Los casos de prueba fueron diseñados cubriendo creación exitosa, correo duplicado, rol inexistente y validaciones de formato (nombre, correo, contraseña y rol). Las pruebas se ejecutan con Postman contra http://localhost:3000/api/users.

### Seguridad

Las contraseñas se almacenan cifradas con bcrypt, nunca en texto plano.
Las consultas SQL usan parámetros (?) para prevenir inyección SQL.
.env está excluido de Git mediante .gitignore; solo .env.example se versiona.

### Estado actual del proyecto
 Inicialización del proyecto y configuración de Git.
 Arquitectura base por capas.
 Conexión a MySQL mediante pool.
 Middleware global de manejo de errores.
 Módulo users completo (POST /api/users).
 Módulo de tareas.
 Módulo de hábitos.
 Módulo de eventos.
 Módulo de gastos y presupuestos.
 Tareas automáticas (cron jobs).
 Dashboard y reportes.


Este proyecto sigue principios de separación de responsabilidades, mantenibilidad y seguridad. Cualquier cambio nuevo debe respetar la arquitectura por capas y no mezclar lógica de negocio con acceso a datos.

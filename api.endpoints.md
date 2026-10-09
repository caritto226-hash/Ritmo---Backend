# Documentación de Endpoints — API Ritmo

**Base URL:** `http://localhost:3000/api`

**Autenticación:** los endpoints marcados como 🔒 requieren el header:
```
Authorization: Bearer <token_jwt>
```
El token se obtiene en `POST /auth/login`.

---

## 1. Autenticación (`/auth`)

### POST `/auth/login`
Inicia sesión y devuelve un token JWT.

**Body:**
```json
{
  "correo": "usuario@ejemplo.com",
  "contraseña": "123456"
}
```

**Respuesta exitosa — 200 OK:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

**Errores:**
| Código | Motivo |
|---|---|
| 400 | Correo o contraseña vacíos / formato inválido |
| 401 | Credenciales inválidas (correo no existe o contraseña incorrecta) |

---

### POST `/auth/forgot-password`
Solicita recuperación de contraseña. Responde igual exista o no el correo (por seguridad).

**Body:**
```json
{ "correo": "usuario@ejemplo.com" }
```

**Respuesta — 200 OK:**
```json
{
  "message": "Si el correo existe, recibirás instrucciones de recuperación",
  "token": "abc123..." 
}
```
> Nota: el `token` solo se incluye con fines de prueba académica. En producción se enviaría por correo electrónico y nunca se devolvería en la respuesta.

---

### POST `/auth/reset-password`
Restablece la contraseña usando el token recibido.

**Body:**
```json
{
  "token": "abc123...",
  "nuevaContrasena": "nuevaClave123"
}
```

**Respuesta — 200 OK:**
```json
{ "message": "Contraseña actualizada correctamente" }
```

**Errores:**
| Código | Motivo |
|---|---|
| 400 | Token inválido, expirado o ya utilizado |

---

## 2. Usuarios (`/users`)

### POST `/users`
Registra un nuevo usuario.

**Body:**
```json
{
  "nombre": "Ana García",
  "correo": "ana@ejemplo.com",
  "password": "123456",
  "idRol": 1
}
```

**Respuesta — 201 Created:**
```json
{ "id": 5, "nombre": "Ana García", "correo": "ana@ejemplo.com", "idRol": 1 }
```

**Errores:** `400` datos inválidos · `404` rol no existe · `409` correo ya registrado

---

### GET `/users` 🔒 *(solo rol soporte)*
Lista todos los usuarios activos.

**Respuesta — 200 OK:**
```json
[ { "id": 1, "name": "...", "email": "...", "roleId": 1 }, ... ]
```
**Errores:** `401` sin token · `403` rol distinto de soporte

---

### GET `/users/:id` 🔒
Consulta un usuario por ID.

**Respuesta — 200 OK / Errores:** `404` no existe

---

### PUT `/users/:id` 🔒
Actualiza nombre, correo o rol (no contraseña).

**Body:**
```json
{ "nombre": "Ana G.", "correo": "ana2@ejemplo.com", "idRol": 1 }
```
**Errores:** `400` inválido · `404` no existe · `409` correo en uso por otro usuario

---

### PATCH `/users/:id/status` 🔒
Activa/desactiva un usuario.

**Body:** `{ "status": false }`
**Errores:** `400` status no booleano · `404` no existe

---

### DELETE `/users/:id` 🔒
Eliminación lógica (soft delete).

---

## 3. Categorías (`/categories`) 🔒

Las categorías pertenecen a un usuario y a un módulo (`finance`, `tasks`, `habits` o `events`). Cada categoría incluye nombre, descripción opcional, clave de icono, color hexadecimal, estado y `isRecurring`, que habilita opciones de recurrencia en los registros de esa categoría.

### GET `/categories?module=finance`
Lista las categorías activas del usuario para el módulo indicado. El parámetro `module` es obligatorio. Si el usuario aún no tiene categorías predeterminadas en `finance`, `tasks` o `habits`, se crean de forma lazy e idempotente. `events` no tiene categorías predeterminadas en esta fase.

**Respuesta — 200 OK:**
```json
{
  "data": [
    {
      "id": 12,
      "userId": 4,
      "module": "finance",
      "name": "Ingresos",
      "description": null,
      "icon": "circle-dollar-sign",
      "color": "#2E7D32",
      "isRecurring": false,
      "isDefault": true,
      "isActive": true,
      "createdAt": "2026-10-07T07:00:00.000Z",
      "updatedAt": "2026-10-07T07:00:00.000Z"
    }
  ]
}
```

### POST `/categories`
**Body:**
```json
{
  "module": "finance",
  "name": "Ahorro",
  "icon": "piggy-bank",
  "color": "#1565C0",
  "isRecurring": true
}
```

`module` acepta `finance`, `tasks`, `habits` o `events`; `name` es obligatorio y admite hasta 100 caracteres; `description` es opcional y admite hasta 250 caracteres; `icon` debe ser una clave permitida; `color` debe cumplir `#RRGGBB`; `isRecurring` es opcional y por defecto `false`.

### GET `/categories/:id`
Consulta una categoría activa que pertenezca al usuario autenticado.

### PATCH `/categories/:id`
Actualiza uno o más de los campos `name`, `description`, `icon`, `color` e `isRecurring`. `module` no se puede cambiar; se requiere al menos un campo.

### DELETE `/categories/:id`
Desactiva la categoría mediante borrado lógico; no elimina la categoría ni los gastos asociados.

La comparación de nombres elimina espacios iniciales/finales y no distingue mayúsculas/minúsculas. Un nombre repetido dentro del mismo usuario y módulo responde `409`; el índice único también reserva el nombre de categorías desactivadas. La API admite estas claves de icono: `wallet`, `circle-dollar-sign`, `house`, `shopping-bag`, `coffee`, `receipt`, `credit-card`, `piggy-bank`, `landmark`, `briefcase`, `circle-help`, `tag`, `heart`, `calendar-days`, `target`, `book-open`, `list-checks`, `wrench`, `heart-pulse` y `clipboard-list`.

> La tabla `categories` y la nueva relación con `expenses` requieren aplicar la migración `Ritmo - Backend/database/migrations/20261007_create_categories_and_migrate_expenses.sql` junto con el código actualizado de gastos. La migración importa las etiquetas existentes, valida que cada gasto tenga categoría y luego elimina la columna de texto `expenses.category`. Haz una copia de seguridad antes de aplicarla en una base con datos reales.

Las categorías predeterminadas sembradas lazy son:

| Módulo | Categoría | Descripción |
|---|---|---|
| `tasks` | Top 3 del día | Innegociables del día |
| `tasks` | Secundarias | Puede reprogramarse |
| `tasks` | Mantenimiento | Tareas mecánicas o repetitivas |
| `habits` | Salud y bienestar | Hábitos para cuidar la salud física y emocional |
| `habits` | Crecimiento | Hábitos de aprendizaje y desarrollo personal |
| `habits` | Administrativo | Gestiones y organización personal |

Para habilitar `description` en categorías y la asociación opcional de tareas y hábitos, aplica `Ritmo - Backend/database/migrations/20261007_add_task_habit_categories.sql`. Los registros existentes de estos módulos permanecen sin categoría; no se infiere una clasificación histórica.

Para habilitar recurrencias de tareas y eventos, categorías de eventos y horas de recordatorio opcionales para hábitos, aplica después de las migraciones anteriores `Ritmo - Backend/database/migrations/20261008_add_category_recurrence_and_activity_reminders.sql`. Respalda la base antes de modificar el esquema.

---

## 4. Tareas (`/tasks`) 🔒 *(todos requieren token; solo tareas propias)*

### POST `/tasks`
**Body:**
```json
{
  "title": "Estudiar",
  "description": "Repasar SQL",
  "date": "2026-10-05",
  "duration": 60,
  "priority": "media",
  "categoryId": 12,
  "start_at": "2026-10-05T14:00",
  "end_at": "2026-10-05T15:00"
}
```
`duration`, `priority`, `categoryId`, `start_at`, `end_at` y `recurrenceFrequency` son opcionales. `categoryId`, si se envía, debe ser una categoría activa del módulo `tasks` del usuario autenticado. Para definir `recurrenceFrequency` (`daily`, `weekly`, `monthly` o `yearly`), la categoría seleccionada debe tener `isRecurring: true`. La siguiente tarea se crea al marcar la actual como completada; una tarea no completada permanece vencida. Las respuestas incluyen `categoryId`, `recurrenceFrequency` y el objeto `category` (nombre, descripción, icono y color), o `null` para los registros sin clasificación.
**Respuesta — 201 Created**

### GET `/tasks`
Lista las tareas del usuario autenticado (excluye eliminadas).

### GET `/tasks/:id`
**Errores:** `404` no existe o no pertenece al usuario

### PUT `/tasks/:id`
**Body (todos opcionales, al menos uno):**
```json
{ "title": "Nuevo título", "due_date": "2026-10-06", "priority": "alta", "categoryId": 12, "recurrenceFrequency": "weekly" }
```

### PATCH `/tasks/:id/status`
**Body:** `{ "status": "pendiente" | "en_proceso" | "completada" }`

### DELETE `/tasks/:id`
Eliminación lógica.

---

## 5. Hábitos (`/habits`) 🔒

### POST `/habits`
**Body:**
```json
{ "name": "Leer 20 minutos", "frequency": "diario", "goal": 1, "categoryId": 18 }
```
`goal`, `categoryId` y `reminderTime` (`HH:mm`) son opcionales. Si se envía `categoryId`, debe ser una categoría activa del módulo `habits` del usuario autenticado. `reminderTime` requiere una categoría con `isRecurring: true`; se guarda como preferencia horaria adicional sin alterar la frecuencia ni el seguimiento diario del hábito. Esta entrega conserva la hora, pero no envía notificaciones del sistema. Las respuestas incluyen `categoryId`, `reminderTime` y el objeto `category` (nombre, descripción, icono y color), o `null` para los hábitos existentes sin clasificación. El estado diario se inicia como `"pendiente"` para la fecha actual de `America/Bogota`.

### GET `/habits` · GET `/habits/:id`
El campo `status` refleja el cumplimiento del día actual; los días anteriores se conservan en `habit_completions`.

### PUT `/habits/:id`
**Body (opcionales, al menos uno):** `{ "name": "...", "frequency": "...", "goal": 2, "categoryId": 18, "reminderTime": "08:30" }`

### PATCH `/habits/:id/status`
**Body:** `{ "status": "pendiente" | "completado" }`
Actualiza el cumplimiento del hábito para la fecha actual de `America/Bogota`; cambiarlo a pendiente elimina solo el registro de hoy.

### DELETE `/habits/:id`

---

## 6. Eventos (`/events`) 🔒

### POST `/events`
**Body:**
```json
{
  "title": "Reunión de equipo",
  "description": "Revisión de sprint",
  "event_date": "2026-10-10",
  "event_time": "10:30",
  "duration": 60,
  "location": "Sala 2",
  "categoryId": 22,
  "recurrenceFrequency": "monthly"
}
```
`description`, `location`, `categoryId` y `recurrenceFrequency` son opcionales. Para programar recurrencia, la categoría debe habilitar `isRecurring`; el siguiente evento se genera solo al marcar el evento actual como realizado.

### GET `/events` · GET `/events/:id` (si aplica)

### PUT `/events/:id`
Todos los campos opcionales, al menos uno.

### PATCH `/events/:id/status`
**Body:** `{ "status": "realizado" }`. Marca la ocurrencia realizada y, si es recurrente, crea el siguiente evento en la misma transacción.

### DELETE `/events/:id`

---

## 7. Finanzas (`/expenses`) 🔒

### POST `/expenses`
**Body:**
```json
{
  "concept": "Supermercado",
  "categoryId": 12,
  "amount": -150.50,
  "expense_date": "2026-09-21",
  "notes": "Compra mensual"
}
```
`categoryId` debe identificar una categoría activa del módulo `finance` perteneciente al usuario autenticado. `expense_date` (default: hoy) y `notes` son opcionales. `amount` es positivo para ingresos y negativo para gastos; no puede ser cero y acepta máximo 2 decimales. La columna `expenses.amount` debe admitir valores con signo.

La respuesta incluye `categoryId` y el objeto relacionado:
```json
{
  "categoryId": 12,
  "category": {
    "id": 12,
    "module": "finance",
    "name": "Supermercado",
    "icon": "shopping-bag",
    "color": "#EF6C00",
    "isDefault": false,
    "isActive": true
  }
}
```

### GET `/expenses?categoryId=12` · GET `/expenses/:id`
El parámetro opcional `categoryId` filtra los movimientos por categoría.

### GET `/expenses/summary`
Devuelve los totales del mes actual del usuario autenticado.

**Respuesta — 200 OK:**
```json
{
  "data": {
    "income": 1250000,
    "expenses": 480000,
    "balance": 770000
  }
}
```
`expenses` es el total absoluto de los movimientos negativos; `balance` suma los movimientos conservando el signo.

### PUT `/expenses/:id`
Todos los campos opcionales, al menos uno.

### DELETE `/expenses/:id`

---

## 8. Dashboard (`/dashboard`) 🔒

### GET `/dashboard`
Resumen agregado del usuario autenticado.

**Respuesta — 200 OK:**
```json
{
  "data": {
    "user": { "id": 4, "name": "Carolina" },
    "todayRitmo": {
      "completed": 3,
      "total": 5,
      "pending": 2,
      "percentage": 60,
      "tasks": { "completed": 2, "total": 3 },
      "habits": { "completed": 1, "total": 2 }
    },
    "upcoming": [
      { "type": "habit", "id": 1, "name": "Leer", "status": "pendiente" },
      { "type": "task", "id": 8, "title": "Informe", "date": "2026-09-30T05:00:00.000Z" },
      { "type": "event", "id": 2, "title": "Reunión", "date": "2026-10-15T05:00:00.000Z" },
      {
        "type": "expense",
        "id": 5,
        "concept": "Supermercado",
        "categoryId": 12,
        "category": {
          "id": 12,
          "module": "finance",
          "name": "Alimentación",
          "icon": "shopping-bag",
          "color": "#EF6C00",
          "isDefault": false,
          "isActive": true
        },
        "amount": "150.50",
        "date": "2026-09-21T05:00:00.000Z"
      }
    ]
  }
}
```
`user` contiene el nombre del usuario autenticado para personalizar el saludo. `todayRitmo` suma las tareas con fecha de hoy en `America/Bogota` y los hábitos completados para esa fecha; `completed` y `pending` indican su distribución diaria por estado. `tasks` y `habits` exponen el desglose incluido en esos totales. Antes de iniciar el backend, aplicar `Ritmo - Backend/database/migrations/20261007_create_habit_completions.sql` en la base de datos.

---

## Resumen de códigos HTTP usados en toda la API

| Código | Significado |
|---|---|
| 200 | Operación exitosa (consulta, actualización, eliminación) |
| 201 | Recurso creado exitosamente |
| 400 | Datos de entrada inválidos |
| 401 | No autenticado (falta token o es inválido) |
| 403 | Autenticado pero sin permiso (rol incorrecto) |
| 404 | Recurso no encontrado o no pertenece al usuario |
| 409 | Conflicto (ej. correo duplicado) |
| 500 | Error interno del servidor |
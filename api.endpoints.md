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

## 3. Tareas (`/tasks`) 🔒 *(todos requieren token; solo tareas propias)*

### POST `/tasks`
**Body:**
```json
{
  "title": "Estudiar",
  "description": "Repasar SQL",
  "date": "2026-10-05",
  "duration": 60,
  "priority": "media",
  "start_at": "2026-10-05T14:00",
  "end_at": "2026-10-05T15:00"
}
```
`duration`, `priority`, `start_at`, `end_at` son opcionales.
**Respuesta — 201 Created**

### GET `/tasks`
Lista las tareas del usuario autenticado (excluye eliminadas).

### GET `/tasks/:id`
**Errores:** `404` no existe o no pertenece al usuario

### PUT `/tasks/:id`
**Body (todos opcionales, al menos uno):**
```json
{ "title": "Nuevo título", "due_date": "2026-10-06", "priority": "alta" }
```

### PATCH `/tasks/:id/status`
**Body:** `{ "status": "pendiente" | "en_proceso" | "completada" }`

### DELETE `/tasks/:id`
Eliminación lógica.

---

## 4. Hábitos (`/habits`) 🔒

### POST `/habits`
**Body:**
```json
{ "name": "Leer 20 minutos", "frequency": "diario", "goal": 1 }
```
`goal` opcional. `status` inicia siempre en `"pendiente"`.

### GET `/habits` · GET `/habits/:id`

### PUT `/habits/:id`
**Body (opcionales, al menos uno):** `{ "name": "...", "frequency": "...", "goal": 2 }`

### PATCH `/habits/:id/status`
**Body:** `{ "status": "pendiente" | "completado" }`

### DELETE `/habits/:id`

---

## 5. Eventos (`/events`) 🔒

### POST `/events`
**Body:**
```json
{
  "title": "Reunión de equipo",
  "description": "Revisión de sprint",
  "event_date": "2026-10-10",
  "event_time": "10:30",
  "duration": 60,
  "location": "Sala 2"
}
```
`description`, `location` opcionales.

### GET `/events` · GET `/events/:id` (si aplica)

### PUT `/events/:id`
Todos los campos opcionales, al menos uno.

### DELETE `/events/:id`

---

## 6. Finanzas (`/expenses`) 🔒

### POST `/expenses`
**Body:**
```json
{
  "concept": "Supermercado",
  "category": "Alimentación",
  "amount": -150.50,
  "expense_date": "2026-09-21",
  "notes": "Compra mensual"
}
```
`expense_date` (default: hoy) y `notes` opcionales. `amount` es positivo para ingresos y negativo para gastos; no puede ser cero y acepta máximo 2 decimales. La columna `expenses.amount` debe admitir valores con signo.

### GET `/expenses` · GET `/expenses/:id`

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

## 7. Dashboard (`/dashboard`) 🔒

### GET `/dashboard`
Resumen agregado del usuario autenticado.

**Respuesta — 200 OK:**
```json
{
  "data": {
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
      { "type": "expense", "id": 5, "concept": "Supermercado", "amount": "150.50", "date": "2026-09-21T05:00:00.000Z" }
    ]
  }
}
```
`todayRitmo` suma las tareas con fecha de hoy en `America/Bogota` y los hábitos activos; `completed` y `pending` indican su distribución por estado. `tasks` y `habits` exponen el desglose incluido en esos totales.

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
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

## Módulo de gastos

El módulo de gastos permite crear, consultar, actualizar y eliminar gastos personales. Todas sus rutas requieren un token JWT válido y cada operación se ejecuta usando el `user_id` del usuario autenticado.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/expenses` | Crear un gasto |
| GET | `/api/expenses` | Listar los gastos del usuario autenticado |
| GET | `/api/expenses/:id` | Consultar un gasto propio por ID |
| PUT | `/api/expenses/:id` | Actualizar uno o varios campos del gasto |
| DELETE | `/api/expenses/:id` | Eliminar un gasto mediante soft delete |

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
  "category": "Alimentación",
  "amount": 150.50,
  "expense_date": "2026-09-21",
  "notes": "Compra mensual"
}
```

### Reglas de validación

- `concept` es obligatorio, debe ser texto y admite hasta 100 caracteres.
- `category` es obligatoria, debe ser texto y admite hasta 45 caracteres.
- `amount` es obligatorio, debe ser mayor que cero y tener como máximo dos decimales.
- `expense_date` es opcional y debe usar el formato `YYYY-MM-DD` cuando se envía. Si se omite, se utiliza la fecha actual.
- `notes` es opcional y debe ser texto cuando se envía.

### Ownership y eliminación

Cada gasto pertenece a un usuario mediante `user_id`. El usuario autenticado solo puede consultar, actualizar o eliminar sus propios gastos. Si el gasto no existe, pertenece a otra cuenta o fue eliminado, la API responde con `404` genérico.

La eliminación utiliza soft delete: se registra la fecha en `deleted_at` y el gasto deja de aparecer en los listados y consultas normales. El módulo no incluye un endpoint de cambio de estado porque la tabla `expenses` no tiene un campo `status`.

### Tabla `expenses`

La tabla utiliza las siguientes columnas:

```text
id, user_id, concept, category, amount, expense_date,
notes, deleted_at, created_at
```

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

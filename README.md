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

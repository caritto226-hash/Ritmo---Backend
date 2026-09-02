# AGENTS.md

## Proyecto

Ritmo - Organizador Personal es un backend para gestionar tareas, hábitos, eventos y gastos personales. La solución debe seguir principios claros de separación de responsabilidades, seguridad y mantenibilidad.

## Stack obligatorio

- Node.js
- CommonJS
- Express
- MySQL
- mysql2/promise
- Arquitectura modular por módulos

## Convenciones de desarrollo

### 1. Arquitectura por capas

Cada funcionalidad debe seguir este flujo:

Route → Validator → Controller → Service → Repository → MySQL

- Route: define rutas y endpoints HTTP.
- Validator: valida parámetros, body y query strings.
- Controller: recibe la petición y responde; no tiene reglas de negocio.
- Service: contiene la lógica de negocio y coordinación de procesos.
- Repository: ejecuta consultas SQL y accesos a la base de datos.
- MySQL: almacenamiento persistente.

### 2. Restricciones de responsabilidad

- No colocar reglas de negocio dentro del Controller.
- No colocar SQL dentro del Service.
- No mezclar validaciones, lógica de negocio y acceso a datos en un mismo archivo.
- Mantener cada módulo independiente y reutilizable.

### 3. Seguridad

- Nunca guardar contraseñas sin cifrar.
- Usar hashing fuerte antes de persistir credenciales.
- Nunca incluir credenciales reales, tokens, secretos o datos sensibles en el código.
- Usar variables de entorno para configuración sensible.
- Evitar exposiciones de información confidencial en respuestas o logs.

### 4. Organización de módulos

Organizar el proyecto por funcionalidad, por ejemplo:

- src/modules/users
- src/modules/tasks
- src/modules/habits
- src/modules/events
- src/modules/expenses
- src/modules/auth

Cada módulo debe tener una estructura consistente con las capas mencionadas.

### 5. Manejo de errores

- Validar entradas antes de ejecutar la lógica.
- Centralizar el manejo de errores HTTP.
- Devolver mensajes claros y seguros al cliente.
- Registrar errores relevantes sin exponer detalles internos.

### 6. Calidad del trabajo

- Explicar cada cambio antes de realizarlo.
- Modificar pocos archivos en cada etapa.
- No avanzar a la siguiente fase hasta que las pruebas actuales funcionen.
- Corregir la causa raíz antes de continuar con cambios adicionales.
- Mantener el alcance pequeño y controlado por iteración.

## Estructura recomendada

```text
src/
  app.js
  server.js
  config/
    db.js
    env.js
  modules/
    users/
      route.js
      validator.js
      controller.js
      service.js
      repository.js
    tasks/
      route.js
      validator.js
      controller.js
      service.js
      repository.js
    habits/
      route.js
      validator.js
      controller.js
      service.js
      repository.js
    events/
      route.js
      validator.js
      controller.js
      service.js
      repository.js
    expenses/
      route.js
      validator.js
      controller.js
      service.js
      repository.js
  utils/
    response.js
    errors.js
```

## Reglas del flujo de trabajo

1. Comenzar por la base del proyecto: configuración, conexión a MySQL y autenticación.
2. Desarrollar módulos funcionales de forma incremental.
3. Validar cada fase antes de seguir con la siguiente.
4. Mantener la lógica de negocio en Service.
5. Mantener las consultas SQL en Repository.
6. Mantener el código limpio, legible y modular.

## Importante para agentes

- No generar código que rompa CommonJS.
- No usar ES modules en este proyecto.
- No crear credenciales reales en el código.
- No asumir una base de datos local con secretos hardcodeados.
- Priorizar claridad, mantenibilidad y separación de responsabilidades.

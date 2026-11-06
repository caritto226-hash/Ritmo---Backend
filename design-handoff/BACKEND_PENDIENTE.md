# Backend pendiente

Datos que el diseño necesita y la API todavía no ofrece. Mientras tanto el frontend los muestra con estado sin datos ("—" y "Próximamente"), sin datos falsos. El backend no se toca durante el rediseño.

Estado: **Pendiente** (sin trabajo en backend) · **Maquetado** (componente listo con estado sin datos) · **Resuelto**.

Última actualización: fase 2 (shell e Inicio/Hoy). Lo que el Inicio ya muestra con estado sin datos figura como Maquetado.

| # | Pantalla | Componente | Dato que falta | Propuesta técnica | Prioridad | Estado |
|---|---|---|---|---|---|---|
| 1 | Hábitos (web y móvil), Inicio, Hoy | Racha, mejor racha, semana en círculos, mapa de calor "Constancia", "% esta semana" | Historial de cumplimiento por día. `habit_completions` ya lo guarda, pero ningún endpoint lo lee | `GET /api/habits/completions?from=YYYY-MM-DD&to=YYYY-MM-DD` → `[{ habitId, date, count }]` | Alta | Maquetado en Inicio/Hoy (burbuja "racha" y chip de racha en "—"); pendiente en Hábitos |
| 2 | Hábitos, Inicio (burbuja "4/8 agua") | Hábitos de conteo ("+1 vaso", segmentos 4/8) | Conteo por día (solo existe cumplido sí/no) | `ALTER TABLE habit_completions ADD count INT NOT NULL DEFAULT 1` + `PATCH /api/habits/:id/progress { count }`; cumplido cuando `count >= goal` (`goal` ya existe) | Alta | Maquetado en Inicio (burbuja "agua" en "—"; todos los hábitos se marcan con check); pendiente en Hábitos |
| 3 | Finanzas web/móvil | Selector de mes y resumen del mes elegido | `/expenses/summary` solo devuelve el mes actual | `GET /api/expenses/summary?month=YYYY-MM` | Media | Pendiente (mientras tanto se calcula en el cliente desde `GET /expenses`) |
| 4 | Inicio / Hoy | "Tu ritmo de hoy" | `/dashboard.todayRitmo` no cuenta eventos | Agregar `events: { completed, total }` a `todayRitmo` | Media | Pendiente (se calcula en el cliente: `hooks/data/todaySelectors.js` → `selectRitmo`) |
| 5 | Tareas, Eventos, Hoy (Actividad por horas) | "Completadas por día", deltas "+2 / −1", barras por hora | Fecha y hora de completado | Columna `completed_at DATETIME NULL` en `tasks` y `events`; exponer `completed_at` de `habit_completions` | Alta | Maquetado en Hoy ("Actividad": pista vacía y "Próximamente"; el número de hechas sí es real) |
| 6 | Inicio | "Tu frase de hoy" (editar, rotar, racha) | Frases propias del usuario (journal) | Tabla `journal_entries (id, user_id, text, created_at)` + CRUD `/api/journal` | Baja | Maquetado (frases por defecto con "Otra frase"; el lápiz avisa "Próximamente") |
| 7 | Todas | Campana con punto rojo | Notificaciones | Tabla `notifications` + `GET /api/notifications?unread=1` | Baja | Maquetado (campana sin punto; al tocarla avisa "Próximamente") |
| 8 | Inicio, Tareas, Finanzas | Botón Buscar | Búsqueda global | `GET /api/search?q=` sobre tareas, eventos, hábitos y movimientos | Baja | Maquetado en Inicio (avisa "Próximamente"); pendiente en Tareas y Finanzas |
| 9 | Eventos web | "Recordatorio 30 min antes" | Recordatorio del evento | Columna `reminder_minutes INT NULL` en `events` | Media | Pendiente |
| 10 | Hábitos web | "Recordatorios de hoy" (cada 3 horas) | Varios recordatorios por hábito (solo hay un `reminder_time`) | Tabla `habit_reminders (habit_id, time)` o intervalo `reminder_every_minutes` | Baja | Pendiente |
| 11 | Finanzas | Nota bajo el concepto ("Efectivo", "Débito") | Medio de pago | Columna `payment_method VARCHAR(30) NULL` en `expenses` | Baja | Pendiente (se usa `notes` o "Recurrente · frecuencia") |
| 12 | Hábitos | Racha de hábitos no diarios ("Lunes a viernes") | Frecuencia estructurada (`frequency` es texto libre) | `frequency_days` (máscara de 7 bits) o enum + días | Media | Pendiente |
| 13 | Todas (categorías) | Colores de categorías por defecto | Paleta pastel del diseño en las categorías creadas por defecto | Actualizar los colores por defecto en `categories.repository.js` (seed) | Baja | Pendiente (desde la fase 2 el selector ofrece la paleta pastel y el ícono usa la tinta que contrasta) |
| 14 | Eventos | Color de bloques sin categoría | Eventos no tiene categorías por defecto | Crear categorías por defecto para `module = 'events'` | Baja | Pendiente (color neutro de respaldo) |
| 15 | Tareas | Editar duración | `PUT /tasks/:id` no acepta `duration` | Agregar `duration` al validador y a `allowedFields` | Baja | Pendiente |
| 16 | Inicio (rail) | "Mi journal" | Pantalla y datos del journal | El mismo CRUD de #6 | Baja | Maquetado (el acceso avisa "Próximamente") |
| 17 | Inicio / Hoy | Organización de widgets (orden, ancho y quitados) | Preferencias guardadas en el servidor (hoy solo viven en el navegador) | Tabla `user_preferences (user_id, pref_key, value JSON)` + `GET/PUT /api/preferences/:key` | Baja | Pendiente (se guarda en localStorage `ritmo-home-layout-v2-${userId}`) |
| 18 | Shell | Nombre del usuario en el avatar y el saludo | Perfil propio fuera de `/dashboard` | `GET /api/users/me` → `{ id, name, email }` | Baja | Pendiente (se toma `user` de `GET /dashboard`) |

# Ritmo · Rediseño del frontend según `design-handoff/` — Fase 0 (análisis y plan)

## ✅ Decisiones aprobadas por la usuaria (prevalecen sobre el resto del documento)
- **No se toca el backend en ninguna fase.** Todo lo que aparece en los mockups se maqueta, aunque no tenga respaldo en la API. **Nada se oculta** por falta de datos.
  - Si el dato se puede calcular con datos reales, se calcula.
  - Si no existe, se muestra un "estado sin datos" con el mismo tamaño, forma y lugar del diseño: valores en "—", pista vacía en las gráficas y la etiqueta "Próximamente" (12px, `var(--text-3)`). Nunca datos falsos.
  - Modo de vista previa solo para desarrollo, con `VITE_DESIGN_PREVIEW=true`: los componentes sin respaldo usan los datos de ejemplo del mockup. En producción ese modo no existe. La usuaria agrega la variable; yo no toco ningún `.env`.
- **`design-handoff/BACKEND_PENDIENTE.md`:** se crea y se actualiza al final de cada fase. Columnas: pantalla, componente, dato que falta, propuesta técnica, prioridad y estado. Incluye:
  - `habit_completions.count` y el GET de completions
  - `?month=` en `/expenses/summary`
  - eventos en `/dashboard`
  - fecha de completado de tareas y eventos
  - frases del journal
  - notificaciones
  - búsqueda global
  - recordatorio de eventos
  - recordatorios múltiples de hábitos
  - medio de pago en movimientos
  - frecuencia estructurada de hábitos
  - paleta pastel en las categorías por defecto
- **Respuestas a las preguntas:**
  1. Rutas en inglés; Recurrentes en `/expenses/recurrences`.
  2. Paleta pastel en el selector; el color guardado se muestra tal cual.
  3. "Completadas por día" y "% vs mes anterior" se calculan con etiqueta honesta, y el selector de mes sale de `GET /expenses`. Llevan estado sin datos, sin ocultarse: actividad por horas, deltas, racha, semana en círculos, mapa de calor, agua, recordatorio de 30 min, campana con punto y búsqueda.
  4. El filtro "Reuniones" pasa a ser "Eventos".
  5. Lo que falta del dashboard se calcula en el frontend.
  6. Formularios, CategoryManager, hoja de detalle y autenticación se adaptan a los tokens sin cambiar campos ni lógica.
  7. Propuesta de casos no dibujados aprobada.
  8. Luna con tokens oscuros provisionales.
  9. MUI se elimina en la fase 7.
  10. Capturas: por ahora las del chat. La usuaria levanta el backend y da las credenciales cuando haga falta, y no se guardan en ningún archivo.
  11. Crear `CLAUDE.md` en la raíz con:
      - el contenido de `CLAUDE.design.md`
      - convenciones del proyecto (stack, comandos y arquitectura)
      - la regla de no tocar el backend y la de estado sin datos
      - la regla de los `.env`
  12. `--danger #B42F36` y `--danger-strong #C2353C`.
  13. **Nunca abrir, leer, mostrar ni modificar archivos `.env*`**, salvo `.env.example`. Las variables nuevas se piden a la usuaria.
- La fase 5 ya no propone migración: solo maqueta con estado sin datos y registra lo pendiente.
- Se conserva todo lo de "qué no puede romperse" en Finanzas. El bug de `paidDate` se corrige en el frontend.
- **Siguiente paso: implementar la fase 1, entregar la lista de archivos y confirmar lint y build. Esperar revisión antes de la fase 2.**


## Estado
| Fase | Estado | Notas |
|---|---|---|
| 0 · Análisis y plan | ✅ Terminada | Plan aprobado con los ajustes de arriba. |
| 1 · Tokens, fuente y componentes base | ✅ Terminada | `tokens.css` (claro + oscuro provisional), Urbanist, `src/ui/` (primitives, shell, icons), `useIsWeb`, ruta `/dev/ui` solo en desarrollo, `CLAUDE.md` y `BACKEND_PENDIENTE.md`. Lint sin errores y build correcto. |
| 2 · Shell e Inicio/Hoy | 🔎 En revisión | `MainLayout` con `AppShellWeb`/`MobileShell` (cajón móvil con tema, ajustes y cerrar sesión), `body` en Urbanist con `--bg`. Inicio y Hoy con datos reales (`hooks/data/useToday.js`), estado sin datos y vista previa. Personalizar con layout en `ritmo-home-layout-v2-${userId}`. Corregido `paidDate` (hoja con Hoy, Ayer u Otra). Paleta pastel en el selector e ícono de categoría con tinta que contrasta. Lint sin avisos nuevos y build correcto. Verificado en Chrome a 1440 y 390 px con la vista previa encendida y apagada. |
| 3 a 7 | ⏳ Pendientes | |

**Decisión tomada en la fase 1:** el cambio de la paleta del selector de categorías a los pasteles del diseño (pregunta 2) pasa a la fase 2. Si se hace antes, los íconos de categoría actuales, que se pintan del mismo color que su fondo claro, quedarían casi invisibles hasta que llegue el diseño nuevo de las insignias.

**Notas de la fase 2:**
- `base.css` redefinía `--radius-card` (16) y `--on-primary` después de `tokens.css`, así que las tarjetas nuevas salían con radio 16. Ahora el CSS heredado usa `--legacy-radius-card` y `--legacy-on-primary`, que se borran en la fase 7.
- `recurrence-reminders.css` se borró en esta fase porque solo lo usaba `FinanceRecurrenceReminders`.
- "Nueva actividad" abre el formulario de creación del módulo: las páginas heredadas leen `state.create` con `hooks/useCreateIntent.js` (una línea por página).
- El backend solo permite CORS desde `http://localhost:5173`: la verificación en el navegador tiene que hacerse en ese puerto.

## Contexto
Hay que rehacer el frontend web (`ritmo-frontend/`) para que replique exactamente los mockups de `design-handoff/screens/` (5 pantallas web y 7 móviles), con datos reales de la API y sin inventar endpoints. Este documento es la entrega de la fase 0: inventario, arquitectura, tabla de tokens, datos por pantalla, plan de las fases 1 a 7 y preguntas abiertas. No se ha escrito código. Se trabaja en `main`, sin commit ni push hasta que lo pidas.

Notas previas:
- Las carpetas `design-handoff/screenshots/web` y `screenshots/mobile` están **vacías**. Las 13 capturas que pegaste en el chat son la referencia visual por ahora (ver pregunta 10).
- `ritmo-mobile/` es una app aparte en Expo y queda fuera de este rediseño.

---

## 1. Inventario del frontend actual

**Stack**
- Vite 8, React 19, react-router-dom 7 y axios.
- MUI 9 con emotion: solo lo usa [MobileItemDetails.jsx](ritmo-frontend/src/components/MobileItemDetails.jsx).
- Sin tests. El lint es oxlint (`rules-of-hooks`, `only-export-components`).
- `vite.config.js` no tiene proxy ni alias. La URL de la API sale de `VITE_API_URL`.

**Rutas ([App.jsx](ritmo-frontend/src/App.jsx))**
- Públicas: `/login`, `/register`, `/forgot-password`, `/reset-password`.
- Protegidas, dentro de `ProtectedRoute` y `MainLayout`: `/dashboard`, `/tasks`, `/habits`, `/events`, `/expenses`.
- `/` redirige a `/login`, y `*` muestra NotFound. No hay carga diferida (lazy), así que todo el CSS es global.

**Layout ([MainLayout.jsx](ritmo-frontend/src/layouts/MainLayout.jsx))**
- El corte web/móvil es `matchMedia(min-width: 900px)`.
- Cabecera con hamburguesa, logo y salir.
- Menú lateral de 264 px (perfil, navegación, Ajustes y Cerrar sesión): fijo y colapsable en escritorio, lateral desplegable en móvil.
- Barra inferior siempre visible, en todos los anchos.
- Tema con `localStorage["ritmo-theme"]` y `data-theme` en `<html>`.
- El diálogo de Ajustes controla qué widgets se ven (`ritmo-dashboard-widget-visibility-${email}`).

**Páginas y cómo cargan datos.** Todas usan los servicios de `src/services/*`, que devuelven `response.data.data`. Ninguna tiene caché: después de cada mutación se vuelve a pedir todo.

| Módulo | Archivo | Carga | Mutaciones |
|---|---|---|---|
| Dashboard | [dashboard.jsx](ritmo-frontend/src/pages/dashboard.jsx) (776 l.) | Al montar, un `Promise.all` con `GET /dashboard`, `GET /habits`, categorías de los 4 módulos (`allSettled`) y el día completo: `/tasks`, `/events`, `/expenses`, `/expenses/recurrences/reminders`, `/expenses/recurrences`. Vuelve a cargar al recuperar el foco o la visibilidad. | Cambiar el estado de un hábito; confirmar un recordatorio. **Bug: descarta `paidDate` (l. 427).** |
| Tareas | [Tasks.jsx](ritmo-frontend/src/pages/Tasks.jsx) | `GET /tasks` y `GET /categories?module=tasks` | Crear, editar (con `changeStatus` si cambió el estado), alternar, eliminar (`window.confirm`) y duplicar; después, `loadTasks()` |
| Hábitos | [Habits.jsx](ritmo-frontend/src/pages/Habits.jsx) | `GET /habits` y categorías de hábitos | Lo mismo, más `changeStatus('completado'\|'pendiente')` |
| Eventos | [Events.jsx](ritmo-frontend/src/pages/Events.jsx) | `GET /events` y categorías de eventos | Lo mismo, más estados programado, completado y cancelado. Usa TimePicker. |
| Finanzas | [Expenses.jsx](ritmo-frontend/src/pages/Expenses.jsx) (1009 l.) | Gastos, resumen, recurrencias, recordatorios y categorías de finanzas | CRUD de movimientos, sugerencia de categoría por ML (espera 400 ms y usa AbortController), crear y editar recurrencias, confirmar con `paidDate`, detener (`scope=future`) y eliminar (`scope=all`). Toast. `localStorage ritmo.finance.hideBalance`. |

**Componentes**
- Categorías: `CategoryIcon`, `CategoryIconBadge`, `CategoryIconPicker`, `CategoryColorPicker` (paleta de 20 hex) y `CategoryManager`.
- Formularios: `CategorySelect`, `DateCalendar` y `TimePicker`.
- Dashboard: `DashboardCalendar` y `DashboardDailyOverview`.
- Finanzas: `FinancePendingCarousel`, `FinanceConfirmSheet`, `FinanceRecurrencesView`, `FinanceRecurrenceReminders` (solo en el dashboard) y `FinanceToast`.
- `MobileItemDetails`, el cajón de MUI.
- Hook `useDialogFocus`.
- Utilidades: `financeFormat.js` (formato `$1.110.800`, signo menos tipográfico, fecha de hoy en Bogotá) y `time.js`.

**Estilos**
- Importados globalmente desde `main.jsx`: `base.css`, `layout.css` y `componentes.css`.
- Importados por cada página: `dashboard`, `tareas`, `eventos`, `finanzas`, `finance-ui`, `recurrence-reminders`, `category-manager`, `date-calendar`, `time-picker` y `auth`.
- **Sin uso:** `App.css`, `index.css` y `styles/calendario.css`.
- Fuente actual: Nunito, cargada con `@import` en `base.css`.
- Breakpoints: 360, 380, 440, 480, 600, 768, 900, 1024 y 1200, más container queries en el dashboard.
- Hex fijos: 64 en base.css, 19 en componentes.css, 11 en dashboard.css, 6 en layout.css y otros en JSX (`#e0697e` inline, degradado de la dona).

**Widgets actuales**
- `constants/dashboardWidgets.js`: rhythm, calendar, dayOverview, habits, upcoming y motivation, sin tamaños.
- El orden se guarda en `localStorage` por id de usuario y se reordena con arrastre por puntero.

---

## 2. Arquitectura propuesta

```
ritmo-frontend/
  index.html                    ← <link> a Urbanist 300–700 (preconnect)
  src/styles/
    tokens.css                  ← NUEVO: todos los tokens (claro + [data-theme="dark"])
    base.css                    ← solo reset, body y alias heredados que apuntan a tokens (temporal)
  src/ui/                       ← NUEVO: sistema de diseño, CSS Modules (*.module.css), sin hex
    icons/Icon.jsx              ← set propio estilo Lucide con los paths de los mockups (sin dependencia nueva)
    primitives/  Card, IconButton, PillButton, Chip, SegmentedControl, StatInline, Toast, BottomSheet,
                 Popover, CheckCircle, SplitAmount ($1.110 + .800 atenuado)
    shell/       AppShellWeb (Header, NavPills, PageTitle, Rail), MobileShell (TopBar, BottomTabBar, Drawer)
    charts/      LiquidOrb, HourBars, HalfGauge, CurveChart, BubbleStats, HorizontalTimeline,
                 WeekCalendarGrid, VerticalTimeline, LollipopTimeline, WeekStrip, MonthMini, HeatMap, Sparkline
    domain/      MoneyCard, TxRow, TaskRow, HabitCard, HabitRow
    widgets/     WidgetGrid (web: arrastrar/ancho/quitar · móvil: flechas/quitar/hoja)
  src/hooks/
    useIsWeb.js                 ← matchMedia('(min-width: 760px)') + listener
    data/useTasks, useEvents, useHabits, useFinance, useToday   ← envuelven los services existentes
  src/pages/<modulo>/
    <Modulo>Page.jsx            ← carga datos (hook) y elige layout
    <Modulo>Web.jsx / <Modulo>Mobile.jsx  ← solo presentación
  src/pages/dev/UiPlayground.jsx ← ruta /dev/ui, solo con import.meta.env.DEV
```

**Decisiones**
- **CSS Modules** para todo lo nuevo. Vite los trae de serie, así que no se agrega ninguna dependencia. Evitan choques con el CSS global heredado mientras conviven las dos versiones. Todos los colores, radios y sombras salen de `var(--token)`.
- **Responsive en la misma ruta.**
  - `MainLayout` muestra `AppShellWeb` cuando el ancho es ≥ 760 px y `MobileShell` cuando es < 760 px.
  - Cada página elige `<XWeb/>` o `<XMobile/>` con `useIsWeb()`. Las dos variantes comparten el mismo hook de datos y los mismos manejadores, así que la lógica no se duplica.
  - Dentro del web, la rejilla del Inicio pasa de 4 columnas (≥ 1180 px) a 2 columnas (760 a 1180 px) con media queries, como en el mockup.
  - El ancho móvil es fluido, no fijo en 390 px. Los márgenes laterales son 16 px en Hoy y 20 px en el resto, como en los mockups.
- **Datos:** hooks propios sobre los servicios que ya existen. No se agrega react-query ni ninguna otra librería.
  - Las mutaciones actualizan el estado local al instante, por ejemplo marcar una tarea, y luego vuelven a pedir los datos.
  - Así la esfera y los resúmenes cambian sin recargar la página.
- **Modo oscuro:** se conserva el mecanismo actual (`data-theme` en `<html>` más el botón de la luna en la cabecera). Los tokens oscuros son provisionales.
- **Iconos:** set propio de SVG inline (trazo 1.7 a 2, `currentColor`, extremos redondeados) con los paths de los mockups. Se reutiliza `CategoryIcon` para los 20 iconos de categoría.

---

## 3. Tabla de equivalencias de tokens

Leyenda: **R** = reemplaza a la variable actual (que queda como alias temporal hasta la fase 7) · **N** = nuevo · **X** = queda sin uso y se borra en la fase 7.

### Color
| Token nuevo | Claro | Oscuro (provisional) | Variable actual | Acción |
|---|---|---|---|---|
| `--bg-app` | `#E6E8EB` | `#0A0B0C` | `--app-bg-gradient` | R |
| `--bg` | `#F7F7F8` | `#0F1012` | `--bg` (alias del degradado), `--beige-fondo` | R (mismo nombre, nuevo valor) |
| `--surface` | `#FFFFFF` | `#1A1B1E` | `--surface-primary`, `--card-bg`, `--blanco` | R |
| `--surface-muted` | `#ECEDEF` | `#26272B` | — | N |
| `--surface-soft` | `#F1F2F4` | `#222327` | — | N |
| `--surface-subtle` | `#F4F5F6` | `#1F2023` | — | N |
| `--surface-row` | `#F7F8F9` | `#1F2023` | — | N (filas de hábito y píldoras "sin hora") |
| `--line` | `#F1F2F4` | `#2A2B30` | `--surface-border`, `--border-subtle` | R |
| `--line-ring` | `#ECEDEF` | `#2E2F34` | — | N (bordes de tarjeta) |
| `--line-strong` | `#D6D8DC` | `#3A3C42` | — | N |
| `--line-check` | `#C9CBD0` | `#4A4C52` | — | N |
| `--text` | `#121212` | `#F2F2F3` | `--text-primary`, `--navy`, `--azul-oscuro` | R |
| `--text-2` | `#4F525A` | `#B4B7BE` | — | N |
| `--text-3` | `#5F6268` | `#9A9DA4` | `--text-secondary`, `--text-muted`, `--gris-texto` | R |
| `--text-strong-2` | `#3E4148` | `#C8CACF` | — | N (signo % del orbe, unidades) |
| `--text-orb` | `#2C2F35` | `#D4D6DA` | — | N |
| `--text-done` | `#6C6F75` | `#8A8D93` | — | N |
| `--text-num-muted` | `#8A8D93` | `#6C6F75` | — | N |
| `--primary` / `--on-primary` | `#121212` / `#FFFFFF` | `#F2F2F3` / `#121212` | `--primary-solid`, `--on-primary` | R |
| `--accent` | `#EAF98F` | `#EAF98F` | `--accent-solid` (`#cd8784`), `--accent-soft` | R |
| `--accent-strong` | `#C8F04A` | igual | — | N, más `--glow-accent: 0 0 16px rgba(200,240,74,.85)` |
| `--mint` / `--mint-soft` | `#B9DECD` / `#DDEFE6` | igual / `#1E2A25` | — | N |
| `--teal` / `--teal-soft` | `#8ED0CD` / `#D6EEEC` | igual / `#1B2A29` | — | N |
| `--teal-text` / `--teal-ink` | `#1E5755` / `#153B3A` | igual | — | N |
| `--teal-deep` | `#4FA9A5` | igual | — | N (nivel más alto del mapa de calor) |
| `--bubble-gradient` | `radial-gradient(circle at 35% 30%, #A9DEDB, #8ED0CD 60%, #7CC4C1)` | igual | — | N |
| `--lav-grey` / `--lav-grey-2` | `#DCE0EB` / `#E3E6EE` | igual | — | N |
| `--lime-soft` | `#F1F9C4` | igual | — | N |
| `--lilac` | `#E4DEFB` | igual | — | N (campana móvil) |
| `--income` | `#2E7D4F` | `#4CAF83` | `--income`, `--balance-income-arrow` | R |
| `--income-on-dark` / `--expense-on-dark` | `#9EE6B8` / `#F5B5A3` | igual | `--balance-*-arrow` | R |
| `--danger` | `#B42F36` | `#E0697E` | `--danger`, `--rojo-error` | R |
| `--danger-strong` | `#C2353C` | `#E0697E` | — | N (punto de prioridad alta, flecha a la baja, base del borde) — ver pregunta 12 |
| `--danger-border` / `--danger-bg` / `--danger-chip` | `rgba(194,53,60,.35)` / `#FFF7F6` / `#FBE3E4` | `rgba(224,105,126,.4)` / `#2A1A1C` / `#3A1F22` | — | N |
| `--warning` | `#D9A21B` | igual | — | N (prioridad media) |
| `--notify` | `#E5484D` | igual | — | N |
| `--ritmo-gradient` | `linear-gradient(165deg,#ECEDF3 0%,#DFE3EC 55%,#D2D9E7 100%)` | `linear-gradient(165deg,#1C1E24,#191B21 55%,#161920)` | — | N |
| `--dark-card` / `--dark-card-sheen` | `#121212` / `linear-gradient(150deg, rgba(255,255,255,.12), transparent 55%)` | `#1F2024` / igual | `--accent-gradient` | R |
| `--chart-area` / `--chart-line` | `#F3F4F6` / `#4F525A` | `#222327` / `#9A9DA4` | — | N |
| `--track-stripes` | `repeating-linear-gradient(135deg,#F6F7F8 0 10px,#FFFFFF 10px 20px)` | variante oscura | — | N |
| `--col-today` / `--col-day` | `#FBFCF1` / `#FAFAFB` | `#1E2018` / `#17181B` | — | N (calendario semanal) |
| `--heat-0…4` | `#F1F2F4 #DDEFE6 #B9DECD #8ED0CD #4FA9A5` | por definir | — | N |
| `--scrim` | `rgba(18,18,18,.45)` | `rgba(0,0,0,.6)` | — | N |

### Vidrio, rayas y sombras (N)
- **Vidrio:**
  - `--glass-bg: rgba(255,255,255,.55)`
  - `--glass-bg-strong: rgba(255,255,255,.9)`
  - `--glass-bubble: rgba(255,255,255,.45)`
  - `--glass-border: rgba(255,255,255,.85)`
  - `--glass-blur-sm: blur(8px) saturate(140%)`, `--glass-blur: blur(14px)`, `--glass-blur-lg: blur(20px) saturate(140%)`
  - `--quote-bg: rgba(240,241,247,.6)`
  - El respaldo opaco va en `@supports not (backdrop-filter…)` y en `prefers-reduced-transparency`.
- **Rayas:** `--stripes: repeating-linear-gradient(135deg, rgba(255,255,255,.35) 0 2px, transparent 2px 9px)`.
- **Sombras:**
  - `--shadow-pill: 0 6px 16px rgba(20,22,30,.06)`
  - `--shadow-block: 0 6px 18px rgba(18,18,18,.07)`
  - `--shadow-tabbar: 0 10px 30px rgba(18,18,18,.10)`
  - `--shadow-popover: 0 18px 40px rgba(20,22,30,.14)`
  - `--shadow-sheet: 0 -10px 30px rgba(17,17,20,.12)`
  - `--shadow-dark-card: 0 14px 32px rgba(17,17,20,.18), inset 0 1px 0 rgba(255,255,255,.18)`
  - `--shadow-glass: 0 6px 18px rgba(80,170,165,.25), inset 0 1px 0 rgba(255,255,255,.9)`
  - `--ring-edit: 0 0 0 2px #121212, 0 12px 30px rgba(20,22,30,.08)`
  - `--ring-avatar: 0 0 0 1px #E2E4E7`
  - Las sombras de `--shadow-card` y `--shadow-raised` actuales se reemplazan.
- **Pasteles de bloques móviles** (rgba con alfa):
  - `--pastel-mint: rgba(185,222,205,.9)`
  - `--pastel-teal: rgba(142,208,205,.82)`
  - `--pastel-lime: rgba(234,249,143,.9)`
  - `--pastel-grey: rgba(220,224,235,.92)`
  - `--pastel-done: rgba(241,242,244,.85)`

### Forma, tipografía y espaciado
| Token | Valor | Actual | Acción |
|---|---|---|---|
| `--font-sans` | `'Urbanist', system-ui, sans-serif` | Nunito en `body` | R |
| `--fs-h1` | 52 web / 30 móvil (con `letter-spacing`) | `--type-display` | R |
| `--fs-h2` | 22 / 18 | `--type-headline`, `--type-title` | R |
| `--fs-body`, `--fs-meta`, `--fs-tab`, `--fs-stat` | 15, 13/12, 11, 40 | `--type-body`, `--type-supporting`, `--type-label`, `--type-caption`, `--type-metric` | R |
| `--radius-frame` | 36 | — | N |
| `--radius-card` | 28 web / 26 bento | `--radius-card` (16), `--radius` (20) | R |
| `--radius-box-sm/md/lg` | 14 / 18 / 22 | `--radius-sm`, `--radius-control` (12) | R |
| `--radius-pill` | 999px | igual | se mantiene |
| `--h-pill` / `--h-icon` / `--h-chip` | 46 web y 44 móvil / 46 y 44 / 40 y 36 | — | N |
| `--gap-cards` / `--gap-bento` | 12 / 10 | `--widgets-gap` | R |
| `--pad-card` | 24 web, 22 widget / 16 móvil | `--card-padding` | R |
| `--gutter` | 16 (Hoy) / 20 (resto) | `--screen-gutter` | R |
| `--space-1…8` | igual | igual | se mantienen |
| `--motion-fast` | 150ms ease | igual | se mantiene |

**Quedan sin uso (X) y se borran en la fase 7:**
- `--surface-secondary`, `--surface-tercy`, `--surface-quaternary`, `--surface-blur`, `--accent-gradient`.
- `--orange`, `--orange-light`, `--purple`, `--purple-light`, `--green`, `--green-light`, `--blue`, `--blue-light`, `--pink`.
- `--navy-soft`, `--naranja-ritmo` y `--primary-border`.
- Los `:root` de `index.css`, que no se importa.

---

## 4. Datos reales por pantalla

✅ = ya existe en la API · 🧮 = se puede calcular en el frontend con datos reales · ❌ = no existe (estado vacío o se oculta).

Contexto de la API que aplica a todas las pantallas:
- Ningún `GET` de lista acepta filtro de fechas: `/tasks`, `/events`, `/expenses` y `/habits` devuelven todo, y el filtro por día, semana o mes se hace en el cliente.
- "Hoy" se calcula en hora de Bogotá.

### Inicio (web) · Hoy (móvil)
| Bloque | Estado | Fuente / nota |
|---|---|---|
| Saludo "Hola, {nombre}" | ✅ | `GET /dashboard` → `user.name` |
| Tu ritmo de hoy (%, tareas, hábitos y eventos) | 🧮 | `/dashboard.todayRitmo` **no cuenta eventos**. Se calcula con tareas (`dueDate` = hoy y estado `completada`), hábitos (`status` = `completado`) y eventos (`eventDate` = hoy y estado `completado`). |
| "Te faltan… · N pagos · 1 vencido" | ✅ | `GET /expenses/recurrences/reminders` (`isOverdue`) |
| Frase del día | ❌ | No hay tabla. Se usan frases por defecto y la rotación "Otra frase" se guarda en `localStorage`. El lápiz queda oculto o deshabilitado. |
| Chip de racha "5 días" | ❌ | Se oculta |
| Agenda horizontal (día anterior y siguiente) | ✅ | Tareas: `startAt` y `endAt`. Eventos: `eventDate`, `eventTime` y `duration`. Los eventos de todo el día y las tareas sin hora no tienen posición (ver pregunta 7). |
| Filtro "Reuniones" | ❌ | No existe un tipo "reunión" (ver pregunta 4) |
| Pagos y cobros | ✅ | Recordatorios: signo del monto, `isOverdue` y `scheduledDate`. El color de la ficha sale del color de la categoría. |
| Calendario (mes) con puntos | ✅ | Tareas, eventos y `nextScheduledDate` |
| Tareas de hoy | ✅ | `GET /tasks` y `PATCH /tasks/:id/status` |
| Hábitos: % de hoy y lista con check | ✅ | `GET /habits` y `PATCH /habits/:id/status` |
| Burbujas "racha" y "4/8 agua" | ❌ | No hay conteo por día ni racha. Se ocultan las burbujas satélite. |
| Finanzas: disponible e ingresos/gastos en % | ✅ | `GET /expenses/summary` |
| "12 % más que octubre" | 🧮/❌ | `/summary` solo cubre el mes actual. Se puede calcular con `GET /expenses` completo (ver pregunta 3). |
| Gastos de la semana (curva, promedio, "$58.000 menos") | 🧮 | `GET /expenses` agrupado por día |
| Actividad por horas (móvil) | ❌ | No hay hora de completado (tareas y eventos no la guardan, y `habit_completions.completed_at` no se expone) (ver pregunta 3) |
| Tu día (pirulí), Eventos (próximo), medio medidor de Tareas, sparkline Disponible | ✅/🧮 | Horas de inicio; saldo acumulado del mes con `GET /expenses` |
| Campana con punto rojo | ❌ | No hay notificaciones. Se muestra la campana sin punto. |
| Buscar (web) | ❌ | No hay búsqueda global. Se oculta. |

### Tareas (web y móvil)
- ✅ Título, categoría (nombre, color e ícono), `priority` (alta, media o baja), `dueDate`, `startAt`/`endAt`, `status` (pendiente, en_proceso o completada) y cambio de estado.
- 🧮 Vencidas: `dueDate` < hoy y no completada. "Sin hora": `startAt` vacío.
- 🧮 Por hacer, completadas de hoy y "por categoría".
- ❌ **Fecha de completado.** No existe, y de ella dependen dos cosas:
  - "Completadas por día" de la semana: solo se puede aproximar con el `dueDate` de las completadas.
  - Los deltas tipo "+2 / +3 / −1" contra ayer: se ocultan (ver pregunta 3).
- Limitación ya existente: `PUT /tasks/:id` no permite editar `duration`.

### Eventos (web y móvil)
- ✅ `eventDate`, `eventTime`, `duration`, `location`, `category` (nullable: eventos **no** tiene categorías por defecto, así que hace falta un color de respaldo) y `status`.
- El estado tiene **3 valores**: programado, completado y cancelado (ver pregunta 7).
- 🧮 Vista semana y día, "Siguiente · en 20 min", "Empieza en 2 h 20 min", próximos, puntos del mes, y los contadores esta semana, por asistir y realizados.
- ❌ "Recordatorio 30 min antes": no hay campo, se oculta. Deltas "+2": se ocultan. Las entradas del rail "Reuniones" y "Lugares" no tienen pantalla.

### Hábitos (web y móvil)
- ✅ `name`, `frequency` (texto libre: "Lunes a viernes" no se puede interpretar), `goal` (entero que nada usa), `reminderTime`, `category` y completado hoy.
- 🧮 "Próximo recordatorio": el siguiente `reminderTime` después de ahora. Cumplidos de hoy y anillo de hoy.
- ❌ Hay 6 cosas sin respaldo en la API: racha, mejor racha, semana en círculos, mapa de calor de constancia, "% esta semana" y conteo por día (4/8 vasos).
  - La tabla `habit_completions` **ya guarda el historial** (un registro por hábito y día), pero ningún endpoint lo lee.
  - Tampoco tiene columna de conteo.
- ❌ "Recordatorios de hoy cada 3 horas": solo hay un `reminderTime`. Se mostraría ese único punto o se oculta.

### Finanzas (web y móvil), Recurrentes y Confirmar
- ✅ Resumen del mes actual, movimientos (concepto, categoría, monto con signo, fecha y `notes`), recordatorios, recurrencias, confirmar con `paidDate`, detener o eliminar, y categorías de finanzas.
- 🧮 "En qué gastas" (agrupado por categoría), gastos de la semana, búsqueda sin tildes ni mayúsculas y chips de tipo y categoría.
- Nota bajo el concepto: el diseño muestra el medio de pago ("Efectivo", "Débito"), pero no existe ese campo. Se usa `notes`, o "Recurrente · {frecuencia}" si tiene `recurrenceId`.
- Selector de mes: la lista se puede filtrar en el cliente, pero `/summary` solo da el mes actual (ver pregunta 3).
- Confirmar: el diseño muestra "Monto pagado" como campo, pero el backend copia el monto de la recurrencia. El campo queda **de solo lectura**, como hoy.
- Recurrentes "Al día": la última fecha de pago se calcula con los gastos que tienen `recurrenceId`, igual que hoy en `Expenses.jsx:513-523`.

---

## 5. Plan por fases (1 a 7)

### Fase 1 · Tokens, fuente y componentes base
- **Archivos:**
  - `index.html`: Urbanist.
  - `src/styles/tokens.css`: nuevo, importado en `main.jsx` antes de `base.css`.
  - `base.css`: los alias heredados pasan a apuntar a los tokens.
  - `src/ui/**`: primitives, shell e icons.
  - `src/pages/dev/UiPlayground.jsx` y una ruta `/dev/ui` (solo en DEV) en `App.jsx`.
- **No se conecta todavía el shell nuevo al `MainLayout`.**
- **Riesgos:**
  - `--bg`, `--income` y `--danger` ya existen con otros valores. Cambiarlos retoca un poco las páginas viejas: el fondo pasa de degradado a gris plano y verde y rojo cambian ligeramente.
  - La fuente: para no tocar las páginas en esta fase, `body` sigue en Nunito y Urbanist se aplica solo dentro de `src/ui` y `/dev/ui`. El cambio global se hace en la fase 2.
- **Verificación:** lint, build y `/dev/ui` en el navegador a 1440 y 390 px.

### Fase 2 · Shell e Inicio/Hoy
- **Archivos:**
  - Se reescribe `MainLayout.jsx` con `AppShellWeb` o `MobileShell`. Se elimina el diálogo de Ajustes de widgets, que pasa a "Personalizar". El menú (hamburguesa) móvil queda como cajón con tema, ajustes y cerrar sesión.
  - `body` pasa a Urbanist con `--bg`.
  - Página nueva `src/pages/home/` (Page, Web y Mobile) y `hooks/data/useToday.js`, que reutiliza `getDashboardDayData`.
  - `charts/*` y `widgets/WidgetGrid`.
  - Catálogo nuevo de widgets con tamaños: sustituye `constants/dashboardWidgets.js`.
  - `localStorage` con una clave nueva `ritmo-home-layout-v2-${userId}` y try/catch.
  - Se borran `dashboard.jsx`, `dashboard.css`, `DashboardCalendar`, `DashboardDailyOverview` y `FinanceRecurrenceReminders`.
- **Se corrige el bug de `paidDate`:** el ✓ del widget confirma con la fecha de hoy, o abre la hoja de confirmación.
- **Riesgos:**
  - Las pantallas de Tareas, Hábitos, Eventos y Finanzas se verán con el shell nuevo y el contenido viejo hasta sus fases. Es una mezcla visual temporal.
  - Se pierde el orden de widgets que el usuario había guardado (los ids cambian).
  - Hay que validar la esfera con `prefers-reduced-motion`: sin oleaje y sin transición de nivel.
  - Los ids SVG deben ser únicos (`useId`).

### Fase 3 · Tareas
- **Archivos:**
  - `src/pages/tasks/` (Page, Web y Mobile) y `hooks/data/useTasks.js`.
  - Se extrae `TaskFormModal` de `Tasks.jsx`, conservando todos los campos y validaciones.
  - `TaskRow`, `VerticalTimeline`, la tabla y `HorizontalTimeline` (se reutiliza).
  - Se borran `Tasks.jsx` y `tareas.css` (este último solo si Hábitos ya no lo importa; si lo importa, se borra en la fase 5).
- **Riesgos:**
  - Duplicar y eliminar hoy usan `MobileItemDetails` (MUI) y `window.confirm`. Pasan a `BottomSheet`.
  - Las tareas recurrentes generan la siguiente al completarse: hay que volver a pedir los datos después de `changeStatus`.

### Fase 4 · Eventos
- **Archivos:**
  - `src/pages/events/` y `hooks/data/useEvents.js`.
  - `WeekCalendarGrid`, `MonthMini` (navegable) y la tarjeta de detalle oscura.
  - Se extrae `EventFormModal`, que conserva `TimePicker`.
  - Se borran `Events.jsx` y `eventos.css`.
- **Riesgos:**
  - Los eventos que se solapan necesitan carriles. Se calculan, aunque el mockup no lo resuelve.
  - Eventos de todo el día y cancelados (ver pregunta 7).
  - Al completar un evento recurrente se crea el siguiente.

### Fase 5 · Hábitos
- **Antes de maquetar, propuesta de backend que espera tu aprobación:**
  1. `GET /api/habits/completions?from=YYYY-MM-DD&to=YYYY-MM-DD` para leer `habit_completions`, que ya existe.
  2. `ALTER TABLE habit_completions ADD count INT NOT NULL DEFAULT 1` y `PATCH /api/habits/:id/progress {count}`. Se marca cumplido cuando `count >= goal`, y `goal` ya existe.
  3. Racha, semana y constancia se calculan a partir de (1).
- Mientras no se apruebe: solo el check de hoy, y los componentes `HabitCard` y `HeatMap` quedan listos con estado vacío.
- **Archivos:**
  - `src/pages/habits/` y `hooks/data/useHabits.js`.
  - `HabitCard`, `HabitRow`, `HeatMap` y la línea de recordatorios.
  - Se extrae `HabitFormModal`.
  - Se borran `Habits.jsx` y `tareas.css`.
- **Riesgos:** `frequency` es texto libre, así que la racha de "Lunes a viernes" sería ambigua sin una frecuencia estructurada.

### Fase 6 · Finanzas, Recurrentes y Confirmar
- **Archivos:**
  - `src/pages/finance/` (Page, Web y Mobile, `RecurrencesPage`) y `hooks/data/useFinance.js`.
  - Se extrae del `Expenses.jsx` actual toda la lógica: `ExpenseFormModal` con entrada de monto y puntos, sugerencia de ML, casilla "programar como fijo" y edición de recurrencia.
  - Se reutilizan `utils/financeFormat.js`, `MoneyCard`, `TxRow`, `BubbleStats`, `CurveChart` y `BottomSheet` (confirmar).
  - Ruta nueva para Recurrentes (ver pregunta 1).
  - Se borran `Expenses.jsx`, `finanzas.css`, `finance-ui.css`, `recurrence-reminders.css`, `FinancePendingCarousel`, `FinanceRecurrencesView` y `FinanceConfirmSheet` (este último se reemplaza por el nuevo).
- **Qué no puede romperse:**
  - Confirmar va por `occurrenceId` (no `recurrenceId`) y con `paidDate` (Hoy, Ayer u Otra, nunca futura, en hora de Bogotá).
  - Después de confirmar se vuelve a pedir `/reminders` y la tarjeta desaparece. No se oculta en el cliente.
  - Detener = `scope=future` (los vencidos siguen confirmables). Eliminar = `scope=all`.
  - Editar una recurrencia solo cambia concepto, categoría, monto y notas.
  - Eliminar un movimiento que vino de una recurrencia deshace la confirmación (en el backend).
  - Montos enteros con punto de miles y signo menos tipográfico (U+2212).
  - Bloqueo contra doble clic (`busy`).
  - El ojo con `ritmo.finance.hideBalance`.
  - Los textos del toast.
- **Riesgo:** el diseño no tiene "Editar" en la hoja de confirmar, pero hoy existe. Propongo conservarlo como acción de texto.

### Fase 7 · QA final
- Capturas a 1440, 1024, 768, 390 y 360 px con Claude in Chrome, comparadas con las del handoff. Informe ✅/❌ por pantalla.
- Accesibilidad: contraste, foco, `aria-*`, teclado, reduced-motion y reduced-transparency.
- `grep` de hex sueltos fuera de `tokens.css`.
- Se borran los alias heredados, `App.css`, `index.css`, `calendario.css`, las PNG sin uso de `public/` y, si nada lo usa, `@mui/material` y `@emotion/*`.
- Se arregla el `favicon.svg` vacío.
- Pendiente: definir el estilo de los formularios, el `CategoryManager` y las pantallas de autenticación (ver pregunta 6).

---

## 6. Preguntas antes de empezar
1. **Rutas.** ¿Se mantienen `/dashboard`, `/tasks`, `/habits`, `/events` y `/expenses`? Es lo recomendado: el código va en inglés y no rompe enlaces. ¿O se pasan a `/`, `/tareas`, etc.? Para Recurrentes propongo `/expenses/recurrences`.
2. **Colores de categoría.** El usuario elige un color libre (paleta de 20 hex) y el diseño usa pasteles (`#EAF98F`, `#B9DECD`, `#8ED0CD`, `#DCE0EB`, `#F1F9C4`…). Propongo cambiar la paleta del selector por los pasteles del diseño y mostrar el color guardado tal cual. ¿O prefieres convertir cada color existente al pastel más cercano?
3. **Datos derivados o sin respaldo.** Mi propuesta:
   - Calcular con datos reales y etiqueta honesta:
     - "completadas por día" usando la fecha de la tarea.
     - "% vs mes anterior" y el selector de mes desde `GET /expenses` completo.
   - Ocultar:
     - "Actividad por horas" (o mostrar las actividades hechas según su hora programada).
     - Los deltas "+2 / −1".

   ¿De acuerdo?
4. **Filtro "Reuniones" de la Agenda.** No existe ese tipo de evento. ¿Lo cambio por "Eventos"?
5. **Backend en otras fases.** ¿Calculo en el frontend lo que falta del dashboard (eventos en "Tu ritmo"), sin tocar el backend? ¿O prefieres agregar los eventos a `/dashboard` y un `?month=` a `/expenses/summary`?
6. **Lo que no tiene diseño.** Los formularios de crear y editar (tarea, hábito, evento, movimiento), `CategoryManager`, la hoja de detalle y las pantallas de login, registro y recuperación. ¿Los adapto a los tokens nuevos (fuente, colores, radios) manteniendo sus campos, o los dejo como están?
7. **Casos no dibujados.** Propuesta:
   - Eventos de todo el día: franja arriba de la rejilla y "Todo el día" en las listas.
   - Eventos cancelados: se ocultan de la rejilla.
   - Tareas sin hora: en "Sin hora".
   - Recurrentes y confirmar en web: la misma vista dentro del shell web y la hoja como diálogo centrado.

   ¿Te parece bien?
8. **Modo oscuro.** ¿Mantengo el botón de luna actual (`data-theme`) con los tokens oscuros provisionales, aunque no esté diseñado?
9. **MUI.** ¿Lo elimino del proyecto cuando `MobileItemDetails` quede reemplazado por `BottomSheet`?
10. **Capturas y entorno de prueba.** Hay tres cosas que necesito:
    - Las carpetas `screenshots/` están vacías. ¿Guardas ahí las PNG (`Inicio.png`, `Hoy.png`…) o uso las del chat?
    - Para comparar en el navegador necesito el backend y MySQL corriendo, y un usuario de prueba con datos. ¿Me das credenciales o creo datos de prueba desde la propia app?
11. **CLAUDE.md.** No existe en el repositorio. ¿Lo creo con el contenido de `design-handoff/CLAUDE.design.md`?
12. **Rojos.** Los mockups usan `#B42F36`, `#C2353C` y `#B83A45`. Propongo dos tokens: `--danger #B42F36` para texto y "Eliminar", y `--danger-strong #C2353C` para puntos, flechas y bordes. ¿De acuerdo?

## Verificación general (cada fase)
- `npm run lint` y `npm run build` en `ritmo-frontend/`.
- `npm run dev` con el backend activo. Revisión en Chrome a 1440 y 390 px (en la fase 7, en los 5 anchos) comparando con los mockups y capturas.
- Probar a mano las mutaciones de la fase: marcar, filtrar y confirmar pago con fecha Ayer/Otra. Revisar la consola sin errores.
- `grep` de `#[0-9a-fA-F]{3,6}` en `src/ui` y en las páginas nuevas: debe salir vacío.

# Ritmo · Especificación de diseño (handoff)

Fuente de verdad visual del rediseño de Ritmo (web y móvil).
Los archivos de `screens/` son los mockups originales: **cada valor de estilo (color, tamaño, radio, sombra, espaciado) está escrito en línea dentro del HTML y debe copiarse exacto**. El bloque `<script>` de cada archivo contiene **datos de ejemplo** (mock) y la **lógica de interacción de referencia**; no se copia tal cual: se reemplaza por datos reales de la API y por estado de React.

> Nota sobre el formato: los archivos usan una sintaxis de plantilla propia (`{{valor}}`, `<sc-for>`, `<sc-if>`, `class Component extends DCLogic`). Léelos como especificación: `{{x}}` es un valor calculado en `renderVals()`, `<sc-for list>` es un `.map()`, `<sc-if value>` es un render condicional. No se abren directamente en el navegador.

---

## 1. Tokens

### Color
| Token | Valor | Uso |
|---|---|---|
| `--bg-app` | `#E6E8EB` | Fondo exterior en web (alrededor del marco) |
| `--bg` | `#F7F7F8` | Fondo de pantalla (web y móvil), un solo tono |
| `--surface` | `#FFFFFF` | Tarjetas |
| `--surface-muted` | `#ECEDEF` | Píldoras y botones secundarios (nav inactiva, menú, campana, "Agregar widget") |
| `--surface-soft` | `#F1F2F4` | Botones de ícono dentro de tarjetas, chips inactivos, estado completado |
| `--surface-subtle` | `#F4F5F6` | Cajas internas (mini-stats, filas de categoría) |
| `--line` | `#F1F2F4` | Separadores de filas |
| `--line-strong` | `#D6D8DC` / `#C9CBD0` | Bordes punteados, anillo de check vacío |
| `--text` | `#121212` | Texto principal, botones primarios, selección |
| `--text-2` | `#4F525A` | Metadatos dentro de tarjetas |
| `--text-3` | `#5F6268` | Subtítulos, migas de pan, tab bar inactiva |
| `--text-num-muted` | `#8A8D93` | Parte de miles/decimales en montos grandes (`$1.110` **`.800`**) |
| `--accent` (lima) | `#EAF98F` | Resaltado: día de hoy, pestaña activa móvil, etiquetas de valor en gráficas, racha |
| `--accent-strong` | `#C8F04A` + `box-shadow: 0 0 16px rgba(200,240,74,.85)` | Barra de la hora actual |
| `--mint` | `#B9DECD` · soft `#DDEFE6` | Categoría / tarjeta pastel |
| `--teal` | `#8ED0CD` · soft `#D6EEEC` · texto sobre teal `#1E5755` / `#153B3A` | Burbujas de porcentaje, medidores, tareas en línea de tiempo |
| `--lav-grey` | `#DCE0EB` · `#E3E6EE` | Categoría neutra |
| `--lime-soft` | `#F1F9C4` | Ícono de categoría |
| `--income` | `#2E7D4F` | Montos de ingreso (+) |
| `--danger` | texto `#B42F36` · borde `rgba(194,53,60,.35)` · fondo `#FFF7F6` · chip `#FBE3E4` | Vencidos |
| `--notify` | `#E5484D` | Punto de notificación |
| `--ritmo-gradient` | `linear-gradient(165deg,#ECEDF3 0%,#DFE3EC 55%,#D2D9E7 100%)` | Tarjeta "Tu ritmo de hoy" y "Hoy" de Hábitos |
| `--dark-card` | `#121212` + `linear-gradient(150deg, rgba(255,255,255,.12), rgba(255,255,255,0) 55%)` | Saldo, detalle de evento, próximo recordatorio |

Montos: pesos colombianos enteros con punto de miles (`$1.110.800`), sin decimales. Ingresos `+` en `--income`; gastos `−` en `--text` (nunca en rojo).

### Tipografía
Fuente **Urbanist** (Google Fonts, pesos 300/400/500/600/700).

| Rol | Web | Móvil |
|---|---|---|
| Título de pantalla (h1) | 52 / 400 / −1.2px | 30 / 400 / −0.6px |
| Título de tarjeta (h2) | 22 / 400 | 18–20 / 400 (tiles bento: 16 / 500) |
| Número grande | 40–52 / 300–400 / −1px | 38–44 / 300 |
| Cifra resumen junto al título ("34 +4") | 40 / 300 + etiqueta 13 | — |
| Cuerpo / nombres | 14–15 / 500 | 15 / 500 |
| Metadatos | 12–13 / 400 | 12 / 400 |
| Navegación | 14 / 500 | Tab bar 11 / 500 (activa 600) |

### Forma y espaciado
- Marco web: `max-width: 1480px`, radio 36, padding `28px 36px 36px`, gap vertical 28.
- Tarjetas: radio **28** web (26 en bento móvil), padding 24 web / 16–18 móvil, gap entre tarjetas **12** (10 en bento).
- Píldoras: alto 46 (web) / 44–48 (móvil), radio completo. Botones de ícono circulares 44–46.
- Chips: alto 36–40, radio completo.
- Cajas internas: radio 14–22.
- Áreas táctiles mínimas: **44×44**.
- Móvil: padding lateral 16, barra inferior flotante alto 64, radio 22, separada 12px de los lados y 10px del borde inferior, sombra `0 10px 30px rgba(18,18,18,.10)`.

### Efecto glass (solo donde está indicado)
```css
background: rgba(255,255,255,.45–.62);
backdrop-filter: blur(8–20px) saturate(140%);
border: 1px solid rgba(255,255,255,.85–.9);
box-shadow: 0 6px 18px rgba(80,170,165,.25), inset 0 1px 0 rgba(255,255,255,.9);
```
Se usa en: panel de frase de "Tu ritmo de hoy", pastillas Tareas/Hábitos/Eventos de la esfera, burbujas pequeñas de porcentaje, burbujas de categoría en las agendas móviles, tarjetas de hábito (con rayas `repeating-linear-gradient(135deg, rgba(255,255,255,.35) 0 2px, transparent 2px 9px)`).
Incluir respaldo con `@supports not (backdrop-filter: blur(1px))` y `@media (prefers-reduced-transparency: reduce)` → fondo opaco.

### Estados
- **Completado** (tarea, evento, hábito): fondo `#F1F2F4`, texto `#6C6F75`/`#8A8D93`, sin rayas, check negro relleno. **Nunca tachado.**
- **Vencido**: borde y texto `--danger`, peso 600.
- **Seleccionado** (día, chip, pestaña, nav web): fondo `#121212`, texto blanco.
- **Hoy** (sin seleccionar): fondo lima `#EAF98F`.
- **Acción principal**: botón negro `#121212` con texto blanco.

### Íconos
Trazo de 1.7–2 px, 16–22 px, `stroke="currentColor"`, extremos redondeados (estilo Lucide). Sin emojis. Botones solo-ícono con `aria-label`.

---

## 2. Componentes a construir (reutilizables)
| Componente | Dónde se ve |
|---|---|
| `AppShellWeb` (Header con logo + NavPills + acciones, `PageTitle` con migas, h1 y stats en línea, `Rail` lateral de íconos) | Todas las pantallas web |
| `BottomTabBar` (5 pestañas, activa con píldora lima 44×28) | Todas las pantallas móviles |
| `Card` (variantes: white, gradient-ritmo, dark, pastel) | Todas |
| `IconButton`, `PillButton` (primaria negra / secundaria gris), `Chip` (on/off), `SegmentedControl` | Todas |
| `StatInline` ("34" + "+4 / Visitas") | Títulos web |
| `LiquidOrb` (esfera con oleaje SVG animado + anillo de avance; respeta `prefers-reduced-motion`) | Inicio web, Hoy móvil |
| `HourBars` (barras por hora; pasada gris, actual lima con brillo, futura rayada) | Hoy móvil (Actividad), Tareas web (semana) |
| `CurveChart` (curva suave con puntos y etiqueta lima) | Inicio web, Finanzas web |
| `HalfGauge` (semicírculo teal) | Hoy móvil (Tareas) |
| `BubbleStats` (burbuja teal + burbujas glass) | Hábitos, Finanzas "En qué gastas" |
| `HorizontalTimeline` (fondo rayado, píldoras por hora, marca "ahora") | Inicio web (Agenda), Tareas web |
| `WeekCalendarGrid` (columnas por día, bloques de evento) | Eventos web |
| `LollipopTimeline` ("Tu día") | Hoy móvil |
| `WeekStrip` / `MonthMini` | Agenda, Calendario |
| `MoneyCard` (pendiente por pagar/cobrar con ✓) | Inicio, Hoy, Finanzas |
| `TxRow` (movimiento) y `TaskRow` (tabla de tareas) | Finanzas, Tareas |
| `HabitCard` (pastel glass, segmentos de conteo, semana en círculos) | Hábitos web |
| `HeatMap` (constancia 5 semanas) | Hábitos web |
| `BottomSheet` | Confirmar pago, Agregar widget (móvil) |
| `Toast` (`aria-live`) | Mensajes |
| `WidgetGrid` con modo **Personalizar** (reordenar, quitar, agregar, tamaño) | Inicio web, Hoy móvil |

---

## 3. Mapa de pantallas
| Archivo | Plataforma | Ruta sugerida | Módulo / datos reales |
|---|---|---|---|
| `screens/web/Inicio.dc.html` | Web ≥ 1024 px | `/` (dashboard) | tasks, events, habits, expenses, recurrences |
| `screens/mobile/Hoy.dc.html` | Móvil < 760 px | `/` (dashboard) | idem |
| `screens/web/TareasWeb.dc.html` | Web | `/tareas` | `GET /tasks`, `PATCH /tasks/:id/status` |
| `screens/mobile/Tareas.dc.html` | Móvil | `/tareas` | idem |
| `screens/web/EventosWeb.dc.html` | Web | `/eventos` | `GET /events`, cambio de estado programado/realizado |
| `screens/mobile/Eventos.dc.html` | Móvil | `/eventos` | idem |
| `screens/web/HabitosWeb.dc.html` | Web | `/habitos` | habits (+ registro diario, ver §5) |
| `screens/mobile/Habitos.dc.html` | Móvil | `/habitos` | idem |
| `screens/web/FinanzasWeb.dc.html` | Web | `/finanzas` | `GET /expenses`, `/expenses/summary`, recurrences, reminders |
| `screens/mobile/Finanzas.dc.html` | Móvil | `/finanzas` | idem |
| `screens/mobile/Recurrentes.dc.html` | Móvil | `/finanzas/recurrentes` | recurrences |
| `screens/mobile/Confirmar.dc.html` | Móvil | Hoja sobre `/finanzas` | confirmar pago/ingreso |

Responsive: la misma ruta cambia de layout. ≥ 1180 px rejilla de 4 columnas en el Inicio; 760–1180 px, 2 columnas; < 760 px, layout móvil (tab bar inferior, sin rail ni header de píldoras).

---

## 4. Interacciones clave
- **Tu ritmo de hoy**: % = (tareas hechas + hábitos cumplidos + eventos realizados) / total del día. La esfera sube y el anillo avanza al marcar algo en cualquier widget.
- **Frase del día**: rota frases propias del usuario (journal); botón "Otra frase" y lápiz para editar.
- **Agenda**: navegar día anterior/siguiente, filtros Todo / Reuniones / Tareas; tocar una tarea la completa.
- **Pagos y cobros**: ✓ confirma (misma lógica actual: un registro por período, desaparece al confirmar); vencidos en rojo.
- **Personalizar (web)**: arrastrar para reordenar, cambiar ancho (1–4 col), quitar, "Agregar widget", "Restablecer".
- **Personalizar (móvil)**: flechas ← → / ↑ ↓, quitar, hoja "Agregar widget".
- **Eventos web**: clic en un bloque abre el detalle en la tarjeta negra; "Marcar realizado".
- **Hábitos**: hábitos de conteo (agua) suman con "+1 vaso"; el resto con check. Completado → tarjeta gris.
- **Finanzas**: ojo oculta montos (`$ •••••`), búsqueda por concepto sin tildes/mayúsculas, chips de tipo/categoría.

---

## 5. Brechas de backend (no inventar; preguntar antes)
1. **Hábitos**: no existe registro diario. Para racha, semana, constancia y conteos (4/8 vasos) hace falta algo como `habit_logs (habit_id, date, count)` y meta numérica en `habits`.
2. **Resumen financiero por mes**: `/expenses/summary` solo devuelve el mes actual (el selector de mes queda pendiente).
3. **Layout de widgets**: guardar orden/tamaño/ocultos. Fase 1 en `localStorage` (con try/catch); a futuro tabla `user_preferences`.
4. **Frases del journal**: hoy no hay tabla; fase 1 con frases por defecto.
5. **Prioridad / categoría de tareas, lugar de eventos**: usar los campos que existan; si falta alguno, ocultar ese dato, no simularlo.

---

## 6. Accesibilidad
Contraste ≥ 4.5:1 en texto (los grises `#4F525A`/`#5F6268` sobre blanco y `#F7F7F8` cumplen). Botones reales (`<button>`, `<a href>`), `aria-pressed` en toggles, `aria-label` en íconos, `role="img"` + descripción en gráficas, foco visible, `prefers-reduced-motion` para el oleaje.

## 7. Pendiente de diseño
Modo oscuro: no está diseñado. Crear los tokens oscuros como variables desde el inicio (fondo `#0F1012`, superficie `#1A1B1E`, texto `#F2F2F3`, lima igual) y validarlos después.

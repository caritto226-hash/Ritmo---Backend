# Prompts para Claude Code (en orden)

Reglas para usarlos:
- Un prompt por fase. Al terminar cada fase: revisa en el navegador, haz commit y escribe `/clear` antes de la siguiente.
- La fase 0 hazla en **modo plan** (Shift+Tab hasta ver "plan mode") para que Claude Code solo analice y proponga.
- Si una pantalla no se parece, adjunta la captura correspondiente con `@design-handoff/screenshots/...` y pide "compara con esta captura y corrige las diferencias".

---

## Fase 0 · Análisis y plan (modo plan, sin código)
```text
Vamos a rediseñar el frontend de Ritmo para que replique EXACTAMENTE el diseño de @design-handoff/.
Lee primero @design-handoff/DESIGN_SPEC.md y luego todos los archivos de design-handoff/screens/ (web y mobile). Los .dc.html son la fuente de verdad: los estilos en línea traen los valores exactos; el <script> trae datos de ejemplo y la lógica de interacción de referencia (no se copia, se reimplementa en React con datos reales).

Sin escribir código todavía, entrégame:
1. Inventario del frontend actual: rutas, páginas, componentes, estilos (base.css, tokens), cómo se cargan los datos de cada módulo.
2. Arquitectura propuesta: carpeta de componentes reutilizables (los de la sección 2 del spec), dónde van los tokens, cómo se resuelve el responsive (misma ruta, layout web ≥ 760 px y móvil < 760 px).
3. Tabla de equivalencias entre los tokens del spec y las variables CSS actuales: qué se reemplaza, qué se crea. Incluye las variables del modo oscuro aunque aún no se diseñe.
4. Para cada pantalla: qué datos reales existen en la API y qué falta (sección 5 del spec). No inventes endpoints.
5. Plan por fases (1 a 7 de design-handoff/PROMPTS.md), con riesgos y archivos que tocará cada una.
Espera mi aprobación antes de implementar.
```

## Fase 1 · Tokens, fuente y componentes base
```text
Implementa la fase 1 del plan aprobado:
- Fuente Urbanist (300–700) y todos los tokens de la sección 1 de DESIGN_SPEC.md como custom properties (claro + oscuro provisional). Sin hex sueltos en componentes.
- Componentes base: Card (white, gradient-ritmo, dark, pastel), IconButton, PillButton, Chip, SegmentedControl, StatInline, Toast, BottomSheet.
- AppShellWeb (header con logo, NavPills, acciones; PageTitle con migas, h1 y stats; Rail lateral) y BottomTabBar móvil, copiando medidas exactas de design-handoff/screens/web/Inicio.dc.html y screens/mobile/Hoy.dc.html.
- Una ruta de desarrollo /dev/ui que muestre todos los componentes y estados (normal, hover, seleccionado, completado, vencido, deshabilitado).
No cambies todavía las páginas. Lint y build deben pasar. Dime qué archivos creaste.
```

## Fase 2 · Inicio (web) y Hoy (móvil)
```text
Fase 2: dashboard. Replica exacto design-handoff/screens/web/Inicio.dc.html (≥ 760 px) y design-handoff/screens/mobile/Hoy.dc.html (< 760 px) en la ruta del dashboard.
- Componentes nuevos: LiquidOrb (oleaje SVG con prefers-reduced-motion), HourBars, HalfGauge, CurveChart, BubbleStats, HorizontalTimeline, LollipopTimeline, WeekStrip, MonthMini, MoneyCard, WidgetGrid.
- Widgets con datos reales de tasks, events, habits, expenses y recurrences. Lo que no exista en la API (ver sección 5 del spec) muéstralo con estado vacío amable, nunca con datos falsos.
- Modo Personalizar: web con arrastrar, ancho y quitar; móvil con flechas y hoja "Agregar widget". Guarda el layout en localStorage con try/catch.
- Marcar tarea, hábito o pago desde un widget actualiza la esfera y el resumen sin recargar.
Toma capturas a 1440 px y 390 px y compáralas con los mockups; corrige diferencias de espaciado, tamaños y colores antes de reportar.
```

## Fase 3 · Tareas
```text
Fase 3: Tareas. Replica design-handoff/screens/web/TareasWeb.dc.html y design-handoff/screens/mobile/Tareas.dc.html.
Usa GET /tasks y PATCH /tasks/:id/status. Completado = gris con check negro, sin tachado. Filtros por estado y categoría; vencidas en rojo; "Sin hora" para tareas sin start_at.
Reutiliza los componentes de fases anteriores; si necesitas uno nuevo, agrégalo a /dev/ui. Compara capturas a 1440 y 390 px antes de reportar.
```

## Fase 4 · Eventos
```text
Fase 4: Eventos. Replica design-handoff/screens/web/EventosWeb.dc.html (calendario semanal con vista Día/Semana, detalle en tarjeta negra, mes y próximos) y design-handoff/screens/mobile/Eventos.dc.html.
Estados del backend: programado / realizado. Usa event_date, event_time y duration para posicionar los bloques. Compara capturas antes de reportar.
```

## Fase 5 · Hábitos
```text
Fase 5: Hábitos. Replica design-handoff/screens/web/HabitosWeb.dc.html y design-handoff/screens/mobile/Habitos.dc.html.
Antes de maquetar, revisa la sección 5 del spec: hoy no hay registro diario. Propón la migración mínima (habit_logs y meta numérica) y espera mi aprobación para tocar el backend. Mientras tanto, muestra solo lo que la API permite (check de hoy) y deja los componentes de racha, semana y constancia listos para recibir datos.
```

## Fase 6 · Finanzas, Recurrentes y Confirmar
```text
Fase 6: Finanzas. El módulo ya tiene un rediseño previo; actualízalo a este sistema visual replicando design-handoff/screens/web/FinanzasWeb.dc.html, screens/mobile/Finanzas.dc.html, Recurrentes.dc.html y Confirmar.dc.html.
Conserva toda la lógica de negocio actual (confirmación una vez por período, aparece 2 días antes, desaparece al confirmar, montos enteros). Elimina estilos y componentes que queden sin uso. Compara capturas antes de reportar.
```

## Fase 7 · QA final
```text
Fase 7: control de calidad del rediseño completo.
- Capturas de todas las pantallas a 1440, 1024, 768, 390 y 360 px; compáralas con design-handoff/screenshots y lista diferencias.
- Accesibilidad: contraste, foco visible, aria-labels, navegación con teclado, prefers-reduced-motion y prefers-reduced-transparency.
- Revisa que no queden hex sueltos ni estilos duplicados, que lint y build pasen y que no haya errores en consola.
Entrégame un informe con ✅/❌ por pantalla y corrige lo que esté en ❌.
```

# Ritmo · Organizador personal

## Proyecto
- `ritmo-frontend/`: React 19 + Vite 8 + react-router-dom 7 + axios. Lint con oxlint.
- `Ritmo - Backend/`: Express + MySQL (API REST en `/api/*`, respuestas `{ data }`).
- `ritmo-mobile/`: app Expo aparte; fuera del rediseño web.

### Comandos (desde `ritmo-frontend/`)
- `npm run dev`: servidor de desarrollo.
- `npm run lint`: oxlint.
- `npm run build`: build de producción.

### Arquitectura del frontend
- `src/styles/tokens.css`: único lugar con colores literales (claro + `[data-theme="dark"]` provisional).
- `src/ui/`: sistema de diseño con CSS Modules (`primitives/`, `shell/`, `icons/`, y en próximas fases `charts/`, `domain/`, `widgets/`).
- `src/pages/<modulo>/`: `<Modulo>Page` carga datos y elige `<Modulo>Web` (≥ 760 px) o `<Modulo>Mobile` (< 760 px) con `useIsWeb()`.
- `src/services/`: llamadas a la API (no se duplican; los hooks de datos las envuelven).
- `/dev/ui`: catálogo de componentes, solo en desarrollo.
- Rutas en inglés: `/dashboard`, `/tasks`, `/habits`, `/events`, `/expenses`, `/expenses/recurrences`.

## Reglas obligatorias
- **No tocar el backend** (`Ritmo - Backend/`) en ninguna fase del rediseño. Lo que falte se registra en `design-handoff/BACKEND_PENDIENTE.md`.
- **Maquetar todo lo del diseño, nada se oculta por falta de datos.** Si el dato se puede calcular con datos reales, se calcula. Si no existe, el componente se muestra completo con "estado sin datos": mismo tamaño, forma y lugar; valores en "—", gráficas con la pista vacía y la etiqueta "Próximamente" (12px, `var(--text-3)`). Nunca datos falsos presentados como reales.
- La vista previa de diseño (`VITE_DESIGN_PREVIEW=true`, solo en desarrollo) llena esos componentes con los datos de ejemplo de los mockups; en producción no existe.
- **Archivos `.env`:** no abrir, leer, mostrar ni modificar ningún `.env` (`.env`, `.env.local`, `.env.development`, `.env.production` ni similares) del frontend ni del backend. Si hace falta una variable nueva, pedírsela a la usuaria con su nombre y valor. Para saber qué variables existen, preguntar o revisar `.env.example`.
- No guardar credenciales en ningún archivo.

## Diseño de interfaz (rediseño 2026)
- La fuente de verdad visual está en `design-handoff/`. Antes de tocar cualquier componente o pantalla, lee `design-handoff/DESIGN_SPEC.md` y el archivo de `design-handoff/screens/` correspondiente.
- Replica valores exactos (colores, tamaños, radios, espaciados, sombras) desde los estilos en línea de los `.dc.html`. No "mejores" ni aproximes el diseño sin preguntar.
- Los datos de los `.dc.html` son de ejemplo: usa siempre datos reales de la API. Si un dato no existe en el backend, muestra un estado vacío y avísame; no inventes endpoints ni datos.
- Colores solo mediante custom properties (tokens). Nada de hex sueltos en componentes.
- Reutiliza los componentes base; si creas uno nuevo, agrégalo a la ruta `/dev/ui`.
- Completado = gris con check negro, nunca tachado. Montos en pesos enteros con punto de miles.
- Áreas táctiles mínimas de 44 px, `aria-label` en botones de solo ícono, contraste ≥ 4.5:1.
- Código y valores guardados en inglés; interfaz en español.
- Al terminar una tarea visual, compara con la captura de `design-handoff/screenshots/` y reporta diferencias.
- Trabaja por fases y espera mi aprobación entre una y otra. No hagas commit ni push sin que te lo pida.

# Ritmo · Paquete de diseño para Claude Code

## Contenido
- `DESIGN_SPEC.md`: tokens, tipografía, componentes, mapa de pantallas, interacciones y brechas de backend.
- `PROMPTS.md`: los prompts por fase, en orden.
- `CLAUDE.design.md`: reglas para pegar en el `CLAUDE.md` del repositorio.
- `screens/web/` y `screens/mobile/`: el código fuente de cada pantalla del mockup, con los valores exactos.
- `screenshots/`: aquí van tus capturas de cada pantalla (ver abajo).

## Pasos
1. Copia esta carpeta a la raíz del repositorio con el nombre `design-handoff/`.
2. Pega el contenido de `CLAUDE.design.md` al final de tu `CLAUDE.md` (o créalo).
3. Toma capturas de cada pantalla en el lienzo de diseño (modo Play, ancho real: 1440 px web y 390 px móvil) y guárdalas en `screenshots/web/` y `screenshots/mobile/` con el mismo nombre del archivo (`Inicio.png`, `Hoy.png`, …).
4. Crea una rama: `git checkout -b feat/ui-redesign`.
5. Abre Claude Code en VS Code y sigue `PROMPTS.md` desde la fase 0.

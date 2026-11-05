// Navegación principal compartida por la cabecera web (píldoras) y la barra inferior móvil.
// Las rutas se mantienen en inglés; las etiquetas, en español.
export const MAIN_NAV = [
  { to: "/dashboard", label: "Inicio", mobileLabel: "Hoy", icon: "grid", tabIcon: "tabHome" },
  { to: "/tasks", label: "Tareas", icon: "taskCircle", tabIcon: "tabTasks" },
  { to: "/habits", label: "Hábitos", icon: "flame", tabIcon: "check" },
  { to: "/events", label: "Eventos", icon: "calendar", tabIcon: "tabCalendar" },
  { to: "/expenses", label: "Finanzas", icon: "wallet", tabIcon: "tabWallet" },
];

// Corte web/móvil del rediseño (DESIGN_SPEC §3): ≥ 760 px web, < 760 px móvil.
export const WEB_MIN_WIDTH = 760;

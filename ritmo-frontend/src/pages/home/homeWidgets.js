// Catálogo de widgets del Inicio (reemplaza constants/dashboardWidgets.js).
// Web (Inicio.dc.html): sizes son los anchos posibles en columnas; tall ocupa dos filas.
// Móvil (Hoy.dc.html): size full (2 columnas), half (1) o tall (1 × 2 filas).

export const HOME_LAYOUT_KEY = (userId) => `ritmo-home-layout-v2-${userId}`;

export const WEB_WIDGETS = {
  ritmo: { title: "Tu ritmo de hoy", sizes: [1], tall: true, href: "/tasks", openLabel: "Ver agenda" },
  agenda: { title: "Agenda", sizes: [2, 3, 4], href: "/events", openLabel: "Abrir Eventos" },
  pagos: { title: "Pagos y cobros", sizes: [1, 2, 3], href: "/expenses", openLabel: "Ver recurrentes" },
  cal: { title: "Calendario", sizes: [1, 2], href: "/events", openLabel: "Abrir calendario" },
  tareas: { title: "Tareas de hoy", sizes: [1, 2], href: "/tasks", openLabel: "Abrir Tareas" },
  habitos: { title: "Hábitos", sizes: [1, 2, 3], href: "/habits", openLabel: "Abrir Hábitos" },
  fin: { title: "Finanzas", sizes: [1, 2], href: "/expenses", openLabel: "Abrir Finanzas" },
  gastos: { title: "Gastos de la semana", sizes: [2, 3], href: "/expenses", openLabel: "Abrir Finanzas" },
};

export const WEB_DEFAULT = [
  { id: "ritmo", span: 1 },
  { id: "agenda", span: 3 },
  { id: "pagos", span: 2 },
  { id: "cal", span: 1 },
  { id: "tareas", span: 1 },
  { id: "habitos", span: 2 },
  { id: "fin", span: 1 },
];

export const MOBILE_WIDGETS = {
  resumen: { title: "Tu ritmo de hoy", description: "Avance del día y lo que te falta", size: "full", href: "/tasks", openLabel: "Ver agenda" },
  ritmo: { title: "Actividad", description: "Lo que has hecho por horas", size: "tall", href: "/tasks", openLabel: "Ver agenda" },
  eventos: { title: "Eventos", description: "Cuántos te faltan y el próximo", size: "half", href: "/events", openLabel: "Abrir Eventos" },
  habitos: { title: "Hábitos", description: "Cumplidos hoy", size: "half", href: "/habits", openLabel: "Abrir Hábitos" },
  tareas: { title: "Tareas", description: "Pendientes y la siguiente", size: "half", href: "/tasks", openLabel: "Abrir Tareas" },
  fin: { title: "Disponible", description: "Saldo del mes", size: "half", href: "/expenses", openLabel: "Abrir Finanzas" },
  pagos: { title: "Pagos y cobros", description: "Lo que vence y lo que te deben", size: "full" },
  dia: { title: "Tu día", description: "Línea de tiempo de hoy", size: "full" },
};

export const MOBILE_DEFAULT = ["resumen", "ritmo", "eventos", "habitos", "tareas", "fin", "pagos", "dia"].map((id) => ({ id }));

// Frases por defecto de "Tu frase de hoy" mientras no exista el journal (BACKEND_PENDIENTE #6).
export const DEFAULT_QUOTES = [
  "Pequeños pasos, gran ritmo.",
  "Hoy no tiene que ser perfecto, solo constante.",
  "Lo que repites, te construye.",
  "Respira, organiza y avanza.",
];

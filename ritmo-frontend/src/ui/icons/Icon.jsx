// Trazos copiados de design-handoff/screens (viewBox 0 0 24 24, estilo Lucide).
// Cada entrada es el contenido interno del <svg>; el trazo lo pone <Icon>.

const ICON_PATHS = {
  logo: (
    <>
      <path d="M12 2.5S5.5 9.5 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9.5 12 2.5 12 2.5Z" />
      <path d="M9.5 15.5a2.5 2.5 0 0 0 2.5 2" />
    </>
  ),

  // Navegación web (píldoras)
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </>
  ),
  taskCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  flame: <path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 0-5 1-7.5Z" />,
  flameSolid: (
    <path d="M12 2.5c2.2 3.3 5.5 5.5 5.5 10a5.5 5.5 0 0 1-11 0c0-2.2 1.1-3.9 2.2-5 0 2.2 1.1 3.3 2.2 3.3 0-3.3 0-5.5 1.1-8.3Z" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  // Cancelar evento: el calendario del mockup con una "x" en lugar de los días.
  calendarX: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M10 13l4 4M14 13l-4 4" />
    </>
  ),
  calendarDays: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18M16 14.5h2" />
    </>
  ),

  // Barra inferior móvil
  tabHome: <path d="M3 10.5 12 3l9 7.5V21H3z" />,
  tabTasks: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  tabCalendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  tabWallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M16 12.5h2M3 10h18" />
    </>
  ),

  // Rail y acciones
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z" />
      <path d="M10 20.5v-5h4v5" />
    </>
  ),
  house: (
    <>
      <path d="M3 10.5 12 3l9 7.5V21H3z" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  journal: (
    <>
      <path d="M6 3.5h9l3.5 3.5v13.5H6Z" />
      <path d="M14.5 3.5V7.5h4M9 12h6M9 16h4" />
    </>
  ),
  note: (
    <>
      <path d="M6 3.5h9l3.5 3.5v13.5H6Z" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  tag: (
    <>
      <path d="M20 13.2 13.2 20a1.8 1.8 0 0 1-2.5 0L3.5 12.8V3.5h9.3L20 10.7a1.8 1.8 0 0 1 0 2.5Z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  logout: <path d="M9.5 20.5h-4a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5h4M16 16.5l4.5-4.5L16 7.5M20.5 12H9.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  clockSm: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  archive: (
    <>
      <rect x="3.5" y="4" width="17" height="5" rx="1.5" />
      <path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </>
  ),
  barChart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  layout: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="17" height="7" rx="2" />
    </>
  ),

  // Cabecera
  moon: <path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.5 6.5 0 0 0 10 10Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8.5a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15 6 8.5" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  // Recordatorio del detalle de evento (EventosWeb.dc.html): la campana sin badajo.
  bellSm: <path d="M6 8.5a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15 6 8.5" />,
  menu:<path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  folder: <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />,
  arrowRight: <path d="M4 12h15M15 8l4 4-4 4" />,

  // Genéricos
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M20 6 9 17l-5-5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowUpRight: <path d="M7 17 17 7M9 7h8v8" />,
  arrowDownRight: <path d="M7 7l10 10M17 9v8H9" />,
  arrowUp: <path d="M12 19V5M5 12l7-7 7 7" />,
  arrowDown: <path d="M12 5v14M5 12l7 7 7-7" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16Z" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M2 12s3.5-7 10-7c2 0 3.7.6 5.1 1.5M22 12s-3.5 7-10 7c-2 0-3.7-.6-5.1-1.5" />
      <path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v.01M12 11v5" />
    </>
  ),
  pulse: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  dot: <path d="M12 12h.01" />,
  ring: <circle cx="12" cy="12" r="8.5" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  bank: (
    <>
      <path d="M3 10h18L12 4z" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.5 12h11.5l2-8H6" />
    </>
  ),
  bus: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 11h14M8 21l1-4M16 21l-1-4" />
      <circle cx="8.5" cy="14" r="0.6" />
      <circle cx="15.5" cy="14" r="0.6" />
    </>
  ),

  // Hábitos
  drop: <path d="M12 2.7S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.7 12 2.7Z" />,
  book: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4" r="2" />
      <path d="m9 21 2-6 3 3v3M7 12l3-3 4 1 3 3M11 15l-1-4" />
    </>
  ),
  moonHabit: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,

  // Asa para arrastrar widgets (relleno)
  dragDots: (
    <>
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </>
  ),
};

// Íconos que se pintan con relleno en lugar de trazo.
const FILLED_ICONS = new Set(["flameSolid", "dragDots"]);

/**
 * Ícono SVG del sistema. Decorativo por defecto (aria-hidden):
 * el botón que lo contiene es quien lleva el aria-label.
 */
function Icon({ name, size = 18, strokeWidth = 1.7, className, title }) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;
  const filled = FILLED_ICONS.has(name);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {paths}
    </svg>
  );
}

export default Icon;

// La API guarda la hora en 24 h ("14:30" o "14:30:00"); en pantalla se muestra en 12 h con a. m. / p. m.
export function formatTime12(value) {
  const match = typeof value === "string" ? value.match(/^(\d{2}):(\d{2})/) : null;
  if (!match) return "";
  const hour = Number(match[1]);
  const period = hour < 12 ? "a. m." : "p. m.";
  return `${hour % 12 || 12}:${match[2]} ${period}`;
}

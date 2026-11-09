// Colores de categoría: el usuario guarda un hex (#RRGGBB) y se muestra tal cual.
// Lo que se calcula aquí es la tinta del ícono o la inicial para que contraste con ese fondo.

const HEX_COLOR = /^#([0-9a-f]{6})$/i;

// Luminancia relativa de la tinta oscura (--ink-on-light en tokens.css).
const DARK_INK_LUMINANCE = 0.006;

export function isHexColor(value) {
  return typeof value === "string" && HEX_COLOR.test(value);
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const value = parseInt(hex.slice(1), 16);
  const red = channelToLinear((value >> 16) & 255);
  const green = channelToLinear((value >> 8) & 255);
  const blue = channelToLinear(value & 255);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

// Devuelve el token de tinta (oscura o blanca) con más contraste sobre el color guardado.
// Los pasteles del diseño dan tinta oscura; los colores saturados antiguos, blanca.
export function getInkOnColor(hex) {
  if (!isHexColor(hex)) return "var(--text)";
  const luminance = relativeLuminance(hex);
  const darkContrast = (luminance + 0.05) / (DARK_INK_LUMINANCE + 0.05);
  const lightContrast = 1.05 / (luminance + 0.05);
  return darkContrast >= lightContrast ? "var(--ink-on-light)" : "var(--ink-on-dark)";
}

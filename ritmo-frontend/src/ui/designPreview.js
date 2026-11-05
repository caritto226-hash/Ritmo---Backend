// Vista previa de diseño (solo desarrollo). Con VITE_DESIGN_PREVIEW=true, los componentes
// sin respaldo en la API se llenan con los datos de ejemplo de los mockups para compararlos
// contra design-handoff/. En el build de producción import.meta.env.DEV es false y el modo
// desaparece, así que nunca se muestran datos de ejemplo como si fueran reales.
export const DESIGN_PREVIEW = import.meta.env.DEV && import.meta.env.VITE_DESIGN_PREVIEW === "true";

// Valor que se muestra cuando un dato no existe en la API.
export const NO_DATA = "—";

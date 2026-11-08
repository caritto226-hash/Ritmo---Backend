import { DESIGN_PREVIEW } from "../../ui/designPreview";

// Datos de ejemplo de FinanzasWeb.dc.html para lo que la API todavía no respalda: el medio de pago
// bajo el concepto ("Efectivo", "Débito"; BACKEND_PENDIENTE #11). Solo existen con
// VITE_DESIGN_PREVIEW=true en desarrollo; en producción es null y la nota muestra "Recurrente ·
// frecuencia", la primera línea de las notas o "—". Los movimientos reales reciben uno de estos
// valores según su id.
export const FINANCE_PREVIEW = DESIGN_PREVIEW
  ? { paymentMethods: ["Efectivo", "Tarjeta TuLlave", "Débito", "Débito"] }
  : null;

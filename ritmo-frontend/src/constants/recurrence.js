// Frecuencias de repetición que acepta la API (tareas y eventos): valor guardado → texto.
export const RECURRENCE_FREQUENCIES = [
  ["daily", "Diaria"],
  ["weekly", "Semanal"],
  ["monthly", "Mensual"],
  ["yearly", "Anual"],
];

export const RECURRENCE_LABELS = Object.fromEntries(RECURRENCE_FREQUENCIES);

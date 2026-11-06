// Textos de un pago o cobro pendiente (GET /expenses/recurrences/reminders) para las tarjetas.
import { formatSignedAmount, getDueLabel, getTodayDate } from "../../utils/financeFormat";
import { getInkOnColor } from "../../utils/color";

function incomeDueLabel(scheduledDate, today) {
  const label = getDueLabel(scheduledDate, today);
  if (label === "Hoy") return "Llega hoy";
  if (label === "Vence mañana") return "Llega mañana";
  if (label.startsWith("Vence en")) return label.replace("Vence en", "Llega en");
  return label;
}

export function describeReminder(reminder, today = getTodayDate()) {
  const isIncome = Number(reminder.amount) > 0;
  const name = reminder.concept || "";
  const color = reminder.category?.color;
  const due = isIncome
    ? incomeDueLabel(reminder.scheduledDate, today)
    : getDueLabel(reminder.scheduledDate, today).replace(/^Hoy$/, "Vence hoy");

  return {
    name,
    initial: name.trim().charAt(0).toUpperCase() || "·",
    tileStyle: color ? { background: color, color: getInkOnColor(color) } : undefined,
    isIncome,
    late: Boolean(reminder.isOverdue),
    due,
    amount: formatSignedAmount(reminder.amount),
    settleLabel: `${isIncome ? "Marcar recibido" : "Marcar pagado"}: ${name}`,
  };
}

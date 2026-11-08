// Cálculos de Finanzas sobre los datos reales de la API. GET /expenses no acepta filtro de fechas
// y /expenses/summary solo cubre el mes actual (BACKEND_PENDIENTE #3): el mes elegido, su
// comparación con el anterior, la semana y el reparto por categoría se calculan aquí.
import { addDays, MONTHS, MONTHS_SHORT, mondayOf, parseDateKey, toDateKey, WEEKDAYS_SHORT } from "../../utils/dates";
import { formatCurrency, formatDayMonth, frequencyLabels } from "../../utils/financeFormat";

// Chips de tipo antes de las categorías (Todos, Ingresos, Gastos).
export const TYPE_CHIPS = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
];

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function amountOf(item) {
  return Number(item.amount) || 0;
}

// "2026-11-07" → "2026-11"
export function toMonthKey(dateKey) {
  return dateKey ? dateKey.slice(0, 7) : null;
}

export function previousMonthKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

// "long": "Noviembre 2026" (web) · "short": "Nov 2026" (móvil) · "name": "noviembre"
export function formatMonthLabel(monthKey, style = "long") {
  const [year, month] = monthKey.split("-").map(Number);
  if (style === "name") return MONTHS[month - 1];
  const name = style === "short" ? MONTHS_SHORT[month - 1] : MONTHS[month - 1];
  return `${capitalize(name)} ${year}`;
}

// Meses con movimientos registrados, más el actual, del más reciente al más antiguo.
export function selectMonthOptions(expenses, todayKey) {
  const months = new Set([toMonthKey(todayKey)]);
  expenses.forEach((expense) => {
    const key = toMonthKey(toDateKey(expense.expenseDate));
    if (key) months.add(key);
  });
  return [...months].sort().reverse();
}

function inMonth(expense, monthKey) {
  return toMonthKey(toDateKey(expense.expenseDate)) === monthKey;
}

// Ingresos, gastos (en positivo) y saldo de un mes, con la misma regla de /expenses/summary.
export function selectMonthSummary(expenses, monthKey) {
  let income = 0;
  let spent = 0;
  let count = 0;
  expenses.forEach((expense) => {
    if (!inMonth(expense, monthKey)) return;
    const amount = amountOf(expense);
    count += 1;
    if (amount > 0) income += amount;
    else spent += Math.abs(amount);
  });
  return { income, expenses: spent, balance: income - spent, count };
}

/**
 * Disponible del mes elegido contra el mes anterior, calculado con GET /expenses.
 * Devuelve { text, tone } con la etiqueta que se muestra; tone "up" | "down" | "none".
 */
export function selectMonthComparison(expenses, monthKey, balance) {
  const previousKey = previousMonthKey(monthKey);
  const previous = selectMonthSummary(expenses, previousKey);
  const name = formatMonthLabel(previousKey, "name");
  if (previous.count === 0) return { text: `Sin movimientos en ${name} para comparar`, tone: "none" };
  if (previous.balance === 0) return { text: `${capitalize(name)} cerró en $0: sin porcentaje para comparar`, tone: "none" };
  const pct = Math.round(((balance - previous.balance) / Math.abs(previous.balance)) * 100);
  if (pct === 0) return { text: `El mismo disponible que en ${name}`, tone: "none" };
  return {
    text: `${Math.abs(pct)} % ${pct > 0 ? "más" : "menos"} disponible que en ${name}`,
    tone: pct > 0 ? "up" : "down",
  };
}

function spentOn(expenses, dateKey) {
  return expenses
    .filter((expense) => amountOf(expense) < 0 && toDateKey(expense.expenseDate) === dateKey)
    .reduce((total, expense) => total + Math.abs(amountOf(expense)), 0);
}

/**
 * Gastos de la semana de hoy (lunes a domingo). La comparación usa los mismos días de la semana
 * anterior (lunes hasta el día de hoy) y el promedio, los días que ya pasaron.
 */
export function selectWeekSpending(expenses, todayKey) {
  const monday = mondayOf(todayKey);
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(monday, index);
    return { key, label: WEEKDAYS_SHORT[parseDateKey(key).weekday], amount: key > todayKey ? 0 : spentOn(expenses, key) };
  });
  const elapsed = days.filter((day) => day.key <= todayKey);
  const total = elapsed.reduce((sum, day) => sum + day.amount, 0);
  const previousTotal = elapsed.reduce((sum, day) => sum + spentOn(expenses, addDays(day.key, -7)), 0);
  return {
    days,
    total,
    previousTotal,
    diff: total - previousTotal,
    average: elapsed.length ? Math.round(total / elapsed.length) : 0,
    range: `${formatDayMonth(monday)} – ${formatDayMonth(addDays(monday, 6))}`,
  };
}

// "$58.000 menos" / "$12.000 más": contra los mismos días de la semana pasada.
export function weekDiffText(week) {
  if (week.diff === 0) return "Igual que la semana pasada";
  return `${formatCurrency(Math.abs(week.diff))} ${week.diff < 0 ? "menos" : "más"}`;
}

// Gastos del mes por categoría, de mayor a menor, con su porcentaje del total.
export function selectCategoryShares(expenses, monthKey) {
  const byCategory = new Map();
  let total = 0;
  expenses.forEach((expense) => {
    const amount = amountOf(expense);
    if (amount >= 0 || !inMonth(expense, monthKey)) return;
    const key = expense.categoryId ?? "none";
    const current = byCategory.get(key) || { key: String(key), name: expense.category?.name || "Sin categoría", total: 0 };
    current.total += Math.abs(amount);
    byCategory.set(key, current);
    total += Math.abs(amount);
  });
  const shares = [...byCategory.values()]
    .sort((a, b) => b.total - a.total)
    .map((share) => ({ ...share, pct: total === 0 ? 0 : Math.round((share.total / total) * 100) }));
  return { shares, total };
}

// Búsqueda por concepto sin distinguir mayúsculas ni tildes.
export function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Movimientos del mes elegido con los chips (tipo o categoría) y la búsqueda.
export function filterMovements(expenses, { monthKey, type = "all", categoryId = "", query = "" }) {
  const search = normalizeText(query.trim());
  return expenses.filter((item) => {
    if (monthKey && !inMonth(item, monthKey)) return false;
    const amount = amountOf(item);
    if (type === "income" && amount <= 0) return false;
    if (type === "expense" && amount >= 0) return false;
    if (categoryId && String(item.categoryId) !== categoryId) return false;
    return !search || normalizeText(item.concept).includes(search);
  });
}

// Agrupa por día (más reciente primero). Dentro del día, el registrado más tarde va arriba.
export function groupByDay(items) {
  const sorted = [...items].sort((a, b) => (
    String(b.expenseDate).slice(0, 10).localeCompare(String(a.expenseDate).slice(0, 10)) || b.id - a.id
  ));
  const groups = [];
  sorted.forEach((item) => {
    const day = String(item.expenseDate).slice(0, 10);
    const current = groups[groups.length - 1];
    if (current?.day === day) current.items.push(item);
    else groups.push({ day, items: [item] });
  });
  return groups;
}

// Fecha del último movimiento registrado por cada recurrente ("Pagada 28 oct").
export function selectLastPaidByRecurrence(expenses) {
  const lastPaid = new Map();
  expenses.forEach((expense) => {
    if (!expense.recurrenceId) return;
    const date = String(expense.expenseDate).slice(0, 10);
    if (!lastPaid.has(expense.recurrenceId) || date > lastPaid.get(expense.recurrenceId)) {
      lastPaid.set(expense.recurrenceId, date);
    }
  });
  return lastPaid;
}

// Recurrentes sin recordatorio pendiente ("Al día").
export function selectSettledRecurrences(recurrences, reminders) {
  const pending = new Set(reminders.map((reminder) => reminder.recurrenceId));
  return recurrences.filter((recurrence) => !pending.has(recurrence.recurrenceId));
}

// "Pagada 28 oct · próxima 28 nov" (o "detenido" si ya no tiene próximas fechas).
export function describeSettled(recurrence, lastPaidDate) {
  const parts = [];
  if (lastPaidDate) parts.push(`${amountOf(recurrence) > 0 ? "recibida" : "pagada"} ${formatDayMonth(lastPaidDate)}`);
  parts.push(recurrence.isActive ? `próxima ${formatDayMonth(recurrence.nextScheduledDate)}` : "detenido");
  return capitalize(parts.join(" · "));
}

// Nota bajo el concepto (web). El medio de pago no existe en la API (BACKEND_PENDIENTE #11):
// "Recurrente · mensual" si vino de un recurrente; si no, la primera línea de las notas.
export function movementNote(expense, recurrenceById) {
  if (expense.recurrenceId) {
    const frequency = recurrenceById.get(expense.recurrenceId)?.frequency;
    return frequency ? `Recurrente · ${(frequencyLabels[frequency] || frequency).toLowerCase()}` : "Recurrente";
  }
  return expense.notes ? String(expense.notes).split("\n")[0] : null;
}

export function isIncome(item) {
  return amountOf(item) > 0;
}

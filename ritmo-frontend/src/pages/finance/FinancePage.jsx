import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShell, useShellRail } from "../../ui/shell/ShellContext";
import useFinance from "../../hooks/data/useFinance";
import useNow from "../../hooks/useNow";
import useCreateIntent from "../../hooks/useCreateIntent";
import {
  filterMovements,
  formatMonthLabel,
  groupByDay,
  movementNote,
  normalizeText,
  selectCategoryShares,
  selectLastPaidByRecurrence,
  selectMonthComparison,
  selectMonthOptions,
  selectMonthSummary,
  selectSettledRecurrences,
  selectWeekSpending,
  TYPE_CHIPS,
  toMonthKey,
} from "../../hooks/data/financeSelectors";
import { selectReminderGroups } from "../../hooks/data/todaySelectors";
import { NO_DATA } from "../../ui/designPreview";
import ConfirmPaymentSheet from "../../ui/domain/ConfirmPaymentSheet";
import MonthPickerSheet from "../../ui/domain/MonthPickerSheet";
import CategoryManager from "../../components/CategoryManager";
import { FINANCE_PREVIEW } from "./financePreview";
import ExpenseFormModal from "./ExpenseFormModal";
import ExpenseDetailSheet from "./ExpenseDetailSheet";
import FinanceWeb from "./FinanceWeb";
import FinanceMobile from "./FinanceMobile";
import RecurrencesView from "./RecurrencesView";

const HIDE_BALANCE_KEY = "ritmo.finance.hideBalance";

function readHideBalance() {
  try {
    return localStorage.getItem(HIDE_BALANCE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveHideBalance(hidden) {
  try {
    localStorage.setItem(HIDE_BALANCE_KEY, hidden ? "1" : "0");
  } catch {
    // Sin almacenamiento (modo privado): la preferencia dura solo esta visita.
  }
}

/**
 * Finanzas: web (FinanzasWeb.dc.html, ≥ 760 px) y móvil (Finanzas.dc.html, < 760 px) en /expenses,
 * y Recurrentes (Recurrentes.dc.html) en /expenses/recurrences, con los mismos datos (useFinance)
 * y manejadores. La hoja de confirmar (Confirmar.dc.html) sirve a las dos vistas.
 * El mes elegido, su comparación con el anterior, la semana y "En qué gastas" se calculan con
 * GET /expenses (BACKEND_PENDIENTE #3); el mes actual usa /expenses/summary.
 */
function FinancePage({ view = "summary" }) {
  const { isWeb, notify, comingSoon } = useShell();
  const navigate = useNavigate();
  const now = useNow();
  const data = useFinance({ notify });
  const todayKey = now.dateKey;
  const currentMonth = toMonthKey(todayKey);

  const [monthKey, setMonthKey] = useState(currentMonth);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [filter, setFilter] = useState({ type: "all", categoryId: "" });
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(readHideBalance);
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [managingCategories, setManagingCategories] = useState(false);

  useCreateIntent(() => setForm({ type: "expense" }));

  useShellRail([
    { label: "Inicio", icon: "home", to: "/dashboard", end: true },
    { label: "Resumen", icon: "wallet", to: "/expenses", end: true },
    { label: "Recurrentes", icon: "repeat", to: "/expenses/recurrences" },
    { label: "Reportes", icon: "barChart", onClick: () => comingSoon("Reportes") },
  ]);

  const { expenses, reminders, recurrences, categories } = data;
  const recurrenceById = useMemo(
    () => new Map(recurrences.map((recurrence) => [recurrence.recurrenceId, recurrence])),
    [recurrences],
  );
  const lastPaid = useMemo(() => selectLastPaidByRecurrence(expenses), [expenses]);
  const reminderGroups = selectReminderGroups(reminders);
  const sortedReminders = [...reminderGroups.out, ...reminderGroups.in];

  // Resumen del mes: el actual viene de /expenses/summary; los anteriores, de GET /expenses.
  const isCurrentMonth = monthKey === currentMonth;
  const monthSummary = isCurrentMonth && data.summary
    ? {
        income: Number(data.summary.income) || 0,
        expenses: Number(data.summary.expenses) || 0,
        balance: Number(data.summary.balance) || 0,
      }
    : selectMonthSummary(expenses, monthKey);
  const monthName = formatMonthLabel(monthKey, "name");
  const balanceCard = {
    title: isCurrentMonth ? "Disponible este mes" : `Disponible en ${monthName}`,
    ...monthSummary,
    comparison: selectMonthComparison(expenses, monthKey, monthSummary.balance),
  };

  const monthOptions = selectMonthOptions(expenses, todayKey).map((value) => ({ value, label: formatMonthLabel(value) }));
  // Chips de categoría: las activas, sin repetir la etiqueta de un chip de tipo (la categoría
  // "Ingresos" ya la cubre el chip "Ingresos", como en el mockup).
  const typeLabels = new Set(TYPE_CHIPS.map((chip) => normalizeText(chip.label)));
  const activeCategories = categories.filter((category) => (
    category.isActive !== false && !typeLabels.has(normalizeText(category.name).trim())
  ));
  // La lista muestra solo los movimientos del mes elegido; los chips y la búsqueda filtran dentro de él.
  const movements = filterMovements(expenses, { monthKey, type: filter.type, categoryId: filter.categoryId, query });
  const isFiltering = filter.type !== "all" || Boolean(filter.categoryId) || Boolean(query.trim());
  // Texto de la lista vacía: filtros sin resultados en el mes, mes sin movimientos o ningún movimiento.
  let emptyText;
  if (isFiltering) emptyText = `No hay movimientos con estos filtros en ${monthName}.`;
  else if (expenses.length > 0) emptyText = `No hay movimientos en ${monthName}. Registra uno con Ingreso o Gasto, o elige otro mes.`;
  else emptyText = "Aún no tienes movimientos. Registra el primero con Ingreso o Gasto.";

  // Nota bajo el concepto (web). En la vista previa, un medio de pago del mockup según el id.
  function noteFor(expense) {
    const note = movementNote(expense, recurrenceById);
    if (note && expense.recurrenceId) return note;
    if (FINANCE_PREVIEW) {
      const methods = FINANCE_PREVIEW.paymentMethods;
      return methods[Math.abs(Number(expense.id) || 0) % methods.length];
    }
    return note || NO_DATA;
  }

  function toggleHidden() {
    setHidden((current) => {
      saveHideBalance(!current);
      return !current;
    });
  }

  function openReminder(reminder) {
    setSheet({ reminder, recurrence: recurrenceById.get(reminder.recurrenceId) || null });
  }

  const detailExpense = expenses.find((expense) => expense.id === detailId) || null;

  const shared = {
    loading: data.loading,
    today: todayKey,
    monthLabel: formatMonthLabel(monthKey, isWeb ? "long" : "short"),
    onPickMonth: () => setMonthPickerOpen(true),
    balance: balanceCard,
    hidden,
    onToggleHidden: toggleHidden,
    week: selectWeekSpending(expenses, todayKey),
    shares: selectCategoryShares(expenses, monthKey),
    reminders: sortedReminders,
    reminderTotals: { out: reminderGroups.outTotal, in: reminderGroups.inTotal },
    groups: groupByDay(movements),
    emptyText,
    noteFor,
    categories: activeCategories,
    filter,
    onFilter: setFilter,
    query,
    onQuery: setQuery,
    isFiltering,
    onResetFilters: () => {
      setFilter({ type: "all", categoryId: "" });
      setQuery("");
    },
    onCreate: (type, recurring = false) => setForm({ type, recurring }),
    onCategories: () => setManagingCategories(true),
    onSettle: openReminder,
    onOpenMovement: (expense) => setDetailId(expense.id),
    onRecurrences: () => navigate("/expenses/recurrences"),
  };

  return (
    <>
      {view === "recurrences" ? (
        <RecurrencesView
          isWeb={isWeb}
          loading={data.loading}
          today={todayKey}
          reminders={sortedReminders}
          settled={selectSettledRecurrences(recurrences, reminders)}
          lastPaid={lastPaid}
          onBack={() => navigate("/expenses")}
          onCreate={() => setForm({ type: "expense", recurring: true })}
          onOpenReminder={openReminder}
          onOpenRecurrence={(recurrence) => setSheet({ reminder: null, recurrence })}
        />
      ) : isWeb ? (
        <FinanceWeb {...shared} />
      ) : (
        <FinanceMobile {...shared} />
      )}

      {sheet && !form && (
        <ConfirmPaymentSheet
          key={sheet.reminder?.occurrenceId ?? `recurrence-${sheet.recurrence?.recurrenceId}`}
          reminder={sheet.reminder}
          recurrence={sheet.recurrence}
          lastPaidDate={lastPaid.get((sheet.reminder || sheet.recurrence).recurrenceId)}
          onClose={() => setSheet(null)}
          onConfirm={data.confirmReminder}
          onCancel={data.cancelRecurrence}
          onEdit={sheet.recurrence
            ? () => {
                setSheet(null);
                setForm({ recurrence: sheet.recurrence });
              }
            : undefined}
        />
      )}

      {detailExpense && !form && (
        <ExpenseDetailSheet
          key={detailExpense.id}
          expense={detailExpense}
          onClose={() => setDetailId(null)}
          onEdit={(expense) => {
            setDetailId(null);
            setForm({ expense });
          }}
          onDuplicate={data.duplicateMovement}
          onDelete={data.deleteMovement}
        />
      )}

      {form && (
        <ExpenseFormModal
          mode={form}
          categories={categories}
          onClose={() => setForm(null)}
          onSubmit={data.saveMovement}
          onCategoriesChanged={data.reloadCategories}
        />
      )}

      {managingCategories && (
        <CategoryManager
          module="finance"
          categories={categories}
          onClose={() => setManagingCategories(false)}
          onChanged={async () => {
            setFilter((current) => (current.categoryId ? { type: "all", categoryId: "" } : current));
            await data.reloadCategories();
          }}
        />
      )}

      <MonthPickerSheet
        open={monthPickerOpen}
        options={monthOptions}
        value={monthKey}
        note="Meses con movimientos registrados. El resumen de meses anteriores se calcula con tus movimientos."
        onChange={setMonthKey}
        onClose={() => setMonthPickerOpen(false)}
      />
    </>
  );
}

export default FinancePage;

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import expensesService from "../services/expenses.service";
import categoriesService from "../services/categories.service";
import CategoryIconBadge from "../components/CategoryIconBadge";
import CategorySelect from "../components/CategorySelect";
import CategoryManager from "../components/CategoryManager";
import FinancePendingCarousel from "../components/FinancePendingCarousel";
import FinanceConfirmSheet from "../components/FinanceConfirmSheet";
import FinanceRecurrencesView from "../components/FinanceRecurrencesView";
import FinanceToast from "../components/FinanceToast";
import MobileItemDetails from "../components/MobileItemDetails";
import DateCalendar from "../components/DateCalendar";
import {
  formatAmountDigits,
  formatCurrency,
  formatDayMonth,
  formatSignedAmount,
  frequencyLabels,
  getDayGroupLabel,
  getTodayDate,
} from "../utils/financeFormat";
import "../styles/finanzas.css";
import "../styles/finance-ui.css";

const emptyForm = { concept: "", categoryId: "", amount: "", expense_date: "", notes: "" };
const emptySummary = { income: 0, expenses: 0, balance: 0 };
const recurrenceFrequencies = [
  ["daily", "Diaria"],
  ["weekly", "Semanal"],
  ["monthly", "Mensual"],
  ["yearly", "Anual"],
];

// Los montos son pesos enteros; coincide con el máximo que se permite registrar.
const MAX_AMOUNT = 99999999;
// Al pegar solo se aceptan cifras simples ("1500000") o con puntos de miles bien puestos ("1.500.000").
const PASTED_AMOUNT_PATTERN = /^(\d+|\d{1,3}(\.\d{3})+)$/;
const AMOUNT_FORMAT_ERROR = "El valor debe ser un número entero de pesos, sin comas ni decimales.";

// "1.500.000" → 1500000. El signo no viene del campo: lo pone el selector Gasto / Ingreso.
function parseCopAmount(value) {
  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : NaN;
}

function formatCopInput(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return formatAmountDigits(String(Math.round(Math.abs(amount))));
}

// Búsqueda por concepto sin distinguir mayúsculas ni tildes.
function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Agrupa por día (más reciente primero). Dentro del día, el registrado más tarde va arriba.
function groupByDay(items) {
  const sorted = [...items].sort((a, b) => (
    String(b.expenseDate).slice(0, 10).localeCompare(String(a.expenseDate).slice(0, 10)) || b.id - a.id
  ));
  const groups = [];
  for (const item of sorted) {
    const day = String(item.expenseDate).slice(0, 10);
    const current = groups[groups.length - 1];
    if (current?.day === day) current.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

// "Oct 2026", en Bogotá. Solo informativo: el resumen siempre es del mes actual.
function getCurrentMonthLabel() {
  const label = new Intl.DateTimeFormat("es-CO", {
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(new Date()).replace(".", "").replace(" de ", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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

const quickActionIcons = {
  income: <path d="M12 5v14M5 12h14" />,
  expense: <path d="M5 12h14" />,
  recurring: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  categories: (
    <>
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <path d="M7 7h.01" />
    </>
  ),
};

function StrokeIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function Expenses() {
  // allExpenses siempre trae todos los movimientos (tipo, búsqueda y "Pagada [fecha]" salen de ahí);
  // categoryExpenses es la respuesta de la API cuando hay una categoría elegida en los chips.
  const [allExpenses, setAllExpenses] = useState([]);
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [recurrenceReminders, setRecurrenceReminders] = useState([]);
  const [recurrences, setRecurrences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetTarget, setSheetTarget] = useState(null);
  const [recurrencesViewOpen, setRecurrencesViewOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastIdRef = useRef(0);
  const searchInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  // Error del formulario del modal; los mensajes de la página van al toast.
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingExpenseCategory, setEditingExpenseCategory] = useState(null);
  const [amountTouched, setAmountTouched] = useState(false);
  const [originalEditingAmount, setOriginalEditingAmount] = useState(null);
  const [movementType, setMovementType] = useState("expense");
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  // Recurrente en edición: el modal cambia a modo "Editar recurrente" (sin fecha ni frecuencia).
  const [editingRecurrence, setEditingRecurrence] = useState(null);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("monthly");
  const [balanceHidden, setBalanceHidden] = useState(readHideBalance);

  function showToast(message, type = "success") {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message, type });
  }
  // Estable entre renders: el temporizador del toast no se reinicia al recargar la página.
  const clearToast = useCallback(() => setToast(null), []);

  async function loadPage(filter = categoryFilter) {
    try {
      const [data, filtered, monthlySummary, availableCategories, reminders, recurringPayments] = await Promise.all([
        expensesService.getAll(),
        filter ? expensesService.getAll(filter) : Promise.resolve([]),
        expensesService.getMonthlySummary(),
        categoriesService.getAll(),
        expensesService.getRecurrenceReminders(),
        expensesService.getRecurrences(),
      ]);
      setAllExpenses(data);
      setCategoryExpenses(filtered);
      setRecurrenceReminders(reminders);
      setRecurrences(recurringPayments);
      setSummary(monthlySummary);
      setCategories(availableCategories);
    } catch (err) {
      showToast(err.response?.data?.message || "No se pudieron cargar las finanzas", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  async function loadExpenses(filter = categoryFilter) {
    if (!filter) {
      setCategoryExpenses([]);
      return;
    }
    try {
      setCategoryExpenses(await expensesService.getAll(filter));
    } catch (err) {
      setCategoryExpenses([]);
      showToast(err.response?.data?.message || "No se pudieron filtrar los movimientos", "error");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  // type: "expense" | "income". recurring marca la casilla "repetir"; como solo se muestra
  // con categorías recurrentes, en ese caso se preselecciona la primera que lo permita.
  function openCreateModal({ type = "expense", recurring = false } = {}) {
    const defaultCategory = recurring
      ? categories.find((category) => category.isRecurring && category.isActive !== false)
      : categories[0];
    setEditingId(null);
    setEditingRecurrence(null);
    setEditingExpenseCategory(null);
    setError("");
    setRecurrenceEnabled(recurring && Boolean(defaultCategory));
    setRecurrenceFrequency("monthly");
    setForm({
      ...emptyForm,
      categoryId: defaultCategory ? String(defaultCategory.id) : "",
    });
    setAmountTouched(false);
    setOriginalEditingAmount(null);
    setMovementType(type);
    setModalOpen(true);
  }

  // Los cambios aplican a lo que aún no se registra; los movimientos pasados no se tocan.
  function openEditRecurrenceModal(recurrence) {
    setEditingId(null);
    setEditingRecurrence(recurrence);
    setEditingExpenseCategory(recurrence.category);
    setError("");
    setRecurrenceEnabled(false);
    setForm({
      concept: recurrence.concept,
      categoryId: String(recurrence.categoryId),
      amount: formatCopInput(recurrence.amount),
      expense_date: "",
      notes: recurrence.notes || "",
    });
    setAmountTouched(false);
    setOriginalEditingAmount(Number(recurrence.amount));
    setMovementType(Number(recurrence.amount) > 0 ? "income" : "expense");
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);
    setEditingRecurrence(null);
    setEditingExpenseCategory(item.category);
    setError("");
    setRecurrenceEnabled(false);
    setForm({
      concept: item.concept,
      categoryId: String(item.categoryId),
      amount: formatCopInput(item.amount),
      expense_date: item.expenseDate ? item.expenseDate.slice(0, 10) : "",
      notes: item.notes || "",
    });
    setAmountTouched(false);
    setOriginalEditingAmount(Number(item.amount));
    setMovementType(Number(item.amount) > 0 ? "income" : "expense");
    setModalOpen(true);
  }

  function handleAmountChange(event) {
    // Los puntos son los separadores de miles que pone el propio campo; cualquier otro carácter se rechaza.
    if (/[^\d.]/.test(event.target.value)) {
      setError(AMOUNT_FORMAT_ERROR);
      return;
    }
    const digits = event.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setForm((prev) => ({ ...prev, amount: formatAmountDigits(digits) }));
    setAmountTouched(true);
    setError("");
  }

  // Bloquea coma, punto y signos desde el teclado: sin esto, "1500,50" terminaría siendo 150050.
  function handleAmountKeyDown(event) {
    if ([",", ".", "-", "+", "e", "E"].includes(event.key)) {
      event.preventDefault();
      setError(AMOUNT_FORMAT_ERROR);
    }
  }

  // Un texto pegado como "1.500,50" o "1500.50" se rechaza en lugar de convertirse en 150050.
  function handleAmountPaste(event) {
    const pasted = event.clipboardData.getData("text").trim().replace(/^\$\s*/, "");
    if (!PASTED_AMOUNT_PATTERN.test(pasted)) {
      event.preventDefault();
      setError(AMOUNT_FORMAT_ERROR);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.categoryId) {
      setError("Selecciona una categoría para el movimiento.");
      return;
    }

    // El valor del campo siempre es positivo; el selector decide si se guarda como gasto (-) o ingreso (+).
    const absoluteAmount = (editingId || editingRecurrence) && !amountTouched
      ? Math.abs(originalEditingAmount)
      : parseCopAmount(form.amount);
    if (!Number.isFinite(absoluteAmount) || absoluteAmount === 0) {
      setError("Escribe un valor mayor que cero.");
      return;
    }

    if (absoluteAmount > MAX_AMOUNT) {
      setError("El valor no puede superar $ 99.999.999.");
      return;
    }

    const amount = movementType === "expense" ? -absoluteAmount : absoluteAmount;

    const payload = {
      concept: form.concept,
      categoryId: Number(form.categoryId),
      amount,
      expense_date: form.expense_date || undefined,
      notes: form.notes || null,
    };

    try {
      if (editingRecurrence) {
        await expensesService.updateRecurrence(editingRecurrence.recurrenceId, {
          concept: form.concept,
          categoryId: Number(form.categoryId),
          amount,
          notes: form.notes || null,
        });
        showToast("Recurrente actualizado. Los pagos ya registrados no cambian.");
      } else if (recurrenceEnabled && !editingId) {
        const startDate = form.expense_date || getTodayDate();
        await expensesService.createRecurrence({
          concept: form.concept,
          categoryId: Number(form.categoryId),
          amount,
          frequency: recurrenceFrequency,
          startDate,
          notes: form.notes || null,
        });
        showToast("Recurrente creado. Aparecerá para confirmar 2 días antes de su fecha.");
      } else if (editingId) {
        await expensesService.update(editingId, payload);
      } else {
        await expensesService.create(payload);
      }

      setModalOpen(false);
      setError("");
      await loadPage();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar el movimiento");
    }
  }

  // Devuelve true si se confirmó, para que la hoja se cierre solo en ese caso.
  async function confirmRecurrenceReminder(reminder, paidDate) {
    try {
      await expensesService.confirmRecurrenceOccurrence(reminder.occurrenceId, paidDate);
      showToast(`${Number(reminder.amount) > 0 ? "Ingreso recibido" : "Pago registrado"} en Movimientos.`);
      await loadPage();
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || "No se pudo confirmar el recordatorio", "error");
      return false;
    }
  }

  async function cancelRecurrence(recurrence, scope) {
    const confirmationMessage = scope === "future"
      ? `¿Detener las próximas fechas de "${recurrence.concept}"? Los movimientos históricos y los recordatorios vencidos se conservarán.`
      : `¿Eliminar todos los recordatorios de "${recurrence.concept}"? Los movimientos históricos ya registrados se conservarán.`;
    if (!window.confirm(confirmationMessage)) return false;

    try {
      await expensesService.cancelRecurrence(recurrence.recurrenceId, scope);
      showToast(scope === "future" ? "Se detuvieron las próximas fechas." : "Recurrente eliminado.");
      await loadPage();
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || "No se pudo eliminar la recurrencia", "error");
      return false;
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.")) return;
    try {
      await expensesService.remove(id);
      showToast("Movimiento eliminado.");
      await loadPage();
    } catch (err) {
      showToast(err.response?.data?.message || "No se pudo eliminar el movimiento", "error");
    }
  }

  async function handleDuplicate(expense) {
    try {
      await expensesService.create({
        concept: `${expense.concept.slice(0, 92)} (copia)`,
        categoryId: expense.categoryId,
        amount: Number(expense.amount),
        expense_date: expense.expenseDate ? expense.expenseDate.slice(0, 10) : undefined,
        notes: expense.notes || null,
      });
      setSelectedExpense(null);
      await loadPage();
    } catch {
      showToast("No se pudo duplicar el movimiento", "error");
    }
  }

  async function handleDeleteSelectedExpense() {
    if (!selectedExpense) return;
    const id = selectedExpense.id;
    setSelectedExpense(null);
    await handleDelete(id);
  }

  function openCategoryManager() {
    setCategoryManagerOpen(true);
  }

  function toggleBalanceHidden() {
    setBalanceHidden((hidden) => {
      saveHideBalance(!hidden);
      return !hidden;
    });
  }

  // Fecha del último movimiento registrado por cada recurrente ("Pagada 28 oct" en la vista Recurrentes).
  const lastPaidByRecurrence = useMemo(() => {
    const lastPaid = new Map();
    for (const expense of allExpenses) {
      if (!expense.recurrenceId) continue;
      const date = String(expense.expenseDate).slice(0, 10);
      if (!lastPaid.has(expense.recurrenceId) || date > lastPaid.get(expense.recurrenceId)) {
        lastPaid.set(expense.recurrenceId, date);
      }
    }
    return lastPaid;
  }, [allExpenses]);

  // Categoría: respuesta de la API (null mientras carga). Tipo y búsqueda: en el navegador.
  const filteredExpenses = useMemo(() => {
    const source = categoryFilter ? categoryExpenses : allExpenses;
    if (!source) return null;
    const query = normalizeText(searchQuery.trim());
    return source.filter((item) => {
      const amount = Number(item.amount);
      if (typeFilter === "income" && amount <= 0) return false;
      if (typeFilter === "expense" && amount >= 0) return false;
      return !query || normalizeText(item.concept).includes(query);
    });
  }, [allExpenses, categoryExpenses, categoryFilter, typeFilter, searchQuery]);

  const activeCategories = categories.filter((category) => category.isActive !== false);
  const isFiltering = typeFilter !== "all" || Boolean(categoryFilter) || Boolean(searchQuery.trim());

  function selectTypeFilter(type) {
    setTypeFilter(type);
    setCategoryFilter("");
    setCategoryExpenses([]);
  }

  function selectCategoryFilter(categoryId) {
    const value = String(categoryId);
    setTypeFilter("all");
    setCategoryFilter(value);
    setCategoryExpenses(null);
    loadExpenses(value);
  }

  function resetMovementFilters() {
    selectTypeFilter("all");
    setSearchQuery("");
  }

  function toggleSearch() {
    if (searchOpen) {
      setSearchOpen(false);
      setSearchQuery("");
      return;
    }
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function openReminderSheet(reminder) {
    setSheetTarget({
      reminder,
      recurrence: recurrences.find((recurrence) => recurrence.recurrenceId === reminder.recurrenceId) || null,
    });
  }

  // El modal vive debajo de la hoja y de la vista Recurrentes: se cierran antes de abrirlo.
  function editRecurrenceFromSheet(recurrence) {
    setSheetTarget(null);
    setRecurrencesViewOpen(false);
    openEditRecurrenceModal(recurrence);
  }

  function createRecurrenceFromView() {
    setRecurrencesViewOpen(false);
    openCreateModal({ type: "expense", recurring: true });
  }

  const hiddenAmount = "$ •••••";
  const quickActions = [
    { id: "income", label: "Ingreso", onClick: () => openCreateModal({ type: "income" }) },
    { id: "expense", label: "Gasto", onClick: () => openCreateModal({ type: "expense" }) },
    { id: "recurring", label: "Recurrente", onClick: () => openCreateModal({ type: "expense", recurring: true }) },
    { id: "categories", label: "Categorías", onClick: openCategoryManager },
  ];

  if (loading) return <p>Cargando finanzas...</p>;

  return (
    <div className="finance-page">
      <header className="finance-heading">
        <div>
          <h1>Finanzas</h1>
          <p>Tu dinero, de un vistazo</p>
        </div>
        <span className="finance-month-pill">{getCurrentMonthLabel()}</span>
      </header>

      <section className="balance-card" aria-label="Resumen del mes">
        <div className="balance-card-top">
          <span className="balance-card-label">Disponible este mes</span>
          <button
            type="button"
            className="balance-card-eye"
            onClick={toggleBalanceHidden}
            aria-label={balanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
            aria-pressed={balanceHidden}
          >
            <StrokeIcon>
              {balanceHidden ? (
                <>
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <path d="M2 2l20 20" />
                </>
              ) : (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </StrokeIcon>
          </button>
        </div>
        <p className="balance-card-amount">
          {balanceHidden ? hiddenAmount : formatCurrency(summary.balance)}
        </p>
        <div className="balance-card-grid">
          <div className="balance-mini income">
            <span className="balance-mini-label">
              <StrokeIcon><path d="M12 19V5M5 12l7-7 7 7" /></StrokeIcon>
              Ingresos
            </span>
            <strong>{balanceHidden ? hiddenAmount : formatCurrency(summary.income)}</strong>
          </div>
          <div className="balance-mini expense">
            <span className="balance-mini-label">
              <StrokeIcon><path d="M12 5v14M19 12l-7 7-7-7" /></StrokeIcon>
              Gastos
            </span>
            <strong>{balanceHidden ? hiddenAmount : formatCurrency(summary.expenses)}</strong>
          </div>
        </div>
      </section>

      <nav className="finance-quick-actions" aria-label="Accesos rápidos">
        {quickActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`finance-quick-action ${action.id}`}
            onClick={action.onClick}
          >
            <span className="finance-quick-action-icon">
              <StrokeIcon>{quickActionIcons[action.id]}</StrokeIcon>
            </span>
            {action.label}
          </button>
        ))}
      </nav>

      <FinancePendingCarousel
        reminders={recurrenceReminders}
        hasRecurrences={recurrences.length > 0}
        onOpen={openReminderSheet}
        onViewAll={() => setRecurrencesViewOpen(true)}
      />

      <section className="finance-movements" aria-labelledby="finance-movements-title">
        <header className="finance-section-header">
          <h2 id="finance-movements-title">Movimientos</h2>
          <button
            type="button"
            className="finance-icon-button"
            onClick={toggleSearch}
            aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar movimientos"}
            aria-expanded={searchOpen}
            aria-controls="finance-search"
          >
            <StrokeIcon>
              {searchOpen ? <path d="M18 6 6 18M6 6l12 12" /> : (
                <>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </>
              )}
            </StrokeIcon>
          </button>
        </header>

        {searchOpen && (
          <input
            id="finance-search"
            ref={searchInputRef}
            type="search"
            className="finance-search"
            placeholder="Buscar por concepto"
            aria-label="Buscar movimientos por concepto"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") toggleSearch();
            }}
          />
        )}

        <div className="finance-chips" role="group" aria-label="Filtrar movimientos">
          {[
            ["all", "Todos"],
            ["income", "Ingresos"],
            ["expense", "Gastos"],
          ].map(([value, label]) => {
            const active = !categoryFilter && typeFilter === value;
            return (
              <button
                key={value}
                type="button"
                className={`finance-chip ${active ? "active" : ""}`}
                aria-pressed={active}
                onClick={() => selectTypeFilter(value)}
              >
                <span>{label}</span>
              </button>
            );
          })}
          {activeCategories.map((category) => {
            const active = categoryFilter === String(category.id);
            return (
              <button
                key={category.id}
                type="button"
                className={`finance-chip ${active ? "active" : ""}`}
                aria-pressed={active}
                onClick={() => selectCategoryFilter(category.id)}
              >
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {filteredExpenses === null ? (
          <p className="finance-empty">Cargando movimientos...</p>
        ) : filteredExpenses.length === 0 ? (
          <div className="finance-empty">
            {isFiltering ? (
              <>
                <p>No hay movimientos con este filtro.</p>
                <button type="button" className="finance-link-button" onClick={resetMovementFilters}>
                  Ver todos los movimientos
                </button>
              </>
            ) : (
              <p>Aún no tienes movimientos. Registra el primero con Ingreso o Gasto.</p>
            )}
          </div>
        ) : (
          <div className="finance-day-groups">
            {groupByDay(filteredExpenses).map((group) => (
              <section className="finance-day-group" key={group.day} aria-label={getDayGroupLabel(group.day)}>
                <h3 className="finance-day-label">{getDayGroupLabel(group.day)}</h3>
                <ul className="finance-card-list">
                  {group.items.map((item) => {
                    const isIncome = Number(item.amount) > 0;
                    return (
                      <li key={item.id}>
                        <button type="button" className="finance-row" onClick={() => setSelectedExpense(item)}>
                          <CategoryIconBadge
                            category={item.category}
                            size={20}
                            className="finance-row-icon"
                          />
                          <span className="finance-row-copy">
                            <span className="finance-row-title">{item.concept}</span>
                            <span className="finance-row-meta">{item.category?.name}</span>
                          </span>
                          <span className={`finance-row-amount ${isIncome ? "income" : ""}`}>
                            {formatSignedAmount(item.amount)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <MobileItemDetails
        item={selectedExpense}
        title={selectedExpense?.concept || ""}
        details={selectedExpense ? [
          { label: "Categoría", value: selectedExpense.category?.name },
          { label: "Tipo", value: Number(selectedExpense.amount) > 0 ? "Ingreso" : "Gasto" },
          { label: "Valor", value: formatSignedAmount(selectedExpense.amount) },
          { label: "Fecha", value: selectedExpense.expenseDate?.slice(0, 10) },
          ...(selectedExpense.scheduledDate ? [{ label: "Fecha programada", value: selectedExpense.scheduledDate.slice(0, 10) }] : []),
          { label: "Notas", value: selectedExpense.notes },
        ] : []}
        onClose={() => setSelectedExpense(null)}
        onDuplicate={() => handleDuplicate(selectedExpense)}
        onEdit={() => {
          const expense = selectedExpense;
          setSelectedExpense(null);
          if (expense) openEditModal(expense);
        }}
        onDelete={handleDeleteSelectedExpense}
      />

      {recurrencesViewOpen && (
        <FinanceRecurrencesView
          recurrences={recurrences}
          reminders={recurrenceReminders}
          lastPaidByRecurrence={lastPaidByRecurrence}
          suspended={Boolean(sheetTarget)}
          onClose={() => setRecurrencesViewOpen(false)}
          onSelect={setSheetTarget}
          onCreate={createRecurrenceFromView}
        />
      )}

      {sheetTarget && (
        <FinanceConfirmSheet
          key={sheetTarget.reminder?.occurrenceId ?? `recurrence-${sheetTarget.recurrence?.recurrenceId}`}
          recurrence={sheetTarget.recurrence}
          reminder={sheetTarget.reminder}
          lastPaidDate={lastPaidByRecurrence.get((sheetTarget.reminder || sheetTarget.recurrence).recurrenceId)}
          onClose={() => setSheetTarget(null)}
          onConfirm={confirmRecurrenceReminder}
          onCancel={cancelRecurrence}
          onEdit={sheetTarget.recurrence ? () => editRecurrenceFromSheet(sheetTarget.recurrence) : null}
        />
      )}

      <FinanceToast toast={toast} onDone={clearToast} />

      <div
        className={`modal-overlay ${modalOpen ? "open" : ""}`}
        onClick={() => setModalOpen(false)}
      />
      <div className={`modal ${modalOpen ? "open" : ""}`}>
        <div className="modal-header">
          <h3>{editingRecurrence ? "Editar recurrente" : editingId ? "Editar movimiento" : "Nuevo movimiento"}</h3>
          <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="modal-form-error" role="alert">{error}</p>}
          <div className="field-group">
            <label>Concepto</label>
            <input name="concept" value={form.concept} onChange={handleChange} maxLength={100} required />
          </div>
          <div className="field-group">
            <label>Categoría</label>
            <CategorySelect
              categories={editingRecurrence ? categories.filter((category) => category.isRecurring) : categories}
              value={form.categoryId}
              onChange={(categoryId) => {
                const selectedCategory = categories.find((category) => String(category.id) === categoryId);
                setForm((previous) => ({ ...previous, categoryId }));
                if (!selectedCategory?.isRecurring) {
                  setRecurrenceEnabled(false);
                }
              }}
              inactiveCategory={editingExpenseCategory}
              onCreateCategory={openCategoryManager}
            />
          </div>
          <div className="field-group">
            <span className="movement-type-label" id="movement-type-label">Tipo de movimiento</span>
            <div className="movement-type-toggle" role="group" aria-labelledby="movement-type-label">
              <button
                type="button"
                className={`movement-type-option expense ${movementType === "expense" ? "active" : ""}`}
                aria-pressed={movementType === "expense"}
                onClick={() => { setMovementType("expense"); setError(""); }}
              >
                Gasto
              </button>
              <button
                type="button"
                className={`movement-type-option income ${movementType === "income" ? "active" : ""}`}
                aria-pressed={movementType === "income"}
                onClick={() => { setMovementType("income"); setError(""); }}
              >
                Ingreso
              </button>
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="expense-amount">Valor (COP)</label>
            <input
              id="expense-amount"
              type="text"
              inputMode="numeric"
              name="amount"
              value={form.amount}
              onChange={handleAmountChange}
              onKeyDown={handleAmountKeyDown}
              onPaste={handleAmountPaste}
              placeholder="0"
              autoComplete="off"
              required
            />
            <span className="field-hint">Pesos enteros, sin decimales. Máximo 99.999.999.</span>
          </div>
          {editingRecurrence ? (
            <p className="recurrence-edit-info">
              {frequencyLabels[editingRecurrence.frequency] || editingRecurrence.frequency}
              {editingRecurrence.isActive && ` · próxima ${formatDayMonth(editingRecurrence.nextScheduledDate)}`}
              <span>Los cambios aplican desde el próximo pago; lo ya registrado no cambia.</span>
            </p>
          ) : (
            <DateCalendar
              key={`${modalOpen}-${form.expense_date || "empty"}`}
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              label="Fecha"
              onClear={() => handleChange({ target: { name: "expense_date", value: "" } })}
            />
          )}
          {!editingId && !editingRecurrence && categories.find((category) => String(category.id) === form.categoryId)?.isRecurring && (
            <div className="recurrence-form-section">
              <label className="recurrence-enable-option">
                <input
                  type="checkbox"
                  checked={recurrenceEnabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setRecurrenceEnabled(enabled);
                    if (enabled && !form.expense_date) {
                      setForm((previous) => ({ ...previous, expense_date: getTodayDate() }));
                    }
                  }}
                />
                <span>Programar como pago o ingreso fijo</span>
              </label>
              {recurrenceEnabled && (
                <div className="field-group recurrence-frequency-field">
                  <label htmlFor="expense-recurrence-frequency">Frecuencia del recordatorio</label>
                  <select
                    id="expense-recurrence-frequency"
                    value={recurrenceFrequency}
                    onChange={(event) => setRecurrenceFrequency(event.target.value)}
                  >
                    {recurrenceFrequencies.map(([frequency, label]) => (
                      <option value={frequency} key={frequency}>{label}</option>
                    ))}
                  </select>
                  <span className="field-hint">
                    La primera fecha será la fecha indicada arriba. El movimiento se crea solo al confirmarlo.
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="field-group">
            <label>Notas</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} maxLength={2000} />
          </div>

          <button type="submit" className="btn-guardar">
            {editingId || editingRecurrence ? "Guardar cambios" : "Guardar movimiento"}
          </button>
        </form>
      </div>

      {categoryManagerOpen && (
        <CategoryManager
          module="finance"
          categories={categories}
          onClose={() => setCategoryManagerOpen(false)}
          onChanged={async () => {
            if (categoryFilter) {
              setCategoryFilter("");
              await loadPage("");
            } else {
              await loadPage();
            }
          }}
        />
      )}
    </div>
  );
}

export default Expenses;
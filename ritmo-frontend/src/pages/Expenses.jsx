import { useState, useEffect } from "react";
import expensesService from "../services/expenses.service";
import categoriesService from "../services/categories.service";
import CategoryIconBadge from "../components/CategoryIconBadge";
import CategorySelect from "../components/CategorySelect";
import CategoryManager from "../components/CategoryManager";
import FinanceRecurrenceReminders from "../components/FinanceRecurrenceReminders";
import MobileItemDetails from "../components/MobileItemDetails";
import DateCalendar from "../components/DateCalendar";
import "../styles/finanzas.css";

const emptyForm = { concept: "", categoryId: "", amount: "", expense_date: "", notes: "" };
const emptySummary = { income: 0, expenses: 0, balance: 0 };
const recurrenceFrequencies = [
  ["daily", "Diaria"],
  ["weekly", "Semanal"],
  ["monthly", "Mensual"],
  ["yearly", "Anual"],
];

function getTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

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

// "1500000" → "1.500.000". Se agrupa a mano porque Intl en español no agrupa los números de 4 cifras.
function formatAmountDigits(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCopInput(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return formatAmountDigits(String(Math.round(Math.abs(amount))));
}

function formatCurrency(value) {
  const amount = Number(value);
  const formatted = Math.abs(amount).toLocaleString("es-CO", {
    minimumFractionDigits: Number.isInteger(Math.abs(amount)) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-$" : "$"}${formatted}`;
}

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [recurrenceReminders, setRecurrenceReminders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingExpenseCategory, setEditingExpenseCategory] = useState(null);
  const [amountTouched, setAmountTouched] = useState(false);
  const [originalEditingAmount, setOriginalEditingAmount] = useState(null);
  const [movementType, setMovementType] = useState("expense");
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("monthly");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage(filter = categoryFilter) {
    try {
      const [data, monthlySummary, availableCategories, reminders] = await Promise.all([
        expensesService.getAll(filter || undefined),
        expensesService.getMonthlySummary(),
        categoriesService.getAll(),
        expensesService.getRecurrenceReminders(),
      ]);
      setExpenses(data);
      setRecurrenceReminders(reminders);
      setSummary(monthlySummary);
      setCategories(availableCategories);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar las finanzas");
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses(filter = categoryFilter) {
    try {
      setExpenses(await expensesService.getAll(filter || undefined));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron filtrar los movimientos");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  }

  function openCreateModal() {
    setEditingId(null);
    setEditingExpenseCategory(null);
    setError("");
    setSuccess("");
    setRecurrenceEnabled(false);
    setRecurrenceFrequency("monthly");
    setForm({
      ...emptyForm,
      categoryId: categories[0] ? String(categories[0].id) : "",
    });
    setAmountTouched(false);
    setOriginalEditingAmount(null);
    setMovementType("expense");
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);
    setEditingExpenseCategory(item.category);
    setError("");
    setSuccess("");
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
    setSuccess("");
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
    const absoluteAmount = editingId && !amountTouched
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
      if (recurrenceEnabled && !editingId) {
        const startDate = form.expense_date || getTodayDate();
        await expensesService.createRecurrence({
          concept: form.concept,
          categoryId: Number(form.categoryId),
          amount,
          frequency: recurrenceFrequency,
          startDate,
          notes: form.notes || null,
        });
        setSuccess("Recordatorio recurrente creado. El movimiento se registrará cuando confirmes el pago o ingreso.");
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

  async function confirmRecurrenceReminder(reminder, paidDate) {
    try {
      await expensesService.confirmRecurrenceOccurrence(reminder.occurrenceId, paidDate);
      setSuccess(`${Number(reminder.amount) > 0 ? "Ingreso recibido" : "Pago realizado"} y agregado a movimientos.`);
      await loadPage();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo confirmar el recordatorio");
    }
  }

  async function cancelRecurrenceReminder(reminder, scope) {
    const confirmationMessage = scope === "future"
      ? `¿Detener las próximas fechas de "${reminder.concept}"? Los movimientos históricos y los recordatorios vencidos se conservarán.`
      : `¿Eliminar todos los recordatorios de "${reminder.concept}"? Los movimientos históricos ya registrados se conservarán.`;
    if (!window.confirm(confirmationMessage)) return;

    try {
      await expensesService.cancelRecurrence(reminder.recurrenceId, scope);
      setSuccess(scope === "future"
        ? "Se detuvieron las próximas fechas. Los recordatorios vencidos siguen disponibles."
        : "Se eliminó la recurrencia y se conservaron los movimientos históricos.");
      await loadPage();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar la recurrencia");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.")) return;
    try {
      await expensesService.remove(id);
      await loadPage();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar el movimiento");
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
      setError("No se pudo duplicar el movimiento");
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

  if (loading) return <p>Cargando finanzas...</p>;

  return (
    <div>
      <header className="finance-heading">
        <h1>Finanzas</h1>
        <p>Controla tus ingresos y gastos sin esfuerzo</p>
      </header>

      <div className="summary-card">
        <p className="balance-label">Balance del mes</p>
        <p className={`balance-amount ${summary.balance < 0 ? "balance-negative" : "balance-positive"}`}>
          {formatCurrency(summary.balance)}
        </p>
        <div className="summary-row">
          <div className="summary-pill ingreso">
            <span className="lbl">Ingresos</span>
            <span className="val">{formatCurrency(summary.income)}</span>
          </div>
          <div className="summary-pill gasto">
            <span className="lbl">Gastos</span>
            <span className="val">{formatCurrency(summary.expenses)}</span>
          </div>
        </div>
      </div>

      <div className="finance-list-tools">
        <label className="finance-category-filter">
          <span>Filtrar por categoría</span>
          <CategorySelect
            categories={categories}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              loadExpenses(value);
            }}
            includeAllLabel="Todas las categorías"
            className="category-filter-select"
            onCreateCategory={openCategoryManager}
          />
        </label>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}
      {success && <p className="finance-success" role="status">{success}</p>}

      <FinanceRecurrenceReminders
        reminders={recurrenceReminders}
        onConfirm={confirmRecurrenceReminder}
        onCancel={cancelRecurrenceReminder}
      />

      <div className="proximos-header finance-movements-header" style={{ marginTop: "16px" }}>
        <span>Movimientos</span>
      </div>

      <div className="tx-list">
        {expenses.length === 0 && (
          <p className="tx-empty">
            Aún no tienes movimientos. Registra el primero con el botón +.
          </p>
        )}

        {expenses.map((item) => (
          <div className="tx-item" key={item.id}>
            <CategoryIconBadge
              category={item.category}
              size={22}
              className="tx-icon"
            />
            <div className="tx-info">
              <h4>{item.concept}</h4>
              <p>
                {item.category?.name} · {item.expenseDate?.slice(0, 10)}
                {item.scheduledDate ? ` · Programado: ${item.scheduledDate.slice(0, 10)}` : ""}
                {" · "}{Number(item.amount) > 0 ? "Ingreso" : "Gasto"}
              </p>
            </div>
            <span className={`tx-amount ${Number(item.amount) < 0 ? "neg" : "pos"}`}>
              {Number(item.amount) > 0 ? "+" : ""}{formatCurrency(item.amount)}
            </span>
            <div className="tx-actions">
              <button className="tx-edit" onClick={() => openEditModal(item)} aria-label={`Editar ${item.concept}`}>✎</button>
              <button className="tx-delete" onClick={() => handleDelete(item.id)} aria-label={`Eliminar ${item.concept}`}>🗑</button>
            </div>
            <button
              type="button"
              className="mobile-row-open"
              onClick={() => setSelectedExpense(item)}
              aria-label={`Ver opciones de ${item.concept}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <MobileItemDetails
        item={selectedExpense}
        title={selectedExpense?.concept || ""}
        details={selectedExpense ? [
          { label: "Categoría", value: selectedExpense.category?.name },
          { label: "Tipo", value: Number(selectedExpense.amount) > 0 ? "Ingreso" : "Gasto" },
          { label: "Valor", value: `${Number(selectedExpense.amount) > 0 ? "+" : ""}${formatCurrency(selectedExpense.amount)}` },
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

      {!modalOpen && !categoryManagerOpen && (
        <button
          type="button"
          className="fab"
          onClick={openCreateModal}
          aria-label="Agregar movimiento"
          title="Agregar movimiento"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      <div
        className={`modal-overlay ${modalOpen ? "open" : ""}`}
        onClick={() => setModalOpen(false)}
      />
      <div className={`modal ${modalOpen ? "open" : ""}`}>
        <div className="modal-header">
          <h3>{editingId ? "Editar movimiento" : "Nuevo movimiento"}</h3>
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
              categories={categories}
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
          <DateCalendar
            key={`${modalOpen}-${form.expense_date || "empty"}`}
            name="expense_date"
            value={form.expense_date}
            onChange={handleChange}
            label="Fecha"
            onClear={() => handleChange({ target: { name: "expense_date", value: "" } })}
          />
          {!editingId && categories.find((category) => String(category.id) === form.categoryId)?.isRecurring && (
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
            {editingId ? "Guardar cambios" : "Guardar movimiento"}
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
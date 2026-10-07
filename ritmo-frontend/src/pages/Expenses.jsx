import { useState, useEffect } from "react";
import expensesService from "../services/expenses.service";
import MobileItemDetails from "../components/MobileItemDetails";
import DateCalendar from "../components/DateCalendar";
import "../styles/finanzas.css";

const emptyForm = { concept: "", category: "", amount: "", expense_date: "", notes: "" };
const emptySummary = { income: 0, expenses: 0, balance: 0 };

function parseCopAmount(value) {
  const text = String(value).trim();
  const isNegative = text.startsWith("-");
  const digits = text.replace(/\D/g, "");
  if (!digits) return NaN;
  const amount = Number(digits);
  return isNegative ? -amount : amount;
}

function formatCopInput(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  const formatted = Math.round(Math.abs(amount)).toLocaleString("es-CO", {
    maximumFractionDigits: 0,
  });
  return `${amount < 0 ? "-$ " : "$ "}${formatted}`;
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
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [amountTouched, setAmountTouched] = useState(false);
  const [originalEditingAmount, setOriginalEditingAmount] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const [data, monthlySummary] = await Promise.all([
        expensesService.getAll(),
        expensesService.getMonthlySummary(),
      ]);
      setExpenses(data);
      setSummary(monthlySummary);
    } catch (err) {
      setError("No se pudieron cargar las finanzas");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setAmountTouched(false);
    setOriginalEditingAmount(null);
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);
    setForm({
      concept: item.concept,
      category: item.category,
      amount: formatCopInput(item.amount),
      expense_date: item.expenseDate ? item.expenseDate.slice(0, 10) : "",
      notes: item.notes || "",
    });
    setAmountTouched(false);
    setOriginalEditingAmount(Number(item.amount));
    setModalOpen(true);
  }

  function handleAmountChange(event) {
    const { value } = event.target;
    const isNegative = value.startsWith("-");
    const digits = value.replace(/\D/g, "");
    setForm((prev) => ({
      ...prev,
      amount: digits ? `${isNegative ? "-" : ""}${digits}` : isNegative ? "-" : "",
    }));
    setAmountTouched(true);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const amount = editingId && !amountTouched
      ? originalEditingAmount
      : parseCopAmount(form.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      setError("El valor debe ser distinto de cero. Usa un valor positivo para ingresos o negativo para gastos.");
      return;
    }

    const payload = {
      concept: form.concept,
      category: form.category,
      amount,
      expense_date: form.expense_date || undefined,
      notes: form.notes || null,
    };

    try {
      if (editingId) {
        await expensesService.update(editingId, payload);
      } else {
        await expensesService.create(payload);
      }

      setModalOpen(false);
      setError("");
      await loadExpenses();
    } catch (err) {
      setError("No se pudo guardar el movimiento");
    }
  }

  async function handleDelete(id) {
    try {
      await expensesService.remove(id);
      loadExpenses();
    } catch (err) {
      setError("No se pudo eliminar el movimiento");
    }
  }

  async function handleDuplicate(expense) {
    try {
      await expensesService.create({
        concept: `${expense.concept.slice(0, 92)} (copia)`,
        category: expense.category,
        amount: Number(expense.amount),
        expense_date: expense.expenseDate ? expense.expenseDate.slice(0, 10) : undefined,
        notes: expense.notes || null,
      });
      setSelectedExpense(null);
      await loadExpenses();
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

      <div className="proximos-header" style={{ marginTop: "16px" }}>
        <span>Movimientos</span>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}

      <div className="tx-list">
        {expenses.length === 0 && (
          <p className="tx-empty">
            Aún no tienes movimientos. Registra el primero con el botón +.
          </p>
        )}

        {expenses.map((item) => (
          <div className="tx-item" key={item.id}>
            <div className="tx-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div className="tx-info">
              <h4>{item.concept}</h4>
              <p>{item.category} · {item.expenseDate?.slice(0, 10)} · {Number(item.amount) > 0 ? "Ingreso" : "Gasto"}</p>
            </div>
            <span className={`tx-amount ${Number(item.amount) < 0 ? "neg" : "pos"}`}>
              {Number(item.amount) > 0 ? "+" : ""}{formatCurrency(item.amount)}
            </span>
            <div className="tx-actions">
              <button className="tx-edit" onClick={() => openEditModal(item)}>✎</button>
              <button className="tx-delete" onClick={() => handleDelete(item.id)}>🗑</button>
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
          { label: "Categoría", value: selectedExpense.category },
          { label: "Tipo", value: Number(selectedExpense.amount) > 0 ? "Ingreso" : "Gasto" },
          { label: "Valor", value: `${Number(selectedExpense.amount) > 0 ? "+" : ""}${formatCurrency(selectedExpense.amount)}` },
          { label: "Fecha", value: selectedExpense.expenseDate?.slice(0, 10) },
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

      {!modalOpen && (
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

      <div className={`modal-overlay ${modalOpen ? "open" : ""}`} onClick={() => setModalOpen(false)} />
      <div className={`modal ${modalOpen ? "open" : ""}`}>
        <div className="modal-header">
          <h3>{editingId ? "Editar movimiento" : "Nuevo movimiento"}</h3>
          <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="modal-form-error" role="alert">{error}</p>}
          <div className="field-group">
            <label>Concepto</label>
            <input name="concept" value={form.concept} onChange={handleChange} required />
          </div>
          <div className="field-group">
            <label>Categoría</label>
            <input name="category" value={form.category} onChange={handleChange} required />
          </div>
          <div className="field-group">
            <label>Valor (COP)</label>
            <input
              type="text"
              inputMode="text"
              name="amount"
              value={form.amount}
              onChange={handleAmountChange}
              onFocus={() => {
                if (form.amount) {
                  const amount = parseCopAmount(form.amount);
                  setForm((prev) => ({ ...prev, amount: Number.isFinite(amount) ? String(amount) : "" }));
                }
              }}
              onBlur={() => {
                const amount = parseCopAmount(form.amount);
                if (Number.isFinite(amount) && amount !== 0) {
                  setForm((prev) => ({ ...prev, amount: formatCopInput(amount) }));
                }
              }}
              placeholder="$ 0"
              autoComplete="off"
              required
            />
            <span className="field-hint">COP sin decimales. Positivo para ingresos; negativo para gastos.</span>
          </div>
          <DateCalendar
            key={`${modalOpen}-${form.expense_date || "empty"}`}
            name="expense_date"
            value={form.expense_date}
            onChange={handleChange}
            label="Fecha"
            onClear={() => handleChange({ target: { name: "expense_date", value: "" } })}
          />
          <div className="field-group">
            <label>Notas</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </div>

          <button type="submit" className="btn-guardar">
            {editingId ? "Guardar cambios" : "Guardar movimiento"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Expenses;
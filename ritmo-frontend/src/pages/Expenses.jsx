import { useState, useEffect } from "react";
import expensesService from "../services/expenses.service";
import "../styles/finanzas.css";

const emptyForm = { concept: "", category: "", amount: "", expense_date: "", notes: "" };

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const data = await expensesService.getAll();
      setExpenses(data);
    } catch (err) {
      setError("No se pudieron cargar los gastos");
    } finally {
      setLoading(false);
    }
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);
    setForm({
      concept: item.concept,
      category: item.category,
      amount: item.amount,
      expense_date: item.expenseDate ? item.expenseDate.slice(0, 10) : "",
      notes: item.notes || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      concept: form.concept,
      category: form.category,
      amount: Number(form.amount),
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
      loadExpenses();
    } catch (err) {
      setError("No se pudo guardar el gasto");
    }
  }

  async function handleDelete(id) {
    try {
      await expensesService.remove(id);
      loadExpenses();
    } catch (err) {
      setError("No se pudo eliminar el gasto");
    }
  }

  if (loading) return <p>Cargando gastos...</p>;

  return (
    <div>
      <div className="summary-card">
        <p className="balance-label">Total gastado</p>
        <p className="balance-amount">${total.toLocaleString("es-CO")}</p>
        <div className="summary-row">
          <div className="summary-pill gasto">
            <span className="lbl">Registros</span>
            <span className="val">{expenses.length}</span>
          </div>
        </div>
      </div>

      <div className="proximos-header" style={{ marginTop: "16px" }}>
        <span>Mis gastos</span>
        <button className="ver-link" onClick={openCreateModal}>+ Nuevo</button>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}

      <div className="tx-list">
        {expenses.length === 0 && <p className="tx-empty">Aún no tienes gastos registrados</p>}

        {expenses.map((item) => (
          <div className="tx-item" key={item.id}>
            <div className="tx-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div className="tx-info">
              <h4>{item.concept}</h4>
              <p>{item.category} · {item.expenseDate?.slice(0, 10)}</p>
            </div>
            <span className="tx-amount neg">-${Number(item.amount).toLocaleString("es-CO")}</span>
            <div className="tx-actions">
              <button className="tx-edit" onClick={() => openEditModal(item)}>✎</button>
              <button className="tx-delete" onClick={() => handleDelete(item.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      <div className={`modal-overlay ${modalOpen ? "open" : ""}`} onClick={() => setModalOpen(false)} />
      <div className={`modal ${modalOpen ? "open" : ""}`}>
        <div className="modal-header">
          <h3>{editingId ? "Editar gasto" : "Nuevo gasto"}</h3>
          <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Concepto</label>
            <input name="concept" value={form.concept} onChange={handleChange} required />
          </div>
          <div className="field-group">
            <label>Categoría</label>
            <input name="category" value={form.category} onChange={handleChange} required />
          </div>
          <div className="field-group">
            <label>Monto</label>
            <input type="number" step="0.01" name="amount" value={form.amount} onChange={handleChange} required />
          </div>
          <div className="field-group">
            <label>Fecha</label>
            <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange} />
          </div>
          <div className="field-group">
            <label>Notas</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </div>

          <button type="submit" className="btn-guardar">Guardar</button>
        </form>
      </div>
    </div>
  );
}

export default Expenses;
import { useState, useEffect } from "react";
import expensesService from "../services/expenses.service";

const emptyForm = {
  concept: "",
  category: "",
  amount: "",
  expense_date: "",
  notes: "",
};

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

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

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

      setForm(emptyForm);
      setEditingId(null);
      loadExpenses();
    } catch (err) {
      setError("No se pudo guardar el gasto");
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      concept: item.concept,
      category: item.category,
      amount: item.amount,
      expense_date: item.expenseDate ? item.expenseDate.slice(0, 10) : "",
      notes: item.notes || "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    try {
      await expensesService.remove(id);
      loadExpenses();
    } catch (err) {
      setError("No se pudo eliminar el gasto");
    }
  }

  if (loading) {
    return <p>Cargando gastos...</p>;
  }

  return (
    <div>
      <h1>Mis gastos</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="concept"
          placeholder="Concepto"
          value={form.concept}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Categoría"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="Monto"
          value={form.amount}
          onChange={handleChange}
          required
        />
        <input
          name="expense_date"
          type="date"
          value={form.expense_date}
          onChange={handleChange}
        />
        <textarea
          name="notes"
          placeholder="Notas (opcional)"
          value={form.notes}
          onChange={handleChange}
        />

        <button type="submit">{editingId ? "Guardar cambios" : "Registrar gasto"}</button>
        {editingId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      <ul>
        {expenses.map((item) => (
          <li key={item.id}>
            <strong>{item.concept}</strong> — {item.category} — ${item.amount}
            {" — "}
            {item.expenseDate?.slice(0, 10)}

            <button onClick={() => handleEdit(item)}>Editar</button>
            <button onClick={() => handleDelete(item.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Expenses;
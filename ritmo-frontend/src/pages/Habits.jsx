import { useState, useEffect } from "react";
import habitsService from "../services/habits.service";
import "../styles/tareas.css";

const emptyForm = { name: "", frequency: "", goal: "" };

function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    try {
      const data = await habitsService.getAll();
      setHabits(data);
    } catch (err) {
      setError("No se pudieron cargar los hábitos");
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
      name: form.name,
      frequency: form.frequency,
      goal: form.goal ? Number(form.goal) : null,
    };

    try {
      if (editingId) {
        await habitsService.update(editingId, payload);
      } else {
        await habitsService.create(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadHabits();
    } catch (err) {
      setError("No se pudo guardar el hábito");
    }
  }

  function handleEdit(habit) {
    setEditingId(habit.id);
    setForm({ name: habit.name, frequency: habit.frequency, goal: habit.goal || "" });
    setShowForm(true);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function toggleDone(habit) {
    const isDone = habit.status === "completado";
    try {
      await habitsService.changeStatus(habit.id, isDone ? "pendiente" : "completado");
      loadHabits();
    } catch (err) {
      setError("No se pudo cambiar el estado");
    }
  }

  async function handleDelete(id) {
    try {
      await habitsService.remove(id);
      loadHabits();
    } catch (err) {
      setError("No se pudo eliminar el hábito");
    }
  }

  if (loading) return <p>Cargando hábitos...</p>;

  return (
    <div>
      <div className="proximos-header">
        <span>Mis hábitos</span>
        <button className="ver-link" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}

      {showForm && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nombre del hábito</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Frecuencia</label>
              <input name="frequency" value={form.frequency} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Meta (opcional)</label>
              <input type="number" name="goal" value={form.goal} onChange={handleChange} />
            </div>

            <button type="submit" className="btn-guardar">
              {editingId ? "Guardar cambios" : "Crear hábito"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                Cancelar edición
              </button>
            )}
          </form>
        </div>
      )}

      <div className="task-list">
        {habits.map((habit) => {
          const isDone = habit.status === "completado";
          return (
            <div className={`task-item ${isDone ? "done" : ""}`} key={habit.id}>
              <div className="task-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div className="task-info">
                <h4>{habit.name}</h4>
                <p>{habit.frequency}{habit.goal && ` · meta: ${habit.goal}`}</p>
              </div>

              <button
                className={`task-check ${isDone ? "done" : ""}`}
                onClick={() => toggleDone(habit)}
                aria-label="Marcar como completado"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              <button className="tx-edit" onClick={() => handleEdit(habit)} aria-label="Editar">✎</button>
              <button className="tx-delete" onClick={() => handleDelete(habit.id)} aria-label="Eliminar">🗑</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Habits;
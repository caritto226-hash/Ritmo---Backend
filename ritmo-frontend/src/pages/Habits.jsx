import { useState, useEffect } from "react";
import habitsService from "../services/habits.service";
import MobileItemDetails from "../components/MobileItemDetails";
import "../styles/tareas.css";

const emptyForm = { name: "", frequency: "", goal: "" };

function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    try {
      const data = await habitsService.getAll();
      setHabits(data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Tu sesión expiró o no es válida. Cierra sesión e inicia sesión de nuevo.");
      } else if (!err.response) {
        setError("No se pudo conectar con el servidor. Comprueba que el backend esté activo.");
      } else {
        setError(
          err.response.data?.message ||
            `No se pudieron cargar los hábitos (HTTP ${err.response.status})`,
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
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

  async function handleDuplicate(habit) {
    try {
      await habitsService.create({
        name: `${habit.name.slice(0, 142)} (copia)`,
        frequency: habit.frequency,
        goal: habit.goal ?? null,
      });
      setSelectedHabit(null);
      await loadHabits();
    } catch {
      setError("No se pudo duplicar el hábito");
    }
  }

  async function handleDeleteSelectedHabit() {
    if (!selectedHabit) return;
    const id = selectedHabit.id;
    setSelectedHabit(null);
    await handleDelete(id);
  }

  if (loading) return <p>Cargando hábitos...</p>;

  return (
    <div>
      <div className="proximos-header">
        <span>Mis hábitos</span>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}

      {showForm && (
        <>
          <div className="modal-overlay open" onClick={handleCancelEdit} />
          <div className="modal open" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Editar hábito" : "Nuevo hábito"}</h3>
              <button type="button" className="modal-close" onClick={handleCancelEdit} aria-label="Cerrar formulario">
                ✕
              </button>
            </div>
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
        </>
      )}

      <div className="task-list">
        {habits.length === 0 && (
          <p className="task-empty">
            Aún no tienes hábitos. Registra el primero con el botón +.
          </p>
        )}
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
              <button
                type="button"
                className="mobile-row-open"
                onClick={() => setSelectedHabit(habit)}
                aria-label={`Ver opciones de ${habit.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <MobileItemDetails
        item={selectedHabit}
        title={selectedHabit?.name || ""}
        details={selectedHabit ? [
          { label: "Frecuencia", value: selectedHabit.frequency },
          { label: "Meta", value: selectedHabit.goal },
          { label: "Estado", value: selectedHabit.status },
        ] : []}
        onClose={() => setSelectedHabit(null)}
        onDuplicate={() => handleDuplicate(selectedHabit)}
        onEdit={() => {
          const habit = selectedHabit;
          setSelectedHabit(null);
          if (habit) handleEdit(habit);
        }}
        onDelete={handleDeleteSelectedHabit}
      />

      {!showForm && (
        <button
          type="button"
          className="fab"
          onClick={openCreateForm}
          aria-label="Agregar hábito"
          title="Agregar hábito"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Habits;
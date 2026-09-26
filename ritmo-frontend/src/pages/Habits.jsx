import { useState, useEffect } from "react";
import habitsService from "../services/habits.service";

const emptyForm = { name: "", frequency: "", goal: "" };

function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

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
      loadHabits();
    } catch (err) {
      setError("No se pudo guardar el hábito");
    }
  }

  function handleEdit(habit) {
    setEditingId(habit.id);
    setForm({
      name: habit.name,
      frequency: habit.frequency,
      goal: habit.goal || "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleStatusChange(habitId, newStatus) {
    try {
      await habitsService.changeStatus(habitId, newStatus);
      loadHabits();
    } catch (err) {
      setError("No se pudo cambiar el estado");
    }
  }

  async function handleDelete(habitId) {
    try {
      await habitsService.remove(habitId);
      loadHabits();
    } catch (err) {
      setError("No se pudo eliminar el hábito");
    }
  }

  if (loading) {
    return <p>Cargando hábitos...</p>;
  }

  return (
    <div>
      <h1>Mis hábitos</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Nombre del hábito"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="frequency"
          placeholder="Frecuencia (ej. diario)"
          value={form.frequency}
          onChange={handleChange}
          required
        />
        <input
          name="goal"
          type="number"
          placeholder="Meta (opcional)"
          value={form.goal}
          onChange={handleChange}
        />

        <button type="submit">{editingId ? "Guardar cambios" : "Crear hábito"}</button>
        {editingId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            <strong>{habit.name}</strong> — {habit.frequency}
            {habit.goal && ` — meta: ${habit.goal}`} — {habit.status}

            <select
              value={habit.status}
              onChange={(e) => handleStatusChange(habit.id, e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="completado">Completado</option>
            </select>

            <button onClick={() => handleEdit(habit)}>Editar</button>
            <button onClick={() => handleDelete(habit.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Habits;
import { useState, useEffect } from "react";
import habitsService from "../services/habits.service";
import categoriesService from "../services/categories.service";
import MobileItemDetails from "../components/MobileItemDetails";
import CategoryIconBadge from "../components/CategoryIconBadge";
import CategorySelect from "../components/CategorySelect";
import CategoryManager from "../components/CategoryManager";
import "../styles/tareas.css";

const emptyForm = { name: "", frequency: "", goal: "", categoryId: "", reminderTime: "" };

function Habits() {
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    try {
      const [data, availableCategories] = await Promise.all([
        habitsService.getAll(),
        categoriesService.getAll("habits"),
      ]);
      setHabits(data);
      setCategories(availableCategories);
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
    setForm({
      ...emptyForm,
      categoryId: categories[0] ? String(categories[0].id) : "",
    });
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: form.name,
      frequency: form.frequency,
      goal: form.goal ? Number(form.goal) : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      reminderTime: form.reminderTime || null,
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
      setError(err.response?.data?.message || "No se pudo guardar el hábito");
    }
  }

  function handleEdit(habit) {
    setEditingId(habit.id);
    setForm({
      name: habit.name,
      frequency: habit.frequency,
      goal: habit.goal || "",
      categoryId: habit.categoryId ? String(habit.categoryId) : "",
      reminderTime: habit.reminderTime ? habit.reminderTime.slice(0, 5) : "",
    });
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
      setError(err.response?.data?.message || "No se pudo cambiar el estado");
    }
  }

  async function handleDelete(id) {
    try {
      await habitsService.remove(id);
      loadHabits();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar el hábito");
    }
  }

  async function handleDuplicate(habit) {
    try {
      await habitsService.create({
        name: `${habit.name.slice(0, 142)} (copia)`,
        frequency: habit.frequency,
        goal: habit.goal ?? null,
        categoryId: habit.categoryId ?? null,
      });
      setSelectedHabit(null);
      await loadHabits();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo duplicar el hábito");
    }
  }

  async function handleDeleteSelectedHabit() {
    if (!selectedHabit) return;
    const id = selectedHabit.id;
    setSelectedHabit(null);
    await handleDelete(id);
  }

  async function reloadCategories() {
    const data = await categoriesService.getAll("habits");
    setCategories(data);
    await loadHabits();
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
              <label>Categoría</label>
              <CategorySelect
                categories={categories}
                value={form.categoryId}
                inactiveCategory={editingId ? habits.find((habit) => habit.id === editingId)?.category : null}
                onChange={(categoryId) => setForm((previous) => ({
                  ...previous,
                  categoryId,
                  reminderTime: categories.find((category) => String(category.id) === categoryId)?.isRecurring
                    ? previous.reminderTime
                    : "",
                }))}
                onCreateCategory={() => setShowCategoryManager(true)}
              />
            </div>
            {(categories.find((category) => String(category.id) === form.categoryId)?.isRecurring
              || Boolean(form.reminderTime)) && (
              <div className="input-group">
                <label htmlFor="habit-reminder-time">Recordatorio adicional (opcional)</label>
                <input
                  id="habit-reminder-time"
                  type="time"
                  name="reminderTime"
                  value={form.reminderTime}
                  onChange={handleChange}
                />
              </div>
            )}
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
              <CategoryIconBadge
                category={habit.category}
                fallbackIcon="heart-pulse"
                size={21}
                className="task-icon category-colored-icon"
              />

              <div className="task-info">
                <h4>{habit.name}</h4>
                <p>
                  {habit.frequency}{habit.goal && ` · meta: ${habit.goal}`}
                  {habit.reminderTime && ` · recordatorio ${habit.reminderTime.slice(0, 5)}`}
                  {habit.category?.name && ` · ${habit.category.name}`}
                </p>
                {habit.category?.description && <p>{habit.category.description}</p>}
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
          { label: "Recordatorio adicional", value: selectedHabit.reminderTime?.slice(0, 5) || "Sin configurar" },
          { label: "Estado", value: selectedHabit.status },
          { label: "Categoría", value: selectedHabit.category?.name || "Sin categoría" },
          { label: "Propósito", value: selectedHabit.category?.description || "" },
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

      {showCategoryManager && (
        <CategoryManager
          module="habits"
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onChanged={reloadCategories}
        />
      )}
    </div>
  );
}

export default Habits;
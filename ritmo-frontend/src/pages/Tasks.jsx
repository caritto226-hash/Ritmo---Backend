import { useState, useEffect } from "react";
import tasksService from "../services/tasks.service";
import categoriesService from "../services/categories.service";
import MobileItemDetails from "../components/MobileItemDetails";
import DateCalendar from "../components/DateCalendar";
import CategoryIconBadge from "../components/CategoryIconBadge";
import CategorySelect from "../components/CategorySelect";
import CategoryManager from "../components/CategoryManager";
import "../styles/tareas.css";

const emptyForm = {
  title: "",
  description: "",
  categoryId: "",
  date: "",
  duration: "",
  priority: "media",
  recurrenceFrequency: "",
};
const recurrenceFrequencies = [
  ["daily", "Diaria"],
  ["weekly", "Semanal"],
  ["monthly", "Mensual"],
  ["yearly", "Anual"],
];

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const [data, availableCategories] = await Promise.all([
        tasksService.getAll(),
        categoriesService.getAll("tasks"),
      ]);
      setTasks(data);
      setCategories(availableCategories);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
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

    if (!form.date) {
      setError("Selecciona una fecha para la tarea");
      return;
    }

    try {
      if (editingId) {
        await tasksService.update(editingId, {
          title: form.title,
          description: form.description,
          due_date: form.date,
          priority: form.priority,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          recurrenceFrequency: form.recurrenceFrequency || null,
        });
      } else {
        await tasksService.create({
          title: form.title,
          description: form.description,
          date: form.date,
          duration: form.duration ? Number(form.duration) : undefined,
          priority: form.priority,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          recurrenceFrequency: form.recurrenceFrequency || null,
        });
      }

      setForm(emptyForm);
      setError("");
      setEditingId(null);
      setShowForm(false);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar la tarea");
    }
  }

  function handleEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      date: task.dueDate ? task.dueDate.slice(0, 10) : "",
      duration: task.duration || "",
      categoryId: task.categoryId ? String(task.categoryId) : "",
      priority: task.priority.toLowerCase(),
      recurrenceFrequency: task.recurrenceFrequency || "",
    });
    setShowForm(true);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function toggleDone(task) {
    const isDone = task.status.toLowerCase() === "completada";
    try {
      await tasksService.changeStatus(task.id, isDone ? "pendiente" : "completada");
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cambiar el estado");
    }
  }

  async function handleDelete(taskId) {
    try {
      await tasksService.remove(taskId);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar la tarea");
    }
  }

  async function handleDuplicate(task) {
    try {
      await tasksService.create({
        title: `${task.title.slice(0, 37)} (copia)`,
        description: task.description || "",
        date: task.dueDate ? task.dueDate.slice(0, 10) : "",
        duration: task.duration ? Number(task.duration) : undefined,
        priority: task.priority.toLowerCase(),
        categoryId: task.categoryId ?? null,
      });
      setSelectedTask(null);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo duplicar la tarea");
    }
  }

  async function handleDeleteSelectedTask() {
    if (!selectedTask) return;
    const id = selectedTask.id;
    setSelectedTask(null);
    await handleDelete(id);
  }

  async function reloadCategories() {
    const data = await categoriesService.getAll("tasks");
    setCategories(data);
    await loadTasks();
  }

  if (loading) return <p>Cargando tareas...</p>;

  return (
    <div>
      <div className="proximos-header">
        <span>Mis tareas</span>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}

      {showForm && (
        <>
          <div className="modal-overlay open" onClick={handleCancelEdit} />
          <div className="modal open" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Editar tarea" : "Nueva tarea"}</h3>
              <button type="button" className="modal-close" onClick={handleCancelEdit} aria-label="Cerrar formulario">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Título</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>
            {error && <p className="modal-form-error" role="alert">{error}</p>}
            <div className="input-group">
              <label>Descripción</label>
              <textarea
                className="ritmo-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Categoría</label>
              <CategorySelect
                categories={categories}
                value={form.categoryId}
                inactiveCategory={editingId ? tasks.find((task) => task.id === editingId)?.category : null}
                onChange={(categoryId) => setForm((previous) => ({
                  ...previous,
                  categoryId,
                  recurrenceFrequency: categories.find((category) => String(category.id) === categoryId)?.isRecurring
                    ? previous.recurrenceFrequency
                    : "",
                }))}
                onCreateCategory={() => setShowCategoryManager(true)}
              />
            </div>
            {(categories.find((category) => String(category.id) === form.categoryId)?.isRecurring
              || Boolean(form.recurrenceFrequency)) && (
              <div className="input-group">
                <label htmlFor="task-recurrence-frequency">Repetir tarea</label>
                <select
                  id="task-recurrence-frequency"
                  name="recurrenceFrequency"
                  value={form.recurrenceFrequency}
                  onChange={handleChange}
                >
                  <option value="">No repetir</option>
                  {recurrenceFrequencies.map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
            <DateCalendar
              name="date"
              value={form.date}
              onChange={handleChange}
              label="Fecha"
              required
            />
            {!editingId && (
              <div className="time-row">
                <div className="time-field">
                  <label>Duración (min)</label>
                  <input type="number" name="duration" value={form.duration} onChange={handleChange} />
                </div>
              </div>
            )}
            <div className="input-group">
              <label>Prioridad</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <button type="submit" className="btn-guardar">
              {editingId ? "Guardar cambios" : "Crear tarea"}
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
        {tasks.length === 0 && (
          <p className="task-empty">
            Aún no tienes tareas. Registra la primera con el botón +.
          </p>
        )}
        {tasks.map((task) => {
          const isDone = task.status.toLowerCase() === "completada";
          return (
            <div className={`task-item ${isDone ? "done" : ""}`} key={task.id}>
              <CategoryIconBadge
                category={task.category}
                fallbackIcon="list-checks"
                size={21}
                className="task-icon category-colored-icon"
              />

              <div className="task-info">
                <h4>{task.title}</h4>
                <p>
                  {task.dueDate?.slice(0, 10)} · {task.priority}
                  {task.status.toLowerCase() === "en proceso" && " · En proceso"}
                  {task.category?.name && ` · ${task.category.name}`}
                </p>
                {task.category?.description && <p>{task.category.description}</p>}
              </div>

              <button
                className={`task-check ${isDone ? "done" : ""}`}
                onClick={() => toggleDone(task)}
                aria-label="Marcar como completada"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              <button className="tx-edit" onClick={() => handleEdit(task)} aria-label="Editar">
                ✎
              </button>
              <button className="tx-delete" onClick={() => handleDelete(task.id)} aria-label="Eliminar">
                🗑
              </button>
              <button
                type="button"
                className="mobile-row-open"
                onClick={() => setSelectedTask(task)}
                aria-label={`Ver opciones de ${task.title}`}
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
        item={selectedTask}
        title={selectedTask?.title || ""}
        details={selectedTask ? [
          { label: "Descripción", value: selectedTask.description || "Sin descripción" },
          { label: "Fecha", value: selectedTask.dueDate?.slice(0, 10) },
          { label: "Prioridad", value: selectedTask.priority },
          { label: "Estado", value: selectedTask.status },
          { label: "Duración", value: selectedTask.duration ? `${selectedTask.duration} min` : "" },
          { label: "Categoría", value: selectedTask.category?.name || "Sin categoría" },
          { label: "Propósito", value: selectedTask.category?.description || "" },
        ] : []}
        onClose={() => setSelectedTask(null)}
        onDuplicate={() => handleDuplicate(selectedTask)}
        onEdit={() => {
          const task = selectedTask;
          setSelectedTask(null);
          if (task) handleEdit(task);
        }}
        onDelete={handleDeleteSelectedTask}
      />

      {!showForm && (
        <button
          type="button"
          className="fab"
          onClick={openCreateForm}
          aria-label="Agregar tarea"
          title="Agregar tarea"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {showCategoryManager && (
        <CategoryManager
          module="tasks"
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onChanged={reloadCategories}
        />
      )}
    </div>
  );
}

export default Tasks;
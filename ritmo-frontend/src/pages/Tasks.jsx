import { useState, useEffect } from "react";
import tasksService from "../services/tasks.service";
import MobileItemDetails from "../components/MobileItemDetails";
import "../styles/tareas.css";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  duration: "",
  priority: "media",
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const data = await tasksService.getAll();
      setTasks(data);
    } catch (err) {
      setError("No se pudieron cargar las tareas");
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

    try {
      if (editingId) {
        await tasksService.update(editingId, {
          title: form.title,
          description: form.description,
          due_date: form.date,
          priority: form.priority,
        });
      } else {
        await tasksService.create({
          title: form.title,
          description: form.description,
          date: form.date,
          duration: form.duration ? Number(form.duration) : undefined,
          priority: form.priority,
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadTasks();
    } catch (err) {
      setError("No se pudo guardar la tarea");
    }
  }

  function handleEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      date: task.dueDate ? task.dueDate.slice(0, 10) : "",
      duration: task.duration || "",
      priority: task.priority.toLowerCase(),
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
      setError("No se pudo cambiar el estado");
    }
  }

  async function handleDelete(taskId) {
    try {
      await tasksService.remove(taskId);
      loadTasks();
    } catch (err) {
      setError("No se pudo eliminar la tarea");
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
      });
      setSelectedTask(null);
      await loadTasks();
    } catch {
      setError("No se pudo duplicar la tarea");
    }
  }

  async function handleDeleteSelectedTask() {
    if (!selectedTask) return;
    const id = selectedTask.id;
    setSelectedTask(null);
    await handleDelete(id);
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
            <div className="time-row">
              <div className="time-field">
                <label>Fecha</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              {!editingId && (
                <div className="time-field">
                  <label>Duración (min)</label>
                  <input type="number" name="duration" value={form.duration} onChange={handleChange} />
                </div>
              )}
            </div>
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
              <div className="task-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="3" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="13" y2="14" />
                </svg>
              </div>

              <div className="task-info">
                <h4>{task.title}</h4>
                <p>
                  {task.dueDate?.slice(0, 10)} · {task.priority}
                  {task.status.toLowerCase() === "en proceso" && " · En proceso"}
                </p>
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
    </div>
  );
}

export default Tasks;